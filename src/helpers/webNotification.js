/* ──────────────────────────────────────────────────────────────
   helpers/webNotification.js — browser-side Notifications API.

   Complements the Capacitor LocalNotifications path for users
   running the web build (or for whom the Capacitor pre-schedule
   couldn't fire — fallback insurance). Requests permission lazily
   on first call; no permission popup until the user has actively
   started a brew, which keeps onboarding clean.

   On native (Capacitor wrapper), this is a no-op — the system
   notification scheduled via @capacitor/local-notifications is
   the reliable path there. We avoid double-firing.

   Web notifications only show when the tab is hidden (the user
   has tabbed away or backgrounded the browser). When the user is
   actively looking at the page, the in-page READY label + chime
   already do the work; firing a system-bar notification on top
   of that would be overkill.
   ────────────────────────────────────────────────────────────── */

import { isNativeApp } from "./platform";

let _permissionRequested = false;

/**
 * Lazily request browser notification permission. Idempotent —
 * subsequent calls re-check rather than re-prompting. Returns
 * true if granted, false otherwise (no permission API, denied,
 * or running on native where this path is intentionally a no-op).
 */
export async function requestWebNotificationPermission() {
  if (isNativeApp()) return false;
  if (typeof window === "undefined") return false;
  if (!("Notification" in window)) return false;
  if (Notification.permission === "granted") return true;
  if (Notification.permission === "denied") return false;
  if (_permissionRequested) return false;
  _permissionRequested = true;
  try {
    const result = await Notification.requestPermission();
    return result === "granted";
  } catch {
    return false;
  }
}

/**
 * Fire a browser notification when the page is hidden. No-op on
 * native (Capacitor's LocalNotification handles that path), and
 * no-op when the page is visible (the in-page READY state + chime
 * are the in-app indicator). Permission must already be granted —
 * call requestWebNotificationPermission() earlier in the flow.
 */
export function fireWebNotification(title, body) {
  if (isNativeApp()) return;
  if (typeof window === "undefined") return;
  if (!("Notification" in window)) return;
  if (Notification.permission !== "granted") return;
  if (typeof document !== "undefined" && document.visibilityState === "visible") return;
  try {
    new Notification(title, { body });
  } catch {}
}
