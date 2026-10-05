# ULPF Actual Runtime Flow & Implementation Architecture

This document maps the real, verified execution path through the codebase. Every stage references the exact Python file and function responsible for its execution.

---

## 1. High-Level Dual-Path Flow Diagram

```
                                  [ RAW WIRE INGESTION ]
                                            │
                                            ▼
                           [ backend/storage.py: ingest_log() ]
                           • Lossless raw JSONL append
                           • SHA-256 byte digest computation
                           • SQLite WAL metadata insertion
                                            │
                                            ▼
                    [ backend/source_packs/registry.py: route_and_parse() ]
                                            │
                       ┌────────────────────┴────────────────────┐
                       ▼                                         ▼
            [ MATCH FOUND: FAST PATH ]                [ NO MATCH: LEARNING PATH ]
                       │                                         │
                       ▼                                         ▼
         [ SourcePack.parse() ]                 [ backend/unknown_engine/intelligence.py ]
         • Compiled regex extraction            • Structural fingerprinting
         • OCSF v1.1.0 dict mapping             • Character & delimiter profiling
         • Unmapped field retention             • Token sequence template discovery
                       │                        • Semantic field inference
                       ▼                        • OCSF candidate mapping
      [ backend/lineage_engine.py ]             • Candidate YAML pack generation
      • Byte span offset tracing                                 │
      • Traceability envelope assembly                           ▼
                       │                             [ Operator Web Approval ]
                       ▼                             • POST /api/unknown/propose
      [ backend/merkle_engine.py ]                   • Validation sandbox check
      • RFC 6962 Leaf (0x00) hash                                │
      • Checkpoint parent (0x01) root                            ▼
                       │                        [ SourcePackRegistry.reload() ]
                       ▼                        • Thread-safe hot reload (<1.5 ms)
              [ DOWNSTREAM OUTPUT ]             • Promoted to FAST PATH!
```

---

## 2. Step-by-Step Codebase Traceability

### Stage 1: Ingestion & Lossless Raw Preservation
- **Implementation File:** [`backend/storage.py`](file:///home/Brathap/ulpf-sih-26156/backend/storage.py)
- **Primary Function:** `StorageEngine.ingest_log(raw_log: str, source_type: str = "auto")`
- **What Actually Happens:**
  - Raw string is encoded to UTF-8 bytes.
  - Computes `raw_sha256 = hashlib.sha256(raw_bytes).hexdigest()`.
  - Appends to `storage/lossless_archive.jsonl` containing `{id, timestamp, raw_payload, raw_sha256, byte_length}`.
  - Inserts event record into SQLite database (`storage/ulpf_events.db`).

### Stage 2: Ingestion Routing Decision (Fast Path vs Learning Path)
- **Implementation File:** [`backend/source_packs/registry.py`](file:///home/Brathap/ulpf-sih-26156/backend/source_packs/registry.py)
- **Primary Function:** `SourcePackRegistry.route_and_parse(raw_line: str)`
- **What Actually Happens:**
  - Iterates through sorted source packs (`priority` descending).
  - Evaluates `pack.matches(raw_line)` against compiled detection regexes.
  - If a pack matches, calls `pack.parse(raw_line)` to extract named capture groups and map to OCSF.
  - If no pack matches, returns `None`, directing the event to the Learning Path.

### Stage 3: Offline Template Discovery & Semantic Field Inference
- **Implementation File:** [`backend/unknown_engine/intelligence.py`](file:///home/Brathap/ulpf-sih-26156/backend/unknown_engine/intelligence.py)
- **Primary Functions:**
  - `UnknownSourceIntelligence.discover_template(lines: List[str])`: Replaces numbers, quoted strings, IPs, and timestamps with `<*>` to discover clustering templates.
  - `UnknownSourceIntelligence.infer_fields(sample_line: str)`: Executes deterministic regex recognizers for IPv4/IPv6, timestamps, ports, usernames, and severity keywords, scoring each with confidence ratings (75%–95%).

### Stage 4: Candidate Source Pack Generation & Hot Reload
- **Implementation File:** [`backend/unknown_engine/intelligence.py`](file:///home/Brathap/ulpf-sih-26156/backend/unknown_engine/intelligence.py)
- **Primary Functions:**
  - `ProposalGenerator.generate_candidate_pack(vendor, product, sample_logs)`: Synthesizes valid declarative YAML with unique regex capture groups (`(?P<src_ip>...)`, `(?P<dst_port>...)`) and OCSF field mappings.
  - `SourcePackRegistry.reload()` in [`backend/source_packs/registry.py`](file:///home/Brathap/ulpf-sih-26156/backend/source_packs/registry.py): Rescans the `sources/` directory, compiles regexes, and atomically swaps `self.packs` in memory.

### Stage 5: Field-Level Lineage & Byte Tracing
- **Implementation File:** [`backend/lineage_engine.py`](file:///home/Brathap/ulpf-sih-26156/backend/lineage_engine.py)
- **Primary Functions:**
  - `LineageEngine.trace_spans(raw_text: str, extracted_fields: Dict[str, Any])`: Searches for extracted string values within the raw wire text, recording exact `{"start": pos, "end": end_pos, "raw_token": str_val}`.
  - `LineageEngine.build_envelope(...)`: Assembles the JSON envelope containing both normalized OCSF and the cryptographic traceability block.

### Stage 6: Forensic Integrity & Tamper Detection
- **Implementation File:** [`backend/merkle_engine.py`](file:///home/Brathap/ulpf-sih-26156/backend/merkle_engine.py)
- **Primary Functions:**
  - `MerkleTree.add_leaf(data: bytes)`: Hashes raw payload with RFC 6962 leaf prefix: `SHA-256(b"\x00" + data)`.
  - `MerkleTree.get_root()`: Computes intermediate node hashes with prefix: `SHA-256(b"\x01" + left + right)`.
  - `MerkleTree.get_audit_proof(index)`: Emits cryptographic sibling hashes and directional proofs for standalone verification.

### Stage 7: Active Air-Gap Enforcement
- **Implementation File:** [`backend/security/egress_guard.py`](file:///home/Brathap/ulpf-sih-26156/backend/security/egress_guard.py)
- **Primary Function:** `install_egress_guard()`
- **What Actually Happens:**
  - Monkey-patches Python's `socket.socket.connect` and `socket.socket.connect_ex`.
  - Blocks any destination address not matching `127.0.0.1`, `::1`, or local IPC, raising `PermissionError("Air-gap egress violation")`.
