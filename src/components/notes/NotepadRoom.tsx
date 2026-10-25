"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShieldCheck,
  KeyRound,
  Hash,
  ArrowRight,
  Lock,
  Sparkles,
  Copy,
  Check,
  Share2,
  Eye,
  EyeOff,
  Users,
  RotateCcw,
} from "lucide-react";
import { SaveKeyWarningModal } from "@/components/SaveKeyWarningModal";

interface NotepadRoomProps {
  initialRoomCode?: string;
  onJoin: (roomCode: string, password: string) => void;
}

// Generate a memorable and secure 8-character alphanumeric room code
function generateSecureRoomId(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let result = "";
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `${result.slice(0, 4)}-${result.slice(4)}`;
}

export const NotepadRoom: React.FC<NotepadRoomProps> = ({
  initialRoomCode = "",
  onJoin,
}) => {
  const [mode, setMode] = useState<"create" | "join">(initialRoomCode ? "join" : "create");

  // Create Flow State
  const [createStage, setCreateStage] = useState<"form" | "success">("form");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [createdRoomCode, setCreatedRoomCode] = useState<string>("");
  const [shareUrl, setShareUrl] = useState<string>("");
  const [showKeyWarningModal, setShowKeyWarningModal] = useState(false);

  // Join Flow State
  const [joinRoomCode, setJoinRoomCode] = useState<string>(initialRoomCode.toUpperCase());
  const [joinPassword, setJoinPassword] = useState("");
  const [showJoinPassword, setShowJoinPassword] = useState(false);

  // Copy feedback states
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Error handling
  const [error, setError] = useState<string | null>(null);

  // If initialRoomCode changes from search params, set join mode
  useEffect(() => {
    if (initialRoomCode) {
      setJoinRoomCode(initialRoomCode.toUpperCase().replace(/[^A-Z0-9-]/g, ""));
      setMode("join");
    }
  }, [initialRoomCode]);

  // Sequential Step 1: User sets password and submits "Create Room"
  const handleCreateRoomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!password || password.trim().length < 4) {
      setError("Please set a master room password (at least 4 characters)");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    // Trigger Save Key Warning Modal right after clicking create button
    setShowKeyWarningModal(true);
  };

  // Step 2: Once user confirms in the modal, generate unique Room ID and transition to success
  const handleConfirmCreateRoom = () => {
    setShowKeyWarningModal(false);

    const newRoomCode = generateSecureRoomId();
    setCreatedRoomCode(newRoomCode);

    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const url = `${origin}/notes?room=${newRoomCode}`;
    setShareUrl(url);

    // Transition to Success State
    setCreateStage("success");
  };

  // Step 3: Enter the room once created
  const handleEnterCreatedRoom = () => {
    if (!createdRoomCode || !password) return;
    onJoin(createdRoomCode, password.trim());
  };

  // Reset create flow
  const handleResetCreateFlow = () => {
    setCreateStage("form");
    setPassword("");
    setConfirmPassword("");
    setCreatedRoomCode("");
    setShareUrl("");
    setError(null);
  };

  // Join Flow Submit
  const handleJoinExistingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanCode = joinRoomCode.trim().toUpperCase();
    if (!cleanCode || cleanCode.length < 3) {
      setError("Please enter a valid room ID");
      return;
    }
    if (!joinPassword || joinPassword.trim().length < 4) {
      setError("Please enter the room password (at least 4 characters)");
      return;
    }

    // Zero-Knowledge: password is kept on client for Web Worker key derivation
    onJoin(cleanCode, joinPassword.trim());
  };

  // Copy helpers
  const handleCopyCode = () => {
    if (navigator?.clipboard && createdRoomCode) {
      navigator.clipboard.writeText(createdRoomCode);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  const handleCopyLink = () => {
    if (navigator?.clipboard && shareUrl) {
      navigator.clipboard.writeText(shareUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  return (
    <div className="w-full max-w-lg mx-auto">
      {/* Top Split Tab Switcher */}
      <div className="flex items-center justify-center mb-6">
        <div className="flex items-center bg-slate-100/90 border border-slate-200/90 p-1 rounded-2xl relative shadow-inner">
          <button
            type="button"
            onClick={() => {
              setMode("create");
              setError(null);
            }}
            className={`relative flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold transition-colors z-10 ${
              mode === "create" ? "text-white" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            {mode === "create" && (
              <motion.div
                layoutId="roomModeTab"
                transition={{ type: "spring", stiffness: 450, damping: 35 }}
                className="absolute inset-0 rounded-xl bg-gradient-to-r from-indigo-600 via-violet-600 to-indigo-700 shadow-[0_2px_12px_rgba(99,102,241,0.3)] z-[-1]"
              />
            )}
            <Sparkles className="w-3.5 h-3.5" />
            <span>Create Room</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setMode("join");
              setError(null);
            }}
            className={`relative flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold transition-colors z-10 ${
              mode === "join" ? "text-white" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            {mode === "join" && (
              <motion.div
                layoutId="roomModeTab"
                transition={{ type: "spring", stiffness: 450, damping: 35 }}
                className="absolute inset-0 rounded-xl bg-gradient-to-r from-indigo-600 via-violet-600 to-indigo-700 shadow-[0_2px_12px_rgba(99,102,241,0.3)] z-[-1]"
              />
            )}
            <KeyRound className="w-3.5 h-3.5" />
            <span>Join with ID</span>
          </button>
        </div>
      </div>

      {/* Main Container Card */}
      <motion.div
        layout
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="bg-white/95 border border-slate-200/90 rounded-[28px] p-7 sm:p-9 backdrop-blur-2xl shadow-[0_20px_60px_-15px_rgba(15,23,42,0.08)] relative overflow-hidden"
      >
        {/* Soft Ambient Glows */}
        <div className="absolute top-0 right-0 w-52 h-52 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-44 h-44 bg-violet-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10">
          <AnimatePresence mode="wait">
            {mode === "create" ? (
              createStage === "form" ? (
                /* CREATE ROOM: INITIAL FORM (Simplified - only password inputs) */
                <motion.div
                  key="create-form"
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  transition={{ duration: 0.3 }}
                  className="flex flex-col gap-6"
                >
                  {/* Header */}
                  <div className="flex flex-col items-center text-center gap-2">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-100 to-violet-100 border border-indigo-200/80 flex items-center justify-center text-indigo-600 shadow-sm">
                      <Sparkles className="w-6 h-6" />
                    </div>
                    <h2 className="font-heading text-2xl font-extrabold text-slate-900 tracking-tight">
                      Create Secure Room
                    </h2>
                    <p className="text-xs text-slate-500 max-w-sm">
                      Set a master password for client-side encryption. A unique Room ID will be generated upon submission.
                    </p>
                  </div>

                  {/* Zero-Knowledge Info Banner */}
                  <div className="flex items-start gap-2.5 bg-indigo-50/70 border border-indigo-200/80 p-3.5 rounded-2xl text-[11px] text-indigo-900">
                    <ShieldCheck className="w-4 h-4 flex-shrink-0 text-indigo-600 mt-0.5" />
                    <span>
                      <strong>Zero Server Knowledge:</strong> Your password never touches the server. All notes and canvas strokes are AES-GCM encrypted in your Web Worker before transmission.
                    </span>
                  </div>

                  {/* Form with Password & Confirm Password Only */}
                  <form onSubmit={handleCreateRoomSubmit} className="flex flex-col gap-4">
                    {/* Set Room Password */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider flex items-center gap-1.5 font-heading">
                        <KeyRound className="w-3.5 h-3.5 text-indigo-600" /> Set Room Password
                      </label>
                      <div className="relative">
                        <input
                          type={showPassword ? "text" : "password"}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="Enter a secret room password"
                          className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 rounded-xl px-4 py-3 text-sm text-slate-900 placeholder-slate-400 focus:outline-none shadow-inner transition-all"
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

                    {/* Confirm Room Password */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider flex items-center gap-1.5 font-heading">
                        <Lock className="w-3.5 h-3.5 text-indigo-600" /> Confirm Password
                      </label>
                      <input
                        type={showPassword ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Re-enter secret password"
                        className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 rounded-xl px-4 py-3 text-sm text-slate-900 placeholder-slate-400 focus:outline-none shadow-inner transition-all"
                      />
                    </div>

                    {/* Error Notice */}
                    {error && (
                      <motion.p
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-xs text-red-600 bg-red-50 border border-red-200 px-3.5 py-2 rounded-xl"
                      >
                        {error}
                      </motion.p>
                    )}

                    {/* Primary Action Button */}
                    <motion.button
                      whileHover={{ scale: 1.015 }}
                      whileTap={{ scale: 0.985 }}
                      type="submit"
                      className="w-full mt-2 py-3.5 rounded-2xl bg-gradient-to-r from-indigo-600 via-violet-600 to-indigo-700 text-white font-bold text-sm shadow-[0_10px_30px_rgba(99,102,241,0.25)] flex items-center justify-center gap-2 hover:shadow-[0_15px_40px_rgba(99,102,241,0.35)] transition-all font-heading"
                    >
                      <Sparkles className="w-4 h-4" />
                      <span>Create Secure Room</span>
                    </motion.button>
                  </form>
                </motion.div>
              ) : (
                /* CREATE ROOM: SUCCESS STATE (Mirrors /drop HandoffScreen parity) */
                <motion.div
                  key="create-success"
                  initial={{ opacity: 0, scale: 0.94, y: 15 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.94 }}
                  transition={{ duration: 0.45, ease: [0.6, -0.05, 0.01, 0.99] }}
                  className="flex flex-col gap-6"
                >
                  {/* Banner */}
                  <div className="text-center flex flex-col items-center gap-2">
                    <span className="px-3.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 font-semibold text-xs uppercase tracking-widest flex items-center gap-1.5 font-mono shadow-sm">
                      <Lock className="w-3.5 h-3.5 text-emerald-600" /> Room Created &amp; Sealed
                    </span>
                    <h2 className="font-heading text-2xl font-extrabold text-slate-900 mt-1">
                      Ready for Collaboration
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-500 max-w-sm">
                      Share this unique Room ID or direct link. Collaborators will need your password to decrypt.
                    </p>
                  </div>

                  {/* Prominent Room ID Box with Direct "Copy Code" Button */}
                  <div className="bg-slate-50/90 border border-slate-200/80 rounded-2xl p-5 flex flex-col gap-3 shadow-inner">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider font-mono">
                        Unique Room ID
                      </span>
                      <span className="text-[11px] text-emerald-600 font-medium flex items-center gap-1 font-mono">
                        <Check className="w-3 h-3" /> Active
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-3 bg-white border border-slate-200/90 rounded-xl p-3 shadow-sm">
                      <span className="font-mono text-xl sm:text-2xl font-extrabold tracking-widest text-indigo-700 select-all pl-1">
                        {createdRoomCode}
                      </span>

                      {/* Direct Copy Code Button next to ID */}
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        type="button"
                        onClick={handleCopyCode}
                        className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold border border-indigo-200 transition-colors shadow-sm flex-shrink-0"
                        title="Copy Room ID code"
                      >
                        {copiedCode ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                            <span className="text-emerald-700">Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5 text-indigo-600" />
                            <span>Copy Code</span>
                          </>
                        )}
                      </motion.button>
                    </div>
                  </div>

                  {/* Password Security Reminder Box */}
                  <div className="flex items-center gap-3 bg-indigo-50/80 border border-indigo-200/90 p-4 rounded-2xl text-xs text-indigo-900">
                    <KeyRound className="w-4 h-4 flex-shrink-0 text-indigo-600" />
                    <span>
                      <strong>Password Reminder:</strong> Provide your collaborators with your room password through a separate secure message. It was never transmitted to our servers.
                    </span>
                  </div>

                  {/* Shareable Link Box */}
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider flex items-center gap-1.5 font-heading">
                      <Share2 className="w-3.5 h-3.5 text-indigo-600" /> Direct Invite Link
                    </label>
                    <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 p-2 rounded-xl">
                      <input
                        type="text"
                        readOnly
                        value={shareUrl}
                        className="bg-transparent flex-1 text-xs font-mono text-slate-700 outline-none px-2 truncate"
                      />
                      <button
                        type="button"
                        onClick={handleCopyLink}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-sm transition-all flex-shrink-0"
                      >
                        {copiedLink ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-200" />
                            <span>Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Copy Link</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Action Buttons: Enter Room Now + Create Another */}
                  <div className="flex flex-col sm:flex-row gap-3 pt-2">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      type="button"
                      onClick={handleEnterCreatedRoom}
                      className="flex-1 py-3.5 rounded-2xl bg-gradient-to-r from-indigo-600 via-violet-600 to-indigo-700 text-white font-bold text-sm shadow-[0_10px_30px_rgba(99,102,241,0.25)] flex items-center justify-center gap-2 hover:shadow-[0_15px_40px_rgba(99,102,241,0.35)] transition-all font-heading"
                    >
                      <Users className="w-4 h-4" />
                      <span>Enter Room Now</span>
                    </motion.button>

                    <button
                      type="button"
                      onClick={handleResetCreateFlow}
                      className="px-4 py-3.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 text-xs font-semibold border border-slate-200 transition-colors flex items-center justify-center gap-1.5"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Reset</span>
                    </button>
                  </div>
                </motion.div>
              )
            ) : (
              /* JOIN ROOM: INPUT ROOM ID & ROOM PASSWORD */
              <motion.div
                key="join-form"
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ duration: 0.3 }}
                className="flex flex-col gap-6"
              >
                {/* Header */}
                <div className="flex flex-col items-center text-center gap-2">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-100 to-violet-100 border border-indigo-200/80 flex items-center justify-center text-indigo-600 shadow-sm">
                    <Lock className="w-6 h-6" />
                  </div>
                  <h2 className="font-heading text-2xl font-extrabold text-slate-900 tracking-tight">
                    Join Encrypted Room
                  </h2>
                  <p className="text-xs text-slate-500 max-w-sm">
                    Enter the Room ID and sender&apos;s custom password to decrypt the session.
                  </p>
                </div>

                <form onSubmit={handleJoinExistingSubmit} className="flex flex-col gap-4">
                  {/* Room ID Input */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider flex items-center gap-1.5 font-heading">
                      <Hash className="w-3.5 h-3.5 text-indigo-600" /> Room ID
                    </label>
                    <input
                      type="text"
                      maxLength={16}
                      value={joinRoomCode}
                      onChange={(e) =>
                        setJoinRoomCode(e.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, ""))
                      }
                      placeholder="e.g. 7K2M-99PW"
                      className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 rounded-xl px-4 py-3 font-mono text-base font-bold tracking-widest text-indigo-800 placeholder-slate-400 focus:outline-none shadow-inner transition-all uppercase"
                    />
                  </div>

                  {/* Room Password Input */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider flex items-center gap-1.5 font-heading">
                      <KeyRound className="w-3.5 h-3.5 text-indigo-600" /> Room Password
                    </label>
                    <div className="relative">
                      <input
                        type={showJoinPassword ? "text" : "password"}
                        value={joinPassword}
                        onChange={(e) => setJoinPassword(e.target.value)}
                        placeholder="Enter room password to decrypt"
                        className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 rounded-xl px-4 py-3 text-sm text-slate-900 placeholder-slate-400 focus:outline-none shadow-inner transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowJoinPassword(!showJoinPassword)}
                        className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-700"
                      >
                        {showJoinPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Error Notice */}
                  {error && (
                    <motion.p
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-xs text-red-600 bg-red-50 border border-red-200 px-3.5 py-2 rounded-xl"
                    >
                      {error}
                    </motion.p>
                  )}

                  {/* Submit Button */}
                  <motion.button
                    whileHover={{ scale: 1.015 }}
                    whileTap={{ scale: 0.985 }}
                    type="submit"
                    className="w-full mt-2 py-3.5 rounded-2xl bg-gradient-to-r from-indigo-600 via-violet-600 to-indigo-700 text-white font-bold text-sm shadow-[0_10px_30px_rgba(99,102,241,0.25)] flex items-center justify-center gap-2 hover:shadow-[0_15px_40px_rgba(99,102,241,0.35)] transition-all font-heading"
                  >
                    <span>Unlock &amp; Join Room</span>
                    <ArrowRight className="w-4 h-4" />
                  </motion.button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Save Key Warning Confirmation Modal */}
      <SaveKeyWarningModal
        isOpen={showKeyWarningModal}
        mode="room"
        password={password}
        onConfirm={handleConfirmCreateRoom}
        onCancel={() => setShowKeyWarningModal(false)}
      />
    </div>
  );
};
