---
name: OSM lookup services
description: Rules for using Overpass/Nominatim from the mobile app (headers + privacy disclosure)
---

- Overpass (`overpass-api.de`) and Nominatim (`nominatim.openstreetmap.org`) reject requests without a proper `User-Agent` header (406). Always set an app-identifying UA.
- **Why:** Compliance review failed the pharmacy-finder feature when the location permission copy claimed location is "never shared" while coordinates were sent to OSM services.
- **How to apply:** Any feature sending coordinates or search text to a third party must disclose it in three places: the OS permission string (app.json), an in-app note on the screen, and the privacy policy's "What leaves your device" section. Never claim "never shared" if any third-party lookup occurs.
- Prescription/health-document exports must never fabricate patient identity as fallback (e.g. "John Doe") — show "Not provided" for missing fields.
