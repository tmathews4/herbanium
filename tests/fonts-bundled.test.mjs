/* ──────────────────────────────────────────────────────────────
   tests/fonts-bundled.test.mjs

   The typefaces ship with the app. Nothing may quietly put them
   back on a CDN.

   WHY THIS MATTERS MORE THAN IT LOOKS. The app's stated architecture
   is that reference data is bundled — no backend, no network on the
   critical path — and typography was the one thing still fetched at
   runtime. The Capacitor build rendered in fallback faces with no
   connection, and on iOS the webfont resolved late enough that
   visitors watched headings swap from Georgia to Fraunces after
   paint.

   IT ALSO HID A BUG, which is the real argument for a guard here.
   There were FOUR loading points — index.html plus three <link>
   blocks rendered by App.jsx, one per top-level branch — and they
   had drifted into asking for different things. Only the App.jsx
   ones requested JetBrains Mono, and those branches unmount, so
   `ff.mono` (21 call sites) fell back to ui-monospace in the running
   app. Nobody could see that by reading any single file, which is
   exactly the kind of divergence one declaration prevents.

   Run: node tests/fonts-bundled.test.mjs
   ────────────────────────────────────────────────────────────── */

import { readFileSync, readdirSync, existsSync, statSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, resolve, join, relative } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const SRC = join(ROOT, "src");
const FONT_DIR = join(SRC, "assets/fonts");

let pass = 0, fail = 0;
const failures = [];
function test(desc, fn) {
  try { fn(); pass++; process.stdout.write("."); }
  catch (e) { fail++; failures.push({ desc, message: e.message }); process.stdout.write("F"); }
}
function assert(cond, msg) { if (!cond) throw new Error(msg); }

console.log("Fonts — bundled, licensed, and declared once\n");

const css = readFileSync(join(SRC, "index.css"), "utf8");

// The one place a CDN font link is still fine, with its reason.
const CDN_ALLOWED = {
  "public/privacy.html":
    "A standalone legal page, served on the web and opened outside the "
    + "app. It isn't Vite-processed, so it can't reference the hashed "
    + "bundled assets, and it isn't part of the offline WebView bundle "
    + "either — nothing about the app's offline claim depends on it.",
};

function sourceFiles(dir) {
  const out = [];
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) out.push(...sourceFiles(full));
    else if (/\.(jsx?|css|html)$/.test(name)) out.push(full);
  }
  return out;
}

test("no font CDN is referenced from the app", () => {
  const files = [...sourceFiles(SRC), join(ROOT, "index.html"), join(ROOT, "public/privacy.html")];
  const offenders = [];
  for (const full of files) {
    if (!existsSync(full)) continue;
    const rel = relative(ROOT, full).replace(/\\/g, "/");
    if (rel in CDN_ALLOWED) continue;
    const text = readFileSync(full, "utf8");
    text.split("\n").forEach((line, i) => {
      if (/fonts\.(googleapis|gstatic)\.com/.test(line) && !line.trim().startsWith("*")
          && !line.includes("No font CDN")) {
        offenders.push(`${rel}:${i + 1}`);
      }
    });
  }
  assert(offenders.length === 0,
    `the typefaces are bundled — these fetch them at runtime instead:\n  ${offenders.join("\n  ")}`);
});

test("every family the theme asks for is declared locally", () => {
  // Read the families out of theme.js rather than restating them, so a
  // new family added to `ff` fails here until it's bundled — which is
  // the exact hole JetBrains Mono fell through.
  const theme = readFileSync(join(SRC, "theme.js"), "utf8");
  const block = theme.match(/export const ff = \{([\s\S]*?)\};/);
  assert(block, "couldn't find `ff` in theme.js");
  const wanted = [...block[1].matchAll(/"([^"]+)"/g)].map(m => m[1])
    // Only the app's own faces; the rest of each stack is the fallback
    // chain and is supposed to be the system's.
    .filter(f => !/^(system-ui|sans-serif|serif|monospace|ui-monospace|Georgia|Inter|Cormorant Garamond)$/.test(f));
  assert(wanted.length >= 3, `expected the three house families, parsed ${JSON.stringify(wanted)}`);
  for (const fam of wanted) {
    assert(new RegExp(`font-family: *'${fam}'`).test(css),
      `theme.js uses "${fam}" but index.css declares no @font-face for it — `
      + `it will silently fall back, the way ff.mono did`);
  }
});

test("every declared font file exists", () => {
  const urls = [...css.matchAll(/src: *url\('([^']+)'\)/g)].map(m => m[1]);
  assert(urls.length >= 4, `expected at least 4 font sources, found ${urls.length}`);
  for (const u of urls) {
    const full = resolve(SRC, u.replace(/^\.\//, ""));
    assert(existsSync(full), `index.css points at ${u}, which doesn't exist`);
  }
});

test("the fonts are latin-subset, not the full family", () => {
  // A whole-family woff2 is several times the size for glyphs the app
  // has no copy for. Caught by weight rather than by filename.
  for (const f of readdirSync(FONT_DIR).filter(n => n.endsWith(".woff2"))) {
    const kb = statSync(join(FONT_DIR, f)).size / 1024;
    assert(kb < 200, `${f} is ${Math.round(kb)}KB — too big for a latin subset`);
  }
});

test("every shipped font ships its license", () => {
  // OFL 1.1's one hard requirement on redistribution.
  const files = readdirSync(FONT_DIR);
  const fonts = files.filter(n => n.endsWith(".woff2"));
  const licenses = files.filter(n => /^OFL.*\.txt$/i.test(n));
  assert(fonts.length > 0, "no fonts found");
  assert(licenses.length >= 3,
    `${fonts.length} font files but only ${licenses.length} license(s) — OFL requires the `
    + `license travel with the font`);
  for (const l of licenses) {
    const text = readFileSync(join(FONT_DIR, l), "utf8");
    assert(/SIL OPEN FONT LICENSE/i.test(text), `${l} doesn't look like an OFL license`);
  }
});

console.log(`\n\n  ${pass} passed, ${fail} failed`);
if (fail > 0) {
  console.log("\nFailures:");
  for (const f of failures) console.log(`  ✗ ${f.desc}\n    ${f.message}`);
  process.exit(1);
}
