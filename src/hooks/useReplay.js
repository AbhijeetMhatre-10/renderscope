import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { buildReplayTimeline, gsap } from '../lib/gsap';
import { getResourceMeta } from '../components/waterfall/waterfallUtils';

export const REPLAY_SPEEDS = [0.5, 1, 2, 5];

function buildMeasuredMilestones(metrics, totalDurationMs) {
  if (!metrics) return [];

  const candidates = [
    { id: 'ttfb', label: 'TTFB', fullLabel: 'Time to First Byte', ms: metrics.ttfb, colorVar: 'var(--warning)' },
    { id: 'fcp', label: 'FCP', fullLabel: 'First Contentful Paint', ms: metrics.fcp, colorVar: 'var(--success)' },
    { id: 'dcl', label: 'DCL', fullLabel: 'DOMContentLoaded', ms: metrics.domContentLoaded, colorVar: 'var(--info)' },
    { id: 'lcp', label: 'LCP', fullLabel: 'Largest Contentful Paint', ms: metrics.lcp, colorVar: 'var(--error)' },
    { id: 'load', label: 'Load', fullLabel: 'Window Load Complete', ms: metrics.load, colorVar: 'var(--resource-font)' },
  ];

  return candidates
    .filter((item) => typeof item.ms === 'number' && Number.isFinite(item.ms) && item.ms >= 0 && item.ms <= totalDurationMs)
    .sort((a, b) => a.ms - b.ms);
}

function resolveActiveEvent(currentTimeMs, resources, milestones) {
  // Highlight any measured browser milestone near the current playback timestamp
  const hitMilestone = milestones.find(
    (m) => currentTimeMs >= m.ms && currentTimeMs <= m.ms + 140
  );
  if (hitMilestone) {
    return {
      kind: 'milestone',
      id: hitMilestone.id,
      badge: hitMilestone.label,
      title: hitMilestone.fullLabel,
      timeMs: hitMilestone.ms,
      colorVar: hitMilestone.colorVar,
    };
  }

  // Otherwise pick the most recently started resource currently active at currentTimeMs
  let activeRes = null;
  let lastStartedRes = null;

  for (const res of resources) {
    const start = typeof res.startTime === 'number' && Number.isFinite(res.startTime) ? Math.max(0, res.startTime) : 0;
    const dur = typeof res.duration === 'number' && Number.isFinite(res.duration) ? Math.max(24, res.duration) : 40;

    if (currentTimeMs >= start && currentTimeMs <= start + dur) {
      if (!activeRes || start >= (activeRes.startTime || 0)) {
        activeRes = res;
      }
    }
    if (currentTimeMs >= start) {
      if (!lastStartedRes || start >= (lastStartedRes.startTime || 0)) {
        lastStartedRes = res;
      }
    }
  }

  const chosen = activeRes || lastStartedRes;
  if (!chosen) return null;

  const meta = getResourceMeta(chosen.type);
  return {
    kind: 'resource',
    id: chosen.id,
    badge: meta.label,
    title: chosen.name,
    type: chosen.type,
    status: activeRes ? 'loading' : 'loaded',
    timeMs: typeof chosen.startTime === 'number' ? chosen.startTime : 0,
    colorVar: meta.colorVar,
  };
}

export function useReplay({
  resources = [],
  metrics = null,
  totalDurationMs = 1000,
  rowsContainerRef,
  cursorRef,
  trackWidth = 0,
}) {
  const duration = Math.max(100, Math.round(totalDurationMs));

  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isReplayActive, setIsReplayActive] = useState(false);
  const [speed, setSpeedState] = useState(1);

  const timelineRef = useRef(null);
  const speedRef = useRef(speed);
  const currentTimeRef = useRef(currentTime);
  const isReplayActiveRef = useRef(isReplayActive);
  const isPlayingRef = useRef(isPlaying);

  useEffect(() => {
    speedRef.current = speed;
  }, [speed]);

  useEffect(() => {
    currentTimeRef.current = currentTime;
  }, [currentTime]);

  useEffect(() => {
    isReplayActiveRef.current = isReplayActive;
  }, [isReplayActive]);

  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  const milestones = useMemo(
    () => buildMeasuredMilestones(metrics, duration),
    [metrics, duration]
  );

  const activeEvent = useMemo(
    () => (isReplayActive ? resolveActiveEvent(currentTime, resources, milestones) : null),
    [isReplayActive, currentTime, resources, milestones]
  );

  const stats = useMemo(() => {
    let activeCount = 0;
    let completedCount = 0;
    for (const res of resources) {
      const start = typeof res.startTime === 'number' && Number.isFinite(res.startTime) ? Math.max(0, res.startTime) : 0;
      const dur = typeof res.duration === 'number' && Number.isFinite(res.duration) ? Math.max(24, res.duration) : 40;
      if (currentTime >= start + dur) {
        completedCount += 1;
      } else if (currentTime >= start) {
        activeCount += 1;
      }
    }
    return { activeCount, completedCount, totalCount: resources.length };
  }, [resources, currentTime]);

  const killTimeline = useCallback(() => {
    if (timelineRef.current) {
      timelineRef.current.kill();
      timelineRef.current = null;
    }
  }, []);

  const restoreStaticBars = useCallback(() => {
    if (rowsContainerRef?.current) {
      const bars = rowsContainerRef.current.querySelectorAll('[data-waterfall-bar]');
      gsap.set(bars, { scaleX: 1, opacity: 1, clearProps: 'transform,opacity' });
    }
    if (cursorRef?.current) {
      gsap.set(cursorRef.current, { autoAlpha: 0 });
    }
  }, [rowsContainerRef, cursorRef]);

  const ensureTimeline = useCallback(() => {
    if (timelineRef.current) return timelineRef.current;
    if (!rowsContainerRef?.current || !trackWidth || resources.length === 0) return null;

    const tl = buildReplayTimeline({
      container: rowsContainerRef.current,
      cursorEl: cursorRef?.current || null,
      trackWidth,
      totalDurationMs: duration,
      speed: speedRef.current,
      onUpdate: (timeMs) => {
        const clamped = Math.max(0, Math.min(duration, timeMs));
        currentTimeRef.current = clamped;
        setCurrentTime(clamped);
      },
      onComplete: () => {
        currentTimeRef.current = duration;
        setCurrentTime(duration);
        setIsPlaying(false);
      },
    });

    timelineRef.current = tl;
    return tl;
  }, [rowsContainerRef, cursorRef, trackWidth, duration, resources.length]);

  // If trackWidth changes (e.g. zoom or window resize) while replay is active, rebuild smoothly at currentTime
  useEffect(() => {
    if (!isReplayActiveRef.current || !timelineRef.current) return;
    const wasPlaying = isPlayingRef.current;
    const savedTimeSec = currentTimeRef.current / 1000;

    killTimeline();
    const tl = ensureTimeline();
    if (!tl) return;

    tl.time(Math.min(duration / 1000, Math.max(0, savedTimeSec)));
    if (wasPlaying) {
      tl.play();
    }
  }, [trackWidth, duration, killTimeline, ensureTimeline]);

  // Clean up GSAP timeline on unmount
  useEffect(() => () => {
    killTimeline();
  }, [killTimeline]);

  const play = useCallback(() => {
    if (resources.length === 0) return;
    const tl = ensureTimeline();
    if (!tl) return;

    setIsReplayActive(true);
    if (currentTimeRef.current >= duration - 10) {
      currentTimeRef.current = 0;
      setCurrentTime(0);
      tl.time(0);
    }
    tl.timeScale(speedRef.current);
    tl.play();
    setIsPlaying(true);
  }, [resources.length, ensureTimeline, duration]);

  const pause = useCallback(() => {
    if (timelineRef.current) {
      timelineRef.current.pause();
    }
    setIsPlaying(false);
  }, []);

  const restart = useCallback(() => {
    if (resources.length === 0) return;
    killTimeline();
    const tl = ensureTimeline();
    if (!tl) return;

    currentTimeRef.current = 0;
    setCurrentTime(0);
    setIsReplayActive(true);
    tl.timeScale(speedRef.current);
    tl.play(0);
    setIsPlaying(true);
  }, [resources.length, killTimeline, ensureTimeline]);

  const seek = useCallback(
    (timeMs) => {
      if (resources.length === 0) return;
      const clamped = Math.max(0, Math.min(duration, Math.round(timeMs)));
      const tl = ensureTimeline();
      if (!tl) return;

      setIsReplayActive(true);
      currentTimeRef.current = clamped;
      setCurrentTime(clamped);
      tl.time(clamped / 1000);
    },
    [resources.length, duration, ensureTimeline]
  );

  const setSpeed = useCallback((nextSpeed) => {
    const valid = REPLAY_SPEEDS.includes(nextSpeed) ? nextSpeed : 1;
    speedRef.current = valid;
    setSpeedState(valid);
    if (timelineRef.current) {
      timelineRef.current.timeScale(valid);
    }
  }, []);

  const exitReplay = useCallback(() => {
    killTimeline();
    restoreStaticBars();
    currentTimeRef.current = 0;
    setCurrentTime(0);
    setIsPlaying(false);
    setIsReplayActive(false);
  }, [killTimeline, restoreStaticBars]);

  return {
    currentTime,
    duration,
    isPlaying,
    isReplayActive,
    speed,
    activeEvent,
    milestones,
    stats,
    play,
    pause,
    restart,
    seek,
    setSpeed,
    exitReplay,
  };
}

export default useReplay;
