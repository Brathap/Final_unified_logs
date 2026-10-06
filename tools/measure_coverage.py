#!/usr/bin/env python3
"""Real-Data Pipeline Coverage and Fidelity Measurement Tool.

Executes real-world corpora (Loghub OpenSSH, Linux, Apache, Proxifier, HDFS)
through the ULPF ingestion and normalization engine.
Reports per-corpus:
- Total records
- Parsed % (Full semantic extraction and OCSF mapping)
- Partial % (Structural attributes parsed, partial taxonomy)
- Unparsed % (Preserved losslessly with wire SHA-256 and fallback envelope)
- Records emitted as OCSF (Must be 100% — unparsed logs are preserved, never dropped)
"""

import os
import sys
import json
import time
from typing import Dict, Any, List

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend")))
from source_packs.registry import SourcePackRegistry
from lineage_engine import LineageEngine

REALDATA_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "realdata")
SOURCES_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "sources")


def process_corpus(registry: SourcePackRegistry, filepath: str, max_lines: int = 2000) -> Dict[str, Any]:
    total_records = 0
    full_parsed = 0
    partial_parsed = 0
    unparsed = 0
    emitted_ocsf = 0
    misses: List[Dict[str, Any]] = []

    if not os.path.exists(filepath):
        return {
            "error": f"File not found: {filepath}",
            "total_records": 0,
            "parsed_pct": 0.0,
            "partial_pct": 0.0,
            "unparsed_pct": 0.0,
            "emitted_pct": 0.0
        }

    with open(filepath, "r", encoding="utf-8", errors="replace") as f:
        for idx, line in enumerate(f):
            if idx >= max_lines:
                break
            raw_line = line.strip()
            if not raw_line:
                continue

            total_records += 1

            # Attempt routing through source packs
            routed = registry.route_and_parse(raw_line)
            if routed:
                pack, extracted, ocsf = routed
                # Lineage tracking
                envelope = LineageEngine.build_envelope(
                    raw_text=raw_line,
                    normalized_data=ocsf,
                    parser_id=pack.pack_id,
                    pack_version=pack.version,
                    extracted_fields=extracted
                )
                emitted_ocsf += 1

                # Check degree of parsing
                # If key endpoints or actions were mapped
                has_ip = bool(ocsf.get("src_endpoint", {}).get("ip") or ocsf.get("dst_endpoint", {}).get("ip"))
                has_user = bool(ocsf.get("user", {}).get("name"))
                has_activity = bool(ocsf.get("activity_name"))

                if (has_ip or has_user) and has_activity:
                    full_parsed += 1
                else:
                    partial_parsed += 1
            else:
                # UNPARSED: Preserve losslessly! Emitted as generic OCSF unparsed envelope
                unparsed += 1
                fallback_ocsf = {
                    "metadata": {
                        "version": "1.1.0",
                        "product": {"vendor_name": "Generic", "name": "Unparsed", "version": "1.0"}
                    },
                    "class_uid": 6001,
                    "category_name": "Application Activity",
                    "activity_name": "Unparsed System Event",
                    "status_detail": "Unparsed fallback preserved losslessly",
                    "unmapped": {"raw_line": raw_line}
                }
                envelope = LineageEngine.build_envelope(
                    raw_text=raw_line,
                    normalized_data=fallback_ocsf,
                    parser_id="generic-unparsed-fallback",
                    pack_version="1.0.0"
                )
                emitted_ocsf += 1
                if len(misses) < 5:
                    misses.append({
                        "line_no": idx + 1,
                        "raw_sample": raw_line[:120],
                        "reason": "No registered pack detection signature matched"
                    })

    parsed_pct = (full_parsed / total_records * 100.0) if total_records else 0.0
    partial_pct = (partial_parsed / total_records * 100.0) if total_records else 0.0
    unparsed_pct = (unparsed / total_records * 100.0) if total_records else 0.0
    emitted_pct = (emitted_ocsf / total_records * 100.0) if total_records else 0.0

    return {
        "total_records": total_records,
        "full_parsed": full_parsed,
        "partial_parsed": partial_parsed,
        "unparsed": unparsed,
        "emitted_ocsf": emitted_ocsf,
        "parsed_pct": round(parsed_pct, 2),
        "partial_pct": round(partial_pct, 2),
        "unparsed_pct": round(unparsed_pct, 2),
        "emitted_pct": round(emitted_pct, 2),
        "misses": misses
    }


def main():
    registry = SourcePackRegistry(SOURCES_DIR)
    corpora = [
        ("Loghub OpenSSH 2k", "openssh_2k.log"),
        ("Loghub Linux Syslog 2k", "linux_2k.log"),
        ("Loghub Apache Web 2k", "apache_2k.log"),
        ("Loghub Proxifier 2k", "proxifier_2k.log"),
        ("Loghub HDFS 2k", "hdfs_2k.log"),
    ]

    print("==========================================================================================================")
    print("                    AEGISGUARD-ULPF REAL-DATA COVERAGE & FIDELITY REPORT                                  ")
    print("==========================================================================================================")
    print(f"{'Corpus Name':<25} | {'Records':<8} | {'Parsed %':<9} | {'Partial %':<10} | {'Unparsed %':<11} | {'Emitted OCSF':<12}")
    print("-" * 90)

    summary = {}
    for label, fname in corpora:
        fpath = os.path.join(REALDATA_DIR, fname)
        res = process_corpus(registry, fpath)
        summary[label] = res
        print(f"{label:<25} | {res['total_records']:<8} | {res['parsed_pct']:<8}% | {res['partial_pct']:<9}% | {res['unparsed_pct']:<10}% | {res['emitted_pct']}% ({res['emitted_ocsf']})")

    print("-" * 90)
    print("\n[!] UNPARSED SAMPLE AUDIT & REASON ANALYSIS:")
    for label, res in summary.items():
        if res.get("misses"):
            print(f"\nCorpus: {label} (Total Unparsed: {res['unparsed']})")
            for m in res["misses"]:
                print(f"  Line {m['line_no']}: '{m['raw_sample']}'")
                print(f"    -> Reason: {m['reason']}")

    # Export machine-readable report
    out_json = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "docs", "data", "coverage_report.json")
    with open(out_json, "w", encoding="utf-8") as out_f:
        json.dump(summary, out_f, indent=2)
    print(f"\n[✓] Machine-readable metrics written to: {out_json}")


if __name__ == "__main__":
    main()
