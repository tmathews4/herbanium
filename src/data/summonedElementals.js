import { ATTRIBUTES } from "./attributes.js";

/* ──────────────────────────────────────────────────────────────
   data/summonedElementals.js — which elementals you have SUMMONED.

   Two surfaces answered this question and answered it differently,
   because neither of them was asking it.

   Profile counted `seenElementalIds.size` — every id the user has ever
   dismissed a card for. Field Notes built its arrivals log from earned
   and wild elementals filtered by that same set, and then pushed the
   creation elemental on top. Those are three different populations,
   and they diverged in two independent ways:

   1. THE CREATION ELEMENTAL WAS NEVER MARKED SEEN. Every other card's
      dismissal calls markElementalSeen(id); the omen's calls
      dismissOmen() and nothing else. So `_creation` appeared in the
      log — gated on omenShown alone — and never entered the set
      Profile counted. The log read exactly one higher, always. That is
      the 8-against-9 a field pass reported.

   2. SEEN IS NOT EARNED. The set can hold ids the account does not
      currently earn, and the log intersects with earned while Profile
      did not. On the dev seed that is ten against three.

   An earlier fix pointed both at seenElementalIds and closed the
   opposite direction — Profile had been counting things the user had
   not met yet — which is how a half-corrected number ends up looking
   settled. The lesson is that copying one surface's number into the
   other never had a right answer: the question itself was undecided.

   IT IS DECIDED HERE, ONCE. Summoned means: earned or rolled, AND
   observed by tapping the lodestone — plus the creation elemental
   once the omen has been dismissed, because dismissing the omen IS
   the first act of observing the stone. Both surfaces read this, so
   they cannot drift again; the arrivals log spells the same list out
   with names and dates, and Profile counts its length.
   ────────────────────────────────────────────────────────────── */

/** The unique per-profile elemental, which has no entry in the
 *  attribute table because it is generated from the user's own title. */
export const CREATION_ELEMENTAL_ID = "_creation";

/* EARNED IS DERIVED HERE, not handed in, and that was the third
   divergence. Field Notes read the rolled-id store — what the chance
   roller actually granted, which is a fact that persists. Profile
   re-ran `evaluateAttributes` and asked whether each attribute's
   condition is met RIGHT NOW. Those are different populations: a grant
   you were given stays given, while a live condition can stop being
   true. ElementalsView's own comment says the predicate path "was
   retired ... no longer consulted on every render"; Profile was still
   on it, which is how a fix that unified everything else still read 7
   against 3.

   So callers pass the STORE and this decides what it means. Neither
   can re-derive it differently, because neither derives it. */

/**
 * @param rolledIds        Set (or array) of attribute ids the roller granted
 * @param wild             chance-rolled elementals, which carry their own ids
 * @param seenIds          Set (or array) of ids observed at the lodestone
 * @param hasCreationTitle whether a profile exists to generate one from
 * @param omenShown        whether the omen card has been dismissed
 * @returns ids, earned-then-wild-then-creation — the order the arrivals
 *          log builds in, before it sorts by timestamp.
 */
export function summonedElementalIds({
  rolledIds,
  wild = [],
  seenIds,
  hasCreationTitle = false,
  omenShown = false,
} = {}) {
  const asSet = (v) => (v instanceof Set ? v : new Set(v || []));
  const rolled = asSet(rolledIds);
  const seen = asSet(seenIds);
  const ids = [];
  // ATTRIBUTES order, so the list reads the same on both surfaces.
  for (const a of ATTRIBUTES) if (rolled.has(a.id) && seen.has(a.id)) ids.push(a.id);
  for (const w of wild) if (w && seen.has(w.id)) ids.push(w.id);
  /* NOT FILTERED BY `seen`, and that is not the bug being fixed — it is
     the reason the bug was invisible. Nothing ever puts `_creation`
     into the set, so filtering on it here would drop the elemental
     from both surfaces instead of from one. `omenShown` is the flag
     that actually records the observation. */
  if (hasCreationTitle && omenShown) ids.push(CREATION_ELEMENTAL_ID);
  return ids;
}
