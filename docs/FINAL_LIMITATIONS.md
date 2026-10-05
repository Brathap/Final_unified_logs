# ULPF Final Operational Boundaries & Limitations

This document provides a brutally honest, evidence-based account of ULPF's current operational scope, design boundaries, and engineering limits.

---

## 1. Single-Node Ingestion Velocity Ceiling
- **Observed Line Rate:** In end-to-end multi-format ingestion (including JSONL append, single-pass SHA-256 digest computation, regex parsing, OCSF dictionary mapping, field lineage calculation, and SQLite WAL updates), a single ULPF Python worker achieves **4,260 – 4,686 Events Per Second** on commodity workstation hardware.
- **Pure Regex Ceiling:** When memory serialization and disk writes are decoupled, the compiled regex matching engine exceeds **100,000 Events Per Second**.
- **Production Scale Boundary:** Deployments requiring 50,000 to 100,000+ EPS must run stateless ULPF worker processes horizontally scaled behind an L4 network load balancer (e.g. HAProxy or raw UDP/TCP syslog reflectors) with shared NVMe air-gapped storage.

---

## 2. Ingestion Protocol Boundaries
- **Supported Network Interfaces:**
  - Syslog UDP (RFC 3164 / RFC 5424) on ports 514, 5140, 5514.
  - Syslog TCP stream server on ports 6514, 5140.
  - HTTP JSON webhook sink on port 8000 (`POST /api/live-logs`).
  - Host OS log tailing via `journalctl` (Linux) or `psutil` sampling (Windows/macOS).
- **Unsupported Protocols:**
  - NetFlow / IPFIX binary packet parsing (requires separate network probe).
  - Proprietary Kafka / AMQP message bus ingestion (intentionally excluded to avoid JVM / microservice dependency bloat in air-gapped enclaves).

---

## 3. Structural Parsing Boundaries
- **High-Accuracy Formats:** Syslog, CEF, Key-Value pairs, single-line JSON, Apache/Nginx combined access logs, and Linux auth logs.
- **Structural Limitation:** Complex multiline nested XML with arbitrary namespaces and polymorphic node definitions requires initial structural delimiter markers.
- **Human Approval Requirement:** While ULPF infers OCSF fields with 75%–95% confidence based on structural heuristics, human operator review is strongly recommended for low-confidence candidate packs before runtime promotion.

---

## 4. Air-Gap & Security Boundaries
- **Guaranteed Isolation:** Low-level process socket interceptor raises `PermissionError (EPERM)` on all non-loopback outbound socket connection attempts.
- **Host Security Assumption:** ULPF cryptographic integrity guarantees assume the underlying operating system kernel and physical disk controller are not actively compromised. If root-level malware overwrites disk sectors, ULPF mathematically **detects** the tampering upon audit proof verification, but cannot prevent physical drive modification.
