"use client";

import { useEffect } from "react";
import { trackSellerFunnelEvent } from "@/lib/seller-funnel-tracking";

function currentScrollDepth(): number {
  const documentHeight = Math.max(document.documentElement.scrollHeight, document.body.scrollHeight);
  if (documentHeight <= window.innerHeight) return 100;
  return Math.round(((window.scrollY + window.innerHeight) / documentHeight) * 100);
}

export function SellerOptionsJourneyTracker() {
  useEffect(() => {
    const startedAt = performance.now();
    let firstEngagementRecorded = false;

    trackSellerFunnelEvent("landing_arrived", { onceKey: "landing_arrived" });

    const recordEngagement = (detail: string) => {
      if (firstEngagementRecorded) return;
      firstEngagementRecorded = true;
      trackSellerFunnelEvent("page_engaged", {
        detail,
        elapsedMs: performance.now() - startedAt,
        scrollDepth: currentScrollDepth(),
        onceKey: "page_engaged",
      });
    };

    const onPointer = () => recordEngagement("pointer");
    const onKeyboard = () => recordEngagement("keyboard");
    const onScroll = () => recordEngagement("scroll");
    window.addEventListener("pointerdown", onPointer, { passive: true });
    window.addEventListener("touchstart", onPointer, { passive: true });
    window.addEventListener("keydown", onKeyboard);
    window.addEventListener("scroll", onScroll, { passive: true });

    const engagedTimer = window.setTimeout(() => {
      trackSellerFunnelEvent("engaged_7s", {
        elapsedMs: performance.now() - startedAt,
        scrollDepth: currentScrollDepth(),
        onceKey: "engaged_7s",
      });
    }, 7_000);

    const form = document.getElementById("get-options");
    let observer: IntersectionObserver | null = null;
    if (form && "IntersectionObserver" in window) {
      observer = new IntersectionObserver((entries) => {
        if (!entries.some((entry) => entry.isIntersecting && entry.intersectionRatio >= 0.25)) return;
        trackSellerFunnelEvent("form_viewed", {
          elapsedMs: performance.now() - startedAt,
          scrollDepth: currentScrollDepth(),
          onceKey: "form_viewed",
        });
        observer?.disconnect();
      }, { threshold: [0.25] });
      observer.observe(form);
    }

    const onDocumentClick = (event: MouseEvent) => {
      const target = event.target instanceof Element
        ? event.target.closest<HTMLAnchorElement>('a[href^="tel:"], a[href^="sms:"]')
        : null;
      if (!target) return;
      const location = target.closest("header")
        ? "header"
        : target.closest("footer") ? "footer" : target.closest("#get-options") ? "form" : "page";
      trackSellerFunnelEvent("call_clicked", {
        detail: location,
        elapsedMs: performance.now() - startedAt,
        scrollDepth: currentScrollDepth(),
      });
    };
    document.addEventListener("click", onDocumentClick);

    const recordExit = () => {
      trackSellerFunnelEvent("page_exited", {
        elapsedMs: performance.now() - startedAt,
        scrollDepth: currentScrollDepth(),
        onceKey: "page_exited",
        beacon: true,
      });
    };
    window.addEventListener("pagehide", recordExit);
    const onVisibilityChange = () => {
      if (document.visibilityState === "hidden") recordExit();
    };
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      window.clearTimeout(engagedTimer);
      observer?.disconnect();
      window.removeEventListener("pointerdown", onPointer);
      window.removeEventListener("touchstart", onPointer);
      window.removeEventListener("keydown", onKeyboard);
      window.removeEventListener("scroll", onScroll);
      document.removeEventListener("click", onDocumentClick);
      window.removeEventListener("pagehide", recordExit);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, []);

  return null;
}
