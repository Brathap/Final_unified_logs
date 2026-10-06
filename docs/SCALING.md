# High-Throughput Ingestion & Scaling Architecture
**Document:** `docs/SCALING.md`  
**Target:** 1 Billion Logs / Day (NTRO SIH 26156 Scale Target)  
**Execution Command:** `python3 benchmarks/benchmark_scaling.py`

---

## 1. Arithmetic Requirement vs Measured Engineering Capacity

When evaluating claims of processing "1 Billion events per day", rigorous systems engineering distinguishes between mathematical requirements, measured node capacity, and distributed designs:

### The Mathematics:
$$\text{Required Ingestion Rate} = \frac{1,000,000,000\text{ events}}{86,400\text{ seconds/day}} \approx \mathbf{11,574.07\text{ EPS (sustained)}}$$
- Assuming typical peak-to-average traffic bursts (2.5x multiplier), peak capacity requirement: **~28,935 EPS**.

### The Measured Reality on Single Node:
Tested on host hardware (**AMD PRO A4-3350B APU, 4 Cores @ 2.0 GHz, 3.3 GB RAM, Linux x86_64, Python 3.14.6**):
- **Pure In-Memory Regex Parsing**: **> 100,000 EPS** (Measured in `benchmark_end_to_end.py`).
- **Streaming Pipeline (In-memory routing + byte lineage + batch Merkle checkpoint)**: **11,030 EPS** (Measured).
- **Full End-to-End Persistence (Routing + Byte Spans + per-shard SQLite WAL + per-shard Merkle ledger)**:
  - **1 Worker**: **2,466 EPS** (Median across 3 runs: 2,466 / 2,490 / 2,442).
  - **2 Workers**: **3,682 EPS** (Median across 3 runs: 3,637 / 3,899 / 3,682) — **+49.3% throughput gain**.
  - **4 Workers**: **4,625 EPS** (Median across 3 runs: 4,601 / 4,625 / 4,704) — **+87.5% throughput gain**.
  - **8 Workers**: **3,914 EPS** (Median across 3 runs: 3,949 / 3,914 / 3,623) — context switching degradation on a 4-core CPU.

> **Honest Conclusion:** A single commodity 4-core machine achieves 4,625 EPS with full disk persistence. Reaching the full 1B/day sustained target (11,574 EPS) requires a cluster of ~3 to 5 parallel stateless worker nodes or high-performance streaming brokers.

---

## 2. cProfile Bottleneck Analysis & Profiling Report

Profiling the multi-worker pipeline via `cProfile` reveals the mechanical performance characteristics:

1. **Worker Scaling**: Moving from per-row `INSERT` to batched `conn.executemany()` resolved SQLite lock contention. Each worker writes to its own isolated shard database (`scale_wN_shard_X.db`), allowing 4 workers to achieve 4,625 EPS on 4 physical cores.
2. **CPU Over-Subscription (8 workers on 4 cores)**: Throughput peaks at 4 workers (4,625 EPS) and degrades at 8 workers (3,914 EPS). Profile data shows that on a 4-core CPU, running 8 worker processes introduces significant IPC synchronization overhead (`multiprocessing.synchronize SemLock.acquire` and context switching).
3. **Lineage Overhead**: Exact substring offset locating (`raw_text.find()`) consumes ~15% of total worker CPU, providing bit-exact coordinate lineage with predictable sub-millisecond execution.

---

## 3. Horizontal Scaling Architecture: Kafka / Redpanda Partitioned Design
*(Status: **Architecturally Designed, Not Measured on Single Host**)*

To achieve enterprise multi-million EPS scale in classified military or critical infrastructure environments, AegisGuard-ULPF is architected to operate as a stateless consumer group behind a partitioned distributed log:

```
                            [ Ingest Fleet: 10 Gbps / UDP / TCP / TLS ]
                                                │
                                                ▼
                   ┌─────────────────────────────────────────────────────────┐
                   │    Distributed Log Broker (Kafka / Redpanda Cluster)    │
                   │    Partition Key: hash(src_ip, appliance_id) % N        │
                   └───────┬─────────────────────────┬───────────────────────┬─┘
                           │                         │                       │
                           ▼                         ▼                       ▼
                   ┌──────────────┐          ┌──────────────┐        ┌──────────────┐
                   │ ULPF Worker  │          │ ULPF Worker  │        │ ULPF Worker  │
                   │   Shard 0    │          │   Shard 1    │        │   Shard 2    │
                   └──────┬───────┘          └──────┬───────┘        └──────┬───────┘
                          │                         │                       │
                 (Per-Shard Merkle)        (Per-Shard Merkle)      (Per-Shard Merkle)
                          │                         │                       │
                          └─────────────────────────┼───────────────────────┘
                                                    │
                                                    ▼
                                    ┌───────────────────────────────┐
                                    │ Cross-Shard Merkle Aggregator │
                                    │   (RFC 6962 Top Root Hash)    │
                                    └───────────────────────────────┘
```
