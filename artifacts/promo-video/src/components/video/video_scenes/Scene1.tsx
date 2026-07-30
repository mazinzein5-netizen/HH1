import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';

export function Scene1() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 100),
      setTimeout(() => setPhase(2), 800),
      setTimeout(() => setPhase(3), 1500),
      setTimeout(() => setPhase(4), 2200),
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  return (
    <motion.div 
      className="absolute inset-0 flex items-center justify-center overflow-hidden"
      initial={{ opacity: 0, scale: 1.05 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 1.05 }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
    >
      {/* Background Image Layer */}
      <motion.div 
        className="absolute inset-0"
        initial={{ opacity: 0, scale: 1.1 }}
        animate={{ opacity: 0.3, scale: 1 }}
        transition={{ duration: 15, ease: 'linear' }}
      >
        <img 
          src={`${import.meta.env.BASE_URL}images/carer-records.jpg`} 
          alt="" 
          className="w-full h-full object-cover" 
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[var(--color-bg-dark)] via-[var(--color-bg-dark)]/80 to-[var(--color-bg-dark)]/40" />
      </motion.div>

      <div className="w-[80vw] mx-auto text-left relative z-10 flex flex-col items-start px-[10vw]">
        
        {/* Main Headline */}
        <motion.h1 
          className="text-[6vw] font-display font-bold leading-[1.1] text-white tracking-tight"
        >
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          >
            Your health records,
          </motion.div>
          <motion.div
            className="text-[var(--color-primary)] font-light italic mt-[1vw]"
            initial={{ opacity: 0, x: -40 }}
            animate={phase >= 2 ? { opacity: 1, x: 0 } : { opacity: 0, x: -40 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          >
            organised.
          </motion.div>
        </motion.h1>

        {/* Subline */}
        <motion.p 
          className="mt-[3vw] text-[2vw] text-[var(--color-text-secondary)] font-body max-w-[40vw] leading-relaxed"
          initial={{ opacity: 0, y: 20 }}
          animate={phase >= 3 ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        >
          A private, secure organiser for older adults in Ireland.
        </motion.p>
        
        {/* Hexagon Accents */}
        {phase >= 4 && (
          <motion.div 
            className="absolute top-1/2 right-[10vw] -translate-y-1/2 w-[30vw] h-[30vw] border-[2px] border-[var(--color-primary)] opacity-40 clip-hexagon pointer-events-none"
            initial={{ scale: 0.5, opacity: 0, rotate: -30 }}
            animate={{ scale: 1, opacity: 0.4, rotate: 0 }}
            transition={{ duration: 2, type: 'spring', bounce: 0.4 }}
          />
        )}
      </div>
    </motion.div>
  );
}