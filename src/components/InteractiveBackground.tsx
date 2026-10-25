"use client";

import React, { useEffect, useRef } from "react";

interface Node3D {
  x: number;
  y: number;
  z: number;
  baseX: number;
  baseY: number;
  baseZ: number;
  vx: number;
  vy: number;
  vz: number;
  radius: number;
}

export const InteractiveBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    let animationFrameId: number;
    // Cap pixel ratio to 1.5 to guarantee buttery 60-120fps without GPU throttling
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    let width = (canvas.width = window.innerWidth * dpr);
    let height = (canvas.height = window.innerHeight * dpr);
    ctx.scale(dpr, dpr);

    let displayWidth = window.innerWidth;
    let displayHeight = window.innerHeight;

    // Smooth interpolated mouse tracking
    const mouse = {
      x: displayWidth / 2,
      y: displayHeight / 2,
      targetX: displayWidth / 2,
      targetY: displayHeight / 2,
      radius: 170,
    };

    const handleResize = () => {
      if (!canvas) return;
      displayWidth = window.innerWidth;
      displayHeight = window.innerHeight;
      width = canvas.width = displayWidth * dpr;
      height = canvas.height = displayHeight * dpr;
      ctx.scale(dpr, dpr);
      initNodes();
    };

    const handleMouseMove = (e: MouseEvent) => {
      mouse.targetX = e.clientX;
      mouse.targetY = e.clientY;
    };

    window.addEventListener("resize", handleResize, { passive: true });
    window.addEventListener("mousemove", handleMouseMove, { passive: true });

    // Generate 3D Spatial Nodes
    const NODE_COUNT = displayWidth < 768 ? 40 : 70;
    const DEPTH = 500;
    let nodes: Node3D[] = [];

    const initNodes = () => {
      nodes = [];
      for (let i = 0; i < NODE_COUNT; i++) {
        const x = (Math.random() - 0.5) * displayWidth * 1.25;
        const y = (Math.random() - 0.5) * displayHeight * 1.25;
        const z = (Math.random() - 0.5) * DEPTH;
        nodes.push({
          x,
          y,
          z,
          baseX: x,
          baseY: y,
          baseZ: z,
          vx: (Math.random() - 0.5) * 0.25,
          vy: (Math.random() - 0.5) * 0.25,
          vz: (Math.random() - 0.5) * 0.2,
          radius: Math.random() * 1.8 + 1.2,
        });
      }
    };

    initNodes();

    // 3D Perspective settings
    const FOV = 380;
    let rotX = 0;
    let rotY = 0;

    const render = () => {
      // Lerp mouse coordinates smoothly
      mouse.x += (mouse.targetX - mouse.x) * 0.045;
      mouse.y += (mouse.targetY - mouse.y) * 0.045;

      // Parallax rotation angles
      const targetRotY = ((mouse.x - displayWidth / 2) / displayWidth) * 0.35;
      const targetRotX = -((mouse.y - displayHeight / 2) / displayHeight) * 0.35;
      rotY += (targetRotY - rotY) * 0.035;
      rotX += (targetRotX - rotX) * 0.035;

      ctx.clearRect(0, 0, displayWidth, displayHeight);

      const cosX = Math.cos(rotX);
      const sinX = Math.sin(rotX);
      const cosY = Math.cos(rotY);
      const sinY = Math.sin(rotY);

      const projected: { x: number; y: number; scale: number; alpha: number; radius: number }[] = [];

      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i];

        // Gentle idle drift
        n.baseX += n.vx;
        n.baseY += n.vy;
        n.baseZ += n.vz;

        // Bounce boundaries
        const boundX = (displayWidth * 1.25) / 2;
        const boundY = (displayHeight * 1.25) / 2;
        if (Math.abs(n.baseX) > boundX) n.vx *= -1;
        if (Math.abs(n.baseY) > boundY) n.vy *= -1;
        if (Math.abs(n.baseZ) > DEPTH / 2) n.vz *= -1;

        // 3D Matrix Rotation (Y axis then X axis)
        const x1 = n.baseX * cosY - n.baseZ * sinY;
        const z1 = n.baseZ * cosY + n.baseX * sinY;

        const y2 = n.baseY * cosX - z1 * sinX;
        const z2 = z1 * cosX + n.baseY * sinX;

        // Camera perspective projection
        const distance = FOV + z2;
        if (distance <= 0) continue;

        const scale = FOV / distance;
        const projX = displayWidth / 2 + x1 * scale;
        const projY = displayHeight / 2 + y2 * scale;

        // Soft depth atmospheric fog
        const depthAlpha = Math.max(0.12, Math.min(0.8, 1 - (z2 + DEPTH / 2) / (DEPTH * 1.15)));

        // Interactive cursor repulsion
        const dx = projX - mouse.x;
        const dy = projY - mouse.y;
        const distToMouse = Math.sqrt(dx * dx + dy * dy);

        let finalX = projX;
        let finalY = projY;

        if (distToMouse < mouse.radius) {
          const force = (1 - distToMouse / mouse.radius) * 28;
          const angle = Math.atan2(dy, dx);
          finalX += Math.cos(angle) * force;
          finalY += Math.sin(angle) * force;
        }

        projected.push({
          x: finalX,
          y: finalY,
          scale,
          alpha: depthAlpha,
          radius: n.radius * scale,
        });

        // Render particle node
        const isHovered = distToMouse < mouse.radius * 0.85;
        ctx.beginPath();
        ctx.arc(finalX, finalY, Math.max(1, n.radius * scale), 0, Math.PI * 2);

        if (isHovered) {
          ctx.fillStyle = `rgba(109, 40, 217, ${Math.min(0.95, depthAlpha + 0.4)})`;
          ctx.shadowBlur = 12;
          ctx.shadowColor = "rgba(124, 58, 237, 0.45)";
        } else {
          ctx.fillStyle = `rgba(139, 92, 246, ${depthAlpha * 0.45})`;
          ctx.shadowBlur = 3;
          ctx.shadowColor = "rgba(124, 58, 237, 0.15)";
        }
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      // Render 3D Constellation Connections
      const MAX_DIST = displayWidth < 768 ? 95 : 125;
      for (let i = 0; i < projected.length; i++) {
        for (let j = i + 1; j < projected.length; j++) {
          const p1 = projected[i];
          const p2 = projected[j];
          const dx = p1.x - p2.x;
          const dy = p1.y - p2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < MAX_DIST) {
            const lineAlpha = (1 - dist / MAX_DIST) * 0.28 * Math.min(p1.alpha, p2.alpha);
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = `rgba(124, 58, 237, ${lineAlpha})`;
            ctx.lineWidth = 0.85;
            ctx.stroke();
          }
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full pointer-events-none z-0"
      style={{ opacity: 0.8 }}
    />
  );
};
