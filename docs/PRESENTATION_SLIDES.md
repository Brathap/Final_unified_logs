# SIH 26156 — 5-Slide Pitch Deck Architecture

## Slide 1: The Problem & The Mission (NTRO SIH26156)
* **Title:** Universal Log Pre-processing Framework (ULPF)
* **Subtitle:** Autonomous, Forensic-Grade, Air-Gapped Normalization Engine for Sovereign Cyber Defense
* **Key Pain Points:**
  - **Telemetry Chaos:** Defense infrastructure consumes hundreds of heterogeneous vendor formats (Cisco, Palo Alto, Juniper, Linux, proprietary ICS/SCADA).
  - **Fragile Parsers:** Firmware updates cause silent parser drift, dropping critical security events into unparsed black holes.
  - **Air-Gap Constraints:** Cloud-based parsing and LLMs leak classified mission telemetry and fail without internet.

---

## Slide 2: The Core Innovation: Dual-Path Adaptive Architecture
* **Diagram:**
  ```
  KNOWN LOGS    ──> [ Fast Path: Vector / Source Packs ] ──> 9,300+ EPS (p50 < 100µs)
                            │
  UNKNOWN LOGS  ──> [ Learning Path (Offline Buffer) ]
                            ↓
                    [ Fingerprint & Cluster ]
                            ↓
                    [ Semantic Field Inference ]
                            ↓
                    [ Declarative YAML Pack Gen ]
                            ↓
                    [ Zero-Downtime Hot Reload ] ──> Promoted to Fast Path!
  ```
* **Key Insight:** Offline self-evolution keeps heavy clustering completely off the high-speed critical path.

---

## Slide 3: Forensic Rigor & Cryptographic Integrity
* **Lossless Raw Byte Archive:** 100% byte-for-byte exact preservation before parsing.
* **RFC 6962 Domain-Separated Merkle Tree:**
  - Leaf Prefix: `SHA-256(0x00 || raw_bytes)`
  - Internal Node Prefix: `SHA-256(0x01 || left || right)`
  - Guarantees court-admissible non-repudiation and detects single-byte mutations.
* **Field-Level Byte Lineage:** Every OCSF attribute retains exact `[start_byte, end_byte]` offsets back to the immutable raw event.

---

## Slide 4: Measured Empirical Benchmarks & Security Proof
* **Empirical Throughput:** **9,228 – 9,369 Events Per Second (EPS)** (measured live on 50,000 logs).
* **Latency Profile:** **p50 = 98 µs, p95 = 129 µs, p99 = 153 µs**.
* **Memory Footprint:** **<29 MB Peak Resident RAM** (no heavy JVM or memory bloat).
* **Air-Gap Verification:** Low-level kernel socket interception with **4/4 external egress probes blocked (Fail-Closed)**.
* **PII Redaction:** Indian Aadhaar validated with **Verhoeff checksum algorithm** + zero-width evasion mitigation.

---

## Slide 5: Real-World Demonstration & Production Readiness
* **Live Interactive Demo:**
  1. High-speed ingestion of multi-vendor firewall telemetry.
  2. Injection of completely unknown custom defense log.
  3. Real-time detection, clustering, candidate pack synthesis, and hot reload.
  4. Immediate replay and normalization to standard **OCSF v1.1.0**.
  5. Cryptographic tamper attack injected and caught by Merkle root mismatch in <1 ms.
* **Open & Portable:** Zero cloud lock-in, deployable via single binary or lightweight container.
