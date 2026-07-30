import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

export function Scene4() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 400),
      setTimeout(() => setPhase(2), 2500),
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  return (
    <motion.div
      className="absolute inset-0 flex items-center justify-center bg-bg-dark"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, y: '-10%' }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(245,197,24,0.05),transparent_50%)]" />

      <motion.div
        className="glass-panel border-primary/40 p-[4vw] rounded-[3vw] text-center max-w-[70vw] shadow-[0_0_60px_rgba(245,197,24,0.05)]"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={phase >= 1 ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.9 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="w-16 h-16 mx-auto mb-8 bg-primary/10 rounded-full flex items-center justify-center border border-primary/30">
          <div className="w-8 h-8 rounded-full bg-primary/20 animate-pulse" />
        </div>
        
        <h3 className="text-[3vw] font-display font-bold text-white mb-4">
          AI Decision Support
        </h3>
        <p className="text-[2vw] text-primary font-medium tracking-wide">
          Verify All Output Clinically.
        </p>
      </motion.div>
    </motion.div>
  );
}