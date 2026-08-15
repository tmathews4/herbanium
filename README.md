# Herbanium

**[herbanium.app](https://herbanium.app)** — a tea-blending app that teaches extraction
chemistry by letting you play with it.

You pick a mood or a flavour, it proposes a blend, and then it hands you the
controls: temperature, steep time, and the proportions of each leaf. Every one
of those moves the predicted flavour and effect of the cup in front of you,
because the prediction is computed from per-ingredient extraction curves rather
than looked up from a table of recipes. Drag chamomile past its apigenin peak
and you watch the tannins come up.

React 19 + Vite, packaged for iOS and Android with Capacitor. No backend.

---

## Why this repo might be worth a look

It's a single-developer product, but the parts that took the most work are the
ones that usually get skipped on a side project: the test suite, the CI, and a
set of tooling that checks the app's factual claims against its own sources.

**Testing is a merge gate, not a follow-up.** 30 Node suites over the pure
logic, 181 Playwright specs across 10 device profiles, three parallel CI
pipelines. `CLAUDE.md` in the repo root is the working rulebook and states it
plainly: a feature without a test isn't finished.

**The app makes claims about chemistry, so the build checks them.** Every effect
an ingredient asserts — `calm`, `digestive`, `focus` — has to appear in that
ingredient's research doc under `docs/research/ingredients/`, with a citation.
Six audit tools enforce that from different angles, and a ratchet in
`tests/research-parity.test.mjs` keeps the count of unsourced claims at zero.
An early audit found 21 ingredients asserting `comfort` with nothing behind it;
that's the class of bug this machinery exists to catch.

**Contracts are derived from the data, never restated.** `e2e/tour-contract.spec.ts`
imports the guided-tour definitions and holds the app to whatever they declare.
Add a step or flip a flag and the test covers it with no edit. The alternative —
a hand-written table of expected values — is a second copy of the truth, and it
drifts. That drift once produced twelve failures across four files, none of which
named the actual cause.

---

## Testing

```bash
npm run typecheck        # tsc over the TypeScript E2E harness
npm test                 # 30 Node suites: algorithm, data integrity, guardrails
npm run lint:crashers    # the lint rules where a hit throws — baseline zero
npm run test:e2e         # Playwright, all device projects
```

**Node suites** (`tests/*.test.mjs`) cover the parts with no DOM: blend
resolution, the perception model and its calibration, brew-window geometry,
vocabulary consistency, and the data guardrails above. Roughly 8k lines.

**Playwright** (`e2e/*.spec.ts`, ~6.4k lines) runs against the *production
build* — `webServer` builds and serves `dist/`, so specs exercise the same
bundle that deploys. Locators are stable hooks (`data-testid`, `data-tour`)
added to the markup at generation time; no absolute paths, no text matching
where a hook would do.

**Device matrix** — Pixel 9, Galaxy Z Fold 7 (cover *and* open), Galaxy S9+,
desktop Chrome, iPhone 15, iPhone SE, iPad Pro, and Firefox at two viewports.
The engines disagree in ways that matter: WebKit renders some text ~35% taller,
Firefox panes come out shorter. Both have caught real layout bugs.

**CI** (`.github/workflows/ci.yml`) runs typecheck + crash-lint + the Node suite
as one job, and a `fail-fast: false` matrix of one job per browser engine
alongside it. Browser binaries are cached on the lockfile hash. HTML reports and
`retain-on-failure` traces upload as artifacts on every run, so a red build is
debuggable without reproducing it.

### On flakes

The repo has a standing rule that a test failing more than twice stops being
"flaky" and becomes an investigation, and `CLAUDE.md` carries the case notes.
One such file failed across five runs, a different test each time, and was
explained away three times as worker contention. It was four separate causes —
two real app bugs, two test bugs. One of the app bugs was a notification card
covering a button, found by calling `elementFromPoint` at the button's own
centre rather than by reading the CSS.

A fifth cause in the same file is open and unexplained as of August 2026. It's
written up in `CLAUDE.md` as a symptom with the ruled-out hypotheses listed,
deliberately without a guess dressed up as a conclusion.

---

## Architecture

**No backend.** The ingredient catalogue and all extraction profiles ship
bundled with the app. It's read-mostly reference data — bundling removes a
network dependency, the latency, and the hosting cost, and the app works
offline.

**Journaling is device-local by design.** Single-purchase app, no subscription,
and mood data is sensitive. Server-side persistence would mean permanent
privacy and legal obligations for what is a convenience feature. JSON
export/import is the planned answer to data loss.

**The algorithm runs in-process** (`src/algo/`, ~3.6k lines). One client, no
other consumers, and extracting it as a service would break offline use.

- `compose.js` — blend resolution, brew-profile computation, over-pull scoring
- `perception.js` — how flavours combine: masking, loudness, stacking,
  effect synergies and antagonisms, warning generation
- `brewBounds.js` — the temperature/time envelope a given blend can be brewed
  in, derived from the intersection of its ingredients' ranges

Settled decisions are recorded in `CLAUDE.md` **with the measurements behind
them**, including the ones that were tried and rejected. The flavour bars
saturate above ~25% dose; two obvious fixes are ruled out there by measurement
rather than by argument, and the third is documented as a real project with a
calibration pass, not an edit. Knowing which fixes *don't* work is most of the
value in that section.

---

## The research layer

`docs/research/ingredients/` holds one document per ingredient — 53 of them,
~176k words, 52 carrying inline citations. Each covers identity, sensory
profile, brewing parameters, felt effects, and three temperature anchors with
time-axis behaviour, and each ends with an **honest limits** section naming what
the numbers don't support.

Chamomile's, for example, cites Harbourne 2008 for first-order extraction
kinetics across 57–100 °C and Cvetanović for the apigenin-glucoside peak at
85 °C — then says plainly that no controlled human panel has compared how a
75 °C cup *feels* against a 95 °C one, so that part is interpretive.

Effect vocabulary is judged against materia medica and TCM rather than tea
writing, since tea's own sensory lexicons cover flavour and mouthfeel and never
name effects. Where a claim is traditional rather than clinical, it's recorded
as traditional.

> **Caveat worth stating up front:** the header comment in
> `src/data/extractionProfiles.js` still describes the file as mock data for 30
> ingredients. That comment is stale — the research phase it anticipated has
> happened, and the parity audits above run green against the current 52
> profiles — but it hasn't been rewritten yet.

---

## Running it

```bash
npm install
npm run dev              # Vite dev server
```

Playwright owns port 5173, so use `npx vite --port 5174 --strictPort` if the
E2E suite is running. On WSL2, `vite.config.js` polls for changes because
inotify events don't cross `/mnt/c`.

Native builds go through `npm run cap:sync` (build + `npx cap sync`) before
opening Xcode or Android Studio — skipping it serves a stale bundle to the
WebView, which once left the iOS build three months behind the web app.

```
src/algo/         the prediction pipeline
src/data/         catalogue, extraction profiles, blends, vocabulary
src/screens/      top-level screens
src/components/   shared UI
tests/            Node suites
e2e/              Playwright specs
tools/            data-integrity audits and authoring helpers
docs/research/    per-ingredient sources
```

---

Built by [Tom Mathews](mailto:tmathews4@gmail.com). Nine years in test automation
and internal tooling at a Chicago proprietary trading firm; this is the same
discipline applied to a product I wanted to exist.
