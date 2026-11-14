"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Play,
  Pause,
  RotateCcw,
  Repeat,
  Volume2,
  VolumeX,
  Download,
  Check,
} from "lucide-react";
import { useAudio } from "@/context/AudioContext";
import { downloadSound } from "@/lib/download";

function formatTime(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

const SPEED_OPTIONS = [0.5, 0.75, 1, 1.25, 1.5, 2];

export function AudioPlayerBar() {
  const {
    activeSound,
    isPlaying,
    currentTime,
    duration,
    playbackRate,
    isLooping,
    volume,
    isMuted,
    error,
    audioRef,
    togglePlay,
    seekTo,
    setPlaybackRate,
    toggleLoop,
    setVolume,
    toggleMute,
  } = useAudio();

  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  const progressBarRef = useRef<HTMLDivElement | null>(null);
  const timeTextRef = useRef<HTMLSpanElement | null>(null);

  // 60 FPS scrubber update via requestAnimationFrame
  useEffect(() => {
    if (!activeSound) return;

    const bar = progressBarRef.current;
    const txt = timeTextRef.current;
    if (!bar) return;

    const update = (time: number) => {
      const dur = duration > 0 ? duration : 1;
      const pct = Math.max(0, Math.min(100, (time / dur) * 100));
      bar.style.width = `${pct}%`;
      if (txt) {
        txt.textContent = `${formatTime(time)} / ${formatTime(duration)}`;
      }
    };

    update(currentTime);

    if (!isPlaying) return;

    let animId: number;
    const tick = () => {
      const audio = audioRef?.current;
      if (audio && !audio.paused) {
        update(audio.currentTime);
      }
      animId = requestAnimationFrame(tick);
    };

    animId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animId);
  }, [activeSound, isPlaying, duration, currentTime, audioRef]);

  if (!activeSound) return null;

  const handleDownload = async () => {
    if (isDownloading) return;
    setIsDownloading(true);
    try {
      await downloadSound(activeSound);
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 2000);
    } catch (err) {
      console.error("Player download failed:", err);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <aside
      aria-label="Audio player"
      className="fixed bottom-0 left-0 right-0 z-50 bg-studio-surface/95 border-t border-studio-border backdrop-blur-md shadow-2xl"
    >
      {/* Top Thin Scrub Bar (No CSS transition lag, instant 60fps tracking) */}
      <div className="relative w-full h-1 group cursor-pointer bg-studio-border">
        <div
          ref={progressBarRef}
          className="h-full bg-studio-primary will-change-[width]"
          style={{ width: "0%" }}
        />
        <input
          type="range"
          min={0}
          max={duration || 1}
          step={0.01}
          value={currentTime}
          onChange={(e) => seekTo(parseFloat(e.target.value))}
          aria-label="Audio scrubber"
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Left: Track Info */}
        <div className="flex items-center gap-3 min-w-0 w-1/4">
          <div className="min-w-0">
            <div className="text-sm font-medium text-white truncate" title={activeSound.title}>
              {activeSound.title}
            </div>
            <div className="text-xs text-studio-muted truncate capitalize flex items-center gap-1.5">
              <span>{activeSound.category}</span>
              {activeSound.creator && <span className="opacity-60">• {activeSound.creator}</span>}
            </div>
          </div>
        </div>

        {/* Center: Playback Controls */}
        <div className="flex items-center gap-3 sm:gap-4">
          <button
            type="button"
            onClick={() => seekTo(0)}
            className="p-1.5 rounded text-studio-muted hover:text-white transition-colors"
            title="Replay from start"
            aria-label="Replay from start"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={togglePlay}
            className="w-10 h-10 rounded-full bg-studio-cyan text-black flex items-center justify-center hover:scale-105 active:scale-95 transition-transform"
            aria-label={isPlaying ? `Pause ${activeSound.title}` : `Play ${activeSound.title}`}
            title={isPlaying ? "Pause" : "Play"}
          >
            {isPlaying ? (
              <Pause className="w-4 h-4 fill-current" />
            ) : (
              <Play className="w-4 h-4 fill-current ml-0.5" />
            )}
          </button>

          <button
            type="button"
            onClick={toggleLoop}
            className={`p-1.5 rounded transition-colors ${
              isLooping ? "text-studio-cyan" : "text-studio-muted hover:text-white"
            }`}
            title={isLooping ? "Looping enabled" : "Looping disabled"}
            aria-label={isLooping ? "Disable loop" : "Enable loop"}
            aria-pressed={isLooping}
          >
            <Repeat className="w-4 h-4" />
          </button>

          <span ref={timeTextRef} className="hidden sm:inline-block font-mono text-xs text-studio-muted ml-2">
            {formatTime(currentTime)} / {formatTime(duration)}
          </span>
        </div>

        {/* Right: Speed, Volume & Download */}
        <div className="flex items-center justify-end gap-3 w-1/4">
          {/* Speed Selector */}
          <div className="hidden md:flex items-center text-xs text-studio-muted">
            <select
              value={playbackRate}
              onChange={(e) => setPlaybackRate(parseFloat(e.target.value))}
              aria-label="Playback speed"
              className="bg-transparent text-studio-muted hover:text-white text-xs font-mono focus:outline-none cursor-pointer"
            >
              {SPEED_OPTIONS.map((rate) => (
                <option key={rate} value={rate} className="bg-studio-surface text-white">
                  {rate}x
                </option>
              ))}
            </select>
          </div>

          {/* Volume Control */}
          <div className="hidden sm:flex items-center gap-1.5">
            <button
              type="button"
              onClick={toggleMute}
              className="text-studio-muted hover:text-white p-1"
              title={isMuted ? "Unmute" : "Mute"}
              aria-label={isMuted ? "Unmute audio" : "Mute audio"}
            >
              {isMuted || volume === 0 ? (
                <VolumeX className="w-4 h-4 text-rose-400" />
              ) : (
                <Volume2 className="w-4 h-4" />
              )}
            </button>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={isMuted ? 0 : volume}
              onChange={(e) => setVolume(parseFloat(e.target.value))}
              aria-label="Volume slider"
              className="w-16 h-1 bg-studio-border rounded-lg appearance-none cursor-pointer accent-studio-cyan"
            />
          </div>

          {/* Download Button */}
          <button
            type="button"
            onClick={handleDownload}
            disabled={isDownloading}
            aria-label={downloadSuccess ? `${activeSound.title} downloaded` : `Download ${activeSound.title} MP3`}
            title={downloadSuccess ? "Downloaded" : isDownloading ? "Downloading..." : `Download ${activeSound.title} (MP3)`}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              downloadSuccess
                ? "text-studio-primary bg-studio-primary/10 border border-studio-primary/30"
                : "text-white bg-studio-surface border border-studio-border hover:border-studio-primary/50"
            }`}
          >
            {downloadSuccess ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Downloaded</span>
              </>
            ) : (
              <>
                <Download className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Download</span>
              </>
            )}
          </button>
        </div>
      </div>

      {error && (
        <div className="text-[11px] text-rose-400 bg-rose-950/30 py-0.5 text-center font-mono border-t border-rose-900/30">
          {error}
        </div>
      )}
    </aside>
  );
}
