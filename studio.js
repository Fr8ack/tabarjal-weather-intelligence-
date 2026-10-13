'use strict';
// Aurora 3.0. Presentation and weather-derived interpretation only.
// No invented observations, accounts, payment flows or ad tracking.
(()=>{
 const byId=id=>document.getElementById(id);
 const put=(id,text)=>{const el=byId(id);if(el)el.textContent=text};
 const number=(v,d=0)=>v!==null&&v!==undefined&&Number.isFinite(Number(v))?Number(v).toFixed(d):'--';
 const hasNumber=v=>v!==null&&v!==undefined&&Number.isFinite(Number(v));
 const nowDay=()=>new Intl.DateTimeFormat('ar-SA-u-ca-gregory',{weekday:'long',day:'numeric',month:'long',timeZone:'Asia/Riyadh'}).format(new Date());
 let observedWeather=null, observedAir=null, mode='temp', lastCity='', priorLoading=false;
 function getIndex(h,c){if(!h?.time?.length)return -1;const exact=h.time.findIndex(t=>t===c.time.slice(0,13)+':00');if(exact>=0)return exact;return Math.max(0,h.time.findIndex(t=>t>=c.time));}
 function refreshInsights(){
   if(typeof weather==='undefined'||!weather?.current||!weather?.hourly||!weather?.daily)return;
   const c=weather.current,d=weather.daily,h=weather.hourly,start=getIndex(h,c);
   const first=Math.max(0,start),slice=h.precipitation_probability?.slice(first,first+24)||[];
   const best=slice.filter(hasNumber);
   const max=best.length?Math.max(...best.map(Number)):null;
   put('heroHighLow',number(d.temperature_2m_max?.[0])+'° / '+number(d.temperature_2m_min?.[0])+'°');
   put('heroRainChance',max===null?'غير متاح':number(max)+'%');
   put('heroSunrise',d.sunrise?.[0]?.slice(11,16)||'--');
   const t0=h.temperature_2m?.[first],t6=h.temperature_2m?.[first+6];
   if(hasNumber(t0)&&hasNumber(t6)){
     const change=t6-t0;
     put('insightTrend',Math.abs(change)<1?'شبه مستقرة':change>0?'أدفأ بنحو '+number(change,1)+'°':'أبرد بنحو '+number(-change,1)+'°');
     put('insightTrendDetail','مقارنة متوقعة بعد 6 ساعات');
   }else{put('insightTrend','غير متاح');put('insightTrendDetail','لا تتوفر بيانات كافية للمقارنة')}
   const rainIndex=slice.findIndex(p=>hasNumber(p)&&Number(p)>=35);
   if(rainIndex>=0){
     put('insightRain',rainIndex===0?'في الساعة الحالية':'بعد '+rainIndex+' ساعة');
     put('insightRainDetail','احتمال هطول '+number(slice[rainIndex])+'% في تلك الساعة');
   }else if(best.length){put('insightRain','فرصة منخفضة نسبيًا');put('insightRainDetail','لم تتجاوز 35% خلال 24 ساعة حسب النموذج')}
   else{put('insightRain','غير متاح');put('insightRainDetail','بيانات الاحتمال غير متاحة')}
   const wind=Number(c.wind_speed_10m),temp=Number(c.temperature_2m),p=Number(c.precipitation);
   let outdoor='مناسب نسبيًا',note='بناءً على حرارة الجو والرياح';
   if(temp>=39){outdoor='حرارة مرتفعة';note='تجنب الجهد عند ارتفاع الحرارة'}
   else if(temp<=5){outdoor='برودة ملحوظة';note='تحقق من الملابس والرياح'}
   else if(wind>=40){outdoor='رياح قوية نسبيًا';note='قد تؤثر الرياح على الأنشطة'}
   else if(p>=2){outdoor='أمطار متوقعة';note='تحقق من توقعات الساعات القادمة'}
   if(typeof air!=='undefined'&&hasNumber(air?.current?.us_aqi)&&air.current.us_aqi>=151){outdoor='جودة هواء ضعيفة';note='مؤشر جوي نموذجي وليس قياس محطة'}
   put('insightOutdoors',outdoor);put('insightOutdoorsDetail',note);
   const bg=document.querySelector('.weather-bg');if(bg)bg.setAttribute('aria-hidden','true');
   put('dateNow',nowDay());
   if(typeof chart!=='undefined'&&chart)applyChartMode();
 }
 function applyChartMode(){
   if(typeof chart==='undefined'||!chart||typeof weather==='undefined'||!weather?.current)return;
   const h=weather.hourly,start=getIndex(h,weather.current);
   if(start<0)return;
   const len=Math.min(48,h.time.length-start);
   const temp=chart.data.datasets[0],rain=chart.data.datasets[1];if(!temp||!rain)return;
   temp.hidden=mode==='rain';rain.hidden=mode!=='rain';
   if(mode==='wind'){
     temp.hidden=false;temp.data=(h.wind_speed_10m||[]).slice(start,start+len);
     temp.label='الرياح كم/س';temp.borderColor='#88dcc5';temp.backgroundColor='#88dcc51e';
   }else{
     temp.data=(h.temperature_2m||[]).slice(start,start+len);
     temp.label='درجة الحرارة °C';temp.borderColor='#88dcc5';temp.backgroundColor='#88dcc51e';
   }
   if(chart.options?.scales?.y?.title)chart.options.scales.y.title.text=mode==='wind'?'الرياح كم/س':mode==='rain'?'الحرارة °C':'الحرارة °C';
   try{chart.update('none')}catch(e){console.warn('Chart update skipped',e)}
 }
 function setupChartSwitch(){document.querySelectorAll('[data-chart]').forEach(el=>{
   el.addEventListener('click',()=>{
     mode=el.dataset.chart;
     document.querySelectorAll('[data-chart]').forEach(b=>{const isActive=b.dataset.chart===mode;b.classList.toggle('active',isActive);b.setAttribute('aria-pressed',String(isActive))});
     applyChartMode();
   });
 })}
 function updateGpsText(){
   if(typeof locationNow==='undefined')return;
   if(locationNow.name!=='موقعي الحالي'){
     put('gpsAccuracy','⌖ موقع المدينة المختارة: إحداثيات المركز التقريبية، وليست إشارة GPS');
   }
 }
 function monitor(){
  if(typeof weather!=='undefined'&&weather?.current&&weather!==observedWeather){observedWeather=weather;refreshInsights()}
  if(typeof air!=='undefined'&&air!==observedAir){observedAir=air;if(observedWeather)refreshInsights()}
  if(typeof locationNow!=='undefined'&&locationNow.name!==lastCity){lastCity=locationNow.name;updateGpsText()}
  const busy=byId('status')?.textContent?.includes('جارٍ');if(priorLoading&&!busy&&observedWeather)updateGpsText();priorLoading=busy;
 }
 function restoreCity(){
   let remembered='';try{remembered=localStorage.getItem('tabarjal-preferred-city')||''}catch(e){}
   const picker=byId('city');if(!picker)return;
   picker.addEventListener('change',()=>{if(!picker.value)return;try{localStorage.setItem('tabarjal-preferred-city',picker.value)}catch(e){};updateGpsText()});
   if(remembered&&picker.querySelector('option[value="'+remembered+'"]')&&picker.value!==remembered){picker.value=remembered;picker.dispatchEvent(new Event('change',{bubbles:true}))}
 }
 function geoHelp(){
   const modal=document.createElement('dialog');modal.id='geoHelpDialog';modal.className='geo-dialog';modal.innerHTML='<form method="dialog"><h2>📍 تفعيل الوصول إلى الموقع</h2><p>قد تكون صلاحية الموقع محظورة لهذا الموقع. لا يستطيع الموقع فتح إعدادات النظام مباشرة أو فرض ظهور نافذة السماح بعد الحظر.</p><p>في <b>Chrome</b>: اضغط رمز الإعدادات بجوار عنوان الموقع، ثم <b>أذونات الموقع ← الموقع ← السماح</b>، وأعد تحميل الصفحة.</p><p>على <b>iPhone / Safari</b>: افتح إعدادات Safari للموقع، واسمح بإذن الموقع. تأكد من تشغيل خدمة الموقع في إعدادات الجهاز.</p><p class="muted">للحصول على موقع أدق: فعّل GPS، واستخدم اتصالًا مناسبًا، وانتظر في مكان يسمح باستقبال الإشارة.</p><button type="submit">فهمت</button></form>';
   document.body.appendChild(modal);
   const show=()=>{if(typeof modal.showModal==='function')modal.showModal();else alert('فعّل إذن الموقع لهذا الموقع من إعدادات المتصفح ثم أعد المحاولة')};
   for(const id of ['gpsBtn','trackBtn']){
     byId(id)?.addEventListener('click',e=>{
       if(!navigator.permissions?.query)return;
       // Respect user activation for an unknown/prompt state: let original geolocation onclick run.
       // Browser cannot re-trigger a permission prompt after the user has explicitly blocked it.
       if(geoHelp.blocked){e.stopImmediatePropagation();show()}
     },true);
   }
   if(navigator.permissions?.query){
     navigator.permissions.query({name:'geolocation'}).then(p=>{geoHelp.blocked=p.state==='denied';p.onchange=()=>{geoHelp.blocked=p.state==='denied'}}).catch(()=>{});
   }
 }
 document.addEventListener('DOMContentLoaded',()=>{
   setupChartSwitch();restoreCity();geoHelp();put('dateNow',nowDay());
   setInterval(()=>{if(!document.hidden)monitor()},1400);
   document.addEventListener('visibilitychange',()=>{if(!document.hidden){put('dateNow',nowDay());monitor()}});
   monitor();
 });
})();
