# SoundForge SFX — Cloudflare R2 Sound Effect Library, Web App & MCP Server

[![Vercel Deployment](https://img.shields.io/badge/Vercel-Live-brightgreen.svg)](https://soundforge-sfx.vercel.app)
[![MCP Ready](https://img.shields.io/badge/MCP-1.6.0-blue.svg)](https://modelcontextprotocol.io/)
[![Next.js 15](https://img.shields.io/badge/Next.js-15-black.svg)](https://nextjs.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A complete royalty-free Sound Effect Library platform and **Model Context Protocol (MCP)** server powered by **Cloudflare R2** and **Next.js 15**.

Includes **1,417 curated audio files** organized across 47 categories, an automated R2 sync pipeline, a modern Dark Studio web interface with scrubbable waveforms, and a fully featured MCP server enabling AI agents to search, audition, stream, and download sound effects directly into your projects.

---

## 🌐 Live Web App
- **Production URL:** [https://soundforge-sfx.vercel.app](https://soundforge-sfx.vercel.app)
- **GitHub Repository:** [https://github.com/sheikhshariarnehal/soundforge-sfx](https://github.com/sheikhshariarnehal/soundforge-sfx)

---

## ⚡ Highlights

- **1,417 Curated Sound Effects**: Categorized across 47 sound categories (`swoosh`, `whoosh`, `pop`, `click`, `glitch`, `horror`, `impact`, `foley`, `nature`, and more).
- **🤖 Built-in MCP Server**: Exposes standard tools to AI agents in Claude Desktop, Cursor, Antigravity, and VS Code Roo/Cline to query and download sounds autonomously.
- **Cloudflare R2 Zero-Egress Storage**: 100% of the audio files (~1.65 GB) are stored in Cloudflare R2 with optimal immutable caching (`max-age=31536000, immutable`).
- **Instant Client-Side Search**: Sub-millisecond fuzzy search powered by Fuse.js across titles, categories, and tags with **$0 database cost**.
- **Interactive Audio Waveforms**: Canvas-based waveform visualizations on every sound with click-to-scrub capabilities.
- **Persistent Floating Bottom Player**: Studio player bar with loop, speed controls (`0.5x` to `2x`), scrubber, volume slider, and global **Spacebar** play/pause hotkey.
- **Friction-Free 1-Click Downloads**: Direct `.mp3` download with clean descriptive filenames.

---

## 🤖 Model Context Protocol (MCP) Server for AI Agents

SoundForge SFX includes a standalone Model Context Protocol (MCP) server located in [`packages/mcp`](./packages/mcp). It enables AI agents to find, stream, or download audio assets on demand while building games, video editors, apps, and interactive multimedia.

### 🛠️ Available MCP Tools

| Tool | Description | Parameters |
| :--- | :--- | :--- |
| `search_sounds` | Search 1,400+ sound effects using fuzzy matching, categories, and duration limits | `query`, `category`, `minDuration`, `maxDuration`, `limit`, `offset` |
| `get_sound_details` | Retrieve full metadata and direct Cloudflare R2 streaming URL by sound ID | `soundId` |
| `list_categories` | List all 47 sound effect categories with available sound counts | *(none)* |
| `download_sound` | Download a sound effect `.mp3` directly to a local project directory | `soundId`, `targetDirectory`, `filename` (optional) |
| `get_sound_audio_base64` | Fetch base64-encoded audio for inline agent inspection or multimodal models | `soundId` |

---

### 🔌 Connecting SoundForge MCP to AI Agents

#### 1. Claude Desktop
Add the following to your `claude_desktop_config.json` (`%APPDATA%\Claude\claude_desktop_config.json` on Windows or `~/Library/Application Support/Claude/claude_desktop_config.json` on macOS):

```json
{
  "mcpServers": {
    "soundforge-sfx": {
      "command": "node",
      "args": ["<PATH_TO_REPO>/packages/mcp/dist/index.js"]
    }
  }
}
```
*(Or via npx if published: `"command": "npx", "args": ["-y", "soundforge-sfx-mcp"]`)*

#### 2. Cursor IDE
1. Go to **Settings** → **Features** → **MCP Servers**.
2. Click **+ Add New MCP Server**.
3. Set:
   - **Name:** `soundforge-sfx`
   - **Type:** `command`
   - **Command:** `node "<PATH_TO_REPO>/packages/mcp/dist/index.js"`

#### 3. Antigravity IDE
Add to your project's MCP configuration or `.gemini/settings.json`:

```json
{
  "mcpServers": {
    "soundforge-sfx": {
      "command": "node",
      "args": ["<PATH_TO_REPO>/packages/mcp/dist/index.js"]
    }
  }
}
```

#### 4. VS Code (Cline / Roo Code)
In your `cline_mcp_settings.json`:

```json
{
  "mcpServers": {
    "soundforge-sfx": {
      "command": "node",
      "args": ["<PATH_TO_REPO>/packages/mcp/dist/index.js"],
      "disabled": false,
      "autoApprove": ["search_sounds", "get_sound_details", "list_categories"]
    }
  }
}
```

---

## 📁 Repository Structure

```
soundforge-sfx/
├── categories/               # 1,417 local audio files across 47 categories
├── metadata.csv              # Master audio catalog index
├── download_registry.json     # Scraping tracking registry
├── scraper.py                # Automated Pixabay scraper & downloader
├── upload_to_r2.py           # Multi-threaded Cloudflare R2 uploader
├── generate_catalog.py       # Converts metadata.csv -> web/public/data/sounds.json
├── .env                      # Cloudflare R2 credentials (git-ignored)
├── tests/                    # Automated Python tests
│
├── packages/
│   └── mcp/                  # 🤖 SoundForge SFX MCP Server (TypeScript / Node.js)
│       ├── src/
│       │   ├── catalog.ts    # Hybrid catalog search, R2 streaming & downloader
│       │   ├── index.ts      # MCP stdio server with 5 tools & prompt handlers
│       │   └── types.ts      # TypeScript interfaces
│       ├── test/             # Unit tests for MCP server tools
│       ├── package.json
│       └── README.md
│
└── web/                      # 🌐 Next.js 15 App Router Frontend
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

### 2. Build the MCP Server

```bash
cd packages/mcp
npm install
npm run build
npm test
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

---

## 🧪 Testing

Run the full automated test suite:

```bash
# MCP Server unit tests (4/4 passing):
cd packages/mcp && npm test

# Python catalog & uploader tests:
python -m pytest tests/

# Frontend search & filtering tests:
cd web && npx tsx src/lib/search.test.mjs
```

---

## 📄 License

This project is licensed under the [MIT License](LICENSE). Sound effects are sourced and curated under royalty-free licenses suitable for commercial and non-commercial creative work.
