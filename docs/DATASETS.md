# Real-World Log Datasets & Empirical Coverage Report
**Document:** `docs/DATASETS.md`  
**Execution Timestamp:** 2026-10-06  
**Auditor:** AegisGuard-ULPF Empirical Verification Pipeline  
**Execution Command:** `python3 tools/measure_coverage.py`

---

## 1. Methodology & Data Provenance

All evaluation metrics in this report are measured directly from authentic public production log corpora downloaded via `python3 tools/fetch_datasets.py` into `realdata/` (strictly gitignored, never redistributed or checked into version control).

### Datasets Tested:
1. **Loghub OpenSSH 2k**: 2,000 real authentication events from a live production server (Loghub research corpus).
2. **Loghub Linux Syslog 2k**: 2,000 genuine Linux system daemon, auth, and cron logs.
3. **Loghub Apache Web 2k**: 2,000 Apache web server error and access logs.
4. **Loghub Proxifier 2k**: 2,000 client proxy tunnel connection events.
5. **Loghub HDFS 2k**: 2,000 Hadoop distributed file system cluster events.

> **Zero Dropped Events Rule:**  
> Unparsed logs are **never discarded**. When an incoming log line does not match any registered vendor pack signature, it is preserved losslessly in the Base64 wire archive alongside its SHA-256 digest, and emitted as an OCSF v1.1.0 generic unparsed envelope (`class_uid: 6001`) with complete unmapped passthrough.

---

## 2. Empirical Measured Results

The following figures were generated from an automated run of `python3 tools/measure_coverage.py`:

| Corpus Name | Total Records | Full Parsed % | Partial % | Unparsed % | Emitted as OCSF (Lossless) | Status |
|:---|:---:|:---:|:---:|:---:|:---:|:---:|
| **Loghub OpenSSH 2k** | 2,000 | **56.55%** (1,131) | **6.80%** (136) | **36.65%** (733) | **100.0%** (2,000) | **PASS** |
| **Loghub Linux Syslog 2k** | 2,000 | **24.45%** (489) | **13.30%** (266) | **62.25%** (1,245) | **100.0%** (2,000) | **PASS** |
| **Loghub Apache Web 2k** | 2,000 | **1.60%** (32) | **98.40%** (1,968) | **0.00%** (0) | **100.0%** (2,000) | **PASS** |
| **Loghub Proxifier 2k** | 2,000 | **60.70%** (1,214) | **0.00%** (0) | **39.30%** (786) | **100.0%** (2,000) | **PASS** |
| **Loghub HDFS 2k** | 2,000 | **0.00%** (0) | **0.00%** (0) | **100.00%** (2,000) | **100.0%** (2,000) | **PASS** |

*Overall Emitted OCSF Rate:* **100.0%** (10,000 / 10,000 records emitted; 0 dropped).

---

## 3. Honest Analysis of Misses and Parser Boundaries

In forensic telemetry pipelines, documenting unparsed categories is critical for engineering transparency:

### 1. OpenSSH Misses (36.65%)
- **Examples**:
  - `Dec 10 06:55:46 LabSZ sshd[24200]: reverse mapping checking getaddrinfo for ns.marryaldkfaczcz.com [173.234.31.186] failed - POSSIBLE BREAK-IN ATTEMPT!`
  - `Dec 10 06:55:48 LabSZ sshd[24200]: Connection closed by 173.234.31.186 [preauth]`
- **Root Cause**: The default OpenSSH source pack is tailored to standard authentication verdicts (`Accepted`, `Failed`, `Invalid user`). Connection tear-down preauth notices and reverse DNS lookup failures are distinct lifecycle phases.
- **Handling**: Emitted losslessly with full raw-wire SHA-256 digest and unmapped text payload.

### 2. Linux Syslog Misses (62.25%)
- **Examples**:
  - `Jun 15 04:06:18 combo su(pam_unix)[21416]: session opened for user cyrus by (uid=0)`
  - `Jun 15 04:06:20 combo logrotate: ALERT exited abnormally with [1]`
- **Root Cause**: Syslog streams interleave dozens of disparate operating system utilities (`su`, `logrotate`, `cups`, `named`, `anacron`).
- **Handling**: Preserved losslessly in `storage/lossless_archive.jsonl` and emitted as OCSF unparsed envelope.

### 3. Proxifier Misses (39.30%)
- **Examples**:
  - `[10.30 16:51:56] svchost.exe *64 - proxy.cse.cuhk.edu.hk:5070 close, 303 bytes sent, 275 bytes received, lifetime <1 sec`
  - `[10.30 17:15:42] QQ.exe - tcpconn6.tencent.com:443 error : A connection request was canceled before the completion.`
- **Root Cause**: The Proxifier pack regex parsed standard 32-bit binaries (`chrome.exe`), but encountered 64-bit architecture tags (`*64`) and multi-clause error descriptions.
- **Handling**: Preserved losslessly; candidate drafter can target this specific format variation.

### 4. HDFS Misses (100.00%)
- **Examples**:
  - `081109 203615 148 INFO dfs.DataNode$PacketResponder: PacketResponder 1 for block blk_38865049064139660 terminating`
- **Root Cause**: HDFS is an application-specific Java distributed log format, with no perimeter network source pack configured in the active registry.
- **Handling**: Verified as 100% unparsed but 100% losslessly preserved with RFC 6962 Merkle anchoring. This provides a baseline for Phase 6 onboarding.

---

## 4. Exclusion of Synthetic Samples

Synthetic demonstration logs (e.g., generated Cisco ASA samples in `ulpf.py demo`) are **strictly excluded** from all figures published in this document and the README. All percentages above reflect execution on genuine captured datasets.
