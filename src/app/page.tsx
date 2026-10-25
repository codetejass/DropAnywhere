"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { FolderLock, NotebookPen, ShieldCheck, ArrowRight } from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

const pageVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.1,
    },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 28, scale: 0.96 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.7,
      ease: [0.6, -0.05, 0.01, 0.99],
    },
  },
};

const heroVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.65,
      ease: [0.6, -0.05, 0.01, 0.99],
    },
  },
};

export default function DashboardPage() {
  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-16 sm:py-24 flex flex-col justify-center items-center">
        <motion.div
          variants={pageVariants}
          initial="hidden"
          animate="visible"
          className="w-full flex flex-col items-center"
        >
          {/* Hero Section */}
          <motion.div variants={heroVariants} className="text-center mb-14 max-w-2xl">
            <span className="text-[11px] font-mono font-semibold uppercase tracking-widest text-violet-700 bg-violet-50 border border-violet-200/90 px-3.5 py-1.5 rounded-full shadow-sm inline-flex items-center gap-1.5 mb-4">
              <span className="w-1.5 h-1.5 rounded-full bg-violet-600 animate-pulse" />
              The Zero-Knowledge Workspace
            </span>
            <h1 className="font-heading text-4xl sm:text-5xl md:text-6xl font-extrabold text-slate-900 tracking-tight mt-2 leading-[1.1]">
              Your Data,{" "}
              <span className="bg-gradient-to-r from-violet-600 via-indigo-600 to-violet-700 bg-clip-text text-transparent">
                Your Keys
              </span>
            </h1>
            <p className="text-base text-slate-600 mt-4 leading-relaxed max-w-xl mx-auto">
              Your secrets remain strictly yours. All encryption happens locally on your device, leaving absolutely no trace on our servers. Select a tool to get started.
            </p>
            <div className="flex items-center justify-center gap-1.5 mt-3 text-xs text-emerald-700 font-medium">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>End-to-end encrypted · Uncompromised Digital Privacy</span>
            </div>
          </motion.div>

          {/* Tool Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-3xl">
            {/* File Drop Card */}
            <motion.div variants={cardVariants}>
              <Link href="/drop" className="group block">
                <div className="relative h-full bg-white/80 border border-slate-200/90 rounded-[28px] p-8 backdrop-blur-2xl shadow-[0_15px_40px_-10px_rgba(15,23,42,0.07)] hover:shadow-[0_20px_60px_-10px_rgba(124,58,237,0.15)] hover:border-violet-300 transition-all duration-300 overflow-hidden cursor-pointer">
                  {/* Glassmorphism glow */}
                  <div className="absolute top-0 right-0 w-48 h-48 bg-violet-500/5 rounded-full blur-3xl pointer-events-none group-hover:bg-violet-500/10 transition-all duration-500" />
                  <div className="absolute bottom-0 left-0 w-36 h-36 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />

                  <div className="relative z-10">
                    {/* Icon */}
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-100 to-indigo-100 border border-violet-200/80 flex items-center justify-center text-violet-600 shadow-sm mb-6 group-hover:shadow-[0_0_20px_rgba(124,58,237,0.2)] transition-all duration-300">
                      <FolderLock className="w-7 h-7" />
                    </div>

                    {/* Content */}
                    <h2 className="font-heading text-2xl font-extrabold text-slate-900 tracking-tight mb-2 group-hover:text-violet-900 transition-colors">
                      Secure File Drop
                    </h2>
                    <p className="text-sm text-slate-600 leading-relaxed mb-6">
                      Seamlessly encrypt up to 250MB in your browser. Generate a secure 6-digit code or QR link for instant sharing. All files are permanently wiped from the cloud after 24 hours.
                    </p>

                    {/* Feature pills */}
                    <div className="flex flex-wrap gap-2 mb-6">
                      {["AES-GCM Encryption", "24h Auto-wipe", "Burn Mode"].map((feat) => (
                        <span
                          key={feat}
                          className="text-[10px] font-mono font-semibold text-violet-700 bg-violet-50 border border-violet-200/80 px-2.5 py-1 rounded-full"
                        >
                          {feat}
                        </span>
                      ))}
                    </div>

                    {/* CTA */}
                    <div className="flex items-center gap-2 text-sm font-semibold text-violet-700 group-hover:text-violet-800 transition-colors">
                      <span>Open File Drop</span>
                      <motion.div
                        animate={{ x: 0 }}
                        whileHover={{ x: 4 }}
                        className="transition-transform"
                      >
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-200" />
                      </motion.div>
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>

            {/* Encrypted Notepad Card */}
            <motion.div variants={cardVariants}>
              <Link href="/notes" className="group block">
                <div className="relative h-full bg-white/80 border border-slate-200/90 rounded-[28px] p-8 backdrop-blur-2xl shadow-[0_15px_40px_-10px_rgba(15,23,42,0.07)] hover:shadow-[0_20px_60px_-10px_rgba(99,102,241,0.15)] hover:border-indigo-300 transition-all duration-300 overflow-hidden cursor-pointer">
                  {/* Glassmorphism glow */}
                  <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none group-hover:bg-indigo-500/10 transition-all duration-500" />
                  <div className="absolute bottom-0 left-0 w-36 h-36 bg-violet-500/5 rounded-full blur-3xl pointer-events-none" />

                  <div className="relative z-10">
                    {/* Icon */}
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-100 to-violet-100 border border-indigo-200/80 flex items-center justify-center text-indigo-600 shadow-sm mb-6 group-hover:shadow-[0_0_20px_rgba(99,102,241,0.2)] transition-all duration-300">
                      <NotebookPen className="w-7 h-7" />
                    </div>

                    {/* Content */}
                    <h2 className="font-heading text-2xl font-extrabold text-slate-900 tracking-tight mb-2 group-hover:text-indigo-900 transition-colors">
                      Encrypted Notepad
                    </h2>
                    <p className="text-sm text-slate-600 leading-relaxed mb-6">
                      Real-time collaborative notepad where all text is encrypted in a Web Worker before transmission. The server is blind — it only relays ciphertext. Share a room code and password to collaborate securely.
                    </p>

                    {/* Feature pills */}
                    <div className="flex flex-wrap gap-2 mb-6">
                      {["Real-time Sync", "E2E Encrypted", "Web Worker", "Zero-Knowledge"].map((feat) => (
                        <span
                          key={feat}
                          className="text-[10px] font-mono font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200/80 px-2.5 py-1 rounded-full"
                        >
                          {feat}
                        </span>
                      ))}
                    </div>

                    {/* CTA */}
                    <div className="flex items-center gap-2 text-sm font-semibold text-indigo-700 group-hover:text-indigo-800 transition-colors">
                      <span>Open Notepad</span>
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-200" />
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          </div>

          {/* Bottom tagline */}
          <motion.p
            variants={heroVariants}
            className="text-xs text-slate-400 mt-10 text-center font-mono"
          >
            Open source · No telemetry · Keys never leave your browser
          </motion.p>
        </motion.div>
      </main>
      <Footer />
    </div>
  );
}
