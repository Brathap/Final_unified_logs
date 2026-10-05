# ULPF Baseline Architecture & Verification Audit

**Project:** Universal Log Pre-processing Framework (ULPF) — Smart India Hackathon 2026 (SIH 26156)  
**Organization:** National Technical Research Organisation (NTRO)  
**Date of Audit:** October 2026  
**Auditor:** Principal Systems & Security Architect  

---

## 1. Executive Summary

This baseline audit evaluates the existing repository against the stringent engineering requirements for competition-grade deployment. The baseline codebase contains high-quality security primitives (Verhoeff checksums, domain-separated SHA-256 Merkle trees, egress-blocking firewalls, lossless byte reconstruction).

However, to decisively win SIH 26156 with an air-gapped, platform-independent solution, the framework must be expanded beyond monolithic VRL scripts into:
1. **Declarative Source Packs** (`sources/<vendor>/<product>/<version>.yaml`) with safe hot-reloading.
2. **Deterministic Unknown Source Intelligence** (Format Fingerprinter + Drain-like Template Clustering + Explainable Field Inference) running 100% offline without cloud LLM dependencies.
3. **Parser Drift Detection & Learning Loop** with coverage degradation alerts and automated candidate patch generation.
4. **Field-Level Byte Lineage** mapping exact OCSF fields back to raw source byte offsets and tokens.
5. **Real-World Empirical Benchmarks** measuring measured EPS, latency (p50/p95/p99), CPU %, and RAM without hardcoding.
6. **Unified CLI & Offline Verification Suite** (`ulpf evaluate`, `ulpf demo`, `ulpf verify-airgap`).

---

## 2. Directory Tree & Component Baseline

```
ulpf-sih-26156/
├── backend/
│   ├── auth_middleware.py            # RBAC + API Key authentication (verified)
│   ├── certin_export.py              # CERT-In JSON export format (verified)
│   ├── drift_monitor.py              # Drift metrics tracking (rudimentary, needs expansion)
│   ├── egress_enforcement.py         # Network air-gap egress enforcement (verified)
│   ├── firehose.py / simulate_firehose.py # Log generation utilities
│   ├── ip_extractor.py               # Robust IPv4/IPv6 dissection (verified)
│   ├── main.py                       # FastAPI entrypoint, SSE streaming, endpoints
│   ├── merkle_engine.py              # Cryptographic Merkle Tree verification (verified)
│   ├── pii_redactor.py               # Verhoeff Aadhaar, PAN, phone redaction (verified)
│   ├── reconstruction_verifier.py    # Byte-exact raw reconstruction verification (verified)
│   ├── replay_corpus.py              # Benchmark corpus replay
│   ├── storage_engine.py             # SQLite WAL + JSONL archival (verified)
│   ├── threat_intel_manager.py       # Signed offline threat intel manager (verified)
│   └── threat_intel.csv              # Initial threat intelligence IOCs
├── frontend/                         # React + Vite + Tailwind SOC Dashboard
│   ├── src/components/               # High-contrast UI, Live stream, Merkle explorer
│   └── src/App.tsx                   # Main dashboard application
├── vector/
│   ├── vector.yaml                   # Baseline Vector remap configuration
│   └── *.vrl                         # Specialized VRL scripts (Palo Alto, Juniper)
├── tests/
│   ├── test_merkle_tree.py           # 5 tests (PASSED)
│   ├── test_merkle_api.py            # 1 test (PASSED)
│   ├── test_pii_coverage.py          # 9 tests (PASSED)
│   ├── test_ip_extraction.py         # 8 tests (PASSED)
│   ├── test_egress_enforcement.py    # 6 tests (PASSED)
│   ├── test_reconstruction.py        # 4 tests (PASSED)
│   ├── test_storage_architecture.py  # 5 tests (PASSED)
│   ├── test_threat_intel_update.py   # 4 tests (PASSED)
│   ├── test_deep_resilience.py       # 4 tests (PASSED)
│   ├── test_onboarding_consensus.py  # 3 tests (PASSED)
│   ├── test_certin_export.py         # 6 tests (PASSED)
│   └── test_ulpf_suite.py            # 8 tests (PASSED)
└── docs/
    └── EVALUATION-GUIDE.md           # Baseline manual guide
```

---

## 3. Test Verification & Baseline Results

- **Command:** `pytest tests/ -v`
- **Result:** **63 passed, 0 failed in 15.79s**
- **Core Tested Capabilities:**
  - Lossless wire data preservation (SHA-256 + base64 encoding).
  - Verhoeff algorithm validation defeating false positives and zero-width character evasion.
  - Strict egress blocking (DNS, UDP, TCP external drops while allowing loopback).
  - Merkle domain separation (`0x00` leaf, `0x01` interior nodes).
  - Storage concurrency, SQLite WAL performance, and JSONL rotation.
  - Reconstruction verification (byte-for-byte exactness check).

---

## 4. Feature Gap Analysis (Current vs NTRO Competition Standard)

| Feature Area | Current State | Required SIH 26156 Upgraded State | Priority |
| :--- | :--- | :--- | :--- |
| **OCSF Schema Standard** | Hardcoded version strings (`"1.1.0"` in dictionaries) | Strict pinned OCSF v1.1.0 schema validator (`docs/schema/OCSF_VERSION.md` & Pydantic models) | High |
| **Source Packs** | Monolithic VRL transform in `vector.yaml` + static `.vrl` files | Declarative YAML source packs (`sources/<vendor>/<product>/<version>.yaml`), schema-validated with safe atomic hot reload | Critical |
| **Unknown Source Intelligence** | LLM prompt or naive heuristic regex fallback | Deterministic Offline Engine: Format Fingerprinter (CEF, Syslog RFC 5424/3164, JSON, CSV, KV), Drain-like token clustering, explainable field inference | Critical |
| **Parser Drift Engine** | Rudimentary missing-field counts in `drift_monitor.py` | Full coverage baseline vs sliding-window comparison, structural diffing, candidate rule proposal, quarantine routing | Critical |
| **Field Lineage** | Coarse-grained payload-level SHA-256 | Granular field-level lineage linking OCSF normalized attributes to exact byte spans (`[start_byte, end_byte]`) and raw tokens | High |
| **Tamper Detection** | Merkle verification endpoint present | Automated adversarial test simulating raw log mutation & proving Merkle tree root mismatch | High |
| **Benchmarks** | Synthesized firehose demo scripts | Real measurable benchmark suite (`benchmarks/benchmark_end_to_end.py`), throughput, p50/p95/p99 latency, RAM/CPU profiling | High |
| **CLI & Air-gap Verification** | Multiple ad-hoc python scripts | Unified `ulpf` CLI tool (`ulpf evaluate`, `ulpf demo`, `ulpf analyze`, `ulpf verify-airgap`) | High |

---

## 5. Upgrade Architecture Roadmap

1. **Phase 1 — Schema Pinning & Field Lineage Engine:**
   - Establish `docs/schema/OCSF_VERSION.md` (OCSF v1.1.0 specification).
   - Add deterministic byte-level lineage tracking (`backend/lineage_engine.py`).
2. **Phase 2 — Declarative Source Pack Registry:**
   - Define source pack YAML schema (`sources/schema.yaml`).
   - Implement source pack loader & atomic runtime registry (`backend/source_packs/`).
   - Build packs for Cisco ASA, Palo Alto, Linux Auth, Juniper SRX, Windows Event XML/JSON, Suricata/Snort.
3. **Phase 3 — Deterministic Unknown Source Intelligence Engine:**
   - Build `backend/unknown_engine/`:
     - `fingerprinter.py`: format classification (RFC5424, RFC3164, CEF, LEEF, JSON, KV, CSV, unstructured).
     - `clusterer.py`: Drain-like tokenization and template extraction.
     - `field_inferencer.py`: deterministic regex & dictionary-backed semantic tagging (IP, MAC, Timestamp, User, Action, Port, Status) with confidence score & explanation.
     - `proposal_generator.py`: automated YAML source pack draft generator.
4. **Phase 4 — Parser Drift Detection & Resilient Routing:**
   - Upgrade `backend/drift_monitor.py` into a drift analytics and alerting engine with baseline tracking.
   - Implement auto-remedy candidate generation and quarantine tagging.
5. **Phase 5 — Tamper Detection & Merkle Stress:**
   - Add `tests/test_tamper_detection.py` explicitly modifying byte-level archival records and asserting Merkle root rejection.
6. **Phase 6 — Realistic End-to-End Benchmarks:**
   - Create `benchmarks/benchmark_end_to_end.py` generating reproducible throughput, latency, and memory profiling.
   - Generate `docs/BENCHMARKS.md` with true empirical numbers.
7. **Phase 7 — Air-Gap Verification & Unified CLI:**
   - Build `scripts/verify_airgap.py` (system socket audit, outbound probe verification, offline assertion).
   - Build CLI (`ulpf.py` / `python -m ulpf`).
8. **Phase 8 — Verification & One-Command System Check:**
   - Build `scripts/check_all.py` validating the entire stack in one command.
