import React from 'react';
import { motion } from 'framer-motion';

const CLOUDS = [
  { y: 6,  size: 28, dur: 40, delay: 0,    opacity: 0.75 },
  { y: 14, size: 20, dur: 55, delay: -18,  opacity: 0.55 },
  { y: 2,  size: 24, dur: 48, delay: -30,  opacity: 0.65 },
  { y: 18, size: 16, dur: 35, delay: -8,   opacity: 0.45 },
  { y: 8,  size: 32, dur: 62, delay: -44,  opacity: 0.6  },
];

const BIRDS = [
  { y: 10, size: 16, dur: 22, delay: -5  },
  { y: 20, size: 12, dur: 30, delay: -15 },
];

export function FarmBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      {/* Sky gradient */}
      <div className="absolute inset-x-0 top-0"
        style={{ height: '42%', background: 'linear-gradient(180deg, #1a4d7a 0%, #2e7bbf 40%, #6db8e8 75%, #a8d8f0 100%)' }} />

      {/* Sun */}
      <motion.div className="absolute text-4xl select-none"
        style={{ top: 10, right: 18 }}
        animate={{ scale: [1, 1.06, 1], filter: ['drop-shadow(0 0 8px #fbbf24)', 'drop-shadow(0 0 20px #f59e0b)', 'drop-shadow(0 0 8px #fbbf24)'] }}
        transition={{ repeat: Infinity, duration: 3.5 }}>
        ☀️
      </motion.div>

      {/* Clouds */}
      {CLOUDS.map((c, i) => (
        <motion.div key={i}
          className="absolute select-none"
          style={{ top: `${c.y}%`, fontSize: c.size, opacity: c.opacity }}
          animate={{ x: ['-80px', 'calc(110vw)'] }}
          transition={{ repeat: Infinity, duration: c.dur, delay: c.delay, ease: 'linear' }}>
          ☁️
        </motion.div>
      ))}

      {/* Birds */}
      {BIRDS.map((b, i) => (
        <motion.div key={i}
          className="absolute select-none"
          style={{ top: `${b.y}%`, fontSize: b.size, opacity: 0.7 }}
          animate={{ x: ['-40px', 'calc(110vw)'] }}
          transition={{ repeat: Infinity, duration: b.dur, delay: b.delay, ease: 'linear' }}>
          🐦
        </motion.div>
      ))}

      {/* Horizon hills — back layer */}
      <div className="absolute inset-x-0" style={{ top: '36%' }}>
        <svg viewBox="0 0 400 80" preserveAspectRatio="none" width="100%" height="60">
          <path d="M0,80 Q60,20 120,50 Q180,80 240,30 Q300,0 360,40 Q390,55 400,45 L400,80 Z"
            fill="#4ea824" opacity="0.45" />
        </svg>
      </div>

      {/* Horizon hills — mid layer */}
      <div className="absolute inset-x-0" style={{ top: '38%' }}>
        <svg viewBox="0 0 400 70" preserveAspectRatio="none" width="100%" height="55">
          <path d="M0,70 Q50,30 100,50 Q160,70 220,25 Q280,0 330,35 Q370,55 400,30 L400,70 Z"
            fill="#5ab327" opacity="0.65" />
        </svg>
      </div>

      {/* Ground layer — solid green */}
      <div className="absolute inset-x-0 bottom-0" style={{ top: '41%', background: 'linear-gradient(180deg, #5ab327 0%, #4ea824 40%, #3d8b1c 100%)' }} />

      {/* Grass texture strip */}
      <div className="absolute inset-x-0" style={{ top: '41%', height: 18 }}>
        <svg viewBox="0 0 400 18" preserveAspectRatio="none" width="100%" height="18">
          <path d="M0,18 Q10,4 20,18 Q30,4 40,18 Q50,4 60,18 Q70,4 80,18 Q90,4 100,18 Q110,4 120,18 Q130,4 140,18 Q150,4 160,18 Q170,4 180,18 Q190,4 200,18 Q210,4 220,18 Q230,4 240,18 Q250,4 260,18 Q270,4 280,18 Q290,4 300,18 Q310,4 320,18 Q330,4 340,18 Q350,4 360,18 Q370,4 380,18 Q390,4 400,18 Z"
            fill="#6acf38" />
        </svg>
      </div>

      {/* Distant trees */}
      <div className="absolute select-none text-3xl" style={{ top: '28%', left: '5%', opacity: 0.6 }}>🌲</div>
      <div className="absolute select-none text-2xl" style={{ top: '31%', left: '12%', opacity: 0.5 }}>🌲</div>
      <div className="absolute select-none text-4xl" style={{ top: '26%', right: '8%', opacity: 0.6 }}>🌳</div>
      <div className="absolute select-none text-2xl" style={{ top: '32%', right: '18%', opacity: 0.5 }}>🌲</div>

      {/* Flowers in grass */}
      {['🌸','🌼','🌺','🌻','🌷'].map((f, i) => (
        <motion.div key={i}
          className="absolute select-none text-xs"
          style={{ top: `${44 + Math.random() * 3}%`, left: `${8 + i * 18}%`, opacity: 0.7 }}
          animate={{ y: [0, -2, 0], rotate: [-5, 5, -5] }}
          transition={{ repeat: Infinity, duration: 2 + i * 0.4, ease: 'easeInOut' }}>
          {f}
        </motion.div>
      ))}

      {/* Butterflies */}
      <motion.div className="absolute select-none text-sm"
        style={{ top: '39%' }}
        animate={{ x: ['10%', '80%', '10%'], y: [0, -10, 5, -8, 0] }}
        transition={{ repeat: Infinity, duration: 18, ease: 'easeInOut' }}>
        🦋
      </motion.div>
    </div>
  );
}
