import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { cn } from '../../../lib/utils';
import Button from '../Button';

export function Drawer({
  isOpen,
  onClose,
  title,
  subtitle,
  badge = null,
  children,
  footer,
  className,
  width = 'max-w-xl',
}) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-background/80 backdrop-blur-sm"
            onClick={onClose}
            aria-hidden="true"
          />

          <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className={cn(
                'w-screen bg-surface border-l border-border shadow-2xl flex flex-col',
                width,
                className
              )}
              role="dialog"
              aria-modal="true"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-start justify-between p-4 sm:p-5 border-b border-border bg-surface-elevated/50">
                <div className="space-y-1 pr-3">
                  <div className="flex items-center gap-2">
                    {badge}
                    {title && (
                      <h2 className="text-sm font-semibold text-text-primary tracking-tight break-all">
                        {title}
                      </h2>
                    )}
                  </div>
                  {subtitle && (
                    <p className="text-xs text-text-secondary font-mono break-all">{subtitle}</p>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                  aria-label="Close drawer"
                  className="h-7 w-7 p-0 text-text-muted hover:text-text-primary rounded-sm shrink-0"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              {/* Drawer Scrollable Body */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
                {children}
              </div>

              {/* Footer */}
              {footer && (
                <div className="p-4 border-t border-border bg-surface-elevated/30 flex items-center justify-between">
                  {footer}
                </div>
              )}
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
}

export default Drawer;
