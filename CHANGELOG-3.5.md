# Aurora 3.5 – Quran reader (prototype)

- Added independent `quran.html` Arabic-responsive reader and homepage shortcut.
- Light/dark theme, surah list (114), search by name/number, bookmarks and ayah markers, font size control.
- Text sourced from `quran-uthmani` via AlQuran Cloud with Tanzil attribution and IndexedDB offline download; full-corpus sanity validation 114/6236.
- Prototype audio reciter listing, sequential ayah playback, browser Cache Storage downloads and deletion, no commercial license assumed.
- Homepage premium copy adjusted to mention planned Quran inclusion; **no real paywall, billing or ads**.
- Service worker shell cache updated to include Quran files; optional audio fallback after network failure.
- Before commercial release verify text independently, audio permissions, API suitability, billing, authentication, and offline behaviors on actual devices.
