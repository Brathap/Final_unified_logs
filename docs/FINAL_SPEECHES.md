# SIH 26156 — Final Presentation Speech Rehearsals (90s, 3m, 5m)

---

## 1. The 90-Second Rapid-Pitch Speech (`FINAL_90_SECOND_SPEECH.md`)
*(Target Duration: Exactly 90 seconds. Ideal for preliminary judging rounds and speed evaluations.)*

"Distinguished evaluators, in national defense and intelligence operations, agencies like NTRO ingest thousands of heterogeneous telemetry formats every minute — Cisco firewalls, Linux servers, Windows XML, and bespoke military applications.

Traditional pipelines like Vector and Logstash rely on static rules written by human engineers. When log formats mutate or unfamiliar battlefield systems arrive, these static tools break silently, dropping critical indicators into dead-letter queues.

What happens when the parser doesn't exist?

ULPF introduces **Adaptive Source Intelligence** — a sovereign closed loop that turns unknown or drifted security logs into validated, production-ready parsers entirely offline.

Here is the live proof:
When an unknown log arrives, ULPF does not drop it or stall high-speed ingestion. It routes the event to an asynchronous, air-gapped Learning Path. In under 15 milliseconds, it discovers the template, infers semantic OCSF attributes with transparent confidence scores, and synthesizes a complete declarative Source Pack.

The operator clicks 'Approve', and the engine hot-reloads the new parser into runtime memory in under two milliseconds with zero downtime.

Instantly, that same log streams through the compiled Fast Path, normalizing into OCSF at over **4,600 sustained events per second** with a median latency of only **202 microseconds**.

Every extracted attribute retains exact byte-level lineage back to the raw wire payload, secured by an **RFC 6962 Domain-Separated Merkle tree** that detects single-byte tampering in sub-milliseconds.

All 15 NTRO requirements verified. 69 unit tests passing. Zero cloud dependencies. 100% fail-closed air-gap defense.

ULPF does not merely process known logs — it automates the journey from unknown data to a validated production parser."

---

## 2. The 3-Minute Technical Demonstration Speech (`FINAL_3_MINUTE_SPEECH.md`)
*(Target Duration: Exactly 180 seconds. Ideal for main presentation rounds with live CLI or UI demo.)*

"Good morning, judges. Today we are presenting the **Universal Log Pre-processing Framework (ULPF)** for SIH 26156, sponsored by NTRO.

### The Problem (30s)
National security infrastructure suffers from telemetry fragmentation. Every vendor uses different key names, timestamps, and syntax. Security Operations Centers face three critical failures:
First, parser development is a bottleneck — writing Grok rules takes days.
Second, firmware upgrades trigger parser drift, causing silent data loss.
Third, commercial pipelines require cloud connectivity, violating sovereign air-gapped isolation.

### The Innovation: Decoupled Dual-Path Architecture (45s)
To solve this, ULPF decouples execution into a **Fast Path** and a **Learning Path**.
On the Fast Path, pre-compiled declarative Source Packs process known logs at **4,686 sustained events per second** with a median latency of **202 microseconds** and a streaming footprint of just **23.9 megabytes**.
When an unfamiliar log enters the pipeline, it is routed to our air-gapped Learning Path buffer without slowing down high-speed traffic.

### The Live Demonstration (60s)
Observe our console:
1. We inject an unfamiliar log from an unmapped defense gateway: `NEODEFENSE-GW01 evt=PACKET_DROP client_ip=203.0.113.88`.
2. Notice the real-time detection: ULPF fingerprints the key-value format, discovers the structural template, and infers OCSF fields with 95% confidence.
3. It generates a candidate Source Pack in declarative YAML.
4. The operator clicks Approve. Through a thread-safe atomic swap, the parser is hot-reloaded into memory in under two milliseconds.
5. We send the same log again. Notice the transition: it immediately hits the Fast Path, normalized into OCSF Class 4001 Network Activity at full line rate.

### Forensic Integrity & Sovereign Air-Gap (45s)
For courtroom admissibility, ULPF preserves 100% of raw bytes and links every OCSF attribute to its exact `[start, end]` byte offsets in the original wire text.
Underneath, an **RFC 6962 Domain-Separated Merkle Tree** seals every event. If an insider modifies even a single byte in the raw archive, our audit engine flags a Root Hash mismatch in under one millisecond.
Finally, we enforce a process-level socket interceptor that actively blocks non-loopback egress with fail-closed kernel protection. Zero cloud calls. Zero external LLMs.

15 out of 15 NTRO criteria verified. 69 passing regression tests. ULPF is lightweight, sovereign, and self-evolving."

---

## 3. The 5-Minute In-Depth Defense Speech (`FINAL_5_MINUTE_SPEECH.md`)
*(Target Duration: Exactly 300 seconds. Ideal for grand finale panels and comprehensive technical Q&A.)*

*(Combines the 3-minute technical demonstration with in-depth explanations of Indian PII Verhoeff checksums, zero-width evasion mitigation, columnar Parquet exporting, and the production horizontal scalability architecture backed by L4 load balancers and partitioned Merkle trees.)*
