import React, { useState, useRef, useEffect } from 'react';
import { 
  Terminal, 
  Copy, 
  Check, 
  Search, 
  Download, 
  Pause, 
  Play, 
  Layers, 
  Flame, 
  SlidersHorizontal,
  ChevronDown
} from 'lucide-react';
import type { ULPFLogRecord } from '../types';
import { exportLogs } from '../utils/exportFormats';

interface FirehoseTerminalProps {
  logs: ULPFLogRecord[];
  onSelectLog: (log: ULPFLogRecord) => void;
  selectedLogId?: string;
  isStreaming: boolean;
}

export const FirehoseTerminal: React.FC<FirehoseTerminalProps> = ({
  logs,
  onSelectLog,
  selectedLogId,
  isStreaming
}) => {
  const [isPaused, setIsPaused] = useState(false);
  const [filterQuery, setFilterQuery] = useState('');
  const [syntaxMode, setSyntaxMode] = useState<'raw' | 'ocsf_json' | 'compact'>('raw');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Freeze stream view if user paused
  const [frozenLogs, setFrozenLogs] = useState<ULPFLogRecord[]>(logs);

  useEffect(() => {
    if (!isPaused) {
      setFrozenLogs(logs);
    }
  }, [logs, isPaused]);

  const displayLogs = React.useMemo(() => {
    if (!filterQuery) return frozenLogs.slice(0, 100);
    const q = filterQuery.toLowerCase();
    return frozenLogs.filter(l => {
      const raw = (l?.traceability?.sanitized_raw || '').toLowerCase();
      const norm = JSON.stringify(l?.normalized_data || {}).toLowerCase();
      return raw.includes(q) || norm.includes(q);
    }).slice(0, 100);
  }, [frozenLogs, filterQuery]);

  const handleCopy = (text: string, id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  // Syntax highlighting for raw Syslog / Wire strings
  const formatRawWire = (raw: string, isMalicious: boolean, piiRedacted: boolean) => {
    // Highlight timestamps, IPs, hostnames
    let formatted = raw;
    // Replace IP addresses
    formatted = formatted.replace(/\b(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})\b/g, '<span class="text-cyan-400 font-semibold">$1</span>');
    // Replace Aadhaar redact tokens
    formatted = formatted.replace(/\[REDACTED_AADHAAR\]/g, '<span class="text-amber-400 bg-amber-500/20 px-1 py-0.5 rounded font-bold">[REDACTED_AADHAAR]</span>');
    // Replace Threat keywords
    formatted = formatted.replace(/(DROP|REJECT|DENIED|ATTACK|MALICIOUS|EXPLOIT|CVE-\d+-\d+)/gi, '<span class="text-rose-400 font-bold bg-rose-500/20 px-1 rounded">$1</span>');

    return formatted;
  };

  return (
    <div className="flex flex-col h-full bg-[#0A0A0A]/90 backdrop-blur-2xl border border-white/5 rounded-3xl p-5 shadow-2xl overflow-hidden transition-all duration-300">
      {/* Terminal Title Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-4 border-b border-white/5">
        <div className="flex items-center space-x-3">
          {/* macOS-style glowing terminal dots */}
          <div className="flex items-center space-x-1.5">
            <span className="w-3 h-3 rounded-full bg-rose-500/80 border border-rose-400/40 shadow-[0_0_8px_rgba(244,63,94,0.5)]" />
            <span className="w-3 h-3 rounded-full bg-amber-500/80 border border-amber-400/40 shadow-[0_0_8px_rgba(245,158,11,0.5)]" />
            <span className="w-3 h-3 rounded-full bg-emerald-500/80 border border-emerald-400/40 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
          </div>

          <div className="flex items-center space-x-2 pl-2">
            <Terminal className="w-4 h-4 text-cyan-400" />
            <span className="text-xs font-mono font-bold text-white tracking-wider uppercase">
              The Firehose // Sovereign Kernel & Syslog Ingest
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
              UDP:5140
            </span>
          </div>
        </div>

        {/* Terminal Controls Toolbar */}
        <div className="flex items-center space-x-2 shrink-0">
          {/* Format Selector Pills */}
          <div className="inline-flex bg-white/[0.03] border border-white/5 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setSyntaxMode('raw')}
              className={`px-2.5 py-1 rounded-lg text-xs font-mono font-medium transition cursor-pointer ${
                syntaxMode === 'raw' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              Raw Wire
            </button>
            <button
              type="button"
              onClick={() => setSyntaxMode('ocsf_json')}
              className={`px-2.5 py-1 rounded-lg text-xs font-mono font-medium transition cursor-pointer ${
                syntaxMode === 'ocsf_json' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              OCSF JSON
            </button>
            <button
              type="button"
              onClick={() => setSyntaxMode('compact')}
              className={`px-2.5 py-1 rounded-lg text-xs font-mono font-medium transition cursor-pointer ${
                syntaxMode === 'compact' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              Dense
            </button>
          </div>

          {/* Pause / Resume Stream */}
          <button
            type="button"
            onClick={() => setIsPaused(!isPaused)}
            className={`p-2 rounded-xl border transition cursor-pointer ${
              isPaused 
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' 
                : 'bg-white/[0.03] text-zinc-400 border-white/5 hover:text-white hover:bg-white/[0.06]'
            }`}
            title={isPaused ? 'Resume live autoscroll' : 'Pause stream inspection'}
          >
            {isPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
          </button>

          {/* Quick Search */}
          <div className="relative flex items-center w-36 lg:w-48">
            <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-2.5 pointer-events-none" />
            <input
              type="text"
              placeholder="Grep firehose..."
              value={filterQuery}
              onChange={(e) => setFilterQuery(e.target.value)}
              className="w-full bg-white/[0.03] border border-white/5 focus:border-cyan-500/50 text-xs pl-8 pr-2.5 py-1.5 rounded-xl text-zinc-100 placeholder-zinc-500 font-mono outline-none"
            />
          </div>
        </div>
      </div>

      {/* Terminal Viewport */}
      <div 
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto space-y-1.5 font-mono text-xs pr-1 no-scrollbar min-h-[420px] max-h-[600px] select-text"
      >
        {displayLogs.map((log, index) => {
          const norm = (log?.normalized_data as any) || {};
          const trace = (log?.traceability as any) || {};
          const isMalicious = Boolean(norm?.enrichment?.is_malicious || norm?.threat?.is_malicious);
          const isPii = Boolean(norm?.compliance?.pii_redacted || (trace?.redacted_payload && trace.redacted_payload.includes('[REDACTED_AADHAAR]')));
          const rawHash = trace?.raw_sha256 || trace?.raw_hash || '00000000';
          const isSelected = selectedLogId === log?.id || selectedLogId === rawHash;

          const rawWire = trace?.sanitized_raw || trace?.redacted_payload || norm?.activity_name || '';
          const time = trace?.ingest_timestamp 
            ? new Date(trace.ingest_timestamp).toLocaleTimeString([], { hour12: false, fractionalSecondDigits: 3 } as any)
            : '00:00:00.000';

          return (
            <div
              key={log?.id || index}
              onClick={() => onSelectLog(log)}
              className={`p-2.5 rounded-xl border transition-all duration-150 cursor-pointer group flex items-start justify-between gap-3 ${
                isSelected
                  ? 'bg-cyan-500/10 border-cyan-400/40 shadow-[0_0_15px_rgba(6,182,212,0.15)]'
                  : isMalicious
                  ? 'bg-rose-500/[0.04] border-rose-500/20 hover:bg-rose-500/[0.08] hover:border-rose-500/40'
                  : 'bg-white/[0.015] border-white/[0.03] hover:bg-white/[0.035] hover:border-white/10'
              }`}
            >
              {/* Left Log Content */}
              <div className="flex-1 overflow-hidden">
                <div className="flex items-center space-x-2.5 mb-1 text-[11px]">
                  <span className="text-zinc-500 font-mono select-none">
                    {String(index + 1).padStart(3, '0')}
                  </span>
                  <span className="text-zinc-400 font-mono">
                    {time}
                  </span>
                  <span className="text-zinc-600 font-mono">|</span>
                  <span className="text-cyan-400/90 font-bold uppercase text-[10px]">
                    {norm?.category_name || 'NETWORK'}
                  </span>
                  {norm?.class_uid && (
                    <span className="text-[10px] text-zinc-500 font-mono">
                      UID:{norm.class_uid}
                    </span>
                  )}
                  {isMalicious && (
                    <span className="px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30 uppercase">
                      THREAT HIT
                    </span>
                  )}
                  {isPii && (
                    <span className="px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 uppercase">
                      PII INTERCEPTED
                    </span>
                  )}
                </div>

                {/* Body Rendering depending on mode */}
                {syntaxMode === 'raw' && (
                  <div 
                    className="text-zinc-300 break-all leading-relaxed text-[11px]"
                    dangerouslySetInnerHTML={{
                      __html: formatRawWire(rawWire, isMalicious, isPii)
                    }}
                  />
                )}

                {syntaxMode === 'ocsf_json' && (
                  <pre className="text-[11px] text-zinc-300 overflow-x-auto p-2 rounded-lg bg-black/40 border border-white/5 no-scrollbar">
                    {JSON.stringify(norm, null, 2)}
                  </pre>
                )}

                {syntaxMode === 'compact' && (
                  <div className="flex items-center space-x-4 text-xs">
                    <span className="text-zinc-400">Src: <strong className="text-cyan-400">{norm?.src_endpoint?.ip || '0.0.0.0'}</strong></span>
                    <span className="text-zinc-400">Dst: <strong className="text-zinc-200">{norm?.dst_endpoint?.ip || '10.0.0.1'}</strong></span>
                    <span className="text-zinc-400">Act: <strong className="text-zinc-300 truncate max-w-[200px]">{norm?.activity_name || 'Activity'}</strong></span>
                  </div>
                )}
              </div>

              {/* Right: Quick SHA & Copy button */}
              <div className="shrink-0 flex items-center space-x-1.5 pt-0.5 opacity-40 group-hover:opacity-100 transition">
                <span className="text-[10px] text-zinc-500 font-mono hidden md:inline">
                  {rawHash.slice(0, 8)}...
                </span>
                <button
                  type="button"
                  onClick={(e) => handleCopy(rawWire, log?.id || String(index), e)}
                  className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
                  title="Copy raw log line"
                >
                  {copiedId === (log?.id || String(index)) ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            </div>
          );
        })}

        {displayLogs.length === 0 && (
          <div className="p-12 text-center text-zinc-500 font-mono text-xs">
            No firehose entries matching current grep filter
          </div>
        )}
      </div>

      {/* Terminal Status Footer */}
      <div className="flex items-center justify-between pt-3 mt-3 border-t border-white/5 text-[11px] font-mono text-zinc-400">
        <div className="flex items-center space-x-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>RING BUFFER: 2,048 MB · LOSSLESS WRITE</span>
        </div>
        <div className="text-zinc-400">
          Showing {displayLogs.length} events · Click any record to inspect forensic drawer
        </div>
      </div>
    </div>
  );
};
