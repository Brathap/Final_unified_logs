# ULPF Production System Architecture & Data Flow

## 1. High-Level Telemetry Plane Architecture

ULPF is positioned strictly as an **Adaptive Normalization & Preprocessing Layer** between heterogeneous telemetry sources and downstream SIEM / Data-Lake systems:

```
                            TELEMETRY PRODUCERS
     [ Firewalls (Cisco/Palo Alto) ]   [ Linux/Windows OS ]   [ Cloud & WAF ]
                   │                          │                      │
                   ▼                          ▼                      ▼
    ┌────────────────────────────────────────────────────────────────────────┐
    │                 ULPF MULTI-PROTOCOL INGESTION GATEWAY                  │
    │   • Syslog UDP (RFC 3164/5424)     • Syslog TCP Stream                 │
    │   • HTTP Ingestion Webhook         • JSONL File Ingestion              │
    └───────────────────────────────────┬────────────────────────────────────┘
                                        │
                                        ▼
    ┌────────────────────────────────────────────────────────────────────────┐
    │                 BOUNDED QUEUE & BACKPRESSURE CONTROLLER                │
    │   • Max Depth: 50,000 slots        • High Watermark: 85%               │
    │   • 429 Flow Throttling            • Zero Unbounded Memory Allocation  │
    └───────────────────────────────────┬────────────────────────────────────┘
                                        │
                                        ▼
    ┌────────────────────────────────────────────────────────────────────────┐
    │                 IMMUTABLE RAW LOSSLESS STORAGE & MERKLE                │
    │   • Software Append-Only Archive   • Single-Pass SHA-256 Digest        │
    │   • RFC 6962 Domain-Separated Merkle Tree (0x00 Leaf / 0x01 Parent)    │
    └───────────────────────────────────┬────────────────────────────────────┘
                                        │
                                        ▼
                     [ SOURCE PACK ROUTING CLASSIFIER ]
                                        │
                 ┌──────────────────────┴──────────────────────┐
                 ▼                                             ▼
       [ KNOWN TELEMETRY ]                           [ UNKNOWN / DRIFTED ]
                 │                                             │
                 ▼                                             ▼
       [ FAST PATH ROUTINE ]                         [ LEARNING PATH ]
        • Pre-compiled Regex                          • Character Delimiter Profiling
        • Vector VRL Normalizer                       • Invariant Template Mining
        • Sub-ms Latency (202 µs)                     • Semantic OCSF Inference
        • Zero Ingestion Lock                         • Candidate Pack YAML Synthesis
                 │                                             │
                 │                                             ▼
                 │                                   [ GOVERNANCE & APPROVAL ]
                 │                                    • ReDoS Backtracking Audit
                 │                                    • Human Operator Review
                 │                                    • Atomic Hot Reload (<2 ms)
                 │                                    • Safe Rollback Engine
                 │                                             │
                 └──────────────────────┬──────────────────────┘
                                        ▼
    ┌────────────────────────────────────────────────────────────────────────┐
    │                  OCSF v1.1.0 SCHEMA NORMALIZER                         │
    │   • Strict JSON-Schema Mapping     • Unmapped Vendor Field Retention   │
    │   • Exact Field Lineage [start:end]• Aadhaar Verhoeff Checksum Scrub   │
    └───────────────────────────────────┬────────────────────────────────────┘
                                        │
                    ┌───────────────────┼───────────────────┐
                    ▼                   ▼                   ▼
           [ VALID TELEMETRY ]   [ MALFORMED / ERROR ] [ DOWNSTREAM CONTRACT ]
                    │                   │                   │
                    ▼                   ▼                   ▼
           [ SQLite WAL Store ]  [ QUARANTINE DB ]   • OCSF JSON Stream
           • Indexed Queries     • Isolated SQLite   • Columnar Parquet
           • Audit Logging       • Replay Engine     • SIEM / Data Lake Feed
```

---

## 2. Core Operational Subsystems

### A. Governed Source Pack Lifecycle (`backend/source_packs/lifecycle.py`)
- **Lifecycle States:** `CANDIDATE` $\to$ `VALIDATED` $\to$ `ACTIVE` $\to$ `DEPRECATED` $\to$ `QUARANTINED` $\to$ `ROLLBACK`.
- **ReDoS Vulnerability Guard:** Pre-compilation inspection blocks nested unbounded quantifiers like `(a+)+` or `(a*)*`.
- **Atomic Rollback:** If an updated parser exhibits elevated error rates, `POST /api/source-packs/rollback` immediately restores the previous archived YAML version in `<2 ms` without dropping packets or restarting the host process.

### B. Forensic Quarantine Subsystem (`backend/quarantine_engine.py`)
- Corrupted, malformed, or unparseable frames are isolated in `storage/quarantine.db`.
- Preserves raw byte payloads, failure categories (`MALFORMED_HEADER`, `UNKNOWN_SYNTAX`), and failure reasons.
- Exposes `GET /api/quarantine` and `POST /api/quarantine/replay` so operators can re-process quarantined events once a new Source Pack is promoted.

### C. Bounded Ingestion Queue (`backend/ingestion_gateway.py`)
- Thread-safe `asyncio.Queue` bounded at 50,000 slots.
- Bounded memory ensures stability under burst volume attacks; triggers flow control backpressure at 85% capacity.
