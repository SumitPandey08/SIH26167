'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Investigation, EvidenceGraph, EvidenceNode } from '../types';
import maplibregl from 'maplibre-gl';

interface MapViewProps {
  investigation: Investigation | null;
  activeEvidenceGraph: EvidenceGraph | null;
  onSelectEvidenceNode: (nodeId: string) => void;
  is3DMode?: boolean;
}

export const MapView: React.FC<MapViewProps> = ({
  investigation,
  activeEvidenceGraph,
  onSelectEvidenceNode,
  is3DMode = false,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);

  // Tactical telemetry state
  const [cursorCoords, setCursorCoords] = useState<{ lat: number; lng: number; mgrs: string }>({
    lat: 27.8324,
    lng: 85.5718,
    mgrs: '45R TL 5718 8324',
  });
  const [zoomLevel, setZoomLevel] = useState<number>(12.2);
  const [pitch, setPitch] = useState<number>(45);
  const [bearing, setBearing] = useState<number>(-12);
  const [isLocked, setIsLocked] = useState<boolean>(false);

  // Active layer display settings
  const [activeLayer, setActiveLayer] = useState<'base' | 't1' | 't2' | 'change' | 'fusion'>('change');
  const [layerOpacity, setLayerOpacity] = useState<number>(85);
  const [isSwipeMode, setIsSwipeMode] = useState<boolean>(true);
  const [swipePosition, setSwipePosition] = useState<number>(50);
  const [isDraggingSwipe, setIsDraggingSwipe] = useState<boolean>(false);

  // Determine active evidence node if any
  const latestEvidenceNode = activeEvidenceGraph?.evidence_nodes
    ? Object.values(activeEvidenceGraph.evidence_nodes)[0]
    : null;

  // Initialize MapLibre GL
  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Center coordinates for Melamchi river valley / Nepal
    const defaultCenter: [number, number] = [85.5718, 27.8324];

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: {
        version: 8,
        sources: {
          'esri-satellite': {
            type: 'raster',
            tiles: [
              'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
            ],
            tileSize: 256,
            attribution: 'Esri, Maxar, Earthstar Geographics',
          },
          'carto-dark': {
            type: 'raster',
            tiles: [
              'https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
            ],
            tileSize: 256,
            attribution: '© CARTO, © OpenStreetMap contributors',
          },
        },
        layers: [
          {
            id: 'satellite-base-layer',
            type: 'raster',
            source: 'esri-satellite',
            minzoom: 0,
            maxzoom: 19,
          },
        ],
      },
      center: defaultCenter,
      zoom: is3DMode ? 4 : 12.2,
      pitch: is3DMode ? 65 : 45,
      bearing: -12,
    });

    map.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), 'top-left');

    map.on('mousemove', (e) => {
      const lat = e.lngLat.lat;
      const lng = e.lngLat.lng;
      // Simulated MGRS conversion for tactical remote sensing telemetry
      const mgrsEasting = Math.floor(Math.abs(lng * 1000) % 10000);
      const mgrsNorthing = Math.floor(Math.abs(lat * 1000) % 10000);
      setCursorCoords({
        lat,
        lng,
        mgrs: `45R TL ${mgrsEasting.toString().padStart(4, '0')} ${mgrsNorthing.toString().padStart(4, '0')}`,
      });
    });

    map.on('zoom', () => setZoomLevel(parseFloat(map.getZoom().toFixed(1))));
    map.on('pitch', () => setPitch(Math.round(map.getPitch())));
    map.on('rotate', () => setBearing(Math.round(map.getBearing())));

    mapRef.current = map;

    return () => {
      map.remove();
    };
  }, [is3DMode]);

  // Swipe drag handler
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDraggingSwipe || !mapContainerRef.current) return;
      const rect = mapContainerRef.current.getBoundingClientRect();
      const clientX = e.clientX;
      const newPos = Math.max(5, Math.min(95, ((clientX - rect.left) / rect.width) * 100));
      setSwipePosition(newPos);
    };

    const handleMouseUp = () => setIsDraggingSwipe(false);

    if (isDraggingSwipe) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDraggingSwipe]);

  return (
    <div className="relative w-full h-full bg-[#05080c] overflow-hidden select-none">
      {/* 1. Underlying Real MapLibre GL Canvas */}
      <div ref={mapContainerRef} className="absolute inset-0 w-full h-full z-0" />

      {/* 2. Georeferenced Raster & Change Overlay Layer (Positioned directly on scene footprint) */}
      <div
        className="absolute inset-0 pointer-events-none transition-opacity duration-300 z-10"
        style={{
          opacity: layerOpacity / 100,
          clipPath: isSwipeMode ? `polygon(${swipePosition}% 0, 100% 0, 100% 100%, ${swipePosition}% 100%)` : 'none',
        }}
      >
        {activeLayer === 'change' && latestEvidenceNode?.preview_png_uri && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="relative w-[75%] h-[75%] max-w-[850px] max-h-[850px] rounded-xl border border-cyan-500/50 shadow-[0_0_50px_rgba(6,182,212,0.3)] overflow-hidden">
              <img
                src={`http://localhost:5000${latestEvidenceNode.preview_png_uri}`}
                alt="AI Grounded Change Map"
                className="w-full h-full object-cover mix-blend-screen opacity-90"
              />
              <div className="absolute top-3 left-3 px-3 py-1 bg-black/80 backdrop-blur-md rounded border border-cyan-400 text-[11px] font-mono text-cyan-300">
                ACTIVE AI INFERENCE: {latestEvidenceNode.model_provenance}
              </div>
            </div>
          </div>
        )}

        {activeLayer === 'fusion' && latestEvidenceNode?.preview_png_uri && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="relative w-[75%] h-[75%] max-w-[850px] max-h-[850px] rounded-xl border border-amber-500/50 shadow-[0_0_50px_rgba(245,158,11,0.3)] overflow-hidden">
              <img
                src={`http://localhost:5000${latestEvidenceNode.preview_png_uri}`}
                alt="SAR + Optical Fusion"
                className="w-full h-full object-cover opacity-90"
              />
              <div className="absolute top-3 left-3 px-3 py-1 bg-black/80 backdrop-blur-md rounded border border-amber-400 text-[11px] font-mono text-amber-300">
                CROSS-MODAL RADAR PENETRATION (C-BAND SAR + OPTICAL NDWI)
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 3. Interactive Split-Screen Swipe Curtain Bar */}
      {isSwipeMode && (
        <div
          className="absolute top-0 bottom-0 z-20 pointer-events-auto cursor-ew-resize group"
          style={{ left: `${swipePosition}%` }}
          onMouseDown={() => setIsDraggingSwipe(true)}
        >
          {/* Vertical Glowing Line */}
          <div className="w-1 h-full bg-cyan-400 shadow-[0_0_15px_#22d3ee] relative">
            {/* Center Draggable Tactical Handle */}
            <div className="absolute top-1/2 -translate-y-1/2 -left-4 w-9 h-9 rounded-full bg-black/90 border-2 border-cyan-400 flex items-center justify-center shadow-[0_0_20px_#06b6d4] transition-transform group-hover:scale-110">
              <svg className="w-4 h-4 text-cyan-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M8 7l-5 5 5 5M16 7l5 5-5 5" />
              </svg>
            </div>
            {/* Top / Bottom Indicator Badges */}
            <div className="absolute top-5 -left-16 px-2 py-0.5 bg-black/80 border border-slate-700 rounded text-[9px] font-mono text-slate-400 tracking-wider">
              T1 (2020)
            </div>
            <div className="absolute top-5 left-3 px-2 py-0.5 bg-black/80 border border-cyan-500/50 rounded text-[9px] font-mono text-cyan-300 tracking-wider">
              T2 (2026 AI)
            </div>
          </div>
        </div>
      )}

      {/* 4. Center Tactical Reticle & Target Lock */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
        <div className={`relative w-28 h-28 border transition-all duration-500 ${isLocked ? 'border-amber-400 scale-95' : 'border-cyan-500/30'}`}>
          {/* Corner Crosshairs */}
          <div className="absolute -top-1.5 -left-1.5 w-3 h-3 border-t-2 border-l-2 border-cyan-400" />
          <div className="absolute -top-1.5 -right-1.5 w-3 h-3 border-t-2 border-r-2 border-cyan-400" />
          <div className="absolute -bottom-1.5 -left-1.5 w-3 h-3 border-b-2 border-l-2 border-cyan-400" />
          <div className="absolute -bottom-1.5 -right-1.5 w-3 h-3 border-b-2 border-r-2 border-cyan-400" />
          {/* Center Dot */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-cyan-400" />
          {/* Coordinates Tag */}
          <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap text-[9px] font-mono text-cyan-400/80 bg-black/70 px-2 py-0.5 rounded border border-cyan-900/50">
            {cursorCoords.lat.toFixed(4)}°N, {cursorCoords.lng.toFixed(4)}°E
          </div>
        </div>
      </div>

      {/* 5. Top Right Tactical Layer Deck */}
      <div className="absolute top-4 right-4 z-20 flex flex-col gap-2 pointer-events-auto">
        <div className="bg-[#0b1017]/90 backdrop-blur-md p-3 rounded-lg border border-slate-800 shadow-xl w-64">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-mono tracking-wider text-slate-400 uppercase font-semibold">
              Mission Layers
            </span>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          </div>

          <div className="grid grid-cols-2 gap-1.5 mb-3">
            <button
              onClick={() => setActiveLayer('base')}
              className={`px-2 py-1.5 text-[11px] font-mono rounded text-left transition-all ${
                activeLayer === 'base' ? 'bg-cyan-950/80 text-cyan-300 border border-cyan-600' : 'bg-slate-900/60 text-slate-400 border border-slate-800 hover:border-slate-700'
              }`}
            >
              🌐 Base Satellite
            </button>
            <button
              onClick={() => setActiveLayer('change')}
              className={`px-2 py-1.5 text-[11px] font-mono rounded text-left transition-all ${
                activeLayer === 'change' ? 'bg-cyan-950/80 text-cyan-300 border border-cyan-600' : 'bg-slate-900/60 text-slate-400 border border-slate-800 hover:border-slate-700'
              }`}
            >
              ⚡ Change Map
            </button>
            <button
              onClick={() => setActiveLayer('fusion')}
              className={`px-2 py-1.5 text-[11px] font-mono rounded text-left transition-all ${
                activeLayer === 'fusion' ? 'bg-amber-950/80 text-amber-300 border border-amber-600' : 'bg-slate-900/60 text-slate-400 border border-slate-800 hover:border-slate-700'
              }`}
            >
              📡 SAR + Optical
            </button>
            <button
              onClick={() => setIsSwipeMode(!isSwipeMode)}
              className={`px-2 py-1.5 text-[11px] font-mono rounded text-left transition-all ${
                isSwipeMode ? 'bg-indigo-950/80 text-indigo-300 border border-indigo-600' : 'bg-slate-900/60 text-slate-400 border border-slate-800'
              }`}
            >
              ↔ Swipe: {isSwipeMode ? 'ON' : 'OFF'}
            </button>
          </div>

          {/* Opacity Slider */}
          <div className="flex flex-col gap-1 pt-2 border-t border-slate-800">
            <div className="flex justify-between text-[10px] font-mono text-slate-400">
              <span>Layer Opacity</span>
              <span className="text-cyan-400">{layerOpacity}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={layerOpacity}
              onChange={(e) => setLayerOpacity(parseInt(e.target.value))}
              className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
            />
          </div>
        </div>
      </div>

      {/* 6. Bottom Left Professional GIS Telemetry Box */}
      <div className="absolute bottom-4 left-4 z-20 pointer-events-auto">
        <div className="bg-[#0b1017]/90 backdrop-blur-md px-4 py-3 rounded-lg border border-slate-800 shadow-2xl flex flex-col gap-1.5 text-[11px] font-mono">
          <div className="flex items-center gap-4 text-slate-300">
            <div>
              <span className="text-slate-500 mr-1.5">LAT/LON:</span>
              <span className="text-cyan-300">{cursorCoords.lat.toFixed(4)}°N</span>,{' '}
              <span className="text-cyan-300">{cursorCoords.lng.toFixed(4)}°E</span>
            </div>
            <div className="border-l border-slate-800 pl-3">
              <span className="text-slate-500 mr-1.5">MGRS:</span>
              <span className="text-emerald-400">{cursorCoords.mgrs}</span>
            </div>
            <div className="border-l border-slate-800 pl-3">
              <span className="text-slate-500 mr-1.5">GSD:</span>
              <span className="text-amber-400">10.0 m/px</span>
            </div>
          </div>

          <div className="flex items-center gap-4 text-slate-400 text-[10px] pt-1 border-t border-slate-800/80">
            <div>
              <span className="text-slate-500 mr-1">ZOOM:</span>
              <span>{zoomLevel}</span>
            </div>
            <div>
              <span className="text-slate-500 mr-1">PITCH:</span>
              <span>{pitch}°</span>
            </div>
            <div>
              <span className="text-slate-500 mr-1">BEARING:</span>
              <span>{bearing}°</span>
            </div>
            <div>
              <span className="text-slate-500 mr-1">CRS:</span>
              <span className="text-indigo-400">EPSG:32644 (UTM 44N)</span>
            </div>
          </div>
        </div>
      </div>

      {/* 7. Bottom Right Investigation Badge */}
      {investigation && (
        <div className="absolute bottom-4 right-4 z-20 pointer-events-none">
          <div className="bg-black/80 backdrop-blur-md px-3 py-2 rounded border border-cyan-900/60 text-right">
            <div className="text-[10px] font-mono uppercase tracking-wider text-cyan-400">
              Active Focus Area
            </div>
            <div className="text-xs font-semibold text-slate-200 truncate max-w-[280px]">
              {investigation.title}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
