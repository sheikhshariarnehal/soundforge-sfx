"use client";

import React, { useState } from "react";
import {
  Play,
  Pause,
  RotateCcw,
  Repeat,
  Volume2,
  VolumeX,
  Download,
  Check,
  Disc,
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
    togglePlay,
    seekTo,
    setPlaybackRate,
    toggleLoop,
    setVolume,
    toggleMute,
  } = useAudio();

  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

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

  const handleSeekChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    seekTo(parseFloat(e.target.value));
  };

  const progressPct = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <aside
      aria-label="Audio player"
      className="fixed bottom-0 left-0 right-0 z-50 p-2 sm:p-4 pointer-events-none"
    >
      <div className="max-w-5xl mx-auto pointer-events-auto bg-studio-surface/95 border border-studio-border/90 backdrop-blur-xl rounded-2xl shadow-2xl p-3 sm:p-4 text-white flex flex-col gap-2">
        {/* Top Progress Scrub Bar */}
        <div className="flex items-center gap-2 w-full text-[11px] font-mono text-studio-muted">
          <span className="w-10 text-right">{formatTime(currentTime)}</span>
          <div className="relative flex-1 flex items-center group cursor-pointer">
            <input
              type="range"
              min={0}
              max={duration || 1}
              step={0.01}
              value={currentTime}
              onChange={handleSeekChange}
              className="w-full h-1.5 bg-studio-border/80 rounded-lg appearance-none cursor-pointer accent-studio-cyan focus:outline-none"
              style={{
                background: `linear-gradient(to right, #06b6d4 ${progressPct}%, #1e293b ${progressPct}%)`,
              }}
            />
          </div>
          <span className="w-10">{formatTime(duration)}</span>
        </div>

        {/* Bottom Controls Row */}
        <div className="flex items-center justify-between gap-3">
          {/* Left: Track Information */}
          <div className="flex items-center gap-3 min-w-0 max-w-[200px] sm:max-w-xs">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 border transition-all ${
                isPlaying
                  ? "bg-studio-cyan/20 border-studio-cyan text-studio-cyan"
                  : "bg-studio-border/50 border-studio-border text-studio-muted"
              }`}
            >
              <Disc className={`w-5 h-5 ${isPlaying ? "animate-spin" : ""}`} />
            </div>
            <div className="min-w-0">
              <h4 className="text-xs sm:text-sm font-semibold truncate text-white" title={activeSound.title}>
                {activeSound.title}
              </h4>
              <p className="text-[11px] text-studio-muted truncate flex items-center gap-1.5 capitalize">
                <span className="text-studio-cyan font-mono">{activeSound.category}</span>
                {activeSound.creator && <span>• {activeSound.creator}</span>}
              </p>
            </div>
          </div>

          {/* Center: Playback Controls */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Replay 0s */}
            <button
              type="button"
              onClick={() => seekTo(0)}
              className="p-2 rounded-lg text-studio-muted hover:text-white hover:bg-studio-border/60 transition-colors"
              title="Replay from start"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            {/* Play/Pause Main Button */}
            <button
              type="button"
              onClick={togglePlay}
              className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-studio-cyan text-black flex items-center justify-center shadow-lg shadow-studio-cyan/30 hover:scale-105 active:scale-95 transition-transform"
              aria-label={isPlaying ? "Pause" : "Play"}
            >
              {isPlaying ? (
                <Pause className="w-5 h-5 fill-current" />
              ) : (
                <Play className="w-5 h-5 fill-current ml-0.5" />
              )}
            </button>

            {/* Loop Toggle */}
            <button
              type="button"
              onClick={toggleLoop}
              className={`p-2 rounded-lg transition-colors ${
                isLooping
                  ? "bg-studio-cyan/20 text-studio-cyan border border-studio-cyan/40"
                  : "text-studio-muted hover:text-white hover:bg-studio-border/60"
              }`}
              title={isLooping ? "Loop Enabled" : "Loop Disabled"}
            >
              <Repeat className="w-4 h-4" />
            </button>
          </div>

          {/* Right: Speed, Volume & Download */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Speed Selector */}
            <div className="hidden sm:flex items-center bg-studio-border/50 border border-studio-border rounded-lg px-2 py-1 text-xs">
              <select
                value={playbackRate}
                onChange={(e) => setPlaybackRate(parseFloat(e.target.value))}
                className="bg-transparent text-white text-xs font-mono font-medium focus:outline-none cursor-pointer"
                title="Playback Speed"
              >
                {SPEED_OPTIONS.map((rate) => (
                  <option key={rate} value={rate} className="bg-studio-surface text-white">
                    {rate}x
                  </option>
                ))}
              </select>
            </div>

            {/* Volume Control */}
            <div className="hidden md:flex items-center gap-1.5">
              <button
                type="button"
                onClick={toggleMute}
                className="text-studio-muted hover:text-white p-1"
                title={isMuted ? "Unmute" : "Mute"}
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
                className="w-16 h-1 bg-studio-border rounded-lg appearance-none cursor-pointer accent-studio-cyan"
              />
            </div>

            {/* Download Button */}
            <button
              type="button"
              onClick={handleDownload}
              disabled={isDownloading}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                downloadSuccess
                  ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/40"
                  : "bg-studio-cyan/15 text-studio-cyan hover:bg-studio-cyan hover:text-black border-studio-cyan/30"
              }`}
            >
              {downloadSuccess ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="hidden sm:inline">Saved</span>
                </>
              ) : (
                <>
                  <Download className={`w-3.5 h-3.5 ${isDownloading ? "animate-bounce" : ""}`} />
                  <span className="hidden sm:inline">Download</span>
                </>
              )}
            </button>
          </div>
        </div>

        {error && (
          <div className="text-[11px] text-rose-400 bg-rose-950/40 border border-rose-800/40 rounded px-2.5 py-1 mt-1 text-center font-mono">
            {error}
          </div>
        )}
      </div>
    </aside>
  );
}
