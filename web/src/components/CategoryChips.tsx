"use client";

import React, { useRef } from "react";
import { ChevronLeft, ChevronRight, Layers } from "lucide-react";
import { CategoryInfo } from "@/lib/types";

interface CategoryChipsProps {
  categories: CategoryInfo[];
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
  totalCount: number;
}

export function CategoryChips({
  categories,
  selectedCategory,
  onSelectCategory,
  totalCount,
}: CategoryChipsProps) {
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  const scroll = (direction: "left" | "right") => {
    if (scrollContainerRef.current) {
      const offset = direction === "left" ? -280 : 280;
      scrollContainerRef.current.scrollBy({ left: offset, behavior: "smooth" });
    }
  };

  return (
    <div className="relative w-full max-w-7xl mx-auto my-4 px-2 sm:px-4 flex items-center group">
      {/* Scroll Left Button */}
      <button
        type="button"
        onClick={() => scroll("left")}
        className="hidden md:flex flex-shrink-0 w-8 h-8 rounded-full bg-studio-surface border border-studio-border text-studio-muted hover:text-white hover:bg-studio-card items-center justify-center mr-2 shadow-md transition-opacity z-10"
        aria-label="Scroll left"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>

      {/* Categories Horizontal Scroll Bar */}
      <div
        ref={scrollContainerRef}
        className="flex items-center gap-2 overflow-x-auto no-scrollbar py-2 w-full scroll-smooth"
      >
        {/* 'All' category button */}
        <button
          type="button"
          onClick={() => onSelectCategory("all")}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all border flex-shrink-0 ${
            selectedCategory === "all"
              ? "bg-studio-cyan text-black border-studio-cyan font-semibold shadow-md shadow-studio-cyan/20"
              : "bg-studio-surface border-studio-border text-studio-muted hover:text-white hover:border-studio-borderLight"
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>All Sounds</span>
          <span
            className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
              selectedCategory === "all" ? "bg-black/20 text-black" : "bg-studio-border/70 text-studio-muted"
            }`}
          >
            {totalCount}
          </span>
        </button>

        {/* 47 Category Chips */}
        {categories.map((cat) => {
          const isSelected = selectedCategory.toLowerCase() === cat.name.toLowerCase();
          const displayName = cat.name.replace(/_/g, " ");

          return (
            <button
              key={cat.name}
              type="button"
              onClick={() => onSelectCategory(cat.name)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium capitalize whitespace-nowrap transition-all border flex-shrink-0 ${
                isSelected
                  ? "bg-studio-cyan text-black border-studio-cyan font-semibold shadow-md shadow-studio-cyan/20"
                  : "bg-studio-surface border-studio-border text-studio-muted hover:text-white hover:border-studio-borderLight"
              }`}
            >
              <span>{displayName}</span>
              <span
                className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                  isSelected ? "bg-black/25 text-black font-semibold" : "bg-studio-border/70 text-studio-muted"
                }`}
              >
                {cat.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Scroll Right Button */}
      <button
        type="button"
        onClick={() => scroll("right")}
        className="hidden md:flex flex-shrink-0 w-8 h-8 rounded-full bg-studio-surface border border-studio-border text-studio-muted hover:text-white hover:bg-studio-card items-center justify-center ml-2 shadow-md transition-opacity z-10"
        aria-label="Scroll right"
      >
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
}
