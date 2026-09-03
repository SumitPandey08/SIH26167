# Authoritative Sensor Guide: Sentinel-1 C-Band SAR
**Source:** European Space Agency (ESA) Sentinel-1 User Handbook & Technical Guide  
**Domain:** Synthetic Aperture Radar (SAR) Microwave Remote Sensing

---

## 1. Instrument Specifications
- **Frequency:** C-band (5.405 GHz), corresponding to a wavelength of approximately **5.55 cm**.
- **Operation Modes:**
  - Interferometric Wide Swath (IW): Primary operational mode over land (250 km swath, 5m x 20m spatial resolution).
  - Extra-Wide Swath (EW): Primarily for maritime and polar monitoring (400 km swath).
  - Stripmap (SM): High-resolution mode for dedicated emergency requests (80 km swath, 5m x 5m resolution).
- **Polarizations:** Dual polarization:
  - Vertical-Vertical (VV): Sensitive to surface roughness and wind-driven water ripples.
  - Vertical-Horizontal (VH): Sensitive to volume scattering in vegetation canopy.

---

## 2. Radiometric Calibration & Decibel Conversion
Raw Sentinel-1 Ground Range Detected (GRD) pixel values represent Digital Numbers ($DN$).
To extract physical radar cross-section (backscatter coefficient $\sigma^0$):

$$\sigma^0 (dB) = 10 \cdot \log_{10}(DN^2 + \epsilon) - K$$

where $K$ is the sensor calibration constant from product metadata XML.

Typical physical backscatter ranges:
- **Calm Open Water / Inundated Surfaces:** **$-24 \text{ dB to } -16 \text{ dB}$** (Very Dark)
- **Bare Agricultural Soil:** **$-15 \text{ dB to } -10 \text{ dB}$** (Medium-Dark)
- **Dense Forest Canopy:** **$-12 \text{ dB to } -7 \text{ dB}$** (Medium-Gray)
- **Urban Dihedral Corners & Steel Structures:** **$-5 \text{ dB to } +6 \text{ dB}$** (Very Bright)

---

## 3. Scattering Mechanisms
1. **Specular Scattering:** On flat water surfaces, the radar pulse bounces specularly away from the sensor antenna. Virtually no energy returns, making water bodies appear distinctly black in SAR imagery.
2. **Double-Bounce Scattering:** Formed by orthogonal intersections between vertical walls and horizontal ground. Energy reflects twice and returns directly to the antenna, producing bright radiometric spikes.
3. **Volume Scattering:** Penetrates forest leaves and scatters repeatedly inside the canopy volume, depolarizing the wave (strong response in VH).

---

## 4. Speckle Filtering
Because SAR is a coherent imaging system, constructive and destructive interference creates high-frequency granular multiplicative noise ("speckle").
- **Recommended Filter:** **Enhanced Lee Filter** ($5 \times 5$ kernel) balances speckle variance reduction without blurring linear edge boundaries (levees, riverbanks, roads).
