import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useVideoPlayer } from '@/lib/video';
import { Scene1 } from './video_scenes/Scene1';
import { Scene2 } from './video_scenes/Scene2';
import { Scene3 } from './video_scenes/Scene3';
import { Scene4 } from './video_scenes/Scene4';
import { Scene5 } from './video_scenes/Scene5';

export const SCENE_DURATIONS = {
  intro: 3500,
  prescriptions: 4000,
  devices: 4000,
  geriatric: 4500,
  outro: 3500
};

const SCENE_COMPONENTS: Record<string, React.ComponentType> = {
  intro: Scene1,
  prescriptions: Scene2,
  devices: Scene3,
  geriatric: Scene4,
  outro: Scene5,
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

  const baseSceneKey = currentSceneKey.replace(/_r[12]$/, '') as keyof typeof SCENE_DURATIONS;
  const sceneIndex = Math.max(0, Object.keys(SCENE_DURATIONS).indexOf(baseSceneKey));
  const SceneComponent = SCENE_COMPONENTS[baseSceneKey];

  return (
    <div className="w-full h-screen overflow-hidden relative bg-[#050505] text-white">
      {/* Persistent Background Layer */}
      <div className="absolute inset-0 z-0">
        <motion.img 
          src={`${import.meta.env.BASE_URL}images/bg-hive.png`}
          className="absolute inset-0 w-full h-full object-cover opacity-40 mix-blend-screen"
          animate={{
            scale: [1.05, 1.15, 1.05],
            x: ['-2%', '2%', '-2%'],
            y: ['-1%', '1%', '-1%']
          }}
          transition={{ duration: 25, ease: "linear", repeat: Infinity }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-transparent to-[#050505] opacity-80" />
      </div>

      {/* Persistent Hexagon Accents */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" className="opacity-20">
          <pattern id="hex-pattern" x="0" y="0" width="60" height="103.923" patternUnits="userSpaceOnUse">
            <path d="M30 0 L60 17.32 L60 51.96 L30 69.28 L0 51.96 L0 17.32 Z" fill="none" stroke="#f5c518" strokeWidth="0.5"/>
            <path d="M30 103.923 L60 86.603 L60 51.96 L30 69.28 L0 51.96 L0 86.603 Z" fill="none" stroke="#f5c518" strokeWidth="0.5"/>
          </pattern>
          <rect x="0" y="0" width="100%" height="100%" fill="url(#hex-pattern)"></rect>
        </svg>
      </div>

      {/* Dynamic Midground Glow */}
      <motion.div
        className="absolute w-[40vw] h-[40vw] rounded-full blur-[120px] mix-blend-screen pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(245,197,24,0.3) 0%, transparent 70%)' }}
        animate={{
          x: ['20vw', '60vw', '10vw', '50vw', '30vw'][sceneIndex],
          y: ['30vh', '20vh', '60vh', '10vh', '40vh'][sceneIndex],
          scale: [1, 1.2, 0.8, 1.5, 1][sceneIndex],
          opacity: [0.5, 0.8, 0.6, 0.7, 0.9][sceneIndex]
        }}
        transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1] }}
      />

      {/* Foreground Scenes */}
      <div className="absolute inset-0 z-10">
        <AnimatePresence mode="popLayout">
          {SceneComponent && <SceneComponent key={currentSceneKey} />}
        </AnimatePresence>
      </div>
    </div>
  );
}