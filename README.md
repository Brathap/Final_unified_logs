# ULPF — Sovereign Telemetry Framework
**National Technical Research Organisation (NTRO) · Smart India Hackathon (SIH 26156)**

[![Pytest Regression](https://img.shields.io/badge/Pytest-91%2F91%20PASS-brightgreen.svg)](tests/)
[![Official Requirements](https://img.shields.io/badge/SIH26156%20Coverage-(a)%20through%20(k)%20100%25-brightgreen.svg)](docs/SIH26156_REQUIREMENT_TRACEABILITY.md)
[![Air-Gap Audit](https://img.shields.io/badge/Air--Gap-EPERM%20Fail--Closed-success.svg)](scripts/airgap_proof.sh)
[![OCSF Pinned](https://img.shields.io/badge/OCSF-v1.1.0%20Enterprise-orange.svg)](docs/schema/OCSF_VERSION.md)
[![Merkle Proof](https://img.shields.io/badge/Merkle%20Integrity-RFC%206962%20%2B%20Ed25519-blueviolet.svg)](backend/merkle_engine.py)

---

## 5-Line Executive Summary
1. **The Problem:** Disparate perimeter security appliances emit incompatible log formats; unverified parsing mutates strings and destroys evidentiary chain-of-custody.
2. **Lossless Wire Vault:** Ingests raw telemetry, preserving exact wire bytes in Base64 alongside pre-transformation SHA-256 digests (0 records lost: all lines preserved and emitted).
3. **OCSF v1.1.0 & Byte Lineage:** Normalizes heterogeneous streams into pinned OCSF v1.1.0 schemas with character-exact `[start, end]` span coordinates directly back to the raw wire.
4. **Tamper-Evident Ledger:** Implements RFC 6962 Merkle trees with Ed25519-signed checkpoints and external head anchoring (`ulpf anchor`), independently verifiable with `verify_bundle.py`.
5. **Air-Gap Sovereign Core:** Enforces kernel-level egress socket interception (`EPERM`), 0 external cloud calls, and deterministic offline parser drafting with a mandatory human approval gate.

---

## 📊 Measured Empirical Results (Real Public Data Only)

> **Measurement Integrity Policy:** All figures below are generated directly from commands executed in this repository on real public corpora. Synthetic test devices are strictly excluded from these published figures.

### 1. Real-World Public Corpora Coverage (Loghub)
Run verification command:
```bash
python3 tools/fetch_datasets.py && python3 tools/measure_coverage.py
```

| Corpus Name | Records | Full Parsed % | Partial % | Unparsed % | Unparsed Lines Preserved | Validation Level |
|:---|:---:|:---:|:---:|:---:|:---:|:---:|
| **Loghub OpenSSH 2k** | 2,000 | **68.40%** (1,368) | **31.60%** (632) | **0.00%** (0) | **YES (2,000 / 2,000)** | Real-data validated |
| **Loghub Linux Syslog 2k** | 2,000 | **24.45%** (489) | **24.15%** (483) | **51.40%** (1,028) | **YES (2,000 / 2,000)** | Real-data validated |
| **Loghub Apache Web 2k** | 2,000 | **100.00%** (2,000) | **0.00%** (0) | **0.00%** (0) | **YES (2,000 / 2,000)** | Real-data validated |
| **Loghub Proxifier 2k** | 2,000 | **60.70%** (1,214) | **0.00%** (0) | **39.30%** (786) | **YES (2,000 / 2,000)** | Real-data validated |
| **Loghub HDFS 2k** | 2,000 | **100.00%** (2,000) | **0.00%** (0) | **0.00%** (0) | **YES (2,000 / 2,000)** | Real-data validated |
| **AGGREGATE TOTAL** | **10,000** | **70.71%** (7,071) | **11.15%** (1,115) | **18.14%** (1,814) | **YES (10,000 / 10,000)** | **0 records lost: all lines preserved and emitted** |

*Detailed per-corpus miss patterns: [`docs/DATASETS.md`](docs/DATASETS.md)*

### 2. Multi-Vendor Source Pack Validation Matrix

| Vendor / Product | Wire Format | Primary OCSF Class | Validation Level | Primary Rule File |
|:---|:---|:---|:---|:---|
| **Cisco ASA** | Syslog / Regex | Class 4001 (Network Activity) | Real-data validated | [`sources/vendors/cisco_asa.yaml`](sources/vendors/cisco_asa.yaml) |
| **ArcSight CEF Standard** | Pipe-Delimited CEF | Class 2001 (Security Finding) | Real-data validated | [`sources/vendors/cef_standard.yaml`](sources/vendors/cef_standard.yaml) |
| **Linux OpenSSH** | Syslog / Regex | Class 3002 (Identity & Access) | Real-data validated | [`sources/vendors/linux_ssh.yaml`](sources/vendors/linux_ssh.yaml) |
| **Linux Syslog / Kernel** | RFC 3164 Syslog | Class 3002 (Identity & Access) | Real-data validated | [`sources/vendors/linux_syslog.yaml`](sources/vendors/linux_syslog.yaml) |
| **Apache HTTP Server** | Error / Access Log | Class 6001 (Application Activity) | Real-data validated | [`sources/vendors/apache_http.yaml`](sources/vendors/apache_http.yaml) |
| **Initex Proxifier** | Tunnel Client Log | Class 4001 (Network Activity) | Real-data validated | [`sources/vendors/proxifier.yaml`](sources/vendors/proxifier.yaml) |
| **Apache Hadoop HDFS** | Cluster Daemon Log | Class 1001 (System Activity) | Real-data validated | [`sources/vendors/hdfs_cluster.yaml`](sources/vendors/hdfs_cluster.yaml) |
| **Fortinet FortiGate** | Key-Value Pairs | Class 4001 (Network Activity) | Documentation-derived, unproven | [`sources/vendors/fortigate_kv.yaml`](sources/vendors/fortigate_kv.yaml) |
| **Check Point Log Exporter** | Pipe Key-Value | Class 4001 (Network Activity) | Documentation-derived, unproven | [`sources/vendors/checkpoint_log_exporter.yaml`](sources/vendors/checkpoint_log_exporter.yaml) |
| **Juniper SRX Gateway** | RFC 5424 Structured | Class 4001 (Network Activity) | Documentation-derived, unproven | [`sources/vendors/juniper_srx.yaml`](sources/vendors/juniper_srx.yaml) |
| **OISF Suricata EVE** | Line JSON | Class 2001 (Security Finding) | Documentation-derived, unproven | [`sources/vendors/suricata_eve.yaml`](sources/vendors/suricata_eve.yaml) |
| **Zeek Project conn** | TSV (#fields header) | Class 4001 (Network Activity) | Documentation-derived, unproven | [`sources/vendors/zeek_conn.yaml`](sources/vendors/zeek_conn.yaml) |
| **Netgate pfSense filterlog** | CSV Delimited | Class 4001 (Network Activity) | Documentation-derived, unproven | [`sources/vendors/pfsense_filterlog.yaml`](sources/vendors/pfsense_filterlog.yaml) |
| **SonicWall SonicOS** | Key-Value Pairs | Class 4001 (Network Activity) | Documentation-derived, unproven | [`sources/vendors/sonicwall_sonicos.yaml`](sources/vendors/sonicwall_sonicos.yaml) |
| **Squid Web Proxy** | Native Access Log | Class 4001 (Network Activity) | Documentation-derived, unproven | [`sources/vendors/squid_access.yaml`](sources/vendors/squid_access.yaml) |
| **Generic LEEF Standard** | Tab Key-Value | Class 2001 (Security Finding) | Documentation-derived, unproven | [`sources/vendors/leef_standard.yaml`](sources/vendors/leef_standard.yaml) |

### 3. Unknown-Source Deterministic Onboarding (Synthetic Evaluation)
Run verification command:
```bash
python3 tools/measure_onboarding.py
```
*(Labelled synthetic: 5 fictional devices using RFC 5737 test addresses; strictly excluded from real-data corpus figures)*

| Device Name (Fictional) | Wire Format Detected | Before Drafting Coverage | After Operator Approval Gate |
|:---|:---|:---:|:---:|
| **AegisCore-KV01** | KEY_VALUE | 0% (UNPARSED) | **100% (NORMALIZED)** |
| **CyberMesh-JSON02** | JSON | 0% (UNPARSED) | **100% (NORMALIZED)** |
| **IronGate-PIPE03** | PIPE_DELIMITED | 0% (UNPARSED) | **100% (NORMALIZED)** |
| **ShadowVault-CSV04** | CSV | 0% (UNPARSED) | **100% (NORMALIZED)** |
| **VoidShield-BRACKET05** | KEY_VALUE | 0% (UNPARSED) | **PARTIAL** |

### 4. Ingestion Throughput Scaling Benchmark
Run verification command:
```bash
python3 benchmarks/benchmark_scaling.py
```
* **Hardware Testbed:** AMD PRO A4-3350B APU (4 Cores @ 2.0 GHz), 3.3 GB RAM, Linux x86_64, Python 3.14.6.
* **Workload:** Multi-vendor stream (Cisco ASA, CEF, FortiGate, Juniper SRX, pfSense).
* **Methodology:** 3 runs per worker count; isolated per-shard SQLite WAL databases & shard Merkle trees; reporting median EPS.

| Worker Processes | Events per Run | Run 1 (EPS) | Run 2 (EPS) | Run 3 (EPS) | Median Measured Throughput |
|:---:|:---:|:---:|:---:|:---:|:---:|
| **1 Worker** | 10,000 | 2,466 | 2,490 | 2,442 | **2,466 EPS** |
| **2 Workers** | 10,000 | 3,637 | 3,899 | 3,682 | **3,682 EPS** (+49.3%) |
| **4 Workers** | 10,000 | 4,601 | 4,625 | 4,704 | **4,625 EPS** (+87.5%) |
| **8 Workers** | 10,000 | 3,949 | 3,914 | 3,623 | **3,914 EPS** (CPU contention) |

*Scale Reality: 1 Billion events/day = 11,574 sustained EPS ($10^9 / 86,400\text{s}$). Single Python worker achieves ~2,466 – 4,625 EPS with full WAL writes; horizontal multi-worker scaling behind a broker is required for 1B/day sustained. Full analysis: [`docs/SCALING.md`](docs/SCALING.md).*

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
   A single Python process executing full end-to-end SQLite WAL persistence, character lineage, and cryptographic SHA-256 digests achieves ~2,466 EPS on commodity 4-core hardware (scaling to 4,625 EPS with 4 workers). Sustaining 11,574 EPS (1 Billion events/day) requires horizontal multi-worker scaling behind an L4 load balancer or partitioned broker.
2. **Software-Enforced vs Hardware WORM Immutability:**  
   ULPF enforces software append-only modes and rejects ID collisions in SQLite WAL. This provides **tamper-evident** integrity, but does not provide physical hardware write protection. True immutable write-once guarantees require optical storage (CD/DVD) or hardware S3 Object Lock.
3. **Mandatory Human Approval Gate for Generated Parsers:**  
   The Adaptive Source Intelligence engine deterministically infers delimiters and attributes with high confidence, but candidate parsers **must never be promoted automatically without human SOC operator review** to prevent adversarial parser poisoning.
4. **Documentation-Derived Fixtures:**  
   Vendor source packs for hardware not physically present in the test environment (e.g. FortiGate nanoseconds, Juniper SRX RFC5424 structured data, pfSense CSV filterlog) are tested against **documentation-derived, unproven** fixtures.

---

## ⚡ Quick Start & Verification Commands

### 1. Run Complete Automated Regression Suite (91 Tests)
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

### 4. Export External Merkle Head Anchor
```bash
python3 ulpf.py anchor --output storage/external_head_anchor.json
```

### 5. Measure Real-Data Coverage Across 10,000 Records
```bash
python3 tools/fetch_datasets.py
python3 tools/measure_coverage.py
```

### 6. Launch SOC Cyber Dashboard (Judge Interactive Mode)
```bash
./start_demo.sh
# Open http://localhost:5173 in your browser
```

---

## 🎥 Demonstration Video & Evaluation Materials
- **2-Minute Video Walkthrough**: [Demo Video Placeholder - Link to be inserted upon recording]
- **Video Timing & Script**: [`docs/DEMO_SCRIPT.md`](docs/DEMO_SCRIPT.md)
- **Grand Jury Adversarial Evaluation Guide**: [`docs/EVALUATION-GUIDE.md`](docs/EVALUATION-GUIDE.md)
- **2-Page Architecture PDF**: [`docs/ARCHITECTURE.pdf`](docs/ARCHITECTURE.pdf)
- **5-Slide Presentation Deck**: [`docs/PRESENTATION.pptx`](docs/PRESENTATION.pptx)

---

## 📁 Key Deliverables Index
- **2-Page Architecture Specification**: [`docs/ARCHITECTURE.pdf`](docs/ARCHITECTURE.pdf)
- **5-Slide Presentation Deck**: [`docs/PRESENTATION.pptx`](docs/PRESENTATION.pptx)
- **2-Minute Demo Video Script**: [`docs/DEMO_SCRIPT.md`](docs/DEMO_SCRIPT.md)
- **Air-Gapped Deployment Manual**: [`docs/AIRGAP.md`](docs/AIRGAP.md)
- **Empirical Datasets & Miss Analysis**: [`docs/DATASETS.md`](docs/DATASETS.md)
- **High-Throughput Scaling Architecture**: [`docs/SCALING.md`](docs/SCALING.md)
- **Integration Sinks & Parquet Contract**: [`docs/SINKS.md`](docs/SINKS.md)
- **Audit Ledger & Claim Rectification**: [`docs/AUDIT.md`](docs/AUDIT.md)

---

## ⚖️ License
Developed for the **Smart India Hackathon (SIH 2026)** under Problem Statement **SIH 26156**, sponsored by the **National Technical Research Organisation (NTRO)**. Licensed under the Apache License 2.0.
