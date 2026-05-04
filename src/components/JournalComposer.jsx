/* ──────────────────────────────────────────────────────────────
   components/JournalComposer.jsx — inline composer for journal
   entries (free-form text or haiku/limerick ad-lib).

   Three modes plus shared mood capture so the journal reads as a
   tea-meets-mood log: every entry pairs the writing with how the
   user felt going in and where they landed after, the same arc
   we record on cup sessions. Both mood selections are optional —
   the entry can save with neither, just the start, just the end,
   or both.

   Saves through onSave(text, kind, note, currentMoods,
   landedMoods).
   ────────────────────────────────────────────────────────────── */

import React, { useState } from "react";
import { theme, ff } from "../theme";
import { Button } from "./layout";
import {
  HAIKU_PROMPTS, assembleHaiku, HAIKU_TEMPLATE_COUNT,
} from "../data/haikuAdlibs";
import {
  LIMERICK_PROMPTS, assembleLimerick, LIMERICK_TEMPLATE_COUNT,
} from "../data/limerickAdlibs";
import { PARENT_MOODS, CURRENT_MOOD_CHIPS } from "../data/canon";

// Mood pickers pull from the parent canon. The coming-in row uses the
// fuller current-feel set (positives + rough-edged extras like
// anxious/tired) since the journal often opens with the user naming
// a hard state. The where-it-left-me row is positive-only —
// landings are positive states or absence-of, not aspirations.
const MoodChipRow = ({ label, value, setValue, glyph, chips }) => (
  <ChipPickerRow label={label} chips={chips || PARENT_MOODS} value={value} setValue={setValue} glyph={glyph} />
);

// Shared chip picker — used for the current and landed mood rows.
// Chips can be `{key, label}` or `{key, family, label}`; the row
// only reads key + label.
//
// The mood-capture rows are wrapped in a tinted band with a terra
// left-rule so they read as a distinct action zone, separate from
// the writing surface above/below. The eye was drifting past the
// thin-eyebrow versions and landing in the textarea without ever
// picking a mood; the band makes the mood-arc beats unmissable.
const ChipPickerRow = ({ label, chips, value, setValue, glyph }) => {
  const selected = new Set(value || []);
  const toggle = (key) => {
    const cur = value || [];
    const next = selected.has(key) ? cur.filter(k => k !== key) : [...cur, key];
    setValue(next);
  };
  return (
    <div style={{
      marginBottom: 10,
      padding: "10px 12px",
      borderLeft: `2px solid ${theme.terra}`,
      background: "rgba(176, 84, 47, 0.05)",
      borderRadius: "0 8px 8px 0",
    }}>
      <div style={{
        display: "flex", alignItems: "baseline", gap: 6,
        fontFamily: ff.sans, fontSize: 10.5, letterSpacing: "0.16em",
        textTransform: "uppercase", color: theme.terra,
        fontWeight: 600,
        marginBottom: 8,
      }}>
        {glyph && <span style={{ letterSpacing: 0 }}>{glyph}</span>}
        <span>{label}</span>
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
        {chips.map(c => {
          const isOn = selected.has(c.key);
          return (
            <button
              key={c.key}
              onClick={() => toggle(c.key)}
              style={{
                fontFamily: ff.serif, fontSize: 11.5,
                padding: "4px 10px", borderRadius: 999,
                background: isOn ? theme.terra : theme.cream,
                color: isOn ? theme.cream : theme.inkSoft,
                border: `1px solid ${isOn ? theme.terra : theme.rule}`,
                cursor: "pointer", transition: "all 0.15s ease",
              }}
            >{c.label}</button>
          );
        })}
      </div>
    </div>
  );
};

// Mode is controlled externally — the parent surfaces the four
// form-style chips (free / haiku / limerick / poem) above the
// composer so the choice of journal mode reads as the first
// decision rather than a buried tab strip mid-form. setMode lets
// the composer ask the parent to switch (used by the inline
// "switch mode" link beside the cancel button).
// Auto-derive a one-line title from the body. Takes the first
// non-empty line, capped at 80 chars on a word boundary so the
// timeline shows a readable headline without asking the user to
// invent one before they've finished writing.
const autoTitle = (body) => {
  const firstLine = (body || "")
    .split("\n")
    .map(s => s.trim())
    .find(Boolean) || "";
  if (firstLine.length <= 80) return firstLine;
  const sliced = firstLine.slice(0, 80);
  const onWordBoundary = sliced.replace(/\s\S*$/, "");
  return (onWordBoundary || sliced).trim() + "…";
};

export const JournalComposer = ({ onSave, onCancel, mode = "free", setMode }) => {
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
  // Free-form poem mode — like haiku/limerick but no syllable count
  // or rhyme scheme. Just a textarea with a small prompt listing
  // common short forms the user might reach for.
  const [poemText, setPoemText] = useState("");
  // Shared across all three modes — every entry can record a
  // before/after mood arc, the same shape cup sessions use.
  // Flavor chips deliberately live on cup logs only (LogScreen);
  // the journal composer is for writing without a cup, so a
  // flavor picker here would imply a tasting that isn't there.
  const [currentMoods, setCurrentMoods] = useState([]);
  const [landedMoods, setLandedMoods] = useState([]);
  // Save-popup state. Tapping "Save" on the writing surface no longer
  // commits — it opens a small modal where the user can name the
  // entry and pick the before/after mood arc. Keeps the writing
  // screen itself a clean blank page until they're ready to ship it.
  const [saveOpen, setSaveOpen] = useState(false);
  const [pendingTitle, setPendingTitle] = useState("");

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
    : mode === "poem"   ? poemText.trim().length > 0
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
    setPoemText("");
    setCurrentMoods([]);
    setLandedMoods([]);
    setSaveOpen(false);
    setPendingTitle("");
    // Mode is parent-controlled — don't reset it here so saving
    // an entry leaves the user in the same mode they chose if
    // they want to keep going.
  };

  // Resolve the body for whatever the active mode is. Returns null
  // when the form isn't ready to save (incomplete slots, empty text).
  const resolveBody = () => {
    if (!ready) return null;
    if (mode === "haiku")    return haikuAdlib ? haikuPreview : haikuOwn.trim();
    if (mode === "limerick") return limAdlib   ? limerickPreview : limOwn.trim();
    if (mode === "poem")     return poemText.trim();
    return text.trim();
  };

  // Tapping Save on the writing surface opens the save popup
  // pre-filled with an auto-derived title. The popup is where
  // title + moods get committed, then onSave fires.
  const openSavePopup = () => {
    const body = resolveBody();
    if (!body) return;
    setPendingTitle(autoTitle(body));
    setSaveOpen(true);
  };

  const commitSave = () => {
    const body = resolveBody();
    if (!body) return;
    const title = pendingTitle.trim() || autoTitle(body);
    if (mode === "haiku") {
      onSave(body, "haiku", haikuNote.trim(), currentMoods, landedMoods, [], title);
    } else if (mode === "limerick") {
      onSave(body, "limerick", limNote.trim(), currentMoods, landedMoods, [], title);
    } else if (mode === "poem") {
      onSave(body, "poem", "", currentMoods, landedMoods, [], title);
    } else {
      onSave(body, "entry", "", currentMoods, landedMoods, [], title);
    }
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

  return (
    <div style={{
      marginBottom: 14, padding: "12px 14px", borderRadius: 10,
      background: theme.cream, border: `1px solid ${theme.ruleSoft}`,
    }}>
      {/* Mood pickers used to bracket the writing surface here;
          they've moved into the save popup so the writing screen
          stays a clean page until you're ready to commit. */}

      {/* Mode label — the chooser lives in the parent now, but we
          echo the active mode here as a small eyebrow so the writing
          surface is unmistakably tagged. Keeps the composer's content
          oriented when the form switches under the user's hand. */}
      {(() => {
        const modeLabels = {
          free: "writing freely",
          haiku: "writing a haiku",
          limerick: "writing a limerick",
          poem: "writing a poem",
        };
        return (
          <div style={{
            fontFamily: ff.sans, fontSize: 9.5, letterSpacing: "0.18em",
            textTransform: "uppercase", color: theme.terra,
            marginBottom: 10,
          }}>
            {modeLabels[mode] || modeLabels.free}
          </div>
        );
      })()}

      {mode === "free" && (
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="What's on your mind today?"
          rows={9}
          style={{
            width: "100%", boxSizing: "border-box",
            fontFamily: ff.serif, fontSize: 16, color: theme.ink,
            lineHeight: 1.7,
            background: "rgba(var(--hi-rgb),0.05)",
            border: `1px dashed ${theme.rule}`, borderRadius: 10,
            padding: "14px 16px", outline: "none",
            resize: "vertical", minHeight: 240,
          }}
        />
      )}

      {mode === "haiku" && (
        <>
          {adlibToggle(haikuAdlib, setHaikuAdlib)}

          {!haikuAdlib && (
            <textarea
              value={haikuOwn}
              onChange={(e) => setHaikuOwn(e.target.value)}
              placeholder={"Three lines — traditionally 5 / 7 / 5 syllables.\nA moment held in the briefest possible frame.\n\nline one — five syllables\nline two — seven syllables\nline three — five syllables"}
              rows={6}
              style={{
                width: "100%", boxSizing: "border-box",
                fontFamily: ff.serif, fontStyle: "italic", fontSize: 16,
                color: theme.ink, lineHeight: 1.8,
                background: "rgba(var(--hi-rgb),0.05)",
                border: `1px solid ${theme.rule}`, borderRadius: 8,
                padding: "10px 12px", outline: "none",
                resize: "vertical", minHeight: 160,
                whiteSpace: "pre-wrap",
              }}
            />
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
                    background: "rgba(var(--hi-rgb),0.05)",
                    border: `1px solid ${theme.rule}`,
                    borderRadius: 6,
                    padding: "7px 10px", outline: "none",
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
                background: "rgba(var(--hi-rgb),0.05)",
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
            <textarea
              value={limOwn}
              onChange={(e) => setLimOwn(e.target.value)}
              placeholder={"Five lines, AABBA rhyme — lines 1, 2, 5 share an\nend-sound; lines 3, 4 share a different one.\nLines 1, 2, 5 run a beat longer than 3 and 4.\n\nline one — A\nline two — A\n   line three — B\n   line four — B\nline five — A"}
              rows={9}
              style={{
                width: "100%", boxSizing: "border-box",
                fontFamily: ff.serif, fontStyle: "italic", fontSize: 16,
                color: theme.ink, lineHeight: 1.8,
                background: "rgba(var(--hi-rgb),0.05)",
                border: `1px solid ${theme.rule}`, borderRadius: 10,
                padding: "14px 16px", outline: "none",
                resize: "vertical", minHeight: 260,
                whiteSpace: "pre-wrap",
              }}
            />
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
                    background: "rgba(var(--hi-rgb),0.05)",
                    border: `1px solid ${theme.rule}`,
                    borderRadius: 6,
                    padding: "7px 10px", outline: "none",
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
                background: "rgba(var(--hi-rgb),0.05)",
                border: `1px dashed ${theme.rule}`, borderRadius: 8,
                padding: "8px 10px", outline: "none",
                resize: "vertical", minHeight: 50,
              }}
            />
          </div>
        </>
      )}

      {mode === "poem" && (
        <>
          <div style={{
            fontFamily: ff.serif, fontStyle: "italic", fontSize: 12.5,
            color: theme.ash, lineHeight: 1.55, marginBottom: 10, textAlign: "left",
          }}>
            Free-form verse — no syllable count, no rhyme scheme. A few short
            forms to reach for if you want a frame:
            <ul style={{
              margin: "6px 0 0", paddingLeft: 18,
              fontStyle: "normal", fontSize: 12,
              color: theme.inkSoft, lineHeight: 1.55,
            }}>
              <li><em>couplet</em> — two lines, often rhymed; one thought, finished.</li>
              <li><em>tercet</em> — three lines, freer than a haiku.</li>
              <li><em>quatrain</em> — four lines; the workhorse of English verse.</li>
              <li><em>cinquain</em> — five lines, building then settling.</li>
              <li><em>free verse</em> — no fixed shape; line breaks where the breath lands.</li>
            </ul>
          </div>
          <textarea
            value={poemText}
            onChange={(e) => setPoemText(e.target.value)}
            placeholder={"a line, however it lands\nanother, if it wants to follow"}
            rows={9}
            style={{
              width: "100%", boxSizing: "border-box",
              fontFamily: ff.serif, fontStyle: "italic", fontSize: 16,
              color: theme.ink, lineHeight: 1.8,
              background: "rgba(var(--hi-rgb),0.05)",
              border: `1px dashed ${theme.rule}`, borderRadius: 10,
              padding: "14px 16px", outline: "none",
              resize: "vertical", minHeight: 220,
              whiteSpace: "pre-wrap",
            }}
          />
        </>
      )}

      <div style={{
        marginTop: 16, display: "flex", gap: 8, justifyContent: "flex-end",
        alignItems: "center",
      }}>
        <Button variant="ghost" onClick={onCancel}>Cancel</Button>
        <Button
          variant="primary" tone="ink"
          onClick={openSavePopup}
          disabled={!ready}
          style={{ fontSize: 14, padding: "10px 22px" }}
        >Save…</Button>
      </div>

      {saveOpen && (
        <>
          <div
            onClick={() => setSaveOpen(false)}
            style={{
              position: "fixed", inset: 0, zIndex: 50,
              background: "rgba(30, 24, 18, 0.35)",
              animation: "journalSaveFadeIn 0.18s ease-out",
            }}
          />
          <div style={{
            position: "fixed", zIndex: 51,
            left: "50%", transform: "translateX(-50%)",
            top: 28,
            width: "calc(100% - 28px)", maxWidth: 492,
            maxHeight: "calc(100dvh - 56px)",
            overflowY: "auto", WebkitOverflowScrolling: "touch",
            padding: "18px 20px 20px",
            background: theme.ivory,
            borderRadius: 20,
            borderLeft: `3px solid ${theme.terra}`,
            boxShadow: "0 18px 48px -16px rgba(30,24,18,0.45), 0 0 0 1px rgba(80,60,40,0.08)",
            display: "flex", flexDirection: "column", gap: 14,
            animation: "journalSaveFadeIn 0.2s ease-out",
            boxSizing: "border-box",
          }}>
            <style>{`
              @keyframes journalSaveFadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
              }
            `}</style>
            <div style={{
              fontFamily: ff.sans, fontSize: 9.5, letterSpacing: "0.18em",
              textTransform: "uppercase", color: theme.terra,
            }}>
              Name it & log the arc
            </div>

            <div>
              <div style={{
                fontFamily: ff.sans, fontSize: 9.5, letterSpacing: "0.14em",
                textTransform: "uppercase", color: theme.ash, marginBottom: 6,
              }}>
                title
              </div>
              <input
                value={pendingTitle}
                onChange={(e) => setPendingTitle(e.target.value)}
                placeholder={autoTitle(resolveBody() || "") || "Untitled"}
                maxLength={80}
                autoFocus
                style={{
                  width: "100%", boxSizing: "border-box",
                  fontFamily: ff.serif, fontSize: 18, color: theme.ink,
                  background: "transparent", border: "none",
                  borderBottom: `1px solid ${theme.ruleSoft}`,
                  padding: "6px 2px 8px",
                  outline: "none",
                }}
              />
            </div>

            <MoodChipRow
              label="Coming in"
              glyph="→"
              value={currentMoods}
              setValue={setCurrentMoods}
              chips={CURRENT_MOOD_CHIPS}
            />

            <MoodChipRow
              label="Where it left me"
              glyph="←"
              value={landedMoods}
              setValue={setLandedMoods}
            />

            <div style={{
              display: "flex", gap: 8, justifyContent: "flex-end", alignItems: "center",
              marginTop: 4,
            }}>
              <Button variant="ghost" onClick={() => setSaveOpen(false)}>Back</Button>
              <Button
                variant="primary" tone="ink"
                onClick={commitSave}
                style={{ fontSize: 14, padding: "10px 22px" }}
              >Save entry</Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
