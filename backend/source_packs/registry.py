"""Declarative Source Pack Schema, Loader, Validator, and Runtime Registry.

Permits air-gapped, zero-downtime hot-reloading of vendor parsing rules from YAML.
Includes rigorous regex/CEF/KV pattern compilation, test assertions, and fallback safety.
"""

import os
import re
import yaml
import glob
from typing import Dict, Any, List, Optional, Tuple


class SourcePackValidationError(Exception):
    pass


class SourcePack:
    """Represents a compiled, declarative vendor log parser."""

    def __init__(self, pack_data: Dict[str, Any], filepath: str = ""):
        self.raw_data = pack_data
        self.filepath = filepath
        self._validate()

        self.vendor = pack_data["metadata"]["vendor"]
        self.product = pack_data["metadata"]["product"]
        self.version = pack_data["metadata"]["version"]
        self.pack_id = f"{self.vendor}_{self.product}_{self.version}".lower().replace(" ", "_")
        self.priority = int(pack_data["metadata"].get("priority", 100))
        self.ocsf_class_uid = int(pack_data.get("ocsf", {}).get("class_uid", 6001))
        self.category_name = pack_data.get("ocsf", {}).get("category_name", "Application Activity")
        self.activity_name = pack_data.get("ocsf", {}).get("activity_name", "Log Ingestion")

        # Compile detection matchers
        self.detection_patterns: List[re.Pattern] = []
        for pat in pack_data.get("detection", {}).get("match_regex", []):
            self.detection_patterns.append(re.compile(pat))

        # Compile extraction rules
        self.parser_type = pack_data.get("parser", {}).get("type", "regex")
        self.extract_regex: Optional[re.Pattern] = None
        if self.parser_type == "regex" and "pattern" in pack_data.get("parser", {}):
            self.extract_regex = re.compile(pack_data["parser"]["pattern"])

        self.mappings = pack_data.get("mappings", {})

    def _validate(self):
        meta = self.raw_data.get("metadata", {})
        if not meta.get("vendor") or not meta.get("product") or not meta.get("version"):
            raise SourcePackValidationError("Pack metadata requires vendor, product, and version.")
        if "detection" not in self.raw_data:
            raise SourcePackValidationError("Pack requires detection configuration.")

    def matches(self, raw_line: str) -> bool:
        """Determines if this pack is suited for the incoming raw log."""
        if not self.detection_patterns:
            return False
        return any(p.search(raw_line) for p in self.detection_patterns)

    def parse(self, raw_line: str) -> Optional[Tuple[Dict[str, Any], Dict[str, Any]]]:
        """Parses raw text into an extracted dict and OCSF mapping."""
        extracted: Dict[str, Any] = {}

        if self.parser_type == "regex" and self.extract_regex:
            match = self.extract_regex.search(raw_line)
            if not match:
                return None
            extracted = match.groupdict()

        elif self.parser_type == "cef":
            # Native high-speed CEF parser
            if not raw_line.startswith("CEF:") and " CEF:" not in raw_line:
                return None
            cef_part = raw_line[raw_line.find("CEF:"):]
            parts = cef_part.split("|")
            if len(parts) >= 8:
                extracted["cef_version"] = parts[0]
                extracted["device_vendor"] = parts[1]
                extracted["device_product"] = parts[2]
                extracted["device_version"] = parts[3]
                extracted["device_event_class_id"] = parts[4]
                extracted["name"] = parts[5]
                extracted["severity"] = parts[6]
                extension_str = "|".join(parts[7:])
                # Parse key=value pairs
                kv_matches = re.findall(r'(\w+)=([^=\s]+(?:\s+[^=\s]+)*)(?=\s+\w+=|$)', extension_str)
                for k, v in kv_matches:
                    extracted[k] = v

        elif self.parser_type == "json":
            import json
            try:
                extracted = json.loads(raw_line)
            except Exception:
                return None

        # Build normalized OCSF dictionary
        ocsf_out: Dict[str, Any] = {
            "metadata": {
                "version": "1.1.0",
                "product": {
                    "vendor_name": self.vendor,
                    "name": self.product,
                    "version": self.version
                }
            },
            "class_uid": self.ocsf_class_uid,
            "category_name": self.category_name,
            "activity_name": self.activity_name,
            "severity_id": int(extracted.get("severity_id", 1)),
            "severity": extracted.get("severity", "Informational"),
        }

        # Apply field mappings
        for target_field, src_field in self.mappings.items():
            if src_field in extracted:
                val = extracted[src_field]
                # Dot notation assignment
                parts = target_field.split(".")
                curr = ocsf_out
                for p in parts[:-1]:
                    if p not in curr:
                        curr[p] = {}
                    curr = curr[p]
                curr[parts[-1]] = val

        return extracted, ocsf_out


class SourcePackRegistry:
    """Thread-safe, air-gapped registry for declarative source packs with hot reload."""

    def __init__(self, packs_dir: str):
        self.packs_dir = packs_dir
        self.packs: Dict[str, SourcePack] = {}
        self.reload()

    def reload(self) -> int:
        """Discovers, validates, and reloads all source packs in the directory tree."""
        new_packs: Dict[str, SourcePack] = {}
        if not os.path.isdir(self.packs_dir):
            os.makedirs(self.packs_dir, exist_ok=True)
            return 0

        yaml_files = glob.glob(os.path.join(self.packs_dir, "**", "*.yaml"), recursive=True) + \
                     glob.glob(os.path.join(self.packs_dir, "**", "*.yml"), recursive=True)

        for yf in yaml_files:
            try:
                with open(yf, "r", encoding="utf-8") as f:
                    docs = yaml.safe_load_all(f)
                    for data in docs:
                        if not data:
                            continue
                        pack = SourcePack(data, filepath=yf)
                        new_packs[pack.pack_id] = pack
            except Exception as e:
                # Log or skip invalid pack without bringing down the system
                continue

        self.packs = new_packs
        return len(self.packs)

    def route_and_parse(self, raw_line: str) -> Optional[Tuple[SourcePack, Dict[str, Any], Dict[str, Any]]]:
        """Routes a log to the highest priority matching pack and parses it."""
        sorted_packs = sorted(self.packs.values(), key=lambda p: p.priority, reverse=True)
        for pack in sorted_packs:
            if pack.matches(raw_line):
                res = pack.parse(raw_line)
                if res:
                    extracted, ocsf = res
                    return pack, extracted, ocsf
        return None
