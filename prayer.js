/* Aurora 3.2 — Prayer times: Umm Al-Qura via AlAdhan API; GPS / Saudi cities; iqamah is adjustable. */
(()=>{
'use strict';
const $ = id => document.getElementById(id);
const ZONE='Asia/Riyadh', DAY=86400000;
const PRAYERS=[['Fajr','الفجر','🌙'],['Dhuhr','الظهر','☀️'],['Asr','العصر','🌤️'],['Maghrib','المغرب','🌇'],['Isha','العشاء','🌃']];
const REGIONS=[
 {name:'الجوف',cities:[['طبرجل','Tabarjal',30.50,38.216],['سكاكا','Sakaka',29.969,40.206],['القريات','Al Qurayyat',31.331,37.342],['دومة الجندل','Dumat Al Jandal',29.811,39.867],['صوير','Suwayr'],['زلوم','Zallum'],['ميقوع','Mayqu']],key:0},
 {name:'الحدود الشمالية',cities:[['عرعر','Arar',30.975,41.039],['طريف','Turaif',31.674,38.664],['رفحاء','Rafha',29.634,43.519],['العويقيلة','Al Uwayqilah']]},
 {name:'الرياض',cities:[['الرياض','Riyadh',24.7136,46.6753],['الخرج','Al Kharj'],['الدرعية','Diriyah'],['المجمعة','Al Majmaah'],['الزلفي','Al Zulfi'],['شقراء','Shaqra'],['الدوادمي','Ad Dawadimi'],['وادي الدواسر','Wadi ad Dawasir'],['عفيف','Afif'],['الأفلاج','Al Aflaj'],['حوطة بني تميم','Hawtat Bani Tamim'],['القويعية','Al Quwayiyah'],['رماح','Rumah'],['ثادق','Thadiq'],['حريملاء','Huraymila'],['الغاط','Al Ghat']]},
 {name:'مكة المكرمة',cities:[['مكة المكرمة','Mecca',21.4225,39.8262],['جدة','Jeddah',21.5433,39.1728],['الطائف','Taif',21.2703,40.4158],['رابغ','Rabigh'],['القنفذة','Al Qunfudhah'],['الليث','Al Lith'],['الجموم','Al Jumum'],['خليص','Khulays'],['بحرة','Bahrah'],['أضم','Adham'],['تربة','Turabah'],['رنية','Ranyah'],['الخرمة','Al Khurma']]},
 {name:'المدينة المنورة',cities:[['المدينة المنورة','Medina',24.4686,39.6142],['ينبع','Yanbu',24.0895,38.0637],['العلا','Al Ula',26.617,37.922],['بدر','Badr'],['خيبر','Khaybar'],['الحناكية','Al Hinakiyah'],['المهد','Mahd adh Dhahab']]},
 {name:'القصيم',cities:[['بريدة','Buraydah',26.3592,43.9818],['عنيزة','Unaizah',26.089,43.974],['الرس','Ar Rass',25.869,43.497],['البكيرية','Al Bukayriyah'],['المذنب','Al Mithnab'],['البدائع','Al Badayea'],['رياض الخبراء','Riyadh Al Khabra'],['عيون الجواء','Uyun Al Jiwa'],['الشماسية','Ash Shimasiyah'],['النبهانية','An Nabhaniyah']]},
 {name:'المنطقة الشرقية',cities:[['الدمام','Dammam',26.4207,50.0888],['الخبر','Khobar',26.2794,50.2083],['الظهران','Dhahran',26.2361,50.0393],['الأحساء','Al Ahsa',25.382,49.587],['الهفوف','Al Hofuf',25.3647,49.5876],['الجبيل','Jubail',27.0174,49.6225],['القطيف','Qatif',26.5652,50.0089],['رأس تنورة','Ras Tanura'],['حفر الباطن','Hafar Al Batin',28.4328,45.9708],['النعيرية','An Nuayriyah'],['الخفجي','Khafji'],['بقيق','Abqaiq']]},
 {name:'عسير',cities:[['أبها','Abha',18.2164,42.5053],['خميس مشيط','Khamis Mushait',18.3,42.729],['بيشة','Bisha',20.01,42.604],['محايل عسير','Muhayil'],['النماص','Al Namas'],['ظهران الجنوب','Dhahran Al Janub'],['سراة عبيدة','Sarat Abidah'],['رجال ألمع','Rijal Alma'],['تثليث','Tathlith'],['بلقرن','Balqarn']]},
 {name:'تبوك',cities:[['تبوك','Tabuk',28.3998,36.5715],['ضباء','Duba',27.351,35.693],['الوجه','Al Wajh',26.245,36.453],['أملج','Umluj',25.05,37.266],['حقل','Haql',29.292,34.947],['تيماء','Tayma',27.623,38.544],['البدع','Al Bad']]},
 {name:'حائل',cities:[['حائل','Hail',27.5114,41.7208],['بقعاء','Baqaa'],['الغزالة','Al Ghazalah'],['الشنان','Ash Shinan'],['الشملي','Ash Shamli'],['موقق','Mawqaq'],['الحائط','Al Hait'],['السليمي','As Sulaymi']]},
 {name:'جازان',cities:[['جازان','Jazan',16.8892,42.5706],['صبيا','Sabya',17.1495,42.625],['أبو عريش','Abu Arish'],['صامطة','Samtah'],['بيش','Baish'],['الدرب','Ad Darb'],['فرسان','Farasan'],['العارضة','Al Aridah'],['فيفاء','Fayfa'],['أحد المسارحة','Ahad Al Masarihah']]},
 {name:'نجران',cities:[['نجران','Najran',17.4924,44.1277],['شرورة','Sharurah',17.467,47.121],['حبونا','Hubuna'],['يدمة','Yadamah'],['بدر الجنوب','Badr Al Janub'],['ثار','Thar']]},
 {name:'الباحة',cities:[['الباحة','Al Bahah',20.0129,41.4677],['بلجرشي','Baljurashi',19.862,41.557],['المندق','Al Mandaq'],['المخواة','Al Makhwah'],['العقيق','Al Aqiq'],['قلوة','Qilwah'],['القرى','Al Qura'],['غامد الزناد','Ghamid Az Zinad']]}
];
const KEY='tabarjal-prayers-settings-v1';
const defaults={region:0,city:0,method:4,offsets:{Fajr:20,Dhuhr:15,Asr:15,Maghrib:10,Isha:20}};
function restore(){try{const p=JSON.parse(localStorage.getItem(KEY)||'{}');return {...defaults,...p,offsets:{...defaults.offsets,...p.offsets}}}catch{return {...defaults,offsets:{...defaults.offsets}}}}
const state={prefs:restore(),location:null,records:[],fetchId:0,loading:false,source:'',clockTimer:null,searchTimer:null,lastRefreshAttempt:0};
function persist(){try{localStorage.setItem(KEY,JSON.stringify(state.prefs))}catch{}}
const set=(id,text)=>{if($(id))$(id).textContent=text};
function saParts(d){const parts=new Intl.DateTimeFormat('en-GB',{timeZone:ZONE,year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(d);const m=Object.fromEntries(parts.map(x=>[x.type,x.value]));return {year:+m.year,month:+m.month,day:+m.day}}
function plusDays(x,count){let a=new Date(Date.UTC(x.year,x.month-1,x.day+count));return {year:a.getUTCFullYear(),month:a.getUTCMonth()+1,day:a.getUTCDate()}}
function dateKey(d){return [d.year,String(d.month).padStart(2,'0'),String(d.day).padStart(2,'0')].join('-')}
function dateRoute(d){return `${String(d.day).padStart(2,'0')}-${String(d.month).padStart(2,'0')}-${d.year}`}
function formatTime(t){return Number.isFinite(t)?new Intl.DateTimeFormat('ar-SA',{timeZone:ZONE,hour:'numeric',minute:'2-digit',hour12:true}).format(new Date(t)):'--'}
function clockDuration(ms){if(!Number.isFinite(ms))return '--:--:--';const seconds=Math.max(0,Math.floor(ms/1000));const h=Math.floor(seconds/3600),m=Math.floor((seconds%3600)/60),s=seconds%60;return [h,m,s].map(n=>String(n).padStart(2,'0')).join(':')}
function parseLocalTime(str,day){const v=String(str||'').match(/^(\d{1,2}):(\d{2})/);if(!v)return NaN;const h=+v[1],min=+v[2];if(h>23||min>59)return NaN;return Date.UTC(day.year,day.month-1,day.day,h-3,min)}
function status(text,kind='neutral'){const e=$('prayerStatus');if(e){e.textContent=text;e.dataset.state=kind}}
function resetDisplay(){state.records=[];set('prayerNextName','—');set('prayerNextTime','—');set('prayerNextCount','--:--:--');set('prayerIqamaName','—');set('prayerIqamaTime','—');set('prayerIqamaCount','--:--:--');set('prayerSunrise','—');set('prayerSunset','—');$('prayerTiles').replaceChildren()}
function validateLocation(obj){if(!obj||!Number.isFinite(+obj.lat)||!Number.isFinite(+obj.lon)||+obj.lat<16||+obj.lat>33||+obj.lon<34||+obj.lon>56)throw Error('الموقع خارج النطاق السعودي المدعوم');return {name:obj.name||'موقعي الحالي',lat:+obj.lat,lon:+obj.lon,accuracy:obj.accuracy||null}}
async function fetchWithTimeout(url,ms=13500){const ctrl=new AbortController(),t=setTimeout(()=>ctrl.abort(),ms);try{const r=await fetch(url,{signal:ctrl.signal,cache:'no-store'});if(!r.ok)throw Error('خطأ المصدر: '+r.status);return await r.json()}finally{clearTimeout(t)}}
function cacheKey(loc,day,method){return `prayer-v1:${dateKey(day)}:${loc.lat.toFixed(3)},${loc.lon.toFixed(3)}:${method}`}
function cachedPrayer(loc,day,method){try{const o=JSON.parse(localStorage.getItem(cacheKey(loc,day,method))||'null');if(o&&o.savedAt>Date.now()-7*DAY)return o.data}catch{}return null}
function savePrayer(loc,day,method,data){try{localStorage.setItem(cacheKey(loc,day,method),JSON.stringify({data,savedAt:Date.now()}))}catch{}}
function readTimes(data,day){if(data?.code!==200||!data?.data?.timings)throw Error('استجابة غير صالحة من مصدر المواقيت');const t=data.data.timings;const values={};for(const key of [...PRAYERS.map(x=>x[0]),'Sunrise','Sunset']){values[key]=parseLocalTime(t[key],day);if(!Number.isFinite(values[key]))throw Error('وقت مفقود: '+key)}return {...values,date:day}}
async function getPrayerForDay(loc,day,method){
 const cached=cachedPrayer(loc,day,method);
 const url=`https://api.aladhan.com/v1/timings/${dateRoute(day)}?`+new URLSearchParams({latitude:String(loc.lat),longitude:String(loc.lon),method:String(method),school:'0',timezonestring:ZONE});
 try{const obj=await fetchWithTimeout(url);const valid=readTimes(obj,day);savePrayer(loc,day,method,obj);return {value:valid,fromCache:false}}catch(e){if(cached)return {value:readTimes(cached,day),fromCache:true};throw e}
}
function rowElement(ary,now){let [id,title,symbol]=ary;const t=state.records[0]?.[id];const offset=Number(state.prefs.offsets[id]);const el=document.createElement('div');el.className='prayer-tile';if(Number.isFinite(t)&&Math.abs(t-now)<30*60000)el.classList.add('prayer-near');const top=document.createElement('span');top.className='prayer-tile-icon';top.textContent=symbol;const label=document.createElement('b');label.textContent=title;const at=document.createElement('strong');at.textContent=formatTime(t);const foot=document.createElement('small');foot.textContent=`إقامة تقديرية: ${formatTime(Number.isFinite(t)?t+offset*60000:NaN)}`;el.append(top,label,at,foot);return el}
function render(){
 if(!state.records.length)return;const now=Date.now(),today=saParts(new Date()),todayKey=dateKey(today);
 const rec=state.records.find(x=>dateKey(x.date)===todayKey);
 if(!rec)return;
 const prayers=state.records.flatMap(o=>PRAYERS.map(([key,name])=>({id:key,name,time:o[key],iqama:o[key]+Number(state.prefs.offsets[key])*60000}))).sort((a,b)=>a.time-b.time);
 const next=prayers.find(x=>x.time>now), iq=prayers.find(x=>x.iqama>now);
 set('prayerNextName',next?.name||'بانتظار تحديث اليوم التالي');set('prayerNextTime',next?formatTime(next.time):'—');set('prayerNextCount',next?clockDuration(next.time-now):'--:--:--');
 set('prayerIqamaName',iq?.name||'بانتظار تحديث اليوم التالي');set('prayerIqamaTime',iq?formatTime(iq.iqama):'—');set('prayerIqamaCount',iq?clockDuration(iq.iqama-now):'--:--:--');
 set('prayerSunrise',formatTime(rec.Sunrise));set('prayerSunset',formatTime(rec.Sunset));
 set('prayerSaudiClock',new Intl.DateTimeFormat('ar-SA',{timeZone:ZONE,weekday:'long',day:'numeric',month:'long',hour:'numeric',minute:'2-digit',second:'2-digit',hour12:true}).format(new Date(now)));
 for(const el of $('prayerTiles').children){const id=el.dataset.key,at=rec[id];el.classList.toggle('prayer-near',now>=at&&now<at+30*60000)}
}
function paint(){const today=saParts(new Date());const rec=state.records.find(o=>dateKey(o.date)===dateKey(today));if(!rec)return;const box=$('prayerTiles');box.replaceChildren();for(const p of PRAYERS){const el=rowElement(p,Date.now());el.dataset.key=p[0];box.append(el)}render()}
async function reload(){
 if(!state.location)return;let token=++state.fetchId,loc=state.location,method=state.prefs.method;
 state.loading=true;state.lastRefreshAttempt=Date.now();resetDisplay();set('prayerLocation',loc.name);status('جارٍ جلب مواقيت أم القرى حسب الإحداثيات…','loading');
 const today=saParts(new Date());let first,second;
 try{first=await getPrayerForDay(loc,today,method);if(token!==state.fetchId)return;state.records=[first.value];paint();status(first.fromCache?'تعذر الاتصال: عُرضت مواقيت محسوبة محفوظة لهذا اليوم':'تم تحديث المواقيت الحسابية بنجاح',first.fromCache?'warn':'ok');}
 catch(e){if(token===state.fetchId){status('تعذر تحميل المواقيت. تحقق من الشبكة واضغط «تحديث».','error');state.loading=false;}return}
 try{second=await getPrayerForDay(loc,plusDays(today,1),method);if(token!==state.fetchId)return;state.records=[first.value,second.value];render();if(second.fromCache)status('مواقيت اليوم متاحة؛ مواقيت الغد محفوظة مؤقتًا','warn');}
 catch(e){if(token===state.fetchId)status('مواقيت اليوم متاحة؛ لم تتوفر مواقيت الغد بعد','warn')}
 if(token!==state.fetchId)return;state.loading=false;set('prayerMethodLabel',method===4?'أم القرى — حساب فلكي':'رابطة العالم الإسلامي — حساب فلكي');
}
function setLocation(obj){try{state.location=validateLocation(obj);set('prayerLocation',state.location.name);set('prayerCoordinates',`${state.location.lat.toFixed(4)}°N ، ${state.location.lon.toFixed(4)}°E${state.location.accuracy?` · دقة الموقع ±${Math.round(state.location.accuracy)}م`:''}`);reload()}catch(e){status(e.message,'error')}}
function makeOptions(){const regions=$('prayerRegion'),city=$('prayerCity');for(let i=0;i<REGIONS.length;i++){const o=document.createElement('option');o.value=i;o.textContent=REGIONS[i].name;regions.append(o)}const region=Number(state.prefs.region);regions.value=Number.isInteger(region)&&region>=0&&region<REGIONS.length?region:0;fillCities();const ci=Number(state.prefs.city);city.value=ci>=0&&ci<REGIONS[+regions.value].cities.length?ci:0;$('prayerMethod').value=String([3,4].includes(+state.prefs.method)?state.prefs.method:4)}
function fillCities(){const arr=REGIONS[+$('prayerRegion').value].cities,sel=$('prayerCity');sel.replaceChildren();arr.forEach((a,i)=>{const o=document.createElement('option');o.value=i;o.textContent=a[0];sel.append(o)})}
async function pickCity(){const r=+$('prayerRegion').value,idx=+$('prayerCity').value,city=REGIONS[r]?.cities[idx];if(!city)return;state.prefs.region=r;state.prefs.city=idx;persist();
 state.fetchId++;let geocodeToken=state.fetchId;
 if(Number.isFinite(city[2])&&Number.isFinite(city[3])){setLocation({name:city[0],lat:city[2],lon:city[3]});return}
 status(`جارٍ البحث عن إحداثيات ${city[0]}…`,'loading');set('prayerLocation',city[0]);resetDisplay();
 try{const matched=await lookup(city[1]||city[0]);if(geocodeToken!==state.fetchId)return;const target=matched.find(x=>String(x.name).toLowerCase()===String(city[1]).toLowerCase())||matched[0];if(!target)throw Error('لم يُعثر على إحداثيات موثوقة لهذه المدينة');setLocation({name:city[0],lat:target.latitude,lon:target.longitude})}catch(e){if(geocodeToken===state.fetchId)status(`تعذر تحديد إحداثيات «${city[0]}». جرّب البحث أو GPS.`, 'error')}
}
async function lookup(term){const params=new URLSearchParams({name:term,count:'20',language:'ar',countryCode:'SA'});let json=await fetchWithTimeout('https://geocoding-api.open-meteo.com/v1/search?'+params,9000);return (json.results||[]).filter(x=>x.country_code==='SA'&&Number.isFinite(x.latitude)&&Number.isFinite(x.longitude))}
async function findOther(){let search=$('prayerSearch').value.trim();if(search.length<2){status('اكتب اسم المدينة بحرفين على الأقل','warn');return}const results=$('prayerResults');results.replaceChildren();status('جارٍ البحث عن مدن المملكة…','loading');let token=++state.fetchId;
 try{let values=await lookup(search);if(token!==state.fetchId)return;if(!values.length){status('لم يتم العثور على مدينة مطابقة. جرّب كتابة اسمها بالإنجليزية.','warn');return}
 status('اختر الموقع الصحيح من نتائج البحث','ok');for(const c of values.slice(0,12)){const b=document.createElement('button');b.type='button';b.className='secondary prayer-search-item';b.textContent=`${c.name}${c.admin1?' — '+c.admin1:''}`;b.addEventListener('click',()=>{results.replaceChildren();setLocation({name:c.name,lat:c.latitude,lon:c.longitude})});results.append(b)}
 }catch(e){if(token===state.fetchId)status('تعذر البحث عن المدينة. تحقق من الاتصال بالإنترنت.','error')}
}
function locate(){if(!navigator.geolocation){status('تحديد الموقع غير مدعوم في هذا المتصفح','error');return}if(!window.isSecureContext){status('يعمل تحديد الموقع على HTTPS فقط','error');return}
 const b=$('prayerGPS');b.disabled=true;status('جارٍ طلب إذن تحديد الموقع…','loading');
 navigator.geolocation.getCurrentPosition(pos=>{b.disabled=false;const {latitude,longitude,accuracy}=pos.coords;setLocation({name:'موقعي الحالي',lat:latitude,lon:longitude,accuracy})},err=>{b.disabled=false;const msg=err.code===1?'صلاحية الموقع مرفوضة. اسمح بها من إعدادات المتصفح أو اختر المدينة.':err.code===3?'انتهت مهلة GPS؛ اختر مدينتك يدويًا.':'تعذر تحديد الموقع. جرّب اختيار المدينة.';status(msg,'warn')},{enableHighAccuracy:true,timeout:13000,maximumAge:60000});
}
function settings(){const node=$('prayerIqamaSettings');const fields=$('prayerOffsetFields');if(fields.children.length===0){for(const [id,label] of PRAYERS){const wrap=document.createElement('label');wrap.textContent=`بعد أذان ${label} (دقيقة)`;const inp=document.createElement('input');inp.type='number';inp.min=0;inp.max=120;inp.step=1;inp.value=state.prefs.offsets[id];inp.dataset.key=id;inp.addEventListener('change',()=>{let v=+inp.value;if(!Number.isFinite(v)||v<0||v>120){v=15;inp.value=v}state.prefs.offsets[id]=v;persist();if(state.records.length){paint()}});wrap.append(inp);fields.append(wrap)}}node.hidden=!node.hidden;$('prayerSettingsToggle').setAttribute('aria-expanded',String(!node.hidden))}
function initial(){if(!$('prayerRegion'))return;
 makeOptions();$('prayerRegion').addEventListener('change',()=>{$('prayerCity').value='0';fillCities();state.prefs.city=0;pickCity()});
 $('prayerCity').addEventListener('change',pickCity);$('prayerMethod').addEventListener('change',()=>{state.prefs.method=+$('prayerMethod').value;persist();reload()});
 $('prayerGPS').addEventListener('click',locate);$('prayerSearchBtn').addEventListener('click',findOther);$('prayerSearch').addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();findOther()}});
 $('prayerRefresh').addEventListener('click',reload);$('prayerSettingsToggle').addEventListener('click',settings);
 $('prayerShortcut').addEventListener('click',()=>{if(!state.records.length&&state.location)reload()});
 const region=REGIONS[+$('prayerRegion').value],city=region.cities[+$('prayerCity').value];
 if(Number.isFinite(city[2])&&Number.isFinite(city[3]))setLocation({name:city[0],lat:city[2],lon:city[3]});else pickCity();
 state.clockTimer=setInterval(()=>{const today=saParts(new Date());if(state.records.length&&dateKey(state.records[0].date)!==dateKey(today)){if(!state.loading&&Date.now()-state.lastRefreshAttempt>60000)reload()}else render()},1000);
 document.addEventListener('visibilitychange',()=>{if(!document.hidden&&state.location){const today=saParts(new Date());if(!state.records.length||dateKey(state.records[0].date)!==dateKey(today)){if(!state.loading&&Date.now()-state.lastRefreshAttempt>60000)reload()}else render()}});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',initial,{once:true});else initial();
})();
