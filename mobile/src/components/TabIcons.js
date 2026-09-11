import React from 'react';
import Svg, { Path, Rect, Line, Circle } from 'react-native-svg';

/**
 * Bộ icon đồng nhất (outline / solid) cho ứng dụng MacroPulse.
 * - Khung 24x24 (1:1), stroke đồng nhất, không 3D / shadow / gradient.
 * - Outline dùng cho tab chưa chọn, Solid cho tab đang chọn.
 * - Màu: truyền từ nơi dùng (inactive slate, active trắng/slate-50).
 */

function Shell({ size, color, strokeWidth, children }) {
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
    >
      {children}
    </Svg>
  );
}

function SolidShell({ size, color, children }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      {children}
    </Svg>
  );
}

/** 1. Tin nóng — ngọn lửa. */
export function FlameIcon({ size = 20, color = '#94A3B8', strokeWidth = 1.6, variant = 'outline', ...rest }) {
  if (variant === 'solid') {
    return (
      <SolidShell size={size} color={color} {...rest}>
        <Path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
      </SolidShell>
    );
  }
  return (
    <Shell size={size} color={color} strokeWidth={strokeWidth} {...rest}>
      <Path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
    </Shell>
  );
}

/** 2. Vàng XAU — biểu đồ nến tăng + đường xu hướng. */
export function MarketIcon({ size = 20, color = '#94A3B8', strokeWidth = 1.6, variant = 'outline', ...rest }) {
  if (variant === 'solid') {
    return (
      <SolidShell size={size} color={color} {...rest}>
        <Rect x="4" y="8" width="2" height="4" rx="0.5" />
        <Rect x="10" y="7" width="2" height="4" rx="0.5" />
        <Rect x="16" y="6" width="2" height="4" rx="0.5" />
        <Rect x="4" y="5" width="2" height="2" rx="0.5" />
        <Rect x="10" y="4" width="2" height="2" rx="0.5" />
        <Rect x="16" y="3" width="2" height="2" rx="0.5" />
        <Path d="M4.5 9 L10.5 8 L16.5 7" stroke="#0B1426" strokeWidth="1.2" fill="none" />
      </SolidShell>
    );
  }
  return (
    <Shell size={size} color={color} strokeWidth={strokeWidth} {...rest}>
      <Rect x="4" y="8" width="2" height="4" />
      <Line x1="5" y1="6" x2="5" y2="14" />
      <Rect x="10" y="7" width="2" height="4" />
      <Line x1="11" y1="5" x2="11" y2="13" />
      <Rect x="16" y="6" width="2" height="4" />
      <Line x1="17" y1="4" x2="17" y2="12" />
      <Path d="M4.5 8.5 L10.5 7.5 L16.5 6.5" />
    </Shell>
  );
}

/** 3. Lịch KT — lịch lưới mở, 1 chấm đánh dấu sự kiện. */
export function CalendarDotIcon({ size = 20, color = '#94A3B8', strokeWidth = 1.6, variant = 'outline', ...rest }) {
  if (variant === 'solid') {
    return (
      <SolidShell size={size} color={color} {...rest}>
        <Rect x="3" y="4" width="18" height="16" rx="2.5" />
        <Path d="M3 9.5 H21" stroke="#0B1426" strokeWidth="1.2" fill="none" />
        <Path d="M9.7 13.5 H15" stroke="#0B1426" strokeWidth="1.2" fill="none" />
        <Path d="M8 2 V5 M16 2 V5" stroke="#0B1426" strokeWidth="1.6" strokeLinecap="round" fill="none" />
        <Circle cx="6.3" cy="11.2" r="1.2" stroke="#0B1426" strokeWidth="0.6" fill="none" />
      </SolidShell>
    );
  }
  return (
    <Shell size={size} color={color} strokeWidth={strokeWidth} {...rest}>
      <Rect x="3" y="4" width="18" height="16" rx="2.5" />
      <Path d="M3 9.5 H21" />
      <Line x1="8" y1="2" x2="8" y2="5" />
      <Line x1="16" y1="2" x2="16" y2="5" />
      <Line x1="9.7" y1="13.5" x2="9.7" y2="20" />
      <Line x1="15" y1="13.5" x2="15" y2="20" />
      <Line x1="3" y1="13.5" x2="21" y2="13.5" />
      <Line x1="3" y1="17.5" x2="21" y2="17.5" />
      <Circle cx="6.3" cy="11" r="1.2" />
    </Shell>
  );
}

/** 4. Quan tâm — bookmark. */
export function BookmarkIcon({ size = 20, color = '#94A3B8', strokeWidth = 1.6, variant = 'outline', ...rest }) {
  if (variant === 'solid') {
    return (
      <SolidShell size={size} color={color} {...rest}>
        <Path d="M19 21l-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z" />
      </SolidShell>
    );
  }
  return (
    <Shell size={size} color={color} strokeWidth={strokeWidth} {...rest}>
      <Path d="M19 21l-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z" />
    </Shell>
  );
}

/** 4b. Nguồn tin — RSS signal arcs. */
export function RadioIcon({ size = 20, color = '#94A3B8', strokeWidth = 1.6, variant = 'outline', ...rest }) {
  if (variant === 'solid') {
    return (
      <SolidShell size={size} color={color} {...rest}>
        <Circle cx="5.5" cy="18.2" r="1.3" />
        <Path d="M5.5 13a5.2 5.2 0 0 1 5.2 5.2" stroke="#0B1426" strokeWidth="1.1" fill="none" />
        <Path d="M5.5 7.7a10.5 10.5 0 0 1 10.5 10.5" stroke="#0B1426" strokeWidth="1.1" fill="none" />
      </SolidShell>
    );
  }
  return (
    <Shell size={size} color={color} strokeWidth={strokeWidth} {...rest}>
      <Circle cx="5.5" cy="18.2" r="1.3" />
      <Path d="M5.5 13a5.2 5.2 0 0 1 5.2 5.2" />
      <Path d="M5.5 7.7a10.5 10.5 0 0 1 10.5 10.5" />
    </Shell>
  );
}

/** Logo thương hiệu — tia chớp nét mảnh (dùng trong PulseLogo). */
export function BoltMark({ size = 20, color = '#F5A623', strokeWidth = 1.8, ...rest }) {
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
      <Path d="M13 2 L4.5 13.5 H11 L9.5 22 L19.5 9.5 H12.5 L13 2" />
    </Svg>
  );
}