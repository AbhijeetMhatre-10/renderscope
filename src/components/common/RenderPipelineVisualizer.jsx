import React from 'react';
import { motion } from 'framer-motion';
import { Cpu, Globe, Layers, PaintBucket, ShieldCheck } from 'lucide-react';

const PIPELINE_NODES = [
  { id: 'dns', label: 'DNS / TLS', sub: 'Handshake', icon: Globe, colorVar: 'var(--info)' },
  { id: 'html', label: 'HTML', sub: 'DOM Parse', icon: ShieldCheck, colorVar: 'var(--resource-html)' },
  { id: 'css', label: 'CSSOM', sub: 'Style Calc', icon: Layers, colorVar: 'var(--resource-css)' },
  { id: 'js', label: 'Main Thread', sub: 'Script Eval', icon: Cpu, colorVar: 'var(--resource-js)' },
  { id: 'paint', label: 'Paint', sub: 'LCP Frame', icon: PaintBucket, colorVar: 'var(--resource-image)' },
];

const SIMULATED_WATERFALL = [
  { name: 'document.html', type: 'HTML', colorClass: 'bg-resource-html', left: 4, width: 18, delay: 0 },
  { name: 'critical.css', type: 'CSS', colorClass: 'bg-resource-css', left: 16, width: 22, delay: 0.25 },
  { name: 'app.bundle.js', type: 'JS', colorClass: 'bg-resource-js', left: 24, width: 34, delay: 0.5 },
  { name: 'hero-lcp.webp', type: 'IMG', colorClass: 'bg-resource-image', left: 32, width: 28, delay: 0.75 },
  { name: 'geist-var.woff2', type: 'FONT', colorClass: 'bg-resource-font', left: 44, width: 20, delay: 1.0 },
];

export function RenderPipelineVisualizer({ url = 'https://example.com', stepIndex = 0 }) {
  const activeStage = Math.min(PIPELINE_NODES.length - 1, Math.max(0, stepIndex));

  return (
    <div className="rounded-md border border-border bg-background overflow-hidden">
      {/* Mini Browser Chrome */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-border-subtle bg-surface-elevated">
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-status-error opacity-80" />
          <span className="h-2 w-2 rounded-full bg-status-warning opacity-80" />
          <span className="h-2 w-2 rounded-full bg-status-success opacity-80" />
        </div>
        <div className="flex-1 h-5 rounded-sm border border-border bg-surface px-2 flex items-center text-[10px] text-text-muted font-mono truncate">
          {url}
        </div>
        <span className="hidden sm:inline-flex items-center gap-1.5 text-[10px] font-mono text-status-info">
          <span className="h-1.5 w-1.5 rounded-full bg-status-info animate-ping motion-reduce:animate-none" />
          60 FPS PROBE
        </span>
      </div>

      {/* Main Animated Pipeline Stage */}
      <div className="relative p-4 sm:p-5 bg-tech-grid min-h-[250px] sm:min-h-[280px] flex flex-col justify-between gap-5 overflow-hidden">
        {/* Horizontal Critical Rendering Path Nodes */}
        <div className="relative pt-2">
          {/* Animated Connecting Track */}
          <div className="hidden sm:block absolute left-8 right-8 top-7 h-0.5 bg-border overflow-hidden rounded-full">
            <motion.div
              className="h-full bg-gradient-to-r from-status-info via-resource-font to-status-success"
              initial={{ width: '12%' }}
              animate={{ width: `${Math.min(100, ((activeStage + 1) / PIPELINE_NODES.length) * 100)}%` }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
            />
            <motion.span
              className="absolute top-1/2 -translate-y-1/2 h-1.5 w-12 rounded-full bg-status-info blur-[1px] motion-reduce:hidden"
              animate={{ left: ['-10%', '105%'] }}
              transition={{ duration: 2.1, repeat: Infinity, ease: 'linear' }}
            />
          </div>

          <div className="relative z-10 grid grid-cols-5 gap-2">
            {PIPELINE_NODES.map((node, idx) => {
              const Icon = node.icon;
              const isDone = idx < activeStage;
              const isActive = idx === activeStage;
              return (
                <div key={node.id} className="flex flex-col items-center text-center gap-1.5">
                  <motion.div
                    animate={
                      isActive
                        ? {
                            scale: [1, 1.07, 1],
                            boxShadow: [
                              '0 0 0 0 rgba(59,130,246,0)',
                              '0 0 18px 2px rgba(59,130,246,0.35)',
                              '0 0 0 0 rgba(59,130,246,0)',
                            ],
                          }
                        : { scale: 1 }
                    }
                    transition={
                      isActive
                        ? { duration: 1.8, repeat: Infinity, ease: 'easeInOut' }
                        : { duration: 0.2 }
                    }
                    className={`flex h-10 w-10 items-center justify-center rounded-md border transition-colors ${
                      isActive
                        ? 'bg-surface-elevated border-status-info text-text-primary'
                        : isDone
                          ? 'bg-surface-elevated border-status-success text-status-success'
                          : 'bg-surface border-border text-text-muted'
                    }`}
                    style={isActive ? { borderColor: node.colorVar } : undefined}
                  >
                    <Icon
                      className="h-4 w-4"
                      style={isActive || isDone ? { color: node.colorVar } : undefined}
                    />
                  </motion.div>
                  <div className="space-y-0.5">
                    <span
                      className={`block text-[10px] sm:text-[11px] font-mono font-semibold ${
                        isActive || isDone ? 'text-text-primary' : 'text-text-muted'
                      }`}
                    >
                      {node.label}
                    </span>
                    <span className="hidden sm:block text-[9px] font-mono text-text-muted">
                      {node.sub}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Live Animated Mini-Waterfall Stream */}
        <div className="rounded-md border border-border bg-surface p-3 space-y-2 font-mono">
          <div className="flex items-center justify-between text-[10px] text-text-muted border-b border-border-subtle pb-1.5">
            <span className="uppercase tracking-wider">Simulated Waterfall Stream</span>
            <span className="text-status-info">0ms — 1600ms</span>
          </div>

          <div className="space-y-1.5">
            {SIMULATED_WATERFALL.map((item) => (
              <div key={item.name} className="grid grid-cols-[96px_1fr] sm:grid-cols-[128px_1fr] items-center gap-2.5 text-[10px]">
                <span className="truncate text-text-secondary">{item.name}</span>
                <div className="relative h-3 rounded-sm bg-surface-elevated overflow-hidden">
                  <motion.div
                    className={`absolute top-0 bottom-0 rounded-sm ${item.colorClass}`}
                    style={{ left: `${item.left}%` }}
                    initial={{ width: '0%', opacity: 0.45 }}
                    animate={{
                      width: [`${Math.max(6, item.width * 0.4)}%`, `${item.width}%`, `${Math.max(8, item.width * 0.65)}%`],
                      opacity: [0.55, 0.95, 0.7],
                    }}
                    transition={{
                      duration: 2.4,
                      delay: item.delay,
                      repeat: Infinity,
                      ease: 'easeInOut',
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Subtle Vertical Scan Beam */}
        <motion.div
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 w-20 motion-reduce:hidden"
          style={{
            background:
              'linear-gradient(90deg, transparent 0%, color-mix(in srgb, var(--info) 12%, transparent) 50%, transparent 100%)',
          }}
          animate={{ left: ['-15%', '115%'] }}
          transition={{ duration: 3.2, repeat: Infinity, ease: 'linear' }}
        />
      </div>
    </div>
  );
}

export default RenderPipelineVisualizer;
