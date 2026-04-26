/* ──────────────────────────────────────────────────────────────
   components/JournalComposer.jsx — inline composer for journal
   entries (free-form text or haiku ad-lib).

   Two modes:
     - free: a single textarea, save when there's text
     - haiku: four small prompt fields ("a small thing nearby",
       "a sound you can hear", "a colour or texture", "a feeling
       word") which our algo weaves into a 3-line haiku-shaped
       piece. Live preview; "shuffle" cycles through templates.

   Saves through `onSave(text, kind)` where kind is "entry" or
   "haiku" — the caller decides how to persist.
   ────────────────────────────────────────────────────────────── */

import React, { useState } from "react";
import { theme, ff } from "../theme";
import {
  HAIKU_PROMPTS, assembleHaiku, HAIKU_TEMPLATE_COUNT,
} from "../data/haikuAdlibs";

export const JournalComposer = ({ onSave, onCancel }) => {
  const [mode, setMode] = useState("free");
  const [text, setText] = useState("");
  const [slots, setSlots] = useState({ thing: "", sound: "", color: "", feeling: "" });
  const [seed, setSeed] = useState(() => Math.floor(Math.random() * HAIKU_TEMPLATE_COUNT));

  const slotsFilled = Object.values(slots).every(v => v.trim());
  const haikuPreview = slotsFilled ? assembleHaiku(slots, seed) : null;
  const ready = mode === "free" ? text.trim().length > 0 : !!haikuPreview;

  const handleSave = () => {
    if (!ready) return;
    if (mode === "haiku") {
      onSave(haikuPreview, "haiku");
    } else {
      onSave(text.trim(), "entry");
    }
  };

  const tabBtnStyle = (active) => ({
    flex: 1,
    fontFamily: ff.serif, fontSize: 13,
    padding: "8px 10px",
    background: active ? theme.cream : "transparent",
    color: active ? theme.ink : theme.ash,
    border: "none",
    borderBottom: active ? `2px solid ${theme.terra}` : "2px solid transparent",
    cursor: "pointer",
  });

  return (
    <div style={{
      marginBottom: 14, padding: "12px 14px", borderRadius: 10,
      background: theme.cream, border: `1px solid ${theme.ruleSoft}`,
    }}>
      <div style={{ display: "flex", marginBottom: 10, borderBottom: `1px solid ${theme.ruleSoft}` }}>
        <button onClick={() => setMode("free")} style={tabBtnStyle(mode === "free")}>
          write freely
        </button>
        <button onClick={() => setMode("haiku")} style={tabBtnStyle(mode === "haiku")}>
          haiku ad-lib
        </button>
      </div>

      {mode === "free" ? (
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="What's on your mind today?"
          rows={4}
          style={{
            width: "100%", boxSizing: "border-box",
            fontFamily: ff.serif, fontSize: 14, color: theme.ink,
            background: "rgba(255,255,255,0.4)",
            border: `1px dashed ${theme.rule}`, borderRadius: 8,
            padding: "10px 12px", outline: "none",
            resize: "vertical", minHeight: 90,
          }}
        />
      ) : (
        <>
          <div style={{
            fontFamily: ff.serif, fontStyle: "italic", fontSize: 12.5,
            color: theme.ash, lineHeight: 1.5, marginBottom: 10, textAlign: "left",
          }}>
            Pick four things from the room around you — we'll weave them into a
            small verse for the journal.
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {HAIKU_PROMPTS.map(p => (
              <div key={p.key}>
                <label style={{
                  display: "block",
                  fontFamily: ff.sans, fontSize: 9.5, letterSpacing: "0.14em",
                  textTransform: "uppercase", color: theme.ash, marginBottom: 3,
                }}>{p.label}</label>
                <input
                  value={slots[p.key]}
                  onChange={(e) => setSlots(s => ({ ...s, [p.key]: e.target.value }))}
                  placeholder={p.placeholder}
                  maxLength={30}
                  style={{
                    width: "100%", boxSizing: "border-box",
                    fontFamily: ff.serif, fontSize: 14, color: theme.ink,
                    background: "transparent",
                    border: "none", borderBottom: `1px solid ${theme.ruleSoft}`,
                    padding: "4px 2px", outline: "none",
                  }}
                />
              </div>
            ))}
          </div>

          {haikuPreview && (
            <div style={{
              marginTop: 12, padding: "10px 12px", borderRadius: 8,
              background: "rgba(98, 124, 92, 0.06)",
              border: `1px solid ${theme.ruleSoft}`,
              position: "relative",
            }}>
              <div style={{
                fontFamily: ff.sans, fontSize: 9.5, letterSpacing: "0.16em",
                textTransform: "uppercase", color: theme.sageDeep, marginBottom: 6,
              }}>your verse</div>
              <div style={{
                fontFamily: ff.serif, fontStyle: "italic", fontSize: 14,
                color: theme.ink, lineHeight: 1.6, whiteSpace: "pre-line",
              }}>{haikuPreview}</div>
              <button
                onClick={() => setSeed(s => s + 1)}
                style={{
                  position: "absolute", top: 6, right: 8,
                  fontFamily: ff.sans, fontSize: 10, letterSpacing: "0.14em",
                  textTransform: "uppercase", color: theme.terra,
                  background: "transparent", border: "none",
                  padding: "4px 6px", cursor: "pointer",
                }}
              >shuffle</button>
            </div>
          )}
        </>
      )}

      <div style={{
        marginTop: 12, display: "flex", gap: 8, justifyContent: "flex-end",
      }}>
        <button
          onClick={onCancel}
          style={{
            fontFamily: ff.sans, fontSize: 11, letterSpacing: "0.06em",
            color: theme.ash,
            background: "transparent", border: "none",
            cursor: "pointer", padding: "8px 12px",
          }}
        >cancel</button>
        <button
          onClick={handleSave}
          disabled={!ready}
          style={{
            fontFamily: ff.serif, fontSize: 14,
            padding: "8px 18px", borderRadius: 999,
            background: ready ? theme.ink : theme.rule,
            color: theme.cream, border: "none",
            cursor: ready ? "pointer" : "not-allowed",
          }}
        >save entry</button>
      </div>
    </div>
  );
};
