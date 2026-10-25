"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShieldCheck,
  Users,
  LogOut,
  Lock,
  Share2,
  Download,
  Upload,
  Pencil,
  Highlighter,
  Eraser,
  Undo2,
  Trash2,
  Check,
  FileText,
  Palette,
  Maximize2,
  SplitSquareVertical,
} from "lucide-react";
import { getSocket, disconnectSocket } from "@/lib/socketClient";
import { encryptText, decryptText, terminateNoteWorker } from "@/lib/noteCrypto";
import {
  CollaborativeCanvas,
  CanvasStroke,
  CanvasTool,
} from "./CollaborativeCanvas";

interface NotepadEditorProps {
  roomCode: string;
  password: string;
  onLeave: () => void;
}

type ViewMode = "note" | "canvas" | "split";

const PEN_COLORS = [
  { name: "Charcoal", hex: "#0F172A" },
  { name: "Indigo", hex: "#4F46E5" },
  { name: "Violet", hex: "#7C3AED" },
  { name: "Rose", hex: "#E11D48" },
  { name: "Emerald", hex: "#059669" },
  { name: "Amber", hex: "#D97706" },
];

const HIGHLIGHTER_COLORS = [
  { name: "Yellow", hex: "#FACC15" },
  { name: "Pink", hex: "#F472B6" },
  { name: "Sky", hex: "#38BDF8" },
  { name: "Lime", hex: "#4ADE80" },
];

export const NotepadEditor: React.FC<NotepadEditorProps> = ({
  roomCode,
  password,
  onLeave,
}) => {
  // Document state
  const [title, setTitle] = useState("Untitled Note");
  const [text, setText] = useState("");
  const [strokes, setStrokes] = useState<CanvasStroke[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>("note");

  // Canvas drawing tool options
  const [activeTool, setActiveTool] = useState<CanvasTool>("pen");
  const [activeColor, setActiveColor] = useState<string>("#4F46E5");
  const [activeSize, setActiveSize] = useState<number>(3);
  const [showColorPicker, setShowColorPicker] = useState(false);

  // Connection & sync state
  const [peerCount, setPeerCount] = useState(1);
  const [syncStatus, setSyncStatus] = useState<"idle" | "encrypting" | "syncing">("idle");
  const [copyFeedback, setCopyFeedback] = useState(false);

  // Refs for tracking updates and avoiding redundant broadcasts
  const textDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const canvasDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSentTextRef = useRef<string>("");
  const lastSentCanvasRef = useRef<string>("");
  const saltRef = useRef<string | undefined>(undefined);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  // Socket.io integration
  useEffect(() => {
    const socket = getSocket();

    socket.emit("join_room", { roomCode });

    socket.on("room_peers", (count: number) => {
      if (isMounted.current) setPeerCount(count);
    });

    // Handle incoming note text updates
    socket.on(
      "note_update",
      async (data: {
        ciphertext: string;
        saltBase64: string;
        ivBase64: string;
      }) => {
        try {
          const decrypted = await decryptText(
            data.ciphertext,
            password,
            data.saltBase64,
            data.ivBase64
          );
          if (isMounted.current) {
            lastSentTextRef.current = decrypted;
            setText(decrypted);
          }
        } catch (err) {
          console.error("Failed to decrypt note update:", err);
        }
      }
    );

    // Handle incoming canvas drawing updates
    socket.on(
      "canvas_update",
      async (data: {
        ciphertext: string;
        saltBase64: string;
        ivBase64: string;
      }) => {
        try {
          const decrypted = await decryptText(
            data.ciphertext,
            password,
            data.saltBase64,
            data.ivBase64
          );
          if (isMounted.current && decrypted) {
            lastSentCanvasRef.current = decrypted;
            const parsedStrokes = JSON.parse(decrypted) as CanvasStroke[];
            setStrokes(parsedStrokes);
          }
        } catch (err) {
          console.error("Failed to decrypt canvas update:", err);
        }
      }
    );

    return () => {
      socket.emit("leave_room", { roomCode });
      socket.off("room_peers");
      socket.off("note_update");
      socket.off("canvas_update");
      disconnectSocket();
      terminateNoteWorker();
    };
  }, [roomCode, password]);

  // Broadcast text changes
  const broadcastTextUpdate = useCallback(
    async (value: string) => {
      if (!isMounted.current) return;
      setSyncStatus("encrypting");
      try {
        const { ciphertextBase64, saltBase64, ivBase64 } = await encryptText(
          value,
          password,
          saltRef.current
        );
        saltRef.current = saltBase64;

        const socket = getSocket();
        socket.emit("note_update", {
          roomCode,
          ciphertext: ciphertextBase64,
          saltBase64,
          ivBase64,
        });

        lastSentTextRef.current = value;
        if (isMounted.current) setSyncStatus("syncing");
        setTimeout(() => {
          if (isMounted.current) setSyncStatus("idle");
        }, 400);
      } catch (err) {
        console.error("Failed to encrypt note update:", err);
        if (isMounted.current) setSyncStatus("idle");
      }
    },
    [password, roomCode]
  );

  // Broadcast canvas changes
  const broadcastCanvasUpdate = useCallback(
    async (newStrokes: CanvasStroke[]) => {
      if (!isMounted.current) return;
      const json = JSON.stringify(newStrokes);
      if (json === lastSentCanvasRef.current) return;

      setSyncStatus("encrypting");
      try {
        const { ciphertextBase64, saltBase64, ivBase64 } = await encryptText(
          json,
          password,
          saltRef.current
        );
        saltRef.current = saltBase64;

        const socket = getSocket();
        socket.emit("canvas_update", {
          roomCode,
          ciphertext: ciphertextBase64,
          saltBase64,
          ivBase64,
        });

        lastSentCanvasRef.current = json;
        if (isMounted.current) setSyncStatus("syncing");
        setTimeout(() => {
          if (isMounted.current) setSyncStatus("idle");
        }, 400);
      } catch (err) {
        console.error("Failed to encrypt canvas update:", err);
        if (isMounted.current) setSyncStatus("idle");
      }
    },
    [password, roomCode]
  );

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setText(value);

    if (textDebounceRef.current) clearTimeout(textDebounceRef.current);
    textDebounceRef.current = setTimeout(() => {
      if (value !== lastSentTextRef.current) {
        broadcastTextUpdate(value);
      }
    }, 250);
  };

  const handleStrokesChange = (newStrokes: CanvasStroke[]) => {
    setStrokes(newStrokes);

    if (canvasDebounceRef.current) clearTimeout(canvasDebounceRef.current);
    canvasDebounceRef.current = setTimeout(() => {
      broadcastCanvasUpdate(newStrokes);
    }, 150);
  };

  // Canvas Actions
  const handleUndo = () => {
    if (strokes.length === 0) return;
    const nextStrokes = strokes.slice(0, -1);
    setStrokes(nextStrokes);
    broadcastCanvasUpdate(nextStrokes);
  };

  const handleClearCanvas = () => {
    if (strokes.length === 0) return;
    if (confirm("Clear all drawing strokes on the canvas?")) {
      setStrokes([]);
      broadcastCanvasUpdate([]);
    }
  };

  // File I/O: Open file
  const handleOpenFileClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (typeof content === "string") {
        setText(content);
        broadcastTextUpdate(content);
        const nameWithoutExt = file.name.replace(/\.[^/.]+$/, "");
        setTitle(nameWithoutExt || "Imported Note");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  // File I/O: Save file
  const handleSaveFile = () => {
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const safeTitle = title.trim().replace(/[^a-zA-Z0-9_-]/g, "_") || "note";
    a.href = url;
    a.download = `${safeTitle}-${roomCode}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Copy shareable link
  const handleCopyShareLink = () => {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const url = `${origin}/notes?room=${roomCode}`;
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(url);
      setCopyFeedback(true);
      setTimeout(() => setCopyFeedback(false), 2000);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4 }}
      className="w-full flex flex-col flex-1 gap-4"
    >
      {/* Hidden file input for Open File */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".txt,.md"
        className="hidden"
        onChange={handleFileSelected}
      />

      {/* Main Google Keep-Inspired Card */}
      <div className="bg-white/95 border border-slate-200/90 rounded-[28px] p-5 sm:p-7 backdrop-blur-2xl shadow-[0_15px_45px_-12px_rgba(15,23,42,0.07)] flex flex-col flex-1 relative overflow-hidden">
        {/* Top Header Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100">
          {/* Note Title & Room Code Badge */}
          <div className="flex items-center gap-3">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="font-heading text-lg sm:text-xl font-bold text-slate-800 bg-transparent hover:bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 px-2 py-1 rounded-xl transition-all"
              placeholder="Title..."
            />

            <span className="text-xs font-mono font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-3 py-1 rounded-full shadow-sm flex items-center gap-1.5">
              <span>{roomCode}</span>
            </span>
          </div>

          {/* Mode Switcher & Room Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* View Switcher: Note / Sketch / Split */}
            <div className="flex items-center bg-slate-100/90 border border-slate-200/90 p-1 rounded-xl shadow-inner">
              <button
                type="button"
                onClick={() => setViewMode("note")}
                className={`relative px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors z-10 ${
                  viewMode === "note" ? "text-white" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {viewMode === "note" && (
                  <motion.div
                    layoutId="viewModePill"
                    transition={{ type: "spring", stiffness: 450, damping: 35 }}
                    className="absolute inset-0 rounded-lg bg-indigo-600 shadow-sm z-[-1]"
                  />
                )}
                <FileText className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Note</span>
              </button>

              <button
                type="button"
                onClick={() => setViewMode("canvas")}
                className={`relative px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors z-10 ${
                  viewMode === "canvas" ? "text-white" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {viewMode === "canvas" && (
                  <motion.div
                    layoutId="viewModePill"
                    transition={{ type: "spring", stiffness: 450, damping: 35 }}
                    className="absolute inset-0 rounded-lg bg-indigo-600 shadow-sm z-[-1]"
                  />
                )}
                <Pencil className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Sketch</span>
              </button>

              <button
                type="button"
                onClick={() => setViewMode("split")}
                className={`relative px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors z-10 ${
                  viewMode === "split" ? "text-white" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {viewMode === "split" && (
                  <motion.div
                    layoutId="viewModePill"
                    transition={{ type: "spring", stiffness: 450, damping: 35 }}
                    className="absolute inset-0 rounded-lg bg-indigo-600 shadow-sm z-[-1]"
                  />
                )}
                <SplitSquareVertical className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Split</span>
              </button>
            </div>

            {/* Peers Indicator */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 font-medium">
              <Users className="w-3.5 h-3.5 text-indigo-500" />
              <span className="font-bold text-indigo-700">{peerCount}</span>
            </div>

            {/* Leave Room Button */}
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              type="button"
              onClick={onLeave}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 border border-slate-200 transition-colors"
              title="Leave Room"
            >
              <LogOut className="w-4 h-4" />
            </motion.button>
          </div>
        </div>

        {/* Canvas Toolbar (Active when in sketch or split view) */}
        {(viewMode === "canvas" || viewMode === "split") && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="flex flex-wrap items-center justify-between gap-3 py-3 border-b border-slate-100"
          >
            {/* Tools Selector */}
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => {
                  setActiveTool("pen");
                  setActiveColor(PEN_COLORS[1].hex);
                  setActiveSize(3);
                }}
                className={`p-2 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all ${
                  activeTool === "pen"
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "text-slate-600 hover:bg-slate-200"
                }`}
                title="Fine Pen"
              >
                <Pencil className="w-4 h-4" />
                <span className="hidden sm:inline text-[11px]">Pen</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveTool("highlighter");
                  setActiveColor(HIGHLIGHTER_COLORS[0].hex);
                  setActiveSize(12);
                }}
                className={`p-2 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all ${
                  activeTool === "highlighter"
                    ? "bg-amber-500 text-white shadow-sm"
                    : "text-slate-600 hover:bg-slate-200"
                }`}
                title="Highlighter"
              >
                <Highlighter className="w-4 h-4" />
                <span className="hidden sm:inline text-[11px]">Highlighter</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveTool("eraser");
                  setActiveSize(16);
                }}
                className={`p-2 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all ${
                  activeTool === "eraser"
                    ? "bg-rose-600 text-white shadow-sm"
                    : "text-slate-600 hover:bg-slate-200"
                }`}
                title="Eraser"
              >
                <Eraser className="w-4 h-4" />
                <span className="hidden sm:inline text-[11px]">Eraser</span>
              </button>
            </div>

            {/* Color Swatches */}
            {activeTool !== "eraser" && (
              <div className="flex items-center gap-1.5">
                {(activeTool === "highlighter" ? HIGHLIGHTER_COLORS : PEN_COLORS).map(
                  (col) => (
                    <button
                      key={col.name}
                      type="button"
                      onClick={() => setActiveColor(col.hex)}
                      className={`w-6 h-6 rounded-full border-2 transition-transform ${
                        activeColor === col.hex || activeColor.startsWith(col.hex)
                          ? "scale-125 border-indigo-600 shadow-sm"
                          : "border-white hover:scale-110"
                      }`}
                      style={{ backgroundColor: col.hex }}
                      title={col.name}
                    />
                  )
                )}
              </div>
            )}

            {/* Stroke Actions: Undo & Clear */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleUndo}
                disabled={strokes.length === 0}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 disabled:opacity-40 text-slate-600 text-xs font-medium border border-slate-200 transition-colors"
                title="Undo last stroke"
              >
                <Undo2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Undo</span>
              </button>

              <button
                type="button"
                onClick={handleClearCanvas}
                disabled={strokes.length === 0}
                className="p-1.5 rounded-lg bg-slate-50 hover:bg-red-50 text-slate-500 hover:text-red-600 disabled:opacity-40 border border-slate-200 transition-colors"
                title="Clear Canvas"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </motion.div>
        )}

        {/* Central Workspace: Note / Sketch / Split */}
        <div className="flex-1 flex flex-col md:flex-row gap-4 mt-4 min-h-[440px]">
          {/* Text Area (Visible in note or split mode) */}
          {(viewMode === "note" || viewMode === "split") && (
            <div className={`flex-1 flex flex-col ${viewMode === "split" ? "md:w-1/2" : "w-full"}`}>
              <textarea
                value={text}
                onChange={handleTextChange}
                placeholder="Take a secure note... (Encrypted on every keystroke)"
                className="w-full flex-1 p-4 bg-slate-50/60 hover:bg-slate-50/90 focus:bg-white rounded-2xl border border-slate-200/80 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10 text-slate-800 placeholder-slate-400 font-sans text-sm leading-relaxed outline-none resize-none shadow-inner transition-all"
              />
            </div>
          )}

          {/* Collaborative Drawing Canvas (Visible in canvas or split mode) */}
          {(viewMode === "canvas" || viewMode === "split") && (
            <div className={`flex-1 flex flex-col ${viewMode === "split" ? "md:w-1/2" : "w-full"}`}>
              <CollaborativeCanvas
                strokes={strokes}
                onStrokesChange={handleStrokesChange}
                activeTool={activeTool}
                activeColor={activeColor}
                activeSize={activeSize}
              />
            </div>
          )}
        </div>

        {/* Floating Google Keep-Style Docked Toolbar */}
        <div className="mt-5 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
          {/* File I/O & Share Controls */}
          <div className="flex items-center gap-2">
            {/* Open File Button */}
            <button
              type="button"
              onClick={handleOpenFileClick}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold border border-slate-200 transition-colors"
              title="Open local .txt or .md file"
            >
              <Upload className="w-3.5 h-3.5 text-indigo-600" />
              <span>Open File</span>
            </button>

            {/* Save File Button */}
            <button
              type="button"
              onClick={handleSaveFile}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold border border-slate-200 transition-colors"
              title="Save note to local disk as .txt"
            >
              <Download className="w-3.5 h-3.5 text-indigo-600" />
              <span>Save File</span>
            </button>

            {/* Copy Share Link */}
            <button
              type="button"
              onClick={handleCopyShareLink}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold border border-indigo-200 transition-colors"
            >
              {copyFeedback ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-700 font-bold">Link Copied!</span>
                </>
              ) : (
                <>
                  <Share2 className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Share Room</span>
                </>
              )}
            </button>
          </div>

          {/* Sync & E2E Security Badges */}
          <div className="flex items-center gap-3 text-xs text-slate-500 font-mono">
            {syncStatus !== "idle" && (
              <span className="flex items-center gap-1 text-indigo-600 text-[11px] animate-pulse">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-600" />
                {syncStatus === "encrypting" ? "Encrypting in Worker..." : "Relaying..."}
              </span>
            )}

            <div className="flex items-center gap-1.5 text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-2.5 py-1 rounded-full text-[11px] font-sans font-medium">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>AES-GCM Zero-Knowledge</span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
