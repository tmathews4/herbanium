import React, { useState, useEffect, useRef } from "react";
import { theme, ff } from "./theme";
import { UnitContext } from "./units/units";
import { SEED_MODES } from "./data/seeds";
import { Sprig, Flower, Leaf, Kettle, Ornament } from "./components/icons";
import { DemoHint } from "./components/DemoHint";
// Screens
import { HomeScreen } from "./screens/HomeScreen";
import { ComposeScreen } from "./screens/ComposeScreen";
import { SteepScreen } from "./screens/SteepScreen";
import { LogScreen } from "./screens/LogScreen";
import { LibraryScreen } from "./screens/LibraryScreen";
import { IngredientDetail } from "./screens/IngredientDetail";
import { BlendDetail } from "./screens/BlendDetail";
import { ProfileScreen } from "./screens/ProfileScreen";
import { OnboardingScreen } from "./screens/OnboardingScreen";
// Helpers
import { getBlend, LOCAL_BLENDS } from "./helpers/misc";
import { generateExperimentalSeeds, pickSeedBlends, ONBOARDING_PANTRY } from "./helpers/onboarding";
import { buildSyntheticForSelections } from "./algo/compose";
// Hooks
import { usePersistedState, resetAllPersistedState } from "./hooks/usePersistedState";

/* ──────────────────────────────────────────────────────────────
   Herbanium — interactive mock
   Aesthetic: warm paper / apothecary journal
   ────────────────────────────────────────────────────────────── */

/* ──────────────────────────────────────────────────────────────
   Tab bar
   ────────────────────────────────────────────────────────────── */

const TabBar = ({ tab, setTab }) => {
  const tabs = [
    { k: "home",     label: "Home",     icon: <Kettle size={18} /> },
    { k: "compose",  label: "Compose",  icon: <Flower size={18} /> },
    { k: "library",  label: "Apothecary",  icon: <Leaf size={18} /> },
    { k: "profile",  label: "Profile",  icon: <Sprig size={18} /> },
  ];

  return (
    <div style={{
      flexShrink: 0,
      padding: "10px 12px 22px",
      background: "rgba(243,236,220,0.94)",
      backdropFilter: "blur(8px)",
      borderTop: `1px solid ${theme.rule}`,
      display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 4,
    }}>
      {tabs.map(t => (
        <button key={t.k} onClick={() => setTab(t.k)} style={{
          background: "transparent", border: "none", cursor: "pointer",
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-start", gap: 3,
          padding: "4px 2px",
          color: tab === t.k ? theme.terra : theme.ash,
          minWidth: 0,
        }}>
          {React.cloneElement(t.icon, { c: tab === t.k ? theme.terra : theme.ash })}
          <span style={{
            fontFamily: ff.sans, fontSize: 9, letterSpacing: "0.06em", textTransform: "uppercase",
            whiteSpace: "nowrap",
          }}>{t.label}</span>
        </button>
      ))}
    </div>
  );
};

/* ──────────────────────────────────────────────────────────────
   Phone frame
   ────────────────────────────────────────────────────────────── */

const PhoneFrame = ({ children }) => {
  // Single layout for all viewports: full height, content capped at a
  // readable column width and centered. The dark "phone bezel" desktop
  // preview is gone — visitors on a laptop see a normal centered web
  // app rather than a mock device. Mobile is unaffected (the cap is
  // larger than any phone width).
  return (
    <div style={{
      position: "fixed", inset: 0,
      background: theme.ivory,
      overflowX: "hidden",
      overflowY: "hidden",
      display: "flex", flexDirection: "column",
      alignItems: "center",
      // Dynamic viewport height handles mobile browser chrome (address bar);
      // falls back to 100vh on older browsers.
      height: "100dvh",
      width: "100vw",
    }}>
      <div style={{
        width: "100%",
        maxWidth: 520,
        height: "100%",
        display: "flex", flexDirection: "column",
        // Soft border on desktop where the column doesn't fill the viewport;
        // invisible on mobile where width === maxWidth or smaller.
        boxShadow: "0 0 0 1px rgba(80,60,40,0.06)",
        background: theme.ivory,
      }}>
        {children}
      </div>
    </div>
  );
};

/* ──────────────────────────────────────────────────────────────
   Root app
   ────────────────────────────────────────────────────────────── */

export default function App() {
  // URL flag: ?dev skips onboarding, loads SEED_MODES.power as starting state.
  // Useful for testing without going through onboarding every time localStorage
  // gets cleared. Must read synchronously at module level so initial state is
  // correct on first render.
  const isDev = typeof window !== "undefined"
    && new URLSearchParams(window.location.search).has("dev");

  // Profile: null until onboarded. { name, timeOfDay, draw, createdAt }
  const [profile, setProfile] = usePersistedState("profile", null);

  // If dev flag, bypass onboarding by synthesizing a stub profile on first render.
  // Only runs if no profile exists yet — doesn't override a real user's profile.
  useEffect(() => {
    if (isDev && !profile) {
      setProfile({
        name: "Tommy",
        timeOfDay: ["morning", "afternoon", "evening"],
        draw: ["calm", "focus", "energy", "comfort"],
        createdAt: Date.now(),
        isDev: true,
      });
    }
  }, [isDev, profile, setProfile]);

  // Transient UI state (not persisted — should reset on reload)
  const [tab, setTab] = useState("home");
  const [overlay, setOverlay] = useState(null); // null | "steep" | "log" | "ingredient" | "blend"
  const [ingredientId, setIngredientId] = useState("chamomile");
  const [blendOverlayId, setBlendOverlayId] = useState(null);
  const [session, setSession] = useState(null);
  const [composePreselect, setComposePreselect] = useState(null);

  // Persisted preferences
  const [unit, setUnit] = usePersistedState("unit", "F");
  const [weightUnit, setWeightUnit] = usePersistedState("weightUnit", "tsp");

  // Persisted user data
  // For dev mode: default to SEED_MODES.power so the app looks populated.
  // For normal users: default to empty; onboarding will populate with seeds.
  const [sessions, setSessions] = usePersistedState(
    "sessions",
    isDev ? SEED_MODES.power.sessions : []
  );
  const [savedBlendIds, setSavedBlendIds] = usePersistedState(
    "savedBlendIds",
    isDev ? new Set(SEED_MODES.power.savedBlendIds) : new Set()
  );
  const [pantryIds, setPantryIds] = usePersistedState(
    "pantryIds",
    isDev ? new Set(SEED_MODES.power.pantryIds) : new Set()
  );

  // Seed mode: dev-only toggle. Hidden from normal users. Only functional
  // when ?dev is set. Flipping it resets state to that seed's snapshot.
  const [seedMode, setSeedMode] = useState("power");

  // When seed mode changes (dev only), reset the varying state to snapshot
  useEffect(() => {
    if (!isDev) return;
    const mode = SEED_MODES[seedMode];
    if (!mode) return;
    setSessions(mode.sessions);
    setSavedBlendIds(new Set(mode.savedBlendIds));
    setPantryIds(new Set(mode.pantryIds));
  }, [seedMode, isDev]);

  // Welcome card visibility — shown once after onboarding, then dismissed
  const [welcomeShown, setWelcomeShown] = usePersistedState("welcomeShown", false);

  // User-generated experimental blends, seeded at onboarding from the
  // user's draw selections. Persisted as full blend objects (not just
  // IDs) since they don't live in BLENDS — the algorithm produced them.
  const [generatedBlends, setGeneratedBlends] = usePersistedState("generatedBlends", []);

  // Hydrate LOCAL_BLENDS from the persisted generated-blends list
  // synchronously during render. Doing this in useEffect would leave
  // LOCAL_BLENDS empty on the first paint, so child components calling
  // getBlend(id) would miss the user's generated experimentals.
  // Idempotent — same keys get re-assigned with the same values.
  for (const b of generatedBlends || []) LOCAL_BLENDS[b.id] = b;

  // Onboarding completion handler
  const handleOnboardingComplete = ({ name, timeOfDay, draw, flavors }) => {
    const seedBlendIds = pickSeedBlends({ timeOfDay, draw });
    // Algorithmic experimentals tailored to the user's draws + flavors.
    // The user's flavor picks bias the synth's accent selection so
    // their first generated cups align with what they said they'd
    // reach for.
    const experimentals = generateExperimentalSeeds(
      { draw, flavors }, buildSyntheticForSelections,
    );
    setProfile({
      name,
      timeOfDay,
      draw,
      flavors: flavors || [],
      createdAt: Date.now(),
    });
    setGeneratedBlends(experimentals);
    setSavedBlendIds(new Set([
      ...seedBlendIds,
      ...experimentals.map(b => b.id),
    ]));
    setPantryIds(new Set(ONBOARDING_PANTRY));
    setWelcomeShown(false); // ensure welcome card shows on next Home render
  };

  // Full reset — wipes localStorage and reloads to restart from onboarding
  const resetEverything = () => {
    resetAllPersistedState();
    window.location.href = window.location.pathname; // strip any ?dev, reload clean
  };

  const go = (to, arg) => {
    if (to === "ingredient") {
      if (arg) setIngredientId(arg);
      setOverlay("ingredient");
      return;
    }
    setTab(to);
  };

  const openBlend = (blendId) => {
    setBlendOverlayId(blendId);
    setOverlay("blend");
  };

  const startBrew = (blend, intent, targetMoods) => {
    setSession({ blend, intent, targetMoods });
    setOverlay("steep");
  };

  const togglePantry = (ingId) => {
    const next = new Set(pantryIds);
    if (next.has(ingId)) next.delete(ingId);
    else next.add(ingId);
    setPantryIds(next);
  };

  // Append a newly-logged cup to the sessions list. Called when the user
  // completes a brew+log cycle. This is what makes newly-brewed cups show
  // up in Home's "Your cups, lately" and Apothecary's history.
  const addSession = ({ blend, intent, targetMoods, landed, extra, taste, note, save, rename }) => {
    // A blend composed via forward-compose won't have an id; stash it under
    // a synthetic id so the session can reference it via getBlend().
    let blendId = blend.id;
    if (!blendId) {
      blendId = `local-${Date.now()}`;
      // If the user renamed the blend at log time, use their name. Otherwise
      // fall back to the auto-generated one. Composed blends can be awkward
      // ("Dusk Lullaby · spiced accent"), so the rename field exists to let
      // them give it a name they'll recognize in Apothecary later.
      const finalName = (rename && rename.length > 0) ? rename : blend.name;
      LOCAL_BLENDS[blendId] = { ...blend, id: blendId, name: finalName };
    }

    // Derive "actual" from what landed: prefer target moods that landed,
    // fall back to any unintended moods the user noted, then to "brewed".
    const landedMoods = (targetMoods || []).filter(m => landed?.[m]);
    const extraMoods = extra || [];
    const actual = landedMoods.length > 0 ? landedMoods.join(", ")
                 : extraMoods.length > 0 ? extraMoods.join(", ")
                 : "brewed";

    const newSession = {
      id: `sess-${Date.now()}`,
      who: "you",
      blendId,
      ago: "just now",
      intent: intent || "",
      actual,
      taste: taste ?? 4,
      note: note || "",
    };

    setSessions(prev => [newSession, ...prev]);

    // Honor the "save blend to library" toggle in Log.
    if (save && !savedBlendIds.has(blendId)) {
      const next = new Set(savedBlendIds);
      next.add(blendId);
      setSavedBlendIds(next);
    }
  };

  // Open Compose with a blend pre-selected — used when user taps a favorite
  // on Home or a saved blend in Apothecary. Ensures intent-capture happens
  // before brewing, per the spec's principle.
  const openInCompose = (blendId) => {
    setComposePreselect({ blendId, at: Date.now() });
    setTab("compose");
    setOverlay(null);
  };

  // Favorite/unfavorite a blend. Uses the same savedBlendIds set — a saved
  // blend IS a favorite. No second list.
  const toggleFavorite = (blendId) => {
    const next = new Set(savedBlendIds);
    if (next.has(blendId)) next.delete(blendId);
    else next.add(blendId);
    setSavedBlendIds(next);
  };

  const scrollRef = useRef(null);
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = 0;
  }, [tab]);

  // Detect narrow (mobile-width) viewport so we can skip the desktop-preview
  // masthead/demo-hints/footer and render just the app at viewport size.
  const [isNarrow, setIsNarrow] = React.useState(
    typeof window !== "undefined" && window.innerWidth < 500
  );
  React.useEffect(() => {
    const onResize = () => setIsNarrow(window.innerWidth < 500);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // Extract the actual app tree (scroll region + tab bar + overlays) so we can
  // render it directly on mobile or wrap it in the desktop-preview chrome.
  const appContent = (
    <div style={{
      width: "100%", height: "100%",
      display: "flex", flexDirection: "column",
      position: "relative",
    }}>
      <div ref={scrollRef} style={{
        flex: "1 1 auto", minHeight: 0,
        overflowY: "auto",
        overflowX: "hidden",
        position: "relative",
      }}>
        {tab === "home"    && <HomeScreen    go={go} openBlend={openBlend} openInCompose={openInCompose} sessions={sessions} savedBlendIds={savedBlendIds} profile={profile} welcomeShown={welcomeShown} dismissWelcome={() => setWelcomeShown(true)} />}
        {tab === "compose" && <ComposeScreen go={go} startBrew={startBrew} savedBlendIds={savedBlendIds} openBlend={openBlend} composePreselect={composePreselect} openInCompose={openInCompose} pantryIds={pantryIds} sessions={sessions} />}
        {tab === "library" && <LibraryScreen go={go} startBrew={startBrew} openBlend={openBlend} openInCompose={openInCompose} sessions={sessions} savedBlendIds={savedBlendIds} pantryIds={pantryIds} togglePantry={togglePantry} />}
        {tab === "profile" && <ProfileScreen go={go} sessions={sessions} savedBlendIds={savedBlendIds} pantryIds={pantryIds} seedMode={seedMode} setSeedMode={setSeedMode} profile={profile} setProfile={setProfile} resetEverything={resetEverything} isDev={isDev} />}
      </div>

      <TabBar tab={tab} setTab={(k) => { setOverlay(null); setTab(k); }} />

      {overlay === "steep" && session && (
        <SteepScreen
          blend={session.blend}
          intent={session.intent}
          setIntent={(v) => setSession(s => s ? { ...s, intent: v } : s)}
          targetMoods={session.targetMoods}
          sessions={sessions}
          pantryIds={pantryIds}
          togglePantry={togglePantry}
          onDone={() => setOverlay("log")}
          onCancel={() => { setOverlay(null); setSession(null); }}
        />
      )}
      {overlay === "log" && session && (
        <LogScreen
          blend={session.blend}
          intent={session.intent}
          targetMoods={session.targetMoods}
          onSubmit={(logData) => {
            addSession({
              blend: session.blend,
              intent: session.intent,
              targetMoods: session.targetMoods,
              ...logData,
            });
            setOverlay(null);
            setSession(null);
            setTab("home");
          }}
          onCancel={() => setOverlay(null)}
        />
      )}
      {overlay === "ingredient" && (
        <IngredientDetail
          id={ingredientId}
          onClose={() => setOverlay(null)}
          pantryIds={pantryIds}
          togglePantry={togglePantry}
          onOpenIngredient={(newId) => setIngredientId(newId)}
        />
      )}
      {overlay === "blend" && blendOverlayId && (
        <BlendDetail
          blendId={blendOverlayId}
          isFavorite={savedBlendIds.has(blendOverlayId)}
          onToggleFavorite={() => toggleFavorite(blendOverlayId)}
          sessions={sessions}
          go={go}
          onClose={() => setOverlay(null)}
          onOpenIngredient={(ingId) => {
            setIngredientId(ingId);
            setOverlay("ingredient");
          }}
          onBrew={() => {
            const b = getBlend(blendOverlayId);
            if (!b) return;
            startBrew(b, "", [b.mood]);
          }}
        />
      )}
    </div>
  );

  // Onboarding gate: if no profile exists and we're not in dev mode, take
  // over with the onboarding screen. Wrap in UnitContext so the onboarding
  // can respect existing unit preferences if any exist in localStorage.
  if (!profile && !isDev) {
    return (
      <UnitContext.Provider value={{ unit, setUnit, weightUnit, setWeightUnit }}>
        <div style={{
          position: "fixed", inset: 0,
          background: theme.ivory,
          display: "flex", flexDirection: "column",
          height: "100dvh", width: "100vw",
          overflow: "hidden",
          fontFamily: ff.sans,
        }}>
          {/* Google Fonts */}
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
          <link
            href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght,SOFT@0,9..144,300..700,0..100;1,9..144,300..700,0..100&family=Instrument+Sans:ital,wght@0,400..700;1,400..700&family=JetBrains+Mono:wght@400;500&display=swap"
            rel="stylesheet"
          />
          <OnboardingScreen onComplete={handleOnboardingComplete} />
        </div>
      </UnitContext.Provider>
    );
  }

  // Mobile: render app full-screen with no masthead/demo-hints/footer chrome.
  if (isNarrow) {
    return (
      <UnitContext.Provider value={{ unit, setUnit, weightUnit, setWeightUnit }}>
        <div style={{
          position: "fixed", inset: 0,
          background: theme.ivory,
          display: "flex", flexDirection: "column",
          height: "100dvh", width: "100vw",
          overflow: "hidden",
          fontFamily: ff.sans,
        }}>
          {/* Google Fonts */}
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
          <link
            href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght,SOFT@0,9..144,300..700,0..100;1,9..144,300..700,0..100&family=Instrument+Sans:ital,wght@0,400..700;1,400..700&family=JetBrains+Mono:wght@400;500&display=swap"
            rel="stylesheet"
          />
          {appContent}
        </div>
      </UnitContext.Provider>
    );
  }

  return (
    <UnitContext.Provider value={{ unit, setUnit, weightUnit, setWeightUnit }}>
    <div style={{
      minHeight: "100vh", width: "100%",
      background: `
        radial-gradient(ellipse at 20% 0%, rgba(181,130,89,0.1) 0%, transparent 45%),
        radial-gradient(ellipse at 80% 100%, rgba(109,126,85,0.12) 0%, transparent 45%),
        linear-gradient(180deg, #E8DCC0 0%, #D6C6A4 100%)
      `,
      padding: "40px 20px",
      fontFamily: ff.sans,
    }}>
      {/* Google Fonts */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      <link
        href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght,SOFT@0,9..144,300..700,0..100;1,9..144,300..700,0..100&family=Instrument+Sans:ital,wght@0,400..700;1,400..700&family=JetBrains+Mono:wght@400;500&display=swap"
        rel="stylesheet"
      />

      {/* Masthead */}
      <div style={{ maxWidth: 1400, margin: "0 auto 32px", textAlign: "center" }}>
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 12, marginBottom: 6 }}>
          <Flower size={22} c={theme.terra} />
          <div style={{
            fontFamily: ff.sans, fontSize: 10.5, letterSpacing: "0.32em",
            textTransform: "uppercase", color: theme.inkSoft,
          }}>
            An Apothecary's Journal — for the Quiet Cup
          </div>
          <Flower size={22} c={theme.terra} />
        </div>
        <h1 style={{
          fontFamily: ff.serif, fontSize: 54, fontWeight: 300, color: theme.ink,
          letterSpacing: "-0.02em", margin: "6px 0 4px", lineHeight: 1,
        }}>
          Herbanium
        </h1>
        <div style={{
          fontFamily: ff.serif, fontStyle: "italic", fontSize: 15, color: theme.inkSoft,
        }}>
          Blend by mood · brew with intent · log the effect
        </div>
        <div style={{ marginTop: 14, display: "flex", justifyContent: "center" }}>
          <Ornament w={180} c={theme.ochre} />
        </div>
      </div>

      {/* Demo hint */}
      <div style={{
        maxWidth: 1400, margin: "0 auto 24px",
        display: "flex", justifyContent: "center", gap: 20, flexWrap: "wrap",
      }}>
        <DemoHint label="Combine moods" detail="try calm + focus on Compose" />
        <DemoHint label="Traditions tab" detail="Moroccan Mint, Masala Chai, Sencha" />
        <DemoHint label="Flip seed mode" detail="Profile → Dev → try 'new user'" />
      </div>

      {/* Phones */}
      <div style={{
        maxWidth: 1400, margin: "0 auto",
        display: "flex", justifyContent: "center", flexWrap: "wrap", gap: 32,
      }}>
        <PhoneFrame>
          {appContent}
        </PhoneFrame>
      </div>

      {/* Footer notes */}
      <div style={{
        maxWidth: 900, margin: "40px auto 0", textAlign: "center",
        fontFamily: ff.serif, fontStyle: "italic", fontSize: 13.5, color: theme.inkSoft, lineHeight: 1.6,
      }}>
        Placeholder name. "What's the tea?" reserved for the social surface.
        <br />
        Deterministic, local engine — no AI in the loop.
      </div>
    </div>
    </UnitContext.Provider>
  );
}

