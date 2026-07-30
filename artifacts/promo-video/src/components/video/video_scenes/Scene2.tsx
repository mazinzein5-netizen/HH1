import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';

export function Scene2() {
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
          src={`${import.meta.env.BASE_URL}images/knee-pain.jpg`} 
          alt="" 
          className="w-full h-full object-cover" 
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[var(--color-bg-dark)] via-[var(--color-bg-dark)]/90 to-[var(--color-bg-dark)]/60" />
      </motion.div>

      {/* Left side text */}
      <div className="w-[45vw] flex flex-col items-start text-left z-10">
        <motion.div
          className="px-[1.5vw] py-[0.5vw] bg-[var(--color-bg-muted)]/80 backdrop-blur-sm border border-[var(--color-secondary)]/40 rounded-full text-[var(--color-secondary)] text-[1vw] font-bold tracking-widest uppercase mb-[2vw]"
          initial={{ opacity: 0, y: 20 }}
          animate={phase >= 1 ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6 }}
        >
          Hears your chronic pains
        </motion.div>

        <motion.h2 
          className="text-[4vw] font-display font-bold text-white leading-[1.1] tracking-tight drop-shadow-xl"
          initial={{ opacity: 0, y: 30 }}
          animate={phase >= 2 ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        >
          Osteoarthritis <br/>
          <span className="text-[var(--color-primary)]">Knee & Hip</span>
        </motion.h2>

        <motion.p 
          className="text-[1.8vw] text-[var(--color-text-secondary)] mt-[2vw] leading-relaxed max-w-[40vw] drop-shadow-md"
          initial={{ opacity: 0, y: 20 }}
          animate={phase >= 3 ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.8 }}
        >
          Build an objective record with standardised questionnaires (Oxford Hip & Knee, ODI) to share with your GP.
        </motion.p>
      </div>

      {/* Right side UI mockup/graphic */}
      <div className="w-[35vw] h-[70vh] relative z-10 flex items-center justify-center">
        <motion.div 
          className="w-full h-[60vh] bg-[var(--color-bg-muted)]/80 backdrop-blur-xl border-[1px] border-white/20 rounded-3xl shadow-2xl overflow-hidden relative flex flex-col items-center justify-center p-[2vw]"
          initial={{ opacity: 0, y: 50, rotateY: 20 }}
          animate={phase >= 2 ? { opacity: 1, y: 0, rotateY: 0 } : { opacity: 0, y: 50, rotateY: 20 }}
          transition={{ duration: 1, type: "spring", bounce: 0.2 }}
        >
           <motion.div
             className="w-[12vw] h-[12vw] rounded-full border-[0.5vw] border-[var(--color-primary)]/30 flex items-center justify-center relative mb-[2vw]"
             initial={{ scale: 0 }}
             animate={phase >= 3 ? { scale: 1 } : { scale: 0 }}
           >
             <div className="absolute inset-[0.5vw] rounded-full border-[0.5vw] border-[var(--color-primary)] border-r-transparent animate-spin-slow"></div>
             <div className="text-[var(--color-primary)] font-bold text-[3vw]">ODI</div>
           </motion.div>
           <motion.div
             className="w-[80%] h-[1.5vw] bg-white/10 rounded-full mb-[1vw]"
             initial={{ scaleX: 0 }}
             animate={phase >= 4 ? { scaleX: 1 } : { scaleX: 0 }}
             style={{ originX: 0 }}
           />
           <motion.div
             className="w-[60%] h-[1.5vw] bg-white/10 rounded-full"
             initial={{ scaleX: 0 }}
             animate={phase >= 4 ? { scaleX: 1 } : { scaleX: 0 }}
             style={{ originX: 0 }}
             transition={{ delay: 0.2 }}
           />
        </motion.div>
      </div>
    </motion.div>
  );
}
