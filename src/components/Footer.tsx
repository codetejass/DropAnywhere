"use client";

import React from "react";
import { Shield, Zap, Clock } from "lucide-react";

export const Footer: React.FC = () => {
  return (
    <footer className="w-full border-t border-slate-200/80 bg-white/70 backdrop-blur-xl py-6 mt-auto">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-500">
        <div className="flex items-center gap-3">
          <div className="font-mono text-[11px] text-slate-600 font-medium">
            <span>DropAnywhere &bull; Zero Server Storage of Keys</span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-[11px] font-mono">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 border border-slate-200/80 text-slate-600">
            <Shield className="w-3 h-3 text-emerald-600" />
            <span>Client-Side Encryption</span>
          </span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 border border-slate-200/80 text-slate-600">
            <Zap className="w-3 h-3 text-violet-600" />
            <span>Direct Stream</span>
          </span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 border border-slate-200/80 text-slate-600">
            <Clock className="w-3 h-3 text-amber-600" />
            <span>24h Auto-Wipe</span>
          </span>
        </div>
      </div>
    </footer>
  );
};
