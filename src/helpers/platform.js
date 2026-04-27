/* ──────────────────────────────────────────────────────────────
   helpers/platform.js — runtime platform detection.

   Single check used to gate features that don't make sense (or
   don't work cleanly) inside a Capacitor WebView wrap. Today
   that's just the localStorage export/import flow — the file-
   picker shim differs across iOS/Android and the desktop voice
   ("export your data") doesn't fit a phone anyway.

   Falls back to "web" if Capacitor's runtime isn't present, so
   this works pre-wrap and post-wrap.
   ────────────────────────────────────────────────────────────── */

import { Capacitor } from "@capacitor/core";

export function isNativeApp() {
  try {
    return Capacitor.isNativePlatform();
  } catch {
    return false;
  }
}
