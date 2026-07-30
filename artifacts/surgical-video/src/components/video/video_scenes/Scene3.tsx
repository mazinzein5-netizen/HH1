import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

export function Scene3() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 300),
      setTimeout(() => setPhase(2), 800),
      setTimeout(() => setPhase(3), 3000),
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  return (
    <motion.div
      className="absolute inset-0 flex items-center justify-center"
      initial={{ opacity: 0, scale: 1.1 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9, filter: 'blur(10px)' }}
      transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="absolute inset-0 -z-10">
        <img
          src={`${import.meta.env.BASE_URL}images/team.png`}
          alt="Medical Team"
          className="w-full h-full object-cover opacity-50"
        />
        <div className="absolute inset-0 bg-bg-dark/60 mix-blend-multiply" />
        <div className="absolute inset-0 bg-gradient-to-t from-bg-dark via-transparent to-bg-dark/40" />
      </div>

      <div className="text-center max-w-[60vw]">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={phase >= 1 ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="inline-block px-6 py-2 glass-panel rounded-full text-primary font-bold tracking-[0.2em] text-sm uppercase mb-8">
            Clinical Unit Synergy
          </div>
        </motion.div>

        <motion.h2
          className="text-[5vw] font-display font-bold leading-tight mb-8 text-white"
          initial={{ opacity: 0, y: 30 }}
          animate={phase >= 2 ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        >
          Built for <br/>
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-white">
            Clinical Teams
          </span>
        </motion.h2>

        <motion.p
          className="text-[1.8vw] text-text-secondary mx-auto max-w-[80%]"
          initial={{ opacity: 0 }}
          animate={phase >= 2 ? { opacity: 1 } : { opacity: 0 }}
          transition={{ duration: 1, delay: 0.4 }}
        >
          Organize patient files and collaborate seamlessly tailored to your local healthcare system.
        </motion.p>
      </div>

      <motion.div
        className="absolute right-[15vw] top-[30vh] w-32 h-32 border border-primary/20 rounded-full"
        animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
      />
    </motion.div>
  );
}