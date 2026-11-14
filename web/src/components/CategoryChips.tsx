"use client";

import React, { useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { CategoryInfo } from "@/lib/types";

interface CategoryChipsProps {
  categories: CategoryInfo[];
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
}

export function CategoryChips({
  categories,
  selectedCategory,
  onSelectCategory,
}: CategoryChipsProps) {
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  const scroll = (direction: "left" | "right") => {
    if (scrollContainerRef.current) {
      const offset = direction === "left" ? -240 : 240;
      scrollContainerRef.current.scrollBy({ left: offset, behavior: "smooth" });
    }
  };

  return (
    <div className="relative w-full max-w-7xl mx-auto my-2.5 px-2 sm:px-4 flex items-center group">
      {/* Scroll Left */}
      <button
        type="button"
        onClick={() => scroll("left")}
        className="hidden md:flex flex-shrink-0 w-6 h-6 rounded-md bg-studio-surface border border-studio-border text-studio-muted hover:text-white hover:border-studio-primary/40 items-center justify-center mr-1.5 transition-colors"
        aria-label="Scroll left"
      >
        <ChevronLeft className="w-3.5 h-3.5" />
      </button>

      {/* Categories Horizontal Scroll Bar */}
      <div
        ref={scrollContainerRef}
        role="region"
        aria-label="Filter sounds by category"
        className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1 w-full scroll-smooth"
      >
        <button
          type="button"
          onClick={() => onSelectCategory("all")}
          aria-label="Show all categories"
          aria-pressed={selectedCategory === "all"}
          className={`px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-colors flex-shrink-0 ${
            selectedCategory === "all"
              ? "bg-studio-primary text-black font-semibold shadow-sm"
              : "bg-studio-surface/50 border border-studio-border/60 text-studio-muted hover:text-white hover:bg-studio-surface hover:border-studio-border"
          }`}
        >
          All
        </button>

        {categories.map((cat) => {
          const isSelected = selectedCategory.toLowerCase() === cat.name.toLowerCase();
          const displayName = cat.name.replace(/_/g, " ");

          return (
            <button
              key={cat.name}
              type="button"
              onClick={() => onSelectCategory(cat.name)}
              aria-label={`Category: ${displayName}`}
              aria-pressed={isSelected}
              className={`px-2.5 py-1.5 rounded-md text-xs font-normal capitalize whitespace-nowrap transition-colors flex-shrink-0 ${
                isSelected
                  ? "bg-studio-primary text-black font-semibold shadow-sm"
                  : "bg-studio-surface/50 border border-studio-border/60 text-studio-muted hover:text-white hover:bg-studio-surface hover:border-studio-border"
              }`}
            >
              {displayName}
            </button>
          );
        })}
      </div>

      {/* Scroll Right */}
      <button
        type="button"
        onClick={() => scroll("right")}
        className="hidden md:flex flex-shrink-0 w-6 h-6 rounded-md bg-studio-surface border border-studio-border text-studio-muted hover:text-white hover:border-studio-primary/40 items-center justify-center ml-1.5 transition-colors"
        aria-label="Scroll right"
      >
        <ChevronRight className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
