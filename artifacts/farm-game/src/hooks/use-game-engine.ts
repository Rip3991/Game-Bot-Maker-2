import { useState, useEffect, useCallback, useRef } from 'react';

export type SectionCategory = 'farm' | 'animal';

export interface SectionConfig {
  id: string;
  emoji: string;
  name: string;
  category: SectionCategory;
  unlockCost: number;   // TL to unlock the section
  unitCost: number;     // TL per additional unit
  baseRate: number;     // TL per minute per unit
  maxUnits: number;
  description: string;
  scene: string[];      // background decorations
}

export const SECTIONS: SectionConfig[] = [
  // ——— TARLALAR (FARMS) ———
  {
    id: 'wheat', emoji: '🌾', name: 'Buğday Tarlası', category: 'farm',
    unlockCost: 0, unitCost: 25, baseRate: 1.2, maxUnits: 20,
    description: 'Başlangıç çiftliğin', scene: ['🌳', '🌲'],
  },
  {
    id: 'corn', emoji: '🌽', name: 'Mısır Tarlası', category: 'farm',
    unlockCost: 250, unitCost: 120, baseRate: 4, maxUnits: 20,
    description: 'Altın mısır başakları', scene: ['🌻', '🌿'],
  },
  {
    id: 'tomato', emoji: '🍅', name: 'Domates Bahçesi', category: 'farm',
    unlockCost: 1800, unitCost: 600, baseRate: 14, maxUnits: 15,
    description: 'Taze kırmızı domatesler', scene: ['🌿', '🪴'],
  },
  {
    id: 'sunflower', emoji: '🌻', name: 'Ayçiçeği Tarlası', category: 'farm',
    unlockCost: 10000, unitCost: 3000, baseRate: 60, maxUnits: 12,
    description: 'Yağlık ayçiçeği tarlası', scene: ['☀️', '🌿'],
  },
  // ——— HAYVANLAR (ANIMALS) ———
  {
    id: 'chicken', emoji: '🐔', name: 'Tavuk Kümesi', category: 'animal',
    unlockCost: 400, unitCost: 80, baseRate: 3, maxUnits: 20,
    description: 'Yumurta ve et üretimi', scene: ['🏚️', '🌾'],
  },
  {
    id: 'cow', emoji: '🐄', name: 'İnek Ahırı', category: 'animal',
    unlockCost: 2500, unitCost: 700, baseRate: 12, maxUnits: 15,
    description: 'Süt ve et üretimi', scene: ['🏠', '🌿'],
  },
  {
    id: 'sheep', emoji: '🐑', name: 'Koyun Ağılı', category: 'animal',
    unlockCost: 8000, unitCost: 2000, baseRate: 35, maxUnits: 15,
    description: 'Yün ve süt üretimi', scene: ['⛰️', '🌿'],
  },
  {
    id: 'pig', emoji: '🐷', name: 'Domuz Çiftliği', category: 'animal',
    unlockCost: 25000, unitCost: 6000, baseRate: 100, maxUnits: 12,
    description: 'Et ve şarküteri ürünleri', scene: ['🏡', '🌱'],
  },
  {
    id: 'horse', emoji: '🐴', name: 'At Ahırı', category: 'animal',
    unlockCost: 70000, unitCost: 18000, baseRate: 280, maxUnits: 10,
    description: 'Prestijli at yetiştiriciliği', scene: ['🏟️', '🌿'],
  },
  {
    id: 'rabbit', emoji: '🐰', name: 'Tavşan Çiftliği', category: 'animal',
    unlockCost: 180000, unitCost: 45000, baseRate: 650, maxUnits: 20,
    description: 'Hızlı üreyen tavşanlar', scene: ['🌸', '🌿'],
  },
  {
    id: 'duck', emoji: '🦆', name: 'Ördek Göleti', category: 'animal',
    unlockCost: 400000, unitCost: 100000, baseRate: 1400, maxUnits: 15,
    description: 'Gölet kenarında ördekler', scene: ['💧', '🌊'],
  },
  {
    id: 'goat', emoji: '🐐', name: 'Keçi Çiftliği', category: 'animal',
    unlockCost: 900000, unitCost: 220000, baseRate: 3000, maxUnits: 12,
    description: 'Peynir ve süt üretimi', scene: ['⛰️', '🌿'],
  },
  {
    id: 'turkey', emoji: '🦃', name: 'Hindi Çiftliği', category: 'animal',
    unlockCost: 2000000, unitCost: 500000, baseRate: 6500, maxUnits: 10,
    description: 'Premium hindi yetiştiriciliği', scene: ['🌳', '🍂'],
  },
  {
    id: 'bee', emoji: '🐝', name: 'Arı Kovanı', category: 'animal',
    unlockCost: 5000000, unitCost: 1200000, baseRate: 15000, maxUnits: 20,
    description: 'Organik bal üretimi', scene: ['🌸', '🌼'],
  },
];

export type SectionId = typeof SECTIONS[number]['id'];

export interface SectionState {
  unlocked: boolean;
  count: number;
}

export interface GameState {
  balance: number;
  sections: Record<string, SectionState>;
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
  lastSaved: Date.now(),
  welcomeBonusClaimed: false,
});

const SAVE_KEY = 'farmGameState_v5';
export const WELCOME_BONUS = 150;

export function useGameEngine() {
  const [state, setState] = useState<GameState>(() => {
    try {
      const saved = localStorage.getItem(SAVE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as GameState;
        const now = Date.now();
        const deltaSec = Math.max(0, (now - parsed.lastSaved) / 1000);

        // Offline earnings
        let offline = 0;
        SECTIONS.forEach(cfg => {
          const s = parsed.sections?.[cfg.id];
          if (s?.unlocked && s.count > 0) {
            offline += (s.count * cfg.baseRate / 60) * deltaSec;
          }
        });

        // Merge new sections (for updates that add sections)
        const sections: Record<string, SectionState> = {
          ...Object.fromEntries(SECTIONS.map(cfg => [cfg.id, defaultSection(cfg)])),
          ...parsed.sections,
        };

        return { ...parsed, sections, balance: parsed.balance + offline, lastSaved: now };
      }
    } catch (e) {
      console.error('Failed to load save', e);
    }
    return makeInitialState();
  });

  const stateRef = useRef(state);
  stateRef.current = state;

  // Welcome bonus (once) — check initial state, apply outside updater
  const [showWelcomeBonus, setShowWelcomeBonus] = useState(false);
  useEffect(() => {
    setState(prev => {
      if (prev.welcomeBonusClaimed) return prev;
      return { ...prev, balance: prev.balance + WELCOME_BONUS, welcomeBonusClaimed: true };
    });
    // Read directly from ref to avoid closure capture issues
    const wasAlreadyClaimed = stateRef.current.welcomeBonusClaimed;
    if (!wasAlreadyClaimed) {
      setShowWelcomeBonus(true);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Real-time accumulation (20 ticks/sec)
  useEffect(() => {
    let lastTime = Date.now();
    const interval = setInterval(() => {
      const now = Date.now();
      const deltaSec = (now - lastTime) / 1000;
      lastTime = now;
      const current = stateRef.current;
      let total = 0;
      SECTIONS.forEach(cfg => {
        const s = current.sections[cfg.id];
        if (s?.unlocked && s.count > 0) {
          total += (s.count * cfg.baseRate / 60) * deltaSec;
        }
      });
      if (total > 0) {
        setState(prev => ({ ...prev, balance: prev.balance + total }));
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

  // Total income per minute
  const incomePerMin = SECTIONS.reduce((sum, cfg) => {
    const s = state.sections[cfg.id];
    if (s?.unlocked && s.count > 0) return sum + s.count * cfg.baseRate;
    return sum;
  }, 0);

  const setBalance = useCallback((amount: number) => {
    setState(prev => ({ ...prev, balance: amount }));
  }, []);

  return { state, unlockSection, buyUnit, incomePerMin, showWelcomeBonus, setShowWelcomeBonus, setBalance };
}
