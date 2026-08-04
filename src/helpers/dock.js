/* ──────────────────────────────────────────────────────────────
   helpers/dock.js — the tab dock's portal slot.

   The blend screen's brew controls render into the bottom dock,
   alongside the Blend / Herbanium sub-tabs, because that's where the
   app's persistent controls live. But the temp/steep state they drive
   belongs to Compose, several layers down and behind a lazy() boundary.

   So the id is the contract: App renders the empty slot, and
   BlendExtractionExplorer portals into it. Shared through a module with
   no imports of its own — App must not import the explorer (it would
   pull a lazy screen's chunk into the eager one) and the explorer must
   not import App (a cycle).
   ────────────────────────────────────────────────────────────── */

export const BREW_DOCK_ID = "brew-dock";
