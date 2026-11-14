"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/Header";
import { HeroSearch } from "@/components/HeroSearch";
import { CategoryChips } from "@/components/CategoryChips";
import { FilterBar } from "@/components/FilterBar";
import { SoundCard } from "@/components/SoundCard";
import { AudioPlayerBar } from "@/components/AudioPlayerBar";
import { filterSounds } from "@/lib/search";
import { SoundItem, CategoryInfo, DurationFilter, SortOption } from "@/lib/types";

import soundsData from "../../public/data/sounds.json";
import categoriesData from "../../public/data/categories.json";

const allSounds = soundsData as SoundItem[];
const allCategories = categoriesData as CategoryInfo[];

const PAGE_SIZE = 36;

interface SoundExplorerProps {
  initialQuery?: string;
}

export function SoundExplorer({ initialQuery = "" }: SoundExplorerProps) {
  const router = useRouter();
  const [query, setQuery] = useState(initialQuery);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [duration, setDuration] = useState<DurationFilter>("all");
  const [sort, setSort] = useState<SortOption>("relevance");
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  // Synchronize internal query state if URL parameter changes (e.g. browser back/forward)
  useEffect(() => {
    setQuery(initialQuery);
  }, [initialQuery]);

  // Compute filtered sounds
  const filteredSounds = useMemo(() => {
    return filterSounds(allSounds, {
      query,
      category: selectedCategory,
      duration,
      sort,
    });
  }, [query, selectedCategory, duration, sort]);

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

  const handleQueryChange = (q: string) => {
    setQuery(q);
  };

  const handleSearchSubmit = (q: string) => {
    const trimmed = q.trim();
    if (trimmed) {
      router.push(`/search/${encodeURIComponent(trimmed)}`);
    } else {
      router.push("/");
    }
  };

  const handleSelectTag = (tag: string) => {
    const trimmed = tag.trim();
    setQuery(trimmed);
    router.push(`/search/${encodeURIComponent(trimmed)}`);
  };

  const handleClear = () => {
    setQuery("");
    router.push("/");
  };

  const handleResetFilters = () => {
    setQuery("");
    setSelectedCategory("all");
    setDuration("all");
    setSort("relevance");
    router.push("/");
  };

  return (
    <div className="min-h-screen bg-studio-bg flex flex-col justify-between selection:bg-studio-cyan selection:text-black">
      <div>
        <Header totalSounds={allSounds.length} totalCategories={allCategories.length} />

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-28">
          <HeroSearch
            query={query}
            onQueryChange={handleQueryChange}
            onSubmit={handleSearchSubmit}
            onSelectTag={handleSelectTag}
            onClear={handleClear}
          />

          <CategoryChips
            categories={allCategories}
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
          />

          <FilterBar
            duration={duration}
            onDurationChange={setDuration}
            sort={sort}
            onSortChange={setSort}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            totalResults={filteredSounds.length}
            searchQuery={query}
            selectedCategory={selectedCategory}
            onResetAll={handleResetFilters}
          />

          <section className="mt-4">
            {displayedSounds.length > 0 ? (
              viewMode === "grid" ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {displayedSounds.map((sound) => (
                    <SoundCard key={sound.id} sound={sound} viewMode="grid" />
                  ))}
                </div>
              ) : (
                <div className="flex flex-col rounded-xl border border-studio-border/50 bg-studio-surface/20 divide-y divide-studio-border/30 overflow-hidden">
                  {displayedSounds.map((sound) => (
                    <SoundCard key={sound.id} sound={sound} viewMode="list" />
                  ))}
                </div>
              )
            ) : (
              <div className="text-center py-16 px-4 rounded-xl border border-dashed border-studio-border bg-studio-surface/20 my-6 max-w-lg mx-auto">
                <h2 className="text-base font-semibold text-white mb-1.5">
                  {query.trim()
                    ? `No sounds found for "${query.trim()}"`
                    : "No sounds match the selected filters"}
                </h2>
                <p className="text-xs sm:text-sm text-studio-muted mb-5 leading-relaxed">
                  {query.trim()
                    ? "Try searching for broader keywords like swoosh, riser, pop, or click, or reset filters to browse the full library."
                    : "Try adjusting your category or duration filters to see more results."}
                </p>
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="px-4 py-2 rounded-lg bg-studio-surface border border-studio-border text-white text-xs font-medium hover:border-studio-cyan/60 hover:text-studio-cyan transition-colors"
                >
                  Clear filters and show all sounds
                </button>
              </div>
            )}

            {hasMore && (
              <div className="text-center mt-8">
                <button
                  type="button"
                  onClick={handleLoadMore}
                  className="px-5 py-2 rounded-lg bg-studio-surface hover:bg-studio-border border border-studio-border text-white text-xs font-medium transition-colors"
                >
                  Load more ({filteredSounds.length - visibleCount} remaining)
                </button>
              </div>
            )}
          </section>
        </main>
      </div>

      <AudioPlayerBar />
    </div>
  );
}
