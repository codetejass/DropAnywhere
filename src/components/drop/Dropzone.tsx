"use client";

import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { UploadCloud, File, Trash2, Flame, AlertCircle, Lock, Plus, Key, Eye, EyeOff } from "lucide-react";
import { SaveKeyWarningModal } from "@/components/SaveKeyWarningModal";

interface DropzoneProps {
  files: File[];
  setFiles: React.Dispatch<React.SetStateAction<File[]>>;
  password: string;
  setPassword: (val: string) => void;
  burnAfterReading: boolean;
  setBurnAfterReading: (val: boolean) => void;
  onStartUpload: () => void;
  maxSizeBytes?: number; // Default 250MB
}

const listContainerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.07,
    },
  },
};

const listItemVariants = {
  hidden: { opacity: 0, y: 14, scale: 0.96 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 450,
      damping: 30,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.92,
    y: -8,
    transition: { duration: 0.2 },
  },
};

export const Dropzone: React.FC<DropzoneProps> = ({
  files,
  setFiles,
  password,
  setPassword,
  burnAfterReading,
  setBurnAfterReading,
  onStartUpload,
  maxSizeBytes = 250 * 1024 * 1024,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showKeyWarningModal, setShowKeyWarningModal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const totalBytes = files.reduce((acc, f) => acc + f.size, 0);

  const formatSize = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const addFiles = (newFiles: FileList | File[]) => {
    setErrorMessage(null);
    const addedArray = Array.from(newFiles);
    
    const pendingFiles = [...files, ...addedArray];
    const newTotal = pendingFiles.reduce((acc, f) => acc + f.size, 0);

    if (newTotal > maxSizeBytes) {
      setErrorMessage(`Total payload exceeds 250MB limit (${formatSize(newTotal)})`);
      return;
    }

    setFiles(pendingFiles);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      addFiles(e.dataTransfer.files);
    }
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleCreateLocker = () => {
    if (files.length === 0) {
      setErrorMessage("Please select at least one file");
      return;
    }
    if (!password || password.trim().length < 4) {
      setErrorMessage("Please set an encryption password (at least 4 characters)");
      return;
    }
    setErrorMessage(null);
    setShowKeyWarningModal(true);
  };

  const handleConfirmAndUpload = () => {
    setShowKeyWarningModal(false);
    onStartUpload();
  };

  return (
    <div className="w-full max-w-xl mx-auto flex flex-col gap-6">
      {/* Interactive Minimalist Target Dropzone */}
      <motion.div
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.995 }}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`relative rounded-[28px] p-8 sm:p-12 text-center cursor-pointer transition-all duration-300 backdrop-blur-2xl flex flex-col items-center justify-center min-h-[290px] overflow-hidden ${
          isDragOver
            ? "border-2 border-violet-500 bg-violet-50/90 shadow-[0_0_40px_rgba(124,58,237,0.18)] scale-[1.015]"
            : "border border-slate-200/90 hover:border-violet-400 bg-white/80 hover:bg-white/95 shadow-[0_15px_40px_-10px_rgba(15,23,42,0.06),0_0_0_1px_rgba(255,255,255,0.9)_inset]"
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={(e) => {
            if (e.target.files) addFiles(e.target.files);
          }}
        />

        {/* Minimalist Radar Target Circles */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div
            className={`w-64 h-64 rounded-full border border-violet-400/20 transition-transform duration-500 ${
              isDragOver ? "scale-110 border-violet-500/40" : "scale-100"
            }`}
          />
          <div
            className={`absolute w-96 h-96 rounded-full border border-indigo-400/15 transition-transform duration-700 ${
              isDragOver ? "scale-115 border-indigo-500/30" : "scale-100"
            }`}
          />
        </div>

        {/* Ambient Subtle Violet Glow */}
        <div
          className={`absolute inset-0 bg-gradient-to-b from-violet-500/[0.04] via-transparent to-indigo-500/[0.03] transition-opacity duration-300 pointer-events-none ${
            isDragOver ? "opacity-100" : "opacity-40"
          }`}
        />

        <div className="relative z-10 flex flex-col items-center gap-4">
          {/* Target Icon with Spring Scale */}
          <motion.div
            animate={{
              scale: isDragOver ? 1.15 : 1,
              y: isDragOver ? -3 : 0,
            }}
            transition={{
              type: "spring",
              stiffness: 350,
              damping: 22,
            }}
            className="w-18 h-18 rounded-2xl bg-gradient-to-br from-violet-100 to-indigo-100 border border-violet-200/80 flex items-center justify-center text-violet-600 shadow-sm"
          >
            <UploadCloud className="w-9 h-9" />
          </motion.div>

          <div className="space-y-1">
            <h3 className="font-heading text-xl font-bold tracking-tight text-slate-900">
              {isDragOver ? "Drop to load container" : "Drag and drop files here"}
            </h3>
            <p className="text-sm text-slate-500">
              or <span className="text-violet-600 font-semibold hover:underline">browse from device</span>
            </p>
          </div>

          <div className="flex items-center gap-2.5 text-xs text-slate-600 bg-slate-100/90 border border-slate-200/90 px-4 py-1.5 rounded-full font-mono mt-1 shadow-sm">
            <span>Zip Stream</span>
            <span>&bull;</span>
            <span>Up to 250 MB</span>
          </div>
        </div>
      </motion.div>

      {/* Error Notice */}
      {errorMessage && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-2xl text-xs backdrop-blur-md shadow-sm"
        >
          <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-500" />
          <span>{errorMessage}</span>
        </motion.div>
      )}

      {/* Sequential Spring Stagger File List */}
      {files.length > 0 && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="flex flex-col gap-3 bg-white/85 border border-slate-200/90 rounded-[24px] p-5 backdrop-blur-xl shadow-[0_10px_30px_-10px_rgba(15,23,42,0.05)]"
        >
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 uppercase tracking-wider px-1">
            <span>Queued Files ({files.length})</span>
            <span className="text-violet-600 font-mono font-medium">{formatSize(totalBytes)} / 250 MB</span>
          </div>

          <motion.div
            variants={listContainerVariants}
            initial="hidden"
            animate="show"
            className="max-h-52 overflow-y-auto flex flex-col gap-2 pr-1"
          >
            <AnimatePresence>
              {files.map((file, idx) => (
                <motion.div
                  key={`${file.name}-${idx}`}
                  variants={listItemVariants}
                  exit="exit"
                  className="flex items-center justify-between bg-slate-50/90 border border-slate-200/80 p-3 rounded-xl text-sm hover:border-violet-300 hover:bg-violet-50/30 transition-colors group"
                >
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div className="w-8 h-8 rounded-lg bg-violet-100 border border-violet-200 text-violet-600 flex items-center justify-center flex-shrink-0">
                      <File className="w-4 h-4" />
                    </div>
                    <div className="truncate">
                      <p className="font-medium text-slate-800 truncate group-hover:text-slate-950 transition-colors">
                        {file.name}
                      </p>
                      <p className="text-xs text-slate-500 font-mono">{formatSize(file.size)}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => removeFile(idx)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>

          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center justify-center gap-2 py-2 text-xs font-semibold text-slate-500 hover:text-violet-600 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" /> Add More Files
          </button>
        </motion.div>
      )}

      {/* Password Control Box */}
      <div className="flex flex-col gap-2.5 bg-white/85 border border-slate-200/90 p-5 rounded-[24px] backdrop-blur-xl shadow-[0_10px_30px_-10px_rgba(15,23,42,0.05)]">
        <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider flex items-center gap-1.5 font-heading">
          <Key className="w-3.5 h-3.5 text-violet-600" /> Set Custom Password
        </label>
        <p className="text-xs text-slate-500">
          Sender&apos;s secret key.
        </p>

        <div className="relative mt-1">
          <input
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter a secret password"
            className="w-full bg-slate-50 border border-slate-200 focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10 rounded-xl px-4 py-3 text-sm text-slate-900 placeholder-slate-400 focus:outline-none transition-all shadow-inner"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-700 transition-colors"
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Bespoke Spring-Based "Burn After Reading" Toggle */}
      <div className="flex items-center justify-between bg-white/85 border border-slate-200/90 p-5 rounded-[24px] backdrop-blur-xl shadow-[0_10px_30px_-10px_rgba(15,23,42,0.05)]">
        <div className="flex items-center gap-3.5">
          <div
            className={`p-2.5 rounded-xl transition-colors duration-300 ${
              burnAfterReading
                ? "bg-amber-100 text-amber-600 border border-amber-300/80"
                : "bg-slate-100 text-slate-400 border border-slate-200"
            }`}
          >
            <Flame className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-slate-900 font-heading flex items-center gap-2">
              Burn After Reading
            </h4>
            <p className="text-xs text-slate-500 max-w-[280px]">
              Destroys all files and records the instant the download completes.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setBurnAfterReading(!burnAfterReading)}
          className={`relative rounded-full transition-colors duration-300 p-0.5 focus:outline-none focus:ring-2 focus:ring-amber-500/20 shadow-sm ${
            burnAfterReading
              ? "bg-gradient-to-r from-amber-500 to-orange-500 shadow-[0_2px_12px_rgba(245,158,11,0.3)]"
              : "bg-slate-200 border border-slate-300"
          }`}
          style={{ width: "52px", height: "28px" }}
        >
          <motion.div
            animate={{ x: burnAfterReading ? 24 : 2 }}
            transition={{ type: "spring", stiffness: 600, damping: 35 }}
            className="w-5 h-5 rounded-full bg-white shadow-md flex items-center justify-center text-[10px]"
          >
            {burnAfterReading && <span className="leading-none select-none">🔥</span>}
          </motion.div>
        </button>
      </div>

      {/* Shimmering Primary Action Button */}
      {files.length > 0 && (
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          whileHover={{ scale: 1.015 }}
          whileTap={{ scale: 0.985 }}
          onClick={handleCreateLocker}
          className="shimmer-btn w-full py-4 rounded-2xl bg-gradient-to-r from-violet-600 via-indigo-600 to-violet-700 text-white font-bold text-base shadow-[0_10px_30px_rgba(124,58,237,0.25)] flex items-center justify-center gap-2.5 hover:shadow-[0_15px_40px_rgba(124,58,237,0.35)] transition-all duration-300 font-heading"
        >
          <Lock className="w-4 h-4" />
          <span>Encrypt &amp; Create Locker ({files.length} {files.length === 1 ? "file" : "files"})</span>
        </motion.button>
      )}

      {/* Save Key Warning Confirmation Modal */}
      <SaveKeyWarningModal
        isOpen={showKeyWarningModal}
        mode="locker"
        password={password}
        onConfirm={handleConfirmAndUpload}
        onCancel={() => setShowKeyWarningModal(false)}
      />
    </div>
  );
};

