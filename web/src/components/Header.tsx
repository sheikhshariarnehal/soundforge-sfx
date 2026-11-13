"use client";

import React from "react";
import { Volume2 } from "lucide-react";

interface HeaderProps {
  totalSounds: number;
  totalCategories: number;
}

export function Header({ totalSounds }: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-studio-border/60 bg-studio-bg/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
        {/* Brand Logo */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-studio-cyan/15 border border-studio-cyan/30 flex items-center justify-center text-studio-cyan">
            <Volume2 className="w-4 h-4 stroke-[2.5]" />
          </div>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-base tracking-tight text-white">SoundForge</span>
            <span className="text-[10px] font-mono tracking-wider px-1.5 py-0.5 rounded bg-studio-surface border border-studio-border text-studio-muted">
              SFX
            </span>
          </div>
        </div>

        {/* Minimal Library Count */}
        <div className="text-xs text-studio-muted font-mono">
          <span className="text-white font-medium">{totalSounds.toLocaleString()}</span> sounds
        </div>
      </div>
    </header>
  );
}
