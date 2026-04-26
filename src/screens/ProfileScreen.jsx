/* ──────────────────────────────────────────────────────────────
   screens/ProfileScreen.jsx — user profile: stats, badges, preferences, dev toolbar.
   ────────────────────────────────────────────────────────────── */

import React, { useState, useRef } from "react";
import { Flower, ATTRIBUTE_GLYPHS } from "../components/icons";
import {
  SectionLabel, Stat, Toggle,
} from "../components/layout";
import { MOODS } from "../data/blends";
import { SEED_MODES } from "../data/seeds";
import { buildAttributeContext, evaluateAttributes, getUserPrefix, applyPrefix, isColorable } from "../data/attributes";
import { generateCreationTitle } from "../data/creationTitle";
import { getBlend } from "../helpers/misc";
import {
  exportAllPersistedState, importAllPersistedState,
} from "../hooks/usePersistedState";
import { FeedbackModal } from "./FeedbackModal";
import {
  ff, theme,
} from "../theme";
import { useUnit } from "../units/units";

/* ──────────────────────────────────────────────────────────────
   Screen: PROFILE
   ────────────────────────────────────────────────────────────── */

export const ProfileScreen = ({ go, sessions, savedBlendIds, pantryIds, seedMode, setSeedMode, profile, setProfile, resetEverything, isDev }) => {
  const { unit, setUnit, weightUnit, setWeightUnit } = useUnit();

  // Name edit mode
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState(profile?.name || "");

  const saveName = () => {
    const clean = nameDraft.trim() || "friend";
    setProfile({ ...profile, name: clean });
    setNameDraft(clean);
    setEditingName(false);
  };

  // Reset confirm
  const [confirmingReset, setConfirmingReset] = useState(false);

  // Export/import data
  const importInputRef = useRef(null);
  const [importMessage, setImportMessage] = useState(null);

  // Feedback modal
  const [feedbackOpen, setFeedbackOpen] = useState(false);

  const handleExport = () => {
    const payload = exportAllPersistedState();
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const stamp = new Date().toISOString().slice(0, 10);
    const a = document.createElement("a");
    a.href = url;
    a.download = `herbanium-backup-${stamp}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportFile = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const payload = JSON.parse(e.target.result);
        const result = importAllPersistedState(payload);
        if (!result.ok) {
          setImportMessage({ kind: "error", text: `Import failed: ${result.error}` });
          return;
        }
        if (!window.confirm("Import succeeded. Reload to apply your imported data? Any unsaved changes will be lost.")) {
          setImportMessage({ kind: "ok", text: "Imported. Reload the page when ready." });
          return;
        }
        window.location.reload();
      } catch (err) {
        setImportMessage({ kind: "error", text: `Import failed: ${err.message || "invalid JSON"}` });
      }
    };
    reader.readAsText(file);
  };

  const yourSessions = sessions.filter(s => s.who === "you");
  const cupCount = yourSessions.length;
  const blendCount = savedBlendIds.size;
  const shelfCount = pantryIds.size;

  // Compute a simple prediction-match rate: did the target mood land?
  // Here we fake it by checking actual ≈ intent — good enough for the
  // mock and correctly degrades to 0 when no sessions exist.
  const matched = yourSessions.filter(s => {
    const hit = (s.actual || "").toLowerCase();
    return MOODS.includes(hit);
  }).length;
  const matchPct = cupCount > 0 ? Math.round((matched / cupCount) * 100) : 0;

  // Badge grid lives in Compose > Shelf > Badges; only the count stat
  // surfaces here on the identity card.
  const distinctIngredients = new Set();
  yourSessions.forEach(s => {
    const b = getBlend(s.blendId);
    if (b) b.ingredients.forEach(ing => distinctIngredients.add(ing.id));
  });
  const attrCtx = buildAttributeContext({ sessions, savedBlendIds, pantryIds, profile });
  const attrEvaluation = evaluateAttributes(attrCtx);
  const userPrefix = getUserPrefix(attrCtx);
  const earnedAttrs = attrEvaluation.filter(a => a.earned).map(a => ({
    ...a,
    displayName: isColorable(a) ? applyPrefix(a.name, userPrefix) : a.name,
  }));
  // Sort earned by rarity desc — rarest finds bubble up.
  const rarityOrder = { mythic: 5, legendary: 4, rare: 3, uncommon: 2, common: 1 };
  const sortedEarned = [...earnedAttrs].sort((a, b) =>
    (rarityOrder[b.rarity] || 0) - (rarityOrder[a.rarity] || 0)
  );
  // The unique creation title — granted at signup, never re-evaluates.
  // Always rendered when a profile exists; the AttributeShelf prepends
  // it as the first card so users see their identity title immediately.
  const creationTitleName = profile ? (profile.title || generateCreationTitle(profile)) : null;
  const creationCard = creationTitleName ? {
    id: "_creation",
    name: creationTitleName,
    displayName: creationTitleName,
    rarity: "legendary",
    desc: "Granted at your kettle's first lighting. Drawn from the hour you arrived, the flavors you reached for, and the moods you carried in. Nobody else holds this exact one.",
  } : null;
  const allCards = creationCard ? [creationCard, ...sortedEarned] : sortedEarned;
  const [openAttrId, setOpenAttrId] = useState(null);
  const openAttr = openAttrId ? allCards.find(a => a.id === openAttrId) : null;

  const isEmptyUser = cupCount === 0 && blendCount === 0;

  return (
    <div style={{ padding: "18px 20px 32px", fontFamily: ff.sans }}>
      {/* Identity card */}
      <div style={{
        border: `1px solid ${theme.rule}`, borderRadius: 14,
        padding: 20, background: theme.cream,
        position: "relative", overflow: "hidden",
      }}>
        {/* faux stamp — only appears once they've earned it */}
        {cupCount >= 1 && (
          <div style={{
            position: "absolute", top: 14, right: 14,
            width: 60, height: 60, borderRadius: "50%",
            border: `2px dashed ${theme.terra}`, opacity: 0.35,
            display: "flex", alignItems: "center", justifyContent: "center",
            transform: "rotate(-8deg)",
            fontFamily: ff.serif, fontStyle: "italic", fontSize: 11, color: theme.terra,
            textAlign: "center", lineHeight: 1.1,
          }}>kept<br/>since<br/>'24</div>
        )}

        <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
          <div style={{
            width: 56, height: 56, borderRadius: "50%",
            background: theme.ivory, border: `1px solid ${theme.rule}`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontFamily: ff.serif, fontSize: 26, color: theme.terra,
          }}>{(profile?.name || "F").charAt(0).toUpperCase()}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontFamily: ff.serif, fontSize: 13.5, fontStyle: "italic",
              color: theme.terra, letterSpacing: "0.02em", lineHeight: 1.2,
            }}>
              {profile?.title || generateCreationTitle(profile) || (isEmptyUser ? "a new keeper" : "Keeper of the shelf")}
            </div>
            {editingName ? (
              <div style={{ display: "flex", gap: 6, alignItems: "baseline", marginTop: 2 }}>
                <input
                  type="text"
                  value={nameDraft}
                  onChange={e => setNameDraft(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter") saveName(); }}
                  autoFocus
                  maxLength={30}
                  style={{
                    fontFamily: ff.serif, fontSize: 20, color: theme.ink,
                    background: "transparent",
                    border: "none", borderBottom: `1px solid ${theme.terra}`,
                    padding: "2px 0", outline: "none",
                    flex: 1, minWidth: 0,
                  }}
                />
                <button onClick={saveName} style={{
                  fontFamily: ff.sans, fontSize: 11, color: theme.terra,
                  background: "transparent", border: "none", cursor: "pointer",
                }}>save</button>
              </div>
            ) : (
              <div
                onClick={() => { setNameDraft(profile?.name || ""); setEditingName(true); }}
                style={{
                  fontFamily: ff.serif, fontSize: 24, color: theme.ink, lineHeight: 1.1,
                  cursor: "pointer",
                }}
              >
                {profile?.name || "friend"}
              </div>
            )}
            <div style={{ fontFamily: ff.serif, fontStyle: "italic", fontSize: 13, color: theme.ash, marginTop: 2 }}>
              {isEmptyUser
                ? "private · journal is still empty"
                : `private · ${cupCount} cup${cupCount !== 1 ? "s" : ""} · ${blendCount} blend${blendCount !== 1 ? "s" : ""}`
              }
            </div>
          </div>
        </div>

        <div style={{ marginTop: 14, display: "flex", gap: 16 }}>
          <Stat label="Cups"     value={cupCount} />
          <Stat label="Blends"   value={blendCount} />
          <Stat label="In pantry" value={shelfCount} />
          <Stat label="Titles"   value={earnedAttrs.length + (profile?.title || generateCreationTitle(profile) ? 1 : 0)} />
        </div>
      </div>

      {/* self-knowledge */}
      <div style={{ margin: "24px 0 12px" }}><SectionLabel n="i">What you've learned about yourself</SectionLabel></div>
      <div style={{
        padding: 14, borderRadius: 10,
        border: `1px solid ${theme.ruleSoft}`, background: theme.cream,
      }}>
        {cupCount >= 3 && (
          <div style={{ fontFamily: ff.serif, fontSize: 14.5, color: theme.inkSoft, lineHeight: 1.55, marginBottom: earnedAttrs.length > 0 ? 14 : 0 }}>
            Across {cupCount} cups, your predicted-to-actual match rate is
            {" "}<em style={{ color: theme.terra }}>{matchPct}%</em>. You've explored
            {" "}<em style={{ color: theme.sageDeep }}>{distinctIngredients.size}</em> distinct ingredients so far.
          </div>
        )}
        {cupCount > 0 && cupCount < 3 && (
          <div style={{ fontFamily: ff.serif, fontSize: 14, color: theme.inkSoft, lineHeight: 1.55, marginBottom: earnedAttrs.length > 0 ? 14 : 0 }}>
            You've logged {cupCount} cup{cupCount !== 1 ? "s" : ""}. Keep going — a few more brews
            and patterns about what lands for you will start to emerge.
          </div>
        )}
        {creationCard && (
          <AttributeShelf attrs={allCards} openId={openAttrId} setOpenId={setOpenAttrId} openAttr={openAttr} />
        )}
        {!creationCard && cupCount === 0 && (
          <div style={{ fontFamily: ff.serif, fontStyle: "italic", fontSize: 14, color: theme.ash, lineHeight: 1.55 }}>
            Self-knowledge grows from a few cups in. Log three or four
            brews with real intent and the patterns start showing up here.
          </div>
        )}
      </div>

      <div style={{ margin: "22px 0 10px" }}><SectionLabel n="ii">Preferences</SectionLabel></div>
      <div style={{ display: "flex", flexDirection: "column" }}>
        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
          padding: "10px 0", borderTop: `1px solid ${theme.ruleSoft}`,
          fontFamily: ff.sans, fontSize: 13, color: theme.inkSoft,
        }}>
          <span>Temperature</span>
          <div style={{
            display: "inline-flex", alignItems: "center",
            border: `1px solid ${theme.rule}`, borderRadius: 999,
            padding: 2, background: theme.cream,
          }}>
            {["C", "F"].map(u => (
              <button key={u} onClick={() => setUnit(u)} style={{
                fontFamily: ff.sans, fontSize: 11, letterSpacing: "0.08em",
                padding: "4px 12px", borderRadius: 999, border: "none",
                background: unit === u ? theme.ink : "transparent",
                color: unit === u ? theme.cream : theme.ash,
                cursor: "pointer",
              }}>°{u}</button>
            ))}
          </div>
        </div>
        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
          padding: "10px 0", borderTop: `1px solid ${theme.ruleSoft}`,
          fontFamily: ff.sans, fontSize: 13, color: theme.inkSoft,
        }}>
          <span>Weight</span>
          <div style={{
            display: "inline-flex", alignItems: "center",
            border: `1px solid ${theme.rule}`, borderRadius: 999,
            padding: 2, background: theme.cream,
          }}>
            {[
              ["tsp", "tsp"],
              ["g",   "g"  ],
            ].map(([val, label]) => (
              <button key={val} onClick={() => setWeightUnit(val)} style={{
                fontFamily: ff.sans, fontSize: 11, letterSpacing: "0.08em",
                padding: "4px 12px", borderRadius: 999, border: "none",
                background: weightUnit === val ? theme.ink : "transparent",
                color: weightUnit === val ? theme.cream : theme.ash,
                cursor: "pointer",
              }}>{label}</button>
            ))}
          </div>
        </div>
        <Toggle label="Notify when timer completes" value={true} onChange={() => {}} />
        <Toggle label="Quiet hours (10pm–7am)" value={true} onChange={() => {}} />
      </div>

      {/* Reset — available to all users */}
      <div style={{ margin: "26px 0 10px" }}>
        <SectionLabel n="iii">Your journal</SectionLabel>
      </div>
      <div style={{
        padding: 14, borderRadius: 10,
        border: `1px solid ${theme.rule}`, background: theme.cream,
      }}>
        <div style={{
          fontFamily: ff.serif, fontStyle: "italic", fontSize: 13, color: theme.inkSoft,
          marginBottom: 12, lineHeight: 1.5,
        }}>
          Your journal lives on this device. No account, no cloud sync.
          Clearing your browser data will clear your journal.
        </div>

        {/* Export / Import / Feedback */}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12, justifyContent: "center" }}>
          <button
            onClick={handleExport}
            style={{
              fontFamily: ff.sans, fontSize: 12, color: theme.ink,
              padding: "8px 14px", borderRadius: 999,
              background: "transparent", border: `1px solid ${theme.ink}`,
              cursor: "pointer",
            }}
          >
            export your data
          </button>
          <button
            onClick={() => importInputRef.current?.click()}
            style={{
              fontFamily: ff.sans, fontSize: 12, color: theme.ink,
              padding: "8px 14px", borderRadius: 999,
              background: "transparent", border: `1px solid ${theme.ink}`,
              cursor: "pointer",
            }}
          >
            import data
          </button>
          <input
            ref={importInputRef}
            type="file"
            accept="application/json,.json"
            onChange={(e) => {
              handleImportFile(e.target.files?.[0]);
              e.target.value = "";
            }}
            style={{ display: "none" }}
          />
        </div>
        {feedbackOpen && <FeedbackModal onClose={() => setFeedbackOpen(false)} />}
        {importMessage && (
          <div style={{
            fontFamily: ff.serif, fontStyle: "italic", fontSize: 12,
            color: importMessage.kind === "error" ? theme.terra : theme.sageDeep,
            marginBottom: 12, lineHeight: 1.45,
          }}>
            {importMessage.text}
          </div>
        )}

        {confirmingReset ? (
          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={() => setConfirmingReset(false)}
              style={{
                fontFamily: ff.sans, fontSize: 12, color: theme.inkSoft,
                padding: "8px 14px", borderRadius: 999,
                background: "transparent", border: `1px solid ${theme.rule}`,
                cursor: "pointer",
              }}
            >
              cancel
            </button>
            <button
              onClick={resetEverything}
              style={{
                fontFamily: ff.sans, fontSize: 12, letterSpacing: "0.04em",
                padding: "8px 14px", borderRadius: 999,
                background: theme.terra, color: theme.cream,
                border: "none", cursor: "pointer",
                flex: 1,
              }}
            >
              yes, reset everything
            </button>
          </div>
        ) : (
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "center" }}>
            <button
              onClick={() => setConfirmingReset(true)}
              style={{
                fontFamily: ff.sans, fontSize: 12, color: theme.terra,
                padding: "8px 14px", borderRadius: 999,
                background: "transparent", border: `1px solid ${theme.terra}`,
                cursor: "pointer",
              }}
            >
              start over
            </button>
            <button
              onClick={() => setFeedbackOpen(true)}
              style={{
                fontFamily: ff.sans, fontSize: 12, color: theme.terra,
                padding: "8px 14px", borderRadius: 999,
                background: "transparent", border: `1px solid ${theme.terra}`,
                cursor: "pointer",
              }}
            >
              send feedback
            </button>
          </div>
        )}
      </div>

      {/* Dev toolbar — only visible in ?dev mode */}
      {isDev && (
        <>
          <div style={{ margin: "26px 0 10px" }}>
            <SectionLabel n="iv">Dev — seed data</SectionLabel>
          </div>
          <div style={{
            padding: 12, borderRadius: 10,
            border: `1px dashed ${theme.rule}`, background: "rgba(181,130,89,0.04)",
          }}>
            <div style={{
              fontFamily: ff.serif, fontStyle: "italic", fontSize: 12, color: theme.ash,
              marginBottom: 10, lineHeight: 1.45,
            }}>
              Swap the app's state between snapshots to test empty-user,
              mid-journey, and power-user flows. Only visible in ?dev mode.
            </div>
            <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
              {Object.entries(SEED_MODES).map(([key, m]) => (
                <button key={key} onClick={() => setSeedMode(key)} style={{
                  fontFamily: ff.sans, fontSize: 11, letterSpacing: "0.03em",
                  padding: "6px 12px", borderRadius: 999,
                  border: `1px solid ${seedMode === key ? theme.ink : theme.rule}`,
                  background: seedMode === key ? theme.ink : "transparent",
                  color: seedMode === key ? theme.cream : theme.inkSoft,
                  cursor: "pointer",
                  flex: 1, minWidth: 80,
                }}>{m.label}</button>
              ))}
            </div>
            <div style={{
              fontFamily: ff.serif, fontStyle: "italic", fontSize: 11.5, color: theme.ash,
              marginTop: 10, lineHeight: 1.45,
            }}>
              {SEED_MODES[seedMode].description}
            </div>
          </div>
        </>
      )}

      {/* Notice — soft legal disclaimer; deliberately at the very bottom
          so it's findable but doesn't compete with anything daily. */}
      <div style={{ margin: "32px 0 8px" }}>
        <SectionLabel>Notice</SectionLabel>
      </div>
      <div style={{
        padding: "14px 16px", borderRadius: 10,
        background: "rgba(176, 84, 47, 0.05)",
        border: `2px solid ${theme.terra}`,
        fontFamily: ff.serif, fontSize: 12.5, fontWeight: 600,
        color: theme.terra, lineHeight: 1.55,
      }}>
        Herbanium is a brewing companion and journal — <em>not</em> medical advice. Effects, traditional uses, and ingredient warnings reflect common literature and should never replace a clinician. If you're pregnant, nursing, taking prescription medication, or managing a health condition, verify any herb with a qualified professional before use. Trust your body; trust the cup; verify the science.
      </div>
    </div>
  );
};

/* ──────────────────────────────────────────────────────────────
   AttributeShelf — earned-only name cards, border colored by rarity.
   Tap any card to expand its description. No icons, no totals —
   the locked set stays a mystery.
   ────────────────────────────────────────────────────────────── */

const RARITY_TONE = {
  common:    { color: theme.ash,      label: "common",    bg: "rgba(140,140,140,0.05)" },
  uncommon:  { color: theme.sageDeep, label: "uncommon",  bg: "rgba(98,124,92,0.07)" },
  rare:      { color: theme.ochre,    label: "rare",      bg: "rgba(165,120,54,0.10)" },
  legendary: { color: theme.terra,    label: "legendary", bg: "rgba(176,84,47,0.10)" },
  mythic:    { color: theme.plum,     label: "mythic",    bg: "rgba(120,72,140,0.12)" },
};

const AttributeShelf = ({ attrs, openId, setOpenId, openAttr }) => (
  <>
    {/* Detail card — sits above the grid when one is open */}
    {openAttr && (() => {
      const tone = RARITY_TONE[openAttr.rarity] || RARITY_TONE.common;
      return (
        <div style={{
          marginBottom: 12, padding: "12px 14px", borderRadius: 10,
          background: tone.bg,
          border: `2px solid ${tone.color}`,
          position: "relative",
        }}>
          <button onClick={() => setOpenId(null)} aria-label="close" style={{
            position: "absolute", top: 4, right: 8,
            background: "transparent", border: "none", cursor: "pointer",
            color: theme.ash, fontSize: 18, lineHeight: 1, padding: 4,
          }}>×</button>
          <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 4, flexWrap: "wrap", marginRight: 18 }}>
            <span style={{ fontFamily: ff.serif, fontSize: 16, color: theme.ink }}>
              {openAttr.displayName || openAttr.name}
            </span>
            <span style={{
              fontFamily: ff.sans, fontSize: 9, letterSpacing: "0.16em",
              textTransform: "uppercase", color: tone.color, fontWeight: 600,
            }}>
              {tone.label}
            </span>
          </div>
          <div style={{
            fontFamily: ff.serif, fontStyle: "italic", fontSize: 13,
            color: theme.inkSoft, lineHeight: 1.5,
          }}>
            {openAttr.desc}
          </div>
        </div>
      );
    })()}

    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
      {attrs.map(a => {
        const tone = RARITY_TONE[a.rarity] || RARITY_TONE.common;
        const isOpen = openId === a.id;
        return (
          <button
            key={a.id}
            onClick={() => setOpenId(prev => prev === a.id ? null : a.id)}
            style={{
              fontFamily: ff.serif, fontSize: 13,
              padding: "6px 12px", borderRadius: 6,
              background: isOpen ? tone.bg : "transparent",
              color: theme.ink,
              border: `2px solid ${tone.color}`,
              cursor: "pointer",
              transition: "background 0.15s ease",
              whiteSpace: "nowrap",
            }}
          >{a.displayName || a.name}</button>
        );
      })}
    </div>
  </>
);
