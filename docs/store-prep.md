# Store-Prep Action List

Saved from the Capacitor wrap-up conversation. This is the work to do
*before* opening Apple Developer / Google Play Console accounts.
Everything here is reversible — accounts (and the appId, which is
permanent once published) are committed last.

See `docs/native-build.md` for the day-to-day Capacitor workflow.

---

## Code-side, before any device test

- [ ] **Pick the real appId.** Currently `com.herbanium.app` in
      `capacitor.config.ts` — placeholder. Replace with reverse-DNS
      you actually own (e.g. `com.tmathews.herbanium`). Once
      submitted, this string is locked to the listing forever.

- [ ] **Decide what to do with the `?dev` URL flag.** Won't work in a
      WebView wrap (no URL bar). Options:
      1. Gate dev mode on a long-press of a logo or hidden tap area.
      2. Hide it under a Profile → Settings entry that appears only
         on dev builds.
      3. Accept that dev mode is web-only.

- [ ] **Safe-area CSS.** Add `env(safe-area-inset-*)` padding so
      content clears the iPhone notch / dynamic island and Android's
      gesture-pill area. Touchpoints:
      - `PhoneFrame` outer container — top inset
      - `TabBar` — bottom inset (the existing 22px hardcoded bottom
        padding should become `max(22px, env(safe-area-inset-bottom))`)
      - Modal overlays (SteepScreen, LogScreen, ElementalArrivalCard,
        FeedbackModal) — top inset

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

- [ ] **Privacy policy.** Hosted at a stable URL. Discloses:
      1. Brew sessions, journal entries, blends, pantry, and bestiary
         data live in localStorage on the device. No account, no
         cloud sync.
      2. The feedback form posts to Formspree (third party) when the
         user submits. Mailto fallback if that fails.
      3. No analytics, no crash reporting, no advertising IDs (yet).

- [ ] **App description, short + long.** A two-sentence pitch and a
      ~200-word longer version. Voice should match the app's
      apothecary-poet register.

- [ ] **Keywords / tags.** Apple gives 100 chars; Google uses
      categories + the description for keyword surfacing. Examples:
      tea, brewing, journal, herbs, apothecary, pu-erh, sencha,
      meditation, ritual.

- [ ] **App categories.** Apple: Lifestyle (or Food & Drink, both
      defensible). Google: Lifestyle.

- [ ] **Age rating questionnaire answers.** Mostly tea content; the
      mythic side-game (bestiary, wild elementals) is gentle. Expect
      4+ on iOS, Everyone on Google Play.

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
- [ ] Pay attention to data-safety form on Google Play; the
      Formspree disclosure goes there.
