# ULPF Grand Jury Technical Evaluation Guide (SIH 26156)

> **Evaluator's Playbook: How to inspect, attack, and mathematically verify ULPF in 20 minutes.**
> Designed for an evaluator or technical auditor with a terminal and a skeptical mindset.

---

## 1. Quick Start (1 Minute)

Ensure dependencies are installed and run the full technical test suite:
```bash
python3 -m pytest -v
```
All **56 automated test suites** should pass in under 15 seconds.

Start the backend and frontend services:
```bash
# Terminal 1: Air-Gapped Backend
cd backend && python3 main.py

# Terminal 2: SOC Console
cd frontend && npm run dev
```

---

## 2. 5 Ways to "Catch Us Out" (Adversarial Verification)

### Test 1: Active Socket Egress Interception (Fail-Closed Air-Gap Proof)
**The Claim**: ULPF enforces strict air-gapped zero external egress at the socket syscall layer, blocking exfiltration attempts even if application code is backdoored.
**How to Catch Us Out**:
1. Run the dedicated egress test:
   ```bash
   python3 -m pytest tests/test_egress_enforcement.py -v
   ```
2. Inspect the startup probe audit in the terminal:
   ```bash
   curl -s -H "X-API-Key: ulpf_admin_secret_key_2026" http://localhost:8000/api/airgap/status | jq .
   ```
   **Expected Result**: `probes_blocked: 4/4`, `status: "PASS_AIRGAP_ENFORCED"`, fail-closed proof confirmed. Attempting any outbound external socket connection throws `PermissionError: [Errno 1] Operation not permitted (ULPF Air-Gap Active)`.

---

### Test 2: Cryptographic WORM Immutability & Duplicate ID Rejection
**The Claim**: The SQLite storage engine enforces single-writer WAL mode, rejects record overwrites (`INSERT OR REPLACE` forbidden), and flags collision tampering in the audit ledger.
**How to Catch Us Out**:
1. Run the storage architecture and collision tests:
   ```bash
   python3 -m pytest tests/test_storage_architecture.py -v
   ```
2. Inspect `/api/audit-logs` after attempting to inject a colliding `event_id`:
   ```bash
   curl -s -H "X-API-Key: ulpf_admin_secret_key_2026" http://localhost:8000/api/audit-logs | jq .
   ```
   **Expected Result**: Tamper attempt is logged with action `INSERT_COLLISION_REJECTED`, leaving the primary record pristine.

---

### Test 3: RFC 6962 Merkle Tree Inclusion Proofs
**The Claim**: Every archived security event is anchored in an RFC 6962 cryptographic Merkle Tree with domain-separated hashing (`0x00` leaf, `0x01` interior node). Any record can be verified independently with a logarithmic audit path.
**How to Catch Us Out**:
1. Ingest an event and test the cryptographic proof:
   ```bash
   python3 -m pytest tests/test_merkle_tree.py tests/test_merkle_api.py -v
   ```
2. Open any record in the SOC Console Log Drawer -> **Forensic Provenance** tab -> Click **"Verify In Ledger"**.
   **Expected Result**: 100% mathematically verified Merkle root and audit path steps. If any byte in the leaf payload or hash is tampered, verification fails immediately.

---

### Test 4: Indian Sovereign PII Redaction (Verhoeff & Luhn Validation)
**The Claim**: Aadhaar numbers are verified via the dihedral group $D_5$ (Verhoeff algorithm) — not naive 12-digit regexes. False positive numbers (like timestamps or serials) are never scrubbed. PAN and Luhn IMEI are strictly validated.
**How to Catch Us Out**:
1. Run the PII coverage suite:
   ```bash
   python3 -m pytest tests/test_pii_coverage.py -v
   ```
2. Test a naive 12-digit number (e.g. `123456789012` - fails Verhoeff) vs a valid Aadhaar number (e.g. `234567890126` - passes Verhoeff).
   **Expected Result**: `123456789012` is preserved as legitimate raw telemetry; `234567890126` is scrubbed with `[AADHAAR_REDACTED:xxxx-xxxx-0126]`.

---

### Test 5: Byte-Level Parity & Lossless Reconstruction Gate
**The Claim**: Parser generation requires round-trip mathematical reconstruction parity before deployment; any parser that alters raw byte sequences is rejected with HTTP 422.
**How to Catch Us Out**:
1. Run the byte-level reconstruction tests:
   ```bash
   python3 -m pytest tests/test_reconstruction.py -v
   ```
2. Test the API verification endpoint directly:
   ```bash
   curl -X POST http://localhost:8000/api/verify-reconstruction \
     -H "Content-Type: application/json" \
     -H "X-API-Key: ulpf_admin_secret_key_2026" \
     -d '{"raw": "user=admin login failed", "parsed_fields": {"user": "admin", "action": "failed"}, "rule": {"reverse_template": "user={user} action={action}"}}' | jq .
   ```
   **Expected Result**: Parity check returns `lossless_verified: false` and reports exact byte-offset diffs where whitespace or punctuation differed.

---

## 3. Real Telemetry Replay (Zero Synthetic Telemetry)

To demonstrate the pipeline with genuine captured honeypots and perimeter telemetry:
```bash
python3 backend/replay_corpus.py --port 5140 --rate 10
```
This replays genuine traces from:
- **Honeynet Project (SotM 34)**: Active brute force attacks against SSH daemons.
- **Cisco ASA Firewall**: Real access-list teardowns and drops.
- **Linux Netfilter / UFW**: Real port-scanning and connection drops.
- **Imperva WAF**: SQL injection signatures in CEF format.
- **Sovereign Telemetry**: Telecom and KYC logs with embedded Verhoeff Aadhaar, PAN, and Luhn IMEI.

---

## 4. Architecture & Engineering Transparency

| Component | Engineering Standard / RFC | Verification Mechanism |
| :--- | :--- | :--- |
| **Normalization** | OCSF 1.1.0 Standard | Multi-signal consensus (signatures + entropy + grammar) |
| **Proof of Ledger** | RFC 6962 Merkle Tree | `GET /api/merkle/proof/{id}` + `POST /api/merkle/verify-proof` |
| **Storage Engine** | SQLite WAL + Immutable JSONL | Single-writer serialization, indexed queries, 0 overwrites |
| **Air-Gap Egress** | POSIX Socket Interception | Fail-closed runtime probe suite, blocks all WAN IP sockets |
| **PII Redactor** | Dihedral $D_5$ Verhoeff / Luhn | Checksum mathematical validation on Aadhaar & IMEI |
| **Forensics** | Signed SHA-256 Bundle | `.zip` with raw.wire, ocsf.json, and integrity manifest |
| **Mandatory Compliance**| CERT-In 6-Hour Disclosure | Automated incident dossier generation with tamper-proof SHA-256 |
