## Aurora 3.1.1 — رابط موقع القبلة
- إضافة خانة «🧭 موقع القبلة» ضمن الخدمات أسفل الصفحة مباشرة فوق حقوق «سلطان أبو هتان».
- تفتح الخانة Google Qibla Finder في تبويب خارجي مستقل دون تضمين الخدمة داخل موقع الطقس؛ وقد يحتاج المستخدم إلى السماح بالموقع/الكاميرا عبر خدمة Google نفسها.
- تحسين شكل روابط الخدمات للهواتف وإبراز خانة القبلة.
- رفع إصدار تخزين ملفات الموقع في Service Worker لضمان وصول التغيير عند تحديث التطبيق.
- الإبقاء على وظائف الطقس والرادار وGPS وباقي الميزات دون تعديل.

# Aurora 3.1 — Reliability Update

## Changes
- Robust 15-second network request timeout, structured response validation, and independent weather/air/model failure handling.
- Source timestamp + last successful retrieval timestamp in Saudi local time, with explicit warning for cached or aged model data.
- Explicit Network-First Service Worker policy for Open-Meteo (up to 10 minutes cached fallback only; labelled as cached). No cache for radar tiles or external libraries.
- Retain previous successful forecasts for the same location if a refresh fails, with prominent error state. Clear old location forecasts immediately when switching cities.
- Updated accessible status banner and dynamic display cleanup when a different location is unavailable.
- Preserved GPS, radar, season/tawale, salary, charts, and Plus preview.

## Testing and deployment
- Upload the ZIP contents as the site's publish directory in Netlify.
- Verify network, API failures, and device permissions. Test offline refresh after an online visit (short-term data fallback is visibly marked).
- Note that GPS geolocation accuracy is not weather forecast accuracy; model outputs are not direct local measurements.
- Review API/radar licenses before showing ads or selling subscriptions.

## Compatibility note
The refresh is intentionally conservative: existing global bindings between app.js and studio.js remain unchanged because forcing module isolation without refactoring the dependent code would break existing features.
