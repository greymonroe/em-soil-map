#!/usr/bin/env python3
"""Pull a Soil Report survey out of Firebase into CSV + photo files.

    python3 analysis/export.py                 # survey em-2026-10-07
    python3 analysis/export.py test-e2e-...    # another survey id

Reads with Grey's gcloud admin login (bypasses the rules), same as
em-campus-census/analysis/export.py. Writes analysis/out/<survey>/samples.csv,
analysis/out/<survey>/photos/<sample-id>_<slot>.jpg, and a timestamped raw
backup in analysis/out/<survey>/backups/ (never overwritten).
"""
import base64, csv, datetime, json, pathlib, subprocess, sys, urllib.request

DB = "https://live-poll-8088d-default-rtdb.firebaseio.com"
sid = sys.argv[1] if len(sys.argv) > 1 else "em-2026-10-07"
out = pathlib.Path(__file__).parent / "out" / sid
(out / "photos").mkdir(parents=True, exist_ok=True)

token = subprocess.check_output(["gcloud", "auth", "print-access-token"], text=True).strip()

def get(path):
    req = urllib.request.Request(f"{DB}/{path}.json", headers={"Authorization": f"Bearer {token}"})
    with urllib.request.urlopen(req) as r:
        return json.load(r) or {}

raw = get(f"soil/{sid}")
stamp = datetime.datetime.now().strftime("%Y%m%d-%H%M%S")
(out / "backups").mkdir(exist_ok=True)
(out / "backups" / f"{sid}-{stamp}.json").write_text(json.dumps(raw))

samples = raw.get("samples") or {}
cols = ["id", "time", "group", "label", "lat", "lng", "locSource", "place", "site",
        "color", "ball", "ribbon", "grit", "texture", "structure", "moisture", "roots", "organic", "rocks", "smell",
        "critters", "critterKinds",
        "phV", "phKit", "nL", "nV", "nKit", "pL", "pV", "pKit", "kL", "kV", "kKit", "nh3L", "nh3V", "nh3Kit",
        "photos", "dbMap", "dbSeries", "dbTexture", "dbPh", "dbOm", "dbClay", "dbDrain", "dbOrder",
        "r1_environment", "r2_elsewhere", "r3_hypothesis", "r4_easy_hard"]
with open(out / "samples.csv", "w", newline="") as fh:
    w = csv.DictWriter(fh, fieldnames=cols)
    w.writeheader()
    for k, s in sorted(samples.items(), key=lambda kv: kv[1].get("ts", 0)):
        ts = s.get("ts")
        r = s.get("reflect") or {}
        row = {c: s.get(c, "") for c in cols}
        row.update(id=k, time=datetime.datetime.fromtimestamp(ts / 1000).isoformat(timespec="seconds") if ts else "",
                   r1_environment=r.get("r1", ""), r2_elsewhere=r.get("r2", ""),
                   r3_hypothesis=r.get("r3", ""), r4_easy_hard=r.get("r4", ""))
        w.writerow(row)

n = 0
for k, slots in (raw.get("photos") or {}).items():
    for slot, p in slots.items():
        data = p.get("data", "")
        if data.startswith("data:image/jpeg;base64,"):
            (out / "photos" / f"{k}_{slot}.jpg").write_bytes(base64.b64decode(data.split(",", 1)[1])); n += 1

print(f"{len(samples)} samples, {n} photos -> {out}")
