/* ──────────────────────────────────────────────────────────────
   screens/HomeScreen.jsx — Home screen plus its row components (FavoriteCard, CompactSessionRow, SessionRow).
   ────────────────────────────────────────────────────────────── */

import React from "react";
import {
  Flower, Kettle, Leaf, Ornament, Pencil, Sprig, MOOD_ICONS,
} from "../components/icons";
import {
  FitText, SectionLabel,
} from "../components/layout";
import { BLENDS } from "../data/blends";
import { WAIT_POEMS } from "../data/waitContent";
import { getBlend, mmss, sessionAgo } from "../helpers/misc";
import {
  ff, theme,
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
// hour and (when possible) season. Stable per day so the user
// gets one quiet line that holds, not a new one on every render.
const pickHomePoem = (date) => {
  const tod = getTimeOfDay(date.getHours());
  const season = seasonOf(date.getMonth());
  const todSet = new Set(tod.todTags);

  const candidates = (WAIT_POEMS || []).filter(p => {
    const tags = p.tags || [];
    return tags.some(t => todSet.has(t));
  });
  // Prefer ones that also match the season; fall back to time-only.
  const seasonMatched = candidates.filter(p => (p.tags || []).includes(season));
  const pool = seasonMatched.length > 0 ? seasonMatched : candidates;
  if (pool.length === 0) return null;

  // Stable hash by the calendar day so the same poem holds for
  // the whole day. Different users on the same day see the same
  // poem — fine since the pool is curated public-domain and the
  // content is impersonal.
  const key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}-${tod.label}`;
  let h = 0;
  for (let i = 0; i < key.length; i++) h = (h << 5) - h + key.charCodeAt(i) | 0;
  return pool[Math.abs(h) % pool.length];
};

export const HomeScreen = ({ go, openBlend, openInCompose, sessions, savedBlendIds, favoriteBlendIds, profile, elementalsDisabled }) => {
  // Home's recent log is brewed cups only — never the private free
  // entries / haiku / limericks that live in journalEntries. Those
  // are only surfaced behind the Shelf > Journal sub-tab where they
  // can also be hidden per-row. We never receive journalEntries here
  // by design; the filter also drops any malformed session without a
  // blendId so the cup log stays clean.
  const yourSessions = sessions.filter(s => s.who === "you" && s.blendId);
  // Home shows true favorites — the curated tier — and falls back to all
  // saved blends until the user has marked any. Resolve every id through
  // getBlend so user-generated / LOCAL_BLENDS entries (the algorithmic
  // experimentals seeded at onboarding) appear alongside catalog blends.
  const favSet = favoriteBlendIds || new Set();
  const sourceIds = favSet.size > 0 ? [...favSet] : [...(savedBlendIds || [])];
  const favoriteBlends = sourceIds
    .map(id => getBlend(id))
    .filter(Boolean);
  const isEmpty = yourSessions.length === 0 && favoriteBlends.length === 0;
  const name = profile?.name || "friend";

  return (
    <div style={{ padding: "18px 20px 32px", fontFamily: ff.sans }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16, gap: 12 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <FitText style={{ fontFamily: ff.serif, fontSize: 28, fontWeight: 400, color: theme.ink, lineHeight: 1.05 }}>
            {isEmpty
              ? <>Welcome, <em style={{ color: theme.terra }}>{name}</em>.</>
              : <>What's the tea, <em style={{ color: theme.terra }}>{name}</em>?</>
            }
          </FitText>
        </div>
      </div>

      {/* Time-of-day contextual card (returning users only) */}
      {!isEmpty && (() => {
        const now = new Date();
        const tod = getTimeOfDay(now.getHours());
        const poem = pickHomePoem(now);
        return (
          <div style={{
            marginBottom: 16,
            padding: "14px 22px 16px",
            borderRadius: 12,
            background: theme.cream,
            border: `1px solid ${theme.ruleSoft}`,
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
              </>
            ) : null}
          </div>
        );
      })()}

      {/* Three primary actions — each points the user at a lower
          tab. Stacked vertically with a clear hierarchy: dark-ink
          for the recipe path (most common), terra-outlined for the
          experiment path, ink-outlined for the journal path. */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 24 }}>
        <button onClick={() => go("shelf", { mode: "recipes" })} style={{
          width: "100%", textAlign: "left",
          background: theme.ink, color: theme.cream,
          border: "none", borderRadius: 14, padding: "12px 18px",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          cursor: "pointer",
          boxShadow: "0 8px 24px -12px rgba(30,24,18,0.4)",
        }}>
          <div style={{ fontFamily: ff.serif, fontSize: 17 }}>
            Brew from a recipe →
          </div>
          <Leaf size={20} c={theme.cream} />
        </button>
        <button onClick={() => go("apothecary")} style={{
          width: "100%", textAlign: "left",
          background: "transparent", color: theme.terra,
          border: `1px solid ${theme.terra}`, borderRadius: 14, padding: "12px 18px",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          cursor: "pointer",
        }}>
          <div style={{ fontFamily: ff.serif, fontSize: 17 }}>
            Brew an experiment →
          </div>
          <Flower size={20} c={theme.terra} />
        </button>
        <button onClick={() => go("shelf", { mode: "journal" })} style={{
          width: "100%", textAlign: "left",
          background: "transparent", color: theme.ink,
          border: `1px solid ${theme.ink}`, borderRadius: 14, padding: "12px 18px",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          cursor: "pointer",
        }}>
          <div style={{ fontFamily: ff.serif, fontSize: 17 }}>
            Note a moment →
          </div>
          <Pencil size={18} c={theme.ink} />
        </button>
      </div>

      {/* Favorites — horizontal scrollable row. Native scrollbar is
          hidden; a soft right-edge fade suggests there's more to scroll
          when the rail overflows. */}
      {favoriteBlends.length > 0 && (
        <>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 10 }}>
            <SectionLabel n="i">Favorites</SectionLabel>
            <span style={{ fontFamily: ff.serif, fontStyle: "italic", fontSize: 11, color: theme.ash }}>
              {favoriteBlends.length} saved
            </span>
          </div>
          <div style={{ position: "relative", marginBottom: 16 }}>
            <div className="fav-scroll" style={{
              display: "flex", gap: 10, overflowX: "auto",
              paddingBottom: 4, marginLeft: -2, paddingLeft: 2,
              scrollbarWidth: "none",
              msOverflowStyle: "none",
            }}>
              {favoriteBlends.map(b => (
                <FavoriteCard key={b.id} b={b} onTap={() => openBlend(b.id)} />
              ))}
            </div>
            {favoriteBlends.length > 2 && (
              <div style={{
                position: "absolute", right: 0, top: 0, bottom: 4,
                width: 32, pointerEvents: "none",
                background: `linear-gradient(to right, rgba(232,220,192,0), ${theme.ivory})`,
              }} />
            )}
          </div>
          <style>{`
            .fav-scroll::-webkit-scrollbar { display: none; }
          `}</style>
        </>
      )}

      {/* Your recent cups */}
      {yourSessions.length > 0 && (
        <>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 8 }}>
            <SectionLabel n={favoriteBlends.length > 0 ? "ii" : "i"}>Recent brews</SectionLabel>
            <button onClick={() => go("shelf", { mode: "journal", journalFilter: "cups" })} style={{
              background: "transparent", border: "none",
              fontFamily: ff.serif, fontStyle: "italic", fontSize: 11, color: theme.ash,
              cursor: "pointer",
            }}>see all →</button>
          </div>
          <div>
            {yourSessions.slice(0, 5).map((s, i) => (
              <CompactSessionRow key={s.id} s={s} openBlend={openBlend} first={i === 0} />
            ))}
          </div>
        </>
      )}

    </div>
  );
};

// Favorite cards — compact snapshots of saved blends in the Home's favorites row.
// One tap opens Compose with the blend pre-selected so intent capture happens.
export const FavoriteCard = ({ b, onTap }) => {
  const { unit, weightUnit } = useUnit();
  return (
    <button onClick={onTap} style={{
      flex: "0 0 auto", width: 150,
      textAlign: "left",
      background: theme.cream, border: `1px solid ${theme.ruleSoft}`,
      borderRadius: 10, padding: "10px 12px", cursor: "pointer",
      display: "flex", flexDirection: "column", gap: 6,
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        {(() => {
          const Icon = MOOD_ICONS[b.mood] || Flower;
          return <Icon size={18} />;
        })()}
        <span style={{
          fontFamily: ff.sans, fontSize: 9, letterSpacing: "0.14em", textTransform: "uppercase",
          color: theme.ash,
        }}>{b.mood}</span>
      </div>
      <div style={{ fontFamily: ff.serif, fontSize: 15, color: theme.ink, lineHeight: 1.15 }}>
        {b.name}
      </div>
      <div style={{ fontFamily: ff.serif, fontStyle: "italic", fontSize: 11, color: theme.ash, lineHeight: 1.3 }}>
        {b.subtitle}
      </div>
      <div style={{ fontFamily: ff.mono, fontSize: 10, color: theme.inkSoft, marginTop: 2 }}>
        {formatTempShort(b.tempC, b.tempC, unit)} · {mmss(b.timeS)}
      </div>
    </button>
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
export const CompactSessionRow = ({ s, openBlend, first }) => {
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
    <button onClick={() => openBlend(s.blendId, s)} style={{
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
export const SessionRow = ({ s, openBlend, first }) => {
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
    <button onClick={() => openBlend(s.blendId, s)} style={{
      width: "100%", textAlign: "left", background: "transparent",
      border: "none", borderTop: first ? "none" : `1px solid ${theme.ruleSoft}`,
      padding: "8px 2px", cursor: "pointer",
      display: "flex", alignItems: "center", gap: 10, minWidth: 0,
    }}>
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
