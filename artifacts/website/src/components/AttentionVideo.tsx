import { useEffect, useRef } from "react";
import { useReducedMotion } from "framer-motion";

interface AttentionVideoProps {
  src: string;
  poster: string;
  title: string;
  className?: string;
}

/**
 * Attention-aware video: preloads only metadata behind a poster, autoplays
 * muted when a majority of it is on screen, and pauses when the user scrolls
 * away or the tab loses focus. Native controls stay available so the user can
 * unmute or scrub. Autoplay is skipped when reduced motion is preferred.
 */
export function AttentionVideo({ src, poster, title, className = "" }: AttentionVideoProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const visibleRef = useRef(false);
  const userPausedRef = useRef(false);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const tryPlay = () => {
      if (reducedMotion || userPausedRef.current) return;
      video.play().catch(() => {
        // Autoplay blocked — retry muted once.
        if (!video.muted) {
          video.muted = true;
          video.play().catch(() => {});
        }
      });
    };

    const observer = new IntersectionObserver(
      ([entry]) => {
        visibleRef.current = entry.isIntersecting;
        if (entry.isIntersecting && !document.hidden) {
          tryPlay();
        } else if (!video.paused) {
          video.pause();
        }
      },
      { threshold: 0.5 }
    );
    observer.observe(video);

    const onVisibility = () => {
      if (document.hidden) {
        if (!video.paused) video.pause();
      } else if (visibleRef.current) {
        tryPlay();
      }
    };
    document.addEventListener("visibilitychange", onVisibility);

    // Respect an explicit user pause: don't restart on the next scroll-by.
    const onPause = () => {
      if (visibleRef.current && !document.hidden && !video.ended && !video.seeking) {
        userPausedRef.current = true;
      }
    };
    const onPlay = () => {
      userPausedRef.current = false;
    };
    video.addEventListener("pause", onPause);
    video.addEventListener("play", onPlay);

    return () => {
      observer.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      video.removeEventListener("pause", onPause);
      video.removeEventListener("play", onPlay);
    };
  }, [reducedMotion]);

  return (
    <video
      ref={videoRef}
      className={className}
      src={src}
      poster={poster}
      controls
      muted
      loop
      preload="metadata"
      playsInline
      aria-label={title}
    >
      Your browser does not support the video tag. You can{" "}
      <a href={src}>download the video</a> instead.
    </video>
  );
}
