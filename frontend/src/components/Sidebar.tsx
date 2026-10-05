import React from 'react';
import { 
  Home, 
  Radio, 
  SlidersHorizontal, 
  Fingerprint, 
  Terminal, 
  ShieldAlert, 
  ShieldCheck, 
  Settings, 
  User, 
  Activity,
  Layers,
  Sparkles,
  Lock,
  Cpu
} from 'lucide-react';
import { ULPFLogo } from './ULPFLogo';

interface SidebarProps {
  activeTab: 'soc' | 'mapper' | 'provenance' | 'binary';
  setActiveTab: (tab: 'soc' | 'mapper' | 'provenance' | 'binary') => void;
  isStreaming: boolean;
  instantDemoMode: boolean;
  onToggleDemoMode: () => void;
  hostStreaming: boolean;
  onToggleHostLogs: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  isStreaming,
  instantDemoMode,
  onToggleDemoMode,
  hostStreaming,
  onToggleHostLogs
}) => {
  const navItems = [
    { id: 'soc' as const, label: 'Command Stream', icon: Radio, badge: 'LIVE' },
    { id: 'mapper' as const, label: 'Schema Studio', icon: SlidersHorizontal },
    { id: 'provenance' as const, label: 'Provenance Chain', icon: Fingerprint },
    { id: 'binary' as const, label: 'Binary Sandbox', icon: Terminal },
  ];

  return (
    <aside className="w-18 shrink-0 h-screen sticky top-0 flex flex-col items-center justify-between py-5 bg-[#0A0A0A]/90 backdrop-blur-2xl border-r border-white/5 z-40 selection:bg-cyan-500/20">
      {/* Top Branding Logo */}
      <div className="flex flex-col items-center space-y-6">
        <div className="relative group cursor-pointer">
          <div className="absolute -inset-1.5 bg-gradient-to-r from-cyan-500 to-indigo-500 rounded-xl blur-md opacity-25 group-hover:opacity-75 transition duration-500" />
          <div className="relative p-1 rounded-xl bg-white/[0.04] border border-white/10 hover:border-cyan-500/40 transition">
            <ULPFLogo size={32} />
          </div>
          <span className="absolute -bottom-1 -right-1 flex h-2 w-2">
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${isStreaming ? 'bg-cyan-400' : 'bg-amber-400'} opacity-75`} />
            <span className={`relative inline-flex rounded-full h-2 w-2 ${isStreaming ? 'bg-cyan-400' : 'bg-amber-400'}`} />
          </span>
        </div>

        {/* Navigation Items (Sleek, glowing icons) */}
        <nav className="flex flex-col items-center space-y-2.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <div key={item.id} className="relative group flex items-center justify-center">
                <button
                  type="button"
                  onClick={() => setActiveTab(item.id)}
                  className={`relative p-3 rounded-xl transition-all duration-300 flex items-center justify-center cursor-pointer ${
                    isActive
                      ? 'bg-gradient-to-b from-white/[0.12] to-white/[0.04] text-white border border-white/15 shadow-[0_0_20px_rgba(6,182,212,0.25)]'
                      : 'text-zinc-500 hover:text-zinc-200 hover:bg-white/[0.04] border border-transparent'
                  }`}
                  aria-label={item.label}
                >
                  <Icon className={`w-5 h-5 transition-transform duration-300 group-hover:scale-110 ${
                    isActive ? 'text-cyan-400' : ''
                  }`} />
                  {isActive && (
                    <span className="absolute -left-[1px] w-1 h-5 bg-gradient-to-b from-cyan-400 to-indigo-400 rounded-r-full shadow-[0_0_8px_#22d3ee]" />
                  )}
                </button>

                {/* Tooltip on Hover */}
                <div className="absolute left-full ml-3 px-2.5 py-1.5 bg-zinc-900/95 backdrop-blur-xl border border-white/10 text-zinc-200 text-xs font-medium rounded-lg whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-all duration-200 z-50 shadow-xl flex items-center gap-2">
                  <span>{item.label}</span>
                  {item.badge && (
                    <span className="px-1.5 py-0.2 bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-[9px] font-mono rounded font-bold">
                      {item.badge}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </nav>
      </div>

      {/* Middle Controls (Demo / Host Toggles in Sidebar) */}
      <div className="flex flex-col items-center space-y-3">
        {/* Synthetic Firehose Toggle */}
        <div className="relative group">
          <button
            type="button"
            onClick={onToggleDemoMode}
            className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
              instantDemoMode 
                ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.2)]' 
                : 'bg-white/[0.02] border-white/5 text-zinc-500 hover:text-zinc-300'
            }`}
            title="Toggle Synthetic Firehose (800ms ingestion)"
          >
            <Sparkles className={`w-4 h-4 ${instantDemoMode ? 'animate-pulse text-cyan-400' : ''}`} />
          </button>
          <div className="absolute left-full ml-3 px-2.5 py-1.5 bg-zinc-900 border border-white/10 text-zinc-200 text-xs rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition z-50 pointer-events-none font-sans">
            <span>Demo Firehose: <strong className={instantDemoMode ? 'text-cyan-400' : 'text-zinc-400'}>{instantDemoMode ? 'ACTIVE' : 'IDLE'}</strong></span>
          </div>
        </div>

        {/* Laptop Host Ingest Toggle */}
        <div className="relative group">
          <button
            type="button"
            onClick={onToggleHostLogs}
            className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
              hostStreaming 
                ? 'bg-indigo-500/15 border-indigo-500/40 text-indigo-400 shadow-[0_0_15px_rgba(99,102,241,0.2)]' 
                : 'bg-white/[0.02] border-white/5 text-zinc-500 hover:text-zinc-300'
            }`}
            title="Toggle Laptop Journalctl Host Tailer"
          >
            <Cpu className="w-4 h-4" />
          </button>
          <div className="absolute left-full ml-3 px-2.5 py-1.5 bg-zinc-900 border border-white/10 text-zinc-200 text-xs rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition z-50 pointer-events-none font-sans">
            <span>Host Tailer: <strong className={hostStreaming ? 'text-indigo-400' : 'text-zinc-400'}>{hostStreaming ? 'STREAMING' : 'OFF'}</strong></span>
          </div>
        </div>
      </div>

      {/* Bottom Section: Status & User Profile */}
      <div className="flex flex-col items-center space-y-3.5 pt-3 border-t border-white/5 w-full">
        {/* Air-Gap Security Badge */}
        <div className="relative group">
          <div className="w-8 h-8 rounded-xl bg-white/[0.03] border border-white/10 flex items-center justify-center text-zinc-400 hover:text-zinc-200 cursor-pointer transition">
            <Lock className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="absolute left-full ml-3 px-2.5 py-1.5 bg-zinc-900 border border-white/10 text-zinc-200 text-xs rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition z-50 pointer-events-none font-mono">
            <span className="text-emerald-400">AIR-GAP SOVEREIGNTY: 100%</span>
          </div>
        </div>

        {/* User Profile Avatar */}
        <div className="relative group cursor-pointer">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-600/40 via-indigo-600/40 to-violet-600/40 border border-white/15 flex items-center justify-center shadow-inner hover:border-cyan-400/50 transition">
            <span className="text-xs font-mono font-bold text-white tracking-wider">NTRO</span>
          </div>
          <div className="absolute left-full ml-3 px-3 py-2 bg-zinc-900/95 backdrop-blur-xl border border-white/10 text-xs rounded-xl whitespace-nowrap opacity-0 group-hover:opacity-100 transition z-50 pointer-events-none">
            <div className="font-semibold text-white">SOC Commander · NTRO Fabric</div>
            <div className="text-[10px] text-zinc-400 font-mono">ID: SEC-OP-0941 // AIR-GAPPED</div>
          </div>
        </div>
      </div>
    </aside>
  );
};
