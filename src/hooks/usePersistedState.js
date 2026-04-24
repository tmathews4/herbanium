/* ──────────────────────────────────────────────────────────────
   hooks/usePersistedState.js — localStorage-backed useState

   Drop-in replacement for useState that transparently persists the
   value to localStorage and reads it back on mount. Used for state
   that should survive browser reloads: sessions, pantry, preferences,
   profile info.

   Usage:
     const [sessions, setSessions] = usePersistedState("sessions", []);

   The key is the localStorage key — namespace it if needed
   ("herbanium.sessions"). The default value is used if nothing's
   stored yet or if the stored value can't be parsed.

   Schema versioning:
   - Each key is prefixed with "herbanium." automatically
   - A global "herbanium.schemaVersion" key tracks data shape version
   - If version mismatches on load, all herbanium.* keys are cleared
     (for portfolio phase — real migrations come later when there are
     real users whose data we shouldn't lose)

   SSR-safety:
   - On the first render, falls back to defaultValue if window is
     undefined (Node/SSR context). Rehydrates on mount via useEffect.

   Transient state (current tab, overlays, slider positions) should
   still use plain useState — no need to persist what only matters
   for the current session.
   ────────────────────────────────────────────────────────────── */

import { useState, useEffect, useCallback } from "react";

const KEY_PREFIX = "herbanium.";
const SCHEMA_KEY = KEY_PREFIX + "schemaVersion";
const CURRENT_SCHEMA = "1";

// Check schema once on module load. If mismatched, wipe all herbanium.* keys.
// Portfolio phase: acceptable to clear. Post-launch: implement real migration.
function ensureSchema() {
  if (typeof window === "undefined" || !window.localStorage) return;
  try {
    const existing = localStorage.getItem(SCHEMA_KEY);
    if (existing !== CURRENT_SCHEMA) {
      // Clear all herbanium.* keys
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith(KEY_PREFIX)) keysToRemove.push(k);
      }
      keysToRemove.forEach(k => localStorage.removeItem(k));
      localStorage.setItem(SCHEMA_KEY, CURRENT_SCHEMA);
    }
  } catch (e) {
    // localStorage may be blocked (private browsing on some iOS versions).
    // Fall through silently; persistence just won't happen.
  }
}

// Run once per module load
ensureSchema();

// Serialization helpers — handle Set (used for savedBlendIds, pantryIds)
function serialize(value) {
  if (value instanceof Set) return { __type: "Set", items: [...value] };
  return value;
}

function deserialize(value) {
  if (value && typeof value === "object" && value.__type === "Set") {
    return new Set(value.items);
  }
  return value;
}

export function usePersistedState(key, defaultValue) {
  const fullKey = KEY_PREFIX + key;

  const [value, setValue] = useState(() => {
    if (typeof window === "undefined" || !window.localStorage) return defaultValue;
    try {
      const stored = localStorage.getItem(fullKey);
      if (stored === null) return defaultValue;
      return deserialize(JSON.parse(stored));
    } catch (e) {
      return defaultValue;
    }
  });

  // Persist changes
  useEffect(() => {
    if (typeof window === "undefined" || !window.localStorage) return;
    try {
      localStorage.setItem(fullKey, JSON.stringify(serialize(value)));
    } catch (e) {
      // Storage full, private browsing, etc. Fail silently.
    }
  }, [fullKey, value]);

  return [value, setValue];
}

/**
 * Clear all herbanium.* localStorage keys. Used by the "start over"
 * reset button in Profile. After calling, the app should reload to
 * pick up the fresh state.
 */
export function resetAllPersistedState() {
  if (typeof window === "undefined" || !window.localStorage) return;
  try {
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith(KEY_PREFIX)) keysToRemove.push(k);
    }
    keysToRemove.forEach(k => localStorage.removeItem(k));
  } catch (e) {
    // Silent fail
  }
}
