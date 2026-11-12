"use client";

import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from "react";
import { SoundItem } from "@/lib/types";

interface AudioContextType {
  activeSound: SoundItem | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  playbackRate: number;
  isLooping: boolean;
  volume: number;
  isMuted: boolean;
  error: string | null;
  playSound: (sound: SoundItem) => void;
  pauseSound: () => void;
  togglePlay: () => void;
  seekTo: (seconds: number) => void;
  setPlaybackRate: (rate: number) => void;
  toggleLoop: () => void;
  setVolume: (vol: number) => void;
  toggleMute: () => void;
}

const AudioContext = createContext<AudioContextType | undefined>(undefined);

export function AudioProvider({ children }: { children: React.ReactNode }) {
  const [activeSound, setActiveSound] = useState<SoundItem | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [playbackRate, setRate] = useState<number>(1);
  const [isLooping, setIsLooping] = useState<boolean>(false);
  const [volume, setVolState] = useState<number>(0.85);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const activeSoundRef = useRef<SoundItem | null>(null);
  activeSoundRef.current = activeSound;

  // Initialize Audio element once on mount
  useEffect(() => {
    const audio = new Audio();
    audio.preload = "auto";
    audioRef.current = audio;

    const onTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const onLoadedMetadata = () => {
      setDuration(audio.duration || activeSoundRef.current?.duration || 0);
      setError(null);
    };

    const onEnded = () => {
      if (!audio.loop) {
        setIsPlaying(false);
        setCurrentTime(0);
      }
    };

    const onError = () => {
      // If direct R2 CDN URL failed (e.g. 403 public bucket disabled), fallback to S3 stream API
      const current = activeSoundRef.current;
      if (current && !audio.src.includes("/api/audio/")) {
        console.warn(`Direct stream failed for ${current.title}, falling back to proxy stream...`);
        audio.src = `/api/audio/${encodeURIComponent(current.category)}/${encodeURIComponent(current.filename)}`;
        audio.play().catch((e) => {
          console.error("Audio playback error after fallback:", e);
          setError("Audio unavailable. Check Cloudflare R2 bucket permissions.");
          setIsPlaying(false);
        });
        return;
      }

      setError("Playback error loading audio source.");
      setIsPlaying(false);
    };

    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("loadedmetadata", onLoadedMetadata);
    audio.addEventListener("ended", onEnded);
    audio.addEventListener("error", onError);

    return () => {
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("loadedmetadata", onLoadedMetadata);
      audio.removeEventListener("ended", onEnded);
      audio.removeEventListener("error", onError);
      audio.pause();
    };
  }, []);

  // Global Spacebar Keydown Handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is focused inside an input, textarea or search box
      const target = e.target as HTMLElement;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable ||
          target.tagName === "SELECT")
      ) {
        return;
      }

      if (e.code === "Space") {
        e.preventDefault();
        togglePlay();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeSound, isPlaying]);

  const playSound = useCallback((sound: SoundItem) => {
    const audio = audioRef.current;
    if (!audio) return;

    setError(null);

    // If same sound is currently playing, toggle pause
    if (activeSoundRef.current?.id === sound.id) {
      if (!audio.paused) {
        audio.pause();
        setIsPlaying(false);
      } else {
        audio.play().then(() => setIsPlaying(true)).catch((err) => {
          console.warn("Autoplay was blocked or failed:", err);
        });
      }
      return;
    }

    // New sound
    setActiveSound(sound);
    setCurrentTime(0);
    setDuration(sound.duration || 0);

    // Set initial audio source
    audio.src = sound.audioUrl;
    audio.playbackRate = playbackRate;
    audio.loop = isLooping;
    audio.volume = isMuted ? 0 : volume;

    audio.play()
      .then(() => {
        setIsPlaying(true);
      })
      .catch((err) => {
        console.warn("Audio play blocked or waiting for user interaction:", err);
        // Fallback to proxy route if direct URL rejected
        if (!audio.src.includes("/api/audio/")) {
          audio.src = `/api/audio/${encodeURIComponent(sound.category)}/${encodeURIComponent(sound.filename)}`;
          audio.play().then(() => setIsPlaying(true)).catch((e) => {
            console.error("Secondary play failed:", e);
          });
        }
      });
  }, [playbackRate, isLooping, isMuted, volume]);

  const pauseSound = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  }, []);

  const togglePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || !activeSound) return;

    if (audio.paused) {
      audio.play().then(() => setIsPlaying(true)).catch(console.error);
    } else {
      audio.pause();
      setIsPlaying(false);
    }
  }, [activeSound]);

  const seekTo = useCallback((seconds: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    const clamped = Math.max(0, Math.min(seconds, audio.duration || duration || 0));
    audio.currentTime = clamped;
    setCurrentTime(clamped);
  }, [duration]);

  const setPlaybackRate = useCallback((rate: number) => {
    setRate(rate);
    if (audioRef.current) {
      audioRef.current.playbackRate = rate;
    }
  }, []);

  const toggleLoop = useCallback(() => {
    setIsLooping((prev) => {
      const next = !prev;
      if (audioRef.current) {
        audioRef.current.loop = next;
      }
      return next;
    });
  }, []);

  const setVolume = useCallback((vol: number) => {
    const clamped = Math.max(0, Math.min(1, vol));
    setVolState(clamped);
    if (clamped > 0 && isMuted) {
      setIsMuted(false);
    }
    if (audioRef.current) {
      audioRef.current.volume = clamped;
    }
  }, [isMuted]);

  const toggleMute = useCallback(() => {
    setIsMuted((prev) => {
      const next = !prev;
      if (audioRef.current) {
        audioRef.current.volume = next ? 0 : volume;
      }
      return next;
    });
  }, [volume]);

  return (
    <AudioContext.Provider
      value={{
        activeSound,
        isPlaying,
        currentTime,
        duration,
        playbackRate,
        isLooping,
        volume,
        isMuted,
        error,
        playSound,
        pauseSound,
        togglePlay,
        seekTo,
        setPlaybackRate,
        toggleLoop,
        setVolume,
        toggleMute,
      }}
    >
      {children}
    </AudioContext.Provider>
  );
}

export function useAudio() {
  const context = useContext(AudioContext);
  if (!context) {
    throw new Error("useAudio must be used within an AudioProvider");
  }
  return context;
}
