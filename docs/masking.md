# Flavor & Mood Masking

How perceptual conflicts get scored in the candidate ranker, and the
literature each penalty is grounded in. Use this when adding a new
conflict pair, when retuning an existing one, or when an audit
question comes up about why a particular blend ranks where it does.

## What lives where

- `FLAVOR_CONFLICTS` and `MOOD_CONFLICTS` (`src/data/blends.js`) —
  the pairs themselves; same data the user-facing "at odds" warning
  reads from.
- `FLAVOR_MASK_STRENGTH`, `MOOD_MASK_STRENGTH` (same file) — per-pair
  masking strength, 0–1. 1 would mean "completely masks the other
  side"; 0 means "no interference." Pairs not in the table default
  to 0.5.
- `selectionScore` (`src/algo/compose.js`) — applies the strength
  table as a per-selection penalty in the ranking tiebreaker.

## Why graded values, not flat 0.5

Bitter and mint mask at completely different strengths than sweet or
floral. Treating every conflict at the same penalty either over-
penalizes the soft pairs (a sweet blend with a touch of umami gets
the same demotion as a chamomile blend with strong caffeine) or
under-penalizes the hard ones (a smoky cup buries floral aromatics in
a way no flat coefficient captures). The 0–1 strength axis is also
useful as a flavor *dominance* hierarchy when reasoning about how a
blend will read in the cup, even outside the ranker.

## Flavor masking — strengths and rationale

Higher-masking partner sets the value for the pair. Symmetric in the
table for simplicity.

| pair                | strength | reason                                                                                                                                                                                                                                                |
| ------------------- | -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| bitter / sweet      | 0.85     | Bitter T2R receptors fire at low caffeine concentrations (~0.05% by mass) and the perception lingers. Sweet rarely cancels bitter at moderate doses; bitter dominates the bitter-sweet axis. (Drewnowski 2001, *The science and complexity of bitter taste*, AJCN.) |
| bitter / honeyed    | 0.85     | Same mechanism as bitter/sweet — honeyed is a sweetness register, not a separate axis.                                                                                                                                                                |
| bitter / fruity     | 0.85     | Fruit volatiles are washed out under bitter dominance the same way they are under sweet.                                                                                                                                                              |
| minty / spiced      | 0.85     | Menthol activates TRPM8 cold receptors (Eccles 1994, *Menthol and related cooling compounds*). The trigeminal cold sensation overrides palate sensitivity to subsequent flavors — including the warming TRPV1 burn of capsaicin/ginger.              |
| smoky / floral      | 0.85     | Volatile phenols (guaiacol, syringol, 4-methylguaiacol) adsorb to mucosa and persist; delicate floral volatiles are buried near-totally. Lapsang-with-rose is a one-direction conversation.                                                            |
| smoky / citrus      | 0.85     | Same phenol-adsorption mechanism. Citrus terpenes are bright but lower-MW and rapidly displaced.                                                                                                                                                      |
| vegetal / smoky     | 0.80     | Fresh vegetal aldehydes/alcohols are volatile and short-lived; smoke carries through the cup and obscures them. Slightly less total than smoky/floral because vegetal can re-emerge on the finish.                                                  |
| roasted / floral    | 0.70     | Maillard pyrazines and furans share the adsorption profile of phenols but at lower potency. Hojicha-with-rose is muddier than lapsang-with-rose but still legible.                                                                                    |
| earthy / citrus     | 0.55     | Earthy compounds (geosmin, methylisoborneol) are heavy and persistent; citrus is bright but doesn't bury earthy and earthy doesn't completely bury citrus. Both perceivable, neither clean.                                                            |
| tart / umami        | 0.55     | High acid disrupts glutamate's umami signal — they pull in different directions on the same receptor population (T1R1/T1R3 modulation by pH).                                                                                                          |
| tart / savory       | 0.55     | Same acid-disruption pathway; savory is a broader register but the kitchen-mistake read is the same.                                                                                                                                                  |
| savory / fruity     | 0.50     | Mild — fruity volatiles carry through savory but the combination reads incoherent rather than masking.                                                                                                                                                |
| nutty / tart        | 0.45     | Nutty register holds; tart is perceivable on the finish; the conflict is more about "doesn't braid" than active masking.                                                                                                                              |
| umami / sweet       | 0.40     | Often *complement* (Japanese cooking pairs them constantly: dashi + mirin, sweet potato + kombu). The conflict label is closer to "stylistic mismatch in the same cup" than perceptual cancellation.                                                  |

Pairs not listed default to 0.5. If you add a new conflict pair that
should mask harder or softer than that, add an entry; otherwise the
default is fine.

### Implicit dominance hierarchy

Reading the table top-down gives you a rough ordering of how
aggressively each flavor competes for attention in a cup:

1. **bitter** (T2R receptors fire low and persist)
2. **mint / menthol** (TRPM8 trigeminal hijack)
3. **smoky** (phenol adsorption)
4. **roasted** (Maillard pyrazines, slightly milder)
5. **vegetal**, **earthy**, **tart** (mid)
6. **umami**, **nutty**, **citrus** (mid-low)
7. **floral**, **fruity**, **sweet**, **honeyed** (low — easily
   dominated, rarely mask others)

Worth keeping in mind whenever you're deciding what flavor a blend
"is" or whether a new ingredient is going to shout over the rest of
the cup.

## Mood masking — strengths and rationale

Mood conflicts are clinical or sensational rather than perceptual.
The strengths reflect how much the user actually feels the
contradiction.

| pair                  | strength | reason                                                                                                                                                                  |
| --------------------- | -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| energy / sleepy       | 0.75     | Direct CNS opposition. Caffeine and L-theanine balance (matcha) without canceling, but valerian + caffeine fight, and most users feel one or the other dominate.        |
| focus / sleepy        | 0.75     | Sharp focus while drowsy is rare; the GABAergic register that produces sleepy actively suppresses the catecholamine arousal that supports focus.                         |
| energy / soothing     | 0.55     | Different axes (alerting vs comforting). Coexistable but the cup reads confused.                                                                                          |
| warming / cooling     | 0.40     | Sensational, not pharmacological. Ginger + mint can cohabit in a cup (think peppermint chai); the conflict is thematic.                                                 |
| grounding / uplifting | 0.40     | Abstract opposition; the registers are about subjective orientation rather than physiological state.                                                                    |

## How the score uses these values

Per user selection (mood or flavor), the candidate gets a hit (1) if
matched, then docks `mask_strength` per conflicting tag also present
on the blend. Each per-selection contribution is clamped at 0 so a
heavy-conflict cup just stops contributing rather than driving the
total negative.

Example — user picks `energy` on a valerian-leaning blend with
`sleepy 5, energy 3` (energy/sleepy is in MOOD_CONFLICTS at strength 0.75):

```
energy hit       = 1
sleepy at ≥ 3    = yes, mask_strength(energy, sleepy) = 0.75
contribution     = max(0, 1 - 0.75) = 0.25
```

vs. the same user picking `energy` on a clean assam-led blend:

```
energy hit       = 1
no conflicting tag at ≥ 3 → no penalty
contribution     = 1.0
```

The cleaner candidate wins the tiebreaker handily — 1.0 vs 0.25.

## When to update this table

- **Adding a conflict pair** to FLAVOR_CONFLICTS or MOOD_CONFLICTS:
  also add an entry here and to the strength map. If the masking is
  symmetric and you don't know whether it's hard or soft, the 0.5
  default is fine and you can refine later.
- **Reading literature on a new ingredient** that suggests one
  partner masks the other much harder than 0.5: open a row in the
  table, cite the source, set a value.
- **Saturation / drift complaints** from real use ("why is X ranked
  above Y?"): trace the score deltas back through this table and
  the matched-count axis; usually the answer is a missing pair or a
  miscalibrated strength.

## Sources

- Drewnowski, A. (2001). The science and complexity of bitter taste.
  *American Journal of Clinical Nutrition*, 74(2), 246–256.
- Eccles, R. (1994). Menthol and related cooling compounds.
  *Journal of Pharmacy and Pharmacology*, 46(8), 618–630.
- Belitz, H.-D., Grosch, W., Schieberle, P. (2009). *Food Chemistry*,
  4th ed. — chapters on Maillard products and phenolic compounds for
  the smoky / roasted persistence model.
- Yamaguchi, S., Ninomiya, K. (2000). Umami and food palatability.
  *Journal of Nutrition*, 130(4), 921S–926S — for the umami /
  sweet enhancement vs. clash framing.
