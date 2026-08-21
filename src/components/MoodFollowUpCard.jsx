/* ──────────────────────────────────────────────────────────────
   components/MoodFollowUpCard.jsx — the post-brew review form.

   Originally lived inline in HomeScreen as a single-purpose
   surface. Now shared between Home (the auto-surfaced popup that
   appears 10 min after a brew until the user fills or dismisses
   it) and CupDetail (an always-available review path for cups
   that haven't been reviewed yet — covers the "I dismissed the
   home popup but I do want to log this now" and "I want to log
   it early, before the 10-min gate" cases).

   The form captures:
     - taste (1-5 rating)
     - flavor (predicted-notes confirmation, tasted/missed)
     - mood verdict (thumbs up/down, only when targets are set)
     - extra moods (chip picker for unexpected register)
     - follow-up note (free-form)

   Submission calls onSubmit with a payload that App's
   patchSessionMoods consumes. The only other control is onClose,
   which puts the form away without filling it — the host decides
   what that does to the cup's pending state.
   ────────────────────────────────────────────────────────────── */

import React from "react";
import { createPortal } from "react-dom";
import { Button } from "./layout";
import { ThumbUp, ThumbDown } from "./icons";
import { PARENT_MOODS, CURRENT_FEEL_EXTRAS, feltChips } from "../data/canon";
import { formatAgo, getBlend } from "../helpers/misc";
import { ff, theme } from "../theme";

export const MoodFollowUpCard = ({ session, onSubmit, onClose, actionSlotId = null }) => {
  const blend = getBlend(session.blendId);
  const targets = session.targetMoods || [];
  const predictedFlavors = React.useMemo(() => {
    const list = Array.isArray(blend?.flavors) ? blend.flavors : [];
    return list.slice(0, 6);
  }, [blend]);

  // Mood-landed verdict: null (unset) | true (👍) | false (👎). On
  // submit we map true → 5 / false → 1 so the existing 0-5 dot
  // renderers downstream still read correctly without a schema change.
  const [moodLanded, setMoodLanded] = React.useState(null);
  const [taste, setTaste] = React.useState(session?.taste ?? 4);
  const [tasted, setTasted] = React.useState(() =>
    Object.fromEntries(predictedFlavors.map(f => [f, true]))
  );
  // Multi-select chip pool of moods the cup brought up that the
  // user wasn't aiming for. Stored on the session as `extraMoods`.
  const [extraMoods, setExtraMoods] = React.useState([]);
  const [followNote, setFollowNote] = React.useState("");
  const [submitted, setSubmitted] = React.useState(false);

  /* The host's action slot, re-read every render with no dependency
     array — the same shape as the dock lookups elsewhere, and for the
     same reason: a cached node is the precondition for the bug, because
     a slot the host re-creates leaves this portal rendering into a
     DETACHED div and the button silently never appears. setState only
     fires when the node actually differs, so React bails in the normal
     case.

     When there is no slot it falls back to the foot of the form, which
     is where Home's popup wants it — that card floats in a page and has
     no bar to ride in. */
  const [slot, setSlot] = React.useState(() =>
    (actionSlotId ? document.getElementById(actionSlotId) : null));
  React.useEffect(() => {
    const el = actionSlotId ? document.getElementById(actionSlotId) : null;
    if (el !== slot) setSlot(el);
  });


  if (!blend) return null;

  /* One relative-time format for the whole app. This card carried its
     own, which read "5 min ago" where every other surface read "5m
     ago", and clamped to a minimum of one minute — a guard against
     rendering "0 min ago" on a fresh cup. formatAgo answers that case
     properly with "just now", so the clamp goes with the copy. */
  const timeLabel = formatAgo(new Date(session.brewedAt || Date.now()));
  const reachedFor = targets.length === 0 ? null
    : targets.length === 1
      ? targets[0]
      : targets.slice(0, -1).join(", ") + " and " + targets[targets.length - 1];

  const moodRequired = targets.length > 0;
  const canSubmit = !moodRequired || moodLanded != null;

  // Chip pool for "anything else come through?" — drop the targets
  // the user already aimed for (they're covered by the thumbs
  // verdict above) so the picker only surfaces unexpected register.
  const extraMoodChips = React.useMemo(() => {
    const targetKeys = new Set(targets);
    // "How did it land?" is a felt question — see feltChips in canon.
    return feltChips([...PARENT_MOODS, ...CURRENT_FEEL_EXTRAS]).filter(m => !targetKeys.has(m.key));
  }, [targets]);
  const toggleExtraMood = (key) => {
    setExtraMoods(prev =>
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    );
  };

  const submit = () => {
    if (submitted || !canSubmit) return;
    setSubmitted(true);
    const moodScore = moodLanded == null ? null : (moodLanded ? 5 : 1);
    onSubmit?.({
      moodScore,
      extraMoods,
      noteAppend: followNote.trim(),
      taste,
      flavorsTasted: tasted,
      flavorsTarget: predictedFlavors,
    });
  };

  const actionLabel = submitted ? "saved" : !canSubmit ? "pick a verdict" : "log it";
  const ready = !submitted && canSubmit;
  const actionButton = (
    <Button
      variant={slot ? "secondary" : "primary"}
      tone="ink"
      fullWidth={!slot}
      onClick={submit}
      disabled={submitted || !canSubmit}
      data-testid="review-submit"
      style={slot
        /* IN THE BAR: square, transparent, flush — the same language as
           "brew again" beside it and the confirm sheet's footer. Terra
           once it will do something, ash while it waits. A dimmed terra
           would read as the same control greyed out; this is a control
           that has not switched on yet. */
        ? {
          flex: 1, borderRadius: 0, background: "transparent",
          boxShadow: "none", padding: "15px 12px",
          fontFamily: ff.sans, fontSize: 12.5, letterSpacing: "0.06em",
          fontWeight: 600,
          color: ready ? theme.terra : theme.ash,
          border: "none", borderRight: `1px solid ${theme.rule}`,
        }
        : { fontSize: 14, padding: "11px" }}
    >{actionLabel}</Button>
  );
  const action = slot ? createPortal(actionButton, slot) : actionButton;

  return (
    <div style={{
      marginBottom: 14, padding: "12px 14px",
      borderRadius: "0 6px 6px 0",
      background: "rgba(176, 84, 47, 0.05)",
      borderLeft: `2px solid ${theme.terra}`,
      display: "flex", flexDirection: "column", gap: 10,
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
        <div style={{
          fontFamily: ff.sans, fontSize: 9.5, letterSpacing: "0.18em",
          textTransform: "uppercase", color: theme.terra,
        }}>
          How did it land?
        </div>
        {/* ONE CLOSE CONTROL, AND IT DEFERS. There were two — a "not
            yet" pill beside an × — and the × was the broken one: it
            cleared moodsPending, but this panel is gated on whether a
            SCORE exists, so nothing moved on screen and the form the
            user had just closed was still sitting there. Reported as
            "the x does nothing", which is exactly what it looked like.

            Rather than fix the × into a second, quieter way to drop
            the cup, it took the pill's job: closing the review is the
            honest deferral, and the cup stays pending. What deferring
            MEANS past the snooze ceiling is the host's call — see
            closeReview in CupDetail — because the ceiling is a data
            rule and this is a form. */}
        {onClose && (
          <button
            onClick={onClose}
            aria-label="close review"
            data-testid="review-close"
            style={{
              flexShrink: 0, background: "transparent", border: "none",
              color: theme.ash, fontSize: 18, lineHeight: 1, padding: "0 4px",
              cursor: "pointer",
            }}
          >×</button>
        )}
      </div>

      {/* Rating — overall cup quality (1-5). */}
      <div style={{
        display: "flex", flexDirection: "column", gap: 8,
        background: theme.cream, borderRadius: 8, padding: "10px 12px",
        border: `1px solid ${theme.ruleSoft}`,
      }}>
        <div style={{
          fontFamily: ff.serif, fontStyle: "italic", fontSize: 13,
          color: theme.inkSoft, lineHeight: 1.4,
        }}>
          Your <span style={{ color: theme.ink, fontStyle: "normal", fontWeight: 500 }}>{blend.name}</span>
          {" "}from {timeLabel} — how was it?
        </div>
        <div style={{
          fontFamily: ff.sans, fontSize: 9.5, letterSpacing: "0.14em",
          textTransform: "uppercase", color: theme.ash,
          textAlign: "center",
        }}>
          rating
        </div>
        <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
          {[1,2,3,4,5].map(i => (
            <button key={i} onClick={() => setTaste(i)} aria-label={`rate cup ${i} of 5`} style={{
              background: "transparent", border: "none", cursor: "pointer",
              padding: 2, fontSize: 22, color: i <= taste ? theme.terra : theme.rule,
            }}>●</button>
          ))}
        </div>
      </div>

      {/* Flavor — predicted-notes confirmation. */}
      {predictedFlavors.length > 0 && (
        <div style={{
          display: "flex", flexDirection: "column", gap: 8,
          background: theme.cream, borderRadius: 8, padding: "10px 12px",
          border: `1px solid ${theme.ruleSoft}`,
        }}>
          <div style={{
            fontFamily: ff.sans, fontSize: 9.5, letterSpacing: "0.14em",
            textTransform: "uppercase", color: theme.ash,
          }}>
            flavor
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            {predictedFlavors.map((f, i) => (
              <div key={f} style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                gap: 8, padding: "6px 0",
                borderTop: i === 0 ? "none" : `1px solid ${theme.ruleSoft}`,
              }}>
                <div style={{
                  fontFamily: ff.serif, fontSize: 14, color: theme.ink,
                  minWidth: 0, overflow: "hidden", textOverflow: "ellipsis",
                }}>
                  <em style={{ color: theme.terra, fontStyle: "normal" }}>{f}</em>?
                </div>
                <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                  {[
                    ["tasted",  true],
                    ["missed",  false],
                  ].map(([label, v]) => {
                    const isActive = tasted[f] === v;
                    return (
                      <button key={label} onClick={() => setTasted({ ...tasted, [f]: v })} style={{
                        fontFamily: ff.sans, fontSize: 11, letterSpacing: "0.02em",
                        padding: "4px 9px", borderRadius: 999,
                        border: `1px solid ${isActive ? (v ? theme.sageDeep : theme.terra) : theme.rule}`,
                        background: isActive ? (v ? theme.sageDeep : theme.terra) : "transparent",
                        color: isActive ? theme.cream : theme.inkSoft,
                        cursor: "pointer",
                        transition: "background 0.2s ease, color 0.2s ease, border-color 0.2s ease",
                      }}>{label}</button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Mood landed? Thumbs verdict. */}
      {moodRequired && (
        <div style={{
          display: "flex", flexDirection: "column", gap: 10,
          background: theme.cream, borderRadius: 8, padding: "10px 12px",
          border: `1px solid ${theme.ruleSoft}`,
        }}>
          {reachedFor && (
            <div style={{
              fontFamily: ff.serif, fontStyle: "italic", fontSize: 13,
              color: theme.inkSoft, lineHeight: 1.4,
            }}>
              Did the cup deliver{" "}
              <em style={{ color: theme.terra, fontStyle: "normal" }}>{reachedFor}</em>?
            </div>
          )}
          <div style={{ display: "flex", gap: 14, justifyContent: "center" }}>
            {[
              [true,  ThumbUp,   "yes",        theme.sageDeep],
              [false, ThumbDown, "not really", theme.terra],
            ].map(([v, Icon, label, accent]) => {
              const active = moodLanded === v;
              return (
                <button
                  key={String(v)}
                  onClick={() => setMoodLanded(v)}
                  aria-label={label}
                  title={label}
                  style={{
                    width: 44, height: 44,
                    display: "inline-flex", alignItems: "center", justifyContent: "center",
                    padding: 0,
                    borderRadius: 999,
                    background: active ? accent : "transparent",
                    border: `1px solid ${active ? accent : theme.ruleSoft}`,
                    color: active ? theme.cream : theme.inkSoft,
                    cursor: "pointer",
                    transition: "all 0.18s ease",
                  }}
                >
                  <Icon size={20} c={active ? theme.cream : accent} />
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Anything else come through? */}
      <div style={{
        display: "flex", flexDirection: "column", gap: 8,
        background: theme.cream, borderRadius: 8, padding: "10px 12px",
        border: `1px solid ${theme.ruleSoft}`,
      }}>
        <div style={{
          fontFamily: ff.serif, fontStyle: "italic", fontSize: 13,
          color: theme.inkSoft, lineHeight: 1.4,
        }}>
          Anything else come through?
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {extraMoodChips.map(m => {
            const isOn = extraMoods.includes(m.key);
            return (
              <button
                key={m.key}
                onClick={() => toggleExtraMood(m.key)}
                style={{
                  fontFamily: ff.sans, fontSize: 11, letterSpacing: "0.02em",
                  padding: "5px 11px", borderRadius: 999,
                  border: `1px solid ${isOn ? theme.terra : theme.rule}`,
                  background: isOn ? theme.terra : "transparent",
                  color: isOn ? theme.cream : theme.inkSoft,
                  cursor: "pointer",
                  transition: "all 0.18s ease",
                }}
              >{m.label}</button>
            );
          })}
        </div>
      </div>

      <textarea
        value={followNote}
        onChange={(e) => setFollowNote(e.target.value)}
        placeholder="a line or two about how it played out…"
        style={{
          width: "100%", minHeight: 44,
          background: "rgba(var(--hi-rgb),0.05)",
          border: `1px dashed ${theme.rule}`,
          borderRadius: 8, padding: "8px 10px",
          fontFamily: ff.serif, fontSize: 13, color: theme.ink,
          resize: "vertical", outline: "none",
          boxSizing: "border-box",
        }}
      />

      {action}
    </div>
  );
};
