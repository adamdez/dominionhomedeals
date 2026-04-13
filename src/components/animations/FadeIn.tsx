import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface FadeInProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  direction?: "up" | "down" | "left" | "right" | "none";
}

export function FadeIn({ children, className, delay = 0, direction = "up" }: FadeInProps) {
  const directionClass =
    direction === "none"
      ? "fade-in-none"
      : direction === "down"
        ? "fade-in-down"
        : direction === "left"
          ? "fade-in-left"
          : direction === "right"
            ? "fade-in-right"
            : "fade-in-up";

  return (
    <div className={cn("fade-in", directionClass, className)} style={{ animationDelay: `${delay}ms` }}>
      {children}
    </div>
  );
}
