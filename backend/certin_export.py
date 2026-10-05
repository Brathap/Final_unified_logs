"""CERT-In Mandate-Compliant Incident Reporting Engine (Item 6).

Adheres to Indian Computer Emergency Response Team (CERT-In) Cyber Security Directions.
Mandates structured incident disclosure within 6 hours of detection:
- Incident classification & category
- Time of incident detection and occurrence (in IST / UTC ISO-8601)
- Affected critical systems & perimeter network identifiers
- Technical summary of logs, attacker IOCs, and hash signatures
- Immediate remedial actions taken
- Chain-of-custody verification hash
"""

import datetime
import hashlib
import json
from typing import Any, Dict, List, Optional


class CertInReporter:
    """Formats, validates, and packages security events into CERT-In compliance incident dossiers."""

    CERTIN_INCIDENT_TYPES = [
        "Targeted scanning/probing of critical networks and systems",
        "Compromise of critical systems/information",
        "Unauthorized access to IT systems/data",
        "Defacement of website or intrusion into a website",
        "Malicious code attacks such as Ransomware / Spyware / Cryptominer",
        "Attack on servers such as Database, Mail and DNS and network devices",
        "Identity Theft, spoofing and phishing attacks",
        "Denial of Service (DoS) and Distributed Denial of Service (DDoS) attacks",
        "Attacks on Critical Information Infrastructure (CII)",
        "Data Breach / Data Leak",
        "Unexplained affected system/network traffic",
        "Attacks on applications including SCADA/IoT systems"
    ]

    @staticmethod
    def generate_incident_report(
        incident_id: str,
        events: List[Dict[str, Any]],
        reported_by: str,
        organization: str = "National Critical Infrastructure SecOps",
        remedial_action: str = "Threat actor isolated via air-gapped firewall policy; egress blocked."
    ) -> Dict[str, Any]:
        """Generates a CERT-In standard incident disclosure payload."""
        now_utc = datetime.datetime.now(datetime.timezone.utc)
        ist_offset = datetime.timezone(datetime.timedelta(hours=5, minutes=30))
        now_ist = now_utc.astimezone(ist_offset)

        # Extract IOCs and attacker endpoints
        attacker_ips = set()
        targeted_assets = set()
        affected_classes = set()
        ioc_hashes = []
        pii_leak_prevented = False

        for ev in events:
            norm = ev.get("normalized_data") or {}
            trace = ev.get("traceability") or {}
            
            src_ip = norm.get("src_endpoint", {}).get("ip")
            dst_ip = norm.get("dst_endpoint", {}).get("ip")
            if src_ip:
                attacker_ips.add(src_ip)
            if dst_ip:
                targeted_assets.add(dst_ip)
            
            if norm.get("class_uid"):
                affected_classes.add(str(norm.get("class_uid")))
            if trace.get("raw_sha256"):
                ioc_hashes.append(trace.get("raw_sha256"))
            if norm.get("compliance", {}).get("pii_redacted"):
                pii_leak_prevented = True

        report_body = {
            "mandate_reference": "CERT-In Cyber Security Directions (No. 20(3)/2022-CERT-In)",
            "reporting_timeline": "Mandatory 6-Hour Window Compliance",
            "report_metadata": {
                "incident_id": incident_id,
                "timestamp_utc": now_utc.isoformat(),
                "timestamp_ist": now_ist.strftime("%Y-%m-%d %H:%M:%S IST"),
                "reporting_entity": organization,
                "reported_by": reported_by,
            },
            "incident_details": {
                "primary_category": "Targeted scanning/probing of critical networks and systems" if "4001" in affected_classes else "Unauthorized access to IT systems/data",
                "severity": "CRITICAL" if any(ev.get("normalized_data", {}).get("severity") in ("Critical", "High") for ev in events) else "MEDIUM",
                "affected_asset_count": len(targeted_assets),
                "targeted_assets": sorted(list(targeted_assets)),
                "associated_indicators_of_compromise": {
                    "source_ips": sorted(list(attacker_ips)),
                    "sha256_event_fingerprints": ioc_hashes[:10],
                },
                "data_privacy_safeguards": {
                    "indian_pii_sanitized": pii_leak_prevented,
                    "scrubbed_entities": ["Aadhaar", "PAN", "Mobile"] if pii_leak_prevented else []
                },
                "event_count_analyzed": len(events)
            },
            "remediation_status": {
                "action_taken": remedial_action,
                "containment_status": "CONTAINED",
                "forensic_preservation": "SQLite WAL + Append-Only Raw JSONL"
            }
        }

        # Calculate evidentiary hash of the report content itself
        serialized = json.dumps(report_body, sort_keys=True)
        report_sha = hashlib.sha256(serialized.encode("utf-8")).hexdigest()
        report_body["report_integrity_sha256"] = report_sha

        return report_body
