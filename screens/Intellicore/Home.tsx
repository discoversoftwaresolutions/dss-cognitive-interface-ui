import React from "react";
import { useWorkstation } from "../../context/WorkstationContext";
import ChatPanel from "../../components/ChatPanel";
import BuildPanel from "../../components/BuildPanel";
import SystemMonitor from "../../components/SystemMonitor";
import RoleSelector from "../../components/RoleSelector";
import EventBusContainer from "../../components/EventBusContainer";
import SkillsDiscovery from "../../components/SkillsDiscovery";
import VoiceControl from "../../components/VoiceControl";
import TelemetryPanel from "../../components/hud/TelemetryPanel";
import DevPlatformPanel from "../../components/DevPlatformPanel";

// ── Shared sub-components ────────────────────────────────────────────────────

interface PanelHeaderProps {
  title: string;
  icon: string;
  accentHex: string;
}

function PanelHeader({ title, icon, accentHex }: PanelHeaderProps) {
  return (
    <div className="h-10 bg-black/40 border-b border-zinc-800/80 px-4 flex items-center justify-between group">
      <div className="flex items-center space-x-3">
        <span className="text-xs font-black" style={{ color: accentHex }}>{icon}</span>
        <h3 className="text-[10px] font-black uppercase tracking-[0.25em] text-zinc-500 group-hover:text-zinc-200 transition-colors duration-300">
          {title}
        </h3>
      </div>
      <div className="flex items-center space-x-2">
        <div className="h-1 w-8 bg-zinc-900 overflow-hidden rounded-full">
          <div className="h-full w-1/2 animate-pulse" style={{ backgroundColor: `${accentHex}33` }} />
        </div>
        <div
          className="w-2 h-2 animate-pulse rounded-full"
          style={{ backgroundColor: accentHex, boxShadow: `0 0 10px ${accentHex}88` }}
        />
      </div>
    </div>
  );
}

interface SandboxPanelProps {
  accentHex: string;
}

function CognitiveSandboxPanel({ accentHex }: SandboxPanelProps) {
  const [activeTest, setActiveTest] = React.useState<number | null>(null);
  const tests = [
    { id: 0, label: "Inference_Probe",  status: "IDLE"   },
    { id: 1, label: "Adversarial_Fuzz", status: "READY"  },
    { id: 2, label: "Latency_Stress",   status: "QUEUED" },
    { id: 3, label: "Drift_Monitor",    status: "IDLE"   },
  ];
  return (
    <div className="flex-1 overflow-y-auto scrollbar-hide p-3 space-y-2">
      {tests.map((t) => (
        <button
          key={t.id}
          onClick={() => setActiveTest(activeTest === t.id ? null : t.id)}
          className="w-full text-left px-3 py-2 rounded-sm border border-zinc-800/60 bg-black/20 hover:bg-black/40 transition-colors group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[9px] font-black uppercase tracking-widest text-zinc-400 group-hover:text-zinc-200 transition-colors">
              {t.label}
            </span>
            <span
              className="text-[8px] font-black tracking-widest px-1.5 py-0.5 rounded-sm"
              style={{
                color: activeTest === t.id ? "#000" : accentHex,
                backgroundColor: activeTest === t.id ? accentHex : `${accentHex}22`,
              }}
            >
              {activeTest === t.id ? "RUNNING" : t.status}
            </span>
          </div>
          {activeTest === t.id && (
            <div className="mt-2 h-1 w-full bg-zinc-900 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full animate-pulse"
                style={{ width: "60%", backgroundColor: accentHex }}
              />
            </div>
          )}
        </button>
      ))}
    </div>
  );
}

function DeploymentPipelinesPanel({ accentHex }: SandboxPanelProps) {
  const pipelines = [
    { name: "prod-us-east",  pct: 100, status: "LIVE",    color: "#34d399" },
    { name: "prod-eu-west",  pct: 78,  status: "ROLLING", color: accentHex },
    { name: "staging-k8s",   pct: 45,  status: "ACTIVE",  color: accentHex },
    { name: "canary-v4.3.1", pct: 12,  status: "INIT",    color: "#f59e0b" },
  ];
  return (
    <div className="flex-1 overflow-y-auto scrollbar-hide p-3 space-y-3">
      {pipelines.map((p) => (
        <div key={p.name} className="space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[9px] font-black uppercase tracking-widest text-zinc-500">{p.name}</span>
            <span
              className="text-[8px] font-black tracking-widest px-1.5 py-0.5 rounded-sm"
              style={{ color: p.color, backgroundColor: `${p.color}22` }}
            >
              {p.status}
            </span>
          </div>
          <div className="h-1 w-full bg-zinc-900 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{ width: `${p.pct}%`, backgroundColor: p.color }}
            />
          </div>
          <span className="text-[8px] text-zinc-700 font-black">{p.pct}%</span>
        </div>
      ))}
    </div>
  );
}

// ── Main screen ──────────────────────────────────────────────────────────────

export default function Home() {
  const { role, setRole, accentHex } = useWorkstation();

  // Dev role gets its own full-screen layout
  if (role === "dev") {
    return (
      <div className="min-h-screen bg-[#090a0c] bg-lab-grid text-zinc-300 font-mono flex flex-col">
        {/* NAV */}
        <nav className="h-14 border-b border-zinc-800 bg-[#0c0d0f]/95 backdrop-blur-xl flex items-center justify-between px-6 sticky top-0 z-50 shadow-[0_4px_20px_rgba(0,0,0,0.5)]">
          <div className="flex items-center space-x-5">
            <div className="w-9 h-9 flex items-center justify-center font-black text-black shadow-[0_0_15px_rgba(0,0,0,0.2)] rounded-sm" style={{ backgroundColor: accentHex }}>
              IC
            </div>
            <div className="flex flex-col">
              <span className="text-[11px] font-black tracking-[0.25em] text-white uppercase leading-none">
                IntelliCore <span className="text-zinc-800">/</span>{" "}
                <span style={{ color: accentHex }}>Dev_Platform</span>
              </span>
              <span className="text-[7px] text-zinc-600 uppercase mt-1.5 tracking-[0.3em] font-black">
                Enterprise &amp; Government Build Engine <span className="text-zinc-800">//</span> v4.2.0
              </span>
            </div>
          </div>
          <div className="flex items-center space-x-8">
            <div className="hidden lg:flex items-center space-x-6 text-[9px] text-zinc-500 uppercase font-black tracking-tighter border-r border-zinc-800/50 pr-8">
              <div className="flex items-center space-x-2">
                <span className="text-emerald-500 animate-pulse text-[10px]">●</span>
                <span>Uplink: <span className="text-zinc-300">Active</span></span>
              </div>
              <span>Security: <span style={{ color: accentHex }}>Sovereign_L4</span></span>
            </div>
            <RoleSelector setRole={setRole} currentRole={role} />
          </div>
        </nav>

        {/* BODY — 3-column: Chat | Build Pipeline | Events + Telemetry */}
        <main className="flex-1 p-4 grid grid-cols-12 gap-4 overflow-hidden" style={{ height: "calc(100vh - 88px)" }}>

          {/* Chat */}
          <section className="col-span-3 flex flex-col bg-[#101114]/80 border border-zinc-800/60 rounded-sm shadow-2xl overflow-hidden backdrop-blur-md">
            <PanelHeader title="Cora_Neural_Interface" icon="⌘" accentHex={accentHex} />
            <div className="flex-1 overflow-hidden flex flex-col">
              <div className="flex-1 overflow-hidden">
                <ChatPanel role={role} />
              </div>
              <div className="border-t border-zinc-800/50">
                <VoiceControl />
              </div>
            </div>
          </section>

          {/* Dev Platform — Build + History + Config */}
          <section className="col-span-6 flex flex-col bg-[#101114]/80 border border-zinc-800/60 rounded-sm shadow-2xl overflow-hidden backdrop-blur-md">
            <PanelHeader title="Dev_Platform_Orchestrator" icon="⚒" accentHex={accentHex} />
            <DevPlatformPanel />
          </section>

          {/* Right: Cognitive Sandbox + Deployment Pipelines */}
          <section className="col-span-3 flex flex-col space-y-4 overflow-hidden">
            <div className="flex-[1] min-h-0 bg-[#101114]/90 border border-zinc-800/60 rounded-sm flex flex-col overflow-hidden shadow-2xl">
              <PanelHeader title="Cognitive_Sandbox" icon="🧪" accentHex={accentHex} />
              <CognitiveSandboxPanel accentHex={accentHex} />
            </div>
            <div className="flex-[2] min-h-0 bg-[#0c0d0f]/90 border border-zinc-800/60 rounded-sm flex flex-col overflow-hidden shadow-xl">
              <PanelHeader title="Deployment_Pipelines" icon="🚀" accentHex={accentHex} />
              <DeploymentPipelinesPanel accentHex={accentHex} />
            </div>
          </section>
        </main>

        {/* FOOTER */}
        <footer className="fixed bottom-0 left-0 right-0 h-8 bg-[#0c0d0f] border-t border-zinc-800/50 px-6 flex items-center justify-between text-[9px] text-zinc-700 font-black uppercase tracking-[0.25em] z-50">
          <div className="flex items-center space-x-8">
            <div className="flex items-center space-x-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 shadow-[0_0_8px_rgba(16,185,129,0.3)] animate-pulse" />
              <span className="text-zinc-500">Node: ATL_GA_LAB</span>
            </div>
            <span className="tabular-nums">UTC: {new Date().toISOString().split("T")[1].split(".")[0]}</span>
          </div>
          <div className="flex items-center space-x-6">
            <span className="flex items-center space-x-2">
              <span className="text-zinc-800">Kernel:</span>
              <span className="text-cyan-400/70">StratEx_v4.2</span>
            </span>
            <span className="text-zinc-900 font-black">|</span>
            <span className="flex items-center space-x-2">
              <span className="text-zinc-800">Active_Profile:</span>
              <span style={{ color: accentHex }}>dev</span>
            </span>
          </div>
        </footer>
      </div>
    );
  }

  // ── Original 3-role layout ───────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#090a0c] bg-lab-grid text-zinc-300 font-mono">

      {/* 1. TACTICAL NAVIGATION */}
      <nav className="h-14 border-b border-zinc-800 bg-[#0c0d0f]/95 backdrop-blur-xl flex items-center justify-between px-6 sticky top-0 z-50 shadow-[0_4px_20px_rgba(0,0,0,0.5)]">
        <div className="flex items-center space-x-5">
          <div className="w-9 h-9 flex items-center justify-center font-black text-black shadow-[0_0_15px_rgba(0,0,0,0.2)] rounded-sm" style={{ backgroundColor: accentHex }}>
            IC
          </div>
          <div className="flex flex-col">
            <span className="text-[11px] font-black tracking-[0.25em] text-white uppercase leading-none">
              IntelliCore <span className="text-zinc-800">/</span>{" "}
              <span style={{ color: accentHex }}>StratEx-Engine</span>
            </span>
            <span className="text-[7px] text-zinc-600 uppercase mt-1.5 tracking-[0.3em] font-black">
              Autonomous DSS Lab Environment <span className="text-zinc-800">//</span> v4.2.0
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-8">
          <div className="hidden lg:flex items-center space-x-6 text-[9px] text-zinc-500 uppercase font-black tracking-tighter border-r border-zinc-800/50 pr-8">
            <div className="flex items-center space-x-2">
              <span className="text-emerald-500 animate-pulse text-[10px]">●</span>
              <span>Uplink: <span className="text-zinc-300">Active</span></span>
            </div>
            <span>Security: <span style={{ color: accentHex }}>Sovereign_L4</span></span>
          </div>
          <RoleSelector setRole={setRole} currentRole={role} />
        </div>
      </nav>

      {/* 2. CORE WORKSTATION GRID */}
      <main className="p-4 grid gap-4 grid-cols-12" style={{ height: "calc(100vh - 88px)", overflow: "hidden" }}>

        {/* LEFT SECTOR */}
        <section className={`${role === "ops" ? "hidden" : role === "gov" ? "col-span-4" : "col-span-3"} flex flex-col bg-[#101114]/80 border border-zinc-800/60 rounded-sm shadow-2xl overflow-hidden backdrop-blur-md transition-all duration-700`}>
          <PanelHeader title="Cora_Neural_Interface" icon="⌘" accentHex={accentHex} />
          <div className="flex-1 overflow-hidden relative flex flex-col">
            <div className="flex-1 overflow-hidden">
              <ChatPanel role={role} />
            </div>
            <div className="border-t border-zinc-800/50">
              <VoiceControl />
            </div>
          </div>
        </section>

        {/* CENTER SECTOR */}
        <section className={`${role === "gov" ? "col-span-4" : role === "ops" ? "hidden" : "col-span-6"} flex flex-col space-y-4 overflow-hidden transition-all duration-700`}>
          <div className="flex-[3] bg-[#101114]/80 border border-zinc-800/60 rounded-sm overflow-hidden flex flex-col shadow-xl">
            <PanelHeader title={role === "gov" ? "Sovereignty_Gate" : "Execution_Architect"} icon="⚒" accentHex={accentHex} />
            <BuildPanel />
          </div>
          <div className="flex-[2] bg-[#0c0d0f]/90 border border-zinc-800/60 rounded-sm overflow-hidden flex flex-col shadow-inner">
            <PanelHeader title="Cognitive_Skill_Registry" icon="⬡" accentHex={accentHex} />
            <div className="flex-1 overflow-y-auto scrollbar-hide">
              <SkillsDiscovery role={role} />
            </div>
          </div>
        </section>

        {/* RIGHT SECTOR */}
        <section className={`${role === "ops" ? "col-span-12" : role === "gov" ? "col-span-4" : "col-span-3"} flex flex-col space-y-4 overflow-hidden transition-all duration-700`}>
          <div className="flex-none bg-[#101114]/90 border border-zinc-800/60 rounded-sm flex flex-col overflow-hidden shadow-2xl">
            <PanelHeader title="Economic_Reflex_Unit" icon="⩇" accentHex={accentHex} />
            <TelemetryPanel />
          </div>
          <div className="flex-1 min-h-[30%] bg-[#101114]/80 border border-zinc-800/60 rounded-sm flex flex-col overflow-hidden shadow-xl">
            <PanelHeader title="Performance_Telemetry" icon="⚡" accentHex={accentHex} />
            <SystemMonitor />
          </div>
          <div className="h-[35%] bg-[#0c0d0f]/90 border border-zinc-800/60 rounded-sm flex flex-col overflow-hidden">
            <PanelHeader title="StratEx_Gateway_Feed" icon="⧉" accentHex={accentHex} />
            <div className="flex-1">
              <EventBusContainer role={role} />
            </div>
          </div>
        </section>

      </main>

      {/* 3. INDUSTRIAL HUD FOOTER */}
      <footer className="fixed bottom-0 left-0 right-0 h-8 bg-[#0c0d0f] border-t border-zinc-800/50 px-6 flex items-center justify-between text-[9px] text-zinc-700 font-black uppercase tracking-[0.25em] z-50">
        <div className="flex items-center space-x-8">
          <div className="flex items-center space-x-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 shadow-[0_0_8px_rgba(16,185,129,0.3)] animate-pulse" />
            <span className="text-zinc-500">Node: ATL_GA_LAB</span>
          </div>
          <span className="tabular-nums">UTC: {new Date().toISOString().split("T")[1].split(".")[0]}</span>
          <span className="hidden xl:inline opacity-40">GEO: 33.7490° N, 84.3880° W</span>
        </div>
        <div className="flex items-center space-x-6">
          <span className="flex items-center space-x-2">
            <span className="text-zinc-800">Kernel:</span>
            <span className="text-cyan-400/70">StratEx_v4.2</span>
          </span>
          <span className="text-zinc-900 font-black">|</span>
          <span className="flex items-center space-x-2">
            <span className="text-zinc-800">Active_Profile:</span>
            <span style={{ color: accentHex }}>{role}</span>
          </span>
        </div>
      </footer>
    </div>
  );
}
