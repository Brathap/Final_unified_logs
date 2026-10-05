# Empirical Benchmark Methodology & Reproducibility Report

This document details the exact hardware testbench, execution harness, benchmark methodology, and variance profile for ULPF.

---

## 1. Hardware & System Testbed Environment

All benchmarks are measured directly on the host machine without hardware virtualization:
- **Processor:** AMD PRO A4-3350B APU with Radeon R4 Graphics (4 Cores / 4 Threads @ 2.0 GHz)
- **Host Architecture:** Linux x86_64 (`kernel 6.6+`)
- **System Memory:** 3.3 GB DDR3 RAM (Swap: 1.6 GB)
- **Runtime Environment:** Python 3.14.6 (64-bit) running natively
- **Storage Subsystem:** Local SSD / Ext4 filesystem
- **Process Isolation:** Native air-gapped process execution; zero external daemons or network dependencies.

---

## 2. Measurement Methodology & Workload Composition

The benchmark suite (`benchmarks/benchmark_end_to_end.py`) evaluates end-to-end stream processing across a cyclical corpus of 5 realistic enterprise log sources:
1. **Cisco ASA Firewall:** `%ASA-6-302013` inbound connection builds and teardowns.
2. **Imperva WAF (CEF):** `CEF:0|Imperva|SecureSphere` XSS attack blocks.
3. **Linux SSHD Auth:** Failed & accepted public key logins.
4. **ArcSight CEF WAF:** SQL injection signatures.
5. **Cisco ASA Session Teardowns:** Byte count and session duration metrics.

### End-to-End Pipeline Steps Measured Per Event:
For every individual log event in the benchmark run, the harness executes:
1. **Source Pack Routing:** Deterministic fingerprint evaluation and signature dispatch.
2. **Grammar & Attribute Extraction:** Regex tokenization into structured dictionaries.
3. **OCSF v1.1.0 Taxonomy Mapping:** Mapping raw vendor attributes into standard classes (`4001`, `3002`, `2001`).
4. **Exact Field Lineage Calculation:** Computing character start/end pointers in the wire payload.
5. **Cryptographic Golden Record Generation:** Base64 wire encoding and SHA-256 wire digest.
6. **Merkle Tree Checkpoint:** Batch RFC 6962 leaf hashing (`0x00 || hash`) and interior node aggregation (`0x01 || left || right`).

---

## 3. Measured Performance & Variance Profile

Depending on machine load and disk synchronization, throughput exhibits natural variance.

### Workload: 25,000 Live Events (Measured on Quiet Machine)
* **Ingestion Velocity:** **11,030 EPS**
* **Total Execution Time:** 2.267 seconds
* **Latency p50:** 85.4 µs
* **Latency p95:** 108.8 µs
* **Latency p99:** 128.1 µs
* **Peak Latency:** 595.0 µs
* **Merkle Batch Checkpoint (1,000 leaves):** 9.05 ms
* **Peak Resident RAM:** 25.2 MB RSS

### Workload: 10,000 Live Events with Full Disk Archive & DB WAL Flush (Loaded Machine)
* **Ingestion Velocity:** **4,493 – 4,686 EPS**
* **Total Execution Time:** 2.16 – 2.23 seconds
* **Latency p50:** 203.6 – 209.2 µs
* **Latency p95:** 259.6 – 272.8 µs
* **Latency p99:** 323.9 – 378.8 µs
* **Peak Latency:** 1.4 – 2.4 ms
* **Peak Resident RAM:** 23.9 – 24.1 MB RSS

### Throughput Spread:
- **Pure In-Memory Regex Matching:** **> 100,000 EPS** (isolated regex extraction, no I/O)
- **Streaming Pipeline (In-Memory Routing + Lineage + Merkle):** **~10,000 – 11,500 EPS**
- **Full End-to-End Persistence (SQLite WAL + JSONL Append + PII Scrubber):** **~4,200 – 4,700 EPS**

---

## 4. How to Reproduce These Numbers Yourself

Run the benchmark harness directly with your desired event count:

```bash
# Run standard 25,000-event benchmark
python3 benchmarks/benchmark_end_to_end.py 25000

# Or run standard 10,000-event benchmark
python3 benchmarks/benchmark_end_to_end.py 10000

# Or run the full production readiness suite (includes tests, airgap audit, and benchmark)
./scripts/production_readiness.sh
```
