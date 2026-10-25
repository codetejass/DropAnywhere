"use client";

import React from "react";
import { motion } from "framer-motion";
import { Lock, CloudUpload, ShieldCheck, CheckCircle2 } from "lucide-react";

interface ProgressBarProps {
  encryptionProgress: number; // 0 - 100
  uploadProgress: number;     // 0 - 100
  statusMessage: string;
  isCompleted?: boolean;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  encryptionProgress,
  uploadProgress,
  statusMessage,
  isCompleted = false,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96, y: 15 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.6, -0.05, 0.01, 0.99] }}
      className="w-full max-w-xl mx-auto flex flex-col gap-6 bg-white/90 border border-slate-200/90 p-8 sm:p-10 rounded-[28px] backdrop-blur-2xl shadow-[0_20px_50px_-15px_rgba(15,23,42,0.08)]"
    >
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-violet-50 border border-violet-200 text-violet-600 flex items-center justify-center shadow-sm">
          {isCompleted ? (
            <CheckCircle2 className="w-6 h-6 text-emerald-600" />
          ) : (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 2.5, ease: "linear" }}
            >
              <Lock className="w-5 h-5 text-violet-600" />
            </motion.div>
          )}
        </div>
        <div>
          <h3 className="font-heading text-lg font-bold text-slate-900 tracking-tight">
            {isCompleted ? "Locker Created Successfully" : "Securing & Streaming Files"}
          </h3>
          <p className="text-xs text-violet-600 font-mono mt-0.5 truncate max-w-md">
            {statusMessage}
          </p>
        </div>
      </div>

      {/* Bar 1: Client-Side PBKDF2 & Web Worker Encryption */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
          <span className="flex items-center gap-1.5 text-violet-700">
            <Lock className="w-3.5 h-3.5 text-violet-600" /> 1. Client Zipping &amp; Worker Encryption
          </span>
          <span className="font-mono text-violet-700 font-bold">{Math.round(encryptionProgress)}%</span>
        </div>
        <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden border border-slate-200/80 p-0.5 relative shadow-inner">
          <motion.div
            initial={{ width: "0%" }}
            animate={{ width: `${encryptionProgress}%` }}
            transition={{ ease: [0.16, 1, 0.3, 1], duration: 0.6 }}
            className="h-full rounded-full liquid-shimmer shadow-sm"
          />
        </div>
      </div>

      {/* Bar 2: Direct Network Stream Upload to S3/R2 */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
          <span className="flex items-center gap-1.5 text-indigo-700">
            <CloudUpload className="w-3.5 h-3.5 text-indigo-600" /> 2. Direct S3/R2 Stream Upload
          </span>
          <span className="font-mono text-indigo-700 font-bold">{Math.round(uploadProgress)}%</span>
        </div>
        <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden border border-slate-200/80 p-0.5 relative shadow-inner">
          <motion.div
            initial={{ width: "0%" }}
            animate={{ width: `${uploadProgress}%` }}
            transition={{ ease: [0.16, 1, 0.3, 1], duration: 0.6 }}
            className="h-full rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-violet-500 shadow-sm"
          />
        </div>
      </div>

      <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[11px] text-slate-500">
        <span className="flex items-center gap-1.5 text-emerald-600 font-medium">
          <ShieldCheck className="w-3.5 h-3.5" /> Zero-Knowledge Pipe Active
        </span>
        <span>Please do not close this tab</span>
      </div>
    </motion.div>
  );
};

