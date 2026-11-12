# Sound Effect Library Website & Cloudflare R2 Pipeline Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a high-performance Next.js 15 sound effect library web application with dark studio styling, instant search across 1,417 sounds in 47 categories, scrubbable waveforms, persistent floating bottom player, and a multi-threaded Cloudflare R2 upload pipeline.

**Architecture:** A Next.js 15 App Router frontend paired with a pre-indexed static JSON catalog (`sounds.json`) queried client-side via Fuse.js for zero database costs and sub-millisecond search. Audio files are streamed with zero egress fees from Cloudflare R2 (or local fallback during development), synced via a multi-threaded Python `boto3` script.

**Tech Stack:** Next.js 15 (App Router, React 19, TypeScript), Tailwind CSS, Lucide React, Fuse.js, Canvas Waveform Visualizer, Python 3 + boto3.

**Spec:** [docs/specs/2026-11-13-sound-effects-library-website-design.md](file:///o:/Vidoe/Sound%20Effect/docs/specs/2026-11-13-sound-effects-library-website-design.md)

## Global Constraints

- Storage: Cloudflare R2 bucket key convention `sounds/{category}/{filename}` with public zero-egress streaming.
- Catalog: Exactly 1,417 sounds across 47 categories derived from `metadata.csv`.
- Search: Client-side Fuse.js fuzzy search with $0 database cost.
- UI Theme: Modern Dark Studio (`#090d16` background, `#1e293b` cards, `#06b6d4` cyan waveforms, `#f59e0b` amber accents).
- Key interactions: Spacebar toggles active audio playback; clicking waveforms scrubs timestamp; one-click direct MP3 downloading.

## Review Focus

1. **Sub-second audio durations**: Tracks with `0` or fractional duration should format gracefully (e.g. `< 1s` or `0.5s`) instead of showing broken time displays.
2. **Missing or offline R2 credentials**: Site must automatically fall back to local `/audio/` or placeholder audio without throwing uncaught runtime exceptions when R2 URL is not yet configured.
3. **Browser AudioContext / Autoplay restrictions**: Spacebar or play button clicks must handle browser autoplay promise rejections gracefully without unhandled exceptions.
4. **Large list rendering**: Rendering 1,417 items simultaneously in DOM causes frame drops; pagination or incremental display (e.g. 30 per page with "Load More" / infinite scroll) must keep 60 FPS scrolling.
5. **Cross-Origin direct downloads**: Browser cross-origin download restrictions on CDN URLs must be handled via direct download attribute or fetch blob helper so users can save `.mp3` files with one click.

---

### Task 1: Catalog Generator & Data Pipeline

**Files:**
- Create: `generate_catalog.py`
- Test: `tests/test_catalog.py`
- Output: `web/public/data/sounds.json`, `web/public/data/categories.json`

**Interfaces:**
- Consumes: `metadata.csv` (1,417 rows)
- Produces: `sounds.json` (array of `SoundItem`), `categories.json` (array of `{ name: string, count: number }`)

- [ ] **Step 1: Write the failing test for catalog generation**

```python
# tests/test_catalog.py
import json
from pathlib import Path
import pytest

def test_catalog_structure():
    catalog_path = Path("web/public/data/sounds.json")
    categories_path = Path("web/public/data/categories.json")
    assert catalog_path.exists(), "sounds.json does not exist"
    assert categories_path.exists(), "categories.json does not exist"
    
    with open(catalog_path, encoding="utf-8") as f:
        sounds = json.load(f)
    assert len(sounds) == 1417
    
    first = sounds[0]
    for key in ["id", "title", "category", "duration", "creator", "filename", "tags", "audioUrl"]:
        assert key in first
        
    with open(categories_path, encoding="utf-8") as f:
        categories = json.load(f)
    assert len(categories) == 47
```

- [ ] **Step 2: Run test to verify it fails**

Run: `python -m pytest tests/test_catalog.py`
Expected: FAIL with "sounds.json does not exist"

- [ ] **Step 3: Implement `generate_catalog.py`**

Parse `metadata.csv`, clean tags into lists, format duration (float or int), construct relative audio path, compute category counts, and export indented JSON to `web/public/data/`.

- [ ] **Step 4: Run script and verify test passes**

Run: `python generate_catalog.py && python -m pytest tests/test_catalog.py`
Expected: PASS (1417 sounds, 47 categories)

- [ ] **Step 5: Commit**

```bash
git add generate_catalog.py tests/test_catalog.py web/public/data/
git commit -m "feat(catalog): generate static search catalog and category counts from metadata.csv"
```

---

### Task 2: Cloudflare R2 Upload Tooling

**Files:**
- Create: `upload_to_r2.py`
- Create: `.env.example`
- Test: `tests/test_r2_uploader.py`

**Interfaces:**
- Consumes: `categories/` folder (1,417 MP3 files), `.env` credentials
- Produces: `upload_to_r2.py` CLI supporting `--dry-run`, `--bucket`, `--concurrency`

- [ ] **Step 1: Write the failing test for R2 key mapping and dry run**

```python
# tests/test_r2_uploader.py
from upload_to_r2 import build_r2_key, scan_local_files

def test_build_r2_key():
    key = build_r2_key("swoosh", "Copyright_Free_Swoosh_487669.mp3")
    assert key == "sounds/swoosh/Copyright_Free_Swoosh_487669.mp3"

def test_scan_local_files():
    files = scan_local_files()
    assert len(files) == 1417
```

- [ ] **Step 2: Run test to verify it fails**

Run: `python -m pytest tests/test_r2_uploader.py`
Expected: FAIL (module not found)

- [ ] **Step 3: Implement `upload_to_r2.py` and `.env.example`**

Implement `build_r2_key`, `scan_local_files`, and multi-threaded S3 upload pool using `concurrent.futures.ThreadPoolExecutor(max_workers=8)` with `ContentType='audio/mpeg'` and `CacheControl='public, max-age=31536000, immutable'`.

- [ ] **Step 4: Run test and dry-run to verify it passes**

Run: `python -m pytest tests/test_r2_uploader.py && python upload_to_r2.py --dry-run`
Expected: PASS and dry-run reports 1,417 files ready for sync.

- [ ] **Step 5: Commit**

```bash
git add upload_to_r2.py .env.example tests/test_r2_uploader.py
git commit -m "feat(r2): add multi-threaded Cloudflare R2 synchronization CLI tool"
```

---

### Task 3: Next.js Project Scaffolding & Setup

**Files:**
- Create: `web/package.json`
- Create: `web/tsconfig.json`
- Create: `web/tailwind.config.ts`
- Create: `web/postcss.config.mjs`
- Create: `web/src/app/globals.css`
- Create: `web/src/app/layout.tsx`

**Interfaces:**
- Consumes: Node.js & npm
- Produces: Working Next.js 15 App with Dark Studio theme tokens

- [ ] **Step 1: Scaffold Next.js application inside `web/`**

Run npm install with dependencies: `next`, `react`, `react-dom`, `lucide-react`, `fuse.js`, `clsx`, `tailwind-merge`, and devDependencies: `typescript`, `tailwindcss`, `@types/react`, `@types/node`.

- [ ] **Step 2: Configure `tailwind.config.ts` and Dark Studio tokens**

Define custom colors:
- `studio-dark`: `#090d16`
- `studio-card`: `#0f172a`
- `studio-border`: `#1e293b`
- `studio-cyan`: `#06b6d4`
- `studio-amber`: `#f59e0b`

- [ ] **Step 3: Create `src/app/layout.tsx` and `src/app/globals.css`**

Add responsive typography, dark background class, and custom scrollbar styles.

- [ ] **Step 4: Verify Next.js build initializes cleanly**

Run: `cd web && npm run build`
Expected: Build succeeds with 0 errors.

- [ ] **Step 5: Commit**

```bash
git add web/
git commit -m "chore(web): scaffold Next.js 15 app with Tailwind Dark Studio theme"
```

---

### Task 4: Types & Search / Filtering Engine

**Files:**
- Create: `web/src/lib/types.ts`
- Create: `web/src/lib/search.ts`
- Test: `web/src/lib/search.test.ts`

**Interfaces:**
- Consumes: `sounds.json` catalog
- Produces: `filterSounds(sounds: SoundItem[], filters: FilterState): SoundItem[]`

- [ ] **Step 1: Define TypeScript interfaces in `web/src/lib/types.ts`**

```typescript
export interface SoundItem {
  id: string;
  title: string;
  category: string;
  duration: number;
  creator: string;
  filename: string;
  tags: string[];
  audioUrl: string;
  pixabayUrl: string;
}

export type DurationFilter = 'all' | 'short' | 'medium' | 'long';
export type SortOption = 'relevance' | 'duration-asc' | 'duration-desc' | 'title-asc';

export interface FilterState {
  query: string;
  category: string;
  duration: DurationFilter;
  sort: SortOption;
}
```

- [ ] **Step 2: Implement search and duration filtering in `web/src/lib/search.ts`**

Implement `createSearchIndex(sounds: SoundItem[])` using Fuse.js (keys: `title` weight 2, `tags` weight 1.5, `category` weight 1), duration thresholds (`short`: <= 3s, `medium`: 3.1s to 10s, `long`: > 10s), and sorting comparator.

- [ ] **Step 3: Write test and verify search behavior**

Verify:
- Searching "pop" returns pop sounds first
- Filtering category "swoosh" returns only swoosh sounds
- Filtering duration "short" filters out sounds > 3 seconds

- [ ] **Step 4: Commit**

```bash
git add web/src/lib/
git commit -m "feat(search): implement Fuse.js fuzzy search, duration filtering, and sorting"
```

---

### Task 5: Global Audio Context & Playback Engine

**Files:**
- Create: `web/src/context/AudioContext.tsx`

**Interfaces:**
- Consumes: `SoundItem`
- Produces: `useAudio()` hook providing:
  - `activeSound: SoundItem | null`
  - `isPlaying: boolean`
  - `currentTime: number`
  - `duration: number`
  - `playbackRate: number` (0.5 to 2.0)
  - `isLooping: boolean`
  - `volume: number` (0 to 1)
  - `playSound: (sound: SoundItem) => void`
  - `togglePlay: () => void`
  - `seekTo: (seconds: number) => void`
  - `setPlaybackRate: (rate: number) => void`
  - `toggleLoop: () => void`
  - `setVolume: (vol: number) => void`

- [ ] **Step 1: Create `AudioContext.tsx` with HTMLAudioElement lifecycle**

Implement singleton `Audio` instance, event listeners (`timeupdate`, `ended`, `loadedmetadata`, `error`), and graceful error handling when audio URL is unavailable.

- [ ] **Step 2: Add global Spacebar keydown listener**

Listen for `window.addEventListener('keydown')` to toggle playback on Space (ignoring when user is typing in input fields).

- [ ] **Step 3: Wrap `layout.tsx` with `<AudioProvider>`**

- [ ] **Step 4: Verify build succeeds**

Run: `cd web && npm run build`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add web/src/context/AudioContext.tsx web/src/app/layout.tsx
git commit -m "feat(audio): add global AudioContext with Spacebar hotkey and playback controls"
```

---

### Task 6: Interactive Waveform & Sound Card Components

**Files:**
- Create: `web/src/components/Waveform.tsx`
- Create: `web/src/components/SoundCard.tsx`
- Create: `web/src/lib/download.ts`

**Interfaces:**
- Consumes: `SoundItem`, `useAudio()`
- Produces: `<Waveform />`, `<SoundCard />` with List & Grid modes, and `downloadSound(sound: SoundItem)` helper

- [ ] **Step 1: Implement `web/src/lib/download.ts`**

Create robust client-side download utility that triggers immediate browser file download named `<Title>_<ID>.mp3`.

- [ ] **Step 2: Implement `web/src/components/Waveform.tsx`**

Canvas-based audio waveform visualization:
- Generates reproducible pseudo-random visual peaks based on track ID seed (36 bars).
- Displays animated playback progress with cyan glow.
- Handles mouse click/drag scrubbing with `seekTo(timestamp)`.

- [ ] **Step 3: Implement `web/src/components/SoundCard.tsx`**

Dual-mode component:
- **Grid mode**: Compact dark card with category badge, title, creator, interactive waveform, play button, and download button.
- **List mode**: High-density horizontal table row with instant play trigger, title, tags chips, duration pill, and download action.

- [ ] **Step 4: Verify build succeeds**

Run: `cd web && npm run build`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add web/src/components/Waveform.tsx web/src/components/SoundCard.tsx web/src/lib/download.ts
git commit -m "feat(ui): add interactive canvas waveform and dual-mode sound cards"
```

---

### Task 7: Exploration UI & Filter Controls

**Files:**
- Create: `web/src/components/Header.tsx`
- Create: `web/src/components/HeroSearch.tsx`
- Create: `web/src/components/CategoryChips.tsx`
- Create: `web/src/components/FilterBar.tsx`

**Interfaces:**
- Consumes: `FilterState`, `categories.json`
- Produces: Interactive filter bars and search header

- [ ] **Step 1: Implement `Header.tsx`**

Displays logo, "1,417 Royalty-Free SFX", "47 Categories", and live Cloudflare R2 status indicator.

- [ ] **Step 2: Implement `HeroSearch.tsx`**

Search input with search icon, clear button, and quick suggestion tags (`swoosh`, `whoosh`, `pop`, `click`, `glitch`, `horror`).

- [ ] **Step 3: Implement `CategoryChips.tsx`**

Horizontal scroll container showing all 47 category pills with item count badges (e.g. `swoosh (30)`, `whoosh (30)`).

- [ ] **Step 4: Implement `FilterBar.tsx`**

- Duration quick chips: `All`, `Short (< 3s)`, `Medium (3–10s)`, `Long (> 10s)`.
- Sort dropdown: `Relevance`, `Duration (Shortest first)`, `Duration (Longest first)`, `Name (A-Z)`.
- View mode switcher: `List View` / `Grid View`.

- [ ] **Step 5: Verify build succeeds**

Run: `cd web && npm run build`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add web/src/components/Header.tsx web/src/components/HeroSearch.tsx web/src/components/CategoryChips.tsx web/src/components/FilterBar.tsx
git commit -m "feat(ui): add search bar, category chips, duration filters, and view toggles"
```

---

### Task 8: Persistent Global Bottom Audio Player & Page Integration

**Files:**
- Create: `web/src/components/AudioPlayerBar.tsx`
- Modify: `web/src/app/page.tsx`

**Interfaces:**
- Consumes: `sounds.json`, all components
- Produces: Complete Sound Explorer application

- [ ] **Step 1: Implement `AudioPlayerBar.tsx`**

Fixed bottom floating bar:
- Track info: Title, category badge, creator.
- Scrubber: Current timestamp / total duration with range slider.
- Controls: Play/pause, replay, loop toggle, speed dropdown (`0.5x`, `1x`, `1.25x`, `1.5x`, `2x`), volume slider with mute toggle.
- Direct download button.

- [ ] **Step 2: Implement `web/src/app/page.tsx`**

Wire state together:
- Loads `sounds.json` and `categories.json`.
- Runs Fuse.js search and duration/category filtering.
- Implements incremental pagination (30 sounds per page with "Load More" button and infinite scroll trigger) for 60 FPS performance.
- Renders `HeroSearch`, `CategoryChips`, `FilterBar`, and `SoundGrid` / `SoundList`.
- Embeds `AudioPlayerBar`.

- [ ] **Step 3: Verify build succeeds**

Run: `cd web && npm run build`
Expected: PASS with static optimization.

- [ ] **Step 4: Commit**

```bash
git add web/src/components/AudioPlayerBar.tsx web/src/app/page.tsx
git commit -m "feat(page): assemble full sound library explorer with floating bottom player"
```

---

### Task 9: End-to-End Build, Verification & Documentation

**Files:**
- Create: `README.md`
- Create: `web/README.md`

**Interfaces:**
- Consumes: Full codebase
- Produces: Production build, verified test suite, and quick-start documentation

- [ ] **Step 1: Run complete Next.js production build**

Run: `cd web && npm run build`
Expected: Production build compiles successfully with zero warnings.

- [ ] **Step 2: Run catalog integrity test**

Run: `python -m pytest tests/`
Expected: All tests PASS.

- [ ] **Step 3: Create project documentation (`README.md`)**

Include setup steps, how to run locally (`npm run dev`), how to upload to Cloudflare R2 (`python upload_to_r2.py`), and 1-click Vercel/Cloudflare deployment instructions.

- [ ] **Step 4: Final commit**

```bash
git add .
git commit -m "docs: add complete documentation and verify production build"
```
