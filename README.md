# Soil Report

A phone-first soil report for the UC Davis EnvironMentors chapter (session 2026-10-07, Hunt Hall courtyard garden). Each student enters their own sample, tagged with their group (1 to 6): where it came from (lat/long required; paste from Google Maps, GPS, or map tap), a site description, a soil photo, look/feel descriptors (color swatches, texture by feel with the ball/ribbon/grit flowchart, structure, moisture, roots, plant bits, rocks, smell, critters), and kit chemistry (pH, nitrate/N, P, K, ammonia: kit type, level, optional number, photo). Saving shows a **report card**: a rule-based interpretation plus a comparison with the USDA soil survey at that spot, then four reflection questions that are typed and saved.

- **Phones:** `https://greymonroe.github.io/em-soil-map/`
- **Projector:** `https://greymonroe.github.io/em-soil-map/screen.html` (QR, live map colored by pH, nitrate, P, K, ammonia, texture, color or group; a table of all samples)
- **Another session:** add `?s=<survey-id>` to both URLs (default `em-2026-10-07`). Testing uses `?s=test-...`.

## How it works
- The form autosaves to the phone (localStorage) as students go, so a reload or closed tab doesn't lose work. A 30-minute settle timer sits at the top (soil + distilled water settles while they fill in steps 1 to 4).
- Kit formats were unknown at build time, so each test records a kit type (strip / test tube / dropper / other), a level on a 5-step scale, and an optional number from the chart.
- Location is saved at full precision (Grey 2026-10-06: no privacy concern). If a student drops the minus sign on a California longitude, the app adds it back.
- The phone lists "Your soil reports" so a student can reopen a card and edit their reflections.

## Data
Firebase Realtime Database of `live-poll-test` (project `live-poll-8088d`), under `soil/<survey-id>/`:
- `samples/<id>`: one sample (create-only), including the creator's anonymous uid
- `samples/<id>/reflect`: reflection answers r1 to r4; only the phone that created the sample can write them
- `photos/<id>/<slot>`: slots soil, ph, n, p, k, nh3; JPEG shrunk on the phone to ≤ ~380 KB; create-only, host-read only

Rules: `~/repos/live-poll-test/database.rules.json` (`soil` block), deployed by REST PUT (see live-poll-test SECURITY.md). Nothing in this app deletes data. **Never delete a real survey.**

## After the session
```bash
python3 analysis/export.py     # -> analysis/out/em-2026-10-07/samples.csv + photos/ + backups/
```

## Public soil database
USDA NRCS **Soil Data Access** (SSURGO), queried from the phone at save time (`https://sdmdataaccess.sc.egov.usda.gov/Tabular/post.rest`, CORS `*`). For the point we keep the dominant component of the map unit and its surface horizon: series, surface texture, pH (1:1 water), organic matter %, clay %, drainage class, soil order. Each card links to UC Davis **SoilWeb**. Texture comparison uses four families (sandy / loamy / clay loam / clayey).
