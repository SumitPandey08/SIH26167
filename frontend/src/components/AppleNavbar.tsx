'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Compass,
  Map as MapIcon,
  MessageSquare,
  ShieldCheck,
  Radio,
  Download,
  Layers,
  Sparkles,
  FileCode,
  FileText,
  ChevronDown,
} from 'lucide-react';
import { Investigation } from '../types';

const NAV_ITEMS = [
  { name: 'Overview', href: '/', icon: Compass },
  { name: 'Satellite Map', href: '/map', icon: MapIcon },
  { name: 'AI Investigation', href: '/investigate', icon: MessageSquare },
  { name: 'Evidence Vault', href: '/evidence', icon: ShieldCheck },
  { name: 'Sensors & Data', href: '/sensors', icon: Layers },
];

export const AppleNavbar: React.FC = () => {
  const pathname = usePathname();
  const [investigations, setInvestigations] = useState<Investigation[]>([]);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isBackendOnline, setIsBackendOnline] = useState<boolean | null>(null);
  const exportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Check backend health & fetch investigations
    const checkHealth = async () => {
      try {
        const res = await fetch('http://localhost:5000/api/system/health');
        if (res.ok) {
          setIsBackendOnline(true);
        } else {
          setIsBackendOnline(false);
        }
      } catch {
        setIsBackendOnline(false);
      }
    };

    const fetchInvs = async () => {
      try {
        const res = await fetch('http://localhost:5000/api/investigations');
        if (res.ok) {
          const data = await res.json();
          setInvestigations(data.investigations || []);
        }
      } catch {
        // quiet fallback
      }
    };

    checkHealth();
    fetchInvs();

    // Click outside to close export popover
    const handleDocClick = (e: MouseEvent) => {
      if (exportRef.current && !exportRef.current.contains(e.target as Node)) {
        setIsExportOpen(false);
      }
    };
    document.addEventListener('mousedown', handleDocClick);
    return () => document.removeEventListener('mousedown', handleDocClick);
  }, []);

  return (
    <header className="fixed top-3 inset-x-0 z-50 flex justify-center pointer-events-none px-3 md:px-6">
      <div className="pointer-events-auto flex items-center justify-between gap-3 md:gap-5 px-3 py-1.5 rounded-full ios-glass border border-white/10 shadow-[0_12px_40px_rgba(0,0,0,0.6)] transition-all duration-300 hover:border-white/20">
        {/* Brand Logo & Pill */}
        <Link
          href="/"
          className="flex items-center gap-2.5 pl-1.5 pr-2.5 py-1 rounded-full hover:bg-white/5 transition-all ios-btn group"
        >
          <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-cyan-400 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/25 group-hover:scale-105 transition-transform">
            <Sparkles className="w-3.5 h-3.5 text-white" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold tracking-tight text-white font-sans">
                SatQuery
              </span>
              <span className="text-[9px] font-medium px-1.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                SIH26167
              </span>
            </div>
          </div>
        </Link>

        {/* Apple Style Segmented Pill Tabs */}
        <nav className="flex items-center p-1 rounded-full bg-neutral-900/70 border border-white/5 space-x-0.5">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 ios-btn ${
                  isActive
                    ? 'text-white bg-white/15 shadow-[0_2px_12px_rgba(255,255,255,0.1)] border border-white/15'
                    : 'text-neutral-400 hover:text-neutral-200 hover:bg-white/5'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 transition-colors ${isActive ? 'text-cyan-400' : 'text-neutral-400'}`} />
                <span className="hidden md:inline">{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Right Status Indicator & Quick Action */}
        <div className="flex items-center gap-2 pr-1 relative" ref={exportRef}>
          {/* Live Link Status */}
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-neutral-900/60 border border-white/5 text-[11px] text-neutral-300">
            <span
              className={`w-2 h-2 rounded-full ${
                isBackendOnline === true
                  ? 'bg-emerald-400 shadow-[0_0_8px_#34d399] animate-pulse'
                  : isBackendOnline === false
                  ? 'bg-amber-400'
                  : 'bg-neutral-500'
              }`}
            />
            <span className="font-mono text-[10px] text-neutral-400">
              {isBackendOnline ? 'ONLINE' : 'CONNECTING'}
            </span>
          </div>

          {/* Export Report Trigger */}
          <button
            onClick={() => setIsExportOpen(!isExportOpen)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/15 text-neutral-200 text-xs font-medium border border-white/10 transition-all ios-btn shadow-sm"
          >
            <Download className="w-3 h-3 text-cyan-400" />
            <span className="hidden sm:inline">Export</span>
            <ChevronDown className={`w-3 h-3 text-neutral-400 transition-transform ${isExportOpen ? 'rotate-180' : ''}`} />
          </button>

          {/* Dynamic iOS Export Dropdown */}
          {isExportOpen && (
            <div className="absolute top-11 right-0 w-80 rounded-2xl ios-glass border border-white/15 shadow-2xl p-3 flex flex-col gap-2 animate-spring-in z-50">
              <div className="px-2 py-1 flex items-center justify-between border-b border-white/10 pb-2">
                <span className="text-[11px] font-semibold text-white tracking-wide">Export Mission Dossiers</span>
                <span className="text-[10px] text-cyan-400 font-mono">GeoJSON / Markdown</span>
              </div>

              <div className="max-h-64 overflow-y-auto space-y-1.5 pr-1 no-scrollbar">
                {investigations.length > 0 ? (
                  investigations.map((inv) => (
                    <div key={inv.id} className="p-2.5 rounded-xl bg-white/5 border border-white/5 hover:border-white/15 transition-all">
                      <div className="text-xs font-medium text-white truncate">{inv.title}</div>
                      <div className="flex items-center gap-2 mt-2">
                        <a
                          href={`http://localhost:5000/api/investigations/${inv.id}/report?format=markdown`}
                          target="_blank"
                          rel="noreferrer"
                          className="flex-1 flex items-center justify-center gap-1 py-1 px-2 rounded-lg bg-white/10 hover:bg-white/20 text-neutral-200 text-[11px] transition-colors"
                        >
                          <FileText className="w-3 h-3 text-cyan-400" />
                          <span>Report</span>
                        </a>
                        <a
                          href={`http://localhost:5000/api/investigations/${inv.id}/report?format=geojson`}
                          target="_blank"
                          rel="noreferrer"
                          className="flex-1 flex items-center justify-center gap-1 py-1 px-2 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 text-[11px] transition-colors border border-cyan-500/30"
                        >
                          <FileCode className="w-3 h-3 text-cyan-300" />
                          <span>GeoJSON</span>
                        </a>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-4 text-center text-xs text-neutral-400">
                    No active missions loaded.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
