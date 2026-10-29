"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import JSZip from "jszip";
import { Unlock, Key, Download, ShieldCheck, Flame, CheckCircle2, AlertCircle, Loader2, Eye, EyeOff, FileArchive, File } from "lucide-react";
import { decryptZipWithWorker } from "@/lib/crypto";
import { getApiUrl } from "@/lib/apiConfig";
import { BurnConsentModal } from "./BurnConsentModal";

interface ReceiverPanelProps {
  initialCode?: string;
}

interface LockerMeta {
  code: string;
  salt: string;
  burnAfterReading: boolean;
  originalFileNames: string[];
  fileCount: number;
  totalSize: number;
  expiresAt: number;
}

export const ReceiverPanel: React.FC<ReceiverPanelProps> = ({
  initialCode = "",
}) => {
  const [code, setCode] = useState<string>(initialCode);
  const [password, setPassword] = useState<string>("");
  const [showPassword, setShowPassword] = useState(false);

  const [isLoadingMeta, setIsLoadingMeta] = useState(false);
  const [meta, setMeta] = useState<LockerMeta | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Consent modal state
  const [showConsentModal, setShowConsentModal] = useState(false);
  const [userConsentedBurn, setUserConsentedBurn] = useState<boolean | null>(null);

  // Download & Decryption progress state
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadStep, setDownloadStep] = useState<string>("");
  const [decryptionProgress, setDecryptionProgress] = useState<number>(0);
  const [downloadCompleted, setDownloadCompleted] = useState(false);
  const [downloadedZipBlob, setDownloadedZipBlob] = useState<Blob | null>(null);
  const [extractedFiles, setExtractedFiles] = useState<{ name: string; blob: Blob }[]>([]);

  // Fetch Locker Metadata from server
  const fetchMetadata = async () => {
    if (!code || code.trim().length !== 6) {
      setErrorMessage("Please enter a valid 6-digit locker code");
      return;
    }

    setErrorMessage(null);
    setIsLoadingMeta(true);

    try {
      const res = await fetch(getApiUrl(`/api/locker/${code.toUpperCase().trim()}`));
      const data = await res.json();

      if (!res.ok || !data.success) {
        setErrorMessage(data.error || "Locker not found or expired");
        setMeta(null);
      } else {
        setMeta(data);
        if (data.burnAfterReading && userConsentedBurn === null) {
          setShowConsentModal(true);
        }
      }
    } catch {
      setErrorMessage("Network error while connecting to locker");
    } finally {
      setIsLoadingMeta(false);
    }
  };

  const handleConsentResponse = (consented: boolean) => {
    setUserConsentedBurn(consented);
    setShowConsentModal(false);
  };

  const executeDownloadAndDecrypt = async () => {
    if (!meta) return;
    if (!password || password.trim() === "") {
      setErrorMessage("Password is required to derive AES-GCM key");
      return;
    }

    setErrorMessage(null);
    setIsDownloading(true);
    setDownloadStep("Downloading encrypted payload stream from server...");
    setDecryptionProgress(15);

    try {
      // Step 1: Download raw encrypted stream
      const res = await fetch(getApiUrl(`/api/download/${meta.code}`));
      if (!res.ok) {
        throw new Error("Failed to download encrypted stream from server");
      }

      setDownloadStep("Buffering binary payload for Web Worker...");
      setDecryptionProgress(30);

      const encryptedArrayBuffer = await res.arrayBuffer();

      // Step 2: Decrypt with Web Worker
      setDownloadStep("Deriving key & decrypting via Web Worker...");
      setDecryptionProgress(45);

      const decryptedZipBuffer = await decryptZipWithWorker(
        encryptedArrayBuffer,
        password.trim(),
        meta.salt,
        (percent, status) => {
          setDownloadStep(status);
          setDecryptionProgress(45 + Math.round(percent * 0.45));
        }
      );

      const zipBlob = new Blob([decryptedZipBuffer], { type: "application/zip" });
      setDownloadedZipBlob(zipBlob);

      // Step 3: Parse zip to extract individual files
      setDownloadStep("Unpacking decrypted zip archive...");
      const zip = new JSZip();
      const loadedZip = await zip.loadAsync(decryptedZipBuffer);

      const individualFiles: { name: string; blob: Blob }[] = [];
      for (const fileName of Object.keys(loadedZip.files)) {
        const fileObj = loadedZip.files[fileName];
        if (fileObj.dir) continue;
        const fileData = await fileObj.async("blob");
        individualFiles.push({ name: fileName, blob: fileData });
      }

      setExtractedFiles(individualFiles);
      setDecryptionProgress(100);
      setDownloadCompleted(true);
      setDownloadStep("Decryption complete!");

      // Step 4: Automatically trigger download of the zip container or single file
      if (individualFiles.length === 1) {
        const single = individualFiles[0];
        const url = URL.createObjectURL(single.blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = single.name;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } else {
        const url = URL.createObjectURL(zipBlob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `dropanywhere-${meta.code}.zip`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }

      // Step 5: If burn after reading was active and user consented to early deletion, call DELETE /api/destroy/:code
      if (meta.burnAfterReading && userConsentedBurn) {
        setDownloadStep("Permanently destroying locker from server...");
        await fetch(getApiUrl(`/api/destroy/${meta.code}`), { method: "DELETE" });
      }
    } catch (err: any) {
      console.error("Decryption error:", err);
      setErrorMessage(err.message || "Decryption failed. Please check your password.");
    } finally {
      setIsDownloading(false);
    }
  };

  const downloadSingleFile = (fileItem: { name: string; blob: Blob }) => {
    const url = URL.createObjectURL(fileItem.blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileItem.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const downloadAllZip = () => {
    if (!downloadedZipBlob || !meta) return;
    const url = URL.createObjectURL(downloadedZipBlob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `dropanywhere-${meta.code}.zip`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const formatSize = (bytes: number) => {
    if (!bytes || bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <div className="w-full max-w-xl mx-auto flex flex-col gap-6">
      <BurnConsentModal
        isOpen={showConsentModal}
        onConsent={handleConsentResponse}
        fileNameList={meta?.originalFileNames || []}
      />

      {/* Main Receiver Form Card */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.6, -0.05, 0.01, 0.99] }}
        className="w-full bg-white/90 border border-slate-200/90 p-8 sm:p-10 rounded-[28px] backdrop-blur-2xl shadow-[0_20px_60px_-15px_rgba(15,23,42,0.08)] flex flex-col gap-6"
      >
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-violet-50 border border-violet-200 text-violet-600 flex items-center justify-center shadow-sm">
            <Unlock className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-heading text-xl font-bold text-slate-900 tracking-tight">Unlock Secure Locker</h3>
            <p className="text-xs text-slate-500">
              Enter the 6-digit locker code and sender&apos;s custom password
            </p>
          </div>
        </div>

        {/* 6-Digit Code Input */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider font-heading">
            6-Digit Locker Code
          </label>
          <div className="relative">
            <input
              type="text"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="e.g. 849201"
              className="w-full bg-slate-50 border border-slate-200 focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10 rounded-2xl px-5 py-4 font-mono text-xl tracking-widest text-violet-800 placeholder-slate-400 focus:outline-none shadow-inner uppercase transition-all"
            />
            {code.length === 6 && (
              <button
                onClick={fetchMetadata}
                disabled={isLoadingMeta}
                className="absolute right-3 top-3 bottom-3 px-4 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-semibold text-xs transition-colors flex items-center gap-1.5 shadow-md shadow-violet-500/25"
              >
                {isLoadingMeta ? <Loader2 className="w-4 h-4 animate-spin" /> : "Verify Code"}
              </button>
            )}
          </div>
        </div>

        {/* Password Prompt */}
        {meta && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="flex flex-col gap-2"
          >
            <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider flex items-center gap-1.5 font-heading">
              <Key className="w-3.5 h-3.5 text-violet-600" /> Sender&apos;s Custom Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter secret password set by sender"
                className="w-full bg-slate-50 border border-slate-200 focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10 rounded-2xl px-4 py-3 text-sm text-slate-900 placeholder-slate-400 focus:outline-none shadow-inner transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-700"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </motion.div>
        )}

        {/* Error Alert */}
        {errorMessage && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3 bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl text-xs backdrop-blur-md shadow-sm"
          >
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-500" />
            <span>{errorMessage}</span>
          </motion.div>
        )}

        {/* Verified Locker Metadata Preview */}
        {meta && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="bg-violet-50/50 border border-violet-200/80 p-5 rounded-2xl flex flex-col gap-4 shadow-sm"
          >
            <div className="flex items-center justify-between border-b border-violet-100 pb-3">
              <span className="text-xs font-bold text-slate-900 uppercase tracking-wider font-heading">
                Locker Status: Verified
              </span>
              <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" /> Salt Fetched
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs text-slate-600">
              <div>
                <span className="text-slate-500 block text-[11px]">Enclosed Files:</span>
                <span className="font-semibold text-slate-900">{meta.fileCount} {meta.fileCount === 1 ? "file" : "files"}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px]">Archive Size:</span>
                <span className="font-semibold text-slate-900 font-mono">{formatSize(meta.totalSize)}</span>
              </div>
              {meta.burnAfterReading && (
                <div className="col-span-2 flex items-center gap-1.5 text-amber-700 font-semibold bg-amber-50 p-2.5 rounded-xl border border-amber-200">
                  <Flame className="w-4 h-4 text-amber-600" /> Burn After Reading Active
                </div>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <span className="text-[11px] font-semibold text-slate-500 uppercase font-mono">Files in Archive:</span>
              <div className="max-h-28 overflow-y-auto flex flex-col gap-1 pr-1">
                {meta.originalFileNames.map((name, i) => (
                  <div key={i} className="text-xs text-violet-900 bg-white border border-violet-100 px-3 py-1.5 rounded-lg truncate shadow-sm">
                    {name}
                  </div>
                ))}
              </div>
            </div>

            {/* Unlock & Download Trigger */}
            <motion.button
              whileHover={{ scale: 1.015 }}
              whileTap={{ scale: 0.985 }}
              onClick={executeDownloadAndDecrypt}
              disabled={isDownloading}
              className="shimmer-btn w-full py-4 rounded-2xl bg-gradient-to-r from-violet-600 via-indigo-600 to-violet-700 text-white font-bold text-sm shadow-[0_10px_30px_rgba(124,58,237,0.25)] flex items-center justify-center gap-2 hover:shadow-[0_15px_40px_rgba(124,58,237,0.35)] transition-all disabled:opacity-50 mt-2 font-heading"
            >
              {isDownloading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Decrypting Payload Stream...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>Decrypt &amp; Download Payload</span>
                </>
              )}
            </motion.button>
          </motion.div>
        )}

        {/* Progress Display */}
        {isDownloading && (
          <div className="flex flex-col gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between text-xs font-semibold text-violet-700">
              <span className="truncate max-w-[280px]">{downloadStep}</span>
              <span className="font-mono font-bold">{decryptionProgress}%</span>
            </div>
            <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden p-0.5 border border-slate-300/80 shadow-inner">
              <motion.div
                animate={{ width: `${decryptionProgress}%` }}
                transition={{ ease: [0.16, 1, 0.3, 1], duration: 0.5 }}
                className="h-full rounded-full liquid-shimmer"
              />
            </div>
          </div>
        )}

        {/* Download Completed Notification & File Extraction List */}
        {downloadCompleted && (
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col gap-4 p-6 bg-emerald-50/80 border border-emerald-200 rounded-2xl text-emerald-900 backdrop-blur-md shadow-sm"
          >
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-8 h-8 text-emerald-600 flex-shrink-0" />
              <div>
                <h4 className="font-bold text-base text-slate-900 font-heading">Files Decrypted Successfully</h4>
                <p className="text-xs text-slate-600">
                  Zero-knowledge PBKDF2 + AES-GCM decryption executed in Web Worker.
                </p>
              </div>
            </div>

            {/* Extracted File Items */}
            <div className="flex flex-col gap-2 mt-1">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>Decrypted Files ({extractedFiles.length})</span>
                {extractedFiles.length > 1 && (
                  <button
                    onClick={downloadAllZip}
                    className="flex items-center gap-1.5 text-violet-700 hover:text-violet-800 hover:underline font-semibold"
                  >
                    <FileArchive className="w-3.5 h-3.5" /> Download All as .zip
                  </button>
                )}
              </div>

              <div className="max-h-36 overflow-y-auto flex flex-col gap-1.5 pr-1">
                {extractedFiles.map((fileItem, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between bg-white border border-emerald-200/80 px-3.5 py-2 rounded-xl text-xs shadow-sm"
                  >
                    <span className="truncate text-slate-800 flex items-center gap-2">
                      <File className="w-3.5 h-3.5 text-violet-600 flex-shrink-0" />
                      <span className="truncate font-medium">{fileItem.name}</span>
                    </span>
                    <button
                      onClick={() => downloadSingleFile(fileItem)}
                      className="text-violet-700 hover:text-violet-800 font-semibold flex items-center gap-1 flex-shrink-0 ml-2"
                    >
                      <Download className="w-3 h-3" /> Save
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
};

