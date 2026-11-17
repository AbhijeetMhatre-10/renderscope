import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Info } from 'lucide-react';
import Badge from '../../../components/ui/Badge';

const PREVIEW_ROWS = [
  {
    label: 'HTML',
    type: 'html',
    name: 'index.html',
    start: '0ms',
    duration: '210ms',
    startPct: 0,
    widthPct: 21,
    color: 'bg-resource-html',
    size: '24.5 KB',
    ttfb: '110ms',
  },
  {
    label: 'CSS',
    type: 'css',
    name: 'critical.css',
    start: '210ms',
    duration: '145ms',
    startPct: 21,
    widthPct: 15,
    color: 'bg-resource-css',
    size: '58.3 KB',
    ttfb: '85ms',
  },
  {
    label: 'JS',
    type: 'js',
    name: 'app.chunk.js',
    start: '220ms',
    duration: '310ms',
    startPct: 22,
    widthPct: 31,
    color: 'bg-resource-js',
    size: '214 KB',
    ttfb: '90ms',
  },
  {
    label: 'Image',
    type: 'image',
    name: 'hero.avif',
    start: '360ms',
    duration: '480ms',
    startPct: 36,
    widthPct: 48,
    color: 'bg-resource-image',
    size: '168 KB',
    ttfb: '120ms',
  },
];

export function ProductPreview() {
  const [activeItem, setActiveItem] = useState(null);

  return (
    <div className="w-full rounded-lg border border-border bg-surface overflow-hidden shadow-xl text-left">
      {/* Window Title Bar */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-surface-elevated border-b border-border text-xs font-mono text-text-secondary select-none">
        <div className="flex items-center gap-2 min-w-0">
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="w-2.5 h-2.5 rounded-full bg-status-error" />
            <span className="w-2.5 h-2.5 rounded-full bg-status-warning" />
            <span className="w-2.5 h-2.5 rounded-full bg-status-success" />
          </div>
          <span className="text-text-muted text-[11px] ml-2 truncate">
            renderscope://example.com · waterfall
          </span>
        </div>

        <span className="text-[10px] uppercase tracking-wider text-text-muted shrink-0">
          Sample Preview
        </span>
      </div>

      {/* Metric Summary Bar */}
      <div className="px-4 py-3 border-b border-border bg-background font-mono">
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-3 sm:gap-4">
            <span className="flex items-center gap-1.5">
              <span className="text-text-muted">TTFB</span>
              <span className="text-text-primary font-semibold font-mono-numbers">210ms</span>
            </span>
            <span className="text-border">·</span>
            <span className="flex items-center gap-1.5">
              <span className="text-text-muted">FCP</span>
              <span className="text-text-primary font-semibold font-mono-numbers">900ms</span>
            </span>
            <span className="text-border">·</span>
            <span className="flex items-center gap-1.5">
              <span className="text-text-muted">LCP</span>
              <span className="text-status-success font-semibold font-mono-numbers">1.42s</span>
            </span>
            <span className="text-border">·</span>
            <span className="flex items-center gap-1.5">
              <span className="text-text-muted">Requests</span>
              <span className="text-status-info font-semibold font-mono-numbers">48</span>
            </span>
          </div>

          <Badge variant="default" size="xs">Desktop</Badge>
        </div>
      </div>

      {/* Timeline Scale */}
      <div className="relative border-b border-border-subtle bg-surface-elevated px-4 py-1.5 text-[10px] font-mono text-text-muted flex justify-between select-none">
        <span>0ms</span>
        <span className="hidden sm:inline">250ms</span>
        <span>500ms</span>
        <span className="hidden sm:inline">750ms</span>
        <span>1000ms</span>
      </div>

      {/* Waterfall Timing Rows */}
      <div className="p-3 sm:p-4 space-y-2 font-mono">
        {PREVIEW_ROWS.map((row, index) => {
          const isHovered = activeItem?.name === row.name;
          return (
            <div
              key={row.name}
              onMouseEnter={() => setActiveItem(row)}
              onMouseLeave={() => setActiveItem(null)}
              className={`group relative flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-4 p-2 rounded transition-colors cursor-pointer border ${
                isHovered
                  ? 'bg-surface-elevated border-border'
                  : 'border-transparent hover:bg-surface-elevated'
              }`}
            >
              {/* Row Label */}
              <div className="flex items-center gap-2 w-40 shrink-0">
                <Badge variant={row.type} size="xs" className="w-14 justify-center shrink-0">
                  {row.label}
                </Badge>
                <span className="text-xs text-text-secondary truncate group-hover:text-text-primary transition-colors">
                  {row.name}
                </span>
              </div>

              {/* Timing Bar Track */}
              <div className="relative flex-1 h-6 bg-background rounded border border-border-subtle overflow-hidden flex items-center">
                <div className="absolute inset-0 flex justify-between pointer-events-none opacity-40">
                  <div className="w-px h-full bg-border-subtle" />
                  <div className="w-px h-full bg-border-subtle" />
                  <div className="w-px h-full bg-border-subtle" />
                  <div className="w-px h-full bg-border-subtle" />
                </div>

                <motion.div
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ duration: 0.45, delay: index * 0.08, ease: 'easeOut' }}
                  style={{
                    left: `${row.startPct}%`,
                    width: `${row.widthPct}%`,
                    transformOrigin: 'left center',
                  }}
                  className={`absolute h-4 rounded-sm ${row.color} flex items-center justify-end px-1.5 shadow-sm`}
                >
                  <span className="text-[9px] text-white font-bold tracking-tight select-none drop-shadow-sm">
                    {row.duration}
                  </span>
                </motion.div>
              </div>

              {/* Row Metrics */}
              <div className="flex items-center justify-between sm:justify-end gap-3 text-[11px] text-text-muted shrink-0 w-28 font-mono-numbers">
                <span>{row.size}</span>
                <span className="text-text-primary">{row.duration}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Interactive Status Footer */}
      <div className="px-4 py-2.5 bg-background border-t border-border flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono text-text-muted">
        <span className="flex items-center gap-1.5 min-w-0">
          <Info className="w-3.5 h-3.5 text-status-info shrink-0" />
          {activeItem ? (
            <span className="text-text-primary truncate font-mono-numbers">
              {activeItem.name} · Start {activeItem.start} · TTFB {activeItem.ttfb} · Duration {activeItem.duration} · {activeItem.size}
            </span>
          ) : (
            <span>Hover any row to inspect start time, TTFB, and payload weight</span>
          )}
        </span>
        <span className="text-text-secondary font-mono-numbers shrink-0">Total: 465 KB</span>
      </div>
    </div>
  );
}

export default ProductPreview;
