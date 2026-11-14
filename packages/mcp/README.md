# SoundForge SFX — Model Context Protocol (MCP) Server

[![MCP Ready](https://img.shields.io/badge/MCP-1.6.0-blue.svg)](https://modelcontextprotocol.io/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A standard [Model Context Protocol (MCP)](https://modelcontextprotocol.io/) server for **SoundForge SFX**.

It allows AI agents (in Claude Desktop, Cursor, Antigravity, VS Code Roo/Cline, etc.) to search, audition, stream, and download from a curated library of **1,400+ royalty-free sound effects** with zero friction.

---

## ✨ Features

- 🔎 **Fuzzy Text Search:** Fast search powered by Fuse.js matching titles, tags, categories, and creators.
- ⚡ **Zero Setup & Universal:** Works anywhere out of the box — streams catalog metadata & audio directly via Cloudflare R2 CDN, with local offline fallback if run inside the repository.
- 📂 **Direct Audio Downloader:** AI agents can pull sounds directly into `./assets/audio/`, game folders, video editing timelines, or web public directories.
- 🎧 **Base64 Inline Preview:** Audio bytes can be inspected or embedded inline by multimodal AI models.
- 🏷️ **Category Browsing:** Introspect counts across 40+ sound effect categories (whooshes, risers, glitches, pops, cinematic braams, etc.).

---

## 🛠️ Available MCP Tools

| Tool | Description | Parameters |
| :--- | :--- | :--- |
| `search_sounds` | Search sound effects by query, category, and duration limits | `query`, `category`, `minDuration`, `maxDuration`, `limit`, `offset` |
| `get_sound_details` | Retrieve full metadata and streaming URL for a sound ID | `soundId` |
| `list_categories` | List all 40+ categories with available sound counts | *(none)* |
| `download_sound` | Download a sound effect MP3 directly to a local target folder | `soundId`, `targetDirectory`, `filename` (optional) |
| `get_sound_audio_base64` | Fetch base64-encoded audio for inline agent inspection | `soundId` |

---

## 🚀 Setup & Usage

### 1. Claude Desktop

Add this to your Claude Desktop configuration (`claude_desktop_config.json`):

#### On Windows:
`%APPDATA%\Claude\claude_desktop_config.json`

#### On macOS:
`~/Library/Application Support/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "soundforge-sfx": {
      "command": "node",
      "args": ["O:/Vidoe/Sound Effect/packages/mcp/dist/index.js"]
    }
  }
}
```
*(Or if using npx after npm publish: `"command": "npx", "args": ["-y", "soundforge-sfx-mcp"]`)*

---

### 2. Cursor IDE

In Cursor:
1. Open **Settings** → **Features** → **MCP Servers**.
2. Click **+ Add New MCP Server**.
3. Fill in:
   - **Name:** `soundforge-sfx`
   - **Type:** `command`
   - **Command:** `node "O:/Vidoe/Sound Effect/packages/mcp/dist/index.js"`

---

### 3. Antigravity IDE

Add to your `.gemini/settings.json` or project MCP config:

```json
{
  "mcpServers": {
    "soundforge-sfx": {
      "command": "node",
      "args": ["O:/Vidoe/Sound Effect/packages/mcp/dist/index.js"]
    }
  }
}
```

---

### 4. VS Code (Cline / Roo Code)

In `cline_mcp_settings.json`:

```json
{
  "mcpServers": {
    "soundforge-sfx": {
      "command": "node",
      "args": ["O:/Vidoe/Sound Effect/packages/mcp/dist/index.js"],
      "disabled": false,
      "autoApprove": ["search_sounds", "get_sound_details", "list_categories"]
    }
  }
}
```

---

## 🤖 Example Prompts for Agents

Once connected, your AI agent can effortlessly understand queries like:

- *"Find 3 high-impact whoosh sounds under 2 seconds for a transition in my video."*
- *"Download a retro glitch sound and a pop sound into my project's `./assets/audio/` folder."*
- *"What categories of sound effects are available in SoundForge?"*
- *"Find a cinematic braam sound effect and give me its direct streaming URL."*

---

## 📦 Building from Source

```bash
git clone https://github.com/sheikhshariarnehal/soundforge-sfx.git
cd soundforge-sfx/packages/mcp
npm install
npm run build
npm test
```
