import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';

// Hexagon SVG helper
const Hexagon = ({ size, color, opacity = 1, className = "" }: { size: number, color: string, opacity?: number, className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} style={{ opacity }}>
    <path d="M60 10 L103.3 35 L103.3 85 L60 110 L16.7 85 L16.7 35 Z" fill={color} />
  </svg>
);

export function Scene7() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 200),
      setTimeout(() => setPhase(2), 800),
      setTimeout(() => setPhase(3), 1600),
      setTimeout(() => setPhase(4), 2200),
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  return (
    <motion.div 
      className="absolute inset-0 flex items-center justify-between px-[10vw] flex-row-reverse"
      initial={{ opacity: 0, x: 100 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, scale: 1.1 }}
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
          src={`${import.meta.env.BASE_URL}images/paramedic-phone.jpg`} 
          alt="" 
          className="w-full h-full object-cover" 
        />
        <div className="absolute inset-0 bg-gradient-to-l from-[var(--color-bg-dark)] via-[var(--color-bg-dark)]/90 to-[var(--color-bg-dark)]/60" />
      </motion.div>

      {/* Right side text (flex-row-reverse makes it right) */}
      <div className="w-[45vw] flex flex-col items-start text-left z-10">
        <motion.div
          className="px-[1.5vw] py-[0.5vw] bg-[var(--color-bg-muted)]/80 backdrop-blur-sm border border-[var(--color-accent)]/40 rounded-full text-[var(--color-accent)] text-[1vw] font-bold tracking-widest uppercase mb-[2vw]"
          initial={{ opacity: 0, y: 20 }}
          animate={phase >= 1 ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6 }}
        >
          Emergency Health Card
        </motion.div>

        <motion.h2 
          className="text-[4vw] font-display font-bold text-white leading-[1.1] tracking-tight drop-shadow-xl"
          initial={{ opacity: 0, y: 30 }}
          animate={phase >= 2 ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        >
          Ready when it <br/>
          <span className="text-[var(--color-accent)]">matters most</span>
        </motion.h2>

        <motion.p 
          className="text-[1.8vw] text-[var(--color-text-secondary)] mt-[2vw] leading-relaxed max-w-[40vw] drop-shadow-md"
          initial={{ opacity: 0, y: 20 }}
          animate={phase >= 3 ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.8 }}
        >
          The information was there when it mattered. First responders can securely access your allergies and medications via QR code.
        </motion.p>
      </div>

      {/* Left side graphic - QR Code simulation */}
      <div className="w-[35vw] h-[70vh] relative z-10 flex items-center justify-center">
        <motion.div 
          className="w-[22vw] h-[22vw] bg-white rounded-[2vw] p-[1.5vw] shadow-2xl relative"
          initial={{ opacity: 0, scale: 0.8, rotate: -15, y: 50 }}
          animate={phase >= 2 ? { opacity: 1, scale: 1, rotate: -5, y: 0 } : { opacity: 0, scale: 0.8, rotate: -15, y: 50 }}
          transition={{ duration: 1, type: "spring", bounce: 0.3 }}
        >
          {/* Faux QR Code Pattern */}
          <div className="w-full h-full border-[0.8vw] border-[var(--color-bg-dark)] rounded-xl relative p-[0.8vw] grid grid-cols-4 grid-rows-4 gap-[0.5vw]">
            {/* Corners */}
            <div className="col-span-2 row-span-2 bg-[var(--color-bg-dark)] rounded-md"></div>
            <div className="col-span-1 row-span-1 bg-[var(--color-bg-dark)] rounded-sm"></div>
            <div className="col-span-1 row-span-2 bg-[var(--color-bg-dark)] rounded-md"></div>
            
            <div className="col-span-1 row-span-1 bg-gray-300 rounded-sm"></div>
            <div className="col-span-2 row-span-1 bg-[var(--color-bg-dark)] rounded-sm"></div>
            
            <div className="col-span-2 row-span-2 bg-[var(--color-bg-dark)] rounded-md"></div>
            <div className="col-span-1 row-span-1 bg-gray-300 rounded-sm"></div>
            <div className="col-span-1 row-span-1 bg-[var(--color-bg-dark)] rounded-sm"></div>
            
            {/* Center Logo overlay */}
            <motion.div 
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[6vw] h-[6vw] bg-white rounded-xl shadow-lg flex items-center justify-center"
              initial={{ scale: 0, rotate: -90 }}
              animate={phase >= 4 ? { scale: 1, rotate: 0 } : { scale: 0, rotate: -90 }}
              transition={{ duration: 0.8, type: "spring" }}
            >
               <Hexagon size={60} color="var(--color-accent)" />
            </motion.div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
