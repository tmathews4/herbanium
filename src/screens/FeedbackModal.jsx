/* ──────────────────────────────────────────────────────────────
   screens/FeedbackModal.jsx — user feedback survey overlay.

   Captures structured feedback on which features land and which
   don't. Submission path:
     1. POST JSON to the Formspree endpoint. Default is the
        hardcoded production form (xpqknrpo); VITE_FEEDBACK_ENDPOINT
        overrides for staging or alternate routing.
     2. If the POST fails (network, 5xx, etc.), fall back to mailto:
        with the recipient address assembled at runtime.
   ────────────────────────────────────────────────────────────── */

// Formspree endpoint — the form id is not a secret; Formspree's spam
// and abuse controls live on their side. Override via env var for
// staging environments or routing changes.
const DEFAULT_FEEDBACK_ENDPOINT = "https://formspree.io/f/xpqknrpo";

import React, { useState } from "react";
import { ff, theme } from "../theme";

// Consolidated to 7 broad surfaces — finer-grained sub-features (favorites,
// warnings, mood/balance bars, etc.) are covered implicitly by their parent.
const FEATURE_OPTIONS = [
  { key: "compose",     label: "Composing" },
  { key: "shelf",       label: "Shelf" },
  { key: "catalog",   label: "Catalog" },
  { key: "journal",     label: "Journal" },
  { key: "apothecary",  label: "Apothecary" },
  { key: "brewing",     label: "Brewing science" },
  { key: "directions",  label: "Recommended Preparations" },
];

function buildMailtoFallback(payload) {
  const local = ["tmathews", "4"].join("");
  const domain = ["gmail", "com"].join(".");
  const to = `${local}@${domain}`;
  const subject = encodeURIComponent("Herbanium feedback");
  const body = encodeURIComponent(
    `Sentiment: ${payload.sentiment}/5\n\n` +
    `Standing out: ${payload.standout.join(", ") || "(none selected)"}\n\n` +
    `Notes:\n${payload.notes || "(none)"}\n\n` +
    `Recipe submission:\n${payload.recipe || "(none)"}\n\n` +
    `Ingredient suggestion:\n${payload.ingredient || "(none)"}\n\n` +
    `--\nSubmitted: ${payload.submittedAt}`
  );
  return `mailto:${to}?subject=${subject}&body=${body}`;
}

export const FeedbackModal = ({ onClose }) => {
  const closeRef = React.useRef(onClose);
  closeRef.current = onClose;
  const [sentiment, setSentiment] = useState(0);
  const [standout, setStandout] = useState([]);
  const [notes, setNotes] = useState("");
  const [recipe, setRecipe] = useState("");
  const [ingredient, setIngredient] = useState("");
  const [status, setStatus] = useState(null);

  const toggle = (key) => {
    setStandout(prev => prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]);
  };

  const submit = async () => {
    const payload = {
      sentiment, standout, notes, recipe, ingredient,
      submittedAt: new Date().toISOString(),
    };

    const endpoint = import.meta.env.VITE_FEEDBACK_ENDPOINT || DEFAULT_FEEDBACK_ENDPOINT;
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setStatus({ kind: "ok", text: "Thanks — feedback received." });
      // Brief pause so the user sees the confirmation, then dismiss.
      setTimeout(() => closeRef.current && closeRef.current(), 1200);
      return;
    } catch (e) {
      setStatus({ kind: "error", text: `Submit failed: ${e.message}. Opening mail client as a backup.` });
      window.location.href = buildMailtoFallback(payload);
    }
  };

  const canSubmit = sentiment > 0 || standout.length > 0 || notes.trim() || recipe.trim() || ingredient.trim();

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 200,
      background: "rgba(40, 30, 20, 0.45)",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: 16,
    }}>
      <div style={{
        background: theme.ivory,
        borderRadius: 12, maxWidth: 480, width: "100%",
        maxHeight: "90vh", overflowY: "auto",
        padding: "20px 22px 24px",
        boxShadow: "0 8px 28px rgba(0,0,0,0.18)",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 14 }}>
          <div>
            <div style={{
              fontFamily: ff.sans, fontSize: 10, letterSpacing: "0.18em",
              textTransform: "uppercase", color: theme.ash,
            }}>Feedback</div>
            <h2 style={{ fontFamily: ff.serif, fontSize: 22, fontWeight: 400, color: theme.ink, margin: "2px 0 0" }}>
              How's it going?
            </h2>
          </div>
          <button onClick={onClose} style={{
            background: "transparent", border: "none", color: theme.ash,
            fontSize: 22, lineHeight: 1, cursor: "pointer", padding: "4px 8px",
          }}>×</button>
        </div>

        <div style={{
          fontFamily: ff.serif, fontStyle: "italic", fontSize: 12.5,
          color: theme.ash, lineHeight: 1.5, marginBottom: 18,
        }}>
          Skip what doesn't apply. Anything helps.
        </div>

        {/* Sentiment + chip section, tight layout */}
        <div style={{ marginBottom: 18, display: "flex", gap: 4 }}>
          {[1, 2, 3, 4, 5].map(n => (
            <button
              key={n}
              onClick={() => setSentiment(n)}
              aria-label={`${n} of 5`}
              style={{
                fontSize: 26, lineHeight: 1, padding: "2px 4px",
                background: "transparent", border: "none", cursor: "pointer",
                color: n <= sentiment ? theme.ochre : theme.rule,
              }}
            >{n <= sentiment ? "★" : "☆"}</button>
          ))}
        </div>

        {/* Standing out */}
        <div style={{ marginBottom: 18 }}>
          <div style={{ fontFamily: ff.sans, fontSize: 10, letterSpacing: "0.16em", textTransform: "uppercase", color: theme.inkSoft, marginBottom: 8 }}>
            What's standing out?
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {FEATURE_OPTIONS.map(f => {
              const on = standout.includes(f.key);
              return (
                <button key={f.key} onClick={() => toggle(f.key)} style={{
                  fontFamily: ff.serif, fontSize: 13, padding: "5px 12px", borderRadius: 999,
                  background: on ? theme.sageDeep : "transparent",
                  color: on ? theme.cream : theme.inkSoft,
                  border: `1px solid ${on ? theme.sageDeep : theme.ruleSoft}`,
                  cursor: "pointer",
                }}>{f.label}</button>
              );
            })}
          </div>
        </div>

        {/* Free notes — single field replaces the old bug + wish split */}
        <div style={{ marginBottom: 18 }}>
          <div style={{ fontFamily: ff.sans, fontSize: 10, letterSpacing: "0.16em", textTransform: "uppercase", color: theme.inkSoft, marginBottom: 8 }}>
            Anything else?
          </div>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={4}
            placeholder="bugs, wishes, anything"
            style={{
              width: "100%", padding: "10px 12px", borderRadius: 8,
              background: theme.cream, border: `1px solid ${theme.ruleSoft}`,
              fontFamily: ff.serif, fontSize: 13.5, color: theme.ink,
              boxSizing: "border-box", outline: "none", resize: "vertical",
              lineHeight: 1.5,
            }}
          />
        </div>

        {/* Recipe submission — open invitation to send your own blend
            for possible inclusion in the curated catalog. */}
        <div style={{ marginBottom: 18 }}>
          <div style={{ fontFamily: ff.sans, fontSize: 10, letterSpacing: "0.16em", textTransform: "uppercase", color: theme.inkSoft, marginBottom: 8 }}>
            Submit your own recipe
          </div>
          <div style={{
            fontFamily: ff.serif, fontStyle: "italic", fontSize: 12,
            color: theme.ash, lineHeight: 1.45, marginBottom: 8,
          }}>
            Got a blend worth sharing? Ingredients, ratios, brew notes — whatever you'd hand a friend.
          </div>
          <textarea
            value={recipe}
            onChange={(e) => setRecipe(e.target.value)}
            rows={4}
            placeholder="name, ingredients with grams, temp & steep, what it's for"
            style={{
              width: "100%", padding: "10px 12px", borderRadius: 8,
              background: theme.cream, border: `1px solid ${theme.ruleSoft}`,
              fontFamily: ff.serif, fontSize: 13.5, color: theme.ink,
              boxSizing: "border-box", outline: "none", resize: "vertical",
              lineHeight: 1.5,
            }}
          />
        </div>

        {/* Ingredient suggestion — nominate a single herb/leaf/root for
            the compendium, separate from a full recipe submission. */}
        <div style={{ marginBottom: 18 }}>
          <div style={{ fontFamily: ff.sans, fontSize: 10, letterSpacing: "0.16em", textTransform: "uppercase", color: theme.inkSoft, marginBottom: 8 }}>
            Suggest an ingredient
          </div>
          <div style={{
            fontFamily: ff.serif, fontStyle: "italic", fontSize: 12,
            color: theme.ash, lineHeight: 1.45, marginBottom: 8,
          }}>
            Missing a herb, leaf, or root you reach for? Tell us what it is and how you use it.
          </div>
          <textarea
            value={ingredient}
            onChange={(e) => setIngredient(e.target.value)}
            rows={3}
            placeholder="name, latin if known, what it's good for, how you brew it"
            style={{
              width: "100%", padding: "10px 12px", borderRadius: 8,
              background: theme.cream, border: `1px solid ${theme.ruleSoft}`,
              fontFamily: ff.serif, fontSize: 13.5, color: theme.ink,
              boxSizing: "border-box", outline: "none", resize: "vertical",
              lineHeight: 1.5,
            }}
          />
        </div>

        {status && (
          <div style={{
            fontFamily: ff.serif, fontStyle: "italic", fontSize: 12,
            color: status.kind === "error" ? theme.terra : theme.sageDeep,
            marginBottom: 12, lineHeight: 1.45,
          }}>
            {status.text}
          </div>
        )}

        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <button onClick={onClose} style={{
            fontFamily: ff.sans, fontSize: 12, color: theme.ash,
            padding: "8px 14px", borderRadius: 999,
            background: "transparent", border: "none", cursor: "pointer",
          }}>cancel</button>
          <button
            onClick={submit}
            disabled={!canSubmit}
            style={{
              fontFamily: ff.serif, fontSize: 14,
              padding: "8px 18px", borderRadius: 999,
              // Disabled treatment matches the layout.jsx Button
              // and JournalComposer Save: theme-aware translucent
              // wash + ash text instead of the naive rule/cream
              // pair, which collapses to dark-on-dark in dark mode.
              background: canSubmit ? theme.ink : "rgba(var(--hi-rgb),0.18)",
              color: canSubmit ? theme.cream : theme.ash,
              border: canSubmit ? "none" : `1px solid ${theme.ruleSoft}`,
              cursor: canSubmit ? "pointer" : "default",
            }}
          >send →</button>
        </div>
      </div>
    </div>
  );
};
