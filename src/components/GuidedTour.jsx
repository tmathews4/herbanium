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

export const GuidedTour = ({ steps = [], onStep, onClose }) => {
  const [i, setI] = useState(0);
  const [rect, setRect] = useState(null);
  // The target's own border-radius, so the pulse traces the element's
  // real shape (rounded button corners, square windows) rather than a
  // generic box.
  const [targetRadius, setTargetRadius] = useState("10px");
  const step = steps[i];

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
    const apply = (el) => {
      setRect(el.getBoundingClientRect());
      setTargetRadius(window.getComputedStyle(el).borderRadius || "0px");
    };
    const measure = () => {
      const el = document.querySelector(`[data-tour="${step.target}"]`);
      if (el) {
        if (!scrolled) {
          scrolled = true;
          // Bring the target into view (instant so measurement below is
          // accurate), then measure on the next frame once it's settled.
          el.scrollIntoView({ block: "center", inline: "nearest" });
          raf = requestAnimationFrame(() => apply(el));
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

  // Place the callout above the target when the target sits low on
  // screen (the tab bar), else below it.
  const vh = typeof window !== "undefined" ? window.innerHeight : 800;
  const targetLow = rect ? rect.top > vh * 0.5 : true;

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
      animation: "tourFadeIn 0.55s ease-out",
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
          <div style={{
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
      <div style={{
        position: "fixed",
        left: 16, right: 16, maxWidth: 420, margin: "0 auto",
        ...(targetLow
          ? { bottom: rect ? vh - rect.top + 14 : 24 }
          : { top: rect ? rect.bottom + 14 : 24 }),
        background: theme.cream,
        border: `1px solid ${theme.ruleSoft}`,
        borderRadius: radius.md,
        boxShadow: shadow.card,
        padding: "14px 16px",
        fontFamily: ff.sans,
      }}>
        <div style={{
          fontFamily: ff.sans, fontSize: 10, letterSpacing: "0.16em",
          textTransform: "uppercase", color: theme.ash, marginBottom: 6,
        }}>
          {i + 1} / {steps.length}
        </div>
        {step.title && (
          <div style={{
            fontFamily: ff.serif, fontSize: 18, color: theme.ink,
            lineHeight: 1.2, marginBottom: 6,
          }}>{step.title}</div>
        )}
        <div style={{
          fontFamily: ff.sans, fontSize: 13, color: theme.inkSoft,
          lineHeight: 1.5, marginBottom: 14,
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
                padding: "8px 16px",
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
