import React, { useState } from 'react';
import { Copy, Check, FileCode, Terminal, Sparkles, Shield, Lock, Eye, Download } from 'lucide-react';
import type { ULPFLogRecord } from '../types';
import { recordToCef, recordToSyslog } from '../utils/exportFormats';

interface OcsfJsonPreviewProps {
  log: ULPFLogRecord | null;
  onOpenDrawer?: () => void;
}

export const OcsfJsonPreview: React.FC<OcsfJsonPreviewProps> = ({ log, onOpenDrawer }) => {
  const [copied, setCopied] = useState(false);
  const [viewMode, setViewMode] = useState<'ocsf' | 'raw' | 'cef'>('ocsf');

  if (!log) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 text-center bg-zinc-950 border border-zinc-800 rounded-2xl">
        <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400 mb-3">
          <FileCode className="w-6 h-6 text-cyan-400" />
        </div>
        <h4 className="text-sm font-semibold text-white">No Event Selected</h4>
        <p className="text-xs text-zinc-400 mt-1 max-w-xs">
          Select any event row from the Live Stream to project its real-time OCSF v1.1.0 schema with syntax highlighting.
        </p>
      </div>
    );
  }

  const norm = (log?.normalized_data as any) || {};
  const trace = (log?.traceability as any) || {};
  const isMalicious = Boolean(norm?.enrichment?.is_malicious || norm?.threat?.is_malicious);
  const piiRedacted = Boolean(norm?.compliance?.pii_redacted || (trace?.redacted_payload && trace.redacted_payload.includes('[REDACTED_AADHAAR]')));

  const rawString = trace?.sanitized_raw || trace?.redacted_payload || norm?.activity_name || '';
  const ocsfJson = JSON.stringify(norm, null, 2);
  const cefString = recordToCef(log);

  const currentDisplayContent = viewMode === 'ocsf' ? ocsfJson : viewMode === 'cef' ? cefString : rawString;

  const handleCopy = () => {
    navigator.clipboard.writeText(currentDisplayContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Modern syntax highlight for JSON (clean Linear/Vercel palette)
  const renderHighlightedJson = (jsonStr: string) => {
    // Tokenize JSON for crisp styling
    const lineRegex = /^( *)("[\w.-]+")(: )?("[^"]*"|\d+\.?\d*|true|false|null)?([,{}]*)$/;

    return jsonStr.split('\n').map((line, idx) => {
      // Regex replace keys, strings, numbers, booleans
      const highlighted = line
        .replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*")(\s*:)?/g, (match, p1, p2, p3) => {
          if (p3) {
            // It's a key
            return `<span class="text-cyan-400 font-semibold">${p1}</span>${p3}`;
          }
          // It's a string value
          return `<span class="text-emerald-400 font-medium">${match}</span>`;
        })
        .replace(/\b(true|false|null)\b/g, '<span class="text-violet-400 font-semibold">$1</span>')
        .replace(/\b(-?\d+\.?\d*)\b/g, '<span class="text-amber-400 font-semibold">$1</span>');

      return (
        <div key={idx} className="table-row leading-relaxed hover:bg-zinc-900">
          <span className="table-cell pr-4 select-none text-zinc-600 text-xs text-right font-mono w-8">{idx + 1}</span>
          <span 
            className="table-cell whitespace-pre font-mono text-xs text-white" 
            dangerouslySetInnerHTML={{ __html: highlighted }} 
          />
        </div>
      );
    });
  };

  return (
    <div className="h-full flex flex-col bg-zinc-950 border border-zinc-800 rounded-2xl overflow-hidden transition-colors">
      {/* IDE Top Chrome Bar */}
      <div className="px-5 py-4 border-b border-zinc-800 bg-zinc-950 flex items-center justify-between gap-3">
        <div className="flex items-center space-x-3 min-w-0">
          <div className="flex items-center space-x-1.5 shrink-0">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80 inline-block" />
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80 inline-block" />
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80 inline-block" />
          </div>

          <div className="h-4 w-px bg-zinc-800" />

          <div className="flex items-center space-x-2 min-w-0">
            <FileCode className="w-4 h-4 text-cyan-400 shrink-0" />
            <span className="text-xs font-semibold text-white truncate font-mono">
              ocsf.schema.v1_1_0.json
            </span>
          </div>

          <span className="hidden sm:inline-flex px-2.5 py-0.5 rounded-full text-xs font-mono font-medium text-cyan-400 bg-cyan-400/10 border border-cyan-400/20">
            Class {norm.class_uid || 4001}
          </span>
        </div>

        {/* View Mode Switcher + Action Buttons */}
        <div className="flex items-center space-x-2 shrink-0">
          <div className="flex items-center bg-zinc-900 p-1 rounded-xl border border-zinc-800 text-xs">
            <button
              type="button"
              onClick={() => setViewMode('ocsf')}
              className={`px-3 py-1 rounded-lg font-medium transition cursor-pointer ${
                viewMode === 'ocsf'
                  ? 'bg-cyan-500/10 text-cyan-400 font-semibold border border-cyan-500/20'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              OCSF JSON
            </button>
            <button
              type="button"
              onClick={() => setViewMode('raw')}
              className={`px-3 py-1 rounded-lg font-medium transition cursor-pointer ${
                viewMode === 'raw'
                  ? 'bg-cyan-500/10 text-cyan-400 font-semibold border border-cyan-500/20'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Raw Wire
            </button>
            <button
              type="button"
              onClick={() => setViewMode('cef')}
              className={`px-3 py-1 rounded-lg font-medium transition cursor-pointer ${
                viewMode === 'cef'
                  ? 'bg-cyan-500/10 text-cyan-400 font-semibold border border-cyan-500/20'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              CEF
            </button>
          </div>

          {/* Copy Button */}
          <button
            type="button"
            onClick={handleCopy}
            className="flex items-center space-x-2 px-3 py-1.5 rounded-xl text-xs font-semibold bg-zinc-900 hover:bg-zinc-800 text-white border border-zinc-800 transition cursor-pointer"
            title="Copy current projected schema"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400 font-medium">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-zinc-400" />
                <span>Copy</span>
              </>
            )}
          </button>

          {onOpenDrawer && (
            <button
              type="button"
              onClick={onOpenDrawer}
              className="p-1.5 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-900 border border-zinc-800 transition cursor-pointer"
              title="Open Deep Forensic Modal Inspector"
            >
              <Eye className="w-4 h-4 text-cyan-400" />
            </button>
          )}
        </div>
      </div>

      {/* Meta Indicators Sub-strip */}
      <div className="px-5 py-2.5 bg-zinc-950 border-b border-zinc-800 flex flex-wrap items-center justify-between text-xs text-zinc-400 gap-2">
        <div className="flex items-center space-x-2.5">
          {isMalicious ? (
            <span className="inline-flex items-center space-x-1.5 px-3 py-0.5 rounded-full text-rose-300 bg-rose-500/10 border border-rose-500/20 font-semibold text-xs">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse" />
              <span>{norm.enrichment?.threat_actor || norm.threat?.actor || 'Threat Hit'}</span>
            </span>
          ) : (
            <span className="inline-flex items-center space-x-1.5 px-3 py-0.5 rounded-full text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 font-semibold text-xs">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span>Verified Benign</span>
            </span>
          )}

          {piiRedacted && (
            <span className="inline-flex items-center space-x-1.5 px-3 py-0.5 rounded-full text-amber-300 bg-amber-500/10 border border-amber-500/20 font-semibold text-xs">
              <Lock className="w-3 h-3 text-amber-400" />
              <span>Aadhaar Scrubbed</span>
            </span>
          )}
        </div>

        <div className="flex items-center space-x-2 font-mono text-xs text-zinc-400">
          <span>SHA: <strong className="text-white">{(trace.raw_sha256 || trace.raw_hash || '0000000000').substring(0, 14)}...</strong></span>
        </div>
      </div>

      {/* Viewer Body */}
      <div className="flex-1 overflow-auto p-5 font-mono text-xs bg-black select-text">
        {viewMode === 'ocsf' ? (
          <div className="table w-full">
            {renderHighlightedJson(ocsfJson)}
          </div>
        ) : viewMode === 'cef' ? (
          <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 text-amber-300 leading-relaxed break-all whitespace-pre-wrap select-all">
            {cefString}
          </div>
        ) : (
          <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 text-white leading-relaxed break-all whitespace-pre-wrap select-all">
            {rawString}
          </div>
        )}
      </div>

      {/* Footer Details */}
      <div className="px-5 py-3 bg-zinc-950 border-t border-zinc-800 flex items-center justify-between text-xs text-zinc-400 font-mono">
        <span className="text-zinc-400">
          {viewMode === 'ocsf' ? `${ocsfJson.split('\n').length} lines · OCSF 1.1.0 Normalized JSON` : viewMode === 'cef' ? 'ArcSight CEF Standard' : 'Raw Wire Lossless'}
        </span>
        <button
          type="button"
          onClick={onOpenDrawer}
          className="text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1.5 transition cursor-pointer text-xs"
        >
          <span>Expand Deep Forensics</span>
          <span>→</span>
        </button>
      </div>
    </div>
  );
};
