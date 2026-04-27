/* ──────────────────────────────────────────────────────────────
   components/Planner.jsx — small "today's intentions" planner.

   A short list the user keeps for the day: things they want to
   brew, sip, or take care of. Items can be added, ticked off,
   inline-edited, or deleted. Used in two places — inline as a
   section in Shelf > Journal, and inside PlannerModal as a
   pop-up over the brew page.
   ────────────────────────────────────────────────────────────── */

import React, { useState } from "react";
import { theme, ff } from "../theme";
import { Pencil } from "./icons";
import { sessionAgo } from "../helpers/misc";

export const Planner = ({
  items = [],
  onAdd,
  onToggle,
  onEdit,
  onDelete,
  onClearDone,
  compact = false,
}) => {
  const [draft, setDraft] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editDraft, setEditDraft] = useState("");

  const submitDraft = () => {
    const t = draft.trim();
    if (!t) return;
    onAdd && onAdd(t);
    setDraft("");
  };

  const startEdit = (item) => {
    setEditingId(item.id);
    setEditDraft(item.text);
  };
  const commitEdit = () => {
    if (!editingId) return;
    const t = editDraft.trim();
    if (t) onEdit && onEdit(editingId, t);
    setEditingId(null);
    setEditDraft("");
  };

  const doneCount = items.filter(i => i.done).length;

  return (
    <div style={{
      padding: compact ? "10px 12px" : "12px 14px",
      borderRadius: 10,
      background: theme.cream,
      border: `1px solid ${theme.ruleSoft}`,
    }}>
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        marginBottom: 10, gap: 8,
      }}>
        <div style={{
          fontFamily: ff.sans, fontSize: 10, letterSpacing: "0.18em",
          textTransform: "uppercase", color: theme.sageDeep,
        }}>Planner</div>
        {items.length > 0 && (
          <div style={{
            fontFamily: ff.serif, fontStyle: "italic", fontSize: 11,
            color: theme.ash,
          }}>
            {doneCount}/{items.length} done
          </div>
        )}
      </div>

      <div style={{
        display: "flex", alignItems: "center", gap: 8,
        padding: "6px 10px", borderRadius: 8,
        background: "rgba(176, 84, 47, 0.05)",
        border: `1px solid ${theme.terra}`,
        marginBottom: items.length > 0 ? 10 : 0,
      }}>
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") submitDraft(); }}
          placeholder="add a plan for today…"
          maxLength={120}
          style={{
            flex: 1, minWidth: 0,
            fontFamily: ff.serif, fontSize: 14, color: theme.ink,
            background: "transparent", border: "none",
            padding: "4px 0", outline: "none",
          }}
        />
        <button
          onClick={submitDraft}
          disabled={!draft.trim()}
          style={{
            fontFamily: ff.sans, fontSize: 11, letterSpacing: "0.12em",
            textTransform: "uppercase",
            color: draft.trim() ? theme.cream : theme.ash,
            background: draft.trim() ? theme.terra : "transparent",
            border: `1px solid ${draft.trim() ? theme.terra : theme.rule}`,
            borderRadius: 999, padding: "4px 10px",
            cursor: draft.trim() ? "pointer" : "default",
            opacity: draft.trim() ? 1 : 0.55,
          }}
        >Add</button>
      </div>

      {items.length === 0 ? (
        <div style={{
          marginTop: 6,
          fontFamily: ff.serif, fontStyle: "italic", fontSize: 12.5,
          color: theme.ash, lineHeight: 1.5,
        }}>
          No plans yet. Jot a small intention — a cup, a moment, a chore — and check it off as the day moves.
        </div>
      ) : (
        <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
          {items.map(item => {
            const isEditing = editingId === item.id;
            return (
              <li
                key={item.id}
                style={{
                  display: "flex", alignItems: "center", gap: 8,
                  padding: "6px 0",
                  borderTop: `1px solid ${theme.ruleSoft}`,
                }}
              >
                <button
                  onClick={() => onToggle && onToggle(item.id)}
                  aria-label={item.done ? "mark not done" : "mark done"}
                  title={item.done ? "mark not done" : "mark done"}
                  style={{
                    flexShrink: 0,
                    width: 18, height: 18, borderRadius: 4,
                    background: item.done ? theme.sageDeep : "transparent",
                    border: `1.5px solid ${item.done ? theme.sageDeep : theme.rule}`,
                    cursor: "pointer", padding: 0,
                    color: theme.cream, fontSize: 11, lineHeight: 1,
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}
                >{item.done ? "✓" : ""}</button>

                {isEditing ? (
                  <input
                    autoFocus
                    onFocus={(e) => e.target.select()}
                    value={editDraft}
                    onChange={(e) => setEditDraft(e.target.value)}
                    onBlur={commitEdit}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") commitEdit();
                      if (e.key === "Escape") { setEditingId(null); setEditDraft(""); }
                    }}
                    maxLength={120}
                    style={{
                      flex: 1, minWidth: 0,
                      fontFamily: ff.serif, fontSize: 14, color: theme.ink,
                      background: "transparent", border: "none",
                      borderBottom: `1px solid ${theme.terra}`,
                      padding: "2px 0", outline: "none",
                    }}
                  />
                ) : (
                  <div
                    onClick={() => startEdit(item)}
                    role="button"
                    title="tap to edit"
                    style={{
                      flex: 1, minWidth: 0, cursor: "pointer",
                      fontFamily: ff.serif, fontSize: 14,
                      color: item.done ? theme.ash : theme.ink,
                      lineHeight: 1.4,
                      textDecoration: item.done ? "line-through" : "none",
                      wordBreak: "break-word",
                    }}
                  >{item.text}</div>
                )}

                {!isEditing && (
                  <>
                    <button
                      onClick={() => startEdit(item)}
                      aria-label="edit"
                      title="edit"
                      style={{
                        flexShrink: 0,
                        background: "transparent", border: "none",
                        padding: 4, cursor: "pointer",
                        opacity: 0.55,
                      }}
                    >
                      <Pencil size={12} c={theme.ash} />
                    </button>
                    <button
                      onClick={() => onDelete && onDelete(item.id)}
                      aria-label="delete"
                      title="delete"
                      style={{
                        flexShrink: 0,
                        background: "transparent", border: "none",
                        color: theme.ash, fontSize: 14, lineHeight: 1,
                        padding: "2px 4px", cursor: "pointer",
                        opacity: 0.5,
                      }}
                    >×</button>
                  </>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {doneCount > 0 && onClearDone && (
        <div style={{ marginTop: 10, display: "flex", justifyContent: "flex-end" }}>
          <button
            onClick={onClearDone}
            style={{
              fontFamily: ff.sans, fontSize: 10.5, letterSpacing: "0.12em",
              textTransform: "uppercase", color: theme.ash,
              background: "transparent", border: "none",
              padding: "4px 6px", cursor: "pointer",
            }}
          >clear done</button>
        </div>
      )}
    </div>
  );
};

/* PlannerModal — full-screen overlay wrapping Planner. Used from the
   brewing-timer screen so the user can glance at / edit their day
   plan without leaving the steep flow.

   Optional pastBrewNotes block surfaces the private note history of
   the blend currently brewing — written intents and post-brew log
   notes from past sessions. The notes block sits below the planner
   so the day-plan stays the primary use of the modal. */
export const PlannerModal = ({
  open,
  onClose,
  plannerProps,
  pastBrewNotes,    // optional: { blendName, sessions: [{ id, ago, intent, note }] }
}) => {
  if (!open) return null;
  const notes = pastBrewNotes && pastBrewNotes.sessions ? pastBrewNotes.sessions : null;
  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, zIndex: 220,
        background: "rgba(232, 220, 192, 0.86)",
        display: "flex", alignItems: "flex-start", justifyContent: "center",
        padding: "60px 20px 40px",
        overflowY: "auto",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          position: "relative",
          maxWidth: 460, width: "100%",
          background: theme.cream,
          border: `1px solid ${theme.ruleSoft}`,
          borderRadius: 14,
          padding: "16px 16px 14px",
          boxShadow: "0 18px 44px rgba(0,0,0,0.14)",
        }}
      >
        <button
          onClick={onClose}
          aria-label="close planner"
          style={{
            position: "absolute", top: 8, right: 12,
            background: "transparent", border: "none", cursor: "pointer",
            color: theme.ash, fontSize: 22, lineHeight: 1, padding: 4,
          }}
        >×</button>
        <div style={{
          fontFamily: ff.serif, fontSize: 17, color: theme.ink,
          marginBottom: 10, paddingRight: 24,
        }}>
          Today's plan
        </div>
        <Planner {...plannerProps} />

        {pastBrewNotes && (
          <div style={{ marginTop: 18 }}>
            <div style={{
              fontFamily: ff.sans, fontSize: 10, letterSpacing: "0.18em",
              textTransform: "uppercase", color: theme.sageDeep,
              marginBottom: 4,
            }}>
              Notes from past brews
            </div>
            {pastBrewNotes.blendName && (
              <div style={{
                fontFamily: ff.serif, fontStyle: "italic", fontSize: 12.5,
                color: theme.ash, marginBottom: 8,
              }}>
                {pastBrewNotes.blendName}
              </div>
            )}
            <div style={{
              padding: "8px 12px", borderRadius: 10,
              border: `1px solid ${theme.ruleSoft}`, background: theme.cream,
              maxHeight: 280, overflowY: "auto",
            }}>
              {!notes || notes.length === 0 ? (
                <div style={{
                  fontFamily: ff.serif, fontStyle: "italic", fontSize: 13,
                  color: theme.ash, lineHeight: 1.5,
                  padding: "8px 0", textAlign: "left",
                }}>
                  No notes from past brews of this cup yet. Whatever you write
                  in the steep notes field — or in the log after — will land here
                  for next time.
                </div>
              ) : (
                notes.map((s, i) => {
                  const intent = (s.intent || "").trim();
                  const note   = (s.note   || "").trim();
                  return (
                    <div key={s.id || i} style={{
                      padding: "10px 0",
                      borderTop: i === 0 ? "none" : `1px solid ${theme.ruleSoft}`,
                    }}>
                      <div style={{
                        fontFamily: ff.serif, fontStyle: "italic", fontSize: 11,
                        color: theme.ash, marginBottom: 4,
                      }}>{sessionAgo(s) || s.ago}</div>
                      {intent && (
                        <div style={{
                          fontFamily: ff.serif, fontSize: 13.5, color: theme.ink,
                          lineHeight: 1.5, whiteSpace: "pre-line",
                        }}>{intent}</div>
                      )}
                      {note && (
                        <div style={{
                          fontFamily: ff.serif, fontStyle: "italic", fontSize: 13,
                          color: theme.inkSoft, lineHeight: 1.5,
                          marginTop: intent ? 6 : 0, whiteSpace: "pre-line",
                        }}>{note}</div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
