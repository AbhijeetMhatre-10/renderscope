import React from 'react';
import { NavLink, useLocation, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { Sun, Moon, Menu, X, BarChart3, Clock, GitCompare } from 'lucide-react';
import { toggleTheme } from '../../store/appStore';
import { toggleMobileMenu, setMobileMenuOpen } from '../../store/uiStore';
import Button from '../ui/Button';

export function Navbar() {
  const dispatch = useDispatch();
  const location = useLocation();
  const theme = useSelector((state) => state.app.theme);
  const mobileMenuOpen = useSelector((state) => state.ui.mobileMenuOpen);

  const navLinks = [
    { name: 'Analyze', path: '/analyze', icon: <BarChart3 className="w-3.5 h-3.5" /> },
    { name: 'History', path: '/history', icon: <Clock className="w-3.5 h-3.5" /> },
    { name: 'Compare', path: '/compare', icon: <GitCompare className="w-3.5 h-3.5" /> },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-background/90 backdrop-blur-md transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
        {/* Logo */}
        <Link
          to="/"
          className="flex items-center gap-2.5 text-text-primary hover:opacity-90 transition-opacity select-none group"
        >
          <div className="relative flex items-center justify-center w-7 h-7 rounded-md bg-surface-elevated border border-border group-hover:border-status-info transition-colors">
            <span className="w-2 h-2 rounded-full bg-status-info animate-pulse" />
            <div className="absolute inset-0 border border-status-info/30 rounded-md scale-75" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="font-mono font-semibold text-sm tracking-tight text-text-primary">
              RenderScope
            </span>
            <span className="font-mono text-[10px] text-text-muted px-1 rounded bg-surface border border-border/80 hidden sm:inline-block">
              v0.1
            </span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => {
            const isActive = location.pathname.startsWith(link.path);
            return (
              <NavLink
                key={link.path}
                to={link.path}
                className={({ isActive: active }) =>
                  `relative px-3 py-1.5 text-xs font-mono tracking-wider uppercase transition-colors rounded-sm flex items-center gap-1.5 select-none ${
                    active || isActive
                      ? 'text-text-primary font-medium'
                      : 'text-text-secondary hover:text-text-primary hover:bg-surface-hover/50'
                  }`
                }
              >
                {({ isActive: active }) => (
                  <>
                    {(active || isActive) && (
                      <motion.div
                        layoutId="nav-active-pill"
                        className="absolute inset-0 bg-surface-elevated border border-border rounded-sm -z-0"
                        transition={{ type: 'spring', bounce: 0.15, duration: 0.25 }}
                      />
                    )}
                    <span className="relative z-10 flex items-center gap-1.5">
                      {link.icon}
                      {link.name}
                    </span>
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Actions: Theme Toggle & Mobile Menu Trigger */}
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => dispatch(toggleTheme())}
            aria-label="Toggle theme"
            className="h-8 w-8 p-0 text-text-secondary hover:text-text-primary rounded-sm border border-border/60 hover:bg-surface-elevated"
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 text-status-warning" />
            ) : (
              <Moon className="w-4 h-4 text-status-info" />
            )}
          </Button>

          {/* Mobile hamburger button */}
          <div className="md:hidden">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => dispatch(toggleMobileMenu())}
              aria-label="Toggle navigation menu"
              className="h-8 w-8 p-0 text-text-secondary hover:text-text-primary rounded-sm border border-border/60 hover:bg-surface-elevated"
            >
              {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Navigation (<768px) */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="md:hidden border-b border-border bg-surface/95 backdrop-blur-md px-4 py-3 space-y-1 overflow-hidden"
          >
            {navLinks.map((link) => {
              const isActive = location.pathname.startsWith(link.path);
              return (
                <NavLink
                  key={link.path}
                  to={link.path}
                  onClick={() => dispatch(setMobileMenuOpen(false))}
                  className={`flex items-center gap-2.5 px-3 py-2 text-xs font-mono uppercase tracking-wider rounded-sm transition-colors ${
                    isActive
                      ? 'bg-surface-elevated text-text-primary border border-border font-medium'
                      : 'text-text-secondary hover:text-text-primary hover:bg-surface-hover'
                  }`}
                >
                  {link.icon}
                  {link.name}
                </NavLink>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}

export default Navbar;
