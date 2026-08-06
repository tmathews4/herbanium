/* ──────────────────────────────────────────────────────────────
   screens/SteepScreen.jsx — the timer/wait-cards Steep screen.
   ────────────────────────────────────────────────────────────── */

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Leaf, Pencil } from "../components/icons";
import { INGREDIENTS } from "../data/ingredients";
import { buildWaitCards } from "../data/waitContent";
import { iconBtn, mmss } from "../helpers/misc";
import {
  ff, theme,
} from "../theme";
import { IngredientSheet } from "./IngredientSheet";
import {
  scheduleSteepNotification, cancelSteepNotification, hapticDone,
} from "../helpers/native";
import { warmupChime, playBrewChime } from "../helpers/chime";
import {
  requestWebNotificationPermission, fireWebNotification,
} from "../helpers/webNotification";
import { PARENT_MOODS, CURRENT_MOOD_CHIPS } from "../data/canon";

/* ──────────────────────────────────────────────────────────────
   Screen: STEEP (takeover)
   ────────────────────────────────────────────────────────────── */

// Pickers pull from the parent-mood canon: target row uses
// PARENT_MOODS only (positive-only — no one aspires to feel
// anxious), current-feel row concats the rough-edged extras.
const DESIRED_MOOD_CHIPS = PARENT_MOODS;

export const SteepScreen = ({ blend, intent, setIntent, targetMoods, setTargetMoods, currentMoods, setCurrentMoods, sessions, onDone, onCancel, minimized = false, onMinimize, onRemainingChange, onSaveRecipe, onRenameBlend, alreadySaved = false }) => {
  const total = blend.timeS || 360;
  const [remaining, setRemaining] = useState(total);
  const [paused, setPaused] = useState(false);
  /* One cell of the steep dock. Square, transparent, divided by the
     same ruleSoft hairline the tab dock and the brew row use — the
     affordance is a face of the surface, not an object resting on it. */
  const steepCell = ({ divider = false, accent = null } = {}) => ({
    flex: 1,
    background: "transparent",
    border: "none",
    borderRight: divider ? `1px solid ${theme.ruleSoft}` : "none",
    borderRadius: 0,
    padding: "15px 10px",
    cursor: "pointer",
    fontFamily: ff.sans, fontSize: 12.5, letterSpacing: "0.04em",
    fontWeight: accent ? 600 : 500,
    color: accent || theme.inkSoft,
    transition: "color 0.3s ease",
  });
  const [activeIngredient, setActiveIngredient] = useState(null);
  // Over-steep counter — increments by 1 each second after remaining
  // hits zero, until the user pours (resets) or logs the cup. Drives
  // a soft warning band ("getting bitter — pour soon") so users who
  // walk away and come back know the cup is past its sweet spot.
  // Reset to 0 by both the manual reset and any natural finish path.
  const [overSteepS, setOverSteepS] = useState(0);
  // True for ~1.8s after remaining first hits zero — drives the
  // one-time arrival pulse on the countdown ring + READY label
  // fade-in. Cleared by a timeout so the pulse plays once per
  // brew cycle rather than looping.
  const [justFinished, setJustFinished] = useState(false);
  // Inline rename of the blend, offered beside its title.
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState("");

  // Journal textarea auto-grow — start compact (≈2 lines) so the
  // wait card and bottom buttons stay above the fold on shorter
  // viewports, then expand only as content demands. Pure DOM
  // height-from-scrollHeight; no resize observer needed since the
  // user's typing is the only trigger.
  const intentTextareaRef = useRef(null);
  const autoGrowIntent = useCallback(() => {
    const el = intentTextareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, []);
  // Keep the height honest if the value changes externally (e.g.
  // tapping the prompt-card "answer this" button injects text).
  useEffect(() => { autoGrowIntent(); }, [intent, autoGrowIntent]);

  // Past brews of this blend — only meaningful if the blend has an id (saved
  // or previously-logged). Freshly-composed blends won't have prior sessions.
  // Filter to sessions that actually carry a written note from the user
  // (steep-time intent or post-brew log note); blank-noted sessions are
  // skipped so the panel reads as a notebook of what you've written, not
  // a generic brew log.
  const pastNoteSessions = React.useMemo(() => {
    if (!sessions || !blend.id) return [];
    return sessions.filter(s =>
      s.who === "you"
      && s.blendId === blend.id
      && ((s.intent && s.intent.trim()) || (s.note && s.note.trim()))
    );
  }, [sessions, blend.id]);

  // Build the "while you wait" pool once per brew. Memoized to avoid
  // rebuilding (and re-shuffling) on every render.
  const waitCards = React.useMemo(
    () => buildWaitCards(blend, targetMoods),
    [blend, targetMoods]
  );
  const [waitIdx, setWaitIdx] = useState(0);
  // Fade state — briefly hides the card during transitions for a gentle feel
  const [waitFading, setWaitFading] = useState(false);

  // One interval handles both the countdown and the over-steep tick
  // so we don't tear down + recreate every second. A ref keeps the
  // remaining value fresh inside the interval body without resetting
  // the timer on each state change.
  const remainingRef = useRef(remaining);
  remainingRef.current = remaining;
  useEffect(() => {
    if (paused) return;
    const t = setInterval(() => {
      if (remainingRef.current > 0) {
        setRemaining(r => Math.max(0, r - 1));
      } else {
        setOverSteepS(s => s + 1);
      }
    }, 1000);
    return () => clearInterval(t);
  }, [paused]);

  // Push the live remaining value up to the parent so the
  // BrewTimerBanner can show a synchronized countdown while the
  // steep is minimized. Called on every tick AND on mount so the
  // banner has an initial value the moment the user minimizes.
  useEffect(() => {
    if (onRemainingChange) onRemainingChange(remaining);
  }, [remaining, onRemainingChange]);

  // First-zero arrival: flash the pulse + READY label once when
  // remaining transitions to zero. setJustFinished gates the CSS
  // animation; cleared after 1.8s so subsequent renders don't keep
  // re-pulsing while the user sits at zero.
  useEffect(() => {
    if (remaining !== 0) return;
    setJustFinished(true);
    const t = setTimeout(() => setJustFinished(false), 1800);
    return () => clearTimeout(t);
  }, [remaining]);

  // Native steep alarm — schedule a local notification that fires
  // when the brew finishes, so the user can leave the app or lock
  // the phone and still get pulled back. Cancelled when the user
  // pauses, navigates away, or the screen unmounts. No-op on web.
  const notificationIdRef = useRef(null);
  useEffect(() => {
    if (paused || remaining <= 0) {
      if (notificationIdRef.current != null) {
        cancelSteepNotification(notificationIdRef.current);
        notificationIdRef.current = null;
      }
      return;
    }
    let cancelled = false;
    scheduleSteepNotification({
      blendName: blend?.name,
      secondsFromNow: remaining,
    }).then(id => {
      if (cancelled || id == null) return;
      notificationIdRef.current = id;
    });
    return () => {
      cancelled = true;
      if (notificationIdRef.current != null) {
        cancelSteepNotification(notificationIdRef.current);
        notificationIdRef.current = null;
      }
    };
    // Only re-schedule on pause toggle or fresh mount; the running
    // countdown shouldn't reschedule every second.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paused, blend?.name]);

  // Auto-dismiss the ingredient tile when the brew completes — the user's
  // attention should snap back to the timer at the finish moment.
  useEffect(() => {
    if (remaining === 0 && activeIngredient) {
      setActiveIngredient(null);
    }
  }, [remaining, activeIngredient]);

  // Brew finished — fire a success haptic, an audio chime, and a
  // browser notification (web only; native users got the system
  // LocalNotification scheduled at brew start). Each layer is
  // best-effort; together they cover the matrix of "user is in
  // app" / "user tabbed away" / "user backgrounded the phone."
  useEffect(() => {
    if (remaining === 0) {
      hapticDone();
      playBrewChime();
      fireWebNotification(
        "Brew is ready",
        blend?.name ? `${blend.name} is steeped — pour and enjoy.` : "Your steep is up.",
      );
    }
  }, [remaining, blend?.name]);

  // Warm up the audio context + request browser notification
  // permission on SteepScreen mount. The mount itself happens on
  // the heels of a user gesture (the Brew button tap), so audio
  // is unblocked here for later auto-firing when the timer ends.
  // Both are no-ops on native (where Capacitor handles audio /
  // notification differently and these helpers gracefully decline).
  useEffect(() => {
    warmupChime();
    requestWebNotificationPermission();
  }, []);

  // Manual advance to the next card — shared by the click handler and
  // the auto-cycle interval. Bumps `lastAdvance` which resets the interval.
  const CARD_CYCLE_S = 10;
  const [lastAdvance, setLastAdvance] = useState(Date.now());
  // Seconds remaining until the next auto-advance. Drives the small
  // progress ring in the card's corner. Resets to CARD_CYCLE_S on advance.
  const [cardRemaining, setCardRemaining] = useState(CARD_CYCLE_S);

  const advanceWaitCard = React.useCallback(() => {
    if (waitCards.length <= 1) return;
    setWaitFading(true);
    setTimeout(() => {
      setWaitIdx(i => (i + 1) % waitCards.length);
      setWaitFading(false);
      setLastAdvance(Date.now());
      setCardRemaining(CARD_CYCLE_S);
    }, 400);
  }, [waitCards.length]);

  const reverseWaitCard = React.useCallback(() => {
    if (waitCards.length <= 1) return;
    setWaitFading(true);
    setTimeout(() => {
      setWaitIdx(i => (i - 1 + waitCards.length) % waitCards.length);
      setWaitFading(false);
      setLastAdvance(Date.now());
      setCardRemaining(CARD_CYCLE_S);
    }, 400);
  }, [waitCards.length]);

  // Auto-cycle every CARD_CYCLE_S seconds. Clicking a card triggers
  // advanceWaitCard which updates lastAdvance, which re-runs this effect
  // with a fresh timer (so you never get a manual-then-auto double advance).
  // Auto-cycle every CARD_CYCLE_S seconds. Clicking a card triggers
  // advanceWaitCard which updates lastAdvance, which re-runs this effect
  // with a fresh timer (so you never get a manual-then-auto double advance).
  // Keeps cycling even after the brew completes — the user might still
  // be sitting with the cup, reading along.
  useEffect(() => {
    if (paused || waitCards.length <= 1) return;
    const cycle = setTimeout(advanceWaitCard, CARD_CYCLE_S * 1000);
    return () => clearTimeout(cycle);
  }, [paused, waitCards.length, lastAdvance, advanceWaitCard]);

  // Tick the card's countdown every second. Critically, this effect does
  // NOT depend on `paused` — otherwise it would tear down and reset every
  // time you pause/resume. Instead we read paused through a ref inside
  // the interval body.
  const pausedRef = React.useRef(paused);
  pausedRef.current = paused;

  useEffect(() => {
    if (waitCards.length <= 1) return;
    setCardRemaining(CARD_CYCLE_S);
    const tick = setInterval(() => {
      if (pausedRef.current) return;
      setCardRemaining(r => Math.max(0, r - 1));
    }, 1000);
    return () => clearInterval(tick);
  }, [waitCards.length, lastAdvance]);

  const pct = 1 - remaining / total;
  const R = 74;
  const C = 2 * Math.PI * R;

  // brewing landmarks
  const landmarks = [
    { t: 0, label: "pour" },
    { t: Math.round(total * 0.35), label: "inhale" },
    { t: Math.round(total * 0.7), label: "taste" },
    { t: total, label: "done" },
  ];

  return (
    <div style={{
      position: "absolute", top: 0, left: 0, right: 0,
        // Stops at the dock instead of covering it — the main menu is
        // never not on screen. Falls back to 0px so the screen still
        // fills its container if rendered outside the app shell.
        bottom: "var(--app-dock-h, 0px)", zIndex: 30,
      background: `radial-gradient(ellipse at 50% 20%, ${theme.cream} 0%, ${theme.paper} 60%, ${theme.ivory} 100%)`,
      // Minimize hides the steep page via display:none — keeps the
      // component mounted (timer ticks continue, native steep
      // notification stays scheduled) so restoring is instant and
      // synchronized. The BrewTimerBanner up in App renders in
      // place of the visible steep while minimized.
      display: minimized ? "none" : "flex",
      flexDirection: "column",
      padding: "22px 22px 26px",
      boxSizing: "border-box",
      // Steep grew taller with the writing surface — keep the page
      // scrolling so the timer + mood + writing + wait-card stack
      // always reaches even on shorter viewports.
      overflowY: "auto", overflowX: "hidden",
      WebkitOverflowScrolling: "touch",
    }}>
      {/* header — cancel on the left, minimize on the right (the
          slot the now-retired planner button used to occupy). */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
        <button onClick={onCancel} style={{
          background: "transparent", border: "none", color: theme.ash,
          fontFamily: ff.sans, fontSize: 12, letterSpacing: "0.12em", textTransform: "uppercase", cursor: "pointer",
        }}>← cancel</button>
        {/* Minimize — collapses the steep page into a top-of-screen
            banner so the user can navigate the rest of the app
            while the brew runs. Hidden when no onMinimize handler
            is wired (defensive — caller can opt out). */}
        {onMinimize && (
          <button
            onClick={onMinimize}
            title="minimize timer to a top banner"
            style={{
              background: "transparent", border: "none", color: theme.inkSoft,
              fontFamily: ff.sans, fontSize: 12, letterSpacing: "0.12em",
              textTransform: "uppercase", cursor: "pointer",
              padding: 0,
              display: "flex", alignItems: "center", gap: 4,
            }}
          >
            <span style={{
              fontFamily: ff.mono, fontSize: 14, lineHeight: 1, fontWeight: 600,
            }}>—</span>
            <span>minimize</span>
          </button>
        )}
      </div>

      {/* countdown ring — at zero the stroke shifts to sage and a
          one-shot pulse plays via .steep-ring-arrived. The center
          label swaps from "remaining / m:ss / of m:ss" to
          "READY / POUR NOW / m:ss steeped" so the moment reads as
          an arrival rather than a state change. */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", marginTop: 12, position: "relative" }}>
        <svg
          width="200" height="200" viewBox="-100 -100 200 200"
          className={justFinished ? "steep-ring-arrived" : ""}
          style={{
            animation: paused ? "none" : "breathe 4.5s ease-in-out infinite",
          }}
        >
          <circle cx="0" cy="0" r={R} stroke={theme.ruleSoft} strokeWidth="1.5" fill="none" />
          <circle
            cx="0" cy="0" r={R}
            stroke={remaining === 0 ? theme.sageDeep : theme.terra}
            strokeWidth="2.5" fill="none"
            strokeDasharray={C}
            strokeDashoffset={C * (1 - pct)}
            transform="rotate(-90)"
            strokeLinecap="round"
            style={{ transition: "stroke-dashoffset .8s linear, stroke 0.6s ease" }}
          />
          {/* landmark ticks */}
          {landmarks.map((lm, i) => {
            const a = (lm.t / total) * 2 * Math.PI - Math.PI / 2;
            const x1 = Math.cos(a) * (R - 4), y1 = Math.sin(a) * (R - 4);
            const x2 = Math.cos(a) * (R + 4), y2 = Math.sin(a) * (R + 4);
            return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={theme.ink} strokeWidth="1" />;
          })}
        </svg>
        <div style={{
          position: "absolute", inset: 0, display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center", pointerEvents: "none",
        }}>
          {remaining === 0 ? (
            <>
              <div className="steep-ready-eyebrow" style={{
                fontFamily: ff.sans, fontSize: 10, letterSpacing: "0.28em",
                textTransform: "uppercase", color: theme.sageDeep, fontWeight: 600,
              }}>ready</div>
              <div className="steep-ready-headline" style={{
                fontFamily: ff.serif, fontSize: 30, fontWeight: 400,
                color: theme.ink, letterSpacing: "-0.01em", lineHeight: 1, marginTop: 2,
              }}>pour now</div>
              <div style={{
                marginTop: 4, fontFamily: ff.sans, fontSize: 9.5, letterSpacing: "0.18em",
                textTransform: "uppercase", color: theme.ash,
              }}>
                {overSteepS > 0 ? `+${mmss(overSteepS)} past` : `${mmss(total)} steeped`}
              </div>
            </>
          ) : (
            <>
              <div style={{ fontFamily: ff.serif, fontSize: 10.5, fontStyle: "italic", color: theme.ash }}>remaining</div>
              <div style={{ fontFamily: ff.serif, fontSize: 36, fontWeight: 400, color: theme.ink, letterSpacing: "-0.02em", lineHeight: 1 }}>
                {mmss(remaining)}
              </div>
              <div style={{ marginTop: 3, fontFamily: ff.sans, fontSize: 9.5, letterSpacing: "0.18em", textTransform: "uppercase", color: theme.ash }}>
                of {mmss(total)}
              </div>
            </>
          )}
        </div>
      </div>

      {/* blend details */}
      <div style={{ textAlign: "center" }}>
        {/* THE NAME IS EDITABLE HERE. With the save-or-brew prompt gone,
            nothing asks what to call a composed blend any more — it
            would save as "Untitled blend" and be unfindable later. This
            is the moment to name it: the cup is going, the user knows
            what they made, and nothing is blocking on the answer.

            Rename goes up to App rather than being held locally, so the
            session and the saved recipe stay one source of truth. */}
        {onRenameBlend && editingName ? (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const next = nameDraft.trim();
              if (next) onRenameBlend(next);
              setEditingName(false);
            }}
            style={{ display: "flex", alignItems: "center", gap: 6, justifyContent: "center" }}
          >
            <input
              autoFocus
              value={nameDraft}
              onChange={(e) => setNameDraft(e.target.value)}
              onBlur={() => {
                const next = nameDraft.trim();
                if (next) onRenameBlend(next);
                setEditingName(false);
              }}
              aria-label="blend name"
              data-testid="steep-name-input"
              style={{
                fontFamily: ff.serif, fontSize: 22, color: theme.ink,
                textAlign: "center", background: "transparent",
                border: "none", borderBottom: `1px solid ${theme.terra}`,
                outline: "none", padding: "2px 4px", maxWidth: 260,
              }}
            />
          </form>
        ) : (
          <div style={{
            display: "flex", alignItems: "baseline", gap: 6, justifyContent: "center",
          }}>
            <div style={{ fontFamily: ff.serif, fontSize: 22, color: theme.ink }}>{blend.name}</div>
            {onRenameBlend && (
              <button
                onClick={() => { setNameDraft(blend.name || ""); setEditingName(true); }}
                aria-label="rename this blend"
                data-testid="steep-rename"
                style={{
                  background: "transparent", border: "none", cursor: "pointer",
                  padding: "0 2px", lineHeight: 1, color: theme.ash,
                  display: "inline-flex", alignItems: "center",
                }}
              >
                <Pencil size={13} c={theme.ash} />
              </button>
            )}
          </div>
        )}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, justifyContent: "center", marginTop: 8 }}>
          {(blend.ingredients || []).map(item => {
            const id = typeof item === "string" ? item : item.id;
            const ing = INGREDIENTS[id];
            return ing ? (
              <button
                key={id}
                onClick={() => setActiveIngredient(id)}
                style={{
                  fontFamily: ff.sans, fontSize: 11, color: theme.inkSoft,
                  padding: "3px 10px", border: `1px solid ${theme.rule}`, borderRadius: 999,
                  background: "transparent", cursor: "pointer",
                }}
              >{ing.name}</button>
            ) : null;
          })}
        </div>

        {/* SAVE LIVES HERE NOW, not at the foot of the compose page.
            Only Brew moved into the brew panel — two buttons in that row
            would have crowded the one control you drag — and saving is
            the occasional act, so it belongs where you've committed to
            the cup rather than beside the dial you're still turning.

            Disabled once the recipe is already saved: arriving from a
            saved recipe, or after saving it here. Shown disabled rather
            than hidden, so the answer to "can I keep this?" is on screen
            either way — a missing button reads as a missing feature. */}
        {onSaveRecipe && (
          <div style={{ marginTop: 14, display: "flex", justifyContent: "center" }}>
            <button
              onClick={alreadySaved ? undefined : onSaveRecipe}
              disabled={alreadySaved}
              data-testid="steep-save"
              // Terra, not a quiet outline. This is the ONLY way to keep
              // a recipe now — the save-or-brew prompt that used to fire
              // on Brew is gone — so it has to look like an offer rather
              // than a footnote, or a blend gets brewed, enjoyed and
              // lost. Falls back to the quiet outline once it's saved,
              // when it's a status rather than an action.
              style={{
                background: alreadySaved ? "transparent" : theme.terra,
                border: `1px solid ${alreadySaved ? theme.ruleSoft : theme.terra}`,
                borderRadius: 999,
                padding: "7px 18px",
                fontFamily: ff.sans, fontSize: 11.5, letterSpacing: "0.08em",
                textTransform: "uppercase",
                fontWeight: alreadySaved ? 400 : 600,
                color: alreadySaved ? theme.ash : theme.cream,
                cursor: alreadySaved ? "default" : "pointer",
                transition: "background 0.2s ease, color 0.2s ease, border-color 0.2s ease",
              }}
            >
              {alreadySaved ? "saved" : "save this recipe"}
            </button>
          </div>
        )}
      </div>

      {/* Mood check-in — only the 'right now' read survives on the
          Steep page. The 'I'd like to feel' target row used to live
          here too but it duplicated the brewing-intent that the
          recipe itself carries (every blend declares mood/effects),
          and asking the user to predict their own arrival before
          the cup steeps invites a wishful-target answer that the
          post-brew follow-up then has to reconcile against. The
          MoodFollowUpCard captures landed mood as a single 1–5
          score after the cup arrives — that's the honest signal,
          and it doesn't need a target to compare against. */}
      <div style={{ marginTop: 18 }}>
        <MoodChipRow
          label="Right now I feel…"
          value={currentMoods || []}
          setValue={setCurrentMoods}
          chips={CURRENT_MOOD_CHIPS}
        />
      </div>

      {/* Steep-time reflection — promoted from a single-line
          personal-notes input to a real writing surface. The brewing
          wait is the strongest natural prompt-able moment in the
          app (3-7 minutes of mandatory attention idling), so the
          journal lives here as the primary path. The page is left
          deliberately simple: serif text in a soft cream surface,
          dashed rule, no chrome. The brew log's Notebook → Reflections
          tab surfaces this writing later in chronological form. */}
      <div style={{ marginTop: 18 }}>
        <div style={{
          fontFamily: ff.sans, fontSize: 9.5, letterSpacing: "0.18em",
          textTransform: "uppercase", color: theme.ash, marginBottom: 6,
        }}>while it steeps</div>
        <textarea
          ref={intentTextareaRef}
          value={intent || ""}
          onChange={(e) => setIntent && setIntent(e.target.value)}
          onInput={autoGrowIntent}
          placeholder="A line, a thought, a thing the day's holding…"
          rows={2}
          style={{
            width: "100%", boxSizing: "border-box",
            fontFamily: ff.serif, fontStyle: intent ? "normal" : "italic",
            fontSize: 16, color: intent ? theme.ink : theme.ash,
            lineHeight: 1.7,
            background: theme.cream,
            border: `1px solid ${theme.ruleSoft}`, borderRadius: 10,
            padding: "14px 16px", outline: "none",
            resize: "none", minHeight: 70,
            overflow: "hidden",
            boxShadow: "0 1px 2px rgba(0,0,0,0.03)",
          }}
        />
      </div>

      {/* while you wait — cycling fact/tradition/poem pool keyed to this blend
          Tap the card to advance to the next one; the auto-cycle interval resets. */}
      <div
        onClick={advanceWaitCard}
        style={{
          marginTop: 18, padding: "16px 18px 12px",
          border: `1px solid ${theme.rule}`, borderRadius: 12,
          background: theme.cream,
          boxShadow: "0 1px 2px rgba(0,0,0,0.03)",
          minHeight: 100,
          flexShrink: 0,
          cursor: waitCards.length > 1 ? "pointer" : "default",
          position: "relative",
          boxSizing: "border-box",
          maxWidth: "100%",
          // Long-word safeguards live on the inner text block; we
          // don't clip vertically here so the card auto-grows to fit
          // multi-line poems / longer facts without hiding any text.
          overflowX: "hidden",
          minWidth: 0,
          display: "flex", flexDirection: "column",
        }}
      >
        {/* Header — back triangle (left), centered label, forward
            triangle (right). Both triangles share identical SVG/style
            so the row reads symmetrically. The countdown ring is
            anchored to the card's bottom-right corner below. */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
          <div style={{ width: 14, flexShrink: 0, display: "flex", justifyContent: "flex-start" }}>
            {waitCards.length > 1 && (
              <button
                onClick={(e) => { e.stopPropagation(); reverseWaitCard(); }}
                aria-label="previous"
                title="previous"
                style={{
                  background: "transparent", border: "none",
                  padding: 0, lineHeight: 0,
                  cursor: "pointer", color: theme.ash,
                  display: "inline-flex", alignItems: "center",
                }}
              >
                <svg width="10" height="12" viewBox="0 0 10 12" aria-hidden="true">
                  <polygon points="9,1 1,6 9,11" fill="currentColor" />
                </svg>
              </button>
            )}
          </div>
          <div style={{
            flex: 1, minWidth: 0,
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
          }}>
            <Leaf size={16} c={theme.sageDeep} />
            <div style={{
              fontFamily: ff.sans, fontSize: 10, letterSpacing: "0.18em",
              textTransform: "uppercase", color: theme.ash,
              minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
              textAlign: "center",
            }}>
              {waitCards[waitIdx]?.type === "poem"      ? "a verse" :
               waitCards[waitIdx]?.type === "tradition" ? "tradition" :
               waitCards[waitIdx]?.type === "prompt"    ? "a question for the cup" :
               "while you wait"}
            </div>
          </div>
          <div style={{ width: 14, flexShrink: 0, display: "flex", justifyContent: "flex-end" }}>
            {waitCards.length > 1 && (
              <button
                onClick={(e) => { e.stopPropagation(); advanceWaitCard(); }}
                aria-label="next"
                title="next"
                style={{
                  background: "transparent", border: "none",
                  padding: 0, lineHeight: 0,
                  cursor: "pointer", color: theme.ash,
                  display: "inline-flex", alignItems: "center",
                }}
              >
                <svg width="10" height="12" viewBox="0 0 10 12" aria-hidden="true">
                  <polygon points="1,1 9,6 1,11" fill="currentColor" />
                </svg>
              </button>
            )}
          </div>
        </div>
        <div style={{
          fontFamily: ff.serif, fontStyle: waitCards[waitIdx]?.type === "poem" ? "normal" : "italic",
          fontSize: 14.5, color: theme.ink, marginTop: 8, lineHeight: 1.6,
          opacity: waitFading ? 0 : 1,
          transition: "opacity 0.4s ease",
          whiteSpace: waitCards[waitIdx]?.type === "poem" ? "pre-line" : "normal",
          overflowWrap: "anywhere", wordBreak: "break-word",
          hyphens: "auto",
          width: "100%", maxWidth: "100%", minWidth: 0,
          boxSizing: "border-box",
          display: "block",
        }}>
          {waitCards[waitIdx]?.text}
        </div>
        {waitCards[waitIdx]?.attribution && (
          <div style={{
            fontFamily: ff.serif, fontStyle: "italic", fontSize: 11, color: theme.ash,
            marginTop: 8, textAlign: "right", paddingRight: 18,
            opacity: waitFading ? 0 : 1,
            transition: "opacity 0.4s ease",
          }}>
            {waitCards[waitIdx].attribution}
          </div>
        )}
        {/* Prompt-only affordance: lift the question into the notes
            field above so the user can answer it while the cup steeps. */}
        {waitCards[waitIdx]?.type === "prompt" && setIntent && (
          <div style={{ marginTop: 10, display: "flex", justifyContent: "flex-end" }}>
            <button
              onClick={(e) => {
                e.stopPropagation();
                const prompt = waitCards[waitIdx].text;
                const cur = (intent || "").trim();
                const next = cur
                  ? `${cur}\n\n${prompt}\n`
                  : `${prompt}\n`;
                setIntent(next);
              }}
              style={{
                fontFamily: ff.sans, fontSize: 11, letterSpacing: "0.06em",
                color: theme.terra, background: "transparent",
                border: `1px solid ${theme.terra}`, borderRadius: 999,
                padding: "4px 12px", cursor: "pointer",
                opacity: waitFading ? 0 : 1, transition: "opacity 0.4s ease",
              }}
            >+ note</button>
          </div>
        )}
        {/* Bottom bar — dedicated row for the countdown ring with a
            soft top rule and generous top margin so the timer never
            sits next to (or overlaps) the wait-card body. Only the
            ring lives down here; everything else stays in the body
            block above. */}
        {waitCards.length > 1 && (
          <div style={{
            marginTop: 16, paddingTop: 10,
            borderTop: `1px solid ${theme.ruleSoft}`,
            display: "flex", justifyContent: "flex-end", alignItems: "center",
            minHeight: 22,
          }}>
            <svg
              width="18" height="18" viewBox="-11 -11 22 22"
              style={{ display: "block" }}
              aria-hidden="true"
            >
              <circle cx="0" cy="0" r="9" stroke={theme.ruleSoft} strokeWidth="1.5" fill="none" />
              <circle
                cx="0" cy="0" r="9"
                stroke={theme.ash} strokeWidth="1.5" fill="none"
                strokeDasharray={2 * Math.PI * 9}
                strokeDashoffset={(2 * Math.PI * 9) * (1 - cardRemaining / CARD_CYCLE_S)}
                transform="rotate(-90)"
                strokeLinecap="round"
                style={{ transition: "stroke-dashoffset 1s linear" }}
              />
            </svg>
          </div>
        )}
      </div>

      {/* controls — pause is meaningless after zero (nothing to
          pause), so we drop it and rename reset to "steep again"
          since the natural intent at zero is a second infusion. The
          primary CTA flips from ink "done early" to a terra-filled,
          softly pulsing "log this cup" so the arrival moment carries
          its own visual weight. */}
      {/* A DOCK, like the brew row — not three buttons on the page.
          They were a pill, a pill and a filled slab floating in the
          scroll flow, which is the treatment every other surface has
          moved away from. Now one menu pinned to the bottom of the
          screen, taking the same glass as the tab dock and the brew
          row: rgba(ivory,0.58) over a 9px blur, so the page reads
          through it as it scrolls underneath.

          Equal cells divided by hairlines, square, transparent — the
          language the brew corner and the confirm prompt's footer both
          speak. `done early` carries its primacy in colour rather than
          in a fill, so the row stays a row.

          Sticky rather than a layout change: the steep page is one
          scrolling column and this is the least invasive way to make
          the controls stop scrolling with it. Negative margins cancel
          the page's padding so the bar reaches the edges. */}
      <div style={{
        position: "sticky", bottom: -26,
        marginTop: 18, marginBottom: -26,
        marginLeft: -22, marginRight: -22,
        display: "flex", alignItems: "stretch",
        background: "rgba(var(--ivory-rgb),0.58)",
        backdropFilter: "blur(9px) saturate(1.1)",
        WebkitBackdropFilter: "blur(9px) saturate(1.1)",
        borderTop: `1px solid ${theme.rule}`,
      }}>
        {remaining > 0 && (
          <button
            data-testid="steep-pause"
            onClick={() => setPaused(!paused)}
            style={steepCell({ divider: true })}
          >
            {paused ? "▶ resume" : "❚❚ pause"}
          </button>
        )}
        <button
          data-testid="steep-reset"
          onClick={() => { setRemaining(total); setOverSteepS(0); }}
          style={steepCell({ divider: true })}
        >
          {remaining === 0 ? "↺ steep again" : "↺ reset"}
        </button>
        <button
          data-testid="steep-done"
          onClick={() => onDone(blend, intent, targetMoods)}
          className={remaining === 0 ? "steep-cta-arrived" : ""}
          style={steepCell({ accent: remaining === 0 ? theme.terra : theme.ink })}
        >
          {remaining === 0 ? "log this cup →" : "done early →"}
        </button>
      </div>

      {/* Over-steep warning — ambient band that fades in past 30s of
          over-steep, escalates past 2m. Lives below the controls so it
          stays out of the way until it actually has something to say.
          Disappears when the user pours (steep again) or logs the cup. */}
      {remaining === 0 && overSteepS > 30 && (
        <div style={{
          marginTop: 10, padding: "8px 12px",
          borderLeft: `2px solid ${overSteepS > 120 ? theme.terra : theme.ochre}`,
          background: overSteepS > 120 ? "rgba(176,84,47,0.06)" : "rgba(165,120,54,0.06)",
          borderRadius: "0 6px 6px 0",
          fontFamily: ff.serif, fontStyle: "italic", fontSize: 12.5,
          color: theme.inkSoft, lineHeight: 1.4,
        }}>
          {overSteepS > 120
            ? "Tannins climbing — pour now, or it'll bite."
            : "Getting bitter — pour soon."}
        </div>
      )}

      <style>{`
        @keyframes breathe {
          0%, 100% { transform: scale(1); }
          50%      { transform: scale(1.012); }
        }
        .steep-intent-input::placeholder {
          color: ${theme.ash};
          opacity: 0.55;
          font-style: italic;
        }
        /* One-shot arrival pulse on the countdown ring — a single
           grow-and-settle cycle that draws the eye back to the timer
           the moment the brew finishes. Animation is added/removed
           by toggling the .steep-ring-arrived class so it doesn't
           loop while the user sits at zero. */
        @keyframes steep-arrived-pulse {
          0%   { transform: scale(1);    filter: drop-shadow(0 0 0 rgba(125,140,108,0)); }
          35%  { transform: scale(1.06); filter: drop-shadow(0 0 14px rgba(125,140,108,0.45)); }
          100% { transform: scale(1);    filter: drop-shadow(0 0 0 rgba(125,140,108,0)); }
        }
        .steep-ring-arrived {
          animation: steep-arrived-pulse 1.6s ease-out;
        }
        /* Ready-label fade-in — small upward slide so the words
           appear to arrive rather than swap in place. */
        @keyframes steep-ready-fade-in {
          from { opacity: 0; transform: translateY(4px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .steep-ready-eyebrow,
        .steep-ready-headline {
          animation: steep-ready-fade-in 0.6s ease-out both;
        }
        .steep-ready-headline { animation-delay: 0.08s; }
        /* CTA arrival — soft outer glow that breathes once and rests
           into a steady terra-tinted shadow so the button reads as
           the page's natural next step at zero without screaming. */
        @keyframes steep-cta-arrived-pulse {
          0%   { box-shadow: 0 0 0 rgba(176,84,47,0); }
          40%  { box-shadow: 0 4px 18px -2px rgba(176,84,47,0.55); }
          100% { box-shadow: 0 2px 8px -1px rgba(176,84,47,0.30); }
        }
        .steep-cta-arrived {
          animation: steep-cta-arrived-pulse 1.6s ease-out forwards;
        }
      `}</style>

      {/* Ingredient mini-tile — overlays the timer as a bottom sheet */}
      {activeIngredient && (
        <IngredientSheet
          id={activeIngredient}
          onClose={() => setActiveIngredient(null)}
        />
      )}
    </div>
  );
};

const MoodChipRow = ({ label, value, setValue, chips }) => {
  const selected = new Set(value || []);
  const toggle = (key) => {
    if (!setValue) return;
    const next = selected.has(key) ? value.filter(k => k !== key) : [...(value || []), key];
    setValue(next);
  };
  const count = selected.size;
  return (
    <div style={{
      marginBottom: 8, textAlign: "left",
      padding: "12px 14px",
      background: theme.cream,
      border: `1px solid ${theme.ruleSoft}`,
      borderRadius: 10,
      boxShadow: "0 1px 2px rgba(0,0,0,0.03)",
    }}>
      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "baseline",
        marginBottom: 8,
      }}>
        <div style={{
          fontFamily: ff.sans, fontSize: 10.5, letterSpacing: "0.18em",
          textTransform: "uppercase", color: theme.ash,
        }}>{label}</div>
        <div style={{
          fontFamily: ff.serif, fontStyle: "italic", fontSize: 11,
          color: theme.ash,
        }}>
          {count > 0 ? `${count} selected · tap to remove` : "tap any that fit"}
        </div>
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, justifyContent: "flex-start" }}>
        {(chips || DESIRED_MOOD_CHIPS).map(c => {
          const isOn = selected.has(c.key);
          return (
            <button
              key={c.key}
              onClick={() => toggle(c.key)}
              style={{
                fontFamily: ff.serif, fontSize: 13.5,
                padding: "7px 13px", borderRadius: 8,
                background: isOn ? theme.terra : theme.ivory,
                color: isOn ? theme.cream : theme.ink,
                border: `1.5px solid ${isOn ? theme.terra : theme.rule}`,
                cursor: "pointer", transition: "all 0.15s ease",
                display: "inline-flex", alignItems: "center", gap: 6,
                lineHeight: 1,
              }}
            >
              <span aria-hidden="true" style={{
                display: "inline-block", width: 8, height: 8,
                borderRadius: "50%",
                background: isOn ? theme.cream : "transparent",
                border: `1.5px solid ${isOn ? theme.cream : theme.rule}`,
                transition: "all 0.15s ease",
              }} />
              {c.label}
            </button>
          );
        })}
      </div>
    </div>
  );
};
