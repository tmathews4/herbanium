/* ──────────────────────────────────────────────────────────────
   components/ElementalArrivalCard.jsx — newly-earned elemental pop-up.

   Mirrors the OmenCard's centered-modal pattern but pulls the
   arrival verb from elementalArrivals so each elemental appears
   in its own register (birds alight, rodents scamper, fae wisp).
   The description body reuses the attribute's existing `desc`
   field (appearance + "Drawn by..." trigger).
   ────────────────────────────────────────────────────────────── */

import React, { useEffect, useState } from "react";
import { theme, ff } from "../theme";
import { Ornament } from "./icons";
import { arrivalVerbFor } from "../data/elementalArrivals";
import { creatureFor } from "../data/elementalAdjectives";

// Quick enough that the user doesn't sit waiting or over-click,
// slow enough that the card still arrives rather than blinks in.
// Fade-out is kept tighter than fade-in so dismissing feels
// responsive to the tap, not deferential to the animation.
const FADE_IN_MS  = 450;
const FADE_OUT_MS = 280;

export const ElementalArrivalCard = ({ elemental, onDismiss }) => {
  const [phase, setPhase] = useState("entering");

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

  if (phase === "gone" || !elemental) return null;

  const opacity = phase === "entering" || phase === "leaving" ? 0 : 1;
  const transitionMs = phase === "entering" ? FADE_IN_MS : FADE_OUT_MS;
  // Verb is keyed off the creature noun (which is the fixed part of
  // the "{adjective} {creature}" naming) so arrivals always read
  // in-register regardless of the random qualifier.
  const verb = arrivalVerbFor(creatureFor(elemental));
  const displayName = elemental.displayName || elemental.name;

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

        <div style={{
          fontFamily: ff.sans, fontSize: 10, letterSpacing: "0.22em",
          textTransform: "uppercase", color: theme.ash, marginBottom: 10,
        }}>An elemental finds you</div>

        <div style={{
          fontFamily: ff.serif, fontStyle: "italic", fontSize: 18,
          color: theme.inkSoft, lineHeight: 1.45, marginBottom: 14,
        }}>
          <em style={{ color: theme.terra, fontStyle: "normal" }}>{displayName}</em>
          {" "}{verb}.
        </div>

        {/* The elemental's poetic flavor line + the trigger that
            earned it (or, for wild rolls, the lodestone they were
            drawn by). Ornament hairline above so the description
            reads as its own beat — not a continuation of the
            arrival headline. */}
        {elemental.desc && (
          <>
            <div style={{
              width: 32, height: 1, margin: "0 auto 12px",
              background: theme.rule, opacity: 0.7,
            }} />
            <div style={{
              fontFamily: ff.serif, fontSize: 13.5,
              color: theme.inkSoft, lineHeight: 1.55,
              marginBottom: 18, padding: "0 6px",
            }}>
              {elemental.desc}
            </div>
          </>
        )}

        <button
          onClick={beginExit}
          style={{
            fontFamily: ff.serif, fontSize: 14,
            padding: "8px 22px", borderRadius: 999,
            background: theme.ink, color: theme.cream,
            border: "none", cursor: "pointer",
          }}
        >welcome it</button>
      </div>
    </div>
  );
};
