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
import { theme, ff, shadow, radius } from "../theme";
import { Button } from "../components/layout";
import { Flower } from "../components/icons";

const STEPS = 5;

export const OnboardingScreen = ({ onComplete }) => {
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [timeOfDay, setTimeOfDay] = useState([]);
  const [draw, setDraw] = useState([]);
  const [flavors, setFlavors] = useState([]);

  const canAdvance =
    step === 0 ? true  // welcome — always advance
    // Name now hard-required (≥1 non-whitespace char) so the next
    // button visibly lights up as the user types — the prior
    // "soft-required, blank → 'friend'" logic kept the button
    // permanently enabled at this step, which read as broken in
    // dark mode where the enabled state didn't shift on input.
    : step === 1 ? name.trim().length > 0
    : step === 2 ? timeOfDay.length > 0
    : step === 3 ? draw.length > 0
    : step === 4 ? true  // flavors are optional — skip-friendly final step
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
        {step === 0 && <StepWelcome />}
        {step === 1 && <StepName name={name} setName={setName} />}
        {step === 2 && <StepTimeOfDay value={timeOfDay} setValue={setTimeOfDay} />}
        {step === 3 && <StepDraw value={draw} setValue={setDraw} />}
        {step === 4 && <StepFlavors value={flavors} setValue={setFlavors} />}
      </div>

      {/* Selection count hint (multi-select steps only) */}
      {(step === 2 || step === 3 || step === 4) && (
        <div style={{
          padding: "0 24px 4px", textAlign: "center",
          fontFamily: ff.serif, fontStyle: "italic", fontSize: 11.5,
          color: theme.ash, lineHeight: 1.4,
          minHeight: 18, flexShrink: 0,
          maxWidth: 520, width: "100%", alignSelf: "center",
        }}>
          {step === 2 && (timeOfDay.length === 0 ? "pick one or more" : `${timeOfDay.length} selected`)}
          {step === 3 && (draw.length === 0 ? "pick one or more" : `${draw.length} selected`)}
          {step === 4 && (flavors.length === 0 ? "pick any that appeal — or skip" : `${flavors.length} selected`)}
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
        <Button
          variant="ghost"
          onClick={back}
          disabled={step === 0}
          style={{ visibility: step === 0 ? "hidden" : "visible" }}
        >← back</Button>
        <Button
          variant="primary" tone="ink"
          onClick={advance}
          disabled={!canAdvance}
        >
          {step === STEPS - 1 ? "begin →" : "next →"}
        </Button>
      </div>

      {/* Footer note — combines storage + medical disclaimer into
          one quiet line. The full red-bordered legal card on every
          step read as alarm fatigue; one italic line is enough to
          set the right expectation without dominating the screen. */}
      <div style={{
        padding: "0 24px 28px", textAlign: "center",
        fontFamily: ff.serif, fontStyle: "italic", fontSize: 11,
        color: theme.ash, lineHeight: 1.5, flexShrink: 0,
        maxWidth: 520, width: "100%", alignSelf: "center", boxSizing: "border-box",
      }}>
        Your journal lives on this device — no account, no cloud.
        <br />
        A brewing companion, not medical advice — check with a clinician for anything that matters.
      </div>
    </div>
  );
};

/* ──────────────────────────────────────────────────────────────
   Step 0: Welcome — names the app and surfaces the three things
   it does. New users were landing on the name input with no idea
   what Herbanium was for; this card gives them 5 seconds of
   context before asking anything.
   ────────────────────────────────────────────────────────────── */

const StepWelcome = () => (
  <div style={{ textAlign: "center" }}>
    <div style={{
      fontFamily: ff.serif, fontSize: 32, color: theme.ink,
      lineHeight: 1.15, marginBottom: 12,
    }}>
      Welcome to Herbanium.
    </div>
    <div style={{
      fontFamily: ff.serif, fontStyle: "italic", fontSize: 15,
      color: theme.ash, marginBottom: 28, lineHeight: 1.55,
      maxWidth: 360, margin: "0 auto 28px",
    }}>
      A quiet companion for tea — blend, brew, and notice what lands.
    </div>
    <div style={{
      display: "flex", flexDirection: "column", gap: 14,
      maxWidth: 360, margin: "0 auto", textAlign: "left",
    }}>
      <WelcomeBullet
        title="Blend"
        body="Compose your own recipes from a pantry of herbs, teas, and spices."
      />
      <WelcomeBullet
        title="Brew"
        body="See how temperature and time shift each cup before you steep."
      />
      <WelcomeBullet
        title="Notice"
        body="Log what you drank and how it landed — the journal learns your palate."
      />
    </div>
  </div>
);

const WelcomeBullet = ({ title, body }) => (
  <div style={{ display: "flex", gap: 12, alignItems: "baseline" }}>
    <div style={{
      flex: "0 0 auto",
      width: 6, height: 6, borderRadius: "50%",
      background: theme.terra,
      transform: "translateY(-2px)",
    }} />
    <div style={{ flex: 1 }}>
      <div style={{
        fontFamily: ff.sans, fontSize: 11, letterSpacing: "0.18em",
        textTransform: "uppercase", color: theme.terra,
        marginBottom: 2,
      }}>
        {title}
      </div>
      <div style={{
        fontFamily: ff.serif, fontSize: 13.5,
        color: theme.inkSoft, lineHeight: 1.5,
      }}>
        {body}
      </div>
    </div>
  </div>
);

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

   Each option carries a `family` field that ties the user-facing
   pick to the master mood-family hierarchy used by the TrackMap
   strip and the engine's matching logic. Keeping the keys stable
   (calm, focus, energy, sleepy, comfort, digestive) protects
   seed/profile code that already reads them; the family field is
   the additive correlation link.

   Mapping:
     calm      → calm   (calm + soothing + grounding)
     focus     → focus  (focus)
     energy    → energy (energy + uplifting)
     sleepy    → sleep  (sleepy)
     comfort   → warm   (warming + comfort)
     digestive → body   (digestive)
   ────────────────────────────────────────────────────────────── */

const DRAW_OPTIONS = [
  { key: "calm",      family: "calm",   label: "Calm",      note: "a settling, a softening" },
  { key: "focus",     family: "focus",  label: "Focus",     note: "attention, the clear mind" },
  { key: "energy",    family: "energy", label: "Energy",    note: "lift, the spark to begin" },
  { key: "sleepy",    family: "sleep",  label: "Sleep",     note: "the drift toward rest" },
  { key: "comfort",   family: "warm",   label: "Comfort",   note: "warmth, the familiar cup" },
  { key: "digestive", family: "body",   label: "Digestive", note: "fennel, after-supper ease" },
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

   Each option carries a `family` field tying the user-facing pick
   to the master flavor-family hierarchy (FAMILY_BY_FLAVOR in
   FlavorMap.jsx). Citrus and minty both correlate to the 'fresh'
   family — kept as separate picks because users distinguish them
   on the palate even though the master family rolls them together.
   Sweet sits in the floral family for now per FAMILY_BY_FLAVOR;
   if we promote 'sweet' to its own family later, this is the
   single line to update.

   Mapping:
     floral → floral
     citrus → fresh    (citrus rolls into the fresh register)
     fruity → fruit
     sweet  → floral   (current FAMILY_BY_FLAVOR lumping)
     spiced → spiced
     minty  → fresh    (minty rolls into the fresh register)
     earthy → earthy
     smoky  → smoky
   ────────────────────────────────────────────────────────────── */

const FLAVOR_OPTIONS = [
  { key: "floral", family: "floral", label: "Floral" },
  { key: "citrus", family: "fresh",  label: "Citrus" },
  { key: "fruity", family: "fruit",  label: "Fruity" },
  { key: "sweet",  family: "floral", label: "Sweet"  },
  { key: "spiced", family: "spiced", label: "Spiced" },
  { key: "minty",  family: "fresh",  label: "Minty"  },
  { key: "earthy", family: "earthy", label: "Earthy" },
  { key: "smoky",  family: "smoky",  label: "Smoky"  },
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
