import { SoundExplorer } from "@/components/SoundExplorer";
import type { Metadata } from "next";

interface SearchPageProps {
  params: Promise<{ query: string }>;
}

export async function generateMetadata({ params }: SearchPageProps): Promise<Metadata> {
  const { query } = await params;
  const decodedQuery = decodeURIComponent(query);
  const capitalized = decodedQuery.charAt(0).toUpperCase() + decodedQuery.slice(1);
  return {
    title: `Free ${capitalized} Sound Effects — SoundForge SFX`,
    description: `Audition, scrub waveforms, and download free ${decodedQuery} sound effects for videos, games, and motion design.`,
  };
}

export default async function SearchPage({ params }: SearchPageProps) {
  const { query } = await params;
  const decodedQuery = decodeURIComponent(query);
  return <SoundExplorer initialQuery={decodedQuery} />;
}
