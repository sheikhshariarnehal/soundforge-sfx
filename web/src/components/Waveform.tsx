"use client";

import React, { useRef, useEffect, useState, useCallback } from "react";

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
  return mins > 0
    ? `${mins}:${secs.padStart(4, "0")}`
    : `${secs}s`;
}

export function Waveform({
  id,
  duration,
  currentTime,
  isActive,
  onSeek,
  peaks: propPeaks,
  height = 34,
}: WaveformProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [hoverState, setHoverState] = useState<{ x: number; pct: number } | null>(null);
  const isDraggingRef = useRef(false);

  // Use precomputed real peaks or generate a smooth organic baseline
  const peaks = propPeaks && propPeaks.length > 0 ? propPeaks : [0.05];

  const drawWaveform = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const width = canvas.clientWidth;
    if (width === 0) return;

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    ctx.clearRect(0, 0, width, height);

    const centerY = height / 2;
    const maxAmplitude = (height / 2) * 0.9;
    const progress = isActive && duration > 0 ? Math.max(0, Math.min(1, currentTime / duration)) : 0;
    const splitX = progress * width;

    // 1. Draw subtle center baseline
    ctx.beginPath();
    ctx.strokeStyle = "rgba(148, 163, 184, 0.15)";
    ctx.lineWidth = 1;
    ctx.moveTo(0, centerY);
    ctx.lineTo(width, centerY);
    ctx.stroke();

    // 2. Build continuous mirrored polygon path
    const path = new Path2D();
    const len = peaks.length;

    // Top curve (left to right)
    path.moveTo(0, centerY);
    for (let i = 0; i < len; i++) {
      const x = (i / (len - 1)) * width;
      const amp = Math.max(0.04, peaks[i]) * maxAmplitude;
      const y = centerY - amp;
      if (i === 0) {
        path.lineTo(x, y);
      } else {
        const prevX = ((i - 1) / (len - 1)) * width;
        const prevAmp = Math.max(0.04, peaks[i - 1]) * maxAmplitude;
        const prevY = centerY - prevAmp;
        const cpX = (prevX + x) / 2;
        path.quadraticCurveTo(cpX, prevY, x, y);
      }
    }

    // Connect to right edge center
    path.lineTo(width, centerY);

    // Bottom curve (right to left, mirrored)
    for (let i = len - 1; i >= 0; i--) {
      const x = (i / (len - 1)) * width;
      const amp = Math.max(0.04, peaks[i]) * maxAmplitude;
      const y = centerY + amp;
      if (i === len - 1) {
        path.lineTo(x, y);
      } else {
        const nextX = ((i + 1) / (len - 1)) * width;
        const nextAmp = Math.max(0.04, peaks[i + 1]) * maxAmplitude;
        const nextY = centerY + nextAmp;
        const cpX = (nextX + x) / 2;
        path.quadraticCurveTo(cpX, nextY, x, y);
      }
    }

    path.closePath();

    // 3. Render unplayed background envelope
    ctx.fillStyle = isActive ? "#334155" : "#1e293b";
    ctx.fill(path);

    // 4. Render played foreground envelope (Electric Cyan)
    if (splitX > 0) {
      ctx.save();
      ctx.beginPath();
      ctx.rect(0, 0, splitX, height);
      ctx.clip();

      // Vibrant Electric Cyan fill
      ctx.fillStyle = "#06b6d4";
      ctx.fill(path);
      ctx.restore();

      // 5. Vertical playhead line
      ctx.beginPath();
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 1.5;
      ctx.moveTo(splitX, 1);
      ctx.lineTo(splitX, height - 1);
      ctx.stroke();
    }

    // 6. Hover guide line
    if (hoverState && hoverState.x !== splitX) {
      ctx.beginPath();
      ctx.strokeStyle = "rgba(255, 255, 255, 0.4)";
      ctx.lineWidth = 1;
      ctx.setLineDash([2, 2]);
      ctx.moveTo(hoverState.x, 0);
      ctx.lineTo(hoverState.x, height);
      ctx.stroke();
      ctx.setLineDash([]);
    }
  }, [peaks, height, isActive, duration, currentTime, hoverState]);

  useEffect(() => {
    drawWaveform();
  }, [drawWaveform]);

  // Handle pointer scrub interactions
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.stopPropagation();
    isDraggingRef.current = true;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);

    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
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
      className="relative w-full h-[34px] flex items-center cursor-pointer select-none group"
    >
      <canvas ref={canvasRef} className="w-full h-full block" />

      {/* Floating Hover Timestamp Tooltip */}
      {hoverState && duration > 0 && (
        <div
          className="absolute -top-7 transform -translate-x-1/2 pointer-events-none z-30 px-1.5 py-0.5 rounded bg-black/90 border border-studio-border text-[10px] font-mono text-studio-cyan shadow-lg whitespace-nowrap"
          style={{ left: `${hoverState.x}px` }}
        >
          {formatTime(hoverState.pct * duration)}
        </div>
      )}
    </div>
  );
}
