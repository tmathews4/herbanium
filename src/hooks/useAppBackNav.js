/* ──────────────────────────────────────────────────────────────
   hooks/useAppBackNav — wires the app's internal back navigation
   into the browser back button, a left-edge swipe gesture, and
   Android's system back gesture (hardware/3-button or gesture nav).

   Browser back: every time the app's nav state changes we push a
   new history entry, so the browser back button has somewhere to
   pop to. On popstate we sync the app by calling goBack() instead
   of letting the browser unload the SPA. When canGoBack is false
   we let the popstate proceed naturally — that's the user really
   trying to leave from the app's root.

   Edge swipe: a quick rightward drag starting in the leftmost ~24px
   of the viewport mirrors the iOS back gesture. Only fires when
   canGoBack so root screens don't try to pop into nothing.

   Android system back: the @capacitor/app plugin's backButton event
   fires for both 3-button and gesture nav. Without an explicit
   listener Capacitor exits the app on every press; with one, we
   route through the same goBack() the in-app button uses, and only
   call exitApp() when there's nothing left to pop.
   ────────────────────────────────────────────────────────────── */
import { useEffect, useRef } from "react";
import { subscribeBackButton, exitApp } from "../helpers/native";

export function useAppBackNav({ goBack, canGoBack, navKey }) {
  // Set true right before we trigger goBack() in the popstate handler
  // so the next navKey-effect run knows the state change came from a
  // pop, not a forward navigation, and skips re-pushing.
  const isPopping = useRef(false);
  const mounted = useRef(false);

  // Push on forward navigation; replace on first mount so we don't
  // strand a phantom sentinel entry behind the user's first move.
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (isPopping.current) {
      isPopping.current = false;
      return;
    }
    if (!mounted.current) {
      window.history.replaceState({ appNav: navKey }, "");
      mounted.current = true;
    } else {
      window.history.pushState({ appNav: navKey }, "");
    }
  }, [navKey]);

  // popstate: browser already moved one entry back. Sync app state.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const onPop = () => {
      if (canGoBack) {
        isPopping.current = true;
        goBack();
      }
      // No re-push when canGoBack is false: the user is at the app's
      // root and another back press should leave the app naturally.
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, [goBack, canGoBack]);

  // Left-edge swipe-back gesture. Constants tuned to match iOS feel:
  // small edge gutter, modest minimum travel, fast-flick time cap.
  useEffect(() => {
    if (typeof document === "undefined") return;
    const EDGE_PX = 24;
    const MIN_DX = 60;
    const MAX_DY = 60;
    const MAX_T_MS = 600;

    let startX = null, startY = null, startT = 0;

    const onStart = (e) => {
      const t = e.touches && e.touches[0];
      if (!t) return;
      if (t.clientX > EDGE_PX) { startX = null; return; }
      startX = t.clientX;
      startY = t.clientY;
      startT = Date.now();
    };
    const onEnd = (e) => {
      if (startX === null) return;
      const t = e.changedTouches && e.changedTouches[0];
      const sx = startX, sy = startY, st = startT;
      startX = null;
      if (!t) return;
      const dx = t.clientX - sx;
      const dy = Math.abs(t.clientY - sy);
      const dt = Date.now() - st;
      if (dt > MAX_T_MS) return;
      if (dx < MIN_DX) return;
      if (dy > MAX_DY) return;
      if (canGoBack) goBack();
    };

    document.addEventListener("touchstart", onStart, { passive: true });
    document.addEventListener("touchend", onEnd, { passive: true });
    return () => {
      document.removeEventListener("touchstart", onStart);
      document.removeEventListener("touchend", onEnd);
    };
  }, [goBack, canGoBack]);

  // Android system back gesture. Subscribe once, read latest goBack /
  // canGoBack via refs so the listener always sees current values
  // without re-subscribing on every state change. No-op on web.
  const goBackRef = useRef(goBack);
  const canGoBackRef = useRef(canGoBack);
  goBackRef.current = goBack;
  canGoBackRef.current = canGoBack;
  useEffect(() => {
    let cancelled = false;
    let remove = null;
    subscribeBackButton(() => {
      if (canGoBackRef.current) {
        goBackRef.current();
      } else {
        // At the app's root — same fallback Android would do without
        // our listener: exit the app cleanly.
        exitApp();
      }
    }).then(removeFn => {
      if (cancelled) {
        removeFn();
      } else {
        remove = removeFn;
      }
    });
    return () => {
      cancelled = true;
      if (remove) remove();
    };
  }, []);
}
