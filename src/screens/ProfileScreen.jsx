/* ──────────────────────────────────────────────────────────────
   screens/ProfileScreen.jsx — user profile: stats, badges, preferences, dev toolbar.
   ────────────────────────────────────────────────────────────── */

import React, { useState, useRef } from "react";
import { Flower, Ornament, Pencil, ATTRIBUTE_GLYPHS } from "../components/icons";
import {
  SectionLabel, Stat,
} from "../components/layout";
import { MOODS } from "../data/blends";
import { SEED_MODES } from "../data/seeds";
import { buildAttributeContext, evaluateAttributes, getUserPrefix, applyPrefix, isColorable } from "../data/attributes";
import { generateCreationTitle, describeCreationTitle } from "../data/creationTitle";
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

export const ProfileScreen = ({ go, sessions, savedBlendIds, pantryIds, seedMode, setSeedMode, profile, setProfile, resetEverything, isDev, featuredAnimis, setFeaturedAnimis, animisBanished, setAnimisBanished }) => {
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
    // Stamp the profile so the Caladrius animi unlocks.
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
        // Stamp the imported profile so the Bennu animi unlocks. Import
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
  const creatureDesc = describeCreationTitle(creationTitleName);
  const creationCard = creationTitleName ? {
    id: "_creation",
    name: creationTitleName,
    displayName: creationTitleName,
    rarity: "legendary",
    desc: (creatureDesc ? creatureDesc + " " : "") +
      "Granted at your kettle's first lighting — drawn from the hour you arrived, the flavors you reached for, and the moods you carried in. Nobody else holds this exact one.",
  } : null;
  const allCards = creationCard ? [creationCard, ...sortedEarned] : sortedEarned;
  const [openAttrId, setOpenAttrId] = useState(null);
  const openAttr = openAttrId ? allCards.find(a => a.id === openAttrId) : null;

  // Featured altar slots — up to 5 ids the user surfaces below their
  // unique spirit. Falls back to top-5-by-rarity until the user picks.
  const FEATURED_LIMIT = 5;
  const validFeatured = (featuredAnimis || []).filter(id =>
    sortedEarned.find(a => a.id === id));
  const effectiveFeaturedIds = validFeatured.length > 0
    ? validFeatured.slice(0, FEATURED_LIMIT)
    : sortedEarned.slice(0, FEATURED_LIMIT).map(a => a.id);
  const featured = effectiveFeaturedIds
    .map(id => sortedEarned.find(a => a.id === id))
    .filter(Boolean);
  const reserve = sortedEarned.filter(a => !effectiveFeaturedIds.includes(a.id));
  const isFeatured = (id) => effectiveFeaturedIds.includes(id);
  const toggleFeatured = (id) => {
    if (!setFeaturedAnimis) return;
    const cur = effectiveFeaturedIds.slice();
    if (cur.includes(id)) {
      setFeaturedAnimis(cur.filter(x => x !== id));
      return;
    }
    if (cur.length >= FEATURED_LIMIT) {
      // Replace the last (lowest-priority) slot so the swap is one tap.
      setFeaturedAnimis([...cur.slice(0, FEATURED_LIMIT - 1), id]);
      return;
    }
    setFeaturedAnimis([...cur, id]);
  };

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
          <Stat label="Cups"      value={cupCount}    onClick={() => go("compose", { mode: "apothecary", shelfTab: "journal" })} />
          <Stat label="Blends"    value={blendCount}  onClick={() => go("compose", { mode: "apothecary", shelfTab: "catalogue" })} />
          <Stat label="Pantry"    value={shelfCount}  onClick={() => go("library", { pantryOnly: true })} />
          {!animisBanished && (
            <Stat label="Animis"  value={earnedAttrs.length + (profile?.title || generateCreationTitle(profile) ? 1 : 0)} />
          )}
        </div>
      </div>

      {/* self-knowledge — hidden entirely when the user has banished
          the spirits via Preferences below. */}
      {!animisBanished && (<>
      <div style={{ margin: "24px 0 12px" }}><SectionLabel n="i">Animis Altar</SectionLabel></div>
      <div style={{
        padding: 14, borderRadius: 10,
        border: `1px solid ${theme.ruleSoft}`, background: theme.cream,
      }}>
        {cupCount >= 3 && (
          <div style={{ fontFamily: ff.serif, fontStyle: "italic", fontSize: 14, color: theme.ash, lineHeight: 1.55, marginBottom: earnedAttrs.length > 0 ? 14 : 0 }}>
            Practice your brew craft to attract spirits.
          </div>
        )}
        {cupCount > 0 && cupCount < 3 && (
          <div style={{ fontFamily: ff.serif, fontStyle: "italic", fontSize: 14, color: theme.ash, lineHeight: 1.55, marginBottom: earnedAttrs.length > 0 ? 14 : 0 }}>
            Different vibes attract different animis.
          </div>
        )}
        {creationCard && (
          <AttributeShelf
            creationCard={creationCard}
            featured={featured}
            reserve={reserve}
            featuredLimit={FEATURED_LIMIT}
            isFeatured={isFeatured}
            toggleFeatured={toggleFeatured}
            openId={openAttrId}
            setOpenId={setOpenAttrId}
            openAttr={openAttr}
          />
        )}
        {!creationCard && cupCount === 0 && (
          <div style={{ fontFamily: ff.serif, fontStyle: "italic", fontSize: 14, color: theme.ash, lineHeight: 1.55 }}>
            Different vibes attract different animis.
          </div>
        )}
      </div>
      </>)}

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

        {/* Banish the spirits — hides every animis surface for users
            who'd rather not engage with the mythic layer. */}
        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
          padding: "10px 0", borderTop: `1px solid ${theme.ruleSoft}`,
          fontFamily: ff.sans, fontSize: 13, color: theme.inkSoft,
        }}>
          <span>Banish the spirits</span>
          <span
            onClick={() => setAnimisBanished && setAnimisBanished(!animisBanished)}
            style={{
              width: 34, height: 20, borderRadius: 999,
              background: animisBanished ? theme.terra : theme.rule,
              position: "relative", cursor: "pointer",
              transition: "background .2s",
            }}
          >
            <span style={{
              position: "absolute", top: 2, left: animisBanished ? 16 : 2,
              width: 16, height: 16, borderRadius: "50%", background: theme.cream,
              transition: "left .2s",
            }} />
          </span>
        </div>
        <div style={{
          fontFamily: ff.serif, fontStyle: "italic", fontSize: 11.5,
          color: theme.ash, lineHeight: 1.5, padding: "0 0 6px",
        }}>
          Hides the animi omen, the altar, and the animis stat. The cup
          stays. You can restore them any time.
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
      "European Medicines Agency — Traditional Herbal Medicinal Products register",
      "European Scientific Cooperative on Phytotherapy (ESCOP) monographs",
      "German Commission E monographs (Bundesinstitut für Arzneimittel)",
      "United States Pharmacopoeia (USP) — botanical monographs and standardised assays",
      "Memorial Sloan Kettering Cancer Center — \"About Herbs\" integrative-medicine database",
    ],
  },
  {
    heading: "Traditional texts",
    items: [
      "Charaka Samhita (~100 BCE – 200 CE) — foundational Ayurvedic compendium",
      "Bhava Prakasha (16th century) — Ayurvedic materia medica",
      "Shen Nong Ben Cao Jing (~100 BCE) — earliest surviving Chinese herbal pharmacopeia",
      "Compendium of Materia Medica / Bencao Gangmu (Li Shizhen, 1578)",
      "Hildegard von Bingen — Physica & Causae et Curae (12th century)",
      "Dioscorides — De Materia Medica (~50–70 CE)",
    ],
  },
  {
    heading: "Brewing & extraction chemistry",
    items: [
      "Tea catechin and L-theanine extraction kinetics (peer-reviewed food-chemistry literature)",
      "Chamomile apigenin extraction kinetics — first-order release across 57–100 °C",
      "Hibiscus anthocyanin cold- and hot-brew comparative extraction studies",
      "Yerba mate decoction and gourd-temperature studies",
      "Curcumin bioavailability and piperine synergy literature",
    ],
  },
  {
    heading: "Clinical evidence base",
    items: [
      "Systematic reviews and randomized controlled trials for chamomile, valerian, ashwagandha, ginger, hibiscus, peppermint, lion's mane, reishi, and others",
      "Mechanism papers — apigenin / GABA, valerenic acid, withanolides, glycyrrhizin / 11β-HSD2, hericenones / NGF, gingerol / TRPV1",
      "Pharmacovigilance and interaction case reports (warfarin / vitamin K, licorice / pseudoaldosteronism, ashwagandha / thyroid medication, etc.)",
    ],
  },
  {
    heading: "Cultural & culinary references",
    items: [
      "Tea-tradition primary sources: Japanese chajin manuals, Chinese gongfu cha texts, North African mint-tea ritual, Argentine yerba mate cebada practice",
      "European folk-herbal lineage — wise-woman infusion traditions, Provençal lavender & herbal practice",
      "South Asian masala chai household preparation; Egyptian and West African karkadé / bissap traditions",
      "Indigenous American plant medicine — Lakota, Cheyenne, Cherokee, and Andean uses, where the relevant ingredient draws on those lineages",
    ],
  },
];

const SourcesPanel = () => {
  const [open, setOpen] = useState(false);
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
            <div key={group.heading} style={{ marginBottom: 14 }}>
              <div style={{
                fontFamily: ff.sans, fontSize: 10, letterSpacing: "0.18em",
                textTransform: "uppercase", color: theme.sageDeep,
                marginBottom: 6,
              }}>{group.heading}</div>
              <ul style={{
                listStyle: "none", padding: 0, margin: 0,
              }}>
                {group.items.map(item => (
                  <li
                    key={item}
                    style={{
                      fontFamily: ff.serif, fontSize: 13, color: theme.inkSoft,
                      lineHeight: 1.5, padding: "4px 0",
                      borderBottom: `1px solid ${theme.ruleSoft}`,
                    }}
                  >{item}</li>
                ))}
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

// AttributeShelf altar:
//   row 1 — the unique creation animi, alone and centered
//   row 2 — up to 5 "featured" earned animis, with empty pip-slots for
//           the rest of the row when the user has fewer
//   below — collapsible reserve grid containing every other earned
//           animi, with a feature/unfeature button on each detail card
//
// Slot-pick interaction: tap an empty pip to enter "selecting" mode;
// the reserve auto-opens and prompts a pick. The next reserve tile
// tapped fills the next available slot. Tap the empty pip again or
// the prompt's cancel to leave selecting mode.
const AttributeShelf = ({
  creationCard, featured, reserve, featuredLimit,
  isFeatured, toggleFeatured,
  openId, setOpenId, openAttr,
}) => {
  const [expanded, setExpanded] = useState(false);
  const [selecting, setSelecting] = useState(false);

  // Selecting mode only makes sense when there's an empty slot to fill.
  // If the user fills the last slot or removes a featured one, reset.
  const hasEmptySlot = featured.length < featuredLimit;
  React.useEffect(() => {
    if (selecting && !hasEmptySlot) setSelecting(false);
  }, [selecting, hasEmptySlot]);

  const renderTile = (a) => {
    const tone = RARITY_TONE[a.rarity] || RARITY_TONE.common;
    const isOpen = openId === a.id;
    const inReserve = reserve.find(x => x.id === a.id);
    const handleClick = () => {
      if (selecting && inReserve && toggleFeatured) {
        // Fill the next empty slot with this animi.
        toggleFeatured(a.id);
        setSelecting(false);
        return;
      }
      setOpenId(prev => prev === a.id ? null : a.id);
    };
    return (
      <button
        key={a.id}
        onClick={handleClick}
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
  };

  const emptySlot = (i) => {
    const onClick = () => {
      if (!toggleFeatured) return;
      setSelecting(prev => !prev);
    };
    const active = selecting;
    return (
      <button
        key={`empty-${i}`}
        onClick={onClick}
        style={{
          padding: "6px 14px", borderRadius: 6,
          border: active
            ? `2px dashed ${theme.terra}`
            : `2px dashed ${theme.ruleSoft}`,
          color: active ? theme.terra : theme.ash,
          background: "transparent",
          fontFamily: ff.serif, fontSize: 12,
          fontStyle: "italic",
          cursor: "pointer",
          opacity: active ? 1 : 0.7,
        }}
      >{active ? "pick…" : "empty"}</button>
    );
  };

  const isCreationOpen = openAttr && openAttr.id === "_creation";
  const canToggleOpen = openAttr && !isCreationOpen && toggleFeatured;
  const openIsFeatured = openAttr && isFeatured && isFeatured(openAttr.id);
  const featuredFull = featured.length >= featuredLimit;

  // Auto-expand reserve when the user opens an animi that lives there
  // so the highlighted tile is visible alongside its detail card,
  // and whenever they're in slot-pick mode so the reserve is on screen.
  const openInReserve = openAttr && reserve.find(a => a.id === openAttr.id);
  const reserveOpen = expanded || !!openInReserve || selecting;

  return (
    <>
      {/* Detail card — sits above the rest when one is open */}
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
            {canToggleOpen && (
              <div style={{ marginTop: 10, display: "flex", justifyContent: "flex-end" }}>
                <button
                  onClick={() => toggleFeatured(openAttr.id)}
                  style={{
                    fontFamily: ff.sans, fontSize: 11, color: theme.terra,
                    background: "transparent",
                    border: `1px solid ${theme.terra}`, borderRadius: 999,
                    padding: "5px 12px", cursor: "pointer",
                  }}
                >
                  {openIsFeatured
                    ? "remove from altar"
                    : featuredFull ? "swap onto altar" : "place on altar"}
                </button>
              </div>
            )}
          </div>
        );
      })()}

      {/* Row 1 — the unique creation animi, alone and centered */}
      {creationCard && (
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 12 }}>
          {renderTile(creationCard)}
        </div>
      )}

      {/* Row 2 — up to five featured slots */}
      <div style={{
        display: "flex", flexWrap: "wrap", gap: 6,
        justifyContent: "center",
      }}>
        {Array.from({ length: featuredLimit }).map((_, i) =>
          featured[i] ? renderTile(featured[i]) : emptySlot(i))}
      </div>

      {/* Slot-pick prompt — appears under the row while selecting */}
      {selecting && (
        <div style={{
          marginTop: 10, padding: "6px 10px", borderRadius: 6,
          background: "rgba(176,84,47,0.08)",
          border: `1px solid rgba(176,84,47,0.22)`,
          fontFamily: ff.serif, fontStyle: "italic", fontSize: 12.5,
          color: theme.inkSoft, lineHeight: 1.45, textAlign: "center",
        }}>
          Pick an animi from the reserve to place it on the altar.
          {" "}
          <button
            onClick={() => setSelecting(false)}
            style={{
              background: "transparent", border: "none", padding: 0,
              fontFamily: "inherit", fontSize: "inherit", fontStyle: "normal",
              color: theme.terra, textDecoration: "underline",
              textDecorationStyle: "dotted", textUnderlineOffset: 3,
              cursor: "pointer",
            }}
          >cancel</button>
        </div>
      )}

      {reserve.length > 0 && (
        <div style={{ marginTop: 10, display: "flex", justifyContent: "center" }}>
          <button
            onClick={() => setExpanded(prev => !prev)}
            style={{
              fontFamily: ff.sans, fontSize: 11, letterSpacing: "0.14em",
              textTransform: "uppercase", color: theme.terra,
              background: "transparent", border: "none",
              cursor: "pointer", padding: "4px 8px",
            }}
          >
            {reserveOpen
              ? "hide reserve"
              : `show reserve · ${reserve.length}`}
          </button>
        </div>
      )}

      {reserveOpen && reserve.length > 0 && (
        <div style={{
          marginTop: 6, paddingTop: 10,
          borderTop: `1px solid ${theme.ruleSoft}`,
          display: "flex", flexWrap: "wrap", gap: 6,
        }}>
          {reserve.map(renderTile)}
        </div>
      )}
    </>
  );
};
