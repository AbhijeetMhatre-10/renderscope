import gsap from 'gsap';

/**
 * GSAP boilerplate helper configured for RenderScope Phase 2
 * Provides helpers for waterfall timing animations, timeline scrubbers,
 * and loading replay sequences.
 */

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

export const animateResourceBar = (element, { startPercent, durationPercent, delay = 0 }) => {
  if (!element) return null;
  return gsap.fromTo(
    element,
    { scaleX: 0, transformOrigin: 'left center' },
    {
      scaleX: 1,
      duration: 0.6,
      delay: delay,
      ease: 'power1.out',
    }
  );
};

export { gsap };
