"""
SatQuery AI — Raster Preprocessor & Metadata Reader
Standard: SIH26167 Remote Sensing Assistant
"""

import os
import logging
from pathlib import Path
from typing import Dict, Any, Tuple, Optional
import numpy as np

from ..schemas.metadata import RasterMetadata, ModalityType

logger = logging.getLogger("satquery.preprocessor")


class RasterPreprocessor:
    """
    Robust multi-format geospatial raster reader and preprocessor.
    Supports GeoTIFF, standard TIFF, PNG, and JPEG with graceful fallbacks.
    """

    @staticmethod
    def inspect_raster(filepath: str) -> RasterMetadata:
        """
        Inspect raster file metadata without loading the entire raster into memory if possible.
        """
        path = Path(filepath)
        if not path.exists():
            raise FileNotFoundError(f"Raster file not found: {filepath}")

        # Attempt high-fidelity geospatial inspection with rasterio
        try:
            import rasterio
            with rasterio.open(filepath) as src:
                crs_str = src.crs.to_string() if src.crs else "EPSG:4326"
                bounds = src.bounds
                bbox = (bounds.left, bounds.bottom, bounds.right, bounds.top)
                width, height = src.width, src.height
                channels = src.count
                dtype_str = str(src.dtypes[0])
                nodata = src.nodata

                # Estimate ground sample distance (resolution in meters or degrees)
                res_x, res_y = src.res
                gsd_m = float(res_x) if res_x > 0 else 10.0
                # If CRS is geographic degrees, approximate 1 deg ~ 111,320m
                if crs_str == "EPSG:4326" or "deg" in crs_str.lower():
                    gsd_m = float(res_x * 111320.0)

                modality = RasterPreprocessor._infer_modality(channels, dtype_str, path.name)

                return RasterMetadata(
                    filename=path.name,
                    filepath=str(path.resolve()),
                    crs=crs_str,
                    bbox=bbox,
                    width=width,
                    height=height,
                    channels=channels,
                    dtype=dtype_str,
                    gsd_m=round(gsd_m, 2),
                    modality=modality,
                    nodata_value=nodata,
                )
        except Exception as e:
            logger.warning(f"Rasterio inspection failed or uninstalled ({e}). Falling back to PIL/image reader.")

        # Fallback to PIL inspection
        try:
            from PIL import Image
            with Image.open(filepath) as img:
                width, height = img.size
                mode = img.mode
                channels = len(mode) if mode in ["RGB", "RGBA"] else 1
                dtype_str = "uint8"
                modality = RasterPreprocessor._infer_modality(channels, dtype_str, path.name)

                return RasterMetadata(
                    filename=path.name,
                    filepath=str(path.resolve()),
                    crs="EPSG:4326",
                    bbox=(0.0, 0.0, float(width), float(height)),
                    width=width,
                    height=height,
                    channels=channels,
                    dtype=dtype_str,
                    gsd_m=10.0,  # Default 10m Sentinel-2 equivalent
                    modality=modality,
                    nodata_value=None,
                )
        except Exception as err:
            raise ValueError(f"Unable to read or inspect image file {filepath}: {err}")

    @staticmethod
    def load_raster_array(filepath: str, max_size: Optional[int] = None) -> Tuple[np.ndarray, RasterMetadata]:
        """
        Load raster data into a normalized NumPy array of shape (C, H, W).
        Pixel values are normalized to float32 [0.0, 1.0].
        """
        meta = RasterPreprocessor.inspect_raster(filepath)

        # Attempt loading via rasterio
        try:
            import rasterio
            with rasterio.open(filepath) as src:
                arr = src.read()  # Shape (C, H, W)
                arr = arr.astype(np.float32)
                # Handle NoData if specified
                if src.nodata is not None:
                    arr[arr == src.nodata] = 0.0
                arr = RasterPreprocessor._normalize_array(arr)
                return arr, meta
        except Exception as e:
            logger.warning(f"Rasterio array read failed: {e}. Falling back to PIL.")

        # Fallback using PIL
        from PIL import Image
        with Image.open(filepath) as img:
            img = img.convert("RGB")
            np_arr = np.array(img, dtype=np.float32)  # Shape (H, W, C)
            arr = np.transpose(np_arr, (2, 0, 1))  # Convert to (C, H, W)
            arr = RasterPreprocessor._normalize_array(arr)
            return arr, meta

    @staticmethod
    def _normalize_array(arr: np.ndarray) -> np.ndarray:
        """Normalize raster array to [0.0, 1.0]."""
        max_val = np.max(arr)
        if max_val > 255.0:
            # Likely 12-bit or 16-bit Sentinel-2 / Landsat surface reflectance (0 - 10000)
            return np.clip(arr / 10000.0, 0.0, 1.0)
        elif max_val > 1.0:
            # Standard 8-bit image (0 - 255)
            return np.clip(arr / 255.0, 0.0, 1.0)
        return np.clip(arr, 0.0, 1.0)

    @staticmethod
    def _infer_modality(channels: int, dtype: str, filename: str) -> ModalityType:
        name = filename.lower()
        if any(s in name for s in ["sar", "sentinel1", "s1", "vv", "vh", "grd"]):
            return ModalityType.SAR
        if channels >= 4 or any(m in name for m in ["ms", "multispectral", "sentinel2", "s2"]):
            return ModalityType.MULTISPECTRAL
        if channels in [1, 3]:
            return ModalityType.OPTICAL
        return ModalityType.UNKNOWN
