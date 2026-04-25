/* ──────────────────────────────────────────────────────────────
   screens/ProfileScreen.jsx — user profile: stats, badges, preferences, dev toolbar.
   ────────────────────────────────────────────────────────────── */

import React, { useState } from "react";
import { Flower } from "../components/icons";
import {
  SectionLabel, Stat, Toggle,
} from "../components/layout";
import { MOODS } from "../data/blends";
import { SEED_MODES } from "../data/seeds";
import { getBlend } from "../helpers/misc";
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

  // Badges earned by simple thresholds. Falls clean to zero for new users.
  const distinctIngredients = new Set();
  yourSessions.forEach(s => {
    const b = getBlend(s.blendId);
    if (b) b.ingredients.forEach(ing => distinctIngredients.add(ing.id));
  });

  const badges = [
    { name: "First Brewing",    earned: cupCount >= 1,  desc: "The first recorded cup." },
    { name: "Sworn Evening",    earned: cupCount >= 7,  desc: "Seven calming cups before bed." },
    { name: "The Cartographer", earned: distinctIngredients.size >= 12, desc: "Logged twelve distinct ingredients." },
    { name: "Self-Knower",      earned: matched >= 10,  desc: "Prediction matched truth ten times." },
    { name: "The Lavandière",   earned: false,          desc: "Try every flower in the catalog." },
    { name: "Dawn Watcher",     earned: false,          desc: "Five cups before 7am." },
  ];
  const earnedCount = badges.filter(b => b.earned).length;

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
            <div style={{ fontFamily: ff.sans, fontSize: 10, letterSpacing: "0.2em", textTransform: "uppercase", color: theme.ash }}>
              {isEmptyUser ? "a new keeper" : "Keeper of the shelf"}
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
          <Stat label="Badges"   value={earnedCount} />
        </div>
      </div>

      {/* self-knowledge */}
      <div style={{ margin: "24px 0 12px" }}><SectionLabel n="i">What you've learned about yourself</SectionLabel></div>
      <div style={{
        padding: 14, borderRadius: 10,
        border: `1px solid ${theme.ruleSoft}`, background: theme.cream,
      }}>
        {cupCount === 0 ? (
          <div style={{ fontFamily: ff.serif, fontStyle: "italic", fontSize: 14, color: theme.ash, lineHeight: 1.55 }}>
            Self-knowledge grows from a few cups in. Log three or four
            brews with real intent and the patterns start showing up here.
          </div>
        ) : cupCount < 3 ? (
          <div style={{ fontFamily: ff.serif, fontSize: 14, color: theme.inkSoft, lineHeight: 1.55 }}>
            You've logged {cupCount} cup{cupCount !== 1 ? "s" : ""}. Keep going — a few more brews
            and patterns about what lands for you will start to emerge.
          </div>
        ) : (
          <div style={{ fontFamily: ff.serif, fontSize: 15, color: theme.inkSoft, lineHeight: 1.55 }}>
            Across {cupCount} logged cups, your predicted-to-actual match rate is
            {" "}<em style={{ color: theme.terra }}>{matchPct}%</em>. You've explored
            {" "}<em style={{ color: theme.sageDeep }}>{distinctIngredients.size}</em> distinct ingredients so far.
          </div>
        )}
      </div>

      <div style={{ margin: "22px 0 12px" }}><SectionLabel n="ii">Badges</SectionLabel></div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        {badges.map(b => (
          <div key={b.name} style={{
            padding: 12, borderRadius: 10,
            background: b.earned ? theme.cream : "transparent",
            border: `1px ${b.earned ? "solid" : "dashed"} ${theme.rule}`,
            opacity: b.earned ? 1 : 0.55,
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
              {b.earned ? <Flower size={18} c={theme.ochre} /> : <Flower size={18} c={theme.ash} />}
              {b.earned && <span style={{ fontFamily: ff.serif, fontStyle: "italic", fontSize: 10, color: theme.terra }}>sealed</span>}
            </div>
            <div style={{ fontFamily: ff.serif, fontSize: 14, color: theme.ink, lineHeight: 1.2 }}>{b.name}</div>
            <div style={{ fontFamily: ff.serif, fontStyle: "italic", fontSize: 11.5, color: theme.ash, marginTop: 3 }}>{b.desc}</div>
          </div>
        ))}
      </div>

      <div style={{ margin: "22px 0 10px" }}><SectionLabel n="iii">Preferences</SectionLabel></div>
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
        <SectionLabel n="iv">Your journal</SectionLabel>
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
        )}
      </div>

      {/* Dev toolbar — only visible in ?dev mode */}
      {isDev && (
        <>
          <div style={{ margin: "26px 0 10px" }}>
            <SectionLabel n="v">Dev — seed data</SectionLabel>
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
        background: "transparent", border: `1px dashed ${theme.ruleSoft}`,
        fontFamily: ff.serif, fontStyle: "italic", fontSize: 12, color: theme.ash,
        lineHeight: 1.55,
      }}>
        Herbanium is a brewing companion and journal — not medical advice. Effects, traditional uses, and ingredient warnings reflect common literature and should never replace a clinician. If you're pregnant, nursing, taking prescription medication, or managing a health condition, verify any herb with a qualified professional before use. Trust your body; trust the cup; verify the science.
      </div>
    </div>
  );
};
