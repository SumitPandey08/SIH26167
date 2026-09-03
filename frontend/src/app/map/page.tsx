'use client';

import React, { useState, useEffect, useRef } from 'react';
import maplibregl from 'maplibre-gl';
import {
  Layers,
  Sliders,
  Maximize2,
  Minimize2,
  Compass,
  Eye,
  Info,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';

export default function MapPage() {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);

  // States
  const [selectedLayer, setSelectedLayer] = useState<'base' | 'change' | 'sar'>('change');
  const [isSwipeActive, setIsSwipeActive] = useState<boolean>(true);
  const [swipePosition, setSwipePosition] = useState<number>(50);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [opacity, setOpacity] = useState<number>(90);
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);

  // Live telemetry
  const [coords, setCoords] = useState<{ lat: number; lng: number }>({ lat: 27.8324, lng: 85.5718 });
  const [zoom, setZoom] = useState<number>(12.4);
  const [pitch, setPitch] = useState<number>(45);

  useEffect(() => {
    if (!mapContainerRef.current) return;

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
      center: [85.5718, 27.8324], // Melamchi Valley, Nepal
      zoom: 12.4,
      pitch: 45,
      bearing: -15,
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

  // Draggable Split Swipe Curtain
  useEffect(() => {
    const handleMove = (e: MouseEvent) => {
      if (!isDragging || !mapContainerRef.current) return;
      const rect = mapContainerRef.current.getBoundingClientRect();
      const pos = Math.max(10, Math.min(90, ((e.clientX - rect.left) / rect.width) * 100));
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

  return (
    <div className="relative w-full h-[calc(100vh-4rem)] bg-[#05070a] overflow-hidden select-none">
      {/* 1. Full-Screen Edge-to-Edge MapLibre Canvas */}
      <div ref={mapContainerRef} className="absolute inset-0 w-full h-full z-0" />

      {/* 2. Seamless Georeferenced Analysis Mask (No ugly static box!) */}
      {selectedLayer !== 'base' && (
        <div
          className="absolute inset-0 pointer-events-none transition-opacity duration-300 z-10 flex items-center justify-center"
          style={{
            opacity: opacity / 100,
            clipPath: isSwipeActive ? `polygon(${swipePosition}% 0, 100% 0, 100% 100%, ${swipePosition}% 100%)` : 'none',
          }}
        >
          <div className="w-full h-full max-w-4xl max-h-[800px] relative p-8 flex items-center justify-center">
            {selectedLayer === 'change' && (
              <img
                src="http://localhost:5000/storage/masks/demo_nepal_hydrology_ev_change_244d28_change_map.png"
                alt="AI Change Detection Mask"
                className="w-full h-full object-contain mix-blend-screen opacity-95 filter drop-shadow-[0_0_30px_rgba(6,182,212,0.4)]"
              />
            )}
            {selectedLayer === 'sar' && (
              <img
                src="http://localhost:5000/storage/masks/demo_sar_optical_flood_ev_fusion_4b1fec_fused_preview.png"
                alt="SAR Flood Inundation"
                className="w-full h-full object-contain opacity-90 filter drop-shadow-[0_0_30px_rgba(245,158,11,0.4)]"
              />
            )}
          </div>
        </div>
      )}

      {/* 3. Interactive Apple-Style Swipe Curtain Bar */}
      {isSwipeActive && (
        <div
          className="absolute top-0 bottom-0 z-20 pointer-events-auto cursor-ew-resize"
          style={{ left: `${swipePosition}%` }}
          onMouseDown={() => setIsDragging(true)}
        >
          {/* Subtle frosted glass line */}
          <div className="w-0.5 h-full bg-white/60 backdrop-blur shadow-[0_0_10px_rgba(255,255,255,0.5)] relative">
            {/* Minimalist Apple circle handle */}
            <div className="absolute top-1/2 -translate-y-1/2 -left-3.5 w-7 h-7 rounded-full bg-neutral-900/90 backdrop-blur-xl border border-white/20 shadow-xl flex items-center justify-center transition-transform hover:scale-110">
              <div className="w-1.5 h-1.5 rounded-full bg-white" />
            </div>
            {/* Clean Pill Badges */}
            <div className="absolute top-6 -left-20 px-2.5 py-1 rounded-full bg-neutral-950/80 backdrop-blur-xl border border-white/10 text-[10px] font-sans font-medium text-neutral-300">
              2020 Baseline
            </div>
            <div className="absolute top-6 left-3 px-2.5 py-1 rounded-full bg-cyan-950/80 backdrop-blur-xl border border-cyan-500/30 text-[10px] font-sans font-medium text-cyan-300">
              2026 AI Evidence
            </div>
          </div>
        </div>
      )}

      {/* 4. Top Floating Apple Control Island */}
      <div className="absolute top-4 inset-x-0 z-30 flex justify-center pointer-events-none px-4">
        <div className="pointer-events-auto flex items-center gap-3 p-1.5 rounded-full bg-neutral-950/75 backdrop-blur-2xl border border-white/10 shadow-2xl">
          {/* Layer Selector Tabs */}
          <div className="flex items-center gap-1 p-0.5 rounded-full bg-neutral-900/80 border border-white/5">
            <button
              onClick={() => setSelectedLayer('base')}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition ${
                selectedLayer === 'base' ? 'bg-white/15 text-white' : 'text-neutral-400 hover:text-white'
              }`}
            >
              Satellite
            </button>
            <button
              onClick={() => setSelectedLayer('change')}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition ${
                selectedLayer === 'change' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' : 'text-neutral-400 hover:text-white'
              }`}
            >
              Change Map (TinyCD)
            </button>
            <button
              onClick={() => setSelectedLayer('sar')}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition ${
                selectedLayer === 'sar' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'text-neutral-400 hover:text-white'
              }`}
            >
              SAR Radar Flood
            </button>
          </div>

          {/* Swipe Toggle */}
          <button
            onClick={() => setIsSwipeActive(!isSwipeActive)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition border ${
              isSwipeActive ? 'bg-white/10 text-white border-white/20' : 'text-neutral-500 border-transparent hover:text-neutral-300'
            }`}
          >
            Split Swipe
          </button>

          {/* Opacity Control */}
          <div className="hidden md:flex items-center gap-2 pl-2 pr-3 border-l border-white/10">
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

          {/* Side Drawer Toggle */}
          <button
            onClick={() => setIsDrawerOpen(!isDrawerOpen)}
            className="p-1.5 rounded-full bg-white/5 hover:bg-white/10 text-neutral-300 transition"
            title="Inspection Metrics"
          >
            <Info className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 5. Bottom Floating Telemetry Pill */}
      <div className="absolute bottom-6 left-6 z-30 pointer-events-none">
        <div className="pointer-events-auto px-4 py-2 rounded-full bg-neutral-950/80 backdrop-blur-2xl border border-white/10 shadow-xl flex items-center gap-4 text-xs font-mono text-neutral-300">
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
            <span className="text-emerald-400">10m</span>
          </div>
        </div>
      </div>

      {/* 6. Slide-Over Inspection Drawer (Apple Style) */}
      {isDrawerOpen && (
        <div className="absolute top-20 right-6 bottom-6 w-80 z-40 rounded-3xl bg-neutral-950/85 backdrop-blur-2xl border border-white/10 shadow-2xl p-5 flex flex-col justify-between overflow-y-auto">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-cyan-400" />
                <h3 className="text-sm font-semibold text-white">Spatial Analysis</h3>
              </div>
              <button
                onClick={() => setIsDrawerOpen(false)}
                className="text-xs text-neutral-500 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 flex flex-col gap-3 text-xs">
              <div className="p-3 rounded-2xl bg-white/5 border border-white/5">
                <span className="text-[10px] uppercase font-mono text-neutral-400">Changed Footprint</span>
                <div className="text-xl font-mono font-semibold text-cyan-300 mt-1">4.5896 km²</div>
                <span className="text-[11px] text-neutral-400">17.51% of scene area</span>
              </div>

              <div className="p-3 rounded-2xl bg-white/5 border border-white/5">
                <span className="text-[10px] uppercase font-mono text-neutral-400">Model Provenance</span>
                <div className="text-xs font-sans text-neutral-200 mt-1 font-medium">
                  SatQuery TinyCD Siamese U-Net + MAMB
                </div>
                <span className="text-[10px] text-neutral-500 font-mono mt-1 block">
                  LEVIR-CD Verified Architecture
                </span>
              </div>

              <div className="p-3 rounded-2xl bg-white/5 border border-white/5">
                <span className="text-[10px] uppercase font-mono text-neutral-400">Legend & Spectra</span>
                <div className="flex flex-col gap-1.5 mt-2">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
                    <span className="text-neutral-300">Water Channel Inundation</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
                    <span className="text-neutral-300">Vegetation Scour & Sediment</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-400" />
                    <span className="text-neutral-300">Structural / Landslide Shock</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <a
            href="http://localhost:5000/api/investigations/demo_nepal_hydrology/report?format=geojson"
            target="_blank"
            rel="noreferrer"
            className="w-full py-2.5 rounded-full bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/30 text-xs font-medium text-center transition"
          >
            Download GeoJSON Vectors
          </a>
        </div>
      )}
    </div>
  );
}
