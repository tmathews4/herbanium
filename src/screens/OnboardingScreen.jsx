/* ──────────────────────────────────────────────────────────────
   screens/OnboardingScreen.jsx — first-visit profile creation

   Full-screen takeover. Four light steps:
     1. Name ("What should we call you?")
     2. Time of day ("When do you usually reach for tea?")
     3. What draws you (mood) — condensed 6-mood list
     4. Flavors you reach for — condensed 8-flavor list

   On finish: calls onComplete with profile data. App sets up the
   user's initial state (profile, seeded favorites + algorithmic
   experimentals tailored to draws + flavors, default pantry) and
   navigates to Home.
   ────────────────────────────────────────────────────────────── */

import React, { useState } from "react";
import { theme, ff } from "../theme";
import { Flower } from "../components/icons";

const STEPS = 4;

export const OnboardingScreen = ({ onComplete }) => {
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [timeOfDay, setTimeOfDay] = useState([]);
  const [draw, setDraw] = useState([]);
  const [flavors, setFlavors] = useState([]);

  const canAdvance =
    step === 0 ? true  // name is soft-required; blank → "friend"
    : step === 1 ? timeOfDay.length > 0
    : step === 2 ? draw.length > 0
    : step === 3 ? true  // flavors are optional — skip-friendly final step
    : false;

  const finish = () => {
    onComplete({
      name: name.trim() || "friend",
      timeOfDay,
      draw,
      flavors,
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
      overflow: "auto",
    }}>
      {/* Top: brand + progress */}
      <div style={{
        padding: "28px 24px 12px",
        display: "flex", flexDirection: "column", alignItems: "center", gap: 8,
        flexShrink: 0,
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
        justifyContent: "center", padding: "20px 28px 20px",
        maxWidth: 520, width: "100%", alignSelf: "center",
      }}>
        {step === 0 && <StepName name={name} setName={setName} />}
        {step === 1 && <StepTimeOfDay value={timeOfDay} setValue={setTimeOfDay} />}
        {step === 2 && <StepDraw value={draw} setValue={setDraw} />}
        {step === 3 && <StepFlavors value={flavors} setValue={setFlavors} />}
      </div>

      {/* Selection count hint (multi-select steps only) */}
      {(step === 1 || step === 2 || step === 3) && (
        <div style={{
          padding: "0 24px 4px", textAlign: "center",
          fontFamily: ff.serif, fontStyle: "italic", fontSize: 11.5,
          color: theme.ash, lineHeight: 1.4,
          minHeight: 18, flexShrink: 0,
          maxWidth: 520, width: "100%", alignSelf: "center",
        }}>
          {step === 1 && (timeOfDay.length === 0 ? "pick one or more" : `${timeOfDay.length} selected`)}
          {step === 2 && (draw.length === 0 ? "pick one or more" : `${draw.length} selected`)}
          {step === 3 && (flavors.length === 0 ? "pick any that appeal — or skip" : `${flavors.length} selected`)}
        </div>
      )}

      {/* Bottom: nav — share the same maxWidth column as the step
          content so back/next align with the inputs above on wide
          (desktop) viewports. */}
      <div style={{
        padding: "0 24px 32px",
        display: "flex", justifyContent: "space-between", alignItems: "center",
        flexShrink: 0,
        maxWidth: 520, width: "100%", alignSelf: "center", boxSizing: "border-box",
      }}>
        <button
          onClick={back}
          disabled={step === 0}
          style={{
            fontFamily: ff.sans, fontSize: 12, letterSpacing: "0.12em",
            textTransform: "uppercase",
            color: step === 0 ? "transparent" : theme.ash,
            background: "transparent", border: "none",
            cursor: step === 0 ? "default" : "pointer",
            padding: "10px 4px",
            transition: "color 0.2s ease",
            visibility: step === 0 ? "hidden" : "visible",
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
            transition: "background 0.2s ease, box-shadow 0.18s ease, transform 0.12s ease",
            boxShadow: canAdvance ? "0 2px 6px rgba(30,24,18,0.15)" : "none",
            opacity: canAdvance ? 1 : 0.65,
            letterSpacing: "0.01em",
          }}
        >
          {step === STEPS - 1 ? "begin →" : "next →"}
        </button>
      </div>

      {/* Footer note */}
      <div style={{
        padding: "0 24px 12px", textAlign: "center",
        fontFamily: ff.serif, fontStyle: "italic", fontSize: 11,
        color: theme.ash, lineHeight: 1.5, flexShrink: 0,
        maxWidth: 520, width: "100%", alignSelf: "center", boxSizing: "border-box",
      }}>
        Your journal lives on this device — no account, no cloud.
      </div>

      {/* Legal notice — shown on every step in a red-bordered card,
          shrink-wrapped to the text rather than spanning the screen. */}
      <div style={{ textAlign: "center", padding: "0 24px 20px", flexShrink: 0 }}>
        <div style={{
          display: "inline-block", maxWidth: 360,
          padding: "10px 14px", borderRadius: 8,
          border: `2px solid ${theme.terra}`,
          background: "rgba(176, 84, 47, 0.05)",
          fontFamily: ff.serif, fontSize: 11.5, fontWeight: 600,
          color: theme.terra, lineHeight: 1.5, textAlign: "center",
        }}>
          Herbanium is a brewing companion, <em>not</em> medical advice. Verify with a clinician for anything that matters.
        </div>
      </div>
    </div>
  );
};

/* ──────────────────────────────────────────────────────────────
   Step 1: Name
   ────────────────────────────────────────────────────────────── */

const StepName = ({ name, setName }) => (
  <div style={{ textAlign: "center" }}>
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
      size={1}
      style={{
        display: "block",
        width: "100%",
        maxWidth: 280,
        margin: "0 auto",
        boxSizing: "border-box",
        fontFamily: ff.serif, fontSize: 22, color: theme.ink,
        background: "transparent",
        border: "none",
        borderBottom: `1px solid ${theme.rule}`,
        padding: "8px 4px",
        outline: "none",
        textAlign: "center",
      }}
    />
    <div style={{
      marginTop: 10,
      fontFamily: ff.sans, fontSize: 11, color: theme.ash,
    }}>
      or leave blank and we'll call you "friend"
    </div>
  </div>
);

/* ──────────────────────────────────────────────────────────────
   Step 2: Time of day (kept as full-width option rows — only 3)
   ────────────────────────────────────────────────────────────── */

const TIME_OPTIONS = [
  { key: "morning",   label: "Morning",   note: "waking, the first cup of the day" },
  { key: "afternoon", label: "Afternoon", note: "midday pause, the long desk" },
  { key: "evening",   label: "Evening",   note: "winding down, toward sleep" },
];

const StepTimeOfDay = ({ value, setValue }) => {
  const toggle = (key) => {
    setValue(value.includes(key) ? value.filter(k => k !== key) : [...value, key]);
  };
  return (
    <>
      <StepHeader title="When do you reach for tea?" sub="Pick any that feel right — you can change this later." />
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {TIME_OPTIONS.map(opt => (
          <OnboardOption key={opt.key} opt={opt} selected={value.includes(opt.key)} onSelect={() => toggle(opt.key)} />
        ))}
      </div>
    </>
  );
};

/* ──────────────────────────────────────────────────────────────
   Step 3: What draws you — condensed 6-mood list for first-run.
   The full vocabulary lives in data/blends.js MOODS; this is just
   the easy-on-ramp subset.
   ────────────────────────────────────────────────────────────── */

const DRAW_OPTIONS = [
  { key: "calm",      label: "Calm",      note: "a settling, a softening" },
  { key: "focus",     label: "Focus",     note: "attention, the clear mind" },
  { key: "energy",    label: "Energy",    note: "lift, the spark to begin" },
  { key: "sleepy",    label: "Sleep",     note: "the drift toward rest" },
  { key: "comfort",   label: "Comfort",   note: "warmth, the familiar cup" },
  { key: "digestive", label: "Digestive", note: "fennel, after-supper ease" },
];

const StepDraw = ({ value, setValue }) => {
  const toggle = (key) => {
    setValue(value.includes(key) ? value.filter(k => k !== key) : [...value, key]);
  };
  return (
    <>
      <StepHeader title="What pulls you to a cup?" sub="Pick any that resonate — no wrong answers." />
      <ChipGrid options={DRAW_OPTIONS} value={value} onToggle={toggle} />
    </>
  );
};

/* ──────────────────────────────────────────────────────────────
   Step 4: Flavors — condensed 8-flavor list for first-run.
   The full vocabulary lives in data/blends.js FLAVORS; this is
   just the broadest, most legible families for new users.
   ────────────────────────────────────────────────────────────── */

const FLAVOR_OPTIONS = [
  { key: "floral",   label: "Floral" },
  { key: "citrus",   label: "Citrus" },
  { key: "fruity",   label: "Fruity" },
  { key: "sweet",    label: "Sweet" },
  { key: "spiced",   label: "Spiced" },
  { key: "minty",    label: "Minty" },
  { key: "earthy",   label: "Earthy" },
  { key: "smoky",    label: "Smoky" },
];

const StepFlavors = ({ value, setValue }) => {
  const toggle = (key) => {
    setValue(value.includes(key) ? value.filter(k => k !== key) : [...value, key]);
  };
  return (
    <>
      <StepHeader title="Flavors you reach for?" sub="Optional — pick any you tend to like, or skip ahead." />
      <ChipGrid options={FLAVOR_OPTIONS} value={value} onToggle={toggle} />
    </>
  );
};

/* ──────────────────────────────────────────────────────────────
   Shared step header (title + sub)
   ────────────────────────────────────────────────────────────── */

const StepHeader = ({ title, sub }) => (
  <>
    <div style={{
      fontFamily: ff.serif, fontSize: 28, color: theme.ink,
      lineHeight: 1.15, marginBottom: 10, textAlign: "center",
    }}>{title}</div>
    <div style={{
      fontFamily: ff.serif, fontStyle: "italic", fontSize: 13.5,
      color: theme.ash, marginBottom: 22, lineHeight: 1.5, textAlign: "center",
    }}>{sub}</div>
  </>
);

/* ──────────────────────────────────────────────────────────────
   Chip grid — used for the longer multi-select steps (mood, flavor)
   ────────────────────────────────────────────────────────────── */

const ChipGrid = ({ options, value, onToggle }) => (
  <div style={{
    display: "flex", flexWrap: "wrap", gap: 8,
    justifyContent: "center",
  }}>
    {options.map(opt => {
      const selected = value.includes(opt.key);
      return (
        <button
          key={opt.key}
          onClick={() => onToggle(opt.key)}
          title={opt.note || ""}
          style={{
            fontFamily: ff.serif, fontSize: 14,
            padding: "8px 14px", borderRadius: 999,
            background: selected ? theme.terra : "transparent",
            color: selected ? theme.cream : theme.inkSoft,
            border: `1px solid ${selected ? theme.terra : theme.rule}`,
            cursor: "pointer", transition: "all 0.15s ease",
          }}
        >{opt.label}</button>
      );
    })}
  </div>
);

/* ──────────────────────────────────────────────────────────────
   Full-width option row (used by time-of-day step, 3 items)
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
    {selected && <div style={{ color: theme.terra, fontSize: 18 }}>✓</div>}
  </button>
);
