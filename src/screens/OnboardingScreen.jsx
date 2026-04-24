/* ──────────────────────────────────────────────────────────────
   screens/OnboardingScreen.jsx — first-visit profile creation

   Full-screen takeover. Three light steps:
     1. Name ("What should we call you?")
     2. Time of day ("When do you usually reach for tea?")
     3. What draws you ("What usually pulls you toward a cup?")

   On finish: calls onComplete with profile data. App sets up the
   user's initial state (profile, seeded favorites, default pantry)
   and navigates to Home, where the welcome fade card appears.

   Design notes:
   - No skip button per step — forward-only through the flow. Users
     can change any answer later in Profile → Preferences.
   - Name is soft-required: blank → "friend"
   - Progress indicator (small dots) at top so users know where
     they are in the flow
   - Aesthetic matches the rest of the app: Fraunces serif for
     display text, sans-serif for UI, terra accents
   ────────────────────────────────────────────────────────────── */

import React, { useState } from "react";
import { theme, ff } from "../theme";
import { Flower, Ornament, Sprig } from "../components/icons";

const STEPS = 3;

export const OnboardingScreen = ({ onComplete }) => {
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [timeOfDay, setTimeOfDay] = useState(null);
  const [draw, setDraw] = useState(null);

  const canAdvance =
    step === 0 ? true  // name is soft-required; blank → "friend"
    : step === 1 ? Boolean(timeOfDay)
    : step === 2 ? Boolean(draw)
    : false;

  const finish = () => {
    onComplete({
      name: name.trim() || "friend",
      timeOfDay,
      draw,
    });
  };

  const advance = () => {
    if (step < STEPS - 1) setStep(step + 1);
    else finish();
  };

  const back = () => {
    if (step > 0) setStep(step - 1);
  };

  return (
    <div style={{
      position: "absolute", inset: 0, zIndex: 100,
      background: theme.ivory,
      display: "flex", flexDirection: "column",
      fontFamily: ff.sans,
    }}>
      {/* Top: brand + progress */}
      <div style={{
        padding: "28px 24px 12px",
        display: "flex", flexDirection: "column", alignItems: "center", gap: 8,
      }}>
        <Flower size={26} c={theme.terra} />
        <div style={{
          fontFamily: ff.sans, fontSize: 10, letterSpacing: "0.28em",
          textTransform: "uppercase", color: theme.inkSoft,
        }}>
          Herbanium
        </div>
        <div style={{
          display: "flex", gap: 6, marginTop: 10,
        }}>
          {Array.from({ length: STEPS }, (_, i) => (
            <div key={i} style={{
              width: 20, height: 2, borderRadius: 1,
              background: i <= step ? theme.terra : theme.rule,
              transition: "background 0.3s ease",
            }} />
          ))}
        </div>
      </div>

      {/* Middle: step content */}
      <div style={{
        flex: 1, display: "flex", flexDirection: "column",
        justifyContent: "center", padding: "0 28px 40px",
        maxWidth: 480, width: "100%", alignSelf: "center",
      }}>
        {step === 0 && (
          <StepName name={name} setName={setName} />
        )}
        {step === 1 && (
          <StepTimeOfDay value={timeOfDay} setValue={setTimeOfDay} />
        )}
        {step === 2 && (
          <StepDraw value={draw} setValue={setDraw} />
        )}
      </div>

      {/* Bottom: nav */}
      <div style={{
        padding: "0 24px 32px",
        display: "flex", justifyContent: "space-between", alignItems: "center",
      }}>
        <button
          onClick={back}
          disabled={step === 0}
          style={{
            fontFamily: ff.sans, fontSize: 12, letterSpacing: "0.08em",
            color: step === 0 ? "transparent" : theme.ash,
            background: "transparent", border: "none",
            cursor: step === 0 ? "default" : "pointer",
            padding: "10px 4px",
          }}
        >
          ← back
        </button>
        <button
          onClick={advance}
          disabled={!canAdvance}
          style={{
            fontFamily: ff.serif, fontSize: 15,
            padding: "12px 28px", borderRadius: 999,
            background: canAdvance ? theme.ink : theme.rule,
            color: theme.cream, border: "none",
            cursor: canAdvance ? "pointer" : "default",
            transition: "background 0.2s ease",
          }}
        >
          {step === STEPS - 1 ? "begin →" : "next →"}
        </button>
      </div>

      {/* Footer note: persistence honesty */}
      <div style={{
        padding: "0 24px 20px", textAlign: "center",
        fontFamily: ff.serif, fontStyle: "italic", fontSize: 11,
        color: theme.ash, lineHeight: 1.5,
      }}>
        Your journal lives on this device — no account, no cloud.
      </div>
    </div>
  );
};

/* ──────────────────────────────────────────────────────────────
   Step 1: Name
   ────────────────────────────────────────────────────────────── */

const StepName = ({ name, setName }) => (
  <>
    <div style={{
      fontFamily: ff.serif, fontSize: 32, color: theme.ink,
      lineHeight: 1.15, marginBottom: 10,
    }}>
      What should we call you?
    </div>
    <div style={{
      fontFamily: ff.serif, fontStyle: "italic", fontSize: 14,
      color: theme.ash, marginBottom: 24, lineHeight: 1.5,
    }}>
      A name, a handle, anything. We'll use it in greetings.
    </div>
    <input
      type="text"
      value={name}
      onChange={e => setName(e.target.value)}
      placeholder="your name"
      maxLength={30}
      autoFocus
      style={{
        width: "100%",
        fontFamily: ff.serif, fontSize: 22, color: theme.ink,
        background: "transparent",
        border: "none",
        borderBottom: `1px solid ${theme.rule}`,
        padding: "8px 0",
        outline: "none",
      }}
    />
    <div style={{
      marginTop: 10,
      fontFamily: ff.sans, fontSize: 11, color: theme.ash,
    }}>
      or leave blank and we'll call you "friend"
    </div>
  </>
);

/* ──────────────────────────────────────────────────────────────
   Step 2: Time of day
   ────────────────────────────────────────────────────────────── */

const TIME_OPTIONS = [
  { key: "morning",    label: "Morning",    note: "waking, the first cup of the day" },
  { key: "afternoon",  label: "Afternoon",  note: "midday pause, the long desk" },
  { key: "evening",    label: "Evening",    note: "winding down, toward sleep" },
  { key: "throughout", label: "Throughout", note: "a cup for every hour" },
];

const StepTimeOfDay = ({ value, setValue }) => (
  <>
    <div style={{
      fontFamily: ff.serif, fontSize: 30, color: theme.ink,
      lineHeight: 1.15, marginBottom: 10,
    }}>
      When do you reach for tea?
    </div>
    <div style={{
      fontFamily: ff.serif, fontStyle: "italic", fontSize: 14,
      color: theme.ash, marginBottom: 24, lineHeight: 1.5,
    }}>
      Pick what's closest — you can change this later.
    </div>
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {TIME_OPTIONS.map(opt => (
        <OnboardOption key={opt.key} opt={opt} selected={value === opt.key} onSelect={() => setValue(opt.key)} />
      ))}
    </div>
  </>
);

/* ──────────────────────────────────────────────────────────────
   Step 3: What draws you
   ────────────────────────────────────────────────────────────── */

const DRAW_OPTIONS = [
  { key: "calm",    label: "Calm",    note: "a settling, a softening" },
  { key: "focus",   label: "Focus",   note: "attention, the clear mind" },
  { key: "comfort", label: "Comfort", note: "warmth, the familiar cup" },
  { key: "energy",  label: "Energy",  note: "lift, the spark to begin" },
];

const StepDraw = ({ value, setValue }) => (
  <>
    <div style={{
      fontFamily: ff.serif, fontSize: 30, color: theme.ink,
      lineHeight: 1.15, marginBottom: 10,
    }}>
      What pulls you to a cup?
    </div>
    <div style={{
      fontFamily: ff.serif, fontStyle: "italic", fontSize: 14,
      color: theme.ash, marginBottom: 24, lineHeight: 1.5,
    }}>
      Your usual reason — not the only one.
    </div>
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {DRAW_OPTIONS.map(opt => (
        <OnboardOption key={opt.key} opt={opt} selected={value === opt.key} onSelect={() => setValue(opt.key)} />
      ))}
    </div>
  </>
);

/* ──────────────────────────────────────────────────────────────
   Shared option row
   ────────────────────────────────────────────────────────────── */

const OnboardOption = ({ opt, selected, onSelect }) => (
  <button
    onClick={onSelect}
    style={{
      width: "100%", textAlign: "left",
      padding: "14px 18px", borderRadius: 10,
      background: selected ? theme.cream : "transparent",
      border: `1px solid ${selected ? theme.terra : theme.rule}`,
      cursor: "pointer",
      transition: "all 0.15s ease",
      display: "flex", alignItems: "baseline", gap: 12,
    }}
  >
    <div style={{ flex: 1 }}>
      <div style={{
        fontFamily: ff.serif, fontSize: 17,
        color: selected ? theme.terra : theme.ink,
        lineHeight: 1.2,
      }}>
        {opt.label}
      </div>
      <div style={{
        fontFamily: ff.serif, fontStyle: "italic", fontSize: 12,
        color: theme.ash, marginTop: 2, lineHeight: 1.4,
      }}>
        {opt.note}
      </div>
    </div>
    {selected && (
      <div style={{ color: theme.terra, fontSize: 18 }}>✓</div>
    )}
  </button>
);
