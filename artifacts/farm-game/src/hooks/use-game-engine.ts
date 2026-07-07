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
}

export const SECTIONS: SectionConfig[] = [
  // ——— TARLALAR (FARMS) ———
  {
    id: 'wheat', emoji: '🌾', name: 'Buğday Tarlası', category: 'farm',
    unlockCost: 0, unitCost: 25, baseRate: 1.2, sellPrice: 5, maxUnits: 20,
    description: 'Başlangıç çiftliğin', scene: ['🌳', '🌲'],
  },
  {
    id: 'corn', emoji: '🌽', name: 'Mısır Tarlası', category: 'farm',
    unlockCost: 250, unitCost: 120, baseRate: 4, sellPrice: 10, maxUnits: 20,
    description: 'Altın mısır başakları', scene: ['🌻', '🌿'],
  },
  {
    id: 'tomato', emoji: '🍅', name: 'Domates Bahçesi', category: 'farm',
    unlockCost: 1800, unitCost: 600, baseRate: 14, sellPrice: 25, maxUnits: 15,
    description: 'Taze kırmızı domatesler', scene: ['🌿', '🪴'],
  },
  {
    id: 'sunflower', emoji: '🌻', name: 'Ayçiçeği Tarlası', category: 'farm',
    unlockCost: 10000, unitCost: 3000, baseRate: 60, sellPrice: 100, maxUnits: 12,
    description: 'Yağlık ayçiçeği tarlası', scene: ['☀️', '🌿'],
  },
  // ——— HAYVANLAR (ANIMALS) ———
  {
    id: 'chicken', emoji: '🐔', name: 'Tavuk Kümesi', category: 'animal',
    unlockCost: 400, unitCost: 80, baseRate: 3, sellPrice: 8, maxUnits: 20,
    description: 'Yumurta ve et üretimi', scene: ['🏚️', '🌾'],
  },
  {
    id: 'cow', emoji: '🐄', name: 'İnek Ahırı', category: 'animal',
    unlockCost: 2500, unitCost: 700, baseRate: 12, sellPrice: 30, maxUnits: 15,
    description: 'Süt ve et üretimi', scene: ['🏠', '🌿'],
  },
  {
    id: 'sheep', emoji: '🐑', name: 'Koyun Ağılı', category: 'animal',
    unlockCost: 8000, unitCost: 2000, baseRate: 35, sellPrice: 80, maxUnits: 15,
    description: 'Yün ve süt üretimi', scene: ['⛰️', '🌿'],
  },
  {
    id: 'pig', emoji: '🐷', name: 'Domuz Çiftliği', category: 'animal',
    unlockCost: 25000, unitCost: 6000, baseRate: 100, sellPrice: 200, maxUnits: 12,
    description: 'Et ve şarküteri ürünleri', scene: ['🏡', '🌱'],
  },
  {
    id: 'horse', emoji: '🐴', name: 'At Ahırı', category: 'animal',
    unlockCost: 70000, unitCost: 18000, baseRate: 280, sellPrice: 500, maxUnits: 10,
    description: 'Prestijli at yetiştiriciliği', scene: ['🏟️', '🌿'],
  },
  {
    id: 'rabbit', emoji: '🐰', name: 'Tavşan Çiftliği', category: 'animal',
    unlockCost: 180000, unitCost: 45000, baseRate: 650, sellPrice: 1200, maxUnits: 20,
    description: 'Hızlı üreyen tavşanlar', scene: ['🌸', '🌿'],
  },
  {
    id: 'duck', emoji: '🦆', name: 'Ördek Göleti', category: 'animal',
    unlockCost: 400000, unitCost: 100000, baseRate: 1400, sellPrice: 2500, maxUnits: 15,
    description: 'Gölet kenarında ördekler', scene: ['💧', '🌊'],
  },
  {
    id: 'goat', emoji: '🐐', name: 'Keçi Çiftliği', category: 'animal',
    unlockCost: 900000, unitCost: 220000, baseRate: 3000, sellPrice: 5000, maxUnits: 12,
    description: 'Peynir ve süt üretimi', scene: ['⛰️', '🌿'],
  },
  {
    id: 'turkey', emoji: '🦃', name: 'Hindi Çiftliği', category: 'animal',
    unlockCost: 2000000, unitCost: 500000, baseRate: 6500, sellPrice: 10000, maxUnits: 10,
    description: 'Premium hindi yetiştiriciliği', scene: ['🌳', '🍂'],
  },
  {
    id: 'bee', emoji: '🐝', name: 'Arı Kovanı', category: 'animal',
    unlockCost: 5000000, unitCost: 1200000, baseRate: 15000, sellPrice: 25000, maxUnits: 20,
    description: 'Organik bal üretimi', scene: ['🌸', '🌼'],
  },
];

export type SectionId = typeof SECTIONS[number]['id'];

export interface SectionState {
  unlocked: boolean;
  count: number;
}

export interface SaleRecord {
  id: string;
  emoji: string;
  name: string;
  qty: number;
  unitPrice: number;
  total: number;
}

export interface GameState {
  balance: number;
  sections: Record<string, SectionState>;
  storage: Record<string, number>;
  lastSaved: number;
  welcomeBonusClaimed: boolean;
}

const defaultSection = (cfg: SectionConfig): SectionState => ({
  unlocked: cfg.unlockCost === 0,
  count: cfg.unlockCost === 0 ? 1 : 0,
});

export const makeInitialState = (): GameState => ({
  balance: 0,
  sections: Object.fromEntries(SECTIONS.map(cfg => [cfg.id, defaultSection(cfg)])),
  storage: Object.fromEntries(SECTIONS.map(cfg => [cfg.id, 0])),
  lastSaved: Date.now(),
  welcomeBonusClaimed: false,
});

const SAVE_KEY = 'farmGameState_v6';
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
      const saved = localStorage.getItem(SAVE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as GameState;
        const now = Date.now();
        const deltaSec = Math.max(0, (now - parsed.lastSaved) / 1000);

        const sections: Record<string, SectionState> = {
          ...Object.fromEntries(SECTIONS.map(cfg => [cfg.id, defaultSection(cfg)])),
          ...parsed.sections,
        };

        const storage: Record<string, number> = {
          ...Object.fromEntries(SECTIONS.map(cfg => [cfg.id, 0])),
          ...(parsed.storage ?? {}),
        };

        SECTIONS.forEach(cfg => {
          const s = sections[cfg.id];
          if (s?.unlocked && s.count > 0) {
            const ratePerSec = (s.count * cfg.baseRate) / cfg.sellPrice / 60;
            storage[cfg.id] = Math.min(
              (storage[cfg.id] ?? 0) + ratePerSec * deltaSec,
              s.count * cfg.maxUnits * 10,
            );
          }
        });

        return { ...parsed, sections, storage, lastSaved: now };
      }
    } catch (e) {
      console.error('Failed to load save', e);
    }
    return makeInitialState();
  });

  const stateRef = useRef(state);
  stateRef.current = state;

  const [showWelcomeBonus, setShowWelcomeBonus] = useState(false);
  // Only grant the welcome bonus when the backend confirms this is a brand-new account.
  // Checking `isNewUser` (from the server) prevents returning users from claiming the
  // bonus again on a new device or after clearing localStorage.
  useEffect(() => {
    if (!isNewUser) return;
    setState(prev => {
      if (prev.welcomeBonusClaimed) return prev; // safety: don't double-grant same session
      return { ...prev, balance: prev.balance + WELCOME_BONUS, welcomeBonusClaimed: true };
    });
    const wasAlreadyClaimed = stateRef.current.welcomeBonusClaimed;
    if (!wasAlreadyClaimed) {
      setShowWelcomeBonus(true);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isNewUser]);

  // Real-time product accumulation (20 ticks/sec)
  useEffect(() => {
    let lastTime = Date.now();
    const interval = setInterval(() => {
      const now = Date.now();
      const deltaSec = (now - lastTime) / 1000;
      lastTime = now;
      const current = stateRef.current;

      let hasChange = false;
      const storageUpdates: Record<string, number> = {};

      SECTIONS.forEach(cfg => {
        const s = current.sections[cfg.id];
        if (s?.unlocked && s.count > 0) {
          const ratePerSec = (s.count * cfg.baseRate) / cfg.sellPrice / 60;
          const cap = s.count * 200;
          const current_amount = current.storage[cfg.id] ?? 0;
          const newAmt = Math.min(current_amount + ratePerSec * deltaSec, cap);
          if (newAmt !== current_amount) {
            storageUpdates[cfg.id] = newAmt;
            hasChange = true;
          }
        }
      });

      if (hasChange) {
        setState(prev => ({
          ...prev,
          storage: { ...prev.storage, ...storageUpdates },
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

  // Auto-sell every 30 sec when enabled
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
        return { ...prev, balance: prev.balance + totalEarned, storage: newStorage };
      });
    }, 30000);
    return () => clearInterval(interval);
  }, []);

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
          [id]: { unlocked: true, count: 1 },
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
      return { ...prev, balance: prev.balance + totalEarned, storage: newStorage };
    });
    return records;
  }, []);

  const incomePerMin = SECTIONS.reduce((sum, cfg) => {
    const s = state.sections[cfg.id];
    if (s?.unlocked && s.count > 0) return sum + s.count * cfg.baseRate;
    return sum;
  }, 0);

  const setBalance = useCallback((amount: number) => {
    setState(prev => ({ ...prev, balance: amount }));
  }, []);

  return { state, unlockSection, buyUnit, sellProducts, incomePerMin, showWelcomeBonus, setShowWelcomeBonus, setBalance, autoSell, toggleAutoSell, autoSellPurchased, unlockAutoSell };
}
