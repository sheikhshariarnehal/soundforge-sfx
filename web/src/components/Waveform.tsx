"use client";

import React, { useRef, useEffect, useState, useMemo, useCallback } from "react";
import { useAudio } from "@/context/AudioContext";

interface WaveformProps {
  id: string;
  duration: number;
  currentTime: number;
  isActive: boolean;
  onSeek: (seconds: number) => void;
  peaks?: number[];
  height?: number;
}

function formatTime(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return "0:00.0";
  const mins = Math.floor(seconds / 60);
  const secs = (seconds % 60).toFixed(1);
  return mins > 0 ? `${mins}:${secs.padStart(4, "0")}` : `${secs}s`;
}

// Generate an ultra-smooth, mirrored SVG polygon path from normalized peaks
function buildSvgPath(peaks: number[], width = 1000, height = 60): { path: string; baseline: string } {
  const centerY = height / 2;
  const maxAmp = centerY * 0.92;
  const len = peaks.length;

  if (len === 0) {
    return {
      path: `M 0 ${centerY} L ${width} ${centerY} Z`,
      baseline: `M 0 ${centerY} L ${width} ${centerY}`,
    };
  }

  // Top curve points
  const topPts: string[] = [];
  for (let i = 0; i < len; i++) {
    const x = (i / (len - 1)) * width;
    const p = Math.max(0.03, Math.min(1.0, peaks[i]));
    const y = centerY - p * maxAmp;
    topPts.push(`${x.toFixed(1)} ${y.toFixed(1)}`);
  }

  // Bottom curve points (mirrored, right to left)
  const botPts: string[] = [];
  for (let i = len - 1; i >= 0; i--) {
    const x = (i / (len - 1)) * width;
    const p = Math.max(0.03, Math.min(1.0, peaks[i]));
    const y = centerY + p * maxAmp;
    botPts.push(`${x.toFixed(1)} ${y.toFixed(1)}`);
  }

  const path = `M 0 ${centerY} L ${topPts.join(" L ")} L ${width} ${centerY} L ${botPts.join(" L ")} Z`;
  const baseline = `M 0 ${centerY} L ${width} ${centerY}`;

  return { path, baseline };
}

export function Waveform({
  id,
  duration,
  currentTime,
  isActive,
  onSeek,
  peaks: propPeaks,
  height = 36,
}: WaveformProps) {
  const { audioRef, isPlaying } = useAudio();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const playedLayerRef = useRef<HTMLDivElement | null>(null);
  const playheadRef = useRef<HTMLDivElement | null>(null);

  const [hoverState, setHoverState] = useState<{ x: number; pct: number } | null>(null);
  const isDraggingRef = useRef(false);

  // Normalize or fallback peaks
  const peaks = useMemo(() => {
    if (propPeaks && propPeaks.length >= 10) return propPeaks;
    // Fallback pseudo-random symmetrical envelope
    const res: number[] = [];
    for (let i = 0; i < 80; i++) {
      const envelope = Math.sin((i / 80) * Math.PI);
      res.push(Math.max(0.05, envelope * 0.7));
    }
    return res;
  }, [propPeaks]);

  // Memoize static SVG vector path
  const { path: pathData, baseline: baselineData } = useMemo(() => {
    return buildSvgPath(peaks, 1000, 60);
  }, [peaks]);

  // High-performance 60fps/120fps requestAnimationFrame real-time scrubber update
  useEffect(() => {
    const playedEl = playedLayerRef.current;
    const playheadEl = playheadRef.current;
    if (!playedEl || !playheadEl) return;

    // If not active, reset to 0
    if (!isActive) {
      playedEl.style.clipPath = "inset(0 100% 0 0)";
      playheadEl.style.display = "none";
      return;
    }

    // Direct synchronous update when paused or initial active
    const updateProgress = (currTime: number) => {
      const dur = duration > 0 ? duration : 1;
      const progress = Math.max(0, Math.min(1, currTime / dur));
      const pct100 = progress * 100;

      playedEl.style.clipPath = `inset(0 ${Math.max(0, 100 - pct100)}% 0 0)`;
      playheadEl.style.left = `${pct100}%`;
      playheadEl.style.display = progress > 0 ? "block" : "none";
    };

    updateProgress(currentTime);

    // If playing, bind directly to the audio element via requestAnimationFrame
    if (!isPlaying) return;

    let animId: number;
    const tick = () => {
      const audio = audioRef?.current;
      if (audio && !audio.paused) {
        updateProgress(audio.currentTime);
      }
      animId = requestAnimationFrame(tick);
    };

    animId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animId);
  }, [isActive, isPlaying, duration, currentTime, audioRef]);

  // Pointer scrubbing interactions
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.stopPropagation();
    isDraggingRef.current = true;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);

    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = Math.max(0, Math.min(rect.width, e.clientX - rect.left));
    const pct = Math.max(0, Math.min(1, clickX / rect.width));

    onSeek(pct * duration);
    setHoverState({ x: clickX, pct });
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const container = containerRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const clickX = Math.max(0, Math.min(rect.width, e.clientX - rect.left));
    const pct = Math.max(0, Math.min(1, clickX / rect.width));

    setHoverState({ x: clickX, pct });

    if (isDraggingRef.current) {
      onSeek(pct * duration);
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isDraggingRef.current) {
      isDraggingRef.current = false;
      try {
        (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
      } catch (_) {}
    }
  };

  const handlePointerLeave = () => {
    if (!isDraggingRef.current) {
      setHoverState(null);
    }
  };

  return (
    <div
      ref={containerRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerLeave}
      style={{ height: `${height}px` }}
      className="relative w-full flex items-center cursor-pointer select-none group py-1"
    >
      {/* 1. Background Unplayed Waveform (Clean visible neutral slate) */}
      <svg
        viewBox="0 0 1000 60"
        preserveAspectRatio="none"
        className={`w-full h-full block transition-colors duration-150 ${
          isActive ? "text-slate-400" : "text-slate-500/50 group-hover:text-slate-400/80"
        }`}
      >
        <path d={baselineData} stroke="rgba(255, 255, 255, 0.16)" strokeWidth="1" vectorEffect="non-scaling-stroke" />
        <path d={pathData} fill="currentColor" />
      </svg>

      {/* 2. Foreground Played Waveform (Electric Cyan with 60fps/120fps CSS clip-path) */}
      <div
        ref={playedLayerRef}
        className="absolute inset-0 w-full h-full pointer-events-none will-change-[clip-path]"
        style={{
          clipPath: "inset(0 100% 0 0)",
        }}
      >
        <svg
          viewBox="0 0 1000 60"
          preserveAspectRatio="none"
          className="w-full h-full block text-studio-cyan"
        >
          <path d={pathData} fill="currentColor" />
        </svg>
      </div>

      {/* 3. Vertical Playhead Line */}
      <div
        ref={playheadRef}
        className="absolute top-0 bottom-0 w-[1.5px] bg-white pointer-events-none z-20 shadow-[0_0_6px_#06b6d4] will-change-[left]"
        style={{ display: "none" }}
      />

      {/* 4. Hover Scrub Line & Tooltip */}
      {hoverState && (
        <>
          <div
            className="absolute top-0 bottom-0 w-[1px] bg-white/40 border-r border-dashed border-white/60 pointer-events-none z-20"
            style={{ left: `${hoverState.x}px` }}
          />
          {duration > 0 && (
            <div
              className="absolute -top-7 transform -translate-x-1/2 pointer-events-none z-30 px-1.5 py-0.5 rounded bg-black/90 border border-studio-border text-[10px] font-mono text-studio-cyan shadow-xl whitespace-nowrap"
              style={{ left: `${hoverState.x}px` }}
            >
              {formatTime(hoverState.pct * duration)}
            </div>
          )}
        </>
      )}
    </div>
  );
}
