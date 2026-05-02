/* ──────────────────────────────────────────────────────────────
   screens/HomeScreen.jsx — Home screen plus its row components
   (CompactSessionRow, SessionRow).
   ────────────────────────────────────────────────────────────── */

import React from "react";
import {
  Flask, Kettle, Leaf, Ornament, Pencil,
} from "../components/icons";
import {
  Button, FitText, SectionLabel,
} from "../components/layout";
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
    if ((s.targetMoods?.length || 0) === 0) return false;
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
      {/* Empty-state welcome header — first-time users see this
          before any poem card. Returning users get their greeting
          below the poem instead so the time-of-day moment lands
          first. */}
      {isEmpty && (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16, gap: 12 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <FitText style={{ fontFamily: ff.serif, fontSize: 28, fontWeight: 400, color: theme.ink, lineHeight: 1.05 }}>
              <>Welcome, <em style={{ color: theme.terra }}>{name}</em>.</>
            </FitText>
          </div>
        </div>
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
            <div style={{
              marginBottom: 14,
              padding: "14px 22px 16px",
              borderRadius: radius.md,
              background: theme.cream,
              border: `1px solid ${theme.ruleSoft}`,
              boxShadow: shadow.card,
              textAlign: "center",
            }}>
              <div style={{ display: "flex", justifyContent: "center", marginBottom: 6 }}>
                <Ornament w={80} c={theme.ochre} />
              </div>
              <div style={{
                fontFamily: ff.serif, fontSize: 17, color: theme.ink,
                lineHeight: 1.25, marginBottom: poem ? 8 : 3,
              }}>
                {tod.label}.
              </div>
              {poem ? (
                <>
                  <div style={{
                    fontFamily: ff.serif, fontStyle: "italic", fontSize: 12.5,
                    color: theme.inkSoft, lineHeight: 1.5,
                    whiteSpace: "pre-line",
                  }}>
                    {poem.text}
                  </div>
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
            <div style={{
              marginBottom: 18, marginTop: 8,
              textAlign: "center",
            }}>
              <div style={{
                width: 36, height: 1, margin: "0 auto 10px",
                background: theme.rule,
              }} />

              <FitText style={{
                fontFamily: ff.serif, fontSize: 28, fontWeight: 400,
                color: theme.ink, lineHeight: 1.05,
                fontStyle: "italic",
                letterSpacing: "-0.005em",
              }}>
                <>What's the tea, <em style={{
                  color: theme.terra, fontStyle: "normal",
                  fontWeight: 500,
                }}>{name}</em>?</>
              </FitText>
              <div style={{
                width: 36, height: 1, margin: "10px auto 0",
                background: theme.rule,
              }} />
            </div>
          </>
        );
      })()}

      {/* Activity block — mood follow-up (when present) + recent
          brews. Lives ABOVE the CTAs so a returning user opens Home
          and sees their last cup or pending mood log first; only
          first-time users with no activity see the empty-state
          recent placeholder above the CTAs. The two read as one
          group ("pick up where you left off") without needing an
          explicit heading because the cup rows are visually distinct
          from the CTA tiles below. */}
      {pendingMoodSession && (
        <MoodFollowUpCard
          session={pendingMoodSession}
          onSubmit={(payload) => patchSessionMoods?.(pendingMoodSession.id, payload)}
          onDismiss={() => dismissSessionMoods?.(pendingMoodSession.id)}
        />
      )}

      {yourSessions.length > 0 && (
        <div style={{ marginBottom: 22 }}>
          <div style={{
            display: "flex", justifyContent: "space-between",
            alignItems: "baseline", marginBottom: 8,
          }}>
            <SectionLabel n="i">Recent brews</SectionLabel>
            <button onClick={() => go("shelf", { mode: "journal", journalFilter: "cups" })} style={{
              background: "transparent", border: "none",
              fontFamily: ff.serif, fontStyle: "italic", fontSize: 11, color: theme.ash,
              cursor: "pointer",
            }}>see all →</button>
          </div>
          <div>
            {yourSessions.slice(0, 5).map((s, i) => (
              <CompactSessionRow key={s.id} s={s} openCup={openCup} first={i === 0} />
            ))}
          </div>
        </div>
      )}

      {/* CTA cluster — three primary actions and a quieter Herbanium
          doorway for the reference book. Sits BELOW the activity rail
          so returning users see their cups first; first-time users
          (no activity) see the cluster as the page's main offering. */}
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
            label: "Brew",
            onClick: () => go("shelf", { mode: "recipes" }),
            icon: (sz) => <Leaf size={sz} c={theme.sageDeep} />,
          },
          {
            label: "Experiment",
            onClick: () => go("apothecary", { mode: "reverse" }),
            icon: (sz) => <Flask size={sz} c={theme.sageDeep} />,
          },
          {
            label: "Write",
            onClick: () => go("shelf", { mode: "journal" }),
            icon: (sz) => <Pencil size={sz} c={theme.sageDeep} />,
          },
        ].map((cta, i) => (
          <button
            key={i}
            onClick={cta.onClick}
            className="home-cta"
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

      {/* First-time empty hint — only shown when there's no activity
          above the CTAs. Tells new users where their brewed cups will
          land so the Home page doesn't feel like it ends at the CTA
          row. Returning users (yourSessions > 0) never see this. */}
      {isEmpty && (
        <div style={{
          marginTop: 4,
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
  const desiredMood = b.mood || "";
  const endRaw = (s.actual || "").trim();
  const endMood = (!endRaw || endRaw.toLowerCase() === "brewed") ? "" : endRaw;
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
          flexShrink: 0, fontSize: 10.5, color: theme.terra, letterSpacing: "0.08em",
        }}>
          {"●".repeat(s.taste)}<span style={{ color: theme.rule }}>{"●".repeat(5-s.taste)}</span>
        </span>
        <span style={{
          flexShrink: 0, fontSize: 10, color: theme.ash, letterSpacing: "0.06em",
        }}>{sessionAgo(s) || s.ago}</span>
      </div>

      {(desiredMood || endMood) && (
        <div style={{
          fontFamily: ff.serif, fontStyle: "italic", fontSize: 11.5,
          color: theme.ash, lineHeight: 1.35,
          whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
        }}>
          {desiredMood && (<span>for <span style={{ color: theme.inkSoft, fontStyle: "normal" }}>{desiredMood}</span></span>)}
          <span style={{ margin: "0 6px", color: theme.rule, fontStyle: "normal" }}>→</span>
          {endMood && (<span style={{ color: theme.sageDeep, fontStyle: "normal" }}>{endMood}</span>)}
        </div>
      )}

      {brewParts.length > 0 && (
        <div style={{
          fontFamily: ff.sans, fontSize: 10.5,
          color: theme.ash, letterSpacing: "0.04em",
          whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
        }}>
          {brewParts.join(" · ")}
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
export const SessionRow = ({ s, openCup, first }) => {
  const b = getBlend(s.blendId);
  if (!b) return null;

  const start = (s.currentMoods || []).join(", ").trim();
  const endRaw = (s.actual || "").trim();
  // "brewed" is the placeholder the log writes when no specific
  // landing-moods were captured — treat it as no ending logged.
  const end = (!endRaw || endRaw.toLowerCase() === "brewed") ? "" : endRaw;
  const arrow = (
    <span style={{ margin: "0 4px", color: theme.rule, fontStyle: "normal" }}>→</span>
  );

  return (
    <button onClick={() => openCup?.(s.id)} style={{
      width: "100%", textAlign: "left", background: "transparent",
      border: "none", borderTop: first ? "none" : `1px solid ${theme.ruleSoft}`,
      borderLeft: `2px solid ${theme.sage}`,
      padding: "8px 2px 8px 10px", cursor: "pointer",
      display: "flex", alignItems: "center", gap: 8, minWidth: 0,
    }}>
      {/* Leading glyph — kettle accent so the journal timeline reads
          cup vs entry at a glance. Sage-tinted to match the left edge. */}
      <span style={{ flexShrink: 0, display: "inline-flex" }}>
        <Kettle size={14} c={theme.sageDeep} />
      </span>
      <span style={{
        flexShrink: 1, minWidth: 0,
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
      {(start || end) && (
        <span style={{
          flexShrink: 1, minWidth: 0,
          fontFamily: ff.serif, fontStyle: "italic", fontSize: 11,
          color: theme.ash, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
        }}>
          {start && (<span>{start}</span>)}
          {arrow}
          {end && (
            <span style={{ color: theme.sageDeep, fontStyle: "normal" }}>{end}</span>
          )}
        </span>
      )}
      <span style={{
        flexShrink: 0, fontSize: 10, color: theme.terra, letterSpacing: "0.08em",
      }}>
        {"●".repeat(s.taste)}<span style={{ color: theme.rule }}>{"●".repeat(5-s.taste)}</span>
      </span>
      <span style={{
        flexShrink: 0, fontSize: 10, color: theme.ash, letterSpacing: "0.06em",
      }}>{sessionAgo(s) || s.ago}</span>
    </button>
  );
};

// Inline follow-up card for sessions that brewed in the last 24h
// without a mood log. The user dismissed the post-brew screen too
// soon to assess mood (caffeine hadn't hit, calm hadn't settled),
// so we ask now — landed/missed pills for each target mood, plus a
// dismiss arrow for "I'd rather not say." Submit patches the
// session, dismiss clears the pending flag without filling moods.
//
// Lives at the top of Home so it's the first thing the user sees on
// return — the longer we wait to ask, the worse the recall, and
// burying it under favorites turns it into a maintenance task.
const MoodFollowUpCard = ({ session, onSubmit, onDismiss }) => {
  const blend = getBlend(session.blendId);
  const targets = session.targetMoods || [];
  const [landed, setLanded] = React.useState(() =>
    Object.fromEntries(targets.map(m => [m, true]))
  );
  const [followNote, setFollowNote] = React.useState("");
  const [submitted, setSubmitted] = React.useState(false);

  if (!blend || targets.length === 0) return null;

  const minutesAgo = Math.max(1, Math.round((Date.now() - (session.brewedAt || 0)) / 60000));
  const timeLabel = minutesAgo < 60
    ? `${minutesAgo} min ago`
    : `${Math.round(minutesAgo / 60)}h ago`;

  const submit = () => {
    if (submitted) return;
    setSubmitted(true);
    onSubmit?.({ landed, extra: [], noteAppend: followNote.trim() });
  };

  return (
    <div style={{
      marginBottom: 14, padding: "12px 14px",
      borderRadius: 10,
      background: "rgba(165, 120, 54, 0.07)",
      border: `1px solid ${theme.ochre}`,
      display: "flex", flexDirection: "column", gap: 10,
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontFamily: ff.sans, fontSize: 9.5, letterSpacing: "0.18em",
            textTransform: "uppercase", color: theme.ochre, marginBottom: 4,
          }}>
            How did it land?
          </div>
          <div style={{
            fontFamily: ff.serif, fontStyle: "italic", fontSize: 13,
            color: theme.inkSoft, lineHeight: 1.4,
          }}>
            Your <span style={{ color: theme.ink, fontStyle: "normal", fontWeight: 500 }}>{blend.name}</span>
            {" "}from {timeLabel} — did the moods you reached for actually arrive?
          </div>
        </div>
        <button
          onClick={onDismiss}
          aria-label="dismiss"
          style={{
            flexShrink: 0, background: "transparent", border: "none",
            color: theme.ash, fontSize: 18, lineHeight: 1, padding: "0 4px",
            cursor: "pointer",
          }}
        >×</button>
      </div>

      <div style={{
        display: "flex", flexDirection: "column", gap: 6,
        background: theme.cream, borderRadius: 8, padding: "8px 10px",
        border: `1px solid ${theme.ruleSoft}`,
      }}>
        {targets.map(m => (
          <div key={m} style={{
            display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8,
          }}>
            <span style={{ fontFamily: ff.serif, fontSize: 14, color: theme.ink }}>
              <em style={{ color: theme.terra, fontStyle: "normal" }}>{m}</em>
            </span>
            <div style={{ display: "flex", gap: 5 }}>
              {[
                ["landed", true],
                ["missed", false],
              ].map(([label, v]) => {
                const isActive = landed[m] === v;
                return (
                  <button
                    key={label}
                    onClick={() => setLanded(prev => ({ ...prev, [m]: v }))}
                    style={{
                      fontFamily: ff.sans, fontSize: 10.5, letterSpacing: "0.02em",
                      padding: "3px 9px", borderRadius: 999,
                      border: `1px solid ${isActive ? (v ? theme.sageDeep : theme.terra) : theme.rule}`,
                      background: isActive ? (v ? theme.sageDeep : theme.terra) : "transparent",
                      color: isActive ? theme.cream : theme.inkSoft,
                      cursor: "pointer",
                      transition: "background 0.2s ease, color 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease",
                      boxShadow: isActive
                        ? (v ? "0 2px 6px -1px rgba(74,87,58,0.30)" : "0 2px 6px -1px rgba(176,84,47,0.30)")
                        : "0 1px 2px rgba(30,24,18,0.05)",
                    }}
                  >{label}</button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Optional follow-up note. Lives below the landed/missed pills
          because mood is what the user is reflecting on by the time
          they reach this field — anything they want to say about how
          the cup actually played out gets appended onto the session's
          existing brew-time note. */}
      <textarea
        value={followNote}
        onChange={(e) => setFollowNote(e.target.value)}
        placeholder="anything to add about how it played out?"
        style={{
          width: "100%", minHeight: 44,
          background: theme.cream, border: `1px solid ${theme.ruleSoft}`,
          borderRadius: 8, padding: "8px 10px",
          fontFamily: ff.serif, fontSize: 13, color: theme.ink,
          resize: "vertical", outline: "none",
          boxSizing: "border-box",
        }}
      />

      <Button
        variant="primary" tone="ink" fullWidth
        onClick={submit}
        disabled={submitted}
        style={{ fontSize: 14, padding: "11px" }}
      >
        {submitted ? "saved" : "save mood"}
      </Button>
    </div>
  );
};
