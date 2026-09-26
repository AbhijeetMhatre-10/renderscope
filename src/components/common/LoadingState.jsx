import React, { useState, useEffect } from 'react';
import { Activity, Clock } from 'lucide-react';
import { cn } from '../../lib/utils';

export function LoadingState({
  url = 'https://example.com',
  message = 'Analyzing website...',
  className,
}) {
  const [progress, setProgress] = useState(15);
  const [currentStep, setCurrentStep] = useState('Resolving DNS and network sockets...');

  useEffect(() => {
    const steps = [
      { at: 25, label: 'Resolving DNS & establishing TLS handshake...' },
      { at: 50, label: 'Waiting for server response (TTFB)...' },
      { at: 75, label: 'Streaming HTML & discovering subresources...' },
      { at: 92, label: 'Calculating Core Web Vitals (LCP, CLS, FID)...' },
    ];

    const timer = setInterval(() => {
      setProgress((prev) => {
        const next = Math.min(prev + Math.floor(Math.random() * 8) + 4, 95);
        const match = steps.find((s) => next >= s.at);
        if (match) setCurrentStep(match.label);
        return next;
      });
    }, 180);

    return () => clearInterval(timer);
  }, []);

  // Generate ASCII-style bar representation: ████████████░░░░
  const totalBlocks = 24;
  const filledBlocks = Math.round((progress / 100) * totalBlocks);
  const emptyBlocks = totalBlocks - filledBlocks;
  const asciiBar = '█'.repeat(filledBlocks) + '░'.repeat(emptyBlocks);

  return (
    <div
      className={cn(
        'w-full max-w-xl mx-auto my-12 p-6 sm:p-8 rounded-lg border border-border bg-surface text-center space-y-6',
        className
      )}
    >
      <div className="inline-flex items-center justify-center p-3 rounded-full bg-status-info/10 text-status-info border border-status-info/20">
        <Activity className="w-6 h-6 animate-pulse" />
      </div>

      <div className="space-y-2">
        <h3 className="text-base font-semibold text-text-primary tracking-tight">
          {message}
        </h3>
        <p className="text-xs font-mono text-status-info truncate max-w-md mx-auto">
          {url}
        </p>
      </div>

      {/* Timing Indicator Bar */}
      <div className="space-y-2.5 bg-background p-4 rounded-md border border-border">
        <div className="flex items-center justify-between text-xs font-mono text-text-secondary">
          <span className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-text-muted" />
            <span className="text-text-muted">DIAGNOSTIC PIPELINE:</span>
          </span>
          <span className="text-status-info font-medium">{progress}%</span>
        </div>

        {/* ASCII Block Bar */}
        <div className="font-mono text-sm tracking-widest text-status-info overflow-hidden select-none whitespace-nowrap">
          {asciiBar}
        </div>

        {/* Visual progress bar */}
        <div className="w-full h-1.5 bg-surface-elevated rounded-full overflow-hidden">
          <div
            className="h-full bg-status-info transition-all duration-200 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>

        <p className="text-[11px] font-mono text-text-muted truncate pt-1">
          &gt; {currentStep}
        </p>
      </div>
    </div>
  );
}

export default LoadingState;
