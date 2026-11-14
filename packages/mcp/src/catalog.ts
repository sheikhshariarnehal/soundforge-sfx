import fs from "node:fs/promises";
import path from "node:path";
import Fuse from "fuse.js";
import { SoundItem, CategorySummary, SearchSoundsParams, SearchResult } from "./types.js";

// Official hosted sound catalog endpoint (R2-backed, deployed via soundforge-sfx.vercel.app)
const DEFAULT_REMOTE_CATALOG_URL =
  process.env.SOUNDFORGE_CATALOG_URL ||
  "https://soundforge-sfx.vercel.app/data/sounds.json";

const DEFAULT_R2_PUBLIC_URL =
  process.env.NEXT_PUBLIC_R2_PUBLIC_URL ||
  "https://pub-f9caeeaaad4d4b068bbfc03bc533c1f9.r2.dev";

export class SoundCatalogService {
  private sounds: SoundItem[] = [];
  private categories: CategorySummary[] = [];
  private fuse: Fuse<SoundItem> | null = null;
  private isLoaded = false;
  private loadingPromise: Promise<void> | null = null;

  async ensureLoaded(): Promise<void> {
    if (this.isLoaded) return;
    if (this.loadingPromise) return this.loadingPromise;

    this.loadingPromise = this.loadCatalog();
    return this.loadingPromise;
  }

  private async loadCatalog(): Promise<void> {
    // 1. Try local disk fallback first (if running inside repository workspace)
    const possibleLocalPaths = [
      path.resolve(process.cwd(), "web/public/data/sounds.json"),
      path.resolve(process.cwd(), "../../web/public/data/sounds.json"),
      path.resolve(process.cwd(), "../web/public/data/sounds.json"),
      path.resolve(process.cwd(), "public/data/sounds.json"),
    ];

    let loadedSounds: SoundItem[] | null = null;

    for (const localPath of possibleLocalPaths) {
      try {
        const data = await fs.readFile(localPath, "utf-8");
        loadedSounds = JSON.parse(data) as SoundItem[];
        break;
      } catch {
        // Continue checking other locations
      }
    }

    // 2. If not found locally, fetch from hosted CDN / Vercel endpoint
    if (!loadedSounds || loadedSounds.length === 0) {
      try {
        const response = await fetch(DEFAULT_REMOTE_CATALOG_URL, {
          headers: { "User-Agent": "SoundForge-MCP/1.0" },
        });
        if (response.ok) {
          loadedSounds = (await response.json()) as SoundItem[];
        }
      } catch (err) {
        // Failed remote fetch
      }
    }

    if (!loadedSounds || loadedSounds.length === 0) {
      throw new Error(
        "Could not load SoundForge sound catalog from local disk or remote URL: " +
          DEFAULT_REMOTE_CATALOG_URL
      );
    }

    // Ensure audioUrl is fully resolved
    this.sounds = loadedSounds.map((item) => {
      let audioUrl = item.audioUrl;
      if (!audioUrl && item.r2Key) {
        audioUrl = `${DEFAULT_R2_PUBLIC_URL.replace(/\/$/, "")}/${item.r2Key.replace(/^\//, "")}`;
      }
      return {
        ...item,
        audioUrl,
      };
    });

    // Compute categories and counts
    const catMap = new Map<string, number>();
    for (const sound of this.sounds) {
      const cat = sound.category.toLowerCase().trim();
      catMap.set(cat, (catMap.get(cat) || 0) + 1);
    }
    this.categories = Array.from(catMap.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

    // Initialize Fuse.js for high-speed fuzzy search
    this.fuse = new Fuse(this.sounds, {
      keys: [
        { name: "title", weight: 2.0 },
        { name: "tags", weight: 1.6 },
        { name: "category", weight: 1.3 },
        { name: "creator", weight: 0.8 },
      ],
      threshold: 0.38,
      ignoreLocation: true,
      minMatchCharLength: 2,
    });

    this.isLoaded = true;
  }

  async searchSounds(params: SearchSoundsParams): Promise<SearchResult> {
    await this.ensureLoaded();

    let items = this.sounds;

    // Fuzzy text search
    const query = params.query?.trim();
    if (query && this.fuse) {
      const results = this.fuse.search(query);
      items = results.map((r) => r.item);
    }

    // Category filter
    if (params.category && params.category.toLowerCase() !== "all") {
      const targetCat = params.category.toLowerCase().trim();
      items = items.filter(
        (s) => s.category.toLowerCase().trim() === targetCat
      );
    }

    // Duration filters
    if (params.minDuration !== undefined) {
      items = items.filter((s) => s.duration >= params.minDuration!);
    }
    if (params.maxDuration !== undefined) {
      items = items.filter((s) => s.duration <= params.maxDuration!);
    }

    const total = items.length;
    const offset = Math.max(0, params.offset || 0);
    const limit = Math.min(100, Math.max(1, params.limit || 10));
    const paginated = items.slice(offset, offset + limit);

    return {
      total,
      offset,
      limit,
      sounds: paginated,
    };
  }

  async getSoundById(id: string): Promise<SoundItem | null> {
    await this.ensureLoaded();
    const item = this.sounds.find((s) => s.id === id);
    return item || null;
  }

  async listCategories(): Promise<CategorySummary[]> {
    await this.ensureLoaded();
    return this.categories;
  }

  async downloadSoundFile(
    soundIdOrItem: string | SoundItem,
    targetDirectory: string,
    customFilename?: string
  ): Promise<{ filePath: string; bytesWritten: number; sound: SoundItem }> {
    await this.ensureLoaded();

    const sound =
      typeof soundIdOrItem === "string"
        ? await this.getSoundById(soundIdOrItem)
        : soundIdOrItem;

    if (!sound) {
      throw new Error(`Sound effect not found with ID: ${soundIdOrItem}`);
    }

    if (!sound.audioUrl) {
      throw new Error(`Sound effect has no audio URL: ${sound.title}`);
    }

    const resolvedDir = path.resolve(targetDirectory);
    await fs.mkdir(resolvedDir, { recursive: true });

    const filename = customFilename || sound.filename || `${sound.id}.mp3`;
    const targetPath = path.join(resolvedDir, filename);

    // Fetch binary audio from audioUrl
    const res = await fetch(sound.audioUrl);
    if (!res.ok) {
      throw new Error(
        `Failed to download sound from ${sound.audioUrl}: ${res.status} ${res.statusText}`
      );
    }

    const buffer = Buffer.from(await res.arrayBuffer());
    await fs.writeFile(targetPath, buffer);

    return {
      filePath: targetPath,
      bytesWritten: buffer.byteLength,
      sound,
    };
  }

  async getSoundAudioBase64(
    soundId: string
  ): Promise<{ sound: SoundItem; mimeType: string; base64: string; sizeBytes: number }> {
    await this.ensureLoaded();

    const sound = await this.getSoundById(soundId);
    if (!sound) {
      throw new Error(`Sound effect not found with ID: ${soundId}`);
    }

    if (!sound.audioUrl) {
      throw new Error(`Sound effect has no audio URL: ${sound.title}`);
    }

    const res = await fetch(sound.audioUrl);
    if (!res.ok) {
      throw new Error(
        `Failed to fetch audio from ${sound.audioUrl}: ${res.status} ${res.statusText}`
      );
    }

    const buffer = Buffer.from(await res.arrayBuffer());
    return {
      sound,
      mimeType: "audio/mpeg",
      base64: buffer.toString("base64"),
      sizeBytes: buffer.byteLength,
    };
  }
}
