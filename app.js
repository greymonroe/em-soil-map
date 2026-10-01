// Shared helpers for Soil Map.
//
// Same Firebase project as live-poll-test (live-poll-8088d), its own subtree:
//   soil/<surveyId>/config          host-only: title, date
//   soil/<surveyId>/samples/<id>    one soil sample (create-only, no uid)
// Students get an anonymous Firebase session: no prompt, no account, no names.
//
// PRIVACY: samples often come from students' homes. Coordinates are rounded to
// 2 decimals (~1 km) BEFORE they leave the phone. The exact point is used only
// on the phone, for the public soil-database lookup, and is never saved.
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getDatabase } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";
import { getAuth, onAuthStateChanged, signInAnonymously }
  from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { firebaseConfig } from "./firebase-config.js";

const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);
export const auth = getAuth(app);

export const DEFAULT_SURVEY = "em-2026-10-07";
export const surveyId =
  (new URLSearchParams(location.search).get("s") || DEFAULT_SURVEY)
    .toLowerCase().replace(/[^a-z0-9-]/g, "");
export const base = `soil/${surveyId}`;

export const ready = new Promise((resolve) => {
  let settled = false;
  const done = (u) => { if (!settled) { settled = true; resolve(u); } };
  onAuthStateChanged(auth, (user) => {
    if (user) return done(user);
    signInAnonymously(auth).catch((e) => { console.error(e); done(null); });
  });
});

// ---- what students score (matches the printed Soil Field Guide) ------------

export const COLORS = {
  black:     { label: "Black",       hex: "#2b2522" },
  darkbrown: { label: "Dark brown",  hex: "#4a3527" },
  brown:     { label: "Brown",       hex: "#7a5a3c" },
  tan:       { label: "Light brown / tan", hex: "#b89870" },
  reddish:   { label: "Reddish",     hex: "#9c4a2f" },
  yellowish: { label: "Yellowish",   hex: "#c4a04a" },
  gray:      { label: "Gray",        hex: "#8a8a84" },
};

// USDA texture classes (texture-by-feel flowchart), grouped into 4 families so
// students can compare their result with the database even when the exact
// class differs.
export const FAMILIES = {
  sandy:    { label: "Sandy",     hex: "#e0b84f" },
  loamy:    { label: "Loamy",     hex: "#8a6d3b" },
  clayloam: { label: "Clay loam", hex: "#b5543a" },
  clayey:   { label: "Clayey",    hex: "#6b3fa0" },
};
export const TEXTURES = {
  "sand":            "sandy",
  "loamy sand":      "sandy",
  "sandy loam":      "sandy",
  "loam":            "loamy",
  "silt loam":       "loamy",
  "silt":            "loamy",
  "sandy clay loam": "clayloam",
  "clay loam":       "clayloam",
  "silty clay loam": "clayloam",
  "sandy clay":      "clayey",
  "silty clay":      "clayey",
  "clay":            "clayey",
};

// Database texture strings look like "Silt loam" or "Gravelly sandy loam".
// Match the longest USDA class name contained in the string.
export function familyOf(texture) {
  if (!texture) return null;
  const t = texture.toLowerCase();
  const hit = Object.keys(TEXTURES)
    .filter((k) => new RegExp(`(^|\\s)${k}$`).test(t) || t === k)
    .sort((a, b) => b.length - a.length)[0];
  return hit ? TEXTURES[hit] : null;
}

export const MOISTURE = { dry: "Dry", moist: "Moist", wet: "Wet" };
export const ROOTS    = { none: "None", few: "A few", many: "Lots" };
export const FIZZ     = { none: "No fizz", slight: "A little fizz", strong: "Lots of fizz" };

// ---- public soil database: USDA NRCS Soil Data Access (SSURGO) ------------
// CORS-enabled (Access-Control-Allow-Origin: *), verified 2026-10-01 with a
// Woodland CA point -> "Yolo silt loam".
const SDA = "https://sdmdataaccess.sc.egov.usda.gov/Tabular/post.rest";

export async function lookupSoil(lat, lng) {
  const pt = `point(${lng.toFixed(6)} ${lat.toFixed(6)})`;
  const q = `SELECT TOP 1 mu.muname, c.compname, c.comppct_r, c.taxorder, c.drainagecl,
      h.ph1to1h2o_r, h.om_r, h.sandtotal_r, h.silttotal_r, h.claytotal_r, tg.texdesc
    FROM mapunit mu
    INNER JOIN component c ON c.mukey = mu.mukey
    LEFT JOIN chorizon h ON h.cokey = c.cokey AND h.hzdept_r = 0
    LEFT JOIN chtexturegrp tg ON tg.chkey = h.chkey AND tg.rvindicator = 'Yes'
    WHERE mu.mukey IN (SELECT * FROM SDA_Get_Mukey_from_intersection_with_WktWgs84('${pt}'))
    ORDER BY c.comppct_r DESC`;
  const r = await fetch(SDA, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query: q, format: "JSON+COLUMNNAME" }),
  });
  if (!r.ok) throw new Error(`Soil database ${r.status}`);
  const j = await r.json();
  if (!j.Table || j.Table.length < 2) return null;
  const [cols, row] = j.Table;
  const o = Object.fromEntries(cols.map((c, i) => [c, row[i]]));
  const num = (v) => (v === null || v === "" || isNaN(+v) ? null : +v);
  return {
    dbMap:     (o.muname || "").slice(0, 120),
    dbSeries:  (o.compname || "").slice(0, 60),
    dbTexture: (o.texdesc || "").slice(0, 60),
    dbPh:      num(o.ph1to1h2o_r),
    dbOm:      num(o.om_r),
    dbClay:    num(o.claytotal_r),
    dbDrain:   (o.drainagecl || "").slice(0, 40),
    dbOrder:   (o.taxorder || "").slice(0, 30),
  };
}

// SoilWeb (UC Davis California Soil Resource Lab) link-out, centered on the
// ROUNDED point only.
export const soilwebUrl = (lat, lng) =>
  `https://casoilresource.lawr.ucdavis.edu/gmap/?loc=${lat},${lng},z14`;

export function escapeHtml(s) {
  return String(s ?? "").replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
}
