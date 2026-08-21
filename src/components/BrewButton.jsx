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
  // Ask before brewing. Takes no argument now — see below.
  confirm = false,
  onConfirm,
}) => {
  const [asking, setAsking] = useState(false);

  const open = () => setAsking(true);

  /* BREWING NO LONGER ASKS WHAT TO CALL IT.

     It used to, on the reasoning that the moment you commit to a cup is
     the moment you know its name. Fair, but it was the ONLY way to name
     a composed pot, because the save prompt was unreachable — so this
     dialog was quietly carrying a second job. With a Save corner on the
     dock, naming has a home of its own, and asking here is a second
     prompt for a decision already made or deliberately deferred.

     An unnamed pot brews under `suggestBlendName` — "Chamomile &
     Lavender" — supplied by BrewSurface. That is a description of the
     cup rather than a name for it, and it is strictly better than the
     "Untitled blend" this path used to fall back to. */
  const commit = () => {
    setAsking(false);
    onConfirm?.();
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
        // The footer runs edge to edge, so the card clips rather than
        // pads at the bottom — otherwise the row's corners would float
        // inside the card's radius instead of taking it.
        overflow: "hidden",
      }}>
      <div style={{ padding: "18px 18px 4px" }}>
        <div style={{
          fontFamily: ff.serif, fontSize: 19, color: theme.ink, marginBottom: 4,
        }}>Brew this cup?</div>
        <div style={{
          fontFamily: ff.sans, fontSize: 12.5, color: theme.inkSoft,
          lineHeight: 1.5, marginBottom: 0,
        }}>
          The timer starts now, at the temperature and time you've set.
        </div>

        {/* A form, so Return commits — the same reasoning as the
            onboarding name step: a single text input submits implicitly
            and the on-screen keyboard offers a Go key instead of a
            newline this field can't use. */}
      </div>

        <form onSubmit={(e) => { e.preventDefault(); commit(); }} style={{ margin: 0 }}>
          {/* A FOOTER, not two floating buttons. Square, flush to the
              card's edges, split by the same hairline the dock uses —
              the same treatment as the Brew corner it was opened from,
              so the prompt reads as part of the surface rather than a
              tray of controls resting on it. Equal halves: neither
              answer is the one being nudged. */}
          <div style={{
            display: "flex", alignItems: "stretch",
            borderTop: `1px solid ${theme.ruleSoft}`,
          }}>
            <Button
              variant="secondary" tone="ink"
              onClick={() => setAsking(false)}
              data-testid="brew-confirm-cancel"
              style={{
                flex: 1, borderRadius: 0, border: "none",
                borderRight: `1px solid ${theme.ruleSoft}`,
                background: "transparent", boxShadow: "none",
                color: theme.ash,
                fontFamily: ff.sans, fontSize: 12.5, letterSpacing: "0.06em",
                padding: "14px 10px",
              }}
            >not yet</Button>
            <Button
              variant="secondary" tone="terra" type="submit"
              data-testid="brew-confirm-go"
              style={{
                flex: 1, borderRadius: 0, border: "none",
                background: "transparent", boxShadow: "none",
                color: theme.terra,
                fontFamily: ff.sans, fontSize: 12.5, letterSpacing: "0.06em",
                fontWeight: 600,
                padding: "14px 10px",
              }}
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

/* ──────────────────────────────────────────────────────────────
   SaveCornerButton — the dock's other corner.

   Lives here rather than at the call site for the reason the header of
   this file gives about Brew: the styling of a corner action is the
   thing that gets rebuilt wrong, and Brew went missing from two panels
   that way. This is the same corner mirrored, so it shares the file.

   WHY IT EXISTS AT ALL. A composed pot could not be saved. The naming
   prompt for it was fully built in ComposeScreen and nothing ever
   opened it — `setRcSavePromptOpen(true)` appeared nowhere in `src/`,
   so the whole block was unreachable. The only way to keep a blend was
   to BREW it, because brewing saves as a side effect (App.jsx). Asked
   for as "a quicker way to save these recipes"; it was the only way.

   AND THE PROMPT IS A MODAL, not a panel at the foot of the page. The
   first version reused that orphaned inline block, which meant tapping
   a control in the fixed dock scrolled you to the bottom of a long
   scrolling page to finish. Reported immediately: "I don't want it to
   scroll to the save button at bottom, that shouldn't exist at all".
   Right — an action offered in fixed chrome has to complete in fixed
   chrome. Same reasoning, and the same portal, as the brew
   confirmation above; that is why both live in this file.

   THE CONFIRMATION IS ALSO IN HERE, for a reason worth keeping. The
   old inline flow reported "Saved as ..." into the page, which a user
   who saved from the dock might never scroll far enough to read. The
   modal holds for a beat on the saved state instead, so the feedback
   is where the eye already is.

   NO ICON, deliberately. Brew earns a kettle because it is the primary
   action. The three glyphs that would read as "keep this" — sprig,
   flower, leaf — are the ingredient CATEGORY marks, and a fourth had
   to be drawn for the Profile tab this same day for exactly that
   reason. A word costs nothing and collides with nothing.

   Mirrored, so `borderLeft` where Brew takes `borderRight`: each corner
   carries the hairline on the side facing the readout.
   ────────────────────────────────────────────────────────────── */
export const SaveCornerButton = ({
  onSave,                 // (name) => id | null. Truthy id means kept.
  disabled = false,
  label = "Save",
  defaultName = "",
}) => {
  const [asking, setAsking] = useState(false);
  const [name, setName] = useState(defaultName);
  const [result, setResult] = useState(null);

  // Re-seeded on open rather than at mount, for the same reason Brew
  // gives: the pot changes between asks and a stale name is worse than
  // an empty one.
  const open = () => { setName(defaultName); setResult(null); setAsking(true); };
  const close = () => { setAsking(false); setResult(null); };

  /* IT WILL NOT SAVE AS "UNTITLED BLEND".

     That string was the fallback on every save path, so the easiest
     thing to do — open the prompt, press keep — produced a catalog
     entry indistinguishable from every other one made the same way.
     Asked for directly: "don't let it save as untitled, make the user
     enter a text and prompt them to if they try to save with
     untitled".

     So an empty field is refused rather than filled in for you, and the
     literal fallback is refused too — otherwise the rule is one
     copy-paste from being undone. The field is NOT pre-seeded with a
     suggestion for the same reason: a prefilled name is a name nobody
     chose, which is the behavior being removed. */
  const commit = (e) => {
    e?.preventDefault?.();
    const chosen = name.trim();
    if (!chosen || /^untitled( blend)?$/i.test(chosen)) {
      setResult({ ok: false, text: "Give it a name first — anything you'd recognize later." });
      return;
    }
    const id = onSave?.(chosen);
    if (id) {
      setResult({ ok: true, text: `Saved as "${chosen}"` });
      setTimeout(close, 1200);
    } else {
      setResult({ ok: false, text: "Couldn't save — try a different name." });
    }
  };

  return (
  <>
  <Button
    variant="secondary"
    tone="bark"
    disabled={disabled}
    onClick={open}
    data-tour="blend-save"
    data-testid="blend-save"
    // The prompt this opens has its own "Save", which COMMITS. Two
    // controls reading "Save" is ambiguous to anyone navigating by
    // accessible name, so this one says what it actually does.
    aria-label="name and save this blend"
    style={{
      fontSize: 12, padding: "0 16px", gap: 6,
      borderRadius: 0, letterSpacing: "0.04em",
      alignSelf: "stretch", boxShadow: "none",
      background: "transparent",
      color: theme.bark,
      border: "none",
      borderLeft: `1px solid ${theme.ruleSoft}`,
    }}
  >{label}</Button>

  {asking && createPortal(
    <div
      data-testid="blend-save-dialog"
      onClick={close}
      style={{
        position: "fixed", inset: 0, zIndex: 1200,
        background: "rgba(20,16,10,0.55)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: 20,
      }}
    >
      <div onClick={(e) => e.stopPropagation()} style={{
        width: "100%", maxWidth: 340,
        background: theme.cream,
        border: `1px solid ${theme.ruleSoft}`,
        borderRadius: radius.md,
        boxShadow: shadow.card,
        overflow: "hidden",
      }}>
        <form onSubmit={commit}>
          <div style={{ padding: "18px 18px 14px" }}>
            <div style={{
              fontFamily: ff.serif, fontSize: 19, color: theme.ink, marginBottom: 4,
            }}>Keep this blend?</div>
            <div style={{
              fontFamily: ff.sans, fontSize: 12.5, color: theme.inkSoft,
              lineHeight: 1.5, marginBottom: 12,
            }}>It'll join your recipes with the temperature and time you've dialled in.</div>
            <input
              autoFocus
              data-testid="blend-save-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="name your blend"
              maxLength={48}
              style={{
                width: "100%", boxSizing: "border-box",
                fontFamily: ff.serif, fontSize: 15, color: theme.ink,
                background: "rgba(var(--hi-rgb),0.05)",
                border: `1px dashed ${theme.rule}`, borderRadius: 8,
                padding: "10px 12px", outline: "none",
              }}
            />
            {result && (
              <div data-testid="blend-save-status" style={{
                marginTop: 10,
                fontFamily: ff.sans, fontSize: 12.5, lineHeight: 1.4,
                color: result.ok ? theme.sageDeep : theme.terra,
              }}>{result.text}</div>
            )}
          </div>
          <div style={{
            display: "flex", borderTop: `1px solid ${theme.ruleSoft}`,
          }}>
            <Button
              variant="secondary" tone="ash" type="button"
              onClick={close}
              style={{
                flex: 1, borderRadius: 0, border: "none",
                borderRight: `1px solid ${theme.ruleSoft}`,
                background: "transparent", boxShadow: "none",
                color: theme.ash,
                fontFamily: ff.sans, fontSize: 12.5, letterSpacing: "0.06em",
                padding: "14px 10px",
              }}
            >not yet</Button>
            <Button
              variant="secondary" tone="terra" type="submit"
              data-testid="blend-save-confirm"
              style={{
                flex: 1, borderRadius: 0, border: "none",
                background: "transparent", boxShadow: "none",
                color: theme.terra,
                fontFamily: ff.sans, fontSize: 12.5, letterSpacing: "0.06em",
                fontWeight: 600,
                padding: "14px 10px",
              }}
            >keep it</Button>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  )}
  </>
  );
};
