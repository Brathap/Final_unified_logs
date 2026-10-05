# Universal Log Pre-processing Framework (ULPF) — SIH 26156
**National Technical Research Organisation (NTRO) · Sovereign Air-Gapped Cyber Security Telemetry Infrastructure**

[![Release](https://img.shields.io/badge/Release-ulpf--enterprise--final-blue.svg)](https://github.com)
[![Self-Assessed Traceability](https://img.shields.io/badge/SIH26156%20Traceability-15%2F15%20Self--Assessed-brightgreen.svg)](docs/SIH26156_REQUIREMENT_TRACEABILITY.md)
[![Regression Tests](https://img.shields.io/badge/Pytest-74%2F74%20PASS-brightgreen.svg)](tests/)
[![Air-Gap Audit](https://img.shields.io/badge/Air--Gap-100%25%20Fail--Closed%20(EPERM)-success.svg)](scripts/verify_airgap.py)
[![OCSF Standard](https://img.shields.io/badge/OCSF-v1.1.0%20Compliant-orange.svg)](docs/schema/OCSF_VERSION.md)
[![Merkle Proof](https://img.shields.io/badge/Merkle%20Integrity-RFC%206962-blueviolet.svg)](backend/merkle_engine.py)

ULPF is a vendor-agnostic, privacy-preserving, and sovereign air-gapped log ingestion, normalization, cryptographic verification, and threat correlation platform. Engineered for National Security Operations Centers (SOC) and critical information infrastructures (CII), ULPF transforms messy, multi-vendor security telemetry into strictly validated **OCSF v1.1.0** records with **bit-exact wire-byte lineage** and **RFC 6962 cryptographic proof-of-custody**.

---

## ⚠️ Known Operational Limitations & Scope (Honest Engineering Boundaries)

We believe that systems claiming zero limitations in production security telemetry are unproven. The following operational boundaries are empirically documented:

1. **Single-Worker Throughput Ceiling:**
   - On a commodity 4-core machine, end-to-end Python pipeline throughput (including JSONL persistence, SHA-256 wire hashing, regex parsing, OCSF mapping, character offset lineage calculation, and SQLite WAL updates) sustains **~4,200 – 4,700 EPS**.
   - While pure regex parsing exceeds **100,000 EPS**, workloads exceeding 10,000 EPS with full database persistence require horizontal scaling across multiple stateless ULPF worker processes behind an L4 UDP/TCP load balancer.
2. **Structural Schema Limits (Polymorphic XML):**
   - ULPF handles Syslog, CEF, Key-Value pairs, single-line JSON, Apache/Nginx, and Linux auth logs out of the box.
   - Deeply nested, polymorphic XML with arbitrary namespaces is **not** parsed automatically without initial delimiter markers.
3. **Hardware-Level WORM Assumption:**
   - Log immutability is enforced at the software layer (`append-only mode`, collision-rejecting SQLite WAL, and RFC 6962 Merkle trees).
   - If root-level host OS malware directly overwrites raw disk sectors, ULPF mathematically **detects** the tampering on proof verification, but true non-erasable write protection requires physical optical media or hardware-level S3 Object Lock.
4. **Human-in-the-Loop Gate on Unfamiliar Grammars:**
   - While the Adaptive Intelligence engine clusters unknown logs and proposes candidate Source Packs with 75%–95% field confidence, we explicitly require **human SOC operator signoff** before hot-reloading candidate parsers into mission-critical pipelines.

*Full details: [`docs/FINAL_LIMITATIONS.md`](file:///home/Brathap/ulpf-sih-26156/docs/FINAL_LIMITATIONS.md) & [`docs/PRODUCTION_CONTRACT.md`](file:///home/Brathap/ulpf-sih-26156/docs/PRODUCTION_CONTRACT.md)*

---

## 🛠️ Real Bugs Caught & Fixed via Adversarial Testing

Rather than concealing failure modes, ULPF was subjected to aggressive adversarial self-testing. Key issues discovered and resolved include:

- **Aadhaar False-Positive Redaction:** Naive 12-digit regex scrubbed 12-digit timestamps (`172734567890`) and internal database order IDs. Replaced with full **Verhoeff $D_5$ dihedral group** algorithmic checksum validation (`backend/pii_redactor.py`).
- **ReDoS Catastrophic Backtracking:** Malicious user-supplied candidate regexes with nested quantifiers (`(a+)+$`, `(a*)*$`) froze worker threads. Added pre-compilation ReDoS static heuristics in `SourcePackLifecycleManager.audit_regex_safety()`.
- **Worker Queue Flush Lag on `SIGTERM`:** Ingestion thread queue could fail to drain up to 100ms of uncommitted WAL records on abrupt process termination. Implemented synchronous graceful draining in `@app.on_event("shutdown")`.
- **RFC 6962 Odd-Leaf Promotion:** Early Merkle prototype duplicated odd leaves (Bitcoin style) instead of promoting them to the next level (RFC 6962 Certificate Transparency style), risking second-preimage collision. Corrected in `backend/merkle_engine.py`.

*Full post-mortem report: [`docs/BUGS_AND_FIXES.md`](file:///home/Brathap/ulpf-sih-26156/docs/BUGS_AND_FIXES.md)*

---

## 🕵️ Skeptical Evaluator's Guide (How to Try to "Catch Us Out")

For evaluators, technical judges, and red-team auditors with a terminal:  
👉 **[Read the Full Adversarial Evaluation Guide (`docs/EVALUATION-GUIDE.md`)](file:///home/Brathap/ulpf-sih-26156/docs/EVALUATION-GUIDE.md)**

Six concrete ways to attempt to break the system:
1. **Air-Gap Socket Egress Attack:** `python3 scripts/verify_airgap.py` (Probes 4 external sockets; confirms fail-closed `EPERM`).
2. **Cryptographic Collision Attack:** `python3 -m pytest tests/test_storage_architecture.py -k "collision"` (Verifies duplicate ID rejection).
3. **Merkle Inclusion Proof Tamper Test:** Tamper a single byte in a leaf; confirm mathematical rejection by `RFC6962MerkleTree`.
4. **Verhoeff PII False-Positive Test:** Pass a valid Aadhaar alongside a 12-digit timestamp; verify only the Aadhaar is masked.
5. **ReDoS Catastrophic Backtracking Test:** Inject nested quantifiers; verify rejection with `SourcePackSecurityError`.
6. **Byte-Level Lineage & Parity Gate:** `python3 -m pytest tests/test_reconstruction.py -v` (Fails any parser that alters wire bytes).

---

## 🌟 SIH26156 Requirement Traceability (15/15 Self-Assessed)

| SIH Requirement | Self-Assessed Implementation & Verification | Primary Codebase Reference |
|---|---|---|
| **a) Lossless raw event preservation** | Unmodified wire bytes preserved in Base64 alongside deterministic SHA-256 wire digest prior to any transformation. | [`backend/main.py`](file:///home/Brathap/ulpf-sih-26156/backend/main.py), [`storage/lossless_archive.jsonl`](file:///home/Brathap/ulpf-sih-26156/storage/lossless_archive.jsonl) |
| **b) Extract & parse source attributes** | High-velocity deterministic parsers and Vector Remap Language (VRL) definitions for Cisco ASA, Palo Alto PAN-OS, Linux SSHD/UFW, Imperva WAF CEF, Windows Events. | [`vector/vector.yaml`](file:///home/Brathap/ulpf-sih-26156/vector/vector.yaml), [`backend/source_packs/`](file:///home/Brathap/ulpf-sih-26156/backend/source_packs/) |
| **c) Normalize into common taxonomy** | Standardized Open Cybersecurity Schema Framework (**OCSF v1.1.0**) Class 4001 (Network Activity), Class 3002 (IAM), Class 2001 (Security Finding). | [`backend/ocsf_validator.py`](file:///home/Brathap/ulpf-sih-26156/backend/ocsf_validator.py), [`frontend/src/types.ts`](file:///home/Brathap/ulpf-sih-26156/frontend/src/types.ts) |
| **d) Field-level lineage & traceability** | Exact character byte span pointers (`[start, end]`) linking each normalized OCSF attribute directly back to the original wire message. | [`backend/lineage_tracker.py`](file:///home/Brathap/ulpf-sih-26156/backend/lineage_tracker.py), [`frontend/src/components/LogDrawer.tsx`](file:///home/Brathap/ulpf-sih-26156/frontend/src/components/LogDrawer.tsx) |
| **e) Plug-and-play onboarding** | Adaptive Source Intelligence: structural grammar extraction, delimiter entropy analysis, zero-shot candidate pack generation, and hot-swappable promotion. | [`backend/intelligence_engine.py`](file:///home/Brathap/ulpf-sih-26156/backend/intelligence_engine.py), [`frontend/src/components/AiMapper.tsx`](file:///home/Brathap/ulpf-sih-26156/frontend/src/components/AiMapper.tsx) |
| **f) Unified enterprise visibility** | Live SOC Cyber Dashboard featuring ingestion velocity graphs, real-time threat attribution radar, category doughnuts, and forensic audit trail. | [`frontend/src/components/LiveStream.tsx`](file:///home/Brathap/ulpf-sih-26156/frontend/src/components/LiveStream.tsx), [`frontend/src/components/TelemetryMetrics.tsx`](file:///home/Brathap/ulpf-sih-26156/frontend/src/components/TelemetryMetrics.tsx) |
| **g) SIEM & Data Lake integration** | Stream endpoints, Server-Sent Events (`/api/stream`), CERT-In 6-hour JSON export, and analytical SQLite WAL storage. | [`backend/main.py`](file:///home/Brathap/ulpf-sih-26156/backend/main.py), [`storage/ulpf_analytics.db`](file:///home/Brathap/ulpf-sih-26156/storage/ulpf_analytics.db) |
| **h) AI/ML-ready analytics** | Clean, typed OCSF schema records enriched with offline threat intelligence (APT29, Lazarus, Volt Typhoon, Sandworm, LockBit). | [`backend/threat_intel.csv`](file:///home/Brathap/ulpf-sih-26156/backend/threat_intel.csv), [`backend/threat_intel_manager.py`](file:///home/Brathap/ulpf-sih-26156/backend/threat_intel_manager.py) |
| **i) Reduced parser development effort** | Self-healing Drift Detection Engine flags schema drift and autonomously compiles candidate Source Packs and VRL scripts. | [`backend/drift_engine.py`](file:///home/Brathap/ulpf-sih-26156/backend/drift_engine.py), [`backend/source_pack_registry.py`](file:///home/Brathap/ulpf-sih-26156/backend/source_pack_registry.py) |
| **j) Air-gapped network deployable** | Strict kernel-level socket egress blocking (`EPERM`), 0 outbound cloud/telemetry calls, local offline threat feeds, and offline asset bundling. | [`scripts/verify_airgap.py`](file:///home/Brathap/ulpf-sih-26156/scripts/verify_airgap.py), [`frontend/src/components/AirGapProvenance.tsx`](file:///home/Brathap/ulpf-sih-26156/frontend/src/components/AirGapProvenance.tsx) |
| **k) Container packaged** | Multi-stage Dockerfile and Docker Compose orchestration with isolated internal network bridges. | [`Dockerfile`](file:///home/Brathap/ulpf-sih-26156/Dockerfile), [`docker-compose.yml`](file:///home/Brathap/ulpf-sih-26156/docker-compose.yml) |
| **l) Forensic audit & non-repudiation** | RFC 6962 Cryptographic Merkle Trees with domain-separated hashing (`0x00`/`0x01`), logarithmic inclusion proofs (`/api/merkle/proof/{id}`), and ZIP forensic bundles. | [`backend/merkle_engine.py`](file:///home/Brathap/ulpf-sih-26156/backend/merkle_engine.py), [`backend/forensic_bundle.py`](file:///home/Brathap/ulpf-sih-26156/backend/forensic_bundle.py) |
| **m) Indian statutory compliance** | Verhoeff-checksum Aadhaar scrubber, Income Tax PAN validator, Indian mobile & Luhn IMEI redaction with CERT-In 6-hour incident report formatting. | [`backend/pii_scrubber.py`](file:///home/Brathap/ulpf-sih-26156/backend/pii_scrubber.py), [`backend/certin_exporter.py`](file:///home/Brathap/ulpf-sih-26156/backend/certin_exporter.py) |
| **n) Zero-downtime hot reload & rollback** | Versioned Source Pack registry supporting instant atomic activation, canary validation, and single-click zero-downtime rollback. | [`backend/source_pack_registry.py`](file:///home/Brathap/ulpf-sih-26156/backend/source_pack_registry.py) |
| **o) Quarantine & backpressure safety** | Malformed payloads routed to persistent SQLite quarantine storage (`storage/quarantine.db`) with retry/replay tooling; fixed memory ring-buffer under load. | [`backend/quarantine_manager.py`](file:///home/Brathap/ulpf-sih-26156/backend/quarantine_manager.py) |

---

## ⚡ Benchmark Methodology & Hardware Testbed

All performance figures are reproducible on commodity hardware via `python3 benchmarks/benchmark_end_to_end.py`.

* **Hardware Testbed:** AMD PRO A4-3350B (4 Cores @ 2.0 GHz), 3.3 GB RAM, Linux x86_64, Python 3.14.6.
* **Workload:** Mixed stream of genuine Cisco ASA, ArcSight CEF, Linux SSHD, and Imperva WAF logs.

| Workload / Mode | Ingestion Rate | Latency (p50 / p95 / p99) | Peak RAM (RSS) | Verification Details |
|---|---|---|---|---|
| **Streaming Pipeline (Quiet Machine)** | **11,030 EPS** | 85 µs / 108 µs / 128 µs | 25.2 MB | 25,000 events: In-memory routing, OCSF mapping, character offset lineage, and batch Merkle checkpoint. |
| **Full Persistence (Loaded Machine)** | **4,493 – 4,686 EPS** | 203 µs / 259 µs / 323 µs | 24.1 MB | 10,000 events: Full disk persistence, SQLite WAL commits, and raw JSONL append. |
| **Pure Regular Expression Parsing** | **> 100,000 EPS** | < 10 µs | N/A | In-memory tokenization and regex matching without I/O. |
| **RFC 6962 Merkle Checkpoint** | **9 – 20 ms** | N/A | N/A | 1,000 leaves: computing leaf hashes (`0x00`) and interior nodes (`0x01`). |

*Detailed methodology, variance profile, and run commands: [`docs/BENCHMARKS.md`](file:///home/Brathap/ulpf-sih-26156/docs/BENCHMARKS.md)*

---

## 🚀 Quick Start (One Command)

### Prerequisites
- **Python 3.10+** (tested up to Python 3.14)
- **Node.js 18+ & npm**

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
- 📡 **Syslog UDP Ingestion Port**: `127.0.0.1:514` / `5140`
- 🛡️ **Air-Gap Verification Check**: `GET /api/airgap/status`
- 🌳 **Merkle Inclusion Proof**: `GET /api/merkle/proof/{event_id}`
- 📦 **Forensic ZIP Bundle Export**: `GET /api/forensic/bundle`
- 📋 **CERT-In 6-Hour Export**: `GET /api/compliance/certin`

---

## 🧪 Automated Regression & Production Readiness

Execute the one-command production readiness suite to reproduce all 7 validation gates:

```bash
./scripts/production_readiness.sh
```

- **Air-Gap Verification** (`scripts/verify_airgap.py`): Confirms fail-closed `EPERM` on 4 outbound socket probes.
- **Requirement Evaluation** (`evaluate.py`): Validates 15 core criteria.
- **Regression Suite** (`pytest -v`): **74/74 unit and integration tests passing**.
- **Empirical Streaming Benchmark**: Ingests 10,000 live events and writes metrics to `docs/BENCHMARKS.md`.
- **Frontend Production Build**: Strict TypeScript compilation and Vite production bundle.

---

## 📚 Technical Documentation & Deep Dives

- **Adversarial Evaluation Guide**: [`docs/EVALUATION-GUIDE.md`](file:///home/Brathap/ulpf-sih-26156/docs/EVALUATION-GUIDE.md)
- **Bugs Caught & Fixes Applied**: [`docs/BUGS_AND_FIXES.md`](file:///home/Brathap/ulpf-sih-26156/docs/BUGS_AND_FIXES.md)
- **Benchmark Methodology & Hardware Spec**: [`docs/BENCHMARKS.md`](file:///home/Brathap/ulpf-sih-26156/docs/BENCHMARKS.md)
- **Known Operational Limitations**: [`docs/FINAL_LIMITATIONS.md`](file:///home/Brathap/ulpf-sih-26156/docs/FINAL_LIMITATIONS.md)
- **Production Operational Contract**: [`docs/PRODUCTION_CONTRACT.md`](file:///home/Brathap/ulpf-sih-26156/docs/PRODUCTION_CONTRACT.md)
- **Competitive War Room & Analysis**: [`docs/FINAL_COMPETITIVE_WAR_ROOM.md`](file:///home/Brathap/ulpf-sih-26156/docs/FINAL_COMPETITIVE_WAR_ROOM.md)
- **SRE Operations Runbook**: [`docs/PRODUCTION_OPERATIONS_RUNBOOK.md`](file:///home/Brathap/ulpf-sih-26156/docs/PRODUCTION_OPERATIONS_RUNBOOK.md)
- **Red Team Scorecard**: [`reports/RED_TEAM_SCORECARD.md`](file:///home/Brathap/ulpf-sih-26156/reports/RED_TEAM_SCORECARD.md)
- **OCSF v1.1.0 Taxonomy Mapping**: [`docs/schema/OCSF_VERSION.md`](file:///home/Brathap/ulpf-sih-26156/docs/schema/OCSF_VERSION.md)

---

## ⚖️ License & Intellectual Property

Developed for the **Smart India Hackathon (SIH 2026)** under Problem Statement **SIH26156**, sponsored by the **National Technical Research Organisation (NTRO)**.  
Licensed under the Apache License 2.0.
