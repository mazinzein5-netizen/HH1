import React from "react";

/**
 * Transparent hexagonal "microprocessor board" landscape.
 * Glass hexagon lattice + circuit traces with glowing pulses travelling
 * quickly along the tracks — a high-tech bio/AI digital theme.
 * Pure SVG/CSS (SMIL animateMotion) — no JS animation loop.
 */

// Hexagon flat-top geometry used for the lattice pattern
const HEX_W = 60;
const HEX_H = 103.923;

// Circuit trace paths drawn along hex-grid angles (0/60/120 degrees).
// Coordinates are in a 1200x800 viewBox, preserveAspectRatio slice-fills.
const TRACES: { d: string; dur: string; delay: string; color: string }[] = [
  { d: "M -40 120 H 260 L 380 190 H 640 L 760 120 H 1260", dur: "5s", delay: "0s", color: "#f5c518" },
  { d: "M -40 420 H 180 L 300 350 H 560 L 680 420 L 800 490 H 1260", dur: "6.5s", delay: "1.2s", color: "#6ea8ff" },
  { d: "M -40 660 H 340 L 460 590 H 720 L 840 660 H 1260", dur: "5.5s", delay: "0.6s", color: "#f5c518" },
  { d: "M 200 -40 L 200 90 L 320 160 L 320 320 L 200 390 L 200 560 L 320 630 L 320 840", dur: "7s", delay: "0.3s", color: "#6ea8ff" },
  { d: "M 940 -40 L 940 110 L 820 180 L 820 340 L 940 410 L 940 580 L 820 650 L 820 840", dur: "7.5s", delay: "2s", color: "#f5c518" },
  { d: "M 560 -40 L 560 130 L 680 200 L 680 380 L 560 450 L 560 840", dur: "6s", delay: "1.6s", color: "#8ad7c1" },
  { d: "M 1100 200 L 1010 252 L 1010 356 L 1100 408 L 1100 512 L 1010 564", dur: "4.5s", delay: "0.9s", color: "#6ea8ff" },
  { d: "M 80 250 L 170 302 L 170 406 L 80 458 L 80 562", dur: "4.8s", delay: "2.4s", color: "#f5c518" },
];

// Solder-pad nodes where traces meet
const NODES: { x: number; y: number }[] = [
  { x: 260, y: 120 }, { x: 640, y: 190 }, { x: 760, y: 120 },
  { x: 300, y: 350 }, { x: 680, y: 420 }, { x: 340, y: 660 },
  { x: 840, y: 660 }, { x: 320, y: 160 }, { x: 200, y: 390 },
  { x: 940, y: 410 }, { x: 680, y: 200 }, { x: 560, y: 450 },
  { x: 1010, y: 356 }, { x: 170, y: 406 }, { x: 820, y: 340 },
];

export function CircuitHexBackground() {
  return (
    <div className="fixed inset-0 z-[-1] overflow-hidden pointer-events-none bg-background">
      {/* Deep board base */}
      <div
        className="absolute inset-0 opacity-0 dark:opacity-100 transition-opacity duration-500"
        style={{
          background:
            "radial-gradient(120% 90% at 50% -10%, hsl(228 30% 10%) 0%, hsl(230 32% 7%) 45%, hsl(232 36% 4%) 100%)",
        }}
      />
      {/* Light-mode soft board tint */}
      <div
        className="absolute inset-0 dark:opacity-0 transition-opacity duration-500"
        style={{
          background:
            "radial-gradient(120% 90% at 50% -10%, hsl(220 40% 97%) 0%, hsl(222 35% 94%) 55%, hsl(224 30% 90%) 100%)",
        }}
      />

      {/* Glass hexagon lattice */}
      <div className="absolute inset-0 opacity-50 dark:opacity-40">
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern
              id="hex-lattice"
              width={HEX_W}
              height={HEX_H}
              patternUnits="userSpaceOnUse"
              patternTransform="scale(1.4)"
            >
              <path
                d={`M${HEX_W / 2} 0L${HEX_W} ${HEX_H / 6}L${HEX_W} ${HEX_H / 2}L${HEX_W / 2} ${(HEX_H * 2) / 3}L0 ${HEX_H / 2}L0 ${HEX_H / 6}Z`}
                stroke="currentColor"
                strokeWidth="1"
                fill="rgba(245,197,24,0.012)"
                className="text-primary/15 dark:text-primary/10"
              />
              <path
                d={`M${HEX_W / 2} ${HEX_H}L${HEX_W} ${(HEX_H * 5) / 6}L${HEX_W} ${HEX_H / 2}L${HEX_W / 2} ${(HEX_H * 2) / 3}L0 ${HEX_H / 2}L0 ${(HEX_H * 5) / 6}Z`}
                stroke="currentColor"
                strokeWidth="1"
                fill="rgba(110,168,255,0.012)"
                className="text-blue-400/15 dark:text-blue-400/10"
              />
            </pattern>
            <radialGradient id="hex-fade" cx="50%" cy="40%" r="75%">
              <stop offset="0%" stopColor="white" stopOpacity="1" />
              <stop offset="90%" stopColor="white" stopOpacity="0" />
            </radialGradient>
            <mask id="hex-fade-mask">
              <rect width="100%" height="100%" fill="url(#hex-fade)" />
            </mask>
          </defs>
          <rect width="100%" height="100%" fill="url(#hex-lattice)" mask="url(#hex-fade-mask)" />
        </svg>
      </div>

      {/* Circuit traces + travelling pulses */}
      <svg
        className="absolute inset-0 w-full h-full opacity-80 dark:opacity-100"
        viewBox="0 0 1200 800"
        preserveAspectRatio="xMidYMid slice"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <defs>
          <filter id="pulse-glow" x="-200%" y="-200%" width="500%" height="500%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Static copper tracks */}
        {TRACES.map((t, i) => (
          <path
            key={`track-${i}`}
            d={t.d}
            fill="none"
            stroke={t.color}
            strokeWidth="1.2"
            strokeLinejoin="round"
            strokeLinecap="round"
            className="opacity-[0.13] dark:opacity-[0.16]"
          />
        ))}

        {/* Solder pads */}
        {NODES.map((n, i) => (
          <g key={`node-${i}`}>
            <circle cx={n.x} cy={n.y} r="4.5" fill="none" stroke="#f5c518" strokeWidth="1" className="opacity-20" />
            <circle cx={n.x} cy={n.y} r="1.8" fill="#f5c518" className="opacity-25" />
          </g>
        ))}

        {/* Fast glowing pulses running along the tracks (hidden for reduced motion) */}
        <g className="motion-reduce:hidden">
          {TRACES.map((t, i) => (
            <g key={`pulse-${i}`}>
              {/* Bright head */}
              <circle r="2.6" fill={t.color} filter="url(#pulse-glow)">
                <animateMotion dur={t.dur} begin={t.delay} repeatCount="indefinite" path={t.d} />
                <animate
                  attributeName="opacity"
                  values="0;1;1;0"
                  keyTimes="0;0.06;0.94;1"
                  dur={t.dur}
                  begin={t.delay}
                  repeatCount="indefinite"
                />
              </circle>
              {/* Soft trailing glow */}
              <circle r="6" fill={t.color} opacity="0.18" filter="url(#pulse-glow)">
                <animateMotion dur={t.dur} begin={t.delay} repeatCount="indefinite" path={t.d} />
              </circle>
            </g>
          ))}
        </g>
      </svg>

      {/* Ambient brand glow */}
      <div className="absolute top-[12%] left-[6%] w-[600px] h-[600px] bg-primary/15 dark:bg-primary/[0.07] rounded-full blur-[150px] mix-blend-screen" />
      <div className="absolute bottom-[6%] right-[6%] w-[700px] h-[700px] bg-blue-600/10 dark:bg-blue-800/20 rounded-full blur-[150px] mix-blend-screen" />

      {/* Vignette for depth */}
      <div
        className="absolute inset-0 opacity-0 dark:opacity-100"
        style={{
          background:
            "radial-gradient(115% 115% at 50% 40%, transparent 55%, rgba(0,0,0,0.5) 100%)",
        }}
      />
    </div>
  );
}
