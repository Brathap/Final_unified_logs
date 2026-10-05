"""Deterministic Unknown Source Intelligence Engine for ULPF.

100% Offline / Air-Gapped. No cloud AI, external LLM, or internet calls required.
Consists of:
1. FormatFingerprinter: Classifies format (CEF, RFC5424, RFC3164, JSON, KV, CSV, Syslog).
2. TemplateClusterer: Drain-like token tree clustering that abstracts dynamic variables (<IP>, <PORT>, <HEX>, <NUM>).
3. FieldInferencer: Deterministic semantic tagging of fields with confidence score and human-readable explanation.
4. ProposalGenerator: Generates draft YAML source packs for operator review.
"""

import re
import json
import yaml
from typing import Dict, Any, List, Optional, Tuple


class FormatFingerprinter:
    """Classifies log formats deterministically based on structural wire signatures."""

    @staticmethod
    def identify(raw_line: str) -> Dict[str, Any]:
        line = raw_line.strip()
        
        # 1. JSON
        if (line.startswith("{") and line.endswith("}")) or (line.startswith("[") and line.endswith("]")):
            try:
                json.loads(line)
                return {"format": "JSON", "confidence": 1.0, "delimiter": None}
            except Exception:
                pass

        # 2. CEF
        if "CEF:" in line:
            return {"format": "CEF", "confidence": 0.98, "delimiter": "|"}

        # 3. LEEF
        if "LEEF:" in line:
            return {"format": "LEEF", "confidence": 0.98, "delimiter": "|"}

        # 4. RFC 5424 Syslog (<PRI>VERSION TIMESTAMP HOST APP-NAME PROCID MSGID ...)
        if re.match(r'^<\d{1,3}>1\s+\d{4}-\d{2}-\d{2}T', line):
            return {"format": "SYSLOG_RFC5424", "confidence": 0.99, "delimiter": " "}

        # 5. RFC 3164 Syslog (<PRI>Mmm dd hh:mm:ss ...)
        if re.match(r'^(?:<\d{1,3}>)?[A-Z][a-z]{2}\s+\d{1,2}\s+\d{2}:\d{2}:\d{2}', line):
            return {"format": "SYSLOG_RFC3164", "confidence": 0.92, "delimiter": " "}

        # 6. Key-Value (e.g. k1=v1 k2="v2")
        kv_pairs = re.findall(r'([a-zA-Z0-9_\-\.]+)=([^\s"\'=]+|"[^"]*")', line)
        if len(kv_pairs) >= 3:
            return {"format": "KEY_VALUE", "confidence": 0.85, "delimiter": " "}

        # 7. CSV / TSV / Delimited
        if line.count(",") >= 4:
            return {"format": "CSV", "confidence": 0.80, "delimiter": ","}
        if line.count("|") >= 4:
            return {"format": "PIPE_DELIMITED", "confidence": 0.80, "delimiter": "|"}

        return {"format": "UNSTRUCTURED_TEXT", "confidence": 0.50, "delimiter": " "}


class TemplateClusterer:
    """Drain-like deterministic tree clustering that abstracts dynamic variables."""

    VAR_PATTERNS = [
        (re.compile(r'\b(?:\d{1,3}\.){3}\d{1,3}\b'), '<IP>'),
        (re.compile(r'\b(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}\b'), '<IPV6>'),
        (re.compile(r'\b[0-9a-fA-F]{2}(?::[0-9a-fA-F]{2}){5}\b'), '<MAC>'),
        (re.compile(r'\b\d{4}-\d{2}-\d{2}[T\s]\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:?\d{2})?\b'), '<TIMESTAMP>'),
        (re.compile(r'\b[A-Z][a-z]{2}\s+\d{1,2}\s+\d{2}:\d{2}:\d{2}\b'), '<TIMESTAMP>'),
        (re.compile(r'\b[0-9a-fA-F]{32,64}\b'), '<HASH>'),
        (re.compile(r'\b0x[0-9a-fA-F]+\b'), '<HEX>'),
        (re.compile(r'(?<=port\s)\d+|(?<=:)\d{2,5}\b'), '<PORT>'),
        (re.compile(r'\b\d+\b'), '<NUM>'),
    ]

    @classmethod
    def extract_template(cls, raw_line: str) -> str:
        template = raw_line.strip()
        for pattern, token in cls.VAR_PATTERNS:
            template = pattern.sub(token, template)
        return template


class FieldInferencer:
    """Deterministic semantic tagging with confidence and explanation."""

    SEMANTIC_RULES = [
        {
            "field": "src_endpoint.ip",
            "regex": re.compile(r'(?:src(?:_ip)?|from|source)[\s:=]+((?:\d{1,3}\.){3}\d{1,3})', re.IGNORECASE),
            "confidence": 0.95,
            "explanation": "Preceded by source identifier prefix and matches valid IPv4 syntax."
        },
        {
            "field": "dst_endpoint.ip",
            "regex": re.compile(r'(?:dst(?:_ip)?|to|destination)[\s:=]+((?:\d{1,3}\.){3}\d{1,3})', re.IGNORECASE),
            "confidence": 0.95,
            "explanation": "Preceded by destination identifier prefix and matches valid IPv4 syntax."
        },
        {
            "field": "src_endpoint.port",
            "regex": re.compile(r'(?:spt|src_port|sport)[\s:=]+(\d{1,5})', re.IGNORECASE),
            "confidence": 0.90,
            "explanation": "Source port key or suffix matching valid port range."
        },
        {
            "field": "dst_endpoint.port",
            "regex": re.compile(r'(?:dpt|dst_port|dport)[\s:=]+(\d{1,5})', re.IGNORECASE),
            "confidence": 0.90,
            "explanation": "Destination port key or suffix matching valid port range."
        },
        {
            "field": "user.name",
            "regex": re.compile(r'(?:user(?:name)?|usr|login)[\s:=]+([a-zA-Z0-9_\-\.]+)', re.IGNORECASE),
            "confidence": 0.88,
            "explanation": "Preceded by user identity prefix."
        },
        {
            "field": "activity_name",
            "regex": re.compile(r'\b(Accepted|Failed|Denied|Blocked|Connected|Disconnected|Teardown|Built)\b', re.IGNORECASE),
            "confidence": 0.85,
            "explanation": "Matches standard security state action keyword."
        }
    ]

    @classmethod
    def infer_fields(cls, raw_line: str) -> List[Dict[str, Any]]:
        results = []
        for rule in cls.SEMANTIC_RULES:
            match = rule["regex"].search(raw_line)
            if match:
                val = match.group(1)
                results.append({
                    "ocsf_field": rule["field"],
                    "extracted_value": val,
                    "confidence": rule["confidence"],
                    "explanation": rule["explanation"],
                    "start": match.start(1),
                    "end": match.end(1)
                })
        return results


class ProposalGenerator:
    """Generates an air-gapped YAML candidate source pack from unknown logs."""

    @staticmethod
    def generate_candidate_pack(vendor: str, product: str, sample_logs: List[str]) -> str:
        if not sample_logs:
            return ""

        first_log = sample_logs[0]
        fingerprint = FormatFingerprinter.identify(first_log)
        template = TemplateClusterer.extract_template(first_log)
        inferred = FieldInferencer.infer_fields(first_log)

        # Generate simple regex capturing tokens
        regex_pattern = re.escape(template)
        regex_pattern = regex_pattern.replace(r'\<IP\>', r'(?P<ip>[0-9.]+)')
        regex_pattern = regex_pattern.replace(r'\<NUM\>', r'(?P<num>\d+)')
        regex_pattern = regex_pattern.replace(r'\<TIMESTAMP\>', r'(?P<timestamp>\S+)')

        mappings = {}
        for item in inferred:
            mappings[item["ocsf_field"]] = item["ocsf_field"].split(".")[-1]

        candidate_data = {
            "metadata": {
                "vendor": vendor,
                "product": product,
                "version": "1.0.0-draft",
                "priority": 90,
                "format_detected": fingerprint.get("format", "UNSTRUCTURED_TEXT"),
                "clustering_template": template
            },
            "detection": {
                "match_regex": [re.escape(first_log[:30])]
            },
            "parser": {
                "type": "regex",
                "pattern": regex_pattern[:150]
            },
            "ocsf": {
                "class_uid": 4001,
                "category_name": "Network Activity",
                "activity_name": "Inferred Network Telemetry"
            },
            "mappings": mappings
        }

        header = "# Proposed Candidate Source Pack (Generated 100% Offline)\n"
        return header + yaml.safe_dump(candidate_data, sort_keys=False)

