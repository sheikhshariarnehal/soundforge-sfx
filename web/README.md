# SoundForge SFX Web Application

Next.js 15 App Router web application for exploring, auditioning, and downloading 1,417 sound effects across 47 categories.

## Features
- **Instant Search**: Fuse.js client-side fuzzy search across titles, categories, and tags.
- **Waveform Visualization**: HTML5 Canvas scrubbable waveform on every track.
- **Persistent Player**: Floating bottom player with loop, playback speed (`0.5x`–`2x`), and volume controls.
- **Keyboard Shortcuts**: Press `/` to focus search bar, press `Space` to play/pause.
- **Cloudflare R2**: Seamless streaming with zero egress costs and built-in fallback streaming route.

## Development
```bash
npm install
npm run dev
```

## Production Build
```bash
npm run build
npm run start
```
