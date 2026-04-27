/* ──────────────────────────────────────────────────────────────
   components/PantryHintCard.jsx — one-time pantry nudge.

   Reuses the shared HintCard banner (icon · title + tagline · OK)
   so every first-visit tutorial across the app reads the same.
   Persists until dismissed via the OK button (pantryHintShown).
   ────────────────────────────────────────────────────────────── */

import React from "react";
import { theme } from "../theme";
import { Sprig } from "./icons";
import { HintCard } from "./HintCard";

export const PantryHintCard = ({ onDismiss }) => (
  <HintCard
    icon={<Sprig size={18} c={theme.sageDeep} />}
    title="Pantry"
    body={<>
      Tap the <strong>+</strong> on any ingredient to add it. Then filter blends by what you can brew now.
    </>}
    onDismiss={onDismiss}
  />
);
