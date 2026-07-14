import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useVideoPlayer } from '@/lib/video';
import { Scene1 } from './video_scenes/Scene1';
import { Scene2 } from './video_scenes/Scene2';
import { Scene3 } from './video_scenes/Scene3';
import { Scene4 } from './video_scenes/Scene4';
import { Scene5 } from './video_scenes/Scene5';
import { Scene6 } from './video_scenes/Scene6';
import { Scene7 } from './video_scenes/Scene7';
import { Scene8 } from './video_scenes/Scene8';

export const SCENE_DURATIONS = {
  open: 4500,
  pain: 5500,
  telemed: 5500,
  devices: 5500,
  security: 5000,
  meds: 5000,
  moments: 5500,
  close: 5000,
};

const SCENE_COMPONENTS: Record<string, React.ComponentType> = {
  open: Scene1,
  pain: Scene2,
  telemed: Scene3,
  devices: Scene4,
  security: Scene5,
  meds: Scene6,
  moments: Scene7,
  close: Scene8,
};

// Hexagon SVG helper
const Hexagon = ({ size, color, opacity = 1, className = "" }: { size: number, color: string, opacity?: number, className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} style={{ opacity }}>
    <path d="M60 10 L103.3 35 L103.3 85 L60 110 L16.7 85 L16.7 35 Z" fill={color} />
  </svg>
);

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
    <div
      className="w-full h-screen overflow-hidden relative"
      style={{ backgroundColor: 'var(--color-bg-dark)' }}
    >
      {/* Persistent Background Layer */}
      <div className="absolute inset-0 pointer-events-none">
        <motion.div 
          className="absolute inset-0 opacity-30"
          style={{ background: 'radial-gradient(circle at 50% 50%, var(--color-bg-muted) 0%, var(--color-bg-dark) 100%)' }}
        />
        
        {/* Floating Hexagons */}
        <motion.div 
          className="absolute"
          animate={{
            x: ['10vw', '15vw', '5vw', '10vw'],
            y: ['20vh', '10vh', '30vh', '20vh'],
            rotate: [0, 30, -15, 0],
          }}
          transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
        >
          <Hexagon size={200} color="var(--color-primary)" opacity={0.06} />
        </motion.div>
        
        <motion.div 
          className="absolute"
          animate={{
            x: ['80vw', '70vw', '85vw', '80vw'],
            y: ['60vh', '75vh', '50vh', '60vh'],
            rotate: [0, -45, 20, 0],
          }}
          transition={{ duration: 25, repeat: Infinity, ease: 'linear' }}
        >
          <Hexagon size={300} color="var(--color-secondary)" opacity={0.04} />
        </motion.div>

        {/* Dynamic Accent Lighting */}
        <motion.div
          className="absolute w-[800px] h-[800px] rounded-full blur-[120px] pointer-events-none"
          animate={{
            background: [
              'radial-gradient(circle, rgba(245, 197, 24, 0.08) 0%, transparent 70%)',
              'radial-gradient(circle, rgba(212, 160, 23, 0.08) 0%, transparent 70%)',
              'radial-gradient(circle, rgba(201, 134, 10, 0.08) 0%, transparent 70%)',
              'radial-gradient(circle, rgba(245, 197, 24, 0.08) 0%, transparent 70%)',
            ],
            x: ['10vw', '50vw', '20vw', '10vw'],
            y: ['10vh', '50vh', '30vh', '10vh'],
            scale: [1, 1.2, 0.8, 1],
          }}
          transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>

      {/* Persistent Animated Logo Mark */}
      <motion.div 
        className="absolute top-[4vw] left-[4vw] z-50 flex items-center gap-[1vw]"
        animate={{ opacity: sceneIndex === 7 ? 0 : 1 }}
      >
        <div className="relative w-[3vw] h-[3vw]">
          <Hexagon size={100} color="var(--color-primary)" className="absolute w-[60%] h-[60%] top-0 left-1/2 -translate-x-1/2" />
          <Hexagon size={100} color="var(--color-secondary)" className="absolute w-[60%] h-[60%] bottom-0 right-0" />
          <Hexagon size={100} color="var(--color-accent)" className="absolute w-[60%] h-[60%] bottom-0 left-0" />
        </div>
        <motion.span className="text-white text-[1.5vw] font-display font-semibold tracking-wider">HIVE COMPANION</motion.span>
      </motion.div>

      {/* Scene Container */}
      <AnimatePresence mode="popLayout">
        {SceneComponent && <SceneComponent key={currentSceneKey} />}
      </AnimatePresence>
    </div>
  );
}
