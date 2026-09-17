"use client";

import { useEffect } from "react";
import { trackSellerFunnelEvent } from "@/lib/seller-funnel-tracking";
import { createSellerVisibilityClock } from "@/lib/seller-visibility-clock";

function currentScrollDepth(): number {
  const documentHeight = Math.max(document.documentElement.scrollHeight, document.body.scrollHeight);
  if (documentHeight <= window.innerHeight) return 100;
  return Math.round(((window.scrollY + window.innerHeight) / documentHeight) * 100);
}

export function SellerOptionsJourneyTracker() {
  useEffect(() => {
    const clock = createSellerVisibilityClock(() => performance.now(), document.visibilityState === "visible");
    let firstEngagementRecorded = false;

    trackSellerFunnelEvent("landing_arrived", { onceKey: "landing_arrived" });

    const recordEngagement = (detail: string) => {
      if (firstEngagementRecorded || !clock.isVisible()) return;
      firstEngagementRecorded = true;
      trackSellerFunnelEvent("page_engaged", {
        detail,
        ...clock.snapshot(),
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

    let engagementRecorded = false;
    let engagedTimer: number | undefined;
    const scheduleEngagement = () => {
      window.clearTimeout(engagedTimer);
      if (engagementRecorded || !clock.isVisible()) return;
      engagedTimer = window.setTimeout(() => {
        if (!clock.isVisible()) return;
        const timing = clock.snapshot();
        if (timing.activeVisibleMs < 7_000) { scheduleEngagement(); return; }
        engagementRecorded = true;
        trackSellerFunnelEvent("engaged_7s", {
          ...timing,
          scrollDepth: currentScrollDepth(),
          onceKey: "engaged_7s",
        });
      }, Math.max(0, 7_000 - clock.snapshot().activeVisibleMs));
    };
    scheduleEngagement();

    const form = document.getElementById("get-options");
    const address = form?.querySelector<HTMLInputElement>('input[name="address"]');
    let observer: IntersectionObserver | null = null;
    const visibleTargets = new Set<Element>();
    const recordedTargets = new Set<Element>();
    const recordFormView = () => {
      if (!clock.isVisible()) return;
      for (const target of visibleTargets) {
        if (recordedTargets.has(target)) continue;
        const isAddress = target === address;
        const detail = isAddress ? "address_field_visible" : "form_container_visible";
        trackSellerFunnelEvent("form_viewed", {
          detail, stage: isAddress ? "address" : undefined,
          ...clock.snapshot(), scrollDepth: currentScrollDepth(), onceKey: detail,
        });
        recordedTargets.add(target);
        observer?.unobserve(target);
      }
    };
    if (form && "IntersectionObserver" in window) {
      observer = new IntersectionObserver((entries) => {
        for (const entry of entries) {
          const threshold = entry.target === address ? 0.75 : 0.25;
          if (entry.isIntersecting && entry.intersectionRatio >= threshold) visibleTargets.add(entry.target);
          else visibleTargets.delete(entry.target);
        }
        recordFormView();
      }, { threshold: [0.25, 0.75] });
      observer.observe(form);
      if (address) observer.observe(address);
    }

    const onDocumentClick = (event: MouseEvent) => {
      const target = event.target instanceof Element
        ? event.target.closest<HTMLAnchorElement>('a[href^="tel:"], a[href^="sms:"], a[href="#get-options"]')
        : null;
      if (!target) return;
      const location = target.closest("header")
        ? "header"
        : target.closest("footer") ? "footer" : target.closest("#get-options") ? "form" : "page";
      const isReview = target.getAttribute("href") === "#get-options";
      trackSellerFunnelEvent(isReview ? "page_engaged" : "call_clicked", {
        detail: isReview ? "review_cta_clicked" : location,
        ...clock.snapshot(),
        scrollDepth: currentScrollDepth(),
      });
    };
    document.addEventListener("click", onDocumentClick);

    let pageHidden = false;
    const recordExit = (event: PageTransitionEvent) => {
      if (pageHidden) return;
      pageHidden = true;
      clock.setVisible(false);
      scheduleEngagement();
      trackSellerFunnelEvent("page_exited", {
        ...clock.snapshot(),
        detail: event.persisted ? "pagehide_bfcache" : "pagehide",
        scrollDepth: currentScrollDepth(),
        beacon: true,
      });
    };
    window.addEventListener("pagehide", recordExit);
    const onVisibilityChange = () => {
      const visible = document.visibilityState === "visible";
      if (!clock.setVisible(visible)) return;
      trackSellerFunnelEvent(visible ? "page_visible" : "page_hidden", {
        ...clock.snapshot(), detail: visible ? "visibility_visible" : "visibility_hidden",
        scrollDepth: currentScrollDepth(), beacon: !visible,
      });
      scheduleEngagement();
      recordFormView();
    };
    const onPageShow = (event: PageTransitionEvent) => {
      if (!event.persisted) return;
      pageHidden = false;
      clock.setVisible(document.visibilityState === "visible");
      trackSellerFunnelEvent("page_restored", { ...clock.snapshot(), detail: "pageshow_bfcache" });
      scheduleEngagement();
      recordFormView();
    };
    window.addEventListener("pageshow", onPageShow);
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
      window.removeEventListener("pageshow", onPageShow);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, []);

  return null;
}
