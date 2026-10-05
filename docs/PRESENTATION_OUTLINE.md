# AegisGuard-ULPF — Official 5-Slide SIH Presentation Content
**Problem Statement:** SIH 26156 — Universal Log Pre-processing Framework (ULPF)  
**Sponsor Organization:** National Technical Research Organisation (NTRO)  
**Team Identity:** AegisGuard-ULPF

---

## SLIDE 1: TITLE & THE PROBLEM — SOVEREIGN TELEMETRY IN CRISIS

### Slide Title:
**AegisGuard-ULPF: Sovereign, Air-Gapped Telemetry Pre-Processing & Cryptographic Custody**

### Subtitle:
*Solving Heterogeneous Log Ingestion Chaos for National Defense SOCs & Critical Infrastructure*

### Core Challenge Points:
* **The Telemetry Babel Problem:** Defense perimeters ingest logs from Cisco, Palo Alto, Fortinet, Imperva, Linux, and Windows. Each formats timestamps, IPs, and severities differently.
* **Brittle Pipeline Overhead:** Security analysts spend 60% of engineering bandwidth maintaining fragile ad-hoc regular expressions. Upstream vendor firmware updates silently break parsers.
* **Evidentiary Chain-of-Custody Loss:** Traditional pipelines mutate raw strings without maintaining wire hashes or character-level lineage, rendering telemetry legally inadmissible during forensic post-mortems.
* **Sovereignty & Air-Gap Demands:** Cloud-dependent SIEMs and LLM-based SaaS parsers violate national security air-gap mandates.

---

## SLIDE 2: THE SOLUTION — ARCHITECTURE & VALUE PROPOSITION

### Slide Title:
**AegisGuard-ULPF: Architecture & Operational Pipeline**

### Tagline:
*“Different Logs. One Security Language. Every Transformation Accounted For.”*

### Key Architectural Pillars:
* **Lossless Raw Wire Vault:** Unaltered packet bytes are Base64-encoded and SHA-256 digested before entering parsing memory.
* **OCSF v1.1.0 Standard Normalization:** Strict taxonomy projection across Class 4001 (Network Activity), Class 3002 (IAM), Class 2001 (Security Finding), and Class 1001 (File Activity).
* **Exact Field-Level Byte Lineage:** Character span coordinate tracking (`[start, end]`) guarantees direct provenance linking normalized fields back to wire tokens.
* **Sovereign Indian Statutory Integration:** Built-in Verhoeff $D_5$ Aadhaar redaction, PAN masking, and automated CERT-In 6-hour incident disclosure export.

*(Visual: 4-stage pipeline diagram showing Ingest → Wire Vault → Lineage Engine → RFC 6962 Merkle Seal → SOC Console)*

---

## SLIDE 3: TECHNICAL DIFFERENTIATORS — NOVELTY & DEPTH

### Slide Title:
**Core Technical Differentiators vs Traditional Pre-Processors**

| Architectural Dimension | Traditional SIEMs / Logstash | Vector / Fluent Bit | AegisGuard-ULPF |
| :--- | :--- | :--- | :--- |
| **Tamper Non-Repudiation** | None (Local DB log) | None | **RFC 6962 Merkle Trees with Logarithmic Proofs** |
| **Field Lineage Traceability** | None (Destructive transform) | None | **Exact Byte Coordinate Spans `[start:end]`** |
| **Unknown Log Onboarding** | Manual rule coding | Manual VRL / Lua coding | **Drain Token Clustering + Draft Pack Synthesis** |
| **Air-Gap Egress Enforcement** | External dependency | External dependency | **Kernel Socket Interception (EPERM Blocked)** |
| **Indian Statutory Compliance**| Naive regex (False positives)| None | **Verhoeff $D_5$ Aadhaar + CERT-In 6-Hour Dossier** |

---

## SLIDE 4: ADAPTIVE INTELLIGENCE & SELF-HEALING ENGINE

### Slide Title:
**Self-Healing Closed Loop: Autonomous Profiling, Drift & Hot Reload**

### Closed-Loop Workflow:
1. **Quarantine & Structural Fingerprinting:** Unrecognized logs enter a non-blocking quarantine SQLite database while format entropy (Delimiters, JSON, CEF, Syslog) is calculated.
2. **Offline Grammar Clustering:** Token clustering extracts structural templates without requiring cloud AI or GPU compute.
3. **Draft Source Pack Synthesis:** Candidate YAML packs are generated with 90%+ confidence for IP, Port, and Protocol mappings.
4. **Human-in-the-Loop Hot-Reload:** Operators approve draft packs via the AI Studio UI with atomic runtime activation and zero ingestion downtime.
5. **Drift Detection Monitor:** Live divergence tracker flags format degradation when vendors update firmware, preventing silent packet drop.

---

## SLIDE 5: EMPIRICAL VALIDATION, IMPACT & ROADMAP

### Slide Title:
**Empirical Performance Benchmarks & SIH26156 Deliverables**

### Measured Hardware Benchmarks (AMD 4-Core / 3.3 GB RAM):
* **Streaming Pipeline Ingestion:** **11,030 Events Per Second (EPS)** on commodity hardware.
* **Full Persistence Throughput:** **4,493 – 4,686 EPS** with complete SQLite WAL and JSONL write commits.
* **Latency Profile:** **p50: 85 µs** | **p95: 108 µs** | **p99: 128 µs** (Sub-millisecond processing).
* **Memory Footprint:** **24.1 – 25.2 MB RSS** (Zero memory leaks under 200,000-event continuous soak).

### SIH 26156 Compliance Status:
* **Requirement Coverage:** 15/15 Requirements locally implemented and verified.
* **Automated Tests:** 74/74 Unit and Integration Tests Passing (`pytest tests/`).
* **Deployment Readiness:** 1-command startup (`./start_demo.sh`), Docker Compose isolated network, and zero external egress.
