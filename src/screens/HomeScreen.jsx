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
import { FirstCupHintCard } from "../components/FirstCupHintCard";
import { BLENDS } from "../data/blends";
import { getBlend, mmss } from "../helpers/misc";
import {
  ff, theme,
} from "../theme";
import {
  formatTempShort, useUnit,
} from "../units/units";

/* ──────────────────────────────────────────────────────────────
   Screen: HOME
   ────────────────────────────────────────────────────────────── */

// Contextual line based on the hour. Returns { label, note }.
// Kept quiet and observational — not commanding, not whimsical.
const getTimeOfDay = (h) => {
  if (h >= 5  && h <  8) return { label: "Early morning",  note: "the kettle is the first voice" };
  if (h >= 8  && h < 11) return { label: "Morning",        note: "something awake, something bright" };
  if (h >= 11 && h < 13) return { label: "Late morning",   note: "the light is clear, the day still open" };
  if (h >= 13 && h < 16) return { label: "Afternoon",      note: "a cup between the hours" };
  if (h >= 16 && h < 19) return { label: "Late afternoon", note: "slow the hand, steep the thought" };
  if (h >= 19 && h < 22) return { label: "Evening",        note: "the kettle softens the room" };
  if (h >= 22 || h <  2) return { label: "Late evening",   note: "a cup to lower the lights" };
  return                         { label: "Small hours",   note: "when the kettle is a companion" };
};

export const HomeScreen = ({ go, openBlend, openInCompose, sessions, savedBlendIds, favoriteBlendIds, profile, firstCupHintShown, dismissFirstCupHint, animisBanished }) => {
  const yourSessions = sessions.filter(s => s.who === "you");
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
      {/* First-cup hint — tutorial card pointing at Compose / Apothecary.
          Replaces the old animi-omen popup; the unique animi reveal now
          fires on first Profile visit instead. Auto-hides once the user
          has logged any cup. */}
      {!firstCupHintShown && profile && yourSessions.length === 0 && (
        <FirstCupHintCard
          onDismiss={dismissFirstCupHint}
          onCompose={() => { dismissFirstCupHint(); go("apothecary"); }}
          onApothecary={() => { dismissFirstCupHint(); go("shelf"); }}
        />
      )}

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
        const tod = getTimeOfDay(new Date().getHours());
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
              lineHeight: 1.25, marginBottom: 3,
            }}>
              {tod.label}.
            </div>
            <div style={{
              fontFamily: ff.serif, fontStyle: "italic", fontSize: 12.5,
              color: theme.ash, lineHeight: 1.5,
            }}>
              {tod.note}
            </div>
          </div>
        );
      })()}

      {/* Primary CTA — brew. Secondary "Note a moment" lives under
          the favorites bar below. */}
      <button onClick={() => go("apothecary")} style={{
        width: "100%", textAlign: "left",
        background: theme.ink, color: theme.cream,
        border: "none", borderRadius: 14, padding: "14px 18px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        cursor: "pointer", marginBottom: 24,
        boxShadow: "0 8px 24px -12px rgba(30,24,18,0.4)",
      }}>
        <div>
          {isEmpty && (
            <div style={{ fontFamily: ff.serif, fontStyle: "italic", fontSize: 12, opacity: 0.7 }}>
              to begin your journal
            </div>
          )}
          <div style={{ fontFamily: ff.serif, fontSize: 20 }}>
            {isEmpty ? "Brew your first cup →" : "Brew a cup →"}
          </div>
        </div>
        <Kettle size={24} c={theme.cream} />
      </button>

      {/* New-user onboarding card */}
      {isEmpty && (
        <div style={{
          padding: "18px 20px", borderRadius: 12,
          background: theme.cream, border: `1px solid ${theme.ruleSoft}`,
          marginBottom: 22, textAlign: "center",
        }}>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 10 }}>
            <Ornament w={120} c={theme.ochre} />
          </div>
          <div style={{
            fontFamily: ff.sans, fontSize: 10, letterSpacing: "0.22em", textTransform: "uppercase", color: theme.ash,
            marginBottom: 6,
          }}>
            your journal begins here
          </div>
          <div style={{
            fontFamily: ff.serif, fontStyle: "italic", fontSize: 14.5,
            color: theme.inkSoft, lineHeight: 1.55,
          }}>
            Set a cup out. Brew it with intent. Log how it landed.<br />
            The app learns you cup by cup.
          </div>
          <div style={{ display: "flex", justifyContent: "center", marginTop: 12 }}>
            <Ornament w={120} c={theme.ochre} />
          </div>
        </div>
      )}

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

      {/* Secondary CTA — note a moment, lives below the favorites row. */}
      <button onClick={() => go("shelf", { mode: "journal" })} style={{
        width: "100%", textAlign: "left",
        background: theme.cream, color: theme.ink,
        border: `1px solid ${theme.ink}`, borderRadius: 14, padding: "14px 18px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        cursor: "pointer", marginBottom: 24,
      }}>
        <div style={{ fontFamily: ff.serif, fontSize: 20 }}>
          Note a moment →
        </div>
        <Pencil size={20} c={theme.ink} />
      </button>

      {/* Your recent cups */}
      {yourSessions.length > 0 && (
        <>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 8 }}>
            <SectionLabel n={favoriteBlends.length > 0 ? "ii" : "i"}>Recent brews</SectionLabel>
            <button onClick={() => go("shelf", { mode: "pantry" })} style={{
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

      {/* Quiet footer — speaks to the local-first nature of the journal
          and nudges the eye-to-eye sharing the project values. */}
      <div style={{
        marginTop: 28, padding: "14px 4px",
        textAlign: "center",
        fontFamily: ff.serif, fontStyle: "italic", fontSize: 11.5,
        color: theme.ash, lineHeight: 1.55,
        borderTop: `1px solid ${theme.ruleSoft}`,
      }}>
        Your journal lives on this device — no account, no cloud.
        Whip it out, show a friend, meet eye to eye, brew a cup together.
      </div>
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

export const CompactSessionRow = ({ s, openBlend, first }) => {
  const b = getBlend(s.blendId);
  if (!b) return null;
  return (
    <button onClick={() => openBlend(s.blendId, s)} style={{
      width: "100%", textAlign: "left", background: "transparent",
      border: "none", borderTop: first ? "none" : `1px solid ${theme.ruleSoft}`,
      padding: "10px 2px", cursor: "pointer",
      display: "grid", gridTemplateColumns: "1fr auto auto", gap: 12, alignItems: "center",
    }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 8, minWidth: 0 }}>
        <span style={{ fontFamily: ff.serif, fontSize: 15, color: theme.ink, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {b.name}
        </span>
        <span style={{ fontFamily: ff.serif, fontStyle: "italic", fontSize: 11, color: theme.ash, whiteSpace: "nowrap" }}>
          {s.intent} → {s.actual}
        </span>
      </div>
      <span style={{ fontSize: 11, color: theme.terra, letterSpacing: "0.1em" }}>
        {"●".repeat(s.taste)}<span style={{ color: theme.rule }}>{"●".repeat(5-s.taste)}</span>
      </span>
      <span style={{ fontSize: 10.5, color: theme.ash, letterSpacing: "0.08em" }}>{s.ago}</span>
    </button>
  );
};

// Legacy SessionRow — still used in Library history tab.
export const SessionRow = ({ s, openBlend, first }) => {
  const b = getBlend(s.blendId);
  if (!b) return null;
  return (
    <button onClick={() => openBlend(s.blendId, s)} style={{
      width: "100%", textAlign: "left", background: "transparent",
      border: "none", borderTop: first ? "none" : `1px solid ${theme.ruleSoft}`,
      padding: "14px 2px", cursor: "pointer",
      display: "grid", gridTemplateColumns: "28px 1fr auto", gap: 12, alignItems: "start",
    }}>
      <div style={{ marginTop: 2 }}>
        {(() => {
          const Icon = MOOD_ICONS[b.mood] || Flower;
          return <Icon size={22} />;
        })()}
      </div>
      <div>
        <div style={{ fontFamily: ff.serif, fontSize: 17, color: theme.ink, lineHeight: 1.2 }}>
          {b.name}
          {s.who !== "you" && <span style={{ fontStyle: "italic", fontSize: 12, color: theme.ash, marginLeft: 6 }}>· {s.who}</span>}
        </div>
        <div style={{ fontSize: 11.5, color: theme.ash, marginTop: 3, letterSpacing: "0.03em" }}>
          <span style={{ fontStyle: "italic", fontFamily: ff.serif }}>{s.intent}</span>
          <span style={{ margin: "0 6px", color: theme.rule }}>→</span>
          <span style={{ color: theme.sageDeep }}>{s.actual}</span>
          <span style={{ margin: "0 8px", color: theme.rule }}>·</span>
          <span>{"●".repeat(s.taste)}<span style={{ color: theme.rule }}>{"●".repeat(5-s.taste)}</span></span>
        </div>
        {s.note && (
          <div style={{ fontFamily: ff.serif, fontStyle: "italic", fontSize: 13, color: theme.inkSoft, marginTop: 5 }}>
            "{s.note}"
          </div>
        )}
      </div>
      <div style={{ fontSize: 10.5, color: theme.ash, letterSpacing: "0.08em", marginTop: 4 }}>{s.ago}</div>
    </button>
  );
};
