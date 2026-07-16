import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence, useInView, useReducedMotion } from "framer-motion";
import { Maximize2, Volume2, VolumeX, X } from "lucide-react";

interface VideoEmbedProps {
  src: string;
  title: string;
  audioSrc?: string;
  frameClassName?: string;
  scaleOnHover?: boolean;
}

const AUDIO_VOLUME = 0.45;

export function VideoEmbed({
  src,
  title,
  audioSrc,
  frameClassName = "",
  scaleOnHover = true,
}: VideoEmbedProps) {
  const ref = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fadeFrame = useRef<number | null>(null);
  const inView = useInView(ref, { once: true, margin: "-15% 0px -15% 0px" });
  const reducedMotion = useReducedMotion();
  const [active, setActive] = useState(false);
  const [soundOn, setSoundOn] = useState(true);
  const [needsTap, setNeedsTap] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const activeRef = useRef(false);
  const soundOnRef = useRef(true);
  const expandedRef = useRef(false);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const triggerRef = useRef<HTMLElement | null>(null);

  const fadeTo = (target: number, then?: () => void) => {
    if (fadeFrame.current !== null) cancelAnimationFrame(fadeFrame.current);
    const step = () => {
      const audio = audioRef.current;
      if (!audio) return;
      const diff = target - audio.volume;
      if (Math.abs(diff) < 0.02) {
        audio.volume = target;
        fadeFrame.current = null;
        then?.();
        return;
      }
      audio.volume += diff * 0.1;
      fadeFrame.current = requestAnimationFrame(step);
    };
    fadeFrame.current = requestAnimationFrame(step);
  };

  const tryPlay = () => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.loop = true;
    if (audio.paused) audio.volume = 0;
    audio
      .play()
      .then(() => {
        setNeedsTap(false);
        // Intent may have changed while the play() promise was pending
        // (e.g. rapid hover off) — never leave audio playing when inactive.
        if ((activeRef.current || expandedRef.current) && soundOnRef.current) {
          fadeTo(AUDIO_VOLUME);
        } else {
          fadeTo(0, () => audioRef.current?.pause());
        }
      })
      .catch(() => setNeedsTap(true));
  };

  const stopAudio = () => {
    const audio = audioRef.current;
    if (!audio || audio.paused) return;
    fadeTo(0, () => audio.pause());
  };

  const activate = () => {
    activeRef.current = true;
    setActive(true);
    if (soundOnRef.current && audioSrc) tryPlay();
  };

  const deactivate = () => {
    activeRef.current = false;
    setActive(false);
    if (!expandedRef.current) stopAudio();
  };

  const openExpanded = (e: React.MouseEvent | React.KeyboardEvent) => {
    triggerRef.current = e.currentTarget as HTMLElement;
    expandedRef.current = true;
    setExpanded(true);
    if (soundOnRef.current && audioSrc) tryPlay();
  };

  const closeExpanded = useCallback(() => {
    expandedRef.current = false;
    setExpanded(false);
    if (!activeRef.current) {
      const audio = audioRef.current;
      if (audio && !audio.paused) {
        if (fadeFrame.current !== null) cancelAnimationFrame(fadeFrame.current);
        audio.pause();
        audio.volume = 0;
      }
    }
    triggerRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!expanded) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeExpanded();
    };
    document.addEventListener("keydown", onKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [expanded, closeExpanded]);

  const toggleSound = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (soundOn && !needsTap) {
      soundOnRef.current = false;
      setSoundOn(false);
      stopAudio();
    } else {
      soundOnRef.current = true;
      setSoundOn(true);
      tryPlay();
    }
  };

  useEffect(
    () => () => {
      if (fadeFrame.current !== null) cancelAnimationFrame(fadeFrame.current);
      audioRef.current?.pause();
    },
    []
  );

  const soundLabel = soundOn ? (needsTap ? "Tap for sound" : "Sound on") : "Muted";

  const soundButton = (visible: boolean) =>
    audioSrc ? (
      <button
        type="button"
        onClick={toggleSound}
        aria-label={soundOn && !needsTap ? `Mute ${title} audio` : `Play ${title} audio`}
        className={`absolute bottom-3 right-3 z-30 flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium backdrop-blur-md transition-all duration-300 ${
          visible ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        } ${
          soundOn && !needsTap
            ? "bg-[#f5c518]/15 border-[#f5c518]/50 text-[#f5c518]"
            : "bg-black/60 border-white/15 text-white/85 hover:border-[#f5c518]/50"
        }`}
      >
        {soundOn && !needsTap ? (
          <Volume2 className="h-3.5 w-3.5" />
        ) : (
          <VolumeX className="h-3.5 w-3.5" />
        )}
        {soundLabel}
      </button>
    ) : null;

  return (
    <>
      <motion.div
        ref={ref}
        tabIndex={0}
        role="button"
        aria-label={`${title} — expand video`}
        aria-haspopup="dialog"
        onMouseEnter={activate}
        onMouseLeave={deactivate}
        onClick={openExpanded}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            openExpanded(e);
          }
        }}
        onFocus={(e) => {
          if (e.currentTarget.contains(e.relatedTarget as Node | null)) return;
          activate();
        }}
        onBlur={(e) => {
          if (e.currentTarget.contains(e.relatedTarget as Node | null)) return;
          deactivate();
        }}
        animate={
          scaleOnHover && !reducedMotion ? { scale: active ? 1.12 : 1 } : undefined
        }
        transition={{ type: "spring", stiffness: 220, damping: 26 }}
        className={`relative outline-none cursor-zoom-in ${active ? "z-20" : "z-0"}`}
      >
        <div
          className={`relative aspect-video bg-[#07070f] overflow-hidden transition-shadow duration-500 ${frameClassName} ${
            active ? "ring-1 ring-[#f5c518]/50" : "ring-1 ring-transparent"
          }`}
          style={
            active
              ? { boxShadow: "0 24px 80px -12px rgba(245,197,24,0.45)" }
              : undefined
          }
        >
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

          {/* Expand hint on hover/focus */}
          <div
            aria-hidden="true"
            className={`absolute top-3 right-3 z-30 flex items-center gap-1.5 rounded-full border border-white/20 bg-black/60 px-3 py-1.5 text-xs font-medium text-white/90 backdrop-blur-md transition-all duration-300 ${
              active ? "opacity-100" : "opacity-0"
            }`}
          >
            <Maximize2 className="h-3.5 w-3.5" />
            Expand
          </div>
        </div>

        {soundButton(active)}
      </motion.div>

      {audioSrc && <audio ref={audioRef} src={audioSrc} preload="none" />}

      <AnimatePresence>
        {expanded && (
          <motion.div
            key={`${title}-lightbox`}
            role="dialog"
            aria-modal="true"
            aria-label={title}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reducedMotion ? 0.15 : 0.3 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-10 bg-black/85 backdrop-blur-md"
            onClick={closeExpanded}
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
                <h3 className="text-base md:text-xl font-bold text-white">{title}</h3>
                <button
                  ref={closeButtonRef}
                  type="button"
                  onClick={closeExpanded}
                  aria-label="Close video"
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/20 bg-black/60 text-white/90 backdrop-blur-md transition-colors hover:border-[#f5c518]/60 hover:text-[#f5c518] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f5c518]"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="relative aspect-video overflow-hidden rounded-2xl bg-[#07070f] ring-1 ring-[#f5c518]/30 shadow-[0_24px_100px_-12px_rgba(245,197,24,0.4)]">
                <iframe
                  src={src}
                  title={`${title} (expanded)`}
                  className="w-full h-full border-0 pointer-events-none"
                  scrolling="no"
                />
                {soundButton(true)}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
