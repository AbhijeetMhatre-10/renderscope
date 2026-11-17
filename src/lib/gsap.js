import gsap from 'gsap';

/**
 * GSAP animation helpers for RenderScope Waterfall & Sequence Replay.
 * Handles bar entrance, smooth timeline cursor tracking, selection transitions,
 * and chronological replay timelines while respecting prefers-reduced-motion.
 */

export const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export const createWaterfallTimeline = (options = {}) => {
  return gsap.timeline({
    paused: true,
    defaults: {
      ease: 'power2.out',
      duration: 0.4,
    },
    ...options,
  });
};

export const animateResourceBar = (element, { delay = 0, duration = 0.55 } = {}) => {
  if (!element) return null;
  if (prefersReducedMotion()) {
    gsap.set(element, { scaleX: 1, opacity: 1 });
    return null;
  }

  return gsap.fromTo(
    element,
    { scaleX: 0, opacity: 0.35, transformOrigin: 'left center' },
    {
      scaleX: 1,
      opacity: 1,
      duration,
      delay,
      ease: 'power2.out',
    }
  );
};

/**
 * Staggered entrance animation for all waterfall resource bars inside a container.
 */
export const animateWaterfallEntrance = (container) => {
  if (!container) return null;
  const bars = container.querySelectorAll('[data-waterfall-bar]');
  if (!bars.length) return null;

  if (prefersReducedMotion()) {
    gsap.set(bars, { scaleX: 1, opacity: 1 });
    return null;
  }

  return gsap.fromTo(
    bars,
    { scaleX: 0, opacity: 0.25, transformOrigin: 'left center' },
    {
      scaleX: 1,
      opacity: 1,
      duration: 0.48,
      stagger: { amount: 0.35, from: 'start' },
      ease: 'power2.out',
      clearProps: 'transform,opacity',
    }
  );
};

/**
 * Creates a smooth GSAP quickTo follower for the interactive timeline cursor.
 */
export const createTimelineCursorController = (cursorEl) => {
  if (!cursorEl) return null;
  const reduced = prefersReducedMotion();

  const moveX = reduced
    ? (x) => gsap.set(cursorEl, { x })
    : gsap.quickTo(cursorEl, 'x', { duration: 0.1, ease: 'power3.out' });

  const setVisible = (visible) => {
    gsap.to(cursorEl, {
      autoAlpha: visible ? 1 : 0,
      duration: reduced ? 0 : 0.14,
      overwrite: 'auto',
    });
  };

  return { moveX, setVisible };
};

/**
 * Smooth selection transition for the ResourceDetails inspector panel and its timing bars.
 */
export const animateSelectionTransition = (panelEl) => {
  if (!panelEl) return null;
  const fills = panelEl.querySelectorAll('[data-detail-bar]');

  if (prefersReducedMotion()) {
    gsap.set(panelEl, { opacity: 1, y: 0 });
    if (fills.length) gsap.set(fills, { scaleX: 1 });
    return null;
  }

  const tl = gsap.timeline();
  tl.fromTo(
    panelEl,
    { opacity: 0, y: 10 },
    { opacity: 1, y: 0, duration: 0.26, ease: 'power2.out', clearProps: 'transform' }
  );

  if (fills.length) {
    tl.fromTo(
      fills,
      { scaleX: 0, transformOrigin: 'left center' },
      { scaleX: 1, duration: 0.42, stagger: 0.05, ease: 'power2.out' },
      '-=0.14'
    );
  }

  return tl;
};

/**
 * Builds a GSAP timeline that maps real measured resource timings (ms) directly
 * to animation timings (seconds), preserving exact relative start & duration ratios.
 * Supports dynamic timeScale (0.5x, 1x, 2x, 5x), play/pause/restart, and scrubbing via tl.time().
 */
export const buildReplayTimeline = ({
  container,
  cursorEl,
  trackWidth,
  totalDurationMs,
  speed = 1,
  onUpdate,
  onComplete,
}) => {
  if (!container || !trackWidth || !totalDurationMs) return null;

  const totalSec = Math.max(0.1, totalDurationMs / 1000);
  const bars = Array.from(container.querySelectorAll('[data-waterfall-bar]'));

  const tl = createWaterfallTimeline({
    onUpdate: () => {
      if (onUpdate) onUpdate(Math.round(tl.time() * 1000));
    },
    onComplete: () => {
      if (onComplete) onComplete();
    },
  });

  // Always span the exact real duration even if all bars finish slightly earlier
  tl.to({}, { duration: totalSec }, 0);

  if (cursorEl) {
    tl.set(cursorEl, { autoAlpha: 1 }, 0);
    tl.fromTo(
      cursorEl,
      { x: 0 },
      {
        x: trackWidth,
        duration: totalSec,
        ease: 'none',
      },
      0
    );
  }

  bars.forEach((bar) => {
    const startMs = Math.max(0, Number(bar.dataset.startMs) || 0);
    const durationMs = Math.max(24, Number(bar.dataset.durationMs) || 40);

    const startSec = Math.min(totalSec - 0.02, startMs / 1000);
    const barDurationSec = Math.max(0.024, Math.min(totalSec - startSec, durationMs / 1000));

    tl.fromTo(
      bar,
      { scaleX: 0, opacity: 0.2, transformOrigin: 'left center' },
      {
        scaleX: 1,
        opacity: 1,
        duration: barDurationSec,
        ease: 'none',
      },
      startSec
    );
  });

  tl.timeScale(speed);
  return tl;
};

/**
 * Prepares a chronological GSAP replay timeline that sweeps the timeline cursor
 * across the track while animating each resource bar at its proportional startTime.
 */
export const prepareWaterfallReplay = ({
  container,
  cursorEl,
  trackWidth,
  totalDurationMs,
  replaySeconds = 3.2,
  onProgress,
  onComplete,
}) => {
  const speed = totalDurationMs > 0 ? totalDurationMs / 1000 / Math.max(0.2, replaySeconds) : 1;
  const tl = buildReplayTimeline({
    container,
    cursorEl,
    trackWidth,
    totalDurationMs,
    speed,
    onUpdate: (timeMs) => {
      if (onProgress) onProgress(Math.min(1, timeMs / Math.max(1, totalDurationMs)));
    },
    onComplete,
  });
  return tl;
};

export { gsap };
