
import React, { useState, useEffect, useRef, useCallback, createContext, useContext } from "react";
import { AnimaProvider, useQuery, useMutation, useAuth } from "@animaapp/playground-react-sdk";

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────
type Role = "analyst" | "ops" | "gov" | "dev";
type StageStatus = "pending" | "running" | "done" | "error";

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────
const ACCENT_HEX: Record<Role, string> = {
  analyst: "#38bdf8",
  ops:     "#34d399",
  gov:     "#a78bfa",
  dev:     "#fb923c",
};

const ROLES: { value: Role; label: string }[] = [
  { value: "analyst", label: "Analyst" },
  { value: "ops",     label: "Ops"     },
  { value: "gov",     label: "Gov"     },
  { value: "dev",     label: "Dev"     },
];

// ─────────────────────────────────────────────────────────────────────────────
// CONTEXT
// ─────────────────────────────────────────────────────────────────────────────
interface WorkstationCtx { role: Role; setRole: (r: Role) => void; accentHex: string; }
const WCtx = createContext<WorkstationCtx>({ role: "dev", setRole: () => {}, accentHex: "#fb923c" });
function useWS() { return useContext(WCtx); }

function WorkstationProvider({ children }: { children: React.ReactNode }) {
  const [role, setRoleState] = useState<Role>(() => {
    try {
      const s = localStorage.getItem("intellicore_role");
      if (s === "analyst" || s === "ops" || s === "gov" || s === "dev") return s;
    } catch {}
    return "dev";
  });
  const accentHex = ACCENT_HEX[role];
  useEffect(() => { document.documentElement.style.setProperty("--accent", accentHex); }, [accentHex]);
  const setRole = (r: Role) => { setRoleState(r); try { localStorage.setItem("intellicore_role", r); } catch {} };
  return <WCtx.Provider value={{ role, setRole, accentHex }}>{children}</WCtx.Provider>;
}

// ─────────────────────────────────────────────────────────────────────────────
// STYLES HELPERS
// ─────────────────────────────────────────────────────────────────────────────
const S = {
  // Layout
  fullScreen:   { minHeight: "100vh", backgroundColor: "#090a0c", color: "#d4d4d8", fontFamily: "ui-monospace, monospace" } as React.CSSProperties,
  nav:          { height: 56, borderBottom: "1px solid #27272a", backgroundColor: "rgba(12,13,15,0.95)", backdropFilter: "blur(20px)", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 24px", position: "sticky", top: 0, zIndex: 50, boxShadow: "0 4px 20px rgba(0,0,0,0.5)" } as React.CSSProperties,
  footer:       { position: "fixed", bottom: 0, left: 0, right: 0, height: 32, backgroundColor: "#0c0d0f", borderTop: "1px solid rgba(39,39,42,0.5)", padding: "0 24px", display: "flex", alignItems: "center", justifyContent: "space-between", zIndex: 50 } as React.CSSProperties,
  mainGrid:     { display: "grid", gap: 16, padding: 16, overflow: "hidden" } as React.CSSProperties,
  panel:        { backgroundColor: "rgba(16,17,20,0.8)", border: "1px solid rgba(39,39,42,0.6)", borderRadius: 2, boxShadow: "0 25px 50px rgba(0,0,0,0.5)", overflow: "hidden", backdropFilter: "blur(12px)", display: "flex", flexDirection: "column" } as React.CSSProperties,
  panelDark:    { backgroundColor: "rgba(12,13,15,0.9)", border: "1px solid rgba(39,39,42,0.6)", borderRadius: 2, boxShadow: "0 10px 30px rgba(0,0,0,0.4)", overflow: "hidden", display: "flex", flexDirection: "column" } as React.CSSProperties,
  // Text
  label:        { fontSize: 9, fontWeight: 900, textTransform: "uppercase" as const, letterSpacing: "0.25em", color: "#52525b" },
  small:        { fontSize: 8, fontWeight: 900, textTransform: "uppercase" as const, letterSpacing: "0.2em" },
  // Scroll
  scroll:       { overflowY: "auto" as const, scrollbarWidth: "none" as const },
};

// ─────────────────────────────────────────────────────────────────────────────
// KEYFRAME INJECTION
// ─────────────────────────────────────────────────────────────────────────────
const GLOBAL_CSS = `
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: #090a0c; }
  ::-webkit-scrollbar { display: none; }
  @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }
  @keyframes spin  { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
  @keyframes slideInRight { from{opacity:0;transform:translateX(100%)} to{opacity:1;transform:translateX(0)} }
  @keyframes drainBar { from{width:100%} to{width:0%} }
  .pulse { animation: pulse 2s cubic-bezier(0.4,0,0.6,1) infinite; }
  .spin  { animation: spin 0.7s linear infinite; }
  button { background: none; border: none; cursor: pointer; font-family: inherit; }
  input, textarea, select { font-family: inherit; }
`;

// ─────────────────────────────────────────────────────────────────────────────
// PANEL HEADER
// ─────────────────────────────────────────────────────────────────────────────
function PanelHeader({ title, icon, accentHex }: { title: string; icon: string; accentHex: string }) {
  return (
    <div style={{ height: 40, backgroundColor: "rgba(0,0,0,0.4)", borderBottom: "1px solid rgba(39,39,42,0.8)", padding: "0 16px", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <span style={{ fontSize: 10, fontWeight: 900, color: accentHex }}>{icon}</span>
        <h3 style={{ ...S.label, color: "#52525b" }}>{title}</h3>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <div style={{ height: 4, width: 32, backgroundColor: "#18181b", borderRadius: 9999, overflow: "hidden" }}>
          <div className="pulse" style={{ height: "100%", width: "50%", backgroundColor: `${accentHex}33` }} />
        </div>
        <div className="pulse" style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: accentHex, boxShadow: `0 0 10px ${accentHex}88` }} />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ROLE SELECTOR
// ─────────────────────────────────────────────────────────────────────────────
function RoleSelector() {
  const { role, setRole } = useWS();
  return (
    <div style={{ display: "flex", gap: 4, backgroundColor: "rgba(0,0,0,0.4)", border: "1px solid rgba(39,39,42,0.6)", borderRadius: 2, padding: 4 }}>
      {ROLES.map((r) => {
        const active = role === r.value;
        const hex = ACCENT_HEX[r.value];
        return (
          <button key={r.value} onClick={() => setRole(r.value)} style={{ padding: "4px 12px", fontSize: 9, fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.2em", borderRadius: 2, border: "1px solid transparent", transition: "all 0.2s", color: active ? hex : "#52525b", backgroundColor: active ? "#18181b" : "transparent", borderColor: active ? `${hex}55` : "transparent", boxShadow: active ? `0 0 10px ${hex}22` : "none" }}>
            {r.label}
          </button>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// VOICE CONTROL
// ─────────────────────────────────────────────────────────────────────────────
function VoiceControl() {
  const [active, setActive] = useState(false);
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 16px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <button onClick={() => setActive(v => !v)} style={{ width: 28, height: 28, borderRadius: 2, border: `1px solid ${active ? "rgba(190,18,60,0.5)" : "rgba(63,63,70,0.5)"}`, display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: active ? "rgba(136,19,55,0.4)" : "rgba(24,24,27,0.6)", color: active ? "#fb7185" : "#71717a", transition: "all 0.3s" }}>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <rect x="4" y="0.5" width="4" height="7" rx="2" fill="currentColor" />
            <path d="M2 5.5C2 8 4 9.5 6 9.5C8 9.5 10 8 10 5.5" stroke="currentColor" strokeWidth="1" fill="none" strokeLinecap="round" />
            <line x1="6" y1="9.5" x2="6" y2="11.5" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
          </svg>
        </button>
        <span style={{ ...S.label, color: active ? "#fb7185" : "#52525b" }} className={active ? "pulse" : ""}>{active ? "Voice Active" : "Voice Off"}</span>
      </div>
      {active && (
        <div style={{ display: "flex", alignItems: "flex-end", gap: 2, height: 16 }}>
          {Array.from({ length: 8 }, (_, i) => (
            <div key={i} className="pulse" style={{ width: 4, backgroundColor: "rgba(244,63,94,0.7)", borderRadius: 2, height: `${30 + Math.random() * 70}%`, animationDelay: `${i * 0.08}s` }} />
          ))}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// CRIT TOAST
// ─────────────────────────────────────────────────────────────────────────────
interface CritToastItem { id: number; text: string; type: string; ts: string; count?: number; }

function CritToast({ toasts, onDismiss }: { toasts: CritToastItem[]; onDismiss: (id: number) => void }) {
  const timersRef = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map());
  useEffect(() => {
    toasts.forEach((t) => {
      if (!timersRef.current.has(t.id)) {
        const timer = setTimeout(() => { onDismiss(t.id); timersRef.current.delete(t.id); }, 6000);
        timersRef.current.set(t.id, timer);
      }
    });
  }, [toasts, onDismiss]);
  useEffect(() => { const map = timersRef.current; return () => { map.forEach(clearTimeout); map.clear(); }; }, []);
  if (toasts.length === 0) return null;
  return (
    <div style={{ position: "fixed", top: 64, right: 16, zIndex: 9999, display: "flex", flexDirection: "column", gap: 8, pointerEvents: "none" }}>
      {toasts.map((t) => (
        <div key={t.id} style={{ pointerEvents: "auto", display: "flex", alignItems: "flex-start", gap: 12, width: 320, borderRadius: 2, border: "1px solid rgba(244,63,94,0.6)", backgroundColor: "rgba(15,6,8,0.95)", backdropFilter: "blur(20px)", padding: "12px 16px", boxShadow: "0 0 0 1px rgba(244,63,94,0.3), 0 0 30px rgba(244,63,94,0.18)", animation: "slideInRight 0.25s ease-out" }}>
          <div className="pulse" style={{ flexShrink: 0, marginTop: 2, width: 4, alignSelf: "stretch", borderRadius: 9999, backgroundColor: "#f43f5e" }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 4 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span className="pulse" style={{ color: "#fb7185", fontSize: 9, fontWeight: 900, letterSpacing: "0.2em" }}>⚠ CRIT</span>
                <span style={{ color: "#3f3f46", fontSize: 8, fontWeight: 900, letterSpacing: "0.15em", textTransform: "uppercase" }}>{t.type}</span>
                {t.count && t.count > 1 && (
                  <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", borderRadius: 9999, backgroundColor: "#e11d48", color: "#fff", fontWeight: 900, fontSize: 8, minWidth: 16, height: 16, padding: "0 4px" }}>×{t.count}</span>
                )}
              </div>
              <span style={{ color: "#3f3f46", fontSize: 8, fontFamily: "monospace" }}>{t.ts}</span>
            </div>
            <p style={{ color: "#ffe4e6", fontSize: 10, fontFamily: "monospace", lineHeight: 1.5 }}>{t.text}</p>
            <div style={{ marginTop: 8, height: 2, width: "100%", backgroundColor: "#18181b", borderRadius: 9999, overflow: "hidden" }}>
              <div style={{ height: "100%", backgroundColor: "#f43f5e", borderRadius: 9999, animation: "drainBar 6s linear forwards" }} />
            </div>
          </div>
          <button onClick={() => onDismiss(t.id)} style={{ flexShrink: 0, marginTop: 2, color: "#52525b", fontSize: 16, fontWeight: 900, lineHeight: 1, transition: "color 0.2s" }} onMouseEnter={e => (e.currentTarget.style.color = "#fb7185")} onMouseLeave={e => (e.currentTarget.style.color = "#52525b")}>×</button>
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// CHAT PANEL
// ─────────────────────────────────────────────────────────────────────────────
const CORA_REPLIES: Record<Role, string[]> = {
  analyst: ["Running predictive model on Q3 data — confidence interval 94.2%.", "Anomaly detected in revenue stream B. Flagging for deeper inspection.", "Correlation matrix updated. Two new signal clusters identified.", "Recommendation: shift allocation ratio to 60/40 per latest telemetry."],
  ops:     ["All 14 nodes reporting nominal. Zero latency spikes in last 15 min.", "Auto-scaling triggered on Cluster-7. Load distributed across 3 replicas.", "Pipeline flush complete. Throughput restored to baseline.", "Alert suppressed — root cause traced to scheduled maintenance window."],
  gov:     ["Sovereignty gate verified. Credentials match L4 clearance profile.", "Policy delta flagged: Article 9 override requires dual confirmation.", "Audit trail sealed for session 4482. Hash committed to ledger.", "Compliance check passed. 3 minor deviations logged for review."],
  dev:     ["Intent parsed. Synthesising architecture blueprint now.", "AST compiled — 18 artifact files queued for sandbox validation.", "SecurePact passed. Risk score: 0.12. Proceeding to policy gate.", "StratEx hotpath registered. Deployment endpoint live on staging.", "Cognitive skill registered. Endpoint available via POST /api/skills."],
};

const LS_CHAT_KEY = "intellicore_chat_history";
interface LocalMsg { localId: number; from: "user" | "cora"; text: string; ts: string; streaming?: boolean; }
let msgIdCounter = 100;
function nowTs() { return new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }); }
function charDelay(ch: string, next?: string): number {
  if (ch === "." || ch === "!" || ch === "?") return 120 + Math.random() * 80;
  if (ch === ",") return 55 + Math.random() * 30;
  if (ch === " ") return 18 + Math.random() * 12;
  if (next && next === next.toUpperCase() && next.match(/[A-Z]/)) return 38 + Math.random() * 20;
  return 22 + Math.random() * 16;
}

function ChatPanel() {
  const { accentHex, role } = useWS();
  const { isAnonymous } = useAuth();
  const { data: sdkMessages, isPending: loadingMsgs } = useQuery("ChatMessage", { orderBy: { createdAt: "asc" }, limit: 60 });
  const { create: createMsg } = useMutation("ChatMessage");
  const [messages, setMessages] = useState<LocalMsg[]>(() => {
    try {
      const raw = localStorage.getItem(LS_CHAT_KEY);
      if (raw) { const p = JSON.parse(raw); if (Array.isArray(p) && p.length) return p; }
    } catch {}
    return [];
  });
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const streamRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const seededRef = useRef(false);

  useEffect(() => {
    if (!loadingMsgs && sdkMessages && !seededRef.current) {
      seededRef.current = true;
      try { const r = localStorage.getItem(LS_CHAT_KEY); if (r && JSON.parse(r)?.length) return; } catch {}
      if (sdkMessages.length > 0) {
        const h = sdkMessages.map((m, i) => ({ localId: i + 1, from: m.from as "user" | "cora", text: m.text, ts: m.ts }));
        setMessages(h);
        try { localStorage.setItem(LS_CHAT_KEY, JSON.stringify(h)); } catch {}
      } else {
        const init: LocalMsg[] = [{ localId: 1, from: "cora", text: "Neural interface online. How can I assist?", ts: nowTs() }];
        setMessages(init);
        try { localStorage.setItem(LS_CHAT_KEY, JSON.stringify(init)); } catch {}
      }
    }
  }, [loadingMsgs, sdkMessages]);

  useEffect(() => {
    if (!messages.length) return;
    if (!messages.some(m => m.streaming)) {
      try { localStorage.setItem(LS_CHAT_KEY, JSON.stringify(messages.filter(m => !m.streaming).slice(-200))); } catch {}
    }
  }, [messages]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);
  useEffect(() => () => { if (streamRef.current) clearTimeout(streamRef.current); }, []);

  function streamReply(fullText: string) {
    const id = ++msgIdCounter;
    const ts = nowTs();
    setMessages(m => [...m, { localId: id, from: "cora", text: "", ts, streaming: true }]);
    let charIndex = 0;
    function tick() {
      charIndex++;
      const partial = fullText.slice(0, charIndex);
      const done = charIndex >= fullText.length;
      setMessages(m => m.map(msg => msg.localId === id ? { ...msg, text: partial, streaming: !done } : msg));
      if (!done) { streamRef.current = setTimeout(tick, charDelay(fullText[charIndex - 1], fullText[charIndex])); }
      else if (!isAnonymous) { createMsg({ from: "cora", text: fullText, ts }).catch(() => {}); }
    }
    streamRef.current = setTimeout(tick, 400 + Math.random() * 400);
  }

  function send() {
    if (!input.trim()) return;
    const text = input.trim(), ts = nowTs();
    setMessages(m => [...m, { localId: ++msgIdCounter, from: "user", text, ts }]);
    setInput("");
    if (!isAnonymous) createMsg({ from: "user", text, ts }).catch(() => {});
    streamReply(CORA_REPLIES[role][Math.floor(Math.random() * CORA_REPLIES[role].length)]);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <div style={{ ...S.scroll, flex: 1, padding: "12px 16px", display: "flex", flexDirection: "column", gap: 12 }}>
        {loadingMsgs && !messages.length && <div style={{ fontSize: 10, color: "#52525b", fontStyle: "italic" }}>Loading history…</div>}
        {messages.map(msg => (
          <div key={msg.localId} style={{ display: "flex", justifyContent: msg.from === "user" ? "flex-end" : "flex-start" }}>
            <div style={{ maxWidth: "85%", padding: "8px 12px", borderRadius: 2, fontSize: 11, lineHeight: 1.6, fontFamily: "monospace", ...(msg.from === "user" ? { backgroundColor: "#27272a", color: "#e4e4e7", border: "1px solid rgba(63,63,70,0.5)" } : { backgroundColor: "rgba(24,24,27,0.8)", color: accentHex, border: `1px solid ${accentHex}33` }) }}>
              <div>{msg.text}{msg.streaming && <span className="pulse" style={{ display: "inline-block", width: 6, height: 10, marginLeft: 2, verticalAlign: "middle", backgroundColor: accentHex, opacity: 0.85 }} />}</div>
              <div style={{ fontSize: 8, color: "#52525b", marginTop: 4, textAlign: "right" }}>{msg.ts}</div>
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
      <div style={{ borderTop: "1px solid rgba(39,39,42,0.6)", padding: 12, display: "flex", gap: 8 }}>
        <input style={{ flex: 1, backgroundColor: "#18181b", border: "1px solid rgba(63,63,70,0.6)", borderRadius: 2, padding: "8px 12px", fontSize: 11, color: "#e4e4e7", outline: "none", fontFamily: "monospace", transition: "border-color 0.3s" }} placeholder="Send directive to Cora..." value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === "Enter" && send()} onFocus={e => (e.currentTarget.style.borderColor = `${accentHex}66`)} onBlur={e => (e.currentTarget.style.borderColor = "rgba(63,63,70,0.6)")} />
        <button onClick={send} style={{ padding: "8px 12px", fontSize: 10, fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.15em", borderRadius: 2, border: `1px solid ${accentHex}55`, color: accentHex, backgroundColor: `${accentHex}14`, transition: "opacity 0.3s" }} onMouseEnter={e => (e.currentTarget.style.opacity = "0.7")} onMouseLeave={e => (e.currentTarget.style.opacity = "1")}>TX</button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SYSTEM MONITOR
// ─────────────────────────────────────────────────────────────────────────────
function SystemMonitor() {
  const [metrics, setMetrics] = useState([
    { label: "CPU",    value: 42, unit: "%",    color: "#06b6d4", max: 100 },
    { label: "MEM",    value: 61, unit: "%",    color: "#8b5cf6", max: 100 },
    { label: "GPU",    value: 78, unit: "%",    color: "#10b981", max: 100 },
    { label: "NET I/O",value: 23, unit: "MB/s", color: "#f59e0b", max: 500 },
  ]);
  useEffect(() => {
    const t = setInterval(() => setMetrics(prev => prev.map(m => ({ ...m, value: m.label === "NET I/O" ? Math.floor(Math.random() * 110 + 10) : Math.min(100, Math.max(5, m.value + Math.floor(Math.random() * 17 - 8))) }))), 1800);
    return () => clearInterval(t);
  }, []);
  return (
    <div style={{ ...S.scroll, flex: 1, padding: 16, display: "flex", flexDirection: "column", gap: 16 }}>
      {metrics.map(m => (
        <div key={m.label}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 9, fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.2em", marginBottom: 6 }}>
            <span style={{ color: "#52525b" }}>{m.label}</span>
            <span style={{ color: m.color }}>{m.value}<span style={{ color: "#3f3f46", marginLeft: 2 }}>{m.unit}</span></span>
          </div>
          <div style={{ height: 6, backgroundColor: "#18181b", borderRadius: 9999, overflow: "hidden" }}>
            <div style={{ height: "100%", backgroundColor: m.color, width: `${(m.value / m.max) * 100}%`, borderRadius: 9999, transition: "width 0.7s" }} />
          </div>
        </div>
      ))}
      <div style={{ paddingTop: 8, borderTop: "1px solid rgba(39,39,42,0.4)" }}>
        <div style={{ fontSize: 8, color: "#3f3f46", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.2em", marginBottom: 8 }}>Thread Activity</div>
        <div style={{ display: "flex", gap: 2, height: 32, alignItems: "flex-end" }}>
          {Array.from({ length: 32 }, (_, i) => (
            <div key={i} style={{ flex: 1, backgroundColor: "rgba(8,145,178,0.6)", borderRadius: 2, height: `${20 + Math.random() * 80}%`, opacity: 0.5 + Math.random() * 0.5 }} />
          ))}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TELEMETRY PANEL
// ─────────────────────────────────────────────────────────────────────────────
function TelemetryPanel() {
  const { accentHex } = useWS();
  const [tickers, setTickers] = useState([
    { symbol: "REV/Q", value: 4.82, delta: 0.12 },
    { symbol: "BURN",  value: 1.15, delta: -0.03 },
    { symbol: "LTV",   value: 3.41, delta: 0.07 },
    { symbol: "CAC",   value: 0.89, delta: 0.02 },
  ]);
  const [ops, setOps] = useState({ latency: 12, throughput: 4410, errors: 0 });
  useEffect(() => {
    const t = setInterval(() => {
      setTickers(prev => prev.map(tk => { const c = +(Math.random() * 0.3 - 0.15).toFixed(2); return { ...tk, value: +(tk.value + c).toFixed(2), delta: c }; }));
      setOps({ latency: +(Math.random() * 20 + 8).toFixed(1), throughput: Math.floor(Math.random() * 1500 + 3500), errors: Math.random() > 0.92 ? 1 : 0 });
    }, 2000);
    return () => clearInterval(t);
  }, []);
  return (
    <div style={{ padding: 12, display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        {tickers.map(tk => (
          <div key={tk.symbol} style={{ backgroundColor: "rgba(0,0,0,0.3)", border: "1px solid rgba(39,39,42,0.5)", borderRadius: 2, padding: "8px 10px" }}>
            <div style={{ fontSize: 8, fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.2em", color: "#52525b", marginBottom: 2 }}>{tk.symbol}</div>
            <div style={{ fontSize: 13, fontWeight: 900, color: "#e4e4e7", fontVariantNumeric: "tabular-nums" }}>{tk.value}M</div>
            <div style={{ fontSize: 8, fontWeight: 900, color: tk.delta >= 0 ? "#34d399" : "#fb7185", fontVariantNumeric: "tabular-nums" }}>{tk.delta >= 0 ? "▲" : "▼"} {Math.abs(tk.delta)}</div>
          </div>
        ))}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 9, paddingTop: 4, borderTop: "1px solid rgba(39,39,42,0.4)" }}>
        <div><span style={{ color: "#52525b" }}>Latency</span><span style={{ marginLeft: 6, fontWeight: 900, color: ops.latency > 20 ? "#fbbf24" : "#34d399" }}>{ops.latency}ms</span></div>
        <div><span style={{ color: "#52525b" }}>Thruput</span><span style={{ marginLeft: 6, fontWeight: 900, color: accentHex }}>{ops.throughput.toLocaleString()}/s</span></div>
        <div><span style={{ color: "#52525b" }}>Err</span><span style={{ marginLeft: 6, fontWeight: 900, color: ops.errors > 0 ? "#fb7185" : "#52525b" }} className={ops.errors > 0 ? "pulse" : ""}>{ops.errors}</span></div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SKILLS DISCOVERY
// ─────────────────────────────────────────────────────────────────────────────
const SEED_SKILLS = [
  { skillName: "Predictive Analytics",    category: "inference", level: 94, active: true,  endpoint: "/api/skills/predictive" },
  { skillName: "Time-Series Forecasting", category: "inference", level: 88, active: true,  endpoint: "/api/skills/timeseries" },
  { skillName: "NLP Summarization",       category: "language",  level: 76, active: true,  endpoint: "/api/skills/nlp"        },
  { skillName: "Anomaly Detection",       category: "safety",    level: 91, active: true,  endpoint: "/api/skills/anomaly"    },
  { skillName: "Risk Scoring Engine",     category: "finance",   level: 83, active: false, endpoint: "/api/skills/risk"       },
  { skillName: "Policy Compliance Layer", category: "gov",       level: 70, active: false, endpoint: "/api/skills/policy"     },
  { skillName: "Auto-Scaling Director",   category: "ops",       level: 97, active: true,  endpoint: "/api/skills/autoscale"  },
  { skillName: "Network Mesh Monitor",    category: "ops",       level: 85, active: true,  endpoint: "/api/skills/netmesh"    },
];
const CAT_COLOR: Record<string, string> = { inference: "#22d3ee", language: "#a78bfa", safety: "#fb7185", finance: "#fbbf24", gov: "#34d399", ops: "#60a5fa" };

function SkillsDiscovery() {
  const { accentHex } = useWS();
  const { data: sdkSkills, isPending } = useQuery("CognitiveSkill", { orderBy: { level: "desc" } });
  const { create, update } = useMutation("CognitiveSkill");
  const [seeded, setSeeded] = useState(false);
  useEffect(() => {
    if (!isPending && sdkSkills && sdkSkills.length === 0 && !seeded) {
      setSeeded(true);
      SEED_SKILLS.forEach(s => create(s).catch(() => {}));
    }
  }, [isPending, sdkSkills, seeded, create]);

  return (
    <div style={{ padding: 12, display: "flex", flexDirection: "column", gap: 8 }}>
      {isPending && <div style={{ fontSize: 10, color: "#52525b", fontStyle: "italic" }}>Loading skills…</div>}
      {(sdkSkills ?? []).map(s => (
        <div key={s.id} onClick={() => update(s.id, { active: !s.active }).catch(() => {})} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: 8, borderRadius: 2, border: `1px solid ${s.active ? "rgba(63,63,70,0.5)" : "rgba(39,39,42,0.3)"}`, backgroundColor: s.active ? "rgba(24,24,27,0.6)" : "rgba(9,10,12,0.4)", opacity: s.active ? 1 : 0.5, cursor: "pointer", transition: "all 0.2s" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%", flexShrink: 0, backgroundColor: s.active ? accentHex : "#3f3f46", boxShadow: s.active ? `0 0 6px ${accentHex}88` : "none", transition: "all 0.3s" }} />
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 10, fontWeight: 900, color: "#d4d4d8", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.skillName}</div>
              <div style={{ fontSize: 8, fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.15em", color: CAT_COLOR[s.category] ?? "#52525b" }}>{s.category}</div>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0, marginLeft: 8 }}>
            <div style={{ width: 48, height: 4, backgroundColor: "#27272a", borderRadius: 9999, overflow: "hidden" }}>
              <div style={{ height: "100%", backgroundColor: `${accentHex}bb`, width: `${s.level}%`, borderRadius: 9999 }} />
            </div>
            <span style={{ fontSize: 8, color: "#52525b", fontVariantNumeric: "tabular-nums", width: 20, textAlign: "right" }}>{s.level}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// EVENT BUS CONTAINER
// ─────────────────────────────────────────────────────────────────────────────
const EVENT_POOL: Record<Role, { text: string; type: string }[]> = {
  analyst: [{ text: "Signal convergence on asset cluster Δ-7", type: "SIGNAL_CONV" }, { text: "Regression model re-fitted — RMSE: 0.0042", type: "MODEL_FIT" }, { text: "New data partition ingested: 2.4M rows", type: "DATA_INGEST" }, { text: "Outlier threshold breach on KPI-14", type: "OUTLIER_BREACH" }, { text: "Backtesting pass complete — Sharpe: 1.82", type: "BACKTEST_DONE" }],
  ops:     [{ text: "Node ATL-03 heartbeat restored", type: "NODE_HEARTBEAT" }, { text: "Rate limiter triggered on API gateway", type: "RATE_LIMIT" }, { text: "Circuit breaker opened — service mesh rerouted", type: "CIRCUIT_BREAK" }, { text: "Disk I/O spike on Vol-B detected", type: "DISK_SPIKE" }, { text: "Auto-heal completed on shard-replica-2", type: "AUTO_HEAL" }],
  gov:     [{ text: "Session token rotated — 4-hr TTL applied", type: "TOKEN_ROTATED" }, { text: "Policy mutation request queued for review", type: "POLICY_MUTATION" }, { text: "Read-only audit snapshot committed", type: "AUDIT_SNAPSHOT" }, { text: "Regulatory flag: SEC-17a-4 compliance check", type: "COMPLIANCE_CHECK" }, { text: "Dual-confirm required for Override-9", type: "DUAL_CONFIRM" }],
  dev:     [{ text: "BUILD_STARTED — intent received by orchestrator", type: "BUILD_STARTED" }, { text: "INTENT_ROUTED — task queued in StratEx", type: "INTENT_ROUTED" }, { text: "ARCHITECTURE_RESOLVED — microservice graph ready", type: "ARCHITECTURE_RESOLVED" }, { text: "AST_GENERATED — 18 artifacts compiled", type: "AST_GENERATED" }, { text: "SECURITY_VALIDATION — SecurePact approved", type: "SECURITY_VALIDATION" }, { text: "SANDBOX_RESULT — risk score: 0.11", type: "SANDBOX_RESULT" }, { text: "POLICY_DECISION — deployment approved", type: "POLICY_DECISION" }, { text: "SKILL_REGISTERED — endpoint live", type: "SKILL_REGISTERED" }, { text: "BILLING_EVENT — $0.042 charged", type: "BILLING_EVENT" }, { text: "BUILD_COMPLETED — system online", type: "BUILD_COMPLETED" }],
};

interface LocalEvent { id: number; level: "INFO" | "WARN" | "CRIT"; text: string; ts: string; type: string; }
let eIdCounter = 200;
function makeEvent(role: Role): LocalEvent {
  const pool = EVENT_POOL[role];
  const levels: LocalEvent["level"][] = ["INFO", "INFO", "INFO", "WARN", "CRIT"];
  const entry = pool[Math.floor(Math.random() * pool.length)];
  return { id: ++eIdCounter, level: levels[Math.floor(Math.random() * levels.length)], text: entry.text, type: entry.type, ts: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }) };
}

function EventBusContainer() {
  const { accentHex, role } = useWS();
  const { create: createEvent } = useMutation("SystemEvent");
  const [events, setEvents] = useState<LocalEvent[]>(() => Array.from({ length: 5 }, () => makeEvent(role)));
  const [critToasts, setCritToasts] = useState<CritToastItem[]>([]);
  const dismissToast = useCallback((id: number) => setCritToasts(prev => prev.filter(t => t.id !== id)), []);
  useEffect(() => {
    const t = setInterval(() => {
      const ev = makeEvent(role);
      setEvents(prev => [ev, ...prev].slice(0, 40));
      if (ev.level === "CRIT") setCritToasts(prev => [{ id: ev.id, text: ev.text, type: ev.type, ts: ev.ts }, ...prev].slice(0, 5));
      createEvent({ level: ev.level, text: ev.text, type: ev.type, ts: ev.ts }).catch(() => {});
    }, 2500 + Math.random() * 1500);
    return () => clearInterval(t);
  }, [role]);

  return (
    <>
      <CritToast toasts={critToasts} onDismiss={dismissToast} />
      <div style={{ height: "100%", overflowY: "auto", padding: "8px 12px", display: "flex", flexDirection: "column", gap: 4, scrollbarWidth: "none", fontFamily: "monospace" }}>
        {events.map(e => (
          <div key={e.id} style={{ display: "flex", alignItems: "flex-start", gap: 8, fontSize: 9, lineHeight: 1.5 }}>
            <span style={{ color: "#3f3f46", fontVariantNumeric: "tabular-nums", flexShrink: 0 }}>{e.ts}</span>
            <span style={{ fontWeight: 900, flexShrink: 0, color: e.level === "INFO" ? accentHex : e.level === "WARN" ? "#fbbf24" : "#fb7185" }}>[{e.level}]</span>
            <span style={{ color: "#a1a1aa" }}>{e.text}</span>
          </div>
        ))}
      </div>
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// BUILD PANEL (analyst / ops / gov)
// ─────────────────────────────────────────────────────────────────────────────
interface BPStage { id: string; label: string; duration: number; }
interface BPPreset { id: string; label: string; description: string; stages: BPStage[]; }
const BP_PRESETS: Record<Exclude<Role,"dev">, BPPreset[]> = {
  analyst: [
    { id: "quant-scan",   label: "Quant Scan",        description: "Full quantitative signal scan with model selection and validation", stages: [{ id:"parse",label:"Parse Directives",duration:900},{id:"model",label:"Model Selection",duration:1400},{id:"quant",label:"Quant Signal Scan",duration:3600},{id:"validate",label:"Output Validation",duration:1200},{id:"export",label:"Export Results",duration:800}] },
    { id: "factor-deep",  label: "Factor Deep Dive",  description: "Multi-factor alpha decomposition across asset classes", stages: [{id:"parse",label:"Parse Directives",duration:700},{id:"factors",label:"Factor Extraction",duration:2400},{id:"decomp",label:"Alpha Decomposition",duration:4000},{id:"validate",label:"Validate Exposures",duration:1400},{id:"report",label:"Generate Report",duration:900}] },
    { id: "risk-audit",   label: "Risk Audit",         description: "Tail-risk and drawdown stress test for active portfolios", stages: [{id:"parse",label:"Parse Directives",duration:600},{id:"stress",label:"Stress Scenarios",duration:2800},{id:"tail",label:"Tail Risk Calc",duration:3200},{id:"validate",label:"Output Validation",duration:1000},{id:"deploy",label:"Publish Risk Report",duration:700}] },
  ],
  ops: [
    { id: "full-deploy",  label: "Full Deploy",        description: "End-to-end build, test, and deployment to production network", stages: [{id:"parse",label:"Parse Directives",duration:1400},{id:"model",label:"Model Selection",duration:1800},{id:"exec",label:"Strategy Execution",duration:3200},{id:"validate",label:"Output Validation",duration:1600},{id:"deploy",label:"Deploy to Network",duration:2200}] },
    { id: "smoke-test",   label: "Smoke Test",         description: "Rapid dependency checks and health probes only", stages: [{id:"parse",label:"Parse Config",duration:500},{id:"probe",label:"Health Probes",duration:1200},{id:"deps",label:"Dependency Check",duration:900},{id:"report",label:"Emit Status Report",duration:400}] },
    { id: "canary",       label: "Canary Release",     description: "Staged rollout with traffic splitting and rollback gate", stages: [{id:"parse",label:"Parse Directives",duration:800},{id:"build",label:"Build Artifact",duration:2000},{id:"canary",label:"Canary Slice 10%",duration:3000},{id:"validate",label:"Validate Metrics",duration:1800},{id:"promote",label:"Promote to 100%",duration:1200}] },
  ],
  gov: [
    { id: "audit-run",    label: "Audit Run",          description: "Compliance audit trail generation with policy gate review", stages: [{id:"parse",label:"Parse Directives",duration:1000},{id:"classify",label:"Data Classification",duration:1600},{id:"policy",label:"Policy Gate Review",duration:2800},{id:"audit",label:"Audit Trail Emit",duration:2000},{id:"sign",label:"Digital Signature",duration:1200}] },
    { id: "compliance",   label: "Compliance Sweep",   description: "Cross-jurisdiction regulatory check across all active positions", stages: [{id:"parse",label:"Parse Directives",duration:700},{id:"regs",label:"Regulation Mapping",duration:2200},{id:"scan",label:"Compliance Scan",duration:3400},{id:"validate",label:"Flag Exceptions",duration:1400},{id:"report",label:"Publish Compliance Log",duration:900}] },
    { id: "red-team",     label: "Red Team Probe",     description: "Adversarial governance simulation against policy engine", stages: [{id:"parse",label:"Parse Directives",duration:600},{id:"attack",label:"Adversarial Vectors",duration:3800},{id:"policy",label:"Policy Stress Test",duration:3000},{id:"trace",label:"Dependency Trace",duration:1600},{id:"report",label:"Red Team Report",duration:1000}] },
  ],
};

function BuildPanel() {
  const { accentHex, role } = useWS();
  const presets = role !== "dev" ? BP_PRESETS[role as Exclude<Role,"dev">] : [];
  const [activePreset, setActivePreset] = useState<BPPreset | null>(presets[0] ?? null);
  const [stages, setStages] = useState<BPStage[]>(presets[0]?.stages ?? []);
  const [statuses, setStatuses] = useState<StageStatus[]>((presets[0]?.stages ?? []).map(() => "pending"));
  const [progress, setProgress] = useState<number[]>((presets[0]?.stages ?? []).map(() => 0));
  const [running, setRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const rafRef = useRef<number | null>(null);
  const stageRef = useRef<{ start: number; idx: number } | null>(null);

  useEffect(() => {
    const p = role !== "dev" ? BP_PRESETS[role as Exclude<Role,"dev">] : [];
    const first = p[0] ?? null;
    setActivePreset(first);
    const s = first?.stages ?? [];
    setStages(s); hardReset(s);
  }, [role]);

  function hardReset(s: BPStage[]) {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    stageRef.current = null;
    setStatuses(s.map(() => "pending")); setProgress(s.map(() => 0));
    setRunning(false); setSelected(null); setElapsed(0);
  }

  function selectPreset(p: BPPreset) {
    if (running) return;
    setActivePreset(p); setStages(p.stages); hardReset(p.stages);
  }

  function runPipeline() {
    hardReset(stages);
    setRunning(true);
    const startT = performance.now();
    const elapsedRaf = () => { setElapsed(Math.floor((performance.now() - startT) / 1000)); requestAnimationFrame(elapsedRaf); };
    requestAnimationFrame(elapsedRaf);
    setTimeout(() => startStage(0), 50);
  }

  function startStage(idx: number) {
    if (idx >= stages.length) { setRunning(false); return; }
    setStatuses(prev => { const n = [...prev]; n[idx] = "running"; return n; });
    setSelected(idx);
    stageRef.current = { start: performance.now(), idx };
    const dur = stages[idx].duration;
    function animate() {
      if (!stageRef.current || stageRef.current.idx !== idx) return;
      const pct = Math.min((performance.now() - stageRef.current.start) / dur, 1);
      setProgress(prev => { const n = [...prev]; n[idx] = pct; return n; });
      if (pct < 1) { rafRef.current = requestAnimationFrame(animate); }
      else { setStatuses(prev => { const n = [...prev]; n[idx] = "done"; return n; }); startStage(idx + 1); }
    }
    rafRef.current = requestAnimationFrame(animate);
  }

  const allDone = statuses.every(s => s === "done");

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
      {presets.length > 0 && (
        <div style={{ padding: "12px 16px 8px", borderBottom: "1px solid rgba(39,39,42,0.5)", backgroundColor: "rgba(0,0,0,0.2)" }}>
          <div style={{ ...S.label, marginBottom: 8 }}>Strategy Preset</div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {presets.map(p => {
              const isA = activePreset?.id === p.id;
              return <button key={p.id} onClick={() => selectPreset(p)} disabled={running} title={p.description} style={{ padding: "4px 12px", fontSize: 9, fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.15em", borderRadius: 2, border: `1px solid ${isA ? `${accentHex}66` : "#3f3f46"}`, color: isA ? accentHex : "#71717a", backgroundColor: isA ? `${accentHex}18` : "transparent", boxShadow: isA ? `0 0 8px ${accentHex}22` : "none", opacity: running ? 0.4 : 1, cursor: running ? "not-allowed" : "pointer", transition: "all 0.2s" }}>{p.label}</button>;
            })}
          </div>
          {activePreset && <p style={{ fontSize: 8, color: "#52525b", fontStyle: "italic", marginTop: 6, lineHeight: 1.4 }}>{activePreset.description}</p>}
        </div>
      )}
      <div style={{ padding: "10px 16px", borderBottom: "1px solid rgba(39,39,42,0.5)", backgroundColor: "rgba(0,0,0,0.2)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ fontSize: 9, fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.2em" }}>
          {running ? <span style={{ color: "#a1a1aa" }}>Elapsed: <span style={{ color: "#e4e4e7" }}>{elapsed}s</span></span> : allDone ? <span style={{ color: "#34d399" }}>✓ Pipeline Complete</span> : <span style={{ color: "#52525b" }}>Ready to Execute</span>}
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {(running || allDone) && <button onClick={() => hardReset(stages)} style={{ fontSize: 9, fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.15em", padding: "6px 12px", borderRadius: 2, border: "1px solid #3f3f46", color: "#71717a", cursor: "pointer", transition: "all 0.2s" }}>Reset</button>}
          <button onClick={runPipeline} disabled={running} style={{ fontSize: 9, fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.15em", padding: "6px 16px", borderRadius: 2, border: `1px solid ${running ? "#27272a" : `${accentHex}55`}`, color: running ? "#52525b" : accentHex, cursor: running ? "not-allowed" : "pointer", boxShadow: running ? "none" : `0 0 12px ${accentHex}22`, transition: "all 0.3s" }}>
            {running ? "Running…" : allDone ? "Re-Run" : "▶ Run Pipeline"}
          </button>
        </div>
      </div>
      <div style={{ ...S.scroll, flex: 1, padding: 16, display: "flex", flexDirection: "column", gap: 8 }}>
        {stages.map((s, i) => {
          const st = statuses[i], pct = progress[i], isSel = selected === i;
          return (
            <button key={s.id} onClick={() => setSelected(i)} style={{ width: "100%", display: "flex", flexDirection: "column", padding: "10px 12px", borderRadius: 2, border: `1px solid ${st === "done" ? "rgba(5,150,105,0.4)" : st === "running" ? "rgba(63,63,70,0.6)" : "rgba(39,39,42,0.4)"}`, backgroundColor: st === "done" ? "rgba(6,78,59,0.3)" : st === "running" ? "rgba(24,24,27,0.4)" : "rgba(24,24,27,0.2)", textAlign: "left", cursor: "pointer", outline: isSel ? "1px solid rgba(255,255,255,0.1)" : "none", position: "relative", overflow: "hidden", transition: "all 0.3s" }}>
              {st === "running" && <div style={{ position: "absolute", inset: 0, width: `${pct * 100}%`, backgroundColor: `${accentHex}0f`, pointerEvents: "none" }} />}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", position: "relative" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <span style={{ fontSize: 9, color: "#52525b", fontWeight: 900, width: 16, textAlign: "right" }}>{String(i + 1).padStart(2, "0")}</span>
                  {st === "done" ? <span style={{ color: "#34d399", fontSize: 10, fontWeight: 900 }}>✓</span> : st === "running" ? <span className="pulse" style={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: accentHex, display: "inline-block", flexShrink: 0 }} /> : <span style={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: "#3f3f46", display: "inline-block", flexShrink: 0 }} />}
                  <span style={{ fontSize: 10, fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.15em", color: st === "done" ? "#34d399" : st === "running" ? "#f4f4f5" : "#52525b", transition: "color 0.3s" }}>{s.label}</span>
                </div>
                <span style={{ fontSize: 8, fontWeight: 900, color: st === "done" ? "#059669" : st === "running" ? "#a1a1aa" : "#3f3f46" }}>{st === "running" ? `${Math.round(pct * 100)}%` : st}</span>
              </div>
              {(st === "running" || (st === "done" && pct > 0)) && <div style={{ marginTop: 8, height: 2, width: "100%", backgroundColor: "#18181b", borderRadius: 9999, overflow: "hidden" }}><div style={{ height: "100%", borderRadius: 9999, width: `${pct * 100}%`, backgroundColor: st === "done" ? "#34d399" : accentHex, boxShadow: st === "running" ? `0 0 6px ${accentHex}` : "none" }} /></div>}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// COGNITIVE SANDBOX (dev right panel)
// ─────────────────────────────────────────────────────────────────────────────
function CognitiveSandboxPanel() {
  const { accentHex } = useWS();
  const [activeTest, setActiveTest] = useState<number | null>(null);
  const tests = [{ id: 0, label: "Inference_Probe", status: "IDLE" }, { id: 1, label: "Adversarial_Fuzz", status: "READY" }, { id: 2, label: "Latency_Stress", status: "QUEUED" }, { id: 3, label: "Drift_Monitor", status: "IDLE" }];
  return (
    <div style={{ ...S.scroll, flex: 1, padding: 12, display: "flex", flexDirection: "column", gap: 8 }}>
      {tests.map(t => (
        <button key={t.id} onClick={() => setActiveTest(activeTest === t.id ? null : t.id)} style={{ width: "100%", textAlign: "left", padding: "8px 12px", borderRadius: 2, border: "1px solid rgba(39,39,42,0.6)", backgroundColor: "rgba(0,0,0,0.2)", cursor: "pointer", transition: "background 0.2s" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ ...S.label, color: "#a1a1aa" }}>{t.label}</span>
            <span style={{ ...S.small, padding: "2px 6px", borderRadius: 2, color: activeTest === t.id ? "#000" : accentHex, backgroundColor: activeTest === t.id ? accentHex : `${accentHex}22` }}>{activeTest === t.id ? "RUNNING" : t.status}</span>
          </div>
          {activeTest === t.id && <div style={{ marginTop: 8, height: 4, width: "100%", backgroundColor: "#18181b", borderRadius: 9999, overflow: "hidden" }}><div className="pulse" style={{ height: "100%", width: "60%", backgroundColor: accentHex, borderRadius: 9999 }} /></div>}
        </button>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// DEPLOYMENT PIPELINES (dev right panel)
// ─────────────────────────────────────────────────────────────────────────────
function DeploymentPipelinesPanel() {
  const { accentHex } = useWS();
  const pipelines = [
    { name: "prod-us-east",  pct: 100, status: "LIVE",    color: "#34d399" },
    { name: "prod-eu-west",  pct: 78,  status: "ROLLING", color: accentHex },
    { name: "staging-k8s",   pct: 45,  status: "ACTIVE",  color: accentHex },
    { name: "canary-v4.3.1", pct: 12,  status: "INIT",    color: "#f59e0b" },
  ];
  return (
    <div style={{ ...S.scroll, flex: 1, padding: 12, display: "flex", flexDirection: "column", gap: 12 }}>
      {pipelines.map(p => (
        <div key={p.name} style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ ...S.label }}>{p.name}</span>
            <span style={{ ...S.small, padding: "2px 6px", borderRadius: 2, color: p.color, backgroundColor: `${p.color}22` }}>{p.status}</span>
          </div>
          <div style={{ height: 4, width: "100%", backgroundColor: "#18181b", borderRadius: 9999, overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${p.pct}%`, backgroundColor: p.color, borderRadius: 9999, transition: "width 0.7s" }} />
          </div>
          <span style={{ fontSize: 8, color: "#3f3f46", fontWeight: 900 }}>{p.pct}%</span>
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// DEV PLATFORM PANEL
// ─────────────────────────────────────────────────────────────────────────────
const DP_STAGES = [
  { id: "rbac",       step: "01", label: "RBAC Verification",      icon: "🔑" },
  { id: "quota",      step: "02", label: "Quota Enforcement",       icon: "📊" },
  { id: "intent",     step: "03", label: "Intent Routing",          icon: "🧠" },
  { id: "ontology",   step: "04", label: "Ontology Reasoning",      icon: "🕸" },
  { id: "synthesis",  step: "05", label: "Blueprint Synthesis",     icon: "📐" },
  { id: "ast",        step: "06", label: "AST Code Generation",     icon: "⚙" },
  { id: "securepact", step: "07", label: "SecurePact Validation",   icon: "🔐" },
  { id: "sandbox",    step: "08", label: "Cognitive Sandbox",       icon: "🧪" },
  { id: "policy",     step: "09", label: "Policy Engine Gate",      icon: "🏛" },
  { id: "assembly",   step: "10", label: "Repository Assembly",     icon: "📦" },
  { id: "deploy",     step: "11", label: "Cloud Deployment",        icon: "🚀" },
  { id: "stratex",    step: "12", label: "StratEx Hotpath",         icon: "⚡" },
  { id: "billing",    step: "13", label: "Metering & Billing",      icon: "💳" },
  { id: "memory",     step: "14", label: "Cognitive Memory Commit", icon: "💾" },
];
const DP_CLOUD = ["AWS GovCloud", "Azure Government", "GCP Assured", "On-Premise / Air-Gap", "Multi-Cloud Sovereign"];
const DP_STAGE_DUR: Record<string, number> = { rbac:600,quota:500,intent:800,ontology:1200,synthesis:1800,ast:2400,securepact:1400,sandbox:2000,policy:900,assembly:1600,deploy:2800,stratex:1000,billing:400,memory:500 };

interface DPPreset { id: string; label: string; description: string; defaultDescription: string; cloudTarget: string; speedMult: number; }
const DP_PRESETS: DPPreset[] = [
  { id: "rapid-proto",   label: "Rapid Proto",    description: "Skip heavy policy gates — fast iteration for staging", defaultDescription: "Fast-track blueprint synthesis and deploy to staging — skip policy double-approval",                           cloudTarget: "GCP Assured",              speedMult: 0.45 },
  { id: "secure-deploy", label: "Secure Deploy",  description: "Full SecurePact + policy gate + sandbox — production ready", defaultDescription: "Full-stack orchestration with SecurePact L4 validation, 3-loop sandbox, and dual policy approval",  cloudTarget: "AWS GovCloud",             speedMult: 1.6  },
  { id: "audit-pipeline",label: "Audit Pipeline", description: "Compliance-first build: extended ontology and memory commit logging", defaultDescription: "Compliance-grade pipeline with extended ontology pass, full audit trail, and cognitive memory commit", cloudTarget: "Azure Government",          speedMult: 1.6  },
  { id: "hotpath-only",  label: "Hotpath Only",   description: "Minimal pipeline targeting StratEx Hotpath bootstrap only", defaultDescription: "StratEx Hotpath bootstrap — bypass assembly and policy for direct low-latency deployment",           cloudTarget: "Multi-Cloud Sovereign",    speedMult: 0.45 },
];
const DP_CRIT_RULES: Record<string, { chance: (id: string) => number; type: string; msg: string }> = {
  securepact: { chance: id => id === "rapid-proto" ? 0.7 : id === "hotpath-only" ? 0.45 : 0.08, type: "SECUREPACT_FAILED",    msg: "SecurePact L4 validation rejected: unsigned artifact hash mismatch — policy escalation required" },
  policy:     { chance: id => id === "rapid-proto" ? 0.65: id === "hotpath-only" ? 0.4  : 0.06, type: "POLICY_GATE_BLOCKED", msg: "Policy Engine Gate blocked deployment: dual-approval rule triggered for enterprise-tier workload" },
};
const DEDUP_WINDOW_MS = 4000;

function DevPlatformPanel() {
  const { accentHex } = useWS();
  const { user, isAnonymous, login } = useAuth();
  const { data: buildHistory, isPending: loadingHistory } = useQuery("DeveloperIntent", { orderBy: { createdAt: "desc" }, limit: 8 });
  const { create: createIntent } = useMutation("DeveloperIntent");
  const { create: createArtifact } = useMutation("BuildArtifact");
  const { create: createUsage } = useMutation("UsageMetric");

  const [preset, setPreset] = useState<DPPreset>(DP_PRESETS[1]);
  const [desc, setDesc] = useState(DP_PRESETS[1].defaultDescription);
  const [cloud, setCloud] = useState(DP_PRESETS[1].cloudTarget);
  const [statuses, setStatuses] = useState<StageStatus[]>(DP_STAGES.map(() => "pending"));
  const [progress, setProgress] = useState<number[]>(DP_STAGES.map(() => 0));
  const [running, setRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [tab, setTab] = useState<"pipeline" | "history" | "config">("pipeline");
  const [riskScore, setRiskScore] = useState<number | null>(null);
  const [finalCost, setFinalCost] = useState<number | null>(null);
  const [endpoint, setEndpoint] = useState<string | null>(null);
  const [selectedBuild, setSelectedBuild] = useState<string | null>(null);
  const [critToasts, setCritToasts] = useState<CritToastItem[]>([]);
  const toastIdRef = useRef(0);
  const lastFireRef = useRef<Map<string, number>>(new Map());
  const rafRef = useRef<number | null>(null);
  const stageRef = useRef<{ start: number; idx: number } | null>(null);
  const elapsedRafRef = useRef<number | null>(null);
  const dismissToast = useCallback((id: number) => setCritToasts(prev => prev.filter(t => t.id !== id)), []);

  function fireCrit(type: string, text: string) {
    const nowMs = Date.now();
    const last = lastFireRef.current.get(type) ?? 0;
    if (nowMs - last < DEDUP_WINDOW_MS) {
      setCritToasts(prev => {
        const idx = prev.map(t => t.type).lastIndexOf(type);
        if (idx === -1) return prev;
        const u = [...prev]; u[idx] = { ...u[idx], count: (u[idx].count ?? 1) + 1, ts: nowTs() }; return u;
      });
      return;
    }
    lastFireRef.current.set(type, nowMs);
    const id = ++toastIdRef.current;
    setCritToasts(prev => { const n = [...prev, { id, text, type, ts: nowTs(), count: 1 }]; return n.length > 5 ? n.slice(n.length - 5) : n; });
  }

  function applyPreset(p: DPPreset) { if (running) return; setPreset(p); setCloud(p.cloudTarget); setDesc(p.defaultDescription); resetPipeline(); }

  function resetPipeline() {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    if (elapsedRafRef.current) cancelAnimationFrame(elapsedRafRef.current);
    stageRef.current = null;
    setStatuses(DP_STAGES.map(() => "pending")); setProgress(DP_STAGES.map(() => 0));
    setRunning(false); setElapsed(0); setRiskScore(null); setFinalCost(null); setEndpoint(null);
  }

  function launchPipeline() {
    if (!desc.trim()) return;
    resetPipeline(); setRunning(true);
    const start = performance.now();
    const tick = () => { setElapsed(Math.floor((performance.now() - start) / 1000)); elapsedRafRef.current = requestAnimationFrame(tick); };
    elapsedRafRef.current = requestAnimationFrame(tick);
    setTimeout(() => runStage(0), 60);
  }

  function runStage(idx: number) {
    if (idx >= DP_STAGES.length) {
      if (elapsedRafRef.current) cancelAnimationFrame(elapsedRafRef.current);
      setRunning(false);
      const risk = +(Math.random() * 0.25).toFixed(3);
      const cost = +(Math.random() * 0.08 + 0.02).toFixed(4);
      const ep = `https://${cloud.toLowerCase().replace(/[^a-z0-9]/g, "-")}.intellicore.ai/api/${Math.random().toString(36).slice(2, 10)}`;
      setRiskScore(risk); setFinalCost(cost); setEndpoint(ep);
      const taskId = `task_${Date.now()}`;
      const artifactCount = Math.floor(Math.random() * 24 + 8);
      if (!isAnonymous) {
        createIntent({ description: desc, status: "completed", taskId, estimatedCost: cost * 0.8, finalCost: cost, finalRiskScore: risk }).catch(() => {});
        createArtifact({ taskId, projectPath: `/generated/${taskId}`, artifactCount }).catch(() => {});
        createUsage({ metric: "build_execution", quantity: 1 }).catch(() => {});
        createUsage({ metric: "artifact_analysis", quantity: artifactCount }).catch(() => {});
      }
      return;
    }
    setStatuses(prev => { const n = [...prev]; n[idx] = "running"; return n; });
    stageRef.current = { start: performance.now(), idx };
    const dur = (DP_STAGE_DUR[DP_STAGES[idx].id] ?? 1000) * preset.speedMult;
    const critRule = DP_CRIT_RULES[DP_STAGES[idx].id];
    function frame() {
      if (!stageRef.current || stageRef.current.idx !== idx) return;
      const pct = Math.min((performance.now() - stageRef.current.start) / dur, 1);
      setProgress(prev => { const n = [...prev]; n[idx] = pct; return n; });
      if (pct < 1) { rafRef.current = requestAnimationFrame(frame); }
      else {
        if (critRule && Math.random() < critRule.chance(preset.id)) fireCrit(critRule.type, critRule.msg);
        setStatuses(prev => { const n = [...prev]; n[idx] = "done"; return n; });
        runStage(idx + 1);
      }
    }
    rafRef.current = requestAnimationFrame(frame);
  }

  const allDone = statuses.every(s => s === "done");

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", position: "relative" }}>
      <CritToast toasts={critToasts} onDismiss={dismissToast} />
      {/* Tab bar */}
      <div style={{ display: "flex", alignItems: "center", borderBottom: "1px solid rgba(39,39,42,0.6)", backgroundColor: "rgba(0,0,0,0.2)", padding: "0 16px" }}>
        {(["pipeline","history","config"] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} style={{ padding: "10px 16px", fontSize: 9, fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.15em", borderBottom: `2px solid ${tab === t ? accentHex : "transparent"}`, color: tab === t ? accentHex : "#52525b", cursor: "pointer", transition: "all 0.2s" }}>
            {t === "pipeline" ? "Build Pipeline" : t === "history" ? "Deploy History" : "Cloud Config"}
          </button>
        ))}
        <div style={{ marginLeft: "auto", paddingBottom: 4 }}>
          {isAnonymous ? (
            <button onClick={login} style={{ fontSize: 8, fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.15em", padding: "4px 12px", borderRadius: 2, border: `1px solid ${accentHex}44`, color: accentHex, backgroundColor: `${accentHex}10`, cursor: "pointer" }}>Sign In to Persist</button>
          ) : (
            <span style={{ fontSize: 8, fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.15em", color: "#34d399" }}>● {user?.name ?? "Authenticated"}</span>
          )}
        </div>
      </div>

      {/* Pipeline tab */}
      {tab === "pipeline" && (
        <div style={{ flex: 1, overflow: "hidden", display: "flex" }}>
          <div style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>
            {/* Preset selector */}
            <div style={{ padding: "12px 16px 8px", borderBottom: "1px solid rgba(39,39,42,0.4)", backgroundColor: "rgba(0,0,0,0.1)" }}>
              <div style={{ ...S.label, marginBottom: 8 }}>Deploy Preset</div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {DP_PRESETS.map(p => {
                  const isA = preset.id === p.id;
                  return <button key={p.id} onClick={() => applyPreset(p)} disabled={running} title={p.description} style={{ padding: "4px 10px", fontSize: 8, fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.15em", borderRadius: 2, border: `1px solid ${isA ? `${accentHex}66` : "#3f3f46"}`, color: isA ? accentHex : "#71717a", backgroundColor: isA ? `${accentHex}18` : "transparent", boxShadow: isA ? `0 0 8px ${accentHex}22` : "none", opacity: running ? 0.4 : 1, cursor: running ? "not-allowed" : "pointer", transition: "all 0.2s" }}>{p.label}</button>;
                })}
              </div>
              <p style={{ fontSize: 8, color: "#52525b", fontStyle: "italic", marginTop: 6, lineHeight: 1.4 }}>{preset.description}</p>
            </div>
            {/* Intent input */}
            <div style={{ padding: 16, borderBottom: "1px solid rgba(39,39,42,0.4)", display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{ ...S.label }}>System Intent Directive</div>
              <textarea value={desc} onChange={e => setDesc(e.target.value)} disabled={running} rows={2} placeholder="Describe the software system to build and deploy…" style={{ width: "100%", backgroundColor: "rgba(24,24,27,0.8)", border: "1px solid rgba(63,63,70,0.4)", borderRadius: 2, padding: "8px 12px", fontSize: 11, color: "#e4e4e7", outline: "none", fontFamily: "monospace", resize: "vertical", transition: "border-color 0.2s" }} onFocus={e => (e.currentTarget.style.borderColor = `${accentHex}66`)} onBlur={e => (e.currentTarget.style.borderColor = "rgba(63,63,70,0.4)")} />
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ ...S.label, flexShrink: 0 }}>Cloud Target:</span>
                <select value={cloud} onChange={e => setCloud(e.target.value)} disabled={running} style={{ flex: 1, backgroundColor: "#18181b", border: `1px solid ${accentHex}30`, borderRadius: 2, padding: "6px 8px", fontSize: 10, color: "#d4d4d8", fontFamily: "monospace", outline: "none" }}>
                  {DP_CLOUD.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                {(running || allDone) && <button onClick={resetPipeline} style={{ fontSize: 9, fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.15em", padding: "6px 12px", borderRadius: 2, border: "1px solid #3f3f46", color: "#71717a", cursor: "pointer", transition: "all 0.2s" }}>Reset</button>}
                <button onClick={launchPipeline} disabled={running || !desc.trim()} style={{ fontSize: 9, fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.15em", padding: "6px 16px", borderRadius: 2, border: `1px solid ${running || !desc.trim() ? "#27272a" : `${accentHex}55`}`, color: running || !desc.trim() ? "#52525b" : accentHex, cursor: running || !desc.trim() ? "not-allowed" : "pointer", boxShadow: running || !desc.trim() ? "none" : `0 0 12px ${accentHex}22`, transition: "all 0.3s" }}>
                  {running ? `Running… ${elapsed}s` : allDone ? "Re-Deploy" : "▶ Build & Deploy"}
                </button>
              </div>
            </div>
            {/* Stage list */}
            <div style={{ ...S.scroll, flex: 1, padding: "12px 16px" }}>
              <div style={{ position: "relative" }}>
                <div style={{ position: "absolute", left: 18, top: 20, bottom: 20, width: 1, backgroundColor: "rgba(39,39,42,0.6)" }} />
                <div style={{ display: "flex", flexDirection: "column" }}>
                  {DP_STAGES.map((s, i) => {
                    const st = statuses[i], pct = progress[i], isLast = i === DP_STAGES.length - 1;
                    return (
                      <div key={s.id} style={{ display: "flex", gap: 16, position: "relative" }}>
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0, width: 36 }}>
                          <div style={{ position: "relative", zIndex: 1, width: 22, height: 22, marginTop: 8, borderRadius: "50%", border: `2px solid ${st === "done" ? "#10b981" : st === "running" ? accentHex : "#3f3f46"}`, backgroundColor: "#18181b", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "all 0.3s", boxShadow: st === "running" ? `0 0 8px ${accentHex}55` : "none" }}>
                            {st === "done" ? <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2 5l2.5 2.5L8 3" stroke="#34d399" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
                             : st === "running" ? <svg className="spin" width="12" height="12" viewBox="0 0 12 12"><circle cx="6" cy="6" r="4.5" stroke={accentHex} strokeWidth="1.5" strokeLinecap="round" strokeDasharray="14 8" fill="none" /></svg>
                             : <span style={{ fontSize: 7, color: "#3f3f46", fontWeight: 900 }}>{s.step}</span>}
                          </div>
                          {!isLast && <div style={{ width: 1, flex: 1, minHeight: 8, position: "relative", marginTop: 2, marginBottom: 2 }}><div style={{ position: "absolute", inset: 0, backgroundColor: "rgba(39,39,42,0.6)" }} />{st === "done" && <div style={{ position: "absolute", inset: 0, backgroundColor: "rgba(16,185,129,0.5)", transition: "all 0.3s" }} />}</div>}
                        </div>
                        <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 8, padding: "6px 0 8px", minHeight: 38, borderBottom: isLast ? "none" : "1px solid rgba(39,39,42,0.2)", transition: "all 0.2s" }}>
                          <span style={{ fontSize: 16, lineHeight: 1, flexShrink: 0 }}>{s.icon}</span>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 10, fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.1em", color: st === "done" ? "#34d399" : st === "running" ? "#f4f4f5" : "#52525b", transition: "color 0.2s" }}>{s.label}</div>
                            {(st === "running" || st === "done") && <div style={{ marginTop: 4, height: 2, width: "100%", backgroundColor: "#27272a", borderRadius: 9999, overflow: "hidden" }}><div style={{ height: "100%", width: `${pct * 100}%`, backgroundColor: st === "done" ? "#34d399" : accentHex, borderRadius: 9999 }} /></div>}
                          </div>
                          <span style={{ fontSize: 8, fontWeight: 900, flexShrink: 0, width: 32, textAlign: "right", color: st === "done" ? "#059669" : st === "running" ? "#a1a1aa" : "#3f3f46" }}>{st === "running" ? `${Math.round(pct * 100)}%` : st === "done" ? "DONE" : ""}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
          {/* Result panel */}
          <div style={{ width: 200, flexShrink: 0, borderLeft: "1px solid rgba(39,39,42,0.4)", display: "flex", flexDirection: "column", backgroundColor: "rgba(0,0,0,0.2)" }}>
            <div style={{ padding: 12, borderBottom: "1px solid rgba(39,39,42,0.4)" }}>
              <div style={{ ...S.label }}>Deployment Result</div>
            </div>
            <div style={{ ...S.scroll, flex: 1, padding: 12, display: "flex", flexDirection: "column", gap: 12 }}>
              {!allDone && !running && <p style={{ fontSize: 10, color: "#3f3f46", fontStyle: "italic", lineHeight: 1.6 }}>Run pipeline to see deployment results here.</p>}
              {running && (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <div style={{ ...S.label }}>In Progress</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}><span className="pulse" style={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: accentHex, display: "inline-block" }} /><span style={{ fontSize: 10, color: "#a1a1aa" }}>Orchestrating…</span></div>
                  <div style={{ fontSize: 9, color: "#52525b" }}>Stages done: {statuses.filter(s => s === "done").length} / {DP_STAGES.length}</div>
                </div>
              )}
              {allDone && riskScore !== null && (
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {[["Status","DEPLOYED","#34d399"],["Cloud",cloud,"#d4d4d8"],["Risk Score",String(riskScore),riskScore > 0.2 ? "#fbbf24" : "#34d399"],["Final Cost",`$${finalCost}`,"#d4d4d8"],["Elapsed",`${elapsed}s`,"#d4d4d8"]].map(([lbl,val,clr]) => (
                    <div key={lbl} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: 9, color: "#52525b", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.15em" }}>{lbl}</span>
                      <span style={{ fontSize: 10, fontWeight: 900, color: clr }}>{val}</span>
                    </div>
                  ))}
                  {endpoint && (
                    <div>
                      <div style={{ ...S.small, color: "#52525b", marginBottom: 4 }}>Endpoint</div>
                      <div style={{ fontSize: 8, color: "#a1a1aa", fontFamily: "monospace", lineHeight: 1.5, backgroundColor: "rgba(24,24,27,0.6)", borderRadius: 2, padding: 8, border: "1px solid rgba(39,39,42,0.4)", wordBreak: "break-all" }}>{endpoint}</div>
                    </div>
                  )}
                  <div style={{ paddingTop: 8, borderTop: "1px solid rgba(39,39,42,0.4)", display: "flex", flexDirection: "column", gap: 8 }}>
                    {[["SecurePact","Approved"],["Policy Gate","Cleared L4"]].map(([lbl,val]) => (
                      <div key={lbl}>
                        <div style={{ ...S.small, color: "#52525b", marginBottom: 4 }}>{lbl}</div>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}><span style={{ color: "#34d399" }}>✓</span><span style={{ fontSize: 9, color: "#a1a1aa" }}>{val}</span></div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* History tab */}
      {tab === "history" && (
        <div style={{ ...S.scroll, flex: 1, padding: 16, display: "flex", flexDirection: "column", gap: 8 }}>
          <div style={{ ...S.label, marginBottom: 4 }}>Recent Deployments {loadingHistory && <span style={{ color: "#3f3f46", marginLeft: 8 }}>Loading…</span>}</div>
          {(!buildHistory || buildHistory.length === 0) && !loadingHistory && <div style={{ fontSize: 10, color: "#3f3f46", fontStyle: "italic" }}>No deployments yet. Run your first build.</div>}
          {(buildHistory ?? []).map(b => (
            <div key={b.id} onClick={() => setSelectedBuild(selectedBuild === b.id ? null : b.id)} style={{ padding: 12, borderRadius: 2, border: `1px solid ${selectedBuild === b.id ? "rgba(63,63,70,0.6)" : "rgba(39,39,42,0.4)"}`, backgroundColor: selectedBuild === b.id ? "rgba(39,39,42,0.4)" : "rgba(24,24,27,0.2)", cursor: "pointer", transition: "all 0.2s" }}>
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 10, fontWeight: 900, color: "#d4d4d8", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{b.description}</div>
                  <div style={{ fontSize: 8, color: "#52525b", marginTop: 2, fontFamily: "monospace" }}>{b.taskId}</div>
                </div>
                <span style={{ fontSize: 8, fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.15em", flexShrink: 0, color: b.status === "completed" ? "#34d399" : "#fb7185" }}>{b.status}</span>
              </div>
              {selectedBuild === b.id && (
                <div style={{ marginTop: 8, paddingTop: 8, borderTop: "1px solid rgba(39,39,42,0.5)", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4px 16px" }}>
                  {[["Risk",String(b.finalRiskScore)],["Cost",`$${b.finalCost?.toFixed(4)}`],["Est",`$${b.estimatedCost?.toFixed(4)}`],["Date",new Date(b.createdAt).toLocaleDateString()]].map(([l,v]) => (
                    <div key={l} style={{ display: "flex", justifyContent: "space-between" }}><span style={{ fontSize: 8, color: "#52525b", fontWeight: 900 }}>{l}</span><span style={{ fontSize: 8, fontWeight: 900, color: "#d4d4d8" }}>{v}</span></div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Config tab */}
      {tab === "config" && (
        <div style={{ ...S.scroll, flex: 1, padding: 16, display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ ...S.label, marginBottom: 4 }}>Cloud Deployment Config</div>
          {[
            { title: "Target Environment", rows: DP_CLOUD.map(c => ({ label: c, value: c === cloud ? "active" : "", isCloud: true, c })) },
            { title: "Security Posture", rows: [{ label: "SecurePact Level", value: "L4 — Critical Infrastructure" }, { label: "Sandbox Iterations", value: "3 max auto-fix loops" }, { label: "Risk Threshold", value: "≤ 0.30 for deployment" }, { label: "Policy Engine", value: "Dual-approval if tier > enterprise" }] },
            { title: "Orchestrator Engines", rows: [{ label: "Ontology Reasoning", value: "OntologyReasoningEngine v4" }, { label: "AST Compiler", value: "ASTCodeGenerator + ASTParser" }, { label: "StratEx Hotpath", value: "HotpathEngineWrapper bootstrap" }, { label: "Memory Store", value: "CognitiveMemoryService" }, { label: "Deployment CLI", value: "FoundryCLI + AutonomousDeploymentEngine" }] },
            { title: "Metering & Billing", rows: [{ label: "Pricing Engine", value: "CoraPricingEngine (dynamic)" }, { label: "Metering", value: "build_execution + artifact_analysis" }, { label: "Billing Mode", value: "Incremental charge post-deploy" }] },
          ].map(section => (
            <div key={section.title}>
              <div style={{ ...S.small, color: "#52525b", marginBottom: 8 }}>{section.title}</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {section.rows.map((row: any) => (
                  row.isCloud ? (
                    <div key={row.c} onClick={() => setCloud(row.c)} style={{ display: "flex", alignItems: "center", gap: 12, padding: "8px 12px", borderRadius: 2, border: `1px solid ${cloud === row.c ? "rgba(63,63,70,0.6)" : "rgba(39,39,42,0.3)"}`, backgroundColor: cloud === row.c ? "rgba(39,39,42,0.3)" : "rgba(24,24,27,0.1)", cursor: "pointer", transition: "all 0.2s" }}>
                      <div style={{ width: 6, height: 6, borderRadius: "50%", flexShrink: 0, backgroundColor: cloud === row.c ? accentHex : "#3f3f46" }} />
                      <span style={{ fontSize: 10, fontWeight: 900, color: "#d4d4d8" }}>{row.c}</span>
                    </div>
                  ) : (
                    <div key={row.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 12px", backgroundColor: "rgba(24,24,27,0.3)", border: "1px solid rgba(39,39,42,0.3)", borderRadius: 2 }}>
                      <span style={{ fontSize: 9, color: "#71717a", fontWeight: 900 }}>{row.label}</span>
                      <span style={{ fontSize: 9, fontWeight: 900, color: accentHex }}>{row.value}</span>
                    </div>
                  )
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
