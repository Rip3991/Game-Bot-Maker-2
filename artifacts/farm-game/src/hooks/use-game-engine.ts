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
  // NOTE: baseRates for wheat-sheep were reduced ~40% and harvestMinutes were
  // increased 2-3x (2026-07-09) to slow down early coin accumulation and force
  // players to spend more real time in the app. Do NOT reduce harvestMinutes
  // below these values without a full economy review — see coin-economy-margin
  // memory notes. Upper tiers (pig-bee) keep their already-tuned baseRates but
  // also got harvestMinutes doubled to extend end-game session time.
  {
    id: 'wheat', emoji: '🌾', name: 'Buğday Tarlası', category: 'farm',
    unlockCost: 0, unitCost: 25, baseRate: 0.7, sellPrice: 5, maxUnits: 20,
    description: 'Başlangıç çiftliğin', scene: ['🌳', '🌲'],
    harvestMinutes: 10,
  },
  {
    id: 'corn', emoji: '🌽', name: 'Mısır Tarlası', category: 'farm',
    unlockCost: 250, unitCost: 120, baseRate: 2, sellPrice: 10, maxUnits: 20,
    description: 'Altın mısır başakları', scene: ['🌻', '🌿'],
    harvestMinutes: 15,
  },
  {
    id: 'tomato', emoji: '🍅', name: 'Domates Bahçesi', category: 'farm',
    unlockCost: 1800, unitCost: 600, baseRate: 8, sellPrice: 25, maxUnits: 15,
    description: 'Taze kırmızı domatesler', scene: ['🌿', '🪴'],
    harvestMinutes: 20,
  },
  {
    id: 'sunflower', emoji: '🌻', name: 'Ayçiçeği Tarlası', category: 'farm',
    unlockCost: 10000, unitCost: 3000, baseRate: 35, sellPrice: 100, maxUnits: 12,
    description: 'Yağlık ayçiçeği tarlası', scene: ['☀️', '🌿'],
    harvestMinutes: 30,
  },
  // ——— HAYVANLAR (ANIMALS) ———
  {
    id: 'chicken', emoji: '🐔', name: 'Tavuk Kümesi', category: 'animal',
    unlockCost: 180, unitCost: 40, baseRate: 1.5, sellPrice: 8, maxUnits: 20,
    description: 'Yumurta ve et üretimi', scene: ['🏚️', '🌾'],
    harvestMinutes: 12,
  },
  {
    id: 'cow', emoji: '🐄', name: 'İnek Ahırı', category: 'animal',
    unlockCost: 1000, unitCost: 300, baseRate: 7, sellPrice: 30, maxUnits: 15,
    description: 'Süt ve et üretimi', scene: ['🏠', '🌿'],
    harvestMinutes: 18,
  },
  {
    id: 'sheep', emoji: '🐑', name: 'Koyun Ağılı', category: 'animal',
    unlockCost: 3500, unitCost: 900, baseRate: 20, sellPrice: 80, maxUnits: 15,
    description: 'Yün ve süt üretimi', scene: ['⛰️', '🌿'],
    harvestMinutes: 28,
  },
  // NOTE on baseRate for pig..bee: these are the coin-earning rate (coins/min
  // per unit). Coins convert to real TL at COIN_TO_TL_RATE (see stars.ts), so
  // this directly controls real-money payout risk. The original values here
  // let a fully-built, max-level farm earn ~900k coins/min (~45k TL/min) —
  // an effectively unlimited cash-out once maxed. baseRate for these seven
  // top tiers was cut ~8x (2026-07-09, operator request) to bring max
  // end-game payout down to a much safer ~6k TL/min while leaving unlockCost/
  // unitCost (the TL investment side) untouched — see coin-economy-margin
  // memory notes before raising these again. harvestMinutes doubled 2026-07-09
  // to extend session time without reopening the payout risk.
  {
    id: 'pig', emoji: '🐷', name: 'Domuz Çiftliği', category: 'animal',
    unlockCost: 10000, unitCost: 2500, baseRate: 12.5, sellPrice: 200, maxUnits: 12,
    description: 'Et ve şarküteri ürünleri', scene: ['🏡', '🌱'],
    harvestMinutes: 30,
  },
  {
    id: 'horse', emoji: '🐴', name: 'At Ahırı', category: 'animal',
    unlockCost: 30000, unitCost: 8000, baseRate: 35, sellPrice: 500, maxUnits: 10,
    description: 'Prestijli at yetiştiriciliği', scene: ['🏟️', '🌿'],
    harvestMinutes: 45,
  },
  {
    id: 'rabbit', emoji: '🐰', name: 'Tavşan Çiftliği', category: 'animal',
    unlockCost: 80000, unitCost: 20000, baseRate: 81.25, sellPrice: 1200, maxUnits: 20,
    description: 'Hızlı üreyen tavşanlar', scene: ['🌸', '🌿'],
    harvestMinutes: 60,
  },
  {
    id: 'duck', emoji: '🦆', name: 'Ördek Göleti', category: 'animal',
    unlockCost: 180000, unitCost: 45000, baseRate: 175, sellPrice: 2500, maxUnits: 15,
    description: 'Gölet kenarında ördekler', scene: ['💧', '🌊'],
    harvestMinutes: 90,
  },
  {
    id: 'goat', emoji: '🐐', name: 'Keçi Çiftliği', category: 'animal',
    unlockCost: 400000, unitCost: 100000, baseRate: 375, sellPrice: 5000, maxUnits: 12,
    description: 'Peynir ve süt üretimi', scene: ['⛰️', '🌿'],
    harvestMinutes: 120,
  },
  {
    id: 'turkey', emoji: '🦃', name: 'Hindi Çiftliği', category: 'animal',
    unlockCost: 900000, unitCost: 220000, baseRate: 812.5, sellPrice: 10000, maxUnits: 10,
    description: 'Premium hindi yetiştiriciliği', scene: ['🌳', '🍂'],
    harvestMinutes: 180,
  },
  {
    id: 'bee', emoji: '🐝', name: 'Arı Kovanı', category: 'animal',
    unlockCost: 2000000, unitCost: 500000, baseRate: 1875, sellPrice: 25000, maxUnits: 20,
    description: 'Organik bal üretimi', scene: ['🌸', '🌼'],
    harvestMinutes: 240,
  },
];

export type SectionId = typeof SECTIONS[number]['id'];

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
  return Math.max(1, Math.round(count * cfg.baseRate * cfg.harvestMinutes * 0.40));
}

export interface GameState {
  balance: number;
  coins: number;
  sections: Record<string, SectionState>;
  storage: Record<string, number>;
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

export const makeInitialState = (): GameState => ({
  balance: 0,
  coins: 0,
  sections: Object.fromEntries(SECTIONS.map(cfg => [cfg.id, defaultSection(cfg)])),
  storage: Object.fromEntries(SECTIONS.map(cfg => [cfg.id, 0])),
  plotFill: Object.fromEntries(SECTIONS.map(cfg => [cfg.id, 0])),
  level: 1,
  xp: 0,
  lastSaved: Date.now(),
  welcomeBonusClaimed: false,
});

const SAVE_KEY = 'farmGameState_v8';
const AUTO_SELL_KEY = 'farmAutoSell_v1';
export const AUTO_SELL_PURCHASED_KEY = 'farmAutoSellPurchased_v1';
export const WELCOME_BONUS = 150;

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
        const fillRatePerSec = lMult / (cfg.harvestMinutes * 60);
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

  const unlockSection = useCallback((id: string) => {
    const cfg = SECTIONS.find(s => s.id === id)!;
    setState(prev => {
      if (prev.balance < cfg.unlockCost) return prev;
      if (prev.sections[id]?.unlocked) return prev;
      return {
        ...prev,
        balance: prev.balance - cfg.unlockCost,
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
      if (prev.balance < cfg.unitCost) return prev;
      return {
        ...prev,
        balance: prev.balance - cfg.unitCost,
        sections: {
          ...prev.sections,
          [id]: { ...sec, count: sec.count + 1 },
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

      // NOTE: level bonus is applied ONCE, to fill speed only (see the fill-
      // tick effect above, `fillRatePerSec = lMult / harvestMinutes`), which
      // already makes plots harvest more often per minute at higher levels.
      // Do NOT also multiply the yield here — doing both compounded the bonus
      // to lMult^2 (e.g. ~4.8x instead of ~2.2x at max level), silently
      // reopening the coin→TL payout risk the baseRate tuning was meant to
      // close. Yield per harvest must stay level-independent.
      const yieldItems = (sec.count * cfg.baseRate * cfg.harvestMinutes) / cfg.sellPrice;
      const xpGain = Math.ceil(sec.count * cfg.harvestMinutes);
      const newXp = prev.xp + xpGain;
      const newLevel = computeLevel(newXp);

      return {
        ...prev,
        storage: { ...prev.storage, [id]: (prev.storage[id] ?? 0) + yieldItems },
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
      if (prev.balance < cost) return prev;
      return {
        ...prev,
        balance: prev.balance - cost,
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
    if (s?.unlocked && s.count > 0 && !s.needsReplant) return sum + s.count * cfg.baseRate * levelMultiplier(state.level);
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
