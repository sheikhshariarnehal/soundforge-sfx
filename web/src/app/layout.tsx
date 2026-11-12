import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SoundForge SFX — 1,400+ Free Royalty-Free Sound Effects",
  description: "Instant audition, scrubbable waveforms, and 1-click downloads for 1,417 curated sound effects across 47 categories. Powered by Cloudflare R2.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="bg-studio-bg text-studio-text min-h-screen flex flex-col antialiased selection:bg-studio-cyan selection:text-black">
        {children}
      </body>
    </html>
  );
}
