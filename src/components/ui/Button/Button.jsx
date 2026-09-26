import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '../../../lib/utils';

export const Button = ({
  className,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  leftIcon = null,
  rightIcon = null,
  children,
  ref,
  ...props
}) => {
  const baseStyles =
    'relative inline-flex items-center justify-center select-none font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-border-focus disabled:opacity-50 disabled:pointer-events-none active:translate-y-[0.5px] cursor-pointer';

  const variants = {
    primary:
      'bg-status-info text-white hover:bg-blue-600 active:bg-blue-700 shadow-sm border border-transparent font-medium',
    secondary:
      'bg-surface-elevated text-text-primary hover:bg-surface-hover hover:border-border active:bg-surface border border-border',
    ghost:
      'bg-transparent text-text-secondary hover:text-text-primary hover:bg-surface-hover border border-transparent',
    danger:
      'bg-status-error/10 text-status-error border border-status-error/30 hover:bg-status-error/20 active:bg-status-error/30',
    icon:
      'bg-surface hover:bg-surface-hover text-text-secondary hover:text-text-primary border border-border p-2',
  };

  const sizes = {
    sm: 'text-xs h-7 px-2.5 rounded-sm gap-1.5',
    md: 'text-xs uppercase tracking-wider font-mono h-9 px-3.5 rounded-md gap-2',
    lg: 'text-sm h-11 px-5 rounded-md gap-2.5',
    icon: 'h-8 w-8 rounded-md p-0 flex items-center justify-center',
  };

  const currentSize = variant === 'icon' ? sizes.icon : sizes[size];

  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={cn(baseStyles, variants[variant], currentSize, className)}
      {...props}
    >
      {loading ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />
      ) : (
        leftIcon && <span className="shrink-0">{leftIcon}</span>
      )}
      {children}
      {!loading && rightIcon && <span className="shrink-0">{rightIcon}</span>}
    </button>
  );
};

export default Button;
