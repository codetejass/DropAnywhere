"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShieldAlert,
  AlertTriangle,
  KeyRound,
  Copy,
  Check,
  Eye,
  EyeOff,
  ArrowRight,
  X,
  Lock,
} from "lucide-react";

interface SaveKeyWarningModalProps {
  isOpen: boolean;
  mode: "locker" | "room";
  password: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export const SaveKeyWarningModal: React.FC<SaveKeyWarningModalProps> = ({
  isOpen,
  mode,
  password,
  onConfirm,
  onCancel,
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const [copied, setCopied] = useState(false);
  const [acknowledged, setAcknowledged] = useState(false);

  if (!isOpen) return null;

  const handleCopyPassword = () => {
    if (navigator?.clipboard && password) {
      navigator.clipboard.writeText(password);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const isLocker = mode === "locker";

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 16 }}
          transition={{ duration: 0.35, ease: [0.6, -0.05, 0.01, 0.99] }}
          className="w-full max-w-lg bg-white border border-amber-200 rounded-[28px] p-7 sm:p-9 shadow-[0_25px_70px_rgba(245,158,11,0.18)] relative overflow-hidden"
        >
          {/* Top Warning Banner */}
          <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 p-3 rounded-2xl mb-6 text-amber-800">
            <AlertTriangle className="w-5 h-5 flex-shrink-0 text-amber-500 animate-pulse" />
            <span className="text-xs font-bold uppercase tracking-wider font-mono">
              Zero-Knowledge Security Notice
            </span>
          </div>

          {/* Heading */}
          <h3 className="font-heading text-xl sm:text-2xl font-bold text-slate-900 mb-2">
            Save Your Password &amp; Unique ID
          </h3>

          {/* Core Warning Prose */}
          <div className="text-xs sm:text-sm text-slate-600 leading-relaxed space-y-2 mb-5">
            <p>
              Due to our strict <strong>Zero-Knowledge architecture</strong>, encryption keys are derived entirely within your browser and are <strong>never stored on our servers</strong>.
            </p>
            <p className="bg-amber-50/70 border border-amber-200/80 p-3 rounded-xl text-amber-950 font-medium">
              ⚠️ If you lose your password or unique {isLocker ? "access code" : "Room ID"}, <strong>it CANNOT be recovered, reset, or retrieved</strong> by anyone, including the DropAnywhere team.
            </p>
          </div>

          {/* Password Quick-Copy & Verify Box */}
          <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-4 mb-5 flex flex-col gap-2">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-600">
              <span className="flex items-center gap-1.5 font-heading">
                <KeyRound className="w-3.5 h-3.5 text-indigo-600" />
                {isLocker ? "Locker Encryption Password" : "Master Room Password"}
              </span>
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-[11px] text-slate-500 hover:text-slate-800 flex items-center gap-1 font-mono"
              >
                {showPassword ? (
                  <>
                    <EyeOff className="w-3.5 h-3.5" /> Hide
                  </>
                ) : (
                  <>
                    <Eye className="w-3.5 h-3.5" /> Reveal
                  </>
                )}
              </button>
            </div>

            <div className="flex items-center justify-between gap-2 bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 shadow-sm">
              <span className="font-mono text-sm font-bold text-slate-900 truncate">
                {showPassword ? password : "•".repeat(Math.min(password.length, 18))}
              </span>

              <button
                type="button"
                onClick={handleCopyPassword}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold border border-indigo-200 transition-colors flex-shrink-0"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-emerald-700">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Password</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Acknowledgment Checkbox */}
          <label className="flex items-start gap-3 cursor-pointer select-none mb-6 group">
            <input
              type="checkbox"
              checked={acknowledged}
              onChange={(e) => setAcknowledged(e.target.checked)}
              className="mt-0.5 w-4 h-4 rounded text-indigo-600 border-slate-300 focus:ring-indigo-500 transition-colors cursor-pointer"
            />
            <span className="text-xs text-slate-700 group-hover:text-slate-900 leading-snug">
              I have saved my password and understand that if lost, the payload cannot be retrieved or recovered.
            </span>
          </label>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <motion.button
              whileHover={{ scale: acknowledged ? 1.02 : 1 }}
              whileTap={{ scale: acknowledged ? 0.98 : 1 }}
              type="button"
              disabled={!acknowledged}
              onClick={onConfirm}
              className="flex-1 py-3.5 px-4 rounded-xl bg-gradient-to-r from-indigo-600 via-violet-600 to-indigo-700 disabled:opacity-45 text-white font-bold text-xs uppercase tracking-wider shadow-md shadow-indigo-500/25 flex items-center justify-center gap-2 transition-all font-heading"
            >
              <Lock className="w-4 h-4" />
              <span>I&apos;ve Saved It, Proceed</span>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="button"
              onClick={onCancel}
              className="px-5 py-3.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs uppercase tracking-wider border border-slate-200 flex items-center justify-center gap-1.5 transition-all font-heading"
            >
              <X className="w-4 h-4" />
              <span>Go Back</span>
            </motion.button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

