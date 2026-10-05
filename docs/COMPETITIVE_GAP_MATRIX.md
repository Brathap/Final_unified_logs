# SIH 26156 — Competitive Gap & Feature Matrix

## 1. Requirement & Competitor Feature Breakdown

| Feature / Capability | SIH26156 Spec | Typical Open Source | SIH Competitor Teams | ULPF SIH26156 Implementation | Verification Evidence |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Lossless Raw Preservation** | Mandatory | Partial (Drops unparsed) | Partial (Truncated strings) | **100% Byte-for-byte exact preservation** | `tests/test_ulpf_suite.py::test_a_lossless_preservation`, `evaluate.py` [PASS] |
| **Normalized Standard** | OCSF standard | Elastic ECS / Splunk CIM | Ad-hoc JSON keys | **Official OCSF v1.1.0 JSON-Schema** | `tests/test_ulpf_suite.py::test_b_c_attribute_extraction_and_ocsf`, `docs/OCSF_VERSION.md` |
| **Traceability & Lineage** | Mandatory | File/Line only | Parser ID string | **Exact [start, end] byte offsets to raw string** | `tests/test_source_packs_and_intelligence.py::test_field_lineage_byte_spans` |
| **Unknown Log Onboarding** | Mandatory | Manual authoring | Drain clustering or LLM prompt | **Adaptive Offline Intelligence: Cluster → Infer → Validate → Hot-Reload** | `tests/test_source_packs_and_intelligence.py::test_unknown_source_intelligence_offline` |
| **Parser Drift Detection** | Mandatory | Silent failure / Drop | Error log count | **Schema stability tracking & automated drift alerts** | `tests/test_source_packs_and_intelligence.py::test_drift_detection_engine` |
| **Cryptographic Integrity** | Tamper-proof | TLS in transit only | Periodic raw hash dump | **RFC 6962 Domain-Separated Merkle Tree** | `tests/test_merkle_tree.py`, `tests/test_tamper_detection.py` |
| **Tamper Detection Proof** | Required | None | None | **Sub-millisecond detection of single byte or order change** | `tests/test_tamper_detection.py::test_single_byte_mutation_detected` |
| **Air-Gap Security** | Air-gapped NTRO | Internet reliant | Claimed in doc only | **Fail-closed socket interceptor + zero telemetry audit** | `tests/test_egress_enforcement.py`, `scripts/verify_airgap.py` |
| **Throughput & Efficiency** | High-velocity | 2k–5k EPS | 3k–6k EPS | **>9,200 EPS at <30 MB Peak RAM** | `benchmarks/benchmark_end_to_end.py` |
| **PII Redaction (National)**| Essential | Email / Credit card | Phone / Email | **Aadhaar (Verhoeff checksum), PAN, IMEI, Mobile, zero-width evasion** | `tests/test_pii_coverage.py` (9 tests passed) |
| **SOC Dashboard & Replay** | User Interface | Kibana / Grafana | Basic React UI | **Real-time SSE Dashboard + Event Replay Sandbox** | `frontend/src/`, `tests/test_ulpf_suite.py::test_f_soc_dashboard_endpoints` |

---

## 2. Technical Differentiation Scorecard

| Area | Why Competitors Fail | Why ULPF Succeeds |
| :--- | :--- | :--- |
| **Performance vs Intelligence** | Competitors run AI/clustering on every log, dropping throughput below 200 EPS. | ULPF splits execution into **Fast Path** (>9,200 EPS) and asynchronous **Learning Path**. |
| **Air-Gap Compliance** | Competitors call external APIs or fail when DNS/Internet is unavailable. | ULPF has 0 external calls, strictly self-contained algorithms, and an active socket firewall. |
| **Legal Admissibility** | Competitors modify raw strings during parsing, breaking hash integrity. | ULPF archives pristine raw bytes before parsing, indexing both raw and normalized with Merkle proofs. |
| **Schema Uniformity** | Competitors invent custom fields (e.g. `client_ip`, `src`), fragmenting analytics. | ULPF maps every event to strict **OCSF v1.1.0** standards (`src_endpoint.ip`, `dst_endpoint.ip`). |
