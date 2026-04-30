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
import { PlannerModal } from "../components/Planner";
import {
  scheduleSteepNotification, cancelSteepNotification, hapticDone,
} from "../helpers/native";

/* ──────────────────────────────────────────────────────────────
   Screen: STEEP (takeover)
   ────────────────────────────────────────────────────────────── */

// Two chip rows on the Steep screen. The "right now" row includes the
// rough-edged states a tea ritual is often addressing (anxious, stressed,
// tired, restless); the "I'd like to feel" row stays positive-only since
// no one aspires to feel anxious.
//
// Each positive chip corresponds to one master mood family from the
// TrackMap hierarchy (FAMILY_BY_EFFECT in FlavorMap.jsx). Exactly
// one chip per family — using leaf-effect keys (sleepy, comfort,
// cooling, digestive) for compatibility with existing saved sessions
// that already store these keys; the `family` field is the
// correlation link to the master register.
const DESIRED_MOOD_CHIPS = [
  { key: "calm",      family: "calm",   label: "Calm" },
  { key: "focus",     family: "focus",  label: "Focus" },
  { key: "energy",    family: "energy", label: "Energy" },
  { key: "comfort",   family: "warm",   label: "Comfort" },
  { key: "cooling",   family: "cool",   label: "Cooling" },
  { key: "digestive", family: "body",   label: "Digestive" },
  { key: "sleepy",    family: "sleep",  label: "Sleep" },
];
const CURRENT_MOOD_CHIPS = [
  ...DESIRED_MOOD_CHIPS,
  { key: "anxious",   label: "Anxious" },
  { key: "stressed",  label: "Stressed" },
  { key: "tired",     label: "Tired" },
  { key: "restless",  label: "Restless" },
];

export const SteepScreen = ({ blend, intent, setIntent, targetMoods, setTargetMoods, currentMoods, setCurrentMoods, sessions, onDone, onCancel, pantryIds, togglePantry, plannerItems = [], addPlannerItem, togglePlannerItem, editPlannerItem, deletePlannerItem, clearDonePlannerItems }) => {
  const total = blend.timeS || 360;
  const [remaining, setRemaining] = useState(total);
  const [paused, setPaused] = useState(false);
  const [activeIngredient, setActiveIngredient] = useState(null);
  const [plannerOpen, setPlannerOpen] = useState(false);

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

  useEffect(() => {
    if (paused) return;
    if (remaining <= 0) return;
    const t = setInterval(() => setRemaining(r => Math.max(0, r - 1)), 1000);
    return () => clearInterval(t);
  }, [paused, remaining]);

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

  // Brew finished — fire a success haptic so the phone in the
  // user's pocket signals "done" alongside the OS notification.
  useEffect(() => {
    if (remaining === 0) {
      hapticDone();
    }
  }, [remaining]);

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
      position: "absolute", inset: 0, zIndex: 30,
      background: `radial-gradient(ellipse at 50% 20%, ${theme.cream} 0%, ${theme.paper} 60%, ${theme.ivory} 100%)`,
      display: "flex", flexDirection: "column",
      padding: "22px 22px 26px",
    }}>
      {/* header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <button onClick={onCancel} style={{
          background: "transparent", border: "none", color: theme.ash,
          fontFamily: ff.sans, fontSize: 12, letterSpacing: "0.12em", textTransform: "uppercase", cursor: "pointer",
        }}>← cancel</button>
        {(() => {
          const openCount = plannerItems.filter(i => !i.done).length;
          return (
            <button
              onClick={() => setPlannerOpen(true)}
              title={openCount > 0
                ? `open today's plan — ${openCount} unchecked`
                : "open today's plan and past brew notes"}
              style={{
                position: "relative",
                background: "transparent", border: "none",
                color: theme.terra,
                fontFamily: ff.sans, fontSize: 12, letterSpacing: "0.12em", textTransform: "uppercase",
                cursor: "pointer",
                display: "flex", alignItems: "center", gap: 5,
                padding: 0,
              }}
            >
              <Pencil size={11} c={theme.terra} />
              <span>planner</span>
              {openCount > 0 && (
                <span
                  aria-label={`${openCount} unchecked`}
                  style={{
                    width: 6, height: 6, borderRadius: "50%",
                    background: theme.terra,
                    display: "inline-block",
                    marginLeft: 1,
                  }}
                />
              )}
            </button>
          );
        })()}
      </div>

      {/* countdown ring */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", marginTop: 12, position: "relative" }}>
        <svg width="200" height="200" viewBox="-100 -100 200 200" style={{
          animation: paused ? "none" : "breathe 4.5s ease-in-out infinite",
        }}>
          <circle cx="0" cy="0" r={R} stroke={theme.ruleSoft} strokeWidth="1.5" fill="none" />
          <circle
            cx="0" cy="0" r={R}
            stroke={theme.terra} strokeWidth="2.5" fill="none"
            strokeDasharray={C}
            strokeDashoffset={C * (1 - pct)}
            transform="rotate(-90)"
            strokeLinecap="round"
            style={{ transition: "stroke-dashoffset .8s linear" }}
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
          <div style={{ fontFamily: ff.serif, fontSize: 10.5, fontStyle: "italic", color: theme.ash }}>remaining</div>
          <div style={{ fontFamily: ff.serif, fontSize: 36, fontWeight: 400, color: theme.ink, letterSpacing: "-0.02em", lineHeight: 1 }}>
            {mmss(remaining)}
          </div>
          <div style={{ marginTop: 3, fontFamily: ff.sans, fontSize: 9.5, letterSpacing: "0.18em", textTransform: "uppercase", color: theme.ash }}>
            of {mmss(total)}
          </div>
        </div>
      </div>

      {/* blend details */}
      <div style={{ textAlign: "center" }}>
        <div style={{ fontFamily: ff.serif, fontSize: 22, color: theme.ink }}>{blend.name}</div>
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
      </div>

      {/* mood chips — captured into the session so the log retrospective
          gets both the from-state (currentMoods) and to-state (targetMoods)
          structured rather than buried in free text. */}
      <div style={{ marginTop: 18 }}>
        <MoodChipRow
          label="Right now I feel…"
          value={currentMoods || []}
          setValue={setCurrentMoods}
          chips={CURRENT_MOOD_CHIPS}
        />
        <MoodChipRow
          label="I'd like to feel…"
          value={targetMoods || []}
          setValue={setTargetMoods}
          chips={DESIRED_MOOD_CHIPS}
        />
      </div>

      {/* personal notes — free-text reflection, kept for anything the chips
          don't cover. */}
      <div style={{ marginTop: 12 }}>
        <div style={{ position: "relative" }}>
          <input
            value={intent || ""}
            onChange={(e) => setIntent && setIntent(e.target.value)}
            placeholder="Personal notes…"
            className="steep-intent-input"
            style={{
              width: "100%", background: "rgba(255,255,255,0.35)",
              border: `1px dashed ${theme.rule}`, borderRadius: 10,
              fontFamily: ff.serif, fontStyle: intent ? "normal" : "italic",
              fontSize: 14, color: intent ? theme.ink : theme.ruleSoft,
              padding: "10px 34px 10px 14px", outline: "none",
              boxSizing: "border-box",
            }}
          />
          <span style={{
            position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)",
            color: theme.ash, fontSize: 12, pointerEvents: "none",
          }}>✎</span>
        </div>
      </div>

      {/* while you wait — cycling fact/tradition/poem pool keyed to this blend
          Tap the card to advance to the next one; the auto-cycle interval resets. */}
      <div
        onClick={advanceWaitCard}
        style={{
          marginTop: 18, padding: "16px 18px",
          border: `1px solid ${theme.rule}`, borderRadius: 12,
          background: theme.cream,
          boxShadow: "0 1px 2px rgba(0,0,0,0.03)",
          minHeight: 100,
          cursor: waitCards.length > 1 ? "pointer" : "default",
          position: "relative",
        }}
      >
        <div style={{ display: "flex", gap: 8, alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <Leaf size={16} c={theme.sageDeep} />
            <div style={{ fontFamily: ff.sans, fontSize: 10, letterSpacing: "0.18em", textTransform: "uppercase", color: theme.ash }}>
              {waitCards[waitIdx]?.type === "poem"      ? "a verse" :
               waitCards[waitIdx]?.type === "tradition" ? "tradition" :
               waitCards[waitIdx]?.type === "prompt"    ? "a question for the cup" :
               "while you wait"}
            </div>
          </div>
          {waitCards.length > 1 && (
            /* Tiny countdown ring — shrinks as the time to next card runs down */
            <svg width="18" height="18" viewBox="-11 -11 22 22" style={{ display: "block" }}>
              <circle
                cx="0" cy="0" r="9"
                stroke={theme.ruleSoft} strokeWidth="1.5" fill="none"
              />
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
          )}
        </div>
        <div style={{
          fontFamily: ff.serif, fontStyle: waitCards[waitIdx]?.type === "poem" ? "normal" : "italic",
          fontSize: 14.5, color: theme.ink, marginTop: 8, lineHeight: 1.6,
          opacity: waitFading ? 0 : 1,
          transition: "opacity 0.4s ease",
          whiteSpace: waitCards[waitIdx]?.type === "poem" ? "pre-line" : "normal",
          overflowWrap: "break-word", wordBreak: "break-word",
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
        {/* Tap-to-advance affordance: a small right-pointing triangle
            in the bottom-right corner of the card */}
        {waitCards.length > 1 && (
          <svg
            width="10" height="10" viewBox="0 0 10 10"
            style={{
              position: "absolute", right: 10, bottom: 10,
              opacity: 0.55,
            }}
          >
            <polygon points="2,1 9,5 2,9" fill={theme.ash} />
          </svg>
        )}
      </div>

      {/* controls */}
      <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
        <button onClick={() => setPaused(!paused)} style={iconBtn()}>
          {paused ? "▶ resume" : "❚❚ pause"}
        </button>
        <button onClick={() => setRemaining(total)} style={iconBtn()}>↺ reset</button>
        <button onClick={() => onDone(blend, intent, targetMoods)} style={{
          flex: 1, fontFamily: ff.serif, fontSize: 15,
          padding: "12px 14px", borderRadius: 10,
          background: theme.ink, color: theme.cream, border: "none", cursor: "pointer",
        }}>
          {remaining === 0 ? "log this cup →" : "done early →"}
        </button>
      </div>

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
      `}</style>

      {/* Ingredient mini-tile — overlays the timer as a bottom sheet */}
      {activeIngredient && (
        <IngredientSheet
          id={activeIngredient}
          onClose={() => setActiveIngredient(null)}
          inPantry={pantryIds?.has(activeIngredient)}
          onTogglePantry={() => togglePantry && togglePantry(activeIngredient)}
        />
      )}

      <PlannerModal
        open={plannerOpen}
        onClose={() => setPlannerOpen(false)}
        plannerProps={{
          items: plannerItems,
          onAdd: addPlannerItem,
          onToggle: togglePlannerItem,
          onEdit: editPlannerItem,
          onDelete: deletePlannerItem,
          onClearDone: clearDonePlannerItems,
        }}
        pastBrewNotes={{
          blendName: blend.name,
          sessions: pastNoteSessions,
        }}
      />
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
  return (
    <div style={{ marginBottom: 8, textAlign: "left" }}>
      <div style={{
        fontFamily: ff.sans, fontSize: 10.5, letterSpacing: "0.16em",
        textTransform: "uppercase", color: theme.inkSoft, marginBottom: 6,
        textAlign: "left",
      }}>{label}</div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 5, justifyContent: "flex-start" }}>
        {(chips || DESIRED_MOOD_CHIPS).map(c => {
          const isOn = selected.has(c.key);
          return (
            <button
              key={c.key}
              onClick={() => toggle(c.key)}
              style={{
                fontFamily: ff.serif, fontSize: 12.5,
                padding: "5px 11px", borderRadius: 999,
                background: isOn ? theme.terra : "transparent",
                color: isOn ? theme.cream : theme.inkSoft,
                border: `1px solid ${isOn ? theme.terra : theme.rule}`,
                cursor: "pointer", transition: "all 0.15s ease",
              }}
            >{c.label}</button>
          );
        })}
      </div>
    </div>
  );
};
