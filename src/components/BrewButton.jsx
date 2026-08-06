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

import React, { useState } from "react";
import { createPortal } from "react-dom";
import { theme, ff, radius, shadow } from "../theme";
import { Button } from "./layout";
import { Kettle } from "./icons";

/* THE CONFIRMATION LIVES HERE, not at the call site.
   Brewing is the one irreversible thing this screen does — it starts a
   timer and commits the cup you dialled in — so it asks first, and it
   asks with the name field, because the moment you've decided to brew
   something is the moment you know what to call it.

   Inside the shared component on purpose. Every panel that shows a corner
   Brew gets the identical prompt without wiring one, which is the same
   reasoning that put the button here after two panels shipped without
   any button at all. A call site can still opt out with `confirm={false}`
   — quick brew on a recipe row does, deliberately: its whole point is
   that you already trust the cup.

   Portalled to document.body: the button lives in the dock, which is a
   short flex row with its own stacking context, and a dialog rendered
   inside it would be clipped by the thing it's asking about. */
export const BrewCornerButton = ({
  onClick,
  disabled = false,
  // True while the guided tour is pointing at this button.
  pulsing = false,
  label = "Brew",
  // Ask before brewing. Receives the name the user settled on.
  confirm = false,
  onConfirm,
  defaultName = "",
  // Whether the prompt also asks what to call it. True for a composed
  // pot, which has no name yet. False when brewing something already
  // named — a saved recipe or a single leaf — where a rename field is
  // a question nobody asked.
  askName = true,
}) => {
  const [asking, setAsking] = useState(false);
  const [name, setName] = useState(defaultName);

  // Re-seed each time it opens rather than once at mount — the pot can
  // change between asks, and a stale name is worse than a blank one.
  const open = () => { setName(defaultName); setAsking(true); };

  const commit = () => {
    setAsking(false);
    onConfirm?.(name.trim() || defaultName || "Untitled blend");
  };

  return (
  <>
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
    onClick={confirm ? open : onClick}
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

  {asking && createPortal(
    <div
      data-testid="brew-confirm"
      onClick={() => setAsking(false)}
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
        padding: "18px 18px 14px",
      }}>
        <div style={{
          fontFamily: ff.serif, fontSize: 19, color: theme.ink, marginBottom: 4,
        }}>Brew this cup?</div>
        <div style={{
          fontFamily: ff.sans, fontSize: 12.5, color: theme.inkSoft,
          lineHeight: 1.5, marginBottom: 14,
        }}>
          {askName
            ? "The timer starts now, at the temperature and time you've set. Give it a name while you're here."
            : "The timer starts now, at the temperature and time you've set."}
        </div>

        {/* A form, so Return commits — the same reasoning as the
            onboarding name step: a single text input submits implicitly
            and the on-screen keyboard offers a Go key instead of a
            newline this field can't use. */}
        <form onSubmit={(e) => { e.preventDefault(); commit(); }} style={{ margin: 0 }}>
          {askName && (
          <input
            data-testid="brew-confirm-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="name this blend"
            maxLength={40}
            autoFocus
            enterKeyHint="go"
            style={{
              display: "block", width: "100%", boxSizing: "border-box",
              fontFamily: ff.serif, fontSize: 16, color: theme.ink,
              background: "transparent", border: "none",
              borderBottom: `1px solid ${theme.rule}`,
              padding: "6px 2px", outline: "none", marginBottom: 16,
            }}
          />
          )}
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
            <Button
              variant="ghost"
              onClick={() => setAsking(false)}
              data-testid="brew-confirm-cancel"
            >not yet</Button>
            <Button
              variant="primary" tone="terra" type="submit"
              data-testid="brew-confirm-go"
              style={{ fontSize: 13, padding: "9px 18px" }}
            >brew it →</Button>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  )}
  </>
  );
};
