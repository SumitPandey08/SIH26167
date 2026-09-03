"""
SatQuery AI — Core Application Configuration & Device Manager
"""

import os
from pathlib import Path
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    APP_NAME: str = "SatQuery AI Specialist Service"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = True
    PORT: int = 8000
    HOST: str = "0.0.0.0"

    # Base workspace directory (resolved relative to repository root)
    BASE_DIR: Path = Path(__file__).resolve().parent.parent.parent.parent.parent
    STORAGE_DIR: Path = BASE_DIR / "storage"
    UPLOADS_DIR: Path = STORAGE_DIR / "uploads"
    MASKS_DIR: Path = STORAGE_DIR / "masks"
    VECTORS_DIR: Path = STORAGE_DIR / "vectors"
    REPORTS_DIR: Path = STORAGE_DIR / "reports"
    DATASETS_DIR: Path = BASE_DIR / "datasets"

    # Hardware & Compute Configuration
    DEFAULT_DEVICE: str = "cpu"  # Will dynamically detect in DeviceManager
    USE_GPU_IF_AVAILABLE: bool = True
    MAX_IMAGE_DIMENSION: int = 4096

    class Config:
        env_file = ".env"
        extra = "allow"


settings = Settings()

# Ensure directories exist
for directory in [
    settings.STORAGE_DIR,
    settings.UPLOADS_DIR,
    settings.MASKS_DIR,
    settings.VECTORS_DIR,
    settings.REPORTS_DIR,
    settings.DATASETS_DIR,
]:
    directory.mkdir(parents=True, exist_ok=True)
