import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  Flame,
  Gamepad2,
  RotateCcw,
  Sparkles,
  Trophy,
  Volume2,
  VolumeX,
} from 'lucide-react';

const BEST_SCORE_KEY = 'renderscope-packet-rush-best';

function readThemePalette() {
  if (typeof window === 'undefined') {
    return {
      isLight: false,
      bg: '#0a0b0d',
      surface: '#121418',
      surfaceElevated: '#1a1d24',
      border: '#232730',
      textPrimary: '#f3f4f6',
      textSecondary: '#9ca3af',
      textMuted: '#6b7280',
      info: '#3b82f6',
      success: '#10b981',
      warning: '#f59e0b',
      error: '#ef4444',
      html: '#e44d26',
      css: '#264de4',
      js: '#f7df1e',
      image: '#10b981',
      font: '#a855f7',
    };
  }

  const root = document.documentElement;
  const styles = getComputedStyle(root);
  const getVar = (name, fallback) => styles.getPropertyValue(name).trim() || fallback;
  const isLight = root.getAttribute('data-theme') === 'light';

  return {
    isLight,
    bg: getVar('--background', isLight ? '#f8fafc' : '#0a0b0d'),
    surface: getVar('--surface', isLight ? '#ffffff' : '#121418'),
    surfaceElevated: getVar('--surface-elevated', isLight ? '#f1f5f9' : '#1a1d24'),
    border: getVar('--border', isLight ? '#e2e8f0' : '#232730'),
    textPrimary: getVar('--text-primary', isLight ? '#0f172a' : '#f3f4f6'),
    textSecondary: getVar('--text-secondary', isLight ? '#475569' : '#9ca3af'),
    textMuted: getVar('--text-muted', isLight ? '#94a3b8' : '#6b7280'),
    info: getVar('--info', isLight ? '#2563eb' : '#3b82f6'),
    success: getVar('--success', isLight ? '#059669' : '#10b981'),
    warning: getVar('--warning', isLight ? '#d97706' : '#f59e0b'),
    error: getVar('--error', isLight ? '#dc2626' : '#ef4444'),
    html: getVar('--resource-html', isLight ? '#ea580c' : '#e44d26'),
    css: getVar('--resource-css', isLight ? '#2563eb' : '#264de4'),
    js: getVar('--resource-js', isLight ? '#d97706' : '#f7df1e'),
    image: getVar('--resource-image', isLight ? '#059669' : '#10b981'),
    font: getVar('--resource-font', isLight ? '#9333ea' : '#a855f7'),
  };
}

function readStoredBest() {
  if (typeof window === 'undefined') return 0;
  try {
    const raw = window.localStorage.getItem(BEST_SCORE_KEY);
    const parsed = Number.parseInt(raw || '0', 10);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
  } catch {
    return 0;
  }
}

function saveStoredBest(score) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(BEST_SCORE_KEY, String(score));
  } catch {
    // Ignore storage failures in private browsing.
  }
}

function drawRoundedRect(ctx, x, y, width, height, radius) {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + width - r, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + r);
  ctx.lineTo(x + width, y + height - r);
  ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
  ctx.lineTo(x + r, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

export function PacketCatcherGame({ stepIndex = 0 }) {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const audioCtxRef = useRef(null);
  const soundEnabledRef = useRef(false);
  const stepIndexRef = useRef(stepIndex);

  const [hud, setHud] = useState(() => ({
    score: 0,
    streak: 0,
    caught: 0,
    best: readStoredBest(),
    mode: 'demo', // 'demo' | 'playing'
  }));
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  });
  const [reducedMotionOptIn, setReducedMotionOptIn] = useState(false);

  useEffect(() => {
    stepIndexRef.current = stepIndex;
  }, [stepIndex]);

  useEffect(() => {
    soundEnabledRef.current = soundEnabled;
  }, [soundEnabled]);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return undefined;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const onChange = (event) => setReducedMotion(event.matches);
    mq.addEventListener?.('change', onChange);
    return () => mq.removeEventListener?.('change', onChange);
  }, []);

  const playTone = useCallback((kind, streak = 1) => {
    if (!soundEnabledRef.current || typeof window === 'undefined') return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      if (!audioCtxRef.current) {
        audioCtxRef.current = new AudioCtx();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume().catch(() => {});
      }

      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      if (kind === 'hazard') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(160, now);
        osc.frequency.exponentialRampToValueAtTime(75, now + 0.14);
        gain.gain.setValueAtTime(0.06, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
        osc.start(now);
        osc.stop(now + 0.16);
      } else if (kind === 'boost') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(587.33, now);
        osc.frequency.setValueAtTime(880, now + 0.06);
        gain.gain.setValueAtTime(0.06, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
        osc.start(now);
        osc.stop(now + 0.21);
      } else {
        osc.type = 'sine';
        const baseFreq = 392 * Math.pow(1.06, Math.min(streak, 10));
        osc.frequency.setValueAtTime(baseFreq, now);
        osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.25, now + 0.08);
        gain.gain.setValueAtTime(0.045, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
        osc.start(now);
        osc.stop(now + 0.11);
      }
    } catch {
      // Ignore audio errors on restricted devices.
    }
  }, []);

  const gameRef = useRef({
    mode: 'demo',
    score: 0,
    streak: 0,
    caught: 0,
    best: readStoredBest(),
    width: 640,
    height: 280,
    paddleX: 320,
    targetX: 320,
    paddleWidth: 96,
    paddleGlow: 0,
    shakeTime: 0,
    gridOffset: 0,
    spawnTimer: 0.25,
    packets: [],
    particles: [],
    popups: [],
    ripples: [],
    keys: { left: false, right: false },
    pointerAnchorX: null,
    bannerText: '',
    bannerAlpha: 0,
    palette: readThemePalette(),
  });

  const syncHud = useCallback(() => {
    const g = gameRef.current;
    setHud({
      score: g.score,
      streak: g.streak,
      caught: g.caught,
      best: g.best,
      mode: g.mode,
    });
  }, []);

  const engagePlayer = useCallback(
    (initialX = null) => {
      const g = gameRef.current;
      if (g.mode !== 'playing') {
        g.mode = 'playing';
        g.score = 0;
        g.streak = 0;
        g.caught = 0;
        g.bannerText = 'LIVE CONTROL';
        g.bannerAlpha = 1;
        syncHud();
      }
      if (typeof initialX === 'number') {
        g.targetX = Math.max(g.paddleWidth / 2 + 8, Math.min(g.width - g.paddleWidth / 2 - 8, initialX));
      }
    },
    [syncHud]
  );

  const resetRun = useCallback(() => {
    const g = gameRef.current;
    g.mode = 'playing';
    g.score = 0;
    g.streak = 0;
    g.caught = 0;
    g.packets = [];
    g.particles = [];
    g.popups = [];
    g.ripples = [];
    g.shakeTime = 0;
    g.spawnTimer = 0.2;
    g.bannerText = 'NEW RUN';
    g.bannerAlpha = 1;
    syncHud();
  }, [syncHud]);

  const shouldRunLoop = !reducedMotion || reducedMotionOptIn;

  useEffect(() => {
    if (!shouldRunLoop) return undefined;

    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return undefined;

    const ctx = canvas.getContext('2d');
    if (!ctx) return undefined;

    const g = gameRef.current;
    g.palette = readThemePalette();

    const resize = () => {
      const rect = container.getBoundingClientRect();
      const width = Math.max(280, Math.floor(rect.width));
      const height = Math.max(240, Math.floor(rect.height));
      const dpr = Math.min(window.devicePixelRatio || 1, 2);

      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const ratio = g.width > 0 ? g.paddleX / g.width : 0.5;
      g.width = width;
      g.height = height;
      g.paddleX = Math.max(56, Math.min(width - 56, ratio * width));
      g.targetX = g.paddleX;
    };

    resize();
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(container);

    const themeObserver = new MutationObserver(() => {
      g.palette = readThemePalette();
    });
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme', 'class'],
    });

    const handleKeyDown = (event) => {
      const tag = document.activeElement?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

      if (event.key === 'ArrowLeft' || event.key === 'a' || event.key === 'A') {
        event.preventDefault();
        g.keys.left = true;
        engagePlayer();
      } else if (event.key === 'ArrowRight' || event.key === 'd' || event.key === 'D') {
        event.preventDefault();
        g.keys.right = true;
        engagePlayer();
      }
    };

    const handleKeyUp = (event) => {
      if (event.key === 'ArrowLeft' || event.key === 'a' || event.key === 'A') {
        g.keys.left = false;
      } else if (event.key === 'ArrowRight' || event.key === 'd' || event.key === 'D') {
        g.keys.right = false;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    const spawnPacket = () => {
      const p = g.palette;
      const roll = Math.random();
      const hazardChance = Math.min(0.29, 0.2 + g.streak * 0.008);
      const speedBoost = 1 + Math.min(g.streak * 0.04, 0.55);

      let spec;
      if (roll < hazardChance) {
        spec = {
          kind: 'hazard',
          label: 'BLK',
          color: p.error,
          points: -40,
          w: 50,
          h: 22,
          speed: (145 + Math.random() * 55) * speedBoost,
        };
      } else if (roll < hazardChance + 0.12) {
        spec = {
          kind: 'boost',
          label: 'LCP',
          color: p.warning,
          points: 60,
          w: 54,
          h: 23,
          speed: (160 + Math.random() * 45) * speedBoost,
        };
      } else {
        const types = [
          { label: 'HTML', color: p.html, points: 20, w: 52 },
          { label: 'CSS', color: p.css, points: 20, w: 46 },
          { label: 'IMG', color: p.image, points: 25, w: 48 },
          { label: 'FONT', color: p.font, points: 30, w: 54 },
          { label: 'JS', color: p.js, points: 25, w: 42 },
        ];
        const chosen = types[Math.floor(Math.random() * types.length)];
        spec = {
          kind: 'resource',
          ...chosen,
          h: 22,
          speed: (120 + Math.random() * 55) * speedBoost,
        };
      }

      const margin = spec.w / 2 + 18;
      const x = margin + Math.random() * Math.max(20, g.width - margin * 2);

      g.packets.push({
        ...spec,
        x,
        y: -20,
        vx: (Math.random() - 0.5) * 18,
        phase: Math.random() * Math.PI * 2,
      });
    };

    const spawnBurst = (x, y, color, count = 12) => {
      for (let i = 0; i < count; i += 1) {
        const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.45;
        const speed = 55 + Math.random() * 145;
        g.particles.push({
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 35,
          size: 2 + Math.random() * 2.8,
          life: 1,
          decay: 1.9 + Math.random() * 0.9,
          color,
        });
      }
    };

    let rafId = 0;
    let lastTime = performance.now();

    const frame = (now) => {
      const dt = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;

      const p = g.palette;
      const paddleY = g.height - 28;
      const desiredWidth = g.streak >= 5 ? 114 : 96;
      g.paddleWidth += (desiredWidth - g.paddleWidth) * Math.min(1, dt * 8);

      // Update grid scroll
      g.gridOffset = (g.gridOffset + dt * (28 + stepIndexRef.current * 4)) % 32;

      // Spawn packets
      g.spawnTimer -= dt;
      if (g.spawnTimer <= 0) {
        spawnPacket();
        const minGap = g.mode === 'playing' ? Math.max(0.36, 0.68 - g.streak * 0.025) : 0.62;
        g.spawnTimer = minGap + Math.random() * 0.28;
      }

      // Paddle movement (Auto-pilot vs Player)
      if (g.mode === 'demo') {
        // AI picks lowest safe resource while dodging hazards near paddle level
        let targetPacket = null;
        let bestScore = -Infinity;
        for (const pkt of g.packets) {
          if (pkt.kind === 'hazard') continue;
          const urgency = pkt.y + (pkt.kind === 'boost' ? 60 : 0);
          if (urgency > bestScore && pkt.y < paddleY) {
            bestScore = urgency;
            targetPacket = pkt;
          }
        }

        let desiredX = targetPacket ? targetPacket.x : g.width / 2 + Math.sin(now * 0.0012) * (g.width * 0.22);

        // Nudge away from nearby falling hazards
        for (const pkt of g.packets) {
          if (pkt.kind !== 'hazard') continue;
          if (pkt.y > paddleY - 120 && pkt.y < paddleY + 12) {
            const dx = desiredX - pkt.x;
            if (Math.abs(dx) < g.paddleWidth * 0.75) {
              desiredX = pkt.x + (dx >= 0 ? 1 : -1) * (g.paddleWidth * 0.9);
            }
          }
        }

        const halfW = g.paddleWidth / 2 + 10;
        g.targetX = Math.max(halfW, Math.min(g.width - halfW, desiredX));
        g.paddleX += (g.targetX - g.paddleX) * Math.min(1, dt * 7);
      } else {
        const keySpeed = 460;
        if (g.keys.left) g.targetX -= keySpeed * dt;
        if (g.keys.right) g.targetX += keySpeed * dt;
        const halfW = g.paddleWidth / 2 + 8;
        g.targetX = Math.max(halfW, Math.min(g.width - halfW, g.targetX));
        g.paddleX += (g.targetX - g.paddleX) * Math.min(1, dt * 18);
      }

      // Decay effects
      g.paddleGlow = Math.max(0, g.paddleGlow - dt * 2.6);
      g.shakeTime = Math.max(0, g.shakeTime - dt);
      g.bannerAlpha = Math.max(0, g.bannerAlpha - dt * 0.85);

      // Update packets & collisions
      let hudDirty = false;
      for (let i = g.packets.length - 1; i >= 0; i -= 1) {
        const pkt = g.packets[i];
        pkt.y += pkt.speed * dt;
        pkt.x += pkt.vx * dt;
        pkt.phase += dt * 5;

        // Soft wall bounce
        const margin = pkt.w / 2 + 12;
        if (pkt.x < margin) {
          pkt.x = margin;
          pkt.vx = Math.abs(pkt.vx);
        } else if (pkt.x > g.width - margin) {
          pkt.x = g.width - margin;
          pkt.vx = -Math.abs(pkt.vx);
        }

        // Paddle collision check
        const halfPaddle = g.paddleWidth / 2;
        const hitY = pkt.y + pkt.h / 2 >= paddleY - 9 && pkt.y - pkt.h / 2 <= paddleY + 9;
        const hitX = Math.abs(pkt.x - g.paddleX) <= halfPaddle + pkt.w / 2 - 4;

        if (hitY && hitX) {
          g.packets.splice(i, 1);

          if (pkt.kind === 'hazard') {
            g.streak = 0;
            g.score = Math.max(0, g.score + pkt.points);
            g.shakeTime = 0.22;
            spawnBurst(pkt.x, paddleY - 4, p.error, 16);
            g.popups.push({
              x: pkt.x,
              y: paddleY - 18,
              text: 'BLOCKED -40',
              color: p.error,
              life: 1,
            });
            if (g.mode === 'playing') {
              playTone('hazard');
              hudDirty = true;
            }
          } else {
            g.streak += 1;
            g.caught += 1;
            const multiplier = Math.min(5, 1 + Math.floor(g.streak / 3));
            const earned = pkt.points * multiplier;
            g.score += earned;
            g.paddleGlow = 1;

            if (g.mode === 'playing' && g.score > g.best) {
              g.best = g.score;
              saveStoredBest(g.best);
            }

            spawnBurst(pkt.x, paddleY - 6, pkt.color, pkt.kind === 'boost' ? 20 : 12);
            g.ripples.push({
              x: g.paddleX,
              y: paddleY,
              radius: 14,
              maxRadius: pkt.kind === 'boost' ? 78 : 54,
              color: pkt.color,
              life: 1,
            });
            g.popups.push({
              x: pkt.x,
              y: paddleY - 18,
              text:
                pkt.kind === 'boost'
                  ? `LCP +${earned}`
                  : multiplier > 1
                    ? `+${earned} x${multiplier}`
                    : `+${earned}`,
              color: pkt.color,
              life: 1,
            });

            if (g.mode === 'playing') {
              playTone(pkt.kind === 'boost' ? 'boost' : 'catch', g.streak);
              hudDirty = true;
            }
          }
          continue;
        }

        // Remove if off-screen
        if (pkt.y > g.height + 28) {
          g.packets.splice(i, 1);
        }
      }

      if (hudDirty) {
        syncHud();
      }

      // Update particles
      for (let i = g.particles.length - 1; i >= 0; i -= 1) {
        const pt = g.particles[i];
        pt.x += pt.vx * dt;
        pt.y += pt.vy * dt;
        pt.vy += 260 * dt;
        pt.life -= pt.decay * dt;
        if (pt.life <= 0) g.particles.splice(i, 1);
      }

      // Update ripples
      for (let i = g.ripples.length - 1; i >= 0; i -= 1) {
        const rp = g.ripples[i];
        rp.radius += (rp.maxRadius - rp.radius) * Math.min(1, dt * 8);
        rp.life -= dt * 2.4;
        if (rp.life <= 0) g.ripples.splice(i, 1);
      }

      // Update floating popups
      for (let i = g.popups.length - 1; i >= 0; i -= 1) {
        const pop = g.popups[i];
        pop.y -= 42 * dt;
        pop.life -= dt * 1.35;
        if (pop.life <= 0) g.popups.splice(i, 1);
      }

      // === RENDER ===
      ctx.save();
      if (g.shakeTime > 0) {
        const mag = (g.shakeTime / 0.22) * 5;
        ctx.translate((Math.random() - 0.5) * mag * 2, (Math.random() - 0.5) * mag);
      }

      // Background fill
      ctx.fillStyle = p.bg;
      ctx.fillRect(0, 0, g.width, g.height);

      // Subtle radial telemetry spotlight
      const grad = ctx.createRadialGradient(
        g.paddleX,
        g.height * 0.85,
        10,
        g.paddleX,
        g.height * 0.85,
        g.width * 0.55
      );
      grad.addColorStop(0, p.isLight ? 'rgba(37, 99, 235, 0.08)' : 'rgba(59, 130, 246, 0.11)');
      grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, g.width, g.height);

      // Scrolling waterfall tech grid
      ctx.strokeStyle = p.isLight ? 'rgba(148, 163, 184, 0.18)' : 'rgba(35, 39, 48, 0.55)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let x = 0; x <= g.width; x += 48) {
        ctx.moveTo(x + 0.5, 0);
        ctx.lineTo(x + 0.5, g.height);
      }
      for (let y = g.gridOffset; y <= g.height; y += 32) {
        ctx.moveTo(0, y + 0.5);
        ctx.lineTo(g.width, y + 0.5);
      }
      ctx.stroke();

      // Subtle horizontal "Main Thread Budget" line near paddle
      ctx.save();
      ctx.setLineDash([4, 6]);
      ctx.strokeStyle = p.isLight ? 'rgba(37, 99, 235, 0.22)' : 'rgba(59, 130, 246, 0.22)';
      ctx.beginPath();
      ctx.moveTo(0, paddleY);
      ctx.lineTo(g.width, paddleY);
      ctx.stroke();
      ctx.restore();

      // Draw ripples
      for (const rp of g.ripples) {
        ctx.save();
        ctx.globalAlpha = Math.max(0, rp.life * 0.45);
        ctx.strokeStyle = rp.color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(rp.x, rp.y, rp.radius, Math.PI, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }

      // Draw packets
      ctx.font = '600 10px "JetBrains Mono", ui-monospace, monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      for (const pkt of g.packets) {
        const px = pkt.x - pkt.w / 2;
        const py = pkt.y - pkt.h / 2;

        // Motion trail
        const trailGrad = ctx.createLinearGradient(pkt.x, py - 24, pkt.x, py);
        trailGrad.addColorStop(0, 'rgba(0,0,0,0)');
        trailGrad.addColorStop(1, `${pkt.color}44`);
        ctx.fillStyle = trailGrad;
        ctx.fillRect(pkt.x - 1.5, py - 24, 3, 24);

        ctx.save();
        if (pkt.kind === 'boost' || pkt.kind === 'hazard') {
          ctx.shadowColor = pkt.color;
          ctx.shadowBlur = 10 + Math.sin(pkt.phase) * 4;
        }

        // Pill body
        drawRoundedRect(ctx, px, py, pkt.w, pkt.h, 5);
        ctx.fillStyle = p.isLight ? p.surface : p.surfaceElevated;
        ctx.fill();

        // Colored accent tint
        ctx.save();
        ctx.globalAlpha = pkt.kind === 'hazard' ? 0.22 : 0.16;
        ctx.fillStyle = pkt.color;
        ctx.fill();
        ctx.restore();

        // Pill border
        ctx.lineWidth = pkt.kind === 'hazard' || pkt.kind === 'boost' ? 1.5 : 1.2;
        ctx.strokeStyle = pkt.color;
        ctx.stroke();

        // Hazard diagonal warning tick or resource status dot
        ctx.fillStyle = pkt.color;
        if (pkt.kind === 'hazard') {
          ctx.fillRect(px + 5, pkt.y - 3, 2, 6);
        } else {
          ctx.beginPath();
          ctx.arc(px + 7.5, pkt.y, 2.3, 0, Math.PI * 2);
          ctx.fill();
        }

        // Label
        ctx.fillStyle = pkt.kind === 'hazard' ? p.error : p.textPrimary;
        ctx.fillText(pkt.label, pkt.x + 3.5, pkt.y + 0.5);
        ctx.restore();
      }

      // Draw Collector Paddle ("EDGE CACHE")
      const halfW = g.paddleWidth / 2;
      const paddleLeft = g.paddleX - halfW;
      const paddleTop = paddleY - 7;

      ctx.save();
      ctx.shadowColor = g.streak >= 5 ? p.warning : p.info;
      ctx.shadowBlur = 12 + g.paddleGlow * 14;

      drawRoundedRect(ctx, paddleLeft, paddleTop, g.paddleWidth, 14, 7);
      const paddleGrad = ctx.createLinearGradient(paddleLeft, paddleTop, paddleLeft + g.paddleWidth, paddleTop);
      if (g.streak >= 5) {
        paddleGrad.addColorStop(0, p.info);
        paddleGrad.addColorStop(0.5, p.warning);
        paddleGrad.addColorStop(1, p.success);
      } else {
        paddleGrad.addColorStop(0, p.info);
        paddleGrad.addColorStop(1, p.success);
      }
      ctx.fillStyle = paddleGrad;
      ctx.fill();

      // Inner metallic highlight
      drawRoundedRect(ctx, paddleLeft + 4, paddleTop + 2.5, g.paddleWidth - 8, 3, 2);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
      ctx.fill();
      ctx.restore();

      // Subtle paddle label underneath
      ctx.font = '600 9px "JetBrains Mono", ui-monospace, monospace';
      ctx.fillStyle = p.textMuted;
      ctx.textAlign = 'center';
      ctx.fillText(g.mode === 'demo' ? 'AUTO-CACHE' : 'EDGE CACHE', g.paddleX, paddleY + 17);

      // Draw particles
      for (const pt of g.particles) {
        ctx.save();
        ctx.globalAlpha = Math.max(0, pt.life);
        ctx.fillStyle = pt.color;
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, pt.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // Draw floating popups
      ctx.font = '700 11px "JetBrains Mono", ui-monospace, monospace';
      ctx.textAlign = 'center';
      for (const pop of g.popups) {
        ctx.save();
        ctx.globalAlpha = Math.max(0, pop.life);
        ctx.fillStyle = pop.color;
        ctx.fillText(pop.text, pop.x, pop.y);
        ctx.restore();
      }

      // Mode handoff banner
      if (g.bannerAlpha > 0.02) {
        ctx.save();
        ctx.globalAlpha = g.bannerAlpha;
        ctx.font = '700 11px "JetBrains Mono", ui-monospace, monospace';
        ctx.fillStyle = p.info;
        ctx.textAlign = 'center';
        ctx.fillText(g.bannerText, g.width / 2, 26);
        ctx.restore();
      }

      ctx.restore();
      rafId = window.requestAnimationFrame(frame);
    };

    rafId = window.requestAnimationFrame(frame);

    return () => {
      window.cancelAnimationFrame(rafId);
      resizeObserver.disconnect();
      themeObserver.disconnect();
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [shouldRunLoop, engagePlayer, playTone, syncHud]);

  const handlePointerMove = (event) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const g = gameRef.current;

    if (g.mode === 'demo') {
      if (g.pointerAnchorX === null) {
        g.pointerAnchorX = x;
        return;
      }
      if (Math.abs(x - g.pointerAnchorX) >= 8) {
        engagePlayer(x);
      }
      return;
    }

    engagePlayer(x);
  };

  const handlePointerDown = (event) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    engagePlayer(x);
  };

  const handlePointerLeave = () => {
    gameRef.current.pointerAnchorX = null;
  };

  const multiplier = Math.min(5, 1 + Math.floor(hud.streak / 3));

  if (!shouldRunLoop) {
    return (
      <div className="rounded-md border border-border bg-background p-6 flex flex-col items-center justify-center text-center gap-3 min-h-[260px]">
        <div className="flex h-10 w-10 items-center justify-center rounded-md border border-border bg-surface-elevated text-status-info">
          <Gamepad2 className="h-5 w-5" />
        </div>
        <div className="space-y-1 max-w-sm">
          <p className="text-sm font-medium text-text-primary">Packet Rush paused for reduced motion</p>
          <p className="text-xs text-text-muted">
            Your system prefers reduced motion. Enable the mini-game manually if you would like to play while waiting.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setReducedMotionOptIn(true)}
          className="px-3 py-1.5 rounded-md border border-border bg-surface-elevated hover:bg-surface-hover text-xs font-mono text-text-primary transition-colors"
        >
          Launch Packet Rush
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-md border border-border bg-background overflow-hidden select-none">
      {/* Arcade Telemetry HUD Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 border-b border-border-subtle bg-surface-elevated font-mono text-[11px]">
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="flex items-center gap-1.5">
            <span className="text-text-muted uppercase text-[10px]">Score</span>
            <span className="font-bold text-text-primary font-mono-numbers min-w-[3ch]">
              {hud.mode === 'demo' ? '—' : hud.score}
            </span>
          </div>

          <div className="flex items-center gap-1">
            <Flame
              className={`h-3.5 w-3.5 transition-colors ${
                hud.mode === 'playing' && hud.streak >= 3 ? 'text-status-warning' : 'text-text-muted'
              }`}
            />
            <span
              className={`font-mono-numbers ${
                hud.mode === 'playing' && multiplier > 1
                  ? 'text-status-warning font-semibold'
                  : 'text-text-secondary'
              }`}
            >
              {hud.mode === 'demo' ? 'AUTO' : `x${multiplier}`}
            </span>
          </div>

          <div className="flex items-center gap-1 text-text-secondary">
            <Trophy className="h-3 w-3 text-resource-js" />
            <span className="text-[10px] text-text-muted uppercase hidden sm:inline">Best</span>
            <span className="font-mono-numbers text-text-primary">{hud.best}</span>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {hud.mode === 'demo' ? (
            <span
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded border text-status-info text-[10px]"
              style={{
                backgroundColor: 'color-mix(in srgb, var(--info) 12%, transparent)',
                borderColor: 'color-mix(in srgb, var(--info) 35%, transparent)',
              }}
            >
              <Sparkles className="h-3 w-3" />
              Move pointer or ← → to play
            </span>
          ) : (
            <button
              type="button"
              onClick={resetRun}
              title="Restart run"
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded border border-border bg-surface hover:bg-surface-hover text-text-secondary hover:text-text-primary text-[10px] transition-colors"
            >
              <RotateCcw className="h-3 w-3" />
              Reset
            </button>
          )}

          <button
            type="button"
            onClick={() => setSoundEnabled((prev) => !prev)}
            aria-label={soundEnabled ? 'Mute arcade sound effects' : 'Enable arcade sound effects'}
            title={soundEnabled ? 'Mute synth effects' : 'Enable synth effects'}
            className="inline-flex items-center justify-center h-6 w-6 rounded border border-border bg-surface hover:bg-surface-hover text-text-secondary hover:text-text-primary transition-colors"
          >
            {soundEnabled ? (
              <Volume2 className="h-3.5 w-3.5 text-status-info" />
            ) : (
              <VolumeX className="h-3.5 w-3.5" />
            )}
          </button>
        </div>
      </div>

      {/* Playfield Canvas */}
      <div
        ref={containerRef}
        className="relative w-full h-[250px] sm:h-[280px] touch-none cursor-crosshair"
        onPointerMove={handlePointerMove}
        onPointerDown={handlePointerDown}
        onPointerLeave={handlePointerLeave}
      >
        <canvas ref={canvasRef} className="block w-full h-full" />

        {/* Legend Pill Overlay */}
        <div className="pointer-events-none absolute top-2.5 left-3 right-3 flex items-center justify-between text-[10px] font-mono text-text-muted">
          <span
            className="px-2 py-0.5 rounded border border-border backdrop-blur-sm"
            style={{ backgroundColor: 'color-mix(in srgb, var(--surface) 82%, transparent)' }}
          >
            Catch <span className="text-resource-html">HTML</span> ·{' '}
            <span className="text-resource-css">CSS</span> ·{' '}
            <span className="text-resource-image">IMG</span> ·{' '}
            <span className="text-status-warning">LCP</span>
          </span>
          <span
            className="px-2 py-0.5 rounded border text-status-error backdrop-blur-sm"
            style={{
              backgroundColor: 'color-mix(in srgb, var(--surface) 82%, transparent)',
              borderColor: 'color-mix(in srgb, var(--error) 35%, transparent)',
            }}
          >
            Dodge BLK
          </span>
        </div>
      </div>
    </div>
  );
}

export default PacketCatcherGame;
