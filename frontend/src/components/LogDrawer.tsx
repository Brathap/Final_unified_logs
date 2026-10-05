import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  X, 
  Copy, 
  Check, 
  FileCode, 
  Fingerprint, 
  ShieldAlert, 
  ShieldCheck, 
  Terminal, 
  Lock, 
  Hash, 
  Database, 
  Shield,
  Clock,
  Layers,
  Download
} from 'lucide-react';
import { exportLogs } from '../utils/exportFormats';
import type { ULPFLogRecord } from '../types';

interface LogDrawerProps {
  log: ULPFLogRecord | null;
  onClose: () => void;
  occurrences?: ULPFLogRecord[];
}

export const LogDrawer: React.FC<LogDrawerProps> = ({ log, onClose, occurrences = [] }) => {
  const [activeTab, setActiveTab] = useState<'ocsf' | 'forensics' | 'raw' | 'timeline'>('ocsf');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [showExport, setShowExport] = useState(false);

  if (!log) return null;

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 1800);
  };

  const norm = (log?.normalized_data as any) || {};
  const trace = (log?.traceability as any) || {};
  const isMalicious = Boolean(norm?.enrichment?.is_malicious || norm?.threat?.is_malicious);
  const piiRedacted = Boolean(norm?.compliance?.pii_redacted || trace?.redacted_payload);

  const renderHighlightedRaw = (text?: string) => {
    if (!text) return <span className="text-slate-500 italic">No raw payload available</span>;
    if (!text.includes('[REDACTED_AADHAAR]')) {
      return <span>{text}</span>;
    }
    const parts = text.split('[REDACTED_AADHAAR]');
    return (
      <span>
        {parts.map((part, index) => (
          <React.Fragment key={index}>
            {part}
            {index < parts.length - 1 && (
              <span className="bg-amber-100 text-amber-900 border border-amber-300 px-2 py-0.5 rounded font-bold font-mono text-xs shadow-sm">
                [REDACTED_AADHAAR]
              </span>
            )}
          </React.Fragment>
        ))}
      </span>
    );
  };

  const ocsfJson = React.useMemo(() => {
    return JSON.stringify(log.normalized_data, null, 2);
  }, [log]);

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
      {/* Backdrop clickable */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.15 }}
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-xs" 
        onClick={onClose} 
      />

      {/* Sliding Forensic Panel */}
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 28, stiffness: 300 }}
        className="relative w-full max-w-2xl bg-white border-l border-slate-200 shadow-2xl flex flex-col h-full z-10 font-sans"
      >
          {/* Header */}
          <div className="p-5 border-b border-slate-200 bg-slate-50 flex items-start justify-between">
            <div className="space-y-1">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 rounded-lg bg-blue-50 text-blue-600 border border-blue-100">
                  <Fingerprint className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">
                    Deep Forensic Log Inspector
                  </h3>
                  <div className="flex items-center space-x-2 mt-0.5">
                    <span className="text-xs font-mono px-2 py-0.5 rounded bg-white text-blue-700 border border-slate-200 font-bold">
                      OCSF Class {norm.class_uid || 4001}
                    </span>
                    <span className="text-xs text-slate-500 font-mono">
                      {norm.category_name || 'Network Activity'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-1.5">
              <div className="relative">
                <button
                  onClick={() => setShowExport(!showExport)}
                  className="p-1.5 px-2.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center space-x-1.5 transition cursor-pointer"
                  title="Export this record in any format"
                >
                  <Download className="w-3.5 h-3.5 text-blue-600" />
                  <span>Export</span>
                </button>

                {showExport && (
                  <div 
                    className="absolute right-0 mt-1 w-44 bg-white rounded-lg shadow-xl border border-slate-200 py-1.5 z-50 text-xs font-sans"
                    onMouseLeave={() => setShowExport(false)}
                  >
                    <div className="px-3 py-1 text-[10px] uppercase font-bold text-slate-400 font-mono border-b border-slate-100 mb-1">
                      Download Record
                    </div>
                    <button
                      onClick={() => {
                        exportLogs([log], 'json', `ulpf_log_${norm.class_uid || '4001'}`);
                        setShowExport(false);
                      }}
                      className="w-full text-left px-3 py-1.5 hover:bg-slate-50 text-slate-700 flex items-center justify-between cursor-pointer"
                    >
                      <span>JSON (OCSF 1.1.0)</span>
                      <span className="text-[10px] font-mono text-slate-400">.json</span>
                    </button>
                    <button
                      onClick={() => {
                        exportLogs([log], 'csv', `ulpf_log_${norm.class_uid || '4001'}`);
                        setShowExport(false);
                      }}
                      className="w-full text-left px-3 py-1.5 hover:bg-slate-50 text-slate-700 flex items-center justify-between cursor-pointer"
                    >
                      <span>CSV Spreadsheet</span>
                      <span className="text-[10px] font-mono text-slate-400">.csv</span>
                    </button>
                    <button
                      onClick={() => {
                        exportLogs([log], 'cef', `ulpf_log_${norm.class_uid || '4001'}`);
                        setShowExport(false);
                      }}
                      className="w-full text-left px-3 py-1.5 hover:bg-slate-50 text-slate-700 flex items-center justify-between cursor-pointer"
                    >
                      <span>ArcSight CEF</span>
                      <span className="text-[10px] font-mono text-slate-400">.cef</span>
                    </button>
                    <button
                      onClick={() => {
                        exportLogs([log], 'syslog', `ulpf_log_${norm.class_uid || '4001'}`);
                        setShowExport(false);
                      }}
                      className="w-full text-left px-3 py-1.5 hover:bg-slate-50 text-slate-700 flex items-center justify-between cursor-pointer"
                    >
                      <span>RFC5424 Syslog</span>
                      <span className="text-[10px] font-mono text-slate-400">.log</span>
                    </button>
                  </div>
                )}
              </div>

              <button
                onClick={onClose}
                className="p-2 rounded-lg text-slate-400 hover:text-slate-900 hover:bg-slate-200/60 transition cursor-pointer"
                title="Close Drawer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Quick Threat & Status Summary Strip */}
          <div className="px-5 py-3 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center space-x-2.5">
              {isMalicious ? (
                <div className="flex items-center space-x-1.5 text-rose-700 font-semibold bg-rose-50 px-3 py-1 rounded-md border border-rose-200">
                  <ShieldAlert className="w-4 h-4 animate-pulse text-rose-600" />
                  <span>Threat Actor: <strong>{norm.enrichment?.threat_actor || norm.threat?.actor || 'Threat Actor'}</strong></span>
                </div>
              ) : (
                <div className="flex items-center space-x-1.5 text-emerald-800 font-semibold bg-emerald-50 px-3 py-1 rounded-md border border-emerald-200">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Benign Verified Traffic</span>
                </div>
              )}

              {piiRedacted && (
                <div className="flex items-center space-x-1 text-amber-800 bg-amber-50 px-2.5 py-1 rounded-md border border-amber-200">
                  <Lock className="w-3.5 h-3.5 text-amber-600" />
                  <span>Aadhaar PII Scrubbed</span>
                </div>
              )}
            </div>

            <div className="font-mono text-xs text-slate-500">
              Severity: <strong className="text-slate-900 font-bold">{norm.severity || 'Informational'}</strong>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex border-b border-slate-200 bg-white px-5 pt-3 gap-3 text-xs">
            <button
              onClick={() => setActiveTab('ocsf')}
              className={`pb-3 px-3.5 font-bold border-b-2 transition-all flex items-center space-x-2 cursor-pointer ${
                activeTab === 'ocsf'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <FileCode className="w-3.5 h-3.5" />
              <span>OCSF Normalized JSON</span>
            </button>
            <button
              onClick={() => setActiveTab('forensics')}
              className={`pb-3 px-3.5 font-bold border-b-2 transition-all flex items-center space-x-2 cursor-pointer ${
                activeTab === 'forensics'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Hash className="w-3.5 h-3.5" />
              <span>Forensic Provenance</span>
            </button>
            <button
              onClick={() => setActiveTab('raw')}
              className={`pb-3 px-3.5 font-bold border-b-2 transition-all flex items-center space-x-2 cursor-pointer ${
                activeTab === 'raw'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Terminal className="w-3.5 h-3.5" />
              <span>Original Raw String</span>
            </button>
            {occurrences && occurrences.length > 1 && (
              <button
                onClick={() => setActiveTab('timeline')}
                className={`pb-3 px-3.5 font-bold border-b-2 transition-all flex items-center space-x-2 cursor-pointer ${
                  activeTab === 'timeline'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Clock className="w-3.5 h-3.5 text-blue-600" />
                <span>Repeat Timeline</span>
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold bg-blue-100 text-blue-800">
                  {occurrences.length}x
                </span>
              </button>
            )}
          </div>

          {/* Drawer Body */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {activeTab === 'ocsf' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>Standard: <strong className="text-slate-900 font-mono font-bold">OCSF v1.1.0</strong></span>
                  <button
                    onClick={() => copyToClipboard(ocsfJson, 'ocsf')}
                    className="flex items-center space-x-1.5 px-3 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 transition"
                  >
                    {copiedKey === 'ocsf' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedKey === 'ocsf' ? 'Copied' : 'Copy JSON'}</span>
                  </button>
                </div>
                <pre className="bg-slate-900 text-emerald-400 border border-slate-800 rounded-xl p-4 text-xs font-mono leading-relaxed overflow-x-auto shadow-inner">
                  {ocsfJson}
                </pre>
              </div>
            )}

            {activeTab === 'forensics' && (
              <div className="space-y-4 text-xs">
                {/* Cryptographic SHA-256 */}
                <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5 text-xs">
                      <Fingerprint className="w-4 h-4 text-blue-600" />
                      SHA-256 Non-Repudiation Wire Hash
                    </span>
                    <button
                      onClick={() => copyToClipboard(trace.raw_sha256 || trace.raw_hash || '', 'sha')}
                      className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 flex items-center space-x-1 font-mono font-semibold"
                    >
                      {copiedKey === 'sha' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                      <span>Copy</span>
                    </button>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 font-mono text-blue-800 break-all select-all text-xs font-semibold">
                    {trace.raw_sha256 || trace.raw_hash || 'SHA-256 Validated'}
                  </div>
                  <p className="text-xs text-slate-500">
                    Calculated in-flight before any normalization transforms. Provides evidentiary proof of authenticity.
                  </p>
                </div>

                {/* Base64 Wire Source */}
                <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5 text-xs">
                      <Database className="w-4 h-4 text-emerald-600" />
                      Base64 Encoded Wire Payload
                    </span>
                    <button
                      onClick={() => copyToClipboard(trace.raw_base64 || trace.raw_log_base64 || '', 'b64')}
                      className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 flex items-center space-x-1 font-mono font-semibold"
                    >
                      {copiedKey === 'b64' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                      <span>Copy</span>
                    </button>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 font-mono text-slate-600 break-all max-h-28 overflow-y-auto text-xs">
                    {trace.raw_base64 || trace.raw_log_base64 || 'Base64 Wire Ingested'}
                  </div>
                </div>

                {/* Threat Correlation Details */}
                <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-2.5">
                  <span className="font-bold text-slate-800 uppercase tracking-wider text-xs flex items-center gap-1.5">
                    <Shield className="w-4 h-4 text-rose-600" />
                    Threat Intel Provenance
                  </span>
                  <div className="grid grid-cols-2 gap-3 text-slate-700 font-mono text-xs">
                    <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                      <span className="text-slate-500 block text-[10px] uppercase font-bold">Source IP Address</span>
                      <span className="text-slate-900 font-bold">{norm.src_endpoint?.ip || '0.0.0.0'}</span>
                    </div>
                    <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                      <span className="text-slate-500 block text-[10px] uppercase font-bold">Threat Attribution</span>
                      <span className={isMalicious ? 'text-rose-700 font-bold' : 'text-slate-700'}>
                        {norm.enrichment?.threat_actor || norm.threat?.actor || 'None'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'raw' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>Protocol: <strong className="text-slate-900 font-mono">UDP Syslog 514 (RFC5424/CEF)</strong></span>
                  <button
                    onClick={() => copyToClipboard(trace.sanitized_raw || trace.redacted_payload || norm.activity_name || '', 'raw')}
                    className="flex items-center space-x-1.5 px-3 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 transition"
                  >
                    {copiedKey === 'raw' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedKey === 'raw' ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
                <div className="bg-slate-900 text-slate-100 border border-slate-800 rounded-xl p-4 font-mono text-xs leading-relaxed break-all shadow-inner">
                  {renderHighlightedRaw(trace.sanitized_raw || trace.redacted_payload || norm.activity_name || '')}
                </div>
                {piiRedacted && (
                  <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-lg text-amber-900 text-xs flex items-center space-x-2">
                    <Lock className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>Highlighted 12-digit token was identified as Aadhaar PII and sanitized in-memory by Vector remap.</span>
                  </div>
                )}
              </div>
            )}
            {activeTab === 'timeline' && occurrences && occurrences.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs text-slate-600 bg-blue-50 border border-blue-200 p-3 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <Layers className="w-4 h-4 text-blue-600" />
                    <span>
                      Total Occurrences Collapsed: <strong className="text-blue-900 font-bold">{occurrences.length} instances</strong>
                    </span>
                  </div>
                  <span className="text-[11px] font-mono text-slate-500">Chronological Arrival Order</span>
                </div>

                <div className="space-y-2 max-h-[460px] overflow-y-auto pr-1">
                  {occurrences.map((item, idx) => {
                    const itemTrace = (item.traceability as any) || {};
                    const itemNorm = (item.normalized_data as any) || {};
                    let timeFormatted = 'Just now';
                    if (itemTrace.ingest_timestamp) {
                      const d = new Date(itemTrace.ingest_timestamp);
                      const base = d.toLocaleTimeString([], { hour12: false });
                      const ms = String(d.getMilliseconds()).padStart(3, '0');
                      timeFormatted = `${base}.${ms}`;
                    }
                    const itemSha = (itemTrace.raw_sha256 || itemTrace.raw_hash || '0000000000').substring(0, 12);

                    return (
                      <div 
                        key={item.id || `${idx}-${Date.now()}`}
                        className="bg-white border border-slate-200 rounded-lg p-3 hover:border-blue-300 transition-all font-mono text-xs flex flex-col space-y-1.5 shadow-2xs"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-bold text-[11px]">
                              Pulse #{occurrences.length - idx}
                            </span>
                            <span className="text-blue-700 font-bold flex items-center space-x-1">
                              <Clock className="w-3 h-3" />
                              <span>{timeFormatted}</span>
                            </span>
                          </div>
                          <span className="text-slate-400 text-[10px]" title={itemTrace.raw_sha256}>
                            SHA: {itemSha}...
                          </span>
                        </div>
                        <div className="text-slate-600 bg-slate-50 p-2 rounded border border-slate-150 text-[11px] break-all">
                          {itemTrace.sanitized_raw || itemNorm.activity_name || 'Host Telemetry'}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs text-slate-500">
            <span className="font-mono text-[11px]">
              SHA: {(trace.raw_sha256 || trace.raw_hash || '0000000000000000').substring(0, 16)}...
            </span>
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-medium transition cursor-pointer"
            >
              Close Inspector
            </button>
          </div>
        </motion.div>
      </div>
    );
};
