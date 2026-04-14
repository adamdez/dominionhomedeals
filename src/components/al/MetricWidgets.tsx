"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";

export function AnimatedNumber({
  value,
  className,
  duration = 600,
}: {
  value: number;
  className?: string;
  duration?: number;
}) {
  const [display, setDisplay] = useState(0);
  const prevRef = useRef(0);
  const frameRef = useRef(0);

  useEffect(() => {
    const start = prevRef.current;
    const diff = value - start;
    if (diff === 0) {
      setDisplay(value);
      return;
    }

    const startTime = performance.now();
    function tick(now: number) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(start + diff * eased));
      if (progress < 1) {
        frameRef.current = requestAnimationFrame(tick);
      } else {
        prevRef.current = value;
      }
    }

    frameRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameRef.current);
  }, [value, duration]);

  return (
    <motion.span
      key={value}
      className={className}
      initial={{ opacity: 0.6, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
    >
      {display}
    </motion.span>
  );
}

export function MiniSparkline({
  data,
  color = "var(--al-cyan)",
  height = 20,
  barCount = 8,
}: {
  data?: number[];
  color?: string;
  height?: number;
  barCount?: number;
}) {
  const bars = data && data.length > 0 ? data.slice(-barCount) : Array(barCount).fill(0);
  const max = Math.max(...bars, 1);

  return (
    <div className="al-sparkline" style={{ height }}>
      {bars.map((v, i) => {
        const h = Math.max((v / max) * 100, 8);
        const isLast = i === bars.length - 1;
        return (
          <motion.span
            key={i}
            className="al-sparkline-bar"
            style={{ background: color, opacity: isLast ? 0.85 : 0.25 + (i / bars.length) * 0.35 }}
            initial={{ height: "8%" }}
            animate={{ height: `${h}%` }}
            transition={{ duration: 0.5, delay: i * 0.04, ease: [0.16, 1, 0.3, 1] }}
          />
        );
      })}
    </div>
  );
}

export function StatusRing({
  status,
  size = 8,
}: {
  status: "live" | "degraded" | "blocked" | "healthy" | "warning" | "failing";
  size?: number;
}) {
  const colorMap: Record<string, string> = {
    live: "var(--al-green)",
    healthy: "var(--al-green)",
    degraded: "var(--al-amber)",
    warning: "var(--al-amber)",
    blocked: "var(--al-red)",
    failing: "var(--al-red)",
  };
  const c = colorMap[status] || "var(--al-cyan)";
  const shouldPulse = status === "live" || status === "healthy";

  return (
    <span
      className={`relative inline-block rounded-full ${shouldPulse ? "al-status-pulse" : ""}`}
      style={{ width: size, height: size, background: c, color: c }}
    >
      {shouldPulse && (
        <span
          className="absolute inset-0 rounded-full animate-al-breath"
          style={{ boxShadow: `0 0 6px ${c}` }}
        />
      )}
    </span>
  );
}

export function GlassMetricTile({
  label,
  value,
  accentColor,
  glowWhen,
  sparkData,
}: {
  label: string;
  value: number | string;
  accentColor?: string;
  glowWhen?: boolean;
  sparkData?: number[];
}) {
  const numericValue = typeof value === "number" ? value : parseInt(value, 10);
  const isNumeric = !isNaN(numericValue);
  const color = accentColor || "var(--al-cyan-muted)";

  return (
    <div
      className="al-glass-subtle al-inner-light rounded-2xl p-4 relative overflow-hidden group"
      style={{ borderColor: `color-mix(in srgb, ${color} 12%, transparent)` }}
    >
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
        style={{ background: `radial-gradient(ellipse at 50% 0%, color-mix(in srgb, ${color} 4%, transparent), transparent 70%)` }}
      />
      <p
        className="al-brass-label font-mono relative z-10"
        style={{ color: `color-mix(in srgb, ${color} 70%, var(--al-text-tertiary))` }}
      >
        {label}
      </p>
      <div className="mt-2 flex items-end justify-between gap-3 relative z-10">
        {isNumeric ? (
          <AnimatedNumber
            value={numericValue}
            className={`text-3xl font-semibold font-mono text-[var(--al-text-primary)] tabular-nums ${glowWhen ? "al-glow-metric" : ""}`}
          />
        ) : (
          <span className="text-3xl font-semibold font-mono text-[var(--al-text-primary)] tabular-nums">
            {value}
          </span>
        )}
        {sparkData && <MiniSparkline data={sparkData} color={color} />}
      </div>
    </div>
  );
}
