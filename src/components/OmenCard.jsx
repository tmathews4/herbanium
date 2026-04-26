/* ──────────────────────────────────────────────────────────────
   components/OmenCard.jsx — first-visit animi omen, top of Home.

   Replaces the old WelcomeCard. Sits at the top of Home on first
   visit after onboarding, fades in slowly, holds, fades out slowly,
   then unmounts and signals via onDismiss so the omenShown flag
   gets persisted.
   ────────────────────────────────────────────────────────────── */

import React, { useEffect, useState } from "react";
import { theme, ff } from "../theme";
import { Ornament } from "./icons";

const FADE_IN_MS  = 1500;
const VISIBLE_MS  = 3500;
const FADE_OUT_MS = 2800;

function stripLeadingThe(title) {
  return (title || "").replace(/^The\s+/i, "");
}

function articleFor(word) {
  if (!word) return "A";
  return /[aeiou]/i.test(word.trim().charAt(0)) ? "An" : "A";
}

export const OmenCard = ({ title, onDismiss }) => {
  const [phase, setPhase] = useState("entering");

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
        opacity,
        transition: `opacity ${transitionMs}ms ease-in-out`,
        marginBottom: 20,
        padding: "22px 24px",
        borderRadius: 12,
        background: theme.cream,
        border: `1px solid ${theme.ruleSoft}`,
        textAlign: "center",
      }}
    >
      <div style={{ display: "flex", justifyContent: "center", marginBottom: 10 }}>
        <Ornament w={100} c={theme.terra} />
      </div>
      <div
        style={{
          fontFamily: ff.serif, fontStyle: "italic", fontSize: 16,
          color: theme.inkSoft, lineHeight: 1.55,
        }}
      >
        What was that? {article}{" "}
        <em style={{ color: theme.terra, fontStyle: "normal" }}>{stripped}</em>
        {" "}wisps by — an omen of good brews to come…
      </div>
    </div>
  );
};
