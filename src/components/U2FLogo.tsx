'use client';

interface U2FLogoProps {
  size?: number;
  color?: string;
  className?: string;
  style?: React.CSSProperties;
}

export function U2FLogo({ size = 44, color = 'var(--accent)', className, style }: U2FLogoProps) {
  const w = Math.round(size * 0.909);
  return (
    <svg width={w} height={size} viewBox="0 0 100 110" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="U2F" className={className} style={style}>
      <path d="M50,5 L93.3,30 L93.3,80 L50,105 L6.7,80 L6.7,30 Z" stroke={color} strokeWidth="5" strokeLinejoin="round" />
      <line x1="93.3" y1="30" x2="50" y2="55" stroke={color} strokeWidth="5" strokeLinecap="round" />
      <line x1="6.7" y1="30" x2="50" y2="55" stroke={color} strokeWidth="5" strokeLinecap="round" />
      <line x1="50" y1="55" x2="50" y2="105" stroke={color} strokeWidth="5" strokeLinecap="round" />
      <text x="0" y="0" textAnchor="middle" dominantBaseline="central" fontFamily="Inter, -apple-system, sans-serif" fontWeight="700" fontSize="26" fill={color} transform="matrix(0.866,0.5,-0.866,0.5,50,30)">U</text>
      <text x="0" y="0" textAnchor="middle" dominantBaseline="central" fontFamily="Inter, -apple-system, sans-serif" fontWeight="700" fontSize="22" fill={color} transform="matrix(0.866,0.5,0,1,28,67.5)">2</text>
      <text x="0" y="0" textAnchor="middle" dominantBaseline="central" fontFamily="Inter, -apple-system, sans-serif" fontWeight="700" fontSize="22" fill={color} transform="matrix(0.866,-0.5,0,1,72,67.5)">F</text>
    </svg>
  );
}
