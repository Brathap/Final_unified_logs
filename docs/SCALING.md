# High-Throughput Ingestion & Scaling Architecture
**Document:** `docs/SCALING.md`  
**Target:** 1 Billion Logs / Day (NTRO SIH 26156 Scale Target)  
**Execution Command:** `python3 benchmarks/benchmark_scaling.py`

---

## 1. Arithmetic vs Measured Engineering Realities

When evaluating claims of processing "1 Billion events per day", rigorous systems engineering distinguishes between mathematical requirements, measured node capacity, and distributed designs:

### The Mathematics:
$$\text{Required Ingestion Rate} = \frac{1,000,000,000\text{ events}}{86,400\text{ seconds/day}} \approx \mathbf{11,574.07\text{ EPS (sustained)}}$$
- Assuming typical peak-to-average traffic bursts (2.5x multiplier), peak capacity requirement: **~28,935 EPS**.

### The Measured Reality on Single Node:
Tested on host hardware (**AMD PRO A4-3350B APU, 4 Cores @ 2.0 GHz, 3.3 GB RAM, Linux x86_64**):
- **Pure In-Memory Regex Parsing**: **> 100,000 EPS** (Measured in `benchmark_end_to_end.py`).
- **Streaming Pipeline (In-memory routing + byte lineage + batch Merkle checkpoint)**: **11,030 EPS** (Measured).
- **Full End-to-End Persistence (Routing + Byte Spans + SQLite WAL commit per batch + Merkle ledger)**:
  - **1 Worker**: **2,165 – 4,493 EPS** (Measured).
  - **2 Workers**: **2,809 EPS** (Measured).
  - **4 Workers**: **1,948 EPS** (Disk I/O constrained on commodity spinning/shared storage).

> **Honest Conclusion:** A single Python worker on commodity hardware cannot sustain 11,574 EPS with synchronous disk write persistence. Achieving 1B events/day sustained with full persistence requires horizontal partitioning across multiple worker nodes or high-performance streaming brokers.

---

## 2. Horizontal Scaling Architecture: Kafka / Redpanda Partitioned Design
*(Status: **Architectural Design, Not Measured on Single Commodity Host**)*

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

### Partitioning Guarantees:
1. **Stateless Normalization Workers**: Each worker consumes from assigned Kafka/Redpanda partitions, performs regex extraction, byte span coordinate calculation, and PII scrubbing independently.
2. **Per-Shard Merkle Chains**: Each worker maintains a local append-only Merkle tree over its assigned partition.
3. **Cross-Shard Root Checkpoint**: Every checkpoint window (e.g. 10 seconds or 100,000 events), worker heads are submitted to an Aggregator which builds an enclave-level Top Root and signs it with an Ed25519 private key.
