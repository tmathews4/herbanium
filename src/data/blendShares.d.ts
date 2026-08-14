// Type-only companion so the TypeScript E2E specs can read the starting
// parts from the same data the app does, instead of restating them.
//
// e2e/amount-mode.spec.ts asserts that a leaf opens at its own shelf
// share. Hardcoding the number there would make the spec a second copy
// of the answer — the drift this data was built to avoid — so it imports
// `defaultPartsFor` and derives it.

/** Parts derived from the median share the curated blends give a leaf. */
export const DERIVED_PARTS: Record<string, number>;

/** Parts placed by hand where the shelf has fewer than three examples. */
export const ASSIGNED_PARTS: Record<string, number>;

/** The two above, merged — assigned values never override derived ones. */
export const BLEND_PARTS: Record<string, number>;

/** Where the shelf's typical base lands on the 1..9 stepper. */
export const BASE_PARTS: number;

/** How many parts this leaf starts at. Falls back to the mid band. */
export function defaultPartsFor(id: string): number;
