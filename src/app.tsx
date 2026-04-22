import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback,
} from "react";

export const GLOBAL_CSS = `...`;
// ─────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────
type Role = "analyst" | "ops" | "gov" | "dev";
type StageStatus = "pending" | "running" | "done" | "error";

// ─────────────────────────────────────────────────────────────
// ACCENT COLORS
// ─────────────────────────────────────────────────────────────
const ACCENT_HEX: Record<Role, string> = {
  analyst: "#38bdf8",
  ops: "#34d399",
  gov: "#a78bfa",
  dev: "#fb923c",
};

// ─────────────────────────────────────────────────────────────
// WORKSTATION CONTEXT
// ─────────────────────────────────────────────────────────────
interface WorkstationCtx {
  role: Role;
  setRole: (r: Role) => void;
  accentHex: string;
}

const WorkstationContext = createContext<WorkstationCtx>({
  role: "dev",
  setRole: () => {},
  accentHex: "#fb923c",
});

function readPersistedRole(): Role {
  try {
    const s = localStorage.getItem("intellicore_role");
    if (s === "analyst" || s === "ops" || s === "gov" || s === "dev") return s;
  } catch {}
  return "dev";
}

function WorkstationProvider({ children }: { children: React.ReactNode }) {
  const [role, setRoleState] = useState<Role>(readPersistedRole);
  const accentHex = ACCENT_HEX[role];

  useEffect(() => {
    document.documentElement.style.setProperty("--accent", accentHex);
  }, [accentHex]);

  const setRole = (r: Role) => {
    setRoleState(r);
    try { localStorage.setItem("intellicore_role", r); } catch {}
  };

  return (
    <WorkstationContext.Provider value={{ role, setRole, accentHex }}>
      {children}
    </WorkstationContext.Provider>
  );
}

function useWorkstation() {
  return useContext(WorkstationContext);
}

// ─────────────────────────────────────────────────────────────
// GLOBAL KEYFRAME STYLES
// ─────────────────────────────────────────────────────────────
const GLOBAL_CSS = `
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html, body, #app { height: 100%; background: #090a0c; font-family: 'Courier New', Courier, monospace; }
  ::-webkit-scrollbar { width: 0px; height: 0px; }
  @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.4} }
  @keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
  @keyframes slideInRight { from{opacity:0;transform:translateX(100%)} to{opacity:1;transform:translateX(0)} }
  @keyframes drainBar { from{width:100%} to{width:0%} }
  textarea { resize: none; }
  select { cursor: pointer; }
  button { cursor: pointer; font-family: inherit; }
  input, textarea, select { font-family: inherit; }
`;

// ─────────────────────────────────────────────────────────────
// SHARED HELPERS
// ─────────────────────────────────────────────────────────────
function nowTime() {
  return new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}
function randBetween(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
function rand(min: number, max: number) {
  return +(Math.random() * (max - min) + min).toFixed(2);
}

// ─────────────────────────────────────────────────────────────
// PANEL HEADER
// ─────────────────────────────────────────────────────────────
function PanelHeader({ title, icon, accentHex }: { title: string; icon: string; accentHex: string }) {
  return (
    <div style={{
      height: 40,
      background: "rgba(0,0,0,0.4)",
      borderBottom: "1px solid rgba(39,39,42,0.8)",
      padding: "0 16px",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      flexShrink: 0,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <span style={{ fontSize: 11, fontWeight: 900, color: accentHex }}>{icon}</span>
        <h3 style={{ fontSize: 9, fontWeight: 900, letterSpacing: "0.25em", textTransform: "uppercase", color: "#52525b" }}>
          {title}
        </h3>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <div style={{ height: 4, width: 32, background: "#18181b", borderRadius: 9999, overflow: "hidden" }}>
          <div style={{ height: "100%", width: "50%", background: `${accentHex}33`, animation: "pulse 2s infinite" }} />
        </div>
        <div style={{
          width: 8, height: 8, borderRadius: "50%",
          background: accentHex, boxShadow: `0 0 10px ${accentHex}88`,
          animation: "pulse 2s infinite",
        }} />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// ROLE SELECTOR
// ─────────────────────────────────────────────────────────────
const ROLES: { value: Role; label: string }[] = [
  { value: "analyst", label: "Analyst" },
  { value: "ops", label: "Ops" },
  { value: "gov", label: "Gov" },
  { value: "dev", label: "Dev" },
];

function RoleSelector({ currentRole, setRole }: { currentRole: Role; setRole: (r: Role) => void }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 4,
      background: "rgba(0,0,0,0.4)",
      border: "1px solid rgba(39,39,42,0.6)",
      borderRadius: 2, padding: 4,
    }}>
      {ROLES.map((r) => {
        const active = currentRole === r.value;
        const hex = ACCENT_HEX[r.value];
        return (
          <button
            key={r.value}
            onClick={() => setRole(r.value)}
            style={{
              padding: "4px 12px",
              fontSize: 9, fontWeight: 900,
              textTransform: "uppercase", letterSpacing: "0.15em",
              borderRadius: 2,
              border: active ? `1px solid ${hex}55` : "1px solid transparent",
              background: active ? "#18181b" : "transparent",
              color: active ? hex : "#52525b",
              boxShadow: active ? `0 0 10px ${hex}22` : "none",
              transition: "all 0.2s",
            }}
          >
            {r.label}
          </button>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// CRIT TOAST
// ─────────────────────────────────────────────────────────────
interface CritToastItem {
  id: number;
  text: string;
  type: string;
  ts: string;
  count?: number;
}

function CritToast({ toasts, onDismiss }: { toasts: CritToastItem[]; onDismiss: (id: number) => void }) {
  const timersRef = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map());

  useEffect(() => {
    toasts.forEach((t) => {
      if (!timersRef.current.has(t.id)) {
        const timer = setTimeout(() => {
          onDismiss(t.id);
          timersRef.current.delete(t.id);
        }, 6000);
        timersRef.current.set(t.id, timer);
      }
    });
  }, [toasts, onDismiss]);

  useEffect(() => {
    const map = timersRef.current;
    return () => { map.forEach((t) => clearTimeout(t)); map.clear(); };
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div style={{
      position: "fixed", top: 64, right: 16, zIndex: 9999,
      display: "flex", flexDirection: "column", gap: 8,
      pointerEvents: "none",
    }}>
      {toasts.map((t) => (
        <div key={t.id} style={{
          pointerEvents: "auto",
          display: "flex", alignItems: "flex-start", gap: 12, width: 320,
          borderRadius: 2, border: "1px solid rgba(244,63,94,0.6)",
          background: "#0f0608", backdropFilter: "blur(20px)",
          padding: "12px 16px",
          boxShadow: "0 0 0 1px rgba(244,63,94,0.3), 0 0 30px rgba(244,63,94,0.18)",
          animation: "slideInRight 0.25s ease-out",
        }}>
          <div style={{ flexShrink: 0, marginTop: 2, width: 4, alignSelf: "stretch", borderRadius: 9999, background: "#f43f5e", animation: "pulse 1s infinite" }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 4 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ color: "#fb7185", fontSize: 9, fontWeight: 900, letterSpacing: "0.2em", textTransform: "uppercase", animation: "pulse 1s infinite" }}>⚠ CRIT</span>
                <span style={{ color: "#3f3f46", fontSize: 8, fontWeight: 900, letterSpacing: "0.15em", textTransform: "uppercase" }}>{t.type}</span>
                {t.count && t.count > 1 && (
                  <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", borderRadius: 9999, background: "#e11d48", color: "#fff", fontWeight: 900, fontSize: 8, minWidth: 16, height: 16, padding: "0 4px" }}>×{t.count}</span>
                )}
              </div>
              <span style={{ color: "#3f3f46", fontSize: 8, fontWeight: 900, fontFamily: "monospace" }}>{t.ts}</span>
            </div>
            <p style={{ color: "#ffe4e6", fontSize: 10, lineHeight: 1.5, wordBreak: "break-word" }}>{t.text}</p>

            export default function App() {
  return (
    <WorkstationProvider>
      {/* your existing UI */}
    </WorkstationProvider>
  );
}
