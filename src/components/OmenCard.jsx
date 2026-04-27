/* ──────────────────────────────────────────────────────────────
   components/OmenCard.jsx — first-visit elemental omen popup.

   Renders as a centered modal over Home on first visit after
   onboarding. Fades in slowly so the line lands as a moment, then
   waits — the user dismisses it themselves via the close button or
   by tapping the backdrop. No auto-dismiss; the spirit's name is
   the point, and we want to be sure they read it.
   ────────────────────────────────────────────────────────────── */

import React, { useEffect, useState } from "react";
import { theme, ff } from "../theme";
import { Ornament } from "./icons";

const FADE_IN_MS  = 1500;
const FADE_OUT_MS = 800;

function stripLeadingThe(title) {
  return (title || "").replace(/^The\s+/i, "");
}

function articleFor(word) {
  if (!word) return "A";
  return /[aeiou]/i.test(word.trim().charAt(0)) ? "An" : "A";
}

export const OmenCard = ({ title, onDismiss }) => {
  const [phase, setPhase] = useState("entering"); // entering | visible | leaving | gone

  useEffect(() => {
    const t = setTimeout(() => setPhase("visible"), FADE_IN_MS);
    return () => clearTimeout(t);
  }, []);

  const beginExit = () => {
    if (phase === "leaving" || phase === "gone") return;
    setPhase("leaving");
    setTimeout(() => {
      setPhase("gone");
      onDismiss();
    }, FADE_OUT_MS);
  };

  if (phase === "gone") return null;

  const opacity = phase === "entering" || phase === "leaving" ? 0 : 1;
  const transitionMs = phase === "entering" ? FADE_IN_MS : FADE_OUT_MS;
  const stripped = stripLeadingThe(title) || "spirit";
  const article = articleFor(stripped);

  return (
    <div
      onClick={beginExit}
      style={{
        position: "fixed", inset: 0, zIndex: 200,
        background: "rgba(232, 220, 192, 0.86)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "0 24px",
        opacity,
        transition: `opacity ${transitionMs}ms ease-in-out`,
        cursor: "pointer",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          position: "relative",
          maxWidth: 460, width: "100%",
          padding: "30px 30px 26px",
          background: theme.cream,
          border: `1px solid ${theme.ruleSoft}`,
          borderRadius: 14,
          textAlign: "center",
          boxShadow: "0 18px 44px rgba(0,0,0,0.14)",
          cursor: "default",
        }}
      >
        <button
          onClick={beginExit}
          aria-label="close"
          style={{
            position: "absolute", top: 8, right: 12,
            background: "transparent", border: "none", cursor: "pointer",
            color: theme.ash, fontSize: 22, lineHeight: 1, padding: 4,
          }}
        >×</button>

        <div style={{ display: "flex", justifyContent: "center", marginBottom: 14 }}>
          <Ornament w={120} c={theme.terra} />
        </div>

        <div
          style={{
            fontFamily: ff.serif, fontStyle: "italic", fontSize: 17,
            color: theme.inkSoft, lineHeight: 1.55, marginBottom: 18,
          }}
        >
          What was that? {article}{" "}
          <em style={{ color: theme.terra, fontStyle: "normal" }}>{stripped}</em>
          {" "}wisps by — an omen of good brews to come…
        </div>

        <button
          onClick={beginExit}
          style={{
            fontFamily: ff.serif, fontSize: 14,
            padding: "8px 22px", borderRadius: 999,
            background: theme.ink, color: theme.cream,
            border: "none", cursor: "pointer",
          }}
        >onward</button>
      </div>
    </div>
  );
};
