# ULPF Production Operations Runbook & SRE Guide

## 1. System Architecture & Topology

```
                  [ Multi-Vendor Telemetry Sources ]
                  Syslog UDP (514/5514) / Syslog TCP (6514) / HTTP Webhook
                                 │
                                 ▼
                 ┌────────────────────────────────┐
                 │    ULPF INGESTION GATEWAY      │
                 │  • Bounded Queue (50k slots)   │
                 │  • 85% Backpressure Throttling │
                 └───────────────┬────────────────┘
                                 │
                                 ▼
                 ┌────────────────────────────────┐
                 │       ADAPTIVE ENGINE          │
                 │  • Fast Path: Compiled Packs   │
                 │  • Learning Path: Clustering   │
                 │  • Drift: Rolling Stability    │
                 └───────────────┬────────────────┘
                                 │
                 ┌───────────────┼────────────────┐
                 ▼               ▼                ▼
         [ Normalized OCSF ] [ Raw Archive ] [ Quarantine DB ]
         SQLite WAL + Index  Append-Only     Isolated SQLite
         • /api/metrics      • Lossless wire • /api/quarantine
         • /api/stream       • Merkle proof  • /api/quarantine/replay
```

---

## 2. Health Monitoring & Observability

### Health Probes
- **Liveness:** `GET /health` or `GET /healthz`  
  Returns HTTP 200 `{"status": "healthy", "service": "ULPF", "version": "2.0.0"}`.
- **Readiness:** `GET /ready` or `GET /readyz`  
  Returns HTTP 200 `{"status": "ready", "queue_depth": <int>, "backpressure_active": <bool>}`.

### Queue Backpressure & Watermarks
- **Capacity:** 50,000 slots in-memory bounded queue.
- **High Watermark:** 85% (42,500 slots). When breached, `is_backpressure_active` trips and HTTP webhooks receive HTTP 429 flow-control throttling until queue drains.

---

## 3. Emergency Operations & Incident Response

### Incident 1: Defective Parser Rollback
If a newly promoted Source Pack degrades parsing or spikes quarantine rates:
```bash
curl -X POST http://127.0.0.1:8000/api/source-packs/rollback \
  -H "X-API-Key: ulpf_admin_secret_key_2026" \
  -H "Content-Type: application/json" \
  -d '{"vendor": "Cisco", "product": "ASA"}'
```
*Restores previous archived version in `<2 ms` without dropping packets.*

### Incident 2: Quarantined Event Inspection & Replay
1. Inspect pending quarantined events:
   ```bash
   curl http://127.0.0.1:8000/api/quarantine -H "X-API-Key: ulpf_operator_key_2026"
   ```
2. Replay an event once a corrected Source Pack is active:
   ```bash
   curl -X POST http://127.0.0.1:8000/api/quarantine/replay \
     -H "X-API-Key: ulpf_operator_key_2026" \
     -H "Content-Type: application/json" \
     -d '{"quarantine_id": "quar-1728100000000-abcd1234"}'
   ```

### Incident 3: Cryptographic Tamper Audit
Verify an event's inclusion in the RFC 6962 Domain Merkle tree:
```bash
curl -X POST http://127.0.0.1:8000/api/merkle/verify-proof \
  -H "X-API-Key: ulpf_operator_key_2026" \
  -H "Content-Type: application/json" \
  -d '{"event_id": "rec-1791179958717-ecad145c"}'
```
