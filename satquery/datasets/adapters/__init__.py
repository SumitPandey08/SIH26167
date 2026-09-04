"""SatQuery Dataset Adapters Package."""

from satquery.datasets.adapters.bigearthnet import BigEarthNetV2Adapter
from satquery.datasets.adapters.vrsbench import VRSBenchAdapter
from satquery.datasets.adapters.rsvqa import RSVQAAdapter
from satquery.datasets.adapters.levir import LevirCDAdapter, LevirCCAdapter
from satquery.datasets.adapters.cdvqa import CDVQAAdapter
from satquery.datasets.adapters.sen12ms import SEN12MSAdapter
from satquery.datasets.adapters.bright import BRIGHTAdapter
from satquery.datasets.adapters.urbansarfloods import UrbanSARFloodsAdapter
from satquery.datasets.adapters.tier3 import (
    FloodNetAdapter,
    DIOR_RSVGAdapter,
    DOTAAdapter,
    FAIR1MAdapter,
)

__all__ = [
    "BigEarthNetV2Adapter",
    "VRSBenchAdapter",
    "RSVQAAdapter",
    "LevirCDAdapter",
    "LevirCCAdapter",
    "CDVQAAdapter",
    "SEN12MSAdapter",
    "BRIGHTAdapter",
    "UrbanSARFloodsAdapter",
    "FloodNetAdapter",
    "DIOR_RSVGAdapter",
    "DOTAAdapter",
    "FAIR1MAdapter",
]
