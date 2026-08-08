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

Run **all three** locally and report the actual pass/fail counts:

```
npm run typecheck                           # tsc over the E2E harness
npm test                                    # node suite
npx playwright test --project=pixel-9 ...   # E2E (Chromium only locally)
```

**Typecheck is not optional and is easy to forget** — it only covers the
TypeScript E2E specs, so a change to `src/` can't break it and it feels
skippable. One mistyped helper parameter in a new spec failed CI three
pushes running: the error was in `e2e/`, every browser passed, and
nothing local complained. `tsc --noEmit` takes seconds.

Check CI after pushing (`gh run list`). A red run that nobody looks at
stays red, and the next push inherits it.

### A flake that repeats is a bug with a bad error message

**If the suite fails more than twice on something already written off as
flaky, stop calling it flaky and open a real investigation.** Put a note
in this file naming the symptom, so the next session inherits the
suspicion rather than the explanation.

This is not general caution. One failure per full run — a different test
each time, every one passing alone — ran for a whole session and was
explained three times: worker contention, then a slow machine, then too
small a budget. All three were wrong, and two of the three "fixes"
would have buried the cause permanently. It was a real bug any user
could hit: brewing earns lodestone charge, a cup that fills the stone
raises a fixed notice at the top of the screen, and that notice covered
the steep screen's minimize button. Tap minimize, nothing happens.

What broke it open, in order, and worth copying:

- **A bare `.click()` has no timeout of its own.** It waits out the
  whole test budget and reports "timeout in beforeEach", which names the
  hook and never the thing that was missing. Assert visibility BEFORE
  clicking and the message changes from "the hook timed out" to "this
  locator never appeared" — or, as here, to "it was visible and the
  click still hung", which is a different bug entirely.
- **A hang scales with whatever budget you give it.** Raising the
  timeout from 30s to 60s moved the failure from 90s to 180s and
  changed nothing else. If a budget increase doesn't fix a timeout, the
  timeout was never the problem — and that result is evidence, so
  revert the raise rather than keeping it.
- **Read the trace.** `test-results/**/trace.zip` records every action;
  the one with a `before` and no `after` is the one that hung, with the
  spec file and line.
- **Measure the geometry, don't reason about it.** `elementFromPoint`
  at the target's own centre names the element actually on top. Reading
  the CSS would not have found this — both elements were correct on
  their own.

Contention and slow machines are real, and neither is the first guess
worth acting on, because both have fixes that hide evidence.

**Open investigation — `e2e/elemental-notices.spec.ts` under load.** Tests
in this file have failed in three separate full runs, a different one
each time, always passing alone and in a file-only run. Two were
diagnosed and fixed for real (a notice covering the steep's minimize
button; notices firing before the lodestone had been met). The third —
"dismissing it puts it away" — is unexplained: a clean-path
reproduction shows the × working exactly as intended, so the failure
only appears under parallel load.

The file is inherently the most load-sensitive in the suite: nearly
every test asserts an ABSENCE, and absence assertions race whatever
they're waiting on. Don't add a retry. The next occurrence should
report which ribbon survived — "pulsing" and "charged" are different
notices with different owners, and the shared locator matches both.

Only Chromium browsers are installed locally — WebKit and Firefox run in CI, and they *do* find real differences (WebKit renders text ~35% taller in places; Firefox panes are shorter). Say so rather than implying full-matrix coverage.

Watch for a stale `vite preview` on `:5173`: `reuseExistingServer` is true locally, so a leftover server silently serves an old `dist/` and makes E2E results meaningless. Check with `ss -lntp | grep 5173` if results look impossible.

## Locators

Assert on stable hooks added to our own markup — `data-tour="..."` for tour anchors, `data-testid="..."` for test-only handles. No brittle absolute paths, no text matching where a hook would do. Add the hook at generation time rather than retrofitting it.

## Lint the files you touched

`npm run lint` reports ~200 findings across `src/`, almost all style, so
a real defect sits invisibly among them. Three undefined references
reached the running app in one session — `jumpNonce`, `useState`,
`revealedSorted` — and **every one was already in eslint's output**.
esbuild does not help: it bundles undefined globals happily, because
resolving them isn't its job. The app crashed; the build was clean.

So: **`npx eslint <the files you changed>` before calling anything
done.** It takes seconds on a handful of files and about two minutes
across `src/`, which is why it isn't in `npm test`.

`npm run lint:crashers` is the enforceable subset — the rules where a
hit throws or silently drops data (`no-undef`, `no-dupe-keys`,
`no-dupe-args`, `no-const-assign`, `no-unreachable`...). Their baseline
is **zero**, so any finding is new and real. It runs in CI beside
typecheck. It found two duplicate object keys the moment it existed,
one of them a width silently overwritten by a later declaration.

Style rules are deliberately excluded from that check. Mixing them back
in is precisely what made the crashes invisible.

## State that changes together changes through one path

Follow React's own organisational guidance rather than inventing local
conventions: **if two or more pieces of state always change together,
they change through one function** — merged into a single value, moved
behind a reducer, or at minimum owned by one named operation that every
caller goes through.

This is not a style preference. An audit found four instances, all the
same shape and all of them latent bugs:

- `grantElementals` — an elemental becoming yours wrote three parallel
  stores, hand-rolled at four sites with four different guards.
- `openOverlay` — opening an overlay is set-id + push-history + show,
  hand-rolled at seven sites; one was a verbatim reimplementation of
  `openBlend`.
- `closeSteep` — putting the steep away is four writes, written twice.
- `stepWaitCard` — two functions differing by one character around four
  setters.

**The failure shape is always the same: every copy is correct, nothing
keeps them so, and the symptom surfaces somewhere else.** Miss
`clearOverlayHistory` on one exit path and the exit works fine — the
next Back press walks into a dead overlay. No test fails, because each
individual path is right.

Prefer the lightest form that removes the divergence. A reducer is the
by-the-book answer for a cluster of values, and it is the wrong call
when those values are read independently across a large component —
folding them into one object then touches far more than it fixes. Say
which you chose and why, in a comment.

**Finding them:** grepping for duplicate NAMES only finds duplicated
definitions. This class is duplicated OPERATIONS — no shared name, often
inside one file. Look instead for setters that repeatedly appear within
a few lines of each other across several call sites. Read the results:
`setTab` + `setTabHistory` clusters too, and is correct — push and pop
are inverse operations, not copies.

## Pushing is deploying

**`git push origin main` publishes to herbanium.app.** Vercel builds
from the GitHub integration, so there is no deploy workflow in
`.github/workflows` — that directory holds `ci.yml` and nothing else,
and reading its absence as "pushing is safe" is wrong. It has been
read that way once already.

There is no staging step in between. A push to main is the release, so
both suites pass BEFORE the push, not after.

## Native builds

`npm run cap:sync` (build + `npx cap sync`) before any native build, or
the WebView serves a stale bundle. This is not hypothetical: the iOS
bundle sat three months behind the web app and kept serving a fixed bug
to a real device.

The config is `capacitor.config.json` and **must stay JSON** — the CLI
transpiles a `.ts` config with the TypeScript 5 compiler API, which
`typescript@^7` doesn't provide, and a `.js` config silently falls back
to defaults under `"type": "module"`. Reasoning and per-setting notes
live in `docs/capacitor-config.md`.

## Dev environment

- Vite dev server runs on **5174** (`npx vite --port 5174 --strictPort`). Never 5173 — Playwright's `webServer` owns that port.
- WSL2 doesn't deliver inotify events for `/mnt/c`, so `vite.config.js` polls for changes. Without that the dev server serves whatever it read at startup.

## Persisted state

`src/data/schemaVersion.js` holds `CURRENT_SCHEMA`. **Bumping it wipes every `herbanium.*` key on next load** — journals, saved blends, elementals. It's a reset switch, not a migration. The E2E specs import it rather than hardcoding a value; a stale literal there means the app wipes the seed and the tests quietly run against an empty profile.

## Architecture decisions — settled, don't re-litigate

- **An ingredient's `tempC` / `timeS` range is what we RECOMMEND. How
  far the slider goes is a different question, answered by the DATA.**

  The steep slider now runs to the further of the card's max and the
  profile's last measured row (`PROFILE_TIME_REACH`), so the over-pull
  rows are reachable by the person they describe — chamomile's 420s row
  says "apigenin maxes out but tannins follow", and until this change
  no finger could get there. Fifteen ingredients gained real stretch;
  lavender went 5:15 -> 7:50, hojicha 1:18 -> 2:40.

  **Nothing about the recommendation moved.** The band, the RECOMMENDED
  target and the warnings all still read the card range. Only how far
  you may drag past it changed.

  **No global floor, and this is the part worth not re-deciding.** "Let
  every steep reach 8 minutes" is the obvious version and it is wrong:
  30 of 52 cards cap under 8 minutes and exactly one of those has data
  out that far. Past the last measured row the interpolated curve holds
  its last value, so the FLAVOUR prediction stops moving: the slider
  travels and the bars don't. Measured on eight short-capped
  ingredients — seven returned an identical flavour profile at their
  last row and at 8 minutes.

  (Warnings are the exception, and an earlier version of this note had
  it wrong. They keep responding past the data — lavender 2 -> 3, rose
  4 -> 5, lemon balm 2 -> 3 — because they read dose and time, not only
  the profile rows. So a stretched cup is not un-evaluated; it is
  un-described. Bad enough: the whole point of the stretch is watching
  the cup change.)

  Lengthening those means writing the research and adding the row, not
  widening the control. `tests/brew-reach.test.mjs` fails on a blanket
  floor by design.

  The earlier form of this decision said the over-pull rows were
  deliberately out of reach. That was the right call against the
  proposal on the table at the time — widening the CARD RANGES to cover
  over-pull territory — and it still is: a blend's range is the
  INTERSECTION of its ingredients', so widening every ingredient drags
  the control out of usable proportion the moment a short-steep herb
  shares a pot with a long one. That intersection is untouched, and
  `tests/brew-reach.test.mjs` holds it: a blend is still capped by its
  most delicate lead.

  What changed is that reach and recommendation stopped being the same
  number. Widening the slider alone doesn't widen anything a blend
  intersects, so the objection doesn't reach it.

  Keep over-pull rows in the profiles — they anchor the top of the
  interpolated curve, the warning thresholds read from them, and now
  the slider reaches them. Don't widen a card range to make one
  reachable; add the row instead.


- **No backend.** Catalogue and extraction profiles ship bundled. Read-mostly reference data; bundling avoids network dependency, latency and hosting cost.
- **Journaling is device-local, deliberately.** Single-purchase app, no subscription revenue, and mood data is sensitive.
- **The algorithm stays in-process.** One client, no other consumers, and extracting it would break offline use.
