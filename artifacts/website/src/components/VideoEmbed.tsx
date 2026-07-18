import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence, useInView, useReducedMotion } from "framer-motion";
import { Maximize2, Volume2, VolumeX, X } from "lucide-react";

interface VideoEmbedProps {
  src: string;
  title: string;
  audioSrc?: string;
  frameClassName?: string;
  expandable?: boolean;
}

const AUDIO_VOLUME = 0.45;

export function VideoEmbed({
  src,
  title,
  audioSrc,
  frameClassName = "",
  expandable = true,
}: VideoEmbedProps) {
  const ref = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fadeFrame = useRef<number | null>(null);
  // Pre-mount the live preview shortly before it scrolls into view so it
  // feels instant, without loading every video up-front on page load.
  const nearView = useInView(ref, { once: true, margin: "600px 0px" });
  // Attention gate with hysteresis: mount when the embed comes within 300px
  // of the viewport, but only unmount once it is more than 900px away. The
  // gap between the two thresholds prevents reload flicker when the video
  // sits right at a single mount/unmount boundary.
  const enterView = useInView(ref, { margin: "300px 0px" });
  const farView = useInView(ref, { margin: "900px 0px" });
  const [previewMounted, setPreviewMounted] = useState(false);
  useEffect(() => {
    if (enterView) setPreviewMounted(true);
    else if (!farView) setPreviewMounted(false);
  }, [enterView, farView]);
  const inView = useInView(ref, { once: true, amount: 0.25 });
  const [tabVisible, setTabVisible] = useState(
    typeof document === "undefined" ? true : !document.hidden
  );
  const reducedMotion = useReducedMotion();
  const [revealed, setRevealed] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [soundOn, setSoundOn] = useState(true);
  const [needsTap, setNeedsTap] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const soundOnRef = useRef(true);
  const expandedRef = useRef(false);
  const activeRef = useRef(false);
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
        // Audio plays while the video is highlighted (hover/focus) or expanded, and sound is on.
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
    if (fadeFrame.current !== null) cancelAnimationFrame(fadeFrame.current);
    audio.pause();
    audio.volume = 0;
  };

  const openExpanded = (e: React.MouseEvent | React.KeyboardEvent) => {
    if (!expandable) return;
    triggerRef.current = e.currentTarget as HTMLElement;
    expandedRef.current = true;
    setExpanded(true);
    if (soundOnRef.current && audioSrc) tryPlay();
  };

  const closeExpanded = useCallback((opts?: { manual?: boolean }) => {
    expandedRef.current = false;
    setExpanded(false);
    stopAudio();
    if (opts?.manual) triggerRef.current?.focus();
  }, []);

  useEffect(() => {
    if (inView) setRevealed(true);
  }, [inView]);

  // Pause the embed when the tab loses focus (unmounts the iframe).
  useEffect(() => {
    const onVisibility = () => setTabVisible(!document.hidden);
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  // While expanded: Escape closes; scrolling away minimizes and silences.
  useEffect(() => {
    if (!expanded) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeExpanded({ manual: true });
    };
    const onScroll = () => closeExpanded();
    document.addEventListener("keydown", onKey);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("wheel", onScroll, { passive: true });
    window.addEventListener("touchmove", onScroll, { passive: true });
    closeButtonRef.current?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("wheel", onScroll);
      window.removeEventListener("touchmove", onScroll);
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
      if (activeRef.current || expandedRef.current) tryPlay();
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

  const soundButton = audioSrc ? (
    <button
      type="button"
      onClick={toggleSound}
      aria-label={soundOn && !needsTap ? `Mute ${title} audio` : `Play ${title} audio`}
      className={`absolute bottom-3 right-3 z-30 flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium backdrop-blur-md transition-all duration-300 ${
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
      <div
        ref={ref}
        tabIndex={0}
        role={expandable ? "button" : undefined}
        aria-label={expandable ? `${title} — expand video` : title}
        aria-haspopup={expandable ? "dialog" : undefined}
        onMouseEnter={() => {
          setHovered(true);
          activeRef.current = true;
          if (audioSrc && soundOnRef.current) tryPlay();
        }}
        onMouseLeave={() => {
          setHovered(false);
          activeRef.current = false;
          if (!expandedRef.current) fadeTo(0, () => {
            if (!activeRef.current && !expandedRef.current) audioRef.current?.pause();
          });
        }}
        onFocus={() => {
          activeRef.current = true;
          if (audioSrc && soundOnRef.current) tryPlay();
        }}
        onBlur={() => {
          activeRef.current = false;
          if (!expandedRef.current) fadeTo(0, () => {
            if (!activeRef.current && !expandedRef.current) audioRef.current?.pause();
          });
        }}
        onClick={openExpanded}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            openExpanded(e);
          }
        }}
        className={`relative outline-none ${expandable ? "cursor-zoom-in" : ""}`}
      >
        <div
          className={`relative aspect-video bg-[#07070f] overflow-hidden transition-shadow duration-500 ${frameClassName} ${
            hovered && expandable ? "ring-1 ring-[#f5c518]/50" : "ring-1 ring-transparent"
          }`}
        >
          {/* Idle state — pulsing hive mark until the section scrolls into
              view. Reduced-motion users keep this static placeholder instead
              of an autoplaying preview; the video opens on click. */}
          {(!revealed || reducedMotion) && (
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

          {/* Video preview (silent) — mounted just before the section scrolls
              into view so it starts seamlessly without heavy up-front loading. */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: revealed ? 1 : 0 }}
            transition={{ duration: reducedMotion ? 0.3 : 1, ease: [0.22, 1, 0.36, 1] }}
            className="absolute inset-0"
          >
            {nearView && previewMounted && tabVisible && !reducedMotion && (
              <iframe
                src={src}
                title={title}
                className="w-full h-full border-0 pointer-events-none"
                loading="lazy"
                tabIndex={-1}
                scrolling="no"
              />
            )}
          </motion.div>

          {/* Inline sound control while highlighted */}
          {hovered && soundButton}

          {/* Expand hint on hover/focus */}
          {expandable && (
            <div
              aria-hidden="true"
              className={`absolute top-3 right-3 z-30 flex items-center gap-1.5 rounded-full border border-white/20 bg-black/60 px-3 py-1.5 text-xs font-medium text-white/90 backdrop-blur-md transition-all duration-300 ${
                hovered ? "opacity-100" : "opacity-0"
              }`}
            >
              <Maximize2 className="h-3.5 w-3.5" />
              Play
            </div>
          )}
        </div>
      </div>

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
            transition={{ duration: reducedMotion ? 0.15 : 0.25 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-6"
            onClick={() => closeExpanded({ manual: true })}
          >
            <motion.div
              initial={reducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.94 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={reducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.96 }}
              transition={{ type: "spring", stiffness: 260, damping: 28 }}
              className="relative w-full"
              style={{
                maxWidth: "min(92vw, calc((100vh - 8rem) * 16 / 9), 72rem)",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-3 px-1">
                <h3 className="text-base md:text-xl font-bold text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]">{title}</h3>
                <button
                  ref={closeButtonRef}
                  type="button"
                  onClick={() => closeExpanded({ manual: true })}
                  aria-label="Close video"
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/20 bg-black/60 text-white/90 transition-colors hover:border-[#f5c518]/60 hover:text-[#f5c518] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f5c518]"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="relative aspect-video overflow-hidden rounded-2xl bg-[#07070f] ring-1 ring-[#f5c518]/30 shadow-[0_24px_100px_-12px_rgba(0,0,0,0.9)]">
                <iframe
                  src={src}
                  title={`${title} (expanded)`}
                  className="w-full h-full border-0 pointer-events-none"
                  scrolling="no"
                />
                {soundButton}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
