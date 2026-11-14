"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Volume2, Bot } from "lucide-react";
import { McpModal } from "./McpModal";

interface HeaderProps {
  totalSounds: number;
  totalCategories?: number;
}

export function Header({ totalSounds }: HeaderProps) {
  const [isMcpOpen, setIsMcpOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-40 w-full bg-studio-bg/95 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
          {/* Brand Logo & Home Link */}
          <Link
            href="/"
            className="flex items-center gap-2.5 group focus:outline-none focus-visible:ring-1 focus-visible:ring-studio-primary rounded-lg"
            aria-label="SoundForge SFX Home"
          >
            <div className="w-8 h-8 rounded-lg bg-studio-primary/15 flex items-center justify-center text-studio-primary group-hover:bg-studio-primary/25 transition-colors">
              <Volume2 className="w-4 h-4 stroke-[2.5]" />
            </div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-base tracking-tight text-white group-hover:text-studio-primary transition-colors">
                SoundForge
              </span>
              <span className="text-[10px] font-mono tracking-wider px-1.5 py-0.5 rounded bg-studio-surface text-studio-muted">
                SFX
              </span>
            </div>
          </Link>

          {/* Right Section: Connect MCP Button & Library Count */}
          <div className="flex items-center gap-3 sm:gap-4">
            <button
              type="button"
              onClick={() => setIsMcpOpen(true)}
              className="flex items-center gap-1.5 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-lg bg-studio-surface hover:bg-studio-surface/80 text-xs font-medium text-neutral-200 hover:text-white transition-all shadow-sm"
              title="Connect to Claude, Cursor, Antigravity, or VS Code via MCP"
            >
              <Bot className="w-3.5 h-3.5 text-studio-primary" />
              <span>Connect MCP</span>
            </button>

            <div className="hidden sm:block text-xs text-studio-muted font-mono flex-shrink-0 whitespace-nowrap">
              <span className="text-white font-medium">{totalSounds.toLocaleString()}</span> royalty-free sounds
            </div>
          </div>
        </div>
      </header>

      <McpModal isOpen={isMcpOpen} onClose={() => setIsMcpOpen(false)} />
    </>
  );
}
