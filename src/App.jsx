import React, { useState, useEffect, useMemo, useRef } from "react";
import { theme, ff } from "./theme";
import { UnitContext } from "./units/units";
import {
  SEED_MODES, materializeSeedSessions,
  materializeSeedJournalEntries,
} from "./data/seeds";
import { Sprig, Flask, Flower, Pencil, Kettle, Ornament } from "./components/icons";
import { Button } from "./components/layout";
import { DemoHint } from "./components/DemoHint";
import { FirstCupHintCard } from "./components/FirstCupHintCard";
// Screens
import { HomeScreen } from "./screens/HomeScreen";
import { ComposeScreen, ComposeTutorialOverlay } from "./screens/ComposeScreen";
import { SteepScreen } from "./screens/SteepScreen";
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
import { buildAttributeContext, evaluateAttributes, ATTRIBUTES } from "./data/attributes";
import { rollOnAction, legacyEarnedIds } from "./data/elementalRoller";
import { configureStatusBar, hapticTap, scheduleCheckInNotification, cancelCheckInNotification } from "./helpers/native";
// Hooks
import { usePersistedState, resetAllPersistedState } from "./hooks/usePersistedState";
import { useAppBackNav } from "./hooks/useAppBackNav";

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
    { k: "apothecary", label: "Apothecarium", icon: <Flask size={18} /> },
    { k: "shelf",      label: "Journal",   icon: <Pencil size={18} /> },
    { k: "profile",  label: "Profile",  icon: <Sprig size={18} /> },
  ];

  // Sub-tabs live inside the same dock as the main tabs and only show
  // up when the user's on a section that has them. They share the
  // dock's background so the whole bottom bar reads as one GUI unit.
  const subTabs = tab === "apothecary"
    ? [["reverse", "Blend"], ["compendium", "Herbanium"]]
    : tab === "shelf"
      ? [["recipes", "Recipes"], ["journal", "Reflections"], ["visitors", "Field Notes"]]
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

// Build version marker — logged once on app load. Chrome://inspect
// Console will show this so we can confirm bundle freshness when
// debugging. Bumped when meaningful native-relevant CSS changes ship.
console.log("HERBANIUM_BUILD: 2026-05-07-pad-48");

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
        // Top buffer for the desktop wrapping path. Mobile takes a
        // separate isNarrow branch in App() that has its own
        // paddingTop set to match.
        boxSizing: "border-box",
        paddingTop: 80,
      }}>
        {children}
      </div>
    </div>
  );
};

/* ──────────────────────────────────────────────────────────────
   Root app
   ────────────────────────────────────────────────────────────── */

/* ──────────────────────────────────────────────────────────────
   ElementalGlimpseCard — modal that appears at the end of a brew
   when the just-logged cup has unlocked a new elemental. Soft
   centered card on a faint backdrop, glowing teacup glyph + a short
   prompt: "log it" navigates to the bestiary; "later" dismisses
   without losing the find (the bestiary's pendingArrivals list
   still has the elemental queued for the next visit).
   The teacup glow is a CSS keyframe pulse so the eye lands on it
   without the card itself feeling busy.
   ────────────────────────────────────────────────────────────── */

/* ──────────────────────────────────────────────────────────────
   ElementalGlimpseBanner — a top-of-screen ribbon that fades in
   when a freshly-rolled elemental is waiting to be noted, and
   stays visible across tab changes until the user taps it (which
   navigates to the bestiary and auto-opens the arrival card) or
   dismisses it (which leaves the elemental queued in the bestiary's
   summon list — same end state as Log button there). The banner
   replaces the older modal-card glimpse: less interrupting, easier
   to ignore, and persists across navigation so a user who's mid-
   thought when the roll lands isn't pushed off their current page.

   Animation: fade-in on mount via CSS keyframe, fade-out triggered
   by toggling the `dismissing` state which swaps the animation to
   the reverse keyframe; onClick callbacks fire after the fade
   so the screen doesn't flash a half-disappeared banner mid-route.
   ────────────────────────────────────────────────────────────── */

const ElementalGlimpseBanner = ({ onLogIt, onLater }) => {
  const [dismissing, setDismissing] = React.useState(false);
  const handle = (cb) => {
    if (dismissing) return;
    setDismissing(true);
    // Wait for the 0.32s fade-out to land before firing the callback,
    // so navigation/dismissal happens after the visual completes.
    setTimeout(() => cb && cb(), 320);
  };
  return (
    <div
      style={{
        position: "fixed",
        top: "max(12px, env(safe-area-inset-top))",
        left: 12, right: 12,
        zIndex: 70,
        display: "flex", justifyContent: "center",
        pointerEvents: "none",
        animation: dismissing
          ? "glimpseBannerOut 0.32s ease forwards"
          : "glimpseBannerIn 0.42s ease forwards",
      }}
    >
      <div
        onClick={() => handle(onLogIt)}
        role="button"
        style={{
          pointerEvents: "auto",
          width: "100%", maxWidth: 460,
          display: "flex", alignItems: "center", gap: 12,
          padding: "10px 12px",
          background: theme.cream,
          border: `1px solid ${theme.terra}`,
          borderRadius: 12,
          boxShadow: "0 6px 22px rgba(30,24,18,0.18)",
          cursor: "pointer",
        }}
      >
        {/* Pulsing crystal — small bipyramid glyph standing in for
            the lodestone's pulse. Mirrors the larger lodestone in
            the Visitors view so the banner reads as "your crystal
            is calling" — the same shape catching the same kind of
            light, just at icon scale. The interior fill pulses on
            the same 1.8s cycle as the surrounding halo. */}
        <div style={{
          flexShrink: 0,
          width: 38, height: 38,
          display: "flex", alignItems: "center", justifyContent: "center",
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(176,84,47,0.22) 0%, transparent 70%)",
          animation: "glimpseGlow 1.8s ease-in-out infinite",
        }}>
          <svg width="22" height="26" viewBox="0 0 22 26" aria-hidden>
            {/* Crystal silhouette — six-faceted bipyramid scaled down
                from the bestiary's lodestone shape so the banner
                reads as "your lodestone is pulsing" at icon size. */}
            <polygon
              points="11,2 18,8 17,18 11,24 5,18 4,8"
              fill={theme.terra}
              style={{
                animation: "glimpseCrystalPaneGlow 1.8s ease-in-out infinite",
                transformOrigin: "center",
              }}
            />
            <polygon
              points="11,2 18,8 17,18 11,24 5,18 4,8"
              fill="none" stroke={theme.terra} strokeWidth="1.6"
              strokeLinejoin="round"
            />
            {/* Inner facet edges so the shape reads as cut, not flat. */}
            <polyline
              points="4,8 11,11 18,8"
              fill="none" stroke={theme.terra} strokeOpacity="0.5"
              strokeWidth="0.9"
            />
            <line x1="11" y1="11" x2="11" y2="24"
              stroke={theme.terra} strokeOpacity="0.4" strokeWidth="0.9" />
          </svg>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontFamily: ff.sans, fontSize: 9, letterSpacing: "0.18em",
            textTransform: "uppercase", color: theme.terra,
            fontWeight: 600, marginBottom: 1,
          }}>
            your lodestone is pulsing
          </div>
          <div style={{
            fontFamily: ff.serif, fontSize: 13.5, color: theme.ink,
            lineHeight: 1.35,
          }}>
            Something stirs in the stone — <em style={{ color: theme.terra, fontStyle: "normal" }}>tap to visit</em>
          </div>
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); handle(onLater); }}
          aria-label="dismiss"
          style={{
            flexShrink: 0,
            background: "transparent", border: "none",
            color: theme.ash, fontSize: 18, lineHeight: 1,
            padding: "4px 8px", cursor: "pointer",
          }}
        >×</button>
      </div>
      <style>{`
        @keyframes glimpseBannerIn {
          from { opacity: 0; transform: translateY(-12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes glimpseBannerOut {
          from { opacity: 1; transform: translateY(0); }
          to   { opacity: 0; transform: translateY(-12px); }
        }
        @keyframes glimpseGlow {
          0%, 100% { box-shadow: 0 0 0px 0px rgba(176,84,47,0.0); }
          50%      { box-shadow: 0 0 18px 4px rgba(176,84,47,0.42); }
        }
        @keyframes glimpseCrystalPaneGlow {
          0%, 100% { fill-opacity: 0.18; }
          50%      { fill-opacity: 0.55; }
        }
      `}</style>
    </div>
  );
};

/* ──────────────────────────────────────────────────────────────
   BrewTimerBanner — top-of-screen ribbon shown while the steep
   timer is minimized. Lets the user navigate the rest of the app
   while their brew runs. Tap to restore the steep overlay; the
   timer never paused, so the countdown the banner shows is the
   same value the steep page would show on restore.
   ────────────────────────────────────────────────────────────── */

const mmssShort = (s) => {
  const total = Math.max(0, Math.round(s));
  const m = Math.floor(total / 60);
  const r = total % 60;
  return `${m}:${r.toString().padStart(2, "0")}`;
};

const BrewTimerBanner = ({ blendName, remaining, onTap }) => {
  const ready = remaining <= 0;
  return (
    <div
      style={{
        position: "fixed",
        top: "max(12px, env(safe-area-inset-top))",
        left: 12, right: 12,
        zIndex: 70,
        display: "flex", justifyContent: "center",
        pointerEvents: "none",
        animation: "brewTimerBannerIn 0.32s ease forwards",
      }}
    >
      <div
        onClick={onTap}
        role="button"
        style={{
          pointerEvents: "auto",
          width: "100%", maxWidth: 460,
          display: "flex", alignItems: "center", gap: 12,
          padding: "10px 12px",
          background: theme.cream,
          border: `1px solid ${ready ? theme.sageDeep : theme.terra}`,
          borderRadius: 12,
          boxShadow: "0 6px 22px rgba(30,24,18,0.18)",
          cursor: "pointer",
        }}
      >
        {/* Pulsing kettle while brewing; steady sage when ready. */}
        <div style={{
          flexShrink: 0,
          width: 38, height: 38,
          display: "flex", alignItems: "center", justifyContent: "center",
          borderRadius: "50%",
          background: ready
            ? "radial-gradient(circle, rgba(98,124,92,0.20) 0%, transparent 70%)"
            : "radial-gradient(circle, rgba(176,84,47,0.22) 0%, transparent 70%)",
          animation: ready
            ? "brewTimerReadyPulse 2.2s ease-in-out infinite"
            : "brewTimerActiveGlow 1.8s ease-in-out infinite",
        }}>
          <Kettle size={26} c={ready ? theme.sageDeep : theme.terra} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontFamily: ff.sans, fontSize: 9, letterSpacing: "0.18em",
            textTransform: "uppercase",
            color: ready ? theme.sageDeep : theme.terra,
            fontWeight: 600, marginBottom: 1,
          }}>
            {ready ? "ready to pour" : "brewing"}
          </div>
          <div style={{
            fontFamily: ff.serif, fontSize: 13.5, color: theme.ink,
            lineHeight: 1.35, whiteSpace: "nowrap",
            overflow: "hidden", textOverflow: "ellipsis",
          }}>
            {blendName}
          </div>
        </div>
        <div style={{
          flexShrink: 0,
          fontFamily: ff.mono, fontSize: 16, fontWeight: 600,
          color: ready ? theme.sageDeep : theme.ink,
          letterSpacing: "0.02em", paddingRight: 4,
        }}>
          {ready ? "—:—" : mmssShort(remaining)}
        </div>
      </div>
      <style>{`
        @keyframes brewTimerBannerIn {
          from { opacity: 0; transform: translateY(-12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes brewTimerActiveGlow {
          0%, 100% { box-shadow: 0 0 0px 0px rgba(176,84,47,0.0); }
          50%      { box-shadow: 0 0 18px 4px rgba(176,84,47,0.42); }
        }
        @keyframes brewTimerReadyPulse {
          0%, 100% { box-shadow: 0 0 0px 0px rgba(98,124,92,0.0); }
          50%      { box-shadow: 0 0 22px 6px rgba(98,124,92,0.55); }
        }
      `}</style>
    </div>
  );
};

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
  const [overlay, setOverlay] = useState(null); // null | "steep" | "ingredient" | "blend" | "cup" | "entry" | "glimpse"
  // End-of-brew elemental glimpse — when a freshly-logged cup unlocks
  // a new elemental, we surface a small "you glimpsed something" card
  // before sending the user home. The card invites them to navigate
  // to the bestiary to log the find. We track two pieces of state:
  //   - glimpsePendingBefore: the set of earned-elemental ids captured
  //     just before the new session was added, so the post-update
  //     useEffect can compute the diff
  //   - glimpseElemental: when set, the glimpse overlay renders. Holds
  //     the first newly-earned elemental (others queue naturally on
  //     the bestiary's pendingArrivals path)
  const [glimpsePendingBefore, setGlimpsePendingBefore] = useState(null);
  const [glimpseElemental, setGlimpseElemental] = useState(null);
  // When the user taps "Log it" on the glimpse card, we auto-open
  // that elemental's arrival card on the bestiary so the moment of
  // "the brew called something in" lands on the actual creature
  // rather than dropping the user on the bestiary index expecting
  // them to find it. Cleared by the bestiary itself once the flag
  // has been consumed (see onAutoOpenConsumed below). Skipped when
  // the user hasn't seen the omen — the creation-title intro needs
  // to play first; the bestiary's own effect handles that gating.
  const [autoOpenArrivalId, setAutoOpenArrivalId] = useState(null);
  // Steep-screen minimize state. When true, the steep overlay is
  // hidden via display:none (still mounted so the timer keeps
  // ticking and notification scheduling stays alive) and a small
  // BrewTimerBanner surfaces at the top of the screen — letting
  // users navigate the rest of the app while the brew runs. Tapping
  // the banner restores the steep overlay. SteepScreen reports its
  // current remaining seconds via onRemainingChange so the banner
  // can show a live countdown without lifting the entire timer
  // engine out of SteepScreen.
  const [steepMinimized, setSteepMinimized] = useState(false);
  const [steepRemaining, setSteepRemaining] = useState(0);
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
    // Chance-based elemental roll on tab visit. Each tab maps to its
    // own action key — different elementals live in different visit
    // pools, so opening apothecary can land an apothecarium-themed
    // creature while opening notebook lands a journal-keeper.
    tryRollOnAction(`visit:${tab}`);
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
  const SEED_VERSION = "8";
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
    setShelfHintShown(!!hints.shelfHintShown);
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
  // Shelf tutorial — separate flag so dismissing the Apothecary
  // tutorial doesn't also pre-suppress the Shelf one. The two
  // surfaces have distinct sub-tabs (Blend/Vibe/Compendium vs
  // Recipes/Cabinet/Journal), so each deserves its own first-visit.
  const [shelfHintShown, setShelfHintShown] = usePersistedState("shelfHintShown", false);
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
  // Roll-based earned elementals — replaces the legacy deterministic
  // predicate model. Each action site (tab visit, brew, journal, etc.)
  // calls tryRollOnAction(...), which has a small chance to add an id
  // to this set. Once added, the elemental is permanently in the
  // user's bestiary. lastElementalRollAt enforces a cooldown between
  // attempts so rapid-fire actions don't mass-spawn elementals.
  // legacyMigrated runs the one-time predicate-eval pass on first
  // load with this version so users carrying earned elementals from
  // the old model don't lose them.
  const [rolledElementalIds, setRolledElementalIds] = usePersistedState("rolledElementalIds", new Set());
  const [lastElementalRollAt, setLastElementalRollAt] = usePersistedState("lastElementalRollAt", 0);
  const [legacyMigrated, setLegacyMigrated] = usePersistedState("elementalLegacyMigrated", false);
  // Per-id timestamp of when each elemental was first noted. Powers
  // the arrivals-list at the bottom of the crystalarium so the
  // bestiary reads as a journal of visitors with dates rather than
  // a trophy grid. Stored as plain object {id: ts} since
  // usePersistedState's serializer handles Map → object faithfully
  // but plain objects round-trip through localStorage with less
  // ceremony.
  const [rolledElementalAt, setRolledElementalAt] = usePersistedState("rolledElementalAt", {});
  // Per-id action key — which surface triggered the roll. Used by
  // the arrivals timeline so the field-journal note reflects what
  // the user was actually doing (e.g., "while wandering the
  // notebook") instead of guessing from nearby brews.
  const [rolledElementalAction, setRolledElementalAction] = usePersistedState("rolledElementalAction", {});
  // Pity-timer streak counter — increments every time tryRollOnAction
  // is invoked and the chance gate fails (or the cooldown passes
  // without landing). Resets to 0 the moment a roll succeeds. The
  // roller folds the streak into a multiplier (1× → 3× across 12-24
  // dry actions) so users don't sit in silence for weeks at a time.
  const [elementalDryStreak, setElementalDryStreak] = usePersistedState("elementalDryStreak", 0);
  // Locked-crystal snapshot. When non-null, the bestiary's lead
  // crystal renders this frozen configuration instead of computing
  // fresh from recent sessions/journalEntries — lets the user pin
  // a mood/flavor profile they like so the crystal stops drifting
  // as their brewing patterns change. Null means the crystal tracks
  // live activity (default).
  const [lockedCrystal, setLockedCrystal] = usePersistedState("lockedCrystal", null);
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
  // Migrate users who had Vibe (mode "forward") persisted from before
  // it was retired. The Recipes filter on Shelf now covers the same
  // mood + flavor → blend flow; this just keeps deep-links and saved
  // state from landing on a removed sub-tab.
  React.useEffect(() => {
    if (apothecaryMode === "forward") setApothecaryMode("reverse");
    // The Crystalarium experiment briefly lived here; rolled back
    // to Notebook → Visitors. Bump anyone persisted there back to
    // the apothecarium's default Blend mode.
    if (apothecaryMode === "crystalarium") setApothecaryMode("reverse");
  }, [apothecaryMode]);
  const [shelfMode, setShelfMode]           = usePersistedState("shelfMode", "recipes");
  // Migrate users who had Cabinet (mode "pantry") persisted from
  // before it was retired. Cabinet was just LibraryScreen with
  // forcePantryOnly; that capability is now a toggle inside the
  // Apothecary → Herbanium reference itself.
  React.useEffect(() => {
    if (shelfMode === "pantry") setShelfMode("recipes");
    // The Bestiary sub-tab is now called "Visitors" — same view,
    // same content, friendlier label. Migrate any persisted
    // "bestiary" mode forward.
    if (shelfMode === "bestiary") setShelfMode("visitors");
  }, [shelfMode]);

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

  // Browser back button + left-edge swipe gesture both route through
  // the app's goBack() so users get the same in-app step-back behavior
  // they'd get from the on-screen back button. navKey covers the four
  // axes that meaningfully change the visible screen: tab, overlay,
  // overlay-stack depth, and the active sub-mode for whichever tab
  // exposes one. Sub-mode jumps (Blend → Vibe → Herbanium) become
  // their own browser history entries so the user can step them back.
  const navKey = `${tab}|${overlay || ""}|${overlayHistory.length}|${
    tab === "apothecary" ? apothecaryMode : tab === "shelf" ? shelfMode : ""
  }`;
  useAppBackNav({ goBack, canGoBack, navKey });
  // Recipes filter is a structured object: collection is single-select,
  // moods + flavors are arrays for multi-select sub-filtering. Selections
  // across rows AND together (collection ∩ moods ∩ flavors); within mood
  // and flavor rows the chips OR together.
  const [catalogueFilter, setCatalogueFilter] = useState({
    collection: "favorites", moods: [], flavors: [], pantryOnly: false,
  });
  const setApothecaryModeAction = (k) => setApothecaryMode(k);
  const setShelfModeAction = (k) => {
    // Recipes lands on the user's Favorites by default — that's the
    // most common destination on a brew-now visit. The user can
    // flip to All / Traditional / etc. via the chip strip if they
    // want a wider browse. Deep-links can still override downstream
    // via composePreselect.
    if (k === "recipes" && shelfMode !== "recipes") {
      setCatalogueFilter({ collection: "favorites", moods: [], flavors: [], pantryOnly: false });
    }
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
      // Eager sub-mode set, batched with the upcoming navigateTab.
      // composeView's deep-link useEffect inside ComposeScreen
      // also propagates `mode`, but that path runs only AFTER the
      // first render under the new tab — meaning we'd render one
      // frame of the section's previously-persisted sub-mode (e.g.
      // the user's last Blend view) before flipping. Setting the
      // mode here in the same batch as navigateTab avoids that
      // intermediate flash entirely.
      if (arg.mode) {
        if (to === "apothecary") setApothecaryMode(arg.mode);
        else if (to === "shelf") setShelfMode(arg.mode);
      }
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
    // Already steeping? Confirm before discarding the in-progress
    // brew. Matches the rest of the app's confirm pattern (other
    // delete-style flows use window.confirm too) so we don't grow
    // a one-off modal component for a single edge case.
    if (overlay === "steep" && session) {
      const currentName = session.blend?.name || "your current brew";
      const nextName = blend?.name || "a new brew";
      const ok = window.confirm(
        `${currentName} is still steeping. Cancel it and start ${nextName}?`
      );
      if (!ok) return;
      // Drop the minimized banner; the SteepScreen `key` on
      // blend identity (in render) handles full timer/state reset
      // on the swap, and SteepScreen's own cleanup effect cancels
      // the prior steep notification when blend.name changes.
      setSteepMinimized(false);
    }
    setSession({ blend, intent, targetMoods, currentMoods: [] });
    setOverlay("steep");
  };

  const togglePantry = (ingId) => {
    const next = new Set(pantryIds);
    if (next.has(ingId)) next.delete(ingId);
    else next.add(ingId);
    setPantryIds(next);
    tryRollOnAction("pantry");
  };

  // One-time legacy migration. The previous model evaluated `earned`
  // predicates on every render to decide which attribute-based
  // elementals were in the bestiary. The new chance-based model
  // stores explicit ids in `rolledElementalIds`. On first load with
  // the new code, evaluate the old predicates ONCE and seed the new
  // set so anyone carrying a legitimately-earned bestiary doesn't
  // see it disappear. Persisted flag prevents the migration from
  // re-running and avoids feeding pre-existing-but-not-yet-rolled
  // elementals (e.g. seed-preset users) into the new state.
  useEffect(() => {
    if (legacyMigrated) return;
    if (elementalsDisabled) {
      setLegacyMigrated(true);
      return;
    }
    const ctx = buildAttributeContext({
      sessions, savedBlendIds, pantryIds, profile, journalEntries, tabVisits,
    });
    const seeded = legacyEarnedIds(ATTRIBUTES, ctx);
    if (seeded.size > 0) {
      setRolledElementalIds(prev => {
        const next = new Set(prev || []);
        seeded.forEach(id => next.add(id));
        return next;
      });
      // Stamp legacy migrations as "long ago" so the arrival
      // timeline keeps them at the bottom — they were earned
      // pre-feature so we don't have a real first-noted moment.
      // Using a sentinel of 0 lets the renderer show "earlier" in
      // place of a date instead of midnight 1970.
      setRolledElementalAt(prev => {
        const next = { ...(prev || {}) };
        seeded.forEach(id => { if (next[id] == null) next[id] = 0; });
        return next;
      });
    }
    setLegacyMigrated(true);
  }, [legacyMigrated, sessions, savedBlendIds, pantryIds, profile, journalEntries, tabVisits, elementalsDisabled, setLegacyMigrated, setRolledElementalIds]);

  // Try a chance-based elemental roll on a user action. Called by
  // every action site (tab visit, brew, journal, pantry, favorite,
  // compose). If the roll lands, the new id is appended to
  // rolledElementalIds and the bestiary's existing arrival flow
  // surfaces it as a "you glimpsed an elemental" moment. Internal
  // cooldown is enforced inside rollOnAction.
  // Milestone elementals — guaranteed drops at meaningful thresholds.
  // Mixes intentional engagement with RNG without diluting either:
  // milestone-rolled creatures feel earned ("for your tenth cup");
  // chance-rolled ones feel found. Each milestone only fires once
  // (id stays in rolledElementalIds permanently after the first hit)
  // and uses the existing predicate to detect the threshold so the
  // catalog remains the single source of truth.
  const MILESTONE_IDS = [
    "first-brew",        // first logged cup
    "ten-cups",          // 10 cups
    "half-centurion",    // 50 cups
    "centurion",         // 100 cups
    "first-journal",     // first journal entry
    "journal-streak",    // 7 days of journaling
  ];
  const tryMilestones = () => {
    if (elementalsDisabled) return;
    const earned = rolledElementalIds || new Set();
    const ctx = buildAttributeContext({
      sessions, savedBlendIds, pantryIds, profile, journalEntries, tabVisits,
    });
    const justEarned = [];
    for (const id of MILESTONE_IDS) {
      if (earned.has(id)) continue;
      const attr = ATTRIBUTES.find(a => a.id === id);
      if (!attr || typeof attr.earned !== "function") continue;
      try {
        if (attr.earned(ctx)) justEarned.push(id);
      } catch {
        // Predicate threw on a missing field — skip and try again later.
      }
    }
    if (justEarned.length === 0) return;
    setRolledElementalIds(prev => {
      const next = new Set(prev || []);
      justEarned.forEach(id => next.add(id));
      return next;
    });
    setRolledElementalAt(prev => {
      const next = { ...(prev || {}) };
      const ts = Date.now();
      justEarned.forEach(id => { if (next[id] == null) next[id] = ts; });
      return next;
    });
    setRolledElementalAction(prev => {
      const next = { ...(prev || {}) };
      justEarned.forEach(id => { if (next[id] == null) next[id] = "milestone"; });
      return next;
    });
  };

  const tryRollOnAction = (action) => {
    if (elementalsDisabled) return;
    const earned = rolledElementalIds || new Set();
    const result = rollOnAction(
      action, ATTRIBUTES, earned,
      lastElementalRollAt || 0,
      Date.now(), Math.random,
      elementalDryStreak || 0,
    );
    if (!result) {
      // Dry attempt — bump the pity counter so the next eligible
      // action gets a slightly higher chance. Cooldown rejections
      // don't increment (they're not real attempts).
      const sinceLast = Date.now() - (lastElementalRollAt || 0);
      if (sinceLast >= 25 * 1000) {
        setElementalDryStreak(s => (s || 0) + 1);
      }
      return;
    }
    setRolledElementalIds(prev => {
      const next = new Set(prev || []);
      next.add(result.id);
      return next;
    });
    setRolledElementalAt(prev => ({ ...(prev || {}), [result.id]: result.ts }));
    setRolledElementalAction(prev => ({ ...(prev || {}), [result.id]: result.action }));
    setLastElementalRollAt(result.ts);
    setElementalDryStreak(0);
  };

  // Snapshot of currently-earned elemental ids — recomputed on every
  // change to the inputs. Used by the end-of-brew glimpse path: capture
  // the set just before addSession runs, then diff after the session +
  // wild-roll state has settled to find what JUST became earned by
  // this cup. Includes both attribute-based earns and wild rolls so
  // either path can trigger the glimpse card.
  const earnedElementalIds = useMemo(() => {
    // Attribute-based ids now come straight from rolledElementalIds
    // (the chance-based earnings store) instead of evaluating the
    // legacy predicates. Wild elementals continue to live in their
    // own array since they carry full per-item data.
    const attrIds = [...(rolledElementalIds || new Set())];
    const wildIds = (wildElementals || []).map(w => w.id);
    return new Set([...attrIds, ...wildIds]);
  }, [rolledElementalIds, wildElementals]);

  // Glimpse-detection effect — fires once per pending check, after the
  // earned-elementals set has settled following addSession + the wild
  // roll. Compares to the snapshot captured before the brew was logged;
  // if anything new became earned, we set glimpseElemental so the
  // overlay renders. Otherwise we just clear the pending flag and the
  // home navigation already queued by the brew onDone takes over.
  useEffect(() => {
    if (!glimpsePendingBefore) return;
    const newOnes = [...earnedElementalIds].filter(id => !glimpsePendingBefore.has(id));
    if (newOnes.length > 0) {
      setGlimpseElemental({ ids: newOnes });
    }
    setGlimpsePendingBefore(null);
  }, [glimpsePendingBefore, earnedElementalIds]);

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

    // Check-in nudge — schedule a local notification ~10 minutes out
    // (matches FOLLOWUP_MIN_MS on HomeScreen) so the user gets a
    // gentle ping when the follow-up card surfaces. No-op on web;
    // returns null silently if the user denies notification perms.
    // Stash the returned id on the session so we can cancel the
    // ping if they fill the follow-up before it fires.
    scheduleCheckInNotification({
      blendName: blend?.name,
      secondsFromNow: 10 * 60,
    }).then(notifId => {
      if (notifId == null) return;
      setSessions(prev => prev.map(s =>
        s.id === newSession.id ? { ...s, checkInNotifId: notifId } : s
      ));
    });

    hapticTap();
    tryRollWildElemental();
    tryRollOnAction("brew");
    tryMilestones();
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
  const patchSessionMoods = (sessionId, { moodScore, noteAppend, taste, flavorsTasted, flavorsTarget, extraMoods }) => {
    // Cancel the pending check-in nudge — the user is filling the
    // follow-up now, so the notification would just be noise.
    const target = sessions.find(s => s.id === sessionId);
    if (target?.checkInNotifId != null) cancelCheckInNotification(target.checkInNotifId);
    setSessions(prev => prev.map(s => {
      if (s.id !== sessionId) return s;
      const targetMoods = s.targetMoods || [];
      // Mood score is optional now — the unified follow-up runs even
      // for cups without target moods so flavor + rating still get
      // captured. Only stamp moodScore + actual when the user
      // actually picked a strength.
      const hasMood = moodScore != null;
      const score = hasMood
        ? Math.max(1, Math.min(5, Math.round(Number(moodScore) || 0)))
        : undefined;
      const actual = targetMoods.length > 0
        ? targetMoods.join(", ")
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
        ...(hasMood ? { moodScore: score } : {}),
        note: mergedNote,
        ...(typeof taste === "number" ? { taste: Math.max(1, Math.min(5, Math.round(taste))) } : {}),
        ...(flavorsTasted ? { flavorsTasted } : {}),
        ...(flavorsTarget ? { flavorsTarget } : {}),
        ...(Array.isArray(extraMoods) && extraMoods.length > 0 ? { extraMoods } : {}),
        moodsPending: false,
      };
    }));
    hapticTap();
  };

  // Skip a mood follow-up — user dismissed without filling. Clears
  // moodsPending so the card doesn't reappear, but leaves `actual`
  // as the "brewed" placeholder. The session still counts in the log.
  const dismissSessionMoods = (sessionId) => {
    const target = sessions.find(s => s.id === sessionId);
    if (target?.checkInNotifId != null) cancelCheckInNotification(target.checkInNotifId);
    setSessions(prev => prev.map(s =>
      s.id === sessionId ? { ...s, moodsPending: false } : s
    ));
  };

  // Append text to a session's note from the cup detail screen —
  // lets the user keep adding reflections to a cup after the initial
  // brew + follow-up. Each append separates with a paragraph break
  // so the note reads as a stack of small entries rather than a wall.
  const appendSessionNote = (sessionId, text) => {
    if (!text || !text.trim()) return;
    const trimmed = text.trim();
    setSessions(prev => prev.map(s => {
      if (s.id !== sessionId) return s;
      const merged = (s.note && s.note.trim())
        ? `${s.note.trim()}\n\n${trimmed}`
        : trimmed;
      return { ...s, note: merged };
    }));
    hapticTap();
  };

  // Append a free-form journal entry. Entries live alongside cup
  // sessions in the chronology and render via JournalEntryRow on the
  // Compose · Shelf · Journal tab.
  const addJournalEntry = (text, kind, note, currentMoods, landedMoods, flavors, title) => {
    if (!text || !text.trim()) return;
    const validKind =
      kind === "haiku" ? "haiku"
      : kind === "limerick" ? "limerick"
      : kind === "poem" ? "poem"
      : "entry";
    const entry = {
      id: `entry-${Date.now()}`,
      ts: Date.now(),
      // User-provided title — drives the journal-row headline so the
      // timeline reads like a list of named pieces rather than a
      // sea of preview-stub text. Optional; row falls back to the
      // text preview when absent (legacy entries pre-title field).
      title: typeof title === "string" ? title.trim() : "",
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
    tryRollOnAction("journal");
    tryMilestones();
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
    tryRollOnAction("compose");
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
    // Only roll on the *adding* side — pinning a favorite is the
    // intentional act; unpinning shouldn't pay out.
    if (!wasFav) tryRollOnAction("favorite");
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
        {tab === "apothecary" && <ComposeScreen section="apothecary" go={go} startBrew={startBrew} savedBlendIds={savedBlendIds} favoriteBlendIds={favoriteBlendIds} generatedBlends={generatedBlends} hiddenBlendIds={hiddenBlendIds} deleteBlend={deleteBlend} unhideBlend={unhideBlend} saveComposedBlend={saveComposedBlend} openBlend={openBlend} openCup={openCup} openEntry={openEntry} composePreselect={composePreselect} composeView={composeView} openInCompose={openInCompose} pantryIds={pantryIds} togglePantry={togglePantry} sessions={sessions} journalEntries={journalEntries} addJournalEntry={addJournalEntry} deleteJournalEntry={deleteJournalEntry} profile={profile} tabVisits={tabVisits} elementalsDisabled={elementalsDisabled} mode={apothecaryMode} setMode={setApothecaryMode} setModeUserAction={setApothecaryModeAction} catalogueFilter={catalogueFilter} setCatalogueFilter={setCatalogueFilter} composeHintShown={composeHintShown} dismissComposeHint={() => setComposeHintShown(true)} />}
        {tab === "shelf" && <ComposeScreen section="shelf" go={go} startBrew={startBrew} savedBlendIds={savedBlendIds} favoriteBlendIds={favoriteBlendIds} generatedBlends={generatedBlends} hiddenBlendIds={hiddenBlendIds} deleteBlend={deleteBlend} unhideBlend={unhideBlend} saveComposedBlend={saveComposedBlend} openBlend={openBlend} openCup={openCup} openEntry={openEntry} composePreselect={composePreselect} composeView={composeView} openInCompose={openInCompose} pantryIds={pantryIds} togglePantry={togglePantry} sessions={sessions} journalEntries={journalEntries} addJournalEntry={addJournalEntry} deleteJournalEntry={deleteJournalEntry} profile={profile} tabVisits={tabVisits} elementalsDisabled={elementalsDisabled} omenShown={omenShown} dismissOmen={() => setOmenShown(true)} seenElementalIds={seenElementalIds} setSeenElementalIds={setSeenElementalIds} featuredElementals={featuredElementals} setFeaturedElementals={setFeaturedElementals} wildElementals={wildElementals} rolledElementalIds={rolledElementalIds} rolledElementalAt={rolledElementalAt} rolledElementalAction={rolledElementalAction} autoOpenArrivalId={autoOpenArrivalId} onAutoOpenConsumed={() => setAutoOpenArrivalId(null)} lockedCrystal={lockedCrystal} setLockedCrystal={setLockedCrystal} mode={shelfMode} setMode={setShelfMode} setModeUserAction={setShelfModeAction} catalogueFilter={catalogueFilter} setCatalogueFilter={setCatalogueFilter} bestiaryHintShown={bestiaryHintShown} dismissBestiaryHint={() => setBestiaryHintShown(true)} composeHintShown={composeHintShown} dismissComposeHint={() => setComposeHintShown(true)} journalHintShown={journalHintShown} dismissJournalHint={() => setJournalHintShown(true)} pantryHintShown={pantryHintShown} dismissPantryHint={() => setPantryHintShown(true)} />}
        {tab === "profile" && <ProfileScreen go={go} openCup={openCup} sessions={sessions} savedBlendIds={savedBlendIds} pantryIds={pantryIds} seedMode={seedMode} setSeedMode={setSeedMode} profile={profile} setProfile={setProfile} resetEverything={resetEverything} isDev={isDev} devModeEnabled={devModeEnabled} setDevModeEnabled={setDevModeEnabled} elementalsDisabled={elementalsDisabled} setElementalsDisabled={setElementalsDisabled} profileHintShown={profileHintShown} dismissProfileHint={() => setProfileHintShown(true)} journalEntries={journalEntries} tabVisits={tabVisits} wildElementals={wildElementals} devForceGlimpse={isDev ? (() => {
          // Pick an attribute that's both unrolled AND unseen so the
          // bestiary will treat the tap-through as a real first
          // arrival. Falls back to "any unseen" then "any" so the
          // button stays useful even on a fully-collected dev
          // profile — but in those fallback paths we also clear the
          // chosen id from seenElementalIds so the arrival card
          // surfaces instead of going straight to the revealed grid.
          const earned = rolledElementalIds || new Set();
          const seen = seenElementalIds || new Set();
          const next =
            ATTRIBUTES.find(a => !earned.has(a.id) && !seen.has(a.id))
            || ATTRIBUTES.find(a => !seen.has(a.id))
            || ATTRIBUTES[0];
          if (!next) return;
          // Add to rolledElementalIds so the bestiary actually has the
          // arrival in earnedAttrs.
          setRolledElementalIds(prev => {
            const n = new Set(prev || []);
            n.add(next.id);
            return n;
          });
          setRolledElementalAt(prev => ({ ...(prev || {}), [next.id]: Date.now() }));
          // Critical for the dev path on seed-loaded profiles where
          // some ids are pre-marked seen: clear the chosen id from
          // seenElementalIds so pendingArrivals includes it. Without
          // this, the autoOpenArrivalId effect on bestiary can't
          // find the target in pendingArrivals and silently no-ops.
          setSeenElementalIds(prev => {
            const n = new Set(prev || []);
            n.delete(next.id);
            return n;
          });
          setLastElementalRollAt(Date.now());
          // Show the banner immediately. The earnedElementalIds memo
          // would normally drive this on its own once rolledElementalIds
          // updates, but the glimpse-detection effect only fires when a
          // pre-snapshot was captured — which doesn't happen on dev
          // force, so we set the banner state directly.
          setGlimpseElemental({ ids: [next.id] });
        }) : undefined} />}
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
          scroll. Each section has its own dismiss flag so seeing
          one doesn't pre-suppress the other. */}
      {tab === "apothecary" && (
        <ComposeTutorialOverlay
          section="apothecary"
          hintShown={composeHintShown}
          dismissHint={() => setComposeHintShown(true)}
        />
      )}
      {tab === "shelf" && (
        <ComposeTutorialOverlay
          section="shelf"
          hintShown={shelfHintShown}
          dismissHint={() => setShelfHintShown(true)}
        />
      )}

      <TabBar
        tab={tab}
        setTab={(k) => {
          // Preserve a minimized steep across tab changes so the
          // BrewTimerBanner stays visible while the user navigates.
          // Clearing the overlay here is what dropped the banner.
          // Other overlays (ingredient/blend/cup detail) still get
          // cleared since those aren't meant to follow you around.
          if (!(overlay === "steep" && steepMinimized)) {
            setOverlay(null);
            clearOverlayHistory();
          }
          navigateTab(k);
        }}
        apothecaryMode={apothecaryMode}
        shelfMode={shelfMode}
        setApothecaryModeAction={setApothecaryModeAction}
        setShelfModeAction={setShelfModeAction}
      />

      {overlay === "steep" && session && (
        <SteepScreen
          // Key on the blend id (or name fallback) so swapping the
          // session to a different brew fully remounts SteepScreen —
          // resets the timer state, intent textarea, wait-card index,
          // etc. cleanly instead of inheriting the previous brew's
          // countdown.
          key={session.blend?.id || session.blend?.name || "steep"}
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
          minimized={steepMinimized}
          onMinimize={() => setSteepMinimized(true)}
          onRemainingChange={setSteepRemaining}
          onDone={() => {
            // Single-check-in flow: brew completion logs the session
            // immediately with default flavor/taste (the unified
            // follow-up card on Home captures rating, flavor, and
            // mood once the cup has had a few minutes to settle).
            setGlimpsePendingBefore(new Set(earnedElementalIds));
            addSession({
              blend: session.blend,
              intent: session.intent,
              targetMoods: session.targetMoods,
              currentMoods: session.currentMoods,
              flavorsTasted: {},
              flavorsExtra: [],
              flavorsTarget: Array.isArray(session.blend?.flavors) ? session.blend.flavors.slice(0, 6) : [],
              taste: 4,
              note: "",
              save: true,
              rename: "",
            });
            setSteepMinimized(false);
            setOverlay(null);
            clearOverlayHistory();
            setSession(null);
            setTab("home");
          }}
          onCancel={() => { setSteepMinimized(false); setOverlay(null); clearOverlayHistory(); setSession(null); }}
        />
      )}
      {/* Brew-timer banner — surfaces at the top of the viewport
          when the user has minimized an active steep, lets them
          navigate the rest of the app while the timer runs, and
          restores the steep overlay on tap. Persists across tab
          changes since it lives at App level, outside any tab
          wrapper. */}
      {overlay === "steep" && steepMinimized && session && (
        <BrewTimerBanner
          blendName={session.blend?.name || "your brew"}
          remaining={steepRemaining}
          onTap={() => setSteepMinimized(false)}
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
          appendSessionNote={appendSessionNote}
          openBlend={(id) => {
            // Stack the recipe overlay on top of the cup detail so
            // back from the recipe lands the user back on the cup,
            // not on Home. Mirrors the ingredient-from-blend flow.
            pushOverlayHistory("blend", { blendId: id });
            setBlendOverlayId(id);
            setOverlay("blend");
          }}
          onBrewAgain={() => {
            const cupSession = sessions.find(s => s.id === cupOverlayId);
            const b = cupSession ? getBlend(cupSession.blendId) : null;
            if (!b) return;
            // Drop overlay history so a back from the new steep
            // doesn't fall back into the old cup detail. Carry the
            // user's prior target moods forward as a starting point
            // — they were aiming for this cup's experience again.
            clearOverlayHistory();
            startBrew(b, "", cupSession?.targetMoods || (b.mood ? [b.mood] : []));
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
      {/* End-of-brew elemental glimpse banner — fires when a roll
          lands a new elemental and persists across tab changes
          until the user taps it (navigating to the bestiary with
          the arrival card auto-opened) or dismisses it (the
          elemental stays in the bestiary's pendingArrivals so the
          Log/summon button there picks it up later). Less
          interrupting than the previous modal card; the user can
          keep doing whatever they were doing. */}
      {glimpseElemental && (
        <ElementalGlimpseBanner
          onLogIt={() => {
            // Visitors lives under Notebook (Recipes / Journal /
            // Visitors). composeView pin + sub-mode set + tab switch
            // are batched in the same event handler so the next render
            // mounts directly into Visitors without flashing the
            // previously-active shelf mode for one frame.
            //
            // The banner no longer auto-opens the arrival card —
            // that became the lodestone's job. The user lands on
            // Visitors, sees the lodestone pulsing in place, and
            // taps the stone itself to summon the arrival.
            setComposeView({ section: "shelf", mode: "visitors", at: Date.now() });
            setShelfMode("visitors");
            setGlimpseElemental(null);
            navigateTab("shelf");
          }}
          onLater={() => setGlimpseElemental(null)}
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
          // Same top buffer as the main mobile path — keeps the H
          // logo and welcome card from sliding under the system
          // status icons / camera cutout on edge-to-edge Android.
          boxSizing: "border-box",
          paddingTop: 48,
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
          // Reserve a top strip painted in the app shell so the
          // system status icons have breathing room above the
          // in-app back button + content. Mobile path renders here
          // directly (bypassing PhoneFrame), so this is where the
          // padding has to live for the Pixel / Capacitor build.
          // 48px is enough room above standard Android status bars
          // (~24-32dp) to clear icons + leave a small visual margin.
          boxSizing: "border-box",
          paddingTop: 48,
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

