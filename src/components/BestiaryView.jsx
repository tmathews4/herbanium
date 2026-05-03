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
import { MoodCrystal } from "./MoodCrystal";
import { ElementalSigil, sigilColorFor } from "./ElementalSigil";
import { getBlend } from "../helpers/misc";
import { buildAttributeContext, evaluateAttributes } from "../data/attributes";
import { hapticTap } from "../helpers/native";
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
  wildElementals = [],
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
  // Earned elementals carry the "A {Adjective} {Creature}" indefinite
  // article — they're a kind, not a singular. Only the user's unique
  // creation card keeps "The" since it really is one of one. Switches
  // to "An" before vowel-led adjectives so the read stays grammatical.
  const articleFor = (word) => /^[aeiou]/i.test(word || "") ? "An" : "A";
  const earnedAttrs = earned.map(a => {
    const n = naming.get(a.id) || {};
    const adj = n.adjective || "";
    const creature = n.creature || "Spirit";
    const flavor = flavorLineFor(adj);
    const baseDesc = (a.desc || "").trim();
    return {
      ...a,
      adjective: adj,
      creature,
      displayName: `${articleFor(adj)} ${adj} ${creature}`,
      desc: baseDesc ? `${flavor} ${baseDesc}` : flavor,
    };
  });
  // Wild elementals (chance rolls on brews / journal entries) carry
  // their own displayName + creature + desc + rarity, so they merge
  // straight in alongside the named attribute-based earned set.
  const earnedAttrsAll = [...earnedAttrs, ...(wildElementals || [])];
  const rarityOrder = { mythic: 5, legendary: 4, rare: 3, uncommon: 2, common: 1 };
  const sortedEarned = [...earnedAttrsAll].sort((a, b) =>
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
    // Auto-fill any open featured slot when the user has fewer than
    // FEATURED_LIMIT *real* pins. Once all five are filled, new
    // arrivals settle into reserve and the user curates from there.
    //
    // The earlier bug (commented previously) was that auto-fill
    // compared against the persisted array length, which could be
    // small even when the displayed row was already full via the
    // rarity-fallback — causing a freshly-logged elemental to
    // collapse the visible row to a single slot. The fix is to
    // count VALID pins (ids that correspond to currently-earned
    // elementals) instead, and to only auto-append when the user
    // has genuine slot openings, not when the fallback is masking
    // an empty persisted array.
    if (!setFeaturedElementals) return;
    setFeaturedElementals(prev => {
      const cur = prev || [];
      if (cur.includes(id)) return cur;
      const validCur = cur.filter(fid =>
        revealedSorted.some(a => a.id === fid));
      if (validCur.length >= FEATURED_LIMIT) return cur;
      return [...cur, id];
    });
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
  // Closing reminder that this elemental belongs to the user alone —
  // the rest of the bestiary is a kind ("A Mist Heron"), this one is
  // a singular ("The Twilight Pearl Hare").
  uniquePieces.push("An elemental no one but you has yet documented.");
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

  // Cold-start auto-pin: freeze the current top-N-by-rarity into
  // featuredElementals as soon as the user has anything revealed
  // AND no real pinned ids of their own. The validity check matters
  // because seed presets (or legacy state) can persist ids that
  // aren't actually in earnedAttrs — those ids don't render anywhere
  // and shouldn't block this pin from running. Without it, the
  // displayed featured row falls back to "top 5 by rarity in
  // revealedSorted" every render, and a freshly-logged high-rarity
  // elemental slips into slot 1 of that fallback view.
  React.useEffect(() => {
    if (!setFeaturedElementals) return;
    if (revealedSorted.length === 0) return;
    setFeaturedElementals(prev => {
      const cur = prev || [];
      const validCur = cur.filter(id =>
        revealedSorted.some(a => a.id === id));
      // User has at least one real pin — keep their list intact.
      if (validCur.length > 0) return cur;
      // No valid pins; lock in the current top-5 by rarity so
      // subsequent arrivals can't bump them out of the displayed row.
      return revealedSorted.slice(0, FEATURED_LIMIT).map(a => a.id);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [revealedSorted.length, setFeaturedElementals]);
  const featured = effectiveFeaturedIds
    .map(id => revealedSorted.find(a => a.id === id))
    .filter(Boolean);
  const reserve = revealedSorted.filter(a => !effectiveFeaturedIds.includes(a.id));
  const isFeatured = (id) => effectiveFeaturedIds.includes(id);
  const toggleFeatured = (id) => {
    if (!setFeaturedElementals) return;
    hapticTap();
    const cur = effectiveFeaturedIds.slice();
    if (cur.includes(id)) {
      setFeaturedElementals(cur.filter(x => x !== id));
      return;
    }
    // Main full — refuse to silently bump the last slot. Adding
    // from reserve when main is full requires an explicit swap
    // (user picks which featured to replace). The reverse-swap
    // flow (incomingId state) handles this.
    if (cur.length >= FEATURED_LIMIT) return;
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
            A fun side game — collect elementals drawn from your mood
            arc and brewing history. Entirely optional; turn it off
            under <strong style={{ color: theme.terra }}>Profile → Preferences</strong>.
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

      {/* Lead crystal — visualizes the same mood + flavor signal
          that already biases wild-elemental rolls (see
          maybeRollWild in data/wildElementals.js). Color and
          name shift with the user's last 30 days of cups and
          journal entries; sits above the bestiary header so the
          crystal reads as the lodestone the elementals gather
          around. */}
      <MoodCrystal
        sessions={sessions}
        journalEntries={journalEntries}
        getBlend={getBlend}
        profile={profile}
      />

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
        A fun side game — elementals find you based on your mood
        history and brewing patterns. Tap{" "}
        <em style={{ color: theme.terra, fontStyle: "normal" }}>Log</em>{" "}
        to observe the next one waiting. Not for you? Turn it off in
        <em style={{ color: theme.terra, fontStyle: "normal" }}> Profile → Preferences</em>.
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
  // incomingId: id of a RESERVE elemental the user picked to bring
  // into the featured row when main is full. The next featured-tile
  // tap commits the swap via swapFeatured, preserving slot order.
  // Single explicit-swap path now that the swap-mode toggle and the
  // tap-to-arm-featured flow have been removed — every change to
  // the loaded spots requires the user to explicitly pick BOTH the
  // reserve item to bring in (via the "choose a tile to swap with"
  // button on the reserve's detail card) AND the featured tile to
  // replace (via tapping it after arming).
  const [incomingId, setIncomingId] = useState(null);
  const incomingAttr = incomingId
    ? (revealedSorted.find(a => a.id === incomingId) || null)
    : null;

  const hasEmptySlot = featured.length < featuredLimit;
  React.useEffect(() => {
    if (selecting && !hasEmptySlot) setSelecting(false);
  }, [selecting, hasEmptySlot]);
  // Cancel reverse-swap if the incoming reserve tile vanishes (e.g.
  // gets pinned via another path) or main empties below the limit.
  React.useEffect(() => {
    if (incomingId && (!incomingAttr || hasEmptySlot)) {
      setIncomingId(null);
    }
  }, [incomingId, incomingAttr, hasEmptySlot]);

  const renderTile = (a) => {
    const tone = RARITY_TONE[a.rarity] || RARITY_TONE.common;
    const isOpen = openId === a.id;
    const inReserve = !!reserve.find(x => x.id === a.id);
    const isFeaturedTile = !!featured.find(x => x.id === a.id);
    const isCreation = a.id === "_creation";
    // Indicate which featured tile would receive the incoming
    // reserve item if the user taps it next.
    const isSwapTarget = incomingId && isFeaturedTile && !isCreation;
    const handleClick = () => {
      // 1. Reverse-swap commit: a reserve tile is "incoming" and the
      //    user just tapped a featured tile. Replace that featured
      //    slot with the incoming tile and close the flow. Creation
      //    card is exempt — it's the user's unique elemental, never
      //    swappable.
      if (incomingId && isFeaturedTile && !isCreation && swapFeatured) {
        swapFeatured(a.id, incomingId);
        setIncomingId(null);
        setOpenId(null);
        return;
      }
      // 2. Filling an empty slot: reserve tile click while in
      //    selecting-mode adds it to featured.
      if (selecting && inReserve && toggleFeatured) {
        toggleFeatured(a.id);
        setSelecting(false);
        return;
      }
      // 3. Default: toggle the detail card. Swap arming lives
      //    behind an explicit detail-card button so a stray tile
      //    tap can't reorganize the featured row.
      setOpenId(prev => prev === a.id ? null : a.id);
    };
    return (
      <button
        key={a.id}
        onClick={handleClick}
        style={{
          fontFamily: ff.serif, fontSize: 13,
          padding: "5px 10px 5px 7px", borderRadius: 6,
          background: isOpen || isSwapTarget ? tone.bg : "transparent",
          color: theme.ink,
          border: isSwapTarget
            ? `2px dashed ${theme.terra}`
            : `2px solid ${tone.color}`,
          cursor: "pointer",
          transition: "background 0.15s ease, border 0.15s ease",
          whiteSpace: "nowrap",
          display: "inline-flex", alignItems: "center", gap: 6,
        }}
      >
        <ElementalSigil elemental={a} size={18} color={sigilColorFor(a, tone.color)} />
        <span>{a.displayName || a.name}</span>
      </button>
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
  const reserveOpen = expanded || !!openInReserve || selecting || !!incomingId;

  return (
    <>
      {openAttr && (() => {
        const tone = RARITY_TONE[openAttr.rarity] || RARITY_TONE.common;
        return (
          <div style={{
            marginBottom: 12, padding: "14px 14px 12px", borderRadius: 10,
            background: tone.bg,
            border: `2px solid ${tone.color}`,
            position: "relative",
            display: "flex", alignItems: "flex-start", gap: 12,
          }}>
            <button onClick={() => setOpenId(null)} aria-label="close" style={{
              position: "absolute", top: 4, right: 8,
              background: "transparent", border: "none", cursor: "pointer",
              color: theme.ash, fontSize: 18, lineHeight: 1, padding: 4,
            }}>×</button>
            {/* Larger sigil pinned to the description card so the
                user reads the elemental's mark next to its name and
                story — pulls the same id-hashed signet shown on the
                tile, just at a size where the structure (chord
                lines, dot placement, center mark) is legible. */}
            <div style={{ flexShrink: 0, marginTop: 2 }}>
              <ElementalSigil elemental={openAttr} size={48} color={sigilColorFor(openAttr, tone.color)} />
            </div>
            <div style={{ flex: 1, minWidth: 0, marginRight: 18 }}>
            <div style={{
              display: "flex", alignItems: "baseline", gap: 8,
              marginBottom: 4, flexWrap: "wrap",
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
              if (canToggleOpen) {
                // When main is full + open detail is a reserve tile,
                // pinning requires the user to pick which featured
                // slot to replace. Click "choose tile to swap" to
                // arm incomingId; the next featured-tile tap commits.
                const armReverseSwap = featuredFull && !openIsFeatured;
                return (
                  <div style={{ marginTop: 10, display: "flex", justifyContent: "flex-end" }}>
                    <button
                      onClick={() => {
                        if (armReverseSwap) {
                          setIncomingId(openAttr.id);
                          setOpenId(null);
                          return;
                        }
                        toggleFeatured(openAttr.id);
                      }}
                      style={{
                        fontFamily: ff.sans, fontSize: 11, color: theme.terra,
                        background: "transparent",
                        border: `1px solid ${theme.terra}`, borderRadius: 999,
                        padding: "5px 12px", cursor: "pointer",
                      }}
                    >
                      {openIsFeatured
                        ? "remove from bestiary front-page"
                        : armReverseSwap ? "choose a tile to swap with"
                        : "pin to front-page"}
                    </button>
                  </div>
                );
              }
              return null;
            })()}
            </div>
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

      {incomingId && incomingAttr && (
        <div style={{
          marginTop: 10, padding: "6px 10px", borderRadius: 6,
          background: "rgba(176,84,47,0.08)",
          border: `1px solid rgba(176,84,47,0.22)`,
          fontFamily: ff.serif, fontStyle: "italic", fontSize: 12.5,
          color: theme.inkSoft, lineHeight: 1.45, textAlign: "center",
        }}>
          Tap a featured tile above to swap with{" "}
          <strong style={{ color: theme.terra, fontStyle: "normal" }}>
            {incomingAttr.displayName || incomingAttr.name}
          </strong>.
          {" "}
          <button
            onClick={() => setIncomingId(null)}
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
