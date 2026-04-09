import React, { useEffect, useRef } from 'react';

/**
 * Pure CSS/Canvas animated background — zero runtime dependency on WebGL/Three.js.
 * Produces a silky, organic flowing gradient that mimics the silk effect.
 */
const SilkBackground = () => {
  const canvasRef = useRef(null);
  const animRef   = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    let t = 0;
    const resize = () => {
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', resize);
    resize();

    const draw = () => {
      const { width: W, height: H } = canvas;
      t += 0.003;

      // Read theme color from CSS variable
      const fill = getComputedStyle(document.documentElement)
        .getPropertyValue('--silk-fill').trim() || '#070B14';

      // Clear
      ctx.clearRect(0, 0, W, H);

      // Base fill (theme-aware)
      ctx.fillStyle = fill;
      ctx.fillRect(0, 0, W, H);

      // Layered glowing blobs
      const blobs = [
        { x: 0.15 + 0.1 * Math.sin(t * 0.7),  y: 0.2 + 0.08 * Math.cos(t * 0.5),  r: 0.35, c: [59, 130, 246,  0.1] },
        { x: 0.8  + 0.08 * Math.cos(t * 0.6),  y: 0.15 + 0.1 * Math.sin(t * 0.8),  r: 0.30, c: [139, 92, 246,  0.1] },
        { x: 0.5  + 0.12 * Math.sin(t * 0.4),  y: 0.65 + 0.1 * Math.cos(t * 0.6),  r: 0.40, c: [20, 184, 166,  0.07]},
        { x: 0.2  + 0.06 * Math.cos(t * 0.9),  y: 0.75 + 0.06 * Math.sin(t * 0.7), r: 0.28, c: [99,  102, 241, 0.08]},
        { x: 0.75 + 0.1  * Math.sin(t * 0.5),  y: 0.6  + 0.08 * Math.cos(t * 0.4), r: 0.32, c: [59, 130, 246,  0.06]},
      ];

      blobs.forEach(({ x, y, r, c }) => {
        const gx = x * W;
        const gy = y * H;
        const gr = r * Math.max(W, H);
        const grad = ctx.createRadialGradient(gx, gy, 0, gx, gy, gr);
        grad.addColorStop(0,   `rgba(${c[0]},${c[1]},${c[2]},${c[3]})`);
        grad.addColorStop(1,   `rgba(${c[0]},${c[1]},${c[2]},0)`);
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, W, H);
      });

      // Subtle horizontal silk-like wave lines
      ctx.save();
      ctx.globalAlpha = 0.04;
      const lineCount = 12;
      for (let i = 0; i < lineCount; i++) {
        const yBase = (i / lineCount) * H;
        ctx.beginPath();
        ctx.moveTo(0, yBase);
        for (let x = 0; x <= W; x += 4) {
          const y = yBase
            + 18 * Math.sin((x / W) * Math.PI * 3 + t * 2 + i * 0.5)
            + 10 * Math.sin((x / W) * Math.PI * 7 + t * 1.3 + i);
          ctx.lineTo(x, y);
        }
        ctx.strokeStyle = `hsl(${220 + i * 8}, 70%, 70%)`;
        ctx.lineWidth = 1;
        ctx.stroke();
      }
      ctx.restore();

      animRef.current = requestAnimationFrame(draw);
    };

    animRef.current = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full pointer-events-none"
      style={{ zIndex: 0, opacity: 1 }}
    />
  );
};

export default SilkBackground;
