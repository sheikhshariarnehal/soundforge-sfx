export interface SoundItem {
  id: string;
  title: string;
  category: string;
  duration: number;
  creator: string;
  filename: string;
  tags: string[];
  audioUrl: string;
  r2Key: string;
  pixabayUrl: string;
  peaks?: number[];
}

export interface CategoryInfo {
  name: string;
  count: number;
}

export type DurationFilter = "all" | "short" | "medium" | "long";
export type SortOption = "relevance" | "duration-asc" | "duration-desc" | "title-asc";

export interface FilterState {
  query: string;
  category: string;
  duration: DurationFilter;
  sort: SortOption;
}
