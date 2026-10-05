import React from 'react';
import { 
  ShieldAlert, 
  ShieldCheck,
  Lock, 
  Terminal, 
  ExternalLink, 
  AlertTriangle, 
  Activity, 
  Flame, 
  Search,
  Radio,
  ChevronRight,
  Fingerprint
} from 'lucide-react';
import type { ULPFLogRecord } from '../types';

interface ThreatMatrixProps {
  logs: ULPFLogRecord[];
  onSelectLog: (log: ULPFLogRecord) => void;
  selectedLogId?: string;
}

export const ThreatMatrix: React.FC<ThreatMatrixProps> = ({
  logs,
  onSelectLog,
  selectedLogId
}) => {
  // Filter threat events & PII detections for focused triage
  const threatEntries = React.useMemo(() => {
    return logs.filter((log) => {
      const norm = (log?.normalized_data as any) || {};
      const trace = (log?.traceability as any) || {};
      const isMalicious = Boolean(norm?.enrichment?.is_malicious || norm?.threat?.is_malicious);
      const isPii = Boolean(norm?.compliance?.pii_redacted || (trace?.redacted_payload && trace.redacted_payload.includes('[REDACTED_AADHAAR]')));
      const isBlocked = (norm?.activity_name || '').toLowerCase().includes('block') || (norm?.disposition || '').toLowerCase().includes('block');
      return isMalicious || isPii || isBlocked;
    }).slice(0, 30);
  }, [logs]);

  return (
    <div className="flex flex-col h-full bg-[#0A0A0A]/80 backdrop-blur-2xl border border-white/5 rounded-3xl p-5 shadow-2xl overflow-hidden">
      {/* Matrix Header */}
      <div className="flex items-center justify-between pb-3.5 mb-3 border-b border-white/5">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20 shadow-[0_0_12px_rgba(244,63,94,0.2)]">
            <ShieldAlert className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
              Live Threat Matrix
            </h3>
            <p className="text-[10px] text-zinc-400 font-sans">Adversary hits & PII intercept stream</p>
          </div>
        </div>

        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-mono font-medium bg-rose-500/10 text-rose-300 border border-rose-500/20">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-ping mr-1.5" />
          {threatEntries.length} Active Hits
        </span>
      </div>

      {/* Verhoeff PII Engine Telemetry Pill */}
      <div className="mb-3 p-3 rounded-2xl bg-amber-500/[0.04] border border-amber-500/15 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Lock className="w-3.5 h-3.5 text-amber-400" />
          <div>
            <div className="text-[11px] font-semibold text-amber-300 font-sans">
              Verhoeff Algorithm PII Scrubbing
            </div>
            <div className="text-[10px] text-zinc-400 font-mono">
              Checksum-validated Aadhaar scrubbing active
            </div>
          </div>
        </div>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-400/10 text-amber-300 border border-amber-400/20 font-bold">
          ZERO LEAK
        </span>
      </div>

      {/* Dense Vertically Scrolling Threat Cards */}
      <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 no-scrollbar min-h-[380px] max-h-[580px]">
        {threatEntries.map((log, idx) => {
          const norm = (log?.normalized_data as any) || {};
          const trace = (log?.traceability as any) || {};
          const isMalicious = Boolean(norm?.enrichment?.is_malicious || norm?.threat?.is_malicious);
          const isPii = Boolean(norm?.compliance?.pii_redacted || (trace?.redacted_payload && trace.redacted_payload.includes('[REDACTED_AADHAAR]')));
          const rawHash = trace?.raw_sha256 || trace?.raw_hash || '00000000';
          const isSelected = selectedLogId === log?.id || selectedLogId === rawHash;

          const actor = norm?.enrichment?.threat_actor || norm?.threat?.actor || (isMalicious ? 'Unknown Adversary' : 'Security Alert');
          const mitre = norm?.enrichment?.mitre_id || norm?.threat?.mitre_id;
          const srcIp = norm?.src_endpoint?.ip || '0.0.0.0';
          const dstIp = norm?.dst_endpoint?.ip || '10.0.0.1';
          const severity = norm?.severity || norm?.threat?.severity_level || (isMalicious ? 'Critical' : 'Warning');

          return (
            <div
              key={log?.id || idx}
              onClick={() => onSelectLog(log)}
              className={`p-3 rounded-2xl border transition-all duration-200 cursor-pointer text-left relative overflow-hidden group ${
                isSelected
                  ? 'bg-white/[0.08] border-cyan-400/50 shadow-[0_0_20px_rgba(6,182,212,0.15)]'
                  : isMalicious
                  ? 'bg-rose-500/[0.03] hover:bg-rose-500/[0.06] border-rose-500/20 hover:border-rose-500/40'
                  : 'bg-amber-500/[0.03] hover:bg-amber-500/[0.06] border-amber-500/20 hover:border-amber-500/40'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider flex items-center gap-1 ${
                  isMalicious
                    ? 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
                    : 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${isMalicious ? 'bg-rose-400 animate-pulse' : 'bg-amber-400'}`} />
                  {severity}
                </span>

                <span className="text-[10px] font-mono text-zinc-500">
                  {trace?.ingest_timestamp ? new Date(trace.ingest_timestamp).toLocaleTimeString([], { hour12: false }) : 'Live'}
                </span>
              </div>

              <div className="text-xs font-semibold text-zinc-100 group-hover:text-white transition flex items-center justify-between">
                <span className="truncate max-w-[190px]">{actor}</span>
                <ChevronRight className="w-3.5 h-3.5 text-zinc-500 group-hover:text-cyan-400 transition" />
              </div>

              {mitre && (
                <div className="text-[10px] font-mono text-rose-300 mt-1 flex items-center gap-1">
                  <span>MITRE:</span>
                  <span className="px-1.5 py-0.2 rounded bg-rose-500/20 border border-rose-500/30 font-bold">
                    {mitre}
                  </span>
                </div>
              )}

              {/* Endpoint Trail */}
              <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/5 text-[10px] font-mono text-zinc-400">
                <span className="text-zinc-300">{srcIp}</span>
                <span className="text-zinc-600">→</span>
                <span className="text-zinc-400">{dstIp}</span>
              </div>

              {isPii && (
                <div className="mt-1.5 flex items-center gap-1 text-[10px] font-mono text-amber-400 font-medium">
                  <Lock className="w-3 h-3" />
                  <span>12-Digit Aadhaar Scrubbed & Re-hashed</span>
                </div>
              )}
            </div>
          );
        })}

        {threatEntries.length === 0 && (
          <div className="p-8 text-center text-zinc-500 text-xs font-mono">
            <ShieldCheck className="w-8 h-8 text-emerald-400 mx-auto mb-2 opacity-60" />
            No elevated threats active in current window
          </div>
        )}
      </div>
    </div>
  );
};
