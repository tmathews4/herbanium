/* ──────────────────────────────────────────────────────────────
   screens/BadgesPanel.jsx — earned-badge grid for Compose > Shelf.
   ────────────────────────────────────────────────────────────── */

import React from "react";
import { Flower, MOOD_ICONS } from "../components/icons";
import { ff, theme } from "../theme";
import { buildBadgeContext, evaluateBadges } from "../data/badges";

export const BadgesPanel = ({ sessions, savedBlendIds, favoriteBlendIds, generatedBlends, pantryIds }) => {
  const ctx = buildBadgeContext({ sessions, savedBlendIds, favoriteBlendIds, generatedBlends, pantryIds });
  const badges = evaluateBadges(ctx);
  const earnedCount = badges.filter(b => b.earned).length;
  const total = badges.length;

  return (
    <div style={{ marginTop: 4 }}>
      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "baseline",
        marginBottom: 12,
      }}>
        <div style={{
          fontFamily: ff.serif, fontStyle: "italic", fontSize: 13,
          color: theme.ash, lineHeight: 1.5,
        }}>
          Quiet markers earned through the brewing year. {earnedCount} of {total} sealed.
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        {badges.map(b => {
          const Icon = MOOD_ICONS[b.icon] || Flower;
          return (
            <div key={b.id} style={{
              padding: "12px 12px",
              borderRadius: 10,
              background: b.earned ? theme.cream : "transparent",
              border: `1px ${b.earned ? "solid" : "dashed"} ${b.earned ? theme.rule : theme.ruleSoft}`,
              opacity: b.earned ? 1 : 0.55,
              position: "relative",
              minHeight: 92,
            }}>
              <div style={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                marginBottom: 8,
              }}>
                <Icon size={22} c={b.earned ? theme.ochre : theme.ash} />
                {b.earned && (
                  <span style={{
                    fontFamily: ff.serif, fontStyle: "italic", fontSize: 10,
                    color: theme.terra, letterSpacing: "0.06em",
                  }}>sealed</span>
                )}
              </div>
              <div style={{
                fontFamily: ff.serif, fontSize: 14.5,
                color: theme.ink, lineHeight: 1.2,
              }}>{b.name}</div>
              <div style={{
                fontFamily: ff.serif, fontStyle: "italic", fontSize: 11.5,
                color: theme.ash, marginTop: 4, lineHeight: 1.4,
              }}>{b.desc}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
