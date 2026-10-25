"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { NotepadRoom } from "@/components/notes/NotepadRoom";
import { NotepadEditor } from "@/components/notes/NotepadEditor";

const heroVariants = {
  hidden: { opacity: 0, y: 18 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.65, ease: [0.6, -0.05, 0.01, 0.99] },
  },
};

function NotesContent() {
  const searchParams = useSearchParams();
  const roomParam = searchParams.get("room") || "";

  const [joined, setJoined] = useState(false);
  const [roomCode, setRoomCode] = useState(roomParam);
  const [password, setPassword] = useState("");

  useEffect(() => {
    if (roomParam) {
      setRoomCode(roomParam.toUpperCase().replace(/[^A-Z0-9-]/g, ""));
    }
  }, [roomParam]);

  const handleJoin = (code: string, pass: string) => {
    setRoomCode(code);
    setPassword(pass);
    setJoined(true);
  };

  const handleLeave = () => {
    setJoined(false);
    setRoomCode("");
    setPassword("");
  };

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <Header />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-8 sm:py-12 flex flex-col">
        <motion.div
          variants={{
            hidden: { opacity: 0 },
            visible: {
              opacity: 1,
              transition: { staggerChildren: 0.12, delayChildren: 0.05 },
            },
          }}
          initial="hidden"
          animate="visible"
          className="w-full flex flex-col items-center flex-1"
        >
          {/* Hero Section (only when not joined) */}
          {!joined && (
            <motion.div variants={heroVariants} className="text-center mb-8 max-w-xl">
              <span className="text-[11px] font-mono font-semibold uppercase tracking-widest text-indigo-700 bg-indigo-50 border border-indigo-200/90 px-3.5 py-1.5 rounded-full shadow-sm inline-flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-pulse" />
                Real-Time · Zero-Knowledge Suite
              </span>
              <h2 className="font-heading text-3xl sm:text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight mt-3">
                Encrypted Notes & Canvas
              </h2>
              <p className="text-sm text-slate-600 mt-2 leading-relaxed">
                Real-time collaborative notes and drawing, secured by a true zero-knowledge architecture. Every word and stroke is encrypted directly in your browser.
              </p>
            </motion.div>
          )}

          {/* Content View */}
          <motion.div variants={heroVariants} className="w-full flex-1 flex flex-col">
            {!joined ? (
              <NotepadRoom initialRoomCode={roomCode} onJoin={handleJoin} />
            ) : (
              <NotepadEditor
                roomCode={roomCode}
                password={password}
                onLeave={handleLeave}
              />
            )}
          </motion.div>
        </motion.div>
      </main>

      <Footer />
    </div>
  );
}

export default function NotesPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-slate-400 font-mono text-xs">Loading Secure Room...</div>}>
      <NotesContent />
    </Suspense>
  );
}
