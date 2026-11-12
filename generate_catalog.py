#!/usr/bin/env python3
"""
Generate Static Catalog JSON from metadata.csv
Produces web/public/data/sounds.json and web/public/data/categories.json
"""

import os
import csv
import json
from pathlib import Path
from collections import Counter

BASE_DIR = Path(__file__).resolve().parent
METADATA_FILE = BASE_DIR / "metadata.csv"
OUTPUT_DIR = BASE_DIR / "web" / "public" / "data"
SOUNDS_JSON = OUTPUT_DIR / "sounds.json"
CATEGORIES_JSON = OUTPUT_DIR / "categories.json"

# Load R2 public domain from env or default
R2_DOMAIN = os.environ.get("NEXT_PUBLIC_R2_PUBLIC_URL", "https://pub-f9caeeaaad4d4b068bbfc03bc533c1f9.r2.dev").rstrip("/")

def parse_tags(tags_raw: str) -> list[str]:
    """Parse comma-separated or HTML-encoded tags into a clean list."""
    if not tags_raw:
        return []
    # Split by comma
    raw_list = [t.strip().strip('"').strip("'") for t in tags_raw.split(",")]
    clean_tags = []
    seen = set()
    for t in raw_list:
        clean = t.strip()
        if clean and clean.lower() not in seen:
            seen.add(clean.lower())
            clean_tags.append(clean)
    return clean_tags

def generate_catalog():
    print(f"[*] Reading metadata from: {METADATA_FILE}")
    if not METADATA_FILE.exists():
        raise FileNotFoundError(f"Metadata file not found at {METADATA_FILE}")

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    
    sounds = []
    category_counter = Counter()

    with open(METADATA_FILE, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            track_id = str(row.get("ID", "")).strip()
            category = str(row.get("Category", "")).strip().lower()
            title = str(row.get("Title", "")).strip()
            
            # Format duration safely
            try:
                duration_val = float(row.get("Duration_sec", 0))
                # If it's a whole number, store as int
                duration = int(duration_val) if duration_val.is_integer() else round(duration_val, 1)
            except ValueError:
                duration = 0
                
            creator = str(row.get("Creator", "")).strip()
            filename = str(row.get("Filename", "")).strip()
            tags = parse_tags(row.get("Tags", ""))
            pixabay_url = str(row.get("Pixabay_URL", "")).strip()
            
            # Key convention in R2: sounds/{category}/{filename}
            r2_key = f"sounds/{category}/{filename}"
            audio_url = f"{R2_DOMAIN}/{r2_key}"
            
            sound_item = {
                "id": track_id,
                "title": title,
                "category": category,
                "duration": duration,
                "creator": creator,
                "filename": filename,
                "tags": tags,
                "audioUrl": audio_url,
                "r2Key": r2_key,
                "pixabayUrl": pixabay_url
            }
            
            sounds.append(sound_item)
            category_counter[category] += 1

    print(f"[+] Total sounds processed: {len(sounds)}")
    print(f"[+] Total categories processed: {len(category_counter)}")

    # Sort categories alphabetically
    categories_list = [
        {"name": cat, "count": count}
        for cat, count in sorted(category_counter.items())
    ]

    # Write sounds.json
    with open(SOUNDS_JSON, "w", encoding="utf-8") as f:
        json.dump(sounds, f, indent=2, ensure_ascii=False)
    print(f"[✓] Saved {SOUNDS_JSON} ({SOUNDS_JSON.stat().st_size / 1024:.1f} KB)")

    # Write categories.json
    with open(CATEGORIES_JSON, "w", encoding="utf-8") as f:
        json.dump(categories_list, f, indent=2, ensure_ascii=False)
    print(f"[✓] Saved {CATEGORIES_JSON}")

if __name__ == "__main__":
    generate_catalog()
