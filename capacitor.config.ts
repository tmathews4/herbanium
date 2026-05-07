/// <reference types="@capacitor/cli" />

/* ──────────────────────────────────────────────────────────────
   capacitor.config.ts — native wrapper config for iOS + Android.

   The app id is the permanent identifier for store listings; pick
   it carefully before first store submission. Reverse-DNS owned
   by you.

   webDir points at Vite's build output. Run `npm run build` then
   `npx cap copy` (or `npx cap sync` to also update plugins) before
   each native build so the WebView serves the current bundle.
   ────────────────────────────────────────────────────────────── */

import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "app.herbanium",
  appName: "Herbanium",
  webDir: "dist",

  // Bundled-only mode: the WebView loads the built bundle from disk,
  // not a remote server. Means the app works offline and doesn't
  // depend on the Vercel deploy after install. The Formspree
  // feedback POST still hits the network when used; that's the only
  // outbound call in the app today.
  server: {
    androidScheme: "https",
  },

  // iOS-specific behavior. Apple recommends a launch storyboard
  // rather than an image splash, and the default Capacitor
  // storyboard is fine until we ship a custom one. Status bar
  // styling is handled by @capacitor/status-bar plugin if/when we
  // need to toggle dark/light per screen.
  ios: {
    contentInset: "always",
  },

  // Android-specific behavior. The WebView uses the system Chrome
  // on modern Android; older versions fall back to AndroidX WebView.
  android: {
    allowMixedContent: false,
  },

  // Plugin-level config — applied during native shell init, BEFORE
  // the WebView renders its first frame. The runtime
  // configureStatusBar() call in helpers/native.js stays as a
  // belt-and-suspenders, but this static block is what prevents the
  // first-paint state where the WebView lands behind the system
  // status bar (and content like the home poem card or in-app back
  // buttons end up unreachable under the phone's status icons).
  plugins: {
    StatusBar: {
      // Keep the system bar visible as its own strip; the WebView
      // starts below it instead of extending under it. Without
      // this, env(safe-area-inset-top) resolves to 0 on Android.
      overlaysWebView: false,
      // Dark icons on the ivory background. "Dark" in the plugin's
      // vocabulary means "dark icons for a light bg" — confusing
      // naming, correct behavior for our light-mode default.
      style: "DARK",
      // Match the app shell's ivory so the status-bar strip blends
      // with the page below it. Dark-mode flip is handled by the
      // runtime configureStatusBar call once the page has mounted
      // and prefers-color-scheme can be evaluated.
      backgroundColor: "#F3ECDC",
    },
  },
};

export default config;
