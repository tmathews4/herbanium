/* ──────────────────────────────────────────────────────────────
   screens/LogScreen.jsx — post-brew logging screen.

   Captures what's verifiable AT FIRST SIP:
     - which predicted flavor notes actually surfaced
     - any unexpected flavors that appeared
     - taste rating (cup quality, not effect)
     - marginalia (free-form notes)
     - save-to-library toggle

   Mood is intentionally NOT asked here. The user just put down the
   cup; they can't yet tell whether the calm landed or the focus
   sharpened. Mood resolves over the next ~30 minutes, so the
   mood log moves to a follow-up prompt that surfaces on the next
   app open (or, on mobile, as a 30-minute notification — a
   future enhancement).

   The session is created in a "moodsPending" state, and the Home
   screen's MoodFollowUp card walks the user through landed/missed
   when they next return to the app.
   ────────────────────────────────────────────────────────────── */

import React, { useState, useMemo } from "react";
import { Flower } from "../components/icons";
import {
  Chip, ChipRows, SectionLabel, Toggle,
} from "../components/layout";
import { FLAVORS } from "../data/blends";
import {
  ff, theme, shadow, radius,
} from "../theme";

/* ──────────────────────────────────────────────────────────────
   Screen: LOG
   ────────────────────────────────────────────────────────────── */

export const LogScreen = ({ blend, intent, currentMoods, onSubmit, onCancel }) => {
  // Predicted flavors for this blend — the notes the brew engine and
  // curator say the cup should carry. The user confirms which ones
  // actually surfaced. Pulled from the blend's static flavor list,
  // which is the simplest source-of-truth that's available offline.
  const predictedFlavors = useMemo(() => {
    const list = Array.isArray(blend?.flavors) ? blend.flavors : [];
    // Cap at 6 — beyond that the row reads as a checklist, not a
    // tasting confirmation. The most prominent notes already lead
    // the array (curator order), so a slice keeps the strongest.
    return list.slice(0, 6);
  }, [blend]);

  // Default each predicted flavor to "tasted" — most cups deliver
  // their advertised character, so the common path is one tap on
  // any miss rather than confirming each one individually.
  const [tasted, setTasted] = useState(() =>
    Object.fromEntries(predictedFlavors.map(f => [f, true]))
  );
  // Unexpected flavors the user noticed that weren't predicted.
  const [extraFlavors, setExtraFlavors] = useState([]);
  const [taste, setTaste]   = useState(4);
  const [note, setNote]     = useState("");
  const [save, setSave]     = useState(true);
  // Rename: only relevant for user-composed blends (no curated id). Empty
  // string means "keep the auto-generated name."
  const [rename, setRename] = useState("");
  const isComposed = !blend?.id;

  const toggleExtra = (f) => {
    if (predictedFlavors.includes(f)) return;  // don't double-list
    setExtraFlavors(prev => prev.includes(f) ? prev.filter(x => x !== f) : [...prev, f]);
  };

  return (
    <div style={{
      position: "absolute", inset: 0, zIndex: 30,
      background: theme.ivory, overflowY: "auto",
      padding: "22px 22px 26px",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <button onClick={onCancel} style={{
          background: "transparent", border: "none", color: theme.ash,
          fontFamily: ff.sans, fontSize: 12, letterSpacing: "0.12em",
          textTransform: "uppercase", cursor: "pointer",
        }}>← back</button>
        <div style={{
          fontFamily: ff.sans, fontSize: 10.5, letterSpacing: "0.18em",
          textTransform: "uppercase", color: theme.ash,
        }}>
          Check-in
        </div>
        <div style={{ width: 40 }} />
      </div>

      <div style={{ textAlign: "center", marginTop: 18 }}>
        <Flower size={28} c={theme.ochre} />
        <div style={{
          fontFamily: ff.serif, fontStyle: "italic", fontSize: 14,
          color: theme.ash, marginTop: 8,
        }}>
          how's the cup taste?
        </div>
        <h2 style={{
          fontFamily: ff.serif, fontSize: 24, fontWeight: 400,
          color: theme.ink, margin: "4px 0 0",
        }}>
          {blend.name}
        </h2>
        <div style={{
          fontFamily: ff.serif, fontStyle: "italic", fontSize: 12,
          color: theme.ash, marginTop: 8,
        }}>
          mood arrives over the next half hour — we'll ask you then
        </div>
      </div>

      {/* Per-flavor confirmation — "the cup said muscatel and bright; did
          they show up?" Mirrors the previous mood-landed UI pattern, so
          users coming from the old log feel the same rhythm. */}
      {predictedFlavors.length > 0 && (
        <div style={{ margin: "20px 0" }}>
          <SectionLabel n="i">Did the notes show up?</SectionLabel>
          <div style={{
            fontFamily: ff.serif, fontStyle: "italic", fontSize: 12,
            color: theme.ash, marginTop: 4,
          }}>
            the cup was meant to carry {predictedFlavors.join(", ")}
          </div>
          <div style={{
            marginTop: 10, border: `1px solid ${theme.ruleSoft}`, borderRadius: 10,
            background: theme.cream, overflow: "hidden",
          }}>
            {predictedFlavors.map((f, i) => (
              <div key={f} style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "12px 14px",
                borderTop: i === 0 ? "none" : `1px solid ${theme.ruleSoft}`,
              }}>
                <div style={{ fontFamily: ff.serif, fontSize: 16, color: theme.ink }}>
                  <em style={{ color: theme.terra, fontStyle: "normal" }}>{f}</em>?
                </div>
                <div style={{ display: "flex", gap: 6 }}>
                  {[
                    ["tasted",  true],
                    ["missed",  false],
                  ].map(([label, v]) => (
                    <button key={label} onClick={() => setTasted({ ...tasted, [f]: v })} style={{
                      fontFamily: ff.sans, fontSize: 11.5, letterSpacing: "0.02em",
                      padding: "5px 11px", borderRadius: 999,
                      border: `1px solid ${tasted[f] === v ? (v ? theme.sageDeep : theme.terra) : theme.rule}`,
                      background: tasted[f] === v ? (v ? theme.sageDeep : theme.terra) : "transparent",
                      color: tasted[f] === v ? theme.cream : theme.inkSoft,
                      cursor: "pointer",
                      transition: "background 0.2s ease, color 0.2s ease, border-color 0.2s ease",
                    }}>{label}</button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Unexpected flavors. Every flavor in the FLAVORS pool that isn't
          already in the predicted set, so the user can flag anything
          that surfaced unbidden — a smoky note in what should have been
          a floral cup, etc. */}
      <div style={{ margin: "20px 0" }}>
        <SectionLabel n={predictedFlavors.length > 0 ? "ii" : "i"}>
          Anything else come through?
        </SectionLabel>
        <div style={{
          fontFamily: ff.serif, fontStyle: "italic", fontSize: 12,
          color: theme.ash, marginTop: 4,
        }}>
          notes you tasted that weren't promised
        </div>
        <div style={{ marginTop: 10 }}>
          <ChipRows
            items={FLAVORS.filter(f => !predictedFlavors.includes(f))}
            renderItem={(f) => (
              <Chip key={f} active={extraFlavors.includes(f)} onClick={() => toggleExtra(f)} tone="terra">
                {f}
              </Chip>
            )}
          />
        </div>
      </div>

      <div style={{ margin: "20px 0" }}>
        <SectionLabel n={predictedFlavors.length > 0 ? "iii" : "ii"}>Taste</SectionLabel>
        <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
          {[1,2,3,4,5].map(i => (
            <button key={i} onClick={() => setTaste(i)} style={{
              background: "transparent", border: "none", cursor: "pointer",
              padding: 2, fontSize: 22, color: i <= taste ? theme.terra : theme.rule,
            }}>●</button>
          ))}
        </div>
      </div>

      <div style={{ margin: "20px 0" }}>
        <SectionLabel n={predictedFlavors.length > 0 ? "iv" : "iii"}>Marginalia</SectionLabel>
        <textarea
          value={note} onChange={e => setNote(e.target.value)}
          placeholder="a line or two, just for you"
          style={{
            marginTop: 8, width: "100%", minHeight: 60,
            background: "transparent", border: `1px solid ${theme.rule}`, borderRadius: 8,
            padding: 10, fontFamily: ff.serif, fontSize: 14, color: theme.ink,
            resize: "vertical", outline: "none",
          }}
        />
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10, margin: "20px 0" }}>
        <Toggle label="Save blend to library as favorite" value={save} onChange={setSave} />

        {save && isComposed && (
          <div style={{
            padding: "10px 12px", borderRadius: 8,
            background: theme.cream, border: `1px solid ${theme.ruleSoft}`,
            display: "flex", flexDirection: "column", gap: 6,
          }}>
            <div style={{
              fontFamily: ff.sans, fontSize: 9.5, letterSpacing: "0.14em",
              textTransform: "uppercase", color: theme.ash,
            }}>
              name this blend
            </div>
            <input
              value={rename}
              onChange={(e) => setRename(e.target.value)}
              placeholder={blend?.name || "untitled blend"}
              style={{
                background: "transparent", border: "none",
                fontFamily: ff.serif, fontSize: 16, color: theme.ink,
                outline: "none", padding: 0,
                fontStyle: rename ? "normal" : "italic",
              }}
            />
            <div style={{
              fontFamily: ff.serif, fontStyle: "italic", fontSize: 11,
              color: theme.ash, lineHeight: 1.4,
            }}>
              {rename
                ? `will save as "${rename}"`
                : `will save as "${blend?.name}" — tap above to rename`}
            </div>
          </div>
        )}
      </div>

      <button
        onClick={() => onSubmit({
          flavorsTasted: tasted,
          flavorsExtra: extraFlavors,
          flavorsTarget: predictedFlavors,
          taste, note, save,
          rename: rename.trim(),
        })}
        onMouseEnter={(e) => { e.currentTarget.style.boxShadow = shadow.btn.ink.hover; }}
        onMouseLeave={(e) => {
          e.currentTarget.style.boxShadow = shadow.btn.ink.rest;
          e.currentTarget.style.transform = "translateY(0)";
        }}
        onMouseDown={(e)  => {
          e.currentTarget.style.transform = "translateY(1px)";
          e.currentTarget.style.boxShadow = shadow.btn.ink.press;
        }}
        onMouseUp={(e)    => {
          e.currentTarget.style.transform = "translateY(0)";
          e.currentTarget.style.boxShadow = shadow.btn.ink.hover;
        }}
        style={{
          width: "100%", fontFamily: ff.serif, fontSize: 17, fontWeight: 500,
          padding: "15px 16px", borderRadius: radius.md,
          background: theme.ink, color: theme.cream, border: "none", cursor: "pointer",
          boxShadow: shadow.btn.ink.rest,
          transition: "box-shadow 0.18s ease, transform 0.12s ease",
          letterSpacing: "0.02em",
          textShadow: "0 1px 1px rgba(0,0,0,0.10)",
        }}>
        Log it →
      </button>
    </div>
  );
};
