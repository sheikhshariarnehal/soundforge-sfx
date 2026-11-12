# Design Document: Sound Effect Library Website & Cloudflare R2 Pipeline

**Date:** 2026-11-13  
**Status:** Under Review  
**Project Location:** `o:\Vidoe\Sound Effect\web\`  

---

## 1. Intent & Purpose

The goal of this project is to build a modern, high-performance, and visually captivating Sound Effect Library website. Creators, video editors, and game developers can instantly discover, audition, scrub through interactive waveforms, and download high-quality sound effects across 47 curated categories (1,417 sounds currently indexed).

Audio assets will be hosted on **Cloudflare R2**, utilizing R2's zero-egress fee architecture for high-speed, cost-free audio streaming and direct downloads, accompanied by an automated Python synchronization tool.

---

## 2. Goals, Non-Goals & Anti-Goals

### 2.1 Goals
- **Instant Search & Discovery**: Sub-millisecond client-side fuzzy search across all 1,417 tracks by title, category, and tags using a pre-indexed static catalog.
- **Rich Audio Playback**:
  - Persistent floating bottom audio player bar with play/pause, scrub slider, loop toggle, playback speed selector (0.5x, 1x, 1.25x, 1.5x, 2x), and volume control.
  - Interactive mini waveform visualization on every sound item with click-to-scrub capabilities.
  - Global spacebar hotkey to play/pause the active track.
- **Flexible Navigation & Filtering**:
  - Horizontal scrolling category filter chips across all 47 categories (`swoosh`, `whoosh`, `pop`, `click`, `glitch`, `transition`, `nature`, `horror`, etc.).
  - Duration facet filters: Short (<3s), Medium (3–10s), Long (>10s).
  - View switcher: Dense List View vs. Modern Visual Grid Cards.
  - Sorting: Relevance, Duration (shortest/longest), Alphabetical.
- **Friction-Free Downloading**: Single-click direct `.mp3` download for each track without redirects, ads, or login walls.
- **Automated Cloudflare R2 Sync**: Standalone CLI script (`upload_to_r2.py`) using `boto3` to upload all 1,417 sounds to Cloudflare R2 with optimal caching headers (`max-age=31536000, immutable`).
- **Zero-Cost Hosting & Offline Fallback**: Static index eliminates all database costs. Site seamlessly supports local audio serving for offline development and testing prior to R2 credentials configuration.

### 2.2 Non-Goals
- User registration, authentication, or password-protected user accounts.
- E-commerce cart, subscriptions, or payment gateways.
- Public community upload portal (catalog remains curated and managed).

### 2.3 Anti-Goals
- **No Heavy External Database**: No Postgres, Supabase, or external server dependencies that add latency, maintenance, or monthly fees for reading static sound metadata.
- **No Download Friction**: No CAPTCHAs, email gates, timer countdowns, or ad redirect popups before downloading.

---

## 3. Approaches Considered

### Approach 1: Next.js Studio App + Bundled Static Index + Cloudflare R2 (Selected)
- **Architecture**: Next.js 15 (App Router, TypeScript, Tailwind CSS), Fuse.js search index generated from `metadata.csv`, direct streaming from public R2 CDN URL.
- **Trade-offs**: Extremely fast, $0 database costs, can be deployed in 1 click to Vercel or Cloudflare Pages. Catalog updates happen via a simple JSON build step.

### Approach 2: Serverless Next.js + Cloudflare D1 Database & Workers Proxy (Rejected)
- **Architecture**: Next.js app calling Cloudflare D1 SQL via API routes.
- **Trade-offs**: Introduces multi-service architectural complexity, latency for simple read queries, and ongoing schema migration management with no added benefit for a static catalog.

---

## 4. System Architecture & Component Design

```
o:\Vidoe\Sound Effect\
├── categories\               # 1,417 local MP3 files across 47 categories
├── metadata.csv              # Master catalog metadata
├── download_registry.json     # Scraping registry
├── scraper.py                # Pixabay scraper
├── upload_to_r2.py           # Automated Cloudflare R2 sync tool
├── generate_catalog.py       # Converts metadata.csv -> web/public/data/sounds.json
│
└── web\                      # Next.js 15 Application
    ├── public\
    │   ├── data\sounds.json  # Pre-indexed search catalog
    │   └── audio\            # Optional local audio symlink/copy for dev
    ├── src\
    │   ├── app\
    │   │   ├── layout.tsx    # Root layout with Dark Studio theme
    │   │   ├── page.tsx      # Main Sound Library Explorer
    │   │   └── globals.css   # Studio dark theme & waveform styling
    │   ├── components\
    │   │   ├── Header.tsx    # Logo, stats, theme toggle, GitHub/R2 status
    │   │   ├── HeroSearch.tsx# Prominent instant search bar with clear button
    │   │   ├── CategoryChips.tsx # 47 horizontal scrolling category pills
    │   │   ├── FilterBar.tsx # Duration chips, sort dropdown, list/grid toggle
    │   │   ├── SoundList.tsx # Render list view items
    │   │   ├── SoundGrid.tsx # Render card grid items
    │   │   ├── SoundCard.tsx # Individual sound card with mini waveform & download
    │   │   ├── Waveform.tsx  # Canvas-based scrubbable audio waveform
    │   │   └── AudioPlayerBar.tsx # Global floating bottom player
    │   ├── context\
    │   │   └── AudioContext.tsx # Central audio state, active track, playback controls
    │   ├── lib\
    │   │   ├── search.ts     # Fuse.js instant search & filtering logic
    │   │   └── types.ts      # SoundItem, Category, FilterState TypeScript definitions
    └── package.json
```

---

## 5. Data Specifications

### 5.1 Sound Item Schema (`sounds.json`)
```typescript
export interface SoundItem {
  id: string;               // e.g. "487669"
  title: string;            // e.g. "Copyright Free Swoosh"
  category: string;         // e.g. "swoosh"
  duration: number;         // e.g. 2 (seconds)
  creator: string;          // e.g. "DRAGON-STUDIO"
  filename: string;         // e.g. "Copyright_Free_Swoosh_487669.mp3"
  tags: string[];           // e.g. ["swoosh", "whoosh", "swish", "fast swoosh"]
  audioUrl: string;         // Cloudflare R2 CDN URL or local /audio/ path
  pixabayUrl: string;       // Original source for attribution/licensing
}
```

### 5.2 R2 Key Convention
- Bucket layout: `sounds/{category}/{filename}`
- Example: `sounds/swoosh/Copyright_Free_Swoosh_487669.mp3`
- Public CDN URL structure: `${NEXT_PUBLIC_R2_URL}/sounds/{category}/{filename}`

---

## 6. User Interface & Experience Specifications

- **Theme Palette (Modern Dark Studio)**:
  - Background: Deep slate / charcoal (`#090d16`, `#0f172a`)
  - Surface Cards: Translucent zinc (`#1e293b` with subtle 1px border `#334155`)
  - Accent Colors: Neon Cyan (`#06b6d4` / `#22d3ee`) for waveforms & playback progress, Amber (`#f59e0b`) for highlights/tags
  - Text: High-contrast white (`#f8fafc`) and muted slate (`#94a3b8`)
- **Key Interactions**:
  - Pressing **Spacebar** plays or pauses the current track.
  - Clicking on a waveform scrubs playback to that exact timestamp.
  - Clicking a category pill filters the library instantaneously without page reload.
  - Clicking "Download" triggers immediate native browser file download with the clean descriptive filename.

---

## 7. Cloudflare R2 Synchronization Pipeline (`upload_to_r2.py`)

A robust Python script utilizing `boto3` (compatible with Cloudflare R2's S3 API):
- Reads configuration from `.env` or CLI flags:
  - `R2_ACCOUNT_ID`
  - `R2_ACCESS_KEY_ID`
  - `R2_SECRET_ACCESS_KEY`
  - `R2_BUCKET_NAME`
  - `R2_PUBLIC_DOMAIN` (e.g., `https://pub-xxx.r2.dev` or custom domain `https://cdn.mysite.com`)
- Scans `categories/` directory for all 1,417 `.mp3` files.
- Checks if file already exists in R2 with same size to avoid redundant uploads (resumable).
- Sets `ContentType="audio/mpeg"` and `CacheControl="public, max-age=31536000, immutable"`.
- Features a concurrent worker pool (8 threads) for rapid bulk upload of 1.65 GB in under 5 minutes.
- Updates `sounds.json` with the public R2 URLs upon completion.

---

## 8. What is Left to the Builder

- Implementing canvas waveform visualizer with simulated frequency peaks for rapid loading (avoiding full-audio decoding delays on mobile).
- Configuring Next.js 15 configuration, Tailwind CSS theme tokens, and Lucide icons.
- Generating the initial `sounds.json` catalog with fallback audio mapping.
