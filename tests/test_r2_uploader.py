from pathlib import Path
import pytest
from upload_to_r2 import build_r2_key, scan_local_files

def test_build_r2_key():
    key = build_r2_key("swoosh", "Copyright_Free_Swoosh_487669.mp3")
    assert key == "sounds/swoosh/Copyright_Free_Swoosh_487669.mp3"

def test_scan_local_files():
    files = scan_local_files()
    assert len(files) == 1417, f"Expected 1417 files, got {len(files)}"
    first = files[0]
    assert "local_path" in first
    assert "category" in first
    assert "filename" in first
    assert "r2_key" in first
    assert first["r2_key"].startswith("sounds/")
