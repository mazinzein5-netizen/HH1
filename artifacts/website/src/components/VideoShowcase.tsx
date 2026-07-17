import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Play, X } from "lucide-react";

export interface ShowcaseVideo {
  id: string;
  title: string;
  tagline: string;
  src: string;
  poster: string;
  duration: string;
}

export function VideoShowcase({ videos }: { videos: ShowcaseVideo[] }) {
  const [expanded, setExpanded] = useState<ShowcaseVideo | null>(null);
  const reducedMotion = useReducedMotion();
  const lastTrigger = useRef<HTMLElement | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);

  const close = useCallback(() => {
    setExpanded(null);
    lastTrigger.current?.focus();
  }, []);

  useEffect(() => {
    if (!expanded) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("keydown", onKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [expanded, close]);

  return (
    <>
      <div className="grid md:grid-cols-2 gap-6 lg:gap-10">
        {videos.map((video) => (
          <motion.button
            key={video.id}
            type="button"
            onClick={(e) => {
              lastTrigger.current = e.currentTarget;
              setExpanded(video);
            }}
            aria-label={`Play ${video.title}`}
            aria-haspopup="dialog"
            initial={reducedMotion ? { opacity: 0 } : { opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            whileHover={reducedMotion ? undefined : { scale: 1.03, y: -4 }}
            whileTap={reducedMotion ? undefined : { scale: 0.99 }}
            transition={{ type: "spring", stiffness: 240, damping: 26 }}
            className="group relative text-left rounded-[2rem] overflow-hidden glass-panel-heavy border-border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f5c518] transition-shadow duration-500 hover:shadow-[0_24px_80px_-12px_rgba(245,197,24,0.35)]"
          >
            <div className="relative aspect-video bg-[#07070f] overflow-hidden">
              <img
                src={video.poster}
                alt=""
                loading="lazy"
                className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105 motion-reduce:transform-none"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />

              {/* Gold ring highlight on hover/focus */}
              <div className="absolute inset-0 rounded-[2rem] ring-1 ring-transparent group-hover:ring-[#f5c518]/50 group-focus-visible:ring-[#f5c518]/50 transition-all duration-500 pointer-events-none" />

              {/* Play badge */}
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="flex h-16 w-16 md:h-20 md:w-20 items-center justify-center rounded-full border border-[#f5c518]/50 bg-black/50 backdrop-blur-md text-[#f5c518] shadow-[0_0_30px_rgba(245,197,24,0.25)] transition-all duration-500 group-hover:scale-110 group-hover:bg-[#f5c518] group-hover:text-black motion-reduce:transform-none">
                  <Play className="h-7 w-7 md:h-8 md:w-8 translate-x-0.5" fill="currentColor" />
                </span>
              </div>

              <span className="absolute top-4 right-4 rounded-full bg-black/60 border border-white/15 px-3 py-1 text-xs font-medium text-white/90 backdrop-blur-md">
                {video.duration}
              </span>

            </div>
          </motion.button>
        ))}
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            key="showcase-lightbox"
            role="dialog"
            aria-modal="true"
            aria-label={expanded.title}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reducedMotion ? 0.15 : 0.3 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-10 bg-black/85 backdrop-blur-md"
            onClick={close}
          >
            <motion.div
              initial={reducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.92, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={reducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.95, y: 12 }}
              transition={{ type: "spring", stiffness: 260, damping: 28 }}
              className="relative w-full max-w-5xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-3 px-1">
                <div>
                  <h3 className="text-base md:text-xl font-bold text-white">
                    {expanded.title}
                  </h3>
                  <p className="text-xs md:text-sm text-white/60">{expanded.tagline}</p>
                </div>
                <button
                  ref={closeButtonRef}
                  type="button"
                  onClick={close}
                  aria-label="Close video"
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/20 bg-black/60 text-white/90 backdrop-blur-md transition-colors hover:border-[#f5c518]/60 hover:text-[#f5c518] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f5c518]"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="relative aspect-video overflow-hidden rounded-2xl bg-[#07070f] ring-1 ring-[#f5c518]/30 shadow-[0_24px_100px_-12px_rgba(245,197,24,0.4)]">
                <video
                  key={expanded.id}
                  className="h-full w-full"
                  src={expanded.src}
                  poster={expanded.poster}
                  controls
                  autoPlay
                  playsInline
                  preload="metadata"
                  aria-label={expanded.title}
                >
                  Your browser does not support the video tag. You can{" "}
                  <a href={expanded.src}>download the video</a> instead.
                </video>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
