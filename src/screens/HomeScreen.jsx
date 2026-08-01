/* ──────────────────────────────────────────────────────────────
   screens/HomeScreen.jsx — Home screen plus its row components
   (CompactSessionRow, SessionRow).
   ────────────────────────────────────────────────────────────── */

import React from "react";
import {
  Flask, Kettle, Leaf, Pencil,
} from "../components/icons";
import {
  Button, SectionLabel,
} from "../components/layout";
import { MoodFollowUpCard } from "../components/MoodFollowUpCard";
import { OrnamentRule } from "../components/OrnamentRule";
import { PoemLines } from "../components/PoemLines";
import { TeaGreeting } from "../components/TeaGreeting";
import { WAIT_POEMS } from "../data/waitContent";
import { getBlend, sessionAgo } from "../helpers/misc";
import {
  ff, theme, shadow, radius,
} from "../theme";
import {
  formatTempShort, useUnit,
} from "../units/units";

/* ──────────────────────────────────────────────────────────────
   Screen: HOME
   ────────────────────────────────────────────────────────────── */

/* First view of the session gets the arrival animation — the greeting
   fading up and both flourishes drawing themselves. Once per SESSION,
   not once per mount: Home remounts every time you tab back to it, and
   a welcome that re-performs on every visit becomes a toll.

   Decided here, at the common parent, rather than inside each piece.
   The poem card's flourish and the greeting's are a matched pair, so
   they have to agree about whether this is an arrival — if each owned
   its own flag, whichever mounted first would consume it. */
let homeArrived = false;

// Contextual line based on the hour. Returns { label, todTags }
// where todTags carry the time-of-day keywords used to pick a
// matching public-domain poem. The poem replaces the older
// hand-written one-liner.
const getTimeOfDay = (h) => {
  if (h >= 5  && h <  8) return { label: "Early morning",  todTags: ["morning", "dawn"] };
  if (h >= 8  && h < 11) return { label: "Morning",        todTags: ["morning"] };
  if (h >= 11 && h < 13) return { label: "Late morning",   todTags: ["morning", "noon"] };
  if (h >= 13 && h < 16) return { label: "Afternoon",      todTags: ["noon", "stillness"] };
  if (h >= 16 && h < 19) return { label: "Late afternoon", todTags: ["evening"] };
  if (h >= 19 && h < 22) return { label: "Evening",        todTags: ["evening", "night"] };
  if (h >= 22 || h <  2) return { label: "Late evening",   todTags: ["night", "moon"] };
  return                         { label: "Small hours",   todTags: ["night", "moon", "stillness"] };
};

// Northern-hemisphere season buckets keyed off month index. Used to
// bias the home poem pick toward seasonal lines when one of the
// candidate poems happens to share the season tag. Southern-hemi
// users will see a mismatched season bias — acceptable for now,
// no locale data available locally.
const seasonOf = (m) => {
  if (m === 11 || m <= 1) return "winter";
  if (m >= 2 && m <= 4)  return "spring";
  if (m >= 5 && m <= 7)  return "summer";
  return "autumn";
};

// Pick a public-domain poem from WAIT_POEMS that fits the current
// hour and (when possible) season. Rotates on each visit (each
// fresh mount of HomeScreen) so a user returning to Home through
// the day doesn't see the same line over and over. Time of day
// AND season still bias the candidate pool — the rotation just
// happens within the candidate set rather than across days.
const pickHomePoem = (date) => {
  const tod = getTimeOfDay(date.getHours());
  const season = seasonOf(date.getMonth());
  const todSet = new Set(tod.todTags);

  const candidates = (WAIT_POEMS || []).filter(p => {
    const tags = p.tags || [];
    return tags.some(t => todSet.has(t));
  });
  // Soft season bias: when a strong seasonal subset exists (≥3 poems
  // tagged for the current season at this time of day), use it;
  // otherwise stay with the broader time-of-day pool so the rotation
  // doesn't lock onto 1-2 seasonal poems for an entire season.
  const seasonMatched = candidates.filter(p => (p.tags || []).includes(season));
  const pool = seasonMatched.length >= 3 ? seasonMatched : candidates;
  if (pool.length === 0) return null;

  // Random pick — different each Home mount. Keeps a pool of >1 in
  // genuinely fresh rotation while time-of-day / season bias still
  // shapes which subset the pick happens within.
  return pool[Math.floor(Math.random() * pool.length)];
};

export const HomeScreen = ({ go, openBlend, openCup, openInCompose, sessions, savedBlendIds, favoriteBlendIds, profile, elementalsDisabled, seededFavoritesNoticeShown, dismissSeededFavoritesNotice, patchSessionMoods, dismissSessionMoods, addJournalEntry, journalEntries = [] }) => {
  const [arriving] = React.useState(() => {
    if (homeArrived) return false;
    homeArrived = true;
    return true;
  });
  // Pick a poem ONCE per mount so the line is stable within a visit
  // but fresh on each return to Home. Rotation comes from coming back
  // to Home through the day rather than from re-rendering in place.
  const homePoem = React.useMemo(() => pickHomePoem(new Date()), []);
  // Track whether this visit's poem has been saved as a journal entry,
  // so we can flip the action label to "Saved" without re-checking
  // journalEntries (which would also flip on a prior save in another
  // session — we want this acknowledgement scoped to the current tap).
  const [poemSaved, setPoemSaved] = React.useState(false);
  // Dedupe across visits: if the same poem text already lives in the
  // journal, treat it as already-saved so we don't pile duplicates on
  // a user who taps the action twice across two visits.
  const poemAlreadyInJournal = !!homePoem && (journalEntries || []).some(
    e => e && typeof e.text === "string" && e.text === homePoem.text,
  );
  const handleSavePoem = () => {
    if (!homePoem || !addJournalEntry || poemSaved || poemAlreadyInJournal) return;
    addJournalEntry(homePoem.text, "entry", homePoem.attribution || "");
    setPoemSaved(true);
  };
  // Mood follow-up — brew-time logging only captures flavor (verifiable
  // at first sip). Mood resolves over the next ~30 minutes, so any
  // session brewed in the last 24 hours that hasn't logged its mood
  // gets surfaced as an inline card here. One per render: the most
  // recent pending cup, since piling them up reads as nagging.
  //
  // Min-elapsed gate (10 min): asking the moment the user finishes
  // the cup defeats the point — caffeine hasn't kicked in, calm
  // hasn't settled. Holding the card back for ten minutes gives the
  // body time to actually feel the cup before we ask about it.
  const FOLLOWUP_MIN_MS    = 10 * 60 * 1000;
  const FOLLOWUP_WINDOW_MS = 24 * 60 * 60 * 1000;
  const pendingMoodSession = (sessions || []).find(s => {
    if (s.who !== "you") return false;
    if (!s.moodsPending) return false;
    const elapsed = Date.now() - (s.brewedAt || 0);
    return elapsed >= FOLLOWUP_MIN_MS && elapsed < FOLLOWUP_WINDOW_MS;
  });
  // Home's recent log is brewed cups only — never the private free
  // entries / haiku / limericks that live in journalEntries. Those
  // are only surfaced behind the Shelf > Journal sub-tab where they
  // can also be hidden per-row. We never receive journalEntries here
  // by design; the filter also drops any malformed session without a
  // blendId so the cup log stays clean.
  const yourSessions = sessions.filter(s => s.who === "you" && s.blendId);
  const isEmpty = yourSessions.length === 0;
  const name = profile?.name || "friend";

  return (
    <div style={{ padding: "18px 20px 32px", fontFamily: ff.sans }}>
      {/* Empty-state welcome — first-time users get a quiet poem
          (Tagore's Stray Birds #1, the opening of the whole work,
          chosen for its arrival-at-a-window image) above the named
          welcome line. Returning users skip this and get the
          time-of-day card below instead, so the welcome moment is
          a one-time first-visit landing rather than a recurring
          band that gets stale. */}
      {isEmpty && (
        <>
          {/* Flourish sits ABOVE the card, not inside it, so the pair
              of marks brackets the whole opening block — flourish,
              poem, greeting, flourish — instead of one being the
              card's decoration and the other the section's. The card
              then reads as nested inside the masthead rather than as
              a separate object that happens to sit above it. */}
          <OrnamentRule drawing={arriving} style={{ marginBottom: 12 }} />
          <div style={{
            marginBottom: 14,
            padding: "18px 22px",
            borderRadius: radius.md,
            background: theme.cream,
            border: `1px solid ${theme.ruleSoft}`,
            boxShadow: shadow.card,
            textAlign: "center",
          }}>
            <PoemLines
              size={13}
              arriving={arriving}
              text={"Stray birds of summer come to my window to sing and fly away.\nAnd yellow leaves of autumn, which have no songs,\nflutter and fall there with a sigh."}
            />
            <div style={{
              fontFamily: ff.sans, fontSize: 10, letterSpacing: "0.08em",
              color: theme.ash, marginTop: 8,
            }}>
              — Rabindranath Tagore (Stray Birds, 1916)
            </div>
          </div>

          <TeaGreeting name={name} kicker={getTimeOfDay(new Date().getHours()).label} arriving={arriving} />
        </>
      )}

      {/* Time-of-day contextual card + greeting (returning users only).
          Poem is memoized per mount so the rotation is per-visit,
          not per-render — each fresh return to Home gets a new
          line rather than the same one repeating, but the same
          line holds steady within one visit. */}
      {!isEmpty && (() => {
        const now = new Date();
        const tod = getTimeOfDay(now.getHours());
        const poem = homePoem;
        return (
          <>
            {/* See the empty-state note: the flourish brackets the
                block from outside the card. */}
            <OrnamentRule drawing={arriving} style={{ marginBottom: 12 }} />
            <div style={{
              marginBottom: 14,
              padding: "16px 22px",
              borderRadius: radius.md,
              background: theme.cream,
              border: `1px solid ${theme.ruleSoft}`,
              boxShadow: shadow.card,
              textAlign: "center",
            }}>
              <div style={{
                fontFamily: ff.serif, fontSize: 17, color: theme.ink,
                lineHeight: 1.25, marginBottom: poem ? 8 : 3,
              }}>
                {tod.label}.
              </div>
              {poem ? (
                <>
                  <PoemLines text={poem.text} arriving={arriving} />
                  {poem.attribution && (
                    <div style={{
                      fontFamily: ff.sans, fontSize: 10, letterSpacing: "0.08em",
                      color: theme.ash, marginTop: 6,
                    }}>
                      {poem.attribution}
                    </div>
                  )}
                  {addJournalEntry && (() => {
                    const saved = poemSaved || poemAlreadyInJournal;
                    return (
                      <button
                        type="button"
                        onClick={handleSavePoem}
                        disabled={saved}
                        style={{
                          marginTop: 10,
                          background: "transparent", border: "none",
                          padding: "4px 8px",
                          fontFamily: ff.sans, fontSize: 11,
                          letterSpacing: "0.04em",
                          color: saved ? theme.sage : theme.terra,
                          cursor: saved ? "default" : "pointer",
                          opacity: saved ? 0.85 : 1,
                          transition: "color 0.2s ease",
                        }}
                      >
                        {saved ? "✓ Saved to journal" : "Save to journal"}
                      </button>
                    );
                  })()}
                </>
              ) : null}
            </div>

            {/* Greeting moves below the poem so the time-of-day
                moment leads the page; the user's name lands as a
                follow-on rather than a top banner.

                Framed eyebrow + slogan + hairline rule reads as a
                small pull-quote — gives the line weight without
                making it shout. Ornament flourishes flank the
                eyebrow to tie back to the poem card above. */}
            <TeaGreeting name={name} arriving={arriving} />
          </>
        );
      })()}

      {/* Three primary actions as a row of side-by-side cards.
          All three share the dark-ink filled treatment so the
          block reads as a unified navigator; the icons carry the
          color contrast (green leaf, orange sun, purple pen). */}
      {/* Three primary actions. Equal-sized cream tiles with a thin
          rule border — reads as part of the apothecary palette.
          Sans-uppercase labels match the eyebrow style used across
          the app's section labels and tab bar. */}
      <style>{`
        .home-cta {
          aspect-ratio: 1 / 1;
          width: 100%;
          background: ${theme.cream};
          color: ${theme.inkSoft};
          border: 1px solid ${theme.rule};
          border-radius: ${radius.lg}px;
          padding: 10px 8px;
          display: flex; flex-direction: column;
          align-items: center; justify-content: center;
          gap: 10px;
          cursor: pointer;
          text-align: center;
          box-shadow: ${shadow.lifted};
          transition: box-shadow 0.18s ease, border-color 0.18s ease, transform 0.12s ease;
          outline: none;
        }
        .home-cta:hover {
          border-color: ${theme.sage};
          box-shadow: ${shadow.hover};
        }
        .home-cta:active {
          box-shadow: ${shadow.pressed};
          transform: translateY(0.5px);
        }
        /* Thin variant — same surface treatment as the square CTAs above
           (cream + rule + lifted shadow + sage-on-hover) but flat-row
           layout for the secondary HERBANIUM doorway. Re-declares the
           shadow + hover/active states so they win against any inline
           style fall-through and don't depend on cascade order. */
        .home-cta-thin {
          aspect-ratio: auto;
          padding: 8px 14px 9px;
          gap: 3px;
          box-shadow: ${shadow.lifted};
        }
        .home-cta-thin:hover {
          border-color: ${theme.sage};
          box-shadow: ${shadow.hover};
        }
        .home-cta-thin:active {
          box-shadow: ${shadow.pressed};
          transform: translateY(0.5px);
        }
      `}</style>
      <div style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr 1fr",
        gap: 8, marginBottom: 24,
      }}>
        {[
          {
            label: "Experiment",
            onClick: () => go("apothecary", { mode: "reverse" }),
            icon: (sz) => <Flask size={sz} c={theme.sageDeep} />,
            tour: "home-experiment",
          },
          {
            label: "Brew",
            onClick: () => go("shelf", { mode: "recipes" }),
            icon: (sz) => <Leaf size={sz} c={theme.sageDeep} />,
            tour: "home-brew",
          },
          {
            label: "Write",
            onClick: () => go("shelf", { mode: "journal" }),
            icon: (sz) => <Pencil size={sz} c={theme.sageDeep} />,
            tour: "home-write",
          },
        ].map((cta, i) => (
          <button
            key={i}
            onClick={cta.onClick}
            className="home-cta"
            data-tour={cta.tour}
          >
            {cta.icon(26)}
            <div style={{
              fontFamily: ff.sans,
              fontSize: 11,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: theme.inkSoft,
            }}>
              {cta.label}
            </div>
          </button>
        ))}
      </div>

      {/* Herbanium — the reference book. Thin full-width button sits
          beneath the three primary CTAs as a quieter doorway into the
          apothecary's compendium of every leaf, flower, root, and bark. */}
      <button
        onClick={() => go("apothecary", { mode: "compendium" })}
        className="home-cta home-cta-thin"
        data-tour="home-herbanium"
        style={{
          marginTop: -16,
          marginBottom: 24,
          fontFamily: ff.sans,
          fontSize: 11,
          letterSpacing: "0.18em",
          textTransform: "uppercase",
        }}
      >
        {/* Open-book glyph — thin-stroke pages with a center spine,
            a couple of faint binding marks. Sits centered above the
            HERBANIUM label as the visual anchor for the reference button. */}
        <svg width="18" height="14" viewBox="0 0 18 14" fill="none" aria-hidden>
          <path
            d="M1.5 3 C 3.5 2.2, 6 2.2, 9 3 C 12 2.2, 14.5 2.2, 16.5 3
               L 16.5 11.5
               C 14.5 10.7, 12 10.7, 9 11.5
               C 6 10.7, 3.5 10.7, 1.5 11.5 Z"
            stroke={theme.sageDeep} strokeWidth="1" strokeLinejoin="round" fill="none"
          />
          <path d="M9 3 L 9 11.5" stroke={theme.sageDeep} strokeWidth="1" strokeLinecap="round" />
          <path d="M3.5 5.2 L 7 4.8 M11 4.8 L 14.5 5.2"
            stroke={theme.sageDeep} strokeWidth="0.7" strokeLinecap="round" opacity="0.6" />
        </svg>
        Herbanium
      </button>

      {/* Mood follow-up card — surfaces pending mood logs from cups
          brewed in the last 24h. Sits above the recent rail because
          it's the most time-sensitive thing on the page; the longer
          we wait to ask, the worse the user's recall. */}
      {pendingMoodSession && (
        <MoodFollowUpCard
          // Stable key on session id forces React to unmount and
          // remount when the pending session changes — without this,
          // submitting the first of several pending cards leaves the
          // component instance alive with `submitted: true` and a
          // `null` score, so the second card opens with its save
          // button disabled even after the user picks a strength.
          key={pendingMoodSession.id}
          session={pendingMoodSession}
          onSubmit={(payload) => patchSessionMoods?.(pendingMoodSession.id, payload)}
          onDismiss={() => dismissSessionMoods?.(pendingMoodSession.id)}
        />
      )}

      {/* Your recent cups — header stays even before any brew so a
          new user sees this is the window where their cups will land. */}
      <div data-tour="home-recent" style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 8 }}>
        <SectionLabel n="i">Recent brews</SectionLabel>
        {yourSessions.length > 0 && (
          <button onClick={() => go("shelf", { mode: "journal", journalFilter: "cups" })} style={{
            background: "transparent", border: "none",
            fontFamily: ff.serif, fontStyle: "italic", fontSize: 11, color: theme.ash,
            cursor: "pointer",
          }}>see all →</button>
        )}
      </div>
      {yourSessions.length > 0 ? (
        <div>
          {yourSessions.slice(0, 5).map((s, i) => (
            <CompactSessionRow key={s.id} s={s} openCup={openCup} first={i === 0} />
          ))}
        </div>
      ) : (
        <div style={{
          padding: "14px 16px", borderRadius: 10,
          border: `1px dashed ${theme.ruleSoft}`,
          background: "transparent",
          fontFamily: ff.serif, fontStyle: "italic", fontSize: 13,
          color: theme.ash, lineHeight: 1.5, textAlign: "center",
        }}>
          Your last few cups will land here once you've brewed something.
        </div>
      )}

    </div>
  );
};

// Compact 3-line cup card used on Home's recent-brews list.
// Reads as a small table — each line a different lens on the cup —
// so the user can scan how it impacted them and why they had it:
//
//   Quiet Cup                              ●●●●● · 2h ago
//   for calm  →  calm
//   floral · 75°C · 4m
//
// Line 1: name · rating · relative time
// Line 2: blend's intent (b.mood) → actual landed mood
// Line 3: lead flavor + steep temp + steep time
//
// "for X" comes from the blend's primary mood — what the cup is
// known for, the reason a user reaches for it. "actual" is the
// joined string of moods that landed for this brew. The "brewed"
// placeholder (no specific landing) shows as a hanging arrow.
export const CompactSessionRow = ({ s, openCup, first }) => {
  const b = getBlend(s.blendId);
  if (!b) return null;
  const { unit } = useUnit();
  // Cup-level "for X" reads from the blend's primary mood (what the
  // cup is known for) so it's available even on sessions that didn't
  // capture user-specific currentMoods. The "→ X" half prefers the
  // user's reached-for targetMoods, falling back to the legacy actual
  // string. Mood-score dots after that tell how strongly the cup
  // delivered.
  const start = (s.currentMoods || []).join(", ").trim();
  const moodScore = coerceMoodScore(s);
  const verdict = moodScore == null ? null : moodScore >= 4 ? "up" : moodScore <= 2 ? "down" : null;
  const moodArc = buildMoodArc(s, verdict);
  const flavorTally = flavorTallyFor(s);
  const flavor = b.flavor
    || (Array.isArray(b.flavors) && b.flavors[0])
    || "";
  // Prefer the session's recorded brew settings — the user may have
  // pushed the explorer sliders off the recipe defaults — and fall
  // back to the blend's curated values when nothing was captured.
  const cupTempC = (typeof s.tempC === "number") ? s.tempC : b.tempC;
  const cupTimeS = (typeof s.timeS === "number") ? s.timeS : b.timeS;
  const tempStr = cupTempC
    ? formatTempShort(cupTempC, cupTempC, unit)
    : "";
  const timeStr = cupTimeS
    ? `${Math.round(cupTimeS / 60)}m`
    : "";
  const brewParts = [flavor, tempStr, timeStr].filter(Boolean);

  return (
    <button onClick={() => openCup?.(s.id)} style={{
      width: "100%", textAlign: "left", background: "transparent",
      border: "none", borderTop: first ? "none" : `1px solid ${theme.ruleSoft}`,
      padding: "10px 2px", cursor: "pointer",
      display: "flex", flexDirection: "column", gap: 3,
    }}>
      {/* Row 1 — blend name (left, ellipsis) + relative time (right). */}
      <div style={{
        display: "flex", alignItems: "baseline", gap: 10, minWidth: 0,
      }}>
        <span style={{
          flex: 1, minWidth: 0,
          fontFamily: ff.serif, fontSize: 14.5, color: theme.ink,
          whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
        }}>
          {b.name}
        </span>
        <span style={{
          flexShrink: 0, fontSize: 10, color: theme.ash, letterSpacing: "0.06em",
        }}>{sessionAgo(s) || s.ago}</span>
      </div>

      {/* Row 2 — mood arc on the left, taste dots on the right.
          The arc reads "[coming-in mood] → [moods that emerged]"
          where the right side is colored sage-deep on a delivered
          cup, terra on a missed cup, and ink-soft on legacy / not-
          yet-filled rows. The verdict color carries the signal so
          we don't need a thumb icon or separate "+ extras" tag. */}
      {(start || moodArc.endLabel || s.taste != null) && (
        <div style={{
          display: "flex", alignItems: "center", gap: 8, minWidth: 0,
        }}>
          <span style={{
            flex: 1, minWidth: 0,
            fontFamily: ff.serif, fontStyle: "italic", fontSize: 11.5,
            lineHeight: 1.35,
            whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
          }}>
            {start && (
              <span style={{ color: theme.ochre, fontStyle: "normal" }}>{start}</span>
            )}
            {(start && moodArc.endLabel) && (
              <span style={{ margin: "0 5px", color: theme.terra, fontStyle: "normal" }}>→</span>
            )}
            {moodArc.endLabel && (
              <span style={{ color: moodArc.endColor, fontStyle: "normal" }}>{moodArc.endLabel}</span>
            )}
          </span>
          {s.taste != null && (
            <span style={{
              flexShrink: 0, fontSize: 10.5, color: theme.terra, letterSpacing: "0.08em",
            }}>
              {"●".repeat(s.taste)}<span style={{ color: theme.rule }}>{"●".repeat(5-s.taste)}</span>
            </span>
          )}
        </div>
      )}

      {(brewParts.length > 0 || flavorTally) && (
        <div style={{
          fontFamily: ff.sans, fontSize: 10.5,
          color: theme.ash, letterSpacing: "0.04em",
          whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
        }}>
          {brewParts.join(" · ")}
          {flavorTally && (
            <>
              {brewParts.length > 0 && " · "}
              <span style={{ color: theme.sageDeep }}>{flavorTally.hits}/{flavorTally.total}</span> notes
            </>
          )}
        </div>
      )}
    </button>
  );
};

// Lean one-line SessionRow used in the Shelf > Journal timeline.
// Shows blend name, starting → ending moods, taste dots, relative
// time. When only one side of the mood pair is logged, the arrow
// hangs on the absent side as a tiny tell — "tired →" for a logged
// starting mood without a recorded landing, "→ calm" for a logged
// landing without a recorded start.
// Coerce a legacy landed-map (per-mood true/false) into a single
// 1-5 mood arrival score so older sessions render with the new
// dot-strength UI. all-true → 5, mixed → 3, all-false → 1, empty
// → null. Newer sessions carry s.moodScore directly and skip this.
const coerceMoodScore = (s) => {
  if (typeof s?.moodScore === "number") return s.moodScore;
  const landed = s?.landed;
  if (!landed || typeof landed !== "object") return null;
  const vals = Object.values(landed);
  if (vals.length === 0) return null;
  const trueCount = vals.filter(Boolean).length;
  if (trueCount === 0) return 1;
  if (trueCount === vals.length) return 5;
  return 3;
};

// Flavor tally — "n / m" notes that landed, derived from the
// follow-up card's tasted/missed booleans against the predicted
// flavor list. Returns null when there's no flavor data on the
// session (older entries, blends without a published profile).
const flavorTallyFor = (s) => {
  const target = Array.isArray(s?.flavorsTarget) ? s.flavorsTarget : [];
  const tasted = s?.flavorsTasted;
  if (target.length === 0 || !tasted || typeof tasted !== "object") return null;
  const hits = target.filter(f => tasted[f] === true).length;
  return { hits, total: target.length };
};

// Mood arc for cup rows. Returns the end-side label and color
// derived from the follow-up verdict:
//   thumbs up → targets + extras, sage-deep (cup delivered + any
//               unexpected register that came along)
//   thumbs down → extras alone (target missed); "—" if no extras,
//               terra in either case
//   no verdict → targets + extras, neutral ink-soft
// `endLabel` is "" when there's nothing to say on the end side
// (legacy session with no targets and no extras). Caller decides
// whether to render the arrow at all based on start/end presence.
const buildMoodArc = (s, verdict) => {
  const targets = Array.isArray(s?.targetMoods) ? s.targetMoods.filter(Boolean) : [];
  const extras  = Array.isArray(s?.extraMoods)  ? s.extraMoods.filter(Boolean)  : [];
  const legacyEnd = (() => {
    const a = (s?.actual || "").trim();
    return (!a || a.toLowerCase() === "brewed") ? "" : a;
  })();
  let endParts = [];
  let endColor;
  if (verdict === "up") {
    endParts = [...targets, ...extras];
    endColor = theme.sageDeep;
  } else if (verdict === "down") {
    endParts = extras.length > 0 ? extras : [];
    endColor = theme.terra;
  } else {
    // No verdict — fall back to targets / extras / legacy `actual`
    endParts = targets.length > 0 || extras.length > 0
      ? [...targets, ...extras]
      : (legacyEnd ? [legacyEnd] : []);
    endColor = theme.inkSoft;
  }
  const endLabel = verdict === "down" && endParts.length === 0
    ? "—"
    : endParts.join(", ");
  return { endLabel, endColor };
};

export const SessionRow = ({ s, openCup, first }) => {
  const b = getBlend(s.blendId);
  if (!b) return null;

  const start = (s.currentMoods || []).join(", ").trim();
  const moodScore = coerceMoodScore(s);
  const verdict = moodScore == null ? null : moodScore >= 4 ? "up" : moodScore <= 2 ? "down" : null;
  const moodArc = buildMoodArc(s, verdict);
  const flavorTally = flavorTallyFor(s);
  const ago = sessionAgo(s) || s.ago;

  // Two-row layout matching JournalEntryRow so cups and entries scan
  // as one consistent timeline:
  //   row 1 — leading glyph + blend name on left, time far right
  //   row 2 — mood arc (start → target + mood-score dots) on left,
  //           taste dots on right
  // The mood arc gets explicit colors to read as a transition: ochre
  // for the coming-in mood, terra arrow for the change, sage-deep for
  // the target. Mood-score dots are sage-deep filled / rule-color
  // hollow — distinct from the terra taste dots so the eye reads
  // them as two named axes, not interchangeable rings.
  return (
    <button onClick={() => openCup?.(s.id)} style={{
      width: "100%", textAlign: "left", background: "transparent",
      border: "none", borderTop: first ? "none" : `1px solid ${theme.ruleSoft}`,
      borderLeft: `2px solid ${theme.sage}`,
      padding: "10px 2px 10px 10px", cursor: "pointer",
      display: "flex", gap: 8, minWidth: 0,
    }}>
      <span style={{ flexShrink: 0, display: "inline-flex", paddingTop: 2 }}>
        <Kettle size={14} c={theme.sageDeep} />
      </span>
      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 3 }}>
        {/* Header: blend name (left, ellipsis) + relative time (right) */}
        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8,
        }}>
          <span style={{
            flex: 1, minWidth: 0,
            fontFamily: ff.serif, fontSize: 13.5, color: theme.ink,
            whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
          }}>
            {b.name}
            {s.who !== "you" && (
              <span style={{ fontStyle: "italic", fontSize: 11, color: theme.ash, marginLeft: 6 }}>
                · {s.who}
              </span>
            )}
          </span>
          <span style={{
            flexShrink: 0, fontFamily: ff.serif, fontStyle: "italic",
            fontSize: 11, color: theme.ash,
          }}>{ago}</span>
        </div>
        {/* Sub-row: mood arc colored by verdict on left, taste dots
            on right. Verdict color (sage-deep / terra / ink-soft)
            carries the signal so no thumb icon or +extras tag. */}
        {(start || moodArc.endLabel || s.taste != null) && (
          <div style={{
            display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8,
          }}>
            <span style={{
              flex: 1, minWidth: 0,
              fontFamily: ff.serif, fontStyle: "italic", fontSize: 11,
              whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
            }}>
              {start && (
                <span style={{ color: theme.ochre, fontStyle: "normal" }}>{start}</span>
              )}
              {(start && moodArc.endLabel) && (
                <span style={{ margin: "0 5px", color: theme.terra, fontStyle: "normal" }}>→</span>
              )}
              {moodArc.endLabel && (
                <span style={{ color: moodArc.endColor, fontStyle: "normal" }}>{moodArc.endLabel}</span>
              )}
            </span>
            {s.taste != null && (
              <span style={{
                flexShrink: 0, fontSize: 10, color: theme.terra, letterSpacing: "0.08em",
              }}>
                {"●".repeat(s.taste)}<span style={{ color: theme.rule }}>{"●".repeat(5-s.taste)}</span>
              </span>
            )}
          </div>
        )}
        {flavorTally && (
          <div style={{
            fontFamily: ff.sans, fontSize: 10,
            color: theme.ash, letterSpacing: "0.04em",
          }}>
            <span style={{ color: theme.sageDeep }}>{flavorTally.hits}/{flavorTally.total}</span> notes landed
          </div>
        )}
      </div>
    </button>
  );
};
