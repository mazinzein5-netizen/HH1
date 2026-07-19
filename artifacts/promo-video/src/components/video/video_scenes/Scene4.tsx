import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';

export function Scene4() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 200),
      setTimeout(() => setPhase(2), 800),
      setTimeout(() => setPhase(3), 1600),
      setTimeout(() => setPhase(4), 2400),
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  return (
    <motion.div 
      className="absolute inset-0 flex items-center justify-between px-[10vw]"
      initial={{ opacity: 0, x: 100 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -100 }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
    >
      {/* Background Image Layer */}
      <motion.div 
        className="absolute inset-0 -z-10"
        initial={{ opacity: 0, scale: 1.1 }}
        animate={{ opacity: 0.25, scale: 1 }}
        transition={{ duration: 15, ease: 'linear' }}
      >
        <img 
          src={`${import.meta.env.BASE_URL}images/adult-phone.jpg`} 
          alt="" 
          className="w-full h-full object-cover object-center" 
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[var(--color-bg-dark)] via-[var(--color-bg-dark)]/90 to-[var(--color-bg-dark)]/60" />
      </motion.div>

      {/* Left side text */}
      <div className="w-[45vw] flex flex-col items-start text-left z-10">
        <motion.div
          className="px-[1.5vw] py-[0.5vw] bg-[var(--color-bg-muted)]/80 backdrop-blur-sm border border-[var(--color-accent)]/40 rounded-full text-[var(--color-accent)] text-[1vw] font-bold tracking-widest uppercase mb-[2vw]"
          initial={{ opacity: 0, y: 20 }}
          animate={phase >= 1 ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6 }}
        >
          Device Connection
        </motion.div>

        <motion.h2 
          className="text-[4vw] font-display font-bold text-white leading-[1.1] tracking-tight drop-shadow-xl"
          initial={{ opacity: 0, y: 30 }}
          animate={phase >= 2 ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        >
          Stay closely <br/>
          <span className="text-[var(--color-accent)]">connected</span>
        </motion.h2>

        <motion.p 
          className="text-[1.8vw] text-[var(--color-text-secondary)] mt-[2vw] leading-relaxed max-w-[40vw] drop-shadow-md"
          initial={{ opacity: 0, y: 20 }}
          animate={phase >= 3 ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.8 }}
        >
          Geriatric pack connects with your health devices to keep track of a loved one's day-to-day health records together.
        </motion.p>
      </div>

      {/* Right side graphic */}
      <div className="w-[35vw] h-[70vh] relative z-10 flex items-center justify-center">
        <motion.div 
          className="w-[24vw] h-[24vw] border-[2px] border-[var(--color-accent)]/40 rounded-full relative flex items-center justify-center"
          initial={{ opacity: 0, scale: 0.8, rotate: -45 }}
          animate={phase >= 3 ? { opacity: 1, scale: 1, rotate: 0 } : { opacity: 0, scale: 0.8, rotate: -45 }}
          transition={{ duration: 1, type: "spring", bounce: 0.2 }}
        >
          <motion.div className="w-full h-full border border-[var(--color-accent)] rounded-full border-t-transparent animate-spin-slow absolute inset-0"></motion.div>
          <svg className="w-[8vw] h-[8vw] text-white/80" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </motion.div>
      </div>
    </motion.div>
  );
}
