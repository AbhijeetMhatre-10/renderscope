import React from 'react';
import {
  Braces,
  FileCode2,
  FileText,
  Image as ImageIcon,
  Paintbrush,
  Radio,
  Type,
} from 'lucide-react';
import { getResourceMeta } from './waterfallUtils';

const TYPE_ICONS = {
  html: FileCode2,
  css: Paintbrush,
  js: Braces,
  image: ImageIcon,
  font: Type,
  xhr: Radio,
  other: FileText,
};

export function ResourceTypeIcon({ type = 'other', showLabel = false, className = '' }) {
  const key = String(type || 'other').toLowerCase();
  const Icon = TYPE_ICONS[key] || TYPE_ICONS.other;
  const meta = getResourceMeta(key);

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-sm border px-1.5 py-0.5 font-mono text-[10px] leading-none shrink-0 select-none ${className}`}
      style={{
        color: meta.colorVar,
        borderColor: `color-mix(in srgb, ${meta.colorVar} 35%, transparent)`,
        backgroundColor: `color-mix(in srgb, ${meta.colorVar} 12%, transparent)`,
      }}
      title={meta.label}
    >
      <Icon className="h-3 w-3 shrink-0" aria-hidden="true" />
      {showLabel && <span>{meta.label}</span>}
    </span>
  );
}

export default ResourceTypeIcon;
