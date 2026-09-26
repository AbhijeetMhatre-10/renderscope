import React, { createContext, useContext } from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../../lib/utils';

const TabsContext = createContext(null);

export function Tabs({
  value,
  onValueChange,
  children,
  className,
}) {
  return (
    <TabsContext.Provider value={{ activeValue: value, onChange: onValueChange }}>
      <div className={cn('w-full flex flex-col', className)}>{children}</div>
    </TabsContext.Provider>
  );
}

export function TabList({ className, children }) {
  return (
    <div
      role="tablist"
      className={cn(
        'flex items-center gap-1 p-1 bg-surface rounded-md border border-border overflow-x-auto no-scrollbar',
        className
      )}
    >
      {children}
    </div>
  );
}

export function TabTrigger({
  value,
  children,
  icon = null,
  badge = null,
  className,
}) {
  const { activeValue, onChange } = useContext(TabsContext);
  const isActive = activeValue === value;

  return (
    <button
      role="tab"
      aria-selected={isActive}
      onClick={() => onChange?.(value)}
      className={cn(
        'relative flex items-center gap-2 px-3 py-1.5 text-xs font-mono tracking-wider uppercase transition-colors rounded-sm cursor-pointer whitespace-nowrap select-none',
        isActive
          ? 'text-text-primary font-medium'
          : 'text-text-secondary hover:text-text-primary hover:bg-surface-hover/50',
        className
      )}
    >
      {isActive && (
        <motion.div
          layoutId="tab-active-indicator"
          className="absolute inset-0 bg-surface-elevated border border-border rounded-sm -z-0"
          transition={{ type: 'spring', bounce: 0.15, duration: 0.25 }}
        />
      )}
      <span className="relative z-10 flex items-center gap-1.5">
        {icon && <span className="opacity-80">{icon}</span>}
        {children}
        {badge != null && (
          <span className="ml-1 text-[10px] px-1.5 py-0.2 bg-border text-text-secondary rounded-sm">
            {badge}
          </span>
        )}
      </span>
    </button>
  );
}

export function TabContent({ value, children, className }) {
  const { activeValue } = useContext(TabsContext);
  if (activeValue !== value) return null;

  return (
    <div role="tabpanel" className={cn('w-full pt-4 focus:outline-none', className)}>
      {children}
    </div>
  );
}

export default Tabs;
