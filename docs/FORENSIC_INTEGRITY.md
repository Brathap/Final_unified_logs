# SIH 26156 — Forensic Cryptographic Integrity Specification

## 1. Threat Model & Legal Admissibility

In national security operations and intelligence forensics (NTRO), digital logs constitute primary evidence in court proceedings and counter-threat investigations. Attackers routinely attempt to:
1. **Modify raw audit logs** (e.g., alter source IP or timestamp to hide intrusion).
2. **Delete event records** (e.g., purge reconnaissance activity).
3. **Reorder events** (e.g., swap causal order to invalidate anomaly detection).
4. **Second-Preimage Collision Attacks** (e.g., construct malicious payload yielding identical intermediate Merkle node hashes).

ULPF enforces **RFC 6962 Domain-Separated Cryptographic Authenticity** across all stored logs.

---

## 2. Merkle Tree Architecture (RFC 6962 Domain Separation)

Standard binary Merkle trees are susceptible to second-preimage attacks where an attacker presents an internal node as a leaf. To eliminate this attack surface, ULPF implements strict RFC 6962 domain prefixes:

* **Leaf Hash Calculation:**
  $$\text{LeafHash}(L_i) = \text{SHA-256}(0x00 \mathbin{\Vert} L_i)$$
  where $L_i$ is the exact UTF-8 byte stream of the raw, untouched log line.

* **Internal Node Calculation:**
  $$\text{ParentHash}(N_{left}, N_{right}) = \text{SHA-256}(0x01 \mathbin{\Vert} N_{left} \mathbin{\Vert} N_{right})$$

* **Odd-Count Balancing:**
  If an odd number of nodes exists at an intermediate depth, the rightmost node is duplicated and hashed with itself using the internal node prefix:
  $$\text{ParentHash}(N_{odd}, N_{odd}) = \text{SHA-256}(0x01 \mathbin{\Vert} N_{odd} \mathbin{\Vert} N_{odd})$$

```
                   Root: SHA-256(0x01 || H_A || H_B)
                                 /      \
                                /        \
           H_A: SHA-256(0x01 || L0 || L1)   H_B: SHA-256(0x01 || L2 || L3)
                   /          \                     /          \
                  /            \                   /            \
       L0: SHA-256(0x00||log0) L1: SHA-256(0x00||log1) ...
```

---

## 3. Cryptographic Tamper Detection Engine

The tamper detection engine operates in $O(\log N)$ audit proof time:
1. **Single-Byte Mutation Detection:**
   If a single bit in a 100,000-line log archive is modified, the corresponding leaf hash recalculates, cascading up the Merkle branch and immediately altering the Root Hash.
2. **Reordering Detection:**
   Swapping two adjacent logs changes the concatenation sequence $(0x01 \mathbin{\Vert} N_{left} \mathbin{\Vert} N_{right})$, resulting in root hash failure.
3. **Forensic Evidence Bundle:**
   ULPF exports standalone `.forensic` JSON bundles containing:
   - Root Hash signed by the local cryptographic ledger
   - Merkle audit paths (`siblings` + `directions`) for queried log IDs
   - Raw payload with SHA-256 verification hash
   - Complete field lineage byte offsets

### Verification Evidence
* `tests/test_merkle_tree.py::test_merkle_domain_separation` — **PASSED**
* `tests/test_tamper_detection.py::test_single_byte_mutation_detected` — **PASSED**
* `tests/test_tamper_detection.py::test_leaf_reordering_tamper_detected` — **PASSED**
* `tests/test_forensic_bundle.py::TestForensicEvidenceBundle` — **PASSED**
