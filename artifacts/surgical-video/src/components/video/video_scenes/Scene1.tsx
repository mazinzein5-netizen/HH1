import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

export function Scene1() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 500),
      setTimeout(() => setPhase(2), 1500),
      setTimeout(() => setPhase(3), 4000), // Exiting
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  return (
    <motion.div
      className="absolute inset-0 flex flex-col justify-center px-[10vw]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.1, filter: 'blur(10px)' }}
      transition={{ duration: 1 }}
    >
      <div className="absolute inset-0 -z-10">
        <video
          src={`${import.meta.env.BASE_URL}videos/surgery-bg.mp4`}
          className="w-full h-full object-cover opacity-40"
          autoPlay
          muted
          playsInline
        />
        <div className="absolute inset-0 bg-gradient-to-r from-bg-dark via-bg-dark/80 to-transparent" />
      </div>

      <motion.div
        initial={{ opacity: 0, x: -50 }}
        animate={phase >= 1 ? { opacity: 1, x: 0 } : { opacity: 0, x: -50 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="flex items-center gap-4 mb-6"
      >
        <div className="w-12 h-12 bg-primary/20 border border-primary/40 rounded-xl flex items-center justify-center">
          <div className="w-6 h-6 bg-primary rounded-sm clip-hexagon" />
        </div>
        <span className="text-xl font-bold tracking-[0.2em] text-primary uppercase">
          Health Hive Ecosystem
        </span>
      </motion.div>

      <motion.h1
        className="text-[6vw] font-display font-bold leading-[1.1] text-white max-w-[50vw]"
        initial={{ opacity: 0, y: 30 }}
        animate={phase >= 2 ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
        transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
      >
        HIVE HOSPITAL<br />
        <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">
          Surgical Assistant
        </span>
      </motion.h1>

      <motion.div
        className="absolute bottom-[10vh] left-[10vw] w-24 h-1 bg-primary"
        initial={{ scaleX: 0, originX: 0 }}
        animate={phase >= 2 ? { scaleX: 1 } : { scaleX: 0 }}
        transition={{ duration: 0.8, delay: 0.5, ease: 'easeInOut' }}
      />
    </motion.div>
  );
}