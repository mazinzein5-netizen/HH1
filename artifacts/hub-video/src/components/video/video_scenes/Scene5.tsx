import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';

export function Scene5() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 300),
      setTimeout(() => setPhase(2), 1200),
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  return (
    <motion.div 
      className="absolute inset-0 flex flex-col items-center justify-center bg-[#050505]"
      initial={{ opacity: 0, scale: 1.2 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9, filter: 'blur(20px)' }}
      transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
    >
      {/* Background Flare */}
      <div className="absolute inset-0 flex items-center justify-center opacity-40 mix-blend-screen pointer-events-none">
         <motion.div
           className="w-[80vw] h-[80vw] rounded-full blur-[150px]"
           style={{ background: 'radial-gradient(circle, rgba(245,197,24,0.4) 0%, transparent 60%)' }}
           animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.8, 0.5] }}
           transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
         />
      </div>

      {/* Hex Logo Lockup */}
      <motion.div 
        className="relative z-10 flex flex-col items-center"
        initial={{ y: 50, opacity: 0 }}
        animate={phase >= 1 ? { y: 0, opacity: 1 } : { y: 50, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 200, damping: 20 }}
      >
        <div className="w-[12vw] h-[13.85vw] relative flex items-center justify-center mb-8">
          <svg viewBox="0 0 100 115" className="absolute inset-0 w-full h-full drop-shadow-[0_0_40px_rgba(245,197,24,0.8)]">
            <polygon points="50,2.5 95,28.5 95,86.5 50,112.5 5,86.5 5,28.5" fill="#f5c518" />
          </svg>
          <span className="text-black font-display font-black text-[3vw] z-10">H</span>
        </div>

        <motion.h1 
          className="font-display font-bold text-[7vw] tracking-tighter leading-none"
          initial={{ clipPath: 'inset(0 100% 0 0)' }}
          animate={phase >= 2 ? { clipPath: 'inset(0 0% 0 0)' } : { clipPath: 'inset(0 100% 0 0)' }}
          transition={{ duration: 0.8, ease: "circOut" }}
        >
          Health <span className="text-[#f5c518]">HIVE</span>
        </motion.h1>

        <motion.p
          className="text-[2vw] text-white/60 tracking-widest mt-6 font-light uppercase"
          initial={{ opacity: 0, y: 10 }}
          animate={phase >= 2 ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          Your Health, Connected.
        </motion.p>
      </motion.div>
    </motion.div>
  );
}