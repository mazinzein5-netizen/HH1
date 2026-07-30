import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';

export function Scene3() {
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
      className="absolute inset-0 flex items-center justify-between px-[10vw] flex-row-reverse"
      initial={{ opacity: 0, x: 100 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -100 }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
    >
      {/* Background Image Layer */}
      <motion.div 
        className="absolute inset-0 -z-10"
        initial={{ opacity: 0, scale: 1.1 }}
        animate={{ opacity: 0.3, scale: 1 }}
        transition={{ duration: 15, ease: 'linear' }}
      >
        <img 
          src={`${import.meta.env.BASE_URL}images/doctor-patient.jpg`} 
          alt="" 
          className="w-full h-full object-cover object-top" 
        />
        <div className="absolute inset-0 bg-gradient-to-l from-[var(--color-bg-dark)] via-[var(--color-bg-dark)]/90 to-[var(--color-bg-dark)]/40" />
      </motion.div>

      {/* Right side text */}
      <div className="w-[45vw] flex flex-col items-start text-left z-10">
        <motion.div
          className="px-[1.5vw] py-[0.5vw] bg-[var(--color-bg-muted)]/80 backdrop-blur-sm border border-[var(--color-secondary)]/40 rounded-full text-[var(--color-secondary)] text-[1vw] font-bold tracking-widest uppercase mb-[2vw]"
          initial={{ opacity: 0, y: 20 }}
          animate={phase >= 1 ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6 }}
        >
          Telemedicine
        </motion.div>

        <motion.h2 
          className="text-[4vw] font-display font-bold text-white leading-[1.1] tracking-tight drop-shadow-xl"
          initial={{ opacity: 0, y: 30 }}
          animate={phase >= 2 ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        >
          Video call your <br/>
          <span className="text-[var(--color-primary)]">healthcare professional</span>
        </motion.h2>

        <motion.p 
          className="text-[1.8vw] text-[var(--color-text-secondary)] mt-[2vw] leading-relaxed max-w-[40vw] drop-shadow-md"
          initial={{ opacity: 0, y: 20 }}
          animate={phase >= 3 ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.8 }}
        >
          Share a clear digital record of your health that you can easily understand.
        </motion.p>
      </div>

      {/* Left side graphic */}
      <div className="w-[35vw] h-[70vh] relative z-10 flex items-center justify-center">
        <motion.div 
          className="w-[20vw] h-[20vw] rounded-full border border-white/20 flex items-center justify-center relative overflow-hidden"
          initial={{ opacity: 0, scale: 0.8, rotate: -30 }}
          animate={phase >= 3 ? { opacity: 1, scale: 1, rotate: 0 } : { opacity: 0, scale: 0.8, rotate: -30 }}
          transition={{ duration: 1, type: "spring", bounce: 0.3 }}
        >
          <div className="absolute inset-0 bg-[var(--color-primary)]/20 blur-xl"></div>
          <svg className="w-[8vw] h-[8vw] text-white/80" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
        </motion.div>
      </div>
    </motion.div>
  );
}
