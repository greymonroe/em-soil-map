// Shared helpers for Soil Report.
//
// Same Firebase project as live-poll-test (live-poll-8088d), its own subtree:
//   soil/<surveyId>/config                 host-only: title, date
//   soil/<surveyId>/samples/<id>           one student's sample (create-only)
//   soil/<surveyId>/samples/<id>/reflect   reflection answers; only the phone that
//                                          made the sample can write them (uid match)
//   soil/<surveyId>/photos/<id>/<slot>     photos for sample <id> (soil, ph, n, p, k,
//                                          nh3), kept separate so the live screen never
//                                          downloads them; host-read only
// Students get an anonymous Firebase session: no prompt, no account, no names.
// Location is saved at full precision (Grey 2026-10-06: no privacy concern).
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

// ---- groups (sticky-note colors, same as Campus Census) ------------------
export const GROUPS = {
  1: { name: "Yellow", hex: "#e3b505" }, 2: { name: "Orange", hex: "#f58231" },
  3: { name: "Pink",   hex: "#e84a8a" }, 4: { name: "Green",  hex: "#3cb44b" },
  5: { name: "Blue",   hex: "#4363d8" }, 6: { name: "Purple", hex: "#911eb4" },
};

// ---- where it came from --------------------------------------------------
export const PLACES = {
  garden: "Garden bed", yard: "Yard / lawn", park: "Park", school: "School field",
  farm: "Farm / orchard", roadside: "Roadside", creek: "Creek / river bank",
  potting: "Potting soil / bag", wild: "Wild / open land", other: "Other",
};

// ---- look and feel -------------------------------------------------------
// Simplified color chart (our own swatches, not Munsell chips). `means` feeds
// the report card.
export const COLORS = {
  black:      { label: "Black",           hex: "#231d1a", means: "dark" },
  vdarkbrown: { label: "Very dark brown", hex: "#3a2a20", means: "dark" },
  darkbrown:  { label: "Dark brown",      hex: "#55402e", means: "dark" },
  brown:      { label: "Brown",           hex: "#7a5a3c", means: "mid" },
  lightbrown: { label: "Light brown",     hex: "#a3825c", means: "light" },
  pale:       { label: "Pale / tan",      hex: "#cdb48e", means: "light" },
  reddish:    { label: "Reddish brown",   hex: "#8c4a30", means: "red" },
  red:        { label: "Red / orange",    hex: "#b5582f", means: "red" },
  yellowish:  { label: "Yellowish brown", hex: "#b08a3e", means: "yellow" },
  gray:       { label: "Gray",            hex: "#8a8780", means: "gray" },
  bluegray:   { label: "Blue / green gray", hex: "#6f8580", means: "gley" },
};

// USDA texture classes from the texture-by-feel flowchart (USDA NRCS, mod.
// Thien 1979), grouped into 4 families so students can compare with the
// database even when the exact class differs.
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

// Flowchart answers -> class.
//   ball:   does a moist squeezed ball hold together?  yes | no
//   ribbon: none | short (< 2.5 cm) | medium (2.5-5 cm) | long (> 5 cm)
//   grit:   gritty | smooth | neither
export function textureFrom(ball, ribbon, grit) {
  if (ball === "no") return "sand";
  if (!ribbon) return null;
  if (ribbon === "none") return "loamy sand";
  if (!grit) return null;
  const fam = { short: ["sandy loam", "silt loam", "loam"],
                medium: ["sandy clay loam", "silty clay loam", "clay loam"],
                long: ["sandy clay", "silty clay", "clay"] }[ribbon];
  return fam[{ gritty: 0, smooth: 1, neither: 2 }[grit]];
}

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

export const STRUCTURES = {
  granular: { label: "Granular",    desc: "Small crumbs, like cookie crumbs" },
  blocky:   { label: "Blocky",      desc: "Chunky blocks that break apart" },
  platy:    { label: "Platy",       desc: "Flat layers, like stacked plates" },
  single:   { label: "Single grain", desc: "Loose grains, like beach sand" },
  massive:  { label: "Massive",     desc: "One solid clump, no pattern" },
};
export const MOISTURE = { dry: "Dry, dusty", moist: "Moist", wet: "Wet, sticky" };
export const ROOTS    = { none: "None", few: "A few", many: "Lots" };
export const ORGANIC  = { none: "None", some: "Some", lots: "Lots" };
export const ROCKS    = { none: "None", some: "Some", lots: "Lots" };
export const SMELLS   = { earthy: "Earthy (like rain)", none: "No smell", sour: "Sour / rotten egg", musty: "Musty / moldy" };
export const CRITTERS = { worm: "Worms", ant: "Ants", beetle: "Beetles", grub: "Grubs / larvae",
                          spider: "Spiders", pillbug: "Pill bugs", other: "Other" };

// ---- chemistry -----------------------------------------------------------
export const LEVELS = {
  vlow: { label: "Very low / none", hex: "#f2efe6", n: 0 },
  low:  { label: "Low",       hex: "#f7d9a8", n: 1 },
  med:  { label: "Medium",    hex: "#e9a35b", n: 2 },
  high: { label: "High",      hex: "#c8602a", n: 3 },
  vhigh:{ label: "Very high", hex: "#8a2f14", n: 4 },
};
export const KITS = {
  strip:   "Strip (dip and match)",
  tube:    "Test tube / capsule (sit and wait)",
  dropper: "Dropper (add drops)",
  other:   "Other",
};
// key -> field prefix in the sample record (phV, nL, nKit ...)
export const TESTS = {
  ph:  { label: "pH",               short: "pH" },
  n:   { label: "Nitrate / Nitrogen (N)", short: "N" },
  p:   { label: "Phosphorus (P)",   short: "P" },
  k:   { label: "Potassium (K)",    short: "K" },
  nh3: { label: "Ammonia",          short: "NH₃" },
};
// pH chart colors (generic universal-indicator style).
export const PH_CHIPS = [
  [4, "#e8382f"], [4.5, "#ef5a2a"], [5, "#f47d26"], [5.5, "#f6a324"], [6, "#f3c623"],
  [6.5, "#c9d22c"], [7, "#86c440"], [7.5, "#4fae5b"], [8, "#2f9a8a"], [8.5, "#2f72b4"], [9, "#3b4fa6"],
];
export const phHex = (v) => (v == null ? null : PH_CHIPS.reduce((a, b) => (Math.abs(b[0] - v) < Math.abs(a[0] - v) ? b : a))[1]);

// ---- report card ---------------------------------------------------------
// Rule-based, deliberately general: what a reading usually means and what
// gardeners usually do about it.
export function interpret(s) {
  const out = [];
  const add = (topic, text) => out.push({ topic, text });

  if (s.phV != null) {
    const v = s.phV;
    if (v < 5.5) add("pH", `pH ${v} is strongly acidic. Few garden plants like it this sour, but blueberries, azaleas and pine trees do. Gardeners add lime (crushed limestone) to raise pH.`);
    else if (v < 6.5) add("pH", `pH ${v} is slightly acidic. Most vegetables, flowers and potatoes grow well here. Blueberries would want it a bit more acidic.`);
    else if (v <= 7.5) add("pH", `pH ${v} is about neutral. This is the sweet spot for most garden plants, from tomatoes to beans to lettuce.`);
    else if (v <= 8.5) add("pH", `pH ${v} is alkaline. Some plants (lavender, asparagus, many native shrubs) handle it fine, but iron gets harder for plants to take up, so leaves can turn yellow. Gardeners add sulfur or compost to bring pH down.`);
    else add("pH", `pH ${v} is strongly alkaline. Most plants struggle here. This can come from salts or lime-rich soil. Sulfur and lots of compost help over time.`);
  }
  const lv = (k) => LEVELS[s[k + "L"]]?.n;
  const lowHigh = (k, low, ok, high) => {
    const n = lv(k);
    if (n == null) return;
    if (n <= 1) add(TESTS[k].short, low);
    else if (n === 2) add(TESTS[k].short, ok);
    else add(TESTS[k].short, high);
  };
  lowHigh("n",
    "Nitrogen is low. Plants use nitrogen to make green leaves, so they may grow slowly and look pale. Add compost or manure, or grow beans, peas or clover: their roots host bacteria that pull nitrogen out of the air.",
    "Nitrogen is in a good middle range for most plants.",
    "Nitrogen is high. Plants will grow lots of leaves. Extra nitrate can wash out of soil into creeks and groundwater, so this soil doesn't need more fertilizer.");
  lowHigh("p",
    "Phosphorus is low. Plants need it for roots, flowers and seeds. Compost or bone meal adds phosphorus.",
    "Phosphorus is in a good middle range.",
    "Phosphorus is high. That's common where fertilizer or manure has been used. Runoff with extra phosphorus can feed algae blooms in lakes and rivers.");
  lowHigh("k",
    "Potassium is low. It helps plants handle drought and disease. Compost, wood ash (which also raises pH) or kelp meal add potassium.",
    "Potassium is in a good middle range.",
    "Potassium is high. Plants are well supplied; no need to add more.");
  if (lv("nh3") != null) {
    const n = lv("nh3");
    add("NH₃", n <= 1
      ? "Ammonia is low, which is normal: in healthy soil, microbes turn ammonia into nitrate quickly."
      : "Ammonia is on the high side. That can mean fresh manure or fertilizer, or soggy soil with little oxygen, where microbes can't convert ammonia to nitrate.");
  }

  const fam = TEXTURES[s.texture];
  if (fam === "sandy") add("Texture", "Sandy soil drains fast and warms up quickly, but it holds little water and few nutrients. Compost helps it hold both.");
  if (fam === "loamy") add("Texture", "Loamy soil is a balance of sand, silt and clay. It holds water and nutrients but still drains, which is why gardeners love it.");
  if (fam === "clayloam") add("Texture", "Clay loam holds water and nutrients well but can get sticky when wet and hard when dry. Compost loosens it.");
  if (fam === "clayey") add("Texture", "Clay soil holds lots of water and nutrients but drains slowly and packs down hard, so roots and air have a tough time. Compost and not walking on it when wet help.");

  const c = COLORS[s.color]?.means;
  if (c === "dark") add("Color", "Dark color usually means lots of organic matter (decayed plants and animals), which feeds soil life and holds water.");
  if (c === "light") add("Color", "Light color usually means little organic matter. Compost would darken and enrich it over time.");
  if (c === "red" || c === "yellow") add("Color", "Red, orange or yellow tints come from iron that has rusted. That usually means the soil gets plenty of air and drains well.");
  if (c === "gray" || c === "gley") add("Color", "Gray or blue-green colors often mean the soil stays waterlogged, so there is little oxygen and the iron doesn't rust.");

  if (s.structure === "granular") add("Structure", "Granular crumbs leave spaces for air, water and roots. That's a sign of active soil life.");
  if (s.structure === "platy" || s.structure === "massive") add("Structure", "Platy or massive soil is often compacted (from feet, cars or machines). Roots and water have trouble getting through.");
  if (s.smell === "sour") add("Smell", "A sour or rotten-egg smell means the soil has had little oxygen, usually from sitting wet.");
  if (s.smell === "earthy") add("Smell", "That earthy smell comes from geosmin, made by soil bacteria. It's a sign of living soil.");
  if ((s.critters || 0) > 0 || s.critterKinds) add("Life", "You found critters. Worms and bugs mix the soil, make tunnels for air and water, and break down dead plants.");
  return out;
}

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

// SoilWeb (UC Davis California Soil Resource Lab) link-out.
export const soilwebUrl = (lat, lng) =>
  `https://casoilresource.lawr.ucdavis.edu/gmap/?loc=${lat},${lng},z15`;

export function escapeHtml(s) {
  return String(s ?? "").replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
}
