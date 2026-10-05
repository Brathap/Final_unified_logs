# SIH 26156 — Final Baseline Snapshot

## Snapshot Metadata
- **Date & Timestamp:** 2026-10-05 05:47:51 UTC (11:17:51 IST)
- **Git Commit:** `765b931` (branch `enterprise-ui-polish`)
- **Baseline Git Tag:** `sih26156-verified-v1`
- **Environment:** Linux x86_64, Python 3.14.6, Node.js v20.x, Vite v8.3.0

---

## 1. Automated Verification Gates

| Gate / Command | Measured Output | Status |
| :--- | :--- | :--- |
| `python evaluate.py` | 15/15 Requirements Pass | **VERIFIED** |
| `pytest tests/ -v` | 69 passed, 6 warnings in 11.04s | **VERIFIED** |
| `python scripts/check_all.py` | Pytest + Air-gap + 10k Benchmark All Pass | **VERIFIED** |
| `python scripts/verify_airgap.py` | 4/4 Probes Blocked (Fail-Closed), 0 External Calls | **VERIFIED** |
| `npm --prefix frontend run build` | Clean client build in 6.07s | **VERIFIED** |
| `python ulpf.py demo` | 5-Scene Adaptive Loop Demo Completed | **DEMONSTRATED** |

---

## 2. Empirical Performance Metrics (50,000 Live Events)
- **Workload:** 50,000 real-world syslog/firewall events processed end-to-end
- **Throughput:** **9,355 Events Per Second (EPS)**
- **Total Ingestion Time:** 5.345 seconds
- **Latency p50:** 98.28 µs
- **Latency p95:** 130.15 µs
- **Latency p99:** 159.71 µs
- **Peak Latency:** 795.47 µs
- **Merkle Batch Checkpoint (1,000 leaves):** 10.63 ms
- **Peak Resident Memory (50k in-memory benchmark batch):** 489.7 MB (Single 10k streaming run: 22.7 MB)

---

## 3. Verified Architectural Baseline
- **Dual-Path Ingestion:** Sub-millisecond Fast Path (`<100 µs`) decoupled from asynchronous Learning Path.
- **OCSF Normalization:** Strict OCSF v1.1.0 JSON-Schema enforcement with `unmapped` attribute retention.
- **Forensic Lineage:** Exact raw byte offsets `[start, end]` tracked per extracted attribute.
- **Cryptographic Authenticity:** RFC 6962 Domain-Separated Merkle Tree (`0x00` leaf prefix, `0x01` internal node prefix).
- **Air-Gap Enforcement:** Python `socket.socket` constructor monkey-patched at process start to raise `PermissionError` on non-loopback egress.
- **PII Scrubbing:** Verhoeff checksum algorithm for Aadhaar validation, zero-width evasion mitigation.

---

## 4. Known Boundaries & Operational Scope
- Single-node prototype throughput is ~9,300 EPS; scaled production deployment requires L4 load balancers and partitioned worker pools.
- Parser synthesis uses deterministic token clustering and regex generation; complex arbitrary multiline nested XML requires secondary schema hints.
