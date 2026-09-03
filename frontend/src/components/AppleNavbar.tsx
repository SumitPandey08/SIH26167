'use client';

import React from 'react';
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
} from 'lucide-react';

const NAV_ITEMS = [
  { name: 'Overview', href: '/', icon: Compass },
  { name: 'Satellite Map', href: '/map', icon: MapIcon },
  { name: 'AI Investigation', href: '/investigate', icon: MessageSquare },
  { name: 'Evidence Vault', href: '/evidence', icon: ShieldCheck },
  { name: 'Sensors & Data', href: '/sensors', icon: Layers },
];

export const AppleNavbar: React.FC = () => {
  const pathname = usePathname();

  return (
    <header className="fixed top-4 inset-x-0 z-50 flex justify-center pointer-events-none px-4">
      <div className="pointer-events-auto flex items-center justify-between gap-4 px-3 py-2 rounded-full bg-neutral-950/70 backdrop-blur-2xl border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.5)] transition-all duration-300 hover:border-white/20">
        {/* Brand Logo & Pill */}
        <Link
          href="/"
          className="flex items-center gap-2.5 pl-2 pr-3 py-1 rounded-full hover:bg-white/5 transition-colors group"
        >
          <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 group-hover:scale-105 transition-transform">
            <Sparkles className="w-3.5 h-3.5 text-white" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold tracking-tight text-white font-sans">
                SatQuery
              </span>
              <span className="text-[9px] font-medium px-1.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                ISRO
              </span>
            </div>
          </div>
        </Link>

        {/* Apple Style Segmented Pill Tabs */}
        <nav className="flex items-center p-0.5 rounded-full bg-neutral-900/60 border border-white/5">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-white/10 text-white shadow-sm border border-white/10'
                    : 'text-neutral-400 hover:text-neutral-200 hover:bg-white/5'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-cyan-400' : 'text-neutral-400'}`} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Right Status Indicator & Quick Action */}
        <div className="flex items-center gap-2 pr-1">
          {/* Live Link Status */}
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-neutral-900/60 border border-white/5 text-[11px] text-neutral-300">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-mono text-[10px] text-neutral-400">SIH26167</span>
          </div>

          {/* Export Report Trigger */}
          <a
            href="http://localhost:5000/api/investigations/demo_nepal_hydrology/report?format=markdown"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1 px-3 py-1 rounded-full bg-white/10 hover:bg-white/15 text-neutral-200 text-xs font-medium border border-white/10 transition-colors shadow-sm"
          >
            <Download className="w-3 h-3 text-cyan-400" />
            <span>Export</span>
          </a>
        </div>
      </div>
    </header>
  );
};
