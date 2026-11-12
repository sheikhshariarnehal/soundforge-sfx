"use client";

import React, { useState } from "react";
import { Play, Pause, Download, Volume2, Check } from "lucide-react";
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

export function SoundCard({ sound, viewMode = "grid" }: SoundCardProps) {
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
        className={`group flex items-center justify-between gap-4 p-3.5 rounded-xl border transition-all duration-200 cursor-pointer ${
          isActive
            ? "bg-studio-card/90 border-studio-cyan/60 shadow-lg shadow-studio-cyan/5"
            : "bg-studio-surface/50 border-studio-border/70 hover:bg-studio-card/60 hover:border-studio-borderLight"
        }`}
      >
        {/* Play/Pause Button */}
        <button
          type="button"
          onClick={handlePlayToggle}
          className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-transform transform active:scale-95 ${
            isThisPlaying
              ? "bg-studio-cyan text-black shadow-md shadow-studio-cyan/30"
              : "bg-studio-border/80 text-studio-text hover:bg-studio-cyan hover:text-black group-hover:scale-105"
          }`}
          aria-label={isThisPlaying ? "Pause" : "Play"}
        >
          {isThisPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
        </button>

        {/* Title, Category & Creator */}
        <div className="min-w-[180px] max-w-[260px] truncate">
          <h3 className="font-medium text-sm text-studio-text truncate group-hover:text-studio-cyan transition-colors">
            {sound.title}
          </h3>
          <div className="flex items-center gap-2 text-xs text-studio-muted mt-0.5">
            <span className="capitalize px-1.5 py-0.5 rounded bg-studio-border/60 text-studio-cyan/90 font-mono text-[11px]">
              {sound.category}
            </span>
            {sound.creator && <span className="truncate">by {sound.creator}</span>}
          </div>
        </div>

        {/* Interactive Waveform */}
        <div className="flex-1 max-w-xl mx-2">
          <Waveform
            id={sound.id}
            duration={sound.duration}
            currentTime={isActive ? currentTime : 0}
            isActive={isActive}
            onSeek={(sec) => {
              if (!isActive) playSound(sound);
              seekTo(sec);
            }}
          />
        </div>

        {/* Duration */}
        <div className="text-xs font-mono text-studio-muted min-w-[50px] text-right">
          {formatDuration(sound.duration)}
        </div>

        {/* 1-Click Download Button */}
        <button
          type="button"
          onClick={handleDownload}
          disabled={isDownloading}
          className={`flex-shrink-0 p-2.5 rounded-lg border text-xs font-medium flex items-center gap-1.5 transition-all ${
            downloadSuccess
              ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/40"
              : "bg-studio-border/40 hover:bg-studio-cyan/15 text-studio-muted hover:text-studio-cyan border-studio-border/80 hover:border-studio-cyan/40"
          }`}
          title="Download MP3"
        >
          {downloadSuccess ? (
            <Check className="w-4 h-4 text-emerald-400" />
          ) : (
            <Download className={`w-4 h-4 ${isDownloading ? "animate-bounce" : ""}`} />
          )}
        </button>
      </div>
    );
  }

  // Grid Mode Card
  return (
    <div
      onClick={() => playSound(sound)}
      className={`group relative flex flex-col justify-between p-4 rounded-2xl border transition-all duration-200 cursor-pointer ${
        isActive
          ? "bg-studio-card border-studio-cyan/60 shadow-xl shadow-studio-cyan/5 -translate-y-0.5"
          : "bg-studio-surface/60 border-studio-border/80 hover:bg-studio-card hover:border-studio-borderLight hover:-translate-y-1 hover:shadow-lg"
      }`}
    >
      {/* Top Row: Category Pill & Duration */}
      <div className="flex items-center justify-between text-xs mb-3">
        <span className="capitalize px-2 py-0.5 rounded-full bg-studio-border/70 text-studio-cyan font-mono text-[11px] font-medium tracking-wide">
          {sound.category}
        </span>
        <span className="font-mono text-studio-muted text-xs">
          {formatDuration(sound.duration)}
        </span>
      </div>

      {/* Middle: Title & Creator */}
      <div className="mb-3">
        <h3 className="font-semibold text-base text-studio-text truncate group-hover:text-studio-cyan transition-colors" title={sound.title}>
          {sound.title}
        </h3>
        <p className="text-xs text-studio-muted mt-0.5 truncate">
          {sound.creator ? `by ${sound.creator}` : "Royalty-Free"}
        </p>
      </div>

      {/* Interactive Waveform Visualizer */}
      <div className="my-2 py-1 px-2 rounded-lg bg-studio-bg/60 border border-studio-border/40">
        <Waveform
          id={sound.id}
          duration={sound.duration}
          currentTime={isActive ? currentTime : 0}
          isActive={isActive}
          onSeek={(sec) => {
            if (!isActive) playSound(sound);
            seekTo(sec);
          }}
        />
      </div>

      {/* Bottom Controls Row: Play/Pause & Download */}
      <div className="flex items-center justify-between mt-3 pt-3 border-t border-studio-border/50">
        <button
          type="button"
          onClick={handlePlayToggle}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
            isThisPlaying
              ? "bg-studio-cyan text-black font-semibold shadow-md shadow-studio-cyan/20"
              : "bg-studio-border/80 text-studio-text hover:bg-studio-cyan hover:text-black"
          }`}
        >
          {isThisPlaying ? (
            <>
              <Pause className="w-3.5 h-3.5 fill-current" />
              <span>Playing</span>
            </>
          ) : (
            <>
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Preview</span>
            </>
          )}
        </button>

        <button
          type="button"
          onClick={handleDownload}
          disabled={isDownloading}
          className={`p-2 rounded-lg text-xs flex items-center gap-1.5 transition-colors border ${
            downloadSuccess
              ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/40"
              : "bg-studio-border/40 hover:bg-studio-cyan/15 text-studio-muted hover:text-studio-cyan border-studio-border/80 hover:border-studio-cyan/40"
          }`}
          title="Download MP3"
        >
          {downloadSuccess ? (
            <Check className="w-4 h-4 text-emerald-400" />
          ) : (
            <Download className={`w-4 h-4 ${isDownloading ? "animate-bounce" : ""}`} />
          )}
        </button>
      </div>
    </div>
  );
}
