"""
SatQuery AI — Synthetic Remote Sensing Demo Data Generator
Generates realistic multi-temporal optical, SAR, and cloud-covered scenes
for immediate offline testing and hackathon judging demonstrations.
"""

import os
from pathlib import Path
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

output_dir = Path(__file__).resolve().parent.parent / "datasets" / "demo"
storage_uploads = Path(__file__).resolve().parent.parent / "storage" / "uploads"
output_dir.mkdir(parents=True, exist_ok=True)
storage_uploads.mkdir(parents=True, exist_ok=True)

WIDTH, HEIGHT = 512, 512

def generate_scenes():
    print(f"Generating realistic remote sensing demo scenes ({WIDTH}x{HEIGHT})...")
    np.random.seed(42)

    # -------------------------------------------------------------
    # 1. Base Terrain (Vegetation, Mountains, Valleys)
    # -------------------------------------------------------------
    # Generate smooth base green/brown terrain
    x = np.linspace(0, 10, WIDTH)
    y = np.linspace(0, 10, HEIGHT)
    xx, yy = np.meshgrid(x, y)
    elevation = np.sin(xx * 0.5) * np.cos(yy * 0.5) + np.random.normal(0, 0.05, (HEIGHT, WIDTH))

    # T1 Optical Base (2020 - Normal River)
    t1_rgb = np.zeros((HEIGHT, WIDTH, 3), dtype=np.uint8)
    # Vegetation base (dark olive green)
    t1_rgb[:, :, 0] = np.clip(50 + elevation * 20, 20, 90).astype(np.uint8)
    t1_rgb[:, :, 1] = np.clip(110 + elevation * 35, 60, 170).astype(np.uint8)
    t1_rgb[:, :, 2] = np.clip(45 + elevation * 15, 20, 80).astype(np.uint8)

    # Add meandering normal river for T1 (narrow channel)
    river_mask_t1 = np.zeros((HEIGHT, WIDTH), dtype=bool)
    center_curve = 256 + 80 * np.sin(np.linspace(0, 4, HEIGHT))
    for r in range(HEIGHT):
        c = int(center_curve[r])
        river_mask_t1[r, max(0, c - 15):min(WIDTH, c + 15)] = True

    # Color river in T1 (deep blue-cyan water)
    t1_rgb[river_mask_t1] = [25, 75, 140]

    # Save T1 Optical
    img_t1 = Image.fromarray(t1_rgb)
    img_t1.save(output_dir / "nepal_2020_t1_optical.png")
    img_t1.save(storage_uploads / "nepal_2020_t1_optical.png")
    print("✓ Saved nepal_2020_t1_optical.png")

    # -------------------------------------------------------------
    # 2. T2 Optical Base (2026 - Post-Flood Inundation)
    # -------------------------------------------------------------
    t2_rgb = t1_rgb.copy()
    # Expanded flooded river (wide channel + flood plains)
    river_mask_t2 = np.zeros((HEIGHT, WIDTH), dtype=bool)
    for r in range(HEIGHT):
        c = int(center_curve[r])
        # Swollen width: 55px wide instead of 30px
        river_mask_t2[r, max(0, c - 45):min(WIDTH, c + 45)] = True

    # Color flooded river in T2 (turbid floodwater, slightly more sediment/cyan)
    t2_rgb[river_mask_t2] = [35, 110, 175]

    # Add vegetative loss around river banks (sediment/mud deposit)
    mud_mask = np.zeros((HEIGHT, WIDTH), dtype=bool)
    for r in range(HEIGHT):
        c = int(center_curve[r])
        mud_mask[r, max(0, c - 60):max(0, c - 45)] = True
        mud_mask[r, min(WIDTH, c + 45):min(WIDTH, c + 60)] = True
    t2_rgb[mud_mask] = [135, 120, 85] # Brown mud

    img_t2 = Image.fromarray(t2_rgb)
    img_t2.save(output_dir / "nepal_2026_t2_optical.png")
    img_t2.save(storage_uploads / "nepal_2026_t2_optical.png")
    print("✓ Saved nepal_2026_t2_optical.png")

    # -------------------------------------------------------------
    # 3. Sentinel-1 SAR (Microwave Radar Image)
    # -------------------------------------------------------------
    # In SAR: Water appears very dark (< -16 dB) due to specular reflection.
    # Forest/Vegetation appears medium gray (-12 to -8 dB) due to volume scattering.
    # Buildings/Double-bounce appear bright white (> -5 dB).
    sar_arr = np.random.normal(90, 18, (HEIGHT, WIDTH)).astype(np.float32) # Base vegetation
    sar_arr[river_mask_t2] = np.random.normal(25, 6, np.sum(river_mask_t2)) # Specular dark water

    # Add some urban double-bounce clusters on north-west bank
    sar_arr[60:110, 80:130] = np.random.normal(230, 15, (50, 50))

    sar_arr = np.clip(sar_arr, 0, 255).astype(np.uint8)
    img_sar = Image.fromarray(sar_arr)
    # Apply slight speckle texture
    img_sar.save(output_dir / "sentinel1_2026_sar_flood.png")
    img_sar.save(storage_uploads / "sentinel1_2026_sar_flood.png")
    print("✓ Saved sentinel1_2026_sar_flood.png")

    # -------------------------------------------------------------
    # 4. Cloud-Covered Optical Scene (for Optical+SAR Fusion)
    # -------------------------------------------------------------
    # Simulate thick monsoon cumulus clouds obscuring 65% of the flood river
    t2_cloud = t2_rgb.copy()
    cloud_noise = np.clip(np.random.normal(180, 50, (HEIGHT, WIDTH)), 0, 255).astype(np.uint8)
    cloud_mask_geom = np.zeros((HEIGHT, WIDTH), dtype=np.uint8)
    cloud_img = Image.fromarray(cloud_mask_geom)
    draw = ImageDraw.Draw(cloud_img)
    # Draw massive puffy cloud polygons
    draw.ellipse([80, 100, 420, 380], fill=240)
    draw.ellipse([200, 50, 480, 280], fill=255)
    cloud_blurred = cloud_img.filter(ImageFilter.GaussianBlur(radius=25))
    cloud_arr = np.array(cloud_blurred) / 255.0

    for ch in range(3):
        t2_cloud[:, :, ch] = (t2_cloud[:, :, ch] * (1.0 - cloud_arr) + 245 * cloud_arr).astype(np.uint8)

    img_cloud = Image.fromarray(t2_cloud)
    img_cloud.save(output_dir / "nepal_2026_cloud_covered_optical.png")
    img_cloud.save(storage_uploads / "nepal_2026_cloud_covered_optical.png")
    print("✓ Saved nepal_2026_cloud_covered_optical.png")
    print("All demo satellite assets successfully generated!")

if __name__ == "__main__":
    generate_scenes()
