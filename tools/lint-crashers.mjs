#!/usr/bin/env node
/* ──────────────────────────────────────────────────────────────
   tools/lint-crashers.mjs — the lint rules that mean "this breaks",
   separated from the ones that mean "this is untidy".

   Three crashes shipped to the dev server in a single session, all the
   same shape: an identifier used and never imported or declared.
   `jumpNonce` on a component prop, `useState` in a new component,
   `revealedSorted` read from a scope that didn't have it — the last of
   those had been latent in the codebase, throwing whenever a particular
   swap button was tapped.

   Every one was already being reported by ESLint's `no-undef`. Nothing
   surfaced it, because `npm run lint` reports ~200 findings across
   src/, almost all style, and a real crash sits invisibly among them.
   esbuild doesn't help: it bundles undefined globals happily, since
   resolving them isn't its job.

   So this runs the same linter and cares about a short list: rules
   where a hit is a bug that will throw or silently drop data, not a
   preference. The baseline for those is currently ZERO, which is what
   makes the check enforceable.

   NOT in `npm test` — ESLint over src/ takes about two minutes under
   WSL, and a unit suite that slow stops being run. It belongs in CI,
   beside typecheck.

   Run: node tools/lint-crashers.mjs
   ────────────────────────────────────────────────────────────── */

import { ESLint } from "eslint";

/* Each of these means "this code is wrong", not "this code is untidy".

   no-undef        — a reference that throws. Three this session.
   no-dupe-keys    — a later key silently overwrites an earlier one, so
                     the object you wrote is not the object you get.
   no-dupe-args    — same, for parameters.
   no-unsafe-negation, no-unreachable, no-const-assign, no-dupe-class-members
                   — each a statement that cannot do what it says.

   Deliberately NOT here: no-unused-vars, exhaustive-deps, the react-hooks
   advisories. They're worth fixing and they are not crashes, and mixing
   them back in is what made the real ones invisible. */
const CRASHERS = new Set([
  "no-undef",
  "no-dupe-keys",
  "no-dupe-args",
  "no-dupe-class-members",
  "no-const-assign",
  "no-unreachable",
  "no-unsafe-negation",
  "no-obj-calls",
  "no-func-assign",
]);

const eslint = new ESLint();
const results = await eslint.lintFiles(["src/**/*.{js,jsx}"]);

const hits = [];
for (const file of results) {
  for (const m of file.messages) {
    if (!CRASHERS.has(m.ruleId)) continue;
    hits.push({
      file: file.filePath.replace(process.cwd() + "/", ""),
      line: m.line,
      rule: m.ruleId,
      text: m.message,
    });
  }
}

if (hits.length === 0) {
  console.log(`No crash-class lint findings across ${results.length} files.`);
  console.log(`Watching: ${[...CRASHERS].join(", ")}`);
  process.exit(0);
}

console.log(`${hits.length} crash-class finding(s) — these throw or drop data:\n`);
for (const h of hits) {
  console.log(`  ${h.file}:${h.line}`);
  console.log(`    [${h.rule}] ${h.text}`);
}
console.log("\nStyle findings are deliberately excluded — see the header.");
process.exit(1);
