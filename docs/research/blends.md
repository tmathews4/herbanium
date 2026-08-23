# Blend Research — cultural notes

> Companion to `docs/research/ingredients/*.md`. Those docs cover what
> a leaf DOES; this one covers what the app says about how people
> drink it.

## Why this file exists

Every ingredient claim in the app is answerable to a research doc.
**Blend cultural notes were answerable to nothing.** `audit-claims.mjs`
reported it plainly and for a long time nobody read the line:

```
blends (no doc to check):   45
```

32 blends carry a `culturalNote`, and each one asserts something about
a real practice, a real place, and often a real date — the register
that produced "Roman empresses paid taxes in peppercorns". The anchor
check skipped all of them, not because they were sound but because
there was no file to compare them against. That is the exact state the
pepper claim lived in.

A per-blend doc would be 32 files holding a paragraph each. This is one
file instead, and the anchor check reads it the same way.

## What was found on the first pass (2026-08-23)

Four of the 32 were wrong, and none of the four looked wrong.

### Moroccan Mint — the proverb is Tuareg, and it is about glasses

> The note fused two separate things: the POURING technique (from a
> height, back into the pot, until the foam is right) and the saying
> about three GLASSES served in turn. It presented both as "the
> three-pour ritual" and implied the saying was Moroccan.
>
> The saying — first gentle as life, second strong as love, third
> bitter as death — is a **Tuareg** proverb, from the Saharan nomads,
> carried across the Maghreb and often loosely quoted as Moroccan.
> Its wording varies between tellings, which is what an oral proverb
> does; some versions swap "bitter" and "gentle" between the first
> and third glass.
>
> Pouring from height is a real and separate craft: it aerates the
> tea and raises the foam that a host is judged on. `verified`
> (technique), `attested` (proverb, Tuareg origin)

### Golden Milk — twentyfold, not "orders of magnitude", and contested

> The note said black pepper "raises curcumin's bioavailability by
> orders of magnitude". The figure everyone is quoting is Shoba et al.
> 1998 (*Planta Medica*): a 2000% increase, which is twentyfold —
> about 1.3 orders of magnitude, so the plural was wrong on the
> arithmetic alone.
>
> The bigger problem is confidence. That result **has never been
> independently replicated**, it measured blood levels rather than any
> clinical outcome, and in later head-to-head trials adding piperine
> either did nothing or was associated with loss of curcumin efficacy
> and more side effects. The mechanism is real — piperine inhibits the
> glucuronidation that clears curcumin — but the app was quoting a
> marketing number as settled science.
>
> Rewritten to name the twentyfold figure, say it stands alone, and
> say the later evidence is mixed. `attested` (mechanism),
> `folk` (the 2000% figure as a settled result)

### Cimarrón — the first mate is the STRONGEST, which is the whole point

> The note called the first pour "bitter, weak". It cannot be both,
> and it is not weak: the first mate is the harshest of the round and
> carries the dust off the leaf. That is precisely WHY the cebador
> drinks it — serving it to a guest would be a discourtesy. The note
> had the etiquette right and its reason backwards. `verified`

### Lady Grey — 1994 in Norway, not 1992

> Twinings created it in the early 1990s for a Nordic market that
> found Earl Grey too strong. It went on sale **in Norway in 1994**
> and in Britain in 1996, and is named for Mary Elizabeth Grey, wife
> of the 2nd Earl. The blend carries lemon and orange peel (about 3%
> each) alongside the bergamot, which is what makes it lighter and
> more overtly citrus. 1992 appears in no source. `verified`

<!-- retracted: 1992 for the Norwegian market -->
<!-- retracted: bitter, weak, the unsweetened opening -->
<!-- retracted: bioavailability by orders of magnitude -->

## Verified sound, so the search isn't re-spent

| Blend | Claim | Status |
|---|---|---|
| Hojicha at Dusk | Kyoto, 1920s, invented to use stems that wouldn't sell | `verified` — see hojicha.md |
| Shou Pu-erh | Pressed for transport on the Tea Horse Road; shou engineered for the dark register from the start | `verified` |
| Earl Grey | "possibly named for Charles Grey, 2nd Earl Grey. The story has many versions" | `attested` — and correctly hedged already |
| Wuyi Pine Smoke | "legend has it" the smoke came from soldiers warming leaves | `folk`, and labelled as legend in the note itself |
| Russian Tea with Lemon | Sugar cube held between the teeth (*vprikusku*) | `attested` |
| Tieguanyin | Anxi; named for Guanyin; gongfu short pours | `attested` |
| Canarino | Italian after-dinner lemon-zest infusion | `attested` |
| Pissenlit Café | Roasted dandelion root as wartime coffee substitute | `attested` |

## The register these notes are written in

They describe practice, and practice is `attested` far more often than
it is `verified` — an oral custom has no trial behind it. That is fine
and it is not a licence: **a date, a place or a number inside a
cultural note is a hard claim and answerable like any other.** All four
errors above were exactly that — a date (1992), an attribution
(Tuareg/Moroccan), a magnitude (orders of magnitude), and a physical
fact (weak/strongest). The soft framing around them was never the
problem.

## What is NOT verified here, stated plainly

The four above were checked against sources and corrected. **The other
28 notes were read, not verified.** That is a weaker claim and it is
the honest one — the same distinction that made the first ingredient
pass unreliable ("40 of the top 50 looked fine" was an impression, not
a check).

Substantive claims in the remaining notes, listed so the next pass has
a worklist rather than 28 paragraphs to re-read:

| Blend | The checkable part | State |
|---|---|---|
| Darjeeling, neat | The estates are worked by Lepcha, Limbu and Gorkha communities | plausible, unchecked |
| Koicha | Koicha "used for centuries before usucha"; three and a half sips per guest | convention, unchecked |
| Koicha | "The L-theanine load at this dose grounds rather than alerts" | a dose-response claim with no source |
| Genmaicha, simply | "half the caffeine of plain sencha" | arithmetic from the rice fraction, unchecked |
| Shou Pu-erh | "Both keep indefinitely" | overclaim — sheng and shou age differently and shou does not improve indefinitely |
| Wuyi Pine Smoke | Qing-dynasty soldiers | already labelled "legend has it", which is the right register |
| Spring Tonic | "the Wise Woman tradition of European folk herbalism" | a named tradition, unchecked |
| Mycelium Morning | "late-2010s functional-foods movement" | a dated claim about a market |

## A note for whoever runs `--anchor` against this file

Cultural notes are thick with demonyms — Indian, Japanese, European,
Bavarian — and the anchor check reads every capitalised word it does
not see in lower case as a name. Those will report unanchored more or
less forever, and padding this file with the word "Japanese" to quiet
them would be writing for the tool rather than for a reader.

**Read the hit before acting on it.** "Japanese households stretched
scarce green leaf" asserts nothing a source could settle. "Twinings
developed it in 1992" did, and was wrong. The signal is a date, a
place, a magnitude or a mechanism — not a nationality.
