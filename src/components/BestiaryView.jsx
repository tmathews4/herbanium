/* ──────────────────────────────────────────────────────────────
   components/BestiaryView.jsx — the Elemental Bestiary.

   A user-curated record of every elemental observed during their
   time with the kettle. Lives inside the Shelf as a sub-tab,
   alongside Journal / Recipe Book / Pantry. Tapping the Summon
   button cycles the queue: first ever click reveals the user's
   unique creation elemental via the OmenCard; subsequent clicks
   pop the ElementalArrivalCard for the next earned-but-unobserved
   one. Each one only sketches into the bestiary after its arrival
   card fades through.

   This component owns the bestiary data layer: it evaluates the
   attribute context, names + decorates each elemental, runs the
   summon flow, and renders the AttributeShelf detail. The host
   screen only has to wire the persisted props through.
   ────────────────────────────────────────────────────────────── */

import React, { useState } from "react";
import { ff, theme } from "../theme";
import { SectionLabel } from "./layout";
import { OmenCard } from "./OmenCard";
import { ElementalArrivalCard } from "./ElementalArrivalCard";
import { buildAttributeContext, evaluateAttributes } from "../data/attributes";
import {
  getElementalDisplayName, getElementalDisplayDesc,
  pickRandomCreature, flavorLineFor,
} from "../data/elementalAdjectives";
import { generateCreationTitle, describeCreationTitle } from "../data/creationTitle";

const FEATURED_LIMIT = 5;

const RARITY_TONE = {
  common:    { color: theme.ash,      label: "common",    bg: "rgba(140,140,140,0.05)" },
  uncommon:  { color: theme.sageDeep, label: "uncommon",  bg: "rgba(98,124,92,0.07)" },
  rare:      { color: theme.ochre,    label: "rare",      bg: "rgba(165,120,54,0.10)" },
  legendary: { color: theme.terra,    label: "legendary", bg: "rgba(176,84,47,0.10)" },
  mythic:    { color: theme.plum,     label: "mythic",    bg: "rgba(120,72,140,0.12)" },
};

export const BestiaryView = ({
  profile,
  sessions = [],
  savedBlendIds,
  pantryIds,
  journalEntries = [],
  tabVisits,
  elementalsDisabled = false,
  omenShown,
  dismissOmen,
  seenElementalIds,
  setSeenElementalIds,
  featuredElementals,
  setFeaturedElementals,
}) => {
  const cupCount = (sessions || []).filter(s => s.who === "you").length;

  const attrCtx = buildAttributeContext({
    sessions, savedBlendIds, pantryIds, profile, journalEntries, tabVisits,
  });
  const attrEvaluation = evaluateAttributes(attrCtx);
  const elementalSeed = profile?.createdAt || profile?.name || "anon";

  const earnedAttrs = attrEvaluation.filter(a => a.earned).map(a => {
    const creature = a.random ? pickRandomCreature(a, elementalSeed) : undefined;
    const merged = creature ? { ...a, creature } : { ...a };
    return {
      ...merged,
      displayName: getElementalDisplayName(merged, elementalSeed),
      desc: getElementalDisplayDesc(merged, elementalSeed),
    };
  });
  const rarityOrder = { mythic: 5, legendary: 4, rare: 3, uncommon: 2, common: 1 };
  const sortedEarned = [...earnedAttrs].sort((a, b) =>
    (rarityOrder[b.rarity] || 0) - (rarityOrder[a.rarity] || 0)
  );

  const seenIds = seenElementalIds || new Set();
  const pendingArrivals = !elementalsDisabled
    ? sortedEarned.filter(a => !seenIds.has(a.id))
    : [];
  const pendingIds = new Set(pendingArrivals.map(a => a.id));
  const revealedSorted = sortedEarned.filter(a => !pendingIds.has(a.id));

  const markElementalSeen = (id) => {
    if (!setSeenElementalIds) return;
    setSeenElementalIds(prev => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });
  };

  // Summon flow.
  const [summonTarget, setSummonTarget] = useState(null);
  const summonExhausted = !elementalsDisabled && omenShown && pendingArrivals.length === 0;
  const summonReady     = !elementalsDisabled && (!omenShown || pendingArrivals.length > 0);
  const onSummonClick = () => {
    if (!summonReady || summonTarget) return;
    if (!omenShown) {
      setSummonTarget({ kind: "omen" });
      return;
    }
    const next = pendingArrivals[0];
    if (next) setSummonTarget({ kind: "arrival", elemental: next });
  };
  const onOmenDismiss = () => {
    if (dismissOmen) dismissOmen();
    setSummonTarget(null);
  };
  const onArrivalDismiss = (id) => {
    markElementalSeen(id);
    setSummonTarget(null);
  };

  // Creation card — unique elemental, decorated with element + gem
  // flavor lines + creature lore so it reads as dynamic as the rest.
  const creationTitleName = profile ? (profile.title || generateCreationTitle(profile)) : null;
  const creatureDesc = describeCreationTitle(creationTitleName);
  const titleParts = (creationTitleName || "").replace(/^The\s+/i, "").split(/\s+/);
  const uniquePieces = [];
  if (titleParts.length >= 3) {
    if (titleParts[0]) uniquePieces.push(flavorLineFor(titleParts[0]));
    if (titleParts[1]) uniquePieces.push(flavorLineFor(titleParts[1]));
  }
  if (creatureDesc) uniquePieces.push(creatureDesc);
  const creationCard = creationTitleName ? {
    id: "_creation",
    name: creationTitleName,
    displayName: creationTitleName,
    rarity: "legendary",
    desc: uniquePieces.join(" "),
  } : null;
  const allCards = creationCard ? [creationCard, ...revealedSorted] : revealedSorted;
  const [openAttrId, setOpenAttrId] = useState(null);
  const openAttr = openAttrId ? allCards.find(a => a.id === openAttrId) : null;

  // Featured slots — stored as a list of ids; falls back to top-by-rarity.
  const validFeatured = (featuredElementals || []).filter(id =>
    revealedSorted.find(a => a.id === id));
  const effectiveFeaturedIds = validFeatured.length > 0
    ? validFeatured.slice(0, FEATURED_LIMIT)
    : revealedSorted.slice(0, FEATURED_LIMIT).map(a => a.id);
  const featured = effectiveFeaturedIds
    .map(id => revealedSorted.find(a => a.id === id))
    .filter(Boolean);
  const reserve = revealedSorted.filter(a => !effectiveFeaturedIds.includes(a.id));
  const isFeatured = (id) => effectiveFeaturedIds.includes(id);
  const toggleFeatured = (id) => {
    if (!setFeaturedElementals) return;
    const cur = effectiveFeaturedIds.slice();
    if (cur.includes(id)) {
      setFeaturedElementals(cur.filter(x => x !== id));
      return;
    }
    if (cur.length >= FEATURED_LIMIT) {
      setFeaturedElementals([...cur.slice(0, FEATURED_LIMIT - 1), id]);
      return;
    }
    setFeaturedElementals([...cur, id]);
  };

  if (elementalsDisabled) {
    return (
      <div style={{
        marginTop: 4, padding: 14, borderRadius: 10,
        border: `1px solid ${theme.ruleSoft}`, background: theme.cream,
        fontFamily: ff.serif, fontStyle: "italic", fontSize: 13,
        color: theme.ash, lineHeight: 1.55, textAlign: "center",
      }}>
        Elementals are turned off in your preferences. Enable them in
        Profile to start a bestiary.
      </div>
    );
  }

  return (
    <div style={{ marginTop: 4 }}>
      {summonTarget?.kind === "omen" && profile?.title && (
        <OmenCard title={profile.title} onDismiss={onOmenDismiss} />
      )}
      {summonTarget?.kind === "arrival" && summonTarget.elemental && (
        <ElementalArrivalCard
          elemental={summonTarget.elemental}
          onDismiss={() => onArrivalDismiss(summonTarget.elemental.id)}
        />
      )}

      <div style={{
        display: "flex", alignItems: "baseline", justifyContent: "space-between",
        gap: 10, marginBottom: 6,
      }}>
        <SectionLabel n="i">Elemental Bestiary</SectionLabel>
        <button
          onClick={onSummonClick}
          disabled={!summonReady || !!summonTarget}
          style={{
            fontFamily: ff.sans, fontSize: 10.5, letterSpacing: "0.16em",
            textTransform: "uppercase",
            color: summonExhausted ? theme.ash : theme.cream,
            background: summonExhausted ? "transparent" : theme.terra,
            border: `1px solid ${summonExhausted ? theme.rule : theme.terra}`,
            borderRadius: 999, padding: "6px 12px",
            cursor: summonExhausted ? "default" : "pointer",
            opacity: summonExhausted ? 0.55 : 1,
            transition: "all 0.18s ease",
          }}
        >
          {summonExhausted ? "no elemental waiting"
            : !omenShown ? "summon your first"
            : pendingArrivals.length > 1 ? `summon (${pendingArrivals.length} waiting)`
            : "summon elemental"}
        </button>
      </div>
      <div style={{
        fontFamily: ff.serif, fontStyle: "italic", fontSize: 12,
        color: theme.ash, lineHeight: 1.45, marginBottom: 12,
      }}>
        Your field notebook of elementals — engage with the kettle in
        different ways and earn one to sketch into the page. Tap{" "}
        <em style={{ color: theme.terra, fontStyle: "normal" }}>Summon</em>{" "}
        to observe the next one waiting and add it to the bestiary.
      </div>

      {omenShown && (
        <div style={{
          padding: 14, borderRadius: 10,
          border: `1px solid ${theme.ruleSoft}`, background: theme.cream,
        }}>
          {cupCount >= 3 && (
            <div style={{
              fontFamily: ff.serif, fontStyle: "italic", fontSize: 14,
              color: theme.ash, lineHeight: 1.55,
              marginBottom: earnedAttrs.length > 0 ? 14 : 0,
            }}>
              Practice your brew craft to attract more elementals.
            </div>
          )}
          {cupCount > 0 && cupCount < 3 && (
            <div style={{
              fontFamily: ff.serif, fontStyle: "italic", fontSize: 14,
              color: theme.ash, lineHeight: 1.55,
              marginBottom: earnedAttrs.length > 0 ? 14 : 0,
            }}>
              Different vibes attract different elementals.
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
            <div style={{
              fontFamily: ff.serif, fontStyle: "italic", fontSize: 14,
              color: theme.ash, lineHeight: 1.55,
            }}>
              Different vibes attract different elementals.
            </div>
          )}
        </div>
      )}
    </div>
  );
};

/* ──────────────────────────────────────────────────────────────
   AttributeShelf — earned-only name cards, border colored by
   rarity. Tap any card to expand its description. Used inside
   the bestiary to render the unique + featured + reserve rows.
   ────────────────────────────────────────────────────────────── */

const AttributeShelf = ({
  creationCard, featured, reserve, featuredLimit,
  isFeatured, toggleFeatured,
  openId, setOpenId, openAttr,
}) => {
  const [expanded, setExpanded] = useState(false);
  const [selecting, setSelecting] = useState(false);

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
  const openInReserve = openAttr && reserve.find(a => a.id === openAttr.id);
  const reserveOpen = expanded || !!openInReserve || selecting;

  return (
    <>
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
            <div style={{
              display: "flex", alignItems: "baseline", gap: 8,
              marginBottom: 4, flexWrap: "wrap", marginRight: 18,
            }}>
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
                    ? "remove from bestiary front-page"
                    : featuredFull ? "swap onto front-page" : "pin to front-page"}
                </button>
              </div>
            )}
          </div>
        );
      })()}

      {creationCard && (
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 12 }}>
          {renderTile(creationCard)}
        </div>
      )}

      <div style={{
        display: "flex", flexWrap: "wrap", gap: 6, justifyContent: "center",
      }}>
        {Array.from({ length: featuredLimit }).map((_, i) =>
          featured[i] ? renderTile(featured[i]) : emptySlot(i))}
      </div>

      {selecting && (
        <div style={{
          marginTop: 10, padding: "6px 10px", borderRadius: 6,
          background: "rgba(176,84,47,0.08)",
          border: `1px solid rgba(176,84,47,0.22)`,
          fontFamily: ff.serif, fontStyle: "italic", fontSize: 12.5,
          color: theme.inkSoft, lineHeight: 1.45, textAlign: "center",
        }}>
          Pick an elemental from the reserve to pin to the front-page.
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
