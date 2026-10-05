# ULPF From Zero: A Beginner's Guide to Universal Log Pre-processing

Welcome! If you are new to cybersecurity engineering, log analysis, or the Open Cybersecurity Schema Framework (OCSF), this guide explains the entire Universal Log Pre-processing Framework (ULPF) step by step with clear concepts and real examples.

---

### 1. What is a Log?
A log is a digital timestamped record of an event that happened on a computer, firewall, or network router.
* *Example:* When you enter a password to log into a server, the server writes:
  `Oct 5 09:12:44 auth sshd[4012]: Accepted publickey for admin from 192.168.1.100 port 52311`

### 2. Why do Security Systems Generate Logs?
Security analysts in Security Operations Centers (SOCs) review logs to detect cyberattacks, identify unauthorized logins, and trace security breaches after they occur.

### 3. Why are Logs Different from Each Other?
Every hardware vendor and software author formats logs differently. Cisco firewalls use one syntax, Palo Alto networks use another, Linux servers use syslog, and Windows outputs XML. In an organization like the National Technical Research Organisation (NTRO), analysts face thousands of conflicting formats simultaneously.

### 4. What is Parsing?
Parsing is the process of breaking a raw, unformatted text line into individual structured fields (such as timestamp, source IP, username, and action).
* *Example:* Turning `src=10.0.0.1` into the key-value pair `{"source_ip": "10.0.0.1"}`.

### 5. What is Normalization?
Normalization means converting inconsistent field names from different vendors into a single, uniform standard.
* *Example:* Cisco calls it `outside:198.51.100.4`, while ArcSight CEF calls it `src=198.51.100.4`. Normalization maps both to a single common name: `src_endpoint.ip`.

### 6. What is OCSF?
**OCSF** stands for the **Open Cybersecurity Schema Framework**. It is an open, vendor-neutral standard created by major cybersecurity organizations. Instead of inventing our own custom names, ULPF outputs strict **OCSF v1.1.0** JSON objects so that downstream systems (like Splunk, Elastic, or Microsoft Sentinel) can read the data immediately.

### 7. Why do Parsers Break?
Parsers are traditionally written using static regular expressions ("grok" rules). When a vendor updates their operating system firmware or an engineer changes a configuration, the log format changes slightly (e.g. from `src=1.1.1.1` to `source_ip=1.1.1.1`). Because the static rule expects the old format, the parser fails and the event is dropped.

### 8. What is Parser Drift?
Parser drift describes this exact phenomenon: an existing parser gradually loses accuracy or fails entirely because upstream log syntax evolved over time.

### 9. What is an Unknown Source?
An unknown source is any log format that has never been registered in ULPF's parser database. In conventional tools like Vector or Logstash, unknown logs are thrown into an "unparsed" garbage bin.

### 10. What is Fingerprinting?
When ULPF encounters an unfamiliar log, it inspects the character layout, delimiters (commas, pipes, spaces, colons), and structural markers (such as `CEF:` or `{ "json": ... }`) to identify its underlying wire format without human intervention.

### 11. What is Template Discovery?
Template discovery replaces variable tokens (such as timestamps, IP addresses, numbers, and quoted strings) with generic wildcards `<*>`.
* *Example:*  
  `2026-10-05 NEODEFENSE-GW01 evt=PACKET_DROP client_ip=203.0.113.88`  
  becomes:  
  `<TIMESTAMP> NEODEFENSE-GW01 evt=PACKET_DROP client_ip=<IP>`

### 12. What is Field Inference?
Field inference analyzes the extracted tokens using semantic rules to determine what each token represents.
* *Example:* If a token matches the IPv4 pattern and is preceded by `client_ip=`, ULPF infers with 95% confidence that it should map to OCSF's `src_endpoint.ip`.

### 13. What is a Source Pack?
A **Source Pack** is a clean, declarative YAML file that tells ULPF how to detect a specific log format, extract its fields, and map them into OCSF classes.

### 14. Why is Human Approval Required?
While ULPF can automatically infer mappings, mission-critical national security environments require an operator review step for low-confidence candidate packs. A human operator verifies the proposed schema in the UI before it is promoted to production.

### 15. What is Zero-Downtime Hot Reload?
When a newly approved Source Pack is saved to disk, ULPF reloads it into memory in under **2 milliseconds** using thread-safe dictionary replacement. Ingestion never stops, and not a single inflight log packet is dropped.

### 16. What is the Fast Path?
The **Fast Path** is ULPF's sub-millisecond execution loop for known logs. It processes events at over **4,600 events per second** with a median latency of only **202 microseconds**.

### 17. What is the Learning Path?
The **Learning Path** is the asynchronous, offline loop where unfamiliar or drifted logs are analyzed, clustered, and converted into new Source Packs without slowing down the Fast Path.

### 18. What is Field-Level Lineage?
When an analyst views a normalized field (like `src_endpoint.ip: 203.0.113.88`), ULPF records the exact start and end byte positions `[63:75]` where those characters appeared in the original raw message. This provides definitive proof in court that the normalized data was not fabricated or corrupted by the parser.

### 19. What is Lossless Raw-Wire Preservation?
Before parsing or modifying anything, ULPF writes the exact byte stream of every incoming log directly to an append-only archive and computes its SHA-256 hash. Even if a parser fails, 100% of the raw evidence is safely preserved.

### 20. What is a Merkle Tree?
A **Merkle Tree** is a cryptographic tree of hashes. Every raw log is a "leaf" at the bottom of the tree. Each pair of leaves is hashed together into a parent node, continuing up to a single "Root Hash" at the top. If anyone alters or deletes even a single character in thousands of stored logs, the Root Hash changes immediately, proving that tampering occurred.

### 21. Why is Air-Gap Compliance Essential?
National defense organizations (such as NTRO) operate in isolated networks with no physical or digital connection to the public internet. ULPF is engineered to run 100% offline: it never makes outbound web calls, never uses cloud AI APIs, and actively blocks external socket connections at the kernel level.

### 22. How the Complete System Works Together
```
Raw Log Arrives
     ↓
Stored in Lossless Archive & Hashed (SHA-256)
     ↓
Is format known?
  ├── YES ──> [ FAST PATH: Parse & Normalize to OCSF in 202 µs ]
  │                 ↓
  │           Output to SIEM + Byte Lineage + Merkle Proof
  │
  └── NO  ──> [ LEARNING PATH: Discover Template & Infer Fields ]
                    ↓
              Generate Candidate Source Pack YAML
                    ↓
              Operator Approves in Web UI
                    ↓
              Hot Reload (<2 ms) ──> Promoted to FAST PATH!
```
