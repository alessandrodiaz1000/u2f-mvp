import React from 'react';

interface P {
  size?: number;
  strokeWidth?: number;
  style?: React.CSSProperties;
  color?: string;
}

const I = (
  paths: React.ReactNode,
  { filled }: { filled?: boolean } = {},
) => ({ size = 16, strokeWidth = 1.75, style, color }: P = {}) => (
  <svg
    width={size} height={size} viewBox="0 0 24 24"
    fill={filled ? 'currentColor' : 'none'}
    stroke="currentColor" strokeWidth={strokeWidth}
    strokeLinecap="round" strokeLinejoin="round"
    style={{ color, flexShrink: 0, ...style }}
  >
    {paths}
  </svg>
);

export const IconBookmark    = I(<path d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />);
export const IconCalendar    = I(<><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></>);
export const IconBuilding    = I(<><path d="M3 21V6l9-3 9 3v15" /><path d="M9 21V12h6v9" /><path d="M9 3v3M15 3v3" /></>);
export const IconHeart       = I(<path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />);
export const IconSearch      = I(<><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.35-4.35" /></>);
export const IconCompass     = I(<><circle cx="12" cy="12" r="10" /><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" /></>);
export const IconCheck       = I(<path d="M20 6L9 17l-5-5" />);
export const IconUndo        = I(<><path d="M3 7v6h6" /><path d="M3 13A9 9 0 1 0 5.7 5.7L3 7" /></>);
export const IconDocument    = I(<><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" /></>);
export const IconUsers       = I(<><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" /></>);
export const IconAlert       = I(<><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></>);
export const IconGlobe       = I(<><circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" /><path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" /></>);
export const IconBarChart    = I(<><line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" /></>);
export const IconGradCap     = I(<><path d="M22 10v6M2 10l10-5 10 5-10 5z" /><path d="M6 12v5c3 3 9 3 12 0v-5" /></>);
export const IconMapPin      = I(<><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" /><circle cx="12" cy="10" r="3" /></>);
export const IconCoin        = I(<><circle cx="12" cy="12" r="10" /><path d="M12 6v2M12 16v2M9.5 9.5a2.5 2.5 0 015 0c0 1.5-2.5 2-2.5 2.5s0 1 0 1M12 15h.01" /></>);
export const IconTarget      = I(<><circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" /></>);
export const IconBrain       = I(<><path d="M12 5a3 3 0 10-5.997.125 4 4 0 00-2.526 5.77 4 4 0 00.556 6.588A4 4 0 1012 18z" /><path d="M12 5a3 3 0 115.997.125 4 4 0 012.526 5.77 4 4 0 01-.556 6.588A4 4 0 1112 18z" /><path d="M15 13a4.5 4.5 0 01-3-4 4.5 4.5 0 01-3 4M17.599 6.5a3 3 0 00.399-1.375M6.399 6.5a3 3 0 01-.399-1.375M8.25 16.75a3 3 0 003-1.875V15M15.75 16.75a3 3 0 01-3-1.875V15" /></>);
export const IconKey         = I(<><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 11-7.778 7.778 5.5 5.5 0 017.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" /></>);
export const IconExtLink     = I(<><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" /></>);
export const IconChevDown    = I(<polyline points="6 9 12 15 18 9" />);
export const IconChevRight   = I(<polyline points="9 18 15 12 9 6" />);
export const IconUser        = I(<><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" /><circle cx="12" cy="7" r="4" /></>);
export const IconX           = I(<><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></>);
export const IconArrowRight  = I(<><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></>);
export const IconStar        = I(<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />);
export const IconClipboard   = I(<><path d="M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2" /><rect x="8" y="2" width="8" height="4" rx="1" ry="1" /></>);
export const IconLink        = I(<><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" /></>);
export const IconClock       = I(<><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></>);
export const IconInfo        = I(<><circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" /></>);
