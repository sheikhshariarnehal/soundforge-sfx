#!/usr/bin/env python3
"""
Pixabay Sound Effects Scraper & Downloader
Automates category discovery, search querying, metadata indexing, and organized downloading
from Pixabay's Royalty-Free Sound Effects library using Playwright and Python.
"""

import os
import sys
import re
import csv
import json
import time
import argparse
import urllib.request
import urllib.parse
from datetime import datetime
from pathlib import Path
from playwright.sync_api import sync_playwright

# Default essential sound effect categories & user requested queries
DEFAULT_CATEGORIES = [
    "swoosh",
    "whoosh",
    "pop",
    "click",
    "glitch",
    "riser",
    "notification",
    "typing",
    "transition",
    "impact",
    "nature",
    "horror",
    "comedy",
    "foley",
    "rain",
    "wind"
]

BASE_DIR = Path(__file__).resolve().parent
CATEGORIES_DIR = BASE_DIR / "categories"
REGISTRY_FILE = BASE_DIR / "download_registry.json"
METADATA_FILE = BASE_DIR / "metadata.csv"

def sanitize_filename(name: str) -> str:
    """Sanitize string for Windows filesystem safety."""
    if not name:
        return "sound"
    # Replace invalid Windows filename characters: < > : " / \ | ? *
    clean = re.sub(r'[<>:"/\\|?*\x00-\x1f]', '', name)
    # Replace whitespace and repeated punctuation with single underscore
    clean = re.sub(r'[\s\-_]+', '_', clean).strip('_')
    return clean[:60] if clean else "sound"

def load_registry() -> dict:
    """Load registry of already downloaded sound IDs."""
    if REGISTRY_FILE.exists():
        try:
            with open(REGISTRY_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception as e:
            print(f"[!] Warning: Could not read registry file ({e}). Starting fresh.")
    return {}

def save_registry(registry: dict):
    """Save registry to prevent duplicate downloads."""
    try:
        with open(REGISTRY_FILE, "w", encoding="utf-8") as f:
            json.dump(registry, f, indent=2, ensure_ascii=False)
    except Exception as e:
        print(f"[!] Warning: Could not save registry: {e}")

def init_metadata_csv():
    """Ensure metadata.csv exists with correct header."""
    if not METADATA_FILE.exists():
        with open(METADATA_FILE, "w", newline="", encoding="utf-8") as f:
            writer = csv.writer(f)
            writer.writerow([
                "ID",
                "Category",
                "Title",
                "Duration_sec",
                "Creator",
                "Filename",
                "Local_Path",
                "Download_URL",
                "Pixabay_URL",
                "Tags",
                "Downloaded_At"
            ])

def append_metadata_row(row_data: list):
    """Append a single track metadata record to metadata.csv."""
    with open(METADATA_FILE, "a", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(row_data)

def discover_homepage_categories(page) -> list:
    """Auto-discover sound effect categories/chips from Pixabay's sound effects homepage."""
    print("[*] Checking Pixabay homepage for featured category chips...")
    try:
        page.goto("https://pixabay.com/sound-effects/", wait_until="networkidle", timeout=30000)
        page.wait_for_timeout(2000)
        
        chips = page.evaluate("""
            () => {
                const results = [];
                const seen = new Set();
                document.querySelectorAll('a').forEach(el => {
                    const href = el.getAttribute('href') || '';
                    let text = el.innerText.trim();
                    if (/\\/(cs|da|de|es|fr|id|it|hu|nl|no|pl|pt|ro|sk|fi|sv|tr|vi|th|bg|el|ja|ko|ru|zh)\\/sound-effects/.test(href)) return;
                    if (href.startsWith('https://pixabay.com/') && !href.startsWith('https://pixabay.com/sound-effects/')) return;
                    
                    if (href.includes('/sound-effects/search/')) {
                        const match = href.match(/\\/sound-effects\\/search\\/([^\\/]+)\\/?/);
                        if (match) {
                            const query = decodeURIComponent(match[1]).toLowerCase().replace(/\\+/g, ' ');
                            if (!seen.has(query) && query.length > 1 && !query.includes('order=')) {
                                seen.add(query);
                                results.push(query);
                            }
                        }
                    }
                });
                return results;
            }
        """)
        print(f"[+] Discovered {len(chips)} featured categories/chips from homepage.")
        return chips
    except Exception as e:
        print(f"[!] Warning discovering homepage categories: {e}")
        return []

def extract_tracks_from_page(page) -> list:
    """Extract sound tracks from React state on current page."""
    return page.evaluate("""
        () => {
            const results = [];
            const seenIds = new Set();
            const allElements = document.querySelectorAll('*');
            for (const el of allElements) {
                const keys = Object.keys(el);
                const fiberKey = keys.find(k => k.startsWith('__reactFiber') || k.startsWith('__reactProps'));
                if (!fiberKey) continue;
                
                function searchForTracks(obj, depth = 0) {
                    if (!obj || depth > 6) return;
                    if (obj.track && obj.track.id && obj.track.sources && obj.track.sources.src) {
                        const t = obj.track;
                        if (!seenIds.has(t.id)) {
                            seenIds.add(t.id);
                            results.push({
                                id: String(t.id),
                                name: t.name || t.title || 'Sound Effect',
                                duration: t.duration || 0,
                                url: t.sources.src,
                                filename: t.sources.filename || `${t.id}.mp3`,
                                href: t.href ? 'https://pixabay.com' + t.href : '',
                                description: t.description || t.alt || '',
                                user: t.user ? (t.user.username || t.user.name || '') : ''
                            });
                        }
                    }
                    if (Array.isArray(obj)) {
                        for (const item of obj) searchForTracks(item, depth + 1);
                    } else if (typeof obj === 'object') {
                        for (const k of ['children', 'props', 'memoizedProps', 'child', 'sibling']) {
                            if (obj[k]) searchForTracks(obj[k], depth + 1);
                        }
                    }
                }
                searchForTracks(el[fiberKey]);
            }
            return results;
        }
    """)

def download_audio_file(url: str, dest_path: Path, max_retries: int = 3) -> bool:
    """Stream download audio file from CDN with retries."""
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36",
        "Referer": "https://pixabay.com/",
        "Accept": "*/*"
    }
    
    for attempt in range(1, max_retries + 1):
        try:
            req = urllib.request.Request(url, headers=headers)
            with urllib.request.urlopen(req, timeout=20) as resp:
                if resp.status == 200:
                    with open(dest_path, "wb") as f:
                        while chunk := resp.read(16384):
                            f.write(chunk)
                    # Verify file size > 500 bytes (valid audio)
                    if dest_path.stat().st_size > 500:
                        return True
                    else:
                        dest_path.unlink(missing_ok=True)
                        print(f"      [!] File size too small, retrying ({attempt}/{max_retries})...")
        except Exception as e:
            if attempt == max_retries:
                print(f"      [!] Failed to download ({e})")
            time.sleep(1)
            
    return False

def scrape_category(page, category: str, limit: int, registry: dict, dry_run: bool = False):
    """Scrape and download sounds for a given category/search keyword."""
    cat_folder_name = sanitize_filename(category).lower()
    cat_dir = CATEGORIES_DIR / cat_folder_name
    cat_dir.mkdir(parents=True, exist_ok=True)
    
    encoded_cat = urllib.parse.quote(category)
    base_url = f"https://pixabay.com/sound-effects/search/{encoded_cat}/"
    
    print(f"\n{'='*70}")
    print(f"[*] CATEGORY: [{category.upper()}] (Target: {limit} sounds)")
    print(f"[*] Destination: {cat_dir}")
    print(f"{'='*70}")
    
    downloaded_in_cat = 0
    page_num = 1
    max_pages = max(1, (limit // 20) + 3)
    
    while downloaded_in_cat < limit and page_num <= max_pages:
        page_url = base_url if page_num == 1 else f"{base_url}?pagi={page_num}"
        print(f"\n  [Page {page_num}] Navigating to: {page_url}")
        
        try:
            page.goto(page_url, wait_until="domcontentloaded", timeout=30000)
            page.wait_for_timeout(2000)
        except Exception as e:
            print(f"  [!] Navigation error on page {page_num}: {e}")
            break
            
        tracks = extract_tracks_from_page(page)
        if not tracks:
            print("  [!] No sound tracks found on this page. Reached the end of category.")
            break
            
        print(f"  [+] Found {len(tracks)} tracks on page {page_num}.")
        
        for track in tracks:
            if downloaded_in_cat >= limit:
                break
                
            track_id = track["id"]
            title = track["name"]
            cdn_url = track["url"]
            duration = track["duration"]
            creator = track["user"]
            tags = track["description"]
            pixabay_href = track["href"]
            
            clean_title = sanitize_filename(title)
            filename = f"{clean_title}_{track_id}.mp3"
            dest_file = cat_dir / filename
            
            # Check global deduplication registry
            if track_id in registry:
                prev_record = registry[track_id]
                print(f"    [-] [DEDUP SKIP] ID {track_id} '{title}' already in category '{prev_record.get('category')}'")
                continue
                
            # Check if file exists locally
            if dest_file.exists() and dest_file.stat().st_size > 1000:
                print(f"    [-] [EXIST SKIP] ID {track_id} '{filename}' already exists on disk.")
                registry[track_id] = {
                    "category": category,
                    "filename": filename,
                    "title": title,
                    "date": datetime.now().isoformat()
                }
                downloaded_in_cat += 1
                continue
                
            if dry_run:
                print(f"    [DRY RUN] Would download: {filename} ({duration}s, by {creator})")
                downloaded_in_cat += 1
                continue
                
            print(f"    [↓] Downloading: {filename} ({duration}s by {creator})...", end="", flush=True)
            success = download_audio_file(cdn_url, dest_file)
            
            if success:
                size_kb = dest_file.stat().st_size / 1024
                print(f" [OK: {size_kb:.1f} KB]")
                downloaded_in_cat += 1
                
                # Update registry
                registry[track_id] = {
                    "category": category,
                    "filename": filename,
                    "title": title,
                    "url": cdn_url,
                    "date": datetime.now().isoformat()
                }
                save_registry(registry)
                
                # Append to metadata.csv
                append_metadata_row([
                    track_id,
                    category,
                    title,
                    duration,
                    creator,
                    filename,
                    str(dest_file.relative_to(BASE_DIR)),
                    cdn_url,
                    pixabay_href,
                    tags,
                    datetime.now().strftime("%Y-%m-%d %H:%M:%S")
                ])
                
                # Polite delay between downloads
                time.sleep(0.5)
            else:
                print(" [FAILED]")
                
        page_num += 1
        
    print(f"\n[✓] Finished category '{category}': {downloaded_in_cat}/{limit} sounds saved.")

def main():
    parser = argparse.ArgumentParser(description="Pixabay Sound Effects Scraper & Downloader")
    parser.add_argument("--limit", type=int, default=30, help="Number of sounds to download per category (default: 30)")
    parser.add_argument("--categories", type=str, default="", help="Comma-separated custom category/search keywords")
    parser.add_argument("--discover", action="store_true", help="Auto-discover all category chips from homepage")
    parser.add_argument("--dry-run", action="store_true", help="Simulate scraping without downloading audio files")
    parser.add_argument("--headless", action="store_true", help="Run browser in headless mode (default: false / headful)")
    args = parser.parse_args()

    print("=" * 70)
    print(" PIXABAY SOUND EFFECTS SCRAPER & LIBRARY ORGANIZER")
    print("=" * 70)
    print(f"Base Directory: {BASE_DIR}")
    print(f"Sound Limit Per Category: {args.limit}")
    print(f"Dry Run: {args.dry_run}")
    
    # Initialize files
    CATEGORIES_DIR.mkdir(parents=True, exist_ok=True)
    init_metadata_csv()
    registry = load_registry()
    print(f"Loaded existing download registry: {len(registry)} sounds previously recorded.")
    
    # Prepare categories list
    if args.categories:
        categories = [c.strip() for c in args.categories.split(",") if c.strip()]
    else:
        categories = list(DEFAULT_CATEGORIES)
        
    with sync_playwright() as p:
        print("[*] Launching browser (Chrome)...")
        browser = p.chromium.launch(channel="chrome", headless=args.headless)
        context = browser.new_context(
            viewport={"width": 1280, "height": 900},
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36"
        )
        page = context.new_page()
        
        # Optional discovery from homepage
        if args.discover:
            discovered = discover_homepage_categories(page)
            for d in discovered:
                if d not in categories:
                    categories.append(d)
                    
        print(f"[*] Scraping {len(categories)} categories: {', '.join(categories[:10])}...")
        
        start_time = time.time()
        for idx, cat in enumerate(categories, 1):
            print(f"\n>>> Progress: [{idx}/{len(categories)} categories]")
            scrape_category(page, cat, limit=args.limit, registry=registry, dry_run=args.dry_run)
            
        browser.close()
        
    elapsed = time.time() - start_time
    print("\n" + "=" * 70)
    print(f"[✓] ALL DOWNLOADS COMPLETED in {elapsed/60:.1f} minutes!")
    print(f"[✓] Files organized in: {CATEGORIES_DIR}")
    print(f"[✓] Metadata log saved in: {METADATA_FILE}")
    print(f"[✓] Total unique sounds tracked: {len(registry)}")
    print("=" * 70)

if __name__ == "__main__":
    main()
