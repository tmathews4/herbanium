# Herbanium — working rules

Project instructions, loaded every session. These are rules, not suggestions.

## A mid-turn message is a QUEUE, not an interrupt

**When a new request arrives while work is in flight, write it down and
keep going. Finish the thing in progress, then take the queue in
order.** Say what was queued when acknowledging it, so nothing is
silently dropped.

This is not a preference about tidiness. Switching mid-task leaves the
previous change half-verified — tests unwritten, suites unrun, a fix
measured but not committed — and the half-done state is invisible to
everyone including the person who made it. Two features landed at once
are also one commit that can't be reverted separately.

The exception is a report that the work in flight is WRONG. "That fix
didn't work" is not a new request; it is information about the current
one, and it belongs in the current one.

**Read this file before starting, not after being asked about it.** The
sections here are load-bearing and several were written because
something shipped broken. Skimming it costs a minute; missing the
research rule, the derived-contract rule or the pre-merge gate costs a
session.

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
node tools/audit-vocabulary-coverage.mjs  # maps that drifted from the list they key on
```

`audit-vocabulary-coverage` is the answer to a different question from
the others: not "is this claim sourced" but "does this lookup table
still match the vocabulary it was written against". Two bugs in one day
had that shape — a crystal named "A Jade and **undefined** Swirling
Crystal" because its colour maps still keyed on `warm` and `body` after
the families became `heat`, `comfort`, `digestive` and `immune`; and
four hint flags that were persisted, seeded and threaded to screens
that had stopped reading them.

**The half worth running it for is EXTRA, not MISSING.** A stale key is
what makes a map look covered — every gap found had one sitting next to
it, and the file reads as complete right up until you compare it to the
list. The tool found the second drifted map in `moodCrystal.js` after
the first had just been fixed by hand, in the same file, by someone
looking straight at it.

Not every hit is a bug. Three spellings of the flavour vocabulary are
all legitimate — tokens (`minty`), families (`fresh`), chips (`fruity`)
— and a map may be partial on purpose. Say so in a comment on the map
and the audit skips it; delete the comment and it reports again, which
is why there's no exemption list to go stale.

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
npm run typecheck                                          # tsc over the E2E harness
npm test                                                   # node suite
npx playwright test --project=pixel-9 --project=galaxy-s9  # E2E (Chromium only locally)
```

**Two viewports, not one, and galaxy-s9 is the one that earns its
place.** It is the narrowest project CI runs (320 CSS px), and a whole
class of defect is invisible at pixel-9's 360: anything that only
breaks when text WRAPS. A preference label reading
"Container (350 ml)" wrapped to six line boxes there and each line
centred itself, so the label column stopped lining up — measured
`rangeX 20, 20, 30`. Every local run was green and CI was red, on a
spec written the session before precisely to hold that alignment.

It roughly doubles the local gate (~8 minutes). That is the cost of
not learning about the narrow viewport from a red CI run half an hour
after the push, which is also a push that has already deployed.

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

**Closed — `e2e/elemental-notices.spec.ts` under load.** Kept here
because the shape recurs. Tests in this file failed across five full
runs, a different one each time, always passing alone. It read as one
flaky file. It was four separate causes, and calling it "inherently
load-sensitive" delayed finding any of them:

1. A notice card covering the steep screen's minimize button — a real
   bug any user could hit.
2. Notices firing before the lodestone had ever been opened — also
   real, and reported independently.
3. A shared `banner()` locator matching `pulsing|charged`, so a test
   meaning one notice could be satisfied by the other and then fail on
   the body text of the one it wanted. Three failures, three faces,
   one cause. Split into `arrivalBanner` / `chargeBanner`, with
   `banner` kept only for the silence tests where "any notice at all"
   is the actual claim.
4. `fillTheStone` clicking "full" on a stone that could already be
   full. The charge notice fires on a TRANSITION — deliberately, so an
   already-charged stone doesn't greet you with old news — so the test
   was asserting a notice the app was right not to send. Emptying
   first makes the transition real.

Two of the four were app bugs and two were test bugs, and every one of
them looked like flake until it was read properly. Load didn't cause
any of them; it changed the timing enough to expose them.

**CLOSED AGAIN, 2026-08-16 — the FIFTH cause was the app rolling dice
under the test.** Reopened 2026-08-13 with the symptom recorded and a
suspicion attached; the suspicion was wrong, which is why it was
recorded as a guess.

Symptom, as it read for three days: roughly one run in three, one test
in this file fails, a different one each time, and it passes on
immediate re-run. Observed on `:143` ("an elemental arriving announces
itself"), `:187` ("the stone filling while you're on another screen
says so") and `:396` ("dismissing it puts it away and it doesn't come
back"). The `:143` failure read:

```
Error: nothing has arrived yet
Locator: getByText(/your lodestone is (pulsing|charged)/i).first()
Expected: 0   Received: 1
```

— a PRECONDITION assertion, failing because a lodestone notice was
already on screen before the test had done anything to cause one.

**The cause: every action site calls `tryRollOnAction`, which rolls
`Math.random`.** `BASE_CHANCE` is 4.5%, multiplied by 4.0 on a profile
with nothing earned — about 18% per eligible action. Each test makes
two or three tab visits before its silence assertion (`meetTheLodestone`
alone is two), so most runs of the file had a stray arrival somewhere,
and when one landed before a silence check, that test failed. The app
was behaving exactly as designed; the precondition was never guaranteed.

**Why the failing test moved while the assertion shape never did.** Only
a silence assertion can see a stray arrival — a test waiting FOR a
notice cannot fail this way. All three observed failures are silence
assertions. One cause, three faces, for the second time in this file.

What proved it, and it is the same instruction the four earlier causes
ended with: **read the failure's page snapshot, don't reason about it.**
The ribbon on screen in a failing `:143` read "your lodestone is
pulsing / Something stirs in the stone" — the ARRIVAL notice — in a test
that had seeded the charge to 0 and had not yet forced a glimpse. Not a
leftover, not a charge notice: a fresh roll.

The recorded suspicion — seeded profile state leaking between tests —
was wrong, and worth knowing why: each test gets its own browser
context, so nothing survives between them. It fit the evidence
("different test each time") and was still a guess. The note said to
read a trace before believing it. That was the right instruction.

Fixed by seeding `lastElementalRollAt` an hour into the future in the
spec's `boot()`, which holds `rollOnAction`'s own cooldown shut for the
whole run. Not `elementalsDisabled`, which would also switch off the
charge and the dev forcer — the actual subjects. Deliberate arrivals
still fire, which is why `:143` still passes rather than passing
vacuously. `tests/elemental-roll.test.mjs` holds the cooldown property
by name, so removing it fails there instead of quietly restoring the
flake.

Measured: 3 failures in 42 runs before, 0 in 70 after.

Also ruled out along the way, so nobody re-spends it: not the
caffeine/sedative work (reproduced on clean `HEAD`), not load or worker
contention (reproduces running the file ALONE in 15s), and not cause 3
recurring (the combined `pulsing|charged` locator is involved, but as a
silence assertion, which is the usage the split deliberately kept it
for).

**Open, seen once — `e2e/tours.spec.ts:697` ("the spotlight tracks the
strip when it resizes mid-step").** Failed once in a full gate on
2026-08-21, in the run right after the blend hero lost its mood glyph
and descriptor. Passed in the next full gate, in two solo runs of the
whole tours file, and alone. **The trace was lost** — the passing rerun
cleared `test-results/` before it was read, which is a mistake worth
not repeating: copy the failing trace out before re-running anything.

Recorded rather than explained because there is a plausible mechanism
and no evidence for it: that commit shortened the blend header, and
this test is about spotlight geometry tracking a resize. One occurrence
is not a pattern; if it goes twice more, it is a bug with a bad error
message and the note above says how to open it.

**A NEW spec runs against every locally-installed project before it
is pushed, not just the gate's two.** The full gate is pixel-9 +
galaxy-s9 because running everything twice over is slow. That is fine
for a suite that already passed CI once; it is not fine for a spec
nobody has ever run, and `e2e/tap-targets.spec.ts` proved it — written
and verified on pixel-9 and galaxy-s9, red in CI on pixel-fold-open,
iphone-15 and ipad-pro, all three by a single pixel of a threshold
computed from CSS arithmetic rather than measured.

```
npx playwright test e2e/<new>.spec.ts \
  --project=pixel-9 --project=galaxy-s9 --project=pixel-fold-open \
  --project=pixel-fold-cover --project=desktop-chrome
```

Seconds for one file, and it covers five of the nine projects CI runs.
The four it cannot cover are WebKit and Firefox, which is a reason to
be conservative about thresholds, not a reason to skip the five.

**And set a geometric threshold from MEASUREMENT, never from the CSS.**
Insets predict a 42px reach; devices measure 39 to 42 because subpixel
rounding differs. The prediction is not the property. Deriving the
bound from something else on the page is not automatically better
either — the second attempt scaled the expectation with the row pitch,
which sounds principled and is wrong when the inset is a constant: a
device laying rows out on a 55px pitch still reaches 40, and the
"derived" expectation of 47 failed a control that was exactly as big
as everywhere else.

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

## A declared contract beats a written-down one

**Where behaviour is declared in data and honoured somewhere else, the
check derives its expectations from the declaration — it never restates
them.** `e2e/tour-contract.spec.ts` is the worked example and the
reason this section exists.

A guided-tour step declares demo state (`openControls`, `axisMode`,
`demo`) and something four prop-levels away is meant to honour it.
Nothing checked that it did, and two copies of the same fact drifted:

- Six steps declared no `openControls` and silently inherited the
  screen's default. Flipping that default folded the row under steps
  that needed it open, and the tour went on pointing at a slider that
  was no longer rendered.
- `ComposeScreen` kept its own list of which steps run the steep-time
  demo. That list still named the prediction and effects steps after the
  row started folding on them, so the tour drove a control that wasn't
  on screen — measured, the bars swung and the folded row's clock ran
  7:47 to 3:24 with nothing visible causing it.

**Twelve tests failed across four files and not one said "a step didn't
get its state."** They said the callout moved, a slider was missing, a
dock was 37px. One cause wearing twelve faces is what an unchecked
contract does, and it is why the fix is a contract rather than twelve
repairs.

The rule that makes it work, and the one worth not getting wrong:

> **The contract file must not contain the contract.**

`tour-contract.spec.ts` imports `SCREEN_TOURS` and walks whatever is
there. It never lists which steps open the row or which one demos — add
a step, flip a flag, reorder them, and it holds the app to the new
declaration with no edit. A hand-written table of expected states would
be one more copy to drift, which is the exact failure it exists to
catch. **If you find yourself typing the expected values into the test,
stop — you are rebuilding the bug.**

Both halves are verified to fail, and both were checked by breaking them
on purpose:

- **Declaration illegal** — `axisMode` on a step that folds the row is
  reported from the data alone, before a browser starts. The pills are
  rendered inside the row, so binding an axis while it's shut binds
  nothing.
- **Declaration not honoured** — breaking the prop chain reports
  `step 3/13 (blend-graph — "The prediction"): declares demo, but the
  brew sat at 6:00`.

**A contract can encode a mistake, and this one briefly did.** The
illegal-declaration rule was first written as "a step that demos must
open the brew row", reasoning that oscillating the steep time while its
control is put away is motion with an off-screen cause. That is wrong on
the facts — a folded row is CONDENSED, not hidden; it still reads the
temperature and the time, and that clock ticks with the bars. Enforcing
it drove the movement off the two steps where the strips are the lit
subject and left it only on the slider step, where they change dimmed
behind the cutout. Every test passed and the tour got worse. It was
caught by a person watching the tour, not by the suite.

So: **a contract binds what you already know to be true; it does not
settle a design question by being written down.** When adding a rule,
ask what evidence it rests on, and prefer the narrowest rule that
evidence supports. `tests/tour-layout.test.mjs` is the counter-example
worth copying — its rule ("the row folds only at the very end, never
mid-lesson") encodes a defect that was actually reported, and it
correctly rejected the over-broad fix.

The same shape is already in the repo and worth copying: `BREW_WINDOWS`
in `e2e/helpers/brew.ts` names every brew surface and
`tests/brew-surfaces.test.mjs` fails if `src/` grows a fourth that isn't
registered. `src/data/tourBlend.js` + `tests/tour-blend.test.mjs` is the
same idea for the tutorial's seeded pot — it holds the PROPERTIES that
make the blend teach, not the pair, so the blend stays re-pickable.

**A prose doc is the wrong tool here.** It goes stale silently, and
silent staleness is the thing every audit in this file exists to catch.

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


- **Flavour bars saturate above ~25% dose, and the CEILING IS NOT WHY.**
  Measured, not reasoned. Investigated after "peppermint is marking
  menthol max the entire tutorial".

  The pipeline is `raw = strength × loudness × grams`, then
  `clampTo5`. For a 4g cup of peppermint against rooibos:

  | dose | raw `minty` | shown |
  |------|-------------|-------|
  | 6%   | 2.29        | 2.29  |
  | 13%  | 4.29        | 4.29  |
  | 25%  | 7.25        | 5.00  |
  | 50%  | 14.5        | 5.00  |
  | 100% | 29          | 5.00  |

  So the strip cannot tell a mint accent from an all-mint cup. It is
  dose-dependent on loudness: flavours at loudness 2.0 pin on **7 of 7**
  solo cups, loudness ≥1.5 on 41%, loudness <1.5 on 8%. `floral` (0.7)
  never saturates; `apple` (1.0) goes at ~40%.

  **The data is not the problem.** Peppermint's profile honestly
  declares `minty` 3 at 90°C and 4 at 98°C. The ceiling comes from
  `FLAVOR_LOUDNESS`, which is itself sourced — `docs/masking.md`, Eccles
  1994, TRPM8 — so the multiplier is defensible. Note though that mint's
  dominance is ALREADY modelled separately by the masking matrix, so
  loudness is arguably counting it twice.

  **1 PART ALREADY OVERFLOWS, AND DILUTION IS INVISIBLE.** Reported from
  real use: "assam black 5 and peppermint 1, that feels wrong". It is.
  Two facts sharpen the above:

  - Peppermint at 1 part gives raw `minty` 6.3 against a cap of 5. The
    parts UI cannot express less than 1 part, so peppermint can never be
    an accent — it maxes on arrival, always.
  - Raw tracks a leaf's ABSOLUTE dose, not its share (deliberately —
    see the "DOSE, not share" note in `combineFlavors`; a leaf brings
    what's in the pot). So adding assam does not dilute the mint at all:
    9:1 reads 6.30 and 1:1 reads 6.40. Five extra parts of assam change
    nothing the strip can show.

  That cup reads `malty 5.00, bold 5.00, minty 5.00` — three bars
  pinned, so it cannot say assam leads.

  **TWO FIXES ARE RULED OUT BY MEASUREMENT. Don't re-walk them.**

  1. *A genuinely soft ceiling.* The first thing anyone reaches for, and
     it cannot help: raw runs to ~29 against a scale topping at 5, so a
     knee-and-asymptote at 4.5 maps both 7.25 and 29 to 5.00 exactly as
     the clamp does.

  2. *Retuning `FLAVOR_LOUDNESS`.* Also fails, and this one is the
     surprise. Compressing loud values toward 1 buys exactly one step:
     `assam 5 : peppermint 1` improves, and 2 parts is back at 5.00 for
     every coefficient tried. Taken to the limit — loudness forced to
     1.0, no amplification at all — peppermint still caps at 2 parts
     (raw 5.30). **`strength × dose` alone overflows before loudness is
     applied**, so loudness is not what binds. It also barely moved the
     pinning (36 → 28 bars of 630) and flipped MORE leading flavours
     (7–11 blends) than the share-based prototype did.

  A share/relative-loudness prototype DOES work on the reported cup
  (malty 3.64 > minty 3.13, assam leads) and cuts pinning 36 → 5 bars.
  It was not shipped: it buys only one step of mint headroom, drops 14
  bars by more than 2 points including blends named for that very
  flavour (`Lady Grey: citrus 5.0 → 2.9`, `mood:cooling: cool 4.8 →
  2.4`), and couples every bar to whatever else is in the pot — solo
  assam reads `malty 5.00`, but adding one part of mint drops it to
  3.64. The patch is not in the repo; re-deriving it is ~10 lines in
  `combineFlavors`.

  What would actually work is full-range compression
  (`5·(1−e^(−raw/6))`), which restores real discrimination —
  1.59 / 3.51 / 4.55 / 4.96 across that dose sweep. **It also moves every
  reading in the app**: raw 3 shows 1.97 instead of 3.00, raw 5 shows
  2.83 instead of 5.00. Every threshold tuned against today's numbers —
  tannin, overpull, the 0.5 visibility floor, the drift audits — would
  need re-tuning with it. That is a project with its own calibration
  pass, not an edit, and it has not been done.

  **Deliberately left alone for now.** Saturation past a quarter dose is
  arguably perceptually honest — there isn't much "more than maximally
  minty" to taste. The cost is real and specific: the bar stops being
  informative exactly where blending decisions get made. Know that
  before treating a 5.0 as a measurement.

  The tutorial blend works around it rather than fixing it —
  `tests/tour-blend.test.mjs` rejects any pick whose bars sit at the
  ceiling, which is why the seeded pot is elderflower and tulsi.

- **No backend.** Catalogue and extraction profiles ship bundled. Read-mostly reference data; bundling avoids network dependency, latency and hosting cost.
- **Journaling is device-local, deliberately.** Single-purchase app, no subscription revenue, and mood data is sensitive.
- **The algorithm stays in-process.** One client, no other consumers, and extracting it would break offline use.
