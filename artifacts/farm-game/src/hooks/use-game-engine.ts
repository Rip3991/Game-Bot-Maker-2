import { useState, useEffect, useCallback, useRef } from 'react';

export type SectionCategory = 'farm' | 'animal';

export interface SectionConfig {
  id: string;
  emoji: string;
  name: string;
  category: SectionCategory;
  unlockCost: number;
  unitCost: number;
  baseRate: number;
  sellPrice: number;
  maxUnits: number;
  description: string;
  scene: string[];
  harvestMinutes: number; // how many minutes to fill a plot (at count=1, level=1)
}

export const SECTIONS: SectionConfig[] = [
  // ——— TARLALAR (FARMS) ———
  // harvestMinutes is PER-UNIT at level=1 (fill rate no longer depends on count).
  // income/min per section = growCount × sellPrice / harvestMinutes × lMult
  // unitCost doubled from the original balance (2026-07-10, operator request:
  // tighten the economy so unit purchases aren't too cheap).
  // 2026-07-10 (later same day): unlockCost/unitCost from onion→blueberry
  // re-leveled onto a consistent geometric curve (~4.3x/step for unlockCost,
  // ~3.6x/step for unitCost) — previous values had irregular jumps (e.g.
  // tomato→strawberry was 5.6x while strawberry→sunflower was only 2.9x),
  // making some "Bahçe" tiers unlock too easily relative to neighbors.
  {
    id: 'wheat', emoji: '🌾', name: 'Buğday Tarlası', category: 'farm',
    unlockCost: 0, unitCost: 40, baseRate: 10, sellPrice: 2, maxUnits: 20,
    description: 'Başlangıç çiftliğin', scene: ['🌳', '🌲'],
    harvestMinutes: 0.5,
  },
  {
    id: 'onion', emoji: '🧅', name: 'Soğan Tarlası', category: 'farm',
    unlockCost: 150, unitCost: 100, baseRate: 12, sellPrice: 3, maxUnits: 20,
    description: 'Tatlı soğan tarlası', scene: ['🌿', '🌱'],
    harvestMinutes: 0.5,
  },
  {
    id: 'corn', emoji: '🌽', name: 'Mısır Tarlası', category: 'farm',
    unlockCost: 650, unitCost: 360, baseRate: 19, sellPrice: 7, maxUnits: 20,
    description: 'Altın mısır başakları', scene: ['🌻', '🌿'],
    harvestMinutes: 0.75,
  },
  {
    id: 'carrot', emoji: '🥕', name: 'Havuç Tarlası', category: 'farm',
    unlockCost: 2800, unitCost: 1300, baseRate: 20, sellPrice: 10, maxUnits: 20,
    description: 'Taze turuncu havuçlar', scene: ['🌿', '🌱'],
    harvestMinutes: 1,
  },
  {
    id: 'tomato', emoji: '🍅', name: 'Domates Bahçesi', category: 'farm',
    unlockCost: 12000, unitCost: 4700, baseRate: 33, sellPrice: 25, maxUnits: 15,
    description: 'Taze kırmızı domatesler', scene: ['🌿', '🪴'],
    harvestMinutes: 1.5,
  },
  {
    id: 'strawberry', emoji: '🍓', name: 'Çilek Bahçesi', category: 'farm',
    unlockCost: 52000, unitCost: 17000, baseRate: 65, sellPrice: 65, maxUnits: 15,
    description: 'Tatlı kırmızı çilekler', scene: ['🌸', '🌿'],
    harvestMinutes: 2,
  },
  {
    id: 'sunflower', emoji: '🌻', name: 'Ayçiçeği Tarlası', category: 'farm',
    unlockCost: 224000, unitCost: 61000, baseRate: 100, sellPrice: 125, maxUnits: 12,
    description: 'Yağlık ayçiçeği tarlası', scene: ['☀️', '🌿'],
    harvestMinutes: 2.5,
  },
  {
    id: 'grape', emoji: '🍇', name: 'Üzüm Bağı', category: 'farm',
    unlockCost: 960000, unitCost: 220000, baseRate: 163, sellPrice: 325, maxUnits: 12,
    description: 'Verimli üzüm asmaları', scene: ['🍂', '🌿'],
    harvestMinutes: 4,
  },
  {
    id: 'apple', emoji: '🍎', name: 'Elma Bahçesi', category: 'farm',
    unlockCost: 4100000, unitCost: 790000, baseRate: 250, sellPrice: 750, maxUnits: 10,
    description: 'Taze kırmızı elmalar', scene: ['🌳', '🌿'],
    harvestMinutes: 6,
  },
  {
    id: 'blueberry', emoji: '🫐', name: 'Yaban Mersini', category: 'farm',
    unlockCost: 17600000, unitCost: 2850000, baseRate: 400, sellPrice: 2000, maxUnits: 8,
    description: 'Antioksidan yaban mersini', scene: ['🌿', '🌳'],
    harvestMinutes: 10,
  },
  // ——— HAYVANLAR (ANIMALS) ———
  {
    id: 'chicken', emoji: '🐔', name: 'Tavuk Kümesi', category: 'animal',
    unlockCost: 350, unitCost: 120, baseRate: 13, sellPrice: 4, maxUnits: 20,
    description: 'Yumurta ve et üretimi', scene: ['🏚️', '🌾'],
    harvestMinutes: 0.6,
  },
  {
    id: 'cow', emoji: '🐄', name: 'İnek Ahırı', category: 'animal',
    unlockCost: 2500, unitCost: 1200, baseRate: 23, sellPrice: 14, maxUnits: 15,
    description: 'Süt ve et üretimi', scene: ['🏠', '🌿'],
    harvestMinutes: 1.2,
  },
  {
    id: 'sheep', emoji: '🐑', name: 'Koyun Ağılı', category: 'animal',
    unlockCost: 14000, unitCost: 6000, baseRate: 40, sellPrice: 40, maxUnits: 15,
    description: 'Yün ve süt üretimi', scene: ['⛰️', '🌿'],
    harvestMinutes: 2,
  },
  {
    id: 'pig', emoji: '🐷', name: 'Domuz Çiftliği', category: 'animal',
    unlockCost: 55000, unitCost: 24000, baseRate: 66, sellPrice: 82, maxUnits: 12,
    description: 'Et ve şarküteri ürünleri', scene: ['🏡', '🌱'],
    harvestMinutes: 2.5,
  },
  {
    id: 'horse', emoji: '🐴', name: 'At Ahırı', category: 'animal',
    unlockCost: 200000, unitCost: 80000, baseRate: 110, sellPrice: 275, maxUnits: 10,
    description: 'Prestijli at yetiştiriciliği', scene: ['🏟️', '🌿'],
    harvestMinutes: 5,
  },
  {
    id: 'rabbit', emoji: '🐰', name: 'Tavşan Çiftliği', category: 'animal',
    unlockCost: 700000, unitCost: 260000, baseRate: 200, sellPrice: 300, maxUnits: 20,
    description: 'Hızlı üreyen tavşanlar', scene: ['🌸', '🌿'],
    harvestMinutes: 3,
  },
  {
    id: 'duck', emoji: '🦆', name: 'Ördek Göleti', category: 'animal',
    unlockCost: 2500000, unitCost: 900000, baseRate: 350, sellPrice: 1050, maxUnits: 15,
    description: 'Gölet kenarında ördekler', scene: ['💧', '🌊'],
    harvestMinutes: 6,
  },
  {
    id: 'goat', emoji: '🐐', name: 'Keçi Çiftliği', category: 'animal',
    unlockCost: 9000000, unitCost: 3000000, baseRate: 600, sellPrice: 3000, maxUnits: 12,
    description: 'Peynir ve süt üretimi', scene: ['⛰️', '🌿'],
    harvestMinutes: 10,
  },
  {
    id: 'turkey', emoji: '🦃', name: 'Hindi Çiftliği', category: 'animal',
    unlockCost: 30000000, unitCost: 10000000, baseRate: 1000, sellPrice: 9000, maxUnits: 10,
    description: 'Premium hindi yetiştiriciliği', scene: ['🌳', '🍂'],
    harvestMinutes: 18,
  },
  {
    id: 'bee', emoji: '🐝', name: 'Arı Kovanı', category: 'animal',
    unlockCost: 100000000, unitCost: 30000000, baseRate: 1833, sellPrice: 11000, maxUnits: 20,
    description: 'Organik bal üretimi', scene: ['🌸', '🌼'],
    harvestMinutes: 12,
  },
  // ——— ÜST TİER HAYVANLAR ———
  {
    id: 'alpaca', emoji: '🦙', name: 'Alpaka Çiftliği', category: 'animal',
    unlockCost: 350000000, unitCost: 100000000, baseRate: 3200, sellPrice: 24000, maxUnits: 10,
    description: 'Lüks alpaka yünü üretimi', scene: ['⛰️', '🌿'],
    harvestMinutes: 15,
  },
  {
    id: 'deer', emoji: '🦌', name: 'Geyik Rezervi', category: 'animal',
    unlockCost: 1200000000, unitCost: 360000000, baseRate: 5833, sellPrice: 87500, maxUnits: 8,
    description: 'Nadir geyik yetiştiriciliği', scene: ['🌲', '🌿'],
    harvestMinutes: 30,
  },
  {
    id: 'peacock', emoji: '🦚', name: 'Tavus Kuşu Bahçesi', category: 'animal',
    unlockCost: 4000000000, unitCost: 1200000000, baseRate: 10500, sellPrice: 315000, maxUnits: 6,
    description: 'Efsanevi tavus kuşları', scene: ['🌸', '🌺'],
    harvestMinutes: 60,
  },
];

export type SectionId = typeof SECTIONS[number]['id'];

// ── Special items (rare harvest drops, tradeable) ─────────────────────────────

export type SpecialRarity = 'uncommon' | 'rare' | 'epic';

export interface SpecialItemConfig {
  id: string;
  emoji: string;
  name: string;
  rarity: SpecialRarity;
  sellPrice: number;
}

export const SPECIAL_ITEMS: SpecialItemConfig[] = [
  { id: 'goldenEgg', emoji: '🥚', name: 'Altın Yumurta', rarity: 'uncommon', sellPrice: 250 },
  { id: 'luckyClover', emoji: '🍀', name: 'Şanslı Yonca', rarity: 'uncommon', sellPrice: 325 },
  { id: 'silverHorseshoe', emoji: '🧲', name: 'Gümüş Nal', rarity: 'rare', sellPrice: 1100 },
  { id: 'crystalHoney', emoji: '💎', name: 'Kristal Bal', rarity: 'rare', sellPrice: 1500 },
  { id: 'dragonFruit', emoji: '🐉', name: 'Ejder Meyvesi', rarity: 'epic', sellPrice: 6000 },
  { id: 'phoenixFeather', emoji: '🪶', name: 'Anka Tüyü', rarity: 'epic', sellPrice: 9000 },
];

/** Chance (0-1) that a harvest drops a special item. */
export const SPECIAL_DROP_CHANCE = 0.08;

function rollSpecialDrop(): SpecialItemConfig | null {
  if (Math.random() >= SPECIAL_DROP_CHANCE) return null;
  const weights = SPECIAL_ITEMS.map(item =>
    item.rarity === 'uncommon' ? 60 : item.rarity === 'rare' ? 30 : 10
  );
  const total = weights.reduce((a, b) => a + b, 0);
  let roll = Math.random() * total;
  for (let i = 0; i < SPECIAL_ITEMS.length; i++) {
    roll -= weights[i];
    if (roll <= 0) return SPECIAL_ITEMS[i];
  }
  return SPECIAL_ITEMS[SPECIAL_ITEMS.length - 1];
}

export interface SectionState {
  unlocked: boolean;
  count: number;
  needsReplant: boolean;
  /** Unit count snapshotted at the start of the current growth cycle (on
   *  unlock/replant). Harvest yield and XP use this, not the live `count`,
   *  so buying units mid-cycle can't grant a bonus on the harvest already
   *  in progress — the extra units only count starting next cycle. */
  growCount: number;
}

export interface SaleRecord {
  id: string;
  emoji: string;
  name: string;
  qty: number;
  unitPrice: number;
  total: number;
}

// ── Level thresholds (total XP needed to reach each level) ───────────────────
export const LEVEL_THRESHOLDS = [0, 60, 200, 500, 1100, 2500, 5500, 12000, 25000, 50000, 100000];
export const MAX_LEVEL = LEVEL_THRESHOLDS.length;

export function computeLevel(xp: number): number {
  let level = 1;
  for (let i = 1; i < LEVEL_THRESHOLDS.length; i++) {
    if (xp >= LEVEL_THRESHOLDS[i]) level = i + 1;
    else break;
  }
  return Math.min(level, MAX_LEVEL);
}

export function levelMultiplier(level: number): number {
  return 1 + (level - 1) * 0.12; // +12% production per level
}

export function xpToNextLevel(xp: number): { current: number; needed: number; level: number } {
  const level = computeLevel(xp);
  if (level >= MAX_LEVEL) return { current: xp, needed: xp, level };
  const base = LEVEL_THRESHOLDS[level - 1];
  const next = LEVEL_THRESHOLDS[level];
  return { current: xp - base, needed: next - base, level };
}

/** Replant/"Ek" fee — paid in real TL (from withdrawable balance), not Coins.
 *  Operator request 2026-07-10: cost is simply 1 TL per owned unit, so a
 *  5-unit plot costs 5 TL to replant. */
export function replantCost(cfg: SectionConfig, count: number): number {
  return Math.max(1, Math.round(count));
}

/** How many units' cycle time counts toward slowing down a plot. Base
 *  harvestMinutes values assume this multiplier is applied on top, and the
 *  cycle further scales with unit count^HARVEST_COUNT_EXPONENT — more units
 *  planted take noticeably longer to tend (operator request 2026-07-10:
 *  previous sqrt scaling made the wait barely grow with count). Any UI
 *  displaying cycle time or income/min MUST use this helper instead of raw
 *  `cfg.harvestMinutes`, or the numbers shown will disagree with the actual
 *  fill rate in the tick effect below. */
export const HARVEST_TIME_MULTIPLIER = 4;
export const HARVEST_COUNT_EXPONENT = 0.7;

export function getEffectiveHarvestMinutes(cfg: SectionConfig, count: number): number {
  return cfg.harvestMinutes * HARVEST_TIME_MULTIPLIER * Math.pow(Math.max(1, count), HARVEST_COUNT_EXPONENT);
}

export interface GameState {
  balance: number;
  coins: number;
  sections: Record<string, SectionState>;
  storage: Record<string, number>;
  specialStorage: Record<string, number>;
  plotFill: Record<string, number>; // 0.0 → 1.0 fill progress per section
  level: number;
  xp: number;
  lastSaved: number;
  welcomeBonusClaimed: boolean;
}

const defaultSection = (cfg: SectionConfig): SectionState => ({
  unlocked: cfg.unlockCost === 0,
  count: cfg.unlockCost === 0 ? 1 : 0,
  needsReplant: false,
  growCount: cfg.unlockCost === 0 ? 1 : 0,
});

/** The section (if any) that must be unlocked before `id` can be unlocked —
 *  the previous entry in SECTIONS within the same category. Farms and
 *  animals each have their own independent unlock order. */
export function prevSectionInOrder(id: string): SectionConfig | null {
  const cfg = SECTIONS.find(s => s.id === id);
  if (!cfg) return null;
  const sameCategory = SECTIONS.filter(s => s.category === cfg.category);
  const idx = sameCategory.findIndex(s => s.id === id);
  return idx > 0 ? sameCategory[idx - 1] : null;
}

/** Whether `id` is unlockable right now given unlock order — true if it has
 *  no predecessor in its category, or its predecessor is already unlocked. */
export function isNextInUnlockOrder(sections: Record<string, SectionState>, id: string): boolean {
  const prev = prevSectionInOrder(id);
  if (!prev) return true;
  return sections[prev.id]?.unlocked ?? false;
}

export const makeInitialState = (): GameState => ({
  balance: 0,
  coins: 0,
  sections: Object.fromEntries(SECTIONS.map(cfg => [cfg.id, defaultSection(cfg)])),
  storage: Object.fromEntries(SECTIONS.map(cfg => [cfg.id, 0])),
  specialStorage: Object.fromEntries(SPECIAL_ITEMS.map(item => [item.id, 0])),
  plotFill: Object.fromEntries(SECTIONS.map(cfg => [cfg.id, 0])),
  level: 1,
  xp: 0,
  lastSaved: Date.now(),
  welcomeBonusClaimed: false,
});

const SAVE_KEY = 'farmGameState_v8';
const AUTO_SELL_KEY = 'farmAutoSell_v1';
export const AUTO_SELL_PURCHASED_KEY = 'farmAutoSellPurchased_v1';
export const WELCOME_BONUS = 75;

export function useGameEngine({ isNewUser = false }: { isNewUser?: boolean } = {}) {
  const [autoSellPurchased, setAutoSellPurchased] = useState<boolean>(() => {
    try { return localStorage.getItem(AUTO_SELL_PURCHASED_KEY) === 'true'; } catch { return false; }
  });

  const [autoSell, setAutoSell] = useState<boolean>(() => {
    const purchased = (() => { try { return localStorage.getItem(AUTO_SELL_PURCHASED_KEY) === 'true'; } catch { return false; } })();
    if (!purchased) return false;
    try { return localStorage.getItem(AUTO_SELL_KEY) === 'true'; } catch { return false; }
  });

  const unlockAutoSell = useCallback(() => {
    try { localStorage.setItem(AUTO_SELL_PURCHASED_KEY, 'true'); } catch { /* */ }
    setAutoSellPurchased(true);
    setAutoSell(true);
    try { localStorage.setItem(AUTO_SELL_KEY, 'true'); } catch { /* */ }
  }, []);

  const toggleAutoSell = useCallback(() => {
    setAutoSell(prev => {
      const next = !prev;
      try { localStorage.setItem(AUTO_SELL_KEY, String(next)); } catch { /* */ }
      return next;
    });
  }, []);

  const [state, setState] = useState<GameState>(() => {
    try {
      // Try to migrate from older saves (v8 added `coins`, v7 was TL-only)
      const saved = localStorage.getItem(SAVE_KEY) ?? localStorage.getItem('farmGameState_v7') ?? localStorage.getItem('farmGameState_v6');
      if (saved) {
        const parsed = JSON.parse(saved) as Partial<GameState>;

        const sections: Record<string, SectionState> = {
          ...Object.fromEntries(SECTIONS.map(cfg => [cfg.id, defaultSection(cfg)])),
          ...(parsed.sections ?? {}),
        };
        // Ensure needsReplant exists on all sections (migration from v6)
        SECTIONS.forEach(cfg => {
          if (!(sections[cfg.id] as any).needsReplant) {
            sections[cfg.id] = { ...sections[cfg.id], needsReplant: false };
          }
        });
        // growCount always mirrors the live count now (operator request
        // 2026-07-10: harvest pays out however many units you currently own,
        // not a cycle-start snapshot) — force-sync on every load so saves
        // from before this change pick up the new behavior immediately,
        // instead of waiting for the next buy/replant to resync.
        SECTIONS.forEach(cfg => {
          if (sections[cfg.id].growCount !== sections[cfg.id].count) {
            sections[cfg.id] = { ...sections[cfg.id], growCount: sections[cfg.id].count };
          }
        });

        const storage: Record<string, number> = {
          ...Object.fromEntries(SECTIONS.map(cfg => [cfg.id, 0])),
          ...(parsed.storage ?? {}),
        };

        const specialStorage: Record<string, number> = {
          ...Object.fromEntries(SPECIAL_ITEMS.map(item => [item.id, 0])),
          ...(parsed.specialStorage ?? {}),
        };

        const plotFill: Record<string, number> = {
          ...Object.fromEntries(SECTIONS.map(cfg => [cfg.id, 0])),
          ...(parsed.plotFill ?? {}),
        };

        const level = parsed.level ?? 1;
        const xp = parsed.xp ?? 0;

        return {
          balance: parsed.balance ?? 0,
          coins: parsed.coins ?? 0,
          sections,
          storage,
          specialStorage,
          plotFill,
          level,
          xp,
          lastSaved: Date.now(),
          welcomeBonusClaimed: parsed.welcomeBonusClaimed ?? false,
        };
      }
    } catch (e) {
      console.error('Failed to load save', e);
    }
    return makeInitialState();
  });

  const stateRef = useRef(state);
  stateRef.current = state;

  const [showWelcomeBonus, setShowWelcomeBonus] = useState(false);
  useEffect(() => {
    if (!isNewUser) return;
    setState(prev => {
      if (prev.welcomeBonusClaimed) return prev;
      return { ...prev, balance: prev.balance + WELCOME_BONUS, welcomeBonusClaimed: true };
    });
    const wasAlreadyClaimed = stateRef.current.welcomeBonusClaimed;
    if (!wasAlreadyClaimed) {
      setShowWelcomeBonus(true);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isNewUser]);

  // ── Real-time plot fill accumulation (20 ticks/sec) ──────────────────────
  useEffect(() => {
    let lastTime = Date.now();
    const interval = setInterval(() => {
      const now = Date.now();
      const deltaSec = (now - lastTime) / 1000;
      lastTime = now;
      const current = stateRef.current;
      const lMult = levelMultiplier(current.level);

      let hasChange = false;
      const fillUpdates: Record<string, number> = {};

      SECTIONS.forEach(cfg => {
        const s = current.sections[cfg.id];
        if (!s?.unlocked || s.count === 0) return;
        if (s.needsReplant) return;
        const fill = current.plotFill[cfg.id] ?? 0;
        if (fill >= 1.0) return; // already full, wait for harvest tap
        // Growth time scales with unit count — see getEffectiveHarvestMinutes.
        const effectiveMinutes = getEffectiveHarvestMinutes(cfg, s.count);
        const fillRatePerSec = lMult / (effectiveMinutes * 60);
        const newFill = Math.min(fill + fillRatePerSec * deltaSec, 1.0);
        if (Math.abs(newFill - fill) > 0.000001) {
          fillUpdates[cfg.id] = newFill;
          hasChange = true;
        }
      });

      if (hasChange) {
        setState(prev => ({
          ...prev,
          plotFill: { ...prev.plotFill, ...fillUpdates },
        }));
      }
    }, 50);
    return () => clearInterval(interval);
  }, []);

  // Auto-save every 2 sec
  useEffect(() => {
    const interval = setInterval(() => {
      localStorage.setItem(SAVE_KEY, JSON.stringify({ ...stateRef.current, lastSaved: Date.now() }));
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  // Auto-sell depo every 30 sec when enabled
  const autoSellRef = useRef(autoSell);
  autoSellRef.current = autoSell;
  useEffect(() => {
    const interval = setInterval(() => {
      if (!autoSellRef.current) return;
      const current = stateRef.current;
      const hasProducts = SECTIONS.some(cfg => Math.floor(current.storage[cfg.id] ?? 0) > 0);
      if (!hasProducts) return;
      setState(prev => {
        const newStorage = { ...prev.storage };
        let totalEarned = 0;
        SECTIONS.forEach(cfg => {
          const amt = Math.floor(prev.storage[cfg.id] ?? 0);
          if (amt > 0) {
            totalEarned += amt * cfg.sellPrice;
            newStorage[cfg.id] = (prev.storage[cfg.id] ?? 0) - amt;
          }
        });
        if (totalEarned === 0) return prev;
        return { ...prev, coins: prev.coins + totalEarned, storage: newStorage };
      });
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  // ── Actions ──────────────────────────────────────────────────────────────

  // Unlock/buy are paid in Coins (in-game currency). Replant ("Ek"/"Büyüt")
  // is the one exception — paid in real TL balance at 1 TL/unit (operator
  // request 2026-07-10), so upkeep draws directly on withdrawable balance.
  const unlockSection = useCallback((id: string) => {
    const cfg = SECTIONS.find(s => s.id === id)!;
    setState(prev => {
      if (prev.coins < cfg.unlockCost) return prev;
      if (prev.sections[id]?.unlocked) return prev;
      if (!isNextInUnlockOrder(prev.sections, id)) return prev; // must unlock in order
      return {
        ...prev,
        coins: prev.coins - cfg.unlockCost,
        sections: {
          ...prev.sections,
          [id]: { unlocked: true, count: 1, needsReplant: false, growCount: 1 },
        },
      };
    });
  }, []);

  const buyUnit = useCallback((id: string) => {
    const cfg = SECTIONS.find(s => s.id === id)!;
    setState(prev => {
      const sec = prev.sections[id];
      if (!sec?.unlocked) return prev;
      if (sec.count >= cfg.maxUnits) return prev;
      if (prev.coins < cfg.unitCost) return prev;
      const newCount = sec.count + 1;
      // growCount now always mirrors the live count (operator request
      // 2026-07-10: harvest should pay out however many units you currently
      // own, including ones bought mid-cycle) — kept as a separate field for
      // save-format compatibility, but no longer snapshotted/locked.
      return {
        ...prev,
        coins: prev.coins - cfg.unitCost,
        sections: {
          ...prev.sections,
          [id]: { ...sec, count: newCount, growCount: newCount },
        },
      };
    });
  }, []);

  /** Tap to harvest: move yield to depo, mark needsReplant, gain XP */
  const harvestPlot = useCallback((id: string) => {
    const cfg = SECTIONS.find(s => s.id === id)!;
    setState(prev => {
      const sec = prev.sections[id];
      if (!sec?.unlocked || sec.count === 0) return prev;
      if (sec.needsReplant) return prev;
      const fill = prev.plotFill[id] ?? 0;
      if (fill < 1.0) return prev;

      // Yield = units that were planted at the start of THIS growth cycle
      // (growCount), not the live count — any units bought mid-cycle only
      // pay off starting next cycle. Selling count items at sellPrice each
      // gives total = growCount × sellPrice coins.
      const yieldItems = sec.growCount;
      const xpGain = Math.ceil(yieldItems * cfg.harvestMinutes);
      const newXp = prev.xp + xpGain;
      const newLevel = computeLevel(newXp);

      const drop = rollSpecialDrop();
      const specialStorage = drop
        ? { ...prev.specialStorage, [drop.id]: (prev.specialStorage[drop.id] ?? 0) + 1 }
        : prev.specialStorage;

      return {
        ...prev,
        storage: { ...prev.storage, [id]: (prev.storage[id] ?? 0) + yieldItems },
        specialStorage,
        plotFill: { ...prev.plotFill, [id]: 0 },
        sections: { ...prev.sections, [id]: { ...sec, needsReplant: true } },
        xp: newXp,
        level: newLevel,
      };
    });
  }, []);

  /** Pay replant cost (in TL, from the real-money balance — operator
   *  request 2026-07-10) to restart growth cycle */
  const replantPlot = useCallback((id: string) => {
    const cfg = SECTIONS.find(s => s.id === id)!;
    setState(prev => {
      const sec = prev.sections[id];
      if (!sec?.unlocked || !sec.needsReplant) return prev;
      const cost = replantCost(cfg, sec.count);
      if (prev.balance < cost) return prev;
      return {
        ...prev,
        balance: prev.balance - cost,
        // growCount already mirrors the live count (kept in sync on buy).
        sections: { ...prev.sections, [id]: { ...sec, needsReplant: false, growCount: sec.count } },
        plotFill: { ...prev.plotFill, [id]: 0 },
      };
    });
  }, []);

  const sellProducts = useCallback((): SaleRecord[] => {
    const records: SaleRecord[] = [];
    setState(prev => {
      const newStorage = { ...prev.storage };
      let totalEarned = 0;

      SECTIONS.forEach(cfg => {
        const amt = Math.floor(prev.storage[cfg.id] ?? 0);
        if (amt > 0) {
          const total = amt * cfg.sellPrice;
          totalEarned += total;
          records.push({ id: cfg.id, emoji: cfg.emoji, name: cfg.name, qty: amt, unitPrice: cfg.sellPrice, total });
          newStorage[cfg.id] = (prev.storage[cfg.id] ?? 0) - amt;
        }
      });

      if (records.length === 0) return prev;
      return { ...prev, coins: prev.coins + totalEarned, storage: newStorage };
    });
    return records;
  }, []);

  /** Optimistically apply a Coin → TL conversion (call after the server confirms it). */
  const applyCoinConversion = useCallback((coinsSpent: number, tlReceived: number) => {
    setState(prev => ({
      ...prev,
      coins: Math.max(0, prev.coins - coinsSpent),
      balance: prev.balance + tlReceived,
    }));
  }, []);

  const incomePerMin = SECTIONS.reduce((sum, cfg) => {
    const s = state.sections[cfg.id];
    // Cycle time scales with sqrt(count) (see plot-fill tick effect above),
    // so the per-minute estimate must use the same effective minutes.
    if (s?.unlocked && s.count > 0 && !s.needsReplant) {
      const effectiveMinutes = getEffectiveHarvestMinutes(cfg, s.count);
      return sum + Math.round(s.growCount * cfg.sellPrice / effectiveMinutes * levelMultiplier(state.level));
    }
    return sum;
  }, 0);

  const setBalance = useCallback((amount: number) => {
    setState(prev => ({ ...prev, balance: amount }));
  }, []);

  const setCoins = useCallback((amount: number) => {
    setState(prev => ({ ...prev, coins: amount }));
  }, []);

  return {
    state,
    unlockSection,
    buyUnit,
    harvestPlot,
    replantPlot,
    sellProducts,
    incomePerMin,
    showWelcomeBonus,
    setShowWelcomeBonus,
    setBalance,
    setCoins,
    applyCoinConversion,
    autoSell,
    toggleAutoSell,
    autoSellPurchased,
    unlockAutoSell,
  };
}
