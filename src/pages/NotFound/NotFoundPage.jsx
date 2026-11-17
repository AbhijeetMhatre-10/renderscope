import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Terminal } from 'lucide-react';
import Button from '../../components/ui/Button';

export function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 text-center font-mono select-none">
      <div className="max-w-md w-full p-8 rounded-lg border border-border bg-surface space-y-5 shadow-xl">
        <div
          className="inline-flex items-center justify-center p-3 rounded-md text-status-error border"
          style={{
            borderColor: 'color-mix(in srgb, var(--error) 30%, transparent)',
            backgroundColor: 'color-mix(in srgb, var(--error) 12%, transparent)',
          }}
        >
          <Terminal className="w-7 h-7" />
        </div>

        <div className="space-y-1.5">
          <div className="text-3xl font-bold text-text-primary tracking-wider">
            404
          </div>
          <div className="text-xs uppercase tracking-widest text-status-error">
            Page not found
          </div>
          <p className="text-xs text-text-secondary pt-1 font-sans leading-relaxed">
            This route does not exist in RenderScope.
          </p>
        </div>

        <div className="p-3 bg-background rounded border border-border text-[11px] text-text-muted text-left truncate">
          <code>GET {typeof window !== 'undefined' ? window.location.pathname : '/'} → 404</code>
        </div>

        <div className="pt-1">
          <Button
            variant="secondary"
            size="md"
            onClick={() => navigate('/')}
            leftIcon={<ArrowLeft className="w-3.5 h-3.5" />}
            className="w-full"
          >
            Back to Home
          </Button>
        </div>
      </div>
    </div>
  );
}

export default NotFoundPage;
