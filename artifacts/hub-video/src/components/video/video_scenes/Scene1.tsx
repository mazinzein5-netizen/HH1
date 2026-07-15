import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';

export function Scene1() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 200),
      setTimeout(() => setPhase(2), 800),
      setTimeout(() => setPhase(3), 1500),
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  return (
    <motion.div 
      className="absolute inset-0 flex items-center justify-center"
      initial={{ opacity: 0, scale: 1.1 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, filter: 'blur(20px)', scale: 1.2 }}
      transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="relative flex flex-col items-center z-10 w-full px-[10vw]">
        
        {/* Core Hexagon Motif */}
        <motion.div
          className="relative w-[15vw] h-[17.32vw] mb-12 flex items-center justify-center"
          initial={{ scale: 0, rotate: -30, opacity: 0 }}
          animate={phase >= 1 ? { scale: 1, rotate: 0, opacity: 1 } : { scale: 0, rotate: -30, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 200, damping: 20 }}
        >
          <svg viewBox="0 0 100 115" className="absolute inset-0 w-full h-full drop-shadow-[0_0_30px_rgba(245,197,24,0.5)]">
            <polygon points="50,2.5 95,28.5 95,86.5 50,112.5 5,86.5 5,28.5" fill="rgba(245,197,24,0.1)" stroke="#f5c518" strokeWidth="2" />
            <polygon points="50,15 80,32 80,82 50,100 20,82 20,32" fill="none" stroke="#f5c518" strokeWidth="1" strokeDasharray="4 4" />
          </svg>
          <motion.div 
            className="w-[4vw] h-[4vw] bg-[#f5c518] rounded-full blur-[20px]"
            animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        </motion.div>

        <motion.h1 
          className="font-display font-bold text-[6vw] tracking-tight leading-none text-center"
          initial={{ y: 40, opacity: 0, rotateX: 30 }}
          animate={phase >= 2 ? { y: 0, opacity: 1, rotateX: 0 } : { y: 40, opacity: 0, rotateX: 30 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        >
          One Unified <span className="text-[#f5c518]">HIVE</span>
        </motion.h1>

        <motion.p 
          className="mt-6 text-[2vw] text-[#A1A1AA] font-light max-w-[50vw] text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={phase >= 3 ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        >
          The central hub for your entire healthcare ecosystem.
        </motion.p>
      </div>
    </motion.div>
  );
}