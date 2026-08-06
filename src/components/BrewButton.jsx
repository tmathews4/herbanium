/* ──────────────────────────────────────────────────────────────
   components/BrewButton.jsx — the brew panel's corner action.

   ONE DEFINITION, because there are three brew panels and the button
   went missing from two of them. BlendExtractionExplorer renders
   whatever `brewAction` it's handed, and only ComposeScreen was
   handing it anything — so a saved blend and an ingredient profile
   both showed a brew window you couldn't brew from. Reported as
   "missing brew button on the saved/favorited window again", the
   "again" being the tell: the styling lived at the call site, so
   every new panel had to remember to rebuild it.

   Every brew window gets one now, single ingredient included. There
   is no harm in brewing one leaf, and the panel that shows you the
   temperature is the natural place to commit to it.

   THE SHAPE IS THE CORNER OF THE PANEL, not a button placed near it:
   square, flush left, stretched to the header's full height, taking
   the dock's own surface with a single hairline dividing it from the
   readout. See the comment in BlendExtractionExplorer's header row
   for why the row carries no padding of its own.

   The tour's terra pulse is applied HERE, on the button, and not by
   a wrapper. It's a spread box-shadow, so it traces this element's
   own border-radius for free and can't drift out of step with a
   shape it doesn't know about. tests/tours.spec.ts enforces that the
   pulse never moves back onto a wrapper.
   ────────────────────────────────────────────────────────────── */

import React from "react";
import { theme } from "../theme";
import { Button } from "./layout";
import { Kettle } from "./icons";

export const BrewCornerButton = ({
  onClick,
  disabled = false,
  // True while the guided tour is pointing at this button.
  pulsing = false,
  label = "Brew",
}) => (
  <Button
    // SECONDARY, not primary, and not for emphasis reasons. A filled
    // block read as an object sitting ON the dock; the corner should
    // read as part of the surface. Primary also can't be made
    // transparent — its hover handlers repaint the background to the
    // accent on every enter and leave, so a transparent primary flashes
    // solid on first mouse-over.
    variant="secondary"
    tone="bark"
    disabled={disabled}
    onClick={onClick}
    icon={<Kettle size={14} c={theme.bark} />}
    // Rides along because Button spreads ...rest onto the real element,
    // which is also why the tour can pulse the control itself.
    data-tour="blend-brew"
    style={{
      fontSize: 12, padding: "0 16px", gap: 6,
      borderRadius: 0, letterSpacing: "0.04em",
      alignSelf: "stretch", boxShadow: "none",
      background: "transparent",
      color: theme.bark,
      // Secondary draws a full outline; the corner wants only the edge
      // that divides it from the readout — and in the dock's own
      // hairline, the same `ruleSoft` every other divider here uses. A
      // bark line was the single darkest stroke in the bar.
      border: "none",
      borderRight: `1px solid ${theme.ruleSoft}`,
      animation: pulsing ? "tourTogglePulse 1.9s ease-in-out infinite" : undefined,
    }}
  >{label}</Button>
);
