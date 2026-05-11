/* ──────────────────────────────────────────────────────────────
   screens/EntryDetail.jsx — single free-form journal entry view.

   View mode renders the entry's text (italic for verse, plain
   for entry), the mood arc captured at write time, and any
   margin note. Delete and Edit live in the top-right corner.

   Edit mode (gated by the Edit pencil) lets the user revise
   title / body / mood arc / note inline. On save, the prior
   state snapshots into the entry's revisions[] array and
   editedAt updates, so each version is preserved as history.
   View mode surfaces "edited Xm ago · N revisions" when the
   entry has been edited; tapping that opens a history panel
   listing each prior version with its timestamp.

   Mode-specific scaffolding (haiku 5-7-5 slot builder, limerick
   A-A-B-B-A slots) is intentionally NOT rebuilt for edit — those
   are creation aids; once the verse exists, it's just text.
   ────────────────────────────────────────────────────────────── */

import React, { useState } from "react";
import { Pencil } from "../components/icons";
import { Button, SectionLabel } from "../components/layout";
import { JOURNAL_PARENT_MOODS, JOURNAL_CURRENT_MOOD_CHIPS } from "../data/canon";
import { ff, theme } from "../theme";

const formatAgo = (date) => {
  if (!date) return "";
  const ms = Date.now() - date.getTime();
  const min = Math.floor(ms / 60000);
  if (min < 1)   return "just now";
  if (min < 60)  return `${min} min ago`;
  const h = Math.floor(min / 60);
  if (h < 24)    return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7)     return `${d}d ago`;
  return date.toLocaleDateString();
};

// Inline chip picker — same visual register as JournalComposer's
// MoodChipRow but kept local so EntryDetail doesn't pull in the
// composer's internals just for one row. Toggle on tap; multi-
// select; chips render the journal-filtered canon vocabulary
// (JOURNAL_PARENT_MOODS for the landed row, JOURNAL_CURRENT_MOOD_CHIPS
// for the coming-in row — both exclude stomach/digestive moods).
const ChipPicker = ({ label, glyph, value, setValue, chips }) => {
  const selected = new Set(value || []);
  const toggle = (key) => {
    const cur = value || [];
    setValue(selected.has(key) ? cur.filter(k => k !== key) : [...cur, key]);
  };
  return (
    <div style={{
      padding: "10px 12px",
      borderLeft: `2px solid ${theme.terra}`,
      background: "rgba(176, 84, 47, 0.05)",
      borderRadius: "0 8px 8px 0",
    }}>
      <div style={{
        display: "flex", alignItems: "baseline", gap: 6,
        fontFamily: ff.sans, fontSize: 10.5, letterSpacing: "0.16em",
        textTransform: "uppercase", color: theme.terra, fontWeight: 600,
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

export const EntryDetail = ({ entry, onClose, onDelete, onEdit }) => {
  const [editing, setEditing] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [draft, setDraft] = useState(() => ({
    title: entry?.title || "",
    text: entry?.text || "",
    note: entry?.note || "",
    currentMoods: entry?.currentMoods || [],
    landedMoods: entry?.landedMoods || [],
  }));

  // Re-sync draft when entry changes (different entry opened, or
  // after a save when the parent passes back the updated entry).
  React.useEffect(() => {
    setDraft({
      title: entry?.title || "",
      text: entry?.text || "",
      note: entry?.note || "",
      currentMoods: entry?.currentMoods || [],
      landedMoods: entry?.landedMoods || [],
    });
  }, [entry?.id, entry?.editedAt]);

  if (!entry) {
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
          this entry couldn't be found
        </div>
      </div>
    );
  }

  const isHaiku    = entry.kind === "haiku";
  const isLimerick = entry.kind === "limerick";
  const isPoem     = entry.kind === "poem";
  const isVerse    = isHaiku || isLimerick || isPoem;
  const stamp = entry.ts ? new Date(entry.ts) : null;
  const ago   = formatAgo(stamp);
  const editedAgo = entry.editedAt ? formatAgo(new Date(entry.editedAt)) : null;
  const revisions = Array.isArray(entry.revisions) ? entry.revisions : [];

  const handleDelete = () => {
    if (!onDelete) return;
    if (window.confirm("Remove this journal entry?")) {
      onDelete(entry.id);
      onClose?.();
    }
  };

  const handleSaveEdit = () => {
    if (!onEdit) return;
    if (!draft.text.trim()) {
      window.alert("The entry text can't be empty.");
      return;
    }
    onEdit(entry.id, {
      title: draft.title,
      text: draft.text,
      note: draft.note,
      currentMoods: draft.currentMoods,
      landedMoods: draft.landedMoods,
    });
    setEditing(false);
  };

  const handleCancelEdit = () => {
    setDraft({
      title: entry.title || "",
      text: entry.text || "",
      note: entry.note || "",
      currentMoods: entry.currentMoods || [],
      landedMoods: entry.landedMoods || [],
    });
    setEditing(false);
  };

  const start = (entry.currentMoods || []).join(", ");
  const end   = (entry.landedMoods  || []).join(", ");
  const [scrolled, setScrolled] = useState(false);

  return (
    <div
      onScroll={(e) => setScrolled(e.currentTarget.scrollTop > 4)}
      style={{
        position: "absolute", inset: 0, zIndex: 30,
        background: theme.ivory, overflowY: "auto",
      }}
    >
      {/* Sticky header — back + eyebrow + edit/delete pinned.
          Hairline shadow fades in once content has scrolled. */}
      <div style={{
        position: "sticky", top: 0, zIndex: 10,
        background: "rgba(var(--ivory-rgb), 0.78)",
        backdropFilter: "blur(8px) saturate(1.1)",
        WebkitBackdropFilter: "blur(8px) saturate(1.1)",
        padding: "10px 22px 8px",
        display: "flex", justifyContent: "space-between", alignItems: "center",
        boxShadow: scrolled ? "0 1px 0 rgba(60, 50, 40, 0.08)" : "0 1px 0 rgba(60, 50, 40, 0)",
        transition: "box-shadow 0.18s ease",
      }}>
        <button onClick={editing ? handleCancelEdit : onClose} style={{
          background: "transparent", border: "none", color: theme.ash,
          fontFamily: ff.sans, fontSize: 12, letterSpacing: "0.12em",
          textTransform: "uppercase", cursor: "pointer",
        }}>{editing ? "← cancel" : "← back"}</button>
        <div style={{
          fontFamily: ff.sans, fontSize: 10.5, letterSpacing: "0.18em",
          textTransform: "uppercase", color: theme.ash,
        }}>
          {editing ? "Editing" : ""}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          {!editing && onEdit && (
            <button
              onClick={() => setEditing(true)}
              title="edit entry"
              style={{
                background: "transparent", border: "none",
                padding: "4px 6px", cursor: "pointer", lineHeight: 0,
                opacity: 0.65,
              }}
            >
              <Pencil size={14} c={theme.ash} />
            </button>
          )}
          {!editing && onDelete && (
            <button
              onClick={handleDelete}
              title="delete entry"
              style={{
                background: "transparent", border: "none",
                color: theme.ash, fontSize: 14, lineHeight: 1,
                padding: "4px 6px", cursor: "pointer",
                opacity: 0.55,
              }}
            >✕</button>
          )}
        </div>
      </div>

      <div style={{ padding: "0 22px 32px" }}>

        <div style={{ textAlign: "center", marginTop: 18 }}>
          <Pencil size={22} c={theme.ochre} />
          <div style={{
            fontFamily: ff.serif, fontStyle: "italic", fontSize: 12,
            color: theme.ash, marginTop: 6,
          }}>
            {ago}
          </div>
          {editedAgo && !editing && (
            <button
              onClick={() => setHistoryOpen(o => !o)}
              style={{
                marginTop: 6,
                background: "transparent", border: "none",
                fontFamily: ff.serif, fontStyle: "italic", fontSize: 11,
                color: theme.terra, cursor: "pointer",
                textDecoration: "underline", textDecorationStyle: "dotted",
                textUnderlineOffset: 3,
              }}
            >
              edited {editedAgo}{revisions.length > 0
                ? ` · ${revisions.length} revision${revisions.length === 1 ? "" : "s"}`
                : ""}
            </button>
          )}
        </div>

        {editing ? (
          <>
            {/* Title */}
            <div style={{ marginTop: 22 }}>
              <div style={{
                fontFamily: ff.sans, fontSize: 9.5, letterSpacing: "0.18em",
                textTransform: "uppercase", color: theme.ash, marginBottom: 6,
              }}>title</div>
              <input
                value={draft.title}
                onChange={(e) => setDraft(d => ({ ...d, title: e.target.value }))}
                placeholder="Untitled"
                maxLength={80}
                style={{
                  width: "100%", boxSizing: "border-box",
                  fontFamily: ff.serif, fontSize: 18, color: theme.ink,
                  background: "transparent", border: "none",
                  borderBottom: `1px solid ${theme.ruleSoft}`,
                  padding: "6px 2px 8px", outline: "none",
                }}
              />
            </div>

            {/* Body */}
            <div style={{ marginTop: 18 }}>
              <div style={{
                fontFamily: ff.sans, fontSize: 9.5, letterSpacing: "0.18em",
                textTransform: "uppercase", color: theme.ash, marginBottom: 6,
              }}>body</div>
              <textarea
                value={draft.text}
                onChange={(e) => setDraft(d => ({ ...d, text: e.target.value }))}
                rows={isVerse ? 5 : 9}
                style={{
                  width: "100%", boxSizing: "border-box",
                  fontFamily: ff.serif,
                  fontStyle: isVerse ? "italic" : "normal",
                  fontSize: isVerse ? 16 : 15.5, color: theme.ink,
                  lineHeight: isVerse ? 1.7 : 1.6,
                  background: theme.cream,
                  border: `1px solid ${theme.ruleSoft}`, borderRadius: 10,
                  padding: "12px 14px", outline: "none",
                  resize: "vertical", minHeight: 140,
                  whiteSpace: "pre-wrap",
                }}
              />
            </div>

            {/* Mood arc */}
            <div style={{ marginTop: 18 }}>
              <ChipPicker
                label="Coming in"
                glyph="→"
                value={draft.currentMoods}
                setValue={(v) => setDraft(d => ({ ...d, currentMoods: v }))}
                chips={JOURNAL_CURRENT_MOOD_CHIPS}
              />
              <div style={{ height: 10 }} />
              <ChipPicker
                label="Where it left me"
                glyph="←"
                value={draft.landedMoods}
                setValue={(v) => setDraft(d => ({ ...d, landedMoods: v }))}
                chips={JOURNAL_PARENT_MOODS}
              />
            </div>

            {/* Note */}
            <div style={{ marginTop: 18 }}>
              <div style={{
                fontFamily: ff.sans, fontSize: 9.5, letterSpacing: "0.18em",
                textTransform: "uppercase", color: theme.ash, marginBottom: 6,
              }}>note (optional)</div>
              <textarea
                value={draft.note}
                onChange={(e) => setDraft(d => ({ ...d, note: e.target.value }))}
                rows={3}
                placeholder="a line of context, a stamp"
                style={{
                  width: "100%", boxSizing: "border-box",
                  fontFamily: ff.serif, fontSize: 13.5, color: theme.inkSoft,
                  lineHeight: 1.5,
                  background: theme.cream,
                  border: `1px solid ${theme.ruleSoft}`, borderRadius: 8,
                  padding: "10px 12px", outline: "none",
                  resize: "vertical", minHeight: 70,
                }}
              />
            </div>

            {/* Actions */}
            <div style={{
              marginTop: 22, display: "flex", gap: 8,
              justifyContent: "flex-end", alignItems: "center",
            }}>
              <Button variant="ghost" onClick={handleCancelEdit}>Cancel</Button>
              <Button
                variant="primary" tone="ink"
                onClick={handleSaveEdit}
                style={{ fontSize: 14, padding: "10px 22px" }}
              >Save changes</Button>
            </div>
          </>
        ) : (
          <>
            {/* Body */}
            <div style={{
              marginTop: 22,
              fontFamily: ff.serif,
              fontStyle: isVerse ? "italic" : "normal",
              fontSize: isVerse ? 17 : 16,
              color: theme.ink,
              lineHeight: isVerse ? 1.75 : 1.6,
              whiteSpace: "pre-line",
            }}>
              {entry.text}
            </div>

            {/* Mood arc */}
            {(start || end) && (
              <div style={{ marginTop: 22 }}>
                <SectionLabel>Mood arc</SectionLabel>
                <div style={{
                  marginTop: 8,
                  fontFamily: ff.serif, fontStyle: "italic", fontSize: 13.5,
                  color: theme.ash, lineHeight: 1.4,
                }}>
                  {start && (<span>{start}</span>)}
                  <span style={{ margin: "0 8px", color: theme.rule, fontStyle: "normal" }}>→</span>
                  {end && (<span style={{ color: theme.sageDeep, fontStyle: "normal" }}>{end}</span>)}
                </div>
              </div>
            )}

            {/* Note */}
            {entry.note && entry.note.trim() && (
              <div style={{ marginTop: 22 }}>
                <SectionLabel>Note</SectionLabel>
                <div style={{
                  marginTop: 8, padding: "10px 12px",
                  background: theme.cream, border: `1px solid ${theme.ruleSoft}`,
                  borderRadius: 8,
                  fontFamily: ff.serif, fontSize: 13.5, color: theme.inkSoft,
                  lineHeight: 1.5, whiteSpace: "pre-line",
                }}>
                  {entry.note}
                </div>
              </div>
            )}

            {/* Revision history — collapsed by default; toggled by
                the "edited Xh ago · N revisions" link in the
                stamp area above. Lists prior versions newest-last
                with timestamps and full content of each. No
                rollback action in this v1; viewing the history is
                enough — restoring a prior version can be a v2 add. */}
            {historyOpen && revisions.length > 0 && (
              <div style={{ marginTop: 26 }}>
                <SectionLabel>Revisions</SectionLabel>
                <div style={{
                  marginTop: 8,
                  fontFamily: ff.serif, fontStyle: "italic", fontSize: 11.5,
                  color: theme.ash, marginBottom: 12,
                }}>
                  Earlier versions of this entry. Newest first.
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {[...revisions].reverse().map((rev, i) => (
                    <RevisionCard key={i} rev={rev} index={revisions.length - i} />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

// One revision in the history list — collapsed-summary by default,
// expanded to full content on tap. Keeps the list scannable while
// still letting the user dig into any prior version.
const RevisionCard = ({ rev, index }) => {
  const [open, setOpen] = useState(false);
  const stamp = rev?.ts ? new Date(rev.ts) : null;
  const ago = formatAgo(stamp);
  const start = (rev?.currentMoods || []).join(", ");
  const end   = (rev?.landedMoods  || []).join(", ");
  const preview = (rev?.text || "").split("\n")[0].slice(0, 80);
  return (
    <div style={{
      border: `1px solid ${theme.ruleSoft}`, borderRadius: 10,
      background: theme.cream, overflow: "hidden",
    }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: "100%", textAlign: "left",
          background: "transparent", border: "none", cursor: "pointer",
          padding: "10px 12px",
          display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 10,
        }}
      >
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{
            fontFamily: ff.sans, fontSize: 9.5, letterSpacing: "0.16em",
            textTransform: "uppercase", color: theme.ash,
          }}>
            Revision {index} · {ago}
          </div>
          <div style={{
            marginTop: 4,
            fontFamily: ff.serif, fontStyle: "italic", fontSize: 13,
            color: theme.inkSoft,
            whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
          }}>
            {rev?.title || preview || "(empty)"}
          </div>
        </div>
        <span style={{
          color: theme.ash, fontSize: 11,
          transform: open ? "rotate(90deg)" : "rotate(0deg)",
          transition: "transform 0.18s ease",
        }}>›</span>
      </button>
      {open && (
        <div style={{
          padding: "0 12px 12px",
          borderTop: `1px solid ${theme.ruleSoft}`,
        }}>
          {rev?.title && (
            <div style={{
              marginTop: 10,
              fontFamily: ff.serif, fontSize: 15, color: theme.ink,
            }}>
              {rev.title}
            </div>
          )}
          <div style={{
            marginTop: 10,
            fontFamily: ff.serif, fontSize: 13.5, color: theme.ink,
            lineHeight: 1.55, whiteSpace: "pre-line",
          }}>
            {rev?.text || "(empty body)"}
          </div>
          {(start || end) && (
            <div style={{
              marginTop: 10,
              fontFamily: ff.serif, fontStyle: "italic", fontSize: 12,
              color: theme.ash,
            }}>
              {start || "—"}
              <span style={{ margin: "0 6px", color: theme.rule }}>→</span>
              <span style={{ color: theme.sageDeep, fontStyle: "normal" }}>{end || "—"}</span>
            </div>
          )}
          {rev?.note && rev.note.trim() && (
            <div style={{
              marginTop: 10, padding: "8px 10px",
              background: theme.ivory, border: `1px solid ${theme.ruleSoft}`,
              borderRadius: 6,
              fontFamily: ff.serif, fontSize: 12.5, color: theme.inkSoft,
              lineHeight: 1.5, whiteSpace: "pre-line",
            }}>
              {rev.note}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
