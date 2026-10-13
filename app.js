'use strict';
const CITIES={tabarjal:{name:'طبرجل',lat:30.5,lon:38.216},sakaka:{name:'سكاكا',lat:29.97,lon:40.2},qurayyat:{name:'القريات',lat:31.33,lon:37.34},dumat:{name:'دومة الجندل',lat:29.81,lon:39.87},arar:{name:'عرعر',lat:30.98,lon:41.04},turaif:{name:'طريف',lat:31.67,lon:38.66},hail:{name:'حائل',lat:27.52,lon:41.69},tabuk:{name:'تبوك',lat:28.40,lon:36.57},riyadh:{name:'الرياض',lat:24.71,lon:46.67},jeddah:{name:'جدة',lat:21.54,lon:39.17}};
const $=id=>document.getElementById(id), TZ='Asia/Riyadh';
const FORECAST_MODELS=Object.freeze({best_match:'أفضل تطابق تلقائي',ecmwf_ifs:'ECMWF IFS HRES 9 كم',icon_global:'ICON Global',ncep_gfs_global:'NOAA GFS Global'});
let forecastModel='best_match',comparisonData=null,comparisonKey='',comparisonFetchedAt=0,comparisonBusy=false,compareController=null,compareRequestId=0;
let locationNow={...CITIES.tabarjal},weather=null,air=null,map=null,marker=null,accuracyCircle=null,radarLayer=null,frames=[],frameIndex=0,radarTimer=null,chart=null,watchId=null,requestController=null,requestSeq=0;
const val=(n,d=0)=>Number.isFinite(Number(n))&&n!==null?Number(n).toFixed(d):'--';
const hour=s=>s?String(s).slice(11,16):'--';
// Escape values before interpolation into HTML templates.
const escapeHTML=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const localClock=t=>new Intl.DateTimeFormat('ar-SA',{timeZone:TZ,hour:'2-digit',minute:'2-digit',hour12:false}).format(new Date(t));
const weatherName=(code,night=false)=>({0:['سماء صافية',night?'🌙':'☀️'],1:['صافٍ غالبًا','🌤️'],2:['غائم جزئيًا','⛅'],3:['غائم','☁️'],45:['ضباب','🌫️'],48:['ضباب متجمد','🌫️'],51:['رذاذ خفيف','🌦️'],53:['رذاذ متوسط','🌦️'],55:['رذاذ كثيف','🌧️'],61:['مطر خفيف','🌧️'],63:['مطر متوسط','🌧️'],65:['مطر غزير','🌧️'],71:['ثلوج خفيفة','❄️'],73:['ثلوج','❄️'],75:['ثلوج كثيفة','❄️'],80:['زخات خفيفة','🌦️'],81:['زخات مطرية','🌧️'],82:['زخات غزيرة','🌧️'],95:['عواصف رعدية','⛈️'],96:['عواصف رعدية مع برد','⛈️'],99:['عواصف رعدية مع برد','⛈️']})[code]||['حالة جوية متغيرة','🌤️'];
// Aurora 3.1: weather data provenance, hardening and failure-state management.
const responseMeta=new WeakMap();
let shownWeatherKey='',lastGoodWeatherAt=0,weatherFetchResult='unavailable';
const weatherKey=(lat,lon)=>`${Number(lat).toFixed(4)},${Number(lon).toFixed(4)}`;
const saudiTimestamp=text=>{
 if(typeof text!=='string'||!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(text))return NaN;
 return Date.parse(text.slice(0,16)+':00+03:00');
};
function notice(message){$('toast').textContent=message;$('toast').classList.remove('hidden');clearTimeout(notice.t);notice.t=setTimeout(()=>$('toast').classList.add('hidden'),7500)}
function status(s){$('status').textContent=s}
function buildUrl(base,params){return base+'?'+new URLSearchParams(params)}
async function getJson(url,signal){
 const controller=new AbortController();
 const forwardAbort=()=>controller.abort();
 if(signal?.aborted)controller.abort();
 else signal?.addEventListener('abort',forwardAbort,{once:true});
 const timeout=setTimeout(()=>controller.abort(),15000);
 try{
  const response=await fetch(url,{signal:controller.signal,cache:'no-store'});
  if(!response.ok)throw Error('HTTP '+response.status);
  const data=await response.json();
  if(!data||typeof data!=='object'||Array.isArray(data))throw Error('Invalid JSON data');
  responseMeta.set(data,{
   fromCache:response.headers.get('X-Tabarjal-Cache')==='fallback',
   cachedAt:Number(response.headers.get('X-Tabarjal-Cached-At'))||0,
   retrievedAt:Date.now()
  });
  return data;
 }finally{clearTimeout(timeout);signal?.removeEventListener('abort',forwardAbort)}
}
function weatherUrl(lat,lon,model=forecastModel){return buildUrl('https://api.open-meteo.com/v1/forecast',{latitude:lat,longitude:lon,timezone:TZ,forecast_days:model==='icon_global'?7:14,...(model==='best_match'?{}:{models:model}),current:'temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,rain,weather_code,cloud_cover,pressure_msl,wind_speed_10m,wind_direction_10m,wind_gusts_10m',hourly:'temperature_2m,relative_humidity_2m,precipitation_probability,precipitation,wind_speed_10m,visibility,dew_point_2m,uv_index',daily:'weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max,sunrise,sunset,uv_index_max'})}
function airUrl(lat,lon){return buildUrl('https://air-quality-api.open-meteo.com/v1/air-quality',{latitude:lat,longitude:lon,timezone:TZ,current:'us_aqi,pm2_5,pm10,dust,nitrogen_dioxide'})}
function modelUrl(lat,lon,model){return buildUrl('https://api.open-meteo.com/v1/forecast',{latitude:lat,longitude:lon,timezone:TZ,forecast_days:3,models:model,daily:'temperature_2m_max,temperature_2m_min,precipitation_sum,wind_gusts_10m_max'})}
function validateWeather(data){
 if(!data?.current||!data?.hourly||!data?.daily)throw Error('Weather response lacks major sections');
 if(!Number.isFinite(Number(data.current.temperature_2m))||!Number.isFinite(saudiTimestamp(data.current.time)))throw Error('Weather current reading invalid');
 const required={hourly:['time','temperature_2m','precipitation_probability','precipitation','wind_speed_10m'],daily:['time','weather_code','temperature_2m_max','temperature_2m_min','precipitation_sum']};
 for(const [section,fields] of Object.entries(required)){
  const count=data[section]?.time?.length;
  if(!Number.isInteger(count)||count===0)throw Error(section+' missing forecast timestamps');
  for(const field of fields)if(!Array.isArray(data[section][field])||data[section][field].length!==count)throw Error(section+'.'+field+' missing/uneven');
 }
 return data;
}
function setDataHealth(kind,text){
 const el=$('weatherHealth');if(!el)return;
 el.dataset.state=kind;el.textContent=text;
}
function resetWeatherDisplay(){
 weather=null;
 for(const id of ['temp','feels','humidity','wind','direction','pressure','cloud','rain','dew','visibility','uv','sun','heroHighLow','heroRainChance','heroSunrise','insightTrend','insightRain','insightOutdoors']){
  if($(id))$(id).textContent='--';
 }
 $('condition').textContent='بانتظار بيانات الطقس';
 $('summary').textContent='لا تتوفر توقعات محدثة لهذا الموقع. تحقق من الاتصال وأعد المحاولة.';
 $('symbol').textContent='🌤️';
 $('updated').textContent='لم تصل بيانات مصدر صالحة لهذا الموقع';
 $('dataSource').textContent='المصدر المتوقع: Open-Meteo · توقعات نموذجية وليست رصدًا محليًا';
 $('hazard').textContent='لا يمكن حساب المؤشرات دون بيانات الطقس.';
 $('hours').replaceChildren();$('days').replaceChildren();
 $('answer').textContent='لا تتوفر بيانات توقعات لهذا الموقع بعد.';
 if(chart){chart.destroy();chart=null}
 if($('activityGrid'))$('activityGrid').textContent='بانتظار بيانات الطقس...';
 for(const id of ['insightTrendDetail','insightRainDetail','insightOutdoorsDetail'])if($(id))$(id).textContent='بانتظار التحديث';
 setDataHealth('loading','لم يتم تحميل توقعات لهذا الموقع بعد');
}
function markWeatherSuccess(data,modelUsed=forecastModel){
 const meta=responseMeta.get(data)||{retrievedAt:Date.now(),fromCache:false,cachedAt:0};
 lastGoodWeatherAt=meta.fromCache?(meta.cachedAt||meta.retrievedAt):meta.retrievedAt;
 const sourceAt=saudiTimestamp(data.current.time);
 const hoursOld=Number.isFinite(sourceAt)?(Date.now()-sourceAt)/3600000:Infinity;
 const aged=hoursOld>3;
 weatherFetchResult=meta.fromCache?'cached':aged?'aged':'fresh';
 let label='توقعات '+FORECAST_MODELS[modelUsed]+' عبر Open-Meteo · آخر اتصال ناجح: '+localClock(lastGoodWeatherAt)+' (السعودية)';
 if(meta.fromCache){label+=' · نسخة مؤقتة محفوظة (قديمة)';setDataHealth('warning','⚠️ الاتصال غير متاح: هذه بيانات محفوظة وليست تحديثًا مباشرًا');}
 else if(aged){label+=' · وقت النموذج قديم';setDataHealth('warning','⚠️ بيانات النموذج متأخرة؛ راجع وقت المصدر');}
 else{setDataHealth('ok','✓ تم استلام توقعات نموذجية جديدة من المصدر');}
 $('dataSource').textContent=label+' · بيانات تنبؤية وليست رصد محطة محلية';
 $('updated').textContent='الوقت الصالح للتوقع: '+data.current.time.replace('T',' ')+' (السعودية) · آخر جلب: '+localClock(lastGoodWeatherAt);
 status(meta.fromCache?'تم عرض بيانات محفوظة عند تعذر الاتصال · ليست قراءة جديدة':aged?'تم التحديث، لكن وقت بيانات النموذج متأخر':'تم تحميل التوقعات بنجاح · '+localClock(lastGoodWeatherAt));
}
async function load(lat=locationNow.lat,lon=locationNow.lon){
 const seq=++requestSeq;
 requestController?.abort();requestController=new AbortController();
 const signal=requestController.signal;
 const currentKey=weatherKey(lat,lon)+'|'+forecastModel,samePlace=shownWeatherKey===currentKey&&!!weather;
 if(comparisonKey!==weatherKey(lat,lon))clearModelComparison();
 if(!samePlace){resetWeatherDisplay();shownWeatherKey=''}
 status('جارٍ جلب التوقعات الجديدة...');
 setDataHealth('loading',samePlace?'جارٍ التحديث · المعروض هو آخر بيانات ناجحة':'جارٍ الاتصال بمصدر التوقعات...');
 $('place').textContent=locationNow.name+'، السعودية';
 const urls=[weatherUrl(lat,lon),airUrl(lat,lon)];
 const results=await Promise.allSettled(urls.map(u=>getJson(u,signal)));
 if(seq!==requestSeq)return;
 let ok=false,candidate=null,modelUsed=forecastModel;
 if(results[0].status==='fulfilled'){
  try{candidate=validateWeather(results[0].value)}catch(error){console.warn('Invalid weather response:',error)}
 }
 // If a manually chosen model lacks a required parameter, use best match transparently.
 if(!candidate&&forecastModel!=='best_match'){
  try{candidate=validateWeather(await getJson(weatherUrl(lat,lon,'best_match'),signal));modelUsed='best_match'}
  catch(error){console.warn('Best-match forecast fallback unavailable:',error)}
 }
 if(seq!==requestSeq)return;
 if(candidate){
  try{
   renderWeather(candidate);weather=candidate;shownWeatherKey=currentKey;
   markWeatherSuccess(candidate,modelUsed);
   if(modelUsed!==forecastModel){
    setDataHealth('warning','⚠️ النموذج المختار غير متاح حاليًا. عُرض بديل «أفضل تطابق» بوضوح.');
    $('dataSource').textContent+=' · بديل تلقائي بعد فشل النموذج المحدد';
   }
   ok=true;
  }catch(error){console.warn('Weather render failed:',error)}
 }
 if(!ok){
  if(!samePlace)resetWeatherDisplay();
  weatherFetchResult='failed';
  const msg=samePlace?'⚠️ فشل التحديث؛ البيانات الظاهرة من آخر تحميل ناجح، وليست أحدث قراءة':'⚠️ تعذر الحصول على بيانات الطقس لهذا الموقع';
  setDataHealth('error',msg);
  status(samePlace?'تعذر التحديث · آخر جلب ناجح: '+localClock(lastGoodWeatherAt):'خدمة التوقعات غير متاحة؛ حاول مجددًا');
  if(samePlace){$('dataSource').textContent='توقعات سابقة من Open-Meteo · آخر اتصال ناجح: '+localClock(lastGoodWeatherAt)+' · تحديث جديد غير متاح';}
  notice(samePlace?'فشل التحديث؛ تأكد من تاريخ البيانات قبل الاعتماد عليها.':'تعذر تحميل توقعات هذا الموقع. حاول التحديث لاحقًا.');
 }
 if(results[1].status==='fulfilled'){
  try{if(!results[1].value?.current)throw Error('Air quality unavailable');air=results[1].value;renderAir(air)}
  catch(e){air=null;clearAirDisplay()}
 }else{air=null;clearAirDisplay()}
}

function clearAirDisplay(){
 for(const id of ['aqi','pm25','pm10','dust','no2'])$(id).textContent='--';
 $('aqText').textContent='بيانات جودة الهواء غير متاحة';
 $('airUpdated').textContent='تعذر الاتصال بمصدر جودة الهواء';
}
function renderWeather(data){const c=data.current,h=data.hourly,d=data.daily;if(!c||!h||!d)throw Error('Missing weather fields');$('temp').textContent=val(c.temperature_2m);$('feels').textContent=val(c.apparent_temperature);const [desc,icon]=weatherName(c.weather_code,c.is_day===0);$('condition').textContent=desc;$('symbol').textContent=icon;$('humidity').textContent=val(c.relative_humidity_2m)+'%';$('wind').textContent=val(c.wind_speed_10m)+' كم/س · هبات '+val(c.wind_gusts_10m);$('direction').textContent=val(c.wind_direction_10m)+'°';$('pressure').textContent=val(c.pressure_msl)+' hPa';$('cloud').textContent=val(c.cloud_cover)+'%';$('rain').textContent=val(c.precipitation,1)+' مم';const idx=h.time.findIndex(t=>t===c.time.slice(0,13)+':00');const i=idx<0?0:idx;$('dew').textContent=val(h.dew_point_2m?.[i],1)+'°C';$('visibility').textContent=val(h.visibility?.[i]/1000,1)+' كم';$('uv').textContent=val(h.uv_index?.[i],1);$('sun').textContent=hour(d.sunrise?.[0])+' / '+hour(d.sunset?.[0]);const next=h.precipitation_probability?.slice(i,i+24)||[];const max=Math.max(0,...next.filter(Number.isFinite));const rainSum=(h.precipitation?.slice(i,i+24)||[]).reduce((a,b)=>a+(Number(b)||0),0);$('summary').textContent=`${desc}. الحرارة ${val(c.temperature_2m)}°، الرياح ${val(c.wind_speed_10m)} كم/س، أعلى احتمال مطر خلال 24 ساعة ${val(max)}%، ومجموع الهطول المتوقع ${val(rainSum,1)} مم. هذه توقعات نموذجية وليست قياسًا محليًا مباشرًا.`;
const hazards=[];if(c.wind_gusts_10m>=60)hazards.push('هبات رياح قوية متوقعة');if(max>=70&&rainSum>=10)hazards.push('احتمال هطول ملحوظ خلال 24 ساعة');if(c.temperature_2m>=44)hazards.push('حرارة مرتفعة');if(c.temperature_2m<=2)hazards.push('برودة شديدة محتملة');$('hazard').textContent=hazards.length?hazards.join(' · ')+' — مؤشرات تحليلية غير رسمية.':'لا توجد مؤشرات مرتفعة ضمن قواعد التحليل المبسطة حاليًا؛ لا يعني ذلك انعدام الأخطار.';renderHours(h,i);renderDays(d);}
function renderHours(h,start){const len=Math.min(48,h.time.length-start);$('hours').replaceChildren(...Array.from({length:len},(_,j)=>{const i=start+j,el=document.createElement('div');el.className='hour-item';el.innerHTML=`<small>${escapeHTML(hour(h.time[i]))}</small><strong>${escapeHTML(val(h.temperature_2m[i]))}°</strong><small>🌧️ ${escapeHTML(val(h.precipitation_probability?.[i]))}%</small><br><small>💨 ${escapeHTML(val(h.wind_speed_10m?.[i]))}</small>`;return el}));if(typeof Chart==='undefined'){return}if(chart)chart.destroy();chart=new Chart($('hourChart'),{type:'line',data:{labels:h.time.slice(start,start+len).map(hour),datasets:[{label:'الحرارة °C',data:h.temperature_2m.slice(start,start+len),borderColor:'#38bdf8',backgroundColor:'#38bdf830',tension:.3,yAxisID:'y'},{label:'احتمال المطر %',data:h.precipitation_probability.slice(start,start+len),borderColor:'#22c55e',tension:.3,yAxisID:'y1'}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{labels:{color:'#9db5ca'}}},scales:{x:{ticks:{color:'#9db5ca',maxTicksLimit:12}},y:{ticks:{color:'#9db5ca'},title:{display:true,text:'°C'}},y1:{position:'left',min:0,max:100,grid:{drawOnChartArea:false},ticks:{color:'#22c55e'}}}}});}
function renderDays(d){$('days').replaceChildren(...d.time.map((date,i)=>{const el=document.createElement('div');el.className='day';const [desc,icon]=weatherName(d.weather_code[i]);el.innerHTML=`<b>${new Intl.DateTimeFormat('ar-SA',{weekday:'short',timeZone:TZ}).format(new Date(date+'T12:00:00+03:00'))}</b><small>${escapeHTML(date.slice(5))}</small><span style="font-size:29px">${escapeHTML(icon)}</span><strong>${escapeHTML(val(d.temperature_2m_max[i]))}° / ${escapeHTML(val(d.temperature_2m_min[i]))}°</strong><span>🌧️ ${escapeHTML(val(d.precipitation_probability_max?.[i]))}%</span><span>${escapeHTML(val(d.precipitation_sum[i],1))} مم</span>`;el.title=desc;return el}));}
function renderAir(data){const c=data.current||{};const a=c.us_aqi==null?NaN:Number(c.us_aqi);$('aqi').textContent=val(c.us_aqi);$('aqText').textContent=!Number.isFinite(a)?'غير متاح':a<=50?'جودة جيدة':a<=100?'متوسطة':a<=150?'غير صحية للفئات الحساسة':a<=200?'غير صحية':a<=300?'غير صحية جدًا':'خطرة';for(const [id,key] of [['pm25','pm2_5'],['pm10','pm10'],['dust','dust'],['no2','nitrogen_dioxide']])$(id).textContent=val(c[key],1)+' µg/m³';$('airUpdated').textContent='المصدر: Open-Meteo Air Quality · وقت النموذج: '+(c.time||'غير متاح');}
// Independent multi-model comparison: three global models, fetched on demand.
// Spread is model disagreement, NOT a calibrated confidence or accuracy score.
const COMPARE_MODELS=[{id:'ecmwf_ifs',name:'ECMWF IFS HRES',detail:'9 كم'},{id:'icon_global',name:'DWD ICON',detail:'عالمي'},{id:'ncep_gfs_global',name:'NOAA GFS',detail:'عالمي'}];
function clearModelComparison(){
 compareRequestId++;compareController?.abort();compareController=null;
 comparisonData=null;comparisonKey='';comparisonFetchedAt=0;comparisonBusy=false;
 $('modelRows').innerHTML='<tr><td colspan="5">اضغط «مقارنة النماذج الآن» لعرض بيانات هذا الموقع.</td></tr>';
 $('modelSummary').textContent='تظهر فروقات التوقعات عند طلب المقارنة. لا يوجد نموذج يضمن الدقة لكل حالة.';
 $('modelCompareStatus').textContent='لم تُطلب بيانات النماذج بعد';
 $('modelCompareBtn').disabled=false;
}
function verifiedDaily(data){
 const d=data?.daily;
 if(!d||!Array.isArray(d.time)||d.time.length<3||!['temperature_2m_max','temperature_2m_min','precipitation_sum'].every(k=>Array.isArray(d[k])&&d[k].length>=3))throw Error('Invalid model daily data');
 if(data.error)throw Error(String(data.reason||'Provider error'));
 return d;
}
async function loadModelComparison(){
 if(comparisonBusy)return;
 const {lat,lon}=locationNow,key=weatherKey(lat,lon);
 if(comparisonData&&comparisonKey===key&&Date.now()-comparisonFetchedAt<30*60*1000){renderModels();return}
 const seq=++compareRequestId;
 compareController?.abort();compareController=new AbortController();
 comparisonBusy=true;
 $('modelCompareBtn').disabled=true;
 $('modelRows').innerHTML='<tr><td colspan="5">جارٍ جلب النماذج الثلاثة...</td></tr>';
 $('modelCompareStatus').textContent='الاتصال بـ ECMWF وICON وGFS...';
 try{
  const res=await Promise.allSettled(COMPARE_MODELS.map(m=>getJson(modelUrl(lat,lon,m.id),compareController.signal)));
  if(seq!==compareRequestId||weatherKey(locationNow.lat,locationNow.lon)!==key)return;
  comparisonData=res.map((r,i)=>{
   try{if(r.status!=='fulfilled')throw r.reason;return {model:COMPARE_MODELS[i],daily:verifiedDaily(r.value)};}
   catch(error){return {model:COMPARE_MODELS[i],error:String(error?.message||'غير متاح')}};
  });
  comparisonKey=key;comparisonFetchedAt=Date.now();renderModels();
 }finally{
  if(seq===compareRequestId){comparisonBusy=false;$('modelCompareBtn').disabled=false;}
 }
}
function renderModels(){
 if(!comparisonData||comparisonKey!==weatherKey(locationNow.lat,locationNow.lon))return;
 const idx=Math.max(0,Math.min(2,Number($('modelDay').value)||0));
 const values=[],valids=[];
 const rows=comparisonData.map(item=>{
  const tr=document.createElement('tr');const d=item.daily;
  const tempHigh=Number(d?.temperature_2m_max?.[idx]),tempLow=Number(d?.temperature_2m_min?.[idx]),precip=Number(d?.precipitation_sum?.[idx]);
  const valid=d&&d.time?.[idx]&&Number.isFinite(tempHigh)&&Number.isFinite(tempLow)&&Number.isFinite(precip)&&d.temperature_2m_max[idx]!=null&&d.temperature_2m_min[idx]!=null&&d.precipitation_sum[idx]!=null;
  const gust=d?.wind_gusts_10m_max?.[idx];
  const columns=[item.model.name+(item.model.detail?' · '+item.model.detail:''), valid?val(tempHigh,1)+'°':'--',valid?val(tempLow,1)+'°':'--',valid?val(precip,1)+' مم':'--',valid?(Number.isFinite(Number(gust))&&gust!=null?val(gust)+' كم/س':'غير متاح'):'غير متاح'];
  columns.forEach(col=>{const td=document.createElement('td');td.textContent=col;tr.append(td)});
  if(valid){valids.push({high:tempHigh,low:tempLow,rain:precip});}
  return tr;
 });
 $('modelRows').replaceChildren(...rows);
 const date=comparisonData.find(r=>r.daily?.time?.[idx])?.daily.time[idx]||'اليوم المحدد';
 if(valids.length>=2){
  const range=k=>[Math.min(...valids.map(r=>r[k])),Math.max(...valids.map(r=>r[k]))];
  const [t0,t1]=range('high'),[p0,p1]=range('rain');
  $('modelSummary').textContent=`${date} · مدى العظمى بين النماذج ${val(t0,1)}–${val(t1,1)}°م (فرق ${val(t1-t0,1)}°) · المطر المتوقع ${val(p0,1)}–${val(p1,1)} مم. هذه فروقات نماذج وليست احتمال صحة التوقع.`;
 }else if(valids.length===1){$('modelSummary').textContent='استجاب نموذج واحد فقط؛ لا يمكن قياس اختلاف النماذج.'}
 else{$('modelSummary').textContent='تعذّر الحصول على مقارنة صالحة. تأكد من الاتصال وحاول مجددًا.'}
 $('modelCompareStatus').textContent=`آخر جلب: ${localClock(comparisonFetchedAt)} بتوقيت السعودية · متاح ${valids.length} من 3 نماذج لهذا اليوم`;
}
function initMap(){if(typeof L==='undefined'){$('radarNotice').textContent='تعذر تحميل مكتبة الخرائط. تحقق من اتصال الإنترنت.';return}map=L.map('map',{zoomControl:true}).setView([locationNow.lat,locationNow.lon],8);L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:18,attribution:'© OpenStreetMap contributors'}).addTo(map);marker=L.marker([locationNow.lat,locationNow.lon]).addTo(map).bindPopup('الموقع المختار');}
function moveMap(lat,lon,accuracy){if(!map)return;map.setView([lat,lon],Math.max(map.getZoom(),11));marker.setLatLng([lat,lon]);if(accuracyCircle){map.removeLayer(accuracyCircle);accuracyCircle=null}if(Number.isFinite(accuracy))accuracyCircle=L.circle([lat,lon],{radius:accuracy,color:'#38bdf8',fillOpacity:.08}).addTo(map);}
let radarHost='',radarLoading=false,radarLastFetch=0,radarGeneration=0,radarPreloaded=new Map();
function radarStatus(text){$('radarState').textContent=text}
function frameAge(time){const minutes=Math.max(0,Math.round((Date.now()-time*1000)/60000));return `عمر الصورة: ${minutes} دقيقة`}
function radarTime(time){return new Intl.DateTimeFormat('ar-SA',{timeZone:TZ,day:'numeric',month:'short',hour:'2-digit',minute:'2-digit',hour12:false}).format(new Date(time*1000))}
async function fetchRadar(){if(!map||radarLoading)return;radarLoading=true;radarStatus('جارٍ تحديث صور الرادار...');try{const data=await getJson('https://api.rainviewer.com/public/weather-maps.json');const items=data.radar?.past||[];if(!items.length||!data.host)throw Error('No radar frames');const previous=frames[frameIndex]?.time;const changed=radarHost!==data.host||items.some((f,i)=>frames[i]?.time!==f.time)||frames.length!==items.length;radarHost=data.host;frames=items.map(f=>({time:f.time,path:f.path}));$('frame').max=String(frames.length-1);frameIndex=previous?Math.max(0,frames.findIndex(f=>f.time===previous)):frames.length-1;if(!previous||!frames.some(f=>f.time===previous))frameIndex=frames.length-1;if(changed){stopRadar();radarPreloaded.clear();setRadarFrame(frameIndex)}radarLastFetch=Date.now();$('radarLabel').textContent='صور رادار حديثة · آخر ساعتين';radarStatus('المصدر RainViewer · التغطية المحلية غير مضمونة');$('radarNotice').textContent='صور رادار هطول سابقة وليست توقعات مستقبلية. لا يمكن الجزم بتغطية طبرجل من وجود الصور وحده؛ غياب الألوان لا يعني عدم وجود أمطار. مستوى التفاصيل الأصلي للرادار حتى تكبير 7.';}catch(e){radarStatus('تعذر تحديث صور الرادار');$('radarNotice').textContent='تعذر الاتصال بـ RainViewer. ستظل الخريطة الأساسية متاحة. حاول تحديث الرادار لاحقًا.';}finally{radarLoading=false}}
function setRadarFrame(index){if(!map||!frames.length)return;const gen=++radarGeneration;frameIndex=Math.max(0,Math.min(index,frames.length-1));const f=frames[frameIndex];const old=radarLayer;const layer=L.tileLayer(`${radarHost}${f.path}/256/{z}/{x}/{y}/2/1_1.png`,{opacity:0,maxNativeZoom:7,maxZoom:18,attribution:'Radar © RainViewer',updateWhenIdle:true,keepBuffer:1});radarLayer=layer;layer.addTo(map);let finished=false;const finish=()=>{if(finished)return;finished=true;if(gen!==radarGeneration){map.removeLayer(layer);return}layer.setOpacity(Number($('opacity').value)/100);if(old&&map.hasLayer(old))map.removeLayer(old);radarStatus('عرض صورة الرادار · التغطية المحلية غير مؤكدة')};layer.once('load',finish);setTimeout(finish,2600);$('frame').value=String(frameIndex);$('frameTime').textContent=radarTime(f.time)+' · السعودية';$('radarAge').textContent=frameAge(f.time)}
function stopRadar(){clearInterval(radarTimer);radarTimer=null;$('play').textContent='▶ تشغيل'}
function stepRadar(delta){if(!frames.length)return;stopRadar();setRadarFrame((frameIndex+delta+frames.length)%frames.length)}
function toggleRadarFullscreen(){const el=$('map');const expanded=el.classList.toggle('map-expanded');document.body.classList.toggle('map-open',expanded);$('radarFullscreen').textContent=expanded?'✕ إغلاق التكبير':'⛶ تكبير الخريطة';if(expanded){const close=document.createElement('button');close.id='closeMapFloating';close.className='map-close-floating';close.textContent='✕ إغلاق';close.onclick=toggleRadarFullscreen;document.body.append(close)}else{$('closeMapFloating')?.remove()}setTimeout(()=>map?.invalidateSize(),160)}
function locationError(err){let msg='تعذر تحديد الموقع.';if(err?.code===1)msg='تم رفض إذن الموقع. افتح إعدادات الموقع في المتصفح، واسمح لهذا الموقع بالوصول للموقع، ثم أعد المحاولة.';else if(err?.code===2)msg='الموقع غير متاح. فعّل خدمة الموقع في الجهاز وتأكد من الاتصال.';else if(err?.code===3)msg='انتهت مهلة تحديد الموقع. جرّب قرب نافذة أو في مكان مفتوح.';notice(msg);status(msg)}
function positionSuccess(pos){const {latitude:lat,longitude:lon,accuracy}=pos.coords;locationNow={name:'موقعي الحالي',lat,lon};$('city').value='';moveMap(lat,lon,accuracy);status(`دقة الموقع المقدّرة ±${Math.round(accuracy)} متر`);$('gpsAccuracy').textContent=`⌖ تحديد GPS: دقة أفقية مقدّرة ±${Math.round(accuracy)} متر، ولا تعني دقة توقع الطقس`;load(lat,lon)}
function gpsOnce(){if(!window.isSecureContext){notice('تحديد الموقع يتطلب HTTPS أو localhost. افتح الموقع المنشور عبر Netlify.');return}if(!navigator.geolocation){notice('المتصفح لا يدعم تحديد الموقع.');return}status('جارٍ طلب إذن الموقع وتحديد الإحداثيات...');navigator.geolocation.getCurrentPosition(positionSuccess,locationError,{enableHighAccuracy:true,timeout:18000,maximumAge:0})}
function track(){if(watchId!==null){navigator.geolocation.clearWatch(watchId);watchId=null;$('trackBtn').textContent='🛰️ متابعة الموقع';status('تم إيقاف متابعة الموقع');return}if(!window.isSecureContext||!navigator.geolocation){notice('متابعة الموقع تحتاج HTTPS ومتصفحًا يدعم الموقع.');return}watchId=navigator.geolocation.watchPosition(pos=>{const p=pos.coords;const moved=Math.hypot(p.latitude-locationNow.lat,p.longitude-locationNow.lon)>0.003;if(moved)positionSuccess(pos);else{moveMap(p.latitude,p.longitude,p.accuracy);status(`الموقع محدّث · دقة تقريبية ±${Math.round(p.accuracy)} م`)}},err=>{locationError(err);if(watchId!==null){navigator.geolocation.clearWatch(watchId);watchId=null;$('trackBtn').textContent='🛰️ متابعة الموقع'}},{enableHighAccuracy:true,timeout:20000,maximumAge:10000});$('trackBtn').textContent='⏹ إيقاف المتابعة';status('جارٍ بدء متابعة الموقع...')}
function answer(q){if(!weather){$('answer').textContent='بيانات التوقعات غير متاحة حاليًا.';return}const c=weather.current,h=weather.hourly,d=weather.daily;const idx=Math.max(0,h.time.findIndex(t=>t===c.time.slice(0,13)+':00'));const probs=h.precipitation_probability.slice(idx,idx+24),max=Math.max(0,...probs.filter(Number.isFinite));const sum=h.precipitation.slice(idx,idx+24).reduce((a,b)=>a+(Number(b)||0),0);let msg='';if(q==='rain')msg=`أعلى احتمال هطول خلال 24 ساعة: ${val(max)}%، ومجموع الهطول المتوقع: ${val(sum,1)} مم. هذه قيم توقعات، وليست تأكيدًا لسقوط المطر.`;if(q==='wind')msg=`الرياح الحالية في النموذج ${val(c.wind_speed_10m)} كم/س، والهبات ${val(c.wind_gusts_10m)} كم/س، والاتجاه ${val(c.wind_direction_10m)}°. راقب التحديثات عند تغير الحالة.`;if(q==='cold')msg=`الصغرى المتوقعة لليوم التالي ${val(d.temperature_2m_min?.[1])}°C. ${d.temperature_2m_min?.[1]<=2?'قد تتوافر ظروف برودة تستدعي الانتباه لاحتمال الصقيع في المواقع المكشوفة، دون تأكيد حدوثه.':'لا تشير درجة الحرارة الدنيا وحدها إلى خطر صقيع مرتفع، لكن المناخ المحلي قد يختلف.'}`;if(q==='walk'){const list=h.time.slice(idx,idx+24).map((t,j)=>({t,temp:h.temperature_2m[idx+j],wind:h.wind_speed_10m[idx+j],rain:h.precipitation_probability[idx+j]})).filter(x=>x.temp>=10&&x.temp<=29&&x.wind<25&&x.rain<30);msg=list.length?`وقت مناسب نسبيًا وفق قواعد الحرارة والرياح والأمطار: ${hour(list[0].t)} بتوقيت السعودية. تحقق من الغبار وجودة الهواء قبل الخروج.`:'لم أجد فترة واضحة تحقق معايير المشي المبسطة خلال 24 ساعة. راجع الظروف المحلية.'}$('answer').textContent=msg+'\nالمصدر: Open-Meteo Forecast · تحليل آلي غير رسمي.'}
function events(){
 $('forecastModel').value=forecastModel;
 $('forecastModel').addEventListener('change',e=>{const next=e.target.value;if(!(next in FORECAST_MODELS))return;forecastModel=next;try{localStorage.setItem('tabarjal-forecast-model-v1',next)}catch(_){}load()});
 $('modelCompareBtn').addEventListener('click',()=>loadModelComparison().catch(err=>{console.warn('Model compare failed',err);$('modelCompareStatus').textContent='فشل طلب المقارنة؛ حاول مجددًا';}));
 $('modelDay').addEventListener('change',renderModels);
 $('themeBtn').onclick=()=>{document.body.classList.toggle('light');localStorage.setItem('tabarjal-theme',document.body.classList.contains('light')?'light':'dark')};$('gpsBtn').onclick=gpsOnce;$('trackBtn').onclick=track;$('refreshBtn').onclick=()=>{load();fetchRadar()};$('city').onchange=e=>{const city=CITIES[e.target.value];if(!city)return;if(watchId!==null)track();locationNow={...city};moveMap(city.lat,city.lon);load()};$('frame').oninput=e=>{stopRadar();setRadarFrame(Number(e.target.value))};$('opacity').oninput=e=>{if(radarLayer)radarLayer.setOpacity(Number(e.target.value)/100)};$('prevFrame').onclick=()=>stepRadar(-1);$('nextFrame').onclick=()=>stepRadar(1);$('radarRefresh').onclick=()=>fetchRadar();$('radarHome').onclick=()=>{map?.setView([CITIES.tabarjal.lat,CITIES.tabarjal.lon],8)};$('radarFullscreen').onclick=toggleRadarFullscreen;$('play').onclick=()=>{if(!frames.length){notice('لا توجد إطارات رادار متاحة');return}if(radarTimer){stopRadar();return}$('play').textContent='⏸ إيقاف';radarTimer=setInterval(()=>setRadarFrame((frameIndex+1)%frames.length),1400)};document.querySelectorAll('[data-q]').forEach(btn=>btn.onclick=()=>answer(btn.dataset.q));}
document.addEventListener('DOMContentLoaded',()=>{try{const saved=localStorage.getItem('tabarjal-forecast-model-v1');if(saved in FORECAST_MODELS)forecastModel=saved;}catch(_){} if(localStorage.getItem('tabarjal-theme')==='light')document.body.classList.add('light');events();initMap();load();fetchRadar();setInterval(()=>{if(!document.hidden)load()},15*60*1000);setInterval(()=>{if(!document.hidden)fetchRadar()},10*60*1000);if('serviceWorker'in navigator)navigator.serviceWorker.register('./sw.js').catch(()=>{});});

// Season calendar: Saudi civil date, local noon UTC avoids DST/date boundary drift.
(function(){
const SEASONS=[{id:'spring',name:'الربيع',icon:'🌸',month:3,day:22},{id:'summer',name:'الصيف',icon:'☀️',month:6,day:22},{id:'autumn',name:'الخريف',icon:'🍂',month:9,day:23},{id:'winter',name:'الشتاء',icon:'❄️',month:12,day:22}];
const MS=86400000;
function saDate(){const parts=new Intl.DateTimeFormat('en-GB',{timeZone:'Asia/Riyadh',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date());const x=Object.fromEntries(parts.filter(p=>p.type!=='literal').map(p=>[p.type,Number(p.value)]));return Date.UTC(x.year,x.month-1,x.day)}
function dateOf(year,s){return Date.UTC(year,s.month-1,s.day)}
function seasonClock(){const grid=document.getElementById('seasonGrid');if(!grid)return;const today=saDate(),year=new Date(today).getUTCFullYear();const starts=[];for(let y=year-1;y<=year+2;y++)for(const s of SEASONS)starts.push({...s,at:dateOf(y,s),year:y});starts.sort((a,b)=>a.at-b.at);const currentIndex=starts.findLastIndex(s=>s.at<=today),current=starts[currentIndex],next=starts[currentIndex+1];const elapsed=Math.round((today-current.at)/MS),total=Math.round((next.at-current.at)/MS),remaining=Math.round((next.at-today)/MS);document.getElementById('seasonIcon').textContent=current.icon;document.getElementById('seasonName').textContent='فصل '+current.name;document.getElementById('seasonDay').textContent='اليوم '+(elapsed+1)+' من أصل '+total+' يومًا';document.getElementById('seasonRemaining').textContent=String(remaining);document.getElementById('seasonProgress').style.width=(100*elapsed/total).toFixed(1)+'%';document.getElementById('seasonNext').textContent='الفصل القادم: '+next.name+' — '+new Intl.DateTimeFormat('ar-SA-u-ca-gregory',{timeZone:'UTC',day:'numeric',month:'long',year:'numeric'}).format(new Date(next.at));grid.replaceChildren(...SEASONS.map(s=>{const coming=starts.find(x=>x.id===s.id&&x.at>=today),days=coming?Math.round((coming.at-today)/MS):0;const el=document.createElement('article');el.className='season-tile'+(current.id===s.id?' active':'');el.innerHTML='<span class="season-emoji">'+s.icon+'</span><b>'+s.name+'</b><strong>'+ (current.id===s.id?elapsed+1:days) +'</strong><small>'+(current.id===s.id?'اليوم من الفصل':'يومًا حتى البداية')+'</small>';return el}));}
document.addEventListener('DOMContentLoaded',()=>{seasonClock();setInterval(()=>{if(!document.hidden)seasonClock()},60000);document.addEventListener('visibilitychange',()=>{if(!document.hidden)seasonClock()})});
})();


// Local Saudi civil calendar; scheduled dates are indicative, not verified live deposits.
(function(){
const DAY=86400000, FMT=new Intl.DateTimeFormat('en-GB',{timeZone:'Asia/Riyadh',year:'numeric',month:'2-digit',day:'2-digit'});
const parts=()=>Object.fromEntries(FMT.formatToParts(new Date()).filter(x=>x.type!=='literal').map(x=>[x.type,Number(x.value)]));
const stamp=(y,m,d)=>Date.UTC(y,m-1,d);
const fmt=t=>new Intl.DateTimeFormat('ar-SA-u-ca-gregory',{timeZone:'UTC',day:'numeric',month:'long',year:'numeric'}).format(new Date(t));
const remaining=(today,target)=>Math.max(0,Math.round((target-today)/DAY));
const TAL=['الإكليل','القلب','الشولة','النعائم','البلدة','سعد الذابح','سعد بلع','سعد السعود','سعد الأخبية','المقدم','المؤخر','الرشاء','الشرطان','البطين','الثريا','الدبران','الهقعة','الهنعة','الذراع','النثرة','الطرف','الجبهة','الزبرة','الصرفة','العواء','السماك','الغفر','الزبانا'];
// Civil approximation: anchor the annual cycle to 16 October, using 13 days per mansion.
function renderTales(today,year){const start=stamp(year,10,16),base=today>=start?start:stamp(year-1,10,16);const elapsed=Math.floor((today-base)/DAY),idx=Math.min(27,Math.floor(elapsed/13)),dayIn=elapsed-idx*13,span=idx===27?Math.round((stamp(new Date(base).getUTCFullYear()+1,10,16)-base)/DAY)-27*13:13;const nextAt=base+(idx===27?(27*13+span):(idx+1)*13)*DAY,nextName=TAL[(idx+1)%28];document.getElementById('taleName').textContent=TAL[idx];document.getElementById('taleDay').textContent=`اليوم ${dayIn+1} من ${span}`;document.getElementById('taleRemaining').textContent=remaining(today,nextAt);document.getElementById('taleProgress').style.width=(100*(dayIn+1)/span)+'%';document.getElementById('taleNext').textContent=`التالي: ${nextName} — ${fmt(nextAt)}`;const grid=document.getElementById('taleGrid');grid.replaceChildren(...TAL.map((name,i)=>{const tile=document.createElement('article');tile.className='tale-tile'+(idx===i?' active':'');const b=document.createElement('b');b.textContent=name;const small=document.createElement('small');small.textContent=idx===i?'الطالع الحالي':i>idx?`بعد ${Math.max(0,i*13-elapsed)} يوم`:'انتهى في الدورة الحالية';tile.append(b,document.createElement('br'),small);return tile}));}
function shiftWeekend(t){const day=new Date(t).getUTCDay();return t+(day===5?-DAY:day===6?-2*DAY:0)}
function monthlyNext(today,year,day,adjust=false){for(let offset=0;offset<15;offset++){const d=new Date(Date.UTC(year,0+offset,1)),y=d.getUTCFullYear(),m=d.getUTCMonth()+1;let t=stamp(y,m,Math.min(day,new Date(Date.UTC(y,m,0)).getUTCDate()));if(adjust)t=shiftWeekend(t);if(t>=today)return t}return null}
const DATA=[
{name:'رواتب الموظفين',rule:'يوم 27 ميلاديًا مع تعديل عطلة نهاية الأسبوع',day:27,adjust:true,url:'https://www.mof.gov.sa/'},
{name:'حساب المواطن',rule:'يوم 10 ميلاديًا، ويُعدّل عند العطلات',day:10,adjust:true,url:'https://portal.ca.gov.sa/'},
{name:'التقاعد المدني والعسكري',rule:'يوم 1 ميلاديًا وفق جدول التأمينات',day:1,url:'https://www.gosi.gov.sa/'},
{name:'ساند',rule:'عادةً بداية الشهر الميلادي',day:1,url:'https://www.gosi.gov.sa/'},
{name:'التأهيل الشامل',rule:'يختلف وفق جدول وزارة الموارد البشرية',url:'https://www.hrsd.gov.sa/'},
{name:'حافز',rule:'يراجع موعد الإيداع عبر طاقات',url:'https://www.taqat.sa/'},
{name:'الضمان الاجتماعي',rule:'عادةً أول الشهر الميلادي',day:1,url:'https://www.hrsd.gov.sa/'},
{name:'الدعم السكني',rule:'يوم 24 ميلاديًا عادةً؛ قد يتغير بالعطلات',day:24,url:'https://sakani.sa/'},
{name:'العلاوة السنوية',rule:'ترتبط عادةً براتب يناير للموظف المستحق',annual:1,annualDay:27,url:'https://www.mof.gov.sa/'},
{name:'مكافآت الطلاب الجامعية',rule:'تختلف بحسب الجامعة والتقويم الأكاديمي',url:'https://www.moe.gov.sa/'},
{name:'مكافآت التقنية',rule:'تختلف بحسب جدول المؤسسة التدريبية',url:'https://tvtc.gov.sa/'}];
function renderPayments(today,year){const grid=document.getElementById('paymentsGrid');grid.replaceChildren(...DATA.map(item=>{const el=document.createElement('article');el.className='payment-tile';const h=document.createElement('h3');h.textContent=item.name;el.append(h);let t=null;if(item.day)t=monthlyNext(today,year,item.day,item.adjust);if(item.annual){t=stamp(year,item.annual,item.annualDay);if(t<today)t=stamp(year+1,item.annual,item.annualDay)}const strong=document.createElement('strong');strong.textContent=t?fmt(t):'حسب إعلان الجهة';el.append(strong);if(t){const count=document.createElement('div');count.className='payment-count';count.textContent=remaining(today,t)===0?'اليوم (موعد تقريبي)':`متبقي ${remaining(today,t)} يوم`;el.append(count)}const p=document.createElement('p');p.className='payment-note';p.textContent=item.rule;el.append(p);const a=document.createElement('a');a.href=item.url;a.target='_blank';a.rel='noopener noreferrer';a.textContent='الجهة الرسمية ↗';el.append(a);return el}));}
function update(){const x=parts(),today=stamp(x.year,x.month,x.day);if(document.getElementById('taleGrid'))renderTales(today,x.year);if(document.getElementById('paymentsGrid'))renderPayments(today,x.year)}
document.addEventListener('DOMContentLoaded',()=>{update();setInterval(()=>{if(!document.hidden)update()},60000);document.addEventListener('visibilitychange',()=>{if(!document.hidden)update()})});
})();
