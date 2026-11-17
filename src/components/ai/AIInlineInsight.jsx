import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Cpu, Loader2, Sparkles } from 'lucide-react';

export function AIInlineInsight({ mode = 'finding', state = { status: 'idle', data: null, error: '' } }) {
  const { status, data, error } = state;

  if (status === 'idle') return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="rounded-md border p-3.5 space-y-2.5 text-xs"
      style={{
        borderColor: 'color-mix(in srgb, var(--info) 38%, transparent)',
        backgroundColor: 'color-mix(in srgb, var(--info) 7%, var(--background))',
      }}
    >
      <div className="flex items-center justify-between gap-2 font-mono text-[10px] uppercase tracking-wider">
        <span className="inline-flex items-center gap-1.5 text-status-info font-semibold">
          <Sparkles className="h-3 w-3" />
          {mode === 'resource' ? 'AI Resource Explanation' : 'AI Diagnostic Insight'}
        </span>
        {data && (
          <span className="inline-flex items-center gap-1 text-text-muted">
            <Cpu className="h-3 w-3" />
            {data.source === 'gemini' ? data.model : 'Structured Mode'}
          </span>
        )}
      </div>

      {status === 'loading' && (
        <div className="flex items-center gap-2 text-text-secondary font-mono text-[11px] py-1">
          <Loader2 className="h-3.5 w-3.5 animate-spin text-status-info" />
          <span>Analyzing measured telemetry…</span>
        </div>
      )}

      {status === 'error' && (
        <p className="text-status-error font-mono text-[11px]">{error}</p>
      )}

      {status === 'success' && data && mode === 'finding' && (
        <div className="space-y-2.5">
          <p className="font-semibold text-text-primary">{data.headline}</p>
          <p className="text-text-secondary leading-relaxed">{data.explanation}</p>

          {data.userImpact && (
            <p className="text-text-secondary leading-relaxed">
              <strong className="text-text-primary font-mono text-[10px] uppercase mr-1.5">
                User Impact:
              </strong>
              {data.userImpact}
            </p>
          )}

          {data.fixSteps?.length > 0 && (
            <ul className="space-y-1 pt-1">
              {data.fixSteps.map((step, idx) => (
                <li key={idx} className="flex items-start gap-1.5 text-text-secondary">
                  <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-status-success mt-0.5" />
                  <span>{step}</span>
                </li>
              ))}
            </ul>
          )}

          {data.codeHint && (
            <pre className="p-2.5 rounded border border-border bg-surface font-mono text-[11px] text-text-primary overflow-x-auto">
              <code>{data.codeHint}</code>
            </pre>
          )}
        </div>
      )}

      {status === 'success' && data && mode === 'resource' && (
        <div className="space-y-2.5">
          <p className="font-semibold text-text-primary">{data.headline}</p>
          <p className="text-text-secondary leading-relaxed">
            <strong className="text-text-primary font-mono text-[10px] uppercase mr-1.5">
              Role:
            </strong>
            {data.role}
          </p>
          <p className="text-text-secondary leading-relaxed">
            <strong className="text-text-primary font-mono text-[10px] uppercase mr-1.5">
              Timing:
            </strong>
            {data.timingAnalysis}
          </p>
          {data.optimizationAdvice?.length > 0 && (
            <ul className="space-y-1 pt-1">
              {data.optimizationAdvice.map((tip, idx) => (
                <li key={idx} className="flex items-start gap-1.5 text-text-secondary">
                  <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-status-success mt-0.5" />
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </motion.div>
  );
}

export default AIInlineInsight;
