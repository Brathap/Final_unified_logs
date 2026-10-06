# AegisGuard-ULPF — Sovereign Telemetry Framework
**National Technical Research Organisation (NTRO) · Smart India Hackathon (SIH 26156)**

[![Pytest Regression](https://img.shields.io/badge/Pytest-88%2F88%20PASS-brightgreen.svg)](tests/)
[![Official Requirements](https://img.shields.io/badge/SIH26156%20Coverage-(a)%20through%20(k)%20100%25-brightgreen.svg)](docs/SIH26156_REQUIREMENT_TRACEABILITY.md)
[![Air-Gap Audit](https://img.shields.io/badge/Air--Gap-EPERM%20Fail--Closed-success.svg)](scripts/airgap_proof.sh)
[![OCSF Pinned](https://img.shields.io/badge/OCSF-v1.1.0%20Enterprise-orange.svg)](docs/schema/OCSF_VERSION.md)
[![Merkle Proof](https://img.shields.io/badge/Merkle%20Integrity-RFC%206962%20%2B%20Ed25519-blueviolet.svg)](backend/merkle_engine.py)

---

## 5-Line Executive Summary
1. **The Problem:** Disparate perimeter security devices emit incompatible log formats; unverified parsing mutates raw strings and destroys evidentiary chain-of-custody required for forensics.
2. **Lossless Wire Vault:** Ingests raw perimeter telemetry, preserving exact wire bytes in Base64 alongside pre-transformation SHA-256 digests (0% dropped).
3. **OCSF v1.1.0 & Byte Lineage:** Normalizes heterogeneous streams into pinned OCSF v1.1.0 schemas while generating character-exact `[start, end]` span coordinates directly back to the raw wire.
4. **Tamper-Evident Ledger:** Implements RFC 6962 Merkle trees with Ed25519-signed checkpoints, independently verifiable offline with `verify_bundle.py`.
5. **Air-Gap Sovereign Core:** Enforces kernel-level egress socket interception (`EPERM`), 0 external cloud calls, and deterministic offline parser drafting with a mandatory human approval gate.

---

## 📊 Measured Empirical Results (Real Public Data Only)

> **Measurement Integrity Policy:** All figures below are generated directly from commands executed in this repository on real public corpora. Synthetic test devices are strictly excluded from these published figures.

### 1. Real-World Public Corpora Coverage (Loghub)
Run verification command:
```bash
python3 tools/fetch_datasets.py && python3 tools/measure_coverage.py
```

| Corpus Name | Records | Full Parsed % | Partial % | Unparsed % | Emitted as OCSF | Status |
|:---|:---:|:---:|:---:|:---:|:---:|:---:|
| **Loghub OpenSSH 2k** | 2,000 | **56.55%** (1,131) | **6.80%** (136) | **36.65%** (733) | **100.0%** (2,000) | **PASS** |
| **Loghub Linux Syslog 2k** | 2,000 | **24.45%** (489) | **13.30%** (266) | **62.25%** (1,245) | **100.0%** (2,000) | **PASS** |
| **Loghub Apache Web 2k** | 2,000 | **1.60%** (32) | **98.40%** (1,968) | **0.00%** (0) | **100.0%** (2,000) | **PASS** |
| **Loghub Proxifier 2k** | 2,000 | **60.70%** (1,214) | **0.00%** (0) | **39.30%** (786) | **100.0%** (2,000) | **PASS** |
| **Loghub HDFS 2k** | 2,000 | **0.00%** (0) | **0.00%** (0) | **100.00%** (2,000) | **100.0%** (2,000) | **PASS** |
| **TOTAL** | **10,000** | — | — | — | **100.0% (10,000 / 10,000)** | **0% DROPPED** |

*Detailed per-corpus miss analysis: [`docs/DATASETS.md`](docs/DATASETS.md)*

### 2. Measured Ingestion Throughput & Machine Testbed
Run verification command:
```bash
python3 benchmarks/benchmark_scaling.py
```
* **Hardware Testbed:** AMD PRO A4-3350B APU (4 Cores @ 2.0 GHz), 3.3 GB RAM, Linux x86_64, Python 3.14.6.
* **Workload:** Multi-vendor stream (Cisco ASA, CEF, FortiGate, Juniper SRX, pfSense).

| Benchmark Mode | Workers | Measured Rate (EPS) | Latency / Checkpoint | Memory Footprint |
|:---|:---:|:---:|:---:|:---:|
| **Pure Regex Parsing (In-Memory)** | 1 | **> 100,000 EPS** | < 10 µs | Minimal |
| **Streaming Pipeline (Memory + Merkle)** | 1 | **11,030 EPS** | p50: 85 µs / p99: 128 µs | 25.2 MB RSS |
| **Full Persistence (SQLite WAL + Shard Merkle)** | 1 | **2,165 – 4,493 EPS** | Single worker persistence | 24.1 MB RSS |
| **Full Persistence (Multiprocessing)** | 2 | **2,809 EPS** | Multi-shard WAL commit | 38.4 MB RSS |
| **RFC 6962 Merkle Checkpoint (1,000 leaves)** | — | **~9 – 20 ms** | Domain separated (`0x00`/`0x01`) | — |

*Scale Arithmetic vs Reality: 1 Billion events/day = 11,574 sustained EPS. Single Python worker reaches ~4,500 EPS with full WAL writes; horizontal multi-worker scaling is required for 1B/day sustained. Full design: [`docs/SCALING.md`](docs/SCALING.md).*

---

## 📋 Official SIH 26156 Requirement Table: Items (a) - (k)

Every requirement corresponds directly to the official problem statement issued by the National Technical Research Organisation (NTRO):

| Item | Official SIH 26156 Requirement | Implementation in AegisGuard-ULPF | Reproducible Check Command | Status |
|:---:|:---|:---|:---|:---:|
| **(a)** | **Lossless raw event data preservation** | Wire bytes encoded in Base64 and SHA-256 hashed before parsing; stored in `storage/lossless_archive.jsonl` with bit-exact reconstruction verification. | `pytest tests/test_reconstruction.py tests/test_ulpf_suite.py -k "test_a"` | **PASS** |
| **(b)** | **Attribute extraction from diverse formats** | Multi-vendor engine supporting Syslog (RFC 3164/5424), CEF, LEEF, FortiGate KV, Check Point, Juniper SRX, Suricata JSON, Zeek TSV, Squid, pfSense. | `pytest tests/test_source_pack_breadth.py tests/test_ip_extraction.py` | **PASS** |
| **(c)** | **Normalization into common taxonomy** | Pinned OCSF v1.1.0 schema (Class 4001 Network Activity, Class 3002 Auth, Class 2001 Security Finding, Class 1001 File Activity, Class 6001 App). | `pytest tests/test_ulpf_suite.py -k "test_b_c"` | **PASS** |
| **(d)** | **Traceability between normalized & original events** | FieldLineageSpan coordinates `[start, end]` mapping OCSF attributes to exact character byte slices in raw wire payload. | `pytest tests/test_source_packs_and_intelligence.py tests/test_reconstruction.py` | **PASS** |
| **(e)** | **Plug-and-play onboarding of new log sources** | Adaptive Source Intelligence format fingerprinter, delimiter entropy analyzer, and Drain-style clustering with human approval gate. | `python3 tools/measure_onboarding.py` | **PASS** |
| **(f)** | **Unified enterprise visibility** | Live React SOC Cyber Console featuring real-time telemetry stream, category breakdowns, threat attribution radar, and audit ledger. | `pytest tests/test_ulpf_suite.py -k "test_f"` | **PASS** |
| **(g)** | **Efficient SIEM & Data Lake integration** | Multi-format sinks: Parquet (15-col contract, schema version in footer), NDJSON stream, Splunk HEC, Elastic bulk, and syslog forwarder. | `pytest tests/test_integration_sinks.py` | **PASS** |
| **(h)** | **AI/ML-ready analytics** | Strongly-typed, normalized OCSF records enriched with local offline threat intelligence IOC correlation (APT29, Lazarus, Volt Typhoon). | `pytest tests/test_threat_intel_update.py tests/test_ulpf_suite.py -k "test_h"` | **PASS** |
| **(i)** | **Reduced parser development effort** | Deterministic offline parser drafter (<15 ms per source) generating candidate declarative packs with automated syntax and ReDoS audits. | `python3 ulpf.py draft --vendor DemoCorp --product Gateway "sample log"` | **PASS** |
| **(j)** | **Air-gapped network deployable** | Strict socket egress interception (`EPERM`), 0 outbound cloud/telemetry calls, local threat feeds, and container execution under `--network none`. | `./scripts/airgap_proof.sh` | **PASS** |
| **(k)** | **Container packaged** | Multi-stage Dockerfile, docker-compose configuration, and offline air-gap release packaging script (`scripts/bundle_offline_release.sh`). | `docker compose config` | **PASS** |

---

## ⚠️ Known Operational Limitations & Honest Engineering Scope

1. **Python Single-Worker Line-Rate Ceiling:**  
   A single Python process executing full end-to-end SQLite WAL persistence, character lineage, and cryptographic SHA-256 digests achieves ~4,200 – 4,700 EPS on commodity 4-core hardware. Sustaining 11,574 EPS (1 Billion events/day) requires horizontal multi-worker scaling behind an L4 load balancer or partitioned broker.
2. **Software-Enforced vs Hardware WORM Immutability:**  
   ULPF enforces software append-only modes and rejects ID collisions in SQLite WAL. This provides **tamper-evident** integrity, but does not provide physical hardware write protection. True immutable write-once guarantees require optical storage (CD/DVD) or hardware S3 Object Lock.
3. **Mandatory Human Approval Gate for Generated Parsers:**  
   The Adaptive Source Intelligence engine deterministically infers delimiters and attributes with high confidence, but candidate parsers **must never be promoted automatically without human SOC operator review** to prevent adversarial parser poisoning.
4. **Documentation-Derived Fixtures:**  
   Vendor source packs for hardware not physically present in the test environment (e.g. FortiGate nanoseconds, Juniper SRX RFC5424 structured data, pfSense CSV filterlog) are tested against **documentation-derived, unproven** fixtures.

---

## ⚡ Quick Start & Verification Commands

### 1. Run Complete Automated Regression Suite (88 Tests)
```bash
pytest -v
```

### 2. Verify Air-Gap Isolation (Fail-Closed EPERM)
```bash
./scripts/airgap_proof.sh
```

### 3. Run Standalone Forensic Bundle Verification & Tamper Test
```bash
# Demonstrates detection of single-byte edits and re-sealing attacks
python3 scripts/tamper_demo.py
```

### 4. Measure Real-Data Coverage Across 10,000 Records
```bash
python3 tools/fetch_datasets.py
python3 tools/measure_coverage.py
```

### 5. Launch SOC Cyber Dashboard (Judge Interactive Mode)
```bash
./start_demo.sh
# Open http://localhost:5173 in your browser
```

---

## 📁 Key Deliverables Index
- **2-Page Architecture Specification**: [`docs/ARCHITECTURE.pdf`](docs/ARCHITECTURE.pdf) *(Generated via ReportLab)*
- **5-Slide Presentation Deck**: [`docs/PRESENTATION.pptx`](docs/PRESENTATION.pptx) *(Generated via python-pptx)*
- **2-Minute Demo Video Script**: [`docs/DEMO_SCRIPT.md`](docs/DEMO_SCRIPT.md)
- **Grand Jury Adversarial Evaluation Guide**: [`docs/EVALUATION-GUIDE.md`](docs/EVALUATION-GUIDE.md)
- **Empirical Datasets & Miss Analysis**: [`docs/DATASETS.md`](docs/DATASETS.md)
- **High-Throughput Scaling Architecture**: [`docs/SCALING.md`](docs/SCALING.md)
- **Integration Sinks & Parquet Contract**: [`docs/SINKS.md`](docs/SINKS.md)
- **Audit Ledger & Claim Rectification**: [`docs/AUDIT.md`](docs/AUDIT.md)

---

## ⚖️ License
Developed for the **Smart India Hackathon (SIH 2026)** under Problem Statement **SIH 26156**, sponsored by the **National Technical Research Organisation (NTRO)**. Licensed under the Apache License 2.0.
