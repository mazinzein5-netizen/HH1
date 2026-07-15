import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';

export function Scene2() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 300),
      setTimeout(() => setPhase(2), 800),
      setTimeout(() => setPhase(3), 1600),
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  return (
    <motion.div 
      className="absolute inset-0"
      initial={{ opacity: 0, x: '20%' }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: '-20%', filter: 'blur(10px)' }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="absolute inset-0 flex items-center px-[10vw]">
        
        {/* Left Side: Copy */}
        <div className="w-1/2 z-10 pr-[5vw]">
          <motion.div 
            className="w-12 h-1 bg-[#f5c518] mb-6"
            initial={{ scaleX: 0, originX: 0 }}
            animate={phase >= 1 ? { scaleX: 1 } : { scaleX: 0 }}
            transition={{ duration: 0.6, ease: "circOut" }}
          />
          <motion.h2 
            className="font-display font-bold text-[5vw] leading-[1.1] mb-6"
            initial={{ opacity: 0, y: 30 }}
            animate={phase >= 2 ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          >
            Seamlessly Send & Receive
          </motion.h2>
          <motion.p 
            className="text-[1.8vw] text-white/70"
            initial={{ opacity: 0 }}
            animate={phase >= 3 ? { opacity: 1 } : { opacity: 0 }}
            transition={{ duration: 0.6 }}
          >
            Prescriptions route instantly from doctors to your local pharmacy.
          </motion.p>
        </div>

        {/* Right Side: Visual */}
        <div className="w-1/2 h-[60vh] relative z-10 flex items-center justify-center">
          
          {/* Glass Panel Hub */}
          <motion.div 
            className="glass-panel w-[25vw] h-[30vh] rounded-3xl absolute flex flex-col items-center justify-center"
            initial={{ scale: 0.8, opacity: 0, rotateY: 30 }}
            animate={phase >= 1 ? { scale: 1, opacity: 1, rotateY: 0 } : { scale: 0.8, opacity: 0, rotateY: 30 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <div className="text-[1.2vw] text-[#f5c518] font-mono tracking-widest mb-4">RX ROUTING</div>
            <div className="w-[10vw] h-[2px] bg-white/10 rounded-full overflow-hidden">
              <motion.div 
                className="h-full bg-[#f5c518]"
                initial={{ x: '-100%' }}
                animate={{ x: '100%' }}
                transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
              />
            </div>
          </motion.div>

          {/* Floating Pill/Rx Cards */}
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="absolute glass-panel-gold w-[12vw] p-4 rounded-xl shadow-2xl flex items-center gap-3"
              style={{
                top: i === 0 ? '10%' : i === 1 ? '70%' : '40%',
                left: i === 0 ? '-10%' : i === 1 ? '10%' : '75%',
              }}
              initial={{ opacity: 0, scale: 0, y: 50 }}
              animate={phase >= 2 ? { 
                opacity: 1, 
                scale: 1, 
                y: [0, -10, 0],
                x: [0, i % 2 === 0 ? 10 : -10, 0]
              } : { opacity: 0, scale: 0, y: 50 }}
              transition={{ 
                opacity: { duration: 0.4, delay: i * 0.15 },
                scale: { type: 'spring', delay: i * 0.15 },
                y: { duration: 4, repeat: Infinity, ease: 'easeInOut', delay: i * 0.5 },
                x: { duration: 5, repeat: Infinity, ease: 'easeInOut', delay: i * 0.3 }
              }}
            >
              <div className="w-8 h-8 rounded-full bg-[#f5c518]/20 flex items-center justify-center text-[#f5c518]">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.5 20.5 19 12a4.95 4.95 0 1 0-7-7L3.5 13.5a4.95 4.95 0 1 0 7 7Z"/><path d="m8.5 8.5 7 7"/></svg>
              </div>
              <div>
                <div className="h-2 w-12 bg-white/20 rounded mb-2" />
                <div className="h-2 w-8 bg-[#f5c518]/50 rounded" />
              </div>
            </motion.div>
          ))}

        </div>
      </div>
    </motion.div>
  );
}