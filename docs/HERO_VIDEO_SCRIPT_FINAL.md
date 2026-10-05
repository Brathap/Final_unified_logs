# SIH 26156 — Final 2-Minute Hero Video Script

**Target Duration:** Exactly 120 Seconds  
**Objective:** Deliver an indisputable, evidence-backed demonstration of the Adaptive Closed Loop.

---

### [0:00 – 0:15] Scene 1: The Sovereign Problem
- **Visual:** Terminal screen scrolling heterogeneous syslog streams: Cisco ASA, Palo Alto PAN-OS, Linux SSH.
- **Narrator (Audio):**  
  *"In national defense operations, intelligence networks ingest thousands of heterogeneous log formats every second. Static forwarders like Vector and Logstash rely on human-coded rules. When log formats mutate or novel defense systems arrive, static parsers fail silently. What happens when the parser doesn't exist? Meet ULPF."*

---

### [0:15 – 0:35] Scene 2: The Unfamiliar Log Arrives
- **Visual:** Live Web UI / CLI console. Operator submits an unmapped custom log line:  
  `2026-10-05T12:00:00Z NEODEFENSE-GW01 evt=PACKET_DROP client_ip=203.0.113.88 s_port=59021 srv_ip=198.51.100.4 d_port=8080 proto=TCP`  
  Dashboard alerts:
  ```text
  SOURCE: UNKNOWN
  STATUS: UNREGISTERED
  ACTION: ROUTING TO LEARNING PATH BUFFER
  ```
- **Narrator (Audio):**  
  *"When an unknown log arrives, ULPF does not drop it or stall high-speed ingestion. It routes the event to an asynchronous, air-gapped Learning Path."*

---

### [0:35 – 0:60] Scene 3: Adaptive Source Intelligence
- **Visual:** UI displays the intelligence breakdown:
  - Wire Format Detected: `KEY_VALUE (85% confidence)`
  - Template Discovered: `<TIMESTAMP> NEODEFENSE-GW01 evt=PACKET_DROP client_ip=<IP>...`
  - Inferred OCSF Mappings:
    - `src_endpoint.ip = 203.0.113.88 (95% confidence)`
    - `dst_endpoint.ip = 198.51.100.4 (95% confidence)`
    - `src_endpoint.port = 59021 (90% confidence)`
  - Candidate Source Pack YAML preview appears in the sandbox.
- **Narrator (Audio):**  
  *"Completely offline, without calling any cloud AI, ULPF fingerprints the structure, discovers the token template, and infers semantic OCSF attributes with transparent confidence scores. It synthesizes a complete declarative Source Pack in milliseconds."*

---

### [0:60 – 0:75] Scene 4: Human Approval & Zero-Downtime Hot Reload
- **Visual:** Operator clicks `[ APPROVE & PROMOTE ]`.
  - Notification flashes:
    ```text
    SOURCE PACK PROMOTED: NeoDefense CloudGateway v1.0.0
    HOT RELOAD: COMPLETE
    PIPELINE RESTART: NO
    PACKET DROP: ZERO
    ```
- **Narrator (Audio):**  
  *"The operator inspects the proposed schema and clicks Approve. The engine hot-reloads the new parser into runtime memory in under two milliseconds — no server restart, no packet loss."*

---

### [0:75 – 0:95] Scene 5: The 'It Learned' Moment & Measured Velocity
- **Visual:** The same previously unknown log is injected again.
  - Display switches instantly:
    ```text
    SOURCE: REGISTERED (NeoDefense)
    PATH: FAST PATH
    OCSF CLASS: 4001 (Network Activity)
    MEASURED VELOCITY: 4,686 EPS (p50: 202 µs)
    ```
- **Narrator (Audio):**  
  *"Immediately, the same log streams through the compiled Fast Path, normalizing into OCSF at over 4,600 sustained events per second with sub-millisecond latency. The unknown has become a high-speed production parser."*

---

### [0:95 – 1:10] Scene 6: Forensic Time Machine & Tamper Detection
- **Visual:** UI inspects the normalized record. Operator clicks `src_endpoint.ip`:
  - Highlights exact byte span `[63:75]` on the raw untouched wire log.
  - Merkle root verified: `SHA-256(0x00 || raw_bytes)`.
  - Single byte in test archive modified: Merkle root fails immediately with `TAMPER_DETECTED`.
- **Narrator (Audio):**  
  *"For legal admissibility, every OCSF field maintains exact byte-level lineage back to the immutable raw wire log. Underneath, an RFC 6962 Domain-Separated Merkle tree detects single-byte tampering in under one millisecond."*

---

### [1:10 – 1:20] Scene 7: Parser Drift & Air-Gap Signoff
- **Visual:** Vendor upgrades format to `[V2_UPGRADE] src_addr=...`.
  - System flags `DRIFT_DETECTED` and initiates auto-adaptation.
  - Air-gap status displays: `4/4 External Sockets Blocked (Fail-Closed)`.
- **Narrator (Audio):**  
  *"When vendor formats change, ULPF detects parser drift and self-heals. 15 out of 15 SIH requirements verified. 100% air-gapped. ULPF is sovereign, adaptive, and defense-ready."*
