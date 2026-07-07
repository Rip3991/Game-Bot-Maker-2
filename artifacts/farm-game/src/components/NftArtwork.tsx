import React from 'react';

// ── Per-NFT unique art configuration ─────────────────────────────────────────

interface ArtConfig {
  bg: string;           // Background gradient
  accent: string;       // Primary accent color
  accent2: string;      // Secondary accent color
  shape: 'circle' | 'hex' | 'star' | 'diamond' | 'burst' | 'wave' | 'crystal';
  particles: string[];  // Decorative mini-icons
  glow: string;
}

const ART: Record<string, ArtConfig> = {
  // ── COMMON (Farm & Nature) ────────────────────────────────────────────────
  wheat_seed:      { bg: 'linear-gradient(160deg,#1a2e06 0%,#2a4a0e 50%,#3d6b18 100%)', accent:'#a3d45a', accent2:'#5c8c14', shape:'wave',    particles:['🌿','✨'],         glow:'#5c8c14' },
  corn_cob:        { bg: 'linear-gradient(160deg,#2e1f00 0%,#4a3500 50%,#7a5800 100%)', accent:'#f5c842', accent2:'#e6a800', shape:'circle',  particles:['☀️','🌻'],        glow:'#f5c842' },
  tomato_vine:     { bg: 'linear-gradient(160deg,#1a0606 0%,#3a0f0f 50%,#6b1a1a 100%)', accent:'#ff4444', accent2:'#22c55e', shape:'wave',    particles:['🌿','💚'],        glow:'#ef4444' },
  carrot_fresh:    { bg: 'linear-gradient(160deg,#1a0a00 0%,#3d1a00 50%,#6b3300 100%)', accent:'#f97316', accent2:'#16a34a', shape:'wave',    particles:['🌱','🍃'],        glow:'#f97316' },
  sunflower_seed:  { bg: 'linear-gradient(160deg,#1a1400 0%,#3a2d00 50%,#6b5200 100%)', accent:'#fbbf24', accent2:'#4ade80', shape:'burst',   particles:['☀️','🌟'],        glow:'#fbbf24' },
  red_apple:       { bg: 'linear-gradient(160deg,#1a0000 0%,#3b0000 50%,#7f1d1d 100%)', accent:'#ef4444', accent2:'#16a34a', shape:'circle',  particles:['🍃','🌸'],        glow:'#dc2626' },
  cabbage_head:    { bg: 'linear-gradient(160deg,#001a06 0%,#003d14 50%,#00662a 100%)', accent:'#4ade80', accent2:'#86efac', shape:'wave',    particles:['💚','🌿'],        glow:'#22c55e' },
  herb_bunch:      { bg: 'linear-gradient(160deg,#001a08 0%,#003314 50%,#004d1e 100%)', accent:'#6ee7b7', accent2:'#34d399', shape:'circle',  particles:['✨','🌿'],        glow:'#10b981' },
  wild_mushroom:   { bg: 'linear-gradient(160deg,#0e0800 0%,#1f1200 50%,#3d2600 100%)', accent:'#d97706', accent2:'#92400e', shape:'circle',  particles:['🍂','✨'],        glow:'#b45309' },
  chicken_feather: { bg: 'linear-gradient(160deg,#0a0a0a 0%,#1a1400 50%,#2e2000 100%)', accent:'#fef3c7', accent2:'#fbbf24', shape:'wave',    particles:['☁️','✨'],        glow:'#fef3c7' },
  farm_egg:        { bg: 'linear-gradient(160deg,#0d0f0a 0%,#1a1e14 50%,#2a3020 100%)', accent:'#fef9c3', accent2:'#fde047', shape:'circle',  particles:['🌾','🌿'],        glow:'#fef08a' },
  honey_pot:       { bg: 'linear-gradient(160deg,#1a0d00 0%,#3d2000 50%,#7a4000 100%)', accent:'#f59e0b', accent2:'#fbbf24', shape:'burst',   particles:['🐝','✨'],        glow:'#d97706' },
  seedling:        { bg: 'linear-gradient(160deg,#001208 0%,#002814 50%,#003d1e 100%)', accent:'#6ee7b7', accent2:'#a7f3d0', shape:'wave',    particles:['🌱','💧'],        glow:'#34d399' },
  farm_stone:      { bg: 'linear-gradient(160deg,#0a0a0a 0%,#141414 50%,#1e1e1e 100%)', accent:'#9ca3af', accent2:'#6b7280', shape:'diamond', particles:['⚙️','💨'],       glow:'#6b7280' },
  bamboo_shoot:    { bg: 'linear-gradient(160deg,#001a08 0%,#003314 50%,#005c24 100%)', accent:'#86efac', accent2:'#bbf7d0', shape:'crystal', particles:['🎍','🌿'],       glow:'#4ade80' },
  flower_pot:      { bg: 'linear-gradient(160deg,#1a0600 0%,#3d1400 50%,#6b2400 100%)', accent:'#fb923c', accent2:'#f472b6', shape:'circle',  particles:['🌸','💐'],       glow:'#f97316' },
  rust_key:        { bg: 'linear-gradient(160deg,#0a0800 0%,#1a1000 50%,#2e1c00 100%)', accent:'#b45309', accent2:'#78350f', shape:'diamond', particles:['🗡️','💨'],       glow:'#92400e' },
  farm_deed:       { bg: 'linear-gradient(160deg,#0d0d00 0%,#1e1c00 50%,#332e00 100%)', accent:'#fef3c7', accent2:'#d97706', shape:'wave',    particles:['📋','✨'],        glow:'#fbbf24' },
  wooden_bucket:   { bg: 'linear-gradient(160deg,#0e0800 0%,#1f1200 50%,#3a2200 100%)', accent:'#92400e', accent2:'#b45309', shape:'circle',  particles:['💧','🌊'],        glow:'#92400e' },
  farm_lantern:    { bg: 'linear-gradient(160deg,#100600 0%,#250d00 50%,#3d1800 100%)', accent:'#fbbf24', accent2:'#f97316', shape:'burst',   particles:['✨','🔆'],        glow:'#f59e0b' },

  // ── RARE (Mystical & Special) ────────────────────────────────────────────
  sapphire_stone:  { bg: 'linear-gradient(160deg,#00042e 0%,#001a6b 50%,#003ab5 100%)', accent:'#60a5fa', accent2:'#93c5fd', shape:'crystal', particles:['💫','⚡'],       glow:'#3b82f6' },
  silver_moon:     { bg: 'linear-gradient(160deg,#020212 0%,#060630 50%,#0d0d4a 100%)', accent:'#c7d2fe', accent2:'#a5b4fc', shape:'circle',  particles:['⭐','🌟'],       glow:'#818cf8' },
  crystal_butterfly:{ bg:'linear-gradient(160deg,#0a001a 0%,#1a0038 50%,#2d006b 100%)', accent:'#c084fc', accent2:'#e879f9', shape:'burst',   particles:['✨','💠'],       glow:'#a855f7' },
  golden_bee:      { bg: 'linear-gradient(160deg,#1a1000 0%,#3d2600 50%,#7a5000 100%)', accent:'#fbbf24', accent2:'#f59e0b', shape:'burst',   particles:['🌸','💛'],       glow:'#d97706' },
  silver_fox:      { bg: 'linear-gradient(160deg,#080808 0%,#141414 50%,#242424 100%)', accent:'#d1d5db', accent2:'#9ca3af', shape:'wave',    particles:['🌙','⭐'],       glow:'#9ca3af' },
  rare_shell:      { bg: 'linear-gradient(160deg,#00101a 0%,#002038 50%,#003a6b 100%)', accent:'#67e8f9', accent2:'#22d3ee', shape:'wave',    particles:['🌊','💧'],       glow:'#06b6d4' },
  thunder_gem:     { bg: 'linear-gradient(160deg,#0a0014 0%,#1a0030 50%,#2e0060 100%)', accent:'#fbbf24', accent2:'#a855f7', shape:'crystal', particles:['⚡','💥'],       glow:'#7c3aed' },
  oracle_orb:      { bg: 'linear-gradient(160deg,#050012 0%,#0d0028 50%,#1a0050 100%)', accent:'#c084fc', accent2:'#818cf8', shape:'circle',  particles:['✨','🔮'],       glow:'#9333ea' },
  rainbow_flower:  { bg: 'linear-gradient(160deg,#0a0000 0%,#1a001a 50%,#000a3d 100%)', accent:'#f472b6', accent2:'#a78bfa', shape:'burst',   particles:['🌈','✨'],       glow:'#ec4899' },
  tropical_parrot: { bg: 'linear-gradient(160deg,#001a06 0%,#003814 50%,#005a28 100%)', accent:'#f97316', accent2:'#facc15', shape:'wave',    particles:['🌺','🍃'],       glow:'#16a34a' },
  golden_turtle:   { bg: 'linear-gradient(160deg,#1a0e00 0%,#3d2000 50%,#7a4400 100%)', accent:'#fbbf24', accent2:'#86efac', shape:'hex',     particles:['✨','💚'],       glow:'#d97706' },
  dragon_flower:   { bg: 'linear-gradient(160deg,#1a0000 0%,#3a0010 50%,#660020 100%)', accent:'#f87171', accent2:'#fb923c', shape:'burst',   particles:['🌸','🔥'],       glow:'#ef4444' },
  lucky_clover:    { bg: 'linear-gradient(160deg,#001a04 0%,#003810 50%,#006622 100%)', accent:'#4ade80', accent2:'#86efac', shape:'crystal', particles:['⭐','🌿'],       glow:'#22c55e' },
  evil_eye_charm:  { bg: 'linear-gradient(160deg,#000a1a 0%,#001a3d 50%,#002e6b 100%)', accent:'#38bdf8', accent2:'#0ea5e9', shape:'hex',     particles:['👁️','💙'],      glow:'#0369a1' },
  ice_crystal:     { bg: 'linear-gradient(160deg,#001020 0%,#002040 50%,#003060 100%)', accent:'#bae6fd', accent2:'#7dd3fc', shape:'crystal', particles:['❄️','💠'],       glow:'#38bdf8' },
  cherry_blossom:  { bg: 'linear-gradient(160deg,#1a0010 0%,#3d0028 50%,#6b0048 100%)', accent:'#f9a8d4', accent2:'#fbcfe8', shape:'wave',    particles:['🌸','✨'],        glow:'#ec4899' },
  eagle_feather:   { bg: 'linear-gradient(160deg,#080808 0%,#101620 50%,#1a2a40 100%)', accent:'#fbbf24', accent2:'#fef3c7', shape:'burst',   particles:['🌤️','⭐'],      glow:'#ca8a04' },
  magic_cactus:    { bg: 'linear-gradient(160deg,#001a06 0%,#002e0e 50%,#004a18 100%)', accent:'#86efac', accent2:'#f472b6', shape:'diamond', particles:['✨','🌵'],       glow:'#4ade80' },
  sea_trident:     { bg: 'linear-gradient(160deg,#00101a 0%,#001e38 50%,#003060 100%)', accent:'#22d3ee', accent2:'#38bdf8', shape:'crystal', particles:['🌊','⚡'],       glow:'#0891b2' },
  phoenix_feather: { bg: 'linear-gradient(160deg,#1a0600 0%,#3d1000 50%,#7a2000 100%)', accent:'#f97316', accent2:'#fbbf24', shape:'burst',   particles:['🔥','✨'],        glow:'#ea580c' },

  // ── LEGENDARY (Epic & Divine) ─────────────────────────────────────────────
  golden_crown:    { bg: 'linear-gradient(160deg,#1a0e00 0%,#4a2a00 40%,#8a5200 80%,#c4832e 100%)', accent:'#ffd700', accent2:'#ffec44', shape:'burst',   particles:['👑','✨','⭐'], glow:'#f59e0b' },
  dragon_egg:      { bg: 'linear-gradient(160deg,#0a0000 0%,#200010 40%,#50002a 80%,#900050 100%)', accent:'#f472b6', accent2:'#a855f7', shape:'circle',  particles:['🔥','💥','✨'], glow:'#db2777' },
  legend_sword:    { bg: 'linear-gradient(160deg,#050510 0%,#0d0d24 40%,#1a1a48 80%,#2a2a80 100%)', accent:'#c7d2fe', accent2:'#818cf8', shape:'diamond', particles:['⚔️','✨','💫'], glow:'#6366f1' },
  supernova:       { bg: 'linear-gradient(160deg,#0d0000 0%,#200008 40%,#400018 80%,#800030 100%)', accent:'#fbbf24', accent2:'#f97316', shape:'burst',   particles:['💥','🌟','⭐'], glow:'#dc2626' },
  poseidon_spear:  { bg: 'linear-gradient(160deg,#000d1a 0%,#001a38 40%,#003060 80%,#004d90 100%)', accent:'#38bdf8', accent2:'#7dd3fc', shape:'crystal', particles:['🌊','⚡','💠'], glow:'#0284c7' },
  unicorn_crystal: { bg: 'linear-gradient(160deg,#0d001a 0%,#1e0038 40%,#3a006b 80%,#6000b0 100%)', accent:'#e879f9', accent2:'#f0abfc', shape:'burst',   particles:['🌟','✨','💫'], glow:'#c026d3' },
  volcano_heart:   { bg: 'linear-gradient(160deg,#0d0000 0%,#2e0000 40%,#600000 80%,#990000 100%)', accent:'#f97316', accent2:'#fbbf24', shape:'burst',   particles:['🌋','🔥','💥'], glow:'#dc2626' },
  eternal_eye:     { bg: 'linear-gradient(160deg,#000a10 0%,#001420 40%,#002038 80%,#003060 100%)', accent:'#67e8f9', accent2:'#22d3ee', shape:'hex',     particles:['👁️','✨','⭐'], glow:'#0891b2' },
  falling_star:    { bg: 'linear-gradient(160deg,#000010 0%,#00001e 40%,#00003a 80%,#000060 100%)', accent:'#fbbf24', accent2:'#fef3c7', shape:'burst',   particles:['💫','⭐','🌟'], glow:'#ca8a04' },
  eternal_key:     { bg: 'linear-gradient(160deg,#0a0800 0%,#1e1800 40%,#3d3200 80%,#665400 100%)', accent:'#fbbf24', accent2:'#d97706', shape:'diamond', particles:['✨','🗝️','💫'], glow:'#b45309' },
  golden_vase:     { bg: 'linear-gradient(160deg,#1a0c00 0%,#3d2000 40%,#7a4200 80%,#c46b00 100%)', accent:'#ffd700', accent2:'#c4832e', shape:'circle',  particles:['✨','🌟','👑'], glow:'#d97706' },
  magic_wand:      { bg: 'linear-gradient(160deg,#0a0010 0%,#150028 40%,#280050 80%,#400080 100%)', accent:'#c084fc', accent2:'#f472b6', shape:'burst',   particles:['✨','💫','🌟'], glow:'#9333ea' },
  galaxy_stone:    { bg: 'linear-gradient(160deg,#000008 0%,#000018 40%,#000030 80%,#000050 100%)', accent:'#818cf8', accent2:'#c084fc', shape:'hex',     particles:['🌌','⭐','💫'], glow:'#4f46e5' },
  ice_goddess:     { bg: 'linear-gradient(160deg,#000814 0%,#001020 40%,#001e38 80%,#003060 100%)', accent:'#bae6fd', accent2:'#e0f2fe', shape:'crystal', particles:['❄️','💎','✨'], glow:'#0ea5e9' },
  lightning_lord:  { bg: 'linear-gradient(160deg,#0a0814 0%,#141028 40%,#201a48 80%,#302870 100%)', accent:'#fbbf24', accent2:'#a855f7', shape:'burst',   particles:['⚡','💥','🌟'], glow:'#7c3aed' },
  black_hole:      { bg: 'linear-gradient(160deg,#000000 0%,#050508 40%,#0a0a14 80%,#101020 100%)', accent:'#6366f1', accent2:'#818cf8', shape:'hex',     particles:['🌌','💫','⭐'], glow:'#4338ca' },
  dragon_heart:    { bg: 'linear-gradient(160deg,#0d0000 0%,#280008 40%,#500018 80%,#880030 100%)', accent:'#f87171', accent2:'#fca5a5', shape:'burst',   particles:['🔥','💥','🐲'], glow:'#dc2626' },
  sun_stone:       { bg: 'linear-gradient(160deg,#1a0e00 0%,#3d2200 40%,#7a4400 80%,#c47000 100%)', accent:'#fbbf24', accent2:'#fef3c7', shape:'burst',   particles:['☀️','✨','🌟'], glow:'#d97706' },
  world_crystal:   { bg: 'linear-gradient(160deg,#001018 0%,#001e30 40%,#003050 80%,#004880 100%)', accent:'#38bdf8', accent2:'#a5f3fc', shape:'crystal', particles:['🌍','💫','✨'], glow:'#0369a1' },
  farm_god:        { bg: 'linear-gradient(160deg,#100e00 0%,#2e2800 40%,#605200 80%,#c4a200 100%)', accent:'#ffd700', accent2:'#fff4a0', shape:'burst',   particles:['🌟','👑','✨','⭐'], glow:'#ca8a04' },
};

const FALLBACK: ArtConfig = {
  bg: 'linear-gradient(160deg,#0f172a 0%,#1e293b 100%)',
  accent: '#94a3b8', accent2: '#64748b', shape: 'circle',
  particles: ['✨'], glow: '#475569',
};

// ── SVG shape generators ──────────────────────────────────────────────────────

function renderShape(shape: ArtConfig['shape'], accent: string, accent2: string) {
  switch (shape) {
    case 'circle':
      return (
        <>
          <circle cx="60" cy="60" r="44" fill="none" stroke={accent} strokeWidth="1.5" strokeOpacity="0.3" />
          <circle cx="60" cy="60" r="32" fill={accent} fillOpacity="0.08" />
          <circle cx="60" cy="60" r="52" fill="none" stroke={accent2} strokeWidth="0.8" strokeOpacity="0.2" />
        </>
      );
    case 'hex':
      return (
        <>
          <polygon points="60,10 103,35 103,85 60,110 17,85 17,35" fill="none" stroke={accent} strokeWidth="1.5" strokeOpacity="0.35" />
          <polygon points="60,22 93,40 93,78 60,96 27,78 27,40" fill={accent} fillOpacity="0.07" />
          <polygon points="60,2 111,32 111,92 60,122 9,92 9,32" fill="none" stroke={accent2} strokeWidth="0.8" strokeOpacity="0.15" />
        </>
      );
    case 'star':
      return (
        <polygon points="60,5 68,40 105,40 75,62 86,99 60,78 34,99 45,62 15,40 52,40"
          fill="none" stroke={accent} strokeWidth="1.5" strokeOpacity="0.3" />
      );
    case 'diamond':
      return (
        <>
          <polygon points="60,8 105,60 60,112 15,60" fill="none" stroke={accent} strokeWidth="1.5" strokeOpacity="0.35" />
          <polygon points="60,22 92,60 60,98 28,60" fill={accent} fillOpacity="0.08" />
          <line x1="60" y1="8" x2="60" y2="112" stroke={accent2} strokeWidth="0.8" strokeOpacity="0.2" />
          <line x1="15" y1="60" x2="105" y2="60" stroke={accent2} strokeWidth="0.8" strokeOpacity="0.2" />
        </>
      );
    case 'burst':
      return (
        <>
          {Array.from({ length: 12 }).map((_, i) => {
            const angle = (i / 12) * 360;
            const rad = (angle * Math.PI) / 180;
            const x1 = 60 + 20 * Math.cos(rad);
            const y1 = 60 + 20 * Math.sin(rad);
            const x2 = 60 + 50 * Math.cos(rad);
            const y2 = 60 + 50 * Math.sin(rad);
            return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={accent} strokeWidth="1" strokeOpacity={i % 2 === 0 ? 0.5 : 0.2} />;
          })}
          <circle cx="60" cy="60" r="18" fill={accent} fillOpacity="0.12" />
          <circle cx="60" cy="60" r="10" fill={accent} fillOpacity="0.2" />
        </>
      );
    case 'wave':
      return (
        <>
          <path d="M10,40 Q35,20 60,40 Q85,60 110,40" fill="none" stroke={accent} strokeWidth="1.5" strokeOpacity="0.35" />
          <path d="M10,55 Q35,35 60,55 Q85,75 110,55" fill="none" stroke={accent} strokeWidth="1.5" strokeOpacity="0.25" />
          <path d="M10,70 Q35,50 60,70 Q85,90 110,70" fill="none" stroke={accent2} strokeWidth="1" strokeOpacity="0.2" />
          <ellipse cx="60" cy="60" rx="40" ry="20" fill={accent} fillOpacity="0.06" />
        </>
      );
    case 'crystal':
      return (
        <>
          <polygon points="60,5 80,45 60,115 40,45" fill="none" stroke={accent} strokeWidth="1.5" strokeOpacity="0.4" />
          <polygon points="60,5 80,45 60,65 40,45" fill={accent} fillOpacity="0.15" />
          <polygon points="60,5 80,45 100,60 60,65 20,60 40,45" fill="none" stroke={accent2} strokeWidth="0.8" strokeOpacity="0.2" />
          <line x1="60" y1="5" x2="60" y2="115" stroke={accent} strokeWidth="0.8" strokeOpacity="0.15" />
        </>
      );
    default:
      return null;
  }
}

// ── Main component ────────────────────────────────────────────────────────────

interface NftArtworkProps {
  nftType: string;
  emoji: string;
  rarity: string;
  size?: 'card' | 'large';
  animated?: boolean;
}

export function NftArtwork({ nftType, emoji, rarity, size = 'card', animated = false }: NftArtworkProps) {
  const art = ART[nftType] ?? FALLBACK;
  const isLarge = size === 'large';
  const isLegendary = rarity === 'legendary';
  const isEpic = rarity === 'epic';
  const isSpecial = rarity === 'special';
  const isRare = rarity === 'rare';

  const h = isLarge ? 160 : 100;
  const emojiSize = isLarge ? 'text-6xl' : 'text-4xl';

  return (
    <div
      className="relative w-full overflow-hidden flex-shrink-0"
      style={{
        height: h,
        background: art.bg,
        borderRadius: isLarge ? '16px 16px 0 0' : 12,
      }}
    >
      {/* SVG layer */}
      <svg
        viewBox="0 0 120 120"
        width="100%"
        height="100%"
        className="absolute inset-0"
        style={{ opacity: 0.85 }}
      >
        <defs>
          <radialGradient id={`glow-${nftType}`} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={art.glow} stopOpacity="0.35" />
            <stop offset="100%" stopColor={art.glow} stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Glow center */}
        <ellipse cx="60" cy="60" rx="50" ry="50" fill={`url(#glow-${nftType})`} />

        {/* Shape */}
        {renderShape(art.shape, art.accent, art.accent2)}

        {/* Corner dots */}
        {[
          [8, 8], [112, 8], [8, 112], [112, 112]
        ].map(([cx, cy], i) => (
          <circle key={i} cx={cx} cy={cy} r="2" fill={art.accent} fillOpacity="0.35" />
        ))}

        {/* Scanline texture for rarity */}
        {(isRare || isEpic || isSpecial || isLegendary) && (
          <>
            {Array.from({ length: 8 }).map((_, i) => (
              <line key={i}
                x1="0" y1={i * 16}
                x2="120" y2={i * 16}
                stroke={art.accent}
                strokeWidth="0.5"
                strokeOpacity="0.06"
              />
            ))}
          </>
        )}
      </svg>

      {/* Particle decorations */}
      {art.particles.slice(0, isLarge ? 4 : 2).map((p, i) => {
        const positions = [
          { top: '6px', left: '8px' },
          { top: '8px', right: '10px' },
          { bottom: '10px', left: '6px' },
          { bottom: '8px', right: '8px' },
        ];
        const pos = positions[i] ?? { top: '10%', left: '10%' };
        return (
          <span
            key={i}
            className="absolute text-[10px] select-none pointer-events-none"
            style={{
              ...pos,
              opacity: 0.6,
              filter: 'drop-shadow(0 0 3px ' + art.glow + ')',
              animation: animated && (isLegendary || isEpic || isSpecial)
                ? `nftParticleFloat ${1.5 + i * 0.4}s ease-in-out infinite`
                : undefined,
            }}
          >
            {p}
          </span>
        );
      })}

      {/* Emoji centered */}
      <div
        className={`absolute inset-0 flex items-center justify-center ${emojiSize} select-none`}
        style={{
          filter: `drop-shadow(0 0 ${isLegendary ? 14 : isEpic ? 12 : isSpecial ? 10 : isRare ? 8 : 4}px ${art.glow})`,
          animation: animated && isLegendary
            ? 'nftLegendaryFloat 3s ease-in-out infinite'
            : animated && (isEpic || isSpecial)
            ? 'nftLegendaryFloat 3.5s ease-in-out infinite'
            : animated && isRare
            ? 'nftRareFloat 4s ease-in-out infinite'
            : undefined,
        }}
      >
        {emoji}
      </div>

      {/* Top shimmer line */}
      <div
        className="absolute top-0 inset-x-0 h-px"
        style={{ background: `linear-gradient(90deg, transparent, ${art.accent}, transparent)`, opacity: 0.7 }}
      />

      {/* Bottom shimmer line */}
      <div
        className="absolute bottom-0 inset-x-0 h-px"
        style={{ background: `linear-gradient(90deg, transparent, ${art.accent2}, transparent)`, opacity: 0.4 }}
      />

      {/* Legendary/Epic/Special overlay shimmer */}
      {(isLegendary || isEpic || isSpecial) && (
        <div
          className="absolute inset-0 pointer-events-none nft-shimmer-overlay"
          style={{
            background: `linear-gradient(135deg, transparent 40%, ${art.accent}18 50%, transparent 60%)`,
            backgroundSize: '200% 200%',
          }}
        />
      )}
    </div>
  );
}
