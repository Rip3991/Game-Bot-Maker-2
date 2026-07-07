import { useState, useEffect, useCallback, useRef } from 'react';

export const FARM_TYPES = ['wheat', 'chicken', 'cow'] as const;
export type FarmType = typeof FARM_TYPES[number];

export const FARM_CONFIG = {
  wheat: { emoji: '🌾', name: 'Wheat Field', baseRate: 24, value: 0.001 },
  chicken: { emoji: '🐔', name: 'Chicken Coop', baseRate: 10, value: 0.003 },
  cow: { emoji: '🐄', name: 'Cow Pen', baseRate: 12, value: 0.004 }
};

export interface GameState {
  balance: number;
  farms: Record<FarmType, number>;
  lastSaved: number;
}

const INITIAL_STATE: GameState = {
  balance: 54.11, // Seeded balance for initial upgrades
  farms: { wheat: 1, chicken: 1, cow: 1 },
  lastSaved: Date.now()
};

export function useGameEngine() {
  const [state, setState] = useState<GameState>(() => {
    try {
      const saved = localStorage.getItem('farmGameState');
      if (saved) {
        const parsed = JSON.parse(saved) as GameState;
        
        // Calculate offline progress
        const now = Date.now();
        const deltaSec = Math.max(0, (now - parsed.lastSaved) / 1000);
        
        let offlineEarnings = 0;
        offlineEarnings += (parsed.farms.wheat * FARM_CONFIG.wheat.baseRate / 60) * FARM_CONFIG.wheat.value * deltaSec;
        offlineEarnings += (parsed.farms.chicken * FARM_CONFIG.chicken.baseRate / 60) * FARM_CONFIG.chicken.value * deltaSec;
        offlineEarnings += (parsed.farms.cow * FARM_CONFIG.cow.baseRate / 60) * FARM_CONFIG.cow.value * deltaSec;

        return {
          ...parsed,
          balance: parsed.balance + offlineEarnings,
          lastSaved: now
        };
      }
    } catch (e) {
      console.error("Failed to load save", e);
    }
    return INITIAL_STATE;
  });

  const stateRef = useRef(state);
  stateRef.current = state;

  // Real-time accumulation loop (20 ticks per second)
  useEffect(() => {
    let lastTime = Date.now();
    const interval = setInterval(() => {
      const now = Date.now();
      const deltaSec = (now - lastTime) / 1000;
      lastTime = now;

      const current = stateRef.current;
      
      const wEarn = (current.farms.wheat * FARM_CONFIG.wheat.baseRate / 60) * FARM_CONFIG.wheat.value * deltaSec;
      const cEarn = (current.farms.chicken * FARM_CONFIG.chicken.baseRate / 60) * FARM_CONFIG.chicken.value * deltaSec;
      const cowEarn = (current.farms.cow * FARM_CONFIG.cow.baseRate / 60) * FARM_CONFIG.cow.value * deltaSec;
      
      const totalEarn = wEarn + cEarn + cowEarn;

      if (totalEarn > 0) {
        setState(prev => ({
          ...prev,
          balance: prev.balance + totalEarn
        }));
      }
    }, 50);

    return () => clearInterval(interval);
  }, []);

  // Auto-save loop (every 2 seconds)
  useEffect(() => {
    const saveInterval = setInterval(() => {
      localStorage.setItem('farmGameState', JSON.stringify({
        ...stateRef.current,
        lastSaved: Date.now()
      }));
    }, 2000);
    return () => clearInterval(saveInterval);
  }, []);

  const upgradeFarm = useCallback((type: FarmType) => {
    setState(prev => {
      const level = prev.farms[type];
      if (level >= 10) return prev;
      
      const cost = 5 * level;
      if (prev.balance >= cost) {
        return {
          ...prev,
          balance: prev.balance - cost,
          farms: {
            ...prev.farms,
            [type]: level + 1
          }
        };
      }
      return prev;
    });
  }, []);

  return { state, upgradeFarm };
}
