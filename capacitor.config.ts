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
};

export default config;
