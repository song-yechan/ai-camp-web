"use client";

import { useRef, useEffect, useCallback, useMemo } from "react";

interface Dot {
  cx: number;
  cy: number;
  xOffset: number;
  yOffset: number;
  vx: number;
  vy: number;
}

export interface DotGridProps {
  dotSize?: number;
  gap?: number;
  baseColor?: string;
  activeColor?: string;
  proximity?: number;
  shockRadius?: number;
  shockStrength?: number;
  returnSpeed?: number;
  className?: string;
  style?: React.CSSProperties;
}

function hexToRgb(hex: string) {
  const m = hex.match(/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i);
  if (!m) return { r: 0, g: 0, b: 0 };
  return {
    r: parseInt(m[1], 16),
    g: parseInt(m[2], 16),
    b: parseInt(m[3], 16),
  };
}

const DotGrid: React.FC<DotGridProps> = ({
  dotSize = 16,
  gap = 32,
  baseColor = "#5227FF",
  activeColor = "#5227FF",
  proximity = 150,
  shockRadius = 200,
  shockStrength = 3,
  returnSpeed = 0.08,
  className = "",
  style,
}) => {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dotsRef = useRef<Dot[]>([]);
  const pointerRef = useRef({ x: -9999, y: -9999 });

  const baseRgb = useMemo(() => hexToRgb(baseColor), [baseColor]);
  const activeRgb = useMemo(() => hexToRgb(activeColor), [activeColor]);

  const circlePath = useMemo(() => {
    if (typeof window === "undefined" || !window.Path2D) return null;
    const p = new Path2D();
    p.arc(0, 0, dotSize / 2, 0, Math.PI * 2);
    return p;
  }, [dotSize]);

  const buildGrid = useCallback(() => {
    const wrap = wrapperRef.current;
    const canvas = canvasRef.current;
    if (!wrap || !canvas) return;

    const { width, height } = wrap.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    const cols = Math.floor((width + gap) / (dotSize + gap));
    const rows = Math.floor((height + gap) / (dotSize + gap));
    const cell = dotSize + gap;

    const gridW = cell * cols - gap;
    const gridH = cell * rows - gap;

    const startX = (width - gridW) / 2 + dotSize / 2;
    const startY = (height - gridH) / 2 + dotSize / 2;

    const dots: Dot[] = [];
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        dots.push({
          cx: startX + x * cell,
          cy: startY + y * cell,
          xOffset: 0,
          yOffset: 0,
          vx: 0,
          vy: 0,
        });
      }
    }
    dotsRef.current = dots;
  }, [dotSize, gap]);

  // Animation loop
  useEffect(() => {
    if (!circlePath) return;

    let rafId: number;
    const proxSq = proximity * proximity;
    const friction = 0.92;

    const draw = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const { x: px, y: py } = pointerRef.current;

      for (const dot of dotsRef.current) {
        // Spring back to origin
        const springX = -dot.xOffset * returnSpeed;
        const springY = -dot.yOffset * returnSpeed;
        dot.vx = (dot.vx + springX) * friction;
        dot.vy = (dot.vy + springY) * friction;
        dot.xOffset += dot.vx;
        dot.yOffset += dot.vy;

        // Snap to zero if close enough
        if (
          Math.abs(dot.xOffset) < 0.01 &&
          Math.abs(dot.yOffset) < 0.01 &&
          Math.abs(dot.vx) < 0.01 &&
          Math.abs(dot.vy) < 0.01
        ) {
          dot.xOffset = 0;
          dot.yOffset = 0;
          dot.vx = 0;
          dot.vy = 0;
        }

        // 근접 반응: 마우스에서 밀려남
        const dx = dot.cx - px;
        const dy = dot.cy - py;
        const dsq = dx * dx + dy * dy;

        if (dsq <= proxSq && dsq > 0) {
          const dist = Math.sqrt(dsq);
          const force = (1 - dist / proximity) * 0.4;
          dot.vx += (dx / dist) * force;
          dot.vy += (dy / dist) * force;
        }

        const ox = dot.cx + dot.xOffset;
        const oy = dot.cy + dot.yOffset;

        let fillStyle = baseColor;
        if (dsq <= proxSq) {
          const dist = Math.sqrt(dsq);
          const t = 1 - dist / proximity;
          const r = Math.round(baseRgb.r + (activeRgb.r - baseRgb.r) * t);
          const g = Math.round(baseRgb.g + (activeRgb.g - baseRgb.g) * t);
          const b = Math.round(baseRgb.b + (activeRgb.b - baseRgb.b) * t);
          fillStyle = `rgb(${r},${g},${b})`;
        }

        ctx.save();
        ctx.translate(ox, oy);
        ctx.fillStyle = fillStyle;
        ctx.fill(circlePath);
        ctx.restore();
      }

      rafId = requestAnimationFrame(draw);
    };

    draw();
    return () => cancelAnimationFrame(rafId);
  }, [proximity, baseColor, activeRgb, baseRgb, circlePath, returnSpeed]);

  // Build grid on mount + resize + DPR change + visibility change
  useEffect(() => {
    buildGrid();

    // 화면 크기 변경 감지
    const ro = new ResizeObserver(buildGrid);
    if (wrapperRef.current) ro.observe(wrapperRef.current);

    // devicePixelRatio 변경 감지 (모니터 연결/해제)
    let dprMedia: MediaQueryList | null = null;
    const watchDpr = () => {
      dprMedia = window.matchMedia(`(resolution: ${window.devicePixelRatio}dppx)`);
      dprMedia.addEventListener("change", handleDprChange, { once: true });
    };
    const handleDprChange = () => {
      buildGrid();
      watchDpr();
    };
    watchDpr();

    // 잠자기 후 복귀 감지
    const handleVisibility = () => {
      if (document.visibilityState === "visible") buildGrid();
    };
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      ro.disconnect();
      dprMedia?.removeEventListener("change", handleDprChange);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [buildGrid]);

  // Mouse / click handlers
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const onMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      pointerRef.current.x = e.clientX - rect.left;
      pointerRef.current.y = e.clientY - rect.top;
    };

    window.addEventListener("mousemove", onMove, { passive: true });

    return () => {
      window.removeEventListener("mousemove", onMove);
    };
  }, [shockRadius, shockStrength]);

  return (
    <div
      className={`flex items-center justify-center h-full w-full relative ${className}`}
      style={style}
    >
      <div ref={wrapperRef} className="w-full h-full relative">
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full pointer-events-none"
        />
      </div>
    </div>
  );
};

export default DotGrid;
