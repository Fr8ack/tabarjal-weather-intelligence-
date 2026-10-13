# طقس طبرجل الذكي — Aurora 3.3

نسخة تحسين **مصادر التنبؤ ومقارنة النماذج** مع الاحتفاظ بإضافات Aurora 3.2.

راجع `CHANGELOG-3.3.md` للتفاصيل.

الملف الأساسي `index.html`، ويمكن رفع محتويات المجلد إلى Netlify.


## Aurora 3.4 — خرائط البر الذكية

افتح `desert-maps.html` من الموقع. أُضيفت خرائط تفاعلية متصلة، تحديد موقع GPS، تسجيل مسار GPX، استيراده وتصديره، علامات محفوظة محليًا، ومؤشر العودة المباشرة لنقطة البداية.

**أوفلاين:** يستورد المستخدم ملفات PMTiles مرخصة (متجهة وفق مخطط Protomaps أو صور raster)، وتُحفظ محليًا بـ IndexedDB. تحتاج مكتبات MapLibre وPMTiles إلى تحميل أولي عند الاتصال؛ Service Worker يخزن نسخًا محددة من مكتبات الخريطة بعد زيارتها. افصل الإنترنت واختبر الخريطة على نفس الجهاز.

**ما لم يُنفّذ:** تنزيل حزم جميع مناطق السعودية بضغطة واحدة، الملاحة صوتيًا على الطرق، DEM/تضاريس دقيقة، محرك AI توليدي دون إنترنت، أو ملاحة GPS في خلفية iPhone. نحتاج بيانات OSM مستضافة بصيغة PMTiles ورخصتها واضحة قبل إضافة قائمة التنزيل.

## Aurora 3.5 Quran Reader
- `quran.html`, `quran.css`, `quran.js` provide separate Quran reader.
- The free/Plus separation is **design-only**, not a secure commercial entitlement system. All pages remain accessible until payments/entitlements are implemented.
- User-initiated offline textual Quran download into IndexedDB; 114 surahs / 6236 ayahs validated.
- Audio is an experimental PERSONAL-use prototype; see `CREDITS-QURAN.md` for licensing. No commercial audio rights granted.
