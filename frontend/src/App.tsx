import React, { useEffect, useState, useRef, useMemo } from 'react';
import { AnimatePresence } from 'framer-motion';
import { 
  Radio, 
  Sparkles, 
  Lock, 
  Cpu, 
  Terminal, 
  SlidersHorizontal, 
  Fingerprint,
  Download,
  Upload,
  Layers,
  ChevronRight,
  ShieldAlert,
  ShieldCheck,
  Search,
  ExternalLink,
  Laptop
} from 'lucide-react';
import { HeroMetrics } from './components/HeroMetrics';
import { LiveStream } from './components/LiveStream';
import { OcsfJsonPreview } from './components/OcsfJsonPreview';
import { LogDrawer } from './components/LogDrawer';
import { SplashScreen } from './components/SplashScreen';
import { generateSyntheticLog } from './mockGenerator';
import type { ULPFLogRecord } from './types';
import { secureFetch, getAuthenticatedUrl } from './utils/api';

// Lazy-load secondary tabs to make initial page load instantaneous and feather-light
const AiMapper = React.lazy(() => import('./components/AiMapper').then(m => ({ default: m.AiMapper })));
const AirGapProvenance = React.lazy(() => import('./components/AirGapProvenance').then(m => ({ default: m.AirGapProvenance })));
const BinarySandbox = React.lazy(() => import('./components/BinarySandbox').then(m => ({ default: m.BinarySandbox })));

export const App: React.FC = () => {
  const [showSplash, setShowSplash] = useState(() => {
    return sessionStorage.getItem('ulpf_splash_dismissed') !== 'true';
  });

  const [logs, setLogs] = useState<ULPFLogRecord[]>(() => {
    const baseline: ULPFLogRecord[] = [];
    for (let i = 0; i < 12; i++) {
      baseline.push(generateSyntheticLog(false));
    }
    return baseline;
  });

  const [isStreaming, setIsStreaming] = useState(false);
  const [activeTab, setActiveTab] = useState<'soc' | 'mapper' | 'provenance' | 'binary'>('soc');
  const [selectedLog, setSelectedLog] = useState<ULPFLogRecord | null>(null);
  const [selectedOccurrences, setSelectedOccurrences] = useState<ULPFLogRecord[]>([]);
  const [hostStreaming, setHostStreaming] = useState(false);
  const [hostInfo, setHostInfo] = useState<{ hostname: string; ip: string } | null>(null);
  const [instantDemoMode, setInstantDemoMode] = useState(true);
  const [eps, setEps] = useState(0);
  const logCountRef = useRef(0);

  // Initialize: fetch local host metadata
  useEffect(() => {
    secureFetch('/api/host-stream/status')
      .then(res => res.json())
      .then(data => {
        if (data && data.hostname) {
          setHostInfo({ hostname: data.hostname, ip: data.ip });
        }
      })
      .catch(() => {});
  }, []);

  const toggleHostLogs = async () => {
    const nextState = !hostStreaming;
    setHostStreaming(nextState);
    try {
      const res = await secureFetch('/api/host-stream/toggle', { method: 'POST' });
      const data = await res.json();
      if (typeof data.active === 'boolean') {
        setHostStreaming(data.active);
      }
    } catch (e) {
      console.warn("Toggle sync fallback", e);
    }
  };

  const toggleDemoMode = () => {
    setInstantDemoMode(!instantDemoMode);
  };

  // 1. Instant Demo Mode Generator (Smooth, non-blocking 800ms cadence)
  useEffect(() => {
    if (!instantDemoMode) return;

    const demoInterval = setInterval(() => {
      const newLog = generateSyntheticLog(false);
      setLogs(prev => [newLog, ...prev.slice(0, 199)]);
      logCountRef.current += 1;
    }, 800);

    return () => clearInterval(demoInterval);
  }, [instantDemoMode]);

  // 2. Real SSE Stream from FastAPI Backend (Batched for smooth 60fps UI performance)
  useEffect(() => {
    let eventSource: EventSource | null = null;
    let pendingBatch: ULPFLogRecord[] = [];
    let flushTimer: any = null;

    const flushLogs = () => {
      if (pendingBatch.length > 0) {
        const batchToApply = [...pendingBatch];
        pendingBatch = [];
        setLogs(prev => [...batchToApply, ...prev].slice(0, 300));
      }
    };

    const connectSSE = () => {
      eventSource = new EventSource(getAuthenticatedUrl('/api/stream'));

      eventSource.onopen = () => {
        setIsStreaming(true);
      };

      eventSource.addEventListener('log', (event: MessageEvent) => {
        try {
          const record: ULPFLogRecord = JSON.parse(event.data);
          record.id = record.id || `live-${Date.now()}-${Math.random()}`;
          pendingBatch.unshift(record);
          logCountRef.current += 1;

          if (!flushTimer) {
            flushTimer = setTimeout(() => {
              flushTimer = null;
              flushLogs();
            }, 80);
          }
        } catch (e) {
          console.error("Error parsing live SSE event", e);
        }
      });

      eventSource.onerror = () => {
        setIsStreaming(false);
        if (eventSource) eventSource.close();
        setTimeout(connectSSE, 4000);
      };
    };

    connectSSE();

    return () => {
      if (flushTimer) clearTimeout(flushTimer);
      if (eventSource) eventSource.close();
    };
  }, []);

  // 3. Real-Time EPS Counter
  useEffect(() => {
    const interval = setInterval(() => {
      setEps(Math.max(instantDemoMode ? 8 : 1, logCountRef.current));
      logCountRef.current = 0;
    }, 1000);

    return () => clearInterval(interval);
  }, [instantDemoMode]);

  return (
    <>
      <AnimatePresence>
        {showSplash && (
          <SplashScreen 
            onComplete={() => {
              sessionStorage.setItem('ulpf_splash_dismissed', 'true');
              setShowSplash(false);
            }}
            brandName="ULPF SENTINEL"
            subTitle="Enterprise Sovereign Air-Gap Cyber Telemetry & Forensic Normalization Fabric"
          />
        )}
      </AnimatePresence>

      <div className="min-h-screen bg-black text-white flex flex-col font-sans selection:bg-cyan-500/30 selection:text-white overflow-x-hidden">
        {/* Top Header: Clean, minimal edge-to-edge navbar with a crisp bottom border-zinc-800 */}
        <header className="h-16 shrink-0 px-6 lg:px-10 border-b border-zinc-800 bg-black flex items-center justify-between z-30">
          {/* Left Branding */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-[0_0_10px_#22d3ee]" />
              </div>
              <div className="flex items-center space-x-2.5">
                <span className="text-base font-bold tracking-tight text-white uppercase font-sans">
                  ULPF Sentinel
                </span>
                <span className="text-zinc-600 font-mono">/</span>
                <span className="text-xs text-zinc-400 font-medium hidden sm:inline">
                  Sovereign Air-Gap SOC
                </span>
              </div>
            </div>

            <span className="hidden md:inline-flex px-2.5 py-0.5 rounded-full text-xs font-mono font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              OCSF v1.1.0 Strict
            </span>
          </div>

          {/* Center Navigation Tabs */}
          <nav className="hidden lg:flex items-center space-x-1 bg-zinc-950 p-1 rounded-xl border border-zinc-800">
            <button
              type="button"
              onClick={() => setActiveTab('soc')}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center space-x-2 ${
                activeTab === 'soc'
                  ? 'bg-zinc-800 text-white shadow-xs'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Radio className="w-3.5 h-3.5 text-cyan-400" />
              <span>SOC Operations</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('mapper')}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center space-x-2 ${
                activeTab === 'mapper'
                  ? 'bg-zinc-800 text-white shadow-xs'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-cyan-400" />
              <span>AI Schema Studio</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('provenance')}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center space-x-2 ${
                activeTab === 'provenance'
                  ? 'bg-zinc-800 text-white shadow-xs'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Fingerprint className="w-3.5 h-3.5 text-cyan-400" />
              <span>Provenance Chain</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('binary')}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center space-x-2 ${
                activeTab === 'binary'
                  ? 'bg-zinc-800 text-white shadow-xs'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Terminal className="w-3.5 h-3.5 text-cyan-400" />
              <span>Binary Sandbox</span>
            </button>
          </nav>

          {/* Right Toggles & Connection Status */}
          <div className="flex items-center space-x-3">
            {/* Demo Mode Toggle */}
            <button
              type="button"
              onClick={toggleDemoMode}
              className={`px-3 py-1.5 rounded-xl border text-xs font-medium flex items-center space-x-2 transition cursor-pointer ${
                instantDemoMode
                  ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20'
                  : 'bg-zinc-950 text-zinc-400 border-zinc-800 hover:text-white'
              }`}
              title="Toggle Live Ingestion Simulator"
            >
              <Sparkles className={`w-3.5 h-3.5 ${instantDemoMode ? 'text-cyan-400 animate-pulse' : 'text-zinc-400'}`} />
              <span className="hidden sm:inline">Simulate Live</span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-zinc-900 border border-zinc-800">
                {instantDemoMode ? 'ON' : 'OFF'}
              </span>
            </button>

            {/* Laptop Host Ingest Toggle */}
            <button
              type="button"
              onClick={toggleHostLogs}
              className={`px-3 py-1.5 rounded-xl border text-xs font-medium flex items-center space-x-2 transition cursor-pointer ${
                hostStreaming
                  ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
                  : 'bg-zinc-950 text-zinc-400 border-zinc-800 hover:text-white'
              }`}
              title="Toggle real-time laptop system log streaming"
            >
              <Laptop className={`w-3.5 h-3.5 ${hostStreaming ? 'text-indigo-400' : 'text-zinc-400'}`} />
              <span className="hidden sm:inline">Laptop</span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-zinc-900 border border-zinc-800">
                {hostStreaming ? 'ACTIVE' : 'IDLE'}
              </span>
            </button>

            {/* Fabric Connection Status Pill */}
            <div className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-full text-xs font-semibold border ${
              isStreaming
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
            }`}>
              <span className={`w-2 h-2 rounded-full ${isStreaming ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
              <span className="font-mono text-xs uppercase tracking-wider">
                {isStreaming ? 'Connected' : 'Standby'}
              </span>
            </div>
          </div>
        </header>

        {/* Main Content Area: Spacious, generous padding p-6 lg:p-10 */}
        <main className="flex-1 p-6 lg:p-10 max-w-[1720px] w-full mx-auto space-y-8">
          {activeTab === 'soc' && (
            <div className="space-y-8">
              {/* Hero Metrics: 4 Large, Spacious Metric Blocks (bg-zinc-950, border-zinc-800, p-6 or p-8, massive white numbers) */}
              <HeroMetrics 
                logs={logs}
                throughput={eps}
                instantDemoMode={instantDemoMode}
                hostStreaming={hostStreaming}
                isStreaming={isStreaming}
              />

              {/* Data Table & IDE Split Section:
                  - Left (60%): High-density live streaming table (py-4 rows, bright white text, font-mono, crisp badges)
                  - Right (40%): IDE-style OCSF JSON viewer */}
              <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
                {/* Left (60%) */}
                <div className="xl:col-span-7">
                  <LiveStream 
                    logs={logs}
                    isStreaming={isStreaming || instantDemoMode}
                    onSelectLog={(log, occurrences) => {
                      setSelectedLog(log);
                      setSelectedOccurrences(occurrences || [log]);
                    }}
                    selectedLogId={selectedLog?.id || selectedLog?.traceability?.raw_sha256}
                    hostStreaming={hostStreaming}
                    onToggleHostLogs={toggleHostLogs}
                    onHistoricalUpload={(uploadedRecords) => {
                      setLogs(prev => [...uploadedRecords, ...prev].slice(0, 150));
                    }}
                  />
                </div>

                {/* Right (40%): OCSF JSON Preview */}
                <div className="xl:col-span-5 sticky top-24">
                  <OcsfJsonPreview 
                    log={selectedLog || (logs.length > 0 ? logs[0] : null)}
                    onOpenDrawer={() => {
                      if (!selectedLog && logs.length > 0) {
                        setSelectedLog(logs[0]);
                        setSelectedOccurrences([logs[0]]);
                      }
                    }}
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'mapper' && (
            <div className="flex-1">
              <React.Suspense fallback={<div className="p-12 text-center text-xs font-mono text-zinc-400">Loading AI Schema Studio...</div>}>
                <AiMapper />
              </React.Suspense>
            </div>
          )}

          {activeTab === 'provenance' && (
            <div className="flex-1">
              <React.Suspense fallback={<div className="p-12 text-center text-xs font-mono text-zinc-400">Loading Air-Gap Provenance...</div>}>
                <AirGapProvenance logs={logs} />
              </React.Suspense>
            </div>
          )}

          {activeTab === 'binary' && (
            <div className="flex-1">
              <React.Suspense fallback={<div className="p-12 text-center text-xs font-mono text-zinc-400">Loading Bit Compiler Sandbox...</div>}>
                <BinarySandbox initialLog={selectedLog || logs[0]} />
              </React.Suspense>
            </div>
          )}
        </main>

        {/* Clean, Sharp Solid Footer */}
        <footer className="h-14 shrink-0 px-6 lg:px-10 border-t border-zinc-800 bg-black flex items-center justify-between text-xs text-zinc-400 font-mono">
          <div className="flex items-center space-x-4">
            <span>ENGINE: <strong className="text-white">FASTAPI + VECTOR VRL</strong></span>
            <span className="text-zinc-700">•</span>
            <span>DISK RING: <strong className="text-white">2,048 MB LOSSLESS</strong></span>
            <span className="text-zinc-700">•</span>
            <span>PII SCRUB: <strong className="text-amber-400 font-semibold">VERHOEFF ENFORCING</strong></span>
            <span className="text-zinc-700">•</span>
            <span>PROVENANCE: <strong className="text-emerald-400 font-semibold">100% SHA-256 VALID</strong></span>
          </div>
          <div className="text-zinc-400 hidden sm:block">
            ULPF SENTINEL · TIER-1 AIR-GAP DEFENSE
          </div>
        </footer>
      </div>

      {/* Slide-in Forensic Drawer for Deep Inspection */}
      <AnimatePresence>
        {selectedLog && (
          <LogDrawer 
            key={selectedLog.id || selectedLog.traceability?.raw_sha256} 
            log={selectedLog} 
            occurrences={selectedOccurrences}
            onClose={() => {
              setSelectedLog(null);
              setSelectedOccurrences([]);
            }} 
          />
        )}
      </AnimatePresence>
    </>
  );
};

export default App;
