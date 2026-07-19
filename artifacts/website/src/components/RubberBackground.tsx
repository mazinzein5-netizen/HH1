import React from "react";

const NOISE_SVG = encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" width="240" height="240"><filter id="n"><feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="4" stitchTiles="stitch"/><feColorMatrix type="matrix" values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 0.6 0"/></filter><rect width="240" height="240" filter="url(#n)" opacity="0.5"/></svg>`
);

export function RubberBackground() {
  return (
    <div className="fixed inset-0 z-[-1] overflow-hidden pointer-events-none bg-background">
      {/* Matte rubber base with soft top lighting (dark mode) */}
      <div
        className="absolute inset-0 opacity-0 dark:opacity-100 transition-opacity duration-500"
        style={{
          background:
            "radial-gradient(120% 90% at 50% -10%, hsl(240 5% 11%) 0%, hsl(240 5% 7%) 45%, hsl(240 6% 4%) 100%)",
        }}
      />

      {/* Embossed stipple grip — offset highlight + shadow dots give raised-dot depth */}
      <div
        className="absolute inset-0 opacity-0 dark:opacity-100 transition-opacity duration-500"
        style={{
          backgroundImage: [
            "radial-gradient(circle at 1.5px 1.5px, rgba(255,255,255,0.055) 1px, transparent 1.6px)",
            "radial-gradient(circle at 2.5px 2.5px, rgba(0,0,0,0.5) 1px, transparent 1.7px)",
            "radial-gradient(circle at 4.5px 4.5px, rgba(255,255,255,0.03) 1px, transparent 1.5px)",
            "radial-gradient(circle at 5.5px 5.5px, rgba(0,0,0,0.4) 1px, transparent 1.6px)",
          ].join(", "),
          backgroundSize: "6px 6px, 6px 6px, 6px 6px, 6px 6px",
          backgroundPosition: "0 0, 0 0, 3px 3px, 3px 3px",
        }}
      />

      {/* Fine grain noise for the matte, slightly dusty rubber finish */}
      <div
        className="absolute inset-0 opacity-[0.05] dark:opacity-[0.14] mix-blend-overlay"
        style={{
          backgroundImage: `url("data:image/svg+xml,${NOISE_SVG}")`,
          backgroundSize: "240px 240px",
        }}
      />

      {/* Subtle light-mode grain so light theme keeps a hint of the texture */}
      <div
        className="absolute inset-0 dark:hidden"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1.5px 1.5px, rgba(0,0,0,0.04) 1px, transparent 1.6px)",
          backgroundSize: "6px 6px",
        }}
      />

      {/* Directional sheen — the soft specular sweep rubber shows under studio light */}
      <div
        className="absolute inset-0 opacity-0 dark:opacity-100 transition-opacity duration-500"
        style={{
          background:
            "linear-gradient(160deg, rgba(255,255,255,0.045) 0%, transparent 30%, transparent 70%, rgba(0,0,0,0.35) 100%)",
        }}
      />

      {/* Vignette for depth */}
      <div
        className="absolute inset-0 opacity-0 dark:opacity-100"
        style={{
          background:
            "radial-gradient(115% 115% at 50% 40%, transparent 55%, rgba(0,0,0,0.55) 100%)",
        }}
      />

      {/* Faint brand hexagons pressed into the surface */}
      <div className="absolute inset-0 opacity-40 dark:opacity-30">
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern
              id="hexagons"
              width="60"
              height="103.92304845413263"
              patternUnits="userSpaceOnUse"
              patternTransform="scale(1.5)"
            >
              <path
                d="M30 0L60 17.32050807568877L60 51.96152422706631L30 69.28203230275508L0 51.96152422706631L0 17.32050807568877Z"
                stroke="currentColor"
                strokeWidth="1"
                fill="transparent"
                className="text-primary/10 dark:text-primary/[0.07]"
              />
              <path
                d="M30 103.92304845413263L60 86.60254037844386L60 51.96152422706631L30 69.28203230275508L0 51.96152422706631L0 86.60254037844386Z"
                stroke="currentColor"
                strokeWidth="1"
                fill="transparent"
                className="text-primary/10 dark:text-primary/[0.07]"
              />
            </pattern>
            <radialGradient id="fade" cx="50%" cy="35%" r="60%">
              <stop offset="0%" stopColor="white" stopOpacity="1" />
              <stop offset="85%" stopColor="white" stopOpacity="0" />
            </radialGradient>
            <mask id="fadeMask">
              <rect width="100%" height="100%" fill="url(#fade)" />
            </mask>
          </defs>
          <rect width="100%" height="100%" fill="url(#hexagons)" mask="url(#fadeMask)" />
        </svg>
      </div>

      {/* Brand glow orbs — dimmed so glass panels pick up a warm reflection */}
      <div className="absolute top-[15%] left-[8%] w-[600px] h-[600px] bg-primary/20 dark:bg-primary/[0.06] rounded-full blur-[150px] mix-blend-screen" />
      <div className="absolute bottom-[8%] right-[8%] w-[800px] h-[800px] bg-blue-600/10 dark:bg-blue-900/15 rounded-full blur-[150px] mix-blend-screen" />
    </div>
  );
}
