/* ──────────────────────────────────────────────────────────────
   screens/ProfileScreen.jsx — user profile: stats, badges, preferences, dev toolbar.
   ────────────────────────────────────────────────────────────── */

import React, { useState, useRef } from "react";
import { Flower, Ornament, Pencil, ATTRIBUTE_GLYPHS } from "../components/icons";
import { TeaConstellation } from "../components/TeaConstellation";
import {
  SectionLabel, Stat,
} from "../components/layout";
import { MOODS } from "../data/blends";
import { SEED_MODES } from "../data/seeds";
import { buildAttributeContext, evaluateAttributes, getUserPrefix, applyPrefix, isColorable } from "../data/attributes";
import { generateCreationTitle } from "../data/creationTitle";
import { getBlend } from "../helpers/misc";
import {
  exportAllPersistedState, importAllPersistedState,
} from "../hooks/usePersistedState";
import { isNativeApp } from "../helpers/platform";
import { FeedbackModal } from "./FeedbackModal";
import { HintCard } from "../components/HintCard";
import {
  ff, radius, theme,
} from "../theme";
import { useUnit } from "../units/units";

/* ──────────────────────────────────────────────────────────────
   Screen: PROFILE
   ────────────────────────────────────────────────────────────── */

export const ProfileScreen = ({ go, openCup, sessions, savedBlendIds, seedMode, setSeedMode, profile, setProfile, resetEverything, startTour, isDev, devModeEnabled, setDevModeEnabled, elementalsDisabled, setElementalsDisabled, lodestoneCharge = 0, setLodestoneCharge, profileHintShown, dismissProfileHint, journalEntries, tabVisits, wildElementals = [], seenElementalIds, devForceGlimpse }) => {
  const { unit, setUnit, weightUnit, setWeightUnit } = useUnit();

  // Name edit mode
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState(profile?.name || "");

  // Motto edit mode — short user-authored line under the name. Lives
  // on profile.motto so it persists with the rest of identity state.
  const [editingMotto, setEditingMotto] = useState(false);
  const [mottoDraft, setMottoDraft] = useState(profile?.motto || "");
  const saveMotto = () => {
    const clean = mottoDraft.trim().slice(0, 80);
    setProfile({ ...profile, motto: clean });
    setMottoDraft(clean);
    setEditingMotto(false);
  };

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

  // Hidden dev-mode reveal — five taps on the version footer flips
  // the dev toggle into view. Counts within a 3-second window so
  // accidental taps don't accumulate forever.
  const [versionTaps, setVersionTaps] = useState(0);
  const versionTapTimer = useRef(null);
  const tapVersion = () => {
    if (versionTapTimer.current) clearTimeout(versionTapTimer.current);
    setVersionTaps(prev => prev + 1);
    versionTapTimer.current = setTimeout(() => setVersionTaps(0), 3000);
  };
  const devToggleVisible = devModeEnabled || versionTaps >= 5;

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
    // Stamp the profile so the Caladrius elemental unlocks.
    if (profile && !profile.exportedAt) {
      setProfile({ ...profile, exportedAt: Date.now() });
    }
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
        // Stamp the imported profile so the Bennu elemental unlocks. Import
        // wipes localStorage, so we mutate the freshly-written profile
        // entry directly before the page reloads to pick it up.
        try {
          const k = "herbanium.profile";
          const cur = JSON.parse(localStorage.getItem(k) || "{}");
          cur.importedAt = Date.now();
          localStorage.setItem(k, JSON.stringify(cur));
        } catch {
          // Best-effort — failure here just means the milestone isn't recorded.
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
  const attrCtx = buildAttributeContext({ sessions, savedBlendIds, profile, journalEntries, tabVisits });
  const attrEvaluation = evaluateAttributes(attrCtx);
  // Elementals stat — count what the user has actually summoned/
  // observed (seenElementalIds), not what the engine has *earned*
  // for them (which can include unsummoned arrivals queued at the
  // lodestone). The Field Notes view filters its timeline by
  // seenElementalIds too, so this number now matches what the user
  // sees when they tap through. Falls back to the older earned-set
  // calculation when the prop isn't passed (defensive — shouldn't
  // happen now that App threads it through).
  const seenSet = seenElementalIds instanceof Set
    ? seenElementalIds
    : new Set(Array.isArray(seenElementalIds) ? seenElementalIds : []);
  const elementalsCount = seenSet.size > 0
    ? seenSet.size
    : (attrEvaluation.filter(a => a.earned).length + (wildElementals?.length || 0));
  const isEmptyUser = cupCount === 0 && blendCount === 0;

  return (
    <div style={{ padding: "18px 20px 32px", fontFamily: ff.sans }}>


      {/* Identity card */}
      <div style={{
        border: `1px solid ${theme.rule}`, borderRadius: 14,
        padding: 20, background: theme.cream,
        position: "relative", overflow: "hidden",
      }}>
        <div style={{ display: "flex" }}>
          <div style={{ flex: 1, minWidth: 0, textAlign: "center" }}>
            {editingName ? (
              <div style={{ display: "flex", gap: 6, alignItems: "baseline", marginTop: 2, justifyContent: "center" }}>
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

            {/* Motto — tap to author, blank by default. Same affordance
                pattern as the name above. */}
            {editingMotto ? (
              <div style={{ display: "flex", gap: 6, alignItems: "baseline", marginTop: 6, justifyContent: "center" }}>
                <input
                  type="text"
                  value={mottoDraft}
                  onChange={e => setMottoDraft(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter") saveMotto(); }}
                  autoFocus
                  maxLength={80}
                  placeholder="a line for your kettle"
                  style={{
                    fontFamily: ff.serif, fontSize: 13, fontStyle: "italic",
                    color: theme.inkSoft, background: "transparent",
                    border: "none", borderBottom: `1px solid ${theme.terra}`,
                    padding: "2px 0", outline: "none",
                    flex: 1, minWidth: 0, textAlign: "center",
                  }}
                />
                <button onClick={saveMotto} style={{
                  fontFamily: ff.sans, fontSize: 11, color: theme.terra,
                  background: "transparent", border: "none", cursor: "pointer",
                }}>save</button>
              </div>
            ) : (
              <div
                onClick={() => { setMottoDraft(profile?.motto || ""); setEditingMotto(true); }}
                style={{
                  marginTop: 6,
                  fontFamily: ff.serif, fontStyle: "italic", fontSize: 13,
                  color: profile?.motto ? theme.inkSoft : theme.ash,
                  lineHeight: 1.4, cursor: "pointer",
                  opacity: profile?.motto ? 1 : 0.7,
                  display: "inline-flex", alignItems: "center", gap: 6,
                }}
              >
                <span>{profile?.motto || "a line for your kettle"}</span>
                {!profile?.motto && <Pencil size={11} c={theme.terra} />}
              </div>
            )}
          </div>
        </div>

        {/* Quiet ornament between identity and stats — visual rhythm
            without filler imagery. */}
        <div style={{ display: "flex", justifyContent: "center", marginTop: 14, marginBottom: 4 }}>
          <Ornament w={120} c={theme.ochre} />
        </div>

        <div style={{ marginTop: 6, display: "flex", gap: 16, justifyContent: "center" }}>
          <Stat label="Cups"      value={cupCount}    onClick={() => go("shelf", { mode: "journal" })} />
          <Stat label="Blends"    value={blendCount}  onClick={() => go("shelf", { mode: "recipes" })} />
          {!elementalsDisabled && (
            <Stat label="Elementals"  value={elementalsCount} onClick={() => go("shelf", { mode: "visitors" })} />
          )}
        </div>
      </div>

      {/* Tea Constellation — temporarily hidden. The component is
          ready (src/components/TeaConstellation.jsx) and renders
          every cup as a dot on a 2D cool↔warm × bright↔deep plane,
          but the visualization needs more polish before shipping
          (axis tuning, mobile sizing, possibly running through the
          brew engine for actual brewed positions instead of static
          flavor lists). To re-enable, swap SHOW_CONSTELLATION to true
          below — everything else is wired through. */}
      {(() => {
        const SHOW_CONSTELLATION = false;
        if (!SHOW_CONSTELLATION) return null;
        const cupCount = (sessions || []).filter(s => s.who === "you" && s.blendId).length;
        if (cupCount < 2) return null;
        return (
          <div style={{ marginTop: 22 }}>
            <TeaConstellation
              sessions={sessions}
              openCup={openCup}
            />
          </div>
        );
      })()}

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
                transition: "background 0.2s ease, color 0.2s ease, box-shadow 0.2s ease",
                boxShadow: unit === u ? "0 2px 6px -1px rgba(30,24,18,0.24)" : "none",
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
              <button key={val} data-testid={`weight-unit-${val}`}
                onClick={() => setWeightUnit(val)} style={{
                fontFamily: ff.sans, fontSize: 11, letterSpacing: "0.08em",
                padding: "4px 12px", borderRadius: 999, border: "none",
                background: weightUnit === val ? theme.ink : "transparent",
                color: weightUnit === val ? theme.cream : theme.ash,
                cursor: "pointer",
                transition: "background 0.2s ease, color 0.2s ease, box-shadow 0.2s ease",
                boxShadow: weightUnit === val ? "0 2px 6px -1px rgba(30,24,18,0.24)" : "none",
              }}>{label}</button>
            ))}
          </div>
        </div>

        {/* Remove Elementals — hides the Elementals sub-tab + the
            Profile stat for users who'd rather not engage with the
            elementals layer. State persists as elementalsDisabled. */}
        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
          padding: "10px 0", borderTop: `1px solid ${theme.ruleSoft}`,
          fontFamily: ff.sans, fontSize: 13, color: theme.inkSoft,
        }}>
          <span>Remove Elementals</span>
          <span
            onClick={() => setElementalsDisabled && setElementalsDisabled(!elementalsDisabled)}
            style={{
              width: 34, height: 20, borderRadius: 999,
              background: elementalsDisabled ? theme.terra : theme.rule,
              position: "relative", cursor: "pointer",
              transition: "background .2s",
            }}
          >
            <span style={{
              position: "absolute", top: 2, left: elementalsDisabled ? 16 : 2,
              width: 16, height: 16, borderRadius: "50%", background: theme.cream,
              transition: "left .2s",
            }} />
          </span>
        </div>
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
          Your journal stays on this device — no account, no servers, never shared.
          Phone keeps it in the app; web keeps it in your browser's storage, so clearing
          browser data clears your journal. Export below for a portable copy.
        </div>

        {/* Export / Import — desktop only. Native WebView wraps
            on iOS and Android have inconsistent file-picker shims
            and the workflow really suits a desktop save anyway. */}
        {!isNativeApp() && (
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
        )}
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
            {startTour && (
              <button
                onClick={startTour}
                style={{
                  fontFamily: ff.sans, fontSize: 12, color: theme.ink,
                  padding: "8px 14px", borderRadius: 999,
                  background: "transparent", border: `1px solid ${theme.ink}`,
                  cursor: "pointer",
                }}
              >
                replay tour
              </button>
            )}
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
            {/* Feedback form — desktop-web only. Native users have
                the App Store / Play Store review channels for the
                same purpose, and the Formspree third-party POST
                would need its own privacy disclosure on store
                listings if we surfaced it on phones. */}
            {!isNativeApp() && (
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
            )}
          </div>
        )}
      </div>

      {/* Sources — collapsible at the bottom for users who want to know
          where the catalog's claims, dosing windows, and brewing
          chemistry come from. */}
      <div style={{ margin: "26px 0 10px" }}>
        <SectionLabel n="iv">Sources</SectionLabel>
      </div>
      <SourcesPanel />

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

          {/* Lodestone charge — set the fill level by hand. No seed
              produces a resting lodestone (power/mid/new all arrive
              pulsing with 26, 27 and 1 pending respectively), so
              without this there's no way to look at the empty state,
              a part-filled stone, or the moment it tops out. */}
          {setLodestoneCharge && (
            <div style={{
              border: `1px solid ${theme.rule}`, borderRadius: radius.md,
              padding: "14px 16px", marginBottom: 12,
            }}>
              <div style={{
                fontFamily: ff.sans, fontSize: 10, letterSpacing: "0.16em",
                textTransform: "uppercase", color: theme.ash, marginBottom: 10,
              }}>
                lodestone charge — {Math.round(lodestoneCharge)}%
              </div>
              <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                {[["empty", 0], ["a third", 33], ["two thirds", 66], ["full", 100]].map(([label, v]) => (
                  <button key={label} onClick={() => setLodestoneCharge(v)} style={{
                    fontFamily: ff.sans, fontSize: 11, letterSpacing: "0.03em",
                    padding: "6px 12px", borderRadius: 999,
                    border: `1px solid ${lodestoneCharge === v ? theme.ink : theme.rule}`,
                    background: lodestoneCharge === v ? theme.ink : "transparent",
                    color: lodestoneCharge === v ? theme.cream : theme.inkSoft,
                    cursor: "pointer", flex: 1, minWidth: 70,
                  }}>{label}</button>
                ))}
              </div>
            </div>
          )}

          {/* Glimpse-banner force-trigger. Drops the user straight
              into the post-roll banner state without waiting for an
              actual roll to land — useful when iterating on banner
              copy, animation, or the navigate-to-elementals handoff.
              The id passed to the banner is whichever unrolled
              attribute the catalog has next; if everything's already
              rolled the banner still fires (the elementals's
              autoOpenArrivalId effect will then no-op gracefully
              since the elemental isn't in pendingArrivals). */}
          {devForceGlimpse && (
            <div style={{
              marginTop: 12,
              padding: 12, borderRadius: 10,
              border: `1px dashed ${theme.rule}`, background: "rgba(181,130,89,0.04)",
            }}>
              <div style={{
                fontFamily: ff.serif, fontStyle: "italic", fontSize: 12, color: theme.ash,
                marginBottom: 10, lineHeight: 1.45,
              }}>
                Force the elemental-glimpse banner to appear so you can
                check copy, animation, and the elementals handoff without
                waiting for an actual roll to land.
              </div>
              <button
                onClick={devForceGlimpse}
                style={{
                  fontFamily: ff.sans, fontSize: 11, letterSpacing: "0.04em",
                  padding: "6px 14px", borderRadius: 999,
                  border: `1px solid ${theme.terra}`,
                  background: "transparent",
                  color: theme.terra, fontWeight: 600,
                  cursor: "pointer",
                }}
              >Force glimpse banner →</button>
            </div>
          )}
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

      {/* Version footer — quiet line at the bottom. Tap five times in
          three seconds to reveal the dev toggle. Once enabled, the
          toggle stays visible (the user clearly wants it). */}
      {devToggleVisible && setDevModeEnabled && (
        <div style={{
          marginTop: 22, padding: "10px 12px", borderRadius: 8,
          border: `1px dashed ${theme.rule}`,
          background: "rgba(181,130,89,0.04)",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          gap: 12,
        }}>
          <div>
            <div style={{
              fontFamily: ff.sans, fontSize: 10, letterSpacing: "0.16em",
              textTransform: "uppercase", color: theme.inkSoft,
            }}>Developer mode</div>
            <div style={{
              fontFamily: ff.serif, fontStyle: "italic", fontSize: 12,
              color: theme.ash, marginTop: 2, lineHeight: 1.4,
            }}>
              Reveals seed-data tools below. Off by default.
            </div>
          </div>
          <button
            onClick={() => setDevModeEnabled(!devModeEnabled)}
            aria-label={devModeEnabled ? "disable developer mode" : "enable developer mode"}
            style={{
              flexShrink: 0,
              width: 36, height: 20, borderRadius: 999,
              border: "none", cursor: "pointer",
              background: devModeEnabled ? theme.terra : theme.rule,
              position: "relative",
            }}
          >
            <span style={{
              position: "absolute", top: 2,
              left: devModeEnabled ? 18 : 2,
              width: 16, height: 16, borderRadius: "50%",
              background: theme.cream,
              transition: "left 0.18s ease",
            }} />
          </button>
        </div>
      )}
      <div
        onClick={tapVersion}
        style={{
          marginTop: 18, paddingBottom: 4,
          fontFamily: ff.sans, fontSize: 10, letterSpacing: "0.14em",
          textTransform: "uppercase",
          color: theme.ash, textAlign: "center",
          cursor: "default", userSelect: "none",
        }}
      >
        Herbanium · v0.1.0
      </div>
    </div>
  );
};

/* ──────────────────────────────────────────────────────────────
   SourcesPanel — categorised list of the literature, monographs,
   pharmacopoeia, and traditional texts the catalog draws from.
   Per-ingredient citations live in docs/research/ingredients/*.md;
   this panel surfaces the high-level inventory so users can see
   where the brewing windows, dosing notes, and effect claims come
   from without dumping a hundred individual papers in the UI.
   ────────────────────────────────────────────────────────────── */

const SOURCES = [
  {
    heading: "Pharmacopoeia & monographs",
    items: [
      {
        summary: "European Medicines Agency — Traditional Herbal Medicinal Products register",
        full: "European Medicines Agency, Committee on Herbal Medicinal Products (HMPC). Community herbal monographs and assessment reports for traditional herbal medicinal products. London / Amsterdam: EMA; 2008–present. Available at ema.europa.eu/en/human-regulatory/herbal-medicinal-products.",
      },
      {
        summary: "European Scientific Cooperative on Phytotherapy (ESCOP) monographs",
        full: "European Scientific Cooperative on Phytotherapy. ESCOP Monographs: The Scientific Foundation for Herbal Medicinal Products. 2nd ed. plus 2009 supplement. Stuttgart: Georg Thieme Verlag; 2003 / 2009. Updated online via escop.com/monographs.",
      },
      {
        summary: "German Commission E monographs (Bundesinstitut für Arzneimittel)",
        full: "Blumenthal M, Goldberg A, Brinckmann J (eds.). Herbal Medicine: Expanded Commission E Monographs. Newton, MA: Integrative Medicine Communications / American Botanical Council; 2000. Translates the Bundesinstitut für Arzneimittel und Medizinprodukte (BfArM) Commission E approvals.",
      },
      {
        summary: "United States Pharmacopeia (USP) — botanical monographs and standardised assays",
        full: "United States Pharmacopeial Convention. USP–NF: Dietary Supplements Compendium and Botanical Monographs (current revision). Rockville, MD: USP. Identity, purity, strength, and assay specifications for botanical articles.",
      },
      {
        summary: "Memorial Sloan Kettering Cancer Center — \"About Herbs\" database",
        full: "Memorial Sloan Kettering Cancer Center, Integrative Medicine Service. About Herbs, Botanicals & Other Products. mskcc.org/cancer-care/integrative-medicine/herbs. Continuously updated, peer-reviewed integrative-medicine database covering mechanism, clinical evidence, interactions, and adverse events.",
      },
    ],
  },
  {
    heading: "Traditional texts",
    items: [
      {
        summary: "Charaka Samhita (~100 BCE – 200 CE) — foundational Ayurvedic compendium",
        full: "Sharma RK, Dash B (trans.). Caraka Saṃhitā: Text with English Translation & Critical Exposition Based on Cakrapāṇi Datta's Āyurveda Dīpikā. 7 vols. Varanasi: Chowkhamba Sanskrit Series; 1976–2002. Original Sanskrit text dated to approximately 100 BCE – 200 CE.",
      },
      {
        summary: "Bhava Prakasha (16th century) — Ayurvedic materia medica",
        full: "Bhāvamiśra. Bhāvaprakāśa Nighaṇṭu (Indian Materia Medica). 16th century CE. Sitaram B (trans.). Varanasi: Chaukhambha Orientalia; 2006.",
      },
      {
        summary: "Shen Nong Ben Cao Jing (~100 BCE) — earliest surviving Chinese herbal pharmacopeia",
        full: "Yang S (trans.). The Divine Farmer's Materia Medica: A Translation of the Shen Nong Ben Cao Jing. Boulder, CO: Blue Poppy Press; 1998. Original Han-dynasty compilation, c. 100 BCE – 200 CE.",
      },
      {
        summary: "Compendium of Materia Medica / Bencao Gangmu (Li Shizhen, 1578)",
        full: "Li Shizhen (李時珍). Bencao Gangmu (本草綱目, Compendium of Materia Medica). 1578. Luo XW (trans.), 6 vols. Beijing: Foreign Languages Press; 2003. ISBN 9787119032603.",
      },
      {
        summary: "Hildegard von Bingen — Physica & Causae et Curae (12th century)",
        full: "Hildegard of Bingen. Physica: The Complete English Translation of Her Classic Work on Health and Healing. Throop P (trans.). Rochester, VT: Healing Arts Press; 1998. Plus: Causae et Curae (Berger MM trans., Cambridge: D.S. Brewer; 1999).",
      },
      {
        summary: "Dioscorides — De Materia Medica (~50–70 CE)",
        full: "Pedanius Dioscorides of Anazarbus. De Materia Medica. Beck LY (trans.). Altertumswissenschaftliche Texte und Studien, vol. 38. Hildesheim: Olms-Weidmann; 2nd ed., 2011. Original Greek work composed c. 50–70 CE.",
      },
    ],
  },
  {
    heading: "Brewing & extraction chemistry",
    items: [
      {
        summary: "Tea catechin and L-theanine extraction kinetics",
        full: "Vuong QV, Bowyer MC, Roach PD. L-Theanine: properties, synthesis and isolation from tea. J Sci Food Agric. 2011;91(11):1931–9. Astill C, Birch MR, Dacombe C, Humphrey PG, Martin PT. Factors affecting the caffeine and polyphenol contents of black and green tea infusions. J Agric Food Chem. 2001;49(11):5340–7.",
      },
      {
        summary: "Chamomile apigenin extraction — first-order release across 57–100 °C",
        full: "Srivastava JK, Shankar E, Gupta S. Chamomile: A herbal medicine of the past with bright future. Mol Med Rep. 2010;3(6):895–901. Mulinacci N, Romani A, Pinelli P, Vincieri FF, Prucher D. Polyphenolic content in five tuscany chamomile products. J Agric Food Chem. 2000;48(5):1973–8.",
      },
      {
        summary: "Hibiscus anthocyanin cold- and hot-brew extraction studies",
        full: "Ramirez-Rodrigues MM, Plaza ML, Azeredo A, Balaban MO, Marshall MR. Physicochemical and phytochemical properties of cold and hot water extraction from Hibiscus sabdariffa. J Food Sci. 2011;76(3):C428–35.",
      },
      {
        summary: "Yerba mate decoction and gourd-temperature studies",
        full: "Heck CI, de Mejia EG. Yerba Mate Tea (Ilex paraguariensis): a comprehensive review on chemistry, health implications, and technological considerations. J Food Sci. 2007;72(9):R138–51. Bracesco N, Sanchez AG, Contreras V, Menini T, Gugliucci A. Recent advances on Ilex paraguariensis research. J Ethnopharmacol. 2011;136(3):378–84.",
      },
      {
        summary: "Curcumin bioavailability and piperine synergy",
        full: "Shoba G, Joy D, Joseph T, Majeed M, Rajendran R, Srinivas PS. Influence of piperine on the pharmacokinetics of curcumin in animals and human volunteers. Planta Med. 1998;64(4):353–6. Anand P, Kunnumakkara AB, Newman RA, Aggarwal BB. Bioavailability of curcumin: problems and promises. Mol Pharm. 2007;4(6):807–18.",
      },
      {
        summary: "Citrus peel volatile-oil chemistry — limonene, linalool, citral, bergapten",
        full: "Navarra M, Mannucci C, Delbò M, Calapai G. Citrus bergamia essential oil: from basic research to clinical application. Front Pharmacol. 2015;6:36. Calvarano I et al. Quality and chemical composition of Calabrian bergamot essential oil. Italian Journal of Food Science. 2007;19(1):75–83. Klimek-Szczykutowicz M et al. Citrus limon (lemon) phenomenon — a review of the chemistry, pharmacological properties, applications. Plants. 2020;9(1):119. Sun J. D-Limonene: safety and clinical applications. Altern Med Rev. 2007;12(3):259–64.",
      },
      {
        summary: "Dried-fruit infusion chemistry — anthocyanins, pectin, organic acids",
        full: "Pappas E, Schaich KM. Phytochemicals of cranberries and cranberry products. Crit Rev Food Sci Nutr. 2009;49(9):741–81. Boyer J, Liu RH. Apple phytochemicals and their health benefits. Nutr J. 2004;3:5. Howell AB. Bioactive compounds in cranberries and their role in prevention of urinary tract infections. Mol Nutr Food Res. 2007;51(6):732–7.",
      },
    ],
  },
  {
    heading: "Clinical evidence base",
    items: [
      {
        summary: "Systematic reviews and randomized controlled trials",
        full: "Representative trials: Amsterdam JD et al. A randomized, double-blind, placebo-controlled trial of oral Matricaria recutita (chamomile) extract for generalized anxiety. J Clin Psychopharmacol. 2009;29(4):378–82. Bent S et al. Valerian for sleep: a systematic review and meta-analysis. Am J Med. 2006;119(12):1005–12. Lopresti AL, Smith SJ, Malvi H, Kodgule R. An investigation into the stress-relieving and pharmacological actions of an ashwagandha (Withania somnifera) extract. Medicine (Baltimore). 2019;98(37):e17186.",
      },
      {
        summary: "Mechanism papers — GABA, NGF, TRPV1, 11β-HSD2",
        full: "Jäger AK, Saaby L. Flavonoids and the central nervous system. Molecules. 2011;16(2):1471–85 (apigenin/GABA). Mori K, Inatomi S, Ouchi K, Azumi Y, Tuchida T. Improving effects of the mushroom Yamabushitake on mild cognitive impairment. Phytother Res. 2009;23(3):367–72 (hericenones/NGF). Bartels EM et al. Efficacy and safety of ginger in osteoarthritis. Osteoarthritis Cartilage. 2015;23(1):13–21 (gingerol/TRPV1). Sigurjónsdóttir HÁ et al. Liquorice-induced rise in blood pressure. J Hum Hypertens. 2003;17(2):125–31 (glycyrrhizin / 11β-HSD2).",
      },
      {
        summary: "Pharmacovigilance and interaction case reports",
        full: "Posadzki P, Watson L, Ernst E. Herb-drug interactions: an overview of systematic reviews. Br J Clin Pharmacol. 2013;75(3):603–18. Targeted: warfarin/vitamin-K (Heck AM et al. Potential interactions between alternative therapies and warfarin. Am J Health Syst Pharm. 2000;57(13):1221–7); cranberry/warfarin (Suvarna R et al. Possible interaction between warfarin and cranberry juice. BMJ. 2003;327(7429):1454); licorice/pseudoaldosteronism (Sigurjónsdóttir 2003, supra); ashwagandha/thyroid (van der Hooft CS et al. Hyperthyroidism associated with the use of an Ayurvedic preparation. Ned Tijdschr Geneeskd. 2005;149(47):2637–8).",
      },
    ],
  },
  {
    heading: "Cultural & culinary references",
    items: [
      {
        summary: "Tea-tradition primary sources",
        full: "Lu Yu (陸羽). Cha Jing (茶經, The Classic of Tea). c. 760 CE. Carpenter F (trans.). New York: Ecco; 1995. Sen Sōshitsu XV. The Japanese Way of Tea: From Its Origins in China to Sen Rikyū. Honolulu: University of Hawai'i Press; 1998. Heiss ML, Heiss RJ. The Tea Enthusiast's Handbook. Berkeley: Ten Speed Press; 2010. Yerba mate primary sources via colonial-era Jesuit missionary records and Folch C. Stimulating consumption: Yerba mate myths, markets, and meanings. Comp Stud Soc Hist. 2010;52(1):6–36.",
      },
      {
        summary: "European folk-herbal lineage",
        full: "Tobyn G, Denham A, Whitelegg M. The Western Herbal Tradition: 2000 Years of Medicinal Plant Knowledge. Edinburgh: Churchill Livingstone Elsevier; 2011. Covers the wise-woman / cunning-folk lineage, monastic gardens, and Provençal regional practice.",
      },
      {
        summary: "South Asian and African household traditions",
        full: "Saberi H. Tea: A Global History. London: Reaktion Books; 2010 (masala chai household practice). Da-Costa-Rocha I, Bonnlaender B, Sievers H, Pischel I, Heinrich M. Hibiscus sabdariffa L. – a phytochemical and pharmacological review. Food Chem. 2014;165:424–43 (karkadé / bissap traditions).",
      },
      {
        summary: "Indigenous American plant medicine",
        full: "Moerman DE. Native American Ethnobotany. Portland, OR: Timber Press; 1998. Foster S, Duke JA. A Field Guide to Medicinal Plants and Herbs of Eastern and Central North America. 3rd ed., Boston: Houghton Mifflin Harcourt; 2014. Andean / South American uses via Bussmann RW, Sharon D. Traditional medicinal plant use in northern Peru: tracking two thousand years of healing culture. J Ethnobiol Ethnomed. 2006;2:47.",
      },
    ],
  },
];

const SourcesPanel = () => {
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState(() => new Set());
  const toggle = (key) => setExpanded(prev => {
    const next = new Set(prev);
    if (next.has(key)) next.delete(key); else next.add(key);
    return next;
  });
  return (
    <div style={{
      padding: 14, borderRadius: 10,
      border: `1px solid ${theme.ruleSoft}`, background: theme.cream,
    }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: "100%", textAlign: "left",
          background: "transparent", border: "none",
          padding: "2px 0", cursor: "pointer",
          display: "flex", justifyContent: "space-between", alignItems: "center",
          fontFamily: ff.serif, fontSize: 14, color: theme.ink,
        }}
      >
        <span style={{ fontStyle: "italic", color: theme.inkSoft }}>
          Where the catalog's claims come from
        </span>
        <span style={{
          fontFamily: ff.sans, fontSize: 9, letterSpacing: "0.18em",
          textTransform: "uppercase", color: theme.terra,
        }}>{open ? "hide" : "show"}</span>
      </button>

      {open && (
        <div style={{ marginTop: 12 }}>
          <div style={{
            fontFamily: ff.serif, fontStyle: "italic", fontSize: 12.5,
            color: theme.ash, lineHeight: 1.5, marginBottom: 14,
          }}>
            Brewing windows, doses, safety flags, and effect claims are drawn
            from peer-reviewed literature, classical pharmacopoeia, and
            living tradition. Per-ingredient citations live in the project's
            research files.
          </div>
          {SOURCES.map(group => (
            <div key={group.heading} style={{ marginBottom: 14, textAlign: "left" }}>
              <div style={{
                fontFamily: ff.sans, fontSize: 10, letterSpacing: "0.18em",
                textTransform: "uppercase", color: theme.sageDeep,
                marginBottom: 6, textAlign: "left",
              }}>{group.heading}</div>
              <ul style={{
                listStyle: "none", padding: 0, margin: 0,
              }}>
                {group.items.map((item, i) => {
                  const key = `${group.heading}::${i}`;
                  const isOpen = expanded.has(key);
                  return (
                    <li
                      key={key}
                      style={{
                        borderBottom: `1px solid ${theme.ruleSoft}`,
                        textAlign: "left",
                      }}
                    >
                      <button
                        onClick={() => toggle(key)}
                        aria-expanded={isOpen}
                        style={{
                          width: "100%", textAlign: "left",
                          background: "transparent", border: "none",
                          padding: "8px 0", cursor: "pointer",
                          display: "flex", alignItems: "flex-start",
                          gap: 8,
                          fontFamily: ff.serif, fontSize: 13,
                          color: theme.inkSoft, lineHeight: 1.5,
                        }}
                      >
                        <span style={{
                          flexShrink: 0, marginTop: 1,
                          fontFamily: ff.sans, fontSize: 11, color: theme.terra,
                          width: 10, textAlign: "left",
                          transform: isOpen ? "rotate(90deg)" : "rotate(0deg)",
                          transition: "transform 0.15s ease",
                        }}>›</span>
                        <span style={{ flex: 1, textAlign: "left" }}>{item.summary}</span>
                      </button>
                      {isOpen && (
                        <div style={{
                          padding: "4px 0 12px 18px",
                          fontFamily: ff.serif, fontSize: 12.5,
                          color: theme.ash, lineHeight: 1.55,
                          textAlign: "left",
                        }}>
                          {item.full}
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
          <div style={{
            fontFamily: ff.serif, fontStyle: "italic", fontSize: 11.5,
            color: theme.ash, lineHeight: 1.5, marginTop: 10,
          }}>
            Herbanium is a brewing companion, not medical advice. For
            anything safety-relevant, verify with a clinician.
          </div>
        </div>
      )}
    </div>
  );
};
