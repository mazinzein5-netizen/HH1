import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

export function Scene5() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 500),
      setTimeout(() => setPhase(2), 1200),
      setTimeout(() => setPhase(3), 3200),
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  return (
    <motion.div
      className="absolute inset-0 flex flex-col items-center justify-center"
      initial={{ opacity: 0, scale: 1.2 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="absolute inset-0 -z-10 bg-bg-dark">
        <motion.div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `radial-gradient(circle at center, var(--color-primary) 0%, transparent 40%)`,
          }}
          animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0.3, 0.1] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={phase >= 1 ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
        transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
        className="relative w-[15vw] h-[15vw] mb-8"
      >
        <img
          src={`${import.meta.env.BASE_URL}images/hexagon.png`}
          alt="Hive Hexagon"
          className="w-full h-full object-contain"
        />
      </motion.div>

      <motion.div
        className="text-center"
        initial={{ opacity: 0, y: 30 }}
        animate={phase >= 2 ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="text-[2vw] font-bold tracking-[0.3em] text-text-secondary uppercase mb-4">
          HIVE Hospital
        </div>
        <div className="text-[4.5vw] font-display font-bold text-white tracking-tight">
          Surgical Assistant
        </div>
      </motion.div>
    </motion.div>
  );
}