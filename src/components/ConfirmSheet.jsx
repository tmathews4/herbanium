/* ──────────────────────────────────────────────────────────────
   components/ConfirmSheet.jsx — the app asking before it does
   something it cannot undo.

   The app already had this. It was written inline inside
   BrewCornerButton, where it asks "Brew this cup?", and it is the only
   confirmation in Herbanium that looks like Herbanium: a portalled
   sheet, a serif question, and an edge-to-edge footer split by the
   same hairline the dock uses, equal halves so neither answer is the
   one being nudged.

   Everywhere else called `window.confirm`, in four places — deleting a
   journal entry, deleting a blend, cancelling a steep, and reloading
   after an import. That drops an OS dialog with the page's URL in it
   into a fully art-directed app, and it BLOCKS THE PAGE THREAD while
   open, which is how it was found: a timer stopped.

   So the sheet moved out of the button and became a component. Nothing
   about its look changed — this is the same markup, with the strings
   and the actions handed in.

   IT IS DELIBERATELY NOT A DROP-IN FOR `confirm()`. `window.confirm`
   returns a boolean where it is called, so the code around it reads
   `if (!ok) return;` and carries on. A sheet cannot do that: it has to
   render, wait for a person, and then run the rest. Every call site had
   to be turned inside out — the work after the question becomes
   `onConfirm`. That is the real cost of the change, and it is the
   reason the four were done one at a time rather than swapped by
   pattern.
   ────────────────────────────────────────────────────────────── */

import React from "react";
import { createPortal } from "react-dom";
import { theme, ff, radius, shadow } from "../theme";
import { Button } from "./layout";

export const ConfirmSheet = ({
  open,
  title,
  body,
  cancelLabel = "not yet",
  confirmLabel = "yes →",
  /* THE CONFIRM SIDE'S COLOUR, and the only reason this is a prop.
     Deleting and brewing are both terra in this palette — the app has
     one accent for "this is the committing answer" and does not keep a
     separate destructive red, because a red button in a cream apothecary
     reads as an error state rather than as a choice. */
  tone = "terra",
  onConfirm,
  onCancel,
  testId = "confirm",
}) => {
  if (!open) return null;
  return createPortal(
    <div
      data-testid={testId}
      onClick={onCancel}
      style={{
        position: "fixed", inset: 0, zIndex: 1200,
        background: "rgba(20,16,10,0.55)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: 20,
      }}
    >
      {/* Stop the backdrop's dismiss from firing on taps inside. */}
      <div onClick={(e) => e.stopPropagation()} style={{
        width: "100%", maxWidth: 340,
        background: theme.cream,
        border: `1px solid ${theme.ruleSoft}`,
        borderRadius: radius.md,
        boxShadow: shadow.card,
        // The footer runs edge to edge, so the card clips rather than
        // pads at the bottom — otherwise the row's corners would float
        // inside the card's radius instead of taking it.
        overflow: "hidden",
      }}>
        <div style={{ padding: "18px 18px 4px" }}>
          <div style={{
            fontFamily: ff.serif, fontSize: 19, color: theme.ink, marginBottom: 4,
          }}>{title}</div>
          {body && (
            <div style={{
              fontFamily: ff.sans, fontSize: 12.5, color: theme.inkSoft,
              lineHeight: 1.5,
            }}>{body}</div>
          )}
        </div>

        {/* A form, so Return commits — the same reasoning the brew sheet
            uses, and the reason a keyboard offers Go rather than a
            newline nothing here could use. */}
        <form onSubmit={(e) => { e.preventDefault(); onConfirm?.(); }} style={{ margin: 0 }}>
          <div style={{
            display: "flex", alignItems: "stretch",
            borderTop: `1px solid ${theme.ruleSoft}`,
          }}>
            <Button
              variant="secondary" tone="ink"
              onClick={onCancel}
              data-testid={`${testId}-cancel`}
              style={{
                flex: 1, borderRadius: 0, border: "none",
                borderRight: `1px solid ${theme.ruleSoft}`,
                background: "transparent", boxShadow: "none",
                color: theme.ash,
                fontFamily: ff.sans, fontSize: 12.5, letterSpacing: "0.06em",
                padding: "14px 10px",
              }}
            >{cancelLabel}</Button>
            <Button
              variant="secondary" tone={tone} type="submit"
              data-testid={`${testId}-go`}
              style={{
                flex: 1, borderRadius: 0, border: "none",
                background: "transparent", boxShadow: "none",
                color: theme[tone] || theme.terra,
                fontFamily: ff.sans, fontSize: 12.5, letterSpacing: "0.06em",
                fontWeight: 600,
                padding: "14px 10px",
              }}
            >{confirmLabel}</Button>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  );
};
