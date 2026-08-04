# Herbanium — working rules

Project instructions, loaded every session. These are rules, not suggestions.

## Testing is part of "done"

**Every new piece of functionality ships with a Playwright test in the same change.** Not a follow-up, not "later" — a feature without a test isn't finished.

- Pure logic (scheduling, scoring, geometry, data rules) → a node test in `tests/*.test.mjs`, registered in the `test` script in `package.json`.
- User-facing behaviour → an `e2e/*.spec.ts` spec.
- Both, when a feature has both. The node suite proves the rules; the E2E proves the user can actually reach them.

Aim for smoke-level coverage of the core path over exhaustive edge cases. A test that walks the real flow and asserts one meaningful thing beats five that assert implementation details.

## Never invent an effect or a mood

Every effect, mood and flavour an ingredient claims must be backed by an
entry in its `docs/research/ingredients/<name>.md`, with a source. If a
property should exist and the research doesn't cover it, **the research
gets written first** — then the extraction profile is transcribed from
it. Not the other way round.

This isn't bureaucracy. The app's entire claim is that it teaches real
extraction chemistry; an unsourced effect is the app making something
up while presenting it with the same authority as the sourced ones, and
a user can't tell the difference. An audit found 21 ingredients
asserting `comfort` with no research behind it, which is how that goes
wrong quietly.

Two tools measure this — run both after touching ingredient data:

```
node tools/audit-research-drift.mjs    # shipped vs prescribed, both directions,
                                       # and magnitude, not just presence
node tools/audit-unreachable.mjs       # declared but never visible in a cup
node tools/audit-vocabulary.mjs        # is a WORD invented? census vs the docs
node tools/audit-opposition.mjs        # opposed pairs one ingredient holds at once
node tools/audit-brew-params.mjs       # does the BREWING ADVICE match the research?
```

The drift audit checks flavour at FAMILY level, not leaf level — the
docs write descriptive prose for taste where they use controlled words
for effects, and leaf words are near-synonyms (lapsang's doc says
`smoky`, its profile says `smoked`). The question is whether the
register reaches the cup, not whether both picked the same word.

Brew parameters are the one axis where the app may legitimately depart
from the docs — the research says how an ingredient is conventionally
brewed, and the app also has to serve the blends it ships. Those
departures live in `src/data/brewIntent.js` **with their reason**, not
in an exemption list, because an exemption reads as "not yet fixed" and
these are decisions. Removing an entry makes the audit report that
ingredient again, which is correct if the intent changes.

The last two work word-by-word rather than ingredient-by-ingredient,
which is the gap `comfort` lived in: no single ingredient looked wrong,
but the word shipped on 27 ingredients while 7 docs prescribed it.

Effect vocabulary is judged against **materia medica and TCM**, not
against tea writing. Tea's own sensory lexicons — Lee 2007 for green
tea, the Chinese CTSEM method, QDA — cover flavour, aroma and mouthfeel
and never name effects. So `soothing` is answerable to *demulcent*,
`digestive` to *carminative*, `sleepy` to *sedative*; a word with no
counterpart there is doing lay work and only our own docs constrain it.

### How a claim gets sourced

Three outcomes, all seen in practice — the right one depends on what
the literature says, not on which is least work:

- **Contradicted → remove.** Lemon balm shipped `energy` and `focus`;
  a controlled trial found alertness significantly *reduced*. The app
  was asserting the opposite of its own evidence base. Worse than an
  unsourced claim, because it's confidently wrong.
- **Right effect, wrong register → correct it.** Spearmint's `energy`
  became `focus`: the attention evidence is real and explicitly
  stimulant-free. Same strengths, correct name.
- **Tradition-sourced → keep, and say so.** Cardamom's `energy` has no
  trial behind it but is well documented as traditional use. Recorded
  as tradition, on the same footing as other `sources: traditional`
  entries — never dressed up as clinical.

A finding that applies across every brew point belongs in an addendum
carrying `<!-- sourced-effects: name, name -->`, which the parity guard
reads. Writing the research properly is what clears the guard; editing
the exemption list is not.

Where the docs and the app use different words for one claim, alias in
the audit rather than duplicating the data — `settle` -> `digestive`,
`warming` -> `comfort`. Carrying both made 21 ingredients assert the
same register twice.

## Before merging

Run **both** suites locally and report the actual pass/fail counts:

```
npm test                                    # node suite
npx playwright test --project=pixel-9 ...   # E2E (Chromium only locally)
```

Only Chromium browsers are installed locally — WebKit and Firefox run in CI, and they *do* find real differences (WebKit renders text ~35% taller in places; Firefox panes are shorter). Say so rather than implying full-matrix coverage.

Watch for a stale `vite preview` on `:5173`: `reuseExistingServer` is true locally, so a leftover server silently serves an old `dist/` and makes E2E results meaningless. Check with `ss -lntp | grep 5173` if results look impossible.

## Locators

Assert on stable hooks added to our own markup — `data-tour="..."` for tour anchors, `data-testid="..."` for test-only handles. No brittle absolute paths, no text matching where a hook would do. Add the hook at generation time rather than retrofitting it.

## Dev environment

- Vite dev server runs on **5174** (`npx vite --port 5174 --strictPort`). Never 5173 — Playwright's `webServer` owns that port.
- WSL2 doesn't deliver inotify events for `/mnt/c`, so `vite.config.js` polls for changes. Without that the dev server serves whatever it read at startup.

## Persisted state

`src/data/schemaVersion.js` holds `CURRENT_SCHEMA`. **Bumping it wipes every `herbanium.*` key on next load** — journals, saved blends, elementals. It's a reset switch, not a migration. The E2E specs import it rather than hardcoding a value; a stale literal there means the app wipes the seed and the tests quietly run against an empty profile.

## Architecture decisions — settled, don't re-litigate

- **An ingredient's `tempC` / `timeS` range is what we RECOMMEND, not
  what you can explore.** The brew sliders are bounded by it, so a
  profile's over-pull rows — vanilla's 1200s, dragonwell's 95°C — exist
  in the model and are deliberately out of the slider's reach.

  This came up because re-gridding profiles onto their researched brew
  points moved several card ranges inside the point where a cup starts
  going wrong, which raised the question of whether the sliders should
  reach a deliberately bad cup for its teaching value. They shouldn't:
  a blend's range is the INTERSECTION of its ingredients', so widening
  every ingredient to cover over-pull territory drags the control out
  of usable proportion the moment a short-steep herb shares a pot with
  a long one. The teaching happens through the warnings and the
  extraction explorer, not by letting the slider run to ruin.

  Keep over-pull rows in the profiles — they still anchor the top of
  the interpolated curve and the warning thresholds read from them.
  Don't widen a card range to make one reachable.


- **No backend.** Catalogue and extraction profiles ship bundled. Read-mostly reference data; bundling avoids network dependency, latency and hosting cost.
- **Journaling is device-local, deliberately.** Single-purchase app, no subscription revenue, and mood data is sensitive.
- **The algorithm stays in-process.** One client, no other consumers, and extracting it would break offline use.
