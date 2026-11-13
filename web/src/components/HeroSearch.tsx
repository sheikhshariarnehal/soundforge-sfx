"use client";

import React, { useRef, useEffect } from "react";
import { Search, X } from "lucide-react";

interface HeroSearchProps {
  query: string;
  onQueryChange: (q: string) => void;
  onSubmit?: (q: string) => void;
  onSelectTag?: (tag: string) => void;
  onClear?: () => void;
}

export const POPULAR_TAGS = [
  "whoosh",
  "riser",
  "pop",
  "click",
  "funny",
  "notification",
  "typing",
  "swoosh",
  "rain",
  "wind",
  "glitch",
  "meme",
] as const;

export function HeroSearch({
  query,
  onQueryChange,
  onSubmit,
  onSelectTag,
  onClear,
}: HeroSearchProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Global shortcut '/' to focus search input
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

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      onSubmit?.(query);
    } else if (e.key === "Escape") {
      onClear?.();
      inputRef.current?.blur();
    }
  };

  const handleTagClick = (tag: string) => {
    if (query.trim().toLowerCase() === tag.toLowerCase()) {
      // Toggle off if already selected
      onClear?.();
    } else {
      onSelectTag ? onSelectTag(tag) : onQueryChange(tag);
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto pt-8 pb-5 text-center">
      {/* Title */}
      <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white mb-2 sm:mb-3">
        Discover Free{" "}
        <span className="text-transparent bg-clip-text bg-gradient-to-r from-studio-cyan via-teal-300 to-amber-300">
          Sound Effects
        </span>
      </h1>
      <p className="text-xs sm:text-sm text-studio-muted mb-6 max-w-xl mx-auto">
        Audition, scrub waveforms, and download 1,400+ high-quality sounds for videos, games, and motion design.
      </p>

      {/* Pixabay-style Pill Search Bar */}
      <div className="relative flex items-center w-full h-13 sm:h-14 px-5 sm:px-6 rounded-full bg-[#1e2229]/80 hover:bg-[#242932]/90 focus-within:bg-[#242932] backdrop-blur-xl border border-white/10 hover:border-white/20 focus-within:border-studio-cyan/70 focus-within:ring-2 focus-within:ring-studio-cyan/25 shadow-xl shadow-black/30 transition-all duration-200">
        <Search className="w-5 h-5 text-neutral-400 mr-3 flex-shrink-0" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Search for sound effects"
          className="w-full bg-transparent text-sm sm:text-base text-white placeholder-neutral-400/80 focus:outline-none"
        />

        {query ? (
          <button
            type="button"
            onClick={() => {
              onClear ? onClear() : onQueryChange("");
              inputRef.current?.focus();
            }}
            className="p-1.5 ml-2 rounded-full hover:bg-white/10 text-neutral-400 hover:text-white transition-colors"
            title="Clear search"
          >
            <X className="w-4 h-4" />
          </button>
        ) : (
          <kbd className="hidden sm:inline-block ml-2 px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-[11px] font-mono text-neutral-400 select-none">
            /
          </kbd>
        )}
      </div>

      {/* Pixabay-style Popular Tags (Soft Rounded Rectangles) */}
      <div className="flex flex-wrap items-center justify-center gap-2 mt-4 px-1">
        {POPULAR_TAGS.map((tag) => {
          const isSelected = query.trim().toLowerCase() === tag.toLowerCase();
          return (
            <button
              key={tag}
              type="button"
              onClick={() => handleTagClick(tag)}
              className={`px-3 py-1.5 rounded-lg text-xs sm:text-[13px] font-normal tracking-wide transition-all duration-150 select-none ${
                isSelected
                  ? "bg-studio-cyan text-black font-semibold shadow-md shadow-studio-cyan/30 scale-[1.03]"
                  : "bg-white/[0.08] hover:bg-white/[0.15] text-neutral-300 hover:text-white border border-white/5 backdrop-blur-sm"
              }`}
            >
              {tag}
            </button>
          );
        })}
      </div>
    </div>
  );
}
