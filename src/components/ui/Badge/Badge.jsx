import React from 'react';
import { cn } from '../../../lib/utils';

export function Badge({
  children,
  variant = 'default',
  size = 'sm',
  className,
  ...props
}) {
  const variants = {
    // Resource types
    html: 'bg-resource-html/15 text-resource-html border-resource-html/30',
    css: 'bg-resource-css/15 text-resource-css border-resource-css/30',
    js: 'bg-resource-js/15 text-resource-js border-resource-js/30',
    image: 'bg-resource-image/15 text-resource-image border-resource-image/30',
    font: 'bg-resource-font/15 text-resource-font border-resource-font/30',
    other: 'bg-resource-other/15 text-resource-other border-resource-other/30',

    // Performance status
    fast: 'bg-status-success/15 text-status-success border-status-success/30',
    slow: 'bg-status-error/15 text-status-error border-status-error/30',
    warning: 'bg-status-warning/15 text-status-warning border-status-warning/30',
    critical: 'bg-status-error/20 text-status-error border-status-error/40 font-semibold',
    info: 'bg-status-info/15 text-status-info border-status-info/30',

    // General
    default: 'bg-surface-elevated text-text-secondary border-border',
    outline: 'bg-transparent text-text-secondary border-border',
  };

  const sizes = {
    xs: 'text-[10px] px-1.5 py-0.5 leading-none',
    sm: 'text-[11px] px-2 py-0.5 leading-tight',
    md: 'text-xs px-2.5 py-1',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center justify-center font-mono uppercase tracking-wider rounded-sm border select-none',
        variants[variant.toLowerCase()] || variants.default,
        sizes[size],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}

export default Badge;
