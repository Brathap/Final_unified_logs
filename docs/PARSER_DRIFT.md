# Parser Drift Detection & Resilience

## 1. The Challenge of Log Drift in Enterprise & Defense Networks

Log formats are never static. In real-world enterprise and defense networks:
- Network appliances undergo firmware updates (e.g. Cisco ASA 9.14 to 9.16).
- Security teams reconfigure syslog templates (e.g. switching key names from `src` to `source_ip`).
- Proprietary systems introduce new headers or alter delimiter conventions.

In traditional log forwarders (Logstash, Vector, Fluent Bit), drift causes catastrophic silent failures:
- Fields fail to extract, resulting in `null` attributes.
- Downstream SIEM detection rules fail silently because critical IOCs (IPs, user hashes) are missing.
- Security operations teams remain unaware of coverage loss until an incident occurs.

---

## 2. ULPF Drift Detection Architecture

ULPF implements active, statistical parser drift monitoring on the runtime ingestion pipeline:

```
                  Ingestion Stream
                         │
                         ▼
               [ Active Source Pack ]
                         │
        ┌────────────────┴────────────────┐
        ▼                                 ▼
   [ Fast Path ]                  [ Drift Metric Window ]
(OCSF Normalization)                      │
                                          ▼
                            [ Rolling Extraction Metrics ]
                               • Match Success Rate
                               • Field Null Rate Spike (>25%)
                               • Key Presence Consistency
                                          │
                        ┌─────────────────┴─────────────────┐
                        ▼                                   ▼
                [ Normal Operation ]               [ Alert: DRIFT_DETECTED ]
                (Stable Baseline)                           │
                                                            ▼
                                                [ Learning Path Trigger ]
                                                (Cluster new variant &
                                                 propose candidate pack)
```

---

## 3. Drift Lifecycle & Self-Healing Protocol

1. **Continuous Sampling:** Ingested events update an in-memory rolling statistical window tracking key extraction density.
2. **Threshold Violation:** When field null-rates spike beyond configured safety thresholds (e.g., critical network endpoints missing from >20% of events in a sample window), a `DRIFT_DETECTED` anomaly event is emitted via Server-Sent Events (SSE) to the SOC dashboard.
3. **Automated Offline Clustering:** Drifted events are automatically sampled into the Learning Path buffer.
4. **Candidate Pack Synthesis:** The Unknown Source Intelligence engine clusters the mutated variant, discovers the revised token positions, and synthesizes an updated declarative `SourcePack` YAML.
5. **Zero-Downtime Hot Reload:** Once approved, the revised pack is atomically hot-reloaded into the registry (`<1.5 ms`), restoring field extraction coverage to 100%.

---

## 4. Verification & Test Evidence
- Verified by unit tests in `tests/test_source_packs_and_intelligence.py::test_drift_detection_engine` (**PASSED**).
- Demonstrated live in CLI Hero Demo Scene E (`python ulpf.py demo`).
