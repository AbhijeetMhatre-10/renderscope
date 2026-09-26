import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Play, Pause, RotateCcw, Info, CheckCircle2 } from 'lucide-react';
import Badge from '../../../components/ui/Badge';
import Tooltip from '../../../components/ui/Tooltip';

export function ProductPreview() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeItem, setActiveItem] = useState(null);

  const previewRows = [
    {
      label: 'HTML',
      type: 'html',
      name: 'document (/)',
      start: '0ms',
      duration: '210ms',
      startPct: 0,
      widthPct: 22,
      color: 'bg-resource-html',
      size: '24.5 KB',
      ttfb: '110ms',
    },
    {
      label: 'CSS',
      type: 'css',
      name: 'styles/app.css',
      start: '210ms',
      duration: '145ms',
      startPct: 22,
      widthPct: 15,
      color: 'bg-resource-css',
      size: '58.3 KB',
      ttfb: '85ms',
    },
    {
      label: 'JS',
      type: 'js',
      name: 'chunks/vendor.js',
      start: '220ms',
      duration: '310ms',
      startPct: 23,
      widthPct: 32,
      color: 'bg-resource-js',
      size: '428 KB',
      ttfb: '90ms',
    },
    {
      label: 'Images',
      type: 'image',
      name: 'hero-banner.webp',
      start: '360ms',
      duration: '480ms',
      startPct: 38,
      widthPct: 48,
      color: 'bg-resource-image',
      size: '384 KB',
      ttfb: '120ms',
    },
  ];

  return (
    <div className="w-full rounded-lg border border-border bg-surface overflow-hidden shadow-2xl">
      {/* Terminal Title Bar */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-surface-elevated border-b border-border text-xs font-mono text-text-secondary select-none">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-status-error border border-status-error" />
            <span className="w-2.5 h-2.5 rounded-full bg-status-warning border border-status-warning" />
            <span className="w-2.5 h-2.5 rounded-full bg-status-success border border-status-success" />
          </div>
          <span className="text-text-muted text-[11px] ml-2">timeline-inspector://example.com/network</span>
        </div>

        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 text-[11px] text-status-success">
            <span className="w-1.5 h-1.5 rounded-full bg-status-success animate-ping" />
            LIVE PROBE
          </span>
        </div>
      </div>

      {/* Metric Summary Header */}
      <div className="p-4 sm:p-5 border-b border-border bg-surface/50">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 font-mono">
          <div className="space-y-0.5">
            <span className="text-[11px] text-text-muted uppercase tracking-wider">Performance Profile</span>
            <div className="flex items-center gap-4 text-xs">
              <span className="flex items-center gap-1.5">
                <span className="text-text-secondary">LCP:</span>
                <span className="text-status-success font-semibold">1.42s</span>
              </span>
              <span className="text-border">|</span>
              <span className="flex items-center gap-1.5">
                <span className="text-text-secondary">TTFB:</span>
                <span className="text-text-primary font-semibold">210ms</span>
              </span>
              <span className="text-border">|</span>
              <span className="flex items-center gap-1.5">
                <span className="text-text-secondary">Requests:</span>
                <span className="text-status-info font-semibold">48</span>
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <Badge variant="fast" size="xs">Grade 96</Badge>
            <Badge variant="default" size="xs">Desktop 4G</Badge>
          </div>
        </div>
      </div>

      {/* Timeline Scale */}
      <div className="relative border-b border-border/80 bg-background/50 px-4 py-2 text-[10px] font-mono text-text-muted flex justify-between select-none">
        <span>0ms</span>
        <span className="hidden sm:inline">250ms</span>
        <span>500ms</span>
        <span className="hidden sm:inline">750ms</span>
        <span>1000ms</span>
      </div>

      {/* Waterfall Timing Rows */}
      <div className="p-4 space-y-3 font-mono">
        {previewRows.map((row, index) => (
          <div
            key={row.label}
            onMouseEnter={() => setActiveItem(row)}
            onMouseLeave={() => setActiveItem(null)}
            className="group relative flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-4 p-2 rounded hover:bg-surface-elevated/60 transition-colors cursor-pointer border border-transparent hover:border-border/60"
          >
            {/* Row Label & Details */}
            <div className="flex items-center gap-2 w-32 shrink-0">
              <Badge variant={row.type} size="xs" className="w-14 justify-center">
                {row.label}
              </Badge>
              <span className="text-xs text-text-secondary truncate group-hover:text-text-primary transition-colors">
                {row.name.split('/')[0]}
              </span>
            </div>

            {/* Timing Bar Container */}
            <div className="relative flex-1 h-6 bg-surface-elevated/40 rounded border border-border/30 overflow-hidden flex items-center">
              {/* Subtle background grid ticks */}
              <div className="absolute inset-0 flex justify-between pointer-events-none opacity-20">
                <div className="w-px h-full bg-border" />
                <div className="w-px h-full bg-border" />
                <div className="w-px h-full bg-border" />
                <div className="w-px h-full bg-border" />
              </div>

              {/* Timing Bar */}
              <motion.div
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 0.5, delay: index * 0.1, ease: 'easeOut' }}
                style={{
                  left: `${row.startPct}%`,
                  width: `${row.widthPct}%`,
                  transformOrigin: 'left center',
                }}
                className={`absolute h-4 rounded-sm ${row.color} opacity-85 group-hover:opacity-100 flex items-center justify-end px-1.5 transition-all shadow-sm`}
              >
                <span className="text-[9px] text-background font-bold tracking-tight select-none">
                  {row.duration}
                </span>
              </motion.div>
            </div>

            {/* Row Metrics */}
            <div className="flex items-center justify-between sm:justify-end gap-3 text-[11px] text-text-muted shrink-0 w-28">
              <span>{row.size}</span>
              <span className="text-text-secondary">{row.duration}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Waterfall Mini Status Banner */}
      <div className="px-4 py-2.5 bg-surface-elevated/30 border-t border-border flex items-center justify-between text-[11px] font-mono text-text-muted">
        <span className="flex items-center gap-1.5">
          <Info className="w-3.5 h-3.5 text-status-info" />
          <span>Interactive breakdown · Hover bars to inspect sub-timings</span>
        </span>
        <span className="text-text-secondary">Total Transfer: 890 KB</span>
      </div>
    </div>
  );
}

export default ProductPreview;
