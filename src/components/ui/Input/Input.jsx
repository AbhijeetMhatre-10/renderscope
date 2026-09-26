import React from 'react';
import { cn } from '../../../lib/utils';

export const Input = ({
  className,
  type = 'text',
  prefixIcon = null,
  suffixIcon = null,
  mono = false,
  error = false,
  size = 'md',
  ref,
  ...props
}) => {
  const sizes = {
    sm: 'h-8 text-xs py-1.5',
    md: 'h-10 text-xs py-2',
    lg: 'h-12 text-sm py-2.5',
  };

  return (
    <div className="relative flex items-center w-full">
      {prefixIcon && (
        <div className="absolute left-3 flex items-center pointer-events-none text-text-muted">
          {prefixIcon}
        </div>
      )}
      <input
        ref={ref}
        type={type}
        className={cn(
          'w-full bg-surface border rounded-md text-text-primary placeholder:text-text-muted/70',
          'transition-colors focus:outline-none focus:border-border-focus focus:ring-1 focus:ring-border-focus',
          sizes[size],
          mono ? 'font-mono' : 'font-sans',
          prefixIcon ? 'pl-9' : 'pl-3',
          suffixIcon ? 'pr-9' : 'pr-3',
          error ? 'border-status-error focus:border-status-error focus:ring-status-error' : 'border-border',
          className
        )}
        {...props}
      />
      {suffixIcon && (
        <div className="absolute right-3 flex items-center text-text-muted">
          {suffixIcon}
        </div>
      )}
    </div>
  );
};

export default Input;
