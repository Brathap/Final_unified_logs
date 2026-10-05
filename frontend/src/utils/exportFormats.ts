export interface FormatExportOptions {
  filename?: string;
  format: 'json' | 'jsonl' | 'csv' | 'cef' | 'syslog';
}

/**
 * Convert a single ULPFLogRecord or its normalized data into standard CEF string
 */
export function recordToCef(record: any): string {
  const norm = record?.normalized_data || {};
  const trace = record?.traceability || {};
  const vendor = norm?.metadata?.product?.vendor_name || 'ULPF';
  const product = norm?.metadata?.product?.name || 'Pipeline';
  const version = norm?.metadata?.version || '1.1.0';
  const classUid = norm?.class_uid || '4001';
  const name = norm?.activity_name || 'Security Event';
  const severity = norm?.severity_id || (norm?.severity === 'Critical' ? 10 : norm?.severity === 'High' ? 7 : 3);

  const extensions: string[] = [];
  if (norm?.src_endpoint?.ip) extensions.push(`src=${norm.src_endpoint.ip}`);
  if (norm?.src_endpoint?.port) extensions.push(`spt=${norm.src_endpoint.port}`);
  if (norm?.dst_endpoint?.ip) extensions.push(`dst=${norm.dst_endpoint.ip}`);
  if (norm?.dst_endpoint?.port) extensions.push(`dpt=${norm.dst_endpoint.port}`);
  if (norm?.actor?.user?.name) extensions.push(`suser=${norm.actor.user.name}`);
  if (norm?.category_name) extensions.push(`cat=${norm.category_name}`);
  if (trace?.raw_sha256) extensions.push(`cs1Label=SHA256 cs1=${trace.raw_sha256}`);
  if (trace?.sanitized_raw) {
    const cleanRaw = trace.sanitized_raw.replace(/[\n\r]/g, ' ').substring(0, 160);
    extensions.push(`msg=${cleanRaw}`);
  }

  return `CEF:0|${vendor}|${product}|${version}|${classUid}|${name}|${severity}|${extensions.join(' ')}`;
}

/**
 * Convert a record into RFC5424 / RFC3164 Syslog format
 */
export function recordToSyslog(record: any): string {
  const norm = record?.normalized_data || {};
  const trace = record?.traceability || {};
  const isoTime = trace?.ingest_timestamp || new Date().toISOString();
  const host = (norm?.metadata?.product?.name || 'ulpf-edge-sensor').replace(/[^a-zA-Z0-9_-]/g, '-');
  const app = norm?.metadata?.source_type || 'ulpf-core';
  const msg = trace?.sanitized_raw || JSON.stringify(norm);
  const pri = norm?.severity === 'Critical' ? 131 : norm?.severity === 'High' ? 132 : 134; // Local0 facility

  return `<${pri}>1 ${isoTime} ${host} ${app} - - [ocsf@4001 class_uid="${norm.class_uid || 4001}"] ${msg}`;
}

/**
 * Convert an array of records to tabular CSV
 */
export function recordsToCsv(records: any[]): string {
  const headers = [
    'Timestamp',
    'Class_UID',
    'Category',
    'Activity',
    'Severity',
    'Source_IP',
    'Source_Port',
    'Dest_IP',
    'Dest_Port',
    'Actor_User',
    'Threat_Actor',
    'PII_Scrubbed',
    'SHA256_Hash',
    'Raw_Payload'
  ];

  const rows = records.map(r => {
    const norm = r?.normalized_data || {};
    const trace = r?.traceability || {};
    const piiRedacted = Boolean(norm?.compliance?.pii_redacted || (trace?.redacted_payload && trace.redacted_payload.includes('[REDACTED_AADHAAR]')));

    const fields = [
      trace?.ingest_timestamp || '',
      norm?.class_uid || '4001',
      norm?.category_name || '',
      norm?.activity_name || '',
      norm?.severity || 'Informational',
      norm?.src_endpoint?.ip || '',
      norm?.src_endpoint?.port || '',
      norm?.dst_endpoint?.ip || '',
      norm?.dst_endpoint?.port || '',
      norm?.actor?.user?.name || '',
      norm?.enrichment?.threat_actor || norm?.threat?.actor || 'None',
      piiRedacted ? 'YES' : 'NO',
      trace?.raw_sha256 || '',
      (trace?.sanitized_raw || '').replace(/"/g, '""').replace(/[\r\n]+/g, ' ')
    ];

    return fields.map(f => `"${f}"`).join(',');
  });

  return [headers.join(','), ...rows].join('\n');
}

/**
 * Universal file trigger
 */
export function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Multi-format exporter for single or batched logs
 */
export function exportLogs(records: any[], format: 'json' | 'jsonl' | 'csv' | 'cef' | 'syslog', baseFilename = 'ulpf_export') {
  const count = records.length;
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const filename = `${baseFilename}_${count}records_${timestamp}.${format === 'jsonl' ? 'jsonl' : format}`;

  if (format === 'json') {
    const payload = JSON.stringify(records, null, 2);
    downloadFile(payload, filename, 'application/json');
  } else if (format === 'jsonl') {
    const payload = records.map(r => JSON.stringify(r)).join('\n');
    downloadFile(payload, filename, 'application/x-ndjson');
  } else if (format === 'csv') {
    const payload = recordsToCsv(records);
    downloadFile(payload, filename, 'text/csv;charset=utf-8;');
  } else if (format === 'cef') {
    const payload = records.map(recordToCef).join('\n');
    downloadFile(payload, filename, 'text/plain;charset=utf-8;');
  } else if (format === 'syslog') {
    const payload = records.map(recordToSyslog).join('\n');
    downloadFile(payload, filename, 'text/plain;charset=utf-8;');
  }
}
