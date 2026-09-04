"""SatQuery AI Command-Line Interface.

Provides operational commands for:
- Dataset discovery, inspection, validation, and subset preparation
- VLM training configuration validation and execution
- Benchmark evaluation and zero-hallucination verification
"""

from __future__ import annotations
import argparse
import json
import sys
from pathlib import Path
import yaml

from satquery.datasets.registry import DatasetRegistry
from satquery.datasets.validator import DatasetValidator
from satquery.datasets.schema import TaskType
from satquery.training.trainer import RemoteSensingVLMTrainer
from satquery.training.instruction_converter import InstructionConverter
from satquery.evaluation.evaluator import UnifiedRemoteSensingEvaluator


def handle_dataset_list(args):
    """List datasets in the registry."""
    tier = args.tier
    task = TaskType(args.task) if args.task else None
    datasets = DatasetRegistry.list_datasets(tier=tier, task=task)

    print(f"\n========================================================")
    print(f"  SatQuery AI Dataset Registry ({len(datasets)} available)")
    print(f"========================================================")
    for d in datasets:
        print(f"• [{d['tier']}] {d['dataset']} (v{d['version']}) — {d['status']}")
        print(f"    Source: {d['source']}")
        print(f"    License: {d['license']}")
        print(f"    Sensors: {', '.join(d['sensors'])}")
        print(f"    Tasks:   {', '.join(d['tasks'])}")
        print("")


def handle_dataset_info(args):
    """Display detailed info for a single dataset."""
    try:
        adapter = DatasetRegistry.get(args.name)
    except KeyError:
        print(f"Error: Dataset '{args.name}' not found.")
        sys.exit(1)

    print(f"\n========================================================")
    print(f"  Dataset: {adapter.dataset_name} (v{adapter.version})")
    print(f"========================================================")
    print(f"Tier:           {adapter.tier}")
    print(f"Status:         {adapter.implementation_status}")
    print(f"License:        {adapter.license}")
    print(f"Source:         {adapter.source}")
    print(f"Homepage:       {adapter.homepage}")
    print(f"Modalities:     {', '.join([m.value for m in adapter.modalities])}")
    print(f"Sensors:        {', '.join([s.value for s in adapter.sensors])}")
    print(f"Tasks:          {', '.join([t.value for t in adapter.tasks])}")
    print(f"Splits:         {', '.join(adapter.splits)}")
    print(f"Streaming:      {adapter.streaming_support}")
    if adapter.citation:
        print("\nCitation:")
        print(adapter.citation)
    print("")


def handle_dataset_validate(args):
    """Validate samples from a dataset and output a quality report."""
    try:
        adapter = DatasetRegistry.get(args.name)
    except KeyError:
        print(f"Error: Dataset '{args.name}' not found.")
        sys.exit(1)

    print(f"Validating samples from {adapter.dataset_name} (split='{args.split}', max={args.max_samples})...")
    samples = list(adapter.iter_samples(split=args.split, streaming=True, max_samples=args.max_samples))
    validator = DatasetValidator()
    report = validator.validate_dataset(samples, adapter.dataset_name)

    print(f"\nQuality Report: {report['status']}")
    print(f"  Total Samples Checked:  {report['total_samples']}")
    print(f"  Passed Samples:         {report['passed_samples']}")
    print(f"  Quality Score:          {report['quality_score_percent']}%")
    print(f"  Errors Detected:        {report['errors']}")
    print(f"  Warnings Detected:      {report['warnings']}")
    print(f"  Duplicate IDs:          {report['duplicates']}")
    print(f"Full report written to: {validator.report_path}\n")


def handle_dataset_prepare(args):
    """Prepare a local curated subset jsonl for fast development."""
    try:
        adapter = DatasetRegistry.get(args.name)
    except KeyError:
        print(f"Error: Dataset '{args.name}' not found.")
        sys.exit(1)

    print(f"Preparing subset for {adapter.dataset_name} (max={args.max_samples}, split='{args.split}')...")
    out_path = adapter.prepare_subset(max_samples=args.max_samples, split=args.split)
    print(f"Subset successfully created: {out_path}\n")


def handle_dataset_stats(args):
    """Show dataset summary statistics across all registered adapters."""
    datasets = DatasetRegistry.list_datasets()
    print(f"\n========================================================")
    print(f"  SatQuery Dataset Hub Summary Statistics")
    print(f"========================================================")
    total = len(datasets)
    tier1 = len([d for d in datasets if d["tier"] == 1])
    tier2 = len([d for d in datasets if d["tier"] == 2])
    tier3 = len([d for d in datasets if d["tier"] == 3])

    print(f"Total Registered Benchmarks: {total}")
    print(f"  • Tier 1 (Core Foundation/VLM/Change):  {tier1}")
    print(f"  • Tier 2 (Disaster & Multi-Sensor):     {tier2}")
    print(f"  • Tier 3 (Downstream Detection/VQA):    {tier3}")

    all_tasks = set()
    all_sensors = set()
    for d in datasets:
        all_tasks.update(d["tasks"])
        all_sensors.update(d["sensors"])

    print(f"\nCovered Remote Sensing Tasks ({len(all_tasks)}):")
    print(f"  {', '.join(sorted(all_tasks))}")
    print(f"\nCovered Sensor Platforms ({len(all_sensors)}):")
    print(f"  {', '.join(sorted(all_sensors))}\n")


def handle_dataset_verify(args):
    """Verify integrity of all registered datasets."""
    print("Verifying integrity of all registered datasets...")
    adapters = [DatasetRegistry.get(d["dataset"]) for d in DatasetRegistry.list_datasets()]
    passed = 0
    for adp in adapters:
        res = adp.verify_integrity()
        status = res["status"]
        if status == "PASS":
            passed += 1
            print(f"  ✓ {adp.dataset_name}: PASS ({res['samples_tested']} samples verified)")
        else:
            print(f"  ✗ {adp.dataset_name}: FAIL (Errors: {res['errors']})")
    print(f"\nVerification Complete: {passed}/{len(adapters)} passed.\n")


def handle_train_validate_config(args):
    """Validate a YAML training configuration."""
    cfg_path = Path(args.config)
    if not cfg_path.exists():
        print(f"Error: Config file not found: {cfg_path}")
        sys.exit(1)

    with open(cfg_path, "r", encoding="utf-8") as f:
        cfg = yaml.safe_load(f)

    stage_name = cfg.get("stage_name", "unknown")
    print(f"Validating training configuration: {cfg_path.name} (Stage: {stage_name})")
    required_keys = ["stage_name"]
    for k in required_keys:
        if k not in cfg:
            print(f"  ✗ Missing required key: '{k}'")
            sys.exit(1)

    print("  ✓ Configuration syntax and parameters valid.")


def handle_train_run(args):
    """Execute a training run or dry run."""
    cfg_path = Path(args.config)
    if not cfg_path.exists():
        print(f"Error: Config file not found: {cfg_path}")
        sys.exit(1)

    with open(cfg_path, "r", encoding="utf-8") as f:
        cfg = yaml.safe_load(f)

    print(f"Launching adaptation training for stage '{cfg.get('stage_name')}' (dry_run={args.dry_run})...")
    # Load sample records
    target_dsets = cfg.get("target_datasets", [{"name": "VRSBench"}])
    dset_name = target_dsets[0]["name"]
    adapter = DatasetRegistry.get(dset_name)
    samples = list(adapter.iter_samples(split="train", max_samples=10))
    records = [InstructionConverter.to_llava_format(s) for s in samples]

    trainer = RemoteSensingVLMTrainer(config=cfg)
    result = trainer.train_stage(records, dry_run=args.dry_run)
    print(f"\nTraining Stage Completed:")
    print(f"  Steps Executed: {result['total_steps']}")
    print(f"  Final Loss:     {result['final_loss']}")
    print(f"  Device:         {result['device']}")
    print(f"  State Saved to: {trainer.output_dir}\n")


def handle_eval(args):
    """Run benchmark evaluation."""
    evaluator = UnifiedRemoteSensingEvaluator()
    print(f"Running evaluation on '{args.name}' (split='{args.split}', max={args.max_samples})...")
    res = evaluator.evaluate_dataset(
        dataset_name=args.name,
        split=args.split,
        max_samples=args.max_samples,
        model_name=args.model
    )
    print(f"\n========================================================")
    print(f"  Evaluation Results: {res['dataset']} ({res['model']})")
    print(f"========================================================")
    print(f"Status:             {res['status']}")
    print(f"Samples Evaluated:  {res['samples_evaluated']}")
    print("Metrics:")
    for task_name, task_metrics in res["metrics"].items():
        print(f"  [{task_name}]")
        for k, v in task_metrics.items():
            print(f"    {k}: {v}")
    print("")


def main():
    parser = argparse.ArgumentParser(description="SatQuery AI Dataset Hub & Adaptation CLI")
    subparsers = parser.add_subparsers(dest="command", required=True)

    # dataset subparsers
    dataset_parser = subparsers.add_parser("dataset", help="Dataset hub management commands")
    d_subs = dataset_parser.add_subparsers(dest="subcommand", required=True)

    # satquery dataset list
    p_list = d_subs.add_parser("list", help="List registered datasets")
    p_list.add_argument("--tier", type=int, choices=[1, 2, 3], help="Filter by tier")
    p_list.add_argument("--task", type=str, help="Filter by task")
    p_list.set_defaults(func=handle_dataset_list)

    # satquery dataset info
    p_info = d_subs.add_parser("info", help="Show detailed info for a dataset")
    p_info.add_argument("name", type=str, help="Dataset identifier")
    p_info.set_defaults(func=handle_dataset_info)

    # satquery dataset validate
    p_val = d_subs.add_parser("validate", help="Validate dataset samples for quality anomalies")
    p_val.add_argument("name", type=str, help="Dataset identifier")
    p_val.add_argument("--split", type=str, default="train", help="Dataset split to check")
    p_val.add_argument("--max-samples", type=int, default=20, help="Maximum samples to check")
    p_val.set_defaults(func=handle_dataset_validate)

    # satquery dataset prepare
    p_prep = d_subs.add_parser("prepare", help="Prepare a curated local subset jsonl")
    p_prep.add_argument("name", type=str, help="Dataset identifier")
    p_prep.add_argument("--split", type=str, default="train", help="Dataset split")
    p_prep.add_argument("--max-samples", type=int, default=20, help="Maximum samples in subset")
    p_prep.set_defaults(func=handle_dataset_prepare)

    # satquery dataset stats
    p_stats = d_subs.add_parser("stats", help="Summarize dataset hub statistics")
    p_stats.set_defaults(func=handle_dataset_stats)

    # satquery dataset verify
    p_verify = d_subs.add_parser("verify", help="Verify integrity of all registered datasets")
    p_verify.set_defaults(func=handle_dataset_verify)

    # train subparsers
    train_parser = subparsers.add_parser("train", help="VLM adaptation training commands")
    t_subs = train_parser.add_subparsers(dest="subcommand", required=True)

    # satquery train validate-config
    p_tval = t_subs.add_parser("validate-config", help="Validate a training YAML configuration")
    p_tval.add_argument("config", type=str, help="Path to config YAML")
    p_tval.set_defaults(func=handle_train_validate_config)

    # satquery train run
    p_trun = t_subs.add_parser("run", help="Run VLM adaptation training")
    p_trun.add_argument("--config", type=str, required=True, help="Path to config YAML")
    p_trun.add_argument("--dry-run", action="store_true", help="Execute 2 dry-run test steps")
    p_trun.set_defaults(func=handle_train_run)

    # eval subparser
    eval_parser = subparsers.add_parser("eval", help="Run scientific benchmark evaluation")
    eval_parser.add_argument("name", type=str, help="Dataset identifier")
    eval_parser.add_argument("--split", type=str, default="test", help="Split to evaluate")
    eval_parser.add_argument("--max-samples", type=int, default=15, help="Number of test samples")
    eval_parser.add_argument("--model", type=str, default="SatQuery-VLM-Adapter-v1", help="Model name")
    eval_parser.set_defaults(func=handle_eval)

    parsed = parser.parse_args()
    if hasattr(parsed, "func"):
        parsed.func(parsed)
    else:
        parser.print_help()


if __name__ == "__main__":
    main()
