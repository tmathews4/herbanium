/* ──────────────────────────────────────────────────────────────
   hooks/useAppBackNav — wires the app's internal back navigation
   into both the browser back button and a left-edge swipe gesture.

   Browser back: every time the app's nav state changes we push a
   new history entry, so the browser back button has somewhere to
   pop to. On popstate we sync the app by calling goBack() instead
   of letting the browser unload the SPA. When canGoBack is false
   we let the popstate proceed naturally — that's the user really
   trying to leave from the app's root.

   Edge swipe: a quick rightward drag starting in the leftmost ~24px
   of the viewport mirrors the iOS back gesture. Only fires when
   canGoBack so root screens don't try to pop into nothing.
   ────────────────────────────────────────────────────────────── */
import { useEffect, useRef } from "react";

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
}
