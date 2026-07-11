import React from 'react';

interface IconProps {
  size?: number;
  color?: string;
  active?: boolean;
}

/* ── Nav icons redrawn as colorful rounded "badge" stickers — each button
   gets its own distinct gradient + icon, matching the reference screenshot's
   pictorial rounded-square icon style (Market/Çiftlik/Görevler/Arkadaşlar/
   Ödeme/Oyunlar) instead of one flat uniform emoji. ── */

function Badge({
  size,
  active,
  gradient,
  ring,
  children,
}: {
  size: number;
  active?: boolean;
  gradient: string;
  ring: string;
  children: React.ReactNode;
}) {
  const box = Math.round(size * 1.55);
  return (
    <div
      style={{
        width: box,
        height: box,
        borderRadius: box * 0.32,
        background: gradient,
        border: `1.5px solid ${ring}`,
        boxShadow: active
          ? `0 2px 0 rgba(0,0,0,0.35), 0 0 6px ${ring}, inset 0 1px 1px rgba(255,255,255,0.45)`
          : `0 2px 0 rgba(0,0,0,0.35), inset 0 1px 1px rgba(255,255,255,0.3)`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        filter: active ? 'none' : 'saturate(0.8) brightness(0.92)',
        opacity: active ? 1 : 0.92,
      }}
    >
      <span style={{ fontSize: size, lineHeight: 1 }}>{children}</span>
    </div>
  );
}

export function FarmIcon({ size = 22, active }: IconProps) {
  return (
    <Badge size={size} active={active} gradient="linear-gradient(160deg, #ef5350 0%, #b71c1c 100%)" ring="#7f1414">
      🏚️
    </Badge>
  );
}

export function SpinIcon({ size = 22, active }: IconProps) {
  return (
    <Badge size={size} active={active} gradient="linear-gradient(160deg, #ffca28 0%, #f57c00 100%)" ring="#a05a00">
      🎡
    </Badge>
  );
}

export function NftIcon({ size = 22, active }: IconProps) {
  return (
    <Badge size={size} active={active} gradient="linear-gradient(160deg, #ba68c8 0%, #6a1b9a 100%)" ring="#4a1268">
      🏷️
    </Badge>
  );
}

export function TaskIcon({ size = 22, active }: IconProps) {
  return (
    <Badge size={size} active={active} gradient="linear-gradient(160deg, #4fc3f7 0%, #0277bd 100%)" ring="#01507f">
      📋
    </Badge>
  );
}

export function InviteIcon({ size = 22, active }: IconProps) {
  return (
    <Badge size={size} active={active} gradient="linear-gradient(160deg, #4dd0e1 0%, #00838f 100%)" ring="#005a62">
      👥
    </Badge>
  );
}

export function LeaderboardIcon({ size = 22, active }: IconProps) {
  return (
    <Badge size={size} active={active} gradient="linear-gradient(160deg, #ffd54f 0%, #ff8f00 100%)" ring="#a35d00">
      🏆
    </Badge>
  );
}

export function ShopIcon({ size = 22, active }: IconProps) {
  return (
    <Badge size={size} active={active} gradient="linear-gradient(160deg, #81c784 0%, #2e7d32 100%)" ring="#1b5e20">
      🛒
    </Badge>
  );
}

export function AchievementIcon({ size = 22, active }: IconProps) {
  return (
    <Badge size={size} active={active} gradient="linear-gradient(160deg, #ffe082 0%, #ff6f00 100%)" ring="#a34700">
      🏅
    </Badge>
  );
}

export function MusicIcon({ size = 22, active, on = true }: IconProps & { on?: boolean }) {
  return (
    <Badge
      size={size}
      active={active || on}
      gradient={on ? 'linear-gradient(160deg, #f48fb1 0%, #ad1457 100%)' : 'linear-gradient(160deg, #616161 0%, #303030 100%)'}
      ring={on ? '#7a0e3d' : '#1a1a1a'}
    >
      {on ? '🎵' : '🔇'}
    </Badge>
  );
}

export function AdminIcon({ size = 22, active }: IconProps) {
  return (
    <Badge size={size} active={active} gradient="linear-gradient(160deg, #ff5252 0%, #b71c1c 100%)" ring="#7f1414">
      🛡️
    </Badge>
  );
}

export function TradeIcon({ size = 22, active }: IconProps) {
  return (
    <Badge size={size} active={active} gradient="linear-gradient(160deg, #aed581 0%, #558b2f 100%)" ring="#33691e">
      🔄
    </Badge>
  );
}
