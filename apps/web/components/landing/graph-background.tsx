"use client";

import { useEffect, useRef } from "react";

interface Point {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
}

export function GraphBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    // Respect reduced-motion preference
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let points: Point[] = [];
    let width = 0;
    let height = 0;
    let paused = false;

    const handleResize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width * window.devicePixelRatio;
      canvas.height = height * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;

      // Re-init points on resize
      const count = Math.min(Math.floor((width * height) / 15000), 100);
      points = [];
      for (let i = 0; i < count; i++) {
        points.push({
          x: Math.random() * width,
          y: Math.random() * height,
          vx: (Math.random() - 0.5) * 0.3,
          vy: (Math.random() - 0.5) * 0.3,
          size: Math.random() > 0.9 ? 2.5 : 1.5,
        });
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);

    const drawFrame = (animate: boolean) => {
      if (!ctx) return;
      ctx.clearRect(0, 0, width, height);

      if (animate) {
        // Update positions
        points.forEach((p) => {
          p.x += p.vx;
          p.y += p.vy;

          // Bounce off walls
          if (p.x < 0 || p.x > width) p.vx *= -1;
          if (p.y < 0 || p.y > height) p.vy *= -1;
        });
      }

      // Draw connections
      ctx.strokeStyle = "rgba(110, 122, 138, 0.15)";
      ctx.lineWidth = 1;

      for (let i = 0; i < points.length; i++) {
        for (let j = i + 1; j < points.length; j++) {
          const dx = points[i].x - points[j].x;
          const dy = points[i].y - points[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 150) {
            ctx.beginPath();
            ctx.moveTo(points[i].x, points[i].y);
            ctx.lineTo(points[j].x, points[j].y);
            ctx.globalAlpha = 1 - dist / 150;
            ctx.stroke();
          }
        }
      }

      // Draw points
      ctx.globalAlpha = 0.4;
      ctx.fillStyle = "#6E7A8A";
      points.forEach((p) => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      });
    };

    // For reduced motion: draw once, no animation loop
    if (prefersReducedMotion) {
      drawFrame(false);
      return () => {
        window.removeEventListener("resize", handleResize);
      };
    }

    const draw = () => {
      if (paused) return;
      drawFrame(true);
      animationFrameId = requestAnimationFrame(draw);
    };

    draw();

    // Pause animation when tab is not visible
    const handleVisibilityChange = () => {
      if (document.hidden) {
        paused = true;
        cancelAnimationFrame(animationFrameId);
      } else {
        paused = false;
        draw();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("resize", handleResize);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 z-0 pointer-events-none opacity-60"
      aria-hidden="true"
    />
  );
}
