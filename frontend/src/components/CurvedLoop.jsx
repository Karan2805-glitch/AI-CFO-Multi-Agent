import React, { useEffect, useRef } from 'react';

/**
 * CurvedLoop — SVG curved marquee with pixel-perfect seamless looping.
 * Uses getComputedTextLength() to measure the exact unit length,
 * so the reset snap is invisible.
 */
const CurvedLoop = ({
  marqueeText  = 'AI-CFO ✦',
  speed        = 2,
  curveAmount  = 250,
  direction    = 'left',
  interactive  = false,
  className    = '',
}) => {
  const textPathRef = useRef(null);
  const measureRef  = useRef(null);   // hidden <text> to measure one unit
  const animRef     = useRef(null);
  const offsetRef   = useRef(0);
  const lastTRef    = useRef(null);
  const mouseXRef   = useRef(0.5);
  const unitLenRef  = useRef(null);   // exact px for one text repeat
  const uid         = useRef(`cl_${Math.random().toString(36).slice(2, 8)}`).current;

  const FONT_SIZE = 20;
  const W         = 1100;
  const H         = curveAmount + 80;
  const arcY      = H - 40;
  const pathD     = `M 0 ${arcY} Q ${W / 2} ${arcY - curveAmount} ${W} ${arcY}`;

  // One unit = the text + trailing spaces (used for seamless reset)
  const unitText  = `${marqueeText}    `;
  // Enough repeats to always fill + overflow the arc on both sides
  const fullText  = unitText.repeat(12);

  // ── Measure exact unit length after first render ──────────────────
  useEffect(() => {
    if (measureRef.current) {
      unitLenRef.current = measureRef.current.getComputedTextLength();
    }
  }, [marqueeText]);

  // ── Animation loop ────────────────────────────────────────────────
  useEffect(() => {
    const step = (time) => {
      if (!lastTRef.current) lastTRef.current = time;
      const delta      = time - lastTRef.current;
      lastTRef.current = time;

      let spd = speed;
      if (interactive) spd = speed * (0.3 + mouseXRef.current * 1.4);

      const unit = unitLenRef.current ?? 600; // fallback until measured

      if (direction === 'right') {
        offsetRef.current -= (spd * delta) / 16;
        if (offsetRef.current <= -unit) offsetRef.current += unit;
      } else {
        offsetRef.current += (spd * delta) / 16;
        if (offsetRef.current >= unit) offsetRef.current -= unit;
      }

      if (textPathRef.current) {
        textPathRef.current.setAttribute('startOffset', `${offsetRef.current}px`);
      }
      animRef.current = requestAnimationFrame(step);
    };

    animRef.current = requestAnimationFrame(step);
    return () => {
      cancelAnimationFrame(animRef.current);
      lastTRef.current = null;
    };
  }, [speed, direction, interactive]);

  const handleMouseMove = (e) => {
    if (!interactive) return;
    const rect = e.currentTarget.getBoundingClientRect();
    mouseXRef.current = (e.clientX - rect.left) / rect.width;
  };

  return (
    <div
      style={{ width: '100%', overflow: 'hidden', pointerEvents: interactive ? 'auto' : 'none' }}
      onMouseMove={handleMouseMove}
    >
      <svg
        viewBox={`0 0 ${W} ${H}`}
        xmlns="http://www.w3.org/2000/svg"
        style={{ width: '100%', height: H, display: 'block', overflow: 'visible' }}
      >
        <defs>
          <path id={uid} d={pathD} />
          <linearGradient id={`grad_${uid}`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%"   stopColor="#93C5FD" stopOpacity="1" />
            <stop offset="40%"  stopColor="#C4B5FD" stopOpacity="1" />
            <stop offset="70%"  stopColor="#67E8F9" stopOpacity="1" />
            <stop offset="100%" stopColor="#93C5FD" stopOpacity="1" />
          </linearGradient>
        </defs>

        {/* ── Hidden measurement text (off-screen, same styles as real text) */}
        <text
          ref={measureRef}
          fontSize={FONT_SIZE}
          fontFamily="'Inter', system-ui, sans-serif"
          fontWeight="600"
          letterSpacing="2.5"
          visibility="hidden"
          x="-9999"
          y="-9999"
        >
          {unitText}
        </text>

        {/* ── Visible animated text */}
        <text
          fill={`url(#grad_${uid})`}
          fontSize={FONT_SIZE}
          fontFamily="'Inter', system-ui, sans-serif"
          fontWeight="600"
          letterSpacing="2.5"
          className={className || undefined}
        >
          <textPath ref={textPathRef} href={`#${uid}`} startOffset="0px">
            {fullText}
          </textPath>
        </text>
      </svg>
    </div>
  );
};

export default CurvedLoop;
