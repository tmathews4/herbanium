/* ──────────────────────────────────────────────────────────────
   screens/LogScreen.jsx — post-brew check-in (floating card).

   Slim three-section flow: flavor confirmation, rating, notes.
   Mood is intentionally NOT asked here — the user just put down
   the cup and can't yet tell whether the calm landed or focus
   sharpened. Mood resolves over the next ~30 minutes; the
   session is created in a "moodsPending" state and the Home
   screen's MoodFollowUp card walks the user through landed/missed
   when they next return to the app.
   ────────────────────────────────────────────────────────────── */

import React, { useState, useMemo } from "react";
import { Flower } from "../components/icons";
import { Button, SectionLabel } from "../components/layout";
import { ff, theme } from "../theme";

export const LogScreen = ({ blend, intent, currentMoods, onSubmit, onCancel }) => {
  const predictedFlavors = useMemo(() => {
    const list = Array.isArray(blend?.flavors) ? blend.flavors : [];
    return list.slice(0, 6);
  }, [blend]);

  const [tasted, setTasted] = useState(() =>
    Object.fromEntries(predictedFlavors.map(f => [f, true]))
  );
  const [taste, setTaste] = useState(4);
  const [note, setNote]   = useState("");

  return (
    <>
      <div style={{
        position: "absolute", inset: 0, zIndex: 30,
        background: "rgba(30, 24, 18, 0.35)",
        animation: "sheetFadeIn 0.2s ease-out",
      }} />
      <div style={{
        position: "absolute", left: 14, right: 14, top: 28, bottom: 88, zIndex: 31,
        background: theme.ivory,
        borderRadius: 20,
        boxShadow: "0 18px 48px -16px rgba(30,24,18,0.45), 0 0 0 1px rgba(80,60,40,0.08)",
        display: "flex", flexDirection: "column",
        padding: "20px 22px 24px",
        overflowY: "auto",
        WebkitOverflowScrolling: "touch",
        animation: "sheetFadeIn 0.22s ease-out",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Button variant="ghost" onClick={onCancel}>← back</Button>
          <div style={{
            fontFamily: ff.sans, fontSize: 10.5, letterSpacing: "0.18em",
            textTransform: "uppercase", color: theme.ash,
          }}>
            Check-in
          </div>
          <div style={{ width: 40 }} />
        </div>

        <div style={{ textAlign: "center", marginTop: 14 }}>
          <Flower size={28} c={theme.ochre} />
          <div style={{
            fontFamily: ff.serif, fontStyle: "italic", fontSize: 14,
            color: theme.ash, marginTop: 8,
          }}>
            how's the cup taste?
          </div>
          <h2 style={{
            fontFamily: ff.serif, fontSize: 24, fontWeight: 400,
            color: theme.ink, margin: "4px 0 0",
          }}>
            {blend.name}
          </h2>
          <div style={{
            fontFamily: ff.serif, fontStyle: "italic", fontSize: 12,
            color: theme.ash, marginTop: 8,
          }}>
            mood arrives over the next half hour — we'll ask you then
          </div>
        </div>

        {predictedFlavors.length > 0 && (
          <div style={{ margin: "20px 0" }}>
            <SectionLabel n="i">Flavor</SectionLabel>
            <div style={{
              fontFamily: ff.serif, fontStyle: "italic", fontSize: 12,
              color: theme.ash, marginTop: 4,
            }}>
              the cup was meant to carry {predictedFlavors.join(", ")}
            </div>
            <div style={{
              marginTop: 10, border: `1px solid ${theme.ruleSoft}`, borderRadius: 10,
              background: theme.cream, overflow: "hidden",
            }}>
              {predictedFlavors.map((f, i) => (
                <div key={f} style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: "12px 14px",
                  borderTop: i === 0 ? "none" : `1px solid ${theme.ruleSoft}`,
                }}>
                  <div style={{ fontFamily: ff.serif, fontSize: 16, color: theme.ink }}>
                    <em style={{ color: theme.terra, fontStyle: "normal" }}>{f}</em>?
                  </div>
                  <div style={{ display: "flex", gap: 6 }}>
                    {[
                      ["tasted",  true],
                      ["missed",  false],
                    ].map(([label, v]) => {
                      const isActive = tasted[f] === v;
                      return (
                        <button key={label} onClick={() => setTasted({ ...tasted, [f]: v })} style={{
                          fontFamily: ff.sans, fontSize: 11.5, letterSpacing: "0.02em",
                          padding: "5px 11px", borderRadius: 999,
                          border: `1px solid ${isActive ? (v ? theme.sageDeep : theme.terra) : theme.rule}`,
                          background: isActive ? (v ? theme.sageDeep : theme.terra) : "transparent",
                          color: isActive ? theme.cream : theme.inkSoft,
                          cursor: "pointer",
                          transition: "background 0.2s ease, color 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease",
                          boxShadow: isActive
                            ? (v ? "0 2px 6px -1px rgba(74,87,58,0.30)" : "0 2px 6px -1px rgba(176,84,47,0.30)")
                            : "0 1px 2px rgba(30,24,18,0.05)",
                        }}>{label}</button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div style={{ margin: "20px 0" }}>
          <SectionLabel n={predictedFlavors.length > 0 ? "ii" : "i"}>Rating</SectionLabel>
          <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
            {[1,2,3,4,5].map(i => (
              <button key={i} onClick={() => setTaste(i)} style={{
                background: "transparent", border: "none", cursor: "pointer",
                padding: 2, fontSize: 22, color: i <= taste ? theme.terra : theme.rule,
              }}>●</button>
            ))}
          </div>
        </div>

        <div style={{ margin: "20px 0" }}>
          <SectionLabel n={predictedFlavors.length > 0 ? "iii" : "ii"}>Notes</SectionLabel>
          <textarea
            value={note} onChange={e => setNote(e.target.value)}
            placeholder="a line or two, just for you"
            style={{
              marginTop: 8, width: "100%", minHeight: 60,
              background: "transparent", border: `1px solid ${theme.rule}`, borderRadius: 8,
              padding: 10, fontFamily: ff.serif, fontSize: 14, color: theme.ink,
              resize: "vertical", outline: "none",
            }}
          />
        </div>

        <Button
          variant="primary" tone="ink" fullWidth
          onClick={() => onSubmit({
            flavorsTasted: tasted,
            flavorsExtra: [],
            flavorsTarget: predictedFlavors,
            taste, note,
            save: true,
            rename: "",
          })}
          style={{ fontSize: 17, padding: "15px 16px", marginTop: 4 }}
        >Log it →</Button>

        <style>{`
          @keyframes sheetFadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
        `}</style>
      </div>
    </>
  );
};
