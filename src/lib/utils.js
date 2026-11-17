import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Combines Tailwind classes safely
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

/**
 * Format bytes into human-readable string (KB, MB)
 */
export function formatBytes(bytes, decimals = 1) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

/**
 * Format duration in milliseconds to clean string (e.g. 1.42s or 210ms)
 */
export function formatDuration(ms) {
  if (ms == null) return '--';
  if (ms >= 1000) {
    return `${parseFloat((ms / 1000).toFixed(2))}s`;
  }
  return `${parseFloat(ms.toFixed(2))}ms`;
}
