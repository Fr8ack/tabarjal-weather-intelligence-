# Quran source and commercial-release checklist

Arabic Quran text is requested from AlQuran Cloud in the `quran-uthmani` edition. The actual text source/curation is attributed to the **Tanzil Project**, licensed under **CC BY 3.0**. Do not modify Quran verse text. Preserve attribution and full license in the shipped artifact. Tanzil Quran Text Copyright (C) 2007–2024 Tanzil Project. See https://tanzil.net/docs/Text_License and https://tanzil.net/updates/.

Text is not bundled in this ZIP: the user must fetch it once and download into local IndexedDB. Validation rejects missing surahs, missing verses, and any full download other than 114 surahs / 6,236 verses. Independent authoritative verification is necessary before public launch.

Audio prototype: The reciter list and audio links are obtained from AlQuran Cloud. **Recording rights remain with the reciters/rightsholders**; the provider's terms specifically describe noncommercial redistribution and may permit takedown requests. Disable commercial streaming/download until permissions and hosting contracts are resolved: https://alquran.cloud/terms-and-conditions. This proof of concept is NOT cleared for paid distribution.

Plus subscriptions and ads are NOT implemented or secured. Gating needs verified server-side entitlement + store payments when deployed natively, together with licenses, privacy policy, and tested offline playback.
