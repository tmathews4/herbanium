/* ──────────────────────────────────────────────────────────────
   data/featureFlags.js — things that are built, kept, and switched
   off.

   A FLAG RATHER THAN COMMENTED-OUT CODE, deliberately. Commented code
   cannot be typechecked, linted or run, so it rots from the moment it
   is commented and nobody finds out until someone tries to bring it
   back. Everything gated here stays live code on the normal paths —
   the compiler still sees it, eslint still reads it, and the specs
   that cover it derive their skip from the same constant, so flipping
   the flag brings the feature AND its tests back in one edit.
   ────────────────────────────────────────────────────────────── */

/* THE ELEMENTAL NOTICES — the top-of-screen ribbon that announced an
   arrival, and the one that announced a full lodestone.

   Switched off at the owner's call: more trouble than they were worth.
   The trouble is worth recording, because it was all one shape — an
   interruption that has to know about every other thing on screen. The
   notice covered the steep screen's minimize button. It fired before
   the lodestone had ever been opened. A shared locator let one notice
   satisfy a test that meant the other. A stale glimpse outlived the
   thing it pointed at and silenced the charge notice behind it. And
   the roller's own dice made the file's silence assertions flaky for
   three days.

   WHAT IS NOT AFFECTED. Elementals still arrive both ways — the rolls
   on brew, journal, compose, favorite and tab visits (tryRollOnAction,
   with its cooldown and pity streak), and the charged summon. The
   lodestone still pulses and its badge still counts what is waiting,
   on the screen they live on. Only the interruption is gone.

   Flip to true to bring the ribbons back; `e2e/elemental-notices.spec`
   reads this constant and comes back with them. */
export const ELEMENTAL_NOTICES_ENABLED = false;
