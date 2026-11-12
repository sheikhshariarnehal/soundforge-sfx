"use client";

import React from "react";
import { Clock, ArrowUpDown, LayoutGrid, List } from "lucide-react";
import { DurationFilter, SortOption } from "@/lib/types";

interface FilterBarProps {
  duration: DurationFilter;
  onDurationChange: (dur: DurationFilter) => void;
  sort: SortOption;
  onSortChange: (sort: SortOption) => void;
  viewMode: "grid" | "list";
  onViewModeChange: (mode: "grid" | "list") => void;
}

const DURATION_OPTIONS: { label: string; value: DurationFilter }[] = [
  { label: "All Durations", value: "all" },
  { label: "< 3s (Short)", value: "short" },
  { label: "3–10s (Medium)", value: "medium" },
  { label: "> 10s (Long)", value: "long" },
];

const SORT_OPTIONS: { label: string; value: SortOption }[] = [
  { label: "Most Relevant", value: "relevance" },
  { label: "Duration: Shortest First", value: "duration-asc" },
  { label: "Duration: Longest First", value: "duration-desc" },
  { label: "Name (A–Z)", value: "title-asc" },
];

export function FilterBar({
  duration,
  onDurationChange,
  sort,
  onSortChange,
  viewMode,
  onViewModeChange,
}: FilterBarProps) {
  return (
    <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-3 flex flex-wrap items-center justify-between gap-4 border-b border-studio-border/60 text-xs">
      {/* Duration Quick Filters */}
      <div className="flex items-center gap-1.5 flex-wrap">
        <span className="flex items-center gap-1 text-studio-muted font-medium mr-1 text-[11px]">
          <Clock className="w-3.5 h-3.5 text-studio-cyan" /> Duration:
        </span>
        {DURATION_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => onDurationChange(opt.value)}
            className={`px-2.5 py-1 rounded-lg border font-medium transition-colors ${
              duration === opt.value
                ? "bg-studio-border/90 border-studio-cyan text-white shadow-sm"
                : "bg-studio-surface/60 border-studio-border/80 text-studio-muted hover:text-white hover:border-studio-borderLight"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Right Controls: Sort & View Toggle */}
      <div className="flex items-center gap-3 ml-auto">
        {/* Sort Select */}
        <div className="flex items-center gap-1.5 bg-studio-surface border border-studio-border rounded-lg px-2.5 py-1">
          <ArrowUpDown className="w-3.5 h-3.5 text-studio-muted" />
          <select
            value={sort}
            onChange={(e) => onSortChange(e.target.value as SortOption)}
            className="bg-transparent text-white text-xs font-medium focus:outline-none cursor-pointer"
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value} className="bg-studio-surface text-white">
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center bg-studio-surface border border-studio-border rounded-lg p-0.5">
          <button
            type="button"
            onClick={() => onViewModeChange("grid")}
            className={`p-1.5 rounded-md transition-colors ${
              viewMode === "grid" ? "bg-studio-cyan text-black" : "text-studio-muted hover:text-white"
            }`}
            title="Grid View"
            aria-label="Grid view"
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => onViewModeChange("list")}
            className={`p-1.5 rounded-md transition-colors ${
              viewMode === "list" ? "bg-studio-cyan text-black" : "text-studio-muted hover:text-white"
            }`}
            title="List View"
            aria-label="List view"
          >
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
