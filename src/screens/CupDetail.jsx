/* ──────────────────────────────────────────────────────────────
   screens/CupDetail.jsx — single-session detail view.

   Tapping a cup in the journal (or a favorite on Home, when there's
   a session for it) opens this screen instead of jumping straight
   to the recipe. Shows the lived data of one specific brew:

     - blend name (clickable → recipe)
     - when brewed, at what temp/time
     - taste rating
     - moods: target → landed/missed/extra (or "still resolving")
     - flavors: predicted → tasted/missed/extra
     - note (brew-time + follow-up appended together)

   The recipe card stays one click away — the blend name in the
   header is the link — so the user keeps the option of jumping to
   the recipe view, but the default landing is the journal entry.
   ────────────────────────────────────────────────────────────── */

import { useDockHeight, REVIEW_SLOT_ID } from "../helpers/dock";
import React, { useState } from "react";
import { Flower, Kettle } from "../components/icons";
import { Button, SectionLabel } from "../components/layout";
import { MoodFollowUpCard } from "../components/MoodFollowUpCard";
import { getBlend, sessionAgo } from "../helpers/misc";
import { MAX_SNOOZES } from "../data/followUp";
import { ff, theme } from "../theme";
import { formatTempShort, useUnit } from "../units/units";

const formatBrewTime = (s) => {
  if (!s) return null;
  const m = Math.floor(s / 60);
  const r = s % 60;
  return r === 0 ? `${m} min` : `${m}m ${r}s`;
};

export const CupDetail = ({ session, onClose, openBlend, appendSessionNote, onBrewAgain, patchSessionMoods, dismissSessionMoods, snoozeSessionMoods }) => {
  /* The action floats over the page rather than scrolling with it, so
     the scroll area is padded by however tall the bar measures. Same
     arrangement the recipe and ingredient docks use. */
  const barRef = React.useRef(null);
  const barH = useDockHeight(barRef);
  /* Whether this cup still wants reviewing, and whether the panel is
     showing. Open by default: an unreviewed cup is usually the reason
     somebody opened it, and the point of moving the card into the bar
     was to stop it scrolling away, not to hide it. */
  const [reviewOpen, setReviewOpen] = useState(true);
  const { unit } = useUnit();
  const blend = session ? getBlend(session.blendId) : null;
  // Covers the same three paths the card always did: an early review
  // before Home's ten-minute gate, a dismissed popup, and an older cup
  // outside Home's 24h window that was never reviewed.
  const reviewable = !!session
    && typeof session.moodScore !== "number"
    && !!patchSessionMoods;

  /* CLOSING THE REVIEW IS ONE OPERATION, and it moves two things: the
     cup's follow-up schedule and whether this panel is open. They were
     hand-rolled apart — the × wrote the session and left the panel up,
     the "not yet" pill folded the panel and re-timed the ask — which
     is the shape CLAUDE.md's "state that changes together" note is
     about, and it is why the × read as doing nothing. One function now,
     and both controls collapsed into it.

     SNOOZE WHILE THERE IS SNOOZE LEFT, THEN DISMISS. followUp.js caps
     the deferral so nobody can push the ask past the 24h window the
     card stays askable in; past that cap there is nothing left to
     defer, so closing means the cup is answered-by-not-answering and
     its scheduled check-in gets cancelled. Falling through rather than
     hiding the control matters now that this is the ONLY way to put
     the form away — a spent allowance used to hide the pill, which was
     fine when the × was also there. MAX_SNOOZES is read, not restated;
     the ceiling lives with the schedule. */
  const closeReview = () => {
    const spent = (session?.followUpSnoozes || 0) >= MAX_SNOOZES;
    if (!spent && snoozeSessionMoods) snoozeSessionMoods(session.id);
    else if (dismissSessionMoods) dismissSessionMoods(session.id);
    setReviewOpen(false);
  };
  // Append-a-note state — collapsed by default. Opens to a dashed
  // textarea + save/cancel pair below the marginalia. Each save
  // appends with a paragraph break so the note reads as a stack
  // of small entries (brew-time → follow-up → later reflection).
  const [noteOpen, setNoteOpen] = useState(false);
  const [noteDraft, setNoteDraft] = useState("");
  const [noteJustSaved, setNoteJustSaved] = useState(false);
  const handleNoteSave = () => {
    const text = noteDraft.trim();
    if (!text || !appendSessionNote || !session?.id) return;
    appendSessionNote(session.id, text);
    setNoteDraft("");
    setNoteOpen(false);
    setNoteJustSaved(true);
    setTimeout(() => setNoteJustSaved(false), 1800);
  };
  const handleNoteCancel = () => {
    setNoteDraft("");
    setNoteOpen(false);
  };

  if (!session || !blend) {
    return (
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0,
        // Stops at the dock instead of covering it — the main menu is
        // never not on screen. Falls back to 0px so the screen still
        // fills its container if rendered outside the app shell.
        bottom: "var(--app-dock-h, 0px)", zIndex: 30,
        background: theme.ivory, padding: "22px",
      }}>
        <button onClick={onClose} style={{
          background: "transparent", border: "none", color: theme.ash,
          fontFamily: ff.sans, fontSize: 12, letterSpacing: "0.12em",
          textTransform: "uppercase", cursor: "pointer",
        }}>← back</button>
        <div style={{
          marginTop: 40, textAlign: "center",
          fontFamily: ff.serif, fontStyle: "italic", color: theme.ash,
        }}>
          this cup couldn't be found
        </div>
      </div>
    );
  }

  // Mood arc — target moods compared against landed/extra captured at
  // log time. If the cup is still in the pending window, we surface
  // that explicitly instead of pretending the mood data is final.
  const targetMoods = session.targetMoods || [];
  const landedMap   = session.landed || {};
  const extraMoods  = session.extra  || [];
  const moodsPending = !!session.moodsPending;

  // Flavor arc — same shape on the flavor side.
  const targetFlavors  = session.flavorsTarget || [];
  const flavorsTasted  = session.flavorsTasted  || {};
  const flavorsExtra   = session.flavorsExtra   || [];
  const flavorsLogged  = targetFlavors.length > 0 || flavorsExtra.length > 0;

  const tempStr = (typeof session.tempC === "number")
    ? formatTempShort(session.tempC, session.tempC, unit)
    : null;
  const timeStr = formatBrewTime(session.timeS);
  const ago = sessionAgo(session) || session.ago || "";

  // Tag style — a single style object reused for every landed/missed/
  // tasted/extra pill. Tone selects sage (positive) vs terra (miss).
  const Tag = ({ tone, italic, children }) => {
    const palette = tone === "sage" ? {
      bg: "rgba(109,126,85,0.10)", fg: theme.sageDeep, bd: theme.sage,
    } : tone === "terra" ? {
      bg: "rgba(176,84,47,0.08)",  fg: theme.terra,    bd: theme.terra,
    } : tone === "ochre" ? {
      bg: "rgba(189,148,76,0.10)", fg: theme.ochre,    bd: theme.ochre,
    } : {
      bg: theme.cream,             fg: theme.inkSoft,  bd: theme.ruleSoft,
    };
    return (
      <span style={{
        display: "inline-block",
        padding: "3px 9px", borderRadius: 999,
        fontFamily: ff.sans, fontSize: 10.5, letterSpacing: "0.02em",
        background: palette.bg, color: palette.fg,
        border: `1px solid ${palette.bd}`,
        fontStyle: italic ? "italic" : "normal",
      }}>{children}</span>
    );
  };

  const Row = ({ label, children }) => (
    <div style={{ marginTop: 16 }}>
      <SectionLabel>{label}</SectionLabel>
      <div style={{ marginTop: 6, display: "flex", flexWrap: "wrap", gap: 5 }}>
        {children}
      </div>
    </div>
  );

  const [scrolled, setScrolled] = useState(false);

  return (
    <div style={{
      position: "absolute", top: 0, left: 0, right: 0,
      // Stops at the dock instead of covering it — the main menu is
      // never not on screen. Falls back to 0px so the screen still
      // fills its container if rendered outside the app shell.
      bottom: "var(--app-dock-h, 0px)", zIndex: 30,
      background: theme.ivory,
    }}>
    <div
      onScroll={(e) => setScrolled(e.currentTarget.scrollTop > 4)}
      style={{
        position: "absolute", inset: 0,
        overflowY: "auto",
        // Room for the floating action, measured rather than assumed.
        paddingBottom: barH,
      }}
    >
      {/* Sticky header — back button + eyebrow stay pinned to the
          top of the scroll viewport regardless of scroll depth.
          Hairline shadow fades in once content has scrolled to read
          the header as a separate layer. */}
      <div style={{
        position: "sticky", top: 0, zIndex: 10,
        background: theme.ivory,
        padding: "10px 22px 8px",
        display: "flex", justifyContent: "space-between", alignItems: "center",
        boxShadow: scrolled ? "0 1px 0 rgba(60, 50, 40, 0.08)" : "0 1px 0 rgba(60, 50, 40, 0)",
        transition: "box-shadow 0.18s ease",
      }}>
        <button onClick={onClose} style={{
          background: "transparent", border: "none", color: theme.ash,
          fontFamily: ff.sans, fontSize: 12, letterSpacing: "0.12em",
          textTransform: "uppercase", cursor: "pointer",
        }}>← back</button>
        <div style={{ width: 40 }} />
      </div>
      <div style={{ padding: "0 22px 32px" }}>

      {/* Review surface — surfaces whenever this cup hasn't yet
          captured a moodScore. Covers three paths:
            - Early review: user opens the cup before the Home
              popup's 10-minute gate fires
            - Missed popup: user dismissed the Home popup without
              filling, but now wants to log how the cup landed
            - Older cup never reviewed: outside Home's 24h surface
              window but still has no captured review
          When the user submits here, patchSessionMoods sets
          moodScore + moodsPending=false, so the Home popup gate
          stops firing for this cup. */}
      {/* The review card used to render HERE, above the cup's own
          header, and scrolled away with the page. It lives in the bar
          at the foot of this file now — see the dock block. */}

      {/* Header: blend name as the link to the recipe, with a subtle
          right-arrow affordance so the user understands it's tappable.
          The "view recipe →" hint underneath is belt-and-suspenders for
          the first time someone meets this view. */}
      <div style={{ textAlign: "center", marginTop: 18 }}>
        <Flower size={26} c={theme.ochre} />
        <button
          onClick={() => openBlend?.(session.blendId)}
          style={{
            display: "block", margin: "8px auto 0",
            background: "transparent", border: "none", padding: 0,
            fontFamily: ff.serif, fontSize: 26, fontWeight: 400,
            color: theme.ink, cursor: "pointer", textAlign: "center",
            lineHeight: 1.1,
          }}
        >
          {blend.name}
        </button>
        <button
          onClick={() => openBlend?.(session.blendId)}
          style={{
            background: "transparent", border: "none",
            fontFamily: ff.serif, fontStyle: "italic", fontSize: 11.5,
            color: theme.ash, marginTop: 4,
            cursor: "pointer", padding: 0,
          }}>
          view recipe →
        </button>
      </div>

      {/* When + how — relative time, brew temp/time settings. The
          settings come from the session itself (the explorer sliders
          may have moved off the recipe defaults), so the user sees
          what they actually did, not what the recipe specifies. */}
      <div style={{
        marginTop: 18, padding: "10px 12px",
        borderRadius: 8, background: theme.cream,
        border: `1px solid ${theme.ruleSoft}`,
        display: "flex", justifyContent: "space-between", alignItems: "center",
        fontFamily: ff.sans, fontSize: 11.5, color: theme.inkSoft,
        letterSpacing: "0.04em",
      }}>
        <span>{ago}</span>
        <span style={{ fontFamily: ff.mono, color: theme.ink }}>
          {[tempStr, timeStr].filter(Boolean).join(" · ") || "—"}
        </span>
      </div>

      {/* Taste rating — the cup quality dial, pinned at the top so a
          glance reads "how good was this cup" before anything else. */}
      <div style={{ marginTop: 18 }}>
        <SectionLabel>Taste</SectionLabel>
        <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
          {[1,2,3,4,5].map(i => (
            <span key={i} style={{
              fontSize: 22, color: i <= (session.taste ?? 0) ? theme.terra : theme.rule,
              lineHeight: 1,
            }}>●</span>
          ))}
        </div>
      </div>

      {/* Mood arc. Three states:
          - pending   → "ask is still open"
          - logged    → target pills colored landed (sage) / missed
                        (terra), plus any extras the user added.
          - none set  → skip the section entirely. */}
      {targetMoods.length > 0 ? (
        <Row label={moodsPending ? "Mood (pending)" : "Mood"}>
          {moodsPending ? (
            <span style={{
              fontFamily: ff.serif, fontStyle: "italic", fontSize: 12.5,
              color: theme.ochre,
            }}>
              still resolving — surface the follow-up card on Home to log
            </span>
          ) : (
            <>
              {targetMoods.map(m => (
                <Tag key={m} tone={landedMap[m] ? "sage" : "terra"}>
                  {m}{landedMap[m] ? "" : " ✗"}
                </Tag>
              ))}
              {extraMoods.map(m => (
                <Tag key={`x-${m}`} tone="sage" italic>+ {m}</Tag>
              ))}
            </>
          )}
        </Row>
      ) : null}

      {/* Flavor arc. Same pattern as mood — predicted notes show as
          landed (sage) / missed (terra) based on flavorsTasted, plus
          any extras the user added at log time. Older sessions
          predating the flavor split won't have flavorsTarget — those
          skip the section. */}
      {flavorsLogged && (
        <Row label="Flavor">
          {targetFlavors.map(f => (
            <Tag key={f} tone={flavorsTasted[f] ? "sage" : "terra"}>
              {f}{flavorsTasted[f] ? "" : " ✗"}
            </Tag>
          ))}
          {flavorsExtra.map(f => (
            <Tag key={`xf-${f}`} tone="terra" italic>+ {f}</Tag>
          ))}
        </Row>
      )}

      {/* Going-in mood and intent — what the user said they were
          reaching for. Lives below mood/flavor results because the
          "what landed" reads first; "what I came in for" is context. */}
      {(session.currentMoods?.length > 0 || session.intent) && (
        <div style={{ marginTop: 18 }}>
          <SectionLabel>Going in</SectionLabel>
          {session.currentMoods?.length > 0 && (
            <div style={{ marginTop: 6, display: "flex", flexWrap: "wrap", gap: 5 }}>
              {session.currentMoods.map(m => (
                <Tag key={m} tone="default">{m}</Tag>
              ))}
            </div>
          )}
          {session.intent && (
            <div style={{
              marginTop: 8, fontFamily: ff.serif, fontStyle: "italic",
              fontSize: 14, color: theme.inkSoft,
            }}>
              "{session.intent}"
            </div>
          )}
        </div>
      )}

      {/* Marginalia — combined brew-time + follow-up note + any
          later-added reflections. Render with whitespace preserved
          so the paragraph break inserted between appended notes
          reads as a small stacked log instead of a wall of text. */}
      {session.note && session.note.trim() && (
        <div style={{ marginTop: 18 }}>
          <SectionLabel>Marginalia</SectionLabel>
          <div style={{
            marginTop: 8, padding: "10px 12px",
            background: theme.cream, border: `1px solid ${theme.ruleSoft}`,
            borderRadius: 8,
            fontFamily: ff.serif, fontSize: 14, color: theme.ink,
            lineHeight: 1.5, whiteSpace: "pre-wrap",
          }}>
            {session.note}
          </div>
        </div>
      )}

      {/* Add-a-note composer — collapsed by default to a quiet
          "+ add a note" link, opens to a dashed-rule textarea with
          save/cancel. Each save appends with a paragraph break, so
          the user can keep adding reflections to a cup over time
          (next-day impressions, what they remember, what changed). */}
      {appendSessionNote && (
        <div style={{ marginTop: 14 }}>
          {!noteOpen && !noteJustSaved && (
            <button
              onClick={() => setNoteOpen(true)}
              onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(176,84,47,0.06)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
              style={{
                width: "100%", padding: "9px 14px",
                background: "transparent",
                border: `1px dashed ${theme.terra}`,
                borderRadius: 10,
                fontFamily: ff.serif, fontSize: 13,
                color: theme.terra, cursor: "pointer",
                transition: "background 0.18s ease",
              }}
            >+ add a note</button>
          )}
          {noteJustSaved && (
            <div style={{
              padding: "9px 14px", textAlign: "center",
              fontFamily: ff.serif, fontStyle: "italic", fontSize: 12.5,
              color: theme.sageDeep,
              border: `1px solid ${theme.ruleSoft}`,
              background: "rgba(98,124,92,0.08)",
              borderRadius: 10,
            }}>note added.</div>
          )}
          {noteOpen && (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <textarea
                autoFocus
                value={noteDraft}
                onChange={(e) => setNoteDraft(e.target.value)}
                placeholder="anything to add about this cup?"
                style={{
                  width: "100%", minHeight: 90, boxSizing: "border-box",
                  background: "rgba(var(--hi-rgb),0.05)",
                  border: `1px dashed ${theme.rule}`,
                  borderRadius: 8, padding: "10px 12px",
                  fontFamily: ff.serif, fontSize: 14, color: theme.ink,
                  lineHeight: 1.5, resize: "vertical", outline: "none",
                }}
              />
              <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                <Button variant="ghost" onClick={handleNoteCancel}>Cancel</Button>
                <Button
                  variant="primary" tone="ink"
                  onClick={handleNoteSave}
                  disabled={!noteDraft.trim()}
                  style={{ fontSize: 14, padding: "10px 22px" }}
                >Add note</Button>
              </div>
            </div>
          )}
        </div>
      )}

      </div>
      </div>

      {/* Brew again — a DOCK, like every other committing action in the
          app. It was a filled terra slab in the scroll flow, so it
          scrolled away with the page: on a long cup with notes you had
          to scroll back down to reach the one thing you came to do.

          Same language as the brew row, the steep controls and the
          confirm prompt's footer — square, transparent, over the same
          glass, with the page reading through it as it scrolls
          underneath. Terra carries the primacy rather than a fill.

          NO CONFIRMATION, deliberately. This is the quick-brew case —
          a cup you've already drunk and are choosing again — and the
          prompt exists to catch an accidental commit while dialling
          something in. There's nothing being dialled here. */}
      {/* THE REVIEW, IN THE BAR IT COMMITS FROM.

          It rendered above the cup's own header whenever a moodScore was
          missing — first thing on the page, competing with the cup's
          identity for the opening screenful, and scrolling away with
          everything else. That is the same argument that moved "brew
          again" out of the flow and into this bar one commit earlier;
          it just had not been applied to the other committing action on
          the screen.

          THE PANEL OPENS BY DEFAULT on an unreviewed cup, so nothing
          becomes less discoverable than it was. Collapsing is available
          and is not the point of the change.

          THE CARD KEEPS ITS STATE WHEN COLLAPSED. It stays mounted and
          the panel hides; unmounting would throw away a half-filled
          form every time somebody folded it away to read the cup they
          are reviewing. Which is also why the slot div only exists
          while open: with no slot, the card falls back to rendering its
          action at its own foot, inside the hidden panel, where it is
          invisible — so the bar can say "review" without two buttons
          fighting over one cell. */}
      {reviewable && (
        <div
          data-testid="cup-review-panel"
          style={{
            position: "absolute", left: 0, right: 0,
            bottom: barH, zIndex: 2,
            maxHeight: "70%", overflowY: "auto",
            padding: "0 18px 12px",
            background: "rgba(var(--ivory-rgb),0.94)",
            backdropFilter: "blur(9px) saturate(1.1)",
            WebkitBackdropFilter: "blur(9px) saturate(1.1)",
            borderTop: `1px solid ${theme.rule}`,
            ...(reviewOpen ? {} : { display: "none" }),
          }}
        >
          <MoodFollowUpCard
            key={session.id}
            session={session}
            actionSlotId={reviewOpen ? REVIEW_SLOT_ID : null}
            onSubmit={(payload) => patchSessionMoods(session.id, payload)}
            onClose={closeReview}
          />
        </div>
      )}

      {onBrewAgain && (
        <div ref={barRef} style={{
          /* ABSOLUTE, NOT STICKY. Sticky is confined to its parent's
             box, and this was the last child of the padded content
             div — so it had no travel and only reached the bar's
             position once you'd scrolled all the way down, which is
             precisely when you no longer needed it pinned. Out of the
             scroll flow entirely now, with the page running underneath
             so the glass has something to show. */
          position: "absolute", left: 0, right: 0, bottom: 0,
          display: "flex", alignItems: "stretch",
          background: "rgba(var(--ivory-rgb),0.58)",
          backdropFilter: "blur(9px) saturate(1.1)",
          WebkitBackdropFilter: "blur(9px) saturate(1.1)",
          borderTop: `1px solid ${theme.rule}`,
        }}>
          {reviewable && (reviewOpen
            /* The card portals its own action here — "pick a verdict"
               while it waits, "log it" once it will do something. The
               label logic already existed at the card's foot; only its
               address changed. */
            ? <div id={REVIEW_SLOT_ID} style={{ flex: 1, display: "flex" }} />
            : (
              <button
                data-testid="cup-review-open"
                onClick={() => setReviewOpen(true)}
                style={{
                  flex: 1,
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                  background: "transparent", border: "none", borderRadius: 0,
                  borderRight: `1px solid ${theme.rule}`,
                  padding: "15px 12px", cursor: "pointer",
                  fontFamily: ff.sans, fontSize: 12.5, letterSpacing: "0.06em",
                  fontWeight: 600, color: theme.ash,
                }}
              >review</button>
            ))}
          <button
            data-testid="cup-brew-again"
            onClick={onBrewAgain}
            style={{
              flex: 1,
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              background: "transparent", border: "none", borderRadius: 0,
              padding: "15px 12px", cursor: "pointer",
              fontFamily: ff.sans, fontSize: 12.5, letterSpacing: "0.06em",
              fontWeight: 600, color: theme.terra,
            }}
          >
            <Kettle size={14} c={theme.terra} />
            brew again →
          </button>
        </div>
      )}
    </div>
  );
};
