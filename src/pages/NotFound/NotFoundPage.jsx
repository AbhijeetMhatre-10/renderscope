import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, ArrowLeft, Terminal } from 'lucide-react';
import Button from '../../components/ui/Button';

export function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 text-center font-mono select-none">
      <div className="max-w-md w-full p-8 rounded-lg border border-border bg-surface space-y-6 shadow-xl">
        <div className="inline-flex items-center justify-center p-3 rounded-md bg-status-error/10 text-status-error border border-status-error/20">
          <Terminal className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <div className="text-3xl font-bold text-text-primary tracking-wider">
            404
          </div>
          <div className="text-xs uppercase tracking-widest text-status-error">
            ERR_ROUTE_NOT_FOUND
          </div>
          <p className="text-xs text-text-secondary pt-2 leading-relaxed">
            The requested diagnostic endpoint or visualizer route does not exist in the routing table.
          </p>
        </div>

        <div className="p-3 bg-background rounded border border-border text-[11px] text-text-muted text-left">
          <code>&gt; GET {typeof window !== 'undefined' ? window.location.pathname : '/'} → HTTP/1.1 404</code>
        </div>

        <div className="pt-2">
          <Button
            variant="secondary"
            size="md"
            onClick={() => navigate('/')}
            leftIcon={<ArrowLeft className="w-3.5 h-3.5" />}
            className="w-full"
          >
            Return to Scope Home
          </Button>
        </div>
      </div>
    </div>
  );
}

export default NotFoundPage;
