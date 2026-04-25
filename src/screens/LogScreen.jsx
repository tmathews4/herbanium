/* ──────────────────────────────────────────────────────────────
   screens/LogScreen.jsx — post-brew logging screen.
   ────────────────────────────────────────────────────────────── */

import React, { useState } from "react";
import { Flower } from "../components/icons";
import {
  Chip, ChipRows, SectionLabel, Toggle,
} from "../components/layout";;
import { MOODS } from "../data/blends";
import {
  ff, theme,
} from "../theme";

/* ──────────────────────────────────────────────────────────────
   Screen: LOG
   ────────────────────────────────────────────────────────────── */

export const LogScreen = ({ blend, intent, targetMoods, currentMoods, onSubmit, onCancel }) => {
  const safeMoods = targetMoods && targetMoods.length ? targetMoods : [];
  // Per-dimension "did it land?" — default each target mood to "landed".
  const [landed, setLanded] = useState(() =>
    Object.fromEntries(safeMoods.map(m => [m, true]))
  );
  // Allow the user to add moods they didn't set out for (e.g. unintended sleepy).
  const [extra, setExtra] = useState([]);
  const [taste, setTaste] = useState(4);
  const [note, setNote] = useState("");
  const [save, setSave] = useState(true);
  // Rename: only relevant for user-composed blends (no curated id). Empty
  // string means "keep the auto-generated name"; any non-empty string
  // overrides it when saving to the library.
  const [rename, setRename] = useState("");
  const isComposed = !blend?.id;

  const toggleExtra = (m) => {
    if (safeMoods.includes(m)) return; // don't let extras collide with targets
    setExtra(prev => prev.includes(m) ? prev.filter(x => x !== m) : [...prev, m]);
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
          fontFamily: ff.sans, fontSize: 12, letterSpacing: "0.12em", textTransform: "uppercase", cursor: "pointer",
        }}>← back</button>
        <div style={{ fontFamily: ff.sans, fontSize: 10.5, letterSpacing: "0.18em", textTransform: "uppercase", color: theme.ash }}>
          Check-in
        </div>
        <div style={{ width: 40 }} />
      </div>

      <div style={{ textAlign: "center", marginTop: 18 }}>
        <Flower size={28} c={theme.ochre} />
        <div style={{ fontFamily: ff.serif, fontStyle: "italic", fontSize: 14, color: theme.ash, marginTop: 8 }}>
          how's the cup?
        </div>
        <h2 style={{ fontFamily: ff.serif, fontSize: 24, fontWeight: 400, color: theme.ink, margin: "4px 0 0" }}>
          {blend.name}
        </h2>
      </div>

      <div style={{ margin: "20px 0" }}>
        <SectionLabel>Set out feeling</SectionLabel>
        {currentMoods && currentMoods.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginTop: 8 }}>
            {currentMoods.map(m => (
              <span key={m} style={{
                fontFamily: ff.serif, fontSize: 12.5,
                padding: "4px 10px", borderRadius: 999,
                background: theme.cream, color: theme.terra,
                border: `1px solid ${theme.ruleSoft}`,
              }}>{m}</span>
            ))}
          </div>
        )}
        {intent ? (
          <div style={{ fontFamily: ff.serif, fontStyle: "italic", fontSize: 16, color: theme.inkSoft, marginTop: currentMoods?.length ? 8 : 6 }}>
            "{intent}"
          </div>
        ) : (!currentMoods || currentMoods.length === 0) && (
          <div style={{ fontFamily: ff.serif, fontSize: 18, color: theme.ash, marginTop: 6 }}>—</div>
        )}
      </div>

      {/* Per-mood confirmation — "you aimed for calm + focus; did they land?" */}
      {safeMoods.length > 0 && (
        <div style={{ margin: "20px 0" }}>
          <SectionLabel n="ii">Did each one land?</SectionLabel>
          <div style={{ fontFamily: ff.serif, fontStyle: "italic", fontSize: 12, color: theme.ash, marginTop: 4 }}>
            you aimed for {safeMoods.join(" + ")}
          </div>
          <div style={{
            marginTop: 10, border: `1px solid ${theme.ruleSoft}`, borderRadius: 10,
            background: theme.cream, overflow: "hidden",
          }}>
            {safeMoods.map((m, i) => (
              <div key={m} style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "12px 14px",
                borderTop: i === 0 ? "none" : `1px solid ${theme.ruleSoft}`,
              }}>
                <div style={{ fontFamily: ff.serif, fontSize: 16, color: theme.ink }}>
                  <em style={{ color: theme.terra, fontStyle: "normal" }}>{m}</em>?
                </div>
                <div style={{ display: "flex", gap: 6 }}>
                  {[
                    ["landed",  true],
                    ["missed",  false],
                  ].map(([label, v]) => (
                    <button key={label} onClick={() => setLanded({ ...landed, [m]: v })} style={{
                      fontFamily: ff.sans, fontSize: 11.5, letterSpacing: "0.02em",
                      padding: "5px 11px", borderRadius: 999,
                      border: `1px solid ${landed[m] === v ? (v ? theme.sageDeep : theme.terra) : theme.rule}`,
                      background: landed[m] === v ? (v ? theme.sageDeep : theme.terra) : "transparent",
                      color: landed[m] === v ? theme.cream : theme.inkSoft,
                      cursor: "pointer",
                    }}>{label}</button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ margin: "20px 0" }}>
        <SectionLabel n={safeMoods.length > 0 ? "iii" : "ii"}>
          {safeMoods.length > 0 ? "Anything else showed up?" : "Feeling now"}
        </SectionLabel>
        {safeMoods.length > 0 && (
          <div style={{ fontFamily: ff.serif, fontStyle: "italic", fontSize: 12, color: theme.ash, marginTop: 4 }}>
            unexpected moods from the cup
          </div>
        )}
        <div style={{ marginTop: 10 }}>
          <ChipRows
            items={MOODS.filter(m => !safeMoods.includes(m))}
            renderItem={(m) => (
              <Chip key={m} active={extra.includes(m)} onClick={() => toggleExtra(m)} tone="sage">{m}</Chip>
            )}
          />
        </div>
      </div>

      <div style={{ margin: "20px 0" }}>
        <SectionLabel n={safeMoods.length > 0 ? "iv" : "iii"}>Taste</SectionLabel>
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
        <SectionLabel n={safeMoods.length > 0 ? "v" : "iv"}>Marginalia</SectionLabel>
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

        {/* Rename input — only when saving a user-composed blend.
            Curated blends (Dusk Lullaby, Moroccan Mint, etc.) keep their
            original names; only on-the-fly compositions get renamed. */}
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

      <button onClick={() => onSubmit({ landed, extra, taste, note, save, rename: rename.trim() })} style={{
        width: "100%", fontFamily: ff.serif, fontSize: 17,
        padding: "14px", borderRadius: 10,
        background: theme.ink, color: theme.cream, border: "none", cursor: "pointer",
      }}>
        log it →
      </button>
    </div>
  );
};
