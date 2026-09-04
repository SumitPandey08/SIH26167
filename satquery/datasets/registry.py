"""SatQuery Dataset Registry.

Central singleton registry providing discovery, instantiation, filtering,
and catalog metadata generation across all earth observation datasets.
"""

from __future__ import annotations
import json
import logging
from pathlib import Path
from typing import Any, Dict, List, Optional, Type

from satquery.datasets.base import DatasetAdapter
from satquery.datasets.schema import TaskType

logger = logging.getLogger("satquery.registry")


class DatasetRegistry:
    """Singleton registry for all remote-sensing dataset adapters."""

    _instance: Optional[DatasetRegistry] = None
    _adapters: Dict[str, Type[DatasetAdapter]] = {}
    _adapter_instances: Dict[str, DatasetAdapter] = {}

    def __new__(cls) -> DatasetRegistry:
        if cls._instance is None:
            cls._instance = super(DatasetRegistry, cls).__new__(cls)
            cls._adapters = {}
            cls._adapter_instances = {}
        return cls._instance

    @classmethod
    def register(cls, adapter_cls: Type[DatasetAdapter]) -> Type[DatasetAdapter]:
        """Class decorator or registration method."""
        temp_inst = adapter_cls()
        name_key = temp_inst.dataset_name.lower().replace("-", "_")
        cls._adapters[name_key] = adapter_cls
        cls._adapter_instances[name_key] = temp_inst
        logger.debug(f"Registered dataset adapter: {temp_inst.dataset_name} ({name_key})")
        return adapter_cls

    @classmethod
    def get(cls, name: str) -> DatasetAdapter:
        """Retrieve an initialized dataset adapter instance by name."""
        name_key = name.lower().replace("-", "_")
        if name_key not in cls._adapter_instances:
            # Check aliases
            for key, inst in cls._adapter_instances.items():
                if key in name_key or name_key in key:
                    return inst
            raise KeyError(f"Dataset '{name}' not found in registry. Available: {list(cls._adapters.keys())}")
        return cls._adapter_instances[name_key]

    @classmethod
    def list_datasets(
        cls,
        tier: Optional[int] = None,
        task: Optional[TaskType] = None
    ) -> List[Dict[str, Any]]:
        """List all available datasets matching optional tier or task filters."""
        cls._ensure_loaded()
        results = []
        for name_key, adapter in cls._adapter_instances.items():
            if tier is not None and adapter.tier != tier:
                continue
            if task is not None and task not in adapter.tasks:
                continue

            results.append({
                "dataset": adapter.dataset_name,
                "version": adapter.version,
                "tier": adapter.tier,
                "status": adapter.implementation_status,
                "license": adapter.license,
                "source": adapter.source,
                "modalities": [m.value for m in adapter.modalities],
                "sensors": [s.value for s in adapter.sensors],
                "tasks": [t.value for t in adapter.tasks],
                "splits": adapter.splits,
                "streaming_support": adapter.streaming_support,
            })
        return sorted(results, key=lambda x: (x["tier"], x["dataset"]))

    @classmethod
    def export_registry_metadata(cls, output_path: Optional[str] = None) -> str:
        """Export comprehensive machine-readable dataset catalog to metadata/datasets.json."""
        cls._ensure_loaded()
        out = Path(output_path) if output_path else Path(__file__).resolve().parents[2] / "data" / "metadata" / "datasets.json"
        out.parent.mkdir(parents=True, exist_ok=True)

        catalog = {
            "schema_version": "1.0.0",
            "total_datasets": len(cls._adapter_instances),
            "tiers": {
                "tier_1": [d["dataset"] for d in cls.list_datasets(tier=1)],
                "tier_2": [d["dataset"] for d in cls.list_datasets(tier=2)],
                "tier_3": [d["dataset"] for d in cls.list_datasets(tier=3)],
            },
            "datasets": cls.list_datasets()
        }

        with open(out, "w", encoding="utf-8") as f:
            json.dump(catalog, f, indent=2)

        return str(out)

    @classmethod
    def _ensure_loaded(cls):
        """Ensure all adapter modules are imported."""
        # Will be called automatically when adapters module is imported
        pass
