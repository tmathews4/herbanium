/* Type surface for data/followUp.js — the E2E specs seed cups at
   specific points in the follow-up schedule, and they read these
   rather than restating them. A test carrying its own copy of
   MAX_SNOOZES is the drift CLAUDE.md's derived-contract rule exists
   to stop: the ceiling would move and the spec would still pass,
   asserting a rule the app no longer has. */

export const DEFAULT_FOLLOWUP_MS: number;
export const FOLLOWUP_WINDOW_MS: number;
export const SNOOZE_MS: number;
export const MAX_SNOOZES: number;

export interface FollowUpSession {
  who?: string;
  moodsPending?: boolean;
  brewedAt?: number;
  followUpAt?: number;
  followUpSnoozes?: number;
}

export function scheduleFollowUp(brewedAt: number): number;
export function snoozeFollowUp(
  session: FollowUpSession | null | undefined,
  now?: number,
): { followUpAt: number; followUpSnoozes: number } | null;
export function isFollowUpDue(
  session: FollowUpSession | null | undefined,
  now?: number,
): boolean;
