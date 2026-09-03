# Authoritative Disaster Protocol: All-Weather Flood Assessment via Optical & SAR
**Source:** International Charter "Space and Major Disasters" & Copernicus Emergency Management Service (EMS)  
**Domain:** Disaster Rapid Mapping & Multimodal Fusion

---

## 1. The Cloud Blindness Dilemma in Flood Monitoring
Monsoon storms, typhoons, and atmospheric rivers produce widespread inland flooding but simultaneously generate **persistent 80% - 100% cloud cover**.
- **Optical Sensors (Sentinel-2, Landsat, Cartosat):** Completely obscured by thick cumulus and stratus cloud formations. False-color NIR water detection cannot penetrate cloud tops.
- **SAR Sensors (Sentinel-1, RISAT-1):** Centimeter-wavelength microwaves (C-band 5.6 cm, L-band 24 cm) pass through atmospheric hydrometeors, cloud vapor, and smoke with negligible signal attenuation, day or night.

---

## 2. Multi-Sensor Synergy & Fusion Logic
In SatQuery AI, optical and SAR data are fused using a complementary sensor rule:
1. **Clear Sky Pixels:** Exploit high-resolution multispectral reflectance (NDWI / MNDWI) for fine water boundary delineation.
2. **Cloud-Obscured Pixels:** Switch dynamically to Sentinel-1 calibrated radar backscatter ($\sigma^0$). Smooth standing floodwater causes forward specular reflection away from the radar antenna, producing distinct dark backscatter signatures ($< -16 \text{ dB}$).
3. **Emergent Flooded Vegetation:** Where floodwaters inundate agricultural crops or forest floors, double-bounce reflections between standing water and vertical plant stems cause high backscatter spikes in VV, revealing submerged terrain that optical images miss.
