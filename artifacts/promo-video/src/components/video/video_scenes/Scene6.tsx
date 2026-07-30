import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';

export function Scene6() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 200),
      setTimeout(() => setPhase(2), 800),
      setTimeout(() => setPhase(3), 1600),
      setTimeout(() => setPhase(4), 2200),
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  return (
    <motion.div 
      className="absolute inset-0 flex items-center justify-center"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, y: -50 }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
    >
      {/* Background Image Layer */}
      <motion.div 
        className="absolute inset-0 -z-10"
        initial={{ opacity: 0, scale: 1.1 }}
        animate={{ opacity: 0.2, scale: 1 }}
        transition={{ duration: 15, ease: 'linear' }}
      >
        <img 
          src={`${import.meta.env.BASE_URL}images/medication.jpg`} 
          alt="" 
          className="w-full h-full object-cover" 
        />
        <div className="absolute inset-0 bg-[var(--color-bg-dark)]/80" />
      </motion.div>

      <div className="w-[70vw] mx-auto text-center relative z-10 flex flex-col items-center">
        
        <motion.div
          className="px-[1.5vw] py-[0.5vw] bg-[var(--color-bg-muted)]/80 backdrop-blur-sm border border-white/20 rounded-full text-white/80 text-[1vw] font-bold tracking-widest uppercase mb-[3vw]"
          initial={{ opacity: 0, y: 20 }}
          animate={phase >= 1 ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6 }}
        >
          Digital Streamlining
        </motion.div>

        <motion.h2 
          className="text-[4.5vw] font-display font-bold leading-[1.1] text-white tracking-tight"
        >
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={phase >= 2 ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          >
            Safe Prescription Records
          </motion.div>
        </motion.h2>

        <motion.p 
          className="mt-[2vw] text-[2.2vw] text-[var(--color-text-secondary)] font-body max-w-[50vw] leading-relaxed"
          initial={{ opacity: 0, y: 20 }}
          animate={phase >= 3 ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        >
          Keep a comprehensive medication list on your device. Ready to share when needed.
        </motion.p>
      </div>
    </motion.div>
  );
}
