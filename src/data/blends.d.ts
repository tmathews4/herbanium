// Type-only companion so the TypeScript E2E specs can read blend data
// from the same source the app does, instead of restating it.
//
// e2e/blend-sources.spec.ts walks BLEND_SOURCES and holds each blend's
// page to the register that entry declares. Hardcoding "all-heal is the
// clinical one" there would make the spec a second copy of the answer —
// the drift every contract spec in this repo exists to catch.
//
// Only what the specs actually import is declared. This is a harness
// convenience, not a schema for the app.

/** A user-visible source line, and what KIND of source it is.
 *
 *  The register is data rather than prose because these lines render
 *  together under one "Sources" heading: an RCT, two historical
 *  attributions and a living folk teaching. Undifferentiated, the
 *  journal citation lends its authority to whatever sits beside it. */
export interface BlendSource {
  /** A key of SOURCE_REGISTERS. */
  register: string;
  /** The citation as the reader sees it. */
  text: string;
}

/** Human-readable label for each register, keyed by the register id. */
export const SOURCE_REGISTERS: Record<string, string>;

/** Sources shown at the foot of a blend's page, keyed by blend id. */
export const BLEND_SOURCES: Record<string, BlendSource[]>;

/** The blend catalogue. Only the fields the specs read are declared. */
export const BLENDS: Array<{
  id: string;
  name: string;
  culturalNote?: string;
  [key: string]: unknown;
}>;
