# ULPF Production Deployment & Operations Runbook

## 1. System Overview & Deployment Topology

ULPF (Universal Log Pre-processing Framework) is an enterprise telemetry preprocessing layer designed for air-gapped defense enclaves (NTRO) and high-security Security Operations Centers.

```
                      [ External Telemetry: Syslog / HTTP / Files ]
                                            │
                                            ▼
                    ┌───────────────────────────────────────────────┐
                    │               ULPF HOST SERVER                │
                    │  • Ingestion Gateway (Syslog 5514 / HTTP 8000)│
                    │  • FastAPI Backend Daemon                     │
                    │  • Declarative Source Packs (/sources)        │
                    │  • Storage & Quarantine DB (/storage)         │
                    │  • Compiled React UI (/frontend/dist)         │
                    └───────────────────────────────────────────────┘
```

---

## 2. Installation & Quickstart

### Prerequisites
- Linux x86_64 / aarch64 (Ubuntu 22.04 LTS, Debian 12, or RHEL 9 recommended)
- Python 3.10+ (Tested through Python 3.14)
- Node.js 18+ & npm (for frontend building only; runtime requires no Node daemon)
- Zero external internet access required (100% air-gapped capable)

### Clean Installation Procedure
```bash
# 1. Clone or extract ULPF sovereign repository
cd /path/to/ulpf-sih-26156

# 2. Install local Python dependencies in isolated virtual environment
python3 -m venv venv
source venv/bin/activate
pip install -r backend/requirements.txt

# 3. Build frontend static assets
npm --prefix frontend install
npm --prefix frontend run build

# 4. Verify system integrity and air-gap enforcement
./scripts/production_readiness.sh

# 5. Launch the ULPF service
python3 backend/main.py
```
*Service will bind to `http://127.0.0.1:8000` with static UI assets served at `/`.*

---

## 3. Operational Endpoints & API Reference

| Endpoint | Method | Purpose | Role Required |
| :--- | :---: | :--- | :--- |
| `/health` or `/healthz` | GET | Liveness probe for Kubernetes / systemd | Public / Unauth |
| `/ready` or `/readyz` | GET | Readiness probe inspecting queue depth and storage | Public / Unauth |
| `/api/metrics` | GET | Aggregate throughput, event counts, and system metrics | Operator / Admin |
| `/api/live-logs` | POST | High-speed JSON log ingestion sink | Operator / Admin |
| `/api/stream` | GET | Real-time Server-Sent Events (SSE) telemetry feed | Operator / Admin |
| `/api/quarantine` | GET | List and filter quarantined corrupted/unparsed events | Operator / Admin |
| `/api/quarantine/replay` | POST | Replay quarantined event through active parser registry | Operator / Admin |
| `/api/source-packs/history` | GET | View version history and SHA-256 hashes of a pack | Operator / Admin |
| `/api/source-packs/rollback`| POST | Safe atomic rollback to previous source pack version | Admin Only |
| `/api/merkle/verify-proof` | POST | Cryptographic proof verification for audit events | Operator / Admin |

---

## 4. Source Pack Governance & Rollback Runbook

### Promoting an Updated Source Pack
When an operator approves a candidate source pack:
1. The YAML content is sent to `POST /api/generate-parser` or written via `SourcePackLifecycleManager.promote_candidate_pack`.
2. The lifecycle manager backs up the existing active pack to `sources/.versions/<vendor_product>/`.
3. The new pack is validated against ReDoS vulnerability limits.
4. The pack is written atomically via temporary file replacement.
5. Ingestion workers hot-reload the updated registry in `<2 ms` without dropping packets.

### Emergency Rollback Procedure
If a newly promoted parser begins misclassifying events or elevating quarantine volume:
1. Operator issues rollback command via UI or cURL:
   ```bash
   curl -X POST http://127.0.0.1:8000/api/source-packs/rollback \
     -H "Content-Type: application/json" \
     -d '{"vendor": "PaloAlto", "product": "PANOS"}'
   ```
2. The lifecycle manager restores the previous archived version.
3. Call `POST /api/quarantine/replay` to reprocess events that were quarantined during the bad deployment window.

---

## 5. Backup, Maintenance & Disaster Recovery

- **Lossless Raw Archive:** Located at `storage/lossless_archive.jsonl`. This file is append-only. Back up periodically using standard file copy or rsync.
- **SQLite Database:** Located at `storage/ulpf_events.db` and `storage/quarantine.db`. Back up using standard SQLite online backup:
  ```bash
  sqlite3 storage/ulpf_events.db ".backup 'storage/backup_events.db'"
  sqlite3 storage/quarantine.db ".backup 'storage/backup_quarantine.db'"
  ```
- **Service Verification:** Run `./scripts/production_readiness.sh` after any host upgrade to certify that all 15 NTRO gates, 74 tests, and air-gap interceptors are functional.
