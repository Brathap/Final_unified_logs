# Real-World Security Corpus Validation

**Date:** 2026-10-05  
**Directory:** `sample-logs/real-world/`  

---

## 1. Corpus Directory Structure & Provenance

| Family | Subdirectory | File | Format | Event Count | Ingestion Path |
| :--- | :--- | :--- | :--- | :---: | :--- |
| **Cisco** | `sample-logs/real-world/cisco/` | `cisco_asa.log` | RFC 3164 Syslog | 5 | Fast Path (`cisco_asa_9.16`) |
| **Palo Alto** | `sample-logs/real-world/paloalto/` | `pan_os.log` | CSV / Delimited | 2 | Learning Path / VRL |
| **Linux Auth** | `sample-logs/real-world/linux/` | `linux_auth.log` | RFC 3164 Syslog | 4 | Fast Path (`linux_openssh_8.x`) |
| **Windows** | `sample-logs/real-world/windows/` | `windows_event.xml`| XML (4624/4625) | 2 | Learning Path |
| **CEF Standard** | `sample-logs/real-world/cef/` | `cef_enterprise.log` | ArcSight CEF 1.0 | 3 | Fast Path (`arcsight_cef_standard_1.0`) |
| **RFC 5424** | `sample-logs/real-world/syslog/` | `syslog_rfc5424.log`| RFC 5424 Structured | 2 | Learning Path |
| **Web Proxy** | `sample-logs/real-world/web/` | `nginx_access.log` | Combined Log Format | 3 | Learning Path |
| **Cloud/K8s** | `sample-logs/real-world/json/` | `cloud_security.json` | JSON Objects | 2 | Learning Path |

---

## 2. Normalization & Fingerprinting Audit Results

```text
[cisco/cisco_asa.log]
  - Fast Path Match: cisco_asa_9.16 (Priority 150)
  - OCSF Target: Class 4001 (Network Activity)
  - Normalized Attributes: src_endpoint.ip, dst_endpoint.ip, src_endpoint.port, dst_endpoint.port, action, protocol
  - Unmapped Preservation: severity_num, message_id

[linux/linux_auth.log]
  - Fast Path Match: linux_openssh_8.x (Priority 120)
  - OCSF Target: Class 3002 (Identity & Access Management - Authentication)
  - Normalized Attributes: user.name, src_endpoint.ip, src_endpoint.port, activity_name

[cef/cef_enterprise.log]
  - Fast Path Match: arcsight_cef_standard_1.0 (Priority 110)
  - OCSF Target: Class 2001 (Security Finding)
  - Normalized Attributes: src_endpoint.ip, dst_endpoint.ip, src_endpoint.port, dst_endpoint.port, activity_name

[json/cloud_security.json]
  - Learning Path Classification: JSON (Confidence 1.00)
  - Inferred Attributes: src_endpoint.ip (203.0.113.77), dst_endpoint.ip (10.0.1.20), user.name (kube-admin)
  - Candidate Source Pack Generation: Ready for operator approval & hot-reload.
```
