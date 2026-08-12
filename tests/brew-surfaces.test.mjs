/* ──────────────────────────────────────────────────────────────
   tests/brew-surfaces.test.mjs — no brew window without a spec.

   e2e/brew-dock-reachable.spec.ts checks that a brew dock is clear of
   the main menu on each of the three screens that mount one. That
   spec is a list, and a list of screens is exactly the thing that goes
   stale: the fourth screen to mount a <BrewSurface> would be checked
   by nothing, and every existing test would still pass.

   Which is not hypothetical here. e2e/brew-everywhere.spec.ts opens by
   recording that two panels had been added without a Brew button
   because the button was rebuilt at each call site — "the 'again' is
   the important word." The same shape, one level up: coverage defined
   per call site rather than named once.

   So this compares two lists that must agree:

     the files in src/ that render <BrewSurface>
     the windows named in e2e/helpers/brew.ts's BREW_WINDOWS

   The direction that matters is a host with NO entry. The reverse — an
   entry with no host — is checked too, because a walk left pointing at
   a deleted screen fails as a timeout, which reads as flake rather
   than as the stale list it is.

   It reads the source as text on purpose: importing a .jsx screen
   pulls React, the catalogue and the whole engine behind it to answer
   a question about which files contain a string.
   ────────────────────────────────────────────────────────────── */

import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

let passed = 0;
const failures = [];
const test = (name, fn) => {
  try { fn(); passed++; }
  catch (e) { failures.push(`${name}: ${e.message}`); }
};
const assert = (cond, msg) => { if (!cond) throw new Error(msg); };

const SRC = new URL("../src/", import.meta.url).pathname;
const HELPER = new URL("../e2e/helpers/brew.ts", import.meta.url).pathname;

const walk = (dir) => readdirSync(dir).flatMap((entry) => {
  const full = join(dir, entry);
  return statSync(full).isDirectory() ? walk(full) : [full];
});

// Every file that actually mounts the brew panel. The component itself
// is not a host — it's the thing being mounted.
const hosts = walk(SRC)
  .filter(f => /\.(jsx?|tsx?)$/.test(f))
  .filter(f => !f.endsWith("BrewSurface.jsx"))
  .filter(f => /<BrewSurface\b/.test(readFileSync(f, "utf8")))
  .map(f => f.slice(SRC.length))
  .sort();

// The dock ids named in BREW_WINDOWS, and the id each host actually
// docks into. A host with its own <BrewDockProvider value={X}> docks
// into X; anything else falls through to the default tab dock.
const helper = readFileSync(HELPER, "utf8");
const coveredDocks = new Set(
  [...helper.matchAll(/dockId:\s*"([^"]+)"/g)].map(m => m[1])
);

const DOCK_CONSTANTS = {
  BREW_DOCK_ID: "brew-dock",
  BLEND_DETAIL_DOCK_ID: "brew-dock-blend-detail",
  INGREDIENT_DETAIL_DOCK_ID: "brew-dock-ingredient-detail",
};

const dockOf = (relPath) => {
  const text = readFileSync(join(SRC, relPath), "utf8");
  const provided = text.match(/<BrewDockProvider\s+value=\{(\w+)\}/);
  return provided ? DOCK_CONSTANTS[provided[1]] : DOCK_CONSTANTS.BREW_DOCK_ID;
};

test("the reachability spec covers every screen that mounts a brew panel", () => {
  assert(hosts.length > 0,
    "found no <BrewSurface> anywhere in src/ — the scan itself is broken, " +
    "which would let this test pass while covering nothing");
  for (const host of hosts) {
    const dock = dockOf(host);
    assert(dock,
      `${host} provides a BrewDockProvider whose value this test doesn't know — ` +
      `add it to DOCK_CONSTANTS here`);
    assert(coveredDocks.has(dock),
      `${host} mounts a brew panel into "${dock}", which BREW_WINDOWS in ` +
      `e2e/helpers/brew.ts does not name. Add a walk to it there, or ` +
      `e2e/brew-dock-reachable.spec.ts will never look at that screen.`);
  }
});

test("and names no screen that has stopped mounting one", () => {
  const live = new Set(hosts.map(dockOf));
  for (const dock of coveredDocks) {
    assert(live.has(dock),
      `BREW_WINDOWS names "${dock}" but nothing in src/ mounts a brew panel ` +
      `into it any more — the walk will fail as a 45s timeout, which reads ` +
      `as flake rather than as a stale list`);
  }
});

test("the dock ids in the helper are real ids, not invented ones", () => {
  /* The two lists could agree perfectly on a string that the app never
     renders — both sides written from the same wrong memory. Anchor
     them to helpers/dock.js, which is where the ids are defined. */
  const dockSource = readFileSync(join(SRC, "helpers/dock.js"), "utf8");
  for (const dock of coveredDocks) {
    assert(dockSource.includes(`"${dock}"`),
      `"${dock}" is not defined in src/helpers/dock.js`);
  }
});

for (const f of failures) console.log("FAIL " + f);
console.log(`\n  ${passed} passed, ${failures.length} failed`);
if (failures.length) process.exit(1);
