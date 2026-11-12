import { SoundItem } from "./types";

export async function downloadSound(sound: SoundItem) {
  const filename = sound.filename || `${sound.title.replace(/[^a-zA-Z0-9_-]/g, "_")}_${sound.id}.mp3`;
  
  // Try fetching blob directly, or fallback to proxy download endpoint
  try {
    const streamUrl = `/api/audio/${encodeURIComponent(sound.category)}/${encodeURIComponent(sound.filename)}`;
    const response = await fetch(streamUrl);
    
    if (!response.ok) {
      throw new Error(`Download HTTP error ${response.status}`);
    }
    
    const blob = await response.blob();
    const blobUrl = window.URL.createObjectURL(blob);
    
    const a = document.createElement("a");
    a.style.display = "none";
    a.href = blobUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    
    window.URL.revokeObjectURL(blobUrl);
    document.body.removeChild(a);
  } catch (err) {
    console.warn("Direct blob download failed, falling back to direct anchor:", err);
    // Fallback: standard link download
    const a = document.createElement("a");
    a.href = sound.audioUrl;
    a.download = filename;
    a.target = "_blank";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }
}
