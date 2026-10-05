# SIH 26156 — Final Upgrade & Verification Plan

## 1. Selected High-ROI Enhancements (Max 10 P0 Items)

| ID | Enhancement Item | SIH Requirement | Competitive Reason | Implementation Scope | Files Modified | Verification Gate |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **P0-1** | Explainable Inference Evidence Matrix | Requirement (e), (i) | Competitors output black-box mappings; judges want explainable rule reasoning. | Surface candidate mappings, confidence scores, and rule evidence arrays. | `backend/unknown_engine/intelligence.py` | `tests/test_source_packs_and_intelligence.py` |
| **P0-2** | Parser Drift Resilience Validation | Requirement (e), (i) | Proves adaptive self-healing when upstream logs mutate. | Versioned drift tests verifying alert generation and pack synthesis. | `tests/test_source_packs_and_intelligence.py` | `pytest tests/` |
| **P0-3** | RFC 6962 Domain Separation Audit | Requirement (d), (j) | Prevents second-preimage attacks on Merkle tree evidence. | Strict `0x00`/`0x01` leaf/parent hash prefixes. | `backend/forensics/` | `tests/test_merkle_tree.py` |
| **P0-4** | Lossless Byte Reconstruction Proof | Requirement (a), (d) | Proof of 100% byte-for-byte fidelity without character corruption. | Exact string/byte comparison and SHA-256 equivalence assertion. | `tests/test_reconstruction.py` | `evaluate.py` |
| **P0-5** | Fail-Closed Kernel Egress Defense | Requirement (j) | Technical proof of sovereign air-gap isolation. | Low-level Python socket monkey-patch with EPERM assertion. | `backend/security/egress_guard.py` | `scripts/verify_airgap.py` |
| **P0-6** | Verhoeff Aadhaar & Zero-Width Defense | Requirement (b), (c) | Eliminates false positives on 12-digit numbers while defeating evasion. | Dihedral group $D_5$ checksum + unicode strip. | `tests/test_pii_coverage.py` | `pytest tests/` |
| **P0-7** | End-to-End 50,000 Event Benchmark | Requirement (l) | Defensible empirical proof (>9,000 EPS, <100µs p50). | Automated benchmark logging p50/p95/p99 and peak RAM. | `benchmarks/benchmark_end_to_end.py` | `docs/BENCHMARKS.md` |
| **P0-8** | Interactive 5-Scene Hero CLI Demo | Presentation / Demo | Guarantees deterministic 90-second judge presentation. | Live console flow proving known -> unknown -> hot reload -> lineage -> drift. | `ulpf.py demo` | `python ulpf.py demo` |
| **P0-9** | Complete 50-Question Judge Defense | Judge Defense | Defeats aggressive technical panel cross-examination. | Deep architectural Q&A covering all 5 core dimensions. | `docs/JUDGE_QA_FINAL.md` | Cross-referenced |
| **P0-10**| Submission Packaging & Tag Freeze | Release Management | Guarantees clean-room reproduction by judges. | Documented zero-credential launch flow with git release tag `sih26156-final`. | Repository release gate | Git commit & tag |
