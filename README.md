# Universal Log Pre-processing Framework (ULPF) - SIH 26156
**National Technical Research Organisation (NTRO) · Enterprise Air-Gapped Cyber Security Architecture**

A high-performance, vendor-agnostic, privacy-preserving, and air-gappable log ingestion, parsing, normalization, and threat correlation engine built with **Vector.dev**, **Python/FastAPI**, and **React (Vite + Tailwind + Lucide + Recharts + Framer Motion)**.

---

## 🌟 Problem Statement & Expected Solutions Alignment

| SIH Requirement | How ULPF Solves It Entirely | Implementation |
|---|---|---|
| **a) Lossless raw event preservation** | Full wire message preserved in Base64 encoding alongside deterministic SHA-256 cryptographic digest before any transformation | [`vector/vector.yaml`](file:///home/Brathap/ulpf-sih-26156/vector/vector.yaml) & [`backend/main.py`](file:///home/Brathap/ulpf-sih-26156/backend/main.py) |
| **b) Extract & parse source-specific attributes** | High-speed regex and delimiter parsers for Cisco ASA, Palo Alto PAN-OS, Linux SSHD, Imperva CEF, Windows Security Events | [`vector/vector.yaml`](file:///home/Brathap/ulpf-sih-26156/vector/vector.yaml) & [`backend/simulate_firehose.py`](file:///home/Brathap/ulpf-sih-26156/backend/simulate_firehose.py) |
| **c) Normalize fields into common taxonomy** | Standardized Open Cybersecurity Schema Framework (**OCSF v1.1.0**) Class 4001 (Network Activity), Class 3002 (IAM), Class 2001 (Security Finding) | [`vector/vector.yaml`](file:///home/Brathap/ulpf-sih-26156/vector/vector.yaml), [`frontend/src/types.ts`](file:///home/Brathap/ulpf-sih-26156/frontend/src/types.ts) |
| **d) Traceability between normalized & original events** | Cryptographic hash matching, original Base64 payload, and side-by-side diff in forensic log inspector | [`frontend/src/components/LogDrawer.tsx`](file:///home/Brathap/ulpf-sih-26156/frontend/src/components/LogDrawer.tsx) |
| **e) Plug-and-play onboarding of new log sources** | AI Mapper Studio allowing SecOps analysts to paste raw samples, map attributes interactively, and deploy hot-reloaded `.vrl` parsers | [`frontend/src/components/AiMapper.tsx`](file:///home/Brathap/ulpf-sih-26156/frontend/src/components/AiMapper.tsx), [`backend/main.py`](file:///home/Brathap/ulpf-sih-26156/backend/main.py) |
| **f) Unified enterprise visibility** | Live SOC Cyber Dashboard featuring ingestion velocity graphs, threat breakdown, category doughnuts, and forensic audit trail | [`frontend/src/components/LiveStream.tsx`](file:///home/Brathap/ulpf-sih-26156/frontend/src/components/LiveStream.tsx), [`frontend/src/components/TelemetryMetrics.tsx`](file:///home/Brathap/ulpf-sih-26156/frontend/src/components/TelemetryMetrics.tsx) |
| **g) Efficient SIEM & Data Lake integration** | Standard JSON streaming endpoints, webhook sinks (`/api/live-logs`), and Server-Sent Events (`/api/stream`) | [`backend/main.py`](file:///home/Brathap/ulpf-sih-26156/backend/main.py) |
| **h) AI/ML-ready analytics** | Clean, typed OCSF schema records enriched with threat intelligence (APT29, Lazarus, Volt Typhoon, Sandworm, LockBit) | [`backend/threat_intel.csv`](file:///home/Brathap/ulpf-sih-26156/backend/threat_intel.csv) |
| **i) Reduced parser development effort** | Autonomous code generator producing production-ready Vector Remap Language (VRL) configurations on the fly | [`backend/main.py:generate_parser`](file:///home/Brathap/ulpf-sih-26156/backend/main.py#L168-L222) |
| **j) Air-gapped network deployable** | Zero external cloud egress, offline threat intel CSV lookup, local SQLite/in-memory buffering, and dual-layer UDP fallback | [`frontend/src/components/AirGapProvenance.tsx`](file:///home/Brathap/ulpf-sih-26156/frontend/src/components/AirGapProvenance.tsx) |
| **k) Container packaged** | Multi-stage Dockerfile and docker-compose orchestration with internal isolated air-gap network bridge | [`Dockerfile`](file:///home/Brathap/ulpf-sih-26156/Dockerfile), [`docker-compose.yml`](file:///home/Brathap/ulpf-sih-26156/docker-compose.yml) |

---

## 🏗️ Architectural Topology

```
+------------------------------------------------------------------------------------------------+
|                                  ULPF PIPELINE ARCHITECTURE                                    |
+------------------------------------------------------------------------------------------------+
| 1. Heterogeneous Sources: Cisco ASA, Linux Auth (sshd), Imperva WAF CEF, Palo Alto PAN-OS     |
|                           (Blasted via UDP Port 5140 [Vector] / Port 514 [Syslog Fallback])    |
|                                       │                                                        |
|                                       ▼                                                        |
| 2. Vector Remap (VRL):   • 2GB Disk-backed ingestion buffer (Zero dropped logs)                |
|                          • Pristine Base64 encoding + Cryptographic SHA-256 wire hash          |
|                          • Indian Aadhaar PII Redaction (12-digit numeric regex scrubber)      |
|                          • In-memory Threat Intel Table (APT29, Sandworm, LockBit, Lazarus)    |
|                          • OCSF v1.1.0 Standard Class Projection (2001, 3002, 4001)            |
|                                       │                                                        |
|                                       ▼                                                        |
| 3. FastAPI Gateway:      • POST /api/live-logs (Vector HTTP Sink)                              |
|                          • GET /api/stream (High-performance Server-Sent Events)               |
|                          • POST /api/generate-parser (Hot-reload VRL Compiler)                |
|                          • Embedded Async UDP Listener (Air-gapped fallback for Port 514/5140) |
|                                       │                                                        |
|                                       ▼                                                        |
| 4. SOC Cyber Dashboard:  • Live Ingestion Feed with Real-time Filtering & Search               |
|                          • Deep Forensic Log Inspector (OCSF JSON, Hash Provenance, Raw Diff)  |
|                          • Recharts Real-Time Velocity Area & Threat Attribution Radar         |
|                          • Plug-and-Play AI Schema Studio for Custom Device Onboarding         |
|                          • Air-Gap Cryptographic Provenance & Audit Fabric                     |
+------------------------------------------------------------------------------------------------+
```

---

## 🚀 Quick Start (One Command)

### Prerequisites
- **Python 3.10+**
- **Node.js 18+ & npm**
- **Vector** (Optional - if present in PATH, it runs natively; otherwise the embedded Python UDP engine handles pipeline processing seamlessly)

### Linux / macOS
```bash
git clone <repo-url>
cd ulpf-sih-26156
chmod +x start_framework.sh
./start_framework.sh
```

### Windows
```cmd
cd ulpf-sih-26156
start_framework.bat
```

### Docker Container Deployment (Air-Gapped Ready)
```bash
docker compose up --build
```

---

## 🌐 Endpoints & Services

- 🖥️ **SOC Cyber Dashboard**: [http://localhost:5173](http://localhost:5173)
- 🔌 **FastAPI Engine & Interactive Swagger Docs**: [http://localhost:8000/docs](http://localhost:8000/docs)
- 📡 **Vector UDP Ingestion Port**: `127.0.0.1:5140`
- 📡 **Syslog UDP Ingestion Port**: `127.0.0.1:514` (fallback `5514`)

---

## 🛡️ Key Features Deep Dive

### 1. Vector Remap Language (VRL) Pipeline (`vector/vector.yaml`)
- **OCSF Standard Normalization**: Normalizes disparate logs into Open Cybersecurity Schema Framework v1.1.0:
  - Class `4001`: Network Activity (Cisco ASA, Firewall ACLs, VPN sessions)
  - Class `3002`: Identity & Access Management (SSHD, Windows Security Event 4625)
  - Class `2001`: Security Finding (Imperva WAF, Cloudflare Edge WAF, SQLi detection)
- **Named Entity PII Scrubbing**: Multi-entity redaction engine supporting Verhoeff-validated Aadhaar (avoiding false-positives on timestamps/order IDs), PAN, Indian mobile numbers, emails, and Luhn-validated IMEI numbers.
- **Threat Intel Enrichment**: Real-time cross-referencing against local [`threat_intel.csv`](file:///home/Brathap/ulpf-sih-26156/backend/threat_intel.csv) mapping malicious IPs to threat groups (APT29, LazarusGroup, Sandworm, VoltTyphoon, LockBit), versioned with offline manifest verification.
- **Forensic Non-Repudiation**: Computes deterministic SHA-256 integrity hash and Base64 wire capture before applying transformations.

### 2. Autonomous AI Schema Studio (`frontend/src/components/AiMapper.tsx`)
- Secure interactive UI for onboarding proprietary devices.
- Allows pasting raw vendor samples, mapping source attributes to OCSF target fields, and clicking **Deploy Parser to Vector**.
- Hot-reloads and writes a `.vrl` script into [`vector/`](file:///home/Brathap/ulpf-sih-26156/vector/) on the fly.

### 3. Air-Gap Cryptographic Provenance (`frontend/src/components/AirGapProvenance.tsx`)
- Standard Web Crypto SHA-256 interactive validator for verifying evidentiary chain-of-custody.
- Ring buffer backpressure tracking and verified zero external egress fail-closed perimeter.

---

## 🧪 Testing the Framework

### 1. Grand Jury Evaluation Guide (Evaluator's Playbook)
For evaluators, technical judges, and red-team auditors:
👉 **[Read the Full Evaluation Guide (`docs/EVALUATION-GUIDE.md`)](file:///home/Brathap/ulpf-sih-26156/docs/EVALUATION-GUIDE.md)** for 5 step-by-step methods to test and attempt to catch the system out in under 20 minutes.

### 2. Run Complete Automated Test Suite
All 14 security and architecture requirements are covered by automated unit and integration tests:
```bash
pytest -v
```

Tests include:
- `tests/test_merkle_tree.py` & `tests/test_merkle_api.py`: RFC 6962 cryptographic Merkle Tree inclusion proofs and verification endpoints.
- `tests/test_storage_architecture.py`: 10k event ingestion, <50ms query latency, SQLite WAL concurrency, and collision rejection.
- `tests/test_egress_enforcement.py`: Socket interception proof for TCP, UDP, DNS, confirming fail-closed air-gap.
- `tests/test_pii_coverage.py`: Verhoeff-validated Aadhaar, PAN format check, email, IMEI Luhn checks, false positive/negative validation.
- `tests/test_threat_intel_update.py`: SHA-256 checksum-verified offline manifest imports, versioning, audit logging.
- `tests/test_auth_rbac.py`: API key / Bearer token authentication, operator vs admin RBAC, SQLite audit ledger logging.
- `tests/test_ip_extraction.py`: Per-source VRL grok/dissect and IPv4/IPv6 extraction with malformed line handling.
- `tests/test_forensic_bundle.py`: ZIP evidence packaging with unrepudiated SHA-256 integrity manifest.
- `tests/test_reconstruction.py`: Byte-level reverse-template round-trip verification with exact offset diffs.
- `tests/test_certin_export.py`: CERT-In 6-Hour incident reporting format and schema drift monitoring.
- `tests/test_onboarding_consensus.py`: Multi-signal consensus (signatures, delimiter entropy, structural grammar).
- `tests/test_deep_resilience.py`: Sustained high throughput, client disconnection lifecycle, and memory bounds.

### 3. Real Telemetry Replay (Zero Synthetic Data)
To replay genuine captured Honeynet SotM 34, Cisco ASA, and Linux UFW logs into the air-gapped pipeline:
```bash
python3 backend/replay_corpus.py --port 5140 --rate 10
```

### 4. Test Ingestion Webhook Manually
```bash
curl -X POST http://localhost:8000/api/live-logs \
  -H "Content-Type: application/json" \
  -H "X-API-Key: ulpf_admin_secret_key_2026" \
  -d '{"traceability":{"raw_sha256":"test_hash","sanitized_raw":"CEF:0|Imperva|WAF|14.0|SQLI|SQL Injection|9|src=198.51.100.23 dst=10.1.1.20"},"normalized_data":{"class_uid":2001,"category_name":"Security Finding","activity_name":"WAF SQLi Block","severity":"Critical","severity_id":5,"src_endpoint":{"ip":"198.51.100.23"},"dst_endpoint":{"ip":"10.1.1.20"},"enrichment":{"is_malicious":true,"threat_actor":"APT29"},"compliance":{"pii_redacted":false}}}'
```

---

## 🔒 Technical Transparency & Architectural Notes

| Component | Technical Implementation Status | Operational Details |
|---|---|---|
| **Egress Enforcement** | ✅ Fully Functional & Tested | Python socket interceptor monkeypatches TCP `connect()`, UDP `sendto()`/`sendmsg()`, and DNS `gethostbyname()` to block non-loopback traffic at kernel API boundary. Verified with startup self-test. |
| **Proof of Ledger** | ✅ RFC 6962 Merkle Tree | Domain-separated SHA-256 leaves (`0x00`) and interior nodes (`0x01`). Exposes logarithmic inclusion proof API (`/api/merkle/proof/{id}`) with mathematical verification. |
| **Storage Architecture** | ✅ Fully Functional & Tested | SQLite in WAL mode with single-writer thread queue, indexed analytical tables, and append-only raw JSONL ledger. Duplicate ID collisions are rejected and logged to audit table. |
| **WORM Guarantees** | ⚠️ Software-Level Only | Log files are software-enforced append-only (`mode="a"`). True hardware WORM requires physical optical write-once media or hardware-level S3 Object Lock. |
| **Reconstruction Verification** | ✅ Fully Functional & Tested | `backend/reconstruction_verifier.py` byte-compares candidate reconstruction against raw wire bytes; gates parser deployment on bit-exact parity. |
| **Authentication & RBAC** | ✅ Fully Functional & Tested | `X-API-Key` and `Authorization: Bearer` middleware across all endpoints, separating `operator` from `admin` roles, backed by immutable audit ledger. |
| **PII Redaction** | ✅ Fully Functional & Tested | Verhoeff checksum algorithm for 12-digit Indian Aadhaar, Income Tax PAN regex, email, and Luhn IMEI scrubber. Replaced boolean flag with typed tags in `pii_redacted_types`. |
| **Simulation Transparency** | ✅ Fully Functional | Demo synthetic events are marked with `is_simulated: true` and rendered with a visible `[SIMULATED]` tag. Client-side hash is explicitly documented as non-cryptographic demo hash. |


