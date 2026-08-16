// components/greetingTiming.js — how long Home's opening sequence runs.
//
// PLAIN JS ON PURPOSE, and split out of TeaGreeting.jsx for the same
// reason src/data/schemaVersion.js sits on its own: the E2E harness has
// to read it. tsconfig deliberately scopes `npm run typecheck` to the
// specs and leaves the app's JSX alone, so a spec importing a .jsx
// module fails with "'--jsx' is not set" — and the alternative is a
// second copy of the number written into a test, which is the drift
// every audit in this repo exists to catch.
//
// The number itself is TeaGreeting's business: the slogan starts at
// SLOGAN_AT and takes 1.6s. That file re-exports this so nothing else
// has to know the constant moved.
//
// Two things wait on it, and neither should guess:
//   - App's `arrivalDone` gate, which holds the session's FIRST tour
//     back so it can't dim the sequence mid-animation.
//   - e2e/tour-lifecycle.spec.ts, which asserts a REQUESTED tour does
//     not wait on that gate — a claim about this exact number.
//
// The hard ceiling is WCAG 2.2.2: moving content running past five
// seconds needs a pause control. An earlier cut ran 4.7s. Nothing here
// should grow without checking that number again.
export const GREETING_ARRIVAL_MS = 4400;
