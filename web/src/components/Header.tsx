"use client";

import React from "react";
import { Volume2, Sparkles, Cloud, Music, Database } from "lucide-react";

interface HeaderProps {
  totalSounds: number;
  totalCategories: number;
}

export function Header({ totalSounds, totalCategories }: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-studio-border/80 bg-studio-bg/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-studio-cyan to-blue-600 flex items-center justify-center shadow-lg shadow-studio-cyan/20">
            <Volume2 className="w-5 h-5 text-black stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg tracking-tight text-white">SoundForge</span>
              <span className="text-[10px] uppercase font-mono font-bold tracking-widest px-1.5 py-0.5 rounded bg-studio-cyan/15 text-studio-cyan border border-studio-cyan/30">
                SFX
              </span>
            </div>
            <p className="text-[11px] text-studio-muted hidden sm:block">Royalty-Free Audio Library</p>
          </div>
        </div>

        {/* Live System Badges */}
        <div className="flex items-center gap-2 sm:gap-3 text-xs">
          <div className="hidden md:flex items-center gap-1.5 px-3 py-1 rounded-full bg-studio-surface border border-studio-border text-studio-muted">
            <Music className="w-3.5 h-3.5 text-studio-cyan" />
            <span className="text-white font-medium">{totalSounds.toLocaleString()}</span>
            <span>Sounds</span>
          </div>

          <div className="hidden md:flex items-center gap-1.5 px-3 py-1 rounded-full bg-studio-surface border border-studio-border text-studio-muted">
            <Database className="w-3.5 h-3.5 text-studio-amber" />
            <span className="text-white font-medium">{totalCategories}</span>
            <span>Categories</span>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/40 border border-emerald-500/30 text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <Cloud className="w-3.5 h-3.5" />
            <span className="font-medium text-[11px] sm:text-xs">R2 CDN</span>
          </div>
        </div>
      </div>
    </header>
  );
}
