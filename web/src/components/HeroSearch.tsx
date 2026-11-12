"use client";

import React, { useRef, useEffect } from "react";
import { Search, X, Sparkles } from "lucide-react";

interface HeroSearchProps {
  query: string;
  onQueryChange: (q: string) => void;
  resultCount: number;
  totalCount: number;
}

const QUICK_TAGS = ["swoosh", "whoosh", "pop", "click", "glitch", "impact", "riser", "horror", "transition"];

export function HeroSearch({ query, onQueryChange, resultCount, totalCount }: HeroSearchProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Focus search input when pressing '/'
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "/" && document.activeElement !== inputRef.current) {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <div className="relative w-full max-w-3xl mx-auto pt-8 pb-4 text-center">
      {/* Hero Heading */}
      <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-white mb-3">
        Discover Free <span className="text-transparent bg-clip-text bg-gradient-to-r from-studio-cyan via-teal-300 to-amber-300">Sound Effects</span>
      </h1>
      <p className="text-sm sm:text-base text-studio-muted mb-6 max-w-xl mx-auto">
        Audition, scrub waveforms, and download 1,400+ high-quality sounds for videos, games, and motion design.
      </p>

      {/* Search Input Box */}
      <div className="relative group mx-auto">
        <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-studio-cyan/30 via-studio-amber/20 to-blue-500/30 opacity-70 group-hover:opacity-100 blur-sm transition duration-300" />
        <div className="relative flex items-center bg-studio-surface border border-studio-border group-hover:border-studio-cyan/50 rounded-2xl shadow-2xl transition-all">
          <Search className="w-5 h-5 text-studio-muted ml-4 flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder="Search sounds (e.g., fast swoosh, button click, cartoon pop, laser)..."
            className="w-full bg-transparent px-4 py-3.5 text-sm sm:text-base text-white placeholder-studio-muted/70 focus:outline-none"
          />

          {query ? (
            <button
              type="button"
              onClick={() => onQueryChange("")}
              className="p-1.5 mr-2 rounded-lg hover:bg-studio-border text-studio-muted hover:text-white transition-colors"
              title="Clear search"
            >
              <X className="w-4 h-4" />
            </button>
          ) : (
            <div className="hidden sm:flex items-center gap-1 mr-4 px-2 py-1 rounded bg-studio-border/60 border border-studio-border text-[11px] font-mono text-studio-muted select-none">
              <span>Press</span>
              <kbd className="font-semibold text-white">/</kbd>
            </div>
          )}
        </div>
      </div>

      {/* Quick Search Chips & Live Counter */}
      <div className="flex flex-wrap items-center justify-between gap-3 mt-4 text-xs text-studio-muted px-1">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="flex items-center gap-1 text-[11px] font-medium text-studio-muted/80 mr-1">
            <Sparkles className="w-3 h-3 text-studio-amber" /> Popular:
          </span>
          {QUICK_TAGS.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => onQueryChange(tag)}
              className={`px-2 py-0.5 rounded-full border text-[11px] font-medium transition-colors ${
                query.toLowerCase() === tag
                  ? "bg-studio-cyan text-black border-studio-cyan"
                  : "bg-studio-surface/80 border-studio-border hover:border-studio-cyan/50 text-studio-muted hover:text-white"
              }`}
            >
              {tag}
            </button>
          ))}
        </div>

        <div className="font-mono text-[11px] text-studio-muted/80 ml-auto">
          Showing <span className="text-white font-semibold">{resultCount}</span> of {totalCount} sounds
        </div>
      </div>
    </div>
  );
}
