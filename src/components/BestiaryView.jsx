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
import { HintCard } from "./HintCard";
import { Sprig } from "./icons";
import { buildAttributeContext, evaluateAttributes } from "../data/attributes";
import {
  buildElementalNaming, flavorLineFor,
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
  bestiaryHintShown,
  dismissBestiaryHint,
}) => {
  const cupCount = (sessions || []).filter(s => s.who === "you").length;

  const attrCtx = buildAttributeContext({
    sessions, savedBlendIds, pantryIds, profile, journalEntries, tabVisits,
  });
  const attrEvaluation = evaluateAttributes(attrCtx);
  const elementalSeed = profile?.createdAt || profile?.name || "anon";

  // Per-user naming map: minimizes adjective/creature duplicates by
  // giving each user a permutation of the pools and assigning by
  // stable order, instead of independent per-attr hashing.
  const earned = attrEvaluation.filter(a => a.earned);
  const naming = buildElementalNaming(earned, elementalSeed);
  const earnedAttrs = earned.map(a => {
    const n = naming.get(a.id) || {};
    const adj = n.adjective || "";
    const creature = n.creature || "Spirit";
    const flavor = flavorLineFor(adj);
    const baseDesc = (a.desc || "").trim();
    return {
      ...a,
      creature,
      displayName: `The ${adj} ${creature}`,
      desc: baseDesc ? `${flavor} ${baseDesc}` : flavor,
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
  // In-place swap: replace `oldId` (currently featured) with
  // `newId` (from reserve), preserving the slot position so the
  // user's row order isn't disturbed.
  const swapFeatured = (oldId, newId) => {
    if (!setFeaturedElementals) return;
    const cur = effectiveFeaturedIds.slice();
    const idx = cur.indexOf(oldId);
    if (idx < 0) {
      toggleFeatured(newId);
      return;
    }
    cur[idx] = newId;
    setFeaturedElementals(cur);
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
      {!bestiaryHintShown && dismissBestiaryHint && (
        <HintCard
          icon={<Sprig size={18} c={theme.sageDeep} />}
          title="Bestiary"
          body={<>
            A side game tucked into the kettle — engage with the app
            in different ways and{" "}
            <strong style={{ color: theme.terra }}>Log</strong>{" "}
            specimens to fill the page. Pin five up top, swap any
            in by tapping it then a reserve.
          </>}
          onDismiss={dismissBestiaryHint}
        />
      )}

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
          {summonExhausted ? "no specimen waiting"
            : !omenShown ? "log your first"
            : pendingArrivals.length > 1 ? `log (${pendingArrivals.length} waiting)`
            : "log elemental"}
        </button>
      </div>
      <div style={{
        fontFamily: ff.serif, fontStyle: "italic", fontSize: 12,
        color: theme.ash, lineHeight: 1.45, marginBottom: 12,
      }}>
        Your field notebook of elementals — engage with the kettle in
        different ways and earn a specimen to log. Tap{" "}
        <em style={{ color: theme.terra, fontStyle: "normal" }}>Log</em>{" "}
        to observe the next one waiting and enter it into the bestiary.
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
              swapFeatured={swapFeatured}
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
  isFeatured, toggleFeatured, swapFeatured,
  openId, setOpenId, openAttr,
}) => {
  const [expanded, setExpanded] = useState(false);
  const [selecting, setSelecting] = useState(false);
  // Reserve sort mode — defaults to rarity (high → low), the same
  // ordering that drives the parent's revealedSorted list. Local to
  // the shelf so it doesn't leak into pending-arrival ordering.
  const [reserveSort, setReserveSort] = useState("rarity");
  const RARITY_RANK = { mythic: 5, legendary: 4, rare: 3, uncommon: 2, common: 1 };
  const sortedReserve = (() => {
    const xs = [...reserve];
    const nameOf = (a) => (a.displayName || a.name || "").toLowerCase();
    if (reserveSort === "name-asc")  return xs.sort((a, b) => nameOf(a).localeCompare(nameOf(b)));
    if (reserveSort === "name-desc") return xs.sort((a, b) => nameOf(b).localeCompare(nameOf(a)));
    if (reserveSort === "creature") {
      return xs.sort((a, b) => {
        const ca = (a.creature || "").toLowerCase();
        const cb = (b.creature || "").toLowerCase();
        if (ca !== cb) return ca.localeCompare(cb);
        return nameOf(a).localeCompare(nameOf(b));
      });
    }
    // rarity
    return xs.sort((a, b) =>
      (RARITY_RANK[b.rarity] || 0) - (RARITY_RANK[a.rarity] || 0)
    );
  })();
  // swappingId: id of a currently-featured elemental the user has
  // tapped to mark as the swap target. Tapping the same one again
  // cancels; tapping a reserve tile swaps in place.
  const [swappingId, setSwappingId] = useState(null);
  const swappingAttr = swappingId
    ? featured.find(a => a.id === swappingId)
    : null;

  const hasEmptySlot = featured.length < featuredLimit;
  React.useEffect(() => {
    if (selecting && !hasEmptySlot) setSelecting(false);
  }, [selecting, hasEmptySlot]);
  // Cancel swap mode if the user dismisses or the swap target
  // somehow leaves the featured row from underneath us.
  React.useEffect(() => {
    if (swappingId && !featured.find(a => a.id === swappingId)) {
      setSwappingId(null);
    }
  }, [swappingId, featured]);

  const renderTile = (a) => {
    const tone = RARITY_TONE[a.rarity] || RARITY_TONE.common;
    const isOpen = openId === a.id;
    const inReserve = !!reserve.find(x => x.id === a.id);
    const isFeaturedTile = !!featured.find(x => x.id === a.id);
    const isCreation = a.id === "_creation";
    const isSwapTarget = swappingId === a.id;
    const handleClick = () => {
      // 1. Filling an empty slot: reserve tile click while in
      //    selecting-mode adds it to featured.
      if (selecting && inReserve && toggleFeatured) {
        toggleFeatured(a.id);
        setSelecting(false);
        return;
      }
      // 2. Swap-in-progress: reserve tile click while a featured
      //    tile is marked → just open the reserve's detail card so
      //    the user can read it. The swap itself is explicit via
      //    a button inside the open detail card.
      if (swappingId && inReserve) {
        setOpenId(a.id);
        return;
      }
      // 3. Featured tile (non-creation): tap toggles swap mode
      //    on that slot. Tap same again cancels.
      if (isFeaturedTile && !isCreation && swapFeatured) {
        setSwappingId(prev => prev === a.id ? null : a.id);
        setSelecting(false);
        // Also surface the detail card while in swap mode so the
        // user can read what they're swapping out.
        setOpenId(a.id === swappingId ? null : a.id);
        return;
      }
      // 4. Default: toggle the detail card.
      setOpenId(prev => prev === a.id ? null : a.id);
    };
    return (
      <button
        key={a.id}
        onClick={handleClick}
        style={{
          fontFamily: ff.serif, fontSize: 13,
          padding: "6px 12px", borderRadius: 6,
          background: isOpen || isSwapTarget ? tone.bg : "transparent",
          color: theme.ink,
          border: isSwapTarget
            ? `2px dashed ${theme.terra}`
            : `2px solid ${tone.color}`,
          cursor: "pointer",
          transition: "background 0.15s ease, border 0.15s ease",
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
  const reserveOpen = expanded || !!openInReserve || selecting || !!swappingId;

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
            {(() => {
              // Swap-in-progress: a featured tile is marked AND the
              // open detail belongs to a reserve tile (not the marked
              // one). Replace the standard pin/remove button with an
              // explicit 'swap with X' so the user can read both
              // descriptions before committing.
              const swapPending = swappingId
                && swappingAttr
                && openAttr.id !== swappingId
                && !!reserve.find(a => a.id === openAttr.id)
                && swapFeatured;
              if (swapPending) {
                return (
                  <div style={{ marginTop: 10, display: "flex", justifyContent: "flex-end" }}>
                    <button
                      onClick={() => {
                        swapFeatured(swappingId, openAttr.id);
                        setSwappingId(null);
                        setOpenId(null);
                      }}
                      style={{
                        fontFamily: ff.sans, fontSize: 11, letterSpacing: "0.10em",
                        textTransform: "uppercase",
                        color: theme.cream,
                        background: theme.terra,
                        border: `1px solid ${theme.terra}`, borderRadius: 999,
                        padding: "6px 14px", cursor: "pointer",
                      }}
                    >
                      swap in for {swappingAttr.displayName || swappingAttr.name}
                    </button>
                  </div>
                );
              }
              if (canToggleOpen) {
                return (
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
                );
              }
              return null;
            })()}
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

      {swappingId && swappingAttr && (
        <div style={{
          marginTop: 10, padding: "6px 10px", borderRadius: 6,
          background: "rgba(176,84,47,0.08)",
          border: `1px solid rgba(176,84,47,0.22)`,
          fontFamily: ff.serif, fontStyle: "italic", fontSize: 12.5,
          color: theme.inkSoft, lineHeight: 1.45, textAlign: "center",
        }}>
          Open a reserve elemental to read it, then tap{" "}
          <em style={{ color: theme.terra, fontStyle: "normal" }}>swap in</em>{" "}
          to replace{" "}
          <em style={{ color: theme.terra, fontStyle: "normal" }}>
            {swappingAttr.displayName || swappingAttr.name}
          </em>
          .{" "}
          <button
            onClick={() => setSwappingId(null)}
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
        }}>
          {reserve.length > 1 && (
            <div style={{
              display: "flex", flexWrap: "wrap", gap: 4, justifyContent: "center",
              marginBottom: 10,
            }}>
              {[
                ["rarity",    "rarity"],
                ["name-asc",  "A → Z"],
                ["name-desc", "Z → A"],
                ["creature",  "creature"],
              ].map(([k, label]) => (
                <button
                  key={k}
                  onClick={() => setReserveSort(k)}
                  style={{
                    fontFamily: ff.sans, fontSize: 10, letterSpacing: "0.10em",
                    textTransform: "uppercase",
                    color: reserveSort === k ? theme.cream : theme.inkSoft,
                    background: reserveSort === k ? theme.terra : "transparent",
                    border: `1px solid ${reserveSort === k ? theme.terra : theme.rule}`,
                    borderRadius: 999, padding: "4px 10px",
                    cursor: "pointer",
                  }}
                >{label}</button>
              ))}
            </div>
          )}
          <div style={{
            display: "flex", flexWrap: "wrap", gap: 6,
          }}>
            {sortedReserve.map(renderTile)}
          </div>
        </div>
      )}
    </>
  );
};
