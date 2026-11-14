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
  pixabayUrl?: string;
  peaks?: number[];
  localPath?: string;
}

export interface CategorySummary {
  name: string;
  count: number;
}

export interface SearchSoundsParams {
  query?: string;
  category?: string;
  maxDuration?: number;
  minDuration?: number;
  limit?: number;
  offset?: number;
}

export interface SearchResult {
  total: number;
  offset: number;
  limit: number;
  sounds: SoundItem[];
}
