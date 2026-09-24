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
  Laptop
} from 'lucide-react';
import type { ULPFLogRecord } from '../types';

interface LiveStreamProps {
  logs: ULPFLogRecord[];
  isStreaming: boolean;
  onSelectLog: (log: ULPFLogRecord) => void;
  selectedLogId?: string;
}

type FilterMode = 'all' | 'laptop' | 'threats' | 'pii' | 'blocks';

export const LiveStream: React.FC<LiveStreamProps> = ({ 
  logs, 
  onSelectLog,
  selectedLogId 
}) => {
  const [filterMode, setFilterMode] = useState<FilterMode>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredLogs = logs.filter(log => {
    const norm = log?.normalized_data as any;
    const trace = log?.traceability as any;
    const isMalicious = norm?.enrichment?.is_malicious || norm?.threat?.is_malicious;
    const piiRedacted = norm?.compliance?.pii_redacted || trace?.redacted_payload;
    const isLaptop = norm?.metadata?.source_type === 'laptop_host' || (trace?.sanitized_raw || '').startsWith('[HOST:');

    if (filterMode === 'laptop' && !isLaptop) {
      return false;
    }
    if (filterMode === 'threats' && !isMalicious) {
      return false;
    }
    if (filterMode === 'pii' && !piiRedacted) {
      return false;
    }
    if (filterMode === 'blocks') {
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
      <div className="p-4 border-b border-slate-200 bg-slate-50/70 flex flex-wrap items-center justify-between gap-4">
        {/* Quick Filter Buttons */}
        <div className="flex items-center space-x-2 flex-wrap">
          <span className="text-xs text-slate-500 mr-1 flex items-center gap-1 font-mono uppercase font-bold">
            <Filter className="w-3.5 h-3.5 text-blue-600" />
            Views:
          </span>
          <button
            onClick={() => setFilterMode('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              filterMode === 'all'
                ? 'bg-blue-600 text-white shadow-sm font-bold'
                : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            All Events ({logs.length})
          </button>
          <button
            onClick={() => setFilterMode('laptop')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center space-x-1.5 ${
              filterMode === 'laptop'
                ? 'bg-indigo-600 text-white shadow-sm font-bold'
                : 'bg-white text-indigo-700 hover:text-indigo-900 border border-indigo-200 hover:bg-indigo-50'
            }`}
          >
            <Laptop className="w-3.5 h-3.5" />
            <span>My Laptop Logs</span>
          </button>
          <button
            onClick={() => setFilterMode('threats')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center space-x-1.5 ${
              filterMode === 'threats'
                ? 'bg-rose-600 text-white shadow-sm font-bold'
                : 'bg-white text-rose-700 hover:text-rose-900 border border-rose-200 hover:bg-rose-50'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Threats (APT29)</span>
          </button>
          <button
            onClick={() => setFilterMode('pii')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center space-x-1.5 ${
              filterMode === 'pii'
                ? 'bg-amber-600 text-white shadow-sm font-bold'
                : 'bg-white text-amber-800 hover:text-amber-950 border border-amber-200 hover:bg-amber-50'
            }`}
          >
            <Lock className="w-3.5 h-3.5" />
            <span>PII Intercepted</span>
          </button>
          <button
            onClick={() => setFilterMode('blocks')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              filterMode === 'blocks'
                ? 'bg-purple-600 text-white shadow-sm font-bold'
                : 'bg-white text-purple-700 hover:text-purple-900 border border-purple-200 hover:bg-purple-50'
            }`}
          >
            Network Blocks
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative flex items-center">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
          <input
            type="text"
            placeholder="Search IP, actor, payload..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-white border border-slate-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 text-xs pl-9 pr-3.5 py-2 rounded-lg text-slate-900 placeholder-slate-400 w-56 md:w-72 transition-all outline-none"
          />
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
            {filteredLogs.map((log) => {
              const norm = (log?.normalized_data as any) || {};
              const trace = (log?.traceability as any) || {};
              const isMalicious = Boolean(norm?.enrichment?.is_malicious || norm?.threat?.is_malicious);
              const piiRedacted = Boolean(norm?.compliance?.pii_redacted || (trace?.redacted_payload && trace.redacted_payload.includes('[REDACTED_AADHAAR]')));
              const rawHash = trace?.raw_sha256 || trace?.raw_hash || '0000000000';
              const isSelected = selectedLogId === log?.id || selectedLogId === rawHash;
              
              // Extract timestamp from ingest_timestamp or regex match from raw payload
              let timeString = 'Just now';
              if (trace?.ingest_timestamp) {
                timeString = new Date(trace.ingest_timestamp).toLocaleTimeString([], { hour12: false });
              } else if (norm?.activity_name) {
                const timeMatch = norm.activity_name.match(/(\d{2}:\d{2}:\d{2})/);
                if (timeMatch) timeString = timeMatch[1];
              }

              const shaPrefix = rawHash.substring(0, 10);
              const category = norm?.category_name || norm?.class_name || 'Network Activity';
              const severity = norm?.severity || norm?.threat?.severity_level || (isMalicious ? 'Critical' : 'Informational');
              const threatActor = norm?.enrichment?.threat_actor || norm?.threat?.actor || (isMalicious ? 'Threat Detected' : 'Benign');

              return (
                <tr
                  key={log?.id || rawHash || Math.random()}
                  onClick={() => onSelectLog(log)}
                  className={`transition-colors duration-100 cursor-pointer ${
                    isSelected
                      ? 'bg-blue-50 border-l-4 border-l-blue-600'
                      : isMalicious
                      ? 'bg-rose-50/70 hover:bg-rose-100/70 border-l-4 border-l-rose-500'
                      : 'bg-white hover:bg-slate-50 border-l-4 border-l-transparent'
                  }`}
                >
                  {/* Timestamp & SHA */}
                  <td className="py-2.5 px-3.5 whitespace-nowrap">
                    <div className="text-slate-900 font-bold text-xs">
                      {timeString}
                    </div>
                    <div className="text-[11px] text-slate-500 font-mono truncate max-w-[90px]" title={rawHash}>
                      {shaPrefix}...
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
                      <span className={`font-semibold text-xs ${
                        isMalicious ? 'text-rose-700 font-bold' : norm?.metadata?.source_type === 'laptop_host' ? 'text-indigo-700 font-bold' : 'text-slate-900'
                      }`}>
                        {norm?.src_endpoint?.ip || '0.0.0.0'}
                      </span>
                      {norm?.src_endpoint?.geo && (
                        <span className={`text-[10px] px-1.5 py-0.2 rounded border font-sans font-medium flex items-center gap-1 ${
                          norm?.metadata?.source_type === 'laptop_host'
                            ? 'bg-indigo-50 text-indigo-750 border-indigo-200 font-bold'
                            : 'bg-slate-100 text-slate-700 border border-slate-200'
                        }`}>
                          {norm?.metadata?.source_type === 'laptop_host' && <Laptop className="w-2.5 h-2.5 text-indigo-600" />}
                          {norm.src_endpoint.geo}
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Target Destination */}
                  <td className="py-2.5 px-3.5 whitespace-nowrap">
                    <div className="text-slate-800 text-xs flex items-center space-x-1">
                      <span>{norm?.dst_endpoint?.ip || '10.0.0.1'}</span>
                      {norm?.dst_endpoint?.geo && (
                        <span className="text-[10px] text-slate-500 font-sans">[{norm.dst_endpoint.geo}]</span>
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
                        <span className="truncate max-w-[130px]">{threatActor}</span>
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
          </tbody>
        </table>
      </div>

      {/* Footer Info Strip */}
      <div className="p-3 border-t border-slate-200 bg-slate-50 flex flex-wrap items-center justify-between text-xs text-slate-600 px-4 font-mono gap-2">
        <div className="flex items-center space-x-2">
          <Info className="w-3.5 h-3.5 text-blue-600" />
          <span>Showing <strong className="text-slate-900 font-bold">{filteredLogs.length}</strong> enterprise events</span>
        </div>
        <div className="flex items-center space-x-2 text-slate-500 font-sans">
          <span>Click any row for side-by-side forensic analysis</span>
        </div>
      </div>
    </div>
  );
};
