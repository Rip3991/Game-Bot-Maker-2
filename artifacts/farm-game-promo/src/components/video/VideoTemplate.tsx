import { useEffect } from 'react';
import { useVideoPlayer } from '@/lib/video';
import { AnimatePresence, motion } from 'framer-motion';

import { Scene1 } from './video_scenes/Scene1';
import { Scene2 } from './video_scenes/Scene2';
import { Scene3 } from './video_scenes/Scene3';
import { Scene4 } from './video_scenes/Scene4';

export const SCENE_DURATIONS = {
  '0': 4000, // Welcome
  '1': 4500, // How to play
  '2': 4500, // Earn TL
  '3': 5000, // Outro CTA
};

const SCENE_COMPONENTS: Record<string, React.ComponentType> = {
  '0': Scene1,
  '1': Scene2,
  '2': Scene3,
  '3': Scene4,
};

export default function VideoTemplate({
  durations = SCENE_DURATIONS,
  loop = true,
  onSceneChange,
}: {
  durations?: Record<string, number>;
  loop?: boolean;
  onSceneChange?: (sceneKey: string) => void;
} = {}) {
  const { currentSceneKey } = useVideoPlayer({ durations, loop });

  useEffect(() => {
    onSceneChange?.(currentSceneKey);
  }, [currentSceneKey, onSceneChange]);

  const baseSceneKey = currentSceneKey.replace(/_r[12]$/, '');
  const SceneComponent = SCENE_COMPONENTS[baseSceneKey];

  return (
    <div
      className="w-full h-screen overflow-hidden relative bg-[#87CEEB]" // Sky blue default
    >
      {/* Persistent Background Layer */}
      <motion.div 
        className="absolute inset-0 z-0"
        animate={{
          scale: [1, 1.05, 1],
        }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
      >
        <img 
          src={`${import.meta.env.BASE_URL}images/bg-farm.jpg`} 
          className="w-full h-full object-cover opacity-60 mix-blend-overlay"
          alt="Farm Background"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#87CEEB] to-transparent opacity-80" />
      </motion.div>

      {/* Persistent Sun */}
      <motion.div
        className="absolute -top-20 -right-20 w-96 h-96 bg-primary rounded-full blur-[80px] opacity-60 z-0"
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.5, 0.7, 0.5]
        }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* mode="popLayout" to avoid layout jumps */}
      <AnimatePresence mode="popLayout">
        {SceneComponent && <SceneComponent key={currentSceneKey} />}
      </AnimatePresence>
    </div>
  );
}
