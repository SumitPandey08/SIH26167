"""SatQuery Dataset Hub & Adaptation Infrastructure."""

from satquery.datasets.schema import (
    BoundingBox,
    GeoReference,
    Modality,
    Sensor,
    TaskType,
    UnifiedRemoteSensingExample,
)
from satquery.datasets.base import DatasetAdapter
from satquery.datasets.registry import DatasetRegistry
from satquery.datasets.validator import DatasetValidator
from satquery.datasets.splits import SplitManager
import satquery.datasets.adapters  # Triggers auto-registration

__all__ = [
    "BoundingBox",
    "GeoReference",
    "Modality",
    "Sensor",
    "TaskType",
    "UnifiedRemoteSensingExample",
    "DatasetAdapter",
    "DatasetRegistry",
    "DatasetValidator",
    "SplitManager",
]
