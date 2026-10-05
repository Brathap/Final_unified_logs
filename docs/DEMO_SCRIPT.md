# ULPF SIH26156 Demo Script: The Adaptive Source Intelligence Loop

**Target Presentation Window:** 2 Minutes  
**Command:** `python ulpf.py demo`  

---

## 2-Minute Demo Flow

### 0:00 – 0:30 | Scene A: Known Source Fast-Path Ingestion
* **Action:** Launch demo. Standard Cisco ASA firewall events arrive.
* **Demonstration:**
  - Route through compiled declarative pack (`cisco_asa_9.16.yaml`).
  - Output normalized into OCSF Class 4001 (`Network Activity`).
  - Show throughput exceeding 10,000 EPS and p50 latency under 100 µs.
* **Talking Point:** *"Known logs pass through our compiled Fast Path without inspection overhead."*

---

### 0:30 – 0:55 | Scene B: Unknown Source Discovery
* **Action:** Inject an uncataloged appliance log:
  `2026-10-05T12:00:00Z NEODEFENSE-GW01 evt=PACKET_DROP client_ip=203.0.113.88 s_port=59021 srv_ip=198.51.100.4 d_port=8080 proto=TCP`
* **Demonstration:**
  - System captures raw wire evidence and computes SHA-256 hash.
  - Offline `FormatFingerprinter` identifies format as `KEY_VALUE` (Confidence: 85%).
  - `TemplateClusterer` abstracts variables: `<TIMESTAMP> NEODEFENSE-GW01 evt=PACKET_DROP client_ip=<IP> s_port=<NUM>...`.
  - `FieldInferencer` tags `src_endpoint.ip`, `dst_endpoint.ip`, and `src_endpoint.port` deterministically.
* **Talking Point:** *"Unlike static parsers that drop unknown logs, our Adaptive Source Intelligence mines the structure and infers fields without external AI calls."*

---

### 0:55 – 1:20 | Scene C: Candidate Pack Proposal & Atomic Hot-Reload
* **Action:** Generate candidate YAML source pack and trigger operator hot reload.
* **Demonstration:**
  - `ProposalGenerator` produces a valid YAML source pack.
  - Operator approves; `SourcePackRegistry.reload()` updates the in-memory registry atomically.
  - Zero downtime, zero dropped logs. The next event from this vendor processes directly on the Fast Path.
* **Talking Point:** *"Zero-downtime evolution: new parsers are onboarded dynamically without touching core pipeline code."*

---

### 1:20 – 1:40 | Scene D: Field-Level Forensic Lineage
* **Action:** Inspect the forensic envelope.
* **Demonstration:**
  - Display raw wire SHA-256 hash alongside normalized OCSF fields.
  - Show byte-precise spans `[start, end]`:
    - `src_ip`: Byte span `[63:75]` -> `"203.0.113.88"`
    - `src_port`: Byte span `[83:88]` -> `"59021"`
* **Talking Point:** *"Every OCSF field points back to its exact byte offset in the sealed raw wire evidence."*

---

### 1:40 – 2:00 | Scene E: Upstream Format Change & Parser Drift Monitor
* **Action:** Feed mutated vendor log format (`v2`).
* **Demonstration:**
  - Field extraction coverage drops below baseline threshold.
  - `DriftDetectionEngine` fires a `DRIFT_DETECTED` alert with the exact coverage delta.
  - Event quarantined and routed back to the learning loop.
* **Talking Point:** *"When vendors update log formats, ULPF detects coverage drift automatically, preventing silent data loss."*
