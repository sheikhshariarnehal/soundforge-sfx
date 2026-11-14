"use client";

import React from "react";
import { ArrowUpDown, LayoutGrid, List } from "lucide-react";
import { DurationFilter, SortOption } from "@/lib/types";

interface FilterBarProps {
  duration: DurationFilter;
  onDurationChange: (dur: DurationFilter) => void;
  sort: SortOption;
  onSortChange: (sort: SortOption) => void;
  viewMode: "grid" | "list";
  onViewModeChange: (mode: "grid" | "list") => void;
  totalResults: number;
  searchQuery?: string;
  selectedCategory?: string;
  onResetAll?: () => void;
}

const DURATION_OPTIONS: { label: string; value: DurationFilter; title: string }[] = [
  { label: "All", value: "all", title: "All sound durations" },
  { label: "< 3s", value: "short", title: "Sounds under 3 seconds (one-shots)" },
  { label: "3–10s", value: "medium", title: "Sounds between 3 and 10 seconds" },
  { label: "> 10s", value: "long", title: "Sounds longer than 10 seconds (ambient/loops)" },
];

const SORT_OPTIONS: { label: string; value: SortOption }[] = [
  { label: "Most relevant", value: "relevance" },
  { label: "Shortest duration", value: "duration-asc" },
  { label: "Longest duration", value: "duration-desc" },
  { label: "Alphabetical (A–Z)", value: "title-asc" },
];

export function FilterBar({
  duration,
  onDurationChange,
  sort,
  onSortChange,
  viewMode,
  onViewModeChange,
  totalResults,
  searchQuery,
  selectedCategory,
  onResetAll,
}: FilterBarProps) {
  const isFiltered = Boolean(
    (searchQuery && searchQuery.trim() !== "") ||
    (selectedCategory && selectedCategory.toLowerCase() !== "all") ||
    duration !== "all" ||
    sort !== "relevance"
  );

  return (
    <div className="max-w-7xl mx-auto w-full px-2 sm:px-4 py-3 flex flex-wrap items-center justify-between gap-3 text-xs border-y border-studio-border/50">
      {/* Left: Result count + Duration tabs */}
      <div className="flex items-center gap-3 sm:gap-4 flex-wrap">
        <span className="font-mono text-studio-muted text-xs">
          <strong className="text-white font-medium">{totalResults.toLocaleString()}</strong>{" "}
          {totalResults === 1 ? "sound" : "sounds"}
        </span>

        {isFiltered && onResetAll && (
          <button
            type="button"
            onClick={onResetAll}
            className="text-[11px] text-studio-cyan hover:underline hover:text-cyan-300 font-mono transition-colors"
          >
            Reset filters
          </button>
        )}

        <div
          className="flex items-center gap-1 bg-studio-surface/60 p-0.5 rounded-lg border border-studio-border/60"
          role="group"
          aria-label="Filter by duration"
        >
          {DURATION_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => onDurationChange(opt.value)}
              title={opt.title}
              aria-label={opt.title}
              aria-pressed={duration === opt.value}
              className={`px-2.5 py-1 rounded-md font-medium text-xs transition-colors ${
                duration === opt.value
                  ? "bg-studio-border text-white shadow-sm"
                  : "text-studio-muted hover:text-white"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Right: Sort & Layout switcher */}
      <div className="flex items-center gap-2 ml-auto">
        <div className="flex items-center gap-1.5 bg-studio-surface/60 border border-studio-border/60 rounded-lg px-2.5 py-1">
          <ArrowUpDown className="w-3.5 h-3.5 text-studio-muted" />
          <select
            value={sort}
            onChange={(e) => onSortChange(e.target.value as SortOption)}
            aria-label="Sort sounds by"
            className="bg-transparent text-white text-xs focus:outline-none cursor-pointer"
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value} className="bg-studio-surface text-white">
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center bg-studio-surface/60 border border-studio-border/60 rounded-lg p-0.5">
          <button
            type="button"
            onClick={() => onViewModeChange("list")}
            className={`p-1.5 rounded-md transition-colors ${
              viewMode === "list" ? "bg-studio-border text-white shadow-sm" : "text-studio-muted hover:text-white"
            }`}
            title="List view"
            aria-label="Switch to list view"
            aria-pressed={viewMode === "list"}
          >
            <List className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => onViewModeChange("grid")}
            className={`p-1.5 rounded-md transition-colors ${
              viewMode === "grid" ? "bg-studio-border text-white shadow-sm" : "text-studio-muted hover:text-white"
            }`}
            title="Grid view"
            aria-label="Switch to grid view"
            aria-pressed={viewMode === "grid"}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
