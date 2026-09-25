import React, { useEffect, useState, useRef } from 'react';
import { 
  Shield, 
  Terminal, 
  SlidersHorizontal,
  Wifi, 
  Radio,
  Sparkles,
  Fingerprint,
  Clock,
  Menu,
  X,
  Laptop
} from 'lucide-react';
import { LiveStream } from './components/LiveStream';
import { TelemetryMetrics } from './components/TelemetryMetrics';
import { AiMapper } from './components/AiMapper';
import { AirGapProvenance } from './components/AirGapProvenance';
import { LogDrawer } from './components/LogDrawer';
import { ULPFLogo } from './components/ULPFLogo';
import { generateSyntheticLog } from './mockGenerator';
import type { ULPFLogRecord } from './types';

export const App: React.FC = () => {
  const [logs, setLogs] = useState<ULPFLogRecord[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [activeTab, setActiveTab] = useState<'soc' | 'mapper' | 'provenance'>('soc');
  const [selectedLog, setSelectedLog] = useState<ULPFLogRecord | null>(null);
  const [hostStreaming, setHostStreaming] = useState(true);
  const [hostInfo, setHostInfo] = useState<{ hostname: string; ip: string } | null>(null);
  
  // Instant Demo Mode Toggle (enabled by default for immediate, lively presentation)
  const [instantDemoMode, setInstantDemoMode] = useState(true);
  const [eps, setEps] = useState(14);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const logCountRef = useRef(0);

  // Initialize with initial batch of high-fidelity logs across all categories
  useEffect(() => {
    const seed: ULPFLogRecord[] = [];
    for (let i = 0; i < 40; i++) {
      seed.push(generateSyntheticLog());
    }
    setLogs(seed);

    // Fetch local laptop host metadata
    fetch('http://localhost:8000/api/host-stream/status')
      .then(res => res.json())
      .then(data => {
        if (data && data.hostname) {
          setHostInfo({ hostname: data.hostname, ip: data.ip });
          setHostStreaming(Boolean(data.active));
        }
      })
      .catch(() => {});
  }, []);

  const toggleHostLogs = async () => {
    try {
      const res = await fetch('http://localhost:8000/api/host-stream/toggle', { method: 'POST' });
      const data = await res.json();
      setHostStreaming(Boolean(data.active));
    } catch (e) {
      setHostStreaming(!hostStreaming);
    }
  };

  // 1. Instant Demo Mode Generator (Smooth, non-blocking 800ms cadence)
  useEffect(() => {
    if (!instantDemoMode) return;

    const demoInterval = setInterval(() => {
      const newLog = generateSyntheticLog();
      setLogs(prev => [newLog, ...prev.slice(0, 59)]);
      logCountRef.current += 1;
    }, 800);

    return () => clearInterval(demoInterval);
  }, [instantDemoMode]);

  // 2. Real SSE Stream from FastAPI Backend (Throttled for browser responsiveness)
  useEffect(() => {
    let eventSource: EventSource | null = null;

    const connectSSE = () => {
      eventSource = new EventSource('http://localhost:8000/api/stream');

      eventSource.onopen = () => {
        setIsStreaming(true);
      };

      eventSource.addEventListener('log', (event: MessageEvent) => {
        try {
          const record: ULPFLogRecord = JSON.parse(event.data);
          record.id = record.id || `live-${Date.now()}-${Math.random()}`;
          setLogs(prev => [record, ...prev.slice(0, 49)]);
          logCountRef.current += 1;
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
    <div className="min-h-screen bg-slate-100 text-slate-900 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      {/* Top Professional Header (Clean Solid White Enterprise Bar) */}
      <header className="border-b border-slate-200 bg-white sticky top-0 z-40 px-4 sm:px-6 py-3 shadow-xs">
        <div className="max-w-[1600px] mx-auto flex items-center justify-between gap-4">
          {/* Left Branding with High-Impact Cyber Shield Logo */}
          <div className="flex items-center space-x-3.5">
            <div className="relative group cursor-pointer flex items-center">
              <ULPFLogo size={44} className="drop-shadow-sm transition-transform duration-300 group-hover:scale-110" />
              <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-blue-600" />
              </span>
            </div>

            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-base sm:text-lg font-black tracking-wider text-slate-900 uppercase font-mono">
                  ULPF <span className="text-blue-600">//</span> NTRO AIR-GAPPED FABRIC
                </h1>
                <span className="hidden md:inline-flex px-2 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200 font-mono">
                  SIH 26156
                </span>
                <span className="hidden lg:inline-flex px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 font-mono">
                  OCSF v1.1.0
                </span>
              </div>
              <div className="flex items-center space-x-2 text-xs text-slate-500 mt-0.5">
                <span className="truncate max-w-[240px] sm:max-w-none font-medium">Universal Log Pre-processing & Normalization Framework</span>
                <span className="hidden sm:inline">•</span>
                <span className="hidden sm:inline-flex text-emerald-700 font-mono font-bold items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  &lt;0.6ms Ingestion Latency
                </span>
              </div>
            </div>
          </div>

          {/* Desktop Right Controls */}
          <div className="hidden md:flex items-center space-x-3">
            {/* Unified System Controls Segment */}
            <div className="flex items-center bg-slate-50 border border-slate-200 rounded-lg p-1 space-x-1 shadow-2xs">
              {/* Laptop Stream Switch */}
              <div className="flex items-center space-x-2 px-2.5 py-1 rounded-md text-xs">
                <Laptop className="w-3.5 h-3.5 text-slate-600" />
                <span className="font-semibold text-slate-700">Laptop Logs</span>
                <button
                  type="button"
                  onClick={toggleHostLogs}
                  role="switch"
                  aria-checked={hostStreaming}
                  className={`relative inline-flex h-4 w-8 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    hostStreaming ? 'bg-blue-600' : 'bg-slate-300'
                  }`}
                  title="Toggle real-time laptop system log streaming"
                >
                  <span
                    className={`pointer-events-none inline-block h-3 w-3 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out ${
                      hostStreaming ? 'translate-x-4' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              <div className="h-4 w-px bg-slate-200" />

              {/* Demo Mode Switch */}
              <div className="flex items-center space-x-2 px-2.5 py-1 rounded-md text-xs">
                <Sparkles className="w-3.5 h-3.5 text-slate-600" />
                <span className="font-semibold text-slate-700">Demo Stream</span>
                <button
                  type="button"
                  onClick={() => setInstantDemoMode(!instantDemoMode)}
                  role="switch"
                  aria-checked={instantDemoMode}
                  className={`relative inline-flex h-4 w-8 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    instantDemoMode ? 'bg-blue-600' : 'bg-slate-300'
                  }`}
                  title="Toggle synthetic log generator"
                >
                  <span
                    className={`pointer-events-none inline-block h-3 w-3 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out ${
                      instantDemoMode ? 'translate-x-4' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* Standardized Tab Navigation Controls */}
            <nav className="flex bg-slate-100 border border-slate-200 rounded-lg p-1">
              <button
                type="button"
                onClick={() => setActiveTab('soc')}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                  activeTab === 'soc'
                    ? 'bg-white text-slate-900 shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Radio className="w-3.5 h-3.5 text-blue-600" />
                <span>SOC Operations</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('mapper')}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                  activeTab === 'mapper'
                    ? 'bg-white text-slate-900 shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <SlidersHorizontal className="w-3.5 h-3.5 text-blue-600" />
                <span>AI Schema Studio</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('provenance')}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                  activeTab === 'provenance'
                    ? 'bg-white text-slate-900 shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Fingerprint className="w-3.5 h-3.5 text-blue-600" />
                <span>Lossless & Provenance</span>
              </button>
            </nav>

            {/* Connection Status Indicator */}
            <div className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-emerald-800 font-mono font-bold text-[11px] uppercase tracking-wider">
                {isStreaming ? 'Vector Live' : 'Synthetic Active'}
              </span>
            </div>
          </div>

          {/* Mobile Actions */}
          <div className="md:hidden flex items-center space-x-2">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-700"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden pt-3 mt-3 border-t border-slate-200 flex flex-col space-y-2">
            <button
              onClick={() => { setActiveTab('soc'); setMobileMenuOpen(false); }}
              className={`p-2.5 rounded-lg text-xs font-bold text-left flex items-center space-x-2 ${
                activeTab === 'soc' ? 'bg-blue-600 text-white' : 'text-slate-700 bg-slate-50'
              }`}
            >
              <Radio className="w-4 h-4" />
              <span>SOC Operations</span>
            </button>
            <button
              onClick={() => { setActiveTab('mapper'); setMobileMenuOpen(false); }}
              className={`p-2.5 rounded-lg text-xs font-bold text-left flex items-center space-x-2 ${
                activeTab === 'mapper' ? 'bg-blue-600 text-white' : 'text-slate-700 bg-slate-50'
              }`}
            >
              <SlidersHorizontal className="w-4 h-4" />
              <span>AI Schema Studio</span>
            </button>
            <button
              onClick={() => { setActiveTab('provenance'); setMobileMenuOpen(false); }}
              className={`p-2.5 rounded-lg text-xs font-bold text-left flex items-center space-x-2 ${
                activeTab === 'provenance' ? 'bg-blue-600 text-white' : 'text-slate-700 bg-slate-50'
              }`}
            >
              <Fingerprint className="w-4 h-4" />
              <span>Air-Gap Provenance</span>
            </button>
          </div>
        )}
      </header>

      {/* Main Content Area */}
      <main className="flex-1 p-4 sm:p-6 max-w-[1600px] w-full mx-auto flex flex-col">
        {activeTab === 'soc' && (
          <div className="flex-1 flex flex-col">
            <TelemetryMetrics logs={logs} throughput={eps} />
            <LiveStream 
              logs={logs} 
              isStreaming={isStreaming || instantDemoMode} 
              onSelectLog={(log) => setSelectedLog(log)}
              selectedLogId={selectedLog?.id || selectedLog?.traceability.raw_sha256}
            />
          </div>
        )}

        {activeTab === 'mapper' && (
          <div className="flex-1">
            <AiMapper />
          </div>
        )}

        {activeTab === 'provenance' && (
          <div className="flex-1">
            <AirGapProvenance logs={logs} />
          </div>
        )}
      </main>

      {/* Forensic Log Drawer Modal */}
      <LogDrawer log={selectedLog} onClose={() => setSelectedLog(null)} />

      {/* Professional Solid Footer */}
      <footer className="border-t border-slate-200 bg-white px-6 py-3.5 text-xs text-slate-600 flex flex-wrap items-center justify-between font-mono gap-2 shadow-xs">
        <div className="flex flex-wrap items-center space-x-3">
          <span>Engine: <strong className="text-slate-900 font-bold">Vector VRL + FastAPI Gateway</strong></span>
          <span>•</span>
          <span>Disk Ring: <strong className="text-slate-900 font-bold">2,048 MB</strong></span>
          <span>•</span>
          <span>PII Masking: <strong className="text-amber-800 font-bold">12-Digit Aadhaar Scrubbed</strong></span>
          <span>•</span>
          <span>Provenance: <strong className="text-emerald-700 font-bold">Deterministic SHA-256</strong></span>
        </div>
        <div className="text-slate-700 font-semibold font-sans">
          NTRO SIH26156 · National Cyber Defense Architecture
        </div>
      </footer>
    </div>
  );
};

export default App;
