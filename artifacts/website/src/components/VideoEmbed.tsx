import { useRef } from "react";
import { motion, useInView, useReducedMotion } from "framer-motion";

interface VideoEmbedProps {
  src: string;
  title: string;
}

export function VideoEmbed({ src, title }: VideoEmbedProps) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-15% 0px -15% 0px" });
  const reducedMotion = useReducedMotion();

  return (
    <div ref={ref} className="relative aspect-video bg-[#07070f] overflow-hidden">
      {/* Idle state — pulsing hive mark until the section scrolls into view */}
      {!inView && (
      <div
        className="absolute inset-0 flex items-center justify-center"
        aria-hidden="true"
      >
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" className="absolute inset-0 opacity-15">
          <pattern id={`hex-idle-${title.replace(/\s+/g, "-")}`} x="0" y="0" width="48" height="83.14" patternUnits="userSpaceOnUse">
            <path d="M24 0 L48 13.86 L48 41.57 L24 55.43 L0 41.57 L0 13.86 Z" fill="none" stroke="#f5c518" strokeWidth="0.5" />
            <path d="M24 83.14 L48 69.28 L48 41.57 L24 55.43 L0 41.57 L0 69.28 Z" fill="none" stroke="#f5c518" strokeWidth="0.5" />
          </pattern>
          <rect width="100%" height="100%" fill={`url(#hex-idle-${title.replace(/\s+/g, "-")})`} />
        </svg>
        <motion.svg
          viewBox="0 0 100 116"
          className="w-14 md:w-20 text-[#f5c518] drop-shadow-[0_0_18px_rgba(245,197,24,0.45)]"
          animate={reducedMotion ? { opacity: 0.7 } : { opacity: [0.35, 1, 0.35], scale: [0.94, 1.06, 0.94] }}
          transition={reducedMotion ? { duration: 0 } : { duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
        >
          <path
            d="M50 2 L98 30 L98 86 L50 114 L2 86 L2 30 Z"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
          />
          <path
            d="M50 26 L77 42 L77 74 L50 90 L23 74 L23 42 Z"
            fill="rgba(245,197,24,0.12)"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeDasharray="6 5"
          />
        </motion.svg>
      </div>
      )}

      {/* Activated on scroll — sleek reveal once in view, stays mounted */}
      {inView && (
        <motion.div
          initial={reducedMotion ? { opacity: 0 } : { opacity: 0, scale: 1.04 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: reducedMotion ? 0.3 : 1, ease: [0.22, 1, 0.36, 1] }}
          className="absolute inset-0"
        >
          <iframe
            src={src}
            title={title}
            className="w-full h-full border-0 pointer-events-none"
            loading="lazy"
            tabIndex={-1}
            scrolling="no"
          />
        </motion.div>
      )}
    </div>
  );
}
