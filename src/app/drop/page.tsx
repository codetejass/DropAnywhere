"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Dropzone } from "@/components/drop/Dropzone";
import { ProgressBar } from "@/components/drop/ProgressBar";
import { HandoffScreen } from "@/components/drop/HandoffScreen";
import { ReceiverPanel } from "@/components/drop/ReceiverPanel";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { zipFilesClientSide, encryptZipWithWorker } from "@/lib/crypto";
import { getApiUrl } from "@/lib/apiConfig";

const pageVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.12,
      delayChildren: 0.05,
    },
  },
};

const childVariants = {
  hidden: { opacity: 0, y: 18 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.65,
      ease: [0.6, -0.05, 0.01, 0.99],
    },
  },
};

export default function DropPage() {
  const [activeTab, setActiveTab] = useState<"send" | "receive">("send");
  const [files, setFiles] = useState<File[]>([]);
  const [password, setPassword] = useState<string>("");
  const [burnAfterReading, setBurnAfterReading] = useState(false);

  // Upload lifecycle state
  const [uploadState, setUploadState] = useState<"idle" | "encrypting" | "uploading" | "handoff">("idle");
  const [encryptionProgress, setEncryptionProgress] = useState<number>(0);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [statusMessage, setStatusMessage] = useState<string>("");

  // Created locker result
  const [createdLocker, setCreatedLocker] = useState<{
    code: string;
    burnAfterReading: boolean;
    expiresAt: number;
    originalFileNames: string[];
    totalSize: number;
  } | null>(null);

  const handleStartUpload = async () => {
    if (files.length === 0) return;
    if (!password || password.trim().length < 4) {
      alert("Please enter a custom encryption password (at least 4 characters)");
      return;
    }

    setUploadState("encrypting");
    setEncryptionProgress(0);
    setUploadProgress(0);
    setStatusMessage("Zipping files into container in browser...");

    try {
      // Step 1: Zip all files into a single buffer on client side
      const zipBuffer = await zipFilesClientSide(files, (p, status) => {
        setStatusMessage(status);
        setEncryptionProgress(Math.round(p * 0.4)); // 0 - 40%
      });

      setStatusMessage("Deriving 256-bit AES-GCM key in Web Worker (600,000 PBKDF2 iterations)...");

      // Step 2: Encrypt single zip container in Web Worker
      const encryptResult = await encryptZipWithWorker(
        zipBuffer,
        password.trim(),
        undefined,
        (p, status) => {
          setStatusMessage(status);
          setEncryptionProgress(40 + Math.round(p * 0.6)); // 40 - 100%
        }
      );

      setEncryptionProgress(100);
      setUploadState("uploading");
      setStatusMessage("Piping encrypted stream to storage...");

      // Step 3: Send single encrypted binary blob + public salt to backend
      const formData = new FormData();
      formData.append("file", encryptResult.encryptedBlob, "locker.enc");
      formData.append("salt", encryptResult.saltBase64);
      formData.append("burnAfterReading", burnAfterReading ? "true" : "false");
      formData.append("fileNames", JSON.stringify(files.map((f) => f.name)));
      formData.append("fileCount", files.length.toString());
      formData.append("totalSize", files.reduce((acc, f) => acc + f.size, 0).toString());

      const xhr = new XMLHttpRequest();
      xhr.open("POST", getApiUrl("/api/upload"), true);
      xhr.withCredentials = true;

      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          const percent = Math.round((e.loaded / e.total) * 100);
          setUploadProgress(percent);
          if (percent < 100) {
            setStatusMessage(`Streaming encrypted archive to S3/R2 storage: ${percent}%...`);
          } else {
            setStatusMessage("Generating collision-free 6-digit code & saving metadata...");
          }
        }
      };

      xhr.onload = () => {
        if (xhr.status === 200) {
          const res = JSON.parse(xhr.responseText);
          setUploadProgress(100);
          setStatusMessage("Locker created successfully!");

          setCreatedLocker({
            code: res.code,
            burnAfterReading: res.burnAfterReading,
            expiresAt: res.expiresAt,
            originalFileNames: res.originalFileNames,
            totalSize: res.totalSize,
          });

          setUploadState("handoff");
        } else {
          console.error("Upload server error:", xhr.responseText);
          let errorMsg = "Failed to upload encrypted files to server.";
          try {
            const errJson = JSON.parse(xhr.responseText);
            if (errJson.details) {
              errorMsg = `Upload failed: ${errJson.details}`;
            } else if (errJson.error) {
              errorMsg = `Upload failed: ${errJson.error}`;
            }
          } catch {}
          alert(errorMsg);
          setUploadState("idle");
        }
      };

      xhr.onerror = () => {
        console.error("XHR Network failure");
        alert("Network connection failure during upload.");
        setUploadState("idle");
      };

      xhr.send(formData);
    } catch (err: any) {
      console.error("Zipping/Encryption error:", err);
      alert(err.message || "Failed to process files in browser.");
      setUploadState("idle");
    }
  };

  const handleReset = () => {
    setFiles([]);
    setPassword("");
    setBurnAfterReading(false);
    setUploadState("idle");
    setEncryptionProgress(0);
    setUploadProgress(0);
    setStatusMessage("");
    setCreatedLocker(null);
  };

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <Header />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-10 sm:py-14 flex flex-col justify-center">
        <motion.div
          variants={pageVariants}
          initial="hidden"
          animate="visible"
          className="w-full flex flex-col items-center"
        >
          {/* Hero Section */}
          <motion.div variants={childVariants} className="text-center mb-8 sm:mb-10 max-w-xl">
            <span className="text-[11px] font-mono font-semibold uppercase tracking-widest text-violet-700 bg-violet-50 border border-violet-200/90 px-3.5 py-1.5 rounded-full shadow-sm inline-flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-violet-600 animate-pulse" />
              Stateless Privacy Architecture
            </span>
            <h2 className="font-heading text-3xl sm:text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight mt-3">
              {activeTab === "send" ? "Secure Temporary Locker" : "Unlock Shared Locker"}
            </h2>
            <p className="text-sm text-slate-600 mt-2 leading-relaxed">
              {activeTab === "send"
                ? "Client-side encrypted payload streamed to temporary storage. Expiring automatically in 24 hours."
                : "Retrieve encrypted files using a 6-digit access code and sender's secret password."}
            </p>
          </motion.div>

          {/* Tab Switcher */}
          <motion.div variants={childVariants} className="mb-8">
            <div className="flex items-center bg-slate-100/90 border border-slate-200/90 p-1 rounded-xl relative shadow-inner">
              <button
                onClick={() => setActiveTab("send")}
                className={`relative flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition-colors z-10 ${
                  activeTab === "send" ? "text-white" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {activeTab === "send" && (
                  <motion.div
                    layoutId="dropPageTab"
                    transition={{ type: "spring", stiffness: 450, damping: 35 }}
                    className="absolute inset-0 rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 shadow-[0_2px_12px_rgba(124,58,237,0.3)] z-[-1]"
                  />
                )}
                <span>Send Files</span>
              </button>
              <button
                onClick={() => setActiveTab("receive")}
                className={`relative flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition-colors z-10 ${
                  activeTab === "receive" ? "text-white" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {activeTab === "receive" && (
                  <motion.div
                    layoutId="dropPageTab"
                    transition={{ type: "spring", stiffness: 450, damping: 35 }}
                    className="absolute inset-0 rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 shadow-[0_2px_12px_rgba(124,58,237,0.3)] z-[-1]"
                  />
                )}
                <span>Unlock Locker</span>
              </button>
            </div>
          </motion.div>

          {/* Interactive Core Workflows */}
          <motion.div variants={childVariants} className="w-full">
            {activeTab === "send" ? (
              <>
                {uploadState === "idle" && (
                  <Dropzone
                    files={files}
                    setFiles={setFiles}
                    password={password}
                    setPassword={setPassword}
                    burnAfterReading={burnAfterReading}
                    setBurnAfterReading={setBurnAfterReading}
                    onStartUpload={handleStartUpload}
                  />
                )}

                {(uploadState === "encrypting" || uploadState === "uploading") && (
                  <ProgressBar
                    encryptionProgress={encryptionProgress}
                    uploadProgress={uploadProgress}
                    statusMessage={statusMessage}
                  />
                )}

                {uploadState === "handoff" && createdLocker && (
                  <HandoffScreen
                    code={createdLocker.code}
                    burnAfterReading={createdLocker.burnAfterReading}
                    expiresAt={createdLocker.expiresAt}
                    originalFileNames={createdLocker.originalFileNames}
                    totalSize={createdLocker.totalSize}
                    onReset={handleReset}
                  />
                )}
              </>
            ) : (
              <ReceiverPanel />
            )}
          </motion.div>
        </motion.div>
      </main>

      <Footer />
    </div>
  );
}

