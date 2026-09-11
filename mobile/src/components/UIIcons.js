import React from 'react';
import Svg, { Path, Circle, Line, Rect, Polyline } from 'react-native-svg';

function IconShell({ size, color, strokeWidth = 1.8, children, ...rest }) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...rest}
    >
      {children}
    </Svg>
  );
}

/** ↻ Refresh / reload */
export function RefreshIcon({ size = 18, color = '#94A3B8', strokeWidth = 1.8, ...rest }) {
  return (
    <IconShell size={size} color={color} strokeWidth={strokeWidth} {...rest}>
      <Polyline points="23 4 23 10 17 10" />
      <Path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
    </IconShell>
  );
}

/** ⌕ Search */
export function SearchIcon({ size = 18, color = '#64748B', strokeWidth = 1.8, ...rest }) {
  return (
    <IconShell size={size} color={color} strokeWidth={strokeWidth} {...rest}>
      <Circle cx="11" cy="11" r="7" />
      <Line x1="16.5" y1="16.5" x2="21" y2="21" />
    </IconShell>
  );
}

/** ✕ Close / clear */
export function CloseIcon({ size = 18, color = '#94A3B8', strokeWidth = 2, ...rest }) {
  return (
    <IconShell size={size} color={color} strokeWidth={strokeWidth} {...rest}>
      <Line x1="18" y1="6" x2="6" y2="18" />
      <Line x1="6" y1="6" x2="18" y2="18" />
    </IconShell>
  );
}

/** ✎ Edit / pencil */
export function PencilIcon({ size = 16, color = '#94A3B8', strokeWidth = 1.8, ...rest }) {
  return (
    <IconShell size={size} color={color} strokeWidth={strokeWidth} {...rest}>
      <Path d="M17 3a2.83 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
    </IconShell>
  );
}

/** ▴ Chevron up */
export function ChevronUpIcon({ size = 16, color = '#F5A623', strokeWidth = 2, ...rest }) {
  return (
    <IconShell size={size} color={color} strokeWidth={strokeWidth} {...rest}>
      <Polyline points="18 15 12 9 6 15" />
    </IconShell>
  );
}

/** ⬇ Download */
export function DownloadIcon({ size = 18, color = '#F1F5F9', strokeWidth = 2, ...rest }) {
  return (
    <IconShell size={size} color={color} strokeWidth={strokeWidth} {...rest}>
      <Path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <Polyline points="7 10 12 15 17 10" />
      <Line x1="12" y1="15" x2="12" y2="3" />
    </IconShell>
  );
}

/** ▾ Trash / delete */
export function TrashIcon({ size = 16, color = '#FB7185', strokeWidth = 1.8, ...rest }) {
  return (
    <IconShell size={size} color={color} strokeWidth={strokeWidth} {...rest}>
      <Polyline points="3 6 5 6 21 6" />
      <Path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </IconShell>
  );
}

/** ! Alert / info circle */
export function AlertCircleIcon({ size = 18, color = '#F5A623', strokeWidth = 1.8, ...rest }) {
  return (
    <IconShell size={size} color={color} strokeWidth={strokeWidth} {...rest}>
      <Circle cx="12" cy="12" r="10" />
      <Line x1="12" y1="8" x2="12" y2="12" />
      <Line x1="12" y1="16" x2="12.01" y2="16" />
    </IconShell>
  );
}

/** ✕ Cancel / remove small */
export function XIcon({ size = 14, color = '#94A3B8', strokeWidth = 2, ...rest }) {
  return (
    <IconShell size={size} color={color} strokeWidth={strokeWidth} {...rest}>
      <Line x1="18" y1="6" x2="6" y2="18" />
      <Line x1="6" y1="6" x2="18" y2="18" />
    </IconShell>
  );
}

/** ✓ Success check */
export function CheckIcon({ size = 18, color = '#34D399', strokeWidth = 2, ...rest }) {
  return (
    <IconShell size={size} color={color} strokeWidth={strokeWidth} {...rest}>
      <Polyline points="20 6 9 17 4 12" />
    </IconShell>
  );
}

/** i Info */
export function InfoIcon({ size = 18, color = '#94A3B8', strokeWidth = 1.8, ...rest }) {
  return (
    <IconShell size={size} color={color} strokeWidth={strokeWidth} {...rest}>
      <Circle cx="12" cy="12" r="10" />
      <Line x1="12" y1="16" x2="12" y2="12" />
      <Line x1="12" y1="8" x2="12.01" y2="8" />
    </IconShell>
  );
}