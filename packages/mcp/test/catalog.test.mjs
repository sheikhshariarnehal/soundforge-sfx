import assert from "node:assert/strict";
import test from "node:test";
import path from "node:path";
import fs from "node:fs/promises";
import { SoundCatalogService } from "../dist/catalog.js";

test("SoundCatalogService loads sounds and categories", async () => {
  const service = new SoundCatalogService();
  await service.ensureLoaded();

  const categories = await service.listCategories();
  assert.ok(categories.length > 0, "Categories should not be empty");
  assert.ok(categories.some((c) => c.name.toLowerCase().includes("whoosh") || c.name.toLowerCase().includes("swoosh")));
});

test("SoundCatalogService searches sounds accurately", async () => {
  const service = new SoundCatalogService();
  const res = await service.searchSounds({ query: "whoosh", limit: 5 });

  assert.ok(res.total > 0, "Should find matches for whoosh");
  assert.ok(res.sounds.length <= 5, "Should respect limit");
  assert.ok(res.sounds[0].audioUrl.startsWith("http"), "Sound should have full audioUrl");
});

test("SoundCatalogService gets sound by ID", async () => {
  const service = new SoundCatalogService();
  const res = await service.searchSounds({ limit: 1 });
  const first = res.sounds[0];

  const sound = await service.getSoundById(first.id);
  assert.ok(sound !== null, "Sound should exist");
  assert.equal(sound?.id, first.id);
});

test("SoundCatalogService downloads sound to local directory", async () => {
  const service = new SoundCatalogService();
  const res = await service.searchSounds({ limit: 1 });
  const sound = res.sounds[0];

  const tempDir = path.resolve("./test_temp_download");
  const result = await service.downloadSoundFile(sound.id, tempDir, "test_sfx.mp3");

  assert.equal(result.sound.id, sound.id);
  assert.ok(result.bytesWritten > 0);

  const fileExists = await fs.stat(result.filePath).then(() => true).catch(() => false);
  assert.ok(fileExists, "Downloaded file should exist on disk");

  // Clean up
  await fs.rm(tempDir, { recursive: true, force: true });
});
