"use client";

import React, { useRef, useEffect, useCallback } from "react";

export type CanvasTool = "pen" | "highlighter" | "eraser";

export interface CanvasPoint {
  x: number;
  y: number;
}

export interface CanvasStroke {
  id: string;
  tool: CanvasTool;
  color: string;
  size: number;
  points: CanvasPoint[];
}

interface CollaborativeCanvasProps {
  strokes: CanvasStroke[];
  onStrokesChange: (strokes: CanvasStroke[]) => void;
  activeTool: CanvasTool;
  activeColor: string;
  activeSize: number;
  isReadOnly?: boolean;
}

export const CollaborativeCanvas: React.FC<CollaborativeCanvasProps> = ({
  strokes,
  onStrokesChange,
  activeTool,
  activeColor,
  activeSize,
  isReadOnly = false,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isDrawing = useRef(false);
  const currentStroke = useRef<CanvasStroke | null>(null);
  const throttleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Redraw all strokes on canvas with high DPI sharpness
  const redrawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const allStrokes = currentStroke.current
      ? [...strokes, currentStroke.current]
      : strokes;

    allStrokes.forEach((stroke) => {
      if (!stroke.points || stroke.points.length === 0) return;

      ctx.save();
      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      if (stroke.tool === "eraser") {
        ctx.globalCompositeOperation = "destination-out";
        ctx.lineWidth = stroke.size * 2.5;
        ctx.strokeStyle = "rgba(0,0,0,1)";
      } else if (stroke.tool === "highlighter") {
        ctx.globalCompositeOperation = "multiply";
        ctx.lineWidth = stroke.size * 3.5;
        ctx.strokeStyle = stroke.color;
      } else {
        // Fine Pen
        ctx.globalCompositeOperation = "source-over";
        ctx.lineWidth = stroke.size;
        ctx.strokeStyle = stroke.color;
      }

      ctx.beginPath();
      const pts = stroke.points;

      if (pts.length === 1) {
        ctx.arc(pts[0].x, pts[0].y, ctx.lineWidth / 2, 0, Math.PI * 2);
        ctx.fillStyle = ctx.strokeStyle;
        ctx.fill();
      } else {
        ctx.moveTo(pts[0].x, pts[0].y);
        for (let i = 1; i < pts.length - 1; i++) {
          const xc = (pts[i].x + pts[i + 1].x) / 2;
          const yc = (pts[i].y + pts[i + 1].y) / 2;
          ctx.quadraticCurveTo(pts[i].x, pts[i].y, xc, yc);
        }
        ctx.lineTo(pts[pts.length - 1].x, pts[pts.length - 1].y);
        ctx.stroke();
      }

      ctx.restore();
    });
  }, [strokes]);

  // Handle Resize and DPI scale
  const resizeCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const rect = container.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;

    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.scale(dpr, dpr);
    }
    redrawCanvas();
  }, [redrawCanvas]);

  useEffect(() => {
    resizeCanvas();
    const handleResize = () => resizeCanvas();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [resizeCanvas]);

  useEffect(() => {
    redrawCanvas();
  }, [redrawCanvas]);

  // Coordinates extraction
  const getCoordinates = (e: React.PointerEvent<HTMLCanvasElement>): CanvasPoint | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (isReadOnly) return;
    const coords = getCoordinates(e);
    if (!coords) return;

    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    isDrawing.current = true;

    // Pick color according to tool
    let strokeColor = activeColor;
    if (activeTool === "highlighter") {
      // Soft highlighter alpha tone if not already rgba
      if (activeColor.startsWith("#")) {
        strokeColor = activeColor + "66"; // ~40% alpha
      }
    }

    currentStroke.current = {
      id: Math.random().toString(36).substring(2, 9),
      tool: activeTool,
      color: strokeColor,
      size: activeSize,
      points: [coords],
    };

    redrawCanvas();
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing.current || !currentStroke.current || isReadOnly) return;
    const coords = getCoordinates(e);
    if (!coords) return;

    currentStroke.current.points.push(coords);
    redrawCanvas();

    // Throttled notification for responsive live preview
    if (!throttleTimer.current) {
      throttleTimer.current = setTimeout(() => {
        throttleTimer.current = null;
        if (currentStroke.current && currentStroke.current.points.length % 8 === 0) {
          onStrokesChange([...strokes, currentStroke.current]);
        }
      }, 40);
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing.current || !currentStroke.current) return;
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {}

    isDrawing.current = false;
    if (throttleTimer.current) {
      clearTimeout(throttleTimer.current);
      throttleTimer.current = null;
    }

    const finishedStroke = currentStroke.current;
    currentStroke.current = null;

    if (finishedStroke && finishedStroke.points.length > 0) {
      const nextStrokes = [...strokes, finishedStroke];
      onStrokesChange(nextStrokes);
    }
  };

  return (
    <div
      ref={containerRef}
      className="w-full h-full min-h-[350px] relative bg-white/70 rounded-2xl overflow-hidden touch-none select-none border border-slate-200/80 shadow-inner"
    >
      {/* Background subtle graph grid texture */}
      <div
        className="absolute inset-0 pointer-events-none opacity-20"
        style={{
          backgroundImage:
            "radial-gradient(circle, #94A3B8 1px, transparent 1px)",
          backgroundSize: "20px 20px",
        }}
      />

      <canvas
        ref={canvasRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        className={`w-full h-full block relative z-10 ${
          isReadOnly
            ? "cursor-default"
            : activeTool === "eraser"
            ? "cursor-cell"
            : "cursor-crosshair"
        }`}
      />
    </div>
  );
};

