/* ──────────────────────────────────────────────────────────────
   components/OmenSplash.jsx — full-screen post-onboarding omen.

   Plays once after onboarding completes and before Home first
   renders. Fades a single line in slowly, holds, fades out slowly,
   then unmounts and signals completion via onDismiss.

   The line names the user's unique creation animi:
     "What was that? An Echo Topaz Phoenix wisps by — an omen of
      good brews to come..."
   ────────────────────────────────────────────────────────────── */

import React, { useEffect, useState } from "react";
import { theme, ff } from "../theme";

const FADE_IN_MS  = 1800;
const VISIBLE_MS  = 3200;
const FADE_OUT_MS = 1800;

// Strip the leading "The " from the creation title — the surrounding
// sentence supplies its own article.
function stripLeadingThe(title) {
  return (title || "").replace(/^The\s+/i, "");
}

// Pick "An" before a vowel sound; "A" otherwise. Cheap heuristic that
// handles the words actually in the creation pool well enough.
function articleFor(word) {
  if (!word) return "A";
  const c = word.trim().charAt(0).toLowerCase();
  return /[aeiou]/.test(c) ? "An" : "A";
}

export const OmenSplash = ({ title, onDismiss }) => {
  const [phase, setPhase] = useState("entering"); // entering | visible | leaving | gone

  useEffect(() => {
    const t1 = setTimeout(() => setPhase("visible"), FADE_IN_MS);
    const t2 = setTimeout(() => setPhase("leaving"), FADE_IN_MS + VISIBLE_MS);
    const t3 = setTimeout(() => {
      setPhase("gone");
      onDismiss();
    }, FADE_IN_MS + VISIBLE_MS + FADE_OUT_MS);
    return () => {
      clearTimeout(t1); clearTimeout(t2); clearTimeout(t3);
    };
  }, [onDismiss]);

  if (phase === "gone") return null;

  const opacity = phase === "entering" ? 0 : phase === "visible" ? 1 : 0;
  const transitionMs = phase === "entering" ? FADE_IN_MS : FADE_OUT_MS;
  const stripped = stripLeadingThe(title) || "spirit";
  const article = articleFor(stripped);

  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 200,
        background: theme.ivory,
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "0 28px",
        opacity,
        transition: `opacity ${transitionMs}ms ease-in-out`,
        pointerEvents: phase === "leaving" ? "none" : "auto",
      }}
    >
      <div
        style={{
          fontFamily: ff.serif, fontStyle: "italic",
          fontSize: 22, lineHeight: 1.55,
          color: theme.inkSoft, textAlign: "center",
          maxWidth: 560,
        }}
      >
        What was that? {article}{" "}
        <em style={{ color: theme.terra, fontStyle: "normal" }}>{stripped}</em>
        {" "}wisps by — an omen of good brews to come…
      </div>
    </div>
  );
};
