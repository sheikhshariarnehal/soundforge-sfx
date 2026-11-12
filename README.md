# SoundForge SFX — Cloudflare R2 Sound Effect Library & Web Application

A full-stack, royalty-free Sound Effect Library platform powered by **Cloudflare R2** and **Next.js 15**. Includes 1,417 curated audio files organized across 47 categories, an automated multi-threaded R2 sync pipeline, and a modern Dark Studio web interface with scrubbable waveforms and instant search.

---

## ⚡ Highlights

- **1,417 Curated Sound Effects**: Categorized across 47 sound categories (`swoosh`, `whoosh`, `pop`, `click`, `glitch`, `horror`, `impact`, `foley`, `nature`, and more).
- **Cloudflare R2 Zero-Egress Storage**: 100% of the audio files (~1.65 GB) are stored in Cloudflare R2 with optimal immutable caching (`max-age=31536000, immutable`).
- **Instant Client-Side Search**: Sub-millisecond fuzzy search powered by Fuse.js across titles, categories, and tags with **$0 database cost**.
- **Interactive Audio Waveforms**: Canvas-based waveform visualizations on every sound with click-to-scrub capabilities.
- **Persistent Floating Bottom Player**: Studio player bar with loop, speed controls (`0.5x` to `2x`), scrubber, volume slider, and global **Spacebar** play/pause hotkey.
- **Friction-Free 1-Click Downloads**: Direct `.mp3` download with clean descriptive filenames.

---

## 📁 Project Architecture

```
o:\Vidoe\Sound Effect\
├── categories/               # 1,417 local audio files across 47 categories
├── metadata.csv              # Master audio catalog index
├── download_registry.json     # Scraping tracking registry
├── scraper.py                # Automated Pixabay scraper & downloader
├── upload_to_r2.py           # Multi-threaded Cloudflare R2 uploader
├── generate_catalog.py       # Converts metadata.csv -> web/public/data/sounds.json
├── .env                      # Cloudflare R2 credentials (git-ignored)
├── tests/                    # Automated Python tests
│
└── web/                      # Next.js 15 App Router Frontend
    ├── public/data/
    │   ├── sounds.json       # Pre-indexed search catalog (1,417 items)
    │   └── categories.json   # 47 category badges with counts
    └── src/
        ├── app/              # Next.js pages & streaming API routes
        ├── components/       # Waveform, SoundCard, Header, HeroSearch, AudioPlayerBar
        ├── context/          # Global AudioContext with Spacebar hotkey
        └── lib/              # Fuse.js search & download helpers
```

---

## 🚀 Quick Start Guide

### 1. Run the Web Application Locally

```bash
cd web
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 2. Build for Production

```bash
cd web
npm run build
npm run start
```

### 3. Re-Sync Audio Files to Cloudflare R2

The repository includes a multi-threaded Python S3 uploader:

```bash
# Upload all 1,417 sounds to your R2 bucket with 16 workers:
python upload_to_r2.py --concurrency 16

# Dry run test (verifies local files and keys without uploading):
python upload_to_r2.py --dry-run
```

### 4. Regenerate Web Catalog

If you scrape or add new sound effects:

```bash
python generate_catalog.py
```

---

## ☁️ Cloudflare R2 Configuration

The `.env` file at the root contains your R2 configuration:

```env
R2_ACCOUNT_ID=3b094150126bc4bd2b1b284027dc018b
R2_ENDPOINT_URL=https://3b094150126bc4bd2b1b284027dc018b.r2.cloudflarestorage.com
R2_ACCESS_KEY_ID=ddfd9ecbf28b0a4edb7f4d9c243bbe49
R2_SECRET_ACCESS_KEY=e73469e05d0fd97c53af29ac60b488d8c620caed05fa056f245b954e10349f36
R2_BUCKET_NAME=sounds-storage
NEXT_PUBLIC_R2_PUBLIC_URL=https://pub-f9caeeaaad4d4b068bbfc03bc533c1f9.r2.dev
```

> **Note on Public Access**: If you want visitors to stream directly from `https://pub-f9caeeaaad4d4b068bbfc03bc533c1f9.r2.dev`, make sure **Public Access** is enabled for the `sounds-storage` bucket in your Cloudflare dashboard under *R2 > sounds-storage > Settings > Public Access > Allow Access*. The website also features an automated fallback route (`/api/audio/[category]/[filename]`) so audio plays even before public web access is enabled.

---

## 🧪 Testing

Run the full automated test suite:

```bash
# Python catalog & uploader tests:
python -m pytest tests/

# Frontend search & filtering tests:
cd web && npx tsx src/lib/search.test.mjs
```
