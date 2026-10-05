# SIH 26156 — Final 5-Slide Pitch Deck Architecture

## Slide 1: The Problem
### Headline: THE PARSER BOTTLENECK
- **The Challenge:** National defense and intelligence networks ingest thousands of heterogeneous telemetry formats (Cisco, Palo Alto, Juniper, Linux, ICS/SCADA, bespoke defense apps).
- **The Failure of Static Tools:** Current solutions (Vector, Logstash) rely on static Grok regex rules written by human engineers.
- **The Breakdown:** When upstream firmware updates alter log syntax, or novel battlefield applications arrive:
  - Unmatched events are dropped into unparsed dead-letter queues.
  - Normalization fails silently, blinding downstream SIEM detection rules.
  - Forensic byte lineage is discarded, rendering digital evidence inadmissible in court.
- **The Core Question:** *"What happens when the parser doesn't exist?"*

---

## Slide 2: The Solution
### Headline: ADAPTIVE SOURCE INTELLIGENCE
- **The Breakthrough:** An autonomous, air-gapped closed loop that turns unknown or drifted security logs into validated, production-ready parsers:
  ```
  UNKNOWN LOG  ──>  FINGERPRINT  ──>  DISCOVER TEMPLATE  ──>  INFER OCSF FIELDS
                                                                      │
  FAST PATH    <──  HOT RELOAD   <──  HUMAN APPROVAL     <──  PROPOSE SOURCE PACK
  ```
- **Dual-Path Decoupling:**
  - **Fast Path:** Sub-millisecond normalization (>4,600 sustained EPS, <205 µs latency) on compiled Source Packs.
  - **Learning Path:** Asynchronous offline clustering and semantic inference keeping high-speed ingestion lines completely unblocked.

---

## Slide 3: Architecture
### Headline: THE SOVEREIGN DUAL-PATH PIPELINE
```
             ┌────────────────────────────────────────────────────────┐
             │       ULPF HIGH-SPEED INGESTION (Lossless Raw Store)   │
             └───────────────────────────┬────────────────────────────┘
                                         │
                    ┌────────────────────┴────────────────────┐
                    ▼                                         ▼
           [ Known Telemetry ]                       [ Unknown / Drifted ]
                    │                                         │
                    ▼                                         ▼
            [ Fast Path (VRL) ]                       [ Learning Path ]
             • Compiled Regex                          • Offline Clustering
             • Sub-ms Latency                          • OCSF Field Inference
                    │                                  • Candidate Pack Gen
                    │                                  • Operator Approval
                    │                                  • Hot Reload (<1.5 ms)
                    └────────────────────┬────────────────────┘
                                         ▼
                            [ OCSF v1.1.0 Normalization ]
                                         │
                      ┌──────────────────┴──────────────────┐
                      ▼                                     ▼
          [ Downstream Analytics ]               [ Forensic Non-Repudiation ]
          • Parquet Analytical Export            • RFC 6962 Domain Merkle Tree
          • SIEM / Data Lake Feed                • Exact [start, end] Byte Spans
```

---

## Slide 4: Measured Evidence
### Headline: EMPIRICALLY MEASURED PROOFS (Zero Simulated Numbers)
- **Measured Ingestion Velocity:** **4,686 Events Per Second** sustained end-to-end on 50,000 live events (Micro-regex throughput: >100,000 EPS).
- **Latency Distribution:** **p50 = 202.82 µs, p95 = 256.96 µs, p99 = 296.01 µs**.
- **Memory Footprint:** **23.9 MB** Peak Resident RAM in live streaming.
- **Sovereign Air-Gap Security:** **4/4 Outbound Network Probes Blocked** by low-level socket interceptor (`EPERM`), **0 external cloud/telemetry calls**.
- **Cryptographic Tamper Detection:** Single-byte alteration in archive caught in **<1 ms** by RFC 6962 Merkle tree mismatch.
- **Automated Verification:** **15/15 SIH Requirements Verified**, **69/69 Unit/Integration Tests Passed**.

---

## Slide 5: Why ULPF?
### Headline: THE THREE SOVEREIGN PILLARS

1. **ADAPTIVE:** Unknown and drifted logs enter an autonomous offline learning path, generating validated YAML source packs with zero pipeline downtime.
2. **EXPLAINABLE:** Every inferred field exposes candidate mappings, confidence ratings (75%–95%), and structural rationale.
3. **FORENSICALLY TRACEABLE:** 100% lossless raw wire preservation; every OCSF attribute maintains exact `[start, end]` byte spans back to the immutable raw wire payload.

> **"ULPF doesn't just process known logs. It creates the path from unknown data to a validated production parser — entirely offline."**
