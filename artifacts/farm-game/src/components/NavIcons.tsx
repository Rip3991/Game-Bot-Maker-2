import React from 'react';

interface IconProps {
  size?: number;
  color?: string;
  active?: boolean;
}

/* ── Nav icons redrawn as friendly pictorial "stickers" (barn, storefront,
   clipboard, people, trophy, cart) — matching the reference screenshots'
   flat, readable icon style instead of thin abstract line art. ── */

export function FarmIcon({ size = 22, active }: IconProps) {
  return (
    <span style={{ fontSize: size, lineHeight: 1, filter: active ? 'none' : 'saturate(0.75) brightness(0.85)', opacity: active ? 1 : 0.85 }}>
      🏡
    </span>
  );
}

export function SpinIcon({ size = 22, active }: IconProps) {
  return (
    <span style={{ fontSize: size, lineHeight: 1, filter: active ? 'none' : 'saturate(0.75) brightness(0.85)', opacity: active ? 1 : 0.85 }}>
      🎡
    </span>
  );
}

export function NftIcon({ size = 22, active }: IconProps) {
  return (
    <span style={{ fontSize: size, lineHeight: 1, filter: active ? 'none' : 'saturate(0.75) brightness(0.85)', opacity: active ? 1 : 0.85 }}>
      🏷️
    </span>
  );
}

export function TaskIcon({ size = 22, active }: IconProps) {
  return (
    <span style={{ fontSize: size, lineHeight: 1, filter: active ? 'none' : 'saturate(0.75) brightness(0.85)', opacity: active ? 1 : 0.85 }}>
      📋
    </span>
  );
}

export function InviteIcon({ size = 22, active }: IconProps) {
  return (
    <span style={{ fontSize: size, lineHeight: 1, filter: active ? 'none' : 'saturate(0.75) brightness(0.85)', opacity: active ? 1 : 0.85 }}>
      👥
    </span>
  );
}

export function LeaderboardIcon({ size = 22, active }: IconProps) {
  return (
    <span style={{ fontSize: size, lineHeight: 1, filter: active ? 'none' : 'saturate(0.75) brightness(0.85)', opacity: active ? 1 : 0.85 }}>
      🏆
    </span>
  );
}

export function ShopIcon({ size = 22, active }: IconProps) {
  return (
    <span style={{ fontSize: size, lineHeight: 1, filter: active ? 'none' : 'saturate(0.75) brightness(0.85)', opacity: active ? 1 : 0.85 }}>
      🛒
    </span>
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

export function TradeIcon({ size = 22, active }: IconProps) {
  const c = active ? '#fbbf24' : '#8a7240';
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M3 8 L21 8" stroke={c} strokeWidth="1.8" strokeLinecap="round"/>
      <path d="M17 4 L21 8 L17 12" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M21 16 L3 16" stroke={active ? '#a8ff78' : '#4a7a30'} strokeWidth="1.8" strokeLinecap="round"/>
      <path d="M7 12 L3 16 L7 20" stroke={active ? '#a8ff78' : '#4a7a30'} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}
