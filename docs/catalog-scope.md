# Herbanium Catalog Scope

> Established April 2026 after the original-30 catalog audit.
> This document defines what's in, what's targeted for addition,
> what's deferred, and what's explicitly out of scope. The goal
> is to prevent re-auditing the same questions and to surface
> medical/legal flags before they become research blockers.
>
> Maintained alongside research files in `docs/research/`.

---

## Status overview

| Tier | Count | Status |
|------|-------|--------|
| Original catalog (Phase 0) | 30 | Researched; effect arrays pending app integration |
| Phase A targets | 6 | Identified; research in progress |
| Phase B targets | ~7 | Identified; research scheduled after Phase A |
| Phase C / Tier 3 (deferred) | ~17 | Documented for future consideration |
| Phase X / Tier 4 (out of scope) | many | Explicitly skipped |
| **Final target catalog** | **~46** | After Phase A + B complete |

---

## Phase 0 — Original catalog (30 ingredients, complete)

Researched following template v4, vocabulary v1.

**True teas (10):**
- assam, ceylon, darjeeling, dragonwell, gunpowder, gyokuro,
  hojicha, lapsang, oolong, puerh, sencha, white

**Herbals & florals (10):**
- chamomile, hibiscus, jasmine, lavender, lemon-balm, lemongrass,
  passionflower, peppermint, rooibos, rose, spearmint, tulsi,
  fennel, passionflower

**Spices (5):**
- cardamom, cinnamon, cloves, ginger, vanilla

(Counts overlap because "true teas" lists 10 and includes
sencha, gyokuro, etc.; the actual total is 30 distinct
ingredients across all categories. See `app-data-updates-pending.md`
for the canonical list.)

---

## Phase A — Tier 1 must-fills (6 ingredients, in progress)

The biggest gaps for a serious tea catalog. Each forces a useful
vocabulary or category-structure decision.

| Ingredient | Why | Vocabulary test |
|-----------|-----|----------------|
| **Matcha** | Iconic Japanese ceremonial; dominant in modern wellness; whole-leaf consumption is new mechanic | Tests `focus` 5 / `energy` 4 zone; whole-leaf consumption as new pattern |
| **Yerba mate** | 30+ million daily drinkers in South America; growing Western market; the caffeinated-herbal test case | Tests Principle #16 (caffeine as property); category-structure validation |
| **Valerian** | Classic Western sleep specialist; was on potential-adds list | Tests `sleepy` 5 ceiling for catalog |
| **Echinacea** | Classic North American/European immune-support herb; conspicuous absence from a serious catalog | Tests "immune-support" effect gap (likely maps imperfectly to `soothing`) |
| **Licorice root** | Universal blend ingredient (chai, throat blends, TCM harmonizer); strong unique flavor | Significant safety flag (BP/potassium with chronic use) — tests honest disclosure handling |
| **Genmaicha** | Common Japanese green tea (sencha + roasted brown rice); meaningfully different from sencha | Tests Principle #18 (same-plant-different-prep); roasted-grain character |

**Provisional adds from earlier sessions (unchanged):**
- **Turmeric** — researched; provisional Phase A inclusion
- **Ashwagandha** — researched; provisional Phase A inclusion

**Phase A complete count:** 38 ingredients (30 original + 6 new + 2 provisional)

---

## Phase B — Tier 2 strong adds (~7 ingredients, scheduled)

Strong supporting fills after Phase A. Each addresses a clear
catalog gap.

| Ingredient | Why |
|-----------|-----|
| **Reishi mushroom** (*Ganoderma lucidum*) | "Queen of mushrooms" in TCM; tests `grounding` 5 (deeper than ashwagandha); establishes mushroom subcategory per Principle #17 |
| **Lion's mane mushroom** (*Hericium erinaceus*) | Cognitive-support mushroom; modern wellness staple; with reishi establishes mushroom subcategory |
| **Black pepper** | Critical bioavailability companion to turmeric (Shoba 1998 piperine effect); chai component; not a primary tea but completes golden-milk preparation logic |
| **Nettle** (*Urtica dioica*) | Mineral-rich Western herbal; spring tonic / allergy-support tradition |
| **Dandelion** (root + leaf as 2 entries per Principle #18) | Liver-support tradition; coffee substitute (root roasted); diuretic (leaf) |
| **Linden / Tilia flower** | Major European calming flower; conspicuous absence in floral-calming cluster alongside chamomile, lavender |
| **Elderflower** (and possibly elderberry as separate per Principle #18) | Major European immune-support; increasingly mainstream in US |

**Other Tier 2 candidates that may slot in:**
- Honeybush (rooibos sister; less commercial availability)
- Rosehip (Vitamin C classic; Mediterranean tradition)
- Star anise (chai variant; chemically similar to fennel)

**Phase B complete count:** ~46 ingredients depending on final
selections.

---

## Phase C / Tier 3 — deferred for future review

> **Critical note:** Tier 3 ingredients are deferred not because
> they lack cultural significance but because most carry
> medical-interaction concerns that require additional auditing
> and legal/regulatory review before adding to a wellness-
> adjacent product. This is a deliberate scope boundary, not an
> oversight.

**Cardiovascular/medication-interaction sensitive:**
- **St. John's Wort** — Major drug interactions (CYP450
  inducer affecting many medications); meaningful clinical
  efficacy for mild depression but legal/regulatory risk too
  high without dedicated review
- **Hawthorn** (*Crataegus*) — Cardiovascular tonic;
  interactions with cardiac medications
- **Ginkgo biloba** — Antiplatelet effects; interactions
  with anticoagulants, surgery contraindications

**Hormonal/reproductive system:**
- **Saffron** — Mood support evidence; some use in
  fertility/menopausal contexts; pregnancy precautions
- **Sage** (*Salvia officinalis*) — Some use for menopausal
  hot flashes; thujone content concerns at high doses
- **Black cohosh, dong quai, vitex** — Women's health
  herbals with varying evidence; require dedicated framing

**Strong nervines / sleep specialists beyond valerian:**
- **Skullcap** (*Scutellaria*) — Western nervine
- **California poppy** — Mild opiate-receptor activity
- **Kava** — Hepatotoxicity concerns
- **Passionvine combinations**

**Mushrooms beyond reishi/lion's mane:**
- **Chaga** — Antioxidant focus; oxalate concerns at high
  doses
- **Cordyceps** — Athletic performance; immune-modulation
  in autoimmune contexts complex
- **Turkey tail, maitake** — Immune-modulation specialty

**Specialty single-tradition herbs:**
- **Marshmallow root** (*Althaea*) — Throat-soothing
  mucilaginous; safe but specialty
- **Mullein** (*Verbascum*) — Respiratory specialty
- **Yarrow** (*Achillea*) — Fever/wound European tradition
- **Coriander seed** — Common in Indian preparations; minor
  as standalone tea

**Tea variety splits (Principle #18 candidates):**
- Tulsi varieties (Krishna, Rama, Vana) — splitting current
  single tulsi entry
- Oolong cultivars (Tieguanyin, Da Hong Pao, Big Red Robe) —
  splitting current single oolong entry
- White tea distinctions (Silver Needle / Yin Zhen vs. Bai Mu
  Dan) — splitting current single white tea entry

**Visual/novelty:**
- **Butterfly pea flower** — Color-changing visual interest;
  Instagram popularity; minimal pharmacological depth

### Phase C requirements before any addition

To move any Tier 3 ingredient to active research:
1. Dedicated medical-interaction audit (consultation with
   licensed practitioner or ND if budget permits)
2. Legal/regulatory review for jurisdiction-specific concerns
   (some herbs are scheduled or restricted in some US states /
   EU member states / Canadian provinces)
3. Safety-flag handling pattern (separate "do not use if..."
   field? prominent UI treatment?) designed before researching
4. Liability/disclaimer language reviewed with legal counsel

This is deliberate caution. The product's value rests on being
trustworthy about safety; over-reaching into medication-
interaction territory without dedicated review damages that
foundation.

---

## Phase X / Tier 4 — explicitly skipped

> Documented to prevent re-auditing.

**Too rare or specialty:**
- Yellow tea (*huangcha*) — extremely rare Chinese tea variety
- Specific Yunnan black tea variants
- Da Hong Pao or other specific Wuyi rock teas (covered by
  general "oolong")

**Too regional or niche:**
- Ivan chai (fireweed, *Chamerion angustifolium*) —
  regional Russian tradition; minimal Western recognition
- Blue lotus (*Nymphaea caerulea*) — niche psychoactive
  history; legal complications in some jurisdictions

**Use-case too narrow:**
- Burdock root — niche Western herbalism
- Red clover — phytoestrogen specialty
- Raspberry leaf — pregnancy-specific tradition
- Calendula — primarily topical use
- Magnolia, honeysuckle — niche florals
- Bilberry — eye-health specialty
- Milk thistle — liver-protective specialty (medical)

**Mulling spices (covered via existing entries):**
- Allspice, nutmeg, mace — minor in tea contexts; better as
  blend ingredients than catalog entries

**Reasoning summary:** The catalog targets ingredients that
typical Western tea drinkers will encounter, recognize, or
benefit from finding. Tier 4 ingredients fall below that
recognition threshold for the foreseeable future. Future
expansion may revisit if user demand surfaces, but default
is "skip."

---

## Maintenance

This document is updated whenever:
- A Phase A or B ingredient completes research (move to "Phase 0")
- An audit identifies new Tier 3 or 4 candidates
- A Tier 3 ingredient passes its medical/legal review (move to
  Phase B or C)
- A Principle changes that affects categorization

Versioning: filename includes date of last major revision
(this is `catalog-scope_2026-04.md`).
