'use client';

import React, { useState, useEffect } from 'react';
import { Satellite, Globe2, Map, Download, Plus, FolderOpen, Radio } from 'lucide-react';
import { Investigation } from '../types';

interface NavbarProps {
  investigations: Investigation[];
  activeInv: Investigation | null;
  onSelectInv: (inv: Investigation) => void;
  onCreateInv: () => void;
  viewMode: '2D' | '3D';
  onToggleViewMode: (mode: '2D' | '3D') => void;
  onExportReport: (format: 'markdown' | 'geojson' | 'json') => void;
  isConnected: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  investigations,
  activeInv,
  onSelectInv,
  onCreateInv,
  viewMode,
  onToggleViewMode,
  onExportReport,
  isConnected,
}) => {
  const [utcTime, setUtcTime] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setUtcTime(now.toISOString().replace('T', ' ').substring(0, 19) + 'Z');
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <header className="h-14 border-b border-slate-800 bg-[#070b10] px-4 flex items-center justify-between z-30 select-none shadow-md">
      {/* 1. Left: Mission Identity & UTC Zulu Clock */}
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2.5">
          <div className="h-9 w-9 rounded-lg bg-gradient-to-tr from-cyan-600 to-blue-600 p-0.5 shadow-lg shadow-cyan-500/20 flex items-center justify-center">
            <Satellite className="h-5 w-5 text-white" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-sm font-bold tracking-widest text-white font-mono">SATQUERY AI</h1>
              <span className="text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-700">
                ISRO / SIH26167
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-mono tracking-wide">Autonomous Geospatial Intelligence</p>
          </div>
        </div>

        {/* Live UTC Clock & Sensor Links */}
        <div className="hidden lg:flex items-center space-x-3 border-l border-slate-800 pl-4 text-[10px] font-mono">
          <div className="text-slate-400">
            <span className="text-slate-500 mr-1">UTC:</span>
            <span className="text-cyan-300 font-semibold">{utcTime || '2026-09-03 18:25:00Z'}</span>
          </div>
          <div className="flex items-center space-x-1.5 px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span>S1-SAR (C-Band)</span>
          </div>
          <div className="flex items-center space-x-1.5 px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span>S2-MSI (10m)</span>
          </div>
        </div>
      </div>

      {/* 2. Center: Investigation Dropdown */}
      <div className="flex items-center space-x-2">
        <div className="flex items-center bg-[#0d141f] border border-slate-700/80 rounded-lg px-3 py-1 text-xs">
          <FolderOpen className="h-3.5 w-3.5 text-cyan-400 mr-2 shrink-0" />
          <select
            className="bg-transparent text-slate-200 outline-none cursor-pointer max-w-[280px] font-mono text-[11px]"
            value={activeInv?.id || ''}
            onChange={(e) => {
              const selected = investigations.find((inv) => inv.id === e.target.value);
              if (selected) onSelectInv(selected);
            }}
          >
            {investigations.map((inv) => (
              <option key={inv.id} value={inv.id} className="bg-[#0b1017] text-slate-200">
                {inv.title}
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={onCreateInv}
          className="p-1.5 rounded-lg bg-slate-850 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700 transition"
          title="New Investigation"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>

      {/* 3. Right: Tactical Controls & Export */}
      <div className="flex items-center space-x-3">
        {/* 2D / 3D Mode Toggle */}
        <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg p-0.5 text-xs font-mono">
          <button
            onClick={() => onToggleViewMode('2D')}
            className={`flex items-center space-x-1 px-2.5 py-1 rounded-md transition ${
              viewMode === '2D' ? 'bg-cyan-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Map className="h-3.5 w-3.5" />
            <span>2D Tactical</span>
          </button>
          <button
            onClick={() => onToggleViewMode('3D')}
            className={`flex items-center space-x-1 px-2.5 py-1 rounded-md transition ${
              viewMode === '3D' ? 'bg-cyan-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Globe2 className="h-3.5 w-3.5" />
            <span>3D Globe</span>
          </button>
        </div>

        {/* Export Dossier Dropdown */}
        <div className="relative group">
          <button className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-850 hover:bg-slate-800 border border-slate-700 text-xs font-mono text-slate-200 hover:text-white transition">
            <Download className="h-3.5 w-3.5 text-cyan-400" />
            <span>EXPORT</span>
          </button>
          <div className="absolute right-0 mt-1 w-48 bg-[#0d141f] border border-slate-700 rounded-lg shadow-2xl py-1 text-xs font-mono hidden group-hover:block z-50">
            <button
              onClick={() => onExportReport('markdown')}
              className="w-full text-left px-3 py-1.5 hover:bg-slate-800 text-slate-300 hover:text-white flex items-center justify-between"
            >
              <span>Markdown Dossier</span>
              <span className="text-[10px] text-cyan-400">.md</span>
            </button>
            <button
              onClick={() => onExportReport('geojson')}
              className="w-full text-left px-3 py-1.5 hover:bg-slate-800 text-slate-300 hover:text-white flex items-center justify-between"
            >
              <span>GeoJSON Vectors</span>
              <span className="text-[10px] text-emerald-400">.geojson</span>
            </button>
            <button
              onClick={() => onExportReport('json')}
              className="w-full text-left px-3 py-1.5 hover:bg-slate-800 text-slate-300 hover:text-white flex items-center justify-between"
            >
              <span>Session State</span>
              <span className="text-[10px] text-amber-400">.json</span>
            </button>
          </div>
        </div>

        {/* Telemetry Stream Indicator */}
        <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-slate-900 border border-slate-800 text-[10px] font-mono text-slate-300">
          <Radio className={`h-3 w-3 ${isConnected ? 'text-emerald-400 animate-pulse' : 'text-red-500'}`} />
          <span>{isConnected ? 'STREAM LIVE' : 'OFFLINE'}</span>
        </div>
      </div>
    </header>
  );
};
