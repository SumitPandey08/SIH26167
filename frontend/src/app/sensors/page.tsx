'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Layers,
  Satellite,
  Database,
  Radio,
  ExternalLink,
  ChevronRight,
  Sparkles,
  Search,
  SlidersHorizontal,
  X,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
} from 'lucide-react';

interface SensorItem {
  id: string;
  name: string;
  agency: 'ISRO' | 'ESA' | 'NASA' | 'Commercial';
  agencyFull: string;
  modality: 'SAR' | 'Optical' | 'Multispectral' | 'Hyperspectral';
  type: string;
  bands: string;
  resolution: string;
  revisit: string;
  status: string;
  badgeColor: string;
  description: string;
  specs: {
    orbit: string;
    swath: string;
    polarizations?: string;
    applications: string[];
  };
}

const SENSORS: SensorItem[] = [
  {
    id: 's1',
    name: 'Sentinel-1 C-Band SAR',
    agency: 'ESA',
    agencyFull: 'European Space Agency (ESA)',
    modality: 'SAR',
    type: 'Synthetic Aperture Radar (Active)',
    bands: 'C-band (5.405 GHz / 5.55 cm wavelength)',
    resolution: '5m × 20m (IW Mode), 10m GRD',
    revisit: '6 Days (Constellation)',
    status: 'Operational',
    badgeColor: 'text-cyan-400 border-cyan-500/30 bg-cyan-500/10',
    description: 'Day-and-night all-weather radar penetrating dense monsoon cloud cover. Detects open water via specular reflection and structural damage via double-bounce.',
    specs: {
      orbit: 'Sun-synchronous, 693 km altitude',
      swath: '250 km (Interferometric Wide)',
      polarizations: 'VV + VH, HH + HV',
      applications: ['Monsoon Flood Inundation', 'Maritime Vessel Delineation', 'Soil Moisture', 'Surface Deformation'],
    },
  },
  {
    id: 's2',
    name: 'Sentinel-2 MSI',
    agency: 'ESA',
    agencyFull: 'European Space Agency (ESA)',
    modality: 'Multispectral',
    type: 'Multispectral Imager (Passive)',
    bands: '13 Bands (VNIR, Red-Edge, SWIR)',
    resolution: '10m (B2, B3, B4, B8), 20m (SWIR)',
    revisit: '5 Days (Constellation)',
    status: 'Operational',
    badgeColor: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10',
    description: 'High-resolution multispectral payload for vegetation biomass (NDVI), water delineation (NDWI), and mineral spectral unmixing.',
    specs: {
      orbit: 'Sun-synchronous, 786 km altitude',
      swath: '290 km',
      polarizations: 'N/A (Optical Reflectance)',
      applications: ['Crop Health & NDVI', 'Burn Scar Assessment', 'River Basin Hydrology', 'Urban Classification'],
    },
  },
  {
    id: 'cartosat3',
    name: 'Cartosat-3',
    agency: 'ISRO',
    agencyFull: 'Indian Space Research Organisation (ISRO)',
    modality: 'Optical',
    type: 'Very High-Resolution Optical',
    bands: 'Panchromatic + 4-Band Multispectral',
    resolution: '< 0.28m (PAN), 1.12m (MX)',
    revisit: 'Spot Agile Pointing (±45°)',
    status: 'Operational',
    badgeColor: 'text-amber-400 border-amber-500/30 bg-amber-500/10',
    description: 'Indias premier sub-meter cartographic satellite providing pinpoint structural damage assessment, cadastral mapping, and urban infrastructure monitoring.',
    specs: {
      orbit: 'Polar Sun-synchronous, 505 km altitude',
      swath: '16 km',
      polarizations: 'N/A (Sub-meter Optical)',
      applications: ['Sub-meter Building Footprints', 'Cadastral Surveys', 'Disaster Damage Audit', 'Infrastructure Development'],
    },
  },
  {
    id: 'eos04',
    name: 'EOS-04 (RISAT-1A)',
    agency: 'ISRO',
    agencyFull: 'Indian Space Research Organisation (ISRO)',
    modality: 'SAR',
    type: 'C-band Synthetic Aperture Radar',
    bands: 'C-band (5.35 GHz)',
    resolution: '1m (High-Res Spotlight), 3m (Stripmap), 25m (Scansar)',
    revisit: 'Agile Spacecraft Revisit',
    status: 'Operational',
    badgeColor: 'text-blue-400 border-blue-500/30 bg-blue-500/10',
    description: 'Radar imaging satellite designed to deliver high-quality radar images under all weather conditions for agriculture, forestry, flood mapping, and soil moisture.',
    specs: {
      orbit: 'Sun-synchronous, 529 km altitude',
      swath: '10 km - 240 km',
      polarizations: 'Circular (Hybrid Pol) & Linear Quad-Pol',
      applications: ['All-Weather Flood Rescue', 'Paddy Rice Crop Inundation', 'Forest Canopy Penetration', 'Coastal Surveillance'],
    },
  },
  {
    id: 'nisar',
    name: 'NISAR (NASA-ISRO SAR)',
    agency: 'NASA',
    agencyFull: 'NASA JPL & ISRO SAC',
    modality: 'SAR',
    type: 'Dual-Frequency Spaceborne Radar',
    bands: 'L-band (24 cm) + S-band (9 cm)',
    resolution: '3m - 10m over 240 km Swath',
    revisit: '12 Days Global Revisit',
    status: 'Pre-Flight Final Integration',
    badgeColor: 'text-purple-400 border-purple-500/30 bg-purple-500/10',
    description: 'World’s first dual-frequency radar utilizing SweepSAR to measure Earth crustal deformation, glacier dynamics, and ecosystem disturbance down to centimeters.',
    specs: {
      orbit: 'Sun-synchronous, 747 km altitude',
      swath: '240 km (SweepSAR)',
      polarizations: 'Full Polarimetric (Dual-Frequency)',
      applications: ['Glacial Calving & Ice Melt', 'Landslide Kinematics', 'Aquifer Depletion', 'Earthquake Crustal Displacement'],
    },
  },
];

const DATASET_TIERS = [
  {
    tier: 'Tier 1',
    title: 'Vision-Language & Core Foundations',
    count: '4 Datasets',
    items: [
      { name: 'BigEarthNet v2.0', role: '549k Sentinel-1/2 multi-sensor patches with 9.6M text annotations.', modality: 'Optical + SAR' },
      { name: 'VRSBench', role: '29.6k images, 52k referring boxes, and 123k VQA question-answer pairs.', modality: 'Vision-Language' },
      { name: 'RSVQA', role: 'Overhead natural language visual question answering benchmark.', modality: 'Visual QA' },
      { name: 'CDVQA', role: 'Multi-temporal change QA: Image T1 + Image T2 + Query -> Grounded Answer.', modality: 'Bi-Temporal VQA' },
    ],
  },
  {
    tier: 'Tier 2',
    title: 'Change Detection & Captioning',
    count: '3 Datasets',
    items: [
      { name: 'LEVIR-CD', role: 'Sub-meter pixel building construction & destruction change masks.', modality: '0.5m Optical' },
      { name: 'LEVIR-CC', role: 'Change captioning benchmark explaining "What changed?" in natural language sentences.', modality: 'Captioning' },
      { name: 'SECOND', role: 'Semantic change detection mapping land-cover transition matrices.', modality: 'Multi-Class CD' },
    ],
  },
  {
    tier: 'Tier 3 & 4',
    title: 'Disaster & Optical + SAR Fusion',
    count: '4 Datasets',
    items: [
      { name: 'SEN12MS', role: '180k co-registered Sentinel-1 SAR and Sentinel-2 optical triplets.', modality: 'Co-Registered Pairs' },
      { name: 'FloodNet', role: 'High-resolution UAV and satellite flood visual reasoning.', modality: 'Disaster Flood' },
      { name: 'UrbanSARFloods', role: '8,879 Sentinel-1 patches dedicated to urban flood radar change.', modality: 'C-Band SAR' },
      { name: 'BRIGHT', role: '4,538 global optical + SAR pairs for extreme disaster damage.', modality: 'Multi-Sensor Fusion' },
    ],
  },
];

export default function SensorsPage() {
  const [activeTab, setActiveTab] = useState<'sensors' | 'datasets'>('sensors');
  const [agencyFilter, setAgencyFilter] = useState<'ALL' | 'ISRO' | 'ESA' | 'NASA'>('ALL');
  const [modalityFilter, setModalityFilter] = useState<'ALL' | 'SAR' | 'Optical' | 'Multispectral'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSensor, setSelectedSensor] = useState<SensorItem | null>(null);

  const filteredSensors = useMemo(() => {
    return SENSORS.filter((s) => {
      const matchAgency = agencyFilter === 'ALL' || s.agency === agencyFilter;
      const matchModality = modalityFilter === 'ALL' || s.modality === modalityFilter;
      const matchSearch =
        !searchQuery.trim() ||
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.bands.toLowerCase().includes(searchQuery.toLowerCase());
      return matchAgency && matchModality && matchSearch;
    });
  }, [agencyFilter, modalityFilter, searchQuery]);

  return (
    <main className="h-full w-full overflow-y-auto px-4 md:px-8 py-6 max-w-6xl mx-auto flex flex-col gap-7 pb-16 no-scrollbar">
      {/* 1. Header */}
      <section className="flex flex-col md:flex-row items-start md:items-end justify-between gap-4 border-b border-white/5 pb-6 animate-fade-up">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-medium mb-3">
            <Layers className="w-3.5 h-3.5" />
            <span>Earth Observation Ecosystem</span>
          </div>
          <h1 className="text-3xl font-semibold tracking-tight text-white font-sans">
            Sensor Payloads & Ingested Benchmarks
          </h1>
          <p className="text-neutral-400 text-sm mt-1 max-w-2xl leading-relaxed">
            SatQuery AI harmonizes sub-meter optical, multispectral, and microwave synthetic aperture radar (SAR) telemetry across international and ISRO space assets.
          </p>
        </div>

        {/* Tab Switcher Segmented Control */}
        <div className="flex items-center p-1 rounded-full ios-glass border border-white/10 text-xs shrink-0">
          <button
            onClick={() => setActiveTab('sensors')}
            className={`px-4 py-1.5 rounded-full font-medium transition-all ios-btn ${
              activeTab === 'sensors' ? 'bg-white/15 text-white shadow-sm' : 'text-neutral-400 hover:text-white'
            }`}
          >
            Satellites & Sensors
          </button>
          <button
            onClick={() => setActiveTab('datasets')}
            className={`px-4 py-1.5 rounded-full font-medium transition-all ios-btn ${
              activeTab === 'datasets' ? 'bg-white/15 text-white shadow-sm' : 'text-neutral-400 hover:text-white'
            }`}
          >
            10-Tier Dataset Catalog
          </button>
        </div>
      </section>

      {/* 2. Interactive Search & Filters Strip */}
      <section className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 animate-fade-up" style={{ animationDelay: '100ms' }}>
        {/* Search input */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search payload, frequency, agency, or resolution..."
            className="w-full pl-10 pr-4 py-2 rounded-full ios-glass border border-white/10 text-xs text-white outline-none focus:border-cyan-500/50 transition-all"
          />
        </div>

        {/* Filter Pills */}
        {activeTab === 'sensors' && (
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
            {/* Agency Pills */}
            <div className="flex items-center p-0.5 rounded-full bg-neutral-900/80 border border-white/5 text-[11px]">
              {(['ALL', 'ISRO', 'ESA', 'NASA'] as const).map((a) => (
                <button
                  key={a}
                  onClick={() => setAgencyFilter(a)}
                  className={`px-3 py-1 rounded-full font-medium transition-all ios-btn ${
                    agencyFilter === a ? 'bg-white/15 text-white shadow-sm' : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  {a}
                </button>
              ))}
            </div>

            {/* Modality Pills */}
            <div className="flex items-center p-0.5 rounded-full bg-neutral-900/80 border border-white/5 text-[11px]">
              {(['ALL', 'SAR', 'Optical', 'Multispectral'] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => setModalityFilter(m)}
                  className={`px-3 py-1 rounded-full font-medium transition-all ios-btn ${
                    modalityFilter === m ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* 3. Sensors View */}
      {activeTab === 'sensors' && (
        <section className="grid grid-cols-1 md:grid-cols-2 gap-5 animate-fade-up" style={{ animationDelay: '150ms' }}>
          {filteredSensors.map((s) => (
            <div
              key={s.id}
              onClick={() => setSelectedSensor(s)}
              className="p-6 rounded-3xl ios-glass-card flex flex-col justify-between cursor-pointer group"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className={`text-[10px] font-mono font-semibold px-2.5 py-0.5 rounded-full border ${s.badgeColor}`}>
                    {s.status}
                  </span>
                  <span className="text-xs text-neutral-400 font-mono">{s.agencyFull}</span>
                </div>

                <h3 className="text-lg font-semibold text-white group-hover:text-cyan-300 transition-colors">
                  {s.name}
                </h3>
                <p className="text-xs text-neutral-400 mt-2 leading-relaxed">{s.description}</p>

                <div className="grid grid-cols-2 gap-2 mt-5 text-[11px] font-mono">
                  <div className="p-2.5 rounded-xl bg-white/5">
                    <span className="text-neutral-500 block text-[9px]">PAYLOAD TYPE</span>
                    <span className="text-neutral-200">{s.type}</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white/5">
                    <span className="text-neutral-500 block text-[9px]">SPECTRAL BANDS</span>
                    <span className="text-cyan-300 truncate block">{s.bands}</span>
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

              <div className="flex items-center justify-between pt-4 mt-5 border-t border-white/5 text-xs text-neutral-400">
                <span className="text-[11px] font-mono">Click for Technical Specs</span>
                <span className="text-cyan-400 font-medium group-hover:translate-x-1 transition-transform flex items-center gap-1">
                  <span>Inspect</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>
          ))}
        </section>
      )}

      {/* 4. Datasets View */}
      {activeTab === 'datasets' && (
        <section className="space-y-6 animate-fade-up" style={{ animationDelay: '150ms' }}>
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
                    className="p-4 rounded-2xl ios-glass-card flex items-start gap-3.5"
                  >
                    <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center shrink-0 mt-0.5">
                      <Database className="w-4 h-4 text-cyan-400" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-semibold text-white">{item.name}</h4>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/5 text-neutral-300">
                          {item.modality}
                        </span>
                      </div>
                      <p className="text-[11px] text-neutral-400 mt-1.5 leading-relaxed">{item.role}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </section>
      )}

      {/* 5. Sensor Technical Specs iOS Modal */}
      {selectedSensor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-fade-in">
          <div className="w-full max-w-lg rounded-3xl ios-glass border border-white/15 p-6 shadow-2xl animate-spring-in flex flex-col gap-4">
            <div className="flex items-start justify-between pb-3 border-b border-white/10">
              <div>
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-mono font-semibold px-2.5 py-0.5 rounded-full border ${selectedSensor.badgeColor}`}>
                    {selectedSensor.status}
                  </span>
                  <span className="text-xs text-neutral-400 font-mono">{selectedSensor.agencyFull}</span>
                </div>
                <h3 className="text-xl font-semibold text-white mt-1">{selectedSensor.name}</h3>
              </div>
              <button
                onClick={() => setSelectedSensor(null)}
                className="text-neutral-400 hover:text-white p-1 rounded-full hover:bg-white/10 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-neutral-300 leading-relaxed">{selectedSensor.description}</p>

            <div className="grid grid-cols-2 gap-2 text-xs font-mono">
              <div className="p-3 rounded-2xl bg-white/5 border border-white/5">
                <span className="text-neutral-500 text-[10px] block">ORBIT SPECIFICATION</span>
                <span className="text-white mt-1 block font-medium">{selectedSensor.specs.orbit}</span>
              </div>
              <div className="p-3 rounded-2xl bg-white/5 border border-white/5">
                <span className="text-neutral-500 text-[10px] block">SWATH WIDTH</span>
                <span className="text-cyan-300 mt-1 block font-medium">{selectedSensor.specs.swath}</span>
              </div>
              <div className="p-3 rounded-2xl bg-white/5 border border-white/5">
                <span className="text-neutral-500 text-[10px] block">SPATIAL RESOLUTION</span>
                <span className="text-emerald-400 mt-1 block font-medium">{selectedSensor.resolution}</span>
              </div>
              <div className="p-3 rounded-2xl bg-white/5 border border-white/5">
                <span className="text-neutral-500 text-[10px] block">POLARIZATIONS / BANDS</span>
                <span className="text-amber-300 mt-1 block font-medium truncate">{selectedSensor.specs.polarizations || selectedSensor.bands}</span>
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-white/5 border border-white/5">
              <span className="text-[10px] font-mono uppercase text-neutral-400 block mb-2 font-semibold">
                Operational Applications
              </span>
              <div className="flex flex-wrap gap-1.5">
                {selectedSensor.specs.applications.map((app, i) => (
                  <span
                    key={i}
                    className="px-2.5 py-1 rounded-full bg-white/5 text-[11px] text-neutral-200 border border-white/5"
                  >
                    {app}
                  </span>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-white/10">
              <Link
                href="/investigate"
                onClick={() => setSelectedSensor(null)}
                className="px-4 py-2 rounded-full bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/30 text-xs font-medium transition-all ios-btn flex items-center gap-1.5"
              >
                <span>Query Sensor in AI Investigation</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
              <button
                onClick={() => setSelectedSensor(null)}
                className="px-4 py-2 rounded-full text-xs font-medium text-neutral-400 hover:text-white transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
