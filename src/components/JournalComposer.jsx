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
import {
  LIMERICK_PROMPTS, assembleLimerick, LIMERICK_TEMPLATE_COUNT,
} from "../data/limerickAdlibs";

export const JournalComposer = ({ onSave, onCancel }) => {
  const [mode, setMode] = useState("free");
  const [text, setText] = useState("");
  const [slots, setSlots] = useState({ thing: "", sound: "", color: "", feeling: "" });
  const [haikuSeed, setHaikuSeed] = useState(() => Math.floor(Math.random() * HAIKU_TEMPLATE_COUNT));
  const [haikuNote, setHaikuNote] = useState("");
  const [haikuAdlib, setHaikuAdlib] = useState(true);   // false → write your own
  const [haikuOwn, setHaikuOwn] = useState("");
  const [limSlots, setLimSlots] = useState({ name: "", place: "", action: "", object: "", feeling: "" });
  const [limSeed, setLimSeed] = useState(() => Math.floor(Math.random() * LIMERICK_TEMPLATE_COUNT));
  const [limNote, setLimNote] = useState("");
  const [limAdlib, setLimAdlib] = useState(true);
  const [limOwn, setLimOwn] = useState("");

  const slotsFilled = Object.values(slots).every(v => v.trim());
  const haikuPreview = slotsFilled ? assembleHaiku(slots, haikuSeed) : null;
  const limFilled = Object.values(limSlots).every(v => v.trim());
  const limerickPreview = limFilled ? assembleLimerick(limSlots, limSeed) : null;
  const haikuReady    = haikuAdlib ? !!haikuPreview    : haikuOwn.trim().length > 0;
  const limerickReady = limAdlib   ? !!limerickPreview : limOwn.trim().length > 0;
  const ready =
    mode === "free"     ? text.trim().length > 0
    : mode === "haiku"  ? haikuReady
    : mode === "limerick" ? limerickReady
    : false;

  const resetForm = () => {
    setText("");
    setSlots({ thing: "", sound: "", color: "", feeling: "" });
    setHaikuNote("");
    setHaikuOwn("");
    setHaikuAdlib(true);
    setLimSlots({ name: "", place: "", action: "", object: "", feeling: "" });
    setLimNote("");
    setLimOwn("");
    setLimAdlib(true);
    setMode("free");
  };

  const handleSave = () => {
    if (!ready) return;
    if (mode === "haiku") {
      const finalText = haikuAdlib ? haikuPreview : haikuOwn.trim();
      onSave(finalText, "haiku", haikuNote.trim());
    } else if (mode === "limerick") {
      const finalText = limAdlib ? limerickPreview : limOwn.trim();
      onSave(finalText, "limerick", limNote.trim());
    } else {
      onSave(text.trim(), "entry");
    }
    // Wipe the form so the next time the composer opens it's blank.
    resetForm();
  };

  // Small inline toggle to switch between ad-lib and write-your-own
  // for verse modes. Shared style for both haiku and limerick tabs.
  const adlibToggle = (active, setActive) => (
    <div style={{
      display: "inline-flex", alignItems: "center",
      border: `1px solid ${theme.ruleSoft}`, borderRadius: 999,
      padding: 2, background: theme.cream,
      marginBottom: 10,
    }}>
      {[
        [true,  "ad-lib"],
        [false, "write your own"],
      ].map(([val, label]) => (
        <button
          key={String(val)}
          onClick={() => setActive(val)}
          style={{
            fontFamily: ff.sans, fontSize: 10, letterSpacing: "0.06em",
            padding: "4px 12px", borderRadius: 999, border: "none",
            background: active === val ? theme.ink : "transparent",
            color: active === val ? theme.cream : theme.ash,
            cursor: "pointer",
          }}
        >{label}</button>
      ))}
    </div>
  );

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
          haiku
        </button>
        <button onClick={() => setMode("limerick")} style={tabBtnStyle(mode === "limerick")}>
          limerick
        </button>
      </div>

      {mode === "free" && (
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
      )}

      {mode === "haiku" && (
        <>
          {adlibToggle(haikuAdlib, setHaikuAdlib)}

          {!haikuAdlib && (
            <>
              <div style={{
                fontFamily: ff.serif, fontStyle: "italic", fontSize: 12,
                color: theme.ash, lineHeight: 1.5, marginBottom: 8, textAlign: "left",
              }}>
                Three lines, traditionally <em>5 / 7 / 5 syllables</em> —
                a moment held in the briefest possible frame.
              </div>
              <textarea
                value={haikuOwn}
                onChange={(e) => setHaikuOwn(e.target.value)}
                placeholder={"line one — five syllables\nline two — seven syllables\nline three — five syllables"}
                rows={4}
                style={{
                  width: "100%", boxSizing: "border-box",
                  fontFamily: ff.serif, fontStyle: "italic", fontSize: 14,
                  color: theme.ink, lineHeight: 1.7,
                  background: "rgba(255,255,255,0.4)",
                  border: `1px dashed ${theme.rule}`, borderRadius: 8,
                  padding: "10px 12px", outline: "none",
                  resize: "vertical", minHeight: 110,
                  whiteSpace: "pre-wrap",
                }}
              />
            </>
          )}

          {haikuAdlib && (<>
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
                onClick={() => setHaikuSeed(s => s + 1)}
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
          </>)}

          <div style={{ marginTop: 12 }}>
            <label style={{
              display: "block",
              fontFamily: ff.sans, fontSize: 9.5, letterSpacing: "0.14em",
              textTransform: "uppercase", color: theme.ash, marginBottom: 4,
            }}>your notes (optional)</label>
            <textarea
              value={haikuNote}
              onChange={(e) => setHaikuNote(e.target.value)}
              placeholder="What inspired this verse, or what it means to you…"
              rows={2}
              style={{
                width: "100%", boxSizing: "border-box",
                fontFamily: ff.serif, fontSize: 13, color: theme.ink,
                background: "rgba(255,255,255,0.4)",
                border: `1px dashed ${theme.rule}`, borderRadius: 8,
                padding: "8px 10px", outline: "none",
                resize: "vertical", minHeight: 50,
              }}
            />
          </div>
        </>
      )}

      {mode === "limerick" && (
        <>
          {adlibToggle(limAdlib, setLimAdlib)}

          {!limAdlib && (
            <>
              <div style={{
                fontFamily: ff.serif, fontStyle: "italic", fontSize: 12,
                color: theme.ash, lineHeight: 1.5, marginBottom: 8, textAlign: "left",
              }}>
                Five lines, <em>AABBA</em> rhyme — lines 1, 2, 5 share an
                end-sound; lines 3, 4 share a different one. Lines 1, 2, 5
                run a beat longer than 3 and 4.
              </div>
              <textarea
                value={limOwn}
                onChange={(e) => setLimOwn(e.target.value)}
                placeholder={"line one — A\nline two — A\n   line three — B\n   line four — B\nline five — A"}
                rows={6}
                style={{
                  width: "100%", boxSizing: "border-box",
                  fontFamily: ff.serif, fontStyle: "italic", fontSize: 14,
                  color: theme.ink, lineHeight: 1.7,
                  background: "rgba(255,255,255,0.4)",
                  border: `1px dashed ${theme.rule}`, borderRadius: 8,
                  padding: "10px 12px", outline: "none",
                  resize: "vertical", minHeight: 150,
                  whiteSpace: "pre-wrap",
                }}
              />
            </>
          )}

          {limAdlib && (<>
          <div style={{
            fontFamily: ff.serif, fontStyle: "italic", fontSize: 12.5,
            color: theme.ash, lineHeight: 1.5, marginBottom: 10, textAlign: "left",
          }}>
            Five small inputs — a name, a place, an -ing verb, an object, and a
            feeling — and we'll weave them into a five-line whimsy.
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {LIMERICK_PROMPTS.map(p => (
              <div key={p.key}>
                <label style={{
                  display: "block",
                  fontFamily: ff.sans, fontSize: 9.5, letterSpacing: "0.14em",
                  textTransform: "uppercase", color: theme.ash, marginBottom: 3,
                }}>{p.label}</label>
                <input
                  value={limSlots[p.key]}
                  onChange={(e) => setLimSlots(s => ({ ...s, [p.key]: e.target.value }))}
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

          {limerickPreview && (
            <div style={{
              marginTop: 12, padding: "10px 12px", borderRadius: 8,
              background: "rgba(176, 84, 47, 0.05)",
              border: `1px solid ${theme.ruleSoft}`,
              position: "relative",
            }}>
              <div style={{
                fontFamily: ff.sans, fontSize: 9.5, letterSpacing: "0.16em",
                textTransform: "uppercase", color: theme.terra, marginBottom: 6,
              }}>your limerick</div>
              <div style={{
                fontFamily: ff.serif, fontStyle: "italic", fontSize: 14,
                color: theme.ink, lineHeight: 1.6, whiteSpace: "pre-line",
              }}>{limerickPreview}</div>
              <button
                onClick={() => setLimSeed(s => s + 1)}
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
          </>)}

          <div style={{ marginTop: 12 }}>
            <label style={{
              display: "block",
              fontFamily: ff.sans, fontSize: 9.5, letterSpacing: "0.14em",
              textTransform: "uppercase", color: theme.ash, marginBottom: 4,
            }}>your notes (optional)</label>
            <textarea
              value={limNote}
              onChange={(e) => setLimNote(e.target.value)}
              placeholder="What inspired this limerick, or what it means to you…"
              rows={2}
              style={{
                width: "100%", boxSizing: "border-box",
                fontFamily: ff.serif, fontSize: 13, color: theme.ink,
                background: "rgba(255,255,255,0.4)",
                border: `1px dashed ${theme.rule}`, borderRadius: 8,
                padding: "8px 10px", outline: "none",
                resize: "vertical", minHeight: 50,
              }}
            />
          </div>
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
