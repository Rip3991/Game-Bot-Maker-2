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
  // harvestMinutes is PER-UNIT: fill time = harvestMinutes × count ÷ lMult (minutes)
  // income/min per section (any count) = sellPrice / harvestMinutes × lMult
  {
    id: 'wheat', emoji: '🌾', name: 'Buğday Tarlası', category: 'farm',
    unlockCost: 0, unitCost: 20, baseRate: 10, sellPrice: 2, maxUnits: 20,
    description: 'Başlangıç çiftliğin', scene: ['🌳', '🌲'],
    harvestMinutes: 0.5,
  },
  {
    id: 'onion', emoji: '🧅', name: 'Soğan Tarlası', category: 'farm',
    unlockCost: 130, unitCost: 50, baseRate: 12, sellPrice: 3, maxUnits: 20,
    description: 'Tatlı soğan tarlası', scene: ['🌿', '🌱'],
    harvestMinutes: 0.5,
  },
  {
    id: 'corn', emoji: '🌽', name: 'Mısır Tarlası', category: 'farm',
    unlockCost: 500, unitCost: 130, baseRate: 19, sellPrice: 7, maxUnits: 20,
    description: 'Altın mısır başakları', scene: ['🌻', '🌿'],
    harvestMinutes: 0.75,
  },
  {
    id: 'carrot', emoji: '🥕', name: 'Havuç Tarlası', category: 'farm',
    unlockCost: 2000, unitCost: 450, baseRate: 20, sellPrice: 10, maxUnits: 20,
    description: 'Taze turuncu havuçlar', scene: ['🌿', '🌱'],
    harvestMinutes: 1,
  },
  {
    id: 'tomato', emoji: '🍅', name: 'Domates Bahçesi', category: 'farm',
    unlockCost: 8000, unitCost: 1600, baseRate: 33, sellPrice: 25, maxUnits: 15,
    description: 'Taze kırmızı domatesler', scene: ['🌿', '🪴'],
    harvestMinutes: 1.5,
  },
  {
    id: 'strawberry', emoji: '🍓', name: 'Çilek Bahçesi', category: 'farm',
    unlockCost: 45000, unitCost: 8000, baseRate: 65, sellPrice: 65, maxUnits: 15,
    description: 'Tatlı kırmızı çilekler', scene: ['🌸', '🌿'],
    harvestMinutes: 2,
  },
  {
    id: 'sunflower', emoji: '🌻', name: 'Ayçiçeği Tarlası', category: 'farm',
    unlockCost: 130000, unitCost: 25000, baseRate: 100, sellPrice: 125, maxUnits: 12,
    description: 'Yağlık ayçiçeği tarlası', scene: ['☀️', '🌿'],
    harvestMinutes: 2.5,
  },
  {
    id: 'grape', emoji: '🍇', name: 'Üzüm Bağı', category: 'farm',
    unlockCost: 420000, unitCost: 80000, baseRate: 163, sellPrice: 325, maxUnits: 12,
    description: 'Verimli üzüm asmaları', scene: ['🍂', '🌿'],
    harvestMinutes: 4,
  },
  {
    id: 'apple', emoji: '🍎', name: 'Elma Bahçesi', category: 'farm',
    unlockCost: 1600000, unitCost: 280000, baseRate: 250, sellPrice: 750, maxUnits: 10,
    description: 'Taze kırmızı elmalar', scene: ['🌳', '🌿'],
    harvestMinutes: 6,
  },
  {
    id: 'blueberry', emoji: '🫐', name: 'Yaban Mersini', category: 'farm',
    unlockCost: 6500000, unitCost: 1000000, baseRate: 400, sellPrice: 2000, maxUnits: 8,
    description: 'Antioksidan yaban mersini', scene: ['🌿', '🌳'],
    harvestMinutes: 10,
  },
  // ——— HAYVANLAR (ANIMALS) ———
  {
    id: 'chicken', emoji: '🐔', name: 'Tavuk Kümesi', category: 'animal',
    unlockCost: 350, unitCost: 60, baseRate: 13, sellPrice: 4, maxUnits: 20,
    description: 'Yumurta ve et üretimi', scene: ['🏚️', '🌾'],
    harvestMinutes: 0.6,
  },
  {
    id: 'cow', emoji: '🐄', name: 'İnek Ahırı', category: 'animal',
    unlockCost: 2500, unitCost: 600, baseRate: 23, sellPrice: 14, maxUnits: 15,
    description: 'Süt ve et üretimi', scene: ['🏠', '🌿'],
    harvestMinutes: 1.2,
  },
  {
    id: 'sheep', emoji: '🐑', name: 'Koyun Ağılı', category: 'animal',
    unlockCost: 14000, unitCost: 3000, baseRate: 40, sellPrice: 40, maxUnits: 15,
    description: 'Yün ve süt üretimi', scene: ['⛰️', '🌿'],
    harvestMinutes: 2,
  },
  {
    id: 'pig', emoji: '🐷', name: 'Domuz Çiftliği', category: 'animal',
    unlockCost: 55000, unitCost: 12000, baseRate: 66, sellPrice: 82, maxUnits: 12,
    description: 'Et ve şarküteri ürünleri', scene: ['🏡', '🌱'],
    harvestMinutes: 2.5,
  },
  {
    id: 'horse', emoji: '🐴', name: 'At Ahırı', category: 'animal',
    unlockCost: 200000, unitCost: 40000, baseRate: 110, sellPrice: 275, maxUnits: 10,
    description: 'Prestijli at yetiştiriciliği', scene: ['🏟️', '🌿'],
    harvestMinutes: 5,
  },
  {
    id: 'rabbit', emoji: '🐰', name: 'Tavşan Çiftliği', category: 'animal',
    unlockCost: 700000, unitCost: 130000, baseRate: 200, sellPrice: 300, maxUnits: 20,
    description: 'Hızlı üreyen tavşanlar', scene: ['🌸', '🌿'],
    harvestMinutes: 3,
  },
  {
    id: 'duck', emoji: '🦆', name: 'Ördek Göleti', category: 'animal',
    unlockCost: 2500000, unitCost: 450000, baseRate: 350, sellPrice: 1050, maxUnits: 15,
    description: 'Gölet kenarında ördekler', scene: ['💧', '🌊'],
    harvestMinutes: 6,
  },
  {
    id: 'goat', emoji: '🐐', name: 'Keçi Çiftliği', category: 'animal',
    unlockCost: 9000000, unitCost: 1500000, baseRate: 600, sellPrice: 3000, maxUnits: 12,
    description: 'Peynir ve süt üretimi', scene: ['⛰️', '🌿'],
    harvestMinutes: 10,
  },
  {
    id: 'turkey', emoji: '🦃', name: 'Hindi Çiftliği', category: 'animal',
    unlockCost: 30000000, unitCost: 5000000, baseRate: 1000, sellPrice: 9000, maxUnits: 10,
    description: 'Premium hindi yetiştiriciliği', scene: ['🌳', '🍂'],
    harvestMinutes: 18,
  },
  {
    id: 'bee', emoji: '🐝', name: 'Arı Kovanı', category: 'animal',
    unlockCost: 100000000, unitCost: 15000000, baseRate: 1833, sellPrice: 11000, maxUnits: 20,
    description: 'Organik bal üretimi', scene: ['🌸', '🌼'],
    harvestMinutes: 12,
  },
  // ——— ÜST TİER HAYVANLAR ———
  {
    id: 'alpaca', emoji: '🦙', name: 'Alpaka Çiftliği', category: 'animal',
    unlockCost: 350000000, unitCost: 50000000, baseRate: 3200, sellPrice: 24000, maxUnits: 10,
    description: 'Lüks alpaka yünü üretimi', scene: ['⛰️', '🌿'],
    harvestMinutes: 15,
  },
  {
    id: 'deer', emoji: '🦌', name: 'Geyik Rezervi', category: 'animal',
    unlockCost: 1200000000, unitCost: 180000000, baseRate: 5833, sellPrice: 87500, maxUnits: 8,
    description: 'Nadir geyik yetiştiriciliği', scene: ['🌲', '🌿'],
    harvestMinutes: 30,
  },
  {
    id: 'peacock', emoji: '🦚', name: 'Tavus Kuşu Bahçesi', category: 'animal',
    unlockCost: 4000000000, unitCost: 600000000, baseRate: 10500, sellPrice: 315000, maxUnits: 6,
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

export function replantCost(cfg: SectionConfig, count: number): number {
  return Math.max(1, Math.round(count * cfg.sellPrice * 0.20));
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
        const fillRatePerSec = lMult / (cfg.harvestMinutes * s.count * 60);
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

  // Farm/animal progression (unlock, buy, replant) is paid entirely in Coins —
  // Coins are the in-game currency. Balance (TL) is the real-money currency:
  // it only comes from tasks, referrals, streaks, the welcome bonus, and the
  // explicit Coin→TL converter, and is never spent on gameplay purchases.
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
          [id]: { unlocked: true, count: 1, needsReplant: false },
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
      // Fill time scales with count (fillRatePerSec ∝ 1/count), so adding a
      // unit mid-growth must rescale the in-progress fill fraction down by
      // oldCount/newCount to preserve the real elapsed effort. Without this,
      // a player could buy 1 unit, let it nearly finish (fast, since count=1),
      // then top up to max count right before harvest and reap a full-size
      // harvest almost instantly — the per-count time slowdown would never
      // actually apply to that harvest.
      const oldFill = prev.plotFill[id] ?? 0;
      const rescaledFill = sec.count > 0
        ? Math.min(1, Math.max(0, (oldFill * sec.count) / newCount))
        : oldFill;
      return {
        ...prev,
        coins: prev.coins - cfg.unitCost,
        sections: {
          ...prev.sections,
          [id]: { ...sec, count: newCount },
        },
        plotFill: { ...prev.plotFill, [id]: rescaledFill },
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

      // Yield = exactly how many units the player planted (count).
      // Selling count items at sellPrice each gives total = count × sellPrice coins.
      // This is intentionally simpler and more conservative than the old formula.
      const yieldItems = sec.count;
      const xpGain = Math.ceil(sec.count * cfg.harvestMinutes);
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

  /** Pay replant cost to restart growth cycle */
  const replantPlot = useCallback((id: string) => {
    const cfg = SECTIONS.find(s => s.id === id)!;
    setState(prev => {
      const sec = prev.sections[id];
      if (!sec?.unlocked || !sec.needsReplant) return prev;
      const cost = replantCost(cfg, sec.count);
      if (prev.coins < cost) return prev;
      return {
        ...prev,
        coins: prev.coins - cost,
        sections: { ...prev.sections, [id]: { ...sec, needsReplant: false } },
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
    if (s?.unlocked && s.count > 0 && !s.needsReplant) return sum + Math.round(cfg.sellPrice / cfg.harvestMinutes * levelMultiplier(state.level));
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
