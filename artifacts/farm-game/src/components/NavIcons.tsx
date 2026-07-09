import React from 'react';

interface IconProps {
  size?: number;
  color?: string;
  active?: boolean;
}

export function FarmIcon({ size = 22, active }: IconProps) {
  const c = active ? '#a8ff78' : '#7db85a';
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <rect x="2" y="18" width="20" height="4" rx="1.5" fill={active ? '#5a3010' : '#3d2008'} opacity="0.9" />
      <rect x="5" y="14" width="3" height="5" rx="1" fill={active ? '#8b5c1e' : '#6b4414'} />
      <rect x="16" y="14" width="3" height="5" rx="1" fill={active ? '#8b5c1e' : '#6b4414'} />
      <ellipse cx="12" cy="10" rx="8" ry="6" fill={active ? '#2d6b0e' : '#1e4a08'} />
      <ellipse cx="12" cy="10" rx="6" ry="4" fill={active ? '#3d8b1a' : '#2a6010'} />
      <path d="M8 14 Q10 8 12 6 Q14 8 16 14" fill={active ? '#4ade80' : '#34c464'} opacity="0.9" />
      <path d="M10 14 Q11 10 12 8 Q13 10 14 14" fill={active ? '#86efac' : '#6ee29a'} />
      <circle cx="12" cy="6" r="1.5" fill={c} />
      <path d="M7 12 Q8.5 9 10 10" stroke={c} strokeWidth="0.8" fill="none" opacity="0.7" />
      <path d="M17 12 Q15.5 9 14 10" stroke={c} strokeWidth="0.8" fill="none" opacity="0.7" />
    </svg>
  );
}

export function SpinIcon({ size = 22, active }: IconProps) {
  const c = active ? '#fde68a' : '#c9a84c';
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="9" stroke={active ? '#f5c842' : '#a07830'} strokeWidth="2" fill={active ? '#1a0a00' : '#120700'} />
      <circle cx="12" cy="12" r="7" stroke={active ? '#e6a800' : '#7a5a20'} strokeWidth="0.5" fill="none" strokeDasharray="2 2" />
      <path d="M12 3 L13.5 8 L12 7.5 L10.5 8 Z" fill={active ? '#f87171' : '#b04040'} />
      <path d="M21 12 L16 13.5 L16.5 12 L16 10.5 Z" fill={active ? '#4ade80' : '#2a8040'} />
      <path d="M12 21 L10.5 16 L12 16.5 L13.5 16 Z" fill={active ? '#60a5fa' : '#2060a0'} />
      <path d="M3 12 L8 10.5 L7.5 12 L8 13.5 Z" fill={active ? '#fbbf24' : '#a07010'} />
      <circle cx="12" cy="12" r="2.5" fill={active ? '#f5c842' : '#8b6820'} stroke={active ? '#fde68a' : '#6b4810'} strokeWidth="1" />
      <circle cx="12" cy="12" r="1" fill={c} />
    </svg>
  );
}

export function NftIcon({ size = 22, active }: IconProps) {
  const c = active ? '#c084fc' : '#8040c0';
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <polygon points="12,2 20,8 20,16 12,22 4,16 4,8" fill={active ? '#1a0a2e' : '#100618'} stroke={c} strokeWidth="1.5" />
      <polygon points="12,5 17,9 17,15 12,19 7,15 7,9" fill={active ? '#2d0d5c' : '#1a0838'} stroke={active ? '#a855f7' : '#6020a0'} strokeWidth="0.8" />
      <path d="M12 7 L14.5 11 L12 15 L9.5 11 Z" fill={active ? '#c084fc' : '#7030b0'} opacity="0.9" />
      <path d="M12 7 L14.5 11 L12 11 Z" fill={active ? '#e9d5ff' : '#a060e0'} opacity="0.8" />
      <circle cx="18" cy="5" r="1.5" fill={active ? '#fbbf24' : '#a07010'} />
      <circle cx="6" cy="19" r="1" fill={active ? '#a78bfa' : '#6040a0'} opacity="0.7" />
    </svg>
  );
}

export function TaskIcon({ size = 22, active }: IconProps) {
  const c = active ? '#fde68a' : '#b08030';
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <rect x="5" y="2" width="14" height="20" rx="2" fill={active ? '#2e1a04' : '#1e1000'} stroke={active ? '#c4832e' : '#6b4010'} strokeWidth="1.5" />
      <rect x="8" y="1.5" width="8" height="3" rx="1.5" fill={active ? '#8b5c1e' : '#5c3a10'} />
      <line x1="8" y1="8" x2="16" y2="8" stroke={c} strokeWidth="1.2" strokeLinecap="round" />
      <line x1="8" y1="11.5" x2="16" y2="11.5" stroke={c} strokeWidth="1.2" strokeLinecap="round" />
      <line x1="8" y1="15" x2="13" y2="15" stroke={c} strokeWidth="1.2" strokeLinecap="round" />
      <circle cx="6.5" cy="8" r="1.2" fill={active ? '#4ade80' : '#2a8040'} />
      <circle cx="6.5" cy="11.5" r="1.2" fill={active ? '#4ade80' : '#2a8040'} />
      <circle cx="6.5" cy="15" r="1.2" fill={active ? '#fbbf24' : '#a07010'} />
      <path d="M14.5 17 L16 18.5 L18.5 15.5" stroke={active ? '#4ade80' : '#2a8040'} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </svg>
  );
}

export function InviteIcon({ size = 22, active }: IconProps) {
  const c = active ? '#4ade80' : '#2a7040';
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle cx="9" cy="7" r="3.5" fill={active ? '#1a4a10' : '#0f2a08'} stroke={c} strokeWidth="1.5" />
      <path d="M2 19 C2 15 5 13 9 13 C11 13 12.5 13.5 13.5 14.5" stroke={c} strokeWidth="1.5" strokeLinecap="round" fill="none" />
      <circle cx="17" cy="10" r="2.5" fill={active ? '#0a3a20' : '#061e10'} stroke={active ? '#34d399' : '#1a7040'} strokeWidth="1.2" />
      <line x1="17" y1="14" x2="17" y2="21" stroke={active ? '#fbbf24' : '#a07010'} strokeWidth="1.5" strokeLinecap="round" />
      <line x1="13.5" y1="17.5" x2="20.5" y2="17.5" stroke={active ? '#fbbf24' : '#a07010'} strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="20" cy="5" r="1" fill={active ? '#fde68a' : '#c09030'} />
      <circle cx="22" cy="8" r="0.7" fill={active ? '#fbbf24' : '#a07010'} />
      <circle cx="21" cy="3" r="0.5" fill={active ? '#fde68a' : '#c09030'} />
    </svg>
  );
}

export function LeaderboardIcon({ size = 22, active }: IconProps) {
  const c = active ? '#fbbf24' : '#a07010';
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <rect x="8" y="10" width="4" height="12" rx="1" fill={active ? '#c4832e' : '#6b4414'} />
      <rect x="2" y="14" width="4" height="8" rx="1" fill={active ? '#8b5c1e' : '#4a2e0c'} />
      <rect x="14" y="7" width="4" height="15" rx="1" fill={active ? '#d4a040' : '#8b6020'} />
      <rect x="20" y="12" width="3" height="10" rx="1" fill={active ? '#8b5c1e' : '#4a2e0c'} />
      <polygon points="16,2 17.2,5.5 21,5.5 18,7.5 19.2,11 16,9 12.8,11 14,7.5 11,5.5 14.8,5.5" fill={c} />
      <circle cx="16" cy="5.5" r="1" fill={active ? '#fde68a' : '#c09030'} />
    </svg>
  );
}

export function ShopIcon({ size = 22, active }: IconProps) {
  const c = active ? '#fde68a' : '#c09030';
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M3 9 L5 4 L19 4 L21 9" stroke={active ? '#c4832e' : '#6b4414'} strokeWidth="1.5" fill={active ? '#2e1a04' : '#1e1000'} strokeLinejoin="round" />
      <rect x="3" y="9" width="18" height="13" rx="1.5" fill={active ? '#1e3408' : '#141e04'} stroke={active ? '#4a7c2f' : '#2a4a18'} strokeWidth="1.2" />
      <path d="M9 9 C9 12 15 12 15 9" stroke={active ? '#4ade80' : '#2a8040'} strokeWidth="1.5" fill="none" strokeLinecap="round" />
      <rect x="9" y="15" width="6" height="7" rx="1" fill={active ? '#5c3a10' : '#3d2008'} />
      <circle cx="17" cy="6" r="1.5" fill={c} />
      <circle cx="19" cy="4" r="1" fill={c} opacity="0.7" />
      <circle cx="7" cy="6" r="1" fill={c} opacity="0.5" />
    </svg>
  );
}

export function AchievementIcon({ size = 22, active }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="9" r="6" fill={active ? '#1a0a2e' : '#0e0618'} stroke={active ? '#c084fc' : '#6020a0'} strokeWidth="1.5" />
      <polygon points="12,4.5 13.2,7.5 16.5,7.5 13.9,9.5 14.9,12.5 12,10.5 9.1,12.5 10.1,9.5 7.5,7.5 10.8,7.5" fill={active ? '#fbbf24' : '#8b6020'} />
      <path d="M8 15 L7 22 L12 19.5 L17 22 L16 15" fill={active ? '#2e1a04' : '#1a0e00'} stroke={active ? '#c4832e' : '#6b4414'} strokeWidth="1.2" />
      <path d="M9 15.5 L8.5 20 L12 18 L15.5 20 L15 15.5" fill={active ? '#f5c842' : '#8b6010'} opacity="0.6" />
    </svg>
  );
}

export function MusicIcon({ size = 22, active, on = true }: IconProps & { on?: boolean }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {on ? (
        <>
          <path d="M9 18 L9 6 L20 4 L20 16" stroke={active || on ? '#fbbf24' : '#6b6040'} strokeWidth="1.5" fill="none" strokeLinecap="round" />
          <circle cx="7" cy="18" r="2.5" fill={on ? '#c4832e' : '#4a3010'} stroke={on ? '#f5c842' : '#3a2008'} strokeWidth="1" />
          <circle cx="18" cy="16" r="2.5" fill={on ? '#c4832e' : '#4a3010'} stroke={on ? '#f5c842' : '#3a2008'} strokeWidth="1" />
          <path d="M13 8 L15 7.5" stroke={on ? '#fde68a' : '#6b6040'} strokeWidth="1" opacity="0.6" />
        </>
      ) : (
        <>
          <path d="M9 18 L9 6 L20 4 L20 16" stroke="#555" strokeWidth="1.5" fill="none" strokeLinecap="round" />
          <circle cx="7" cy="18" r="2.5" fill="#333" stroke="#444" strokeWidth="1" />
          <circle cx="18" cy="16" r="2.5" fill="#333" stroke="#444" strokeWidth="1" />
          <line x1="4" y1="4" x2="20" y2="20" stroke="#e74c3c" strokeWidth="1.5" strokeLinecap="round" />
        </>
      )}
    </svg>
  );
}

export function AdminIcon({ size = 22, active }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M12 2 L19 5 L19 11 C19 15.5 16 19.5 12 21 C8 19.5 5 15.5 5 11 L5 5 Z"
        fill={active ? '#3f0000' : '#250000'} stroke={active ? '#ef4444' : '#7f1d1d'} strokeWidth="1.5" />
      <path d="M12 5 L16 7 L16 11 C16 13.8 14.4 16.2 12 17.2 C9.6 16.2 8 13.8 8 11 L8 7 Z"
        fill={active ? '#7f1d1d' : '#4a0808'} opacity="0.6" />
      <polygon points="12,7 13,10 16,10 13.5,11.8 14.5,14.5 12,12.7 9.5,14.5 10.5,11.8 8,10 11,10" fill={active ? '#fca5a5' : '#dc2626'} />
    </svg>
  );
}
