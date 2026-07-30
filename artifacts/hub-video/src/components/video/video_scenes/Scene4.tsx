import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';

export function Scene4() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 200),
      setTimeout(() => setPhase(2), 700),
      setTimeout(() => setPhase(3), 1400),
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  return (
    <motion.div 
      className="absolute inset-0 bg-[#f5c518]"
      style={{ clipPath: phase >= 1 ? 'circle(150% at 50% 50%)' : 'circle(0% at 50% 50%)' }}
      transition={{ duration: 1.2, ease: [0.65, 0, 0.35, 1] }}
    >
      <div className="absolute inset-0 bg-gradient-to-tr from-[#050505] via-[#1A1A1A] to-[#2A2A2A] z-0" />
      
      <div className="absolute inset-0 flex items-center px-[10vw] z-10">
        
        {/* Left Side: Visual Shield */}
        <div className="w-[40%] flex items-center justify-center relative">
          <motion.img 
            src={`${import.meta.env.BASE_URL}images/elderly-care.png`}
            className="w-[80%] object-contain drop-shadow-[0_0_50px_rgba(245,197,24,0.6)] mix-blend-screen"
            initial={{ scale: 0.5, opacity: 0, filter: 'blur(20px)' }}
            animate={phase >= 2 ? { scale: 1, opacity: 1, filter: 'blur(0px)' } : { scale: 0.5, opacity: 0, filter: 'blur(20px)' }}
            transition={{ duration: 1, ease: "easeOut" }}
          />
          <motion.div 
            className="absolute inset-0 border-[2px] border-[#f5c518]/30 rounded-full"
            initial={{ scale: 0, opacity: 0 }}
            animate={phase >= 2 ? { scale: [1, 1.5], opacity: [0.8, 0] } : { scale: 0, opacity: 0 }}
            transition={{ duration: 2.5, repeat: Infinity, ease: "easeOut" }}
          />
        </div>

        {/* Right Side: Copy */}
        <div className="w-[60%] pl-[8vw]">
          <motion.div 
            className="inline-flex items-center gap-3 px-4 py-2 rounded-full border border-[#f5c518] bg-[#f5c518]/10 text-[#f5c518] font-mono text-[1vw] mb-6 tracking-widest uppercase"
            initial={{ opacity: 0, y: 20 }}
            animate={phase >= 2 ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 0.5 }}
          >
            <span className="w-2 h-2 bg-[#f5c518] rounded-full" />
            Safety & Protection
          </motion.div>

          <motion.h2 
            className="font-display font-bold text-[5.5vw] leading-[1.05] mb-6"
            initial={{ opacity: 0, x: 50 }}
            animate={phase >= 3 ? { opacity: 1, x: 0 } : { opacity: 0, x: 50 }}
            transition={{ type: 'spring', stiffness: 200, damping: 25 }}
          >
            The Geriatric Pack
          </motion.h2>

          <motion.div 
            className="space-y-4"
            initial={{ opacity: 0 }}
            animate={phase >= 3 ? { opacity: 1 } : { opacity: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <p className="text-[1.8vw] text-white/80 border-l-4 border-[#f5c518] pl-6">
              Advanced safety features designed for cognitive impairment.
            </p>
            <p className="text-[1.4vw] text-white/50 pl-[28px] max-w-[40vw]">
              Provide peace of mind for the elderly and their families through continuous, gentle monitoring.
            </p>
          </motion.div>
        </div>

      </div>
    </motion.div>
  );
}