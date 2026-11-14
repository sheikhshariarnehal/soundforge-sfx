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
    <div className="max-w-7xl mx-auto w-full px-2 sm:px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs border-y border-white/[0.06]">
      {/* Left: Result count + Duration tabs */}
      <div className="flex items-center gap-3 sm:gap-4 flex-wrap">
        <span className="font-mono text-neutral-400 text-xs">
          <strong className="text-neutral-200 font-medium">{totalResults.toLocaleString()}</strong>{" "}
          {totalResults === 1 ? "sound" : "sounds"}
        </span>

        {isFiltered && onResetAll && (
          <button
            type="button"
            onClick={onResetAll}
            className="text-[11px] text-neutral-400 hover:text-white transition-colors"
          >
            Reset filters
          </button>
        )}

        <div
          className="flex items-center gap-0.5 bg-white/[0.03] p-0.5 rounded-md border border-white/[0.06]"
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
              className={`px-2 py-0.5 rounded text-xs transition-colors ${
                duration === opt.value
                  ? "bg-white/10 text-white font-medium shadow-none"
                  : "text-neutral-400 hover:text-neutral-200"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Right: Sort & Layout switcher */}
      <div className="flex items-center gap-2 ml-auto">
        <div className="flex items-center gap-1.5 bg-white/[0.03] border border-white/[0.06] rounded-md px-2 py-1">
          <ArrowUpDown className="w-3.5 h-3.5 text-neutral-400" />
          <select
            value={sort}
            onChange={(e) => onSortChange(e.target.value as SortOption)}
            aria-label="Sort sounds by"
            className="bg-transparent text-neutral-300 text-xs focus:outline-none cursor-pointer"
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value} className="bg-[#181a20] text-white">
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center bg-white/[0.03] border border-white/[0.06] rounded-md p-0.5">
          <button
            type="button"
            onClick={() => onViewModeChange("list")}
            className={`p-1.5 rounded transition-colors ${
              viewMode === "list" ? "bg-white/10 text-white" : "text-neutral-400 hover:text-neutral-200"
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
            className={`p-1.5 rounded transition-colors ${
              viewMode === "grid" ? "bg-white/10 text-white" : "text-neutral-400 hover:text-neutral-200"
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
