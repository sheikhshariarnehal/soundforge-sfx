"use client";

import React, { useRef, useEffect, useState, useMemo } from "react";

interface WaveformProps {
  id: string;
  duration: number;
  currentTime: number;
  isActive: boolean;
  onSeek: (seconds: number) => void;
  barCount?: number;
  height?: number;
}

export function Waveform({
  id,
  duration,
  currentTime,
  isActive,
  onSeek,
  barCount = 42,
  height = 36,
}: WaveformProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [hoverPercent, setHoverPercent] = useState<number | null>(null);

  // Generate deterministic bar heights using string hash of the track ID
  const barHeights = useMemo(() => {
    let hash = 0;
    for (let i = 0; i < id.length; i++) {
      hash = (hash << 5) - hash + id.charCodeAt(i);
      hash |= 0;
    }

    const heights: number[] = [];
    for (let i = 0; i < barCount; i++) {
      // Deterministic PRNG
      const x = Math.sin(hash + i * 9.7) * 10000;
      const rand = x - Math.floor(x);
      // Give rhythmic waveform shape (louder in middle, tapered ends)
      const envelope = Math.sin((i / barCount) * Math.PI);
      const val = 0.2 + (rand * 0.6 + envelope * 0.4) * 0.8;
      heights.push(Math.max(0.15, Math.min(1.0, val)));
    }
    return heights;
  }, [id, barCount]);

  // Render waveform on canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Handle high-DPI retina displays
    const dpr = window.devicePixelRatio || 1;
    const width = canvas.clientWidth;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    ctx.clearRect(0, 0, width, height);

    const progress = isActive && duration > 0 ? Math.min(1, currentTime / duration) : 0;
    const barWidth = Math.max(2, (width / barCount) * 0.65);
    const gap = (width - barWidth * barCount) / (barCount - 1);

    for (let i = 0; i < barCount; i++) {
      const x = i * (barWidth + gap);
      const barH = barHeights[i] * height * 0.88;
      const y = (height - barH) / 2;
      const barProgress = (i + 0.5) / barCount;

      ctx.beginPath();
      // Rounded pill bars
      const radius = barWidth / 2;
      ctx.roundRect(x, y, barWidth, barH, radius);

      if (isActive && barProgress <= progress) {
        // Active played state: Vibrant Neon Cyan
        ctx.fillStyle = "#06b6d4";
        ctx.shadowColor = "#06b6d4";
        ctx.shadowBlur = 4;
      } else if (hoverPercent !== null && barProgress <= hoverPercent) {
        // Hover state
        ctx.fillStyle = "#38bdf8";
        ctx.shadowBlur = 0;
      } else {
        // Unplayed state: subtle dark slate
        ctx.fillStyle = isActive ? "#334155" : "#1e293b";
        ctx.shadowBlur = 0;
      }

      ctx.fill();
    }
  }, [barHeights, barCount, height, isActive, currentTime, duration, hoverPercent]);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.stopPropagation();
    const container = containerRef.current;
    if (!container || duration <= 0) return;

    const rect = container.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const pct = Math.max(0, Math.min(1, clickX / rect.width));
    onSeek(pct * duration);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    setHoverPercent(pct);
  };

  const handlePointerLeave = () => {
    setHoverPercent(null);
  };

  return (
    <div
      ref={containerRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      className="relative w-full h-[36px] flex items-center cursor-pointer select-none group"
      title={duration > 0 ? `Click to scrub (${currentTime.toFixed(1)}s / ${duration.toFixed(1)}s)` : "Sound waveform"}
    >
      <canvas ref={canvasRef} className="w-full h-full block" />
    </div>
  );
}
