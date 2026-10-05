#!/usr/bin/env python3
"""ULPF Unified Air-Gapped CLI (SIH 26156).

Commands:
- `evaluate`: Run comprehensive 15-point deterministic validation test suite.
- `benchmark`: Run the deterministic streaming throughput and latency benchmark.
- `demo`: Run live air-gapped simulated firehose ingestion.
- `analyze`: Run Unknown Source Intelligence (Fingerprint + Drain Clustered Template + Inferred Fields) on arbitrary input log.
- `generate-pack`: Automatically generate candidate YAML declarative source pack from a raw log sample.
- `verify-airgap`: Execute kernel/socket egress isolation audits and fail-closed proofs.
"""

import sys
import os
import argparse
import subprocess

BASE_DIR = os.path.abspath(os.path.dirname(__file__))
sys.path.insert(0, os.path.join(BASE_DIR, "backend"))

from unknown_engine.intelligence import FormatFingerprinter, TemplateClusterer, FieldInferencer, ProposalGenerator
from source_packs.registry import SourcePackRegistry
from lineage_engine import LineageEngine


def cmd_evaluate(args):
    eval_script = os.path.join(BASE_DIR, "evaluate.py")
    res = subprocess.run([sys.executable, eval_script], cwd=BASE_DIR)
    sys.exit(res.returncode)


def cmd_benchmark(args):
    print(">>> Running ULPF Empirical Benchmark...")
    bench_script = os.path.join(BASE_DIR, "benchmarks", "benchmark_end_to_end.py")
    res = subprocess.run([sys.executable, bench_script, str(args.count)], cwd=BASE_DIR)
    sys.exit(res.returncode)


def cmd_verify_airgap(args):
    print(">>> Running ULPF Air-Gap Integrity Verification...")
    script = os.path.join(BASE_DIR, "scripts", "verify_airgap.py")
    res = subprocess.run([sys.executable, script], cwd=BASE_DIR)
    sys.exit(res.returncode)


def cmd_analyze(args):
    log_line = args.log
    print("\n--- UNKNOWN SOURCE INTELLIGENCE ANALYSIS ---")
    fp = FormatFingerprinter.identify(log_line)
    tmpl = TemplateClusterer.extract_template(log_line)
    inferred = FieldInferencer.infer_fields(log_line)

    print(f"Format Detected : {fp['format']} (Confidence: {fp['confidence']*100:.0f}%)")
    print(f"Template Pattern: {tmpl}")
    print(f"Inferred Fields :")
    for field in inferred:
        print(f"  • {field['ocsf_field']:<18} = '{field['extracted_value']}' (Confidence: {field['confidence']*100:.0f}%) [{field['explanation']}]")
    print("--------------------------------------------\n")


def cmd_generate_pack(args):
    log_line = args.log
    pack_yaml = ProposalGenerator.generate_candidate_pack(args.vendor, args.product, [log_line])
    if args.output:
        with open(args.output, "w", encoding="utf-8") as f:
            f.write(pack_yaml)
        print(f"Candidate source pack written to: {args.output}")
    else:
        print(pack_yaml)


def cmd_demo(args):
    print(">>> Starting ULPF Sovereign Air-Gap Firehose Ingestion Demo...")
    firehose_script = os.path.join(BASE_DIR, "backend", "simulate_firehose.py")
    subprocess.run([sys.executable, firehose_script], cwd=BASE_DIR)


def main():
    parser = argparse.ArgumentParser(
        prog="ulpf",
        description="ULPF - Universal Log Pre-processing Framework (SIH 26156 - NTRO)"
    )
    subparsers = parser.add_subparsers(dest="subcommand", help="Available subcommands")

    # evaluate
    subparsers.add_parser("evaluate", help="Run 15-point automated verification test suite")

    # benchmark
    p_bench = subparsers.add_parser("benchmark", help="Measure real EPS, latency, and memory utilization")
    p_bench.add_argument("--count", type=int, default=20000, help="Number of logs to process (default: 20000)")

    # verify-airgap
    subparsers.add_parser("verify-airgap", help="Verify strict air-gap compliance and socket egress blocking")

    # analyze
    p_analyze = subparsers.add_parser("analyze", help="Analyze arbitrary unknown log with deterministic intelligence")
    p_analyze.add_argument("log", type=str, help="Raw log line to analyze")

    # generate-pack
    p_gen = subparsers.add_parser("generate-pack", help="Generate draft YAML source pack from log sample")
    p_gen.add_argument("--vendor", type=str, default="UnknownVendor", help="Vendor name")
    p_gen.add_argument("--product", type=str, default="Appliance", help="Product name")
    p_gen.add_argument("--output", type=str, help="Optional output YAML path")
    p_gen.add_argument("log", type=str, help="Raw sample log line")

    # demo
    subparsers.add_parser("demo", help="Launch live firehose demo generator")

    args = parser.parse_args()
    if not args.subcommand:
        parser.print_help()
        sys.exit(0)

    handlers = {
        "evaluate": cmd_evaluate,
        "benchmark": cmd_benchmark,
        "verify-airgap": cmd_verify_airgap,
        "analyze": cmd_analyze,
        "generate-pack": cmd_generate_pack,
        "demo": cmd_demo,
    }

    handlers[args.subcommand](args)


if __name__ == "__main__":
    main()
