# Soil Map

A phone-first soil-sample map for the UC Davis EnvironMentors chapter (session 2026-10-07). Students score a soil sample they brought from home, a park, or school (color, texture by feel, moisture, roots, critters, vinegar fizz, optional pH strip), drop its location, write a one-line hypothesis about how plants would grow in it, and the class map fills in live. Each sample is compared with what the USDA soil survey says is at that spot.

- **Phones:** `https://greymonroe.github.io/em-soil-map/`
- **Projector:** `https://greymonroe.github.io/em-soil-map/screen.html` (QR, live map colored by texture / color / pH / fizz, ours vs. survey table)
- **Another session:** add `?s=<survey-id>` to both URLs (default `em-2026-10-07`). Lowercase letters, numbers, dashes. Testing uses `?s=test-...`.

## Privacy (samples often come from students' homes)
- No names, no accounts: anonymous Firebase session, and no uid is stored with a sample.
- The exact point (GPS, map tap, or typed) **never leaves the phone except to the USDA soil-database query**. What gets saved is rounded to 0.01° (about 1 km), stored as integers `lat100` / `lng100`; the database rules reject anything finer, so an exact location cannot be written even by a modified page.
- Same-cell samples are fanned out in a small ring on the projector map so they're all visible.
- The sample "nickname" is free text (≤30 chars); the page tells students not to use names or addresses.

## Public soil database
USDA NRCS **Soil Data Access** (SSURGO), queried from the phone at submit time: `https://sdmdataaccess.sc.egov.usda.gov/Tabular/post.rest` (CORS `*`, verified 2026-10-01; a Woodland point returns "Yolo silt loam, 0 to 2 percent slopes"). For the point we keep the dominant component of the map unit and its surface horizon: series name, surface texture, pH (1:1 water), organic matter %, clay %, drainage class, soil order. Each sample also links to UC Davis **SoilWeb** (`https://casoilresource.lawr.ucdavis.edu/gmap/`) at the rounded point. Urban/built-up land is often unmapped; the page says so.

Texture comparison uses four families (sandy / loamy / clay loam / clayey) so a "silt loam" vs "loam" disagreement still counts as a match at the family level.

## Data
Firebase Realtime Database of `live-poll-test` (project `live-poll-8088d`), under `soil/<survey-id>/samples/`. Rules live in `~/repos/live-poll-test/database.rules.json` (`soil` block): create-only, fixed field list, host-only delete. Nothing in this app deletes data.

Export (admin, gcloud login):
```bash
curl -s -H "Authorization: Bearer $(gcloud auth print-access-token)" \
  "https://live-poll-8088d-default-rtdb.firebaseio.com/soil/em-2026-10-07/samples.json" > samples.json
```
