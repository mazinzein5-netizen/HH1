import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

export function Scene2() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 300),
      setTimeout(() => setPhase(2), 1000),
      setTimeout(() => setPhase(3), 3500),
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  return (
    <motion.div
      className="absolute inset-0 flex items-center"
      initial={{ opacity: 0, x: '10%' }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: '-5%' }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="absolute inset-0 -z-10">
        <video
          src={`${import.meta.env.BASE_URL}videos/tech-bg.mp4`}
          className="w-full h-full object-cover opacity-30"
          autoPlay
          muted
          playsInline
        />
        <div className="absolute inset-0 bg-gradient-to-b from-bg-dark/50 to-bg-dark" />
      </div>

      <div className="flex w-full px-[8vw] gap-16 items-center">
        <motion.div
          className="w-1/2"
          initial={{ opacity: 0, y: 40 }}
          animate={phase >= 1 ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="text-primary font-bold tracking-widest text-lg uppercase mb-4">
            Digital Patient Files
          </div>
          <h2 className="text-[4vw] font-display font-bold leading-[1.1] mb-6 text-white">
            Fast<br />Documentation
          </h2>
          <p className="text-[1.5vw] text-text-secondary leading-relaxed border-l-4 border-primary pl-6">
            Photo recognition turns captured data into organized, structured patient records in seconds.
          </p>
        </motion.div>

        <motion.div
          className="w-1/2 relative"
          initial={{ opacity: 0, scale: 0.8, rotateY: 20 }}
          animate={phase >= 2 ? { opacity: 1, scale: 1, rotateY: 0 } : { opacity: 0, scale: 0.8, rotateY: 20 }}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
          style={{ perspective: 1000 }}
        >
          <div className="relative rounded-2xl overflow-hidden glass-panel border border-primary/30 shadow-[0_0_50px_rgba(245,197,24,0.15)] aspect-video">
            <img
              src={`${import.meta.env.BASE_URL}images/dashboard.png`}
              alt="Clinical Dashboard"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-tr from-bg-dark/40 to-transparent" />
          </div>
          
          <motion.div
            className="absolute -bottom-8 -left-8 w-32 h-32 bg-primary/10 border border-primary/30 rounded-2xl backdrop-blur-md flex items-center justify-center"
            initial={{ y: 20, opacity: 0 }}
            animate={phase >= 2 ? { y: 0, opacity: 1 } : { y: 20, opacity: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            <div className="w-16 h-16 border-2 border-primary rounded-full border-t-transparent animate-spin" />
          </motion.div>
        </motion.div>
      </div>
    </motion.div>
  );
}