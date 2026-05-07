/* ──────────────────────────────────────────────────────────────
   helpers/native.js — thin wrappers around Capacitor plugins.

   Every export here is a no-op on web (the WebView returns false
   from isNativePlatform() and we early-return). The wrappers also
   absorb plugin import or runtime errors silently so a bad
   permission grant or a plugin that hasn't synced yet can't crash
   the app.

   Three plugin families currently used:
     - @capacitor/haptics — small vibration on key user gestures
     - @capacitor/local-notifications — steep-timer alarm that
       fires even if the user backgrounds the app
     - @capacitor/status-bar — set the system status bar to dark
       icons on the ivory background
   ────────────────────────────────────────────────────────────── */

import { isNativeApp } from "./platform";

let _haptics = null;
let _notifications = null;
let _statusBar = null;
let _app = null;

async function loadPlugin(name) {
  try {
    return await import(/* @vite-ignore */ name);
  } catch {
    return null;
  }
}

async function ensureHaptics() {
  if (_haptics !== null) return _haptics;
  _haptics = (await loadPlugin("@capacitor/haptics")) || {};
  return _haptics;
}

async function ensureNotifications() {
  if (_notifications !== null) return _notifications;
  _notifications = (await loadPlugin("@capacitor/local-notifications")) || {};
  return _notifications;
}

async function ensureStatusBar() {
  if (_statusBar !== null) return _statusBar;
  _statusBar = (await loadPlugin("@capacitor/status-bar")) || {};
  return _statusBar;
}

async function ensureApp() {
  if (_app !== null) return _app;
  _app = (await loadPlugin("@capacitor/app")) || {};
  return _app;
}

/**
 * Subscribe to Android's system back gesture (and the hardware back
 * button on devices that have one). Pass a callback that decides
 * what to do — typically: if the app has internal back history,
 * navigate one step; otherwise call exitApp() so the system gesture
 * still feels right at the app's root.
 *
 * Returns a remove function. No-op on web (returns a noop remover).
 */
export async function subscribeBackButton(callback) {
  if (!isNativeApp()) return () => {};
  try {
    const { App } = await ensureApp();
    if (!App?.addListener) return () => {};
    const handle = await App.addListener("backButton", (info) => {
      try { callback(info); } catch {}
    });
    return () => {
      try { handle.remove(); } catch {}
    };
  } catch {
    return () => {};
  }
}

/**
 * Exit the app — fired from the back-button listener when the app
 * is at its root (no internal back history). Mirrors what Android's
 * default behavior would do without our listener.
 */
export async function exitApp() {
  if (!isNativeApp()) return;
  try {
    const { App } = await ensureApp();
    if (App?.exitApp) await App.exitApp();
  } catch {}
}

/**
 * Light haptic tap — fired on small confirming gestures (logging
 * a cup, saving a blend, pinning an elemental). No-op on web.
 */
export async function hapticTap() {
  if (!isNativeApp()) return;
  try {
    const { Haptics, ImpactStyle } = await ensureHaptics();
    if (!Haptics) return;
    await Haptics.impact({ style: ImpactStyle?.Light ?? "LIGHT" });
  } catch {
    // Permission denied or plugin not synced — silent no-op.
  }
}

/**
 * Heavier haptic notification — fired when the steep timer
 * completes in-app. The OS-level notification handles the case
 * where the app is backgrounded.
 */
export async function hapticDone() {
  if (!isNativeApp()) return;
  try {
    const { Haptics, NotificationType } = await ensureHaptics();
    if (!Haptics) return;
    await Haptics.notification({ type: NotificationType?.Success ?? "SUCCESS" });
  } catch {}
}

/**
 * Schedule a local notification for the steep finish moment.
 * Returns a numeric id the caller stashes so they can cancel
 * the notification if the user cancels or pauses the brew.
 *
 * Asks for notification permission lazily on first call. If the
 * user denies, returns null and we just rely on the in-app
 * countdown — no error surfaces.
 */
export async function scheduleSteepNotification({ blendName, secondsFromNow }) {
  if (!isNativeApp()) return null;
  if (!secondsFromNow || secondsFromNow <= 0) return null;
  try {
    const { LocalNotifications } = await ensureNotifications();
    if (!LocalNotifications) return null;
    const perm = await LocalNotifications.checkPermissions();
    if (perm.display !== "granted") {
      const req = await LocalNotifications.requestPermissions();
      if (req.display !== "granted") return null;
    }
    const id = Math.floor(Date.now() / 1000) % 0x7fffffff;
    await LocalNotifications.schedule({
      notifications: [{
        id,
        title: "Brew is ready",
        body: blendName ? `${blendName} is steeped — pour and enjoy.` : "Your steep is up.",
        schedule: { at: new Date(Date.now() + secondsFromNow * 1000) },
        smallIcon: "ic_launcher",
      }],
    });
    return id;
  } catch {
    return null;
  }
}

/**
 * Cancel a previously-scheduled steep notification, e.g. when
 * the user pauses or cancels the brew before the timer fires.
 */
export async function cancelSteepNotification(id) {
  if (!isNativeApp()) return;
  if (id == null) return;
  try {
    const { LocalNotifications } = await ensureNotifications();
    if (!LocalNotifications) return;
    await LocalNotifications.cancel({ notifications: [{ id }] });
  } catch {}
}

/**
 * Schedule a "check in on your cup" notification — fires once the
 * brew has had enough time to settle (currently ~10 min after pour)
 * so the user can log mood/flavor when they get a moment. Returns
 * an id the caller stashes so it can be cancelled if the user
 * fills the follow-up first.
 */
export async function scheduleCheckInNotification({ blendName, secondsFromNow }) {
  if (!isNativeApp()) return null;
  if (!secondsFromNow || secondsFromNow <= 0) return null;
  try {
    const { LocalNotifications } = await ensureNotifications();
    if (!LocalNotifications) return null;
    const perm = await LocalNotifications.checkPermissions();
    if (perm.display !== "granted") {
      const req = await LocalNotifications.requestPermissions();
      if (req.display !== "granted") return null;
    }
    // Offset id range from steep notifications so the two can't collide.
    const id = (Math.floor(Date.now() / 1000) + 1_000_000) % 0x7fffffff;
    await LocalNotifications.schedule({
      notifications: [{
        id,
        title: "How did it land?",
        body: blendName
          ? `Your ${blendName} has had time to settle — log how it landed when you get a moment.`
          : "Your cup has had time to settle — log how it landed when you get a moment.",
        schedule: { at: new Date(Date.now() + secondsFromNow * 1000) },
        smallIcon: "ic_launcher",
      }],
    });
    return id;
  } catch {
    return null;
  }
}

/**
 * Cancel a check-in notification (mirror of cancelSteepNotification).
 */
export async function cancelCheckInNotification(id) {
  if (!isNativeApp()) return;
  if (id == null) return;
  try {
    const { LocalNotifications } = await ensureNotifications();
    if (!LocalNotifications) return;
    await LocalNotifications.cancel({ notifications: [{ id }] });
  } catch {}
}

/**
 * Configure the system status bar:
 *   - Dark icons on the ivory background (style)
 *   - Ivory bar background to match the app shell (Android only)
 *   - Don't overlay the WebView (Android only) — by default
 *     Capacitor extends the WebView behind the status bar, which
 *     makes our content render under the system icons. Disabling
 *     overlay reserves a proper inset.
 *
 * Fired once on app mount. iOS-only setters (setBackgroundColor,
 * setOverlaysWebView) silently no-op on iOS. No-op on web.
 */
export async function configureStatusBar() {
  if (!isNativeApp()) return;
  try {
    const { StatusBar, Style } = await ensureStatusBar();
    if (!StatusBar) return;
    // Style.Dark = dark text/icons (correct for our light ivory bg).
    // Naming is confusing — Style.Dark means "you have a Dark style for
    // a Light background", per Capacitor's docs.
    await StatusBar.setStyle({ style: Style?.Dark ?? "DARK" });
    // Android only: paint the system bar so it blends with the app
    // shell's ivory.
    if (typeof StatusBar.setBackgroundColor === "function") {
      try { await StatusBar.setBackgroundColor({ color: "#F3ECDC" }); } catch {}
    }
    // Android only: stop the WebView from extending under the bar.
    // Without this, the bar icons render on top of the app content.
    if (typeof StatusBar.setOverlaysWebView === "function") {
      try { await StatusBar.setOverlaysWebView({ overlay: false }); } catch {}
    }
  } catch {}
}
