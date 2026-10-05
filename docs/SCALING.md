# AegisGuard-ULPF — Horizontal Scaling & Multi-Collector Architecture

This document specifies the multi-collector scale-out model for AegisGuard-ULPF in high-throughput enterprise deployments (50,000 to 200,000+ EPS).

---

## 1. Single-Worker Throughput vs Cluster Scaling

As documented in our honest limitations:
* **Single Python Worker (Full Persistence):** Sustains **~4,200 – 4,700 EPS** on commodity 4-core hardware when executing end-to-end SQLite WAL insertion, JSONL raw append, SHA-256 calculation, OCSF normalization, and character span lineage.
* **Single Python Worker (In-Memory Pipeline):** Sustains **~11,000 EPS**.
* **High-Volume SOC Scaling Strategy:** Scale horizontally across stateless ULPF worker processes rather than introducing complex distributed brokers (Kafka/Zookeeper) into air-gapped enclaves.

---

## 2. Multi-Collector Shared-Nothing Topology

```
                       [ Network Hardware / Firewalls / EDR ]
                                         │
                                         ▼ Syslog UDP/TCP
                     [ L4 Load Balancer (HAProxy / Keepalived) ]
                      (Consistent Hash / Round-Robin Scheduling)
                                         │
                 ┌───────────────────────┼───────────────────────┐
                 ▼                       ▼                       ▼
        [ Collector Worker 1 ]  [ Collector Worker 2 ]  [ Collector Worker 3 ]
        • Local Memory Queue    • Local Memory Queue    • Local Memory Queue
        • Partition Vault 1     • Partition Vault 2     • Partition Vault 3
        • SQLite WAL 1          • SQLite WAL 2          • SQLite WAL 3
                 │                       │                       │
                 └───────────────────────┼───────────────────────┘
                                         ▼
                 [ Shared Read-Only Source Pack Volume (/sources) ]
```

### Key Scale-Out Properties:
1. **Shared-Nothing State:** Workers do not communicate with each other during live parsing. They do not share distributed mutexes, eliminating cross-node lock contention.
2. **Unified Declarative Packs:** All workers mount a shared read-only NFS or shared NVMe block storage volume containing the YAML Source Packs (`/sources`).
3. **Atomic Hot Reload:** When an operator approves a candidate pack, updating the file triggers inotify events across all workers, synchronizing parsing rules within milliseconds.
4. **Independent Append-Only Vaults:** Each worker writes to its own isolated append file (`storage/lossless_archive_worker_N.jsonl`), preventing disk I/O write contention.

---

## 3. Hierarchical Merkle Root Aggregation

In a multi-worker cluster, how does an auditor verify the integrity of the entire cluster without collecting all records into one database?

### Two-Tier Epoch Aggregation Model:
1. **Worker Partition Roots:** Each worker computes an RFC 6962 Merkle tree root over its local batch (e.g. 10,000 events every 60 seconds):
   $$\text{SubRoot}_1, \text{SubRoot}_2, \dots, \text{SubRoot}_M$$
2. **Cluster Epoch Root:** A lightweight epoch coordinator aggregates the partition roots into a Master Checkpoint Tree:
   $$\text{MasterRoot} = \text{MerkleTree}([\text{SubRoot}_1, \text{SubRoot}_2, \dots, \text{SubRoot}_M])$$
3. **Cluster Inclusion Proof:** To prove an event from Worker 2 was archived, the auditor provides:
   - The local inclusion path from the event to $\text{SubRoot}_2$.
   - The epoch inclusion path from $\text{SubRoot}_2$ to $\text{MasterRoot}$.

This allows independent scale-out up to millions of events per second while preserving mathematical proof-of-custody.
