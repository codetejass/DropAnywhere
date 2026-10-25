import type { Metadata } from "next";
import { Space_Grotesk, Inter } from "next/font/google";
import "./globals.css";
import { InteractiveBackground } from "@/components/InteractiveBackground";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-heading",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "DropAnywhere | Zero-Knowledge Temporary File Locker",
  description:
    "Securely encrypt, stream, and share files up to 250MB with zero-knowledge browser encryption, on-the-fly zip streaming, and 24-hour auto-wipe.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${spaceGrotesk.variable} ${inter.variable}`}>
      <body className="bg-background text-foreground font-sans antialiased selection:bg-violet-600 selection:text-white min-h-screen">
        {/* Ambient Atmospheric Light Blobs */}
        <div className="ambient-glow-1 pointer-events-none" />
        <div className="ambient-glow-2 pointer-events-none" />
        <div className="ambient-glow-3 pointer-events-none" />
        <div className="noise-texture pointer-events-none" />

        {/* 3D Smooth Interactive Background */}
        <InteractiveBackground />
        
        <div className="relative z-10 min-h-screen flex flex-col">
          {children}
        </div>
      </body>
    </html>
  );
}
