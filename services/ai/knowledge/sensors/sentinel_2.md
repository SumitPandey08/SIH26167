# Authoritative Sensor Guide: Sentinel-2 Multispectral Instrument (MSI)
**Source:** European Space Agency (ESA) Sentinel-2 MSI Technical Guide  
**Domain:** Optical & Multispectral Remote Sensing

---

## 1. Instrument Specifications & Spectral Bands
Sentinel-2 carries a wide-swath high-resolution multispectral imager with 13 spectral bands:

| Band | Central Wavelength (nm) | Bandwidth (nm) | Spatial Resolution (GSD) | Primary Application |
|:---|:---|:---|:---|:---|
| **B1** | 443 | 20 | 60 m | Coastal aerosol / atmospheric correction |
| **B2** | 490 | 65 | **10 m** | Blue: Vegetation pigment, soil/veg discrimination |
| **B3** | 560 | 35 | **10 m** | Green: Peak vegetation reflectance, water turbidity |
| **B4** | 665 | 30 | **10 m** | Red: Chlorophyll absorption, vegetation health |
| **B5** | 705 | 15 | 20 m | Red Edge 1: Plant stress analysis |
| **B6** | 740 | 15 | 20 m | Red Edge 2: Canopy chlorophyll content |
| **B7** | 783 | 20 | 20 m | Red Edge 3: Leaf Area Index (LAI) |
| **B8** | 842 | 115 | **10 m** | Near-Infrared (NIR): Biomass, open water absorption |
| **B8A**| 865 | 20 | 20 m | Narrow NIR: Atmospheric water vapor reference |
| **B9** | 945 | 20 | 60 m | Water vapor absorption detection |
| **B10**| 1375 | 30 | 60 m | Cirrus cloud detection |
| **B11**| 1610 | 90 | 20 m | Shortwave Infrared (SWIR-1): Snow/ice/cloud discrimination |
| **B12**| 2190 | 180 | 20 m | Shortwave Infrared (SWIR-2): Soil moisture & mineral mapping |

---

## 2. Standard Mathematical Spectral Indices

### Normalized Difference Water Index (NDWI)
Formulated by McFeeters (1996):

$$NDWI = \frac{\rho_{\text{Green}} - \rho_{\text{NIR}}}{\rho_{\text{Green}} + \rho_{\text{NIR}}} = \frac{B3 - B8}{B3 + B8}$$

- **Thresholding:** Values $> 0.0$ generally represent open liquid water. NIR radiation is strongly absorbed by water while green light is reflected.

### Modified Normalized Difference Water Index (MNDWI)
Formulated by Xu (2006):

$$MNDWI = \frac{\rho_{\text{Green}} - \rho_{\text{SWIR}}}{\rho_{\text{Green}} + \rho_{\text{SWIR}}} = \frac{B3 - B11}{B3 + B11}$$

- **Advantage:** Replaces NIR with SWIR to suppress false-positive water classifications in dense urban built-up areas.

### Normalized Difference Vegetation Index (NDVI)
Formulated by Rouse et al. (1974):

$$NDVI = \frac{\rho_{\text{NIR}} - \rho_{\text{Red}}}{\rho_{\text{NIR}} + \rho_{\text{Red}}} = \frac{B8 - B4}{B8 + B4}$$

- **Thresholding:**
  - $0.1 - 0.2$: Bare rock, sand, concrete
  - $0.2 - 0.4$: Sparse shrubs, grasslands
  - $0.6 - 0.9$: Dense temperate / tropical forest canopy, healthy crops
