
'use strict';
// Optional features kept separate from the existing, working weather and radar engine.
let installPrompt=null;
window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();installPrompt=e;document.getElementById('installBtn')?.classList.remove('hidden')});
document.addEventListener('DOMContentLoaded',()=>{
 const top=document.getElementById('backToTop');
 window.addEventListener('scroll',()=>top?.classList.toggle('hidden',window.scrollY<400),{passive:true});
 top?.addEventListener('click',()=>window.scrollTo({top:0,behavior:'smooth'}));
 document.getElementById('installBtn')?.addEventListener('click',async()=>{if(!installPrompt)return;await installPrompt.prompt();installPrompt=null;document.getElementById('installBtn').classList.add('hidden')});
 document.getElementById('shareBtn')?.addEventListener('click',async()=>{
  const text=`🌤️ طقس ${typeof locationNow!=='undefined'?locationNow.name:'طبرجل'}: ${document.getElementById('temp')?.textContent||'--'}°C — ${document.getElementById('condition')?.textContent||''}`;
  try{if(navigator.share)await navigator.share({title:'طقس طبرجل الذكي',text,url:location.href});else if(navigator.clipboard){await navigator.clipboard.writeText(text+'\n'+location.href);notice('تم نسخ حالة الطقس ورابط الموقع')}else notice('المشاركة غير متاحة في هذا المتصفح')}catch(e){if(e.name!=='AbortError')notice('تعذرت المشاركة')}
 });
 const themeQuery=window.matchMedia('(prefers-color-scheme: dark)');
 const syncTheme=()=>{if(!localStorage.getItem('tabarjal-theme'))document.body.classList.toggle('light',!themeQuery.matches)};
 syncTheme();themeQuery.addEventListener?.('change',syncTheme);
 let lastWeatherTime='';
 const update=()=>{
  if(typeof weather==='undefined'||!weather?.current)return;
  const c=weather.current;
  if(c.time===lastWeatherTime)return;
  lastWeatherTime=c.time;
  const bg=document.querySelector('.weather-bg');
  if(bg){const code=c.weather_code;bg.className='weather-bg '+(!c.is_day?'clear-night':code>=95?'storm':code>=51&&code<=82?'rain':code>=2?'cloudy':'clear-day')}
  const wind=Number(c.wind_speed_10m)||0,temp=Number(c.temperature_2m),rain=Number(c.precipitation)||0;
  const items=[['🚶','المشي',wind>35||rain>1?'غير ملائم حاليًا':temp>=37?'يفضل وقت أبرد':'ملائم غالبًا'],['🏕️','النزهة',wind>40||rain>2?'غير ملائم حاليًا':temp>=40?'الحرارة مرتفعة':'ملائم بحذر'],['🚗','القيادة',wind>55||rain>5?'انتبه للظروف الجوية':'لا مؤشرات مرتفعة في البيانات']];
  document.getElementById('activityGrid').replaceChildren(...items.map(([icon,name,label])=>{const el=document.createElement('div');el.className='activity-tile';const a=document.createElement('strong');a.textContent=icon+' '+name;const b=document.createElement('small');b.textContent=label;el.append(a,b);return el}));
 };
 update();setInterval(()=>{if(!document.hidden)update()},3000);
});
