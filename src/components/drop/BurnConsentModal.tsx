"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Flame, Check, X } from "lucide-react";

interface BurnConsentModalProps {
  isOpen: boolean;
  onConsent: (consent: boolean) => void;
  fileNameList: string[];
}

export const BurnConsentModal: React.FC<BurnConsentModalProps> = ({
  isOpen,
  onConsent,
  fileNameList,
}) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 16 }}
          transition={{ duration: 0.4, ease: [0.6, -0.05, 0.01, 0.99] }}
          className="w-full max-w-lg bg-white border border-amber-200 rounded-[28px] p-7 sm:p-9 shadow-[0_25px_70px_rgba(245,158,11,0.18)] relative overflow-hidden"
        >
          {/* Top Warning Stripe */}
          <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 p-3 rounded-2xl mb-6 text-amber-800">
            <Flame className="w-5 h-5 flex-shrink-0 text-amber-500 animate-pulse" />
            <span className="text-xs font-bold uppercase tracking-wider font-mono">
              Burn After Reading Protection Active
            </span>
          </div>

          <h3 className="font-heading text-xl sm:text-2xl font-bold text-slate-900 mb-2.5">
            Early Deletion Confirmation
          </h3>

          <p className="text-sm text-slate-600 leading-relaxed mb-4">
            This locker is scheduled for early deletion. Do you want to permanently purge this file from the storage bucket immediately after your download finishes?
          </p>

          {fileNameList.length > 0 && (
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs text-slate-600 mb-6 max-h-28 overflow-y-auto">
              <span className="font-semibold text-slate-800 block mb-1">Enclosed contents:</span>
              <ul className="list-disc list-inside space-y-1">
                {fileNameList.map((name, i) => (
                  <li key={i} className="truncate text-violet-700 font-medium">{name}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onConsent(true)}
              className="flex-1 py-3.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-bold text-xs uppercase tracking-wider shadow-md shadow-amber-500/25 flex items-center justify-center gap-2 transition-all font-heading"
            >
              <Check className="w-4 h-4" />
              <span>Yes, Wipe Immediately</span>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onConsent(false)}
              className="flex-1 py-3.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs uppercase tracking-wider border border-slate-200 flex items-center justify-center gap-2 transition-all font-heading"
            >
              <X className="w-4 h-4" />
              <span>No, Keep Until 24h Expiry</span>
            </motion.button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

