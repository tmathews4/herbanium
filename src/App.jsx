import React, { useState, useEffect, useRef } from "react";
import { theme, ff } from "./theme";
import { UnitContext } from "./units/units";
import {
  SEED_MODES, materializeSeedSessions,
  materializeSeedJournalEntries, materializeSeedPlannerItems,
} from "./data/seeds";
import { Sprig, Flower, Leaf, Kettle, Ornament } from "./components/icons";
import { DemoHint } from "./components/DemoHint";
import { FirstCupHintCard } from "./components/FirstCupHintCard";
// Screens
import { HomeScreen } from "./screens/HomeScreen";
import { ComposeScreen, ComposeTutorialOverlay } from "./screens/ComposeScreen";
import { SteepScreen } from "./screens/SteepScreen";
import { LogScreen } from "./screens/LogScreen";
import { IngredientDetail } from "./screens/IngredientDetail";
import { BlendDetail } from "./screens/BlendDetail";
import { CupDetail } from "./screens/CupDetail";
import { EntryDetail } from "./screens/EntryDetail";
import { ProfileScreen } from "./screens/ProfileScreen";
import { OnboardingScreen } from "./screens/OnboardingScreen";
// Helpers
import { getBlend, LOCAL_BLENDS } from "./helpers/misc";
import { pickSeedBlends, ONBOARDING_PANTRY } from "./helpers/onboarding";
import { generateCreationTitle } from "./data/creationTitle";
import { maybeRollWild } from "./data/wildElementals";
import { computeMoodCrystal } from "./data/moodCrystal";
import { configureStatusBar, hapticTap } from "./helpers/native";
// Hooks
import { usePersistedState, resetAllPersistedState } from "./hooks/usePersistedState";

/* ──────────────────────────────────────────────────────────────
   Herbanium — interactive mock
   Aesthetic: warm paper / apothecary journal
   ────────────────────────────────────────────────────────────── */

/* ──────────────────────────────────────────────────────────────
   Tab bar
   ────────────────────────────────────────────────────────────── */

const TabBar = ({ tab, setTab, apothecaryMode, shelfMode, setApothecaryModeAction, setShelfModeAction }) => {
  const tabs = [
    { k: "home",     label: "Home",     icon: <Kettle size={18} /> },
    { k: "apothecary", label: "Apothecary", icon: <Flower size={18} /> },
    { k: "shelf",      label: "Shelf",      icon: <Leaf size={18} /> },
    { k: "profile",  label: "Profile",  icon: <Sprig size={18} /> },
  ];

  // Sub-tabs live inside the same dock as the main tabs and only show
  // up when the user's on a section that has them. They share the
  // dock's background so the whole bottom bar reads as one GUI unit.
  const subTabs = tab === "apothecary"
    ? [["reverse", "Blend"], ["forward", "Vibe"], ["compendium", "Compendium"]]
    : tab === "shelf"
      ? [["recipes", "Recipes"], ["journal", "Journal"], ["pantry", "Cabinet"]]
      : null;
  const subActive = tab === "apothecary" ? apothecaryMode
                  : tab === "shelf"      ? shelfMode
                  : null;
  const onSubClick = tab === "apothecary" ? setApothecaryModeAction
                   : tab === "shelf"      ? setShelfModeAction
                   : null;

  return (
    <div style={{
      flexShrink: 0,
      // Translucent ivory dock — composes from --ivory-rgb so the
      // bottom bar swaps to a warm-dark in prefers-color-scheme: dark
      // instead of staying cream over the dark page.
      background: "rgba(var(--ivory-rgb),0.94)",
      backdropFilter: "blur(8px)",
      borderTop: `1px solid ${theme.rule}`,
    }}>
      {subTabs && onSubClick && (
        <div style={{
          display: "grid",
          gridTemplateColumns: `repeat(${subTabs.length}, 1fr)`,
          gap: 4,
          padding: "8px 12px 0",
          borderBottom: `1px solid ${theme.ruleSoft}`,
        }}>
          {subTabs.map(([k, label]) => {
            const active = subActive === k;
            return (
              <button key={k} onClick={() => onSubClick(k)} style={{
                background: "transparent", border: "none", cursor: "pointer",
                padding: "6px 4px 8px",
                fontFamily: ff.sans, fontSize: 12, letterSpacing: "0.01em",
                fontWeight: active ? 600 : 500,
                color: active ? theme.terra : theme.inkSoft,
                borderBottom: active
                  ? `2px solid ${theme.terra}`
                  : `2px solid transparent`,
                marginBottom: -1,
                transition: "color 0.2s ease, border-color 0.2s ease",
              }}>{label}</button>
            );
          })}
        </div>
      )}
      <div style={{
        // Bottom padding honors iOS home-indicator + Android gesture-pill
        // safe area when wrapped in Capacitor; falls back to 22px on web
        // and on devices without an inset.
        padding: "10px 12px max(22px, env(safe-area-inset-bottom))",
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
            transition: "color 0.2s ease",
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
        // Honor the notch / status-bar inset when wrapped in Capacitor.
        // No-op on web where the inset is 0.
        paddingTop: "env(safe-area-inset-top)",
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
  const urlHasDev = typeof window !== "undefined"
    && new URLSearchParams(window.location.search).has("dev");

  // Profile: null until onboarded. { name, timeOfDay, draw, createdAt }
  const [profile, setProfile] = usePersistedState("profile", null);

  // Persisted dev-mode toggle — flipped on by tapping the version
  // footer in Profile five times to reveal the toggle. Lets the
  // native WebView wrap (which has no URL bar for ?dev) get to the
  // same dev surfaces as the web build.
  const [devModeEnabled, setDevModeEnabled] = usePersistedState("devModeEnabled", false);
  const isDev = urlHasDev || devModeEnabled;

  // Configure native shell once on mount — tints the system status
  // bar to match the ivory background. No-op on web.
  useEffect(() => {
    configureStatusBar();
  }, []);

  // Dev modes pin the palette to light so we can spot-check the cream
  // register on a phone that's stuck in system dark mode without
  // toggling the OS theme. Pairs with :root:not(.force-light) in CSS.
  useEffect(() => {
    document.documentElement.classList.toggle("force-light", isDev);
  }, [isDev]);

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
  const [overlay, setOverlay] = useState(null); // null | "steep" | "log" | "ingredient" | "blend" | "cup" | "entry"
  const [ingredientId, setIngredientId] = useState("chamomile");
  // Overlay history stack — back-button returns to the previous
  // overlay rather than dropping the user all the way out. Supports
  // mobile expectations: blend → tap ingredient → back returns to
  // the blend instead of closing both overlays.
  const [overlayHistory, setOverlayHistory] = useState([]);
  const pushOverlayHistory = (kind, payload = {}) => {
    setOverlayHistory(prev => [...prev, { kind, ...payload }]);
  };
  const popOverlayHistory = () => {
    setOverlayHistory(prev => {
      if (prev.length === 0) {
        setOverlay(null);
        return prev;
      }
      const next = prev.slice(0, -1);
      const top = next[next.length - 1];
      if (top) {
        if (top.kind === "ingredient" && top.ingredientId) setIngredientId(top.ingredientId);
        if (top.kind === "blend" && top.blendId) setBlendOverlayId(top.blendId);
        if (top.kind === "cup" && top.sessionId) setCupOverlayId(top.sessionId);
        if (top.kind === "entry" && top.entryId) setEntryOverlayId(top.entryId);
        setOverlay(top.kind);
      } else {
        setOverlay(null);
      }
      return next;
    });
  };
  const clearOverlayHistory = () => setOverlayHistory([]);
  const [blendOverlayId, setBlendOverlayId] = useState(null);
  const [cupOverlayId, setCupOverlayId] = useState(null);
  const [entryOverlayId, setEntryOverlayId] = useState(null);
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
      // Browser/system back: pop one level instead of dropping
      // out of the overlay stack entirely.
      popOverlayHistory();
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
  // Persist the dev seed selection so a reload doesn't silently bounce
  // the user from "mid" back to "power." Important for testing flows
  // that depend on a specific seed (e.g. the mid-journey pending-mood
  // cup that demos the Home follow-up card).
  const [seedMode, setSeedMode] = usePersistedState("seedMode", "power");

  // Dev-seed version — bump when the power seed shape changes so users
  // with stale persisted data get refreshed. Without this, an existing
  // dev session keeps its old "y1"-"y9" sessions even after we ship a
  // richer seed, because usePersistedState rehydrates from localStorage.
  // Bumped to "7" after fixing the mid-journey seed to reference
  // real blend IDs (all-heal, hojicha-evening) instead of stale
  // synth IDs (dusk, hearth) that getBlend can't resolve. Without
  // a version bump the user keeps seeing empty session rows because
  // their persisted sessions hold IDs that render to null.
  const SEED_VERSION = "7";
  const [seedVersion, setSeedVersion] = usePersistedState("seedVersion", null);

  // Apply a seed mode in full — covers every persisted flow state
  // we've added since the seeds were first authored. Hint flags,
  // bestiary state, planner, journal entries, tab visits, etc.
  // all reset alongside the original sessions/blends/pantry so the
  // dev seed faithfully represents the user's place in the app.
  const applySeedMode = (mode) => {
    if (!mode) return;
    setSessions(materializeSeedSessions(mode.sessions));
    // Freshly-onboarded seeds derive saved/favorites/pantry from the same
    // helpers handleOnboardingComplete uses, so the dev "new" mode stays
    // a faithful mirror of what a real user sees right after sign-up
    // rather than drifting as the onboarding logic evolves.
    if (mode.freshlyOnboarded) {
      const seedBlendIds = pickSeedBlends({
        timeOfDay: mode.profile?.timeOfDay,
        draw: mode.profile?.draw,
      });
      setSavedBlendIds(new Set(seedBlendIds));
      setFavoriteBlendIds(new Set(seedBlendIds));
      setPantryIds(new Set(ONBOARDING_PANTRY));
      setFavoritesMigrated(true);
    } else {
      setSavedBlendIds(new Set(mode.savedBlendIds || []));
      setFavoriteBlendIds(new Set(mode.favoriteBlendIds || []));
      setPantryIds(new Set(mode.pantryIds || []));
      setFavoritesMigrated(!!mode.favoritesMigrated);
    }
    setGeneratedBlends(mode.generatedBlends || []);
    setJournalEntries(materializeSeedJournalEntries(mode.journalEntries));
    setPlannerItems(materializeSeedPlannerItems(mode.plannerItems));
    setTabVisits(mode.tabVisits || {});
    setSeenElementalIds(new Set(mode.seenElementalIds || []));
    setFeaturedElementals(mode.featuredElementals || []);
    setWildElementals(mode.wildElementals || []);
    setLastWildAt(mode.lastWildAt || 0);
    setOmenShown(!!mode.omenShown);
    setElementalsDisabled(!!mode.elementalsDisabled);
    const hints = mode.hints || {};
    setFirstCupHintShown(!!hints.firstCupHintShown);
    setComposeHintShown(!!hints.composeHintShown);
    setJournalHintShown(!!hints.journalHintShown);
    setProfileHintShown(!!hints.profileHintShown);
    setPantryHintShown(!!hints.pantryHintShown);
    setBestiaryHintShown(!!hints.bestiaryHintShown);
    setIngredientHintShown(!!hints.ingredientHintShown);
    if (mode.profile) {
      setProfile(prev => {
        const merged = {
          ...(prev || {}),
          ...mode.profile,
          isDev: true,
          createdAt: prev?.createdAt || Date.now(),
        };
        if (mode.freshlyOnboarded) {
          merged.title = generateCreationTitle(merged);
          merged.synthsVersion = "3";
        }
        return merged;
      });
    }
    setSeedVersion(SEED_VERSION);
  };

  // When seed mode changes (dev only), reset the varying state to
  // snapshot. Also force-resets if the persisted seedVersion doesn't
  // match the current code version.
  useEffect(() => {
    if (!isDev) return;
    applySeedMode(SEED_MODES[seedMode]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seedMode, isDev]);

  // First-mount stale-data guard: if dev and persisted seedVersion is
  // older than the code's, reapply the current seed mode immediately.
  useEffect(() => {
    if (!isDev) return;
    if (seedVersion === SEED_VERSION) return;
    applySeedMode(SEED_MODES[seedMode]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
  // Home seeded-favorites notice — appears once on Home after onboarding
  // to flag that the starter blends in Recipes were added by us, not
  // brewed/saved by the user. Dismissed for good once acknowledged.
  const [seededFavoritesNoticeShown, setSeededFavoritesNoticeShown] = usePersistedState("seededFavoritesNoticeShown", false);
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
  // Wild elementals — chance-rolled spirits earned ad-hoc on brews
  // and journal entries (1/15 per event, throttled to one per week).
  // Stored as full objects (id, displayName, creature, rarity, desc,
  // ts) so they're self-contained and don't depend on the attribute
  // evaluator. Read-and-merged into the bestiary alongside earned attrs.
  const [wildElementals, setWildElementals] = usePersistedState("wildElementals", []);
  const [lastWildAt, setLastWildAt] = usePersistedState("lastWildAt", 0);
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

  // Sub-tab modes for Apothecary and Shelf. Lifted to App so the
  // TabBar can render them as a row inside the bottom dock — both
  // surfaces (sub-tab strip + main tabs) belong to the same GUI unit.
  // Persisted so each parent tab remembers which child sub-tab the
  // user was last on. Switching apothecary ↔ shelf preserves the
  // other side's last position, and a full reload doesn't drop the
  // user back to defaults if they were mid-flow on a sub-tab.
  const [apothecaryMode, setApothecaryMode] = usePersistedState("apothecaryMode", "reverse");
  const [shelfMode, setShelfMode]           = usePersistedState("shelfMode", "recipes");

  // Tab navigation history. Every tab change pushes the previous
  // tab onto the stack so the back button can return to whatever
  // tab the user actually came from, not a hardcoded parent. Mode
  // changes within a tab don't push (they're sub-views, not tab
  // jumps). Stack stores at most the last few tabs to avoid
  // unbounded growth.
  const [tabHistory, setTabHistory] = useState([]);
  const navigateTab = (next) => {
    if (next === tab) return;
    // Home is the root of the navigation tree. Arriving at it clears
    // any prior tab history so the back button never offers a path
    // "further back than home" — the user's expectation is that home
    // is the floor, and tapping it should always feel like a reset.
    if (next === "home") {
      setTabHistory([]);
    } else {
      setTabHistory(prev => {
        const trimmed = prev.length >= 8 ? prev.slice(-7) : prev;
        return [...trimmed, tab];
      });
    }
    setTab(next);
  };
  const goBack = () => {
    if (overlayHistory.length > 0) {
      popOverlayHistory();
      return;
    }
    if (tabHistory.length > 0) {
      const prev = tabHistory[tabHistory.length - 1];
      setTabHistory(h => h.slice(0, -1));
      setTab(prev);
      return;
    }
    // No history — fall back to home if we're not already there.
    if (tab !== "home") setTab("home");
  };
  // Home is the root — even if a stale history slipped past
  // navigateTab's reset, never expose "back" to the user from home.
  const canGoBack =
    overlayHistory.length > 0
    || (tab !== "home" && tabHistory.length > 0)
    || tab !== "home";
  const [catalogueFilter, setCatalogueFilter] = useState("all");
  const setApothecaryModeAction = (k) => setApothecaryMode(k);
  const setShelfModeAction = (k) => {
    // Manual click on Recipes resets the catalogue filter to "all" so
    // the user sees the full stock by default; deep-links via
    // composePreselect can still flip it to "favorites" downstream.
    if (k === "recipes" && shelfMode !== "recipes") setCatalogueFilter("all");
    setShelfMode(k);
  };

  const go = (to, arg) => {
    if (to === "ingredient") {
      if (arg) setIngredientId(arg);
      pushOverlayHistory("ingredient", { ingredientId: arg || ingredientId });
      setOverlay("ingredient");
      return;
    }
    if ((to === "apothecary" || to === "shelf") && arg && typeof arg === "object") {
      // Tag composeView with its target section so the deep-link
      // state only applies to the section it was meant for. Without
      // this tag, a go("shelf", { mode: "journal" }) call would
      // also push apothecaryMode to "journal" the next time the
      // user lands on Apothecary, since both section instances of
      // ComposeScreen read the same composeView on mount.
      setComposeView({ ...arg, section: to, at: Date.now() });
    }
    navigateTab(to);
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
    pushOverlayHistory("blend", { blendId });
    setOverlay("blend");
  };

  // Open the journal entry for a single brewed cup. Replaces the
  // previous "tap a cup row → recipe" jump; the cup detail screen
  // shows mood/flavor results, ratings, and notes, with the blend
  // name in its header acting as the link to the recipe view.
  const openCup = (sessionId) => {
    if (!sessionId) return;
    setCupOverlayId(sessionId);
    pushOverlayHistory("cup", { sessionId });
    setOverlay("cup");
  };

  // Open a free-form journal entry (entry / haiku / limerick) in
  // its own detail screen. Replaces the inline-expand row pattern
  // so all journal rows behave the same way: tap → dedicated page.
  const openEntry = (entryId) => {
    if (!entryId) return;
    setEntryOverlayId(entryId);
    pushOverlayHistory("entry", { entryId });
    setOverlay("entry");
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
  // Wild-elemental roll. Called from every brew and journal entry.
  // Honors the elementalsDisabled preference (no rolls for users who
  // turned the mythic layer off) and the once-per-week throttle. On
  // a hit, the new spirit is appended to wildElementals and lastWildAt
  // is bumped. The bestiary surfaces it via the existing arrival flow
  // (id won't be in seenElementalIds, so it queues up naturally).
  const tryRollWildElemental = () => {
    if (elementalsDisabled) return;
    // Crystal name is included in the wild's `desc` so the arrival
    // card closes the loop on the bestiary's lead crystal — the
    // same signal that biased this roll. Computed inline rather
    // than read from a memo so the name reflects the activity
    // state the roller saw, not a stale render.
    const crystal = computeMoodCrystal({
      sessions, journalEntries, getBlend, profile,
    });
    const wild = maybeRollWild({
      lastWildAt,
      sessions,
      journalEntries,
      getBlend,
      crystalName: crystal.isNeutral ? null : crystal.name,
    });
    if (!wild) return;
    setWildElementals(prev => [...(prev || []), wild]);
    setLastWildAt(wild.ts);
  };

  const addSession = ({
    blend, intent, targetMoods, currentMoods,
    flavorsTasted, flavorsExtra, flavorsTarget,
    taste, note, save, rename,
  }) => {
    // A blend composed via forward-compose won't have an id; stash it under
    // a synthetic id so the session can reference it via getBlend().
    let blendId = blend.id;
    if (!blendId) {
      blendId = `local-${Date.now()}`;
      const finalName = (rename && rename.length > 0) ? rename : blend.name;
      const persisted = { ...blend, id: blendId, name: finalName, experimental: true };
      LOCAL_BLENDS[blendId] = persisted;
      setGeneratedBlends(prev => [...(prev || []), persisted]);
    }

    // Mood is intentionally NOT logged at brew-time — the user can't
    // assess it yet. The session is created in a "moodsPending" state
    // and the Home screen's MoodFollowUp card walks them through
    // landed/missed on next app open. Until then, `actual` stays the
    // "brewed" placeholder so existing readers (HomeScreen,
    // attributes.js, BlendDetail) treat it as "no mood data yet."
    const newSession = {
      id: `sess-${Date.now()}`,
      who: "you",
      blendId,
      ago: "just now",
      intent: intent || "",
      currentMoods: currentMoods || [],
      // Mood fields — empty at brew-time, filled by patchSessionMoods.
      actual: "brewed",
      landed: {},
      extra: [],
      moodsPending: true,
      // Snapshot of the moods the user originally aimed for, so the
      // follow-up card knows which checkboxes to render.
      targetMoods: targetMoods || [],
      brewedAt: Date.now(),
      // Flavor fields — what the user just verified at first sip.
      flavorsTasted: flavorsTasted || {},
      flavorsExtra:  flavorsExtra  || [],
      flavorsTarget: flavorsTarget || [],
      taste: taste ?? 4,
      note: note || "",
      // Capture the user's actual brew settings — the explorer
      // sliders may have moved the temp/time off the blend's
      // curated defaults, and downstream views want what the user
      // actually did, not the recipe spec.
      tempC: blend.tempC,
      timeS: blend.timeS,
    };

    setSessions(prev => [newSession, ...prev]);

    if (save && !savedBlendIds.has(blendId)) {
      const next = new Set(savedBlendIds);
      next.add(blendId);
      setSavedBlendIds(next);
    }

    hapticTap();
    tryRollWildElemental();
  };

  // Patch a pending session with mood data once the user fills in the
  // follow-up. Recomputes `actual` the same way the prior brew-time
  // log did so downstream readers (HomeScreen mood arrow, the
  // attributes/elementals scoring code that scans `s.actual`) get the
  // mood string they expect. Clears moodsPending so the follow-up
  // card stops asking.
  //
  // The follow-up may also carry a `noteAppend` — anything the user
  // jotted in the textarea below the mood pills. We merge it onto the
  // session's existing brew-time note with a paragraph break so the
  // single `note` field on the session reads as a small two-act log:
  // first sip impressions on top, post-cup reflection underneath.
  const patchSessionMoods = (sessionId, { landed, extra, noteAppend }) => {
    setSessions(prev => prev.map(s => {
      if (s.id !== sessionId) return s;
      const targetMoods = s.targetMoods || [];
      const landedMoods = targetMoods.filter(m => landed?.[m]);
      const extraMoods = extra || [];
      const actual = landedMoods.length > 0 ? landedMoods.join(", ")
                   : extraMoods.length > 0 ? extraMoods.join(", ")
                   : "brewed";
      const trimmedAppend = (noteAppend || "").trim();
      const mergedNote = trimmedAppend
        ? (s.note && s.note.trim()
            ? `${s.note.trim()}\n\n${trimmedAppend}`
            : trimmedAppend)
        : (s.note || "");
      return {
        ...s,
        actual,
        landed: landed || {},
        extra: extraMoods,
        note: mergedNote,
        moodsPending: false,
      };
    }));
    hapticTap();
  };

  // Skip a mood follow-up — user dismissed without filling. Clears
  // moodsPending so the card doesn't reappear, but leaves `actual`
  // as the "brewed" placeholder. The session still counts in the log.
  const dismissSessionMoods = (sessionId) => {
    setSessions(prev => prev.map(s =>
      s.id === sessionId ? { ...s, moodsPending: false } : s
    ));
  };

  // Append a free-form journal entry. Entries live alongside cup
  // sessions in the chronology and render via JournalEntryRow on the
  // Compose · Shelf · Journal tab.
  const addJournalEntry = (text, kind, note, currentMoods, landedMoods, flavors) => {
    if (!text || !text.trim()) return;
    const validKind =
      kind === "haiku" ? "haiku"
      : kind === "limerick" ? "limerick"
      : kind === "poem" ? "poem"
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
      // Flavor selections — family-aligned chips from the same
      // master register the strip uses. Optional per entry.
      flavors:      Array.isArray(flavors) ? flavors : [],
    };
    setJournalEntries(prev => [entry, ...(prev || [])]);
    tryRollWildElemental();
  };
  const deleteJournalEntry = (id) => {
    setJournalEntries(prev => (prev || []).filter(e => e.id !== id));
  };

  // Open Compose with a blend pre-selected — used when user taps a favorite
  // on Home or a saved blend, opens Shelf · Recipe Book with the favorite
  // highlighted, ready to set intent and brew.
  const openInCompose = (blendId) => {
    setComposePreselect({ blendId, at: Date.now() });
    navigateTab("shelf");
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
    hapticTap();
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
      {/* Top chrome bar — fixed-height layer above the scroll area
          so HintCards, notifications, and tab content can't drift
          underneath the back button. Houses the global back button
          today; reserved-space layout means future controls (page
          title, profile menu, search, etc.) can drop in without
          shifting the rest of the app.
          Bar always renders so content height stays stable across
          tab switches; just the back button visibility toggles. */}
      <div style={{
        flex: "0 0 auto",
        height: 40,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 14px",
        borderBottom: `1px solid ${theme.ruleSoft}`,
        background: theme.ivory,
        zIndex: 10,
      }}>
        <div style={{ flex: "0 0 auto", minWidth: 70 }}>
          {canGoBack && !overlay && (
            <button
              type="button"
              onClick={goBack}
              style={{
                background: "transparent", border: "none",
                padding: "6px 4px", cursor: "pointer",
                fontFamily: "Instrument Sans, system-ui, sans-serif",
                fontSize: 12, letterSpacing: "0.12em",
                textTransform: "uppercase", color: theme.ash,
                outline: "none",
              }}
            >← back</button>
          )}
        </div>
        {/* Reserved center slot for a future page title. */}
        <div style={{ flex: 1 }} />
        {/* Reserved right slot for future controls (search, profile
            menu, etc). Empty for now but kept symmetric so the back
            button anchors to the left edge cleanly. */}
        <div style={{ flex: "0 0 auto", minWidth: 70, textAlign: "right" }} />
      </div>
      <div ref={scrollRef} style={{
        flex: "1 1 auto", minHeight: 0,
        overflowY: "auto",
        overflowX: "hidden",
        position: "relative",
      }}>
        {tab === "home"    && <HomeScreen   go={go} openBlend={openBlend} openCup={openCup} openInCompose={openInCompose} sessions={sessions} savedBlendIds={savedBlendIds} favoriteBlendIds={favoriteBlendIds} profile={profile} elementalsDisabled={elementalsDisabled} seededFavoritesNoticeShown={seededFavoritesNoticeShown} dismissSeededFavoritesNotice={() => setSeededFavoritesNoticeShown(true)} patchSessionMoods={patchSessionMoods} dismissSessionMoods={dismissSessionMoods} addJournalEntry={addJournalEntry} journalEntries={journalEntries} />}
        {tab === "apothecary" && <ComposeScreen section="apothecary" go={go} startBrew={startBrew} savedBlendIds={savedBlendIds} favoriteBlendIds={favoriteBlendIds} generatedBlends={generatedBlends} hiddenBlendIds={hiddenBlendIds} deleteBlend={deleteBlend} unhideBlend={unhideBlend} saveComposedBlend={saveComposedBlend} openBlend={openBlend} openCup={openCup} openEntry={openEntry} composePreselect={composePreselect} composeView={composeView} openInCompose={openInCompose} pantryIds={pantryIds} togglePantry={togglePantry} sessions={sessions} journalEntries={journalEntries} addJournalEntry={addJournalEntry} deleteJournalEntry={deleteJournalEntry} plannerItems={plannerItems} addPlannerItem={addPlannerItem} togglePlannerItem={togglePlannerItem} editPlannerItem={editPlannerItem} deletePlannerItem={deletePlannerItem} clearDonePlannerItems={clearDonePlannerItems} profile={profile} tabVisits={tabVisits} elementalsDisabled={elementalsDisabled} omenShown={omenShown} dismissOmen={() => setOmenShown(true)} seenElementalIds={seenElementalIds} setSeenElementalIds={setSeenElementalIds} featuredElementals={featuredElementals} setFeaturedElementals={setFeaturedElementals} wildElementals={wildElementals} mode={apothecaryMode} setMode={setApothecaryMode} setModeUserAction={setApothecaryModeAction} catalogueFilter={catalogueFilter} setCatalogueFilter={setCatalogueFilter} bestiaryHintShown={bestiaryHintShown} dismissBestiaryHint={() => setBestiaryHintShown(true)} composeHintShown={composeHintShown} dismissComposeHint={() => setComposeHintShown(true)} journalHintShown={journalHintShown} dismissJournalHint={() => setJournalHintShown(true)} />}
        {tab === "shelf" && <ComposeScreen section="shelf" go={go} startBrew={startBrew} savedBlendIds={savedBlendIds} favoriteBlendIds={favoriteBlendIds} generatedBlends={generatedBlends} hiddenBlendIds={hiddenBlendIds} deleteBlend={deleteBlend} unhideBlend={unhideBlend} saveComposedBlend={saveComposedBlend} openBlend={openBlend} openCup={openCup} openEntry={openEntry} composePreselect={composePreselect} composeView={composeView} openInCompose={openInCompose} pantryIds={pantryIds} togglePantry={togglePantry} sessions={sessions} journalEntries={journalEntries} addJournalEntry={addJournalEntry} deleteJournalEntry={deleteJournalEntry} plannerItems={plannerItems} addPlannerItem={addPlannerItem} togglePlannerItem={togglePlannerItem} editPlannerItem={editPlannerItem} deletePlannerItem={deletePlannerItem} clearDonePlannerItems={clearDonePlannerItems} profile={profile} tabVisits={tabVisits} elementalsDisabled={elementalsDisabled} omenShown={omenShown} dismissOmen={() => setOmenShown(true)} seenElementalIds={seenElementalIds} setSeenElementalIds={setSeenElementalIds} featuredElementals={featuredElementals} setFeaturedElementals={setFeaturedElementals} wildElementals={wildElementals} mode={shelfMode} setMode={setShelfMode} setModeUserAction={setShelfModeAction} catalogueFilter={catalogueFilter} setCatalogueFilter={setCatalogueFilter} bestiaryHintShown={bestiaryHintShown} dismissBestiaryHint={() => setBestiaryHintShown(true)} composeHintShown={composeHintShown} dismissComposeHint={() => setComposeHintShown(true)} journalHintShown={journalHintShown} dismissJournalHint={() => setJournalHintShown(true)} pantryHintShown={pantryHintShown} dismissPantryHint={() => setPantryHintShown(true)} />}
        {tab === "profile" && <ProfileScreen go={go} openCup={openCup} sessions={sessions} savedBlendIds={savedBlendIds} pantryIds={pantryIds} seedMode={seedMode} setSeedMode={setSeedMode} profile={profile} setProfile={setProfile} resetEverything={resetEverything} isDev={isDev} devModeEnabled={devModeEnabled} setDevModeEnabled={setDevModeEnabled} elementalsDisabled={elementalsDisabled} setElementalsDisabled={setElementalsDisabled} profileHintShown={profileHintShown} dismissProfileHint={() => setProfileHintShown(true)} journalEntries={journalEntries} tabVisits={tabVisits} wildElementals={wildElementals} />}
      </div>

      {/* First-visit welcome hint — anchored just above the tab bar
          on Home for new users. Single OK button dismisses. */}
      {tab === "home"
        && profile
        && !firstCupHintShown
        && sessions.filter(s => s.who === "you").length === 0 && (
        <FirstCupHintCard onDismiss={() => setFirstCupHintShown(true)} />
      )}

      {/* Apothecary / Shelf first-visit tutorial — floats just above
          the TabBar dock, sharing its layer so the card reads as
          part of the menu strip rather than buried in the screen
          scroll. Sits flex-pinned between the screen content and
          the TabBar so it never gets cropped or detached on scroll. */}
      <ComposeTutorialOverlay
        section={tab === "apothecary" ? "apothecary" : tab === "shelf" ? "shelf" : null}
        composeHintShown={composeHintShown}
        dismissComposeHint={() => setComposeHintShown(true)}
      />

      <TabBar
        tab={tab}
        setTab={(k) => { setOverlay(null); clearOverlayHistory(); navigateTab(k); }}
        apothecaryMode={apothecaryMode}
        shelfMode={shelfMode}
        setApothecaryModeAction={setApothecaryModeAction}
        setShelfModeAction={setShelfModeAction}
      />

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
          onCancel={() => { setOverlay(null); clearOverlayHistory(); setSession(null); }}
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
            clearOverlayHistory();
            setSession(null);
            setTab("home");
          }}
          onCancel={() => { setOverlay(null); clearOverlayHistory(); }}
        />
      )}
      {overlay === "ingredient" && (
        <IngredientDetail
          id={ingredientId}
          onClose={popOverlayHistory}
          pantryIds={pantryIds}
          togglePantry={togglePantry}
          onOpenIngredient={(newId) => {
            pushOverlayHistory("ingredient", { ingredientId: newId });
            setIngredientId(newId);
          }}
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
          onClose={popOverlayHistory}
          onOpenIngredient={(ingId) => {
            pushOverlayHistory("ingredient", { ingredientId: ingId });
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
      {overlay === "cup" && cupOverlayId && (
        <CupDetail
          session={sessions.find(s => s.id === cupOverlayId)}
          onClose={popOverlayHistory}
          openBlend={(id) => {
            // Stack the recipe overlay on top of the cup detail so
            // back from the recipe lands the user back on the cup,
            // not on Home. Mirrors the ingredient-from-blend flow.
            pushOverlayHistory("blend", { blendId: id });
            setBlendOverlayId(id);
            setOverlay("blend");
          }}
        />
      )}
      {overlay === "entry" && entryOverlayId && (
        <EntryDetail
          entry={(journalEntries || []).find(e => e.id === entryOverlayId)}
          onClose={popOverlayHistory}
          onDelete={deleteJournalEntry}
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

