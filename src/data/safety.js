/* ──────────────────────────────────────────────────────────────
   data/safety.js — ingredient-interaction safety rules.

   Pair- and group-level interactions among catalog ingredients that
   warrant flagging when present in the same cup. Single-ingredient
   cautions live on each ingredient's `headsUp` field; this module
   handles only combinations.

   Severity:
   - high:     generator-blocked (synthetic blends will never produce
               this combo) and surfaced as a red banner in Compose.
   - moderate: surfaced as a soft warning in Compose; not generator-
               blocked since several appear in valid traditional
               blends (e.g. valerian + passionflower + lemonbalm).

   Each rule has:
   - id        stable key
   - severity  "high" | "moderate"
   - title     short label for the banner
   - message   one-sentence user-facing explanation
   - test      (idSet) => bool — true when the combo is present
   ────────────────────────────────────────────────────────────── */

const allIn = (set, ids) => ids.every(id => set.has(id));
const countIn = (set, ids) => ids.reduce((n, id) => n + (set.has(id) ? 1 : 0), 0);

export const INGREDIENT_INTERACTIONS = [
  // ─── HIGH severity — blocked in generators, red banner in UI ───
  {
    id: "licorice-hibiscus",
    severity: "high",
    title: "Licorice + hibiscus",
    message: "Licorice can raise blood pressure; hibiscus can lower it. Together they can be unpredictable on the cardiovascular system — talk to your doctor first, especially if you take heart or blood-pressure medications.",
    test: ids => allIn(ids, ["licorice-root", "hibiscus"]),
  },
  {
    id: "licorice-nettle",
    severity: "high",
    title: "Licorice + nettle",
    message: "Licorice can lower potassium and nettle is gently diuretic — together they can amplify potassium loss enough to affect heart rhythm. Talk to your doctor before combining daily.",
    test: ids => allIn(ids, ["licorice-root", "nettle"]),
  },
  {
    id: "licorice-dandelion-leaf",
    severity: "high",
    title: "Licorice + dandelion leaf",
    message: "Licorice can lower potassium and dandelion leaf is a diuretic. The combination can amplify electrolyte changes — talk to your doctor first if you have heart or kidney conditions.",
    test: ids => allIn(ids, ["licorice-root", "dandelion-leaf"]),
  },
  {
    id: "licorice-dandelion-root",
    severity: "high",
    title: "Licorice + dandelion root",
    message: "Licorice can lower potassium and dandelion root is diuretic and gallbladder-active. Talk to your doctor before combining, especially with high blood pressure, heart conditions, or active gallbladder issues.",
    test: ids => allIn(ids, ["licorice-root", "dandelion-root"]),
  },
  {
    id: "valerian-ashwagandha",
    severity: "high",
    title: "Valerian + ashwagandha",
    message: "Both are strongly calming. Combining them stacks sedation more than expected — talk to your doctor first, and don't drive after either.",
    test: ids => allIn(ids, ["valerian", "ashwagandha"]),
  },

  // ─── MODERATE severity — UI banner only ────────────────────────
  {
    id: "echinacea-reishi",
    severity: "moderate",
    title: "Echinacea + reishi",
    message: "Echinacea is associated with short-term immune support; reishi is associated with longer-term immune modulation. They work in opposite directions — pick one path, especially with autoimmune conditions.",
    test: ids => allIn(ids, ["echinacea", "reishi"]),
  },
  {
    id: "echinacea-ashwagandha",
    severity: "moderate",
    title: "Echinacea + ashwagandha",
    message: "Echinacea is associated with short-term immune support; ashwagandha is associated with immune modulation. They work in opposite directions — both warrant caution with autoimmune conditions.",
    test: ids => allIn(ids, ["echinacea", "ashwagandha"]),
  },
  {
    id: "sedative-trifecta",
    severity: "moderate",
    title: "Heavy calming stack",
    message: "Three or more strongly calming herbs in one cup stack sedation more than expected. Fine occasionally; don't drive after, and skip pairing with alcohol or sleep medications.",
    test: ids => countIn(ids, ["valerian", "passionflower", "chamomile", "lavender", "lemonbalm", "ashwagandha"]) >= 3,
  },
  {
    id: "vitamin-k-stack",
    severity: "moderate",
    title: "Nettle + dandelion leaf — vitamin K",
    message: "Both are high in vitamin K. If you take warfarin, inconsistent intake of this pair can affect your dose — stay consistent or talk to your doctor.",
    test: ids => allIn(ids, ["nettle", "dandelion-leaf"]),
  },
  {
    id: "antiplatelet-stack",
    severity: "moderate",
    title: "Mildly blood-thinning stack",
    message: "Reishi, lion's mane, ginger, and turmeric each have mild blood-thinning properties. Two or more daily can compound the effect — talk to your doctor first if you take blood thinners or are scheduled for surgery.",
    test: ids => countIn(ids, ["reishi", "lions-mane", "ginger", "turmeric"]) >= 3,
  },
];

// Build a Set of ingredient ids, accepting either id strings or
// objects shaped { id }.
function toIdSet(ingredients) {
  const set = new Set();
  for (const x of ingredients || []) {
    if (typeof x === "string") set.add(x);
    else if (x && x.id) set.add(x.id);
  }
  return set;
}

// Returns matched interaction rules for the given ingredient list.
// Result is sorted high-severity first.
export function checkIngredientInteractions(ingredients) {
  const ids = toIdSet(ingredients);
  if (ids.size === 0) return [];
  const matched = INGREDIENT_INTERACTIONS.filter(rule => rule.test(ids));
  matched.sort((a, b) => (a.severity === "high" ? -1 : b.severity === "high" ? 1 : 0));
  return matched;
}

// Generator-side check: does the current ingredient set contain any
// HIGH-severity interaction? Used to validate generated blends.
export function hasUnsafeCombination(ingredients) {
  const ids = toIdSet(ingredients);
  return INGREDIENT_INTERACTIONS
    .filter(r => r.severity === "high")
    .some(r => r.test(ids));
}

// Generator-side check: would adding `newId` to `currentIds` create a
// HIGH-severity interaction? Used by the candidate-picking helpers to
// filter out unsafe additions before they're chosen.
export function wouldCreateUnsafeCombination(currentIds, newId) {
  const projected = new Set(currentIds);
  projected.add(newId);
  return INGREDIENT_INTERACTIONS
    .filter(r => r.severity === "high")
    .some(r => r.test(projected));
}
