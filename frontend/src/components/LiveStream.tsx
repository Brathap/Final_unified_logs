import React, { useState, useRef } from 'react';
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
  Check,
  Radio,
  Activity,
  Upload,
  Loader2
} from 'lucide-react';
import { exportLogs } from '../utils/exportFormats';
import { useToast } from '../context/ToastContext';
import { secureFetch } from '../utils/api';
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
  onHistoricalUpload?: (records: ULPFLogRecord[]) => void;
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
  onFilterModeChange,
  onHistoricalUpload
}) => {
  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  // If controlledFilterMode is provided, use it; otherwise use local state
  const [internalFilterMode, setInternalFilterMode] = useState<FilterMode>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [collapseDuplicates, setCollapseDuplicates] = useState(true);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [copiedHash, setCopiedHash] = useState<string | null>(null);
  const exportMenuRef = useRef<HTMLDivElement>(null);

  // Close Export menu when clicking outside or pressing Escape
  React.useEffect(() => {
    if (!showExportMenu) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(e.target as Node)) {
        setShowExportMenu(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowExportMenu(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [showExportMenu]);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    showToast('Ingesting Historical Telemetry', `Reading and normalizing ${file.name}...`, 'info');

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await secureFetch('/api/upload-historical', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: 'Upload failed' }));
        throw new Error(errorData.detail || 'Failed to ingest file');
      }

      const result = await response.json();
      showToast(
        'Historical Ingestion Complete',
        `Normalized ${result.records_ingested} records into OCSF taxonomy`,
        'success'
      );

      if (result.sample_records && result.sample_records.length > 0 && onHistoricalUpload) {
        onHistoricalUpload(result.sample_records);
      }
    } catch (err: any) {
      showToast('Upload Failed', err.message || 'Error uploading historical log file', 'error');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const activeFilter = controlledFilterMode !== undefined ? controlledFilterMode : internalFilterMode;

  const handleFilterChange = (mode: FilterMode) => {
    if (onFilterModeChange) {
      onFilterModeChange(mode);
    } else {
      setInternalFilterMode(mode);
    }
    const modeLabels: Record<FilterMode, string> = {
      all: 'All Events View',
      laptop: 'Laptop Host Telemetry',
      threats: 'Threat Intel Alerts',
      pii: 'Aadhaar Scrubbed Events',
      blocks: 'Firewall Blocks'
    };
    showToast(`Filter Activated`, `Now viewing ${modeLabels[mode]}`, 'info');
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

    return grouped.slice(0, 150);
  }, [rawFilteredLogs, collapseDuplicates]);

  const getSeverityBadge = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'critical':
        return (
          <span className="px-3 py-1 text-xs font-semibold rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center gap-1.5 w-max">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse" />
            Critical
          </span>
        );
      case 'high':
        return (
          <span className="px-3 py-1 text-xs font-semibold rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 w-max">
            High
          </span>
        );
      case 'medium':
        return (
          <span className="px-3 py-1 text-xs font-semibold rounded-full bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 w-max">
            Medium
          </span>
        );
      default:
        return (
          <span className="px-3 py-1 text-xs font-semibold rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 w-max">
            Info
          </span>
        );
    }
  };

  return (
    <div className="flex flex-col h-full bg-zinc-950 border border-zinc-800 rounded-2xl transition-colors">
      {/* Top Controls Toolbar: Clean, generous spacing */}
      <div className="relative z-30 p-5 lg:p-6 border-b border-zinc-800 bg-zinc-950 rounded-t-2xl overflow-x-auto no-scrollbar">
        <div className="flex items-center justify-between gap-4 py-0.5 min-w-max">
          {/* Left: Filter Views */}
          <div className="flex items-center space-x-2 shrink-0">
            <span className="text-xs text-zinc-400 mr-1 flex items-center gap-1.5 font-medium shrink-0">
              <Filter className="w-3.5 h-3.5 text-sky-400" />
              Views:
            </span>

            <div className="inline-flex bg-zinc-900/60 p-1 rounded-xl border border-white/[0.08] space-x-1 shrink-0">
              <button
                type="button"
                onClick={() => handleFilterChange('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer flex items-center space-x-2 shrink-0 ${
                  activeFilter === 'all'
                    ? 'bg-white/10 text-white shadow-xs font-semibold'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <span>All Events</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono ${
                  activeFilter === 'all' 
                    ? 'bg-white/15 text-white' 
                    : 'bg-white/[0.05] text-zinc-400'
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
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer flex items-center space-x-2 shrink-0 ${
                  activeFilter === 'laptop'
                    ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-semibold'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${hostStreaming ? 'bg-indigo-400 animate-pulse' : 'bg-zinc-600'}`} />
                <Laptop className="w-3.5 h-3.5 text-indigo-400" />
                <span>Laptop Logs</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono ${
                  activeFilter === 'laptop' 
                    ? 'bg-indigo-500/30 text-indigo-200 font-bold' 
                    : 'bg-white/[0.05] text-zinc-400'
                }`}>
                  {counts.laptopCount}
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleFilterChange('threats')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer flex items-center space-x-2 shrink-0 ${
                  activeFilter === 'threats'
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30 font-semibold'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-rose-400" />
                <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
                <span>Threat Alerts</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono ${
                  activeFilter === 'threats' 
                    ? 'bg-rose-500/30 text-rose-200 font-bold' 
                    : 'bg-white/[0.05] text-zinc-400'
                }`}>
                  {counts.threatCount}
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleFilterChange('pii')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer flex items-center space-x-2 shrink-0 ${
                  activeFilter === 'pii'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 font-semibold'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                <Lock className="w-3.5 h-3.5 text-amber-400" />
                <span>Aadhaar Scrubbed</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono ${
                  activeFilter === 'pii' 
                    ? 'bg-amber-500/30 text-amber-200 font-bold' 
                    : 'bg-white/[0.05] text-zinc-400'
                }`}>
                  {counts.piiCount}
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleFilterChange('blocks')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer flex items-center space-x-2 shrink-0 ${
                  activeFilter === 'blocks'
                    ? 'bg-white/10 text-white font-semibold'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-zinc-500" />
                <span>Firewall Blocks</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono ${
                  activeFilter === 'blocks' 
                    ? 'bg-white/15 text-white font-bold' 
                    : 'bg-white/[0.05] text-zinc-400'
                }`}>
                  {counts.blockCount}
                </span>
              </button>
            </div>
          </div>

          {/* Right: Actions & Global Search */}
          <div className="flex items-center space-x-2 shrink-0">
            {/* Deduplicate Toggle */}
            <button
              type="button"
              onClick={() => setCollapseDuplicates(!collapseDuplicates)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium flex items-center space-x-2 border transition cursor-pointer shrink-0 ${
                collapseDuplicates 
                  ? 'bg-sky-500/10 text-sky-400 border-sky-500/30 hover:bg-sky-500/15' 
                  : 'bg-white/[0.02] text-zinc-400 border-white/[0.08] hover:bg-white/[0.05] text-zinc-300'
              }`}
              title="Group repetitive log occurrences into a single item with count badge"
            >
              <Layers className="w-3.5 h-3.5 text-sky-400" />
              <span className="hidden xl:inline">Group Duplicates</span>
              <span className="xl:hidden">Dedupe</span>
              <span className={`px-1.5 py-0.5 text-[10px] font-mono rounded-full ${
                collapseDuplicates 
                  ? 'bg-sky-500/20 text-sky-300 font-bold' 
                  : 'bg-white/[0.06] text-zinc-400'
              }`}>
                {collapseDuplicates ? 'ON' : 'OFF'}
              </span>
            </button>

            {/* Multi-Format Export Dropdown */}
            <div ref={exportMenuRef} className="relative shrink-0">
              <button
                type="button"
                onClick={() => setShowExportMenu(!showExportMenu)}
                className="px-3 py-1.5 rounded-xl text-xs font-medium flex items-center space-x-1.5 border border-white/[0.08] bg-white/[0.02] text-zinc-300 hover:bg-white/[0.05] transition cursor-pointer"
                title="Download logs in any format (JSON, CSV, CEF, Syslog, JSONL)"
              >
                <Download className="w-3.5 h-3.5 text-sky-400" />
                <span>Export</span>
              </button>

              {showExportMenu && (
                <div 
                  className="absolute right-0 top-full mt-2 w-56 bg-zinc-900/95 backdrop-blur-2xl rounded-2xl shadow-2xl border border-white/[0.1] py-2 z-50 text-xs ring-1 ring-black/40"
                >
                  <div className="px-3.5 py-1.5 text-[10px] uppercase font-semibold text-zinc-400 tracking-wider border-b border-white/[0.06] mb-1">
                    Download {displayedEntries.length} Logs
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      exportLogs(displayedEntries.map(e => e.log), 'json', `ulpf_${activeFilter}_logs`);
                      setShowExportMenu(false);
                      showToast('Export Complete', `Downloaded ${displayedEntries.length} records in OCSF JSON format`, 'success');
                    }}
                    className="w-full text-left px-3.5 py-2 hover:bg-white/[0.06] text-zinc-300 hover:text-white flex items-center justify-between cursor-pointer"
                  >
                    <span>JSON (OCSF 1.1.0)</span>
                    <span className="text-[10px] font-mono text-zinc-500">.json</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      exportLogs(displayedEntries.map(e => e.log), 'csv', `ulpf_${activeFilter}_logs`);
                      setShowExportMenu(false);
                      showToast('Export Complete', `Downloaded ${displayedEntries.length} records in CSV Spreadsheet format`, 'success');
                    }}
                    className="w-full text-left px-3.5 py-2 hover:bg-white/[0.06] text-zinc-300 hover:text-white flex items-center justify-between cursor-pointer"
                  >
                    <span>CSV Spreadsheet</span>
                    <span className="text-[10px] font-mono text-zinc-500">.csv</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      exportLogs(displayedEntries.map(e => e.log), 'cef', `ulpf_${activeFilter}_logs`);
                      setShowExportMenu(false);
                      showToast('Export Complete', `Downloaded ${displayedEntries.length} records in ArcSight CEF format`, 'success');
                    }}
                    className="w-full text-left px-3.5 py-2 hover:bg-white/[0.06] text-zinc-300 hover:text-white flex items-center justify-between cursor-pointer"
                  >
                    <span>ArcSight CEF</span>
                    <span className="text-[10px] font-mono text-zinc-500">.cef</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      exportLogs(displayedEntries.map(e => e.log), 'syslog', `ulpf_${activeFilter}_logs`);
                      setShowExportMenu(false);
                      showToast('Export Complete', `Downloaded ${displayedEntries.length} records in RFC5424 Syslog format`, 'success');
                    }}
                    className="w-full text-left px-3.5 py-2 hover:bg-white/[0.06] text-zinc-300 hover:text-white flex items-center justify-between cursor-pointer"
                  >
                    <span>RFC5424 Syslog</span>
                    <span className="text-[10px] font-mono text-slate-400">.log</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      exportLogs(displayedEntries.map(e => e.log), 'jsonl', `ulpf_${activeFilter}_logs`);
                      setShowExportMenu(false);
                      showToast('Export Complete', `Downloaded ${displayedEntries.length} records in JSONL format`, 'success');
                    }}
                    className="w-full text-left px-3 py-1.5 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center justify-between cursor-pointer"
                  >
                    <span>JSONL Lines</span>
                    <span className="text-[10px] font-mono text-slate-400">.jsonl</span>
                  </button>
                </div>
              )}
            </div>

            {/* Hidden File Input for Historical Log Telemetry */}
            <input
              ref={fileInputRef}
              type="file"
              accept=".log,.txt,.json,.jsonl,.csv"
              onChange={handleFileUpload}
              className="hidden"
            />

            {/* Historical Telemetry Upload Button */}
            <button
              type="button"
              disabled={isUploading}
              onClick={() => fileInputRef.current?.click()}
              className="px-3 py-1.5 rounded-xl text-xs font-medium flex items-center space-x-1.5 border border-white/[0.08] bg-white/[0.02] text-zinc-300 hover:bg-white/[0.05] transition cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed shrink-0"
              title="Upload historical raw logs or CSV spreadsheet for instant OCSF normalization"
            >
              {isUploading ? (
                <Loader2 className="w-3.5 h-3.5 text-sky-400 animate-spin" />
              ) : (
                <Upload className="w-3.5 h-3.5 text-sky-400" />
              )}
              <span className="hidden xl:inline">Upload Telemetry</span>
              <span className="xl:hidden">Upload</span>
            </button>

            {/* Search Bar */}
            <div className="relative flex items-center w-36 sm:w-44 lg:w-48 shrink-0">
              <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 pointer-events-none" />
              <input
                type="text"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-white/[0.03] border border-white/[0.08] focus:border-sky-500/50 focus:ring-1 focus:ring-sky-500/20 text-xs pl-8 pr-3 py-1.5 rounded-xl text-zinc-100 placeholder-zinc-500 transition-all outline-none"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Clean High-Contrast Table Stream */}
      <div className="flex-1 overflow-x-auto overflow-y-auto min-h-[480px]">
        <table className="w-full text-left text-xs border-collapse">
          <thead className="sticky top-0 bg-zinc-950 border-b border-zinc-800 text-zinc-400 font-semibold text-xs uppercase tracking-wider z-10">
            <tr>
              <th className="py-4 px-6">Time / Fingerprint</th>
              <th className="py-4 px-6">OCSF Taxonomy</th>
              <th className="py-4 px-6">Source Endpoint</th>
              <th className="py-4 px-6">Target Destination</th>
              <th className="py-4 px-6">Severity</th>
              <th className="py-4 px-6">Threat Correlation</th>
              <th className="py-4 px-6">PII Guard</th>
              <th className="py-4 px-6 text-right">Inspect</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-900 font-mono">
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
              const isSimulated = Boolean(log?.is_simulated || norm?.metadata?.source_type === 'demo');
              const isLatest = index === 0;

              return (
                <tr
                  key={log?.id || rawHash || `${index}-${Date.now()}`}
                  onClick={() => onSelectLog(log, occurrences)}
                  className={`transition-colors duration-150 cursor-pointer ${
                    isSelected
                      ? 'bg-zinc-900 border-l-2 border-l-cyan-400'
                      : isMalicious
                      ? 'bg-rose-500/[0.04] hover:bg-rose-500/[0.08] border-l-2 border-l-rose-500'
                      : isLaptopEvent
                      ? 'bg-indigo-500/[0.04] hover:bg-indigo-500/[0.08] border-l-2 border-l-indigo-400'
                      : 'hover:bg-zinc-900/60 border-l-2 border-l-transparent'
                  }`}
                >
                  {/* Timestamp & SHA */}
                  <td className="py-4 px-6 whitespace-nowrap">
                    <div className="text-white font-medium text-xs flex items-center space-x-2">
                      <span className="font-mono text-xs text-white">{timeString}</span>
                      {isSimulated && (
                        <span 
                          title="Synthetic event generated client-side for demonstration"
                          className="px-2 py-0.5 rounded-full text-[10px] font-mono font-medium bg-amber-400/15 text-amber-300 border border-amber-400/30 tracking-wider"
                        >
                          SIM
                        </span>
                      )}
                      {repeatCount > 1 && (
                        <span 
                          title={`${repeatCount} identical log entries collapsed`}
                          className="px-2 py-0.5 rounded-full text-[10px] font-mono font-medium bg-cyan-400/15 text-cyan-300 border border-cyan-400/30 animate-pulse"
                        >
                          ×{repeatCount}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center space-x-1.5 mt-1.5">
                      <span className="text-xs text-zinc-400 font-mono truncate max-w-[90px]" title={rawHash}>
                        {shaPrefix}...
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigator.clipboard.writeText(rawHash);
                          setCopiedHash(rawHash);
                          showToast('Hash Copied', `${rawHash.slice(0, 16)}... copied to clipboard`, 'info');
                          setTimeout(() => setCopiedHash(null), 1500);
                        }}
                        className="text-zinc-400 hover:text-white transition cursor-pointer p-0.5 rounded hover:bg-zinc-800"
                        title="Copy complete SHA-256 hash"
                      >
                        {copiedHash === rawHash ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </td>

                  {/* OCSF Category & Action */}
                  <td className="py-4 px-6 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      <span className={`text-xs font-semibold ${norm?.metadata?.source_type === 'laptop_host' ? "text-indigo-400" : "text-cyan-400"}`}>
                        {category}
                      </span>
                      {norm?.class_uid && (
                        <span className="text-[10px] text-zinc-400 font-mono px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800">
                          {norm.class_uid}
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-zinc-300 truncate max-w-[280px] font-mono mt-1" title={norm?.activity_name}>
                      {norm?.activity_name || 'Activity'}
                    </div>
                  </td>

                  {/* Source Endpoint */}
                  <td className="py-4 px-6 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      <span className={`font-mono text-xs font-medium ${
                        isMalicious ? 'text-rose-400 font-bold' : norm?.metadata?.source_type === 'laptop_host' ? 'text-indigo-300 font-bold' : 'text-white'
                      }`}>
                        {norm?.src_endpoint?.ip || '0.0.0.0'}
                      </span>
                      {norm?.src_endpoint?.geo && (
                        <span className={`text-[10px] px-2 py-0.5 rounded-full border font-sans font-medium flex items-center gap-1 ${
                          norm?.metadata?.source_type === 'laptop_host'
                            ? 'bg-indigo-500/10 text-indigo-300 border-indigo-500/20'
                            : 'bg-zinc-900 text-zinc-300 border-zinc-800'
                        }`}>
                          {norm?.metadata?.source_type === 'laptop_host' && <Laptop className="w-3 h-3 text-indigo-400" />}
                          {norm.src_endpoint.geo}
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Target Destination */}
                  <td className="py-4 px-6 whitespace-nowrap">
                    <div className="text-zinc-200 text-xs flex items-center space-x-1.5 font-mono">
                      <span>{norm?.dst_endpoint?.ip || '10.0.0.1'}</span>
                      {norm?.dst_endpoint?.geo && (
                        <span className="text-[10px] text-zinc-400 font-sans">[{norm.dst_endpoint.geo}]</span>
                      )}
                    </div>
                  </td>

                  {/* Severity */}
                  <td className="py-4 px-6 whitespace-nowrap">
                    {getSeverityBadge(severity)}
                  </td>

                  {/* Threat Correlation */}
                  <td className="py-4 px-6 whitespace-nowrap">
                    {isMalicious ? (
                      <div className="flex items-center space-x-2 text-rose-400 font-medium text-xs">
                        <ShieldAlert className="w-4 h-4 text-rose-400 animate-pulse shrink-0" />
                        <span className="truncate max-w-[130px] font-semibold text-rose-300">{threatActor}</span>
                        {mitreId && (
                          <span 
                            title={`MITRE ATT&CK Technique: ${mitreId}`}
                            className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30"
                          >
                            {mitreId}
                          </span>
                        )}
                      </div>
                    ) : (
                      <div className="flex items-center space-x-2 text-zinc-300 text-xs font-mono">
                        <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span className="text-zinc-400">Benign</span>
                      </div>
                    )}
                  </td>

                  {/* PII Compliance */}
                  <td className="py-4 px-6 whitespace-nowrap">
                    {piiRedacted ? (
                      <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-medium bg-amber-500/10 text-amber-300 border border-amber-500/20">
                        <Lock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        <span>Scrubbed</span>
                      </span>
                    ) : (
                      <span className="text-xs text-zinc-400 font-mono">Clean</span>
                    )}
                  </td>

                  {/* Action Trigger */}
                  <td className="py-4 px-6 whitespace-nowrap text-right">
                    <span className="inline-flex items-center px-3 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800 text-white hover:bg-cyan-500/10 hover:text-cyan-400 hover:border-cyan-500/30 text-xs transition font-semibold">
                      <span>Inspect</span>
                      <ChevronRight className="w-3.5 h-3.5 ml-1" />
                    </span>
                  </td>
                </tr>
              );
            })}
            {displayedEntries.length === 0 && (
              <tr>
                <td colSpan={8} className="py-20 text-center text-zinc-400 bg-transparent">
                  <div className="flex flex-col items-center justify-center space-y-4">
                    <div className="relative flex items-center justify-center w-14 h-14">
                      <span className="absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-20 animate-ping" />
                      <div className="relative flex items-center justify-center w-10 h-10 rounded-full bg-zinc-900 border border-zinc-800 text-cyan-400">
                        <Radio className="w-5 h-5 animate-spin text-cyan-400" />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-semibold text-white uppercase tracking-wider">
                        Awaiting Ingestion Telemetry Stream
                      </p>
                      <p className="text-xs text-zinc-400 max-w-sm mx-auto">
                        Vector UDP:5140 and TCP:6514 listeners active. No records matching filter <strong className="text-cyan-400 font-mono">[{activeFilter.toUpperCase()}]</strong>.
                      </p>
                    </div>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Footer Info Strip */}
      <div className="p-5 lg:p-6 border-t border-zinc-800 bg-zinc-950 rounded-b-2xl flex flex-wrap items-center justify-between text-xs text-zinc-400 gap-3">
        <div className="flex items-center space-x-2">
          <Info className="w-4 h-4 text-cyan-400" />
          <span>
            Showing <strong className="text-white font-semibold">{displayedEntries.length}</strong> {collapseDuplicates ? 'distinct' : 'total'} enterprise events
            {collapseDuplicates && rawFilteredLogs.length > displayedEntries.length && (
              <span className="ml-2 text-cyan-400 font-medium">({rawFilteredLogs.length - displayedEntries.length} duplicates collapsed)</span>
            )}
          </span>
        </div>
        <div className="flex items-center space-x-2 text-zinc-400">
          <span>Click any row for side-by-side forensic analysis</span>
        </div>
      </div>
    </div>
  );
};
