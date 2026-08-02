import { useEffect, useRef } from "react";

/**
 * HIVE Scroll-World Landing Page (v3)
 *
 * Mounts the vanilla scroll-scrub engine into a React ref.
 * The engine builds all its own DOM, CSS, and scroll handling —
 * React just provides the container and cleans up on unmount.
 *
 * Assets are served from https://webp-deploy.vercel.app (8 videos + 11 WebP).
 * Config lives at /hive-scroll-config.js (loaded via script tag in index.html).
 * Engine lives at /scrub-engine.js.
 */

declare global {
  interface Window {
    mountScrollWorld?: (container: HTMLElement, config: Record<string, unknown>) => void;
    HIVE_SCROLL_CONFIG?: Record<string, unknown>;
  }
}

export default function HomeV3() {
  const containerRef = useRef<HTMLDivElement>(null);
  const mountedRef = useRef(false);

  useEffect(() => {
    if (mountedRef.current || !containerRef.current) return;
    mountedRef.current = true;

    const container = containerRef.current;

    // Wait for the engine + config scripts to load (they're in index.html)
    const tryMount = () => {
      if (window.mountScrollWorld && window.HIVE_SCROLL_CONFIG) {
        // Clear any existing content
        container.innerHTML = "";
        window.mountScrollWorld(container, window.HIVE_SCROLL_CONFIG);
      } else {
        // Retry in 100ms if scripts haven't loaded yet
        setTimeout(tryMount, 100);
      }
    };
    tryMount();

    // Cleanup on unmount
    return () => {
      container.innerHTML = "";
      mountedRef.current = false;
    };
  }, []);

  return (
    <div
      ref={containerRef}
      id="hive-scroll-world"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 0,
        background: "#0a0a0a",
      }}
    />
  );
}
