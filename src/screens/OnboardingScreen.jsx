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
      {/* Top: brand + progress. The header mark is the herbanium
          logo's H glyph at 30px — gives every onboarding step a
          continuous brand anchor at the top instead of relying on a
          single welcome-step splash. The wordmark + progress dots
          sit below; the whole header reads as one stacked brand
          composition. */}
      <div style={{
        padding: "28px 24px 12px",
        display: "flex", flexDirection: "column", alignItems: "center", gap: 8,
        flexShrink: 0,
      }}>
        <img
          src="/herbanium-logo-icon.svg"
          alt="Herbanium"
          width={44}
          height={44}
          style={{ display: "block", opacity: 0.94 }}
        />
        <div style={{
          fontFamily: ff.sans, fontSize: 11.5, letterSpacing: "0.30em",
          textTransform: "uppercase", color: theme.inkSoft,
          marginTop: 2,
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
        {/* Keyed by step so the buttons remount on each navigation.
            Without this, lingering inline styles set by the Button's
            hover/press handlers (transform, boxShadow not always
            replayed by React's style diff) carried across steps —
            specifically, going back from a step where the user had
            just clicked next would leave the previous step's button
            in a half-state that read as "default" rather than
            re-rendering its active enabled fill. Forcing fresh DOM
            nodes per step removes the inheritance. */}
        <Button
          key={`back-${step}`}
          variant="ghost"
          onClick={back}
          disabled={step === 0}
          style={{ visibility: step === 0 ? "hidden" : "visible" }}
        >← back</Button>
        <Button
          key={`next-${step}`}
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
      we'll greet you by this in the kettle
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
   Step 3: What draws you — parent-mood canon (7 families).

   Pulls from data/canon.PARENT_MOODS so first-run onboarding picks
   at the same register every other capture surface uses (Steep,
   Journal, Recipes filter). Cooling joined the list so the canon
   stays consistent across all 7 families instead of dropping cool
   only here.
   ────────────────────────────────────────────────────────────── */

import { PARENT_MOODS, PARENT_FLAVORS } from "../data/canon";

// First-run copy — slightly more evocative than the canon's terse
// engine-side notes. Keeps key/family/label aligned to canon so the
// onboarding pick lands in the same shape the rest of the app reads.
const DRAW_NOTES = {
  calm:      "a settling, a softening",
  focus:     "attention, the clear mind",
  energy:    "lift, the spark to begin",
  comfort:   "warmth, the familiar cup",
  cooling:   "a felt-temperature breath",
  digestive: "fennel, after-supper ease",
  sleepy:    "the drift toward rest",
};
const DRAW_OPTIONS = PARENT_MOODS.map(m => ({
  ...m,
  note: DRAW_NOTES[m.key] || m.note,
}));

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
   Step 4: Flavors — parent-flavor canon (10 families).

   Pulls from data/canon.PARENT_FLAVORS so first-run onboarding
   picks at the same register every other surface uses. Sweet is
   its own family now (no longer lumped under floral); fresh
   covers citrus + minty together at family register.
   ────────────────────────────────────────────────────────────── */

const FLAVOR_OPTIONS = PARENT_FLAVORS;

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
