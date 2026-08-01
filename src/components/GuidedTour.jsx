/* ──────────────────────────────────────────────────────────────
   components/GuidedTour.jsx — spotlight "coach-mark" tour.

   Steps are [{ target, title, body, tab }]. `target` matches a
   data-tour="<id>" attribute on a real on-screen element; the
   overlay measures that element (getBoundingClientRect) and
   spotlights it — dims the whole screen and cuts a bright hole
   around it — with a callout that explains how to use it.

   onStep(step) fires when a step becomes active (before measuring),
   so the host can bring the target on-screen (e.g. switch tabs).
   onClose() ends the tour (Skip, or Done on the last step).

   The spotlight uses the classic transparent-box + huge-spread
   box-shadow trick for the cutout, so no SVG mask is needed. A
   full-viewport container captures clicks so the app underneath
   isn't interactable mid-tour — advancing is driven by the callout.
   ────────────────────────────────────────────────────────────── */

import React, { useLayoutEffect, useState } from "react";
import { theme, ff, radius, shadow } from "../theme";
import { unionSpan, unionRect, groupScrollDelta, calloutPlacement } from "../helpers/tourLayout";

export const GuidedTour = ({ steps = [], onStep, onClose }) => {
  const [i, setI] = useState(0);
  const [rect, setRect] = useState(null);
  // Union of the step's `keepClear` targets, if it has any — other
  // elements the user must be able to see WHILE reading this step. The
  // Blend tour's prediction/slider steps use it: the whole lesson is
  // that dragging the sliders moves the bars, which the user can only
  // learn if both are on screen and the callout is off both of them.
  const [clearRect, setClearRect] = useState(null);
  // The target's own border-radius, so the pulse traces the element's
  // real shape (rounded button corners, square windows) rather than a
  // generic box.
  const [targetRadius, setTargetRadius] = useState("10px");
  const step = steps[i];
  // Honor prefers-reduced-motion: skip the mount fade (also keeps E2E
  // runs — which set reducedMotion — fast and deterministic).
  const reduceMotion = typeof window !== "undefined" && window.matchMedia
    && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Announce the active step (tab switch, etc.) before we measure, so
  // the target is mounted/on-screen when getBoundingClientRect runs.
  useLayoutEffect(() => {
    if (step) onStep?.(step);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [i]);

  // Measure the current target after render + on resize. If the node
  // isn't mounted yet (a tab just switched), retry next frame. Targets
  // below the fold are scrolled into view first so the tour can walk
  // down a screen (e.g. down to the steep/temp controls).
  useLayoutEffect(() => {
    if (!step) return undefined;
    let raf = 0;
    let scrolled = false;
    // The step's keep-clear elements, or [] — they may legitimately not
    // exist (a step reused on a screen that doesn't render them), in
    // which case the step just behaves like an ordinary one.
    const clearEls = () => (step.keepClear || [])
      .map(id => document.querySelector(`[data-tour="${id}"]`))
      .filter(Boolean);
    const unionOf = (els) => unionSpan(els.map(el => el.getBoundingClientRect()));
    // A step can light up more than one element: `spotlight` lists extra
    // data-tour ids to fold into the highlight. The Simple/Detailed step
    // uses it to light the toggle AND the bars, so the user watches the
    // thing the toggle changes rather than just the control itself.
    const spotEls = (el) => [el, ...(step.spotlight || [])
      .map(id => document.querySelector(`[data-tour="${id}"]`))
      .filter(Boolean)];
    // Nearest scrollable ancestor — the app scrolls an inner pane, not
    // the document, so scrollIntoView's container is what we have to
    // nudge for the fine positioning below.
    const scrollParent = (el) => {
      for (let n = el.parentElement; n; n = n.parentElement) {
        const oy = window.getComputedStyle(n).overflowY;
        if ((oy === "auto" || oy === "scroll") && n.scrollHeight > n.clientHeight) return n;
      }
      return document.scrollingElement || document.documentElement;
    };
    // Position the step's subject. Plain steps center the target; steps
    // with keepClear then get nudged so the whole group sits flush to
    // the bottom margin — see groupScrollDelta for why.
    const position = (el) => {
      el.scrollIntoView({ block: "center", inline: "nearest" });
      const extra = clearEls();
      if (extra.length === 0) return;
      // Converge rather than nudge once. scrollIntoView may act on a
      // different container than the one we adjust, so a single delta
      // can land short and leave the group high — which then pushes the
      // target under the callout. Re-measure and correct, bailing when
      // it's settled or the container has hit the end of its range.
      const pane = scrollParent(el);
      // The region the group can actually occupy is the pane's visible
      // box, not the window — the app scrolls between a header and the
      // tab dock, so on a small phone the pane is ~165px shorter.
      const region = pane.getBoundingClientRect
        ? pane.getBoundingClientRect()
        : { top: 0, bottom: window.innerHeight };
      for (let pass = 0; pass < 3; pass++) {
        const delta = groupScrollDelta(unionOf([...spotEls(el), ...extra]), region);
        if (!delta) break;
        const before = pane.scrollTop;
        pane.scrollTop += delta;
        if (pane.scrollTop === before) break;
      }
    };
    const apply = (el) => {
      const els = spotEls(el);
      setRect(unionRect(els.map(n => n.getBoundingClientRect())));
      // Radius comes from the primary target — with several elements
      // lit at once there's no single shape to trace, and the largest
      // one's corners read best around the group.
      setTargetRadius(window.getComputedStyle(els.length > 1 ? els.at(-1) : el).borderRadius || "0px");
      setClearRect(unionOf(clearEls()));
    };
    const measure = () => {
      const el = document.querySelector(`[data-tour="${step.target}"]`);
      if (el) {
        if (!scrolled) {
          scrolled = true;
          // Position, let the frame settle, then position AGAIN before
          // measuring. The second pass matters: a step can change the
          // layout it just scrolled to (the Blend steps put the strips
          // back into Simple, which shortens them by ~200px), and the
          // first scroll is computed against the old heights.
          position(el);
          raf = requestAnimationFrame(() => {
            position(el);
            raf = requestAnimationFrame(() => apply(el));
          });
        } else {
          apply(el);
        }
      } else {
        raf = requestAnimationFrame(measure);
      }
    };
    measure();
    window.addEventListener("resize", measure);
    return () => {
      window.removeEventListener("resize", measure);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [i, step]);

  if (!step) return null;

  const last = i === steps.length - 1;
  const finish = () => onClose?.();

  // Default 0 so the pulse sits on a button's own border. Borderless
  // targets whose content runs to the edge (e.g. a section wrapper) can
  // set `pad` on their step to give the highlight some breathing room.
  const pad = step.pad != null ? step.pad : 0;
  const hole = rect
    ? {
        left: rect.left - pad,
        top: rect.top - pad,
        width: rect.width + pad * 2,
        height: rect.height + pad * 2,
      }
    : null;

  // Where the callout goes — pure geometry, in helpers/tourLayout.js so
  // it can be tested across the whole device matrix without a browser.
  // The short version: sit on whichever side of the anchor has more
  // room; when neither side fits, overlay the target rather than the
  // step's keep-clear element.
  const vh = typeof window !== "undefined" ? window.innerHeight : 800;
  const calloutPos = calloutPlacement({ rect, clearRect, vh });
  // Compact steps trade callout size for screen. A step that says "watch
  // these two things at once" is competing with its own subject for
  // space, and on a small phone the ordinary callout wins that fight —
  // so those steps shrink the box instead of covering the lesson.
  const tight = !!step.compact;
  const sizing = tight
    ? { pad: "8px 12px", title: 14, body: 11, gapTitle: 3, gapBody: 7, btnPad: "5px 13px" }
    : { pad: "14px 16px", title: 18, body: 13,   gapTitle: 6, gapBody: 14, btnPad: "8px 18px" };

  return (
    <div style={{
      // Full-viewport click-catcher — blocks interaction with the app
      // underneath so the tour is driven by the callout buttons. The
      // container itself is transparent; the dim comes from the hole's
      // box-shadow below. The whole overlay (dim + glow + callout)
      // eases in on mount so the tour arrives gently rather than
      // bursting onto the screen.
      position: "fixed", inset: 0, zIndex: 1000,
      pointerEvents: "auto",
      animation: reduceMotion ? undefined : "tourFadeIn 0.55s ease-out",
    }}>
      {/* The target's own border, lit white and slowly breathing — a
          soft border-glow that traces the element's exact edge/shape. */}
      <style>{`
        @keyframes tourPulse {
          0%, 100% { border-color: rgba(255,255,255,0.38); box-shadow: 0 0 5px 0px rgba(255,255,255,0.20); }
          50%      { border-color: rgba(255,255,255,0.97); box-shadow: 0 0 15px 4px rgba(255,255,255,0.72); }
        }
        @keyframes tourFadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
      `}</style>
      {hole ? (
        <>
          {/* Dim layer + cutout — a transparent box whose huge spread
              shadow darkens everything except the target. Matches the
              target's border-radius so the cutout hugs its shape. */}
          <div data-testid="tour-spotlight" style={{
            position: "fixed",
            left: hole.left, top: hole.top,
            width: hole.width, height: hole.height,
            borderRadius: targetRadius,
            boxShadow: "0 0 0 9999px rgba(20,16,10,0.66)",
            pointerEvents: "none",
            transition: "left 0.25s ease, top 0.25s ease, width 0.25s ease, height 0.25s ease",
          }} />
          {/* Pulsing border — sits exactly on the element's edge (border-
              box, matching radius) so it reads as the button's own border
              lighting up and breathing. */}
          <div style={{
            position: "fixed",
            left: hole.left, top: hole.top,
            width: hole.width, height: hole.height,
            borderRadius: targetRadius,
            boxSizing: "border-box",
            border: "2px solid rgba(255,255,255,0.38)",
            pointerEvents: "none",
            animation: "tourPulse 2.6s ease-in-out infinite",
            transition: "left 0.25s ease, top 0.25s ease, width 0.25s ease, height 0.25s ease",
          }} />
        </>
      ) : (
        <div style={{ position: "fixed", inset: 0, background: "rgba(20,16,10,0.66)" }} />
      )}

      {/* Callout — only rendered once the target has been measured.
          Before `rect` lands the placement math would fall back to a
          bottom-anchored guess and visibly jump to the real position
          a frame later; hiding it until measurement makes it appear
          in place (the mount fade covers the one-frame delay). */}
      {rect && (
      <div data-testid="tour-callout" style={{
        position: "fixed",
        left: 16, right: 16, maxWidth: 420, margin: "0 auto",
        ...calloutPos,
        // border-box so maxHeight bounds the WHOLE box (padding + border
        // included). With the default content-box, padding+border spill
        // past maxHeight (~30px) and the callout can poke off-screen —
        // that's what tipped Firefox's tall-graph step over the bottom edge.
        boxSizing: "border-box",
        overflowY: "auto",
        background: theme.cream,
        border: `1px solid ${theme.ruleSoft}`,
        borderRadius: radius.md,
        boxShadow: shadow.card,
        padding: sizing.pad,
        fontFamily: ff.sans,
      }}>
        <div data-testid="tour-progress" style={{
          fontFamily: ff.sans, fontSize: 10, letterSpacing: "0.16em",
          textTransform: "uppercase", color: theme.ash, marginBottom: 6,
        }}>
          {i + 1} / {steps.length}
        </div>
        {step.title && (
          <div style={{
            fontFamily: ff.serif, fontSize: sizing.title, color: theme.ink,
            lineHeight: 1.2, marginBottom: sizing.gapTitle,
          }}>{step.title}</div>
        )}
        <div style={{
          fontFamily: ff.sans, fontSize: sizing.body, color: theme.inkSoft,
          lineHeight: 1.45, marginBottom: sizing.gapBody,
        }}>{step.body}</div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
          <button onClick={finish} style={{
            background: "transparent", border: "none", cursor: "pointer",
            fontFamily: ff.sans, fontSize: 12, color: theme.ash, padding: "6px 4px",
          }}>Skip</button>
          <div style={{ display: "flex", gap: 8 }}>
            {i > 0 && (
              <button onClick={() => setI(i - 1)} style={{
                background: "transparent", cursor: "pointer",
                border: `1px solid ${theme.rule}`, borderRadius: 999,
                fontFamily: ff.sans, fontSize: 12, color: theme.inkSoft,
                padding: sizing.btnPad,
              }}>Back</button>
            )}
            <button onClick={() => (last ? finish() : setI(i + 1))} style={{
              background: theme.terra, color: theme.cream,
              border: "none", borderRadius: 999, cursor: "pointer",
              fontFamily: ff.sans, fontSize: 12, fontWeight: 500,
              letterSpacing: "0.04em", padding: "8px 18px",
            }}>{last ? "Done" : "Next"}</button>
          </div>
        </div>
      </div>
      )}
    </div>
  );
};
