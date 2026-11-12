import assert from "node:assert";
import fs from "node:fs";
import path from "node:path";
import { filterSounds } from "./search.ts";

// Read real sounds catalog
const catalogPath = path.resolve("public/data/sounds.json");
const sounds = JSON.parse(fs.readFileSync(catalogPath, "utf-8"));

console.log(`[Test] Loaded ${sounds.length} sounds for search testing.`);

// Test 1: Category filter
const swooshSounds = filterSounds(sounds, {
  query: "",
  category: "swoosh",
  duration: "all",
  sort: "relevance"
});
assert(swooshSounds.length >= 30, `Expected at least 30 swoosh sounds, got ${swooshSounds.length}`);
assert(swooshSounds.every(s => s.category === "swoosh"));
console.log(`✓ Category filter passed (${swooshSounds.length} swoosh sounds)`);

// Test 2: Duration filter
const shortSounds = filterSounds(sounds, {
  query: "",
  category: "all",
  duration: "short",
  sort: "relevance"
});
assert(shortSounds.length > 0, "Expected short sounds to be present");
assert(shortSounds.every(s => s.duration <= 3), "All short sounds must be <= 3s");
console.log(`✓ Duration filter passed (${shortSounds.length} short sounds <= 3s)`);

// Test 3: Search query
const popResults = filterSounds(sounds, {
  query: "bubble",
  category: "all",
  duration: "all",
  sort: "relevance"
});
assert(popResults.length > 0, "Expected search results for 'bubble'");
assert(popResults[0].title.toLowerCase().includes("bubble") || popResults[0].tags.some(t => t.toLowerCase().includes("bubble")));
console.log(`✓ Search query passed (found ${popResults.length} matches for 'bubble')`);

// Test 4: Duration sort
const sample = sounds.slice(0, 50);
const sorted = filterSounds(sample, {
  query: "",
  category: "all",
  duration: "all",
  sort: "duration-asc"
});
for (let i = 0; i < sorted.length - 1; i++) {
  assert(sorted[i].duration <= sorted[i + 1].duration, "Sorted list must be ascending duration");
}
console.log("✓ Duration sort passed");
console.log("\nALL SEARCH TESTS PASSED!");
