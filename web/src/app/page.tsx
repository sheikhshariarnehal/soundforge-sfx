"use client";

import React, { useState, useMemo, useEffect } from "react";
import { Header } from "@/components/Header";
import { HeroSearch } from "@/components/HeroSearch";
import { CategoryChips } from "@/components/CategoryChips";
import { FilterBar } from "@/components/FilterBar";
import { SoundCard } from "@/components/SoundCard";
import { AudioPlayerBar } from "@/components/AudioPlayerBar";
import { filterSounds } from "@/lib/search";
import { SoundItem, CategoryInfo, DurationFilter, SortOption } from "@/lib/types";

// Import pre-indexed static catalog data
import soundsData from "../../public/data/sounds.json";
import categoriesData from "../../public/data/categories.json";

const allSounds = soundsData as SoundItem[];
const allCategories = categoriesData as CategoryInfo[];

const PAGE_SIZE = 36;

export default function Home() {
  const [query, setQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [duration, setDuration] = useState<DurationFilter>("all");
  const [sort, setSort] = useState<SortOption>("relevance");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  // Compute filtered sounds
  const filteredSounds = useMemo(() => {
    return filterSounds(allSounds, {
      query,
      category: selectedCategory,
      duration,
      sort,
    });
  }, [query, selectedCategory, duration, sort]);

  // Reset pagination when search or filters change
  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [query, selectedCategory, duration, sort]);

  const displayedSounds = useMemo(() => {
    return filteredSounds.slice(0, visibleCount);
  }, [filteredSounds, visibleCount]);

  const hasMore = visibleCount < filteredSounds.length;

  const handleLoadMore = () => {
    setVisibleCount((prev) => Math.min(filteredSounds.length, prev + PAGE_SIZE));
  };

  const handleResetFilters = () => {
    setQuery("");
    setSelectedCategory("all");
    setDuration("all");
    setSort("relevance");
  };

  return (
    <div className="min-h-screen bg-studio-bg flex flex-col justify-between">
      <div>
        {/* Sticky Header with Stats */}
        <Header totalSounds={allSounds.length} totalCategories={allCategories.length} />

        {/* Main Content Area */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-32">
          {/* Hero Search Section */}
          <HeroSearch
            query={query}
            onQueryChange={setQuery}
            resultCount={filteredSounds.length}
            totalCount={allSounds.length}
          />

          {/* 47 Category Chips Bar */}
          <CategoryChips
            categories={allCategories}
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
            totalCount={allSounds.length}
          />

          {/* Duration Filters, Sort, and View Mode Toggle */}
          <FilterBar
            duration={duration}
            onDurationChange={setDuration}
            sort={sort}
            onSortChange={setSort}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
          />

          {/* Sound Results View */}
          <section className="mt-6">
            {displayedSounds.length > 0 ? (
              viewMode === "grid" ? (
                /* Grid Layout */
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {displayedSounds.map((sound) => (
                    <SoundCard key={sound.id} sound={sound} viewMode="grid" />
                  ))}
                </div>
              ) : (
                /* List Layout */
                <div className="flex flex-col gap-2.5">
                  {displayedSounds.map((sound) => (
                    <SoundCard key={sound.id} sound={sound} viewMode="list" />
                  ))}
                </div>
              )
            ) : (
              /* Empty Search Results State */
              <div className="text-center py-20 px-4 rounded-2xl border border-dashed border-studio-border bg-studio-surface/40 my-8">
                <div className="w-12 h-12 rounded-full bg-studio-border/60 text-studio-muted flex items-center justify-center mx-auto mb-3">
                  🔍
                </div>
                <h3 className="text-lg font-semibold text-white">No sound effects matched</h3>
                <p className="text-sm text-studio-muted mt-1 max-w-md mx-auto">
                  We couldn&apos;t find any audio files matching your current search or filter combination.
                </p>
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="mt-4 px-4 py-2 rounded-xl bg-studio-cyan text-black font-semibold text-xs hover:bg-studio-cyanHover transition-colors"
                >
                  Clear All Filters
                </button>
              </div>
            )}

            {/* Load More Button */}
            {hasMore && (
              <div className="text-center mt-10">
                <button
                  type="button"
                  onClick={handleLoadMore}
                  className="px-6 py-3 rounded-xl bg-studio-surface hover:bg-studio-card border border-studio-border hover:border-studio-cyan/50 text-white font-medium text-sm transition-all shadow-lg hover:shadow-studio-cyan/10"
                >
                  Load More Sounds ({filteredSounds.length - visibleCount} remaining)
                </button>
              </div>
            )}
          </section>
        </main>
      </div>

      {/* Floating Bottom Audio Player */}
      <AudioPlayerBar />
    </div>
  );
}
