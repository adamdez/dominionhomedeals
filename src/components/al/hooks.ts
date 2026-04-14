"use client";

import { useEffect, useRef, useCallback, useState } from "react";

export function useCursorSpotlight() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    let raf = 0;
    let mx = -1000;
    let my = -1000;
    const target = el;

    function onMove(e: PointerEvent) {
      mx = e.clientX;
      my = e.clientY;
      if (!raf) {
        raf = requestAnimationFrame(() => {
          target.style.left = `${mx}px`;
          target.style.top = `${my}px`;
          target.style.opacity = "1";
          raf = 0;
        });
      }
    }

    function onLeave() {
      target.style.opacity = "0";
    }

    document.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("pointerleave", onLeave);

    return () => {
      document.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerleave", onLeave);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return ref;
}

export function useTilt3D(intensity = 6) {
  const ref = useRef<HTMLDivElement>(null);

  const onMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const el = ref.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      el.style.transform = `perspective(800px) rotateY(${x * intensity}deg) rotateX(${-y * intensity}deg) scale3d(1.01, 1.01, 1.01)`;
    },
    [intensity],
  );

  const onLeave = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    el.style.transform = "perspective(800px) rotateY(0deg) rotateX(0deg) scale3d(1, 1, 1)";
  }, []);

  return { ref, onMouseMove: onMove, onMouseLeave: onLeave };
}

export function useAnimatedCounter(target: number, duration = 600) {
  const [value, setValue] = useState(0);
  const prevRef = useRef(0);
  const frameRef = useRef(0);

  useEffect(() => {
    const start = prevRef.current;
    const diff = target - start;
    if (diff === 0) return;

    const startTime = performance.now();

    function tick(now: number) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(start + diff * eased);
      setValue(current);

      if (progress < 1) {
        frameRef.current = requestAnimationFrame(tick);
      } else {
        prevRef.current = target;
      }
    }

    frameRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameRef.current);
  }, [target, duration]);

  return value;
}

export function useStaggeredEntrance(count: number, baseDelay = 60) {
  return Array.from({ length: count }, (_, i) => ({
    initial: { opacity: 0, y: 12, scale: 0.97, filter: "blur(4px)" },
    animate: { opacity: 1, y: 0, scale: 1, filter: "blur(0px)" },
    transition: {
      duration: 0.45,
      delay: i * (baseDelay / 1000),
      ease: [0.16, 1, 0.3, 1] as [number, number, number, number],
    },
  }));
}
