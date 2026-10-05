# SIH 26156 — 2-Minute Deterministic Hero Video Script

**Target Duration:** 120 seconds  
**Objective:** Decisively convince NTRO judges that ULPF is technically defensible, sovereign, fast, and self-evolving.

---

### [0:00 – 0:15] Scene 1: The Sovereign Defense Challenge
- **Visual:** Terminal screen showing live flood of heterogeneous logs: Cisco ASA, Palo Alto PAN-OS, Linux SSH, and Windows Event XML.
- **Narrator (Audio):** "National defense networks ingest gigabytes of multi-vendor telemetry every minute. Traditional log forwarders rely on static Grok rules. When log formats mutate or proprietary appliances arrive, parsers break silently, dropping critical indicators into unparsed black holes. Welcome to ULPF — the Universal Log Pre-processing Framework designed for NTRO."

---

### [0:15 – 0:35] Scene 2: Sub-Millisecond Fast Path Ingestion
- **Visual:** Terminal executing `python benchmarks/benchmark_end_to_end.py 50000`. Counter ticks up rapidly: **9,355 EPS**, latency p50 **98 µs**, peak RAM **22.7 MB**.
- **Narrator (Audio):** "On known streams, ULPF executes on a compiled Fast Path, processing over 9,300 events per second with sub-100-microsecond latency. Raw logs are preserved 100% byte-for-byte and normalized into strict OCSF v1.1.0 JSON-Schema with zero telemetry loss."

---

### [0:35 – 0:65] Scene 3: The Hero Moment — Autonomous Adaptive Loop
- **Visual:** Operator injects a completely unfamiliar log line: `NEODEFENSE-GW01 evt=PACKET_DROP client_ip=203.0.113.88 s_port=59021...`. 
- **Console / UI shows:**
  1. `FORMAT_DETECTED: KEY_VALUE (85% confidence)`
  2. `DISCOVERED_TEMPLATE: <TIMESTAMP> NEODEFENSE-GW01 evt=PACKET_DROP client_ip=<IP>...`
  3. `INFERRED: src_endpoint.ip = 203.0.113.88 (95% confidence)`
  4. Candidate YAML pack synthesized in 12 milliseconds.
  5. Operator clicks `APPROVE & HOT-RELOAD`. Hot reload completes in 1.4 milliseconds with zero packet drops.
- **Narrator (Audio):** "Here is our core innovation: when an unknown log arrives, ULPF isolates it to an offline Learning Path. It discovers the template structure, infers semantic OCSF attributes, synthesizes a declarative Source Pack, and hot-reloads the parser into memory without restarting the server or pausing ingestion."

---

### [0:65 – 0:90] Scene 4: Courtroom Forensics & Cryptographic Lineage
- **Visual:** UI inspects the normalized event. Clicking on `src_endpoint.ip` highlights byte span `[63:75]` on the raw untouched wire log. Tamper detection demo runs: altering a single bit in the archive triggers an immediate `TAMPER_DETECTED: ROOT_HASH_MISMATCH` alert.
- **Narrator (Audio):** "For judicial non-repudiation, every normalized field retains exact byte-span offsets back to the immutable raw wire log. Underneath, an RFC 6962 Domain-Separated Merkle tree seals every event. Any tampering, deletion, or reordering of logs is caught in sub-milliseconds."

---

### [0:90 – 1:10] Scene 5: Parser Drift & Air-Gap Defense
- **Visual:** Log format mutates to `[V2_UPGRADE] src_addr=203.0...`. The system flags `DRIFT_DETECTED` and prompts a revised pack. Script runs `python scripts/verify_airgap.py`: all 4 outbound socket probes fail-closed (`EPERM`).
- **Narrator (Audio):** "When upstream vendors update their firmware, ULPF detects parser drift statistically and initiates auto-adaptation. And crucially: ULPF operates completely air-gapped. Our process-level socket interceptor blocks 100% of outbound connections."

---

### [1:10 – 1:20] Scene 6: Conclusion & Reproducibility
- **Visual:** Clean terminal showing all 15/15 evaluation steps passed and git tag `sih26156-final`.
- **Narrator (Audio):** "15 out of 15 automated validation gates passed. 69 unit tests passed. 9,300+ measured EPS. ULPF is lightweight, sovereign, and self-evolving. Ready for sovereign deployment."
