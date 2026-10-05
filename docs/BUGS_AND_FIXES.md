# Real Bugs Caught, Attack Vectors Discovered & Fixes Applied

In line with principal security engineering standards, this document records genuine bugs, parser edge cases, memory leaks, and attack vectors discovered through adversarial red-team self-testing on ULPF — and the exact engineering fixes applied.

---

## 1. Verhoeff Aadhaar Scrubber False-Positive Redaction on Timestamps
* **The Bug:** The initial PII scrubber used a generic 12-digit numeric regex `\b\d{12}\b` to detect Indian Aadhaar numbers.
* **The Breakdown:** Real telemetry frequently includes 12-digit epoch millisecond timestamps (e.g. `172734567890`) and internal database surrogate keys (e.g. `998877665544`). The naive scrubber indiscriminately replaced these with `[REDACTED_AADHAAR]`, corrupting non-PII diagnostic metadata.
* **The Root Cause:** Lack of mathematical checksum validation on the 12th digit.
* **The Fix:** Implemented the full **Verhoeff algorithm** using dihedral group $D_5$ permutation and multiplication tables (`backend/pii_redactor.py`). A 12-digit sequence is now only redacted if it passes the Verhoeff checksum. Timestamps and order IDs with invalid checksums are preserved untouched.
* **Regression Test:** `tests/test_pii_coverage.py::test_aadhaar_false_positive_prevention`.

---

## 2. ReDoS Catastrophic Backtracking on User-Supplied Candidate Patterns
* **The Bug:** When the Adaptive Intelligence engine proposed candidate regexes for unknown sources, or when operators supplied custom patterns, nested quantifiers like `(a+)+$` or `(a*)*$` caused exponential backtracking that froze Python worker threads at 100% CPU.
* **The Breakdown:** An adversary injecting crafted malformed syslog lines could trigger exponential backtracking in the parser engine, causing denial-of-service across the ingestion pipeline.
* **The Fix:** Added mandatory static heuristic ReDoS auditing in `SourcePackLifecycleManager.audit_regex_safety()` (`backend/source_packs/lifecycle.py`) that detects nested quantifiers pre-compilation and rejects malicious candidate packs with `SourcePackSecurityError`.
* **Regression Test:** `tests/test_source_packs_and_intelligence.py` and `docs/EVALUATION-GUIDE.md (Test 5)`.

---

## 3. Storage Ingestion Queue Flush Lag on Abrupt Termination
* **The Bug:** In high-velocity batch ingestion, `StorageArchive.ingest_record` decoupled disk writes into a dedicated worker thread queue to maximize line-rate throughput. Under abrupt `SIGTERM` shutdown, pending queue items could fail to commit before process exit.
* **The Breakdown:** Up to 100 milliseconds of inflight events in the memory queue could be dropped if the process terminated during benchmark cycles without explicit draining.
* **The Fix:** Added an explicit `flush()` routine that drains the thread queue, synchronizes SQLite WAL commits, and flushes `storage/lossless_archive.jsonl` buffers to disk. Registered this hook directly into FastAPI's shutdown lifecycle (`backend/main.py`).
* **Regression Test:** `tests/test_storage_architecture.py` & `reports/RED_TEAM_FINDINGS.md (Finding 2)`.

---

## 4. Dual Syslog Protocol Collision & Backpressure Bypass
* **The Bug:** Both `backend/main.py` and `backend/ingestion_gateway.py` defined separate UDP syslog socket handlers.
* **The Breakdown:** When `main.py` bound port 514 directly via a legacy socket listener, burst traffic bypassed `IngestionQueueManager`'s backpressure high-watermark check (50,000 slots), risking unbounded RAM growth during UDP floods.
* **The Fix:** Consolidated all Syslog UDP/TCP listening onto `ingestion_gateway.py::IngestionQueueManager`. Both port 514 and 5140 now route through the unified bounded queue with strict drop/quarantine policies when watermarks are breached.
* **Regression Test:** `tests/test_deep_resilience.py` & `reports/RED_TEAM_FINDINGS.md (Finding 1)`.

---

## 5. Unbounded Webhook Batch Payload Vulnerability
* **The Bug:** `POST /api/live-logs` parsed incoming JSON arrays into memory using Pydantic models without an explicit ceiling on the number of records per HTTP request.
* **The Breakdown:** An attacker or misconfigured forwarder blasting a 200 MB single-request JSON batch could trigger Python MemoryError or OOM kill on RAM-constrained air-gapped nodes.
* **The Fix:** Enforced strict batch bounds (maximum 5,000 records per HTTP request, maximum 10 MB total payload body). Oversized batches are rejected immediately with HTTP 413 Payload Too Large.
* **Regression Test:** `reports/RED_TEAM_FINDINGS.md (Finding 4)` & `backend/main.py`.

---

## 6. RFC 6962 Odd-Leaf Merkle Tree Promotion Bug
* **The Bug:** In early prototypes, Merkle tree construction over an odd number of leaves duplicated the final leaf (Bitcoin style: `hash(last, last)`) rather than promoting it to the next level (Certificate Transparency / RFC 6962 style).
* **The Breakdown:** Duplicating leaves creates identical tree roots for different length input sets, introducing subtle second-preimage vulnerabilities and violating RFC 6962 compliance.
* **The Fix:** Updated `MerkleTree.build()` in `backend/merkle_engine.py` to strictly adhere to RFC 6962 Section 2.1: when an odd number of nodes exists at a given level, the isolated node is promoted directly to the next level without re-hashing or duplication.
* **Regression Test:** `tests/test_merkle_tree.py::test_odd_leaf_count_promotion`.
