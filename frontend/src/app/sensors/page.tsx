'use client';

import React, { useState } from 'react';
import {
  Layers,
  Satellite,
  Database,
  Radio,
  ExternalLink,
  ChevronRight,
  Sparkles,
} from 'lucide-react';

const SENSORS = [
  {
    id: 's1',
    name: 'Sentinel-1 C-Band SAR',
    agency: 'European Space Agency (ESA)',
    type: 'Synthetic Aperture Radar (Active)',
    bands: 'C-band (5.405 GHz / 5.55 cm)',
    resolution: '5m × 20m (IW Mode), 10m GRD',
    revisit: '6 Days (Constellation)',
    status: 'Operational',
    badgeColor: 'text-cyan-400 border-cyan-500/30 bg-cyan-500/10',
    description: 'Day-and-night all-weather radar penetrating dense monsoon cloud cover. Detects open water via specular reflection and buildings via double-bounce.',
  },
  {
    id: 's2',
    name: 'Sentinel-2 MSI',
    agency: 'European Space Agency (ESA)',
    type: 'Multispectral Imager (Passive)',
    bands: '13 Bands (VNIR, Red-Edge, SWIR)',
    resolution: '10m (B2, B3, B4, B8), 20m (SWIR)',
    revisit: '5 Days (Constellation)',
    status: 'Operational',
    badgeColor: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10',
    description: 'High-resolution multispectral payload for vegetation biomass (NDVI), water delineation (NDWI), and mineral spectral unmixing.',
  },
  {
    id: 'cartosat3',
    name: 'Cartosat-3',
    agency: 'Indian Space Research Organisation (ISRO)',
    type: 'Very High-Resolution Optical',
    bands: 'Panchromatic + 4-Band Multispectral',
    resolution: '< 0.28m (PAN), 1.12m (MX)',
    revisit: 'Spot Agile Pointing (±45°)',
    status: 'Operational',
    badgeColor: 'text-amber-400 border-amber-500/30 bg-amber-500/10',
    description: 'Indias premier sub-meter cartographic satellite providing pinpoint structural damage assessment, cadastral mapping, and urban infrastructure monitoring.',
  },
  {
    id: 'nisar',
    name: 'NISAR (NASA-ISRO SAR)',
    agency: 'NASA JPL & ISRO SAC',
    type: 'Dual-Frequency Spaceborne Radar',
    bands: 'L-band (24 cm) + S-band (9 cm)',
    resolution: '3m - 10m over 240 km Swath',
    revisit: '12 Days Global Revisit',
    status: 'Pre-Flight Final Integration',
    badgeColor: 'text-purple-400 border-purple-500/30 bg-purple-500/10',
    description: 'World’s first dual-frequency radar utilizing SweepSAR to measure Earth crustal deformation, glacier dynamics, and ecosystem disturbance down to centimeters.',
  },
];

const DATASET_TIERS = [
  {
    tier: 'Tier 1',
    title: 'Vision-Language & Core Foundations',
    count: '4 Datasets',
    items: [
      { name: 'BigEarthNet v2.0', role: '549k Sentinel-1/2 multi-sensor patches with 9.6M text annotations.' },
      { name: 'VRSBench', role: '29.6k images, 52k referring boxes, and 123k VQA question-answer pairs.' },
      { name: 'RSVQA', role: 'Overhead natural language visual question answering benchmark.' },
      { name: 'CDVQA', role: 'Multi-temporal change QA: Image T1 + Image T2 + Query -> Grounded Answer.' },
    ],
  },
  {
    tier: 'Tier 2',
    title: 'Change Detection & Captioning',
    count: '3 Datasets',
    items: [
      { name: 'LEVIR-CD', role: 'Sub-meter pixel building construction & destruction change masks.' },
      { name: 'LEVIR-CC', role: 'Change captioning benchmark explaining "What changed?" in sentences.' },
      { name: 'SECOND', role: 'Semantic change detection mapping land-cover transition matrices.' },
    ],
  },
  {
    tier: 'Tier 3 & 4',
    title: 'Disaster & Optical + SAR Fusion',
    count: '4 Datasets',
    items: [
      { name: 'SEN12MS', role: '180k co-registered Sentinel-1 SAR and Sentinel-2 optical triplets.' },
      { name: 'FloodNet', role: 'High-resolution UAV and satellite flood visual reasoning.' },
      { name: 'UrbanSARFloods', role: '8,879 Sentinel-1 patches dedicated to urban flood radar change.' },
      { name: 'BRIGHT', role: '4,538 global optical + SAR pairs for extreme disaster damage.' },
    ],
  },
];

export default function SensorsPage() {
  const [tab, setTab] = useState<'sensors' | 'datasets'>('sensors');

  return (
    <main className="h-full w-full overflow-y-auto px-6 py-8 max-w-6xl mx-auto flex flex-col gap-8">
      {/* 1. Header */}
      <section className="flex flex-col md:flex-row items-start md:items-end justify-between gap-4 border-b border-white/5 pb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-medium mb-3">
            <Layers className="w-3.5 h-3.5" />
            <span>Earth Observation Ecosystem</span>
          </div>
          <h1 className="text-3xl font-semibold tracking-tight text-white">
            Sensor Payloads & Ingested Datasets
          </h1>
          <p className="text-neutral-400 text-sm mt-1 max-w-2xl">
            SatQuery AI harmonizes multispectral, panchromatic, and microwave synthetic aperture radar data across international and Indian space platforms.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center p-1 rounded-full bg-neutral-900 border border-white/10 text-xs">
          <button
            onClick={() => setTab('sensors')}
            className={`px-4 py-1.5 rounded-full font-medium transition ${
              tab === 'sensors' ? 'bg-white/15 text-white' : 'text-neutral-400 hover:text-white'
            }`}
          >
            Satellites & Sensors
          </button>
          <button
            onClick={() => setTab('datasets')}
            className={`px-4 py-1.5 rounded-full font-medium transition ${
              tab === 'datasets' ? 'bg-white/15 text-white' : 'text-neutral-400 hover:text-white'
            }`}
          >
            10-Tier Dataset Catalog
          </button>
        </div>
      </section>

      {/* 2. Sensors View */}
      {tab === 'sensors' && (
        <section className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {SENSORS.map((s) => (
            <div
              key={s.id}
              className="p-6 rounded-3xl bg-neutral-900/40 backdrop-blur-xl border border-white/5 hover:border-white/15 transition flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className={`text-[10px] font-mono font-semibold px-2.5 py-0.5 rounded-full border ${s.badgeColor}`}>
                    {s.status}
                  </span>
                  <span className="text-xs text-neutral-500 font-mono">{s.agency}</span>
                </div>

                <h3 className="text-lg font-semibold text-white">{s.name}</h3>
                <p className="text-xs text-neutral-400 mt-2 leading-relaxed">{s.description}</p>

                <div className="grid grid-cols-2 gap-2 mt-5 text-[11px] font-mono">
                  <div className="p-2.5 rounded-xl bg-white/5">
                    <span className="text-neutral-500 block text-[9px]">PAYLOAD TYPE</span>
                    <span className="text-neutral-200">{s.type}</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white/5">
                    <span className="text-neutral-500 block text-[9px]">SPECTRAL BANDS</span>
                    <span className="text-cyan-300">{s.bands}</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white/5">
                    <span className="text-neutral-500 block text-[9px]">SPATIAL RESOLUTION</span>
                    <span className="text-emerald-400">{s.resolution}</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white/5">
                    <span className="text-neutral-500 block text-[9px]">REVISIT FREQUENCY</span>
                    <span className="text-amber-400">{s.revisit}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </section>
      )}

      {/* 3. Datasets View */}
      {tab === 'datasets' && (
        <section className="space-y-6">
          {DATASET_TIERS.map((t, idx) => (
            <div key={idx} className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-cyan-400">{t.tier}</span>
                  <span className="text-white/20">•</span>
                  <h3 className="text-sm font-semibold text-white">{t.title}</h3>
                </div>
                <span className="text-xs text-neutral-500 font-mono">{t.count}</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {t.items.map((item, itemIdx) => (
                  <div
                    key={itemIdx}
                    className="p-4 rounded-2xl bg-neutral-900/30 border border-white/5 flex items-start gap-3"
                  >
                    <div className="w-7 h-7 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center shrink-0 mt-0.5">
                      <Database className="w-3.5 h-3.5 text-cyan-400" />
                    </div>
                    <div>
                      <h4 className="text-xs font-semibold text-white">{item.name}</h4>
                      <p className="text-[11px] text-neutral-400 mt-1 leading-relaxed">{item.role}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </section>
      )}
    </main>
  );
}
