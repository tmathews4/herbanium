# Native Build Workflow (iOS + Android)

Herbanium ships as a Vite + React web app deployed to Vercel, *and* as
native iOS and Android apps wrapped via Capacitor. This document is the
checklist for moving between the web build and the native shells.

## The mental model

- `dist/` is the source of truth for what the app *is*. Vite builds it
  the same way for web and for native.
- `android/` and `ios/App/` are thin native shells whose only job is to
  load `dist/` inside a system WebView. They're checked into git as
  scaffolded; their per-machine build outputs are gitignored.
- `npx cap copy` pushes the latest `dist/` into both shells. `npx cap
  sync` does that *plus* refreshes any plugin code (use this after
  `npm install`-ing a new `@capacitor/*` plugin).
- Account-bound things (signing keys, store listings, Apple/Google
  developer accounts) are deferred until first submission.

## Day-to-day workflow

```sh
# Whatever feature work you're doing on the web side
npm run dev

# When ready to test on a device:
npm run cap:sync                # build + cap sync
npm run cap:android             # opens Android Studio
npm run cap:ios                 # opens Xcode (Mac only)
```

`cap:sync` is the only command you need between web changes and a
device build.

## Android — first build (works on Linux/Mac/Windows)

1. Install Android Studio (or `sdkmanager` + `platform-tools` if you
   want a CLI-only setup).
2. `npm run cap:android` — opens Android Studio on the project.
3. First run: let Gradle download the SDK + platform tools (a few
   minutes; cached after).
4. Plug in an Android phone with USB debugging on, or use the AVD
   emulator. Hit run.
5. The app installs as `com.herbanium.app` (the appId in
   `capacitor.config.ts`).

## iOS — first build (Mac required)

1. Install Xcode (App Store) and CocoaPods (`sudo gem install
   cocoapods`).
2. From the repo root: `cd ios/App && pod install` once.
3. Back at repo root: `npm run cap:ios` — opens
   `ios/App/App.xcworkspace` in Xcode.
4. Pick a target device or simulator, hit run.
5. For physical-device testing you'll need a free Apple ID added under
   Xcode → Settings → Accounts. App Store submission requires the paid
   Developer Program ($99/yr) — not needed for dev builds.

## Generating app icons + splash screens

```sh
# Drop a 1024×1024 source PNG at assets/icon.png
# Drop a 2732×2732 source PNG at assets/splash.png
npm run cap:assets
```

`@capacitor/assets` regenerates every required size for both
platforms. Re-run whenever the source artwork changes.

The current placeholder icons are Capacitor's defaults — replace
before any store submission.

## Pre-submission punch list

Things to do before first store upload, in roughly the order they
matter:

- [ ] Replace the appId `com.herbanium.app` with one you actually
      own (reverse-DNS — once published, this can never change for
      this app).
- [ ] Source-art icons (1024×1024 PNG) and splash (2732×2732 PNG).
      Run `npm run cap:assets`.
- [ ] Privacy policy hosted at a stable URL. Disclose: localStorage
      data stays on-device; Formspree feedback POSTs to a third-party
      service when the user submits the feedback form.
- [ ] Decide what to do about the `?dev` URL flag — won't work in a
      WebView wrap. Either gate dev mode on a long-press signal or
      accept that it's web-only.
- [ ] Test the localStorage export/import flow on both platforms.
      File-picker behavior differs from a desktop browser.
- [ ] Hardware back button on Android — Capacitor's default is
      "navigate back in WebView history"; the app's modal overlays
      already use `history.pushState` so this should mostly Just
      Work. Verify on a physical device.
- [ ] Safe-area insets — add CSS `env(safe-area-inset-*)` padding so
      content doesn't sit under the iPhone notch or under Android's
      gesture pill.
- [ ] Status bar styling. Default is fine; install
      `@capacitor/status-bar` if we want light/dark per screen.
- [ ] Screenshots: iPhone 6.7" + iPhone 5.5" mandatory for App Store;
      Android phone + 7" tablet for Play.
- [ ] Age rating questionnaire for both stores. Herbanium is mostly
      tea content with a tiny mythic side-game; expect 4+ on iOS,
      Everyone on Google Play.
- [ ] App Store + Play Store listings: short description, long
      description, keywords/tags, category. Drafts before accounts
      exist are fine — paste them in when submitting.

## Releases

Once accounts exist:

- Android: Play Console → upload signed AAB. Capacitor's Android
  Studio export handles signing once a keystore is configured. **Back
  up the keystore** — losing it means no more updates to that listing.
- iOS: Xcode → Product → Archive → distribute via App Store Connect.
  Apple handles signing via the dev portal; just check the boxes.

## Troubleshooting

- **WebView shows white screen on first launch.** Almost always means
  `dist/` is empty or stale. Run `npm run cap:sync` and rebuild the
  native app.
- **Plugin import fails at runtime in the WebView.** You probably
  forgot to run `npx cap sync` after installing the plugin.
- **iOS build fails with CocoaPods complaint.** From `ios/App/`,
  delete `Podfile.lock` and `Pods/`, then `pod install` again.
