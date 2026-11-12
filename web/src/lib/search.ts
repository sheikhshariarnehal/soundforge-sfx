import Fuse from "fuse.js";
import { SoundItem, FilterState } from "./types";

let fuseInstance: Fuse<SoundItem> | null = null;
let lastIndexedSounds: SoundItem[] | null = null;

export function getSearchIndex(sounds: SoundItem[]): Fuse<SoundItem> {
  if (!fuseInstance || lastIndexedSounds !== sounds) {
    fuseInstance = new Fuse(sounds, {
      keys: [
        { name: "title", weight: 2 },
        { name: "tags", weight: 1.5 },
        { name: "category", weight: 1.2 },
        { name: "creator", weight: 0.8 },
      ],
      threshold: 0.35,
      ignoreLocation: true,
      minMatchCharLength: 2,
    });
    lastIndexedSounds = sounds;
  }
  return fuseInstance;
}

export function filterSounds(sounds: SoundItem[], filters: FilterState): SoundItem[] {
  let results = sounds;

  // 1. Text Search via Fuse.js
  const trimmedQuery = filters.query.trim();
  if (trimmedQuery) {
    const fuse = getSearchIndex(sounds);
    const searchResults = fuse.search(trimmedQuery);
    results = searchResults.map((res) => res.item);
  }

  // 2. Category Filter
  if (filters.category && filters.category.toLowerCase() !== "all") {
    const targetCat = filters.category.toLowerCase();
    results = results.filter((sound) => sound.category.toLowerCase() === targetCat);
  }

  // 3. Duration Filter
  if (filters.duration !== "all") {
    results = results.filter((sound) => {
      const dur = sound.duration;
      if (filters.duration === "short") return dur <= 3;
      if (filters.duration === "medium") return dur > 3 && dur <= 10;
      if (filters.duration === "long") return dur > 10;
      return true;
    });
  }

  // 4. Sorting
  if (filters.sort === "duration-asc") {
    results = [...results].sort((a, b) => a.duration - b.duration);
  } else if (filters.sort === "duration-desc") {
    results = [...results].sort((a, b) => b.duration - a.duration);
  } else if (filters.sort === "title-asc") {
    results = [...results].sort((a, b) => a.title.localeCompare(b.title));
  }
  // 'relevance' maintains Fuse search order, or original catalog order

  return results;
}
