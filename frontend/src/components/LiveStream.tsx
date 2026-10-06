import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShieldAlert, 
  ShieldCheck, 
  Search, 
  Lock, 
  Filter, 
  ChevronRight, 
  Info,
  Laptop,
  Layers,
  Copy,
  Download,
  Check
} from 'lucide-react';
import { exportLogs } from '../utils/exportFormats';
import type { ULPFLogRecord } from '../types';

interface LiveStreamProps {
  logs: ULPFLogRecord[];
  isStreaming: boolean;
  onSelectLog: (log: ULPFLogRecord, occurrences?: ULPFLogRecord[]) => void;
  selectedLogId?: string;
  hostStreaming?: boolean;
  onToggleHostLogs?: () => void;
  filterMode?: 'all' | 'laptop' | 'threats' | 'pii' | 'blocks';
  onFilterModeChange?: (mode: 'all' | 'laptop' | 'threats' | 'pii' | 'blocks') => void;
}

type FilterMode = 'all' | 'laptop' | 'threats' | 'pii' | 'blocks';

interface DisplayLogEntry {
  log: ULPFLogRecord;
  repeatCount: number;
  occurrences: ULPFLogRecord[];
}

export const LiveStream: React.FC<LiveStreamProps> = ({ 
  logs, 
  onSelectLog,
  selectedLogId,
  hostStreaming = false,
  onToggleHostLogs,
  filterMode: controlledFilterMode,
  onFilterModeChange
}) => {
  // If controlledFilterMode is provided, use it; otherwise use local state
  const [internalFilterMode, setInternalFilterMode] = useState<FilterMode>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [collapseDuplicates, setCollapseDuplicates] = useState(true);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [copiedHash, setCopiedHash] = useState<string | null>(null);

  const activeFilter = controlledFilterMode !== undefined ? controlledFilterMode : internalFilterMode;

  const handleFilterChange = (mode: FilterMode) => {
    if (onFilterModeChange) {
      onFilterModeChange(mode);
    } else {
      setInternalFilterMode(mode);
    }
  };

  const counts = React.useMemo(() => {
    let laptopCount = 0;
    let threatCount = 0;
    let piiCount = 0;
    let blockCount = 0;

    logs.forEach(log => {
      const norm = log?.normalized_data as any;
      const trace = log?.traceability as any;
      const isLaptop = norm?.metadata?.source_type === 'laptop_host' || (trace?.sanitized_raw || '').startsWith('[HOST:');
      const isMalicious = norm?.enrichment?.is_malicious || norm?.threat?.is_malicious;
      const piiRedacted = norm?.compliance?.pii_redacted || trace?.redacted_payload;
      const act = (norm?.activity_name || '').toLowerCase();
      const raw = (trace?.sanitized_raw || '').toLowerCase();
      const isBlock = act.includes('block') || act.includes('denied') || raw.includes('denied') || raw.includes('block');

      if (isLaptop) laptopCount++;
      if (isMalicious) threatCount++;
      if (piiRedacted) piiCount++;
      if (isBlock) blockCount++;
    });

    return { laptopCount, threatCount, piiCount, blockCount };
  }, [logs]);

  // Step 1: Filter raw logs based on active view and search term
  const rawFilteredLogs = React.useMemo(() => {
    return logs.filter(log => {
      const norm = log?.normalized_data as any;
      const trace = log?.traceability as any;
      const isMalicious = norm?.enrichment?.is_malicious || norm?.threat?.is_malicious;
      const piiRedacted = norm?.compliance?.pii_redacted || trace?.redacted_payload;
      const isLaptop = norm?.metadata?.source_type === 'laptop_host' || (trace?.sanitized_raw || '').startsWith('[HOST:');

      if (activeFilter === 'laptop' && !isLaptop) {
        return false;
      }
      if (activeFilter === 'threats' && !isMalicious) {
        return false;
      }
      if (activeFilter === 'pii' && !piiRedacted) {
        return false;
      }
      if (activeFilter === 'blocks') {
        const act = (norm?.activity_name || '').toLowerCase();
        const raw = (trace?.sanitized_raw || '').toLowerCase();
        if (!act.includes('block') && !act.includes('denied') && !raw.includes('denied') && !raw.includes('block')) {
          return false;
        }
      }

      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        const raw = (trace?.sanitized_raw || '').toLowerCase();
        const src = (norm?.src_endpoint?.ip || '').toLowerCase();
        const dst = (norm?.dst_endpoint?.ip || '').toLowerCase();
        const cat = (norm?.category_name || '').toLowerCase();
        const actor = (norm?.enrichment?.threat_actor || norm?.threat?.actor || '').toLowerCase();
        return raw.includes(term) || src.includes(term) || dst.includes(term) || cat.includes(term) || actor.includes(term);
      }
      return true;
    });
  }, [logs, activeFilter, searchTerm]);

  // Step 2: Intelligent Deduplication / Grouping
  const displayedEntries: DisplayLogEntry[] = React.useMemo(() => {
    if (!collapseDuplicates) {
      return rawFilteredLogs.map(log => ({ log, repeatCount: 1, occurrences: [log] }));
    }

    const grouped: DisplayLogEntry[] = [];
    const seenMap = new Map<string, number>();

    for (const log of rawFilteredLogs) {
      const norm = log?.normalized_data as any;
      let activity = norm?.activity_name || '';
      // If it's host telemetry, group under common action 'Host Telemetry'
      if (activity.toLowerCase().includes('host telemetry') || activity.toLowerCase().includes('systemd-hostmon')) {
        activity = 'Host Telemetry Pulse';
      }
      
      const key = `${norm?.class_uid || ''}_${norm?.category_name || ''}_${activity}_${norm?.src_endpoint?.ip || ''}_${norm?.dst_endpoint?.ip || ''}`;

      if (seenMap.has(key)) {
        const existingIndex = seenMap.get(key)!;
        grouped[existingIndex].repeatCount += 1;
        grouped[existingIndex].occurrences.push(log);
      } else {
        seenMap.set(key, grouped.length);
        grouped.push({ log, repeatCount: 1, occurrences: [log] });
      }
    }

    return grouped;
  }, [rawFilteredLogs, collapseDuplicates]);

  const getSeverityBadge = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'critical':
        return (
          <span className="px-2.5 py-0.5 text-xs font-bold uppercase rounded-md bg-rose-50 text-rose-700 border border-rose-200 flex items-center gap-1 w-max">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-600 animate-pulse" />
            Critical
          </span>
        );
      case 'high':
        return (
          <span className="px-2.5 py-0.5 text-xs font-bold uppercase rounded-md bg-amber-50 text-amber-800 border border-amber-200 w-max">
            High
          </span>
        );
      case 'medium':
        return (
          <span className="px-2.5 py-0.5 text-xs font-semibold uppercase rounded-md bg-yellow-50 text-yellow-800 border border-yellow-200 w-max">
            Medium
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-0.5 text-xs font-semibold uppercase rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 w-max">
            Info
          </span>
        );
    }
  };

  return (
    <div className="flex flex-col h-full bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
      {/* Top Filter & Search Bar */}
      <div className="p-3.5 border-b border-slate-200 bg-slate-50/80 flex flex-wrap items-center justify-between gap-3">
        {/* Unified Segmented Filter Control */}
        <div className="flex items-center space-x-1.5 flex-wrap">
          <span className="text-[11px] text-slate-500 mr-1.5 flex items-center gap-1 font-mono uppercase font-bold">
            <Filter className="w-3.5 h-3.5 text-slate-500" />
            Views:
          </span>

          <div className="flex bg-slate-200/70 p-1 rounded-lg border border-slate-200/80 space-x-1">
            <button
              type="button"
              onClick={() => handleFilterChange('all')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer flex items-center space-x-1.5 ${
                activeFilter === 'all'
                  ? 'bg-white text-slate-900 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>All Events</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                activeFilter === 'all' ? 'bg-slate-100 text-slate-700' : 'bg-slate-300/50 text-slate-600'
              }`}>
                {logs.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                handleFilterChange('laptop');
                if (!hostStreaming && onToggleHostLogs) {
                  onToggleHostLogs();
                }
              }}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer flex items-center space-x-1.5 ${
                activeFilter === 'laptop'
                  ? 'bg-white text-slate-900 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${hostStreaming ? 'bg-indigo-500 animate-pulse' : 'bg-slate-400'}`} />
              <Laptop className="w-3.5 h-3.5 text-indigo-600" />
              <span>Laptop Logs</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                activeFilter === 'laptop' ? 'bg-indigo-50 text-indigo-700 font-bold' : 'bg-slate-300/50 text-slate-600'
              }`}>
                {counts.laptopCount}
              </span>
            </button>

            <button
              type="button"
              onClick={() => handleFilterChange('threats')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer flex items-center space-x-1.5 ${
                activeFilter === 'threats'
                  ? 'bg-white text-slate-900 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-rose-500" />
              <ShieldAlert className="w-3.5 h-3.5 text-slate-600" />
              <span>Threat Alerts</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                activeFilter === 'threats' ? 'bg-rose-50 text-rose-700 font-bold' : 'bg-slate-300/50 text-slate-600'
              }`}>
                {counts.threatCount}
              </span>
            </button>

            <button
              type="button"
              onClick={() => handleFilterChange('pii')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer flex items-center space-x-1.5 ${
                activeFilter === 'pii'
                  ? 'bg-white text-slate-900 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              <Lock className="w-3.5 h-3.5 text-slate-600" />
              <span>Aadhaar Scrubbed</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                activeFilter === 'pii' ? 'bg-amber-50 text-amber-800 font-bold' : 'bg-slate-300/50 text-slate-600'
              }`}>
                {counts.piiCount}
              </span>
            </button>

            <button
              type="button"
              onClick={() => handleFilterChange('blocks')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer flex items-center space-x-1.5 ${
                activeFilter === 'blocks'
                  ? 'bg-white text-slate-900 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-slate-500" />
              <span>Firewall Blocks</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                activeFilter === 'blocks' ? 'bg-slate-100 text-slate-700 font-bold' : 'bg-slate-300/50 text-slate-600'
              }`}>
                {counts.blockCount}
              </span>
            </button>
          </div>
        </div>

        {/* Right Status & Controls */}
        <div className="flex items-center space-x-2">
          {/* Deduplicate / Group Duplicates Toggle */}
          <button
            type="button"
            onClick={() => setCollapseDuplicates(!collapseDuplicates)}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 border transition cursor-pointer ${
              collapseDuplicates 
                ? 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100' 
                : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'
            }`}
            title="Group repetitive log occurrences into a single item with count badge"
          >
            <Layers className="w-3.5 h-3.5 text-blue-600" />
            <span className="hidden sm:inline">Group Duplicates</span>
            <span className={`px-1 py-0.2 text-[10px] font-mono rounded ${collapseDuplicates ? 'bg-blue-200/60 text-blue-900' : 'bg-slate-100 text-slate-500'}`}>
              {collapseDuplicates ? 'ON' : 'OFF'}
            </span>
          </button>

          {hostStreaming && (
            <div className="hidden sm:flex items-center space-x-1.5 px-2.5 py-1 rounded-md bg-emerald-50 border border-emerald-200 text-[11px] font-mono font-bold text-emerald-800 animate-pulse">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              <span>LIVE LAPTOP FEED ACTIVE</span>
            </div>
          )}

          {/* Multi-Format Export Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowExportMenu(!showExportMenu)}
              className="px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 transition cursor-pointer"
              title="Download logs in any format (JSON, CSV, CEF, Syslog, JSONL)"
            >
              <Download className="w-3.5 h-3.5 text-blue-600" />
              <span className="hidden sm:inline">Export</span>
            </button>

            {showExportMenu && (
              <div 
                className="absolute right-0 mt-1 w-44 bg-white rounded-lg shadow-lg border border-slate-200 py-1.5 z-50 text-xs font-sans"
                onMouseLeave={() => setShowExportMenu(false)}
              >
                <div className="px-3 py-1 text-[10px] uppercase font-bold text-slate-400 font-mono border-b border-slate-100 mb-1">
                  Download {displayedEntries.length} Logs
                </div>
                <button
                  type="button"
                  onClick={() => {
                    exportLogs(displayedEntries.map(e => e.log), 'json', `ulpf_${activeFilter}_logs`);
                    setShowExportMenu(false);
                  }}
                  className="w-full text-left px-3 py-1.5 hover:bg-slate-50 text-slate-700 flex items-center justify-between cursor-pointer"
                >
                  <span>JSON (OCSF 1.1.0)</span>
                  <span className="text-[10px] font-mono text-slate-400">.json</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    exportLogs(displayedEntries.map(e => e.log), 'csv', `ulpf_${activeFilter}_logs`);
                    setShowExportMenu(false);
                  }}
                  className="w-full text-left px-3 py-1.5 hover:bg-slate-50 text-slate-700 flex items-center justify-between cursor-pointer"
                >
                  <span>CSV Spreadsheet</span>
                  <span className="text-[10px] font-mono text-slate-400">.csv</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    exportLogs(displayedEntries.map(e => e.log), 'cef', `ulpf_${activeFilter}_logs`);
                    setShowExportMenu(false);
                  }}
                  className="w-full text-left px-3 py-1.5 hover:bg-slate-50 text-slate-700 flex items-center justify-between cursor-pointer"
                >
                  <span>ArcSight CEF</span>
                  <span className="text-[10px] font-mono text-slate-400">.cef</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    exportLogs(displayedEntries.map(e => e.log), 'syslog', `ulpf_${activeFilter}_logs`);
                    setShowExportMenu(false);
                  }}
                  className="w-full text-left px-3 py-1.5 hover:bg-slate-50 text-slate-700 flex items-center justify-between cursor-pointer"
                >
                  <span>RFC5424 Syslog</span>
                  <span className="text-[10px] font-mono text-slate-400">.log</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    exportLogs(displayedEntries.map(e => e.log), 'jsonl', `ulpf_${activeFilter}_logs`);
                    setShowExportMenu(false);
                  }}
                  className="w-full text-left px-3 py-1.5 hover:bg-slate-50 text-slate-700 flex items-center justify-between cursor-pointer"
                >
                  <span>JSONL Lines</span>
                  <span className="text-[10px] font-mono text-slate-400">.jsonl</span>
                </button>
              </div>
            )}
          </div>

          {/* Search Bar matching exact height */}
          <div className="relative flex items-center">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 pointer-events-none" />
            <input
              type="text"
              placeholder="Filter IP, actor, payload..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-white border border-slate-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 text-xs pl-8.5 pr-3 py-1.5 rounded-lg text-slate-900 placeholder-slate-400 w-52 md:w-60 transition-all outline-none"
            />
          </div>
        </div>
      </div>

      {/* Clean Table Stream */}
      <div className="flex-1 overflow-x-auto overflow-y-auto min-h-[420px] max-h-[580px]">
        <table className="w-full text-left text-xs border-collapse">
          <thead className="sticky top-0 bg-slate-100 border-b border-slate-200 text-slate-700 uppercase tracking-wider font-mono text-[11px] z-10 shadow-sm">
            <tr>
              <th className="py-3 px-3.5 font-bold">Time / Fingerprint</th>
              <th className="py-3 px-3.5 font-bold">OCSF Taxonomy</th>
              <th className="py-3 px-3.5 font-bold">Source Endpoint</th>
              <th className="py-3 px-3.5 font-bold">Target Destination</th>
              <th className="py-3 px-3.5 font-bold">Severity</th>
              <th className="py-3 px-3.5 font-bold">Threat Correlation</th>
              <th className="py-3 px-3.5 font-bold">PII Guard</th>
              <th className="py-3 px-3.5 text-right font-bold">Inspect</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-mono">
            {displayedEntries.map(({ log, repeatCount, occurrences }, index) => {
              const norm = (log?.normalized_data as any) || {};
              const trace = (log?.traceability as any) || {};
              const isMalicious = Boolean(norm?.enrichment?.is_malicious || norm?.threat?.is_malicious);
              const piiRedacted = Boolean(norm?.compliance?.pii_redacted || (trace?.redacted_payload && trace.redacted_payload.includes('[REDACTED_AADHAAR]')));
              const rawHash = trace?.raw_sha256 || trace?.raw_hash || '0000000000';
              const isSelected = selectedLogId === log?.id || selectedLogId === rawHash;
              
              // Extract timestamp with millisecond precision to show true real-time arrival
              let timeString = 'Just now';
              if (trace?.ingest_timestamp) {
                const d = new Date(trace.ingest_timestamp);
                const base = d.toLocaleTimeString([], { hour12: false });
                const ms = String(d.getMilliseconds()).padStart(3, '0');
                timeString = `${base}.${ms}`;
              } else if (norm?.activity_name) {
                const timeMatch = norm.activity_name.match(/(\d{2}:\d{2}:\d{2})/);
                if (timeMatch) timeString = timeMatch[1];
              }

              const shaPrefix = rawHash.substring(0, 10);
              const category = norm?.category_name || norm?.class_name || 'Network Activity';
              const severity = norm?.severity || norm?.threat?.severity_level || (isMalicious ? 'Critical' : 'Informational');
              const threatActor = norm?.enrichment?.threat_actor || norm?.threat?.actor || (isMalicious ? 'Threat Detected' : 'Benign');
              const mitreId = norm?.enrichment?.mitre_id || norm?.threat?.mitre_id;
              const isLaptopEvent = norm?.metadata?.source_type === 'laptop_host' || (trace?.sanitized_raw || '').startsWith('[HOST:');
              const isLatest = index === 0;

              return (
                <tr
                  key={log?.id || rawHash || `${index}-${Date.now()}`}
                  onClick={() => onSelectLog(log, occurrences)}
                  className={`transition-all duration-200 cursor-pointer ${
                    isLatest 
                      ? (isMalicious ? 'animate-threat-entry' : isLaptopEvent ? 'animate-laptop-entry' : 'animate-log-entry') 
                      : ''
                  } ${
                    isSelected
                      ? 'bg-blue-50 border-l-4 border-l-blue-600'
                      : isMalicious
                      ? 'bg-rose-50/70 hover:bg-rose-100/70 border-l-4 border-l-rose-500'
                      : isLaptopEvent
                      ? 'bg-indigo-50/30 hover:bg-indigo-50/60 border-l-4 border-l-indigo-400'
                      : 'bg-white hover:bg-slate-50 border-l-4 border-l-transparent'
                  }`}
                >
                  {/* Timestamp & SHA */}
                  <td className="py-2.5 px-3.5 whitespace-nowrap">
                    <div className="text-slate-900 font-bold text-xs flex items-center space-x-1.5">
                      <span>{timeString}</span>
                      {repeatCount > 1 && (
                        <span 
                          title={`${repeatCount} identical log entries collapsed`}
                          className="px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold bg-blue-100 text-blue-800 border border-blue-200 animate-pulse"
                        >
                          ×{repeatCount}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center space-x-1 mt-0.5">
                      <span className="text-[11px] text-slate-500 font-mono truncate max-w-[85px]" title={rawHash}>
                        {shaPrefix}...
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigator.clipboard.writeText(rawHash);
                          setCopiedHash(rawHash);
                          setTimeout(() => setCopiedHash(null), 1500);
                        }}
                        className="text-slate-400 hover:text-blue-600 transition cursor-pointer p-0.5 rounded hover:bg-slate-200/50"
                        title="Copy complete SHA-256 hash"
                      >
                        {copiedHash === rawHash ? (
                          <Check className="w-3 h-3 text-emerald-600" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </button>
                    </div>
                  </td>

                  {/* OCSF Category & Action */}
                  <td className="py-2.5 px-3.5 whitespace-nowrap">
                    <div className="flex items-center space-x-1.5">
                      <span className={norm?.metadata?.source_type === 'laptop_host' ? "text-indigo-700 font-bold text-xs" : "text-blue-700 font-bold text-xs"}>
                        {category}
                      </span>
                      {norm?.class_uid && (
                        <span className="text-[10px] text-slate-500 font-mono font-medium px-1.5 py-0.2 rounded bg-slate-100 border border-slate-200">
                          {norm.class_uid}
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-700 truncate max-w-[260px] font-sans font-medium mt-0.5" title={norm?.activity_name}>
                      {norm?.activity_name || 'Activity'}
                    </div>
                  </td>

                  {/* Source Endpoint */}
                  <td className="py-2.5 px-3.5 whitespace-nowrap">
                    <div className="flex items-center space-x-1.5">
                      <span className={`font-semibold text-xs shrink-0 ${
                        isMalicious ? 'text-rose-700 font-bold' : norm?.metadata?.source_type === 'laptop_host' ? 'text-indigo-700 font-bold' : 'text-slate-900'
                      }`}>
                        {norm?.src_endpoint?.ip || '0.0.0.0'}
                      </span>
                      {norm?.src_endpoint?.geo && (
                        <span 
                          title={norm.src_endpoint.geo}
                          className={`text-[10px] px-1.5 py-0.2 rounded border font-sans font-medium flex items-center gap-1 max-w-[130px] truncate ${
                          norm?.metadata?.source_type === 'laptop_host'
                            ? 'bg-indigo-50 text-indigo-750 border-indigo-200 font-bold'
                            : 'bg-slate-100 text-slate-700 border border-slate-200'
                        }`}>
                          {norm?.metadata?.source_type === 'laptop_host' && <Laptop className="w-2.5 h-2.5 text-indigo-600 shrink-0" />}
                          <span className="truncate">{norm.src_endpoint.geo}</span>
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Target Destination */}
                  <td className="py-2.5 px-3.5 whitespace-nowrap">
                    <div className="text-slate-800 text-xs flex items-center space-x-1">
                      <span className="shrink-0">{norm?.dst_endpoint?.ip || '10.0.0.1'}</span>
                      {norm?.dst_endpoint?.geo && (
                        <span 
                          title={norm.dst_endpoint.geo}
                          className="text-[10px] text-slate-500 font-sans max-w-[100px] truncate"
                        >
                          [{norm.dst_endpoint.geo}]
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Severity */}
                  <td className="py-2.5 px-3.5 whitespace-nowrap">
                    {getSeverityBadge(severity)}
                  </td>

                  {/* Threat Correlation */}
                  <td className="py-2.5 px-3.5 whitespace-nowrap">
                    {isMalicious ? (
                      <div className="flex items-center space-x-1.5 text-rose-700 font-bold text-xs">
                        <ShieldAlert className="w-3.5 h-3.5 text-rose-600 animate-pulse shrink-0" />
                        <span className="truncate max-w-[120px]">{threatActor}</span>
                        {mitreId && (
                          <span 
                            title={`MITRE ATT&CK Technique: ${mitreId}`}
                            className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-600 text-white shadow-xs tracking-wider"
                          >
                            [MITRE: {mitreId}]
                          </span>
                        )}
                      </div>
                    ) : (
                      <div className="flex items-center space-x-1 text-slate-600 text-xs font-sans">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>Benign</span>
                      </div>
                    )}
                  </td>

                  {/* PII Compliance */}
                  <td className="py-2.5 px-3.5 whitespace-nowrap">
                    {piiRedacted ? (
                      <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
                        <Lock className="w-3 h-3 text-amber-600 shrink-0" />
                        <span>AADHAAR SCRUBBED</span>
                      </span>
                    ) : (
                      <span className="text-xs text-slate-400 font-sans">Clean</span>
                    )}
                  </td>

                  {/* Action Trigger */}
                  <td className="py-2.5 px-3.5 whitespace-nowrap text-right">
                    <span className="inline-flex items-center px-2.5 py-1 rounded bg-slate-50 border border-slate-200 text-slate-700 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 text-xs transition font-sans font-medium">
                      <span>Inspect</span>
                      <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
                    </span>
                  </td>
                </tr>
              );
            })}
            {displayedEntries.length === 0 && (
              <tr>
                <td colSpan={8} className="py-12 text-center text-slate-500 bg-white">
                  <div className="flex flex-col items-center justify-center space-y-2">
                    <Laptop className="w-8 h-8 text-slate-400 stroke-[1.5]" />
                    <p className="text-xs font-semibold text-slate-700">No events found matching active filter</p>
                    <p className="text-[11px] text-slate-400 font-sans">Toggle Demo Stream or Laptop Logs to stream live events</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Footer Info Strip */}
      <div className="p-3 border-t border-slate-200 bg-slate-50 flex flex-wrap items-center justify-between text-xs text-slate-600 px-4 font-mono gap-2">
        <div className="flex items-center space-x-2">
          <Info className="w-3.5 h-3.5 text-blue-600" />
          <span>
            Showing <strong className="text-slate-900 font-bold">{displayedEntries.length}</strong> {collapseDuplicates ? 'distinct' : 'total'} enterprise events
            {collapseDuplicates && rawFilteredLogs.length > displayedEntries.length && (
              <span className="ml-1.5 text-blue-600 font-bold">({rawFilteredLogs.length - displayedEntries.length} duplicates collapsed)</span>
            )}
          </span>
        </div>
        <div className="flex items-center space-x-2 text-slate-500 font-sans">
          <span>Click any row for side-by-side forensic analysis</span>
        </div>
      </div>
    </div>
  );
};
