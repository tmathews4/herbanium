/* ──────────────────────────────────────────────────────────────
   screens/SteepScreen.jsx — the timer/wait-cards Steep screen.
   ────────────────────────────────────────────────────────────── */

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Leaf } from "../components/icons";
import { INGREDIENTS } from "../data/ingredients";
import { buildWaitCards } from "../data/waitContent";
import { iconBtn, mmss } from "../helpers/misc";;
import {
  ff, theme,
} from "../theme";
import { IngredientSheet } from "./IngredientSheet";

/* ──────────────────────────────────────────────────────────────
   Screen: STEEP (takeover)
   ────────────────────────────────────────────────────────────── */

// Same condensed mood vocabulary as onboarding — keeps the brewing UI
// approachable without forcing users back into the full 11-mood list.
const STEEP_MOOD_CHIPS = [
  { key: "calm",      label: "Calm" },
  { key: "focus",     label: "Focus" },
  { key: "energy",    label: "Energy" },
  { key: "sleepy",    label: "Sleepy" },
  { key: "comfort",   label: "Comfort" },
  { key: "digestive", label: "Digestive" },
];

export const SteepScreen = ({ blend, intent, setIntent, targetMoods, setTargetMoods, currentMoods, setCurrentMoods, sessions, onDone, onCancel, pantryIds, togglePantry }) => {
  const total = blend.timeS || 360;
  const [remaining, setRemaining] = useState(total);
  const [paused, setPaused] = useState(false);
  const [activeIngredient, setActiveIngredient] = useState(null);
  const [notesOpen, setNotesOpen] = useState(false);

  // Past brews of this blend — only meaningful if the blend has an id (saved
  // or previously-logged). Freshly-composed blends won't have prior sessions.
  const pastSessions = React.useMemo(() => {
    if (!sessions || !blend.id) return [];
    return sessions.filter(s => s.who === "you" && s.blendId === blend.id);
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

  // Auto-dismiss the ingredient tile when the brew completes — the user's
  // attention should snap back to the timer at the finish moment.
  useEffect(() => {
    if (remaining === 0 && activeIngredient) {
      setActiveIngredient(null);
    }
  }, [remaining, activeIngredient]);

  // Manual advance to the next card — shared by the click handler and
  // the auto-cycle interval. Bumps `lastAdvance` which resets the interval.
  const CARD_CYCLE_S = 30;
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
        <button
          onClick={() => pastSessions.length > 0 && setNotesOpen(true)}
          disabled={pastSessions.length === 0}
          style={{
            background: "transparent", border: "none",
            color: pastSessions.length === 0 ? theme.ruleSoft : theme.ash,
            fontFamily: ff.sans, fontSize: 12, letterSpacing: "0.12em", textTransform: "uppercase",
            cursor: pastSessions.length === 0 ? "not-allowed" : "pointer",
          }}
        >
          notes{pastSessions.length > 0 && ` (${pastSessions.length})`}
        </button>
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
        />
        <MoodChipRow
          label="I'd like to feel…"
          value={targetMoods || []}
          setValue={setTargetMoods}
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

      {/* Notes panel — past brews of this blend, viewable without leaving the steep */}
      {notesOpen && (
        <div
          onClick={() => setNotesOpen(false)}
          style={{
            position: "absolute", inset: 0, zIndex: 40,
            background: "rgba(42, 36, 28, 0.35)",
            display: "flex", alignItems: "flex-end", justifyContent: "center",
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "100%", maxHeight: "75%",
              background: theme.ivory,
              borderRadius: "16px 16px 0 0",
              padding: "16px 20px 22px",
              display: "flex", flexDirection: "column",
              boxShadow: "0 -4px 16px rgba(0,0,0,0.12)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <div>
                <div style={{ fontFamily: ff.sans, fontSize: 10, letterSpacing: "0.18em", textTransform: "uppercase", color: theme.ash }}>
                  Past brews
                </div>
                <div style={{ fontFamily: ff.serif, fontSize: 18, color: theme.ink, marginTop: 2 }}>
                  {blend.name}
                </div>
              </div>
              <button
                onClick={() => setNotesOpen(false)}
                style={{
                  background: "transparent", border: "none",
                  fontFamily: ff.sans, fontSize: 12, letterSpacing: "0.12em",
                  textTransform: "uppercase", color: theme.ash, cursor: "pointer",
                }}
              >close</button>
            </div>
            <div style={{ overflowY: "auto", flex: 1 }}>
              {pastSessions.length === 0 ? (
                <div style={{ fontFamily: ff.serif, fontStyle: "italic", fontSize: 13, color: theme.ash, padding: "20px 0", textAlign: "center" }}>
                  No past brews logged yet.
                </div>
              ) : (
                pastSessions.map((s, i) => (
                  <div key={s.id} style={{
                    padding: "12px 0",
                    borderTop: i === 0 ? "none" : `1px solid ${theme.ruleSoft}`,
                  }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 4 }}>
                      <div style={{ fontFamily: ff.serif, fontSize: 13, color: theme.inkSoft }}>
                        {s.intent ? <em>{s.intent}</em> : <span style={{ color: theme.ash }}>—</span>}
                        {" → "}
                        <em style={{ color: theme.terra }}>{s.actual}</em>
                      </div>
                      <div style={{ fontFamily: ff.serif, fontStyle: "italic", fontSize: 11, color: theme.ash }}>
                        {s.ago}
                      </div>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                      <div style={{ display: "flex", gap: 2 }}>
                        {[1,2,3,4,5].map(n => (
                          <span key={n} style={{
                            width: 5, height: 5, borderRadius: "50%",
                            background: n <= (s.taste || 0) ? theme.terra : theme.ruleSoft,
                          }} />
                        ))}
                      </div>
                      {s.note && (
                        <div style={{
                          fontFamily: ff.serif, fontStyle: "italic", fontSize: 12, color: theme.inkSoft,
                          textAlign: "right", marginLeft: 12, flex: 1,
                        }}>
                          {s.note}
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const MoodChipRow = ({ label, value, setValue }) => {
  const selected = new Set(value || []);
  const toggle = (key) => {
    if (!setValue) return;
    const next = selected.has(key) ? value.filter(k => k !== key) : [...(value || []), key];
    setValue(next);
  };
  return (
    <div style={{ marginBottom: 8 }}>
      <div style={{
        fontFamily: ff.sans, fontSize: 10, letterSpacing: "0.16em",
        textTransform: "uppercase", color: theme.ash, marginBottom: 6,
      }}>{label}</div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
        {STEEP_MOOD_CHIPS.map(c => {
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
