'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import maplibregl from 'maplibre-gl';
import {
  Layers,
  Sliders,
  Compass,
  Eye,
  Info,
  ChevronDown,
  ShieldCheck,
  Radio,
  FileCode,
  FileText,
  Sparkles,
  Maximize2,
} from 'lucide-react';
import { Investigation, InvestigationImage, EvidenceNode } from '../../types';

interface MissionLocation {
  center: [number, number];
  zoom: number;
  pitch: number;
  bearing: number;
  gsd: string;
  crs: string;
}

const MISSION_COORDINATES: Record<string, MissionLocation> = {
  real_levir_urban_change: {
    center: [-84.365, 33.755],
    zoom: 14.5,
    pitch: 35,
    bearing: -5,
    gsd: '0.5 m/px',
    crs: 'EPSG:32616 (UTM 16N)',
  },
  real_sentinel_crossmodal: {
    center: [68.185, 23.515],
    zoom: 11.5,
    pitch: 45,
    bearing: -10,
    gsd: '10.0 m/px',
    crs: 'EPSG:32642 (UTM 42N)',
  },
  demo_nepal_hydrology: {
    center: [85.5718, 27.8324],
    zoom: 12.4,
    pitch: 45,
    bearing: -15,
    gsd: '10.0 m/px',
    crs: 'EPSG:32644 (UTM 44N)',
  },
  demo_sar_flood: {
    center: [85.5718, 27.8324],
    zoom: 12.4,
    pitch: 45,
    bearing: -15,
    gsd: '10.0 m/px',
    crs: 'EPSG:32644 (UTM 44N)',
  },
};

function MapCanvasInner() {
  const searchParams = useSearchParams();
  const requestedId = searchParams.get('id');

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);

  // Dynamic Data States
  const [investigations, setInvestigations] = useState<Investigation[]>([]);
  const [activeInv, setActiveInv] = useState<Investigation | null>(null);
  const [isMissionDropdownOpen, setIsMissionDropdownOpen] = useState(false);

  // Layer & Display States
  const [selectedLayer, setSelectedLayer] = useState<'base' | 't1' | 't2' | 'evidence'>('evidence');
  const [isSwipeActive, setIsSwipeActive] = useState<boolean>(true);
  const [swipePosition, setSwipePosition] = useState<number>(50);
  const [timelinePosition, setTimelinePosition] = useState<number>(100);
  const [showDetections, setShowDetections] = useState<boolean>(true);
  const [showEvidence, setShowEvidence] = useState<boolean>(true);
  const [modalityView, setModalityView] = useState<'all' | 'optical' | 'sar'>('all');
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [opacity, setOpacity] = useState<number>(90);
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);

  // Live Map Telemetry
  const [coords, setCoords] = useState<{ lat: number; lng: number }>({ lat: 27.8324, lng: 85.5718 });
  const [zoom, setZoom] = useState<number>(12.4);
  const [pitch, setPitch] = useState<number>(45);

  // 1. Fetch investigations
  useEffect(() => {
    const fetchInvestigations = async () => {
      try {
        const res = await fetch('http://localhost:5000/api/investigations');
        if (res.ok) {
          const data = await res.json();
          const invList: Investigation[] = data.investigations || [];
          setInvestigations(invList);

          if (invList.length > 0) {
            const matched = requestedId ? invList.find((i) => i.id === requestedId) : null;
            setActiveInv(matched || invList[0]);
          }
        }
      } catch (err) {
        console.error('Failed to fetch investigations:', err);
      }
    };
    fetchInvestigations();
  }, [requestedId]);

  // 2. Initialize MapLibre GL
  useEffect(() => {
    if (!mapContainerRef.current) return;

    const initialLoc = (activeInv && MISSION_COORDINATES[activeInv.id]) || {
      center: [85.5718, 27.8324],
      zoom: 12.4,
      pitch: 45,
      bearing: -15,
    };

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: {
        version: 8,
        sources: {
          'esri-imagery': {
            type: 'raster',
            tiles: [
              'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
            ],
            tileSize: 256,
            attribution: 'Esri World Imagery',
          },
        },
        layers: [
          {
            id: 'satellite-base',
            type: 'raster',
            source: 'esri-imagery',
            minzoom: 0,
            maxzoom: 19,
          },
        ],
      },
      center: initialLoc.center,
      zoom: initialLoc.zoom,
      pitch: initialLoc.pitch,
      bearing: initialLoc.bearing,
    });

    map.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), 'top-left');

    map.on('mousemove', (e) => {
      setCoords({
        lat: parseFloat(e.lngLat.lat.toFixed(4)),
        lng: parseFloat(e.lngLat.lng.toFixed(4)),
      });
    });

    map.on('zoom', () => setZoom(parseFloat(map.getZoom().toFixed(1))));
    map.on('pitch', () => setPitch(Math.round(map.getPitch())));

    mapRef.current = map;

    return () => map.remove();
  }, []);

  // 3. Smooth Camera Glide when switching investigations
  const handleSelectInvestigation = (inv: Investigation) => {
    setActiveInv(inv);
    setIsMissionDropdownOpen(false);

    const loc = MISSION_COORDINATES[inv.id] || {
      center: inv.images[0]?.metadata.bbox
        ? [(inv.images[0].metadata.bbox[0] + inv.images[0].metadata.bbox[2]) / 2, (inv.images[0].metadata.bbox[1] + inv.images[0].metadata.bbox[3]) / 2]
        : [85.5718, 27.8324],
      zoom: 13,
      pitch: 45,
      bearing: -10,
    };

    if (mapRef.current) {
      mapRef.current.flyTo({
        center: loc.center,
        zoom: loc.zoom,
        pitch: loc.pitch,
        bearing: loc.bearing,
        speed: 1.2,
        curve: 1.4,
        essential: true,
      });
    }
  };

  // 4. Draggable Split Swipe Curtain Physics
  useEffect(() => {
    const handleMove = (e: MouseEvent) => {
      if (!isDragging || !mapContainerRef.current) return;
      const rect = mapContainerRef.current.getBoundingClientRect();
      const pos = Math.max(5, Math.min(95, ((e.clientX - rect.left) / rect.width) * 100));
      setSwipePosition(pos);
    };
    const handleUp = () => setIsDragging(false);

    if (isDragging) {
      window.addEventListener('mousemove', handleMove);
      window.addEventListener('mouseup', handleUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
    };
  }, [isDragging]);

  // Derived scene assets for the active investigation
  const t1Image = activeInv?.images?.find((img) => img.role === 'before_t1' || img.role === 'optical') || activeInv?.images?.[0];
  const t2Image = activeInv?.images?.find((img) => img.role === 'after_t2' || img.role === 'sar') || activeInv?.images?.[1];

  const latestGraph = activeInv?.evidence_graphs?.[0];
  const evidenceNode = latestGraph?.evidence_nodes ? (Object.values(latestGraph.evidence_nodes)[0] as EvidenceNode) : null;
  const evidenceMaskUri = evidenceNode?.preview_png_uri
    ? `http://localhost:5000${evidenceNode.preview_png_uri}`
    : activeInv?.id === 'demo_nepal_hydrology'
    ? 'http://localhost:5000/storage/masks/demo_nepal_hydrology_ev_change_244d28_change_map.png'
    : activeInv?.id === 'demo_sar_flood'
    ? 'http://localhost:5000/storage/masks/demo_sar_optical_flood_ev_fusion_4b1fec_fused_preview.png'
    : null;

  const currentLoc = (activeInv && MISSION_COORDINATES[activeInv.id]) || {
    gsd: '10.0 m/px',
    crs: 'EPSG:32644 (UTM 44N)',
  };

  return (
    <div className="relative w-full h-[calc(100vh-4rem)] bg-[#05070a] overflow-hidden select-none">
      {/* 1. Full-Screen MapLibre Canvas */}
      <div ref={mapContainerRef} className="absolute inset-0 w-full h-full z-0" />

      {/* 2. Dynamic Raster Overlays & Split-Screen View */}
      {selectedLayer !== 'base' && (
        <div
          className="absolute inset-0 pointer-events-none transition-opacity duration-300 z-10 flex items-center justify-center"
          style={{ opacity: opacity / 100 }}
        >
          <div className="w-full h-full max-w-4xl max-h-[820px] relative p-6 flex items-center justify-center">
            {/* If Split Swipe is ON */}
            {isSwipeActive ? (
              <div className="relative w-full h-full rounded-2xl overflow-hidden border border-white/10 shadow-2xl">
                {/* Left Side: T1 Baseline Scene */}
                {t1Image && (
                  <div
                    className="absolute inset-0 overflow-hidden"
                    style={{ clipPath: `polygon(0 0, ${swipePosition}% 0, ${swipePosition}% 100%, 0 100%)` }}
                  >
                    <img
                      src={`http://localhost:5000${t1Image.preview_url}`}
                      alt="Baseline Scene"
                      className="w-full h-full object-contain"
                    />
                  </div>
                )}

                {/* Right Side: T2 Scene or AI Evidence Mask */}
                <div
                  className="absolute inset-0 overflow-hidden"
                  style={{ clipPath: `polygon(${swipePosition}% 0, 100% 0, 100% 100%, ${swipePosition}% 100%)` }}
                >
                  {selectedLayer === 'evidence' && evidenceMaskUri ? (
                    <img
                      src={evidenceMaskUri}
                      alt="AI Evidence Mask"
                      className="w-full h-full object-contain mix-blend-screen opacity-95 filter drop-shadow-[0_0_30px_rgba(6,182,212,0.4)]"
                    />
                  ) : t2Image ? (
                    <img
                      src={`http://localhost:5000${t2Image.preview_url}`}
                      alt="Secondary Scene"
                      className="w-full h-full object-contain"
                    />
                  ) : null}
                </div>
              </div>
            ) : (
              /* Single Layer Full Display */
              <div className="w-full h-full rounded-2xl overflow-hidden border border-white/10 shadow-2xl flex items-center justify-center">
                {selectedLayer === 't1' && t1Image && (
                  <img
                    src={`http://localhost:5000${t1Image.preview_url}`}
                    alt="Baseline Scene"
                    className="w-full h-full object-contain"
                  />
                )}
                {selectedLayer === 't2' && t2Image && (
                  <img
                    src={`http://localhost:5000${t2Image.preview_url}`}
                    alt="Secondary Scene"
                    className="w-full h-full object-contain"
                  />
                )}
                {selectedLayer === 'evidence' && evidenceMaskUri && (
                  <img
                    src={evidenceMaskUri}
                    alt="AI Evidence Mask"
                    className="w-full h-full object-contain mix-blend-screen opacity-95 filter drop-shadow-[0_0_30px_rgba(6,182,212,0.4)]"
                  />
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 3. Interactive Apple-Style Swipe Curtain Handle */}
      {isSwipeActive && selectedLayer !== 'base' && (
        <div
          className="absolute top-0 bottom-0 z-20 pointer-events-auto cursor-ew-resize"
          style={{ left: `${swipePosition}%` }}
          onMouseDown={() => setIsDragging(true)}
        >
          {/* Frosted glass vertical divider */}
          <div className="w-0.5 h-full bg-cyan-400/80 backdrop-blur shadow-[0_0_12px_rgba(34,211,238,0.7)] relative">
            {/* Apple VisionOS circular grab handle */}
            <div className="absolute top-1/2 -translate-y-1/2 -left-3.5 w-7 h-7 rounded-full bg-neutral-900/95 backdrop-blur-2xl border border-white/25 shadow-xl flex items-center justify-center transition-transform hover:scale-110 active:scale-95">
              <div className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
            </div>

            {/* Pill Labels */}
            <div className="absolute top-6 -left-24 px-2.5 py-1 rounded-full ios-glass text-[10px] font-sans font-medium text-neutral-300">
              {t1Image?.role === 'optical' ? 'Optical Baseline' : 'T1 Baseline'}
            </div>
            <div className="absolute top-6 left-3 px-2.5 py-1 rounded-full ios-glass border-cyan-500/30 text-[10px] font-sans font-medium text-cyan-300">
              {selectedLayer === 'evidence' ? 'AI Grounded Evidence' : t2Image?.role === 'sar' ? 'Sentinel-1 SAR' : 'T2 Target'}
            </div>
          </div>
        </div>
      )}

      {/* 4. Top Floating Apple Control Island */}
      <div className="absolute top-3 inset-x-0 z-30 flex justify-center pointer-events-none px-4">
        <div className="pointer-events-auto flex items-center gap-2.5 p-1.5 rounded-full ios-glass shadow-2xl animate-fade-up">
          {/* Mission Switcher Capsule */}
          <div className="relative">
            <button
              onClick={() => setIsMissionDropdownOpen(!isMissionDropdownOpen)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-neutral-900/80 hover:bg-neutral-800/90 text-xs font-medium text-white border border-white/10 transition-all ios-btn"
            >
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
              <span className="max-w-[140px] md:max-w-[180px] truncate">{activeInv?.title || 'Select Mission'}</span>
              <ChevronDown className={`w-3.5 h-3.5 text-neutral-400 transition-transform ${isMissionDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown Menu */}
            {isMissionDropdownOpen && (
              <div className="absolute top-10 left-0 w-80 rounded-2xl ios-glass border border-white/15 shadow-2xl p-2 flex flex-col gap-1 z-50 animate-spring-in">
                <div className="px-2 py-1 text-[10px] uppercase font-mono text-neutral-400 font-semibold border-b border-white/10 mb-1">
                  Active Mission Scenarios
                </div>
                {investigations.map((inv) => (
                  <button
                    key={inv.id}
                    onClick={() => handleSelectInvestigation(inv)}
                    className={`p-2 rounded-xl text-left transition-all ${
                      activeInv?.id === inv.id
                        ? 'bg-cyan-500/20 text-cyan-200 border border-cyan-500/30'
                        : 'hover:bg-white/5 text-neutral-300'
                    }`}
                  >
                    <div className="text-xs font-semibold truncate">{inv.title}</div>
                    <div className="text-[10px] text-neutral-400 mt-0.5 truncate">{inv.description}</div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Layer Selector Segmented Control */}
          <div className="flex items-center gap-0.5 p-0.5 rounded-full bg-neutral-900/80 border border-white/5">
            <button
              onClick={() => setSelectedLayer('base')}
              className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all ios-btn ${
                selectedLayer === 'base' ? 'bg-white/15 text-white shadow-sm' : 'text-neutral-400 hover:text-white'
              }`}
            >
              Basemap
            </button>
            {t1Image && (
              <button
                onClick={() => setSelectedLayer('t1')}
                className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all ios-btn ${
                  selectedLayer === 't1' ? 'bg-white/15 text-white shadow-sm' : 'text-neutral-400 hover:text-white'
                }`}
              >
                T1 Scene
              </button>
            )}
            {t2Image && (
              <button
                onClick={() => setSelectedLayer('t2')}
                className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all ios-btn ${
                  selectedLayer === 't2' ? 'bg-white/15 text-white shadow-sm' : 'text-neutral-400 hover:text-white'
                }`}
              >
                T2 Scene
              </button>
            )}
            <button
              onClick={() => setSelectedLayer('evidence')}
              className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all ios-btn ${
                selectedLayer === 'evidence'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 shadow-sm'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              AI Evidence
            </button>
          </div>

          {/* Swipe Mode Toggle */}
          <button
            onClick={() => setIsSwipeActive(!isSwipeActive)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-all ios-btn border ${
              isSwipeActive ? 'bg-white/15 text-white border-white/20' : 'text-neutral-400 border-transparent hover:text-white'
            }`}
          >
            Split Swipe
          </button>

          {/* Opacity Slider */}
          <div className="hidden lg:flex items-center gap-2 pl-2 pr-3 border-l border-white/10">
            <span className="text-[10px] text-neutral-400 font-mono">Opacity</span>
            <input
              type="range"
              min="20"
              max="100"
              value={opacity}
              onChange={(e) => setOpacity(parseInt(e.target.value))}
              className="w-16 h-1 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
            />
          </div>

          {/* Inspection Drawer Toggle */}
          <button
            onClick={() => setIsDrawerOpen(!isDrawerOpen)}
            className={`p-1.5 rounded-full transition-all ios-btn ${
              isDrawerOpen ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' : 'bg-white/5 hover:bg-white/10 text-neutral-300'
            }`}
            title="Inspection Metrics"
          >
            <Info className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 5. Bottom Floating GIS Telemetry Pill */}
      <div className="absolute bottom-6 left-6 z-30 pointer-events-none animate-fade-up">
        <div className="pointer-events-auto px-4 py-2 rounded-full ios-glass shadow-xl flex items-center gap-4 text-xs font-mono text-neutral-300">
          <div className="flex items-center gap-1.5">
            <span className="text-neutral-500">POS:</span>
            <span className="text-cyan-400 font-medium">{coords.lat}°N, {coords.lng}°E</span>
          </div>
          <span className="text-white/10">|</span>
          <div className="flex items-center gap-1.5">
            <span className="text-neutral-500">ZOOM:</span>
            <span>{zoom}</span>
          </div>
          <span className="text-white/10">|</span>
          <div className="flex items-center gap-1.5">
            <span className="text-neutral-500">GSD:</span>
            <span className="text-emerald-400">{currentLoc.gsd}</span>
          </div>
        </div>
      </div>

      {/* 5.5 Center Bottom Floating Mission Control & Timeline Island */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 pointer-events-none animate-fade-up max-w-[92vw]">
        <div className="pointer-events-auto px-4 py-2.5 rounded-3xl ios-glass shadow-2xl flex flex-wrap items-center gap-3 md:gap-5 text-xs text-neutral-200 border border-white/15">
          {/* Modality View Toggle */}
          <div className="flex items-center gap-1 bg-black/40 p-1 rounded-full border border-white/10">
            <button
              onClick={() => setModalityView('all')}
              className={`px-2.5 py-1 rounded-full text-[11px] font-mono transition ${
                modalityView === 'all' ? 'bg-cyan-500/25 text-cyan-300 font-semibold shadow' : 'text-neutral-400 hover:text-white'
              }`}
            >
              ALL
            </button>
            <button
              onClick={() => setModalityView('optical')}
              className={`px-2.5 py-1 rounded-full text-[11px] font-mono transition ${
                modalityView === 'optical' ? 'bg-emerald-500/25 text-emerald-300 font-semibold shadow' : 'text-neutral-400 hover:text-white'
              }`}
            >
              OPTICAL
            </button>
            <button
              onClick={() => setModalityView('sar')}
              className={`px-2.5 py-1 rounded-full text-[11px] font-mono transition ${
                modalityView === 'sar' ? 'bg-amber-500/25 text-amber-300 font-semibold shadow' : 'text-neutral-400 hover:text-white'
              }`}
            >
              SAR (VV/VH)
            </button>
          </div>

          {/* Timeline Slider */}
          <div className="flex items-center gap-2 px-2 border-l border-white/10">
            <span className="text-[10px] font-mono text-neutral-400">T1: Before</span>
            <input
              type="range"
              min="0"
              max="100"
              value={timelinePosition}
              onChange={(e) => {
                const val = parseInt(e.target.value);
                setTimelinePosition(val);
                if (val < 50 && t1Image) setSelectedLayer('t1');
                else if (val >= 50 && t2Image) setSelectedLayer('t2');
              }}
              className="w-24 md:w-32 h-1 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
            />
            <span className="text-[10px] font-mono text-cyan-400">T2: After</span>
          </div>

          {/* Feature Layer Toggles */}
          <div className="flex items-center gap-2 border-l border-white/10 pl-2">
            <button
              onClick={() => setShowEvidence(!showEvidence)}
              className={`px-2.5 py-1 rounded-full text-[11px] font-mono border transition ${
                showEvidence ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40' : 'bg-transparent text-neutral-500 border-white/10'
              }`}
            >
              Evidence {showEvidence ? 'ON' : 'OFF'}
            </button>
            <button
              onClick={() => setShowDetections(!showDetections)}
              className={`px-2.5 py-1 rounded-full text-[11px] font-mono border transition ${
                showDetections ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' : 'bg-transparent text-neutral-500 border-white/10'
              }`}
            >
              Detections {showDetections ? 'ON' : 'OFF'}
            </button>
          </div>
        </div>
      </div>

      {/* 6. Slide-Over Inspection Drawer (Apple Style) */}
      {isDrawerOpen && (
        <div className="absolute top-16 right-6 bottom-6 w-84 z-40 rounded-3xl ios-glass shadow-2xl p-5 flex flex-col justify-between overflow-y-auto animate-spring-in">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-cyan-400" />
                <h3 className="text-sm font-semibold text-white">Spatial Telemetry</h3>
              </div>
              <button
                onClick={() => setIsDrawerOpen(false)}
                className="text-xs text-neutral-400 hover:text-white p-1 rounded-full hover:bg-white/10 transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 flex flex-col gap-3 text-xs">
              <div className="p-3 rounded-2xl bg-white/5 border border-white/5">
                <span className="text-[10px] uppercase font-mono text-neutral-400">Active Scenario</span>
                <div className="text-sm font-medium text-white mt-1">{activeInv?.title}</div>
                <span className="text-[11px] text-neutral-400 block mt-1">{activeInv?.description}</span>
              </div>

              {evidenceNode && (
                <div className="p-3 rounded-2xl bg-white/5 border border-white/5">
                  <span className="text-[10px] uppercase font-mono text-neutral-400">Changed Terrain Footprint</span>
                  <div className="text-xl font-mono font-semibold text-cyan-300 mt-1">
                    {evidenceNode.metric.area_km2 !== undefined
                      ? `${evidenceNode.metric.area_km2} km²`
                      : `${evidenceNode.metric.pixel_count?.toLocaleString()} px`}
                  </div>
                  {evidenceNode.metric.percentage_change !== undefined && (
                    <span className="text-[11px] text-emerald-400 block mt-0.5">
                      Shift: {evidenceNode.metric.percentage_change}%
                    </span>
                  )}
                </div>
              )}

              <div className="p-3 rounded-2xl bg-white/5 border border-white/5">
                <span className="text-[10px] uppercase font-mono text-neutral-400">Spatial Reference & GSD</span>
                <div className="text-xs font-mono text-neutral-200 mt-1 font-medium">
                  {currentLoc.crs}
                </div>
                <span className="text-[10px] text-neutral-400 font-mono mt-1 block">
                  Ground Resolution: {currentLoc.gsd}
                </span>
              </div>

              <div className="p-3 rounded-2xl bg-white/5 border border-white/5">
                <span className="text-[10px] uppercase font-mono text-neutral-400">Uploaded Scene Assets</span>
                <div className="flex flex-col gap-2 mt-2">
                  {activeInv?.images?.map((img) => (
                    <div key={img.id} className="flex items-center justify-between text-[11px]">
                      <span className="text-neutral-300 truncate max-w-[170px]">{img.original_name}</span>
                      <span className="px-2 py-0.5 rounded-full bg-white/5 text-cyan-400 font-mono text-[9px]">
                        {img.metadata?.modality || img.role}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2 pt-4 border-t border-white/10">
            {activeInv && (
              <>
                <a
                  href={`http://localhost:5000/api/investigations/${activeInv.id}/report?format=geojson`}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full py-2 rounded-full bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/30 text-xs font-medium text-center transition-all ios-btn flex items-center justify-center gap-1.5"
                >
                  <FileCode className="w-3.5 h-3.5" />
                  <span>Download GeoJSON Vectors</span>
                </a>
                <a
                  href={`http://localhost:5000/api/investigations/${activeInv.id}/report?format=markdown`}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full py-2 rounded-full bg-white/10 hover:bg-white/20 text-neutral-200 text-xs font-medium text-center transition-all ios-btn flex items-center justify-center gap-1.5"
                >
                  <FileText className="w-3.5 h-3.5 text-neutral-400" />
                  <span>Download Full Report</span>
                </a>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function MapPage() {
  return (
    <Suspense fallback={<div className="h-full w-full flex items-center justify-center text-neutral-400">Loading Map...</div>}>
      <MapCanvasInner />
    </Suspense>
  );
}
