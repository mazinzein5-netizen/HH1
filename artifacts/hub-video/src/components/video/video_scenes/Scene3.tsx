import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';

export function Scene3() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 100),
      setTimeout(() => setPhase(2), 600),
      setTimeout(() => setPhase(3), 1200),
      setTimeout(() => setPhase(4), 1800),
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  return (
    <motion.div 
      className="absolute inset-0"
      initial={{ opacity: 0, scale: 1.1, y: '10%' }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, y: '-10%', filter: 'blur(10px)' }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="absolute inset-0 flex flex-col items-center justify-center px-[10vw]">
        
        {/* Top: Copy */}
        <div className="text-center mb-[8vh] z-20">
          <motion.h2 
            className="font-display font-bold text-[5vw] leading-none mb-4"
            initial={{ opacity: 0, y: 20 }}
            animate={phase >= 1 ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          >
            Pair Smart Devices
          </motion.h2>
          <motion.p 
            className="text-[1.8vw] text-white/70 max-w-[50vw] mx-auto"
            initial={{ opacity: 0 }}
            animate={phase >= 2 ? { opacity: 1 } : { opacity: 0 }}
            transition={{ duration: 0.6 }}
          >
            Vitals and monitoring data sync automatically.
          </motion.p>
        </div>

        {/* Center: Image & Rings */}
        <div className="relative w-full h-[40vh] flex items-center justify-center z-10">
          {/* Signal Rings */}
          {[1, 2, 3].map((ring) => (
            <motion.div
              key={ring}
              className="absolute w-[10vw] h-[10vw] rounded-full border border-[#f5c518]"
              initial={{ scale: 0, opacity: 0 }}
              animate={phase >= 3 ? { 
                scale: [0.5, 3 + ring], 
                opacity: [0.5, 0] 
              } : { scale: 0, opacity: 0 }}
              transition={{ 
                duration: 3, 
                repeat: Infinity, 
                delay: ring * 0.8,
                ease: "easeOut"
              }}
            />
          ))}

          {/* Generated Image */}
          <motion.img 
            src={`${import.meta.env.BASE_URL}images/smart-devices.png`}
            className="absolute h-[50vh] object-contain drop-shadow-[0_20px_40px_rgba(0,0,0,0.8)] z-10"
            initial={{ scale: 0.8, opacity: 0, rotate: 5 }}
            animate={phase >= 3 ? { 
              scale: 1, 
              opacity: 1, 
              rotate: 0,
              y: [0, -10, 0]
            } : { scale: 0.8, opacity: 0, rotate: 5 }}
            transition={{ 
              opacity: { duration: 0.6 },
              scale: { type: 'spring', bounce: 0.4 },
              rotate: { duration: 0.8 },
              y: { duration: 4, repeat: Infinity, ease: 'easeInOut' }
            }}
          />

          {/* Data Callouts */}
          <motion.div 
            className="absolute left-[15vw] glass-panel-gold px-6 py-3 rounded-full flex items-center gap-3"
            initial={{ opacity: 0, x: -50 }}
            animate={phase >= 4 ? { opacity: 1, x: 0 } : { opacity: 0, x: -50 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
          >
            <span className="w-3 h-3 rounded-full bg-[#f5c518] animate-pulse" />
            <span className="text-[1.2vw] font-mono tracking-wide">HR: 72 BPM</span>
          </motion.div>

          <motion.div 
            className="absolute right-[15vw] glass-panel px-6 py-3 rounded-full flex items-center gap-3 border border-white/20"
            initial={{ opacity: 0, x: 50 }}
            animate={phase >= 4 ? { opacity: 1, x: 0 } : { opacity: 0, x: 50 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25, delay: 0.2 }}
          >
            <span className="w-3 h-3 rounded-full bg-blue-400 animate-pulse" />
            <span className="text-[1.2vw] font-mono tracking-wide">SPO2: 98%</span>
          </motion.div>
        </div>

      </div>
    </motion.div>
  );
}