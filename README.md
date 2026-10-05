# AegisGuard-ULPF — Sovereign Log Pre-processing Framework
**National Technical Research Organisation (NTRO) · Smart India Hackathon (SIH 26156)**

[![Release](https://img.shields.io/badge/Release-AegisGuard--ULPF--v2.0-blue.svg)](https://github.com)
[![Requirement Coverage](https://img.shields.io/badge/Requirement%20Coverage-15%2F15%20Locally%20Verified-brightgreen.svg)](docs/SIH26156_REQUIREMENT_TRACEABILITY.md)
[![Regression Tests](https://img.shields.io/badge/Pytest-74%2F74%20PASS-brightgreen.svg)](tests/)
[![Air-Gap Audit](https://img.shields.io/badge/Air--Gap-EPERM%20Fail--Closed-success.svg)](scripts/verify_airgap.py)
[![OCSF Pinned](https://img.shields.io/badge/OCSF-v1.1.0%20Enterprise-orange.svg)](docs/schema/OCSF_VERSION.md)
[![Merkle Proof](https://img.shields.io/badge/Merkle%20Integrity-RFC%206962-blueviolet.svg)](backend/merkle_engine.py)

---

## 🎯 Executive Problem & Solution Summary

### The Problem (NTRO SIH26156):
National defense and critical infrastructure SOCs ingest tens of millions of perimeter logs daily across disparate hardware appliances (Cisco ASA, Palo Alto PAN-OS, Imperva WAF, Linux SSHD, Windows Events). Each vendor emits distinct schemas, date formats, and encodings. Security analysts waste 60% of their bandwidth writing brittle, ad-hoc regex parsers. Meanwhile, traditional pre-processors mutate strings in-place without maintaining cryptographic wire hashes or byte-level lineage, destroying evidentiary chain-of-custody for judicial forensics. Furthermore, cloud-dependent SaaS parsers violate national security air-gap mandates.

### The Solution (AegisGuard-ULPF):
**AegisGuard-ULPF** is an air-gappable, sovereign telemetry framework that ingests raw perimeter streams and normalizes them into strictly pinned **OCSF v1.1.0** records. It uniquely couples **lossless Base64 raw-wire preservation** and **RFC 6962 cryptographic Merkle trees** with **bit-exact character span byte lineage**, an **offline Drain token clustering engine** for unknown log onboarding, and **Indian statutory compliance** (Verhoeff Aadhaar scrubbing & CERT-In 6-hour incident disclosure export).

---

## ⚠️ Known Operational Limitations & Honest Engineering Scope

In production security telemetry, claims of "zero limitations" indicate unverified systems. We document our operational boundaries plainly:

1. **Single-Worker Line-Rate Ceiling:**
   - On a commodity 4-core machine, a single Python worker sustains **~4,200 – 4,700 EPS** when executing full end-to-end SQLite WAL persistence, JSONL append, SHA-256 calculation, OCSF mapping, and character span lineage.
   - While in-memory regex parsing exceeds **100,000 EPS**, scaling to 50k–100k+ EPS with full disk persistence requires horizontal scaling across stateless ULPF worker processes behind an L4 load balancer (see [`docs/SCALING.md`](docs/SCALING.md)).
2. **Structural Limitations on Polymorphic XML:**
   - AegisGuard-ULPF parses Syslog, CEF, Key-Value pairs, single-line JSON, Apache/Nginx, and Linux auth logs out of the box.
   - Deeply nested polymorphic XML with arbitrary dynamic namespaces requires initial structural delimiter markers.
3. **Software-Enforced vs Hardware WORM:**
   - Immutability is software-enforced (append-only file mode, collision-rejecting SQLite WAL, and RFC 6962 Merkle trees).
   - If root-level host malware directly overwrites disk blocks, AegisGuard-ULPF mathematically **detects** the tampering during proof verification, but physical write protection requires optical write-once media (CD/DVD) or hardware S3 Object Lock.
4. **Human-in-the-Loop Gate on Unfamiliar Grammars:**
   - While the Adaptive Intelligence engine clusters unknown logs and infers fields with 75%–95% confidence, we explicitly require **human SOC operator review** before promoting candidate parsers into mission-critical pipelines.

*Full details: [`docs/FINAL_LIMITATIONS.md`](docs/FINAL_LIMITATIONS.md) & [`docs/PRODUCTION_CONTRACT.md`](docs/PRODUCTION_CONTRACT.md)*

---

## 🛠️ Real Bugs Caught & Fixed via Adversarial Self-Testing

AegisGuard-ULPF was hardened through red-team adversarial evaluation. Key bugs discovered and fixed include:

- **Aadhaar False-Positive Redaction:** Generic 12-digit regexes corrupted 12-digit timestamps (`172734567890`) and internal database order IDs. Replaced with full **Verhoeff $D_5$ dihedral group** algorithmic checksum validation (`backend/pii_redactor.py`).
- **ReDoS Catastrophic Backtracking:** Malicious user-supplied candidate regexes with nested quantifiers (`(a+)+$`, `(a*)*$`) froze worker threads. Added pre-compilation ReDoS static heuristics in `SourcePackLifecycleManager.audit_regex_safety()`.
- **Worker Queue Flush Lag on `SIGTERM`:** Ingestion thread queue could fail to drain up to 100ms of uncommitted WAL records on abrupt process termination. Implemented synchronous graceful draining in `@app.on_event("shutdown")`.
- **RFC 6962 Odd-Leaf Promotion:** Early Merkle prototype duplicated odd leaves (Bitcoin style) instead of promoting them to the next level (RFC 6962 Certificate Transparency style), risking second-preimage collision. Corrected in `backend/merkle_engine.py`.

*Full engineering post-mortem: [`docs/BUGS_AND_FIXES.md`](docs/BUGS_AND_FIXES.md)*

---

## 🕵️ Skeptical Evaluator's Guide (How to "Catch Us Out")

For evaluators, technical judges, and red-team auditors with a live terminal:  
👉 **[Read the Full Adversarial Evaluation Guide (`docs/EVALUATION-GUIDE.md`)](docs/EVALUATION-GUIDE.md)**

Six concrete ways to attempt to break the system:
1. **Air-Gap Socket Egress Attack:** `python3 scripts/verify_airgap.py` (Probes 4 external sockets; confirms fail-closed `EPERM`).
2. **Cryptographic Collision Attack:** `python3 -m pytest tests/test_storage_architecture.py -k "collision"` (Verifies duplicate ID rejection).
3. **Merkle Proof Tamper Test:** `python3 ulpf.py prove --index 1` (Tamper a single byte in a leaf; confirm mathematical rejection).
4. **Verhoeff PII False-Positive Test:** Pass a valid Aadhaar alongside a 12-digit timestamp; verify only the Aadhaar is masked.
5. **ReDoS Catastrophic Backtracking Test:** Inject nested quantifiers; verify rejection with `SourcePackSecurityError`.
6. **Byte-Level Lineage & Parity Gate:** `python3 -m pytest tests/test_reconstruction.py -v` (Fails any parser that alters wire bytes).

---

## 🌟 SIH26156 Requirement Traceability (15/15 Locally Verified)

| SIH Requirement | How AegisGuard-ULPF Solves It | Primary Codebase Reference |
|---|---|---|
| **a) Lossless raw event preservation** | Unmodified wire bytes preserved in Base64 alongside deterministic SHA-256 wire digest prior to any transformation. | [`backend/main.py`](backend/main.py), [`storage/lossless_archive.jsonl`](storage/lossless_archive.jsonl) |
| **b) Extract & parse source attributes** | High-velocity deterministic parsers and Vector Remap Language (VRL) definitions for Cisco ASA, Palo Alto PAN-OS, Linux SSHD/UFW, Imperva WAF CEF, Windows Events. | [`vector/vector.yaml`](vector/vector.yaml), [`backend/source_packs/`](backend/source_packs/) |
| **c) Normalize into common taxonomy** | Standardized Open Cybersecurity Schema Framework (**OCSF v1.1.0**) Class 4001 (Network Activity), Class 3002 (IAM), Class 2001 (Security Finding). | [`backend/ocsf_validator.py`](backend/ocsf_validator.py), [`frontend/src/types.ts`](frontend/src/types.ts) |
| **d) Field-level lineage & traceability** | Exact character byte span pointers (`[start, end]`) linking each normalized OCSF attribute directly back to the original wire message. | [`backend/lineage_engine.py`](backend/lineage_engine.py), [`frontend/src/components/LogDrawer.tsx`](frontend/src/components/LogDrawer.tsx) |
| **e) Plug-and-play onboarding** | Adaptive Source Intelligence: structural grammar extraction, delimiter entropy analysis, zero-shot candidate pack generation, and hot-swappable promotion. | [`backend/unknown_engine/intelligence.py`](backend/unknown_engine/intelligence.py), [`frontend/src/components/AiMapper.tsx`](frontend/src/components/AiMapper.tsx) |
| **f) Unified enterprise visibility** | Live SOC Cyber Dashboard featuring ingestion velocity graphs, real-time threat attribution radar, category doughnuts, and forensic audit trail. | [`frontend/src/components/LiveStream.tsx`](frontend/src/components/LiveStream.tsx), [`frontend/src/components/TelemetryMetrics.tsx`](frontend/src/components/TelemetryMetrics.tsx) |
| **g) SIEM & Data Lake integration** | Stream endpoints, Server-Sent Events (`/api/stream`), CERT-In 6-hour JSON export, and analytical SQLite WAL storage. | [`backend/main.py`](backend/main.py), [`storage/ulpf_analytics.db`](storage/ulpf_analytics.db) |
| **h) AI/ML-ready analytics** | Clean, typed OCSF schema records enriched with offline threat intelligence (APT29, Lazarus, Volt Typhoon, Sandworm, LockBit). | [`backend/threat_intel.csv`](backend/threat_intel.csv), [`backend/threat_intel_manager.py`](backend/threat_intel_manager.py) |
| **i) Reduced parser development effort** | Self-healing Drift Detection Engine flags schema drift and autonomously compiles candidate Source Packs and VRL scripts. | [`backend/drift_engine.py`](backend/drift_engine.py), [`backend/source_packs/registry.py`](backend/source_packs/registry.py) |
| **j) Air-gapped network deployable** | Strict kernel-level socket egress blocking (`EPERM`), 0 outbound cloud/telemetry calls, local offline threat feeds, and offline asset bundling. | [`scripts/verify_airgap.py`](scripts/verify_airgap.py), [`frontend/src/components/AirGapProvenance.tsx`](frontend/src/components/AirGapProvenance.tsx) |
| **k) Container packaged** | Multi-stage Dockerfile and Docker Compose orchestration with isolated internal network bridges. | [`Dockerfile`](Dockerfile), [`docker-compose.yml`](docker-compose.yml) |
| **l) Forensic audit & non-repudiation** | RFC 6962 Cryptographic Merkle Trees with domain-separated hashing (`0x00`/`0x01`), logarithmic inclusion proofs (`/api/merkle/proof/{id}`), and ZIP forensic bundles. | [`backend/merkle_engine.py`](backend/merkle_engine.py), [`backend/forensic_bundle.py`](backend/forensic_bundle.py) |
| **m) Indian statutory compliance** | Verhoeff-checksum Aadhaar scrubber, Income Tax PAN validator, Indian mobile & Luhn IMEI redaction with CERT-In 6-hour incident report formatting. | [`backend/pii_redactor.py`](backend/pii_redactor.py), [`backend/certin_export.py`](backend/certin_export.py) |
| **n) Zero-downtime hot reload & rollback** | Versioned Source Pack registry supporting instant atomic activation, canary validation, and single-click zero-downtime rollback. | [`backend/source_packs/registry.py`](backend/source_packs/registry.py) |
| **o) Quarantine & backpressure safety** | Malformed payloads routed to persistent SQLite quarantine storage (`storage/quarantine.db`) with retry/replay tooling; fixed memory ring-buffer under load. | [`backend/quarantine_engine.py`](backend/quarantine_engine.py) |

---

## ⚡ Measured Benchmarks & Hardware Testbed

All performance figures are reproducible on commodity hardware via `python3 benchmarks/benchmark_end_to_end.py`.

* **Hardware Testbed:** AMD PRO A4-3350B (4 Cores @ 2.0 GHz), 3.3 GB RAM, Linux x86_64, Python 3.14.6.
* **Workload:** Mixed stream of genuine Cisco ASA, ArcSight CEF, Linux SSHD, and Imperva WAF logs.

| Workload / Mode | Ingestion Rate | Latency (p50 / p95 / p99) | Peak RAM (RSS) | Verification Details |
|---|---|---|---|---|
| **Streaming Pipeline (Quiet Machine)** | **11,030 EPS** | 85 µs / 108 µs / 128 µs | 25.2 MB | 25,000 events: In-memory routing, OCSF mapping, character offset lineage, and batch Merkle checkpoint. |
| **Full Persistence (Loaded Machine)** | **4,493 – 4,686 EPS** | 203 µs / 259 µs / 323 µs | 24.1 MB | 10,000 events: Full disk persistence, SQLite WAL commits, and raw JSONL append. |
| **Pure Regular Expression Parsing** | **> 100,000 EPS** | < 10 µs | N/A | In-memory tokenization and regex matching without I/O. |
| **RFC 6962 Merkle Checkpoint** | **9 – 20 ms** | N/A | N/A | 1,000 leaves: computing leaf hashes (`0x00`) and interior nodes (`0x01`). |

*Full methodology and variance report: [`docs/BENCHMARKS.md`](docs/BENCHMARKS.md)*

---

## 🚀 Quick Start (Judge-Friendly One Command)

### Prerequisites
- **Python 3.10+** (tested up to Python 3.14)
- **Node.js 18+ & npm**

### 1. Launch Interactive Live Demo (Recommended for Judges)
```bash
git clone https://github.com/Brathap/ulpf-sih-26156.git
cd ulpf-sih-26156
./start_demo.sh
```
*This command starts the air-gapped backend, React SOC Cyber Console, and streams multi-source telemetry simultaneously.*

### 2. Run Headless Verification Check (Automated Sanity)
```bash
./scripts/run_demo_check.sh
```
*Verifies air-gap, lossless wire preservation, character byte lineage, Merkle proof, and unknown log drafting in under 5 seconds.*

### 3. CLI Command Suite (`ulpf`)
```bash
# Ingest live syslog
python3 ulpf.py listen --port 5140

# Inspect raw preservation & wire SHA-256
python3 ulpf.py raw "CEF:0|Imperva|WAF|14.0|SQLI|9|src=1.2.3.4"

# Generate RFC 6962 Merkle proof
python3 ulpf.py prove --index 1

# Profile an unknown appliance log
python3 ulpf.py profile "2026-10-05 GW01 evt=DROP ip=1.1.1.1 proto=TCP"

# Draft candidate Source Pack
python3 ulpf.py draft --vendor NeoDefense --product Gateway "2026-10-05 GW01 evt=DROP ip=1.1.1.1"

# Run complete 74-test regression suite
python3 ulpf.py test
```

---

## 📚 Deliverables & Documentation Index

- **2-Page Architecture Specification**: [`docs/ARCHITECTURE_SHORT.md`](docs/ARCHITECTURE_SHORT.md)
- **2-Minute Demo Video Script**: [`docs/DEMO_SCRIPT.md`](docs/DEMO_SCRIPT.md)
- **5-Slide Presentation Outline**: [`docs/PRESENTATION_OUTLINE.md`](docs/PRESENTATION_OUTLINE.md)
- **Adversarial Evaluation Guide**: [`docs/EVALUATION-GUIDE.md`](docs/EVALUATION-GUIDE.md)
- **Bugs Caught & Fixes Applied**: [`docs/BUGS_AND_FIXES.md`](docs/BUGS_AND_FIXES.md)
- **Air-Gapped Deployment Manual**: [`docs/AIRGAP.md`](docs/AIRGAP.md)
- **Horizontal Scaling & Multi-Collector**: [`docs/SCALING.md`](docs/SCALING.md)
- **OCSF v1.1.0 Specification Pinning**: [`docs/schema/OCSF_VERSION.md`](docs/schema/OCSF_VERSION.md)
- **Known Operational Limitations**: [`docs/FINAL_LIMITATIONS.md`](docs/FINAL_LIMITATIONS.md)

---

## ⚖️ License & Intellectual Property

Developed for the **Smart India Hackathon (SIH 2026)** under Problem Statement **SIH 26156**, sponsored by the **National Technical Research Organisation (NTRO)**.  
Licensed under the Apache License 2.0.
