/** Visible time since tracker mount. Not load time, attention, or proof of reading. */
export function createSellerVisibilityClock(now: () => number, initiallyVisible: boolean) {
  const startedAt = now();
  let visible = initiallyVisible;
  let resumedAt = startedAt;
  let accumulated = 0;
  return {
    setVisible(next: boolean) {
      if (next === visible) return false;
      const current = now();
      if (visible) accumulated += Math.max(0, current - resumedAt);
      visible = next;
      resumedAt = current;
      return true;
    },
    snapshot() {
      const current = now();
      return {
        elapsedMs: Math.max(0, current - startedAt),
        activeVisibleMs: accumulated + (visible ? Math.max(0, current - resumedAt) : 0),
      };
    },
    isVisible: () => visible,
  };
}
