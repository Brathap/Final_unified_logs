# SIH 26156 — Final Baseline Lock

## 1. Commit & Repository Verification
- **Git Commit:** `a92f96b`
- **Git Tag:** `sih26156-final`
- **Branch:** `enterprise-ui-polish`
- **Working Tree State:** Clean (Zero uncommitted code changes)
- **Environment:** Linux x86_64, Python 3.14.6, Node.js v20.x, Vite v8.3.0
- **Timestamp:** 2026-10-05 06:01:00 UTC (11:31:00 IST)

---

## 2. Automated Verification Gate Results

| Subsystem Verification | Command | Result | Gate Status |
| :--- | :--- | :--- | :--- |
| **Comprehensive NTRO Evaluation** | `python evaluate.py` | 15/15 Requirements Passed | **PASS** |
| **Full Regression Suite** | `pytest tests/ -v` | 69/69 Tests Passed (22.50s) | **PASS** |
| **Air-Gap Sovereign Defense** | `python scripts/verify_airgap.py` | 4/4 Outbound Sockets Blocked (`EPERM`), 0 Telemetry | **PASS** |
| **Subsystem Audit** | `python scripts/check_all.py` | 100% of all checks passed | **PASS** |
| **Frontend Production Build** | `npm --prefix frontend run build` | Clean client build in 10.56s | **PASS** |
| **Hero 5-Scene CLI Demo** | `python ulpf.py demo` | Deterministic 5-scene adaptive loop executed | **PASS** |

---

## 3. Measured Empirical Benchmark Figures

### 50,000 Live Events (`benchmarks/benchmark_end_to_end.py 50000`)
- **Ingestion Velocity:** **4,686 EPS** (Conservative sustained multi-format rate; pure regex micro-benchmark exceeds 100k EPS)
- **Execution Time:** 10.669 seconds
- **Latency Distribution:**
  - **p50:** 202.82 µs
  - **p95:** 256.96 µs
  - **p99:** 296.01 µs
  - **Peak Latency:** 1,639.42 µs
- **Cryptographic Merkle Batch Checkpoint (1,000 leaves):** 20.72 ms (Root: `a950476237828b1f...`)
- **Peak Resident Memory (50k in-memory benchmark batch):** 489.7 MB

### 10,000 Streaming Events (`ulpf.py benchmark --count 10000`)
- **Ingestion Velocity:** **4,645 EPS**
- **Peak Resident Memory:** **23.9 MB**

---

## 4. Exact Reproduction Commands
```bash
# 1. Run complete evaluation
python evaluate.py

# 2. Run unit test suite
pytest tests/ -v

# 3. Verify sovereign air-gap enforcement
python scripts/verify_airgap.py

# 4. Measure streaming performance
python ulpf.py benchmark --count 10000

# 5. Execute 5-scene hero demo
python ulpf.py demo

# 6. Verify frontend production assets
npm --prefix frontend run build
```
