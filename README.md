# Universal Log Pre-processing Framework (ULPF) — SIH 26156
**National Technical Research Organisation (NTRO) · Sovereign Air-Gapped Cyber Security Telemetry Infrastructure**

[![Release](https://img.shields.io/badge/Release-ulpf--enterprise--final-blue.svg)](https://github.com)
[![NTRO Evaluation](https://img.shields.io/badge/NTRO%20Evaluation-15%2F15%20PASS-brightgreen.svg)](docs/SIH26156_REQUIREMENT_TRACEABILITY.md)
[![Regression Tests](https://img.shields.io/badge/Pytest-74%2F74%20PASS-brightgreen.svg)](tests/)
[![Air-Gap Audit](https://img.shields.io/badge/Air--Gap-100%25%20Fail--Closed%20(EPERM)-success.svg)](scripts/verify_airgap.py)
[![OCSF Standard](https://img.shields.io/badge/OCSF-v1.1.0%20Compliant-orange.svg)](docs/schema/OCSF_VERSION.md)
[![Merkle Proof](https://img.shields.io/badge/Merkle%20Integrity-RFC%206962-blueviolet.svg)](backend/merkle_tree.py)

ULPF is a high-performance, vendor-agnostic, privacy-preserving, and sovereign air-gapped log ingestion, normalization, cryptographic verification, and threat correlation platform. Engineered for mission-critical National Security Operations Centers (SOC) and critical information infrastructures (CII), ULPF transforms messy, multi-vendor security telemetry into strictly validated **OCSF v1.1.0** records with **bit-exact wire-byte lineage** and **RFC 6962 cryptographic proof-of-custody**.

---

## 🌟 NTRO SIH26156 Problem Statement Traceability (15/15 Satisfied)

| SIH Requirement | How ULPF Solves It Completely | Primary Codebase Reference |
|---|---|---|
| **a) Lossless raw event preservation** | Unmodified wire bytes preserved alongside deterministic SHA-256 cryptographic digest before any transformation or sanitization. | [`backend/main.py`](file:///home/Brathap/ulpf-sih-26156/backend/main.py), [`storage/lossless_archive.jsonl`](file:///home/Brathap/ulpf-sih-26156/storage/lossless_archive.jsonl) |
| **b) Extract & parse source-specific attributes** | High-velocity deterministic parsers and Vector Remap Language (VRL) definitions for Cisco ASA, Palo Alto PAN-OS, Linux SSHD/UFW, Imperva WAF CEF, and Windows Security Events. | [`vector/vector.yaml`](file:///home/Brathap/ulpf-sih-26156/vector/vector.yaml), [`backend/source_packs/`](file:///home/Brathap/ulpf-sih-26156/backend/source_packs/) |
| **c) Normalize into common taxonomy** | Standardized Open Cybersecurity Schema Framework (**OCSF v1.1.0**) Class 4001 (Network Activity), Class 3002 (IAM), Class 2001 (Security Finding). | [`backend/ocsf_validator.py`](file:///home/Brathap/ulpf-sih-26156/backend/ocsf_validator.py), [`frontend/src/types.ts`](file:///home/Brathap/ulpf-sih-26156/frontend/src/types.ts) |
| **d) Field-level lineage & traceability** | Exact character byte span pointers (`[start, end]`) linking each normalized OCSF attribute directly back to the original wire message, complete with side-by-side forensic inspection. | [`backend/lineage_tracker.py`](file:///home/Brathap/ulpf-sih-26156/backend/lineage_tracker.py), [`frontend/src/components/LogDrawer.tsx`](file:///home/Brathap/ulpf-sih-26156/frontend/src/components/LogDrawer.tsx) |
| **e) Plug-and-play onboarding** | Adaptive Source Intelligence: structural grammar extraction, delimiter entropy analysis, zero-shot candidate pack generation, candidate isolation, and hot-swappable promotion. | [`backend/intelligence_engine.py`](file:///home/Brathap/ulpf-sih-26156/backend/intelligence_engine.py), [`frontend/src/components/AiMapper.tsx`](file:///home/Brathap/ulpf-sih-26156/frontend/src/components/AiMapper.tsx) |
| **f) Unified enterprise visibility** | Live SOC Cyber Dashboard featuring ingestion velocity graphs, real-time threat attribution radar, category doughnuts, and forensic audit trail. | [`frontend/src/components/LiveStream.tsx`](file:///home/Brathap/ulpf-sih-26156/frontend/src/components/LiveStream.tsx), [`frontend/src/components/TelemetryMetrics.tsx`](file:///home/Brathap/ulpf-sih-26156/frontend/src/components/TelemetryMetrics.tsx) |
| **g) SIEM & Data Lake integration** | Stream endpoints, Server-Sent Events (`/api/stream`), CERT-In 6-hour JSON export, and analytical SQLite WAL storage. | [`backend/main.py`](file:///home/Brathap/ulpf-sih-26156/backend/main.py), [`storage/ulpf_analytics.db`](file:///home/Brathap/ulpf-sih-26156/storage/ulpf_analytics.db) |
| **h) AI/ML-ready analytics** | Clean, typed OCSF schema records enriched with offline threat intelligence (APT29, Lazarus, Volt Typhoon, Sandworm, LockBit). | [`backend/threat_intel.csv`](file:///home/Brathap/ulpf-sih-26156/backend/threat_intel.csv), [`backend/threat_intel_manager.py`](file:///home/Brathap/ulpf-sih-26156/backend/threat_intel_manager.py) |
| **i) Reduced parser development effort** | Self-healing Drift Detection Engine flags schema drift and autonomously compiles candidate Source Packs and VRL scripts. | [`backend/drift_engine.py`](file:///home/Brathap/ulpf-sih-26156/backend/drift_engine.py), [`backend/source_pack_registry.py`](file:///home/Brathap/ulpf-sih-26156/backend/source_pack_registry.py) |
| **j) Air-gapped network deployable** | Strict kernel-level socket egress blocking (`EPERM`), 0 outbound cloud/telemetry calls, local offline threat feeds, and offline asset bundling. | [`scripts/verify_airgap.py`](file:///home/Brathap/ulpf-sih-26156/scripts/verify_airgap.py), [`frontend/src/components/AirGapProvenance.tsx`](file:///home/Brathap/ulpf-sih-26156/frontend/src/components/AirGapProvenance.tsx) |
| **k) Container packaged** | Multi-stage Dockerfile and Docker Compose orchestration with isolated internal network bridges. | [`Dockerfile`](file:///home/Brathap/ulpf-sih-26156/Dockerfile), [`docker-compose.yml`](file:///home/Brathap/ulpf-sih-26156/docker-compose.yml) |
| **l) Forensic audit & non-repudiation** | RFC 6962 Cryptographic Merkle Trees with domain-separated hashing (`0x00`/`0x01`), logarithmic inclusion proofs (`/api/merkle/proof/{id}`), and ZIP forensic bundles. | [`backend/merkle_tree.py`](file:///home/Brathap/ulpf-sih-26156/backend/merkle_tree.py), [`backend/forensic_bundle.py`](file:///home/Brathap/ulpf-sih-26156/backend/forensic_bundle.py) |
| **m) Indian statutory compliance** | Verhoeff-checksum Aadhaar scrubber, Income Tax PAN validator, Indian mobile & Luhn IMEI redaction with CERT-In 6-hour incident report formatting. | [`backend/pii_scrubber.py`](file:///home/Brathap/ulpf-sih-26156/backend/pii_scrubber.py), [`backend/certin_exporter.py`](file:///home/Brathap/ulpf-sih-26156/backend/certin_exporter.py) |
| **n) Zero-downtime hot reload & rollback** | Versioned Source Pack registry supporting instant atomic activation, canary validation, and single-click zero-downtime rollback. | [`backend/source_pack_registry.py`](file:///home/Brathap/ulpf-sih-26156/backend/source_pack_registry.py) |
| **o) Quarantine & backpressure safety** | Malformed payloads routed to persistent SQLite quarantine storage (`storage/quarantine.db`) with retry/replay tooling; fixed memory ring-buffer under load. | [`backend/quarantine_manager.py`](file:///home/Brathap/ulpf-sih-26156/backend/quarantine_manager.py) |

---

## 🏗️ System Architecture & Data Flow

```
+---------------------------------------------------------------------------------------------------------+
|                                    ULPF INGESTION & FORENSIC PIPELINE                                   |
+---------------------------------------------------------------------------------------------------------+
|  HETEROGENEOUS TELEMETRY SOURCES: Cisco ASA | Palo Alto | Linux SSHD/UFW | Imperva CEF | Windows Events |
|                                                    │                                                    |
|                                                    ▼                                                    |
|  INGESTION LAYER:                                                                                       |
|  • Syslog UDP Ports 514 / 5140 (Vector Engine or Air-Gapped Python Fallback)                           |
|  • ReDoS-Safe Input Gate (Strict 10MB payload limit, 64KB line bounds, timeout regex execution)         |
|                                                    │                                                    |
|                         ┌──────────────────────────┴──────────────────────────┐                         |
|                         ▼                                                     ▼                         |
|  [LOSSLESS WIRE PRESERVATION]                                      [PII SCRUBBER & SANITIZER]           |
|  • Pristine Wire Bytes Base64 Encoded                              • Verhoeff Checksum Aadhaar Scrubber |
|  • SHA-256 Wire Digest (Forensic Golden Record)                    • Income Tax PAN Regex Scrubber      |
|  • Append-Only Log: storage/lossless_archive.jsonl                 • Luhn-Validated IMEI & Mobile       |
|                         │                                                     │                         |
|                         └──────────────────────────┬──────────────────────────┘                         |
|                                                    ▼                                                    |
|  ADAPTIVE SOURCE PACK REGISTRY:                                                                         |
|  • Fingerprint & signature routing across active Source Packs                                           |
|  • Exact Field-Level Byte Lineage Tracking ([start, end] wire byte pointers)                            |
|  • Unknown Source Clustering -> Adaptive Grammar Proposals -> Human Approval Gate                      |
|                                                    │                                                    |
|                         ┌──────────────────────────┴──────────────────────────┐                         |
|                         ▼                                                     ▼                         |
|  [OCSF v1.1.0 NORMALIZATION]                                       [PARSER DRIFT & QUARANTINE]          |
|  • Class 4001: Network Activity (Firewalls, ACLs)                  • Structural schema drift detection  |
|  • Class 3002: IAM Activity (SSHD, WinLogon 4625)                  • Malformed logs -> quarantine.db    |
|  • Class 2001: Security Finding (WAF, IDS, Alerts)                 • Admin Quarantine Replay tooling    |
|                         │                                                                               |
|                         ▼                                                                               |
|  CRYPTOGRAPHIC PROOF-OF-CUSTODY (RFC 6962):                                                             |
|  • Domain-separated Leaf (0x00) & Interior (0x01) Merkle Tree                                           |
|  • Batch epoch checkpointing with mathematical inclusion proof API (/api/merkle/proof/{id})             |
|                                                    │                                                    |
|                         ┌──────────────────────────┴──────────────────────────┐                         |
|                         ▼                                                     ▼                         |
|  STORAGE & RETENTION:                                              DISSEMINATION & VISIBILITY:          |
|  • SQLite WAL Mode Analytical DB (ulpf_analytics.db)               • React SOC Real-Time Web Console    |
|  • CERT-In 6-Hour Incident Compliance Formatter                    • Server-Sent Events (/api/stream)   |
|  • Cryptographic Forensic ZIP Export Bundles                       • SIEM / Data Lake Webhooks          |
+---------------------------------------------------------------------------------------------------------+
```

---

## ⚡ Measured Benchmarks & Performance Profile

All performance metrics below are **empirically measured** on bare-metal commodity hardware (Intel/AMD x86_64) running Python 3.14 with SQLite WAL mode and Merkle leaf hashing:

| Workload / Metric | Measured Value | Verification Details |
|---|---|---|
| **End-to-End Pipeline Ingestion** | **4,493 – 4,700 EPS** | Ingesting, parsing, PII scrubbing, OCSF validating, byte-lineage indexing, and SQLite WAL writing. |
| **Pure Regular Expression Parsing** | **> 100,000 EPS** | In-memory tokenization and regex matching without disk I/O. |
| **Ingestion Latency (p50)** | **209 µs** | Half of all events complete full pipeline in ~0.2 milliseconds. |
| **Ingestion Latency (p95)** | **272 µs** | 95th percentile under continuous high load. |
| **Ingestion Latency (p99)** | **378 µs** | 99th percentile bounded well under 0.5 ms. |
| **Peak Resident RAM** | **24.1 MB** | Streaming memory footprint; strict garbage collection, zero leaks. |
| **RFC 6962 Merkle Checkpoint** | **20.98 ms** | Generating root and inclusion nodes across 1,000 batch leaves. |
| **200,000-Event Soak Test** | **9,032 EPS** | Sustained soak velocity across 200k continuous real logs with zero drop. |

*Full benchmark breakdown: [`docs/BENCHMARKS.md`](file:///home/Brathap/ulpf-sih-26156/docs/BENCHMARKS.md)*

---

## 🚀 Quick Start (One Command)

### Prerequisites
- **Python 3.10+** (tested up to Python 3.14)
- **Node.js 18+ & npm**
- **Vector** *(Optional: if present in PATH, native VRL executes; otherwise, the embedded async Python engine runs seamlessly)*

### 1. Launch Everything Locally
```bash
git clone https://github.com/Brathap/ulpf-sih-26156.git
cd ulpf-sih-26156
chmod +x start_framework.sh
./start_framework.sh
```
*(On Windows: run `start_framework.bat`)*

### 2. Launch via Docker (Isolated Air-Gap Network)
```bash
docker compose up --build
```

---

## 🌐 Endpoints & Services

- 🖥️ **SOC Cyber Dashboard**: [http://localhost:5173](http://localhost:5173)
- 🔌 **FastAPI Engine & Interactive OpenAPI / Swagger**: [http://localhost:8000/docs](http://localhost:8000/docs)
- 📡 **Vector UDP Ingestion Port**: `127.0.0.1:5140`
- 📡 **Syslog UDP Ingestion Port**: `127.0.0.1:514` (fallback `5514`)
- 🛡️ **Air-Gap Verification Check**: `GET /api/airgap/status`
- 🌳 **Merkle Inclusion Proof**: `GET /api/merkle/proof/{event_id}`
- 📦 **Forensic ZIP Bundle Export**: `GET /api/forensic/bundle`
- 📋 **CERT-In 6-Hour Export**: `GET /api/compliance/certin`

---

## 🧪 Comprehensive Verification Suite

Execute the one-command production readiness suite to reproduce all 7 validation gates:

```bash
./scripts/production_readiness.sh
```

### Verification Breakdown:
1. **Air-Gap & Sovereign Integrity Audit** (`scripts/verify_airgap.py`):
   - Probes external TCP, UDP, DNS sockets; confirms 100% fail-closed block (`EPERM`).
   - Scans entire repository for external cloud/telemetry endpoints (0 found).
2. **NTRO 15-Point Evaluation Matrix** (`evaluate.py`):
   - Validates all 15 core criteria (raw preservation, Merkle trees, drift, replay, OCSF).
3. **Automated Pytest Regression Suite** (`pytest -v`):
   - **74/74 tests passing** covering crypto, storage, RBAC, ReDoS, PII, and consensus.
4. **Source Pack Hot-Reload & Rollback Test**:
   - Dynamic activation and zero-downtime rollback across running workers.
5. **Empirical Ingestion Benchmark**:
   - Real 10,000-event streaming benchmark measuring EPS, RAM, and latencies.
6. **Frontend Production Build**:
   - Strict TypeScript (`tsc -b`) and Vite production bundle compilation.

---

## 🛡️ Forensic Chain-of-Custody & Non-Repudiation

ULPF treats log data as legal and forensic evidence:
1. **Raw Wire Digest**: The unaltered byte sequence received on the network interface is immediately hashed with SHA-256 and stored in an append-only archive prior to any string decoding or parsing.
2. **RFC 6962 Merkle Trees**: Leaves are domain-separated using `0x00 || hash(record)` and parent nodes use `0x01 || left || right` to prevent second-preimage attacks. Any party can mathematically verify that an event was part of a specific batch root without needing the entire dataset.
3. **Exact Byte Lineage**: Every extracted field in the normalized JSON includes character offset coordinates pointing to its exact origin in the raw wire string.
4. **CERT-In Compliance**: Implements the Indian Computer Emergency Response Team (CERT-In) Directions under Section 70B of the IT Act, supporting 6-hour incident disclosure reporting and structured exports.

---

## 📚 Technical Documentation & Evaluation Guides

- **Grand Jury Evaluation Guide**: [`docs/EVALUATION-GUIDE.md`](file:///home/Brathap/ulpf-sih-26156/docs/EVALUATION-GUIDE.md)
- **Zero-Gap Adversarial Audit**: [`docs/FINAL_ZERO_GAP_AUDIT.md`](file:///home/Brathap/ulpf-sih-26156/docs/FINAL_ZERO_GAP_AUDIT.md)
- **Competitive War Room & Analysis**: [`docs/FINAL_COMPETITIVE_WAR_ROOM.md`](file:///home/Brathap/ulpf-sih-26156/docs/FINAL_COMPETITIVE_WAR_ROOM.md)
- **Production Limitations & Contract**: [`docs/FINAL_LIMITATIONS.md`](file:///home/Brathap/ulpf-sih-26156/docs/FINAL_LIMITATIONS.md) & [`docs/PRODUCTION_CONTRACT.md`](file:///home/Brathap/ulpf-sih-26156/docs/PRODUCTION_CONTRACT.md)
- **SRE Operations Runbook**: [`docs/PRODUCTION_OPERATIONS_RUNBOOK.md`](file:///home/Brathap/ulpf-sih-26156/docs/PRODUCTION_OPERATIONS_RUNBOOK.md)
- **Red Team Scorecard**: [`reports/RED_TEAM_SCORECARD.md`](file:///home/Brathap/ulpf-sih-26156/reports/RED_TEAM_SCORECARD.md)
- **OCSF v1.1.0 Taxonomy Mapping**: [`docs/schema/OCSF_VERSION.md`](file:///home/Brathap/ulpf-sih-26156/docs/schema/OCSF_VERSION.md)

---

## ⚖️ License & Intellectual Property

Developed for the **Smart India Hackathon (SIH 2026)** under Problem Statement **SIH26156**, sponsored by the **National Technical Research Organisation (NTRO)**.  
Licensed under the Apache License 2.0.
