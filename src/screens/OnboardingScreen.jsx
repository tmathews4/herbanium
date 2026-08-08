/* ──────────────────────────────────────────────────────────────
   screens/OnboardingScreen.jsx — first-visit profile creation

   Full-screen takeover. Four light steps:
     1. Name ("What should we call you?")
     2. Time of day ("When do you usually reach for tea?")
     3. What draws you (mood) — condensed 6-mood list
     4. Flavors you reach for — condensed 8-flavor list

   On finish: calls onComplete with profile data. App sets up the
   user's initial state (profile, seeded favorites + algorithmic
   experimentals tailored to draws + flavors) and
   navigates to Home.
   ────────────────────────────────────────────────────────────── */

import React, { useState } from "react";
import { theme, ff, shadow, radius } from "../theme";
import { Button } from "../components/layout";
import { Flower } from "../components/icons";
import { isNativeApp } from "../helpers/platform";

/* FOUR STEPS. There were five — a "When do you reach for tea?" step
   sat between the name and the moods, and nothing consumed the answer.
   pickSeedBlends took it and returned the same starter regardless (its
   own comment: "the answer doesn't currently shape the seed set"), and
   attributes.js built an `onboarding.times` Set that no predicate ever
   read. A question with no consumer is worse than no question: it costs
   a first-run screen, it implies the app will use it, and it quietly
   makes the answer feel wasted the first time nothing changes. */
const STEPS = 4;

export const OnboardingScreen = ({ onComplete }) => {
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
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
    : step === 2 ? draw.length > 0
    : step === 3 ? true  // flavors are optional — skip-friendly final step
    : false;

  const finish = () => {
    onComplete({
      name: name.trim() || "friend",
      // The cards are clusters; store the families they stand for, so
      // the recommender sees the register the user pointed at rather
      // than the label they tapped.
      draw: expandDraw(draw),
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
      // Vertical scroll only — overflow:auto allowed both axes,
      // which let mobile Chrome users accidentally side-scroll the
      // onboarding card off-screen via touch panning. Locking
      // overflow-x to hidden constrains all gestures to vertical.
      overflowY: "auto",
      overflowX: "hidden",
      // Top buffer for the system status icons / camera cutout on
      // edge-to-edge Android. Has to live HERE rather than on the
      // App.jsx wrapper because this root is position:absolute, so
      // a wrapper's paddingTop doesn't push it — same shape of bug
      // as the home screen's PhoneFrame issue. Web (no system icons
      // to clear) drops to a small visual margin only.
      boxSizing: "border-box",
      paddingTop: isNativeApp() ? 72 : 16,
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
        /* WITHOUT THIS THE PADDING ABOVE DOES NOTHING VISIBLE. The
           28px gutter has always been specified here, and this element
           was content-box, so `width: 100%` plus the padding came to
           100% + 56px: the box overflowed its column and the cards sat
           flush against both screen edges. Reported on a Pixel as the
           cards being too close to the border.

           The tell was in this same file — the nav row below already
           carries boxSizing, which is why BACK and next looked properly
           inset while the content they sat under did not. There is no
           global border-box reset in index.css; the one rule that sets
           it is scoped to the desktop frame. */
        boxSizing: "border-box",
      }}>
        {step === 0 && <StepWelcome />}
        {step === 1 && (
          <StepName
            name={name}
            setName={setName}
            // Guarded by the same condition that greys out Next, so
            // Return can't skip a step the button wouldn't.
            onSubmit={() => { if (canAdvance) advance(); }}
          />
        )}
        {step === 2 && <StepDraw value={draw} setValue={setDraw} />}
        {step === 3 && <StepFlavors value={flavors} setValue={setFlavors} />}
      </div>

      {/* Selection count hint (multi-select steps only) */}
      {(step === 2 || step === 3) && (
        <div style={{
          padding: "0 24px 4px", textAlign: "center",
          fontFamily: ff.serif, fontStyle: "italic", fontSize: 11.5,
          color: theme.ash, lineHeight: 1.4,
          minHeight: 18, flexShrink: 0,
          maxWidth: 520, width: "100%", alignSelf: "center",
        }}>
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
        Your journal stays on your device — no account, never sent anywhere.
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

// `onSubmit` is the same advance the Next button runs, not a parallel
// path — Enter must be subject to the same guard, or it would walk past
// the empty-name check that greys the button out.
const StepName = ({ name, setName, onSubmit }) => (
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
    {/* A REAL FORM, for the Return key.
        Typing your name and reaching for Return is the obvious move,
        and it did nothing — you had to dismiss the keyboard, find Next
        underneath where the keyboard had been, and tap it. Three
        actions for the one the user already made.

        A form rather than an onKeyDown: a form with a single text input
        submits implicitly on Return in every engine, and — the part
        that matters on a phone — it tells the on-screen keyboard this
        field completes something, so the key relabels itself instead of
        offering a newline the input can't take. `enterKeyHint` names
        what it should say. */}
    <form
      onSubmit={(e) => { e.preventDefault(); onSubmit?.(); }}
      style={{ margin: 0 }}
    >
      <input
        type="text"
        value={name}
        onChange={e => setName(e.target.value)}
        placeholder="your name"
        maxLength={30}
        autoFocus
        size={1}
        enterKeyHint="next"
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
    </form>
    <div style={{
      marginTop: 10,
      fontFamily: ff.sans, fontSize: 11, color: theme.ash,
    }}>
      we'll greet you by this in the kettle
    </div>
  </div>
);

/* ──────────────────────────────────────────────────────────────
   Step 3: What draws you — parent-mood canon (7 families).

   Pulls from data/canon.PARENT_MOODS so first-run onboarding picks
   at the same register every other capture surface uses (Steep,
   Journal, Recipes filter). Cooling joined the list so the canon
   stays consistent across all 7 families instead of dropping cool
   only here.
   ────────────────────────────────────────────────────────────── */

import { DRAW_PARENT_MOODS, expandDraw, PARENT_FLAVORS } from "../data/canon";

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
  sleepy:    "the slow slide toward evening",
  soothing:  "bodily ease, gentle support",
  grounding: "steadying, settled in yourself",
  uplifting: "brightening, without the buzz",
};
/* The cards, their wording and their clustering all live in
   canon.DRAW_CLUSTERS now — see the note there for why a stranger is
   offered seven feelings where the canon tracks eleven families, and
   why the labels differ from the canon's (those serve the journal's
   "where it left me" row, where the same value is an outcome rather
   than a pull: "Grounded" is right there and wrong here).

   Immune is absent for a different reason again — it is declared
   `perceptible: false` in families.js, because our own research says
   you cannot notice it. A felt question shouldn't ask for it. */
const DRAW_OPTIONS = DRAW_PARENT_MOODS;

const StepDraw = ({ value, setValue }) => {
  const toggle = (key) => {
    setValue(value.includes(key) ? value.filter(k => k !== key) : [...value, key]);
  };
  return (
    <>
      <StepHeader title="What pulls you to a cup?" sub="Pick any that resonate — no wrong answers." />
      {/* CARDS, NOT CHIPS, so the notes are actually readable.

          Every option here had a line of copy written for it — "a
          settling, a softening", "the slow slide toward evening" — and
          none of it had ever been seen. The chip grid put it in a `title`
          attribute, which is a hover tooltip: on the phone this app is
          built for, there is no hover, so the note was addressed to
          nobody. The single word carried the whole meaning, which is
          exactly why the labels needed the audit that preceded this.

          Step 2 already renders label-plus-note as full-width rows and
          reads well. It has three options; this has ten, and ten
          full-width rows do not fit a phone. So the same anatomy in two
          columns — same component, told to be compact — which keeps the
          two steps recognisably the same question shape without
          scrolling the answer off the screen. */}
      <div style={{
        display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 8,
      }}>
        {DRAW_OPTIONS.map(opt => (
          <OnboardOption key={opt.key} opt={opt} compact
            selected={value.includes(opt.key)} onSelect={() => toggle(opt.key)} />
        ))}
      </div>
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

/* THE NOTES ARE THE POINT HERE, more than they were for the moods.

   "Calm" needs no gloss. "Vegetal", "Marine" and "Creamy" are trade
   words: a newcomer either knows them or is guessing, and the tooltip
   they used to live in is addressed to nobody on a phone. With the note
   on the card the jargon becomes teachable rather than exclusionary,
   which is the whole register this app is trying to work in — so the
   labels stay and the notes carry them.

   NO TEA NAMES HERE. The first draft named the ingredients that
   actually carry each family — lapsang for smoky, gyokuro for marine,
   pu-erh for earthy — which was accurate and was the wrong move at the
   door. Naming lapsang to someone who has never heard of lapsang
   explains nothing; it just moves the unfamiliar word one line down and
   adds the suggestion that they should have known it. The catalogue is
   where those names are worth learning, and by then they arrive with a
   cup attached.

   So the notes describe the sensation instead. The accuracy work still
   paid for itself — checking which ingredients carry each family is
   what settled the wording, since "sea air" comes from having looked at
   what marine actually tags. Ordinary kitchen words stay: clove and
   ginger are things people have smelled, unlike a Chinese smoked black
   tea.

   `creamy` gets the odd one out, and deliberately: it is the only
   option here that isn't a taste at all. Saying so is more useful than
   pretending it belongs. */
const FLAVOR_NOTES = {
  fruity:  "berry and orchard fruit, tart or sweet",
  floral:  "petals and perfume, the scented cup",
  sweet:   "honeyed and apple-sweet — nothing added",
  spiced:  "clove, ginger, warm pepper",
  smoky:   "woodsmoke, a fire-cured edge",
  earthy:  "forest floor, damp wood, roasted grain",
  fresh:   "mint and citrus peel, the bright edge",
  vegetal: "grassy and green, like fresh leaves",
  marine:  "sea air, a clean saline note",
  creamy:  "a texture, not a taste — round and coating",
};
const FLAVOR_OPTIONS = PARENT_FLAVORS.map(f => ({
  ...f,
  note: FLAVOR_NOTES[f.key] || f.note,
}));

const StepFlavors = ({ value, setValue }) => {
  const toggle = (key) => {
    setValue(value.includes(key) ? value.filter(k => k !== key) : [...value, key]);
  };
  return (
    <>
      <StepHeader title="Flavors you reach for?" sub="Optional — pick any you tend to like, or skip ahead." />
      {/* Same two-column cards as the mood step. Ten options either way,
          so the shape that fit there fits here — and the two steps ask
          the same kind of question, which they should look like. */}
      <div style={{
        display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 8,
      }}>
        {FLAVOR_OPTIONS.map(opt => (
          <OnboardOption key={opt.key} opt={opt} compact
            selected={value.includes(opt.key)} onSelect={() => toggle(opt.key)} />
        ))}
      </div>
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
   Full-width option row (used by time-of-day step, 3 items)
   ────────────────────────────────────────────────────────────── */

/* `compact` is a density switch, not a second component. The mood step
   needs ten of these where the time step needs three, so it wants
   tighter padding and smaller type — but the same anatomy, because the
   two steps are asking the same kind of question and should look like
   it. The tick is dropped when compact: at two columns the terra border
   and fill already carry selection, and a check mark in a 150px card
   costs a word of the note. */
const OnboardOption = ({ opt, selected, onSelect, compact = false }) => (
  <button
    onClick={onSelect}
    style={{
      width: "100%", textAlign: "left",
      padding: compact ? "10px 12px" : "14px 18px", borderRadius: 10,
      background: selected ? theme.cream : "transparent",
      border: `1px solid ${selected ? theme.terra : theme.rule}`,
      cursor: "pointer",
      transition: "all 0.15s ease",
      display: "flex", alignItems: "baseline", gap: 12,
      height: compact ? "100%" : undefined,
      boxSizing: "border-box",
    }}
  >
    <div style={{ flex: 1 }}>
      <div style={{
        fontFamily: ff.serif, fontSize: compact ? 15 : 17,
        color: selected ? theme.terra : theme.ink,
        lineHeight: 1.2,
      }}>
        {opt.label}
      </div>
      <div style={{
        fontFamily: ff.serif, fontStyle: "italic",
        fontSize: compact ? 11 : 12,
        color: theme.ash, marginTop: 2, lineHeight: 1.35,
      }}>
        {opt.note}
      </div>
    </div>
    {selected && !compact && <div style={{ color: theme.terra, fontSize: 18 }}>✓</div>}
  </button>
);
