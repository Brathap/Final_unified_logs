# ULPF Production Contract & Operational Guarantees

This document establishes the official operational contract between ULPF and deploying enterprise / defense organizations.

---

## 1. Guaranteed Capabilities (Proven by Code & Empirical Tests)

1. **Lossless Evidentiary Preservation:**  
   Every raw log line is preserved byte-for-byte in an append-only archive (`storage/lossless_archive.jsonl`) and indexed with its SHA-256 byte digest prior to parsing.
2. **Cryptographic Tamper Detection:**  
   Log records are sealed in an **RFC 6962 Domain-Separated Merkle Tree** (`0x00` leaf / `0x01` parent prefixes). Any single-bit modification, insertion, deletion, or reordering of audit records is mathematically detected during verification.
3. **Exact Field-Level Byte Lineage:**  
   Normalized OCSF attributes record exact `[start_byte, end_byte]` offsets referencing the immutable raw wire payload.
4. **Sovereign Air-Gap Isolation:**  
   The runtime environment actively blocks non-loopback outbound socket connections (`EPERM`) and makes zero external cloud, LLM, or telemetry calls.
5. **Aadhaar False-Positive Elimination:**  
   Indian Aadhaar numbers are verified using the Dihedral Group $D_5$ **Verhoeff Checksum Algorithm**, eliminating false-positive corruption on 12-digit timestamps and serial numbers. Zero-width spaces (`\u200B`, `\u200C`, `\u200D`) are stripped to defeat evasion attacks.
6. **Zero-Downtime Hot Reload & Safe Rollback:**  
   Declarative Source Packs in `sources/` reload into memory via thread-safe atomic dictionary swaps in `<2 ms` without dropping packets or restarting workers. Defective packs can be rolled back via `POST /api/source-packs/rollback`.
7. **ReDoS Vulnerability Guard:**  
   Candidate regular expressions are audited pre-compilation; nested unbounded quantifiers like `(a+)+` are rejected.
8. **Forensic Quarantine Isolation:**  
   Corrupted, truncated, or unparseable frames are isolated in `storage/quarantine.db` with categorized failure reasons, queryable via API and replayable upon parser promotion.

---

## 2. Best-Effort Capabilities (Operational Scope)

1. **Autonomous Field Inference:**  
   Rule-based inference assigns OCSF classes with 75%–95% confidence based on structural heuristics. Human operator review is recommended for low-confidence candidate packs before promotion.
2. **Parser Drift Detection:**  
   Rolling statistical counters monitor null-rate spikes (>20%) over rolling sample windows to flag format changes.
3. **Queue Backpressure Throttling:**  
   The bounded ingestion queue absorbs bursts up to 50,000 slots and triggers flow-control throttling (HTTP 429) at 85% depth.

---

## 3. Explicit Boundaries & Unsupported Workloads

1. **ULPF is NOT a SIEM:** It normalizes and pre-processes telemetry for ingestion into Splunk, Elastic, Sentinel, or data lakes; it does not manage alert workflows or case ticketing.
2. **Arbitrary Multiline Nested XML:** Complex multiline XML trees with deeply nested polymorphic namespaces require initial delimiter markers.
3. **Single-Node Throughput Bound:** Single-node commodity throughput is ~4,300–4,700 EPS; scaling to 100,000+ EPS requires deploying stateless workers behind an L4 HAProxy load balancer.
