# Android Status-Bar Overlap — Open Bug

Resume here when prompted with "return to android testing."

## Symptom

App content renders under the system status bar — the phone's clock,
battery, signal icons appear on top of Herbanium's UI rather than
above it. Reproducible on the user's Android phone via debug install
from Android Studio.

## Hypotheses, ranked

1. **Android 15 (API 35) edge-to-edge enforcement.** Google forces
   edge-to-edge for apps targeting SDK 35; `setDecorFitsSystemWindows
   (true)` is deprecated and ignored on that target. If the user's
   phone is on Android 15, our overrides (theme + MainActivity) are
   no-ops. **Need: confirm Android version on the phone.**
2. **Stale Gradle build cache.** Build output showed
   `compileDebugJavaWithJavac UP-TO-DATE` after pulling the
   MainActivity change, suggesting the new bytecode never made it
   into the APK. **Need: clean rebuild + uninstall the app from the
   phone first.** This was the next thing to try when the user
   stopped for the night.
3. **BridgeActivity overrides our override.** Capacitor 8's
   BridgeActivity sets `setDecorFitsSystemWindows(false)` inside
   `super.onCreate(...)`. We flip it back to `true` in our
   MainActivity *after* super, so this should work — unless
   BridgeActivity also wires a `WindowInsetsListener` that re-applies
   edge-to-edge after our flip. (Untested.)

## What's already shipped (commit history)

- `c78719c` (already older) — first attempt with status-bar plugin
  (`StatusBar.setStyle`, `setBackgroundColor`, `setOverlaysWebView`)
  fired from `src/helpers/native.js` `configureStatusBar`. Set the
  bar dark/ivory but didn't fix the overlap.
- `49fe652` — added `fitsSystemWindows`, `statusBarColor`,
  `windowLightStatusBar` to `AppTheme.NoActionBarLaunch` in
  `android/app/src/main/res/values/styles.xml` (the splash theme,
  which is the one MainActivity actually uses per AndroidManifest).
- `49aa3fe` — overrode `MainActivity.onCreate()` to call
  `WindowCompat.setDecorFitsSystemWindows(window, true)` after
  `super.onCreate()` to undo Capacitor 8's edge-to-edge default.

After all three, user reported the overlap is still present (build
cache may have masked the MainActivity change — see hypothesis 2).

## Next steps when we resume

1. **Confirm Android version on the phone** (Settings → About Phone
   → Android version). Critical — determines whether we're fighting
   a real bug or fighting Android 15's hard enforcement.
2. **If on Android 14 or earlier:**
   - In Android Studio: Build → Clean Project → Rebuild Project.
   - On phone: Settings → Apps → Herbanium → Uninstall.
   - Run again. The MainActivity override should now take effect
     and content should sit below the status bar.
3. **If on Android 15:**
   - Don't fight enforcement. Either:
     - Drop `compileSdkVersion` from 35 → 34 in
       `android/variables.gradle` so we don't target the new
       behavior. Caveat: Play Store will eventually require 35.
     - Or install `@capacitor-community/safe-area` which
       polyfills `env(safe-area-inset-*)` values on Android, so
       our existing CSS-driven safe-area handling in
       `App.jsx` (PhoneFrame `paddingTop` and TabBar
       `padding-bottom`) will actually receive non-zero insets.
       This is the Android-15-friendly path.

## Files involved

- `src/helpers/native.js` — `configureStatusBar()` runtime setters
- `android/app/src/main/res/values/styles.xml` — both `AppTheme.
  NoActionBar` and `AppTheme.NoActionBarLaunch` styles
- `android/app/src/main/AndroidManifest.xml` — declares activity
  theme (currently `NoActionBarLaunch`)
- `android/app/src/main/java/app/herbanium/MainActivity.java` —
  `onCreate` override flipping decor-fits-system-windows back to true
- `src/App.jsx` — `PhoneFrame` `paddingTop: env(safe-area-inset-top)`
  and TabBar `padding-bottom: max(22px, env(safe-area-inset-bottom))`

## What we know works

- The web build is unaffected — `env(safe-area-inset-*)` is 0 on
  desktop browsers and the layout is fine.
- iOS path is untested (no Mac yet) but the same code paths target
  it; iOS reports `env(safe-area-inset-*)` correctly without the
  Android-specific theme/MainActivity workarounds, so it should
  Just Work whenever we test there.
