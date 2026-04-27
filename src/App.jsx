import React, { useState, useEffect, useRef } from "react";
import { theme, ff } from "./theme";
import { UnitContext } from "./units/units";
import { SEED_MODES, materializeSeedSessions } from "./data/seeds";
import { Sprig, Flower, Leaf, Kettle, Ornament } from "./components/icons";
import { DemoHint } from "./components/DemoHint";
import { FirstCupHintCard } from "./components/FirstCupHintCard";
// Screens
import { HomeScreen } from "./screens/HomeScreen";
import { ComposeScreen } from "./screens/ComposeScreen";
import { SteepScreen } from "./screens/SteepScreen";
import { LogScreen } from "./screens/LogScreen";
import { IngredientDetail } from "./screens/IngredientDetail";
import { BlendDetail } from "./screens/BlendDetail";
import { ProfileScreen } from "./screens/ProfileScreen";
import { OnboardingScreen } from "./screens/OnboardingScreen";
// Helpers
import { getBlend, LOCAL_BLENDS } from "./helpers/misc";
import { pickSeedBlends, ONBOARDING_PANTRY } from "./helpers/onboarding";
import { generateCreationTitle } from "./data/creationTitle";
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
    { k: "apothecary", label: "Apothecary", icon: <Flower size={18} /> },
    { k: "shelf",      label: "Shelf",      icon: <Leaf size={18} /> },
    { k: "profile",  label: "Profile",  icon: <Sprig size={18} /> },
  ];

  return (
    <div style={{
      flexShrink: 0,
      padding: "10px 12px 22px",
      background: "rgba(243,236,220,0.94)",
      backdropFilter: "blur(8px)",
      borderTop: `1px solid ${theme.rule}`,
      display: "grid", gridTemplateColumns: "1.35fr 1fr 1fr 1fr", gap: 4,
    }}>
      {tabs.map((t, i) => (
        <button key={t.k} onClick={() => setTab(t.k)} style={{
          background: "transparent", border: "none", cursor: "pointer",
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-start", gap: 3,
          padding: "4px 2px",
          color: tab === t.k ? theme.terra : theme.ash,
          minWidth: 0,
          borderRight: i === 0 ? `1px solid ${theme.ruleSoft}` : "none",
        }}>
          {React.cloneElement(t.icon, { c: tab === t.k ? theme.terra : theme.ash })}
          <span style={{
            fontFamily: ff.sans, fontSize: 9, letterSpacing: "0.04em", textTransform: "uppercase",
            whiteSpace: "nowrap",
            display: "inline-block", width: 78, textAlign: "center",
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
      const seed = SEED_MODES.power.profile || {};
      setProfile({
        name: seed.name || "Tommy",
        timeOfDay: seed.timeOfDay || ["morning", "afternoon", "evening"],
        draw: seed.draw || ["calm", "focus", "energy", "comfort"],
        flavors: seed.flavors || [],
        createdAt: Date.now(),
        isDev: true,
      });
    }
  }, [isDev, profile, setProfile]);

  // Transient UI state (not persisted — should reset on reload)
  const [tab, setTab] = useState("home");
  // Persisted lifetime tab-visit counts. Each time the active tab
  // changes the entry increments by one, fueling the "first time
  // visiting tab X" / "visited X N times" elemental triggers. Stored
  // as a plain object keyed by tab id ("home" | "apothecary" | "shelf"
  // | "profile") so it serializes cleanly without Set/Map gymnastics.
  const [tabVisits, setTabVisits] = usePersistedState("tabVisits", {});
  const [overlay, setOverlay] = useState(null); // null | "steep" | "log" | "ingredient" | "blend"
  const [ingredientId, setIngredientId] = useState("chamomile");
  const [blendOverlayId, setBlendOverlayId] = useState(null);
  const [session, setSession] = useState(null);
  const [composePreselect, setComposePreselect] = useState(null);

  // Browser-back support for modal overlays. When an overlay opens we
  // push a sentinel history entry; the system back gesture (Android
  // back, iOS edge-swipe, browser back button) then closes the overlay
  // instead of leaving the page entirely. Lateral tab switches stay
  // outside this flow — only the modal screens (steep/log/ingredient/
  // blend detail) participate.
  // Bump the visit counter every time the active tab changes. Counts
  // initial mount too (the home tab gets a +1 on first load) — that's
  // fine, since the "first visit" trigger fires on count >= 1.
  useEffect(() => {
    setTabVisits(prev => {
      const cur = prev || {};
      return { ...cur, [tab]: (cur[tab] || 0) + 1 };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  useEffect(() => {
    if (!overlay) return;
    window.history.pushState({ herbaniumOverlay: overlay }, "");
    const onPop = () => {
      setOverlay(null);
      setSession(null);
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, [overlay]);

  // Persisted preferences
  const [unit, setUnit] = usePersistedState("unit", "F");
  const [weightUnit, setWeightUnit] = usePersistedState("weightUnit", "tsp");

  // Persisted user data
  // For dev mode: default to SEED_MODES.power so the app looks populated.
  // For normal users: default to empty; onboarding will populate with seeds.
  const [sessions, setSessions] = usePersistedState(
    "sessions",
    isDev ? materializeSeedSessions(SEED_MODES.power.sessions) : []
  );
  // Free-form journal entries — text-only entries that live in the
  // same chronology as cup sessions. Persisted as { id, ts, text, kind }
  // where kind is "entry" (free) or "haiku" (woven from prompts).
  const [journalEntries, setJournalEntries] = usePersistedState("journalEntries", []);
  // Planner items — small list of "today's intentions" the user can
  // jot down and tick off. Surfaces in Shelf > Journal as an inline
  // section, and via a button in the Apothecary brew page that pops
  // up the same list as a modal overlay.
  const [plannerItems, setPlannerItems] = usePersistedState("plannerItems", []);
  const addPlannerItem = (text) => {
    const clean = (text || "").trim();
    if (!clean) return;
    const item = {
      id: `plan-${Date.now()}`,
      text: clean,
      done: false,
      ts: Date.now(),
    };
    setPlannerItems(prev => [item, ...(prev || [])]);
  };
  const togglePlannerItem = (id) => {
    setPlannerItems(prev =>
      (prev || []).map(p => p.id === id ? { ...p, done: !p.done } : p)
    );
  };
  const editPlannerItem = (id, text) => {
    const clean = (text || "").trim();
    if (!clean) return;
    setPlannerItems(prev =>
      (prev || []).map(p => p.id === id ? { ...p, text: clean } : p)
    );
  };
  const deletePlannerItem = (id) => {
    setPlannerItems(prev => (prev || []).filter(p => p.id !== id));
  };
  const clearDonePlannerItems = () => {
    setPlannerItems(prev => (prev || []).filter(p => !p.done));
  };
  const [savedBlendIds, setSavedBlendIds] = usePersistedState(
    "savedBlendIds",
    isDev ? new Set(SEED_MODES.power.savedBlendIds) : new Set()
  );
  // Favorites are a curated subset of saved — the user's "I love this" tier.
  // Saving puts a blend on the Shelf; favoriting elevates it to Home and
  // the favorites filter. Adding a favorite auto-saves so the two stay in sync.
  const [favoriteBlendIds, setFavoriteBlendIds] = usePersistedState(
    "favoriteBlendIds",
    isDev ? new Set(SEED_MODES.power.favoriteBlendIds || []) : new Set()
  );
  const [pantryIds, setPantryIds] = usePersistedState(
    "pantryIds",
    isDev ? new Set(SEED_MODES.power.pantryIds) : new Set()
  );

  // Seed mode: dev-only toggle. Hidden from normal users. Only functional
  // when ?dev is set. Flipping it resets state to that seed's snapshot.
  const [seedMode, setSeedMode] = useState("power");

  // Dev-seed version — bump when the power seed shape changes so users
  // with stale persisted data get refreshed. Without this, an existing
  // dev session keeps its old "y1"-"y9" sessions even after we ship a
  // richer seed, because usePersistedState rehydrates from localStorage.
  const SEED_VERSION = "3";
  const [seedVersion, setSeedVersion] = usePersistedState("seedVersion", null);

  // When seed mode changes (dev only), reset the varying state to snapshot.
  // Includes generatedBlends + favorites + profile so the new richer power
  // seed populates everything that drives titles. Also force-resets if the
  // persisted seedVersion doesn't match the current code version.
  useEffect(() => {
    if (!isDev) return;
    const mode = SEED_MODES[seedMode];
    if (!mode) return;
    setSessions(materializeSeedSessions(mode.sessions));
    setSavedBlendIds(new Set(mode.savedBlendIds || []));
    setFavoriteBlendIds(new Set(mode.favoriteBlendIds || []));
    setPantryIds(new Set(mode.pantryIds || []));
    setGeneratedBlends(mode.generatedBlends || []);
    if (mode.profile) {
      setProfile(prev => ({ ...(prev || {}), ...mode.profile, isDev: true, createdAt: prev?.createdAt || Date.now() }));
    }
    setSeedVersion(SEED_VERSION);
  }, [seedMode, isDev]);

  // First-mount stale-data guard: if dev and persisted seedVersion is
  // older than the code's, reapply the current seed mode immediately.
  useEffect(() => {
    if (!isDev) return;
    if (seedVersion === SEED_VERSION) return;
    const mode = SEED_MODES[seedMode];
    if (!mode) return;
    setSessions(materializeSeedSessions(mode.sessions));
    setSavedBlendIds(new Set(mode.savedBlendIds || []));
    setFavoriteBlendIds(new Set(mode.favoriteBlendIds || []));
    setPantryIds(new Set(mode.pantryIds || []));
    setGeneratedBlends(mode.generatedBlends || []);
    if (mode.profile) {
      setProfile(prev => ({ ...(prev || {}), ...mode.profile, isDev: true, createdAt: prev?.createdAt || Date.now() }));
    }
    setSeedVersion(SEED_VERSION);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // One-shot favorites migration. Onboarding now seeds favoriteBlendIds
  // with the same starter set as savedBlendIds so the Home rail is
  // genuinely populated. Users who onboarded before this fix have
  // savedBlendIds but an empty favoriteBlendIds; the Home rail's
  // savedBlendIds fallback hides the bug until they add their first
  // favorite, at which point the rail collapses to that single entry.
  // Detect that state once and seed favorites from saved so existing
  // users get the fixed behavior on next load.
  const [favoritesMigrated, setFavoritesMigrated] = usePersistedState("favoritesMigrated", false);
  useEffect(() => {
    if (favoritesMigrated) return;
    if (!profile) return;
    if ((favoriteBlendIds?.size || 0) > 0) {
      setFavoritesMigrated(true);
      return;
    }
    if ((savedBlendIds?.size || 0) > 0) {
      setFavoriteBlendIds(new Set(savedBlendIds));
    }
    setFavoritesMigrated(true);
  }, [profile, favoritesMigrated]); // eslint-disable-line react-hooks/exhaustive-deps

  // Pantry hint visibility — one-time card pointing at the pantry toggle.
  // Pantry starts empty for new users; this nudges them toward filling it.
  const [pantryHintShown, setPantryHintShown] = usePersistedState("pantryHintShown", false);
  // First-cup hint visibility — tutorial card on Home pointing at
  // Compose/Apothecary. Stays until the user dismisses or brews a cup.
  const [firstCupHintShown, setFirstCupHintShown] = usePersistedState("firstCupHintShown", false);
  // Per-surface tutorial card flags — first-visit hints for Compose,
  // its Journal sub-tab, and Profile. Each is persisted independently
  // so users only see each one once.
  const [composeHintShown, setComposeHintShown] = usePersistedState("composeHintShown", false);
  const [journalHintShown, setJournalHintShown] = usePersistedState("journalHintShown", false);
  const [profileHintShown, setProfileHintShown] = usePersistedState("profileHintShown", false);
  // First-visit hint for Shelf > Bestiary. Lives on its own flag
  // because the bestiary is an opt-in side surface — users only
  // see this hint after they tap into the tab.
  const [bestiaryHintShown, setBestiaryHintShown] = usePersistedState("bestiaryHintShown", false);
  // First-visit hint for the IngredientDetail screen — explains
  // its three tabs (Overview / Brewing / Pairings).
  const [ingredientHintShown, setIngredientHintShown] = usePersistedState("ingredientHintShown", false);
  // Unique creation elemental popup — now fires on first Profile visit
  // rather than on Home, so it doesn't hit users right at app entry.
  const [omenShown, setOmenShown] = usePersistedState("omenShown", false);
  // Set of elemental attribute ids the user has been shown an arrival
  // popup for. Newly-earned elementals whose ids aren't in here
  // trigger an ElementalArrivalCard on the next Profile visit. The
  // localStorage key is left as the legacy "seenAnimiIds" so existing
  // users keep their seen-set across the rename.
  const [seenElementalIds, setSeenElementalIds] = usePersistedState("seenAnimiIds", new Set());
  // Featured elementals on the grove — up to 5 ids the user keeps in
  // the surfaced row below their unique spirit. Empty default falls
  // back to top-5-by-rarity in ProfileScreen. Persisted key kept as
  // the legacy "featuredAnimis" for migration safety.
  const [featuredElementals, setFeaturedElementals] = usePersistedState("featuredAnimis", []);
  // Disable elementals — hides every elemental surface (creation omen,
  // grove, profile stat) for users who'd rather not engage with the
  // mythic layer. Persisted key kept as legacy "animisBanished".
  const [elementalsDisabled, setElementalsDisabled] = usePersistedState("animisBanished", false);

  // User-generated experimental blends, seeded at onboarding from the
  // user's draw selections. Persisted as full blend objects (not just
  // IDs) since they don't live in BLENDS — the algorithm produced them.
  const [generatedBlends, setGeneratedBlends] = usePersistedState("generatedBlends", []);
  // Hidden curated experimentals — tracked here so deleting Tom Foolery
  // (which lives in the BLENDS source-of-truth array) sticks across reloads.
  const [hiddenBlendIds, setHiddenBlendIds] = usePersistedState("hiddenBlendIds", new Set());

  // Hydrate LOCAL_BLENDS from the persisted generated-blends list
  // synchronously during render. Doing this in useEffect would leave
  // LOCAL_BLENDS empty on the first paint, so child components calling
  // getBlend(id) would miss the user's generated experimentals.
  // Idempotent — same keys get re-assigned with the same values.
  for (const b of generatedBlends || []) LOCAL_BLENDS[b.id] = b;

  // Synth-cleanup pass: remove any algorithmically-generated synth blends
  // from existing accounts. Onboarding no longer generates synths; this
  // purges legacy ones so the user's shelf reflects only curated picks
  // and their own compositions. User-composed `local-` blends stay.
  const SYNTHS_VERSION = "3";
  useEffect(() => {
    if (!profile || profile.synthsVersion === SYNTHS_VERSION) return;
    const syntheticIds = (generatedBlends || [])
      .filter(b => String(b.id || "").startsWith("synth-"))
      .map(b => b.id);
    if (syntheticIds.length === 0) {
      setProfile(prev => prev ? { ...prev, synthsVersion: SYNTHS_VERSION } : prev);
      return;
    }
    const nonSynth = (generatedBlends || []).filter(
      b => !String(b.id || "").startsWith("synth-")
    );
    setGeneratedBlends(nonSynth);
    syntheticIds.forEach(id => { delete LOCAL_BLENDS[id]; });
    const oldIdSet = new Set(syntheticIds);
    const purge = (set) => {
      const next = new Set();
      for (const id of set) if (!oldIdSet.has(id)) next.add(id);
      return next;
    };
    setSavedBlendIds(prev => purge(prev));
    setFavoriteBlendIds(prev => purge(prev));
    setProfile(prev => prev ? { ...prev, synthsVersion: SYNTHS_VERSION } : prev);
  }, [profile?.synthsVersion]);  // eslint-disable-line react-hooks/exhaustive-deps

  // Onboarding completion handler. No algorithmic synths are generated
  // anymore — discoverability happens through the curated Catalogue
  // (traditionals + house experimentals). The favorites rail seeds
  // with adjacent traditions only, picked from the user's draws.
  const handleOnboardingComplete = ({ name, timeOfDay, draw, flavors }) => {
    const seedBlendIds = pickSeedBlends({ timeOfDay, draw });
    const createdAt = Date.now();
    const baseProfile = {
      name,
      timeOfDay,
      draw,
      flavors: flavors || [],
      createdAt,
    };
    setProfile({
      ...baseProfile,
      title: generateCreationTitle(baseProfile),
      synthsVersion: "3", // signals the no-synth onboarding generation
    });
    setGeneratedBlends([]);
    setSavedBlendIds(new Set(seedBlendIds));
    // Seed favorites with the same starter set so the Home rail is
    // populated from the start and adding the first real favorite
    // doesn't visually wipe the preloaded ones out from under the user.
    setFavoriteBlendIds(new Set(seedBlendIds));
    setPantryIds(new Set(ONBOARDING_PANTRY));
    setOmenShown(false); // unique elemental popup plays on first Profile visit
    setPantryHintShown(false); // ensure pantry hint shows for new users
    setFirstCupHintShown(false); // first-cup tutorial card on Home
    setComposeHintShown(false); // first-visit Compose tutorial
    setJournalHintShown(false); // first-visit Journal tutorial
    setProfileHintShown(false); // first-visit Profile tutorial
    setSeenElementalIds(new Set()); // arrival popups start fresh
  };

  // Full reset — wipes localStorage and reloads to restart from onboarding
  const resetEverything = () => {
    resetAllPersistedState();
    window.location.href = window.location.pathname; // strip any ?dev, reload clean
  };

  // Per-screen view presets — let other screens deep-link into a
  // specific sub-mode (e.g. Profile → Compose Shelf → Journal).
  const [composeView, setComposeView] = useState(null);

  const go = (to, arg) => {
    if (to === "ingredient") {
      if (arg) setIngredientId(arg);
      setOverlay("ingredient");
      return;
    }
    if ((to === "apothecary" || to === "shelf") && arg && typeof arg === "object") {
      setComposeView({ ...arg, at: Date.now() });
    }
    setTab(to);
  };

  // Restore a curated blend the user previously deleted from their
  // catalogue. Only meaningful for entries in BLENDS — user-generated
  // blends in `generatedBlends` were dropped, not hidden.
  const unhideBlend = (id) => {
    setHiddenBlendIds(prev => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  };

  const openBlend = (blendId) => {
    setBlendOverlayId(blendId);
    setOverlay("blend");
  };

  const startBrew = (blend, intent, targetMoods) => {
    setSession({ blend, intent, targetMoods, currentMoods: [] });
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
  const addSession = ({ blend, intent, targetMoods, currentMoods, landed, extra, taste, note, save, rename }) => {
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
      const persisted = { ...blend, id: blendId, name: finalName, experimental: true };
      LOCAL_BLENDS[blendId] = persisted;
      // Also persist into generatedBlends so the blend survives reload
      // and shows up in Catalogue → Experimental.
      setGeneratedBlends(prev => [...(prev || []), persisted]);
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
      currentMoods: currentMoods || [],
      actual,
      taste: taste ?? 4,
      note: note || "",
      // Capture the user's actual brew settings — the explorer
      // sliders may have moved the temp/time off the blend's
      // curated defaults, and downstream views (the home cup row,
      // blend history) want to show what the user actually did,
      // not the recipe spec.
      tempC: blend.tempC,
      timeS: blend.timeS,
    };

    setSessions(prev => [newSession, ...prev]);

    // Honor the "save blend to library" toggle in Log.
    if (save && !savedBlendIds.has(blendId)) {
      const next = new Set(savedBlendIds);
      next.add(blendId);
      setSavedBlendIds(next);
    }
  };

  // Append a free-form journal entry. Entries live alongside cup
  // sessions in the chronology and render via JournalEntryRow on the
  // Compose · Shelf · Journal tab.
  const addJournalEntry = (text, kind, note, currentMoods, landedMoods) => {
    if (!text || !text.trim()) return;
    const validKind =
      kind === "haiku" ? "haiku"
      : kind === "limerick" ? "limerick"
      : "entry";
    const entry = {
      id: `entry-${Date.now()}`,
      ts: Date.now(),
      text: text.trim(),
      kind: validKind,
      note: note && note.trim ? note.trim() : "",
      // Mood arc — same shape cup sessions use, so the journal
      // timeline reads as one mood log across cups + entries.
      currentMoods: Array.isArray(currentMoods) ? currentMoods : [],
      landedMoods:  Array.isArray(landedMoods)  ? landedMoods  : [],
    };
    setJournalEntries(prev => [entry, ...(prev || [])]);
  };
  const deleteJournalEntry = (id) => {
    setJournalEntries(prev => (prev || []).filter(e => e.id !== id));
  };

  // Open Compose with a blend pre-selected — used when user taps a favorite
  // on Home or a saved blend, opens Shelf · Recipe Book with the favorite
  // highlighted, ready to set intent and brew.
  const openInCompose = (blendId) => {
    setComposePreselect({ blendId, at: Date.now() });
    setTab("shelf");
    setOverlay(null);
  };

  // Delete a non-traditional blend. For generated/composed blends (in
  // generatedBlends), drop the persisted record. For curated experimentals
  // (BLENDS array source-of-truth), record the id in hiddenBlendIds so the
  // omission survives reloads. Either way, clean up favorites/saved.
  const deleteBlend = (id) => {
    const inGenerated = (generatedBlends || []).some(b => b.id === id);
    if (inGenerated) {
      setGeneratedBlends(prev => (prev || []).filter(b => b.id !== id));
      delete LOCAL_BLENDS[id];
    } else {
      setHiddenBlendIds(prev => {
        const next = new Set(prev);
        next.add(id);
        return next;
      });
    }
    if (favoriteBlendIds.has(id)) {
      const nextFav = new Set(favoriteBlendIds);
      nextFav.delete(id);
      setFavoriteBlendIds(nextFav);
    }
    if (savedBlendIds.has(id)) {
      const nextSaved = new Set(savedBlendIds);
      nextSaved.delete(id);
      setSavedBlendIds(nextSaved);
    }
  };

  // Save a composed blend without brewing it first. Mints a local- id,
  // persists into generatedBlends + LOCAL_BLENDS, and lands on the Shelf
  // (savedBlendIds) and the Home favorites rail (favoriteBlendIds).
  // Returns the new blend id so callers can confirm the save.
  const saveComposedBlend = (blend, providedName) => {
    const id = `local-${Date.now()}`;
    const finalName = (providedName || "").trim() || blend.name || "Untitled blend";
    const persisted = {
      ...blend,
      id,
      name: finalName,
      experimental: true,
      synthetic: false,
    };
    LOCAL_BLENDS[id] = persisted;
    setGeneratedBlends(prev => [...(prev || []), persisted]);
    setSavedBlendIds(prev => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });
    setFavoriteBlendIds(prev => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });
    return id;
  };

  // Single favorite toggle — save and favorite are now one concept.
  // Updates both savedBlendIds and favoriteBlendIds in lockstep so legacy
  // call sites that read savedBlendIds (Profile stat, etc.) keep working
  // without a wider rename.
  const toggleFavorite = (blendId) => {
    const wasFav = favoriteBlendIds.has(blendId);
    const nextFav = new Set(favoriteBlendIds);
    const nextSaved = new Set(savedBlendIds);
    if (wasFav) {
      nextFav.delete(blendId);
      nextSaved.delete(blendId);
    } else {
      nextFav.add(blendId);
      nextSaved.add(blendId);
    }
    setFavoriteBlendIds(nextFav);
    setSavedBlendIds(nextSaved);
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
        {tab === "home"    && <HomeScreen    go={go} openBlend={openBlend} openInCompose={openInCompose} sessions={sessions} savedBlendIds={savedBlendIds} favoriteBlendIds={favoriteBlendIds} profile={profile} elementalsDisabled={elementalsDisabled} />}
        {tab === "apothecary" && <ComposeScreen section="apothecary" go={go} startBrew={startBrew} savedBlendIds={savedBlendIds} favoriteBlendIds={favoriteBlendIds} generatedBlends={generatedBlends} hiddenBlendIds={hiddenBlendIds} deleteBlend={deleteBlend} unhideBlend={unhideBlend} saveComposedBlend={saveComposedBlend} openBlend={openBlend} composePreselect={composePreselect} composeView={composeView} openInCompose={openInCompose} pantryIds={pantryIds} togglePantry={togglePantry} sessions={sessions} journalEntries={journalEntries} addJournalEntry={addJournalEntry} deleteJournalEntry={deleteJournalEntry} plannerItems={plannerItems} addPlannerItem={addPlannerItem} togglePlannerItem={togglePlannerItem} editPlannerItem={editPlannerItem} deletePlannerItem={deletePlannerItem} clearDonePlannerItems={clearDonePlannerItems} profile={profile} tabVisits={tabVisits} elementalsDisabled={elementalsDisabled} omenShown={omenShown} dismissOmen={() => setOmenShown(true)} seenElementalIds={seenElementalIds} setSeenElementalIds={setSeenElementalIds} featuredElementals={featuredElementals} setFeaturedElementals={setFeaturedElementals} bestiaryHintShown={bestiaryHintShown} dismissBestiaryHint={() => setBestiaryHintShown(true)} composeHintShown={composeHintShown} dismissComposeHint={() => setComposeHintShown(true)} journalHintShown={journalHintShown} dismissJournalHint={() => setJournalHintShown(true)} />}
        {tab === "shelf" && <ComposeScreen section="shelf" go={go} startBrew={startBrew} savedBlendIds={savedBlendIds} favoriteBlendIds={favoriteBlendIds} generatedBlends={generatedBlends} hiddenBlendIds={hiddenBlendIds} deleteBlend={deleteBlend} unhideBlend={unhideBlend} saveComposedBlend={saveComposedBlend} openBlend={openBlend} composePreselect={composePreselect} composeView={composeView} openInCompose={openInCompose} pantryIds={pantryIds} togglePantry={togglePantry} sessions={sessions} journalEntries={journalEntries} addJournalEntry={addJournalEntry} deleteJournalEntry={deleteJournalEntry} plannerItems={plannerItems} addPlannerItem={addPlannerItem} togglePlannerItem={togglePlannerItem} editPlannerItem={editPlannerItem} deletePlannerItem={deletePlannerItem} clearDonePlannerItems={clearDonePlannerItems} profile={profile} tabVisits={tabVisits} elementalsDisabled={elementalsDisabled} omenShown={omenShown} dismissOmen={() => setOmenShown(true)} seenElementalIds={seenElementalIds} setSeenElementalIds={setSeenElementalIds} featuredElementals={featuredElementals} setFeaturedElementals={setFeaturedElementals} bestiaryHintShown={bestiaryHintShown} dismissBestiaryHint={() => setBestiaryHintShown(true)} composeHintShown={composeHintShown} dismissComposeHint={() => setComposeHintShown(true)} journalHintShown={journalHintShown} dismissJournalHint={() => setJournalHintShown(true)} pantryHintShown={pantryHintShown} dismissPantryHint={() => setPantryHintShown(true)} />}
        {tab === "profile" && <ProfileScreen go={go} sessions={sessions} savedBlendIds={savedBlendIds} pantryIds={pantryIds} seedMode={seedMode} setSeedMode={setSeedMode} profile={profile} setProfile={setProfile} resetEverything={resetEverything} isDev={isDev} elementalsDisabled={elementalsDisabled} setElementalsDisabled={setElementalsDisabled} profileHintShown={profileHintShown} dismissProfileHint={() => setProfileHintShown(true)} journalEntries={journalEntries} tabVisits={tabVisits} />}
      </div>

      {/* First-visit welcome hint — anchored just above the tab bar
          on Home for new users. Single OK button dismisses. */}
      {tab === "home"
        && profile
        && !firstCupHintShown
        && sessions.filter(s => s.who === "you").length === 0 && (
        <FirstCupHintCard onDismiss={() => setFirstCupHintShown(true)} />
      )}

      <TabBar tab={tab} setTab={(k) => { setOverlay(null); setTab(k); }} />

      {overlay === "steep" && session && (
        <SteepScreen
          blend={session.blend}
          intent={session.intent}
          setIntent={(v) => setSession(s => s ? { ...s, intent: v } : s)}
          targetMoods={session.targetMoods}
          setTargetMoods={(v) => setSession(s => s ? { ...s, targetMoods: v } : s)}
          currentMoods={session.currentMoods || []}
          setCurrentMoods={(v) => setSession(s => s ? { ...s, currentMoods: v } : s)}
          sessions={sessions}
          pantryIds={pantryIds}
          togglePantry={togglePantry}
          plannerItems={plannerItems}
          addPlannerItem={addPlannerItem}
          togglePlannerItem={togglePlannerItem}
          editPlannerItem={editPlannerItem}
          deletePlannerItem={deletePlannerItem}
          clearDonePlannerItems={clearDonePlannerItems}
          onDone={() => setOverlay("log")}
          onCancel={() => { setOverlay(null); setSession(null); }}
        />
      )}
      {overlay === "log" && session && (
        <LogScreen
          blend={session.blend}
          intent={session.intent}
          targetMoods={session.targetMoods}
          currentMoods={session.currentMoods}
          onSubmit={(logData) => {
            addSession({
              blend: session.blend,
              intent: session.intent,
              targetMoods: session.targetMoods,
              currentMoods: session.currentMoods,
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
          ingredientHintShown={ingredientHintShown}
          dismissIngredientHint={() => setIngredientHintShown(true)}
        />
      )}
      {overlay === "blend" && blendOverlayId && (
        <BlendDetail
          blendId={blendOverlayId}
          isFavorite={favoriteBlendIds.has(blendOverlayId)}
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

