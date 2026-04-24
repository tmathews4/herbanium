/* ──────────────────────────────────────────────────────────────
   components/WelcomeCard.jsx — first-visit welcome on Home

   Appears on Home the first time the user arrives after onboarding.
   Fades in on mount, fades out after a few seconds. Never shown again
   after dismissal (tracked via welcomeShown flag in localStorage).

   Sits above the rest of Home content but doesn't block it — Home
   is fully usable underneath.
   ────────────────────────────────────────────────────────────── */

import React, { useEffect, useState } from "react";
import { theme, ff } from "../theme";
import { Ornament } from "./icons";

const FADE_IN_MS = 400;
const VISIBLE_MS = 4000;
const FADE_OUT_MS = 800;

export const WelcomeCard = ({ name, onDismiss }) => {
  const [phase, setPhase] = useState("entering"); // entering | visible | leaving | gone

  useEffect(() => {
    // entering → visible
    const t1 = setTimeout(() => setPhase("visible"), FADE_IN_MS);
    // visible → leaving
    const t2 = setTimeout(() => setPhase("leaving"), FADE_IN_MS + VISIBLE_MS);
    // leaving → gone (unmount)
    const t3 = setTimeout(() => {
      setPhase("gone");
      onDismiss();
    }, FADE_IN_MS + VISIBLE_MS + FADE_OUT_MS);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [onDismiss]);

  if (phase === "gone") return null;

  const opacity = phase === "entering" ? 0 : phase === "visible" ? 1 : 0;

  return (
    <div
      onClick={() => setPhase("leaving")}
      style={{
        opacity,
        transition: `opacity ${phase === "entering" ? FADE_IN_MS : FADE_OUT_MS}ms ease`,
        marginBottom: 20,
        padding: "20px 22px",
        borderRadius: 12,
        background: theme.cream,
        border: `1px solid ${theme.ruleSoft}`,
        textAlign: "center",
        cursor: "pointer",
      }}
    >
      <div style={{ display: "flex", justifyContent: "center", marginBottom: 8 }}>
        <Ornament w={100} c={theme.terra} />
      </div>
      <div style={{
        fontFamily: ff.serif, fontSize: 22, color: theme.ink,
        lineHeight: 1.2, marginBottom: 4,
      }}>
        Welcome, <em style={{ color: theme.terra }}>{name}</em>.
      </div>
      <div style={{
        fontFamily: ff.serif, fontStyle: "italic", fontSize: 13,
        color: theme.ash, lineHeight: 1.5,
      }}>
        Your journal begins here.
      </div>
    </div>
  );
};
