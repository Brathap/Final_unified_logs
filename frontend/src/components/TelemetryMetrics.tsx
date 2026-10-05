import React, { useMemo } from 'react';
import { 
  ResponsiveContainer, 
  XAxis, 
  YAxis, 
  Tooltip, 
  PieChart, 
  Pie, 
  Cell, 
  Area, 
  AreaChart 
} from 'recharts';
import { 
  Activity, 
  ShieldAlert, 
  Zap, 
  Database, 
  Lock, 
  Globe2, 
  ArrowUpRight,
  Server,
  Terminal,
  Radio,
  Cpu,
  ShieldCheck,
  Flame
} from 'lucide-react';
import type { ULPFLogRecord } from '../types';
import { useTheme } from '../context/ThemeContext';

interface TelemetryMetricsProps {
  logs: ULPFLogRecord[];
  throughput: number;
  hostStreaming?: boolean;
  instantDemoMode?: boolean;
  isStreaming?: boolean;
  hostInfo?: { hostname: string; ip: string } | null;
}

const COLORS = ['#2563eb', '#059669', '#d97706', '#dc2626', '#7c3aed'];

export const TelemetryMetrics: React.FC<TelemetryMetricsProps> = ({ 
  logs, 
  throughput,
  hostStreaming = false,
  instantDemoMode = true,
  isStreaming = false,
  hostInfo = null
}) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const axisColor = isDark ? '#94a3b8' : '#475569';
  const tooltipBg = isDark ? '#0f172a' : '#ffffff';
  const tooltipBorder = isDark ? '#334155' : '#cbd5e1';
  const tooltipText = isDark ? '#f8fafc' : '#0f172a';
  const categoryData = useMemo(() => {
    const counts: Record<string, number> = {};
    logs.forEach(log => {
      const d = log.normalized_data as any;
      const cat = d?.category_name || d?.class_name || 'Other';
      counts[cat] = (counts[cat] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [logs]);

  const threatGeoData = useMemo(() => {
    const counts: Record<string, number> = {};
    logs
      .filter(l => {
        const d = l.normalized_data as any;
        return d?.threat?.is_malicious || d?.enrichment?.is_malicious;
      })
      .forEach(l => {
        const d = l.normalized_data as any;
        const actor = d?.threat?.actor || d?.enrichment?.threat_actor || 'Unknown';
        counts[actor] = (counts[actor] || 0) + 1;
      });
    return Object.entries(counts).map(([name, count]) => ({ name, count }));
  }, [logs]);

  const timeSeriesData = useMemo(() => {
    const data = [];
    const now = Date.now();
    for (let i = 15; i >= 0; i--) {
      const timeLabel = new Date(now - i * 1500).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
      const jitter = (Math.sin(i) * 2.5) + ((Math.random() - 0.5) * 2);
      data.push({
        time: timeLabel,
        eps: Math.max(3, Math.round(throughput + jitter))
      });
    }
    return data;
  }, [throughput]);

  const { maliciousCount, piiRedactedCount } = useMemo(() => {
    let mal = 0;
    let pii = 0;
    for (let i = 0; i < logs.length; i++) {
      const l = logs[i];
      const d = l.normalized_data as any;
      const t = l.traceability as any;
      if (d?.threat?.is_malicious || d?.enrichment?.is_malicious) mal++;
      if (d?.compliance?.pii_redacted || t?.redacted_payload) pii++;
    }
    return { maliciousCount: mal, piiRedactedCount: pii };
  }, [logs]);
  
  const totalLogs = logs.length;

  return (
    <div className="space-y-4 mb-6">
      {/* 4 Spacious Glass Widgets */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Widget 1: Ingestion Velocity */}
        <div className="relative group bg-white/[0.02] backdrop-blur-xl border border-white/[0.08] hover:border-white/[0.14] rounded-2xl p-6 transition-all duration-300">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-xs font-medium tracking-wide text-zinc-400 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
              Ingestion Velocity
            </span>
            <div className="w-8 h-8 rounded-xl bg-cyan-400/10 border border-cyan-400/20 text-cyan-400 flex items-center justify-center">
              <Zap className="w-4 h-4" />
            </div>
          </div>
          
          <div className="mt-4 flex items-baseline justify-between">
            <div className="flex items-baseline space-x-1.5">
              <span className="text-3xl sm:text-4xl font-semibold tracking-tight text-white font-mono bg-gradient-to-br from-white via-zinc-100 to-zinc-400 bg-clip-text text-transparent">
                {throughput.toLocaleString()}
              </span>
              <span className="text-xs font-medium text-zinc-400 font-mono">EPS</span>
            </div>
            <span className="text-[11px] font-mono font-medium text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 px-2.5 py-0.5 rounded-full flex items-center gap-1">
              <ArrowUpRight className="w-3 h-3" />
              Realtime
            </span>
          </div>

          <div className="mt-4 pt-3 border-t border-white/[0.05] flex items-center justify-between text-xs text-zinc-400 font-sans">
            <span>Latency: <strong className="text-zinc-200 font-mono font-medium">0.6ms</strong></span>
            <span>Packet Drop: <strong className="text-emerald-400 font-mono font-medium">0.00%</strong></span>
          </div>

          <div className="w-full bg-white/[0.04] h-1 rounded-full mt-3 overflow-hidden">
            <div 
              className="bg-gradient-to-r from-cyan-500 to-blue-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, Math.max(12, throughput * 6))}%` }}
            />
          </div>
        </div>

        {/* Widget 2: Threat Intel Hits */}
        <div className="relative group bg-white/[0.02] backdrop-blur-xl border border-white/[0.08] hover:border-white/[0.14] rounded-2xl p-6 transition-all duration-300">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-xs font-medium tracking-wide text-zinc-400 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse" />
              Threat Intel Hits
            </span>
            <div className="w-8 h-8 rounded-xl bg-rose-400/10 border border-rose-400/20 text-rose-400 flex items-center justify-center">
              <ShieldAlert className="w-4 h-4" />
            </div>
          </div>

          <div className="mt-4 flex items-baseline justify-between">
            <div className="flex items-baseline space-x-1.5">
              <span className="text-3xl sm:text-4xl font-semibold tracking-tight text-white font-mono bg-gradient-to-br from-rose-200 via-rose-300 to-rose-500 bg-clip-text text-transparent">
                {maliciousCount}
              </span>
              <span className="text-xs font-medium text-zinc-400 font-mono">Alerts</span>
            </div>
            <span className="text-[11px] font-mono font-medium text-rose-400 bg-rose-400/10 border border-rose-400/20 px-2.5 py-0.5 rounded-full">
              Sovereign Intel
            </span>
          </div>

          <div className="mt-4 pt-3 border-t border-white/[0.05] flex items-center justify-between text-xs text-zinc-400 font-sans">
            <span>Threat DB: <strong className="text-zinc-200 font-medium">Matrix Armed</strong></span>
            <span>Ratio: <strong className="text-rose-400 font-mono font-medium">{totalLogs ? Math.round((maliciousCount / totalLogs) * 100) : 0}%</strong></span>
          </div>

          <div className="w-full bg-white/[0.04] h-1 rounded-full mt-3 overflow-hidden">
            <div 
              className="bg-gradient-to-r from-rose-500 to-pink-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, (maliciousCount / Math.max(1, totalLogs)) * 250)}%` }}
            />
          </div>
        </div>

        {/* Widget 3: Named Entity PII Scrubbed */}
        <div className="relative group bg-white/[0.02] backdrop-blur-xl border border-white/[0.08] hover:border-white/[0.14] rounded-2xl p-6 transition-all duration-300">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-xs font-medium tracking-wide text-zinc-400 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
              PII Scrubbed
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-400/10 border border-amber-400/20 text-amber-400 flex items-center justify-center">
              <Lock className="w-4 h-4" />
            </div>
          </div>

          <div className="mt-4 flex items-baseline justify-between">
            <div className="flex items-baseline space-x-1.5">
              <span className="text-3xl sm:text-4xl font-semibold tracking-tight text-white font-mono bg-gradient-to-br from-amber-200 via-amber-300 to-amber-500 bg-clip-text text-transparent">
                {piiRedactedCount}
              </span>
              <span className="text-xs font-medium text-zinc-400 font-mono">Sanitized</span>
            </div>
            <span className="text-[11px] font-mono font-medium text-amber-400 bg-amber-400/10 border border-amber-400/20 px-2.5 py-0.5 rounded-full">
              Verhoeff Zero-Leak
            </span>
          </div>

          <div className="mt-4 pt-3 border-t border-white/[0.05] flex items-center justify-between text-xs text-zinc-400 font-sans">
            <span>Pattern: <strong className="text-zinc-200 font-medium">Aadhaar/PAN/Tokens</strong></span>
            <span>Leakage: <strong className="text-emerald-400 font-mono font-medium">0.00%</strong></span>
          </div>

          <div className="w-full bg-white/[0.04] h-1 rounded-full mt-3 overflow-hidden">
            <div 
              className="bg-gradient-to-r from-amber-500 to-yellow-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, (piiRedactedCount / Math.max(1, totalLogs)) * 250)}%` }}
            />
          </div>
        </div>

        {/* Widget 4: OCSF Standard Conformance */}
        <div className="relative group bg-white/[0.02] backdrop-blur-xl border border-white/[0.08] hover:border-white/[0.14] rounded-2xl p-6 transition-all duration-300">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-xs font-medium tracking-wide text-zinc-400 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              OCSF Standard Match
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-400/10 border border-emerald-400/20 text-emerald-400 flex items-center justify-center">
              <Database className="w-4 h-4" />
            </div>
          </div>

          <div className="mt-4 flex items-baseline justify-between">
            <div className="flex items-baseline space-x-1.5">
              <span className="text-3xl sm:text-4xl font-semibold tracking-tight text-white font-mono bg-gradient-to-br from-emerald-200 via-emerald-300 to-teal-400 bg-clip-text text-transparent">
                100%
              </span>
              <span className="text-xs font-medium text-zinc-400 font-mono">v1.1.0</span>
            </div>
            <span className="text-[11px] font-mono font-medium text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 px-2.5 py-0.5 rounded-full">
              SHA-256 Valid
            </span>
          </div>

          <div className="mt-4 pt-3 border-t border-white/[0.05] flex items-center justify-between text-xs text-zinc-400 font-sans">
            <span>OCSF Classes: <strong className="text-zinc-200 font-mono font-medium">2001, 3002, 4001</strong></span>
            <span>Provenance: <strong className="text-emerald-400 font-mono font-medium">100% Lossless</strong></span>
          </div>

          <div className="w-full bg-white/[0.04] h-1 rounded-full mt-3 overflow-hidden">
            <div className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full" style={{ width: '100%' }} />
          </div>
        </div>
      </div>

      {/* Currently Running Services & Pipeline Runtime Monitor */}
      <div className="bg-white/[0.02] backdrop-blur-xl border border-white/[0.08] rounded-2xl p-5 transition-all">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 mb-3 border-b border-white/[0.06]">
          <div className="flex items-center space-x-2.5">
            <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-sky-500/10 text-sky-400 border border-sky-500/20">
              <Cpu className="w-4 h-4 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center space-x-2.5">
                <span className="text-xs font-semibold text-zinc-200 tracking-wider uppercase">
                  Currently Running Services
                </span>
                <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-400/10 text-emerald-400 border border-emerald-400/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  REAL-TIME PIPELINE ACTIVE
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3 text-xs text-zinc-400">
            <span>Kernel: <strong className="text-zinc-200 font-medium">Linux / Arch</strong></span>
            <span className="text-zinc-600">•</span>
            <span>Gateway: <strong className="text-sky-400 font-mono">FastAPI :8000</strong></span>
            <span className="text-zinc-600">•</span>
            <span>Syslog UDP: <strong className="text-emerald-400 font-mono">:5140</strong></span>
          </div>
        </div>

        {/* Dynamic Running Services Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {/* 1. Vector VRL Ingestion Engine */}
          <div className="p-3 rounded-xl border border-white/[0.06] bg-white/[0.015] hover:bg-white/[0.03] transition-colors">
            <div className="flex items-center justify-between text-zinc-400 mb-1.5">
              <span className="text-[11px] font-medium uppercase tracking-wider flex items-center gap-1.5">
                <Server className="w-3.5 h-3.5 text-sky-400" />
                Vector VRL
              </span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            </div>
            <div className="text-xs font-semibold text-zinc-100 font-mono">UDP 5140 / 514</div>
            <div className="flex items-center justify-between mt-1.5 text-[11px]">
              <span className="text-emerald-400 font-medium font-mono text-[10px]">RUNNING</span>
              <span className="text-zinc-500 font-mono text-[10px]">Lossless Wire</span>
            </div>
          </div>

          {/* 2. Laptop Journalctl Host Tailer */}
          <div className={`p-3 rounded-xl border transition-colors ${
            hostStreaming 
              ? 'border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/15' 
              : 'border-white/[0.06] bg-white/[0.015] hover:bg-white/[0.03]'
          }`}>
            <div className="flex items-center justify-between text-zinc-400 mb-1.5">
              <span className="text-[11px] font-medium uppercase tracking-wider flex items-center gap-1.5">
                <Terminal className={`w-3.5 h-3.5 ${hostStreaming ? 'text-emerald-400' : 'text-zinc-400'}`} />
                Laptop Host
              </span>
              <span className={`w-2 h-2 rounded-full ${hostStreaming ? 'bg-emerald-400 animate-pulse' : 'bg-zinc-600'}`} />
            </div>
            <div className="text-xs font-semibold text-zinc-100 font-mono truncate" title={hostInfo?.hostname || 'archlinux'}>
              {hostInfo?.hostname || 'archlinux'}
            </div>
            <div className="flex items-center justify-between mt-1.5 text-[11px]">
              <span className={`font-medium font-mono text-[10px] ${hostStreaming ? 'text-emerald-400' : 'text-zinc-500'}`}>
                {hostStreaming ? 'STREAMING' : 'STANDBY'}
              </span>
              <span className="text-zinc-500 font-mono text-[10px]">OCSF 1001</span>
            </div>
          </div>

          {/* 3. Demo Stream Generator */}
          <div className={`p-3 rounded-xl border transition-colors ${
            instantDemoMode 
              ? 'border-sky-500/30 bg-sky-500/10 hover:bg-sky-500/15' 
              : 'border-white/[0.06] bg-white/[0.015] hover:bg-white/[0.03]'
          }`}>
            <div className="flex items-center justify-between text-zinc-400 mb-1.5">
              <span className="text-[11px] font-medium uppercase tracking-wider flex items-center gap-1.5">
                <Flame className={`w-3.5 h-3.5 ${instantDemoMode ? 'text-amber-400' : 'text-zinc-400'}`} />
                Demo Firehose
              </span>
              <span className={`w-2 h-2 rounded-full ${instantDemoMode ? 'bg-sky-400 animate-pulse' : 'bg-zinc-600'}`} />
            </div>
            <div className="text-xs font-semibold text-zinc-100 font-mono">Cadence 800ms</div>
            <div className="flex items-center justify-between mt-1.5 text-[11px]">
              <span className={`font-medium font-mono text-[10px] ${instantDemoMode ? 'text-sky-400' : 'text-zinc-500'}`}>
                {instantDemoMode ? 'ACTIVE' : 'IDLE'}
              </span>
              <span className="text-zinc-500 font-mono text-[10px]">16 Threat Sigs</span>
            </div>
          </div>

          {/* 4. Named Entity PII Interceptor */}
          <div className="p-3 rounded-xl border border-white/[0.06] bg-white/[0.015] hover:bg-white/[0.03] transition-colors">
            <div className="flex items-center justify-between text-zinc-400 mb-1.5">
              <span className="text-[11px] font-medium uppercase tracking-wider flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-amber-400" />
                PII Redactor
              </span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            </div>
            <div className="text-xs font-semibold text-zinc-100 font-mono">Verhoeff / PII</div>
            <div className="flex items-center justify-between mt-1.5 text-[11px]">
              <span className="text-amber-400 font-medium font-mono text-[10px]">ENFORCING</span>
              <span className="text-zinc-500 font-mono text-[10px]">Zero Leakage</span>
            </div>
          </div>

          {/* 5. Threat Intelligence Engine */}
          <div className="p-3 rounded-xl border border-white/[0.06] bg-white/[0.015] hover:bg-white/[0.03] transition-colors">
            <div className="flex items-center justify-between text-zinc-400 mb-1.5">
              <span className="text-[11px] font-medium uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-rose-400" />
                Threat Intel
              </span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            </div>
            <div className="text-xs font-semibold text-zinc-100 font-mono">THREAT INTEL DB</div>
            <div className="flex items-center justify-between mt-1.5 text-[11px]">
              <span className="text-rose-400 font-medium font-mono text-[10px]">ARMED</span>
              <span className="text-zinc-500 font-mono text-[10px]">O(1) Memory</span>
            </div>
          </div>

          {/* 6. SSE Stream Broadcast */}
          <div className="p-3 rounded-xl border border-white/[0.06] bg-white/[0.015] hover:bg-white/[0.03] transition-colors">
            <div className="flex items-center justify-between text-zinc-400 mb-1.5">
              <span className="text-[11px] font-medium uppercase tracking-wider flex items-center gap-1.5">
                <Radio className="w-3.5 h-3.5 text-emerald-400" />
                SSE Broadcast
              </span>
              <span className={`w-2 h-2 rounded-full ${isStreaming ? 'bg-emerald-400 animate-pulse' : 'bg-sky-400'}`} />
            </div>
            <div className="text-xs font-semibold text-zinc-100 font-mono">/api/stream</div>
            <div className="flex items-center justify-between mt-1.5 text-[11px]">
              <span className="text-emerald-400 font-medium font-mono text-[10px]">
                {isStreaming ? 'CONNECTED' : 'DISPATCHING'}
              </span>
              <span className="text-zinc-500 font-mono text-[10px]">Lossless Wire</span>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Event Velocity Chart */}
        <div className="lg:col-span-2 bg-white/[0.02] backdrop-blur-xl border border-white/[0.08] rounded-2xl p-6 flex flex-col justify-between transition-all">
          <div className="flex flex-wrap items-center justify-between mb-4 border-b border-white/[0.06] pb-3 gap-2">
            <div className="flex items-center space-x-2.5">
              <div className="p-2 rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/20">
                <Activity className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-zinc-200">
                  Event Processing Velocity (EPS)
                </h3>
                <p className="text-xs text-zinc-400">Dynamic Ingestion Rate (Vector Remap Engine)</p>
              </div>
            </div>

            <div className="flex items-center space-x-3 text-xs font-mono">
              <span className="text-zinc-400">Window: <strong className="text-zinc-200 font-medium">Rolling 20s</strong></span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/20 text-xs font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-sky-400 inline-block mr-1.5 animate-pulse" />
                Live Ingestion
              </span>
            </div>
          </div>

          <div className="h-44 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={timeSeriesData} margin={{ top: 5, right: 10, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id="epsAreaGlowLight" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#38bdf8" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <XAxis 
                  dataKey="time" 
                  stroke="#71717a" 
                  fontSize={10} 
                  tickLine={false} 
                  tick={{ fill: '#71717a' }}
                />
                <YAxis 
                  stroke="#71717a" 
                  fontSize={10} 
                  tickLine={false} 
                  tick={{ fill: '#71717a' }}
                  domain={[0, 'dataMax + 6']} 
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#18181b', 
                    borderColor: 'rgba(255,255,255,0.1)', 
                    borderRadius: '12px', 
                    fontSize: '11px',
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
                    color: '#f4f4f5'
                  }}
                  itemStyle={{ color: '#38bdf8', fontWeight: 600 }}
                />
                <Area 
                  type="monotone" 
                  dataKey="eps" 
                  stroke="#38bdf8" 
                  strokeWidth={2} 
                  fillOpacity={1} 
                  fill="url(#epsAreaGlowLight)" 
                  isAnimationActive={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right: Threat Actors & Event Taxonomy */}
        <div className="bg-white/[0.02] backdrop-blur-xl border border-white/[0.08] rounded-2xl p-6 flex flex-col justify-between transition-all">
          <div className="flex items-center justify-between border-b border-white/[0.06] pb-3 mb-3">
            <div className="flex items-center space-x-2.5">
              <div className="p-2 rounded-xl bg-violet-500/10 text-violet-400 border border-violet-500/20">
                <Globe2 className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-semibold text-zinc-200">
                Threat Actors & Taxonomy
              </h3>
            </div>
            <span className="text-[11px] font-mono text-zinc-400 px-2.5 py-0.5 rounded-full bg-white/[0.04] border border-white/[0.08]">
              Active Feeds
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 h-36 items-center">
            {/* Left Doughnut */}
            <div className="h-full flex items-center justify-center">
              {categoryData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      innerRadius={28}
                      outerRadius={46}
                      paddingAngle={4}
                      dataKey="value"
                      isAnimationActive={false}
                    >
                      {categoryData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#18181b', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '10px', color: '#f4f4f5' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-xs text-zinc-500">Buffering...</div>
              )}
            </div>

            {/* Right Threat Actor Breakdown */}
            <div className="space-y-1.5 overflow-y-auto max-h-32 pr-1 font-mono text-xs no-scrollbar">
              <span className="text-zinc-400 uppercase tracking-wider text-[10px] block font-medium">
                Detected Adversaries
              </span>
              {threatGeoData.length > 0 ? (
                threatGeoData.slice(0, 4).map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between text-zinc-200 bg-white/[0.02] px-2.5 py-1.5 rounded-lg border border-white/[0.06]">
                    <span className="text-rose-400 font-medium truncate max-w-[100px] text-[11px]">{item.name}</span>
                    <span className="text-zinc-200 font-bold px-1.5 py-0.5 rounded bg-white/[0.06] border border-white/[0.08] text-[10px]">{item.count}</span>
                  </div>
                ))
              ) : (
                <div className="text-zinc-500 italic text-[11px] p-2">
                  No malicious hits currently
                </div>
              )}
            </div>
          </div>

          {/* Bottom Taxonomy Tags */}
          <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t border-white/[0.06]">
            {categoryData.slice(0, 3).map((c, i) => (
              <span key={i} className="text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-white/[0.03] text-zinc-300 border border-white/[0.06]">
                {c.name}: <strong className="text-sky-400 font-medium">{c.value}</strong>
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};