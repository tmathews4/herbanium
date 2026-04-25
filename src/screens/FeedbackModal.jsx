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

const FEATURE_OPTIONS = [
  { key: "vibe",        label: "Vibe (forward compose)" },
  { key: "blend",       label: "Blend (reverse compose)" },
  { key: "shelf",       label: "Shelf (your blends)" },
  { key: "catalogue",   label: "Catalogue (curated recipes)" },
  { key: "journal",     label: "Journal (check-ins)" },
  { key: "apothecary",  label: "Apothecary (ingredients)" },
  { key: "directions",  label: "Recommended Preparations" },
  { key: "explorer",    label: "Brewing explorer (temp/time sliders)" },
  { key: "moods",       label: "Mood / balance bars" },
  { key: "favorites",   label: "Favorites" },
  { key: "warnings",    label: "Heads-up / over-pull warnings" },
];

function buildMailtoFallback(payload) {
  // Recipient assembled at runtime so static scanners don't pick up
  // the address. Not bulletproof, but stops casual extraction.
  const local = ["tmathews", "4"].join("");
  const domain = ["gmail", "com"].join(".");
  const to = `${local}@${domain}`;
  const subject = encodeURIComponent("Herbanium feedback");
  const body = encodeURIComponent(
    `Sentiment: ${payload.sentiment}/5\n\n` +
    `Most useful: ${payload.useful.join(", ") || "(none selected)"}\n\n` +
    `Least useful: ${payload.least.join(", ") || "(none selected)"}\n\n` +
    `Bug or confusion:\n${payload.bug || "(none)"}\n\n` +
    `Wish-list:\n${payload.wish || "(none)"}\n\n` +
    `--\nSubmitted: ${payload.submittedAt}`
  );
  return `mailto:${to}?subject=${subject}&body=${body}`;
}

export const FeedbackModal = ({ onClose }) => {
  const closeRef = React.useRef(onClose);
  closeRef.current = onClose;
  const [sentiment, setSentiment] = useState(0);
  const [useful, setUseful] = useState([]);
  const [least, setLeast] = useState([]);
  const [bug, setBug] = useState("");
  const [wish, setWish] = useState("");
  const [status, setStatus] = useState(null);

  const toggle = (set, setSet, key) => {
    setSet(set.includes(key) ? set.filter(k => k !== key) : [...set, key]);
  };

  const submit = async () => {
    const payload = {
      sentiment, useful, least, bug, wish,
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

  const canSubmit = sentiment > 0 || useful.length > 0 || least.length > 0 || bug.trim() || wish.trim();

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
          color: theme.ash, lineHeight: 1.5, marginBottom: 16,
        }}>
          Anything you tell me here helps shape what gets built next. Skip whatever doesn't apply.
        </div>

        {/* Sentiment */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontFamily: ff.sans, fontSize: 10, letterSpacing: "0.16em", textTransform: "uppercase", color: theme.inkSoft, marginBottom: 6 }}>
            Overall feel
          </div>
          <div style={{ display: "flex", gap: 4 }}>
            {[1, 2, 3, 4, 5].map(n => (
              <button
                key={n}
                onClick={() => setSentiment(n)}
                style={{
                  fontSize: 22, lineHeight: 1, padding: "4px 6px",
                  background: "transparent", border: "none", cursor: "pointer",
                  color: n <= sentiment ? theme.ochre : theme.rule,
                }}
              >{n <= sentiment ? "★" : "☆"}</button>
            ))}
          </div>
        </div>

        {/* Most useful */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontFamily: ff.sans, fontSize: 10, letterSpacing: "0.16em", textTransform: "uppercase", color: theme.inkSoft, marginBottom: 6 }}>
            What's working for you?
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
            {FEATURE_OPTIONS.map(f => {
              const on = useful.includes(f.key);
              return (
                <button key={f.key} onClick={() => toggle(useful, setUseful, f.key)} style={{
                  fontFamily: ff.serif, fontSize: 12, padding: "4px 10px", borderRadius: 999,
                  background: on ? theme.sageDeep : "transparent",
                  color: on ? theme.cream : theme.inkSoft,
                  border: `1px solid ${on ? theme.sageDeep : theme.ruleSoft}`,
                  cursor: "pointer",
                }}>{f.label}</button>
              );
            })}
          </div>
        </div>

        {/* Least useful */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontFamily: ff.sans, fontSize: 10, letterSpacing: "0.16em", textTransform: "uppercase", color: theme.inkSoft, marginBottom: 6 }}>
            Anything you'd cut or never use?
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
            {FEATURE_OPTIONS.map(f => {
              const on = least.includes(f.key);
              return (
                <button key={f.key} onClick={() => toggle(least, setLeast, f.key)} style={{
                  fontFamily: ff.serif, fontSize: 12, padding: "4px 10px", borderRadius: 999,
                  background: on ? theme.terra : "transparent",
                  color: on ? theme.cream : theme.inkSoft,
                  border: `1px solid ${on ? theme.terra : theme.ruleSoft}`,
                  cursor: "pointer",
                }}>{f.label}</button>
              );
            })}
          </div>
        </div>

        {/* Bug / confusion */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontFamily: ff.sans, fontSize: 10, letterSpacing: "0.16em", textTransform: "uppercase", color: theme.inkSoft, marginBottom: 6 }}>
            Anything broken or confusing?
          </div>
          <textarea
            value={bug}
            onChange={(e) => setBug(e.target.value)}
            rows={2}
            placeholder="optional"
            style={{
              width: "100%", padding: "8px 10px", borderRadius: 8,
              background: theme.cream, border: `1px solid ${theme.ruleSoft}`,
              fontFamily: ff.serif, fontSize: 13, color: theme.ink,
              boxSizing: "border-box", outline: "none", resize: "vertical",
            }}
          />
        </div>

        {/* Wish */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontFamily: ff.sans, fontSize: 10, letterSpacing: "0.16em", textTransform: "uppercase", color: theme.inkSoft, marginBottom: 6 }}>
            What do you wish existed?
          </div>
          <textarea
            value={wish}
            onChange={(e) => setWish(e.target.value)}
            rows={2}
            placeholder="optional"
            style={{
              width: "100%", padding: "8px 10px", borderRadius: 8,
              background: theme.cream, border: `1px solid ${theme.ruleSoft}`,
              fontFamily: ff.serif, fontSize: 13, color: theme.ink,
              boxSizing: "border-box", outline: "none", resize: "vertical",
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
              background: canSubmit ? theme.ink : theme.rule,
              color: theme.cream, border: "none",
              cursor: canSubmit ? "pointer" : "default",
            }}
          >send →</button>
        </div>
      </div>
    </div>
  );
};
