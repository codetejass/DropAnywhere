"use client";

import React from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ReceiverPanel } from "@/components/drop/ReceiverPanel";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

export default function LockerPage() {
  const params = useParams();
  const router = useRouter();
  const code = (params.code as string) || "";

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <Header />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-10 sm:py-14 flex flex-col justify-center">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.6, -0.05, 0.01, 0.99] }}
          className="w-full flex flex-col items-center"
        >
          <div className="text-center mb-8 max-w-xl">
            <span className="text-[11px] font-mono font-semibold uppercase tracking-widest text-violet-700 bg-violet-50 border border-violet-200/90 px-3.5 py-1.5 rounded-full shadow-sm inline-flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-violet-600 animate-pulse" />
              Incoming Payload Handoff
            </span>
            <h2 className="font-heading text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mt-3">
              Unlock Shared Locker
            </h2>
            <p className="text-sm text-slate-600 mt-2">
              Locker <span className="font-mono text-violet-700 font-bold bg-violet-100/70 border border-violet-200 px-2 py-0.5 rounded-lg">{code}</span> detected. Enter the sender&apos;s custom password to decrypt.
            </p>
          </div>

          <div className="w-full">
            <ReceiverPanel initialCode={code} />
          </div>
        </motion.div>
      </main>

      <Footer />
    </div>
  );
}

