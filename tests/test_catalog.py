import json
from pathlib import Path
import pytest

def test_catalog_structure():
    catalog_path = Path("web/public/data/sounds.json")
    categories_path = Path("web/public/data/categories.json")
    
    assert catalog_path.exists(), f"sounds.json does not exist at {catalog_path}"
    assert categories_path.exists(), f"categories.json does not exist at {categories_path}"
    
    with open(catalog_path, encoding="utf-8") as f:
        sounds = json.load(f)
    assert len(sounds) == 1417, f"Expected 1417 sounds, got {len(sounds)}"
    
    first = sounds[0]
    for key in ["id", "title", "category", "duration", "creator", "filename", "tags", "audioUrl"]:
        assert key in first, f"Missing key '{key}' in sound item"
        
    with open(categories_path, encoding="utf-8") as f:
        categories = json.load(f)
    assert len(categories) == 47, f"Expected 47 categories, got {len(categories)}"
