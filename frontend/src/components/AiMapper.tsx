import React, { useState } from 'react';
import axios from 'axios';
import { 
  Sparkles, 
  Send, 
  CheckCircle2, 
  AlertCircle, 
  FileCode, 
  Workflow, 
  Plus, 
  Trash2, 
  Cpu, 
  Play 
} from 'lucide-react';

const OCSF_TARGET_FIELDS = [
  { value: 'src_endpoint.ip', label: 'Source IP Address (src_endpoint.ip)' },
  { value: 'src_endpoint.port', label: 'Source Port (src_endpoint.port)' },
  { value: 'dst_endpoint.ip', label: 'Destination IP Address (dst_endpoint.ip)' },
  { value: 'dst_endpoint.port', label: 'Destination Port (dst_endpoint.port)' },
  { value: 'activity_name', label: 'Activity Name / Action (activity_name)' },
  { value: 'severity', label: 'Severity Classification (severity)' },
  { value: 'category_name', label: 'Security Category (category_name)' },
  { value: 'actor.user.name', label: 'User Account (actor.user.name)' },
  { value: 'http_request.url', label: 'HTTP Request URL (http_request.url)' },
];

const PRESETS = [
  {
    id: 'cisco',
    name: 'Cisco ASA Firewall',
    badge: 'Syslog',
    sourceType: 'cisco_asa',
    wireFormat: 'SYSLOG',
    sample: `<164>Oct 24 10:20:30 ciscoasa: %ASA-4-106023: Denied tcp src inside:198.51.100.23/50901 dst outside:198.51.100.10/22 by access-group 'OUTSIDE_IN'`,
    mappings: [
      { sourceKey: 'src', ocsfPath: 'src_endpoint.ip' },
      { sourceKey: 'dst', ocsfPath: 'dst_endpoint.ip' },
      { sourceKey: 'action', ocsfPath: 'activity_name' },
    ]
  },
  {
    id: 'paloalto',
    name: 'Palo Alto GlobalProtect',
    badge: 'CEF',
    sourceType: 'vpn_gateway',
    wireFormat: 'CEF',
    sample: `CEF:0|PaloAltoNetworks|PAN-OS|10.1|AUTH|GlobalProtect login|5|src=198.51.100.23 dst=10.0.0.1 spt=54321 dpt=443 suser=priya.verma act=login-success aadhaar_id=982345129081`,
    mappings: [
      { sourceKey: 'src', ocsfPath: 'src_endpoint.ip' },
      { sourceKey: 'dst', ocsfPath: 'dst_endpoint.ip' },
      { sourceKey: 'suser', ocsfPath: 'actor.user.name' },
      { sourceKey: 'act', ocsfPath: 'activity_name' },
    ]
  },
  {
    id: 'linux',
    name: 'Linux SSHD Authentication',
    badge: 'Syslog',
    sourceType: 'linux_auth',
    wireFormat: 'SYSLOG',
    sample: `<84>Oct 24 10:22:15 auth-server-01 sshd[1234]: Failed password for root from 203.0.113.84 port 48212 ssh2 session_id=SES_9999 gov_ref_aadhaar=452178902341`,
    mappings: [
      { sourceKey: 'src', ocsfPath: 'src_endpoint.ip' },
      { sourceKey: 'user', ocsfPath: 'actor.user.name' },
      { sourceKey: 'status', ocsfPath: 'activity_name' },
    ]
  },
];

export const AiMapper: React.FC = () => {
  const [selectedPresetId, setSelectedPresetId] = useState('paloalto');
  const [parserName, setParserName] = useState('PaloAlto_GlobalProtect_VPN');
  const [sourceType, setSourceType] = useState('vpn_gateway');
  const [wireFormat, setWireFormat] = useState('CEF');
  const [rawSample, setRawSample] = useState(PRESETS[1].sample);
  const [mappings, setMappings] = useState(PRESETS[1].mappings);

  const [isDeploying, setIsDeploying] = useState(false);
  const [deployResult, setDeployResult] = useState<{
    status: 'idle' | 'success' | 'error';
    message: string;
    vrlPreview?: string;
  }>({ status: 'idle', message: '' });

  const loadPreset = (presetId: string) => {
    const preset = PRESETS.find(p => p.id === presetId);
    if (!preset) return;
    setSelectedPresetId(presetId);
    setParserName(preset.name.replace(/[^a-zA-Z0-9]/g, '_'));
    setSourceType(preset.sourceType);
    setWireFormat(preset.wireFormat);
    setRawSample(preset.sample);
    setMappings(preset.mappings);
    setDeployResult({ status: 'idle', message: '' });
  };

  const addMappingRow = () => {
    setMappings([...mappings, { sourceKey: '', ocsfPath: OCSF_TARGET_FIELDS[0].value }]);
  };

  const removeMappingRow = (index: number) => {
    setMappings(mappings.filter((_, idx) => idx !== index));
  };

  const updateMappingRow = (index: number, key: 'sourceKey' | 'ocsfPath', value: string) => {
    const updated = [...mappings];
    updated[index][key] = value;
    setMappings(updated);
  };

  const handleDeployParser = async () => {
    setIsDeploying(true);
    setDeployResult({ status: 'idle', message: '' });

    try {
      const mappingDict: Record<string, string> = {};
      mappings.forEach(m => {
        if (m.sourceKey.trim()) {
          mappingDict[m.sourceKey.trim()] = m.ocsfPath;
        }
      });

      const response = await axios.post('http://localhost:8000/api/generate-parser', {
        parser_name: parserName,
        source_type: sourceType,
        wire_format: wireFormat,
        mappings: mappingDict,
        raw_sample: rawSample,
      });

      setDeployResult({
        status: 'success',
        message: response.data.message || 'Parser successfully deployed to Vector pipeline!',
        vrlPreview: response.data.vrl_preview,
      });
    } catch (err: any) {
      setDeployResult({
        status: 'error',
        message: err.response?.data?.error || err.message || 'Failed to deploy parser to Vector backend.',
      });
    } finally {
      setIsDeploying(false);
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between pb-5 mb-5 border-b border-slate-200 gap-4">
        <div className="flex items-center space-x-3.5">
          <div className="p-2.5 rounded-lg bg-blue-50 text-blue-600 border border-blue-100">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              Autonomous AI Schema Studio
              <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 font-bold">
                Vector VRL Engine
              </span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Compile proprietary vendor device schemas into standard OCSF v1.1.0 with zero runtime downtime
            </p>
          </div>
        </div>

        {/* Deploy Action Button */}
        <button
          onClick={handleDeployParser}
          disabled={isDeploying}
          className="flex items-center space-x-2 px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs uppercase tracking-wider shadow-sm transition-all disabled:opacity-50 cursor-pointer"
        >
          {isDeploying ? (
            <>
              <Cpu className="w-4 h-4 animate-spin" />
              <span>Compiling VRL...</span>
            </>
          ) : (
            <>
              <Send className="w-4 h-4" />
              <span>Deploy Parser to Vector</span>
            </>
          )}
        </button>
      </div>

      {/* Preloaded Presets Bar */}
      <div className="mb-5 bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-3">
        <span className="text-xs font-bold text-slate-700 flex items-center gap-2 uppercase font-mono">
          <Play className="w-3.5 h-3.5 text-blue-600" />
          Quick Load Vendor Presets:
        </span>
        <div className="flex items-center space-x-2 flex-wrap">
          {PRESETS.map(p => (
            <button
              key={p.id}
              onClick={() => loadPreset(p.id)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center space-x-2 ${
                selectedPresetId === p.id
                  ? 'bg-blue-50 text-blue-700 border border-blue-300 shadow-sm font-bold'
                  : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              <span>{p.name}</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 border border-slate-200 font-mono">
                {p.badge}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Form Fields */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">
            Parser Identifier Name
          </label>
          <input
            type="text"
            value={parserName}
            onChange={(e) => setParserName(e.target.value)}
            className="w-full bg-white border border-slate-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 rounded-lg p-2.5 text-xs font-mono font-semibold text-slate-900 outline-none"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">
            Device Source Identifier
          </label>
          <input
            type="text"
            value={sourceType}
            onChange={(e) => setSourceType(e.target.value)}
            className="w-full bg-white border border-slate-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 rounded-lg p-2.5 text-xs font-mono font-semibold text-slate-900 outline-none"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">
            Wire Format
          </label>
          <select
            value={wireFormat}
            onChange={(e) => setWireFormat(e.target.value)}
            className="w-full bg-white border border-slate-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 rounded-lg p-2.5 text-xs font-mono font-semibold text-slate-900 outline-none cursor-pointer"
          >
            <option value="CEF">Common Event Format (CEF)</option>
            <option value="SYSLOG">RFC 5424/3164 Syslog</option>
            <option value="JSON">Structured JSON</option>
            <option value="KEY_VALUE">Key-Value Pairs</option>
          </select>
        </div>
      </div>

      {/* Raw Sample Payload */}
      <div className="mb-5">
        <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center justify-between">
          <span>Sample Wire Log Payload</span>
          <span className="text-[10px] text-slate-500 font-mono font-normal">Auto-tokenized</span>
        </label>
        <textarea
          rows={2}
          value={rawSample}
          onChange={(e) => setRawSample(e.target.value)}
          className="w-full bg-white border border-slate-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 rounded-lg p-3 text-xs font-mono text-slate-800 outline-none"
          placeholder="Paste raw log string..."
        />
      </div>

      {/* Semantic Projection Matrix */}
      <div className="bg-slate-50 p-4.5 rounded-xl border border-slate-200 mb-5">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2 font-mono">
            <Workflow className="w-4 h-4 text-blue-600" />
            Device-to-OCSF Semantic Projection Matrix
          </span>
          <button
            onClick={addMappingRow}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-white text-blue-700 hover:bg-blue-50 text-xs font-bold border border-slate-200 transition cursor-pointer shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Field Mapping</span>
          </button>
        </div>

        <div className="space-y-2.5 max-h-52 overflow-y-auto pr-1">
          {mappings.map((m, idx) => (
            <div key={idx} className="flex items-center space-x-2.5">
              <input
                type="text"
                placeholder="Device Field (e.g. src)"
                value={m.sourceKey}
                onChange={(e) => updateMappingRow(idx, 'sourceKey', e.target.value)}
                className="flex-1 bg-white border border-slate-300 focus:border-blue-600 rounded-lg p-2 text-xs font-mono text-slate-900 outline-none"
              />
              <span className="text-slate-400 text-xs font-mono font-bold">&rarr;</span>
              <select
                value={m.ocsfPath}
                onChange={(e) => updateMappingRow(idx, 'ocsfPath', e.target.value)}
                className="flex-1 bg-white border border-slate-300 focus:border-blue-600 rounded-lg p-2 text-xs font-mono text-slate-900 outline-none cursor-pointer"
              >
                {OCSF_TARGET_FIELDS.map(f => (
                  <option key={f.value} value={f.value}>{f.label}</option>
                ))}
              </select>
              <button
                onClick={() => removeMappingRow(idx)}
                className="p-2 text-slate-400 hover:text-rose-600 transition cursor-pointer rounded-lg hover:bg-rose-50"
                title="Remove"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Deployment Result */}
      {deployResult.status === 'success' && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 text-xs space-y-2.5">
          <div className="flex items-center space-x-2 font-bold">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{deployResult.message}</span>
          </div>
          {deployResult.vrlPreview && (
            <div>
              <div className="text-xs text-slate-600 font-mono mb-1.5 flex items-center gap-1.5 font-bold">
                <FileCode className="w-3.5 h-3.5 text-emerald-600" />
                <span>Generated Vector Remap Language (VRL) Artifact in /vector:</span>
              </div>
              <pre className="bg-slate-900 text-emerald-400 p-3.5 rounded-lg border border-slate-800 font-mono text-xs overflow-x-auto max-h-40 leading-relaxed">
                {deployResult.vrlPreview}
              </pre>
            </div>
          )}
        </div>
      )}

      {deployResult.status === 'error' && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-900 text-xs flex items-center space-x-2 font-semibold">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{deployResult.message}</span>
        </div>
      )}
    </div>
  );
};
