/* ──────────────────────────────────────────────────────────────
   data/schemaVersion.js — the persisted-state schema version.

   Bumping this WIPES every herbanium.* key on next load: journals,
   saved blends, elementals, everything. It is the reset switch, not a
   migration. Lives in its own module with no React import so the E2E
   suite can read the current value instead of hardcoding it — the
   specs seed localStorage before the app boots, and a stale literal
   there means the app wipes the seed and every test quietly runs
   against an empty profile.

   History:
     7 — pre-launch reset. Ships the lodestone charge, the reworked
         Blend tour and the Home masthead to everyone from a clean
         slate rather than on top of state from earlier builds.
   ────────────────────────────────────────────────────────────── */

export const CURRENT_SCHEMA = "7";
