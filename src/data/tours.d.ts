// Type-only companion so the TypeScript E2E specs can derive their step
// lists from the same data the app renders, instead of restating them.
//
// The visibility spec walks every step of every tour; hardcoding that
// list would mean a step added later is a step nobody checks, which is
// exactly the failure the spec exists to catch.
export interface TourStep {
  /** data-tour hook of the element this step points at. */
  target: string;
  title: string;
  body: string;
  pad?: number;
  /** Extra elements lit alongside the target. */
  spotlight?: string[];
  /** Elements that must stay on screen and out from under the callout. */
  keepClear?: string[];
  /** Tour-only demo state: forces the flavour strips simple/detailed. */
  familyMode?: boolean;
  /** Tour-only demo state: forces the dock's brew row open or shut. */
  openControls?: boolean;
  /** Shrinks the callout for steps competing with their own subject. */
  compact?: boolean;
}

export const SCREEN_TOURS: Record<string, TourStep[]>;
