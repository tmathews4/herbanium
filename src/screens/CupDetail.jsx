/* ──────────────────────────────────────────────────────────────
   screens/CupDetail.jsx — single-session detail view.

   Tapping a cup in the journal (or a favorite on Home, when there's
   a session for it) opens this screen instead of jumping straight
   to the recipe. Shows the lived data of one specific brew:

     - blend name (clickable → recipe)
     - when brewed, at what temp/time
     - taste rating
     - moods: target → landed/missed/extra (or "still resolving")
     - flavors: predicted → tasted/missed/extra
     - note (brew-time + follow-up appended together)

   The recipe card stays one click away — the blend name in the
   header is the link — so the user keeps the option of jumping to
   the recipe view, but the default landing is the journal entry.
   ────────────────────────────────────────────────────────────── */

import React from "react";
import { Flower } from "../components/icons";
import { SectionLabel } from "../components/layout";
import { getBlend, sessionAgo } from "../helpers/misc";
import { ff, theme } from "../theme";
import { formatTempShort, useUnit } from "../units/units";

const formatBrewTime = (s) => {
  if (!s) return null;
  const m = Math.floor(s / 60);
  const r = s % 60;
  return r === 0 ? `${m} min` : `${m}m ${r}s`;
};

export const CupDetail = ({ session, onClose, openBlend }) => {
  const { unit } = useUnit();
  const blend = session ? getBlend(session.blendId) : null;

  if (!session || !blend) {
    return (
      <div style={{
        position: "absolute", inset: 0, zIndex: 30,
        background: theme.ivory, padding: "22px",
      }}>
        <button onClick={onClose} style={{
          background: "transparent", border: "none", color: theme.ash,
          fontFamily: ff.sans, fontSize: 12, letterSpacing: "0.12em",
          textTransform: "uppercase", cursor: "pointer",
        }}>← back</button>
        <div style={{
          marginTop: 40, textAlign: "center",
          fontFamily: ff.serif, fontStyle: "italic", color: theme.ash,
        }}>
          this cup couldn't be found
        </div>
      </div>
    );
  }

  // Mood arc — target moods compared against landed/extra captured at
  // log time. If the cup is still in the pending window, we surface
  // that explicitly instead of pretending the mood data is final.
  const targetMoods = session.targetMoods || [];
  const landedMap   = session.landed || {};
  const extraMoods  = session.extra  || [];
  const moodsPending = !!session.moodsPending;

  // Flavor arc — same shape on the flavor side.
  const targetFlavors  = session.flavorsTarget || [];
  const flavorsTasted  = session.flavorsTasted  || {};
  const flavorsExtra   = session.flavorsExtra   || [];
  const flavorsLogged  = targetFlavors.length > 0 || flavorsExtra.length > 0;

  const tempStr = (typeof session.tempC === "number")
    ? formatTempShort(session.tempC, session.tempC, unit)
    : null;
  const timeStr = formatBrewTime(session.timeS);
  const ago = sessionAgo(session) || session.ago || "";

  // Tag style — a single style object reused for every landed/missed/
  // tasted/extra pill. Tone selects sage (positive) vs terra (miss).
  const Tag = ({ tone, italic, children }) => {
    const palette = tone === "sage" ? {
      bg: "rgba(109,126,85,0.10)", fg: theme.sageDeep, bd: theme.sage,
    } : tone === "terra" ? {
      bg: "rgba(176,84,47,0.08)",  fg: theme.terra,    bd: theme.terra,
    } : tone === "ochre" ? {
      bg: "rgba(189,148,76,0.10)", fg: theme.ochre,    bd: theme.ochre,
    } : {
      bg: theme.cream,             fg: theme.inkSoft,  bd: theme.ruleSoft,
    };
    return (
      <span style={{
        display: "inline-block",
        padding: "3px 9px", borderRadius: 999,
        fontFamily: ff.sans, fontSize: 10.5, letterSpacing: "0.02em",
        background: palette.bg, color: palette.fg,
        border: `1px solid ${palette.bd}`,
        fontStyle: italic ? "italic" : "normal",
      }}>{children}</span>
    );
  };

  const Row = ({ label, children }) => (
    <div style={{ marginTop: 16 }}>
      <SectionLabel>{label}</SectionLabel>
      <div style={{ marginTop: 6, display: "flex", flexWrap: "wrap", gap: 5 }}>
        {children}
      </div>
    </div>
  );

  return (
    <div style={{
      position: "absolute", inset: 0, zIndex: 30,
      background: theme.ivory, overflowY: "auto",
      padding: "22px 22px 32px",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <button onClick={onClose} style={{
          background: "transparent", border: "none", color: theme.ash,
          fontFamily: ff.sans, fontSize: 12, letterSpacing: "0.12em",
          textTransform: "uppercase", cursor: "pointer",
        }}>← back</button>
        <div style={{
          fontFamily: ff.sans, fontSize: 10.5, letterSpacing: "0.18em",
          textTransform: "uppercase", color: theme.ash,
        }}>
          A cup
        </div>
        <div style={{ width: 40 }} />
      </div>

      {/* Header: blend name as the link to the recipe, with a subtle
          right-arrow affordance so the user understands it's tappable.
          The "view recipe →" hint underneath is belt-and-suspenders for
          the first time someone meets this view. */}
      <div style={{ textAlign: "center", marginTop: 18 }}>
        <Flower size={26} c={theme.ochre} />
        <button
          onClick={() => openBlend?.(session.blendId)}
          style={{
            display: "block", margin: "8px auto 0",
            background: "transparent", border: "none", padding: 0,
            fontFamily: ff.serif, fontSize: 26, fontWeight: 400,
            color: theme.ink, cursor: "pointer", textAlign: "center",
            lineHeight: 1.1,
          }}
        >
          {blend.name}
        </button>
        <button
          onClick={() => openBlend?.(session.blendId)}
          style={{
            background: "transparent", border: "none",
            fontFamily: ff.serif, fontStyle: "italic", fontSize: 11.5,
            color: theme.ash, marginTop: 4,
            cursor: "pointer", padding: 0,
          }}>
          view recipe →
        </button>
      </div>

      {/* When + how — relative time, brew temp/time settings. The
          settings come from the session itself (the explorer sliders
          may have moved off the recipe defaults), so the user sees
          what they actually did, not what the recipe specifies. */}
      <div style={{
        marginTop: 18, padding: "10px 12px",
        borderRadius: 8, background: theme.cream,
        border: `1px solid ${theme.ruleSoft}`,
        display: "flex", justifyContent: "space-between", alignItems: "center",
        fontFamily: ff.sans, fontSize: 11.5, color: theme.inkSoft,
        letterSpacing: "0.04em",
      }}>
        <span>{ago}</span>
        <span style={{ fontFamily: ff.mono, color: theme.ink }}>
          {[tempStr, timeStr].filter(Boolean).join(" · ") || "—"}
        </span>
      </div>

      {/* Taste rating — the cup quality dial, pinned at the top so a
          glance reads "how good was this cup" before anything else. */}
      <div style={{ marginTop: 18 }}>
        <SectionLabel>Taste</SectionLabel>
        <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
          {[1,2,3,4,5].map(i => (
            <span key={i} style={{
              fontSize: 22, color: i <= (session.taste ?? 0) ? theme.terra : theme.rule,
              lineHeight: 1,
            }}>●</span>
          ))}
        </div>
      </div>

      {/* Mood arc. Three states:
          - pending   → "ask is still open"
          - logged    → target pills colored landed (sage) / missed
                        (terra), plus any extras the user added.
          - none set  → skip the section entirely. */}
      {targetMoods.length > 0 ? (
        <Row label={moodsPending ? "Mood (pending)" : "Mood"}>
          {moodsPending ? (
            <span style={{
              fontFamily: ff.serif, fontStyle: "italic", fontSize: 12.5,
              color: theme.ochre,
            }}>
              still resolving — surface the follow-up card on Home to log
            </span>
          ) : (
            <>
              {targetMoods.map(m => (
                <Tag key={m} tone={landedMap[m] ? "sage" : "terra"}>
                  {m}{landedMap[m] ? "" : " ✗"}
                </Tag>
              ))}
              {extraMoods.map(m => (
                <Tag key={`x-${m}`} tone="sage" italic>+ {m}</Tag>
              ))}
            </>
          )}
        </Row>
      ) : null}

      {/* Flavor arc. Same pattern as mood — predicted notes show as
          landed (sage) / missed (terra) based on flavorsTasted, plus
          any extras the user added at log time. Older sessions
          predating the flavor split won't have flavorsTarget — those
          skip the section. */}
      {flavorsLogged && (
        <Row label="Flavor">
          {targetFlavors.map(f => (
            <Tag key={f} tone={flavorsTasted[f] ? "sage" : "terra"}>
              {f}{flavorsTasted[f] ? "" : " ✗"}
            </Tag>
          ))}
          {flavorsExtra.map(f => (
            <Tag key={`xf-${f}`} tone="terra" italic>+ {f}</Tag>
          ))}
        </Row>
      )}

      {/* Going-in mood and intent — what the user said they were
          reaching for. Lives below mood/flavor results because the
          "what landed" reads first; "what I came in for" is context. */}
      {(session.currentMoods?.length > 0 || session.intent) && (
        <div style={{ marginTop: 18 }}>
          <SectionLabel>Going in</SectionLabel>
          {session.currentMoods?.length > 0 && (
            <div style={{ marginTop: 6, display: "flex", flexWrap: "wrap", gap: 5 }}>
              {session.currentMoods.map(m => (
                <Tag key={m} tone="default">{m}</Tag>
              ))}
            </div>
          )}
          {session.intent && (
            <div style={{
              marginTop: 8, fontFamily: ff.serif, fontStyle: "italic",
              fontSize: 14, color: theme.inkSoft,
            }}>
              "{session.intent}"
            </div>
          )}
        </div>
      )}

      {/* Marginalia — combined brew-time + follow-up note. Render
          with whitespace preserved so the paragraph break inserted
          when the follow-up text was appended reads as a small two-
          act log instead of a wall of text. */}
      {session.note && session.note.trim() && (
        <div style={{ marginTop: 18 }}>
          <SectionLabel>Marginalia</SectionLabel>
          <div style={{
            marginTop: 8, padding: "10px 12px",
            background: theme.cream, border: `1px solid ${theme.ruleSoft}`,
            borderRadius: 8,
            fontFamily: ff.serif, fontSize: 14, color: theme.ink,
            lineHeight: 1.5, whiteSpace: "pre-wrap",
          }}>
            {session.note}
          </div>
        </div>
      )}
    </div>
  );
};
