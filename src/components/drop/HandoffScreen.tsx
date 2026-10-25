"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import QRCode from "qrcode";
import { Copy, Check, QrCode, Lock, Flame, Clock, Share2, RefreshCw, KeyRound } from "lucide-react";

interface HandoffScreenProps {
  code: string;
  burnAfterReading: boolean;
  expiresAt: number;
  originalFileNames: string[];
  totalSize: number;
  onReset: () => void;
}

export const HandoffScreen: React.FC<HandoffScreenProps> = ({
  code,
  burnAfterReading,
  expiresAt,
  originalFileNames,
  totalSize,
  onReset,
}) => {
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>("");
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [shareUrl, setShareUrl] = useState<string>("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const url = `${window.location.origin}/drop/locker/${code}`;
      setShareUrl(url);

      QRCode.toDataURL(url, {
        width: 240,
        margin: 2,
        color: {
          dark: "#6D28D9", // Deep violet tone
          light: "#FFFFFF", // Clean crisp background
        },
      })
        .then((dataUrl) => setQrCodeDataUrl(dataUrl))
        .catch((err) => console.error("QR Code Error:", err));
    }
  }, [code]);

  const copyCodeToClipboard = () => {
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const copyLinkToClipboard = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.6, -0.05, 0.01, 0.99] }}
      className="w-full max-w-2xl mx-auto flex flex-col gap-7 bg-white/90 border border-slate-200/90 p-8 sm:p-10 rounded-[30px] backdrop-blur-2xl shadow-[0_20px_60px_-15px_rgba(15,23,42,0.08)] relative overflow-hidden"
    >
      {/* Background Soft Glow Auras */}
      <div className="absolute top-0 right-0 w-72 h-72 bg-violet-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-72 h-72 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header Banner */}
      <div className="text-center flex flex-col items-center gap-2">
        <span className="px-3.5 py-1 rounded-full bg-violet-50 border border-violet-200 text-violet-700 font-semibold text-xs uppercase tracking-widest flex items-center gap-1.5 font-mono shadow-sm">
          <Lock className="w-3.5 h-3.5 text-violet-600" /> Locker Created &amp; Sealed
        </span>
        <h2 className="font-heading text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
          Ready for Instant Handoff
        </h2>
        <p className="text-xs sm:text-sm text-slate-600 max-w-md">
          Provide this 6-digit code or share the direct link with the receiver.
        </p>
      </div>

      {/* 6-Digit Code Staggered Entrance Display */}
      <div className="flex flex-col items-center justify-center bg-slate-50/90 border border-slate-200/80 rounded-[24px] p-6 sm:p-7 relative shadow-inner">
        <span className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider mb-2 font-mono">
          Access Code
        </span>

        <div className="flex items-center gap-2 sm:gap-3.5 my-2">
          {code.split("").map((char, index) => (
            <motion.div
              key={index}
              initial={{ scale: 0.4, opacity: 0, y: 16 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              transition={{
                delay: 0.15 + index * 0.08,
                type: "spring",
                stiffness: 420,
                damping: 24,
              }}
              className="w-11 h-14 sm:w-14 sm:h-18 bg-white border-2 border-violet-200 rounded-2xl flex items-center justify-center font-mono font-extrabold text-2xl sm:text-4xl text-violet-700 shadow-sm select-all hover:border-violet-400 transition-colors"
            >
              {char}
            </motion.div>
          ))}
        </div>

        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={copyCodeToClipboard}
          className="mt-4 flex items-center gap-2 px-4 py-2 rounded-xl bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 border border-slate-200 shadow-sm transition-colors"
        >
          {copiedCode ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-600" />
              <span className="text-emerald-600 font-medium">Code Copied</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5 text-violet-600" />
              <span>Copy Code</span>
            </>
          )}
        </motion.button>
      </div>

      {/* Password Security Reminder Box */}
      <div className="flex items-center gap-3 bg-violet-50/80 border border-violet-200/90 p-4 rounded-2xl text-xs text-violet-900 backdrop-blur-md">
        <KeyRound className="w-5 h-5 flex-shrink-0 text-violet-600" />
        <span>
          <strong>Password Security:</strong> Share your custom encryption password with the receiver separately. The password was processed strictly in your browser and was never sent to the server.
        </span>
      </div>

      {/* QR Code & Share Link Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center bg-slate-50/90 border border-slate-200/80 p-6 rounded-[24px]">
        {/* Soft Glowing QR Code */}
        <div className="flex flex-col items-center justify-center text-center gap-2 border-b md:border-b-0 md:border-r border-slate-200/80 pb-6 md:pb-0 md:pr-6">
          <div className="p-3 bg-white rounded-2xl border border-slate-200 shadow-sm">
            {qrCodeDataUrl ? (
              <img src={qrCodeDataUrl} alt="Locker QR Code" className="w-36 h-36 rounded-xl" />
            ) : (
              <div className="w-36 h-36 bg-slate-100 animate-pulse rounded-xl" />
            )}
          </div>
          <span className="text-xs text-slate-500 font-medium flex items-center gap-1.5 mt-2">
            <QrCode className="w-3.5 h-3.5 text-violet-600" /> Scan for mobile handoff
          </span>
        </div>

        {/* Share Link Details */}
        <div className="flex flex-col gap-3.5">
          <div>
            <h4 className="text-sm font-bold text-slate-900 flex items-center gap-1.5 font-heading">
              <Share2 className="w-4 h-4 text-violet-600" /> Shareable URL
            </h4>
            <p className="text-xs text-slate-500 mt-0.5">
              Direct access link to locker access portal.
            </p>
          </div>

          <div className="p-2.5 bg-white rounded-xl border border-slate-200 shadow-sm flex items-center justify-between gap-2">
            <span className="text-xs font-mono text-violet-700 truncate max-w-[190px]">
              {shareUrl}
            </span>
            <button
              onClick={copyLinkToClipboard}
              className="p-1.5 rounded-lg bg-violet-50 hover:bg-violet-100 text-violet-700 border border-violet-200/60 transition-colors flex-shrink-0"
              title="Copy locker link"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>

          <div className="flex flex-col gap-1.5 text-xs text-slate-500">
            <div className="flex items-center gap-2">
              <Clock className="w-3.5 h-3.5 text-amber-500" />
              <span>Auto-deletes in 24 hours</span>
            </div>
            {burnAfterReading && (
              <div className="flex items-center gap-2 text-amber-600 font-semibold">
                <Flame className="w-3.5 h-3.5" />
                <span>Burn After Reading Active</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Action Footer */}
      <div className="flex items-center justify-between pt-2 border-t border-slate-100">
        <div className="text-xs text-slate-500">
          Enclosed: <span className="text-slate-800 font-semibold">{originalFileNames.length} {originalFileNames.length === 1 ? "file" : "files"} ({formatSize(totalSize)})</span>
        </div>

        <button
          onClick={onReset}
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-700 border border-slate-200 transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Send Another File
        </button>
      </div>
    </motion.div>
  );
};

