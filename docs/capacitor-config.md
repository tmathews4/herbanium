# capacitor.config.json — why it's JSON, and what each setting is for

## Why not `capacitor.config.ts`

It was a `.ts` file with these notes as comments, which is the better
home for them. It had to move.

`@capacitor/cli` transpiles a TypeScript config itself, using the
TypeScript 5 compiler API — `ts.transpileModule` with
`ts.ModuleKind.CommonJS`. This project depends on `typescript@^7`,
the Go rewrite, which doesn't expose that API. So the CLI dies before
it reads anything:

```
TypeError: Cannot read properties of undefined (reading 'CommonJS')
  at require.extensions..ts (@capacitor/cli/dist/util/node.js:20)
```

`npm run cap:sync` was failing for both platforms, which is how the
iOS bundle drifted three months behind the web app without anyone
noticing — the command that would have caught it couldn't run.

**`.js` doesn't work either.** The CLI tries `.ts`, then `.js`, then
`.json`. It loads a `.js` config with `require()` and expects the
object back; `package.json` sets `"type": "module"`, so a `.js` file
is ESM and `require()` hands back `{ default: config }`. Capacitor
reads no recognised keys and silently falls back to its defaults —
`webDir: "www"` — which fails in a confusing way rather than an
obvious one.

So: JSON, which needs no loader. Don't convert it back without
checking the TypeScript version first.

## The settings

**`appId: app.herbanium`** — permanent identifier for store listings.
Reverse-DNS you own. Changing it after first submission means a new
app.

**`webDir: dist`** — Vite's build output. Run `npm run build` before
`npx cap sync`, or the WebView serves a stale bundle. That is exactly
what happened to iOS: assets dated 2026-04-28 against a fix landed
2026-04-30, so the "same poem every time" bug survived on device long
after it was fixed in the repo.

**`server.androidScheme: https`** — bundled-only mode. The WebView
loads the built bundle from disk rather than a remote server, so the
app works offline and doesn't depend on the deploy after install. The
Formspree feedback POST is the only outbound call in the app today.

**`ios.contentInset: always`** — Apple recommends a launch storyboard
over an image splash; Capacitor's default storyboard is fine until we
ship a custom one.

**`android.allowMixedContent: false`** — the WebView uses system
Chrome on modern Android, AndroidX WebView on older.

**`plugins.StatusBar`** — applied during native shell init, BEFORE the
WebView renders its first frame. The runtime `configureStatusBar()`
call in `helpers/native.js` stays as belt-and-braces, but this static
block is what prevents the first-paint state where the WebView lands
behind the system status bar and content — the home poem card, in-app
back buttons — ends up unreachable under the phone's status icons.

- `overlaysWebView: false` — keep the system bar as its own strip so
  the WebView starts below it. Without this,
  `env(safe-area-inset-top)` resolves to 0 on Android.
- `style: "DARK"` — dark icons on the ivory background. "Dark" in the
  plugin's vocabulary means "dark icons for a light bg": confusing
  name, correct behaviour for our light-mode default.
- `backgroundColor: "#F3ECDC"` — matches the app shell's ivory. The
  dark-mode flip is handled by the runtime call once the page has
  mounted and `prefers-color-scheme` can be evaluated.
