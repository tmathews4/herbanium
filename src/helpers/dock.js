/* ──────────────────────────────────────────────────────────────
   helpers/dock.js — where the brew controls dock.

   The blend screen's brew controls render into the bottom dock,
   alongside the Blend / Herbanium sub-tabs, because that's where the
   app's persistent controls live. But the temp/steep state they drive
   belongs to Compose, several layers down and behind a lazy() boundary.

   So the id is the contract: a host renders the empty slot, and
   BlendExtractionExplorer portals into it. Shared through a module that
   imports nothing but React — App must not import the explorer (it would
   pull a lazy screen's chunk into the eager one) and the explorer must
   not import App (a cycle).

   WHICH slot is a context, because there is more than one. The recipe
   and ingredient screens are full-screen overlays: absolute, inset 0,
   z-index above the tab bar. They paint straight over the tab dock, so
   an explorer inside one of them portaled its controls to a slot the
   user could not see or reach — the recipe page looked read-only for
   two commits. Each overlay now provides its own dock and the controls
   follow the context to it.

   The context also settles a collision that was always latent: the
   Apothecary tab's "Try these" row opens a recipe over a still-mounted
   ComposeScreen, so two explorers exist at once. Scoped by host, they
   dock in two different places instead of stacking in one.
   ────────────────────────────────────────────────────────────── */

import { createContext, useContext } from "react";

// The tab dock, in the bottom bar above the sub-tabs. Default because
// it's where the controls belong whenever nothing has covered it.
export const BREW_DOCK_ID = "brew-dock";
// The detail overlays' own slots. Distinct ids rather than one shared
// one: both can be in the DOM at once (a recipe over a live Compose
// screen), and getElementById would otherwise hand back whichever
// happened to be first.
export const BLEND_DETAIL_DOCK_ID = "brew-dock-blend-detail";
export const INGREDIENT_DETAIL_DOCK_ID = "brew-dock-ingredient-detail";

const BrewDockContext = createContext(BREW_DOCK_ID);

export const BrewDockProvider = BrewDockContext.Provider;
export const useBrewDockId = () => useContext(BrewDockContext);
