# ULPF Security Threat Model & Adversarial Hardening

## 1. Threat Landscape & Attacker Capabilities

In national security and defense environments (NTRO), adversaries target telemetry processing engines to blind Security Operations Centers (SOCs), poison parsing rules, inject remote code, or tamper with forensic evidence.

---

## 2. Attacker Vectors & Implemented Countermeasures

### Vector 1: Malicious Regular Expression Backtracking (ReDoS)
- **Threat:** An attacker crafts or modifies a candidate Source Pack YAML containing catastrophic backtracking patterns (e.g. `(a+)+` or `(a|aa)+`), causing 100% CPU lockup and denying log ingestion.
- **Countermeasure:** `SourcePackLifecycleManager.audit_regex_safety()` inspects all regular expressions for nested quantifiers prior to compilation. Pathological patterns are rejected during promotion.
- **Evidence:** `tests/test_production_lifecycle_quarantine.py::test_redos_pattern_rejection` (**PASSED**).

### Vector 2: Digital Evidence Alteration / Insertion / Deletion
- **Threat:** An insider with compromised operating system credentials modifies raw audit logs in `storage/lossless_archive.jsonl` to erase evidence of lateral movement.
- **Countermeasure:** RFC 6962 Domain-Separated Merkle Tree. Leaves are hashed as `SHA-256(0x00 || raw_bytes)`. Any single-bit change cascades up the Merkle branch and causes an immediate Root Hash mismatch during verification audits.
- **Evidence:** `tests/test_tamper_detection.py::test_single_byte_mutation_detected` (**PASSED**).

### Vector 3: Second-Preimage Attacks on Merkle Trees
- **Threat:** An adversary constructs a synthetic payload whose hash collides with an internal intermediate Merkle node hash, presenting an internal node as a valid leaf.
- **Countermeasure:** Strict domain separation prefixes. Leaves use `0x00`, while parent nodes use `0x01`. An internal node hash can mathematically never match a valid leaf hash.
- **Evidence:** `tests/test_merkle_tree.py::test_merkle_domain_separation` (**PASSED**).

### Vector 4: Exfiltration Across Sovereign Air-Gap Boundaries
- **Threat:** Compromised third-party packages or injected scripts attempt outbound DNS or HTTP telemetry to external Command & Control (C2) servers.
- **Countermeasure:** Low-level kernel socket interception in `backend/security/egress_guard.py`. The Python `socket.socket` constructor is patched to reject all non-loopback connection attempts with `PermissionError (EPERM)`.
- **Evidence:** `scripts/verify_airgap.py` (4/4 external probes blocked fail-closed) (**PASSED**).

### Vector 5: Indian PII Evasion via Zero-Width Unicode Characters
- **Threat:** Attackers inject zero-width non-joiners (`\u200C`) or zero-width spaces (`\u200B`) between digits of Aadhaar or PAN card numbers to bypass regex redaction.
- **Countermeasure:** The redaction pipeline normalizes Unicode and strips zero-width non-printable characters before applying the Verhoeff checksum algorithm.
- **Evidence:** `tests/test_pii_coverage.py::test_zero_width_character_evasion_defeated` (**PASSED**).

### Vector 6: Ingestion Queue Flooding & Memory Exhaustion (DoS)
- **Threat:** An adversary floods the ingestion gateway with 100,000+ events per second to trigger an Out-Of-Memory (OOM) kernel crash.
- **Countermeasure:** Bounded `IngestionQueueManager` with a 50,000-slot cap and 85% high-watermark backpressure. Once breached, the gateway applies flow control (HTTP 429), protecting memory allocations.
- **Evidence:** `tests/test_production_lifecycle_quarantine.py::test_bounded_queue_and_backpressure_watermark` (**PASSED**).
