/* ──────────────────────────────────────────────────────────────
   components/ElementalsView.jsx — the Elemental Elementals.

   A user-curated record of every elemental observed during their
   time with the kettle. Lives inside the Shelf as a sub-tab,
   alongside Journal / Recipe Book. Tapping the Summon
   button cycles the queue: first ever click reveals the user's
   unique creation elemental via the OmenCard; subsequent clicks
   pop the ElementalArrivalCard for the next earned-but-unobserved
   one. Each one only sketches into the elementals after its arrival
   card fades through.

   This component owns the elementals data layer: it evaluates the
   attribute context, names + decorates each elemental, runs the
   summon flow, and renders the AttributeShelf detail. The host
   screen only has to wire the persisted props through.
   ────────────────────────────────────────────────────────────── */

import React, { useState, useEffect } from "react";
import { ff, theme } from "../theme";
import { OmenCard } from "./OmenCard";
import { ElementalArrivalCard } from "./ElementalArrivalCard";
import { MoodCrystal } from "./MoodCrystal";
import { ElementalSigil, sigilColorFor } from "./ElementalSigil";
import { getBlend } from "../helpers/misc";
import { ATTRIBUTES } from "../data/attributes";
import { hapticTap } from "../helpers/native";
import {
  buildElementalNaming, flavorLineFor,
} from "../data/elementalAdjectives";
import { generateCreationTitle, describeCreationTitle } from "../data/creationTitle";

const FEATURED_LIMIT = 5;

// Naturalist field-journal note for a single arrival. Combines a
// time-of-day phrase with a short context line derived from the
// nearest brewing/writing activity (or a recent-mood streak when
// nothing's nearby). Returns null when there's nothing meaningful
// to say — caller suppresses the line entirely in that case.
function timeOfDayPhrase(ts) {
  if (!ts) return null;
  const h = new Date(ts).getHours();
  if (h >= 5 && h < 9)   return "at first light";
  if (h >= 9 && h < 11)  return "in the morning";
  if (h >= 11 && h < 14) return "in midday quiet";
  if (h >= 14 && h < 17) return "in the afternoon hush";
  if (h >= 17 && h < 20) return "at dusk";
  if (h >= 20 && h < 23) return "in the evening";
  return "well into the dark";
}
// Action-driven context phrase — the surface that triggered the
// roll dictates how we narrate the moment, so a notebook visit
// doesn't get described as "with chai in the cup" just because
// the user happened to brew within the last hour.
function contextPhraseForAction(action, ts, sessions, journalEntries, getBlend) {
  if (!ts) return null;
  const NEAR_MS = 30 * 60 * 1000;
  if (action === "brew") {
    // Find the brew co-incident with the roll. The brew action
    // fires inside addSession, so the matching session is the most
    // recent one before the timestamp.
    for (const s of sessions || []) {
      if (s.who !== "you") continue;
      const t = s.brewedAt || 0;
      if (!t) continue;
      if (Math.abs(t - ts) <= NEAR_MS) {
        const b = getBlend(s.blendId);
        if (b?.name) return `with ${b.name.toLowerCase()} in the cup`;
        return "with a fresh cup steeping";
      }
    }
    return "with a fresh cup steeping";
  }
  if (action === "journal") {
    return "during a writing turn";
  }
  if (action === "visit:apothecary") return "while wandering the apothecary";
  if (action === "visit:shelf")      return "while turning notebook pages";
  if (action === "visit:home")       return "while crossing the threshold home";
  if (action === "visit:profile")    return "while looking inward";
  if (action === "favorite")         return "while marking a recipe to keep";
  if (action === "compose")          return "while building a blend at the bench";
  if (action === "any")              return "passing on its own course";
  if (action === "milestone")        return "as a marker of a threshold crossed";
  return null;
}
function arrivalNote(ts, sessions, journalEntries, getBlend, isCreation, action) {
  if (isCreation) return "noted the day the lodestone was carved";
  if (!ts) return "from before the journal began";
  const t = timeOfDayPhrase(ts);
  const c = contextPhraseForAction(action, ts, sessions, journalEntries, getBlend);
  if (t && c) return `${t} — ${c}`;
  if (t) return t;
  if (c) return c;
  return null;
}

const RARITY_TONE = {
  common:    { color: theme.ash,      label: "common",    bg: "rgba(140,140,140,0.05)" },
  uncommon:  { color: theme.sageDeep, label: "uncommon",  bg: "rgba(98,124,92,0.07)" },
  rare:      { color: theme.ochre,    label: "rare",      bg: "rgba(165,120,54,0.10)" },
  legendary: { color: theme.terra,    label: "legendary", bg: "rgba(176,84,47,0.10)" },
  mythic:    { color: theme.plum,     label: "mythic",    bg: "rgba(120,72,140,0.12)" },
};

export const ElementalsView = ({
  lodestoneCharge = 0,
  onChargedSummon = null,
  tourStep = null,
  profile,
  sessions = [],
  savedBlendIds,
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
  rolledElementalIds,
  rolledElementalAt,
  rolledElementalAction,
  // Auto-open hint passed by App when the user taps "Log it" on the
  // end-of-brew glimpse card. The elementals lands with this elemental's
  // arrival card already open, so the user doesn't have to tap a
  // second summon button to reach the moment they came here for.
  // Skipped if the user hasn't seen the omen yet (i.e. their unique
  // creation title) — that introduction needs to happen before any
  // rolled arrival, otherwise the omen flow gets short-circuited the
  // first time around.
  autoOpenArrivalId = null,
  onAutoOpenConsumed,
  // Locked-crystal snapshot + setter. Null = crystal tracks live
  // recent activity (default); object = crystal renders the pinned
  // snapshot until the user unlocks it.
  lockedCrystal,
  setLockedCrystal,
  elementalsHintShown,
  dismissElementalsHint,
}) => {
  const cupCount = (sessions || []).filter(s => s.who === "you").length;

  const elementalSeed = profile?.createdAt || profile?.name || "anon";

  // Earned attribute-based elementals come from the rolled-id store
  // now (chance-based earning model). The legacy predicate-eval
  // path was retired — the predicates still live on attribute
  // entries for the one-time migration in App.jsx but are no longer
  // consulted on every render.
  const rolledIds = rolledElementalIds || new Set();
  const earned = ATTRIBUTES.filter(a => rolledIds.has(a.id));
  // Per-user naming map: minimizes adjective/creature duplicates by
  // giving each user a permutation of the pools and assigning by
  // stable order, instead of independent per-attr hashing.
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
  // A full stone is its own reason to be ready, independent of whether
  // anything is already queued — that's the point of charging it.
  const chargeReady = !elementalsDisabled && lodestoneCharge >= 100;
  const summonExhausted = !elementalsDisabled && omenShown
    && pendingArrivals.length === 0 && !chargeReady;
  /* THE PULSE WAITS ITS TURN.

     A tour step and a pulsing stone are both the app pointing at
     something, and on this page they landed together: the callout said
     look here while the lodestone glowed for attention two inches
     away. Whichever the user followed, the other was still asking.

     So the pulse holds while a tour is running on this page, and for a
     beat after it ends. The delay is the more important half — the
     moment a tour finishes is exactly when someone is deciding what to
     do next, and a glow arriving in that same frame reads as the tour
     handing off to another instruction rather than letting go.

     `tourStep` is null when nothing is running, which covers finishing,
     skipping and never starting. Someone who skipped has made the same
     decision as someone who finished — they want the screen back. */
  const PULSE_HOLD_MS = 2200;
  const [pulseAllowed, setPulseAllowed] = useState(false);
  useEffect(() => {
    if (tourStep) { setPulseAllowed(false); return; }
    const t = setTimeout(() => setPulseAllowed(true), PULSE_HOLD_MS);
    return () => clearTimeout(t);
  }, [tourStep]);

  const summonReady     = !elementalsDisabled
    && pulseAllowed
    && (!omenShown || pendingArrivals.length > 0 || chargeReady);
  const onSummonClick = () => {
    if (!summonReady || summonTarget) return;
    if (!omenShown) {
      setSummonTarget({ kind: "omen" });
      return;
    }
    const next = pendingArrivals[0];
    if (next) {
      setSummonTarget({ kind: "arrival", elemental: next });
      return;
    }
    // Nothing queued, but the stone is full: spend it. App rolls a wild
    // elemental and empties the charge; the new arrival then flows
    // through the normal pending path on the next render, so there's
    // one code path for showing a visitor however it was earned.
    if (chargeReady && onChargedSummon) onChargedSummon();
  };

  // Auto-open the requested arrival when arriving from a glimpse-card
  // "Log it" tap. Runs once per autoOpenArrivalId value: finds the
  // matching elemental in pendingArrivals, sets it as summonTarget,
  // and signals App to clear the flag so the next render doesn't
  // re-trigger. Skipped while the omen is unshown — the user's
  // creation-title intro needs to land before any rolled arrival
  // surfaces; otherwise we'd short-circuit the once-only welcome
  // moment.
  React.useEffect(() => {
    if (!autoOpenArrivalId) return;
    if (elementalsDisabled) return;
    if (summonTarget) return;
    if (!omenShown) return;
    const target = pendingArrivals.find(a => a.id === autoOpenArrivalId);
    if (target) {
      setSummonTarget({ kind: "arrival", elemental: target });
    }
    if (onAutoOpenConsumed) onAutoOpenConsumed();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoOpenArrivalId, omenShown]);
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
  // the rest of the elementals is a kind ("A Mist Heron"), this one is
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
        Profile to start a elementals.
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

      {/* Lead crystal — visualizes the same mood + flavor signal
          that already biases wild-elemental rolls (see
          maybeRollWild in data/wildElementals.js). Color and
          name shift with the user's last 30 days of cups and
          journal entries; sits above the elementals header so the
          crystal reads as the lodestone the elementals gather
          around. */}
      <div data-tour="fieldnotes-lodestone">
      <MoodCrystal
        tourStep={tourStep}
        // lodestoneCharge is persisted 0–100 (it's a human-facing
        // percentage); the renderer wants a 0–1 fraction. Converting
        // here rather than storing a fraction keeps the dev controls
        // and any future "72% charged" copy reading naturally.
        charge={Math.max(0, Math.min(100, Number(lodestoneCharge) || 0)) / 100}
        sessions={sessions}
        journalEntries={journalEntries}
        getBlend={getBlend}
        profile={profile}
        lockedCrystal={lockedCrystal}
        setLockedCrystal={setLockedCrystal}
        summonReady={summonReady && !summonTarget}
        // Pending count stays honest while an arrival card is open:
        // subtract one for the visitor currently being observed so
        // the badge reads "the rest of what's still waiting" instead
        // of disappearing or counting the open card. On the omen
        // path (no arrivals yet, just the creation intro), keep at 1
        // until the omen is dismissed.
        summonPendingCount={
          summonTarget?.kind === "arrival"
            ? Math.max(0, pendingArrivals.length - 1)
            : summonTarget?.kind === "omen"
              ? 0
              : (!omenShown ? 1 : pendingArrivals.length)
        }
        onSummon={onSummonClick}
      />
      </div>

      {/* WHAT THE THING IS, said once, on the screen it lives on.

          The crystal reports its name, its colour and — behind the
          details toggle — the family ranks and onboarding intent driving
          both. All of that explains how the lodestone is CALCULATED and
          none of it says what it IS, so a reader who never opened the
          details had a coloured stone that changed for reasons.

          The alternative was renaming Field Notes to Lodestone, which
          would have named the screen after one thing on it. A paragraph
          costs three lines and answers the actual question.

          Every clause is a real mechanic, not atmosphere: the thirty
          days are the window MoodCrystal reads over, the two inputs are
          exactly the ones it reads (its own header says "moods and
          flavors"), the colour and name come from that signal, and the
          lean is the same bias maybeRollWild uses to pick what turns up
          (see data/wildElementals.js). The last sentence names the
          elementals outright rather than saying "what gathers here" —
          the coy version made the reader infer the subject of the one
          sentence that connects the stone to everything below it. Writing it as prose is a register
          choice; nothing in it is invented, which is the same rule the
          ingredient copy is held to.

          THE SCREEN GETS NAMED FIRST, the stone second. The paragraph
          opened on the lodestone, which explained the object at the top
          of the page and left the page itself unexplained — a reader
          arriving at Field Notes learned what the crystal was and still
          didn't know what they were looking at or why it was called
          that. Leading with the notes answers the question the screen's
          own name raises, and the stone becomes the reason there is
          anything to take notes ON.

          The trade is one clause: "worn down into mineral" went. It was
          the best phrase in the paragraph and it was decoration, where
          everything it sat beside was load-bearing.

          NAMING THE TWO INPUTS is the difference between poetry and an
          explanation. "Every cup you brew and every entry you keep" was
          true and told you nothing you could act on — it reads as all
          use counting equally. Moods logged and flavours brewed are the
          two signals that actually move it, so a reader who wants a
          different stone knows which dials exist.

          And then the plain gloss, in plain type. The paragraph above
          is doing a register the app earns elsewhere, but register is
          not comprehension: someone who has never met a lodestone still
          needs the one-line answer to "what IS this, mechanically". The
          familiar comparison does that in a sentence, and putting it in
          sans rather than italic serif marks it as the aside it is —
          the app explaining itself, not the app in voice. */}
      <div data-testid="lodestone-lede" style={{
        margin: "10px 2px 4px",
        fontFamily: ff.serif, fontStyle: "italic", fontSize: 12.5,
        lineHeight: 1.62, color: theme.ash, textAlign: "center",
      }}>
        These are your field notes — what you have observed of the
        elementals your lodestone draws in. A lodestone is a stone that
        has learned which way is north; this one learns from you,
        leaning a little with every mood you log and flavour you brew,
        until its colour and its name are your last thirty days.
      </div>
      <div data-testid="lodestone-gloss" style={{
        margin: "0 2px 14px",
        fontFamily: ff.sans, fontSize: 11, lineHeight: 1.5,
        color: theme.ash, opacity: 0.85, textAlign: "center",
      }}>
        Think of it like badges in other apps — elementals are what you
        collect for using this one.
      </div>

      <div style={{
        display: "flex", alignItems: "baseline", justifyContent: "flex-end",
        gap: 10, marginBottom: 12,
      }}>
        {/* Pending-count read — the lodestone above is the tap target
            for summoning; this row just reports what's waiting. */}
        <span style={{
          fontFamily: ff.sans, fontSize: 10.5, letterSpacing: "0.16em",
          textTransform: "uppercase",
          color: summonExhausted ? theme.ash : theme.terra,
          opacity: summonExhausted ? 0.55 : 1,
        }}>
          {summonExhausted ? "no specimen waiting"
            : !omenShown ? "creation waiting"
            : pendingArrivals.length > 1 ? `${pendingArrivals.length} waiting`
            : "1 waiting"}
        </span>
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

      {/* Arrivals — date-stamped chronological list of every
          elemental noted in this user's lodestone. Reframes the
          collection from a trophy grid into a journal of visitors:
          the most recent first, dropping in date markers, with a
          small sigil + name beside each. Rolled-id timestamps come
          from rolledElementalAt; legacy migrations carry a sentinel
          0 timestamp and render as "earlier" instead of a date.
          Wild elementals already carry their own ts. */}
      {!elementalsDisabled && (() => {
        const stamps = rolledElementalAt || {};
        const items = [];
        // Only include elementals the user has actually summoned via
        // the lodestone (id present in seenElementalIds). The roll
        // moment writes the id into rolledElementalIds + queues a
        // glimpse banner; the timeline shouldn't pre-spoil what's
        // still pulsing in the stone, only what the user has
        // actually observed by tapping the lodestone.
        for (const a of earnedAttrs) {
          if (!seenIds.has(a.id)) continue;
          const ts = stamps[a.id];
          items.push({
            id: a.id,
            displayName: a.displayName,
            rarity: a.rarity,
            ts: typeof ts === "number" ? ts : 0,
          });
        }
        for (const w of (wildElementals || [])) {
          if (!seenIds.has(w.id)) continue;
          items.push({
            id: w.id,
            displayName: w.displayName || w.name,
            rarity: w.rarity,
            ts: typeof w.ts === "number" ? w.ts : 0,
          });
        }
        // Unique creation-title elemental — counts as "summoned" once
        // the omen card has been dismissed, since dismissing the omen
        // is the user's first act of observing the stone. Stamped
        // with the profile creation date so it sits at the bottom of
        // the timeline as the originating moment, with later
        // arrivals stacking above it.
        if (creationCard && omenShown) {
          items.push({
            id: creationCard.id,
            displayName: creationCard.displayName,
            rarity: creationCard.rarity,
            ts: typeof profile?.createdAt === "number" ? profile.createdAt : 0,
          });
        }
        if (items.length === 0) return null;
        // Sort newest-first; legacy zeros land at the bottom.
        items.sort((a, b) => (b.ts || 0) - (a.ts || 0));
        const fmtDate = (ts) => {
          if (!ts) return "earlier";
          const d = new Date(ts);
          const now = new Date();
          const sameDay = d.toDateString() === now.toDateString();
          const yest = new Date(now); yest.setDate(now.getDate() - 1);
          if (sameDay) return "today";
          if (d.toDateString() === yest.toDateString()) return "yesterday";
          const diffDays = Math.round((now - d) / (24 * 60 * 60 * 1000));
          if (diffDays < 7) return `${diffDays} days ago`;
          // Fall back to a short month-day; same-year entries omit
          // the year so the column reads tight.
          const sameYear = d.getFullYear() === now.getFullYear();
          const opts = sameYear
            ? { month: "short", day: "numeric" }
            : { year: "numeric", month: "short", day: "numeric" };
          return d.toLocaleDateString(undefined, opts);
        };
        return (
          <div style={{ marginTop: 22 }}>
            <div style={{
              fontFamily: ff.sans, fontSize: 9.5, letterSpacing: "0.18em",
              textTransform: "uppercase", color: theme.ash, marginBottom: 8,
            }}>arrivals</div>
            <div style={{
              border: `1px solid ${theme.ruleSoft}`,
              borderRadius: 10,
              background: theme.cream,
              overflow: "hidden",
            }}>
              {items.map((it, i) => {
                const isCreation = it.id === "_creation";
                const action = (rolledElementalAction || {})[it.id];
                const note = arrivalNote(it.ts, sessions, journalEntries, getBlend, isCreation, action);
                const dateLabel = fmtDate(it.ts);
                return (
                  <div key={it.id} style={{
                    padding: "9px 12px 10px",
                    borderTop: i === 0 ? "none" : `1px solid ${theme.ruleSoft}`,
                    textAlign: "left",
                  }}>
                    {/* Name on its own line, left-aligned. The date
                        moves down into the note line so the row reads
                        as a journal stamp ("yesterday · at dusk —
                        with chai in the cup") rather than a
                        right-justified table. */}
                    <div style={{
                      fontFamily: ff.serif, fontSize: 13.5, color: theme.ink,
                      lineHeight: 1.3,
                      overflow: "hidden", textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}>{it.displayName}</div>
                    <div style={{
                      marginTop: 2,
                      fontFamily: ff.serif, fontStyle: "italic",
                      fontSize: 11.5, color: theme.ash,
                      lineHeight: 1.4,
                    }}>
                      <span style={{ fontStyle: it.ts ? "italic" : "italic" }}>{dateLabel}</span>
                      {note && <> · {note}</>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })()}
    </div>
  );
};

/* ──────────────────────────────────────────────────────────────
   AttributeShelf — earned-only name cards, border colored by
   rarity. Tap any card to expand its description. Used inside
   the elementals to render the unique + featured + reserve rows.
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
  /* LOOKED UP IN WHAT THIS COMPONENT ACTUALLY HAS.

     This read `revealedSorted`, which lives in ElementalsView and was
     never passed down — so the reference resolved to nothing and threw
     the moment `incomingId` was set. The path is live: tapping "choose
     a tile to swap with" on a reserve elemental while the featured row
     is full sets it (see armReverseSwap below), and the next render
     crashed the view.

     Found by lint, not by a test — `no-undef` had been reporting it,
     buried among this file's pre-existing warnings.

     The shelf holds `featured` and `reserve`, and the incoming id
     always comes from a tile in one of them, so those are both the
     correct and the only available source. */
  const incomingAttr = incomingId
    ? ([...(featured || []), ...(reserve || [])].find(a => a.id === incomingId) || null)
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
                        ? "remove from elementals front-page"
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
