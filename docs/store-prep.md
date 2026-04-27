# Store-Prep Action List

Saved from the Capacitor wrap-up conversation. This is the work to do
*before* opening Apple Developer / Google Play Console accounts.
Everything here is reversible — accounts (and the appId, which is
permanent once published) are committed last.

See `docs/native-build.md` for the day-to-day Capacitor workflow.

---

## Code-side, before any device test

- [x] ~~**Pick the real appId.**~~ Set to `app.herbanium`
      (reverse-DNS from the owned `herbanium.app` domain). Once
      submitted to either store this string locks to the listing
      forever, so any further change has to happen *before* first
      upload. Native projects regenerated with the new id on both
      platforms (Android Java package: `app.herbanium`, iOS bundle
      identifier: `app.herbanium`).

- [x] ~~Decide what to do with the `?dev` URL flag.~~ Hidden
      Profile-footer toggle: tap the version line at the bottom of
      Profile five times within 3 seconds to reveal a "Developer
      mode" switch. `isDev` resolves as `urlHasDev || devModeEnabled`,
      so web `?dev=1` still works unchanged.

- [x] ~~Safe-area CSS.~~ Done in `App.jsx`:
      - PhoneFrame inner column: `paddingTop: env(safe-area-inset-top)`
      - TabBar dock: `padding-bottom: max(22px, env(safe-area-inset-bottom))`
      - Modal overlays not yet patched — revisit if device test
        shows them clipping under the notch.

- [x] ~~Test localStorage export/import on a physical device.~~
      Decision: export/import is desktop-web only. Hidden in the
      native wrap via `isNativeApp()` in `src/helpers/platform.js`
      so iOS / Android users don't see buttons that wouldn't work
      cleanly anyway. No store-side work here.

- [ ] **Hardware back button on Android.** Capacitor's default is
      "navigate back in WebView history." The app already pushes
      `history.pushState` for modal overlays so this should mostly
      Just Work — verify on a physical device. Edge case: back from
      the home tab should background the app, not exit the WebView.

## Assets

- [ ] **App icon source.** 1024×1024 PNG at `assets/icon.png`. Should
      read at 48×48 (smallest required render).

- [ ] **Splash screen source.** 2732×2732 PNG at `assets/splash.png`.
      Centered logo on the ivory background; safe area roughly the
      middle 1024×1024.

- [ ] **Run `npm run cap:assets`** once both source files exist —
      regenerates every required size for both platforms.

- [ ] **App Store screenshots.** iPhone 6.7" (1290×2796) and iPhone
      5.5" (1242×2208) mandatory. iPad 12.9" optional. Take from a
      real device or simulator running the actual app.

- [ ] **Google Play screenshots.** Android phone (1080×1920 or
      similar 16:9) plus 7" tablet. Same: real device or AVD.

## Listings (draft now, paste in later)

- [x] ~~**Privacy policy.** Hosted at a stable URL.~~ Drafted at
      `public/privacy.html`, deployed automatically with the next
      Vercel build. Will live at:
      `https://herbanium.app/privacy.html`. Native-app story is
      genuinely "zero outbound network calls" so the policy is short:
      data stays on the device, no third parties, no analytics.

- [x] ~~**App description, short + long.**~~ Drafted in
      `docs/listing-copy.md` along with subtitle/short-description
      variants for both stores.

- [x] ~~**Keywords / tags.**~~ Drafted in `docs/listing-copy.md`
      (99 chars within Apple's 100-char budget).

- [x] ~~**App categories.**~~ Apple: Lifestyle / Food & Drink.
      Google: Lifestyle. Reasoning in `docs/listing-copy.md`.

- [x] ~~**Age rating questionnaire answers.**~~ Pre-answered in
      `docs/listing-copy.md`. Expected: 4+ on iOS, Everyone on
      Google Play.

## Account-bound steps (last)

- [ ] **Apple Developer Program membership** ($99/yr).
- [ ] **Google Play Console account** ($25 one-time).
- [ ] **App Store Connect listing** with screenshots + privacy
      policy URL + description + age rating.
- [ ] **Play Console listing** with the same.
- [ ] **Android keystore generated and BACKED UP.** Lose it and you
      can never update the listing — must publish under a new appId.
- [ ] **Apple distribution certificate.** Xcode handles this via the
      Developer Portal; just check the boxes.

## First submission

- [ ] Apple — Xcode → Product → Archive → distribute via App Store
      Connect. Review window: 1–3 days typical.
- [ ] Google — Play Console → upload signed AAB. Review window: 1–2
      days typical.
- [ ] Google Play data-safety form: with the feedback form
      desktop-only, the native answer is "no data collected, no
      data shared." Confirm that's still true at submission time.
