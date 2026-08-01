import React from "react";

/**
 * Transparent "motherboard" landscape: a central microprocessor chip with
 * pin rows, realistic right-angle circuit traces with vias, solder pads and
 * small component footprints — blended with a glass hexagonal HIVE lattice.
 * Glowing pulses travel along the tracks. Pure SVG/CSS (SMIL animateMotion),
 * no JS animation loop; pulses hidden under prefers-reduced-motion.
 */

// Hexagon flat-top geometry used for the lattice pattern
const HEX_W = 60;
const HEX_H = 103.923;

// CPU footprint in the 1200x800 viewBox
const CPU = { x: 480, y: 300, w: 240, h: 200 };

// Circuit trace paths — right-angle motherboard routing radiating from the
// CPU pin rows outward, plus perimeter buses. 1200x800 viewBox, slice-fill.
const TRACES = [
  // Left pin fan-out (3 traces instead of 4)
  { d: "M 480 330 H 380 V 250 H 220 V 140 H -40", dur: "5.5s", delay: "0s", color: "#f5c518" },
  { d: "M 480 410 H 400 V 480 H 260 V 660 H -40", dur: "6.5s", delay: "0.7s", color: "#f5c518" },
  { d: "M 480 450 H 360 V 390 H 120 V 300 H -40", dur: "5.8s", delay: "2.2s", color: "#8ad7c1" },
  // Right pin fan-out (3 traces instead of 4)
  { d: "M 720 330 H 820 V 240 H 980 V 130 H 1260", dur: "5.2s", delay: "0.4s", color: "#6ea8ff" },
  { d: "M 720 410 H 800 V 500 H 940 V 660 H 1260", dur: "6.8s", delay: "0.2s", color: "#f5c518" },
  { d: "M 720 450 H 880 V 380 H 1080 V 300 H 1260", dur: "5.6s", delay: "2.6s", color: "#8ad7c1" },
];

// Via/solder-pad nodes at trace corners
const NODES = [
  { x: 380, y: 250 }, { x: 220, y: 140 },
  { x: 400, y: 480 }, { x: 260, y: 660 },
  { x: 360, y: 390 }, { x: 120, y: 300 },
  { x: 820, y: 240 }, { x: 980, y: 130 },
  { x: 800, y: 500 }, { x: 940, y: 660 },
  { x: 880, y: 380 }, { x: 1080, y: 300 },
];

// Small SMD component footprints (resistor/capacitor pairs) scattered on the board
const COMPONENTS: { x: number; y: number; w: number; h: number; rot?: number }[] = [
  { x: 300, y: 190, w: 26, h: 10 }, { x: 900, y: 195, w: 26, h: 10 },
  { x: 200, y: 480, w: 10, h: 26 }, { x: 990, y: 470, w: 10, h: 26 },
  { x: 340, y: 640, w: 26, h: 10 }, { x: 850, y: 630, w: 26, h: 10 },
  { x: 160, y: 220, w: 10, h: 26 }, { x: 1040, y: 220, w: 10, h: 26 },
  { x: 460, y: 120, w: 26, h: 10 }, { x: 730, y: 120, w: 26, h: 10 },
  { x: 460, y: 670, w: 26, h: 10 }, { x: 720, y: 665, w: 26, h: 10 },
];

// CPU pin stubs along each edge
function cpuPins() {
  const pins: React.ReactNode[] = [];
  const pinLen = 14;
  for (let i = 0; i < 7; i++) {
    const y = CPU.y + 25 + i * 25;
    pins.push(<line key={`pl-${i}`} x1={CPU.x - pinLen} y1={y} x2={CPU.x} y2={y} />);
    pins.push(<line key={`pr-${i}`} x1={CPU.x + CPU.w} y1={y} x2={CPU.x + CPU.w + pinLen} y2={y} />);
  }
  for (let i = 0; i < 9; i++) {
    const x = CPU.x + 20 + i * 25;
    pins.push(<line key={`pt-${i}`} x1={x} y1={CPU.y - pinLen} x2={x} y2={CPU.y} />);
    pins.push(<line key={`pb-${i}`} x1={x} y1={CPU.y + CPU.h} x2={x} y2={CPU.y + CPU.h + pinLen} />);
  }
  return pins;
}

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

      {/* Glass hexagon HIVE lattice */}
      <div className="absolute inset-0 opacity-60 dark:opacity-50">
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
                fill="rgba(245,197,24,0.015)"
                className="text-primary/20 dark:text-primary/[0.13]"
              />
              <path
                d={`M${HEX_W / 2} ${HEX_H}L${HEX_W} ${(HEX_H * 5) / 6}L${HEX_W} ${HEX_H / 2}L${HEX_W / 2} ${(HEX_H * 2) / 3}L0 ${HEX_H / 2}L0 ${(HEX_H * 5) / 6}Z`}
                stroke="currentColor"
                strokeWidth="1"
                fill="rgba(110,168,255,0.015)"
                className="text-blue-400/20 dark:text-blue-400/[0.13]"
              />
            </pattern>
            <radialGradient id="hex-fade" cx="50%" cy="40%" r="80%">
              <stop offset="0%" stopColor="white" stopOpacity="1" />
              <stop offset="92%" stopColor="white" stopOpacity="0" />
            </radialGradient>
            <mask id="hex-fade-mask">
              <rect width="100%" height="100%" fill="url(#hex-fade)" />
            </mask>
          </defs>
          <rect width="100%" height="100%" fill="url(#hex-lattice)" mask="url(#hex-fade-mask)" />
        </svg>
      </div>

      {/* Motherboard: CPU + traces + vias + components + travelling pulses */}
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

        {/* Central microprocessor */}
        <g className="opacity-[0.18] dark:opacity-[0.22]">
          {/* Package outline */}
          <rect
            x={CPU.x} y={CPU.y} width={CPU.w} height={CPU.h} rx="10"
            fill="rgba(245,197,24,0.04)" stroke="#f5c518" strokeWidth="1.4"
          />
          {/* Inner die */}
          <rect
            x={CPU.x + 55} y={CPU.y + 45} width={CPU.w - 110} height={CPU.h - 90} rx="6"
            fill="rgba(110,168,255,0.05)" stroke="#6ea8ff" strokeWidth="1"
          />
          {/* Die hexagon — the HIVE mark at the heart of the chip */}
          <path
            d={`M600 ${365} l26 15 v30 l-26 15 l-26 -15 v-30 Z`}
            fill="rgba(245,197,24,0.08)" stroke="#f5c518" strokeWidth="1.2"
          />
          {/* Pin stubs */}
          <g stroke="#f5c518" strokeWidth="1.4">{cpuPins()}</g>
          {/* Corner alignment marks */}
          <circle cx={CPU.x + 14} cy={CPU.y + 14} r="4" fill="none" stroke="#6ea8ff" strokeWidth="1" />
          <circle cx={CPU.x + CPU.w - 14} cy={CPU.y + CPU.h - 14} r="4" fill="none" stroke="#6ea8ff" strokeWidth="1" />
        </g>

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
            className="opacity-[0.14] dark:opacity-[0.18]"
          />
        ))}

        {/* Vias / solder pads */}
        {NODES.map((n, i) => (
          <g key={`node-${i}`}>
            <circle cx={n.x} cy={n.y} r="4.5" fill="none" stroke="#f5c518" strokeWidth="1" className="opacity-20" />
            <circle cx={n.x} cy={n.y} r="1.8" fill="#f5c518" className="opacity-25" />
          </g>
        ))}

        {/* SMD component footprints */}
        <g className="opacity-[0.14] dark:opacity-[0.18]">
          {COMPONENTS.map((c, i) => (
            <g key={`smd-${i}`}>
              <rect x={c.x} y={c.y} width={c.w} height={c.h} rx="2" fill="rgba(110,168,255,0.06)" stroke="#6ea8ff" strokeWidth="0.9" />
              {c.w > c.h ? (
                <>
                  <rect x={c.x - 3} y={c.y + 1} width="3" height={c.h - 2} fill="#f5c518" opacity="0.6" />
                  <rect x={c.x + c.w} y={c.y + 1} width="3" height={c.h - 2} fill="#f5c518" opacity="0.6" />
                </>
              ) : (
                <>
                  <rect x={c.x + 1} y={c.y - 3} width={c.w - 2} height="3" fill="#f5c518" opacity="0.6" />
                  <rect x={c.x + 1} y={c.y + c.h} width={c.w - 2} height="3" fill="#f5c518" opacity="0.6" />
                </>
              )}
            </g>
          ))}
        </g>

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
      <div className="absolute top-[12%] left-[6%] w-[400px] h-[400px] bg-primary/15 dark:bg-primary/[0.07] rounded-full blur-[80px] mix-blend-screen" />
      <div className="absolute bottom-[6%] right-[6%] w-[450px] h-[450px] bg-blue-600/10 dark:bg-blue-800/20 rounded-full blur-[80px] mix-blend-screen" />

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
