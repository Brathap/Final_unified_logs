# OCSF Specification Pinning: v1.1.0

**Standard:** Open Cybersecurity Schema Framework (OCSF)  
**Pinned Release:** v1.1.0 (Enterprise Profile)  
**Governance:** SIH 26156 / NTRO Sovereign Data Standards  

---

## 1. Schema Pinning Rationale

Air-gapped mission-critical environments must never depend on remote schemas or floating version identifiers. ULPF pins strictly to **OCSF v1.1.0**, guaranteeing deterministic taxonomy alignment, predictable downstream SIEM ingestion, and cryptographic lineage integrity.

---

## 2. Pinned Event Classes & UIDs

ULPF standardizes incoming security telemetries into the following pinned OCSF v1.1.0 event classes:

| Class UID | Class Name | Category UID | Category Name | Primary Telemetry Sources |
| :--- | :--- | :--- | :--- | :--- |
| `1001` | **File Activity** | `1` | System Activity | Host EDR, Auditd, Sysmon File creation/deletion |
| `2001` | **Security Finding** | `2` | Findings | WAF (Imperva/ModSecurity), Suricata/Snort IDS alerts |
| `3001` | **Account Change** | `3` | Identity & Access | Active Directory, Linux `useradd`/`usermod`, IAM audit |
| `3002` | **Authentication** | `3` | Identity & Access | Linux SSHD, Windows Event 4624/4625, VPN Login |
| `4001` | **Network Activity** | `4` | Network Activity | Palo Alto PAN-OS, Cisco ASA, Juniper SRX, NetFlow/IPFIX |
| `4002` | **HTTP Activity** | `4` | Network Activity | Nginx, Apache, Cloudflare proxy, Envoy access logs |
| `4003` | **DNS Activity** | `4` | Network Activity | Bind9, CoreDNS, Windows DNS Server queries |
| `6001` | **Generic Event** | `6` | Application Activity | Unknown/Fallback logs before dynamic onboarding |

---

## 3. Pinned Severity Taxonomy

All normalized records must map to the standardized OCSF severity scale:

| Severity ID | Severity Name | Operational Definition |
| :--- | :--- | :--- |
| `0` | **Unknown** | Unclassified / pending inspection |
| `1` | **Informational** | Normal operations, routine keep-alive, standard audit |
| `2` | **Low** | Non-critical anomalies, low-risk policy warnings |
| `3` | **Medium** | Suspicious behaviour, anomalous ports, repeated warnings |
| `4` | **High** | Blocked network intrusions, failed root authentications |
| `5` | **Critical** | Active malware C2 hits, threat-intel confirmed malicious IOCs |
| `99` | **Other** | Vendor-specific edge cases |

---

## 4. Required Metadata Envelope & Compliance

Every normalized OCSF payload output by ULPF adheres to this contract:

```json
{
  "metadata": {
    "version": "1.1.0",
    "product": {
      "vendor_name": "ULPF Gateway",
      "name": "Enterprise Universal Parser",
      "version": "2.0.0"
    },
    "profiles": ["security_control"],
    "tenant_uid": "sih-sovereign-01"
  },
  "class_uid": 4001,
  "category_name": "Network Activity",
  "activity_name": "Traffic Flow",
  "severity_id": 4,
  "severity": "High",
  "time": 1727827200,
  "src_endpoint": {
    "ip": "192.168.1.100",
    "port": 54212
  },
  "dst_endpoint": {
    "ip": "10.0.0.5",
    "port": 443
  },
  "lineage": {
    "raw_sha256": "4b227777d4dd1fc61c6f884f48641d02b4d121d3fd328cb08b5531fcacdabf8a",
    "parser_id": "cisco-asa-firewall",
    "pack_version": "1.0.0",
    "fields": {
      "src_endpoint.ip": { "start": 42, "end": 55, "raw_token": "192.168.1.100" },
      "dst_endpoint.ip": { "start": 60, "end": 68, "raw_token": "10.0.0.5" }
    }
  }
}
```
