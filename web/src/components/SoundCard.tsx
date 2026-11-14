"use client";

import React, { useState } from "react";
import { Play, Pause, Download, Check } from "lucide-react";
import { SoundItem } from "@/lib/types";
import { useAudio } from "@/context/AudioContext";
import { Waveform } from "./Waveform";
import { downloadSound } from "@/lib/download";

interface SoundCardProps {
  sound: SoundItem;
  viewMode?: "grid" | "list";
}

function formatDuration(seconds: number): string {
  if (seconds <= 0) return "< 1s";
  if (seconds < 1) return `${seconds.toFixed(1)}s`;
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  if (mins === 0) return `${secs}s`;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export function SoundCard({ sound, viewMode = "list" }: SoundCardProps) {
  const { activeSound, isPlaying, currentTime, playSound, seekTo } = useAudio();
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  const isActive = activeSound?.id === sound.id;
  const isThisPlaying = isActive && isPlaying;

  const handlePlayToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    playSound(sound);
  };

  const handleDownload = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isDownloading) return;
    setIsDownloading(true);
    try {
      await downloadSound(sound);
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 2000);
    } catch (err) {
      console.error("Download failed:", err);
    } finally {
      setIsDownloading(false);
    }
  };

  if (viewMode === "list") {
    return (
      <div
        onClick={() => playSound(sound)}
        className={`group flex items-center justify-between gap-3 sm:gap-4 px-3 sm:px-4 py-2 transition-colors cursor-pointer ${
          isActive
            ? "bg-white/[0.04] text-white"
            : "hover:bg-white/[0.02] text-neutral-300"
        }`}
      >
        {/* Play/Pause Button */}
        <button
          type="button"
          onClick={handlePlayToggle}
          className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center transition-colors ${
            isThisPlaying
              ? "bg-studio-cyan text-black"
              : "bg-white/[0.05] text-neutral-400 group-hover:text-white group-hover:bg-white/[0.1]"
          }`}
          aria-label={isThisPlaying ? `Pause ${sound.title}` : `Play ${sound.title}`}
          title={isThisPlaying ? `Pause ${sound.title}` : `Play ${sound.title}`}
        >
          {isThisPlaying ? (
            <Pause className="w-3 h-3 fill-current" />
          ) : (
            <Play className="w-3 h-3 fill-current ml-0.5" />
          )}
        </button>

        {/* Title & Category */}
        <div className="min-w-[130px] sm:min-w-[190px] max-w-[240px] truncate">
          <div className="font-medium text-xs sm:text-sm truncate text-neutral-200 group-hover:text-white transition-colors">
            {sound.title}
          </div>
          <div className="text-[11px] text-neutral-400/80 truncate flex items-center gap-1.5">
            <span className="capitalize">{sound.category}</span>
            {sound.creator && <span className="opacity-60">• {sound.creator}</span>}
          </div>
        </div>

        {/* Waveform */}
        <div className="flex-1 max-w-xl mx-1 sm:mx-3">
          <Waveform
            id={sound.id}
            duration={sound.duration}
            currentTime={isActive ? currentTime : 0}
            isActive={isActive}
            peaks={sound.peaks}
            onSeek={(sec) => {
              if (!isActive) playSound(sound);
              seekTo(sec);
            }}
          />
        </div>

        {/* Duration */}
        <div className="text-xs font-mono text-neutral-400 min-w-[38px] text-right">
          {formatDuration(sound.duration)}
        </div>

        {/* Download Button */}
        <button
          type="button"
          onClick={handleDownload}
          disabled={isDownloading}
          className={`flex-shrink-0 p-1.5 rounded transition-colors ${
            downloadSuccess
              ? "text-emerald-400"
              : "text-neutral-400 hover:text-white"
          }`}
          title={downloadSuccess ? "Downloaded" : isDownloading ? "Downloading..." : `Download ${sound.title} (MP3)`}
          aria-label={downloadSuccess ? `${sound.title} downloaded` : `Download ${sound.title} MP3`}
        >
          {downloadSuccess ? (
            <Check className="w-3.5 h-3.5 text-emerald-400" />
          ) : (
            <Download className="w-3.5 h-3.5" />
          )}
        </button>
      </div>
    );
  }

  // Grid Mode Card
  return (
    <div
      onClick={() => playSound(sound)}
      className={`group flex flex-col justify-between p-3 rounded-lg border transition-all cursor-pointer ${
        isActive
          ? "bg-white/[0.04] border-white/20"
          : "bg-white/[0.015] border-white/[0.06] hover:border-white/10 hover:bg-white/[0.03]"
      }`}
    >
      <div className="flex items-center justify-between text-xs mb-1.5">
        <span className="capitalize text-[11px] font-mono text-neutral-400">
          {sound.category}
        </span>
        <span className="font-mono text-[11px] text-neutral-400">
          {formatDuration(sound.duration)}
        </span>
      </div>

      <div className="mb-2">
        <h3 className="font-medium text-xs sm:text-sm text-neutral-200 truncate group-hover:text-white transition-colors" title={sound.title}>
          {sound.title}
        </h3>
        <p className="text-[11px] text-neutral-400/80 truncate">
          {sound.creator ? sound.creator : "Royalty-free"}
        </p>
      </div>

      {/* Waveform */}
      <div className="my-1 py-1 px-1 rounded bg-black/30">
        <Waveform
          id={sound.id}
          duration={sound.duration}
          currentTime={isActive ? currentTime : 0}
          isActive={isActive}
          peaks={sound.peaks}
          onSeek={(sec) => {
            if (!isActive) playSound(sound);
            seekTo(sec);
          }}
        />
      </div>

      {/* Bottom Action Row */}
      <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/[0.04]">
        <button
          type="button"
          onClick={handlePlayToggle}
          aria-label={isThisPlaying ? `Pause ${sound.title}` : `Play ${sound.title}`}
          title={isThisPlaying ? `Pause ${sound.title}` : `Play ${sound.title}`}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium transition-colors ${
            isThisPlaying
              ? "bg-studio-cyan text-black"
              : "bg-white/[0.05] text-neutral-300 hover:bg-white/[0.1] hover:text-white"
          }`}
        >
          {isThisPlaying ? (
            <>
              <Pause className="w-3 h-3 fill-current" />
              <span>Pause</span>
            </>
          ) : (
            <>
              <Play className="w-3 h-3 fill-current ml-0.5" />
              <span>Play</span>
            </>
          )}
        </button>

        <button
          type="button"
          onClick={handleDownload}
          disabled={isDownloading}
          aria-label={downloadSuccess ? `${sound.title} downloaded` : `Download ${sound.title} MP3`}
          title={downloadSuccess ? "Downloaded" : isDownloading ? "Downloading..." : `Download ${sound.title} (MP3)`}
          className={`p-1.5 rounded text-neutral-400 hover:text-white transition-colors ${
            downloadSuccess ? "text-emerald-400" : ""
          }`}
        >
          {downloadSuccess ? (
            <Check className="w-3.5 h-3.5 text-emerald-400" />
          ) : (
            <Download className="w-3.5 h-3.5" />
          )}
        </button>
      </div>
    </div>
  );
}
