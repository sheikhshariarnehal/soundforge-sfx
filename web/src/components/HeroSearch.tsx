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
    <div className="w-full max-w-3xl mx-auto pt-6 pb-4 text-center">
      {/* Restrained, Quieter Title */}
      <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-neutral-100 mb-1.5">
        Discover Free Sound Effects
      </h1>
      <p className="text-xs sm:text-sm text-neutral-400 mb-5 max-w-lg mx-auto">
        Search, preview, and download 1,400+ royalty-free sounds for video, gamedev, and motion design.
      </p>

      {/* Pixabay-style Lean Pill Search Bar */}
      <div className="relative flex items-center w-full max-w-2xl mx-auto h-12 px-4 sm:px-5 rounded-full bg-[#181a20]/90 hover:bg-[#1e2026] focus-within:bg-[#1e2026] backdrop-blur-md border border-white/10 hover:border-white/15 focus-within:border-white/30 focus-within:ring-1 focus-within:ring-white/10 transition-colors shadow-sm">
        <Search className="w-4 h-4 text-neutral-400 mr-2.5 flex-shrink-0" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Search for sound effects"
          aria-label="Search sound effects library"
          className="w-full bg-transparent text-sm text-neutral-100 placeholder-neutral-400 focus:outline-none"
        />

        {query ? (
          <button
            type="button"
            onClick={() => {
              onClear ? onClear() : onQueryChange("");
              inputRef.current?.focus();
            }}
            className="p-1 ml-1.5 rounded-full hover:bg-white/10 text-neutral-400 hover:text-white transition-colors"
            title="Clear search"
            aria-label="Clear search query"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        ) : (
          <kbd
            title="Press / to focus search"
            className="hidden sm:inline-block ml-1.5 px-1.5 py-0.5 rounded bg-white/[0.04] border border-white/10 text-[10px] font-mono text-neutral-400 select-none cursor-default"
          >
            /
          </kbd>
        )}
      </div>

      {/* Quieter Popular Tags */}
      <div
        className="flex flex-wrap items-center justify-center gap-1.5 mt-3.5 px-1"
        aria-label="Popular search tags"
      >
        {POPULAR_TAGS.map((tag) => {
          const isSelected = query.trim().toLowerCase() === tag.toLowerCase();
          return (
            <button
              key={tag}
              type="button"
              onClick={() => handleTagClick(tag)}
              aria-label={`Search ${tag} sound effects`}
              aria-pressed={isSelected}
              className={`px-2.5 py-1 rounded-md text-xs font-normal tracking-wide transition-colors select-none ${
                isSelected
                  ? "bg-studio-cyan/20 text-studio-cyan border border-studio-cyan/40 font-medium"
                  : "bg-white/[0.04] hover:bg-white/[0.08] text-neutral-400 hover:text-neutral-200 border border-white/[0.04]"
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
