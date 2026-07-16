import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useVideoPlayer } from '@/lib/video';
import { Scene1 } from './video_scenes/Scene1';
import { Scene2 } from './video_scenes/Scene2';
import { Scene3 } from './video_scenes/Scene3';
import { Scene4 } from './video_scenes/Scene4';
import { Scene5 } from './video_scenes/Scene5';

import geminiVideo from '@assets/gemini_generated_video_C4C07499_1784082950083.mp4';

// Slowed pacing: the 10s clip plays at 0.8x speed => 12.5s effective duration,
// spanning scenes 1-3 exactly (3100 + 5000 + 4400 = 12500ms).
export const SCENE_DURATIONS = {
  open: 4800,
  context: 3100,
  features: 5000,
  privacy: 4400,
  close: 4800,
};

const SCENE_COMPONENTS: Record<string, React.ComponentType> = {
  open: Scene1,
  context: Scene2,
  features: Scene3,
  privacy: Scene4,
  close: Scene5,
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
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    onSceneChange?.(currentSceneKey);
  }, [currentSceneKey, onSceneChange]);

  const baseSceneKey = currentSceneKey.replace(/_r[12]$/, '') as keyof typeof SCENE_DURATIONS;
  const sceneIndex = Object.keys(SCENE_DURATIONS).indexOf(baseSceneKey);
  const SceneComponent = SCENE_COMPONENTS[baseSceneKey];

  // Clip plays at 0.8x speed across scenes 1-3; reset when looping back to start
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.playbackRate = 0.8;
    if (sceneIndex === 0) {
      video.pause();
      video.currentTime = 0;
    } else if (sceneIndex === 1) {
      video.play().catch(() => {});
    }
  }, [sceneIndex]);

  return (
    <div
      className="w-full h-screen overflow-hidden relative"
      style={{ backgroundColor: 'var(--color-bg-dark)' }}
    >
      {/* Persistent Background Video */}
      <motion.div 
        className="absolute inset-0 flex items-center justify-center overflow-hidden"
        animate={{
          opacity: sceneIndex === 0 || sceneIndex === 4 ? 0 : 1,
          scale: sceneIndex === 1 ? 1 : sceneIndex === 2 ? 1.05 : sceneIndex === 3 ? 1.1 : 1.2,
          filter: sceneIndex === 3 ? 'blur(10px)' : 'blur(0px)',
        }}
        transition={{ duration: 1.5, ease: [0.25, 1, 0.5, 1] }}
      >
        <video 
          ref={videoRef}
          src={geminiVideo}
          className="w-full h-full object-cover opacity-60"
          muted
          playsInline
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#07070f] via-transparent to-[#07070f]/50" />
      </motion.div>

      {/* Background Graphic Elements */}
      <div className="absolute inset-0 pointer-events-none">
        <motion.div 
          className="absolute inset-0 opacity-30"
          style={{ background: 'radial-gradient(circle at 50% 50%, rgba(17, 17, 26, 0) 0%, var(--color-bg-dark) 100%)' }}
        />
        
        {/* Floating Hexagons */}
        <motion.div 
          className="absolute"
          animate={{
            x: ['-5vw', '15vw', '-10vw', '-5vw'],
            y: ['20vh', '10vh', '40vh', '20vh'],
            rotate: [0, 45, -15, 0],
            opacity: sceneIndex === 0 || sceneIndex === 4 ? 1 : 0.2,
          }}
          transition={{ duration: 20, repeat: Infinity, ease: 'linear', opacity: { duration: 1 } }}
        >
          <Hexagon size={400} color="var(--color-primary)" opacity={0.03} />
        </motion.div>
        
        <motion.div 
          className="absolute"
          animate={{
            x: ['70vw', '60vw', '80vw', '70vw'],
            y: ['50vh', '80vh', '40vh', '50vh'],
            rotate: [0, -60, 20, 0],
            opacity: sceneIndex === 0 || sceneIndex === 4 ? 1 : 0.1,
          }}
          transition={{ duration: 25, repeat: Infinity, ease: 'linear', opacity: { duration: 1 } }}
        >
          <Hexagon size={600} color="var(--color-secondary)" opacity={0.02} />
        </motion.div>

        {/* Dynamic Accent Lighting */}
        <motion.div
          className="absolute w-[800px] h-[800px] rounded-full blur-[120px] pointer-events-none"
          animate={{
            background: [
              'radial-gradient(circle, rgba(245, 197, 24, 0.08) 0%, transparent 70%)',
              'radial-gradient(circle, rgba(212, 160, 23, 0.05) 0%, transparent 70%)',
              'radial-gradient(circle, rgba(201, 134, 10, 0.08) 0%, transparent 70%)',
              'radial-gradient(circle, rgba(245, 197, 24, 0.08) 0%, transparent 70%)',
            ],
            x: ['10vw', '50vw', '30vw', '10vw'],
            y: ['10vh', '40vh', '60vh', '10vh'],
            scale: [1, 1.2, 0.8, 1],
            opacity: sceneIndex === 2 ? 0 : 1,
          }}
          transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut', opacity: { duration: 1 } }}
        />
      </div>

      {/* Persistent Logo Anchor */}
      <motion.div 
        className="absolute z-50 flex items-center gap-[1vw]"
        animate={{ 
          top: sceneIndex === 0 ? '64vh' : sceneIndex === 4 ? '82vh' : '4vw',
          left: sceneIndex === 0 ? '78vw' : sceneIndex === 4 ? '50vw' : '4vw',
          x: sceneIndex === 0 ? '-50%' : sceneIndex === 4 ? '-50%' : '0%',
          y: sceneIndex === 0 ? '-50%' : sceneIndex === 4 ? '-50%' : '0%',
          scale: sceneIndex === 0 ? 2.5 : sceneIndex === 4 ? 1.8 : 1,
        }}
        transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="relative w-[3vw] h-[3vw]">
          <Hexagon size={100} color="var(--color-primary)" className="absolute w-[60%] h-[60%] top-0 left-1/2 -translate-x-1/2" />
          <Hexagon size={100} color="var(--color-secondary)" className="absolute w-[60%] h-[60%] bottom-0 right-0" />
          <Hexagon size={100} color="var(--color-accent)" className="absolute w-[60%] h-[60%] bottom-0 left-0" />
        </div>
        <motion.span 
          className="text-white text-[1.5vw] font-display font-bold tracking-widest whitespace-nowrap"
          animate={{
            opacity: sceneIndex === 0 || sceneIndex === 4 ? 0 : 1,
            width: sceneIndex === 0 || sceneIndex === 4 ? 0 : 'auto',
          }}
          transition={{ duration: 0.8 }}
        >
          HEALTH HIVE
        </motion.span>
      </motion.div>

      {/* Scene Container */}
      <AnimatePresence mode="popLayout">
        {SceneComponent && <SceneComponent key={currentSceneKey} />}
      </AnimatePresence>
    </div>
  );
}
