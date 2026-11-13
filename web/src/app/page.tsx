import { SoundExplorer } from "@/components/SoundExplorer";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "SoundForge SFX — 1,400+ Royalty-Free Sound Effects Library",
  description: "Audition, scrub waveforms, and download 1,400+ high-quality royalty-free sound effects for videos, games, and motion design.",
};

export default function HomePage() {
  return <SoundExplorer initialQuery="" />;
}
