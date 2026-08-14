// Type-only companion so the TypeScript E2E specs can read the pour
// table from the same data the app does, instead of restating it.
//
// e2e/pour-size.spec.ts walks POUR_SIZES and holds the app to whatever
// is in it — every size reachable, each one scaling the shopping list
// by its own dose count. Typing "3.5 g" into the spec would make it a
// second copy of the answer, which is the drift these contract specs
// exist to catch.
//
// Only the pour table is declared. The rest of units.js is app-side
// formatting the harness has no business reaching into; add to this
// file when a spec has a reason to derive from it, not before.

/** The volume every extraction profile in the catalogue is written against. */
export const REFERENCE_ML: number;

export interface PourSize {
  /** How many reference cups' worth of leaf to measure out. `ml / REFERENCE_ML`. */
  doses: number;
  /** What the vessel holds. The number the user recognises. */
  ml: number;
  /** Nominal leaf for one pour, in the unit the settings row speaks. */
  tspLabel: string;
  /** "a cup", "a mug", "a pot" — the vessel, as the UI names it. */
  name: string;
}

/** Named vessels, keyed by the value persisted as `herbanium.pour`. */
export const POUR_SIZES: Record<string, PourSize>;

/** A pour's dose count, defaulting to one cup for an unknown key. */
export function pourDoses(pour: string): number;
