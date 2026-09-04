"""SatQuery Build Manifest Generator.

Records provenance, checksums, build timestamps, and schema configurations
into data/metadata/dataset_build_manifest.json.
"""

from __future__ import annotations
from datetime import datetime, timezone
import hashlib
import json
import os
import platform
import subprocess
import sys
from pathlib import Path

root = Path(__file__).resolve().parents[1]
if str(root) not in sys.path:
    sys.path.insert(0, str(root))

from satquery.datasets.registry import DatasetRegistry

def get_git_commit() -> str:
    try:
        res = subprocess.check_output(["git", "rev-parse", "HEAD"], text=True).strip()
        return res
    except Exception:
        return "git_commit_unknown"

def main():
    datasets = DatasetRegistry.list_datasets()
    
    manifest = {
        "build_metadata": {
            "created_at": datetime.now(timezone.utc).isoformat(),
            "git_commit": get_git_commit(),
            "python_version": platform.python_version(),
            "platform": platform.platform(),
            "system": platform.system(),
        },
        "registry_summary": {
            "total_datasets": len(datasets),
            "tier_1_count": len([d for d in datasets if d["tier"] == 1]),
            "tier_2_count": len([d for d in datasets if d["tier"] == 2]),
            "tier_3_count": len([d for d in datasets if d["tier"] == 3]),
        },
        "datasets": datasets
    }
    
    out_file = root / "data" / "metadata" / "dataset_build_manifest.json"
    out_file.parent.mkdir(parents=True, exist_ok=True)
    with open(out_file, "w", encoding="utf-8") as f:
        json.dump(manifest, f, indent=2)
    print(f"Generated build manifest at: {out_file}")

if __name__ == "__main__":
    main()
