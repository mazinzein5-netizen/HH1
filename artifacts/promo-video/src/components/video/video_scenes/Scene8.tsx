import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';

// Hexagon SVG helper
const Hexagon = ({ size, color, opacity = 1, className = "" }: { size: number, color: string, opacity?: number, className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} style={{ opacity }}>
    <path d="M60 10 L103.3 35 L103.3 85 L60 110 L16.7 85 L16.7 35 Z" fill={color} />
  </svg>
);

export function Scene8() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 300),
      setTimeout(() => setPhase(2), 1000),
      setTimeout(() => setPhase(3), 1800),
      setTimeout(() => setPhase(4), 2600),
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  return (
    <motion.div 
      className="absolute inset-0 flex flex-col items-center justify-center bg-[var(--color-bg-dark)] z-50 overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="relative w-[15vw] h-[15vw] mb-[2vw]">
        <motion.div
          initial={{ opacity: 0, scale: 0, y: 50 }}
          animate={phase >= 1 ? { opacity: 1, scale: 1, y: 0 } : { opacity: 0, scale: 0, y: 50 }}
          transition={{ duration: 1, type: "spring", bounce: 0.4 }}
        >
          <Hexagon size={400} color="var(--color-primary)" className="absolute w-[60%] h-[60%] top-0 left-1/2 -translate-x-1/2" />
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, scale: 0, x: -50 }}
          animate={phase >= 2 ? { opacity: 1, scale: 1, x: 0 } : { opacity: 0, scale: 0, x: -50 }}
          transition={{ duration: 1, type: "spring", bounce: 0.4 }}
        >
          <Hexagon size={400} color="var(--color-accent)" className="absolute w-[60%] h-[60%] bottom-0 left-0" />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0, x: 50 }}
          animate={phase >= 3 ? { opacity: 1, scale: 1, x: 0 } : { opacity: 0, scale: 0, x: 50 }}
          transition={{ duration: 1, type: "spring", bounce: 0.4 }}
        >
          <Hexagon size={400} color="var(--color-secondary)" className="absolute w-[60%] h-[60%] bottom-0 right-0" />
        </motion.div>
      </div>

      <motion.h1 
        className="text-[4.5vw] font-display font-bold text-white tracking-widest uppercase"
        initial={{ opacity: 0, y: 20 }}
        animate={phase >= 4 ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
        transition={{ duration: 0.8 }}
      >
        HIVE COMPANION
      </motion.h1>
      
      <motion.p
        className="text-[1.8vw] text-[var(--color-text-secondary)] mt-[1vw]"
        initial={{ opacity: 0, y: 20 }}
        animate={phase >= 4 ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
        transition={{ duration: 0.8, delay: 0.2 }}
      >
        Your health records, organised.
      </motion.p>
      
      <motion.div
        className="absolute bottom-[5vw] flex flex-col items-center gap-[1vw]"
        initial={{ opacity: 0, y: 20 }}
        animate={phase >= 4 ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
        transition={{ duration: 0.8, delay: 0.6 }}
      >
        <div className="w-[15vw] h-[1px] bg-white/20 mb-[1vw]" />
        <p className="text-[1.2vw] text-[var(--color-text-muted)] font-medium">
          Not a medical device. Data stays on your device.
        </p>
      </motion.div>
    </motion.div>
  );
}
