import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useVideoPlayer } from '@/lib/video';
import { Scene1 } from './video_scenes/Scene1';
import { Scene2 } from './video_scenes/Scene2';
import { Scene3 } from './video_scenes/Scene3';
import { Scene4 } from './video_scenes/Scene4';
import { Scene5 } from './video_scenes/Scene5';

export const SCENE_DURATIONS = {
  open: 5000,
  features: 4500,
  team: 4000,
  disclaimer: 3500,
  close: 4000,
};

const SCENE_COMPONENTS: Record<string, React.ComponentType> = {
  open: Scene1,
  features: Scene2,
  team: Scene3,
  disclaimer: Scene4,
  close: Scene5,
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
  const sceneIndex = Object.keys(SCENE_DURATIONS).indexOf(baseSceneKey);
  const SceneComponent = SCENE_COMPONENTS[baseSceneKey];

  return (
    <div className="relative w-full h-screen overflow-hidden bg-bg-dark font-sans text-text-primary">
      {/* Persistent Background Effects */}
      <div className="absolute inset-0 pointer-events-none">
        <motion.div
          className="absolute w-[60vw] h-[60vw] rounded-full blur-[100px] opacity-20"
          style={{ background: 'radial-gradient(circle, var(--color-primary), transparent 70%)' }}
          animate={{
            x: ['-20%', '10%', '-5%'],
            y: ['-10%', '30%', '10%'],
            scale: [1, 1.2, 0.9]
          }}
          transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute w-[80vw] h-[80vw] rounded-full blur-[120px] opacity-30 right-0 bottom-0"
          style={{ background: 'radial-gradient(circle, var(--color-bg-muted), transparent 70%)' }}
          animate={{
            x: ['10%', '-20%', '5%'],
            y: ['10%', '-10%', '20%']
          }}
          transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>

      {/* Persistent Graphic Elements */}
      <motion.div
        className="absolute w-px bg-primary/30"
        animate={{
          left: ['10vw', '15vw', '8vw', '50vw', '10vw'][sceneIndex],
          height: ['100vh', '80vh', '120vh', '0vh', '100vh'][sceneIndex],
          top: ['0vh', '10vh', '-10vh', '50vh', '0vh'][sceneIndex],
          opacity: sceneIndex === 3 ? 0 : 1
        }}
        transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
      />
      <motion.div
        className="absolute h-px bg-primary/30"
        animate={{
          top: ['80vh', '85vh', '70vh', '50vh', '80vh'][sceneIndex],
          width: ['100vw', '120vw', '80vw', '0vw', '100vw'][sceneIndex],
          left: ['0vw', '-10vw', '10vw', '50vw', '0vw'][sceneIndex],
          opacity: sceneIndex === 3 ? 0 : 1
        }}
        transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
      />

      <AnimatePresence mode="popLayout">
        {SceneComponent && <SceneComponent key={currentSceneKey} />}
      </AnimatePresence>
    </div>
  );
}
