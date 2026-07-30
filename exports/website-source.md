# Health HIVE Ecosystem Website — Full Source Code

React + Vite + TypeScript + Tailwind. Exported 2026-07-18.

## `package.json`

```json
{
  "name": "@workspace/website",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite --config vite.config.ts --host 0.0.0.0",
    "build": "vite build --config vite.config.ts",
    "serve": "vite preview --config vite.config.ts --host 0.0.0.0",
    "typecheck": "tsc -p tsconfig.json --noEmit"
  },
  "devDependencies": {
    "@hookform/resolvers": "^3.10.0",
    "@radix-ui/react-accordion": "^1.2.4",
    "@radix-ui/react-alert-dialog": "^1.1.7",
    "@radix-ui/react-aspect-ratio": "^1.1.3",
    "@radix-ui/react-avatar": "^1.1.4",
    "@radix-ui/react-checkbox": "^1.1.5",
    "@radix-ui/react-collapsible": "^1.1.4",
    "@radix-ui/react-context-menu": "^2.2.7",
    "@radix-ui/react-dialog": "^1.1.7",
    "@radix-ui/react-dropdown-menu": "^2.1.7",
    "@radix-ui/react-hover-card": "^1.1.7",
    "@radix-ui/react-label": "^2.1.3",
    "@radix-ui/react-menubar": "^1.1.7",
    "@radix-ui/react-navigation-menu": "^1.2.6",
    "@radix-ui/react-popover": "^1.1.7",
    "@radix-ui/react-progress": "^1.1.3",
    "@radix-ui/react-radio-group": "^1.2.4",
    "@radix-ui/react-scroll-area": "^1.2.4",
    "@radix-ui/react-select": "^2.1.7",
    "@radix-ui/react-separator": "^1.1.3",
    "@radix-ui/react-slider": "^1.2.4",
    "@radix-ui/react-slot": "^1.2.0",
    "@radix-ui/react-switch": "^1.1.4",
    "@radix-ui/react-tabs": "^1.1.4",
    "@radix-ui/react-toast": "^1.2.7",
    "@radix-ui/react-toggle": "^1.1.3",
    "@radix-ui/react-toggle-group": "^1.1.3",
    "@radix-ui/react-tooltip": "^1.2.0",
    "@replit/vite-plugin-cartographer": "catalog:",
    "@replit/vite-plugin-dev-banner": "catalog:",
    "@replit/vite-plugin-runtime-error-modal": "catalog:",
    "@tailwindcss/typography": "^0.5.15",
    "@tailwindcss/vite": "catalog:",
    "@tanstack/react-query": "catalog:",
    "@types/node": "catalog:",
    "@types/react": "catalog:",
    "@types/react-dom": "catalog:",
    "@vitejs/plugin-react": "catalog:",
    "@workspace/api-client-react": "workspace:*",
    "class-variance-authority": "catalog:",
    "clsx": "catalog:",
    "cmdk": "^1.1.1",
    "date-fns": "^3.6.0",
    "embla-carousel-react": "^8.6.0",
    "framer-motion": "catalog:",
    "input-otp": "^1.4.2",
    "lucide-react": "catalog:",
    "next-themes": "^0.4.6",
    "react": "catalog:",
    "react-day-picker": "^9.11.1",
    "react-dom": "catalog:",
    "react-hook-form": "^7.55.0",
    "react-icons": "^5.4.0",
    "react-resizable-panels": "^2.1.7",
    "recharts": "^2.15.2",
    "sonner": "^2.0.7",
    "tailwind-merge": "catalog:",
    "tailwindcss": "catalog:",
    "tw-animate-css": "^1.4.0",
    "vaul": "^1.1.2",
    "vite": "catalog:",
    "wouter": "^3.3.5",
    "zod": "catalog:"
  },
  "dependencies": {
    "@fontsource/inter": "^5.2.8",
    "@simplewebauthn/browser": "^13.3.0"
  }
}
```

## `tsconfig.json`

```json
{
  "extends": "../../tsconfig.base.json",
  "include": ["src/**/*"],
  "exclude": ["node_modules", "build", "dist", "**/*.test.ts"],
  "compilerOptions": {
    "incremental": true,
    "tsBuildInfoFile": ".tsbuildinfo",
    "noEmit": true,
    "jsx": "preserve",
    "lib": ["esnext", "dom", "dom.iterable"],
    "resolveJsonModule": true,
    "allowImportingTsExtensions": true,
    "moduleResolution": "bundler",
    "types": ["node", "vite/client"],
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "references": [
    {
      "path": "../../lib/api-client-react"
    }
  ]
}
```

## `vite.config.ts`

```ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";

const rawPort = process.env.PORT;

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

const basePath = process.env.BASE_PATH;

if (!basePath) {
  throw new Error(
    "BASE_PATH environment variable is required but was not provided.",
  );
}

export default defineConfig({
  base: basePath,
  plugins: [
    react(),
    tailwindcss(),
    runtimeErrorOverlay(),
    ...(process.env.NODE_ENV !== "production" &&
    process.env.REPL_ID !== undefined
      ? [
          await import("@replit/vite-plugin-cartographer").then((m) =>
            m.cartographer({
              root: path.resolve(import.meta.dirname, ".."),
            }),
          ),
          await import("@replit/vite-plugin-dev-banner").then((m) =>
            m.devBanner(),
          ),
        ]
      : []),
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "src"),
      "@assets": path.resolve(import.meta.dirname, "..", "..", "attached_assets"),
    },
    dedupe: ["react", "react-dom"],
  },
  root: path.resolve(import.meta.dirname),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
  },
  server: {
    port,
    strictPort: true,
    host: "0.0.0.0",
    allowedHosts: true,
    fs: {
      strict: true,
    },
  },
  preview: {
    port,
    host: "0.0.0.0",
    allowedHosts: true,
  },
});
```

## `components.json`

```json
{
    "$schema": "https://ui.shadcn.com/schema.json",
    "style": "new-york",
    "rsc": false,
    "tsx": true,
    "tailwind": {
      "config": "",
      "css": "src/index.css",
      "baseColor": "neutral",
      "cssVariables": true,
      "prefix": ""
    },
    "aliases": {
      "components": "@/components",
      "utils": "@/lib/utils",
      "ui": "@/components/ui",
      "lib": "@/lib",
      "hooks": "@/hooks"
    }
}```

## `index.html`

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Health HIVE Ecosystem</title>
    <meta name="description" content="A connected health platform from Ireland. Patients keep their records organised; clinicians stay supported on call." />
    <meta name="robots" content="index, follow" />
    <meta property="og:title" content="Health HIVE Ecosystem" />
    <meta property="og:description" content="A connected health platform from Ireland. Patients keep their records organised; clinicians stay supported on call." />
    <meta property="og:type" content="website" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="Health HIVE Ecosystem" />
    <meta name="twitter:description" content="A connected health platform from Ireland. Patients keep their records organised; clinicians stay supported on call." />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <script>
      (function() {
        try {
          // Optional deep-link override, e.g. ?theme=dark — persisted so the app stays in sync.
          const override = new URLSearchParams(window.location.search).get('theme');
          if (override === 'dark' || override === 'light') {
            localStorage.setItem('theme', override);
          }
          const theme = localStorage.getItem('theme');
          const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
          if (theme === 'dark' || ((!theme || theme === 'system') && prefersDark)) {
            document.documentElement.classList.add('dark');
          }
        } catch (e) {}
      })();
    </script>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>```

## `src/App.tsx`

```tsx
import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import BookPage from "@/pages/book";
import PortalLanding from "@/portal/Landing";
import PortalSignup from "@/portal/Signup";
import PortalLogin from "@/portal/Login";
import PortalEmergency from "@/portal/Emergency";
import PortalCaretaker from "@/portal/Caretaker";
import PortalPricing from "@/portal/Pricing";
import PortalPrivacy from "@/portal/Privacy";
import PortalPractitioner from "@/portal/Practitioner";
import PortalSupportiveCare from "@/portal/SupportiveCare";
import PortalFirstResponder from "@/portal/FirstResponder";
import PracticePatientFile from "@/portal/PracticePatientFile";

const queryClient = new QueryClient();

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/book" component={BookPage} />
      <Route path="/portal" component={PortalLanding} />
      <Route path="/portal/signup" component={PortalSignup} />
      <Route path="/portal/login" component={PortalLogin} />
      <Route path="/portal/emergency" component={PortalEmergency} />
      <Route path="/portal/caretaker" component={PortalCaretaker} />
      <Route path="/portal/pricing" component={PortalPricing} />
      <Route path="/portal/privacy" component={PortalPrivacy} />
      <Route path="/portal/practitioner" component={PortalPractitioner} />
      <Route path="/portal/supportive" component={PortalSupportiveCare} />
      <Route path="/portal/responder" component={PortalFirstResponder} />
      <Route path="/portal/practitioner/patients/:id" component={PracticePatientFile} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
```

## `src/components/CircuitHexBackground.tsx`

```tsx
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
```

## `src/components/ExchangeSection.tsx`

```tsx
import { motion } from "framer-motion";
import {
  Lock, ShieldCheck, RefreshCw, KeyRound,
  Smartphone, Stethoscope, Building2, HeartHandshake, X, Check,
} from "lucide-react";
import { HiveLogo } from "@/components/HiveLogo";

const SMOOTH_EASE = [0.22, 1, 0.36, 1] as const;

const fadeInUp = {
  hidden: { opacity: 0, y: 28 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: SMOOTH_EASE } },
} as const;

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.12 } },
};

// Node positions in a 480x480 viewBox around a central hub
const NODES = [
  { x: 240, y: 62, label: "Patient", Icon: Smartphone },
  { x: 424, y: 168, label: "GP", Icon: Stethoscope },
  { x: 424, y: 318, label: "Hospital", Icon: Building2 },
  { x: 240, y: 424, label: "Pharmacy", Icon: RefreshCw },
  { x: 56, y: 318, label: "Supportive care", Icon: HeartHandshake },
  { x: 56, y: 168, label: "Caretaker", Icon: ShieldCheck },
];

const CX = 240;
const CY = 243;

function hexPoints(cx: number, cy: number, r: number) {
  return Array.from({ length: 6 }, (_, i) => {
    const a = (Math.PI / 180) * (60 * i - 90);
    return `${(cx + r * Math.cos(a)).toFixed(1)},${(cy + r * Math.sin(a)).toFixed(1)}`;
  }).join(" ");
}

function HubDiagram() {
  return (
    <div className="relative w-full max-w-[480px] mx-auto" aria-hidden="true">
      <svg viewBox="0 0 480 480" className="w-full h-auto" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <filter id="exch-glow" x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Spokes with travelling encrypted packets */}
        {NODES.map((n, i) => {
          const d = `M ${n.x} ${n.y} L ${CX} ${CY}`;
          const back = `M ${CX} ${CY} L ${n.x} ${n.y}`;
          const dur = `${3.6 + i * 0.45}s`;
          const delay = `${i * 0.55}s`;
          const color = i % 2 === 0 ? "#f5c518" : "#6ea8ff";
          return (
            <g key={n.label}>
              <path d={d} stroke="currentColor" strokeWidth="1.1" className="text-primary/25 dark:text-primary/20" strokeDasharray="4 5" fill="none" />
              <g className="motion-reduce:hidden">
                <circle r="3" fill={color} filter="url(#exch-glow)">
                  <animateMotion dur={dur} begin={delay} repeatCount="indefinite" path={d} />
                </circle>
                <circle r="3" fill={color} opacity="0.7" filter="url(#exch-glow)">
                  <animateMotion dur={dur} begin={`${i * 0.55 + 1.7}s`} repeatCount="indefinite" path={back} />
                </circle>
              </g>
            </g>
          );
        })}

        {/* Central hub hexagon */}
        <polygon points={hexPoints(CX, CY, 58)} className="fill-primary/10 stroke-primary/60" strokeWidth="1.6" />
        <polygon points={hexPoints(CX, CY, 44)} className="fill-background/60 stroke-primary/30" strokeWidth="1" />

        {/* Node hexagons */}
        {NODES.map((n) => (
          <polygon key={`hex-${n.label}`} points={hexPoints(n.x, n.y, 34)} className="fill-background/70 stroke-border" strokeWidth="1.2" />
        ))}
      </svg>

      {/* HTML overlays for crisp icons/text */}
      <div className="absolute inset-0">
        <div
          className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-1"
          style={{ left: `${(CX / 480) * 100}%`, top: `${(CY / 480) * 100}%` }}
        >
          <HiveLogo size={30} />
          <span className="text-[10px] font-bold tracking-widest uppercase text-primary">HIVE Hub</span>
          <span className="text-[9px] text-muted-foreground flex items-center gap-1"><Lock className="h-2.5 w-2.5" /> encrypted relay</span>
        </div>
        {NODES.map((n) => (
          <div
            key={`ov-${n.label}`}
            className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-0.5"
            style={{ left: `${(n.x / 480) * 100}%`, top: `${(n.y / 480) * 100}%` }}
          >
            <n.Icon className="h-4 w-4 text-primary" />
            <span className="text-[9px] font-semibold text-foreground whitespace-nowrap">{n.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ExchangeSection() {
  return (
    <section id="exchange" className="py-24 lg:py-36 relative overflow-hidden">
      <div className="container mx-auto px-6 relative z-10">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeInUp}
          className="flex flex-col items-center text-center mb-14 max-w-3xl mx-auto"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md glass-panel text-foreground text-xs font-bold tracking-widest uppercase mb-6">
            <Lock className="h-3 w-3 text-primary" />
            Encrypted Data Exchange
          </div>
          <h2 className="text-[clamp(2.2rem,4.5vw,3.75rem)] font-bold mb-6 text-foreground leading-tight text-balance">
            A hub of nodes — not a honeypot of records
          </h2>
          <p className="text-lg md:text-xl text-muted-foreground font-light glass-panel px-6 py-3 rounded-2xl">
            Health HIVE is designed like a decentralised exchange for health information.
            Your record lives on your own device. The HIVE Hub relays encrypted,
            patient-consented data between the people you choose — then lets it go.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center glass-panel-heavy p-8 md:p-14 rounded-[3rem] max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, x: -24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.9, ease: SMOOTH_EASE }}
          >
            <HubDiagram />
          </motion.div>

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            className="space-y-5"
          >
            {[
              {
                icon: <KeyRound className="h-5 w-5" />,
                title: "You hold the keys",
                desc: "Every share starts with your explicit consent — you choose which GP or treating physician can see your live medication list, and you can revoke access at any time.",
              },
              {
                icon: <Lock className="h-5 w-5" />,
                title: "Encrypted in transit, gone after use",
                desc: "Data moves through the hub as encrypted, time-limited relays. The hub is a courier, not a filing cabinet — it is designed to keep no permanent central medical record.",
              },
              {
                icon: <RefreshCw className="h-5 w-5" />,
                title: "Live data, not stale copies",
                desc: "Clinicians see what is current on your device right now — today's medications and prescriptions with a freshness timestamp, instead of an outdated printout.",
              },
              {
                icon: <ShieldCheck className="h-5 w-5" />,
                title: "GDPR-first, built in Ireland",
                desc: "Consent records show who accessed what and when. Built for EU GDPR from day one, with Irish patients, GPs and hospitals in mind.",
              },
            ].map((item, idx) => (
              <motion.div
                key={idx}
                variants={fadeInUp}
                className="flex items-start gap-4 p-5 rounded-2xl glass-panel border-transparent hover:border-primary/30 transition-colors"
              >
                <div className="mt-0.5 w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0 text-primary border border-primary/20">
                  {item.icon}
                </div>
                <div>
                  <h3 className="text-foreground font-semibold text-lg mb-1">{item.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>

        {/* Comparison: old central records vs HIVE model */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          variants={staggerContainer}
          className="grid md:grid-cols-2 gap-6 max-w-6xl mx-auto mt-10"
        >
          <motion.div variants={fadeInUp} className="glass-panel rounded-[2rem] p-8 border-border">
            <h3 className="text-xl font-bold text-foreground mb-5">Traditional centralised records</h3>
            <ul className="space-y-3">
              {[
                "One central database holds everyone's records — a single point of failure and a prime target",
                "Copies drift out of date across systems and printouts",
                "Access decisions sit with the institution, not the patient",
              ].map((line, i) => (
                <li key={i} className="flex items-start gap-3 text-sm text-muted-foreground leading-relaxed">
                  <X className="h-4 w-4 mt-0.5 flex-shrink-0 text-destructive/70" aria-hidden="true" />
                  {line}
                </li>
              ))}
            </ul>
          </motion.div>
          <motion.div variants={fadeInUp} className="glass-panel-heavy rounded-[2rem] p-8 border-primary/30">
            <h3 className="text-xl font-bold text-foreground mb-5 flex items-center gap-2">
              <HiveLogo size={20} /> The HIVE exchange model
            </h3>
            <ul className="space-y-3">
              {[
                "Records stay on patient and clinician devices — the hub only relays encrypted, consented exchanges",
                "Clinicians see live information straight from the source, with a freshness timestamp",
                "Every exchange is patient-authorised, logged for consent, and revocable at any time",
              ].map((line, i) => (
                <li key={i} className="flex items-start gap-3 text-sm text-muted-foreground leading-relaxed">
                  <Check className="h-4 w-4 mt-0.5 flex-shrink-0 text-primary" aria-hidden="true" />
                  {line}
                </li>
              ))}
            </ul>
          </motion.div>
        </motion.div>

        <motion.p
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeInUp}
          className="text-xs text-muted-foreground text-center max-w-2xl mx-auto mt-8"
        >
          Describes the Health HIVE architecture as designed. HIVE Companion is a health
          record organiser — not a medical device — and consent-based exchange features
          roll out progressively across the ecosystem.
        </motion.p>
      </div>
    </section>
  );
}
```

## `src/components/HiveLogo.tsx`

```tsx
import React from 'react';

export function HiveLogo({ className = "", size = 48 }: { className?: string, size?: number }) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 120 120" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Top Hexagon */}
      <path d="M60 10 L86 25 L86 55 L60 70 L34 55 L34 25 Z" fill="#F5C518" fillOpacity="0.9"/>
      {/* Bottom Right Hexagon */}
      <path d="M86 55 L112 70 L112 100 L86 115 L60 100 L60 70 Z" fill="#D4A017" fillOpacity="0.85"/>
      {/* Bottom Left Hexagon */}
      <path d="M34 55 L60 70 L60 100 L34 115 L8 100 L8 70 Z" fill="#C9860A" fillOpacity="0.95"/>
    </svg>
  );
}
```

## `src/components/PortalAdvertsSection.tsx`

```tsx
import { motion, useReducedMotion } from "framer-motion";
import { Link } from "wouter";
import {
  ArrowRight,
  CalendarClock,
  FolderHeart,
  HeartHandshake,
  KeyRound,
  ShieldCheck,
  Siren,
  Stethoscope,
  Timer,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const SMOOTH_EASE = [0.22, 1, 0.36, 1] as const;

const fadeInUp = {
  hidden: { opacity: 0, y: 28 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: SMOOTH_EASE } },
} as const;

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.14 } },
};

const PORTALS = [
  {
    icon: Stethoscope,
    accent: "text-primary",
    accentBg: "bg-primary/10 border-primary/25",
    badge: "For doctors",
    title: "GP & HIVE HUB",
    desc: "The doctors' workspace — GPs, hospital doctors and clinic specialists managing their HIVE patients.",
    points: [
      { icon: FolderHeart, text: "Patient files with questionnaires, notes & attachments" },
      { icon: CalendarClock, text: "Automated HIVE booking & video consultations" },
    ],
    href: "/portal/practitioner",
    cta: "Enter the GP & HIVE HUB",
  },
  {
    icon: HeartHandshake,
    accent: "text-primary",
    accentBg: "bg-primary/10 border-primary/25",
    badge: "For supportive care",
    title: "Supportive Care Professionals",
    desc: "Physiotherapists, occupational health and A&E follow-up teams with their own dedicated workspace.",
    points: [
      { icon: KeyRound, text: "Patient-approved emergency relay access" },
      { icon: Users, text: "Shared HIVE booking & consultation tools" },
    ],
    href: "/portal/supportive",
    cta: "Enter the Supportive Care portal",
  },
  {
    icon: Siren,
    accent: "text-destructive",
    accentBg: "bg-destructive/10 border-destructive/25",
    badge: "For first responders",
    title: "First Responders",
    desc: "Paramedics and emergency crews: rapid, patient-consented handover in the moments that matter.",
    points: [
      { icon: Timer, text: "Emergency code access — allergies, red flags, live meds" },
      { icon: ShieldCheck, text: "Time-limited, revocable, never centrally stored" },
    ],
    href: "/portal/responder",
    cta: "Enter the First Responders portal",
  },
] as const;

/**
 * Homepage advert section: one block per professional portal, each routing
 * to its dedicated entrance (three-way pathway mirrored in the backend).
 */
export function PortalAdvertsSection() {
  const reduceMotion = useReducedMotion();
  const fadeVariants = reduceMotion
    ? { hidden: { opacity: 1, y: 0 }, visible: { opacity: 1, y: 0 } }
    : fadeInUp;
  const containerVariants = reduceMotion
    ? { hidden: { opacity: 1 }, visible: { opacity: 1 } }
    : staggerContainer;
  return (
    <section id="portals" className="py-24 lg:py-36 relative overflow-hidden">
      <div className="container mx-auto px-6 relative z-10">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeVariants}
          className="flex flex-col items-center text-center mb-14 max-w-3xl mx-auto"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md glass-panel text-foreground text-xs font-bold tracking-widest uppercase mb-6">
            <ShieldCheck className="h-3 w-3 text-primary" />
            Professional Portals
          </div>
          <h2 className="text-[clamp(2.2rem,4.5vw,3.75rem)] font-bold mb-6 text-foreground leading-tight text-balance">
            Three portals. One trusted exchange.
          </h2>
          <p className="text-lg md:text-xl text-muted-foreground font-light glass-panel px-6 py-3 rounded-2xl">
            Every professional group gets its own dedicated entrance — doctors,
            supportive care and first responders — each with the tools of their
            role, all running on patient-consented, encrypted relays.
          </p>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto"
        >
          {PORTALS.map((p) => (
            <motion.div
              key={p.title}
              variants={fadeVariants}
              className="glass-panel-heavy rounded-[2rem] p-8 flex flex-col border-transparent hover:border-primary/30 transition-colors"
            >
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border ${p.accentBg} mb-5`}>
                <p.icon className={`h-7 w-7 ${p.accent}`} aria-hidden="true" />
              </div>
              <div className="text-xs font-bold tracking-widest uppercase text-muted-foreground mb-2">
                {p.badge}
              </div>
              <h3 className="text-2xl font-bold text-foreground mb-3">{p.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed mb-5">{p.desc}</p>
              <ul className="space-y-2.5 mb-8">
                {p.points.map((pt) => (
                  <li key={pt.text} className="flex items-start gap-2.5 text-sm text-muted-foreground leading-relaxed">
                    <pt.icon className="h-4 w-4 mt-0.5 flex-shrink-0 text-primary" aria-hidden="true" />
                    {pt.text}
                  </li>
                ))}
              </ul>
              <Button asChild className="mt-auto w-full gap-1.5">
                <Link href={p.href}>
                  {p.cta} <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              </Button>
            </motion.div>
          ))}
        </motion.div>

        <motion.p
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeVariants}
          className="text-xs text-muted-foreground text-center max-w-2xl mx-auto mt-8"
        >
          Each portal is role-gated: sign in and you land in the workspace built
          for your profession. Caretakers and emergency code holders can use the{" "}
          <Link href="/portal" className="text-primary underline underline-offset-4 hover:opacity-80">
            Emergency Portal
          </Link>{" "}
          entrance.
        </motion.p>
      </div>
    </section>
  );
}
```

## `src/components/RubberBackground.tsx`

```tsx
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
```

## `src/components/ThemeToggle.tsx`

```tsx
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/hooks/use-theme";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <Button
      variant="outline"
      size="icon"
      className="rounded-full bg-background/50 backdrop-blur border-border/50 text-foreground"
      onClick={() => setTheme(theme === "light" ? "dark" : "light")}
      aria-label={theme === "light" ? "Switch to dark theme" : "Switch to light theme"}
    >
      <Sun aria-hidden="true" className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <Moon aria-hidden="true" className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
    </Button>
  );
}
```

## `src/components/TrustStrip.tsx`

```tsx
import { ShieldCheck, HardDrive, MapPin, Flag } from "lucide-react";

export function TrustStrip() {
  const items = [
    {
      icon: <ShieldCheck className="h-6 w-6 text-primary mb-3" />,
      title: "GDPR Compliant",
      description: "Built for strict European data protection standards",
    },
    {
      icon: <HardDrive className="h-6 w-6 text-primary mb-3" />,
      title: "On-Device Storage",
      description: "Data lives on your phone, not in the cloud",
    },
    {
      icon: <MapPin className="h-6 w-6 text-primary mb-3" />,
      title: "Irish Company",
      description: "Headquartered and registered in Dublin",
    },
    {
      icon: <Flag className="h-6 w-6 text-primary mb-3" />,
      title: "HSE Safety Standards",
      description: "Aligned with HSE safety standards for patient information",
    },
  ];

  return (
    <section className="py-12 border-y border-border/40 bg-card/30 backdrop-blur-sm">
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {items.map((item, i) => (
            <div key={i} className="flex flex-col items-center text-center">
              {item.icon}
              <p className="font-bold text-foreground text-sm uppercase tracking-wider">{item.title}</p>
              <p className="text-muted-foreground text-xs mt-1 max-w-[200px]">{item.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
```

## `src/components/ui/accordion.tsx`

```tsx
import * as React from "react"
import * as AccordionPrimitive from "@radix-ui/react-accordion"
import { ChevronDown } from "lucide-react"

import { cn } from "@/lib/utils"

const Accordion = AccordionPrimitive.Root

const AccordionItem = React.forwardRef<
  React.ElementRef<typeof AccordionPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Item>
>(({ className, ...props }, ref) => (
  <AccordionPrimitive.Item
    ref={ref}
    className={cn("border-b", className)}
    {...props}
  />
))
AccordionItem.displayName = "AccordionItem"

const AccordionTrigger = React.forwardRef<
  React.ElementRef<typeof AccordionPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Trigger>
>(({ className, children, ...props }, ref) => (
  <AccordionPrimitive.Header className="flex">
    <AccordionPrimitive.Trigger
      ref={ref}
      className={cn(
        "flex flex-1 items-center justify-between py-4 text-sm font-medium transition-all hover:underline text-left [&[data-state=open]>svg]:rotate-180",
        className
      )}
      {...props}
    >
      {children}
      <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200" />
    </AccordionPrimitive.Trigger>
  </AccordionPrimitive.Header>
))
AccordionTrigger.displayName = AccordionPrimitive.Trigger.displayName

const AccordionContent = React.forwardRef<
  React.ElementRef<typeof AccordionPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <AccordionPrimitive.Content
    ref={ref}
    className="overflow-hidden text-sm data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down"
    {...props}
  >
    <div className={cn("pb-4 pt-0", className)}>{children}</div>
  </AccordionPrimitive.Content>
))
AccordionContent.displayName = AccordionPrimitive.Content.displayName

export { Accordion, AccordionItem, AccordionTrigger, AccordionContent }
```

## `src/components/ui/alert-dialog.tsx`

```tsx
import * as React from "react"
import * as AlertDialogPrimitive from "@radix-ui/react-alert-dialog"

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"

const AlertDialog = AlertDialogPrimitive.Root

const AlertDialogTrigger = AlertDialogPrimitive.Trigger

const AlertDialogPortal = AlertDialogPrimitive.Portal

const AlertDialogOverlay = React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <AlertDialogPrimitive.Overlay
    className={cn(
      "fixed inset-0 z-50 bg-black/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      className
    )}
    {...props}
    ref={ref}
  />
))
AlertDialogOverlay.displayName = AlertDialogPrimitive.Overlay.displayName

const AlertDialogContent = React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Content>
>(({ className, ...props }, ref) => (
  <AlertDialogPortal>
    <AlertDialogOverlay />
    <AlertDialogPrimitive.Content
      ref={ref}
      className={cn(
        "fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg",
        className
      )}
      {...props}
    />
  </AlertDialogPortal>
))
AlertDialogContent.displayName = AlertDialogPrimitive.Content.displayName

const AlertDialogHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col space-y-2 text-center sm:text-left",
      className
    )}
    {...props}
  />
)
AlertDialogHeader.displayName = "AlertDialogHeader"

const AlertDialogFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2",
      className
    )}
    {...props}
  />
)
AlertDialogFooter.displayName = "AlertDialogFooter"

const AlertDialogTitle = React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <AlertDialogPrimitive.Title
    ref={ref}
    className={cn("text-lg font-semibold", className)}
    {...props}
  />
))
AlertDialogTitle.displayName = AlertDialogPrimitive.Title.displayName

const AlertDialogDescription = React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <AlertDialogPrimitive.Description
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
))
AlertDialogDescription.displayName =
  AlertDialogPrimitive.Description.displayName

const AlertDialogAction = React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Action>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Action>
>(({ className, ...props }, ref) => (
  <AlertDialogPrimitive.Action
    ref={ref}
    className={cn(buttonVariants(), className)}
    {...props}
  />
))
AlertDialogAction.displayName = AlertDialogPrimitive.Action.displayName

const AlertDialogCancel = React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Cancel>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Cancel>
>(({ className, ...props }, ref) => (
  <AlertDialogPrimitive.Cancel
    ref={ref}
    className={cn(
      buttonVariants({ variant: "outline" }),
      "mt-2 sm:mt-0",
      className
    )}
    {...props}
  />
))
AlertDialogCancel.displayName = AlertDialogPrimitive.Cancel.displayName

export {
  AlertDialog,
  AlertDialogPortal,
  AlertDialogOverlay,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
}
```

## `src/components/ui/alert.tsx`

```tsx
import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const alertVariants = cva(
  "relative w-full rounded-lg border px-4 py-3 text-sm [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-foreground [&>svg~*]:pl-7",
  {
    variants: {
      variant: {
        default: "bg-background text-foreground",
        destructive:
          "border-destructive/50 text-destructive dark:border-destructive [&>svg]:text-destructive",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

const Alert = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof alertVariants>
>(({ className, variant, ...props }, ref) => (
  <div
    ref={ref}
    role="alert"
    className={cn(alertVariants({ variant }), className)}
    {...props}
  />
))
Alert.displayName = "Alert"

const AlertTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h5
    ref={ref}
    className={cn("mb-1 font-medium leading-none tracking-tight", className)}
    {...props}
  />
))
AlertTitle.displayName = "AlertTitle"

const AlertDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("text-sm [&_p]:leading-relaxed", className)}
    {...props}
  />
))
AlertDescription.displayName = "AlertDescription"

export { Alert, AlertTitle, AlertDescription }
```

## `src/components/ui/aspect-ratio.tsx`

```tsx
import * as AspectRatioPrimitive from "@radix-ui/react-aspect-ratio"

const AspectRatio = AspectRatioPrimitive.Root

export { AspectRatio }
```

## `src/components/ui/avatar.tsx`

```tsx
"use client"

import * as React from "react"
import * as AvatarPrimitive from "@radix-ui/react-avatar"

import { cn } from "@/lib/utils"

const Avatar = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Root>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Root
    ref={ref}
    className={cn(
      "relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full",
      className
    )}
    {...props}
  />
))
Avatar.displayName = AvatarPrimitive.Root.displayName

const AvatarImage = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Image>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Image>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Image
    ref={ref}
    className={cn("aspect-square h-full w-full", className)}
    {...props}
  />
))
AvatarImage.displayName = AvatarPrimitive.Image.displayName

const AvatarFallback = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Fallback>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Fallback>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Fallback
    ref={ref}
    className={cn(
      "flex h-full w-full items-center justify-center rounded-full bg-muted",
      className
    )}
    {...props}
  />
))
AvatarFallback.displayName = AvatarPrimitive.Fallback.displayName

export { Avatar, AvatarImage, AvatarFallback }
```

## `src/components/ui/badge.tsx`

```tsx
import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  // @replit
  // Whitespace-nowrap: Badges should never wrap.
  "whitespace-nowrap inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2" +
  " hover-elevate ",
  {
    variants: {
      variant: {
        default:
          // @replit shadow-xs instead of shadow, no hover because we use hover-elevate
          "border-transparent bg-primary text-primary-foreground shadow-xs",
        secondary:
          // @replit no hover because we use hover-elevate
          "border-transparent bg-secondary text-secondary-foreground",
        destructive:
          // @replit shadow-xs instead of shadow, no hover because we use hover-elevate
          "border-transparent bg-destructive text-destructive-foreground shadow-xs",
          // @replit shadow-xs" - use badge outline variable
        outline: "text-foreground border [border-color:var(--badge-outline)]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
```

## `src/components/ui/breadcrumb.tsx`

```tsx
import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { ChevronRight, MoreHorizontal } from "lucide-react"

import { cn } from "@/lib/utils"

const Breadcrumb = React.forwardRef<
  HTMLElement,
  React.ComponentPropsWithoutRef<"nav"> & {
    separator?: React.ReactNode
  }
>(({ ...props }, ref) => <nav ref={ref} aria-label="breadcrumb" {...props} />)
Breadcrumb.displayName = "Breadcrumb"

const BreadcrumbList = React.forwardRef<
  HTMLOListElement,
  React.ComponentPropsWithoutRef<"ol">
>(({ className, ...props }, ref) => (
  <ol
    ref={ref}
    className={cn(
      "flex flex-wrap items-center gap-1.5 break-words text-sm text-muted-foreground sm:gap-2.5",
      className
    )}
    {...props}
  />
))
BreadcrumbList.displayName = "BreadcrumbList"

const BreadcrumbItem = React.forwardRef<
  HTMLLIElement,
  React.ComponentPropsWithoutRef<"li">
>(({ className, ...props }, ref) => (
  <li
    ref={ref}
    className={cn("inline-flex items-center gap-1.5", className)}
    {...props}
  />
))
BreadcrumbItem.displayName = "BreadcrumbItem"

const BreadcrumbLink = React.forwardRef<
  HTMLAnchorElement,
  React.ComponentPropsWithoutRef<"a"> & {
    asChild?: boolean
  }
>(({ asChild, className, ...props }, ref) => {
  const Comp = asChild ? Slot : "a"

  return (
    <Comp
      ref={ref}
      className={cn("transition-colors hover:text-foreground", className)}
      {...props}
    />
  )
})
BreadcrumbLink.displayName = "BreadcrumbLink"

const BreadcrumbPage = React.forwardRef<
  HTMLSpanElement,
  React.ComponentPropsWithoutRef<"span">
>(({ className, ...props }, ref) => (
  <span
    ref={ref}
    role="link"
    aria-disabled="true"
    aria-current="page"
    className={cn("font-normal text-foreground", className)}
    {...props}
  />
))
BreadcrumbPage.displayName = "BreadcrumbPage"

const BreadcrumbSeparator = ({
  children,
  className,
  ...props
}: React.ComponentProps<"li">) => (
  <li
    role="presentation"
    aria-hidden="true"
    className={cn("[&>svg]:w-3.5 [&>svg]:h-3.5", className)}
    {...props}
  >
    {children ?? <ChevronRight />}
  </li>
)
BreadcrumbSeparator.displayName = "BreadcrumbSeparator"

const BreadcrumbEllipsis = ({
  className,
  ...props
}: React.ComponentProps<"span">) => (
  <span
    role="presentation"
    aria-hidden="true"
    className={cn("flex h-9 w-9 items-center justify-center", className)}
    {...props}
  >
    <MoreHorizontal className="h-4 w-4" />
    <span className="sr-only">More</span>
  </span>
)
BreadcrumbEllipsis.displayName = "BreadcrumbElipssis"

export {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
  BreadcrumbEllipsis,
}
```

## `src/components/ui/button.tsx`

```tsx
import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0" +
" hover-elevate active-elevate-2",
  {
    variants: {
      variant: {
        default:
           // @replit: no hover, and add primary border
           "bg-primary text-primary-foreground border border-primary-border",
        destructive:
          "bg-destructive text-destructive-foreground shadow-sm border-destructive-border",
        outline:
          // @replit Shows the background color of whatever card / sidebar / accent background it is inside of.
          // Inherits the current text color. Uses shadow-xs. no shadow on active
          // No hover state
          " border [border-color:var(--button-outline)] shadow-xs active:shadow-none ",
        secondary:
          // @replit border, no hover, no shadow, secondary border.
          "border bg-secondary text-secondary-foreground border border-secondary-border ",
        // @replit no hover, transparent border
        ghost: "border border-transparent",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        // @replit changed sizes
        default: "min-h-9 px-4 py-2",
        sm: "min-h-8 rounded-md px-3 text-xs",
        lg: "min-h-10 rounded-md px-8",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
```

## `src/components/ui/card.tsx`

```tsx
import * as React from "react"

import { cn } from "@/lib/utils"

const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "rounded-xl border bg-card text-card-foreground shadow",
      className
    )}
    {...props}
  />
))
Card.displayName = "Card"

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 p-6", className)}
    {...props}
  />
))
CardHeader.displayName = "CardHeader"

const CardTitle = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("font-semibold leading-none tracking-tight", className)}
    {...props}
  />
))
CardTitle.displayName = "CardTitle"

const CardDescription = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
))
CardDescription.displayName = "CardDescription"

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
))
CardContent.displayName = "CardContent"

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center p-6 pt-0", className)}
    {...props}
  />
))
CardFooter.displayName = "CardFooter"

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent }
```

## `src/components/ui/carousel.tsx`

```tsx
import * as React from "react"
import useEmblaCarousel, {
  type UseEmblaCarouselType,
} from "embla-carousel-react"
import { ArrowLeft, ArrowRight } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

type CarouselApi = UseEmblaCarouselType[1]
type UseCarouselParameters = Parameters<typeof useEmblaCarousel>
type CarouselOptions = UseCarouselParameters[0]
type CarouselPlugin = UseCarouselParameters[1]

type CarouselProps = {
  opts?: CarouselOptions
  plugins?: CarouselPlugin
  orientation?: "horizontal" | "vertical"
  setApi?: (api: CarouselApi) => void
}

type CarouselContextProps = {
  carouselRef: ReturnType<typeof useEmblaCarousel>[0]
  api: ReturnType<typeof useEmblaCarousel>[1]
  scrollPrev: () => void
  scrollNext: () => void
  canScrollPrev: boolean
  canScrollNext: boolean
} & CarouselProps

const CarouselContext = React.createContext<CarouselContextProps | null>(null)

function useCarousel() {
  const context = React.useContext(CarouselContext)

  if (!context) {
    throw new Error("useCarousel must be used within a <Carousel />")
  }

  return context
}

const Carousel = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & CarouselProps
>(
  (
    {
      orientation = "horizontal",
      opts,
      setApi,
      plugins,
      className,
      children,
      ...props
    },
    ref
  ) => {
    const [carouselRef, api] = useEmblaCarousel(
      {
        ...opts,
        axis: orientation === "horizontal" ? "x" : "y",
      },
      plugins
    )
    const [canScrollPrev, setCanScrollPrev] = React.useState(false)
    const [canScrollNext, setCanScrollNext] = React.useState(false)

    const onSelect = React.useCallback((api: CarouselApi) => {
      if (!api) {
        return
      }

      setCanScrollPrev(api.canScrollPrev())
      setCanScrollNext(api.canScrollNext())
    }, [])

    const scrollPrev = React.useCallback(() => {
      api?.scrollPrev()
    }, [api])

    const scrollNext = React.useCallback(() => {
      api?.scrollNext()
    }, [api])

    const handleKeyDown = React.useCallback(
      (event: React.KeyboardEvent<HTMLDivElement>) => {
        if (event.key === "ArrowLeft") {
          event.preventDefault()
          scrollPrev()
        } else if (event.key === "ArrowRight") {
          event.preventDefault()
          scrollNext()
        }
      },
      [scrollPrev, scrollNext]
    )

    React.useEffect(() => {
      if (!api || !setApi) {
        return
      }

      setApi(api)
    }, [api, setApi])

    React.useEffect(() => {
      if (!api) {
        return
      }

      onSelect(api)
      api.on("reInit", onSelect)
      api.on("select", onSelect)

      return () => {
        api?.off("select", onSelect)
      }
    }, [api, onSelect])

    return (
      <CarouselContext.Provider
        value={{
          carouselRef,
          api: api,
          opts,
          orientation:
            orientation || (opts?.axis === "y" ? "vertical" : "horizontal"),
          scrollPrev,
          scrollNext,
          canScrollPrev,
          canScrollNext,
        }}
      >
        <div
          ref={ref}
          onKeyDownCapture={handleKeyDown}
          className={cn("relative", className)}
          role="region"
          aria-roledescription="carousel"
          {...props}
        >
          {children}
        </div>
      </CarouselContext.Provider>
    )
  }
)
Carousel.displayName = "Carousel"

const CarouselContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  const { carouselRef, orientation } = useCarousel()

  return (
    <div ref={carouselRef} className="overflow-hidden">
      <div
        ref={ref}
        className={cn(
          "flex",
          orientation === "horizontal" ? "-ml-4" : "-mt-4 flex-col",
          className
        )}
        {...props}
      />
    </div>
  )
})
CarouselContent.displayName = "CarouselContent"

const CarouselItem = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  const { orientation } = useCarousel()

  return (
    <div
      ref={ref}
      role="group"
      aria-roledescription="slide"
      className={cn(
        "min-w-0 shrink-0 grow-0 basis-full",
        orientation === "horizontal" ? "pl-4" : "pt-4",
        className
      )}
      {...props}
    />
  )
})
CarouselItem.displayName = "CarouselItem"

const CarouselPrevious = React.forwardRef<
  HTMLButtonElement,
  React.ComponentProps<typeof Button>
>(({ className, variant = "outline", size = "icon", ...props }, ref) => {
  const { orientation, scrollPrev, canScrollPrev } = useCarousel()

  return (
    <Button
      ref={ref}
      variant={variant}
      size={size}
      className={cn(
        "absolute  h-8 w-8 rounded-full",
        orientation === "horizontal"
          ? "-left-12 top-1/2 -translate-y-1/2"
          : "-top-12 left-1/2 -translate-x-1/2 rotate-90",
        className
      )}
      disabled={!canScrollPrev}
      onClick={scrollPrev}
      {...props}
    >
      <ArrowLeft className="h-4 w-4" />
      <span className="sr-only">Previous slide</span>
    </Button>
  )
})
CarouselPrevious.displayName = "CarouselPrevious"

const CarouselNext = React.forwardRef<
  HTMLButtonElement,
  React.ComponentProps<typeof Button>
>(({ className, variant = "outline", size = "icon", ...props }, ref) => {
  const { orientation, scrollNext, canScrollNext } = useCarousel()

  return (
    <Button
      ref={ref}
      variant={variant}
      size={size}
      className={cn(
        "absolute h-8 w-8 rounded-full",
        orientation === "horizontal"
          ? "-right-12 top-1/2 -translate-y-1/2"
          : "-bottom-12 left-1/2 -translate-x-1/2 rotate-90",
        className
      )}
      disabled={!canScrollNext}
      onClick={scrollNext}
      {...props}
    >
      <ArrowRight className="h-4 w-4" />
      <span className="sr-only">Next slide</span>
    </Button>
  )
})
CarouselNext.displayName = "CarouselNext"

export {
  type CarouselApi,
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
}
```

## `src/components/ui/chart.tsx`

```tsx
import * as React from "react"
import * as RechartsPrimitive from "recharts"

import { cn } from "@/lib/utils"

// Format: { THEME_NAME: CSS_SELECTOR }
const THEMES = { light: "", dark: ".dark" } as const

export type ChartConfig = {
  [k in string]: {
    label?: React.ReactNode
    icon?: React.ComponentType
  } & (
    | { color?: string; theme?: never }
    | { color?: never; theme: Record<keyof typeof THEMES, string> }
  )
}

type ChartContextProps = {
  config: ChartConfig
}

const ChartContext = React.createContext<ChartContextProps | null>(null)

function useChart() {
  const context = React.useContext(ChartContext)

  if (!context) {
    throw new Error("useChart must be used within a <ChartContainer />")
  }

  return context
}

const ChartContainer = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div"> & {
    config: ChartConfig
    children: React.ComponentProps<
      typeof RechartsPrimitive.ResponsiveContainer
    >["children"]
  }
>(({ id, className, children, config, ...props }, ref) => {
  const uniqueId = React.useId()
  const chartId = `chart-${id || uniqueId.replace(/:/g, "")}`

  return (
    <ChartContext.Provider value={{ config }}>
      <div
        data-chart={chartId}
        ref={ref}
        className={cn(
          "flex aspect-video justify-center text-xs [&_.recharts-cartesian-axis-tick_text]:fill-muted-foreground [&_.recharts-cartesian-grid_line[stroke='#ccc']]:stroke-border/50 [&_.recharts-curve.recharts-tooltip-cursor]:stroke-border [&_.recharts-dot[stroke='#fff']]:stroke-transparent [&_.recharts-layer]:outline-none [&_.recharts-polar-grid_[stroke='#ccc']]:stroke-border [&_.recharts-radial-bar-background-sector]:fill-muted [&_.recharts-rectangle.recharts-tooltip-cursor]:fill-muted [&_.recharts-reference-line_[stroke='#ccc']]:stroke-border [&_.recharts-sector[stroke='#fff']]:stroke-transparent [&_.recharts-sector]:outline-none [&_.recharts-surface]:outline-none",
          className
        )}
        {...props}
      >
        <ChartStyle id={chartId} config={config} />
        <RechartsPrimitive.ResponsiveContainer>
          {children}
        </RechartsPrimitive.ResponsiveContainer>
      </div>
    </ChartContext.Provider>
  )
})
ChartContainer.displayName = "Chart"

const ChartStyle = ({ id, config }: { id: string; config: ChartConfig }) => {
  const colorConfig = Object.entries(config).filter(
    ([, config]) => config.theme || config.color
  )

  if (!colorConfig.length) {
    return null
  }

  return (
    <style
      dangerouslySetInnerHTML={{
        __html: Object.entries(THEMES)
          .map(
            ([theme, prefix]) => `
${prefix} [data-chart=${id}] {
${colorConfig
  .map(([key, itemConfig]) => {
    const color =
      itemConfig.theme?.[theme as keyof typeof itemConfig.theme] ||
      itemConfig.color
    return color ? `  --color-${key}: ${color};` : null
  })
  .join("\n")}
}
`
          )
          .join("\n"),
      }}
    />
  )
}

const ChartTooltip = RechartsPrimitive.Tooltip

const ChartTooltipContent = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<typeof RechartsPrimitive.Tooltip> &
    React.ComponentProps<"div"> & {
      hideLabel?: boolean
      hideIndicator?: boolean
      indicator?: "line" | "dot" | "dashed"
      nameKey?: string
      labelKey?: string
    }
>(
  (
    {
      active,
      payload,
      className,
      indicator = "dot",
      hideLabel = false,
      hideIndicator = false,
      label,
      labelFormatter,
      labelClassName,
      formatter,
      color,
      nameKey,
      labelKey,
    },
    ref
  ) => {
    const { config } = useChart()

    const tooltipLabel = React.useMemo(() => {
      if (hideLabel || !payload?.length) {
        return null
      }

      const [item] = payload
      const key = `${labelKey || item?.dataKey || item?.name || "value"}`
      const itemConfig = getPayloadConfigFromPayload(config, item, key)
      const value =
        !labelKey && typeof label === "string"
          ? config[label as keyof typeof config]?.label || label
          : itemConfig?.label

      if (labelFormatter) {
        return (
          <div className={cn("font-medium", labelClassName)}>
            {labelFormatter(value, payload)}
          </div>
        )
      }

      if (!value) {
        return null
      }

      return <div className={cn("font-medium", labelClassName)}>{value}</div>
    }, [
      label,
      labelFormatter,
      payload,
      hideLabel,
      labelClassName,
      config,
      labelKey,
    ])

    if (!active || !payload?.length) {
      return null
    }

    const nestLabel = payload.length === 1 && indicator !== "dot"

    return (
      <div
        ref={ref}
        className={cn(
          "grid min-w-[8rem] items-start gap-1.5 rounded-lg border border-border/50 bg-background px-2.5 py-1.5 text-xs shadow-xl",
          className
        )}
      >
        {!nestLabel ? tooltipLabel : null}
        <div className="grid gap-1.5">
          {payload
            .filter((item) => item.type !== "none")
            .map((item, index) => {
              const key = `${nameKey || item.name || item.dataKey || "value"}`
              const itemConfig = getPayloadConfigFromPayload(config, item, key)
              const indicatorColor = color || item.payload.fill || item.color

              return (
                <div
                  key={item.dataKey}
                  className={cn(
                    "flex w-full flex-wrap items-stretch gap-2 [&>svg]:h-2.5 [&>svg]:w-2.5 [&>svg]:text-muted-foreground",
                    indicator === "dot" && "items-center"
                  )}
                >
                  {formatter && item?.value !== undefined && item.name ? (
                    formatter(item.value, item.name, item, index, item.payload)
                  ) : (
                    <>
                      {itemConfig?.icon ? (
                        <itemConfig.icon />
                      ) : (
                        !hideIndicator && (
                          <div
                            className={cn(
                              "shrink-0 rounded-[2px] border-[--color-border] bg-[--color-bg]",
                              {
                                "h-2.5 w-2.5": indicator === "dot",
                                "w-1": indicator === "line",
                                "w-0 border-[1.5px] border-dashed bg-transparent":
                                  indicator === "dashed",
                                "my-0.5": nestLabel && indicator === "dashed",
                              }
                            )}
                            style={
                              {
                                "--color-bg": indicatorColor,
                                "--color-border": indicatorColor,
                              } as React.CSSProperties
                            }
                          />
                        )
                      )}
                      <div
                        className={cn(
                          "flex flex-1 justify-between leading-none",
                          nestLabel ? "items-end" : "items-center"
                        )}
                      >
                        <div className="grid gap-1.5">
                          {nestLabel ? tooltipLabel : null}
                          <span className="text-muted-foreground">
                            {itemConfig?.label || item.name}
                          </span>
                        </div>
                        {item.value && (
                          <span className="font-mono font-medium tabular-nums text-foreground">
                            {item.value.toLocaleString()}
                          </span>
                        )}
                      </div>
                    </>
                  )}
                </div>
              )
            })}
        </div>
      </div>
    )
  }
)
ChartTooltipContent.displayName = "ChartTooltip"

const ChartLegend = RechartsPrimitive.Legend

const ChartLegendContent = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div"> &
    Pick<RechartsPrimitive.LegendProps, "payload" | "verticalAlign"> & {
      hideIcon?: boolean
      nameKey?: string
    }
>(
  (
    { className, hideIcon = false, payload, verticalAlign = "bottom", nameKey },
    ref
  ) => {
    const { config } = useChart()

    if (!payload?.length) {
      return null
    }

    return (
      <div
        ref={ref}
        className={cn(
          "flex items-center justify-center gap-4",
          verticalAlign === "top" ? "pb-3" : "pt-3",
          className
        )}
      >
        {payload
          .filter((item) => item.type !== "none")
          .map((item) => {
            const key = `${nameKey || item.dataKey || "value"}`
            const itemConfig = getPayloadConfigFromPayload(config, item, key)

            return (
              <div
                key={item.value}
                className={cn(
                  "flex items-center gap-1.5 [&>svg]:h-3 [&>svg]:w-3 [&>svg]:text-muted-foreground"
                )}
              >
                {itemConfig?.icon && !hideIcon ? (
                  <itemConfig.icon />
                ) : (
                  <div
                    className="h-2 w-2 shrink-0 rounded-[2px]"
                    style={{
                      backgroundColor: item.color,
                    }}
                  />
                )}
                {itemConfig?.label}
              </div>
            )
          })}
      </div>
    )
  }
)
ChartLegendContent.displayName = "ChartLegend"

// Helper to extract item config from a payload.
function getPayloadConfigFromPayload(
  config: ChartConfig,
  payload: unknown,
  key: string
) {
  if (typeof payload !== "object" || payload === null) {
    return undefined
  }

  const payloadPayload =
    "payload" in payload &&
    typeof payload.payload === "object" &&
    payload.payload !== null
      ? payload.payload
      : undefined

  let configLabelKey: string = key

  if (
    key in payload &&
    typeof payload[key as keyof typeof payload] === "string"
  ) {
    configLabelKey = payload[key as keyof typeof payload] as string
  } else if (
    payloadPayload &&
    key in payloadPayload &&
    typeof payloadPayload[key as keyof typeof payloadPayload] === "string"
  ) {
    configLabelKey = payloadPayload[
      key as keyof typeof payloadPayload
    ] as string
  }

  return configLabelKey in config
    ? config[configLabelKey]
    : config[key as keyof typeof config]
}

export {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  ChartStyle,
}
```

## `src/components/ui/checkbox.tsx`

```tsx
import * as React from "react"
import * as CheckboxPrimitive from "@radix-ui/react-checkbox"
import { Check } from "lucide-react"

import { cn } from "@/lib/utils"

const Checkbox = React.forwardRef<
  React.ElementRef<typeof CheckboxPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root>
>(({ className, ...props }, ref) => (
  <CheckboxPrimitive.Root
    ref={ref}
    className={cn(
      "grid place-content-center peer h-4 w-4 shrink-0 rounded-sm border border-primary shadow focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground",
      className
    )}
    {...props}
  >
    <CheckboxPrimitive.Indicator
      className={cn("grid place-content-center text-current")}
    >
      <Check className="h-4 w-4" />
    </CheckboxPrimitive.Indicator>
  </CheckboxPrimitive.Root>
))
Checkbox.displayName = CheckboxPrimitive.Root.displayName

export { Checkbox }
```

## `src/components/ui/collapsible.tsx`

```tsx
"use client"

import * as CollapsiblePrimitive from "@radix-ui/react-collapsible"

const Collapsible = CollapsiblePrimitive.Root

const CollapsibleTrigger = CollapsiblePrimitive.CollapsibleTrigger

const CollapsibleContent = CollapsiblePrimitive.CollapsibleContent

export { Collapsible, CollapsibleTrigger, CollapsibleContent }
```

## `src/components/ui/command.tsx`

```tsx
"use client"

import * as React from "react"
import { type DialogProps } from "@radix-ui/react-dialog"
import { Command as CommandPrimitive } from "cmdk"
import { Search } from "lucide-react"

import { cn } from "@/lib/utils"
import { Dialog, DialogContent } from "@/components/ui/dialog"

const Command = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive>
>(({ className, ...props }, ref) => (
  <CommandPrimitive
    ref={ref}
    className={cn(
      "flex h-full w-full flex-col overflow-hidden rounded-md bg-popover text-popover-foreground",
      className
    )}
    {...props}
  />
))
Command.displayName = CommandPrimitive.displayName

const CommandDialog = ({ children, ...props }: DialogProps) => {
  return (
    <Dialog {...props}>
      <DialogContent className="overflow-hidden p-0">
        <Command className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground [&_[cmdk-group]:not([hidden])_~[cmdk-group]]:pt-0 [&_[cmdk-group]]:px-2 [&_[cmdk-input-wrapper]_svg]:h-5 [&_[cmdk-input-wrapper]_svg]:w-5 [&_[cmdk-input]]:h-12 [&_[cmdk-item]]:px-2 [&_[cmdk-item]]:py-3 [&_[cmdk-item]_svg]:h-5 [&_[cmdk-item]_svg]:w-5">
          {children}
        </Command>
      </DialogContent>
    </Dialog>
  )
}

const CommandInput = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.Input>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Input>
>(({ className, ...props }, ref) => (
  <div className="flex items-center border-b px-3" cmdk-input-wrapper="">
    <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
    <CommandPrimitive.Input
      ref={ref}
      className={cn(
        "flex h-10 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    />
  </div>
))

CommandInput.displayName = CommandPrimitive.Input.displayName

const CommandList = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.List>
>(({ className, ...props }, ref) => (
  <CommandPrimitive.List
    ref={ref}
    className={cn("max-h-[300px] overflow-y-auto overflow-x-hidden", className)}
    {...props}
  />
))

CommandList.displayName = CommandPrimitive.List.displayName

const CommandEmpty = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.Empty>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Empty>
>((props, ref) => (
  <CommandPrimitive.Empty
    ref={ref}
    className="py-6 text-center text-sm"
    {...props}
  />
))

CommandEmpty.displayName = CommandPrimitive.Empty.displayName

const CommandGroup = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.Group>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Group>
>(({ className, ...props }, ref) => (
  <CommandPrimitive.Group
    ref={ref}
    className={cn(
      "overflow-hidden p-1 text-foreground [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground",
      className
    )}
    {...props}
  />
))

CommandGroup.displayName = CommandPrimitive.Group.displayName

const CommandSeparator = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <CommandPrimitive.Separator
    ref={ref}
    className={cn("-mx-1 h-px bg-border", className)}
    {...props}
  />
))
CommandSeparator.displayName = CommandPrimitive.Separator.displayName

const CommandItem = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Item>
>(({ className, ...props }, ref) => (
  <CommandPrimitive.Item
    ref={ref}
    className={cn(
      "relative flex cursor-default gap-2 select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none data-[disabled=true]:pointer-events-none data-[selected=true]:bg-accent data-[selected=true]:text-accent-foreground data-[disabled=true]:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
      className
    )}
    {...props}
  />
))

CommandItem.displayName = CommandPrimitive.Item.displayName

const CommandShortcut = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement>) => {
  return (
    <span
      className={cn(
        "ml-auto text-xs tracking-widest text-muted-foreground",
        className
      )}
      {...props}
    />
  )
}
CommandShortcut.displayName = "CommandShortcut"

export {
  Command,
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandShortcut,
  CommandSeparator,
}
```

## `src/components/ui/context-menu.tsx`

```tsx
import * as React from "react"
import * as ContextMenuPrimitive from "@radix-ui/react-context-menu"
import { Check, ChevronRight, Circle } from "lucide-react"

import { cn } from "@/lib/utils"

const ContextMenu = ContextMenuPrimitive.Root

const ContextMenuTrigger = ContextMenuPrimitive.Trigger

const ContextMenuGroup = ContextMenuPrimitive.Group

const ContextMenuPortal = ContextMenuPrimitive.Portal

const ContextMenuSub = ContextMenuPrimitive.Sub

const ContextMenuRadioGroup = ContextMenuPrimitive.RadioGroup

const ContextMenuSubTrigger = React.forwardRef<
  React.ElementRef<typeof ContextMenuPrimitive.SubTrigger>,
  React.ComponentPropsWithoutRef<typeof ContextMenuPrimitive.SubTrigger> & {
    inset?: boolean
  }
>(({ className, inset, children, ...props }, ref) => (
  <ContextMenuPrimitive.SubTrigger
    ref={ref}
    className={cn(
      "flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[state=open]:bg-accent data-[state=open]:text-accent-foreground",
      inset && "pl-8",
      className
    )}
    {...props}
  >
    {children}
    <ChevronRight className="ml-auto h-4 w-4" />
  </ContextMenuPrimitive.SubTrigger>
))
ContextMenuSubTrigger.displayName = ContextMenuPrimitive.SubTrigger.displayName

const ContextMenuSubContent = React.forwardRef<
  React.ElementRef<typeof ContextMenuPrimitive.SubContent>,
  React.ComponentPropsWithoutRef<typeof ContextMenuPrimitive.SubContent>
>(({ className, ...props }, ref) => (
  <ContextMenuPrimitive.SubContent
    ref={ref}
    className={cn(
      "z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-lg data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 origin-[--radix-context-menu-content-transform-origin]",
      className
    )}
    {...props}
  />
))
ContextMenuSubContent.displayName = ContextMenuPrimitive.SubContent.displayName

const ContextMenuContent = React.forwardRef<
  React.ElementRef<typeof ContextMenuPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof ContextMenuPrimitive.Content>
>(({ className, ...props }, ref) => (
  <ContextMenuPrimitive.Portal>
    <ContextMenuPrimitive.Content
      ref={ref}
      className={cn(
        "z-50 max-h-[--radix-context-menu-content-available-height] min-w-[8rem] overflow-y-auto overflow-x-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 origin-[--radix-context-menu-content-transform-origin]",
        className
      )}
      {...props}
    />
  </ContextMenuPrimitive.Portal>
))
ContextMenuContent.displayName = ContextMenuPrimitive.Content.displayName

const ContextMenuItem = React.forwardRef<
  React.ElementRef<typeof ContextMenuPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof ContextMenuPrimitive.Item> & {
    inset?: boolean
  }
>(({ className, inset, ...props }, ref) => (
  <ContextMenuPrimitive.Item
    ref={ref}
    className={cn(
      "relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      inset && "pl-8",
      className
    )}
    {...props}
  />
))
ContextMenuItem.displayName = ContextMenuPrimitive.Item.displayName

const ContextMenuCheckboxItem = React.forwardRef<
  React.ElementRef<typeof ContextMenuPrimitive.CheckboxItem>,
  React.ComponentPropsWithoutRef<typeof ContextMenuPrimitive.CheckboxItem>
>(({ className, children, checked, ...props }, ref) => (
  <ContextMenuPrimitive.CheckboxItem
    ref={ref}
    className={cn(
      "relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      className
    )}
    checked={checked}
    {...props}
  >
    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
      <ContextMenuPrimitive.ItemIndicator>
        <Check className="h-4 w-4" />
      </ContextMenuPrimitive.ItemIndicator>
    </span>
    {children}
  </ContextMenuPrimitive.CheckboxItem>
))
ContextMenuCheckboxItem.displayName =
  ContextMenuPrimitive.CheckboxItem.displayName

const ContextMenuRadioItem = React.forwardRef<
  React.ElementRef<typeof ContextMenuPrimitive.RadioItem>,
  React.ComponentPropsWithoutRef<typeof ContextMenuPrimitive.RadioItem>
>(({ className, children, ...props }, ref) => (
  <ContextMenuPrimitive.RadioItem
    ref={ref}
    className={cn(
      "relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      className
    )}
    {...props}
  >
    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
      <ContextMenuPrimitive.ItemIndicator>
        <Circle className="h-4 w-4 fill-current" />
      </ContextMenuPrimitive.ItemIndicator>
    </span>
    {children}
  </ContextMenuPrimitive.RadioItem>
))
ContextMenuRadioItem.displayName = ContextMenuPrimitive.RadioItem.displayName

const ContextMenuLabel = React.forwardRef<
  React.ElementRef<typeof ContextMenuPrimitive.Label>,
  React.ComponentPropsWithoutRef<typeof ContextMenuPrimitive.Label> & {
    inset?: boolean
  }
>(({ className, inset, ...props }, ref) => (
  <ContextMenuPrimitive.Label
    ref={ref}
    className={cn(
      "px-2 py-1.5 text-sm font-semibold text-foreground",
      inset && "pl-8",
      className
    )}
    {...props}
  />
))
ContextMenuLabel.displayName = ContextMenuPrimitive.Label.displayName

const ContextMenuSeparator = React.forwardRef<
  React.ElementRef<typeof ContextMenuPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof ContextMenuPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <ContextMenuPrimitive.Separator
    ref={ref}
    className={cn("-mx-1 my-1 h-px bg-border", className)}
    {...props}
  />
))
ContextMenuSeparator.displayName = ContextMenuPrimitive.Separator.displayName

const ContextMenuShortcut = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement>) => {
  return (
    <span
      className={cn(
        "ml-auto text-xs tracking-widest text-muted-foreground",
        className
      )}
      {...props}
    />
  )
}
ContextMenuShortcut.displayName = "ContextMenuShortcut"

export {
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuCheckboxItem,
  ContextMenuRadioItem,
  ContextMenuLabel,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuGroup,
  ContextMenuPortal,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuRadioGroup,
}
```

## `src/components/ui/dialog.tsx`

```tsx
import * as React from "react"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { X } from "lucide-react"

import { cn } from "@/lib/utils"

const Dialog = DialogPrimitive.Root

const DialogTrigger = DialogPrimitive.Trigger

const DialogPortal = DialogPrimitive.Portal

const DialogClose = DialogPrimitive.Close

const DialogOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      "fixed inset-0 z-50 bg-black/80  data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      className
    )}
    {...props}
  />
))
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName

const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <DialogPortal>
    <DialogOverlay />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        "fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg",
        className
      )}
      {...props}
    >
      {children}
      <DialogPrimitive.Close className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
        <X className="h-4 w-4" />
        <span className="sr-only">Close</span>
      </DialogPrimitive.Close>
    </DialogPrimitive.Content>
  </DialogPortal>
))
DialogContent.displayName = DialogPrimitive.Content.displayName

const DialogHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col space-y-1.5 text-center sm:text-left",
      className
    )}
    {...props}
  />
)
DialogHeader.displayName = "DialogHeader"

const DialogFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2",
      className
    )}
    {...props}
  />
)
DialogFooter.displayName = "DialogFooter"

const DialogTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn(
      "text-lg font-semibold leading-none tracking-tight",
      className
    )}
    {...props}
  />
))
DialogTitle.displayName = DialogPrimitive.Title.displayName

const DialogDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
))
DialogDescription.displayName = DialogPrimitive.Description.displayName

export {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogTrigger,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
}
```

## `src/components/ui/drawer.tsx`

```tsx
import * as React from "react"
import { Drawer as DrawerPrimitive } from "vaul"

import { cn } from "@/lib/utils"

const Drawer = ({
  shouldScaleBackground = true,
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Root>) => (
  <DrawerPrimitive.Root
    shouldScaleBackground={shouldScaleBackground}
    {...props}
  />
)
Drawer.displayName = "Drawer"

const DrawerTrigger = DrawerPrimitive.Trigger

const DrawerPortal = DrawerPrimitive.Portal

const DrawerClose = DrawerPrimitive.Close

const DrawerOverlay = React.forwardRef<
  React.ElementRef<typeof DrawerPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DrawerPrimitive.Overlay
    ref={ref}
    className={cn("fixed inset-0 z-50 bg-black/80", className)}
    {...props}
  />
))
DrawerOverlay.displayName = DrawerPrimitive.Overlay.displayName

const DrawerContent = React.forwardRef<
  React.ElementRef<typeof DrawerPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <DrawerPortal>
    <DrawerOverlay />
    <DrawerPrimitive.Content
      ref={ref}
      className={cn(
        "fixed inset-x-0 bottom-0 z-50 mt-24 flex h-auto flex-col rounded-t-[10px] border bg-background",
        className
      )}
      {...props}
    >
      <div className="mx-auto mt-4 h-2 w-[100px] rounded-full bg-muted" />
      {children}
    </DrawerPrimitive.Content>
  </DrawerPortal>
))
DrawerContent.displayName = "DrawerContent"

const DrawerHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn("grid gap-1.5 p-4 text-center sm:text-left", className)}
    {...props}
  />
)
DrawerHeader.displayName = "DrawerHeader"

const DrawerFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn("mt-auto flex flex-col gap-2 p-4", className)}
    {...props}
  />
)
DrawerFooter.displayName = "DrawerFooter"

const DrawerTitle = React.forwardRef<
  React.ElementRef<typeof DrawerPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DrawerPrimitive.Title
    ref={ref}
    className={cn(
      "text-lg font-semibold leading-none tracking-tight",
      className
    )}
    {...props}
  />
))
DrawerTitle.displayName = DrawerPrimitive.Title.displayName

const DrawerDescription = React.forwardRef<
  React.ElementRef<typeof DrawerPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DrawerPrimitive.Description
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
))
DrawerDescription.displayName = DrawerPrimitive.Description.displayName

export {
  Drawer,
  DrawerPortal,
  DrawerOverlay,
  DrawerTrigger,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerFooter,
  DrawerTitle,
  DrawerDescription,
}
```

## `src/components/ui/dropdown-menu.tsx`

```tsx
"use client"

import * as React from "react"
import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu"
import { Check, ChevronRight, Circle } from "lucide-react"

import { cn } from "@/lib/utils"

const DropdownMenu = DropdownMenuPrimitive.Root

const DropdownMenuTrigger = DropdownMenuPrimitive.Trigger

const DropdownMenuGroup = DropdownMenuPrimitive.Group

const DropdownMenuPortal = DropdownMenuPrimitive.Portal

const DropdownMenuSub = DropdownMenuPrimitive.Sub

const DropdownMenuRadioGroup = DropdownMenuPrimitive.RadioGroup

const DropdownMenuSubTrigger = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.SubTrigger>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.SubTrigger> & {
    inset?: boolean
  }
>(({ className, inset, children, ...props }, ref) => (
  <DropdownMenuPrimitive.SubTrigger
    ref={ref}
    className={cn(
      "flex cursor-default select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none focus:bg-accent data-[state=open]:bg-accent [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
      inset && "pl-8",
      className
    )}
    {...props}
  >
    {children}
    <ChevronRight className="ml-auto" />
  </DropdownMenuPrimitive.SubTrigger>
))
DropdownMenuSubTrigger.displayName =
  DropdownMenuPrimitive.SubTrigger.displayName

const DropdownMenuSubContent = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.SubContent>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.SubContent>
>(({ className, ...props }, ref) => (
  <DropdownMenuPrimitive.SubContent
    ref={ref}
    className={cn(
      "z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-lg data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 origin-[--radix-dropdown-menu-content-transform-origin]",
      className
    )}
    {...props}
  />
))
DropdownMenuSubContent.displayName =
  DropdownMenuPrimitive.SubContent.displayName

const DropdownMenuContent = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Content>
>(({ className, sideOffset = 4, ...props }, ref) => (
  <DropdownMenuPrimitive.Portal>
    <DropdownMenuPrimitive.Content
      ref={ref}
      sideOffset={sideOffset}
      className={cn(
        "z-50 max-h-[var(--radix-dropdown-menu-content-available-height)] min-w-[8rem] overflow-y-auto overflow-x-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md",
        "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 origin-[--radix-dropdown-menu-content-transform-origin]",
        className
      )}
      {...props}
    />
  </DropdownMenuPrimitive.Portal>
))
DropdownMenuContent.displayName = DropdownMenuPrimitive.Content.displayName

const DropdownMenuItem = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Item> & {
    inset?: boolean
  }
>(({ className, inset, ...props }, ref) => (
  <DropdownMenuPrimitive.Item
    ref={ref}
    className={cn(
      "relative flex cursor-default select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&>svg]:size-4 [&>svg]:shrink-0",
      inset && "pl-8",
      className
    )}
    {...props}
  />
))
DropdownMenuItem.displayName = DropdownMenuPrimitive.Item.displayName

const DropdownMenuCheckboxItem = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.CheckboxItem>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.CheckboxItem>
>(({ className, children, checked, ...props }, ref) => (
  <DropdownMenuPrimitive.CheckboxItem
    ref={ref}
    className={cn(
      "relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      className
    )}
    checked={checked}
    {...props}
  >
    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
      <DropdownMenuPrimitive.ItemIndicator>
        <Check className="h-4 w-4" />
      </DropdownMenuPrimitive.ItemIndicator>
    </span>
    {children}
  </DropdownMenuPrimitive.CheckboxItem>
))
DropdownMenuCheckboxItem.displayName =
  DropdownMenuPrimitive.CheckboxItem.displayName

const DropdownMenuRadioItem = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.RadioItem>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.RadioItem>
>(({ className, children, ...props }, ref) => (
  <DropdownMenuPrimitive.RadioItem
    ref={ref}
    className={cn(
      "relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      className
    )}
    {...props}
  >
    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
      <DropdownMenuPrimitive.ItemIndicator>
        <Circle className="h-2 w-2 fill-current" />
      </DropdownMenuPrimitive.ItemIndicator>
    </span>
    {children}
  </DropdownMenuPrimitive.RadioItem>
))
DropdownMenuRadioItem.displayName = DropdownMenuPrimitive.RadioItem.displayName

const DropdownMenuLabel = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Label>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Label> & {
    inset?: boolean
  }
>(({ className, inset, ...props }, ref) => (
  <DropdownMenuPrimitive.Label
    ref={ref}
    className={cn(
      "px-2 py-1.5 text-sm font-semibold",
      inset && "pl-8",
      className
    )}
    {...props}
  />
))
DropdownMenuLabel.displayName = DropdownMenuPrimitive.Label.displayName

const DropdownMenuSeparator = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <DropdownMenuPrimitive.Separator
    ref={ref}
    className={cn("-mx-1 my-1 h-px bg-muted", className)}
    {...props}
  />
))
DropdownMenuSeparator.displayName = DropdownMenuPrimitive.Separator.displayName

const DropdownMenuShortcut = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement>) => {
  return (
    <span
      className={cn("ml-auto text-xs tracking-widest opacity-60", className)}
      {...props}
    />
  )
}
DropdownMenuShortcut.displayName = "DropdownMenuShortcut"

export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuGroup,
  DropdownMenuPortal,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuRadioGroup,
}
```

## `src/components/ui/empty.tsx`

```tsx
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

function Empty({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="empty"
      className={cn(
        "flex min-w-0 flex-1 flex-col items-center justify-center gap-6 text-balance rounded-lg border-dashed p-6 text-center md:p-12",
        className
      )}
      {...props}
    />
  )
}

function EmptyHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="empty-header"
      className={cn(
        "flex max-w-sm flex-col items-center gap-2 text-center",
        className
      )}
      {...props}
    />
  )
}

const emptyMediaVariants = cva(
  "mb-2 flex shrink-0 items-center justify-center [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-transparent",
        icon: "bg-muted text-foreground flex size-10 shrink-0 items-center justify-center rounded-lg [&_svg:not([class*='size-'])]:size-6",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function EmptyMedia({
  className,
  variant = "default",
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof emptyMediaVariants>) {
  return (
    <div
      data-slot="empty-icon"
      data-variant={variant}
      className={cn(emptyMediaVariants({ variant, className }))}
      {...props}
    />
  )
}

function EmptyTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="empty-title"
      className={cn("text-lg font-medium tracking-tight", className)}
      {...props}
    />
  )
}

function EmptyDescription({ className, ...props }: React.ComponentProps<"p">) {
  return (
    <div
      data-slot="empty-description"
      className={cn(
        "text-muted-foreground [&>a:hover]:text-primary text-sm/relaxed [&>a]:underline [&>a]:underline-offset-4",
        className
      )}
      {...props}
    />
  )
}

function EmptyContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="empty-content"
      className={cn(
        "flex w-full min-w-0 max-w-sm flex-col items-center gap-4 text-balance text-sm",
        className
      )}
      {...props}
    />
  )
}

export {
  Empty,
  EmptyHeader,
  EmptyTitle,
  EmptyDescription,
  EmptyContent,
  EmptyMedia,
}
```

## `src/components/ui/field.tsx`

```tsx
"use client"

import { useMemo } from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"

function FieldSet({ className, ...props }: React.ComponentProps<"fieldset">) {
  return (
    <fieldset
      data-slot="field-set"
      className={cn(
        "flex flex-col gap-6",
        "has-[>[data-slot=checkbox-group]]:gap-3 has-[>[data-slot=radio-group]]:gap-3",
        className
      )}
      {...props}
    />
  )
}

function FieldLegend({
  className,
  variant = "legend",
  ...props
}: React.ComponentProps<"legend"> & { variant?: "legend" | "label" }) {
  return (
    <legend
      data-slot="field-legend"
      data-variant={variant}
      className={cn(
        "mb-3 font-medium",
        "data-[variant=legend]:text-base",
        "data-[variant=label]:text-sm",
        className
      )}
      {...props}
    />
  )
}

function FieldGroup({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="field-group"
      className={cn(
        "group/field-group @container/field-group flex w-full flex-col gap-7 data-[slot=checkbox-group]:gap-3 [&>[data-slot=field-group]]:gap-4",
        className
      )}
      {...props}
    />
  )
}

const fieldVariants = cva(
  "group/field data-[invalid=true]:text-destructive flex w-full gap-3",
  {
    variants: {
      orientation: {
        vertical: ["flex-col [&>*]:w-full [&>.sr-only]:w-auto"],
        horizontal: [
          "flex-row items-center",
          "[&>[data-slot=field-label]]:flex-auto",
          "has-[>[data-slot=field-content]]:[&>[role=checkbox],[role=radio]]:mt-px has-[>[data-slot=field-content]]:items-start",
        ],
        responsive: [
          "@md/field-group:flex-row @md/field-group:items-center @md/field-group:[&>*]:w-auto flex-col [&>*]:w-full [&>.sr-only]:w-auto",
          "@md/field-group:[&>[data-slot=field-label]]:flex-auto",
          "@md/field-group:has-[>[data-slot=field-content]]:items-start @md/field-group:has-[>[data-slot=field-content]]:[&>[role=checkbox],[role=radio]]:mt-px",
        ],
      },
    },
    defaultVariants: {
      orientation: "vertical",
    },
  }
)

function Field({
  className,
  orientation = "vertical",
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof fieldVariants>) {
  return (
    <div
      role="group"
      data-slot="field"
      data-orientation={orientation}
      className={cn(fieldVariants({ orientation }), className)}
      {...props}
    />
  )
}

function FieldContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="field-content"
      className={cn(
        "group/field-content flex flex-1 flex-col gap-1.5 leading-snug",
        className
      )}
      {...props}
    />
  )
}

function FieldLabel({
  className,
  ...props
}: React.ComponentProps<typeof Label>) {
  return (
    <Label
      data-slot="field-label"
      className={cn(
        "group/field-label peer/field-label flex w-fit gap-2 leading-snug group-data-[disabled=true]/field:opacity-50",
        "has-[>[data-slot=field]]:w-full has-[>[data-slot=field]]:flex-col has-[>[data-slot=field]]:rounded-md has-[>[data-slot=field]]:border [&>[data-slot=field]]:p-4",
        "has-data-[state=checked]:bg-primary/5 has-data-[state=checked]:border-primary dark:has-data-[state=checked]:bg-primary/10",
        className
      )}
      {...props}
    />
  )
}

function FieldTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="field-label"
      className={cn(
        "flex w-fit items-center gap-2 text-sm font-medium leading-snug group-data-[disabled=true]/field:opacity-50",
        className
      )}
      {...props}
    />
  )
}

function FieldDescription({ className, ...props }: React.ComponentProps<"p">) {
  return (
    <p
      data-slot="field-description"
      className={cn(
        "text-muted-foreground text-sm font-normal leading-normal group-has-[[data-orientation=horizontal]]/field:text-balance",
        "nth-last-2:-mt-1 last:mt-0 [[data-variant=legend]+&]:-mt-1.5",
        "[&>a:hover]:text-primary [&>a]:underline [&>a]:underline-offset-4",
        className
      )}
      {...props}
    />
  )
}

function FieldSeparator({
  children,
  className,
  ...props
}: React.ComponentProps<"div"> & {
  children?: React.ReactNode
}) {
  return (
    <div
      data-slot="field-separator"
      data-content={!!children}
      className={cn(
        "relative -my-2 h-5 text-sm group-data-[variant=outline]/field-group:-mb-2",
        className
      )}
      {...props}
    >
      <Separator className="absolute inset-0 top-1/2" />
      {children && (
        <span
          className="bg-background text-muted-foreground relative mx-auto block w-fit px-2"
          data-slot="field-separator-content"
        >
          {children}
        </span>
      )}
    </div>
  )
}

function FieldError({
  className,
  children,
  errors,
  ...props
}: React.ComponentProps<"div"> & {
  errors?: Array<{ message?: string } | undefined>
}) {
  const content = useMemo(() => {
    if (children) {
      return children
    }

    if (!errors) {
      return null
    }

    if (errors?.length === 1 && errors[0]?.message) {
      return errors[0].message
    }

    return (
      <ul className="ml-4 flex list-disc flex-col gap-1">
        {errors.map(
          (error, index) =>
            error?.message && <li key={index}>{error.message}</li>
        )}
      </ul>
    )
  }, [children, errors])

  if (!content) {
    return null
  }

  return (
    <div
      role="alert"
      data-slot="field-error"
      className={cn("text-destructive text-sm font-normal", className)}
      {...props}
    >
      {content}
    </div>
  )
}

export {
  Field,
  FieldLabel,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLegend,
  FieldSeparator,
  FieldSet,
  FieldContent,
  FieldTitle,
}
```

## `src/components/ui/form.tsx`

```tsx
import * as React from "react"
import * as LabelPrimitive from "@radix-ui/react-label"
import { Slot } from "@radix-ui/react-slot"
import {
  Controller,
  FormProvider,
  useFormContext,
  type ControllerProps,
  type FieldPath,
  type FieldValues,
} from "react-hook-form"

import { cn } from "@/lib/utils"
import { Label } from "@/components/ui/label"

const Form = FormProvider

type FormFieldContextValue<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
> = {
  name: TName
}

const FormFieldContext = React.createContext<FormFieldContextValue | null>(null)

const FormField = <
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
>({
  ...props
}: ControllerProps<TFieldValues, TName>) => {
  return (
    <FormFieldContext.Provider value={{ name: props.name }}>
      <Controller {...props} />
    </FormFieldContext.Provider>
  )
}

const useFormField = () => {
  const fieldContext = React.useContext(FormFieldContext)
  const itemContext = React.useContext(FormItemContext)
  const { getFieldState, formState } = useFormContext()

  if (!fieldContext) {
    throw new Error("useFormField should be used within <FormField>")
  }

  if (!itemContext) {
    throw new Error("useFormField should be used within <FormItem>")
  }

  const fieldState = getFieldState(fieldContext.name, formState)

  const { id } = itemContext

  return {
    id,
    name: fieldContext.name,
    formItemId: `${id}-form-item`,
    formDescriptionId: `${id}-form-item-description`,
    formMessageId: `${id}-form-item-message`,
    ...fieldState,
  }
}

type FormItemContextValue = {
  id: string
}

const FormItemContext = React.createContext<FormItemContextValue | null>(null)

const FormItem = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  const id = React.useId()

  return (
    <FormItemContext.Provider value={{ id }}>
      <div ref={ref} className={cn("space-y-2", className)} {...props} />
    </FormItemContext.Provider>
  )
})
FormItem.displayName = "FormItem"

const FormLabel = React.forwardRef<
  React.ElementRef<typeof LabelPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root>
>(({ className, ...props }, ref) => {
  const { error, formItemId } = useFormField()

  return (
    <Label
      ref={ref}
      className={cn(error && "text-destructive", className)}
      htmlFor={formItemId}
      {...props}
    />
  )
})
FormLabel.displayName = "FormLabel"

const FormControl = React.forwardRef<
  React.ElementRef<typeof Slot>,
  React.ComponentPropsWithoutRef<typeof Slot>
>(({ ...props }, ref) => {
  const { error, formItemId, formDescriptionId, formMessageId } = useFormField()

  return (
    <Slot
      ref={ref}
      id={formItemId}
      aria-describedby={
        !error
          ? `${formDescriptionId}`
          : `${formDescriptionId} ${formMessageId}`
      }
      aria-invalid={!!error}
      {...props}
    />
  )
})
FormControl.displayName = "FormControl"

const FormDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => {
  const { formDescriptionId } = useFormField()

  return (
    <p
      ref={ref}
      id={formDescriptionId}
      className={cn("text-[0.8rem] text-muted-foreground", className)}
      {...props}
    />
  )
})
FormDescription.displayName = "FormDescription"

const FormMessage = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, children, ...props }, ref) => {
  const { error, formMessageId } = useFormField()
  const body = error ? String(error?.message ?? "") : children

  if (!body) {
    return null
  }

  return (
    <p
      ref={ref}
      id={formMessageId}
      className={cn("text-[0.8rem] font-medium text-destructive", className)}
      {...props}
    >
      {body}
    </p>
  )
})
FormMessage.displayName = "FormMessage"

export {
  useFormField,
  Form,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
  FormField,
}
```

## `src/components/ui/hover-card.tsx`

```tsx
import * as React from "react"
import * as HoverCardPrimitive from "@radix-ui/react-hover-card"

import { cn } from "@/lib/utils"

const HoverCard = HoverCardPrimitive.Root

const HoverCardTrigger = HoverCardPrimitive.Trigger

const HoverCardContent = React.forwardRef<
  React.ElementRef<typeof HoverCardPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof HoverCardPrimitive.Content>
>(({ className, align = "center", sideOffset = 4, ...props }, ref) => (
  <HoverCardPrimitive.Content
    ref={ref}
    align={align}
    sideOffset={sideOffset}
    className={cn(
      "z-50 w-64 rounded-md border bg-popover p-4 text-popover-foreground shadow-md outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 origin-[--radix-hover-card-content-transform-origin]",
      className
    )}
    {...props}
  />
))
HoverCardContent.displayName = HoverCardPrimitive.Content.displayName

export { HoverCard, HoverCardTrigger, HoverCardContent }
```

## `src/components/ui/input-group.tsx`

```tsx
import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

function InputGroup({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="input-group"
      role="group"
      className={cn(
        "group/input-group border-input dark:bg-input/30 shadow-xs relative flex w-full items-center rounded-md border outline-none transition-[color,box-shadow]",
        "h-9 has-[>textarea]:h-auto",

        // Variants based on alignment.
        "has-[>[data-align=inline-start]]:[&>input]:pl-2",
        "has-[>[data-align=inline-end]]:[&>input]:pr-2",
        "has-[>[data-align=block-start]]:h-auto has-[>[data-align=block-start]]:flex-col has-[>[data-align=block-start]]:[&>input]:pb-3",
        "has-[>[data-align=block-end]]:h-auto has-[>[data-align=block-end]]:flex-col has-[>[data-align=block-end]]:[&>input]:pt-3",

        // Focus state.
        "has-[[data-slot=input-group-control]:focus-visible]:ring-ring has-[[data-slot=input-group-control]:focus-visible]:ring-1",

        // Error state.
        "has-[[data-slot][aria-invalid=true]]:ring-destructive/20 has-[[data-slot][aria-invalid=true]]:border-destructive dark:has-[[data-slot][aria-invalid=true]]:ring-destructive/40",

        className
      )}
      {...props}
    />
  )
}

const inputGroupAddonVariants = cva(
  "text-muted-foreground flex h-auto cursor-text select-none items-center justify-center gap-2 py-1.5 text-sm font-medium group-data-[disabled=true]/input-group:opacity-50 [&>kbd]:rounded-[calc(var(--radius)-5px)] [&>svg:not([class*='size-'])]:size-4",
  {
    variants: {
      align: {
        "inline-start":
          "order-first pl-3 has-[>button]:ml-[-0.45rem] has-[>kbd]:ml-[-0.35rem]",
        "inline-end":
          "order-last pr-3 has-[>button]:mr-[-0.4rem] has-[>kbd]:mr-[-0.35rem]",
        "block-start":
          "[.border-b]:pb-3 order-first w-full justify-start px-3 pt-3 group-has-[>input]/input-group:pt-2.5",
        "block-end":
          "[.border-t]:pt-3 order-last w-full justify-start px-3 pb-3 group-has-[>input]/input-group:pb-2.5",
      },
    },
    defaultVariants: {
      align: "inline-start",
    },
  }
)

function InputGroupAddon({
  className,
  align = "inline-start",
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof inputGroupAddonVariants>) {
  return (
    <div
      role="group"
      data-slot="input-group-addon"
      data-align={align}
      className={cn(inputGroupAddonVariants({ align }), className)}
      onClick={(e) => {
        if ((e.target as HTMLElement).closest("button")) {
          return
        }
        e.currentTarget.parentElement?.querySelector("input")?.focus()
      }}
      {...props}
    />
  )
}

const inputGroupButtonVariants = cva(
  "flex items-center gap-2 text-sm shadow-none",
  {
    variants: {
      size: {
        xs: "h-6 gap-1 rounded-[calc(var(--radius)-5px)] px-2 has-[>svg]:px-2 [&>svg:not([class*='size-'])]:size-3.5",
        sm: "h-8 gap-1.5 rounded-md px-2.5 has-[>svg]:px-2.5",
        "icon-xs":
          "size-6 rounded-[calc(var(--radius)-5px)] p-0 has-[>svg]:p-0",
        "icon-sm": "size-8 p-0 has-[>svg]:p-0",
      },
    },
    defaultVariants: {
      size: "xs",
    },
  }
)

function InputGroupButton({
  className,
  type = "button",
  variant = "ghost",
  size = "xs",
  ...props
}: Omit<React.ComponentProps<typeof Button>, "size"> &
  VariantProps<typeof inputGroupButtonVariants>) {
  return (
    <Button
      type={type}
      data-size={size}
      variant={variant}
      className={cn(inputGroupButtonVariants({ size }), className)}
      {...props}
    />
  )
}

function InputGroupText({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span
      className={cn(
        "text-muted-foreground flex items-center gap-2 text-sm [&_svg:not([class*='size-'])]:size-4 [&_svg]:pointer-events-none",
        className
      )}
      {...props}
    />
  )
}

function InputGroupInput({
  className,
  ...props
}: React.ComponentProps<"input">) {
  return (
    <Input
      data-slot="input-group-control"
      className={cn(
        "flex-1 rounded-none border-0 bg-transparent shadow-none focus-visible:ring-0 dark:bg-transparent",
        className
      )}
      {...props}
    />
  )
}

function InputGroupTextarea({
  className,
  ...props
}: React.ComponentProps<"textarea">) {
  return (
    <Textarea
      data-slot="input-group-control"
      className={cn(
        "flex-1 resize-none rounded-none border-0 bg-transparent py-3 shadow-none focus-visible:ring-0 dark:bg-transparent",
        className
      )}
      {...props}
    />
  )
}

export {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupText,
  InputGroupInput,
  InputGroupTextarea,
}
```

## `src/components/ui/input-otp.tsx`

```tsx
import * as React from "react"
import { OTPInput, OTPInputContext } from "input-otp"
import { Minus } from "lucide-react"

import { cn } from "@/lib/utils"

const InputOTP = React.forwardRef<
  React.ElementRef<typeof OTPInput>,
  React.ComponentPropsWithoutRef<typeof OTPInput>
>(({ className, containerClassName, ...props }, ref) => (
  <OTPInput
    ref={ref}
    containerClassName={cn(
      "flex items-center gap-2 has-[:disabled]:opacity-50",
      containerClassName
    )}
    className={cn("disabled:cursor-not-allowed", className)}
    {...props}
  />
))
InputOTP.displayName = "InputOTP"

const InputOTPGroup = React.forwardRef<
  React.ElementRef<"div">,
  React.ComponentPropsWithoutRef<"div">
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("flex items-center", className)} {...props} />
))
InputOTPGroup.displayName = "InputOTPGroup"

const InputOTPSlot = React.forwardRef<
  React.ElementRef<"div">,
  React.ComponentPropsWithoutRef<"div"> & { index: number }
>(({ index, className, ...props }, ref) => {
  const inputOTPContext = React.useContext(OTPInputContext)
  const { char, hasFakeCaret, isActive } = inputOTPContext.slots[index]

  return (
    <div
      ref={ref}
      className={cn(
        "relative flex h-9 w-9 items-center justify-center border-y border-r border-input text-sm shadow-sm transition-all first:rounded-l-md first:border-l last:rounded-r-md",
        isActive && "z-10 ring-1 ring-ring",
        className
      )}
      {...props}
    >
      {char}
      {hasFakeCaret && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="h-4 w-px animate-caret-blink bg-foreground duration-1000" />
        </div>
      )}
    </div>
  )
})
InputOTPSlot.displayName = "InputOTPSlot"

const InputOTPSeparator = React.forwardRef<
  React.ElementRef<"div">,
  React.ComponentPropsWithoutRef<"div">
>(({ ...props }, ref) => (
  <div ref={ref} role="separator" {...props}>
    <Minus />
  </div>
))
InputOTPSeparator.displayName = "InputOTPSeparator"

export { InputOTP, InputOTPGroup, InputOTPSlot, InputOTPSeparator }
```

## `src/components/ui/input.tsx`

```tsx
import * as React from "react"

import { cn } from "@/lib/utils"

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
```

## `src/components/ui/item.tsx`

```tsx
import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"
import { Separator } from "@/components/ui/separator"

function ItemGroup({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      role="list"
      data-slot="item-group"
      className={cn("group/item-group flex flex-col", className)}
      {...props}
    />
  )
}

function ItemSeparator({
  className,
  ...props
}: React.ComponentProps<typeof Separator>) {
  return (
    <Separator
      data-slot="item-separator"
      orientation="horizontal"
      className={cn("my-0", className)}
      {...props}
    />
  )
}

const itemVariants = cva(
  "group/item [a]:hover:bg-accent/50 focus-visible:border-ring focus-visible:ring-ring/50 [a]:transition-colors flex flex-wrap items-center rounded-md border border-transparent text-sm outline-none transition-colors duration-100 focus-visible:ring-[3px]",
  {
    variants: {
      variant: {
        default: "bg-transparent",
        outline: "border-border",
        muted: "bg-muted/50",
      },
      size: {
        default: "gap-4 p-4 ",
        sm: "gap-2.5 px-4 py-3",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Item({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"div"> &
  VariantProps<typeof itemVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "div"
  return (
    <Comp
      data-slot="item"
      data-variant={variant}
      data-size={size}
      className={cn(itemVariants({ variant, size, className }))}
      {...props}
    />
  )
}

const itemMediaVariants = cva(
  "flex shrink-0 items-center justify-center gap-2 group-has-[[data-slot=item-description]]/item:translate-y-0.5 group-has-[[data-slot=item-description]]/item:self-start [&_svg]:pointer-events-none",
  {
    variants: {
      variant: {
        default: "bg-transparent",
        icon: "bg-muted size-8 rounded-sm border [&_svg:not([class*='size-'])]:size-4",
        image:
          "size-10 overflow-hidden rounded-sm [&_img]:size-full [&_img]:object-cover",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function ItemMedia({
  className,
  variant = "default",
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof itemMediaVariants>) {
  return (
    <div
      data-slot="item-media"
      data-variant={variant}
      className={cn(itemMediaVariants({ variant, className }))}
      {...props}
    />
  )
}

function ItemContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="item-content"
      className={cn(
        "flex flex-1 flex-col gap-1 [&+[data-slot=item-content]]:flex-none",
        className
      )}
      {...props}
    />
  )
}

function ItemTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="item-title"
      className={cn(
        "flex w-fit items-center gap-2 text-sm font-medium leading-snug",
        className
      )}
      {...props}
    />
  )
}

function ItemDescription({ className, ...props }: React.ComponentProps<"p">) {
  return (
    <p
      data-slot="item-description"
      className={cn(
        "text-muted-foreground line-clamp-2 text-balance text-sm font-normal leading-normal",
        "[&>a:hover]:text-primary [&>a]:underline [&>a]:underline-offset-4",
        className
      )}
      {...props}
    />
  )
}

function ItemActions({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="item-actions"
      className={cn("flex items-center gap-2", className)}
      {...props}
    />
  )
}

function ItemHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="item-header"
      className={cn(
        "flex basis-full items-center justify-between gap-2",
        className
      )}
      {...props}
    />
  )
}

function ItemFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="item-footer"
      className={cn(
        "flex basis-full items-center justify-between gap-2",
        className
      )}
      {...props}
    />
  )
}

export {
  Item,
  ItemMedia,
  ItemContent,
  ItemActions,
  ItemGroup,
  ItemSeparator,
  ItemTitle,
  ItemDescription,
  ItemHeader,
  ItemFooter,
}
```

## `src/components/ui/kbd.tsx`

```tsx
import { cn } from "@/lib/utils"

function Kbd({ className, ...props }: React.ComponentProps<"kbd">) {
  return (
    <kbd
      data-slot="kbd"
      className={cn(
        "bg-muted text-muted-foreground pointer-events-none inline-flex h-5 w-fit min-w-5 select-none items-center justify-center gap-1 rounded-sm px-1 font-sans text-xs font-medium",
        "[&_svg:not([class*='size-'])]:size-3",
        "[[data-slot=tooltip-content]_&]:bg-background/20 [[data-slot=tooltip-content]_&]:text-background dark:[[data-slot=tooltip-content]_&]:bg-background/10",
        className
      )}
      {...props}
    />
  )
}

function KbdGroup({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <kbd
      data-slot="kbd-group"
      className={cn("inline-flex items-center gap-1", className)}
      {...props}
    />
  )
}

export { Kbd, KbdGroup }
```

## `src/components/ui/label.tsx`

```tsx
"use client"

import * as React from "react"
import * as LabelPrimitive from "@radix-ui/react-label"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const labelVariants = cva(
  "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
)

const Label = React.forwardRef<
  React.ElementRef<typeof LabelPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root> &
    VariantProps<typeof labelVariants>
>(({ className, ...props }, ref) => (
  <LabelPrimitive.Root
    ref={ref}
    className={cn(labelVariants(), className)}
    {...props}
  />
))
Label.displayName = LabelPrimitive.Root.displayName

export { Label }
```

## `src/components/ui/menubar.tsx`

```tsx
import * as React from "react"
import * as MenubarPrimitive from "@radix-ui/react-menubar"
import { Check, ChevronRight, Circle } from "lucide-react"

import { cn } from "@/lib/utils"

function MenubarMenu({
  ...props
}: React.ComponentProps<typeof MenubarPrimitive.Menu>) {
  return <MenubarPrimitive.Menu {...props} />
}

function MenubarGroup({
  ...props
}: React.ComponentProps<typeof MenubarPrimitive.Group>) {
  return <MenubarPrimitive.Group {...props} />
}

function MenubarPortal({
  ...props
}: React.ComponentProps<typeof MenubarPrimitive.Portal>) {
  return <MenubarPrimitive.Portal {...props} />
}

function MenubarRadioGroup({
  ...props
}: React.ComponentProps<typeof MenubarPrimitive.RadioGroup>) {
  return <MenubarPrimitive.RadioGroup {...props} />
}

function MenubarSub({
  ...props
}: React.ComponentProps<typeof MenubarPrimitive.Sub>) {
  return <MenubarPrimitive.Sub data-slot="menubar-sub" {...props} />
}

const Menubar = React.forwardRef<
  React.ElementRef<typeof MenubarPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof MenubarPrimitive.Root>
>(({ className, ...props }, ref) => (
  <MenubarPrimitive.Root
    ref={ref}
    className={cn(
      "flex h-9 items-center space-x-1 rounded-md border bg-background p-1 shadow-sm",
      className
    )}
    {...props}
  />
))
Menubar.displayName = MenubarPrimitive.Root.displayName

const MenubarTrigger = React.forwardRef<
  React.ElementRef<typeof MenubarPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof MenubarPrimitive.Trigger>
>(({ className, ...props }, ref) => (
  <MenubarPrimitive.Trigger
    ref={ref}
    className={cn(
      "flex cursor-default select-none items-center rounded-sm px-3 py-1 text-sm font-medium outline-none focus:bg-accent focus:text-accent-foreground data-[state=open]:bg-accent data-[state=open]:text-accent-foreground",
      className
    )}
    {...props}
  />
))
MenubarTrigger.displayName = MenubarPrimitive.Trigger.displayName

const MenubarSubTrigger = React.forwardRef<
  React.ElementRef<typeof MenubarPrimitive.SubTrigger>,
  React.ComponentPropsWithoutRef<typeof MenubarPrimitive.SubTrigger> & {
    inset?: boolean
  }
>(({ className, inset, children, ...props }, ref) => (
  <MenubarPrimitive.SubTrigger
    ref={ref}
    className={cn(
      "flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[state=open]:bg-accent data-[state=open]:text-accent-foreground",
      inset && "pl-8",
      className
    )}
    {...props}
  >
    {children}
    <ChevronRight className="ml-auto h-4 w-4" />
  </MenubarPrimitive.SubTrigger>
))
MenubarSubTrigger.displayName = MenubarPrimitive.SubTrigger.displayName

const MenubarSubContent = React.forwardRef<
  React.ElementRef<typeof MenubarPrimitive.SubContent>,
  React.ComponentPropsWithoutRef<typeof MenubarPrimitive.SubContent>
>(({ className, ...props }, ref) => (
  <MenubarPrimitive.SubContent
    ref={ref}
    className={cn(
      "z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-lg data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 origin-[--radix-menubar-content-transform-origin]",
      className
    )}
    {...props}
  />
))
MenubarSubContent.displayName = MenubarPrimitive.SubContent.displayName

const MenubarContent = React.forwardRef<
  React.ElementRef<typeof MenubarPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof MenubarPrimitive.Content>
>(
  (
    { className, align = "start", alignOffset = -4, sideOffset = 8, ...props },
    ref
  ) => (
    <MenubarPrimitive.Portal>
      <MenubarPrimitive.Content
        ref={ref}
        align={align}
        alignOffset={alignOffset}
        sideOffset={sideOffset}
        className={cn(
          "z-50 min-w-[12rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md data-[state=open]:animate-in data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 origin-[--radix-menubar-content-transform-origin]",
          className
        )}
        {...props}
      />
    </MenubarPrimitive.Portal>
  )
)
MenubarContent.displayName = MenubarPrimitive.Content.displayName

const MenubarItem = React.forwardRef<
  React.ElementRef<typeof MenubarPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof MenubarPrimitive.Item> & {
    inset?: boolean
  }
>(({ className, inset, ...props }, ref) => (
  <MenubarPrimitive.Item
    ref={ref}
    className={cn(
      "relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      inset && "pl-8",
      className
    )}
    {...props}
  />
))
MenubarItem.displayName = MenubarPrimitive.Item.displayName

const MenubarCheckboxItem = React.forwardRef<
  React.ElementRef<typeof MenubarPrimitive.CheckboxItem>,
  React.ComponentPropsWithoutRef<typeof MenubarPrimitive.CheckboxItem>
>(({ className, children, checked, ...props }, ref) => (
  <MenubarPrimitive.CheckboxItem
    ref={ref}
    className={cn(
      "relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      className
    )}
    checked={checked}
    {...props}
  >
    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
      <MenubarPrimitive.ItemIndicator>
        <Check className="h-4 w-4" />
      </MenubarPrimitive.ItemIndicator>
    </span>
    {children}
  </MenubarPrimitive.CheckboxItem>
))
MenubarCheckboxItem.displayName = MenubarPrimitive.CheckboxItem.displayName

const MenubarRadioItem = React.forwardRef<
  React.ElementRef<typeof MenubarPrimitive.RadioItem>,
  React.ComponentPropsWithoutRef<typeof MenubarPrimitive.RadioItem>
>(({ className, children, ...props }, ref) => (
  <MenubarPrimitive.RadioItem
    ref={ref}
    className={cn(
      "relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      className
    )}
    {...props}
  >
    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
      <MenubarPrimitive.ItemIndicator>
        <Circle className="h-4 w-4 fill-current" />
      </MenubarPrimitive.ItemIndicator>
    </span>
    {children}
  </MenubarPrimitive.RadioItem>
))
MenubarRadioItem.displayName = MenubarPrimitive.RadioItem.displayName

const MenubarLabel = React.forwardRef<
  React.ElementRef<typeof MenubarPrimitive.Label>,
  React.ComponentPropsWithoutRef<typeof MenubarPrimitive.Label> & {
    inset?: boolean
  }
>(({ className, inset, ...props }, ref) => (
  <MenubarPrimitive.Label
    ref={ref}
    className={cn(
      "px-2 py-1.5 text-sm font-semibold",
      inset && "pl-8",
      className
    )}
    {...props}
  />
))
MenubarLabel.displayName = MenubarPrimitive.Label.displayName

const MenubarSeparator = React.forwardRef<
  React.ElementRef<typeof MenubarPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof MenubarPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <MenubarPrimitive.Separator
    ref={ref}
    className={cn("-mx-1 my-1 h-px bg-muted", className)}
    {...props}
  />
))
MenubarSeparator.displayName = MenubarPrimitive.Separator.displayName

const MenubarShortcut = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement>) => {
  return (
    <span
      className={cn(
        "ml-auto text-xs tracking-widest text-muted-foreground",
        className
      )}
      {...props}
    />
  )
}
MenubarShortcut.displayname = "MenubarShortcut"

export {
  Menubar,
  MenubarMenu,
  MenubarTrigger,
  MenubarContent,
  MenubarItem,
  MenubarSeparator,
  MenubarLabel,
  MenubarCheckboxItem,
  MenubarRadioGroup,
  MenubarRadioItem,
  MenubarPortal,
  MenubarSubContent,
  MenubarSubTrigger,
  MenubarGroup,
  MenubarSub,
  MenubarShortcut,
}
```

## `src/components/ui/navigation-menu.tsx`

```tsx
import * as React from "react"
import * as NavigationMenuPrimitive from "@radix-ui/react-navigation-menu"
import { cva } from "class-variance-authority"
import { ChevronDown } from "lucide-react"

import { cn } from "@/lib/utils"

const NavigationMenu = React.forwardRef<
  React.ElementRef<typeof NavigationMenuPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof NavigationMenuPrimitive.Root>
>(({ className, children, ...props }, ref) => (
  <NavigationMenuPrimitive.Root
    ref={ref}
    className={cn(
      "relative z-10 flex max-w-max flex-1 items-center justify-center",
      className
    )}
    {...props}
  >
    {children}
    <NavigationMenuViewport />
  </NavigationMenuPrimitive.Root>
))
NavigationMenu.displayName = NavigationMenuPrimitive.Root.displayName

const NavigationMenuList = React.forwardRef<
  React.ElementRef<typeof NavigationMenuPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof NavigationMenuPrimitive.List>
>(({ className, ...props }, ref) => (
  <NavigationMenuPrimitive.List
    ref={ref}
    className={cn(
      "group flex flex-1 list-none items-center justify-center space-x-1",
      className
    )}
    {...props}
  />
))
NavigationMenuList.displayName = NavigationMenuPrimitive.List.displayName

const NavigationMenuItem = NavigationMenuPrimitive.Item

const navigationMenuTriggerStyle = cva(
  "group inline-flex h-9 w-max items-center justify-center rounded-md bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50 data-[state=open]:text-accent-foreground data-[state=open]:bg-accent/50 data-[state=open]:hover:bg-accent data-[state=open]:focus:bg-accent"
)

const NavigationMenuTrigger = React.forwardRef<
  React.ElementRef<typeof NavigationMenuPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof NavigationMenuPrimitive.Trigger>
>(({ className, children, ...props }, ref) => (
  <NavigationMenuPrimitive.Trigger
    ref={ref}
    className={cn(navigationMenuTriggerStyle(), "group", className)}
    {...props}
  >
    {children}{" "}
    <ChevronDown
      className="relative top-[1px] ml-1 h-3 w-3 transition duration-300 group-data-[state=open]:rotate-180"
      aria-hidden="true"
    />
  </NavigationMenuPrimitive.Trigger>
))
NavigationMenuTrigger.displayName = NavigationMenuPrimitive.Trigger.displayName

const NavigationMenuContent = React.forwardRef<
  React.ElementRef<typeof NavigationMenuPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof NavigationMenuPrimitive.Content>
>(({ className, ...props }, ref) => (
  <NavigationMenuPrimitive.Content
    ref={ref}
    className={cn(
      "left-0 top-0 w-full data-[motion^=from-]:animate-in data-[motion^=to-]:animate-out data-[motion^=from-]:fade-in data-[motion^=to-]:fade-out data-[motion=from-end]:slide-in-from-right-52 data-[motion=from-start]:slide-in-from-left-52 data-[motion=to-end]:slide-out-to-right-52 data-[motion=to-start]:slide-out-to-left-52 md:absolute md:w-auto ",
      className
    )}
    {...props}
  />
))
NavigationMenuContent.displayName = NavigationMenuPrimitive.Content.displayName

const NavigationMenuLink = NavigationMenuPrimitive.Link

const NavigationMenuViewport = React.forwardRef<
  React.ElementRef<typeof NavigationMenuPrimitive.Viewport>,
  React.ComponentPropsWithoutRef<typeof NavigationMenuPrimitive.Viewport>
>(({ className, ...props }, ref) => (
  <div className={cn("absolute left-0 top-full flex justify-center")}>
    <NavigationMenuPrimitive.Viewport
      className={cn(
        "origin-top-center relative mt-1.5 h-[var(--radix-navigation-menu-viewport-height)] w-full overflow-hidden rounded-md border bg-popover text-popover-foreground shadow data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-90 md:w-[var(--radix-navigation-menu-viewport-width)]",
        className
      )}
      ref={ref}
      {...props}
    />
  </div>
))
NavigationMenuViewport.displayName =
  NavigationMenuPrimitive.Viewport.displayName

const NavigationMenuIndicator = React.forwardRef<
  React.ElementRef<typeof NavigationMenuPrimitive.Indicator>,
  React.ComponentPropsWithoutRef<typeof NavigationMenuPrimitive.Indicator>
>(({ className, ...props }, ref) => (
  <NavigationMenuPrimitive.Indicator
    ref={ref}
    className={cn(
      "top-full z-[1] flex h-1.5 items-end justify-center overflow-hidden data-[state=visible]:animate-in data-[state=hidden]:animate-out data-[state=hidden]:fade-out data-[state=visible]:fade-in",
      className
    )}
    {...props}
  >
    <div className="relative top-[60%] h-2 w-2 rotate-45 rounded-tl-sm bg-border shadow-md" />
  </NavigationMenuPrimitive.Indicator>
))
NavigationMenuIndicator.displayName =
  NavigationMenuPrimitive.Indicator.displayName

export {
  navigationMenuTriggerStyle,
  NavigationMenu,
  NavigationMenuList,
  NavigationMenuItem,
  NavigationMenuContent,
  NavigationMenuTrigger,
  NavigationMenuLink,
  NavigationMenuIndicator,
  NavigationMenuViewport,
}
```

## `src/components/ui/pagination.tsx`

```tsx
import * as React from "react"
import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react"

import { cn } from "@/lib/utils"
import { ButtonProps, buttonVariants } from "@/components/ui/button"

const Pagination = ({ className, ...props }: React.ComponentProps<"nav">) => (
  <nav
    role="navigation"
    aria-label="pagination"
    className={cn("mx-auto flex w-full justify-center", className)}
    {...props}
  />
)
Pagination.displayName = "Pagination"

const PaginationContent = React.forwardRef<
  HTMLUListElement,
  React.ComponentProps<"ul">
>(({ className, ...props }, ref) => (
  <ul
    ref={ref}
    className={cn("flex flex-row items-center gap-1", className)}
    {...props}
  />
))
PaginationContent.displayName = "PaginationContent"

const PaginationItem = React.forwardRef<
  HTMLLIElement,
  React.ComponentProps<"li">
>(({ className, ...props }, ref) => (
  <li ref={ref} className={cn("", className)} {...props} />
))
PaginationItem.displayName = "PaginationItem"

type PaginationLinkProps = {
  isActive?: boolean
} & Pick<ButtonProps, "size"> &
  React.ComponentProps<"a">

const PaginationLink = ({
  className,
  isActive,
  size = "icon",
  ...props
}: PaginationLinkProps) => (
  <a
    aria-current={isActive ? "page" : undefined}
    className={cn(
      buttonVariants({
        variant: isActive ? "outline" : "ghost",
        size,
      }),
      className
    )}
    {...props}
  />
)
PaginationLink.displayName = "PaginationLink"

const PaginationPrevious = ({
  className,
  ...props
}: React.ComponentProps<typeof PaginationLink>) => (
  <PaginationLink
    aria-label="Go to previous page"
    size="default"
    className={cn("gap-1 pl-2.5", className)}
    {...props}
  >
    <ChevronLeft className="h-4 w-4" />
    <span>Previous</span>
  </PaginationLink>
)
PaginationPrevious.displayName = "PaginationPrevious"

const PaginationNext = ({
  className,
  ...props
}: React.ComponentProps<typeof PaginationLink>) => (
  <PaginationLink
    aria-label="Go to next page"
    size="default"
    className={cn("gap-1 pr-2.5", className)}
    {...props}
  >
    <span>Next</span>
    <ChevronRight className="h-4 w-4" />
  </PaginationLink>
)
PaginationNext.displayName = "PaginationNext"

const PaginationEllipsis = ({
  className,
  ...props
}: React.ComponentProps<"span">) => (
  <span
    aria-hidden
    className={cn("flex h-9 w-9 items-center justify-center", className)}
    {...props}
  >
    <MoreHorizontal className="h-4 w-4" />
    <span className="sr-only">More pages</span>
  </span>
)
PaginationEllipsis.displayName = "PaginationEllipsis"

export {
  Pagination,
  PaginationContent,
  PaginationLink,
  PaginationItem,
  PaginationPrevious,
  PaginationNext,
  PaginationEllipsis,
}
```

## `src/components/ui/popover.tsx`

```tsx
import * as React from "react"
import * as PopoverPrimitive from "@radix-ui/react-popover"

import { cn } from "@/lib/utils"

const Popover = PopoverPrimitive.Root

const PopoverTrigger = PopoverPrimitive.Trigger

const PopoverAnchor = PopoverPrimitive.Anchor

const PopoverContent = React.forwardRef<
  React.ElementRef<typeof PopoverPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Content>
>(({ className, align = "center", sideOffset = 4, ...props }, ref) => (
  <PopoverPrimitive.Portal>
    <PopoverPrimitive.Content
      ref={ref}
      align={align}
      sideOffset={sideOffset}
      className={cn(
        "z-50 w-72 rounded-md border bg-popover p-4 text-popover-foreground shadow-md outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 origin-[--radix-popover-content-transform-origin]",
        className
      )}
      {...props}
    />
  </PopoverPrimitive.Portal>
))
PopoverContent.displayName = PopoverPrimitive.Content.displayName

export { Popover, PopoverTrigger, PopoverContent, PopoverAnchor }
```

## `src/components/ui/progress.tsx`

```tsx
"use client"

import * as React from "react"
import * as ProgressPrimitive from "@radix-ui/react-progress"

import { cn } from "@/lib/utils"

const Progress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root>
>(({ className, value, ...props }, ref) => (
  <ProgressPrimitive.Root
    ref={ref}
    className={cn(
      "relative h-2 w-full overflow-hidden rounded-full bg-primary/20",
      className
    )}
    {...props}
  >
    <ProgressPrimitive.Indicator
      className="h-full w-full flex-1 bg-primary transition-all"
      style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
    />
  </ProgressPrimitive.Root>
))
Progress.displayName = ProgressPrimitive.Root.displayName

export { Progress }
```

## `src/components/ui/radio-group.tsx`

```tsx
import * as React from "react"
import * as RadioGroupPrimitive from "@radix-ui/react-radio-group"
import { Circle } from "lucide-react"

import { cn } from "@/lib/utils"

const RadioGroup = React.forwardRef<
  React.ElementRef<typeof RadioGroupPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Root>
>(({ className, ...props }, ref) => {
  return (
    <RadioGroupPrimitive.Root
      className={cn("grid gap-2", className)}
      {...props}
      ref={ref}
    />
  )
})
RadioGroup.displayName = RadioGroupPrimitive.Root.displayName

const RadioGroupItem = React.forwardRef<
  React.ElementRef<typeof RadioGroupPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Item>
>(({ className, ...props }, ref) => {
  return (
    <RadioGroupPrimitive.Item
      ref={ref}
      className={cn(
        "aspect-square h-4 w-4 rounded-full border border-primary text-primary shadow focus:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    >
      <RadioGroupPrimitive.Indicator className="flex items-center justify-center">
        <Circle className="h-3.5 w-3.5 fill-primary" />
      </RadioGroupPrimitive.Indicator>
    </RadioGroupPrimitive.Item>
  )
})
RadioGroupItem.displayName = RadioGroupPrimitive.Item.displayName

export { RadioGroup, RadioGroupItem }
```

## `src/components/ui/resizable.tsx`

```tsx
"use client"

import { GripVertical } from "lucide-react"
import * as ResizablePrimitive from "react-resizable-panels"

import { cn } from "@/lib/utils"

const ResizablePanelGroup = ({
  className,
  ...props
}: React.ComponentProps<typeof ResizablePrimitive.PanelGroup>) => (
  <ResizablePrimitive.PanelGroup
    className={cn(
      "flex h-full w-full data-[panel-group-direction=vertical]:flex-col",
      className
    )}
    {...props}
  />
)

const ResizablePanel = ResizablePrimitive.Panel

const ResizableHandle = ({
  withHandle,
  className,
  ...props
}: React.ComponentProps<typeof ResizablePrimitive.PanelResizeHandle> & {
  withHandle?: boolean
}) => (
  <ResizablePrimitive.PanelResizeHandle
    className={cn(
      "relative flex w-px items-center justify-center bg-border after:absolute after:inset-y-0 after:left-1/2 after:w-1 after:-translate-x-1/2 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-offset-1 data-[panel-group-direction=vertical]:h-px data-[panel-group-direction=vertical]:w-full data-[panel-group-direction=vertical]:after:left-0 data-[panel-group-direction=vertical]:after:h-1 data-[panel-group-direction=vertical]:after:w-full data-[panel-group-direction=vertical]:after:-translate-y-1/2 data-[panel-group-direction=vertical]:after:translate-x-0 [&[data-panel-group-direction=vertical]>div]:rotate-90",
      className
    )}
    {...props}
  >
    {withHandle && (
      <div className="z-10 flex h-4 w-3 items-center justify-center rounded-sm border bg-border">
        <GripVertical className="h-2.5 w-2.5" />
      </div>
    )}
  </ResizablePrimitive.PanelResizeHandle>
)

export { ResizablePanelGroup, ResizablePanel, ResizableHandle }
```

## `src/components/ui/scroll-area.tsx`

```tsx
import * as React from "react"
import * as ScrollAreaPrimitive from "@radix-ui/react-scroll-area"

import { cn } from "@/lib/utils"

const ScrollArea = React.forwardRef<
  React.ElementRef<typeof ScrollAreaPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ScrollAreaPrimitive.Root>
>(({ className, children, ...props }, ref) => (
  <ScrollAreaPrimitive.Root
    ref={ref}
    className={cn("relative overflow-hidden", className)}
    {...props}
  >
    <ScrollAreaPrimitive.Viewport className="h-full w-full rounded-[inherit]">
      {children}
    </ScrollAreaPrimitive.Viewport>
    <ScrollBar />
    <ScrollAreaPrimitive.Corner />
  </ScrollAreaPrimitive.Root>
))
ScrollArea.displayName = ScrollAreaPrimitive.Root.displayName

const ScrollBar = React.forwardRef<
  React.ElementRef<typeof ScrollAreaPrimitive.ScrollAreaScrollbar>,
  React.ComponentPropsWithoutRef<typeof ScrollAreaPrimitive.ScrollAreaScrollbar>
>(({ className, orientation = "vertical", ...props }, ref) => (
  <ScrollAreaPrimitive.ScrollAreaScrollbar
    ref={ref}
    orientation={orientation}
    className={cn(
      "flex touch-none select-none transition-colors",
      orientation === "vertical" &&
        "h-full w-2.5 border-l border-l-transparent p-[1px]",
      orientation === "horizontal" &&
        "h-2.5 flex-col border-t border-t-transparent p-[1px]",
      className
    )}
    {...props}
  >
    <ScrollAreaPrimitive.ScrollAreaThumb className="relative flex-1 rounded-full bg-border" />
  </ScrollAreaPrimitive.ScrollAreaScrollbar>
))
ScrollBar.displayName = ScrollAreaPrimitive.ScrollAreaScrollbar.displayName

export { ScrollArea, ScrollBar }
```

## `src/components/ui/select.tsx`

```tsx
"use client"

import * as React from "react"
import * as SelectPrimitive from "@radix-ui/react-select"
import { Check, ChevronDown, ChevronUp } from "lucide-react"

import { cn } from "@/lib/utils"

const Select = SelectPrimitive.Root

const SelectGroup = SelectPrimitive.Group

const SelectValue = SelectPrimitive.Value

const SelectTrigger = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger>
>(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Trigger
    ref={ref}
    className={cn(
      "flex h-9 w-full items-center justify-between whitespace-nowrap rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-background data-[placeholder]:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1",
      className
    )}
    {...props}
  >
    {children}
    <SelectPrimitive.Icon asChild>
      <ChevronDown className="h-4 w-4 opacity-50" />
    </SelectPrimitive.Icon>
  </SelectPrimitive.Trigger>
))
SelectTrigger.displayName = SelectPrimitive.Trigger.displayName

const SelectScrollUpButton = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.ScrollUpButton>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.ScrollUpButton>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.ScrollUpButton
    ref={ref}
    className={cn(
      "flex cursor-default items-center justify-center py-1",
      className
    )}
    {...props}
  >
    <ChevronUp className="h-4 w-4" />
  </SelectPrimitive.ScrollUpButton>
))
SelectScrollUpButton.displayName = SelectPrimitive.ScrollUpButton.displayName

const SelectScrollDownButton = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.ScrollDownButton>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.ScrollDownButton>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.ScrollDownButton
    ref={ref}
    className={cn(
      "flex cursor-default items-center justify-center py-1",
      className
    )}
    {...props}
  >
    <ChevronDown className="h-4 w-4" />
  </SelectPrimitive.ScrollDownButton>
))
SelectScrollDownButton.displayName =
  SelectPrimitive.ScrollDownButton.displayName

const SelectContent = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Content>
>(({ className, children, position = "popper", ...props }, ref) => (
  <SelectPrimitive.Portal>
    <SelectPrimitive.Content
      ref={ref}
      className={cn(
        "relative z-50 max-h-[--radix-select-content-available-height] min-w-[8rem] overflow-y-auto overflow-x-hidden rounded-md border bg-popover text-popover-foreground shadow-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 origin-[--radix-select-content-transform-origin]",
        position === "popper" &&
          "data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1",
        className
      )}
      position={position}
      {...props}
    >
      <SelectScrollUpButton />
      <SelectPrimitive.Viewport
        className={cn(
          "p-1",
          position === "popper" &&
            "h-[var(--radix-select-trigger-height)] w-full min-w-[var(--radix-select-trigger-width)]"
        )}
      >
        {children}
      </SelectPrimitive.Viewport>
      <SelectScrollDownButton />
    </SelectPrimitive.Content>
  </SelectPrimitive.Portal>
))
SelectContent.displayName = SelectPrimitive.Content.displayName

const SelectLabel = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Label>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Label>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.Label
    ref={ref}
    className={cn("px-2 py-1.5 text-sm font-semibold", className)}
    {...props}
  />
))
SelectLabel.displayName = SelectPrimitive.Label.displayName

const SelectItem = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Item>
>(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Item
    ref={ref}
    className={cn(
      "relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-2 pr-8 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      className
    )}
    {...props}
  >
    <span className="absolute right-2 flex h-3.5 w-3.5 items-center justify-center">
      <SelectPrimitive.ItemIndicator>
        <Check className="h-4 w-4" />
      </SelectPrimitive.ItemIndicator>
    </span>
    <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
  </SelectPrimitive.Item>
))
SelectItem.displayName = SelectPrimitive.Item.displayName

const SelectSeparator = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.Separator
    ref={ref}
    className={cn("-mx-1 my-1 h-px bg-muted", className)}
    {...props}
  />
))
SelectSeparator.displayName = SelectPrimitive.Separator.displayName

export {
  Select,
  SelectGroup,
  SelectValue,
  SelectTrigger,
  SelectContent,
  SelectLabel,
  SelectItem,
  SelectSeparator,
  SelectScrollUpButton,
  SelectScrollDownButton,
}
```

## `src/components/ui/separator.tsx`

```tsx
import * as React from "react"
import * as SeparatorPrimitive from "@radix-ui/react-separator"

import { cn } from "@/lib/utils"

const Separator = React.forwardRef<
  React.ElementRef<typeof SeparatorPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SeparatorPrimitive.Root>
>(
  (
    { className, orientation = "horizontal", decorative = true, ...props },
    ref
  ) => (
    <SeparatorPrimitive.Root
      ref={ref}
      decorative={decorative}
      orientation={orientation}
      className={cn(
        "shrink-0 bg-border",
        orientation === "horizontal" ? "h-[1px] w-full" : "h-full w-[1px]",
        className
      )}
      {...props}
    />
  )
)
Separator.displayName = SeparatorPrimitive.Root.displayName

export { Separator }
```

## `src/components/ui/sheet.tsx`

```tsx
"use client"

import * as React from "react"
import * as SheetPrimitive from "@radix-ui/react-dialog"
import { cva, type VariantProps } from "class-variance-authority"
import { X } from "lucide-react"

import { cn } from "@/lib/utils"

const Sheet = SheetPrimitive.Root

const SheetTrigger = SheetPrimitive.Trigger

const SheetClose = SheetPrimitive.Close

const SheetPortal = SheetPrimitive.Portal

const SheetOverlay = React.forwardRef<
  React.ElementRef<typeof SheetPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof SheetPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <SheetPrimitive.Overlay
    className={cn(
      "fixed inset-0 z-50 bg-black/80  data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      className
    )}
    {...props}
    ref={ref}
  />
))
SheetOverlay.displayName = SheetPrimitive.Overlay.displayName

const sheetVariants = cva(
  "fixed z-50 gap-4 bg-background p-6 shadow-lg transition ease-in-out data-[state=closed]:duration-300 data-[state=open]:duration-500 data-[state=open]:animate-in data-[state=closed]:animate-out",
  {
    variants: {
      side: {
        top: "inset-x-0 top-0 border-b data-[state=closed]:slide-out-to-top data-[state=open]:slide-in-from-top",
        bottom:
          "inset-x-0 bottom-0 border-t data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom",
        left: "inset-y-0 left-0 h-full w-3/4 border-r data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left sm:max-w-sm",
        right:
          "inset-y-0 right-0 h-full w-3/4 border-l data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right sm:max-w-sm",
      },
    },
    defaultVariants: {
      side: "right",
    },
  }
)

interface SheetContentProps
  extends React.ComponentPropsWithoutRef<typeof SheetPrimitive.Content>,
    VariantProps<typeof sheetVariants> {}

const SheetContent = React.forwardRef<
  React.ElementRef<typeof SheetPrimitive.Content>,
  SheetContentProps
>(({ side = "right", className, children, ...props }, ref) => (
  <SheetPortal>
    <SheetOverlay />
    <SheetPrimitive.Content
      ref={ref}
      className={cn(sheetVariants({ side }), className)}
      {...props}
    >
      <SheetPrimitive.Close className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-secondary">
        <X className="h-4 w-4" />
        <span className="sr-only">Close</span>
      </SheetPrimitive.Close>
      {children}
    </SheetPrimitive.Content>
  </SheetPortal>
))
SheetContent.displayName = SheetPrimitive.Content.displayName

const SheetHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col space-y-2 text-center sm:text-left",
      className
    )}
    {...props}
  />
)
SheetHeader.displayName = "SheetHeader"

const SheetFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2",
      className
    )}
    {...props}
  />
)
SheetFooter.displayName = "SheetFooter"

const SheetTitle = React.forwardRef<
  React.ElementRef<typeof SheetPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof SheetPrimitive.Title>
>(({ className, ...props }, ref) => (
  <SheetPrimitive.Title
    ref={ref}
    className={cn("text-lg font-semibold text-foreground", className)}
    {...props}
  />
))
SheetTitle.displayName = SheetPrimitive.Title.displayName

const SheetDescription = React.forwardRef<
  React.ElementRef<typeof SheetPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof SheetPrimitive.Description>
>(({ className, ...props }, ref) => (
  <SheetPrimitive.Description
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
))
SheetDescription.displayName = SheetPrimitive.Description.displayName

export {
  Sheet,
  SheetPortal,
  SheetOverlay,
  SheetTrigger,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetFooter,
  SheetTitle,
  SheetDescription,
}
```

## `src/components/ui/sidebar.tsx`

```tsx
"use client"

import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, VariantProps } from "class-variance-authority"
import { PanelLeftIcon } from "lucide-react"

import { useIsMobile } from "@/hooks/use-mobile"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

const SIDEBAR_COOKIE_NAME = "sidebar_state"
const SIDEBAR_COOKIE_MAX_AGE = 60 * 60 * 24 * 7
const SIDEBAR_WIDTH = "16rem"
const SIDEBAR_WIDTH_MOBILE = "18rem"
const SIDEBAR_WIDTH_ICON = "3rem"
const SIDEBAR_KEYBOARD_SHORTCUT = "b"

type SidebarContextProps = {
  state: "expanded" | "collapsed"
  open: boolean
  setOpen: (open: boolean) => void
  openMobile: boolean
  setOpenMobile: (open: boolean) => void
  isMobile: boolean
  toggleSidebar: () => void
}

const SidebarContext = React.createContext<SidebarContextProps | null>(null)

function useSidebar() {
  const context = React.useContext(SidebarContext)
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider.")
  }

  return context
}

function SidebarProvider({
  defaultOpen = true,
  open: openProp,
  onOpenChange: setOpenProp,
  className,
  style,
  children,
  ...props
}: React.ComponentProps<"div"> & {
  defaultOpen?: boolean
  open?: boolean
  onOpenChange?: (open: boolean) => void
}) {
  const isMobile = useIsMobile()
  const [openMobile, setOpenMobile] = React.useState(false)

  // This is the internal state of the sidebar.
  // We use openProp and setOpenProp for control from outside the component.
  const [_open, _setOpen] = React.useState(defaultOpen)
  const open = openProp ?? _open
  const setOpen = React.useCallback(
    (value: boolean | ((value: boolean) => boolean)) => {
      const openState = typeof value === "function" ? value(open) : value
      if (setOpenProp) {
        setOpenProp(openState)
      } else {
        _setOpen(openState)
      }

      // This sets the cookie to keep the sidebar state.
      document.cookie = `${SIDEBAR_COOKIE_NAME}=${openState}; path=/; max-age=${SIDEBAR_COOKIE_MAX_AGE}`
    },
    [setOpenProp, open]
  )

  // Helper to toggle the sidebar.
  const toggleSidebar = React.useCallback(() => {
    return isMobile ? setOpenMobile((open) => !open) : setOpen((open) => !open)
  }, [isMobile, setOpen, setOpenMobile])

  // Adds a keyboard shortcut to toggle the sidebar.
  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (
        event.key === SIDEBAR_KEYBOARD_SHORTCUT &&
        (event.metaKey || event.ctrlKey)
      ) {
        event.preventDefault()
        toggleSidebar()
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [toggleSidebar])

  // We add a state so that we can do data-state="expanded" or "collapsed".
  // This makes it easier to style the sidebar with Tailwind classes.
  const state = open ? "expanded" : "collapsed"

  const contextValue = React.useMemo<SidebarContextProps>(
    () => ({
      state,
      open,
      setOpen,
      isMobile,
      openMobile,
      setOpenMobile,
      toggleSidebar,
    }),
    [state, open, setOpen, isMobile, openMobile, setOpenMobile, toggleSidebar]
  )

  return (
    <SidebarContext.Provider value={contextValue}>
      <TooltipProvider delayDuration={0}>
        <div
          data-slot="sidebar-wrapper"
          style={
            {
              "--sidebar-width": SIDEBAR_WIDTH,
              "--sidebar-width-icon": SIDEBAR_WIDTH_ICON,
              ...style,
            } as React.CSSProperties
          }
          className={cn(
            "group/sidebar-wrapper has-data-[variant=inset]:bg-sidebar flex min-h-svh w-full",
            className
          )}
          {...props}
        >
          {children}
        </div>
      </TooltipProvider>
    </SidebarContext.Provider>
  )
}

function Sidebar({
  side = "left",
  variant = "sidebar",
  collapsible = "offcanvas",
  className,
  children,
  ...props
}: React.ComponentProps<"div"> & {
  side?: "left" | "right"
  variant?: "sidebar" | "floating" | "inset"
  collapsible?: "offcanvas" | "icon" | "none"
}) {
  const { isMobile, state, openMobile, setOpenMobile } = useSidebar()

  if (collapsible === "none") {
    return (
      <div
        data-slot="sidebar"
        className={cn(
          "bg-sidebar text-sidebar-foreground flex h-full w-[var(--sidebar-width)] flex-col",
          className
        )}
        {...props}
      >
        {children}
      </div>
    )
  }

  if (isMobile) {
    return (
      <Sheet open={openMobile} onOpenChange={setOpenMobile} {...props}>
        <SheetContent
          data-sidebar="sidebar"
          data-slot="sidebar"
          data-mobile="true"
          className="bg-sidebar text-sidebar-foreground w-[var(--sidebar-width)] p-0 [&>button]:hidden"
          style={
            {
              "--sidebar-width": SIDEBAR_WIDTH_MOBILE,
            } as React.CSSProperties
          }
          side={side}
        >
          <SheetHeader className="sr-only">
            <SheetTitle>Sidebar</SheetTitle>
            <SheetDescription>Displays the mobile sidebar.</SheetDescription>
          </SheetHeader>
          <div className="flex h-full w-full flex-col">{children}</div>
        </SheetContent>
      </Sheet>
    )
  }

  return (
    <div
      className="group peer text-sidebar-foreground hidden md:block"
      data-state={state}
      data-collapsible={state === "collapsed" ? collapsible : ""}
      data-variant={variant}
      data-side={side}
      data-slot="sidebar"
    >
      {/* This is what handles the sidebar gap on desktop */}
      <div
        data-slot="sidebar-gap"
        className={cn(
          "relative w-[var(--sidebar-width)] bg-transparent transition-[width] duration-200 ease-linear",
          "group-data-[collapsible=offcanvas]:w-0",
          "group-data-[side=right]:rotate-180",
          variant === "floating" || variant === "inset"
            ? "group-data-[collapsible=icon]:w-[calc(var(--sidebar-width-icon)+var(--spacing-4))]"
            : "group-data-[collapsible=icon]:w-[var(--sidebar-width-icon)]"
        )}
      />
      <div
        data-slot="sidebar-container"
        className={cn(
          "fixed inset-y-0 z-10 hidden h-svh w-[var(--sidebar-width)] transition-[left,right,width] duration-200 ease-linear md:flex",
          side === "left"
            ? "left-0 group-data-[collapsible=offcanvas]:left-[calc(var(--sidebar-width)*-1)]"
            : "right-0 group-data-[collapsible=offcanvas]:right-[calc(var(--sidebar-width)*-1)]",
          // Adjust the padding for floating and inset variants.
          variant === "floating" || variant === "inset"
            ? "p-2 group-data-[collapsible=icon]:w-[calc(var(--sidebar-width-icon)+var(--spacing-4)+2px)]"
            : "group-data-[collapsible=icon]:w-[var(--sidebar-width-icon)] group-data-[side=left]:border-r group-data-[side=right]:border-l",
          className
        )}
        {...props}
      >
        <div
          data-sidebar="sidebar"
          data-slot="sidebar-inner"
          className="bg-sidebar group-data-[variant=floating]:border-sidebar-border flex h-full w-full flex-col group-data-[variant=floating]:rounded-lg group-data-[variant=floating]:border group-data-[variant=floating]:shadow-sm"
        >
          {children}
        </div>
      </div>
    </div>
  )
}

function SidebarTrigger({
  className,
  onClick,
  ...props
}: React.ComponentProps<typeof Button>) {
  const { toggleSidebar } = useSidebar()

  return (
    <Button
      data-sidebar="trigger"
      data-slot="sidebar-trigger"
      variant="ghost"
      size="icon"
      className={cn("h-7 w-7", className)}
      onClick={(event) => {
        onClick?.(event)
        toggleSidebar()
      }}
      {...props}
    >
      <PanelLeftIcon />
      <span className="sr-only">Toggle Sidebar</span>
    </Button>
  )
}

function SidebarRail({ className, ...props }: React.ComponentProps<"button">) {
  const { toggleSidebar } = useSidebar()

  // Note: Tailwind v3.4 doesn't support "in-" selectors. So the rail won't work perfectly.
  return (
    <button
      data-sidebar="rail"
      data-slot="sidebar-rail"
      aria-label="Toggle Sidebar"
      tabIndex={-1}
      onClick={toggleSidebar}
      title="Toggle Sidebar"
      className={cn(
        "hover:after:bg-sidebar-border absolute inset-y-0 z-20 hidden w-4 -translate-x-1/2 transition-all ease-linear group-data-[side=left]:-right-4 group-data-[side=right]:left-0 after:absolute after:inset-y-0 after:left-1/2 after:w-[2px] sm:flex",
        "in-data-[side=left]:cursor-w-resize in-data-[side=right]:cursor-e-resize",
        "[[data-side=left][data-state=collapsed]_&]:cursor-e-resize [[data-side=right][data-state=collapsed]_&]:cursor-w-resize",
        "hover:group-data-[collapsible=offcanvas]:bg-sidebar group-data-[collapsible=offcanvas]:translate-x-0 group-data-[collapsible=offcanvas]:after:left-full",
        "[[data-side=left][data-collapsible=offcanvas]_&]:-right-2",
        "[[data-side=right][data-collapsible=offcanvas]_&]:-left-2",
        className
      )}
      {...props}
    />
  )
}

function SidebarInset({ className, ...props }: React.ComponentProps<"main">) {
  return (
    <main
      data-slot="sidebar-inset"
      className={cn(
        "bg-background relative flex w-full flex-1 flex-col",
        "md:peer-data-[variant=inset]:m-2 md:peer-data-[variant=inset]:ml-0 md:peer-data-[variant=inset]:rounded-xl md:peer-data-[variant=inset]:shadow-sm md:peer-data-[variant=inset]:peer-data-[state=collapsed]:ml-2",
        className
      )}
      {...props}
    />
  )
}

function SidebarInput({
  className,
  ...props
}: React.ComponentProps<typeof Input>) {
  return (
    <Input
      data-slot="sidebar-input"
      data-sidebar="input"
      className={cn("bg-background h-8 w-full shadow-none", className)}
      {...props}
    />
  )
}

function SidebarHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sidebar-header"
      data-sidebar="header"
      className={cn("flex flex-col gap-2 p-2", className)}
      {...props}
    />
  )
}

function SidebarFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sidebar-footer"
      data-sidebar="footer"
      className={cn("flex flex-col gap-2 p-2", className)}
      {...props}
    />
  )
}

function SidebarSeparator({
  className,
  ...props
}: React.ComponentProps<typeof Separator>) {
  return (
    <Separator
      data-slot="sidebar-separator"
      data-sidebar="separator"
      className={cn("bg-sidebar-border mx-2 w-auto", className)}
      {...props}
    />
  )
}

function SidebarContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sidebar-content"
      data-sidebar="content"
      className={cn(
        "flex min-h-0 flex-1 flex-col gap-2 overflow-auto group-data-[collapsible=icon]:overflow-hidden",
        className
      )}
      {...props}
    />
  )
}

function SidebarGroup({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sidebar-group"
      data-sidebar="group"
      className={cn("relative flex w-full min-w-0 flex-col p-2", className)}
      {...props}
    />
  )
}

function SidebarGroupLabel({
  className,
  asChild = false,
  ...props
}: React.ComponentProps<"div"> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "div"

  return (
    <Comp
      data-slot="sidebar-group-label"
      data-sidebar="group-label"
      className={cn(
        "text-sidebar-foreground/70 ring-sidebar-ring flex h-8 shrink-0 items-center rounded-md px-2 text-xs font-medium outline-hidden transition-[margin,opacity] duration-200 ease-linear focus-visible:ring-2 [&>svg]:h-4 [&>svg]:w-4 [&>svg]:shrink-0",
        "group-data-[collapsible=icon]:-mt-8 group-data-[collapsible=icon]:opacity-0",
        className
      )}
      {...props}
    />
  )
}

function SidebarGroupAction({
  className,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "button"

  return (
    <Comp
      data-slot="sidebar-group-action"
      data-sidebar="group-action"
      className={cn(
        "text-sidebar-foreground ring-sidebar-ring hover:bg-sidebar-accent hover:text-sidebar-accent-foreground absolute top-3.5 right-3 flex aspect-square w-5 items-center justify-center rounded-md p-0 outline-hidden transition-transform focus-visible:ring-2 [&>svg]:size-4 [&>svg]:shrink-0",
        // Increases the hit area of the button on mobile.
        "after:absolute after:-inset-2 md:after:hidden",
        "group-data-[collapsible=icon]:hidden",
        className
      )}
      {...props}
    />
  )
}

function SidebarGroupContent({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sidebar-group-content"
      data-sidebar="group-content"
      className={cn("w-full text-sm", className)}
      {...props}
    />
  )
}

function SidebarMenu({ className, ...props }: React.ComponentProps<"ul">) {
  return (
    <ul
      data-slot="sidebar-menu"
      data-sidebar="menu"
      className={cn("flex w-full min-w-0 flex-col gap-1", className)}
      {...props}
    />
  )
}

function SidebarMenuItem({ className, ...props }: React.ComponentProps<"li">) {
  return (
    <li
      data-slot="sidebar-menu-item"
      data-sidebar="menu-item"
      className={cn("group/menu-item relative", className)}
      {...props}
    />
  )
}

const sidebarMenuButtonVariants = cva(
  "peer/menu-button flex w-full items-center gap-2 overflow-hidden rounded-md p-2 text-left text-sm outline-hidden ring-sidebar-ring transition-[width,height,padding] hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 active:bg-sidebar-accent active:text-sidebar-accent-foreground disabled:pointer-events-none disabled:opacity-50 group-has-data-[sidebar=menu-action]/menu-item:pr-8 aria-disabled:pointer-events-none aria-disabled:opacity-50 data-[active=true]:bg-sidebar-accent data-[active=true]:font-medium data-[active=true]:text-sidebar-accent-foreground data-[state=open]:hover:bg-sidebar-accent data-[state=open]:hover:text-sidebar-accent-foreground group-data-[collapsible=icon]:w-8! group-data-[collapsible=icon]:h-8! group-data-[collapsible=icon]:p-2! [&>span:last-child]:truncate [&>svg]:size-4 [&>svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
        outline:
          "bg-background shadow-[0_0_0_1px_hsl(var(--sidebar-border))] hover:bg-sidebar-accent hover:text-sidebar-accent-foreground hover:shadow-[0_0_0_1px_hsl(var(--sidebar-accent))]",
      },
      size: {
        default: "h-8 text-sm",
        sm: "h-7 text-xs",
        lg: "h-12 text-sm group-data-[collapsible=icon]:p-0!",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function SidebarMenuButton({
  asChild = false,
  isActive = false,
  variant = "default",
  size = "default",
  tooltip,
  className,
  ...props
}: React.ComponentProps<"button"> & {
  asChild?: boolean
  isActive?: boolean
  tooltip?: string | React.ComponentProps<typeof TooltipContent>
} & VariantProps<typeof sidebarMenuButtonVariants>) {
  const Comp = asChild ? Slot : "button"
  const { isMobile, state } = useSidebar()

  const button = (
    <Comp
      data-slot="sidebar-menu-button"
      data-sidebar="menu-button"
      data-size={size}
      data-active={isActive}
      className={cn(sidebarMenuButtonVariants({ variant, size }), className)}
      {...props}
    />
  )

  if (!tooltip) {
    return button
  }

  if (typeof tooltip === "string") {
    tooltip = {
      children: tooltip,
    }
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>{button}</TooltipTrigger>
      <TooltipContent
        side="right"
        align="center"
        hidden={state !== "collapsed" || isMobile}
        {...tooltip}
      />
    </Tooltip>
  )
}

function SidebarMenuAction({
  className,
  asChild = false,
  showOnHover = false,
  ...props
}: React.ComponentProps<"button"> & {
  asChild?: boolean
  showOnHover?: boolean
}) {
  const Comp = asChild ? Slot : "button"

  return (
    <Comp
      data-slot="sidebar-menu-action"
      data-sidebar="menu-action"
      className={cn(
        "text-sidebar-foreground ring-sidebar-ring hover:bg-sidebar-accent hover:text-sidebar-accent-foreground peer-hover/menu-button:text-sidebar-accent-foreground absolute top-1.5 right-1 flex aspect-square w-5 items-center justify-center rounded-md p-0 outline-hidden transition-transform focus-visible:ring-2 [&>svg]:size-4 [&>svg]:shrink-0",
        // Increases the hit area of the button on mobile.
        "after:absolute after:-inset-2 md:after:hidden",
        "peer-data-[size=sm]/menu-button:top-1",
        "peer-data-[size=default]/menu-button:top-1.5",
        "peer-data-[size=lg]/menu-button:top-2.5",
        "group-data-[collapsible=icon]:hidden",
        showOnHover &&
          "peer-data-[active=true]/menu-button:text-sidebar-accent-foreground group-focus-within/menu-item:opacity-100 group-hover/menu-item:opacity-100 data-[state=open]:opacity-100 md:opacity-0",
        className
      )}
      {...props}
    />
  )
}

function SidebarMenuBadge({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sidebar-menu-badge"
      data-sidebar="menu-badge"
      className={cn(
        "text-sidebar-foreground pointer-events-none absolute right-1 flex h-5 min-w-5 items-center justify-center rounded-md px-1 text-xs font-medium tabular-nums select-none",
        "peer-hover/menu-button:text-sidebar-accent-foreground peer-data-[active=true]/menu-button:text-sidebar-accent-foreground",
        "peer-data-[size=sm]/menu-button:top-1",
        "peer-data-[size=default]/menu-button:top-1.5",
        "peer-data-[size=lg]/menu-button:top-2.5",
        "group-data-[collapsible=icon]:hidden",
        className
      )}
      {...props}
    />
  )
}

function SidebarMenuSkeleton({
  className,
  showIcon = false,
  ...props
}: React.ComponentProps<"div"> & {
  showIcon?: boolean
}) {
  // Random width between 50 to 90%.
  const width = React.useMemo(() => {
    return `${Math.floor(Math.random() * 40) + 50}%`
  }, [])

  return (
    <div
      data-slot="sidebar-menu-skeleton"
      data-sidebar="menu-skeleton"
      className={cn("flex h-8 items-center gap-2 rounded-md px-2", className)}
      {...props}
    >
      {showIcon && (
        <Skeleton
          className="size-4 rounded-md"
          data-sidebar="menu-skeleton-icon"
        />
      )}
      <Skeleton
        className="h-4 max-w-[var(--skeleton-width)] flex-1"
        data-sidebar="menu-skeleton-text"
        style={
          {
            "--skeleton-width": width,
          } as React.CSSProperties
        }
      />
    </div>
  )
}

function SidebarMenuSub({ className, ...props }: React.ComponentProps<"ul">) {
  return (
    <ul
      data-slot="sidebar-menu-sub"
      data-sidebar="menu-sub"
      className={cn(
        "border-sidebar-border mx-3.5 flex min-w-0 translate-x-px flex-col gap-1 border-l px-2.5 py-0.5",
        "group-data-[collapsible=icon]:hidden",
        className
      )}
      {...props}
    />
  )
}

function SidebarMenuSubItem({
  className,
  ...props
}: React.ComponentProps<"li">) {
  return (
    <li
      data-slot="sidebar-menu-sub-item"
      data-sidebar="menu-sub-item"
      className={cn("group/menu-sub-item relative", className)}
      {...props}
    />
  )
}

function SidebarMenuSubButton({
  asChild = false,
  size = "md",
  isActive = false,
  className,
  ...props
}: React.ComponentProps<"a"> & {
  asChild?: boolean
  size?: "sm" | "md"
  isActive?: boolean
}) {
  const Comp = asChild ? Slot : "a"

  return (
    <Comp
      data-slot="sidebar-menu-sub-button"
      data-sidebar="menu-sub-button"
      data-size={size}
      data-active={isActive}
      className={cn(
        "text-sidebar-foreground ring-sidebar-ring hover:bg-sidebar-accent hover:text-sidebar-accent-foreground active:bg-sidebar-accent active:text-sidebar-accent-foreground [&>svg]:text-sidebar-accent-foreground flex h-7 min-w-0 -translate-x-px items-center gap-2 overflow-hidden rounded-md px-2 outline outline-2 outline-transparent outline-offset-2 focus-visible:ring-2 disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50 [&>span:last-child]:truncate [&>svg]:size-4 [&>svg]:shrink-0",
        "data-[active=true]:bg-sidebar-accent data-[active=true]:text-sidebar-accent-foreground",
        size === "sm" && "text-xs",
        size === "md" && "text-sm",
        "group-data-[collapsible=icon]:hidden",
        className
      )}
      {...props}
    />
  )
}

export {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupAction,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInput,
  SidebarInset,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSkeleton,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarProvider,
  SidebarRail,
  SidebarSeparator,
  SidebarTrigger,
  useSidebar,
}
```

## `src/components/ui/skeleton.tsx`

```tsx
import { cn } from "@/lib/utils"

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-primary/10", className)}
      {...props}
    />
  )
}

export { Skeleton }
```

## `src/components/ui/slider.tsx`

```tsx
import * as React from "react"
import * as SliderPrimitive from "@radix-ui/react-slider"

import { cn } from "@/lib/utils"

const Slider = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root>
>(({ className, ...props }, ref) => (
  <SliderPrimitive.Root
    ref={ref}
    className={cn(
      "relative flex w-full touch-none select-none items-center",
      className
    )}
    {...props}
  >
    <SliderPrimitive.Track className="relative h-1.5 w-full grow overflow-hidden rounded-full bg-primary/20">
      <SliderPrimitive.Range className="absolute h-full bg-primary" />
    </SliderPrimitive.Track>
    <SliderPrimitive.Thumb className="block h-4 w-4 rounded-full border border-primary/50 bg-background shadow transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50" />
  </SliderPrimitive.Root>
))
Slider.displayName = SliderPrimitive.Root.displayName

export { Slider }
```

## `src/components/ui/sonner.tsx`

```tsx
"use client"

import { useTheme } from "next-themes"
import { Toaster as Sonner } from "sonner"

type ToasterProps = React.ComponentProps<typeof Sonner>

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg",
          description: "group-[.toast]:text-muted-foreground",
          actionButton:
            "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton:
            "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
```

## `src/components/ui/spinner.tsx`

```tsx
import { Loader2Icon } from "lucide-react"

import { cn } from "@/lib/utils"

function Spinner({ className, ...props }: React.ComponentProps<"svg">) {
  return (
    <Loader2Icon
      role="status"
      aria-label="Loading"
      className={cn("size-4 animate-spin", className)}
      {...props}
    />
  )
}

export { Spinner }
```

## `src/components/ui/switch.tsx`

```tsx
import * as React from "react"
import * as SwitchPrimitives from "@radix-ui/react-switch"

import { cn } from "@/lib/utils"

const Switch = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitives.Root>,
  React.ComponentPropsWithoutRef<typeof SwitchPrimitives.Root>
>(({ className, ...props }, ref) => (
  <SwitchPrimitives.Root
    className={cn(
      "peer inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=unchecked]:bg-input",
      className
    )}
    {...props}
    ref={ref}
  >
    <SwitchPrimitives.Thumb
      className={cn(
        "pointer-events-none block h-4 w-4 rounded-full bg-background shadow-lg ring-0 transition-transform data-[state=checked]:translate-x-4 data-[state=unchecked]:translate-x-0"
      )}
    />
  </SwitchPrimitives.Root>
))
Switch.displayName = SwitchPrimitives.Root.displayName

export { Switch }
```

## `src/components/ui/table.tsx`

```tsx
import * as React from "react"

import { cn } from "@/lib/utils"

const Table = React.forwardRef<
  HTMLTableElement,
  React.HTMLAttributes<HTMLTableElement>
>(({ className, ...props }, ref) => (
  <div className="relative w-full overflow-auto">
    <table
      ref={ref}
      className={cn("w-full caption-bottom text-sm", className)}
      {...props}
    />
  </div>
))
Table.displayName = "Table"

const TableHeader = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <thead ref={ref} className={cn("[&_tr]:border-b", className)} {...props} />
))
TableHeader.displayName = "TableHeader"

const TableBody = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tbody
    ref={ref}
    className={cn("[&_tr:last-child]:border-0", className)}
    {...props}
  />
))
TableBody.displayName = "TableBody"

const TableFooter = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tfoot
    ref={ref}
    className={cn(
      "border-t bg-muted/50 font-medium [&>tr]:last:border-b-0",
      className
    )}
    {...props}
  />
))
TableFooter.displayName = "TableFooter"

const TableRow = React.forwardRef<
  HTMLTableRowElement,
  React.HTMLAttributes<HTMLTableRowElement>
>(({ className, ...props }, ref) => (
  <tr
    ref={ref}
    className={cn(
      "border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted",
      className
    )}
    {...props}
  />
))
TableRow.displayName = "TableRow"

const TableHead = React.forwardRef<
  HTMLTableCellElement,
  React.ThHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
  <th
    ref={ref}
    className={cn(
      "h-10 px-2 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]",
      className
    )}
    {...props}
  />
))
TableHead.displayName = "TableHead"

const TableCell = React.forwardRef<
  HTMLTableCellElement,
  React.TdHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
  <td
    ref={ref}
    className={cn(
      "p-2 align-middle [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]",
      className
    )}
    {...props}
  />
))
TableCell.displayName = "TableCell"

const TableCaption = React.forwardRef<
  HTMLTableCaptionElement,
  React.HTMLAttributes<HTMLTableCaptionElement>
>(({ className, ...props }, ref) => (
  <caption
    ref={ref}
    className={cn("mt-4 text-sm text-muted-foreground", className)}
    {...props}
  />
))
TableCaption.displayName = "TableCaption"

export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
}
```

## `src/components/ui/tabs.tsx`

```tsx
import * as React from "react"
import * as TabsPrimitive from "@radix-ui/react-tabs"

import { cn } from "@/lib/utils"

const Tabs = TabsPrimitive.Root

const TabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={cn(
      "inline-flex h-9 items-center justify-center rounded-lg bg-muted p-1 text-muted-foreground",
      className
    )}
    {...props}
  />
))
TabsList.displayName = TabsPrimitive.List.displayName

const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={cn(
      "inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow",
      className
    )}
    {...props}
  />
))
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName

const TabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn(
      "mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
      className
    )}
    {...props}
  />
))
TabsContent.displayName = TabsPrimitive.Content.displayName

export { Tabs, TabsList, TabsTrigger, TabsContent }
```

## `src/components/ui/textarea.tsx`

```tsx
import * as React from "react"

import { cn } from "@/lib/utils"

const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.ComponentProps<"textarea">
>(({ className, ...props }, ref) => {
  return (
    <textarea
      className={cn(
        "flex min-h-[60px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-base shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        className
      )}
      ref={ref}
      {...props}
    />
  )
})
Textarea.displayName = "Textarea"

export { Textarea }
```

## `src/components/ui/toaster.tsx`

```tsx
import { useToast } from "@/hooks/use-toast"
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast"

export function Toaster() {
  const { toasts } = useToast()

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, ...props }) {
        return (
          <Toast key={id} {...props}>
            <div className="grid gap-1">
              {title && <ToastTitle>{title}</ToastTitle>}
              {description && (
                <ToastDescription>{description}</ToastDescription>
              )}
            </div>
            {action}
            <ToastClose />
          </Toast>
        )
      })}
      <ToastViewport />
    </ToastProvider>
  )
}
```

## `src/components/ui/toast.tsx`

```tsx
import * as React from "react"
import * as ToastPrimitives from "@radix-ui/react-toast"
import { cva, type VariantProps } from "class-variance-authority"
import { X } from "lucide-react"

import { cn } from "@/lib/utils"

const ToastProvider = ToastPrimitives.Provider

const ToastViewport = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Viewport>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Viewport>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Viewport
    ref={ref}
    className={cn(
      "fixed top-0 z-[100] flex max-h-screen w-full flex-col-reverse p-4 sm:bottom-0 sm:right-0 sm:top-auto sm:flex-col md:max-w-[420px]",
      className
    )}
    {...props}
  />
))
ToastViewport.displayName = ToastPrimitives.Viewport.displayName

const toastVariants = cva(
  "group pointer-events-auto relative flex w-full items-center justify-between space-x-4 overflow-hidden rounded-md border p-6 pr-8 shadow-lg transition-all data-[swipe=cancel]:translate-x-0 data-[swipe=end]:translate-x-[var(--radix-toast-swipe-end-x)] data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)] data-[swipe=move]:transition-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[swipe=end]:animate-out data-[state=closed]:fade-out-80 data-[state=closed]:slide-out-to-right-full data-[state=open]:slide-in-from-top-full data-[state=open]:sm:slide-in-from-bottom-full",
  {
    variants: {
      variant: {
        default: "border bg-background text-foreground",
        destructive:
          "destructive group border-destructive bg-destructive text-destructive-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

const Toast = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Root>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Root> &
    VariantProps<typeof toastVariants>
>(({ className, variant, ...props }, ref) => {
  return (
    <ToastPrimitives.Root
      ref={ref}
      className={cn(toastVariants({ variant }), className)}
      {...props}
    />
  )
})
Toast.displayName = ToastPrimitives.Root.displayName

const ToastAction = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Action>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Action>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Action
    ref={ref}
    className={cn(
      "inline-flex h-8 shrink-0 items-center justify-center rounded-md border bg-transparent px-3 text-sm font-medium ring-offset-background transition-colors hover:bg-secondary focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 group-[.destructive]:border-muted/40 group-[.destructive]:hover:border-destructive/30 group-[.destructive]:hover:bg-destructive group-[.destructive]:hover:text-destructive-foreground group-[.destructive]:focus:ring-destructive",
      className
    )}
    {...props}
  />
))
ToastAction.displayName = ToastPrimitives.Action.displayName

const ToastClose = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Close>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Close>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Close
    ref={ref}
    className={cn(
      "absolute right-2 top-2 rounded-md p-1 text-foreground/50 opacity-0 transition-opacity hover:text-foreground focus:opacity-100 focus:outline-none focus:ring-2 group-hover:opacity-100 group-[.destructive]:text-red-300 group-[.destructive]:hover:text-red-50 group-[.destructive]:focus:ring-red-400 group-[.destructive]:focus:ring-offset-red-600",
      className
    )}
    toast-close=""
    {...props}
  >
    <X className="h-4 w-4" />
  </ToastPrimitives.Close>
))
ToastClose.displayName = ToastPrimitives.Close.displayName

const ToastTitle = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Title>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Title>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Title
    ref={ref}
    className={cn("text-sm font-semibold", className)}
    {...props}
  />
))
ToastTitle.displayName = ToastPrimitives.Title.displayName

const ToastDescription = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Description>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Description>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Description
    ref={ref}
    className={cn("text-sm opacity-90", className)}
    {...props}
  />
))
ToastDescription.displayName = ToastPrimitives.Description.displayName

type ToastProps = React.ComponentPropsWithoutRef<typeof Toast>

type ToastActionElement = React.ReactElement<typeof ToastAction>

export {
  type ToastProps,
  type ToastActionElement,
  ToastProvider,
  ToastViewport,
  Toast,
  ToastTitle,
  ToastDescription,
  ToastClose,
  ToastAction,
}
```

## `src/components/ui/toggle-group.tsx`

```tsx
"use client"

import * as React from "react"
import * as ToggleGroupPrimitive from "@radix-ui/react-toggle-group"
import { type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"
import { toggleVariants } from "@/components/ui/toggle"

const ToggleGroupContext = React.createContext<
  VariantProps<typeof toggleVariants>
>({
  size: "default",
  variant: "default",
})

const ToggleGroup = React.forwardRef<
  React.ElementRef<typeof ToggleGroupPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ToggleGroupPrimitive.Root> &
    VariantProps<typeof toggleVariants>
>(({ className, variant, size, children, ...props }, ref) => (
  <ToggleGroupPrimitive.Root
    ref={ref}
    className={cn("flex items-center justify-center gap-1", className)}
    {...props}
  >
    <ToggleGroupContext.Provider value={{ variant, size }}>
      {children}
    </ToggleGroupContext.Provider>
  </ToggleGroupPrimitive.Root>
))

ToggleGroup.displayName = ToggleGroupPrimitive.Root.displayName

const ToggleGroupItem = React.forwardRef<
  React.ElementRef<typeof ToggleGroupPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof ToggleGroupPrimitive.Item> &
    VariantProps<typeof toggleVariants>
>(({ className, children, variant, size, ...props }, ref) => {
  const context = React.useContext(ToggleGroupContext)

  return (
    <ToggleGroupPrimitive.Item
      ref={ref}
      className={cn(
        toggleVariants({
          variant: context.variant || variant,
          size: context.size || size,
        }),
        className
      )}
      {...props}
    >
      {children}
    </ToggleGroupPrimitive.Item>
  )
})

ToggleGroupItem.displayName = ToggleGroupPrimitive.Item.displayName

export { ToggleGroup, ToggleGroupItem }
```

## `src/components/ui/toggle.tsx`

```tsx
import * as React from "react"
import * as TogglePrimitive from "@radix-ui/react-toggle"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const toggleVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium transition-colors hover:bg-muted hover:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 data-[state=on]:bg-accent data-[state=on]:text-accent-foreground [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-transparent",
        outline:
          "border border-input bg-transparent shadow-sm hover:bg-accent hover:text-accent-foreground",
      },
      size: {
        default: "h-9 px-2 min-w-9",
        sm: "h-8 px-1.5 min-w-8",
        lg: "h-10 px-2.5 min-w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

const Toggle = React.forwardRef<
  React.ElementRef<typeof TogglePrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof TogglePrimitive.Root> &
    VariantProps<typeof toggleVariants>
>(({ className, variant, size, ...props }, ref) => (
  <TogglePrimitive.Root
    ref={ref}
    className={cn(toggleVariants({ variant, size, className }))}
    {...props}
  />
))

Toggle.displayName = TogglePrimitive.Root.displayName

export { Toggle, toggleVariants }
```

## `src/components/ui/tooltip.tsx`

```tsx
"use client"

import * as React from "react"
import * as TooltipPrimitive from "@radix-ui/react-tooltip"

import { cn } from "@/lib/utils"

const TooltipProvider = TooltipPrimitive.Provider

const Tooltip = TooltipPrimitive.Root

const TooltipTrigger = TooltipPrimitive.Trigger

const TooltipContent = React.forwardRef<
  React.ElementRef<typeof TooltipPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content>
>(({ className, sideOffset = 4, ...props }, ref) => (
  <TooltipPrimitive.Portal>
    <TooltipPrimitive.Content
      ref={ref}
      sideOffset={sideOffset}
      className={cn(
        "z-50 overflow-hidden rounded-md bg-primary px-3 py-1.5 text-xs text-primary-foreground animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 origin-[--radix-tooltip-content-transform-origin]",
        className
      )}
      {...props}
    />
  </TooltipPrimitive.Portal>
))
TooltipContent.displayName = TooltipPrimitive.Content.displayName

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider }
```

## `src/components/VideoEmbed.tsx`

```tsx
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
  const inView = useInView(ref, { once: true, amount: 0.25 });
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
          {/* Idle state — pulsing hive mark until the section scrolls into view */}
          {!revealed && (
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

          {/* Video preview (silent) — mounted immediately so it is already
              loaded and playing by the time the section scrolls into view. */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: revealed ? 1 : 0 }}
            transition={{ duration: reducedMotion ? 0.3 : 1, ease: [0.22, 1, 0.36, 1] }}
            className="absolute inset-0"
          >
            <iframe
              src={src}
              title={title}
              className="w-full h-full border-0 pointer-events-none"
              loading="eager"
              tabIndex={-1}
              scrolling="no"
            />
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
```

## `src/components/VideoShowcase.tsx`

```tsx
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
    const onScroll = () => close();
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
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-10"
            onClick={close}
          >
            <motion.div
              initial={reducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.92, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={reducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.95, y: 12 }}
              transition={{ type: "spring", stiffness: 260, damping: 28 }}
              className="relative w-full"
              style={{
                maxWidth: "min(92vw, calc((100vh - 8rem) * 16 / 9), 72rem)",
              }}
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
```

## `src/hooks/use-mobile.tsx`

```tsx
import * as React from "react"

const MOBILE_BREAKPOINT = 768

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined)

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    }
    mql.addEventListener("change", onChange)
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    return () => mql.removeEventListener("change", onChange)
  }, [])

  return !!isMobile
}
```

## `src/hooks/use-theme.tsx`

```tsx
import { useEffect, useState } from "react";

type Theme = "dark" | "light" | "system";

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(() => {
    // Default to dark so the black rubber surface is the first impression
    return (localStorage.getItem("theme") as Theme) || "dark";
  });

  useEffect(() => {
    const root = window.document.documentElement;
    
    root.classList.remove("light", "dark");
    
    if (theme === "system") {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)")
        .matches
        ? "dark"
        : "light";
      
      root.classList.add(systemTheme);
      return;
    }
    
    root.classList.add(theme);
  }, [theme]);

  const setAndSaveTheme = (newTheme: Theme) => {
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
  };

  return { theme, setTheme: setAndSaveTheme };
}
```

## `src/hooks/use-toast.ts`

```ts
import * as React from "react"

import type {
  ToastActionElement,
  ToastProps,
} from "@/components/ui/toast"

const TOAST_LIMIT = 1
const TOAST_REMOVE_DELAY = 1000000

type ToasterToast = ToastProps & {
  id: string
  title?: React.ReactNode
  description?: React.ReactNode
  action?: ToastActionElement
}

const actionTypes = {
  ADD_TOAST: "ADD_TOAST",
  UPDATE_TOAST: "UPDATE_TOAST",
  DISMISS_TOAST: "DISMISS_TOAST",
  REMOVE_TOAST: "REMOVE_TOAST",
} as const

let count = 0

function genId() {
  count = (count + 1) % Number.MAX_SAFE_INTEGER
  return count.toString()
}

type ActionType = typeof actionTypes

type Action =
  | {
      type: ActionType["ADD_TOAST"]
      toast: ToasterToast
    }
  | {
      type: ActionType["UPDATE_TOAST"]
      toast: Partial<ToasterToast>
    }
  | {
      type: ActionType["DISMISS_TOAST"]
      toastId?: ToasterToast["id"]
    }
  | {
      type: ActionType["REMOVE_TOAST"]
      toastId?: ToasterToast["id"]
    }

interface State {
  toasts: ToasterToast[]
}

const toastTimeouts = new Map<string, ReturnType<typeof setTimeout>>()

const addToRemoveQueue = (toastId: string) => {
  if (toastTimeouts.has(toastId)) {
    return
  }

  const timeout = setTimeout(() => {
    toastTimeouts.delete(toastId)
    dispatch({
      type: "REMOVE_TOAST",
      toastId: toastId,
    })
  }, TOAST_REMOVE_DELAY)

  toastTimeouts.set(toastId, timeout)
}

export const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case "ADD_TOAST":
      return {
        ...state,
        toasts: [action.toast, ...state.toasts].slice(0, TOAST_LIMIT),
      }

    case "UPDATE_TOAST":
      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === action.toast.id ? { ...t, ...action.toast } : t
        ),
      }

    case "DISMISS_TOAST": {
      const { toastId } = action

      // ! Side effects ! - This could be extracted into a dismissToast() action,
      // but I'll keep it here for simplicity
      if (toastId) {
        addToRemoveQueue(toastId)
      } else {
        state.toasts.forEach((toast) => {
          addToRemoveQueue(toast.id)
        })
      }

      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === toastId || toastId === undefined
            ? {
                ...t,
                open: false,
              }
            : t
        ),
      }
    }
    case "REMOVE_TOAST":
      if (action.toastId === undefined) {
        return {
          ...state,
          toasts: [],
        }
      }
      return {
        ...state,
        toasts: state.toasts.filter((t) => t.id !== action.toastId),
      }
  }
}

const listeners: Array<(state: State) => void> = []

let memoryState: State = { toasts: [] }

function dispatch(action: Action) {
  memoryState = reducer(memoryState, action)
  listeners.forEach((listener) => {
    listener(memoryState)
  })
}

type Toast = Omit<ToasterToast, "id">

function toast({ ...props }: Toast) {
  const id = genId()

  const update = (props: ToasterToast) =>
    dispatch({
      type: "UPDATE_TOAST",
      toast: { ...props, id },
    })
  const dismiss = () => dispatch({ type: "DISMISS_TOAST", toastId: id })

  dispatch({
    type: "ADD_TOAST",
    toast: {
      ...props,
      id,
      open: true,
      onOpenChange: (open) => {
        if (!open) dismiss()
      },
    },
  })

  return {
    id: id,
    dismiss,
    update,
  }
}

function useToast() {
  const [state, setState] = React.useState<State>(memoryState)

  React.useEffect(() => {
    listeners.push(setState)
    return () => {
      const index = listeners.indexOf(setState)
      if (index > -1) {
        listeners.splice(index, 1)
      }
    }
  }, [state])

  return {
    ...state,
    toast,
    dismiss: (toastId?: string) => dispatch({ type: "DISMISS_TOAST", toastId }),
  }
}

export { useToast, toast }
```

## `src/index.css`

```css
@import "tailwindcss";
@import "tw-animate-css";
@plugin "@tailwindcss/typography";

@custom-variant dark (&:is(.dark *));

@theme inline {
  --color-background: hsl(var(--background));
  --color-foreground: hsl(var(--foreground));
  --color-border: hsl(var(--border));
  --color-input: hsl(var(--input));
  --color-ring: hsl(var(--ring));

  --color-card: hsl(var(--card));
  --color-card-foreground: hsl(var(--card-foreground));
  --color-card-border: hsl(var(--card-border));

  --color-popover: hsl(var(--popover));
  --color-popover-foreground: hsl(var(--popover-foreground));
  --color-popover-border: hsl(var(--popover-border));

  --color-primary: hsl(var(--primary));
  --color-primary-foreground: hsl(var(--primary-foreground));

  --color-secondary: hsl(var(--secondary));
  --color-secondary-foreground: hsl(var(--secondary-foreground));

  --color-muted: hsl(var(--muted));
  --color-muted-foreground: hsl(var(--muted-foreground));

  --color-accent: hsl(var(--accent));
  --color-accent-foreground: hsl(var(--accent-foreground));

  --color-destructive: hsl(var(--destructive));
  --color-destructive-foreground: hsl(var(--destructive-foreground));

  --font-sans: var(--app-font-sans);
  --font-serif: var(--app-font-serif);
  --font-mono: var(--app-font-mono);

  --radius-sm: calc(var(--radius) - 4px);
  --radius-md: calc(var(--radius) - 2px);
  --radius-lg: var(--radius);
  --radius-xl: calc(var(--radius) + 4px);
}

:root {
  /* Warm cream light theme */
  --background: 45 30% 98%;
  --foreground: 232 47% 15%;
  
  --border: 45 20% 85%;
  --input: 45 20% 85%;
  --ring: 47 91% 45%;
  
  --card: 0 0% 100%;
  --card-foreground: 232 47% 15%;
  --card-border: 45 20% 85%;

  --popover: 0 0% 100%;
  --popover-foreground: 232 47% 15%;
  --popover-border: 45 20% 85%;

  /* Darker gold for contrast in light mode; dark navy text on gold meets AA */
  --primary: 42 95% 38%;
  --primary-foreground: 232 47% 12%;

  --secondary: 45 20% 95%;
  --secondary-foreground: 232 47% 15%;

  --muted: 45 20% 92%;
  --muted-foreground: 232 24% 34%;

  --accent: 45 20% 92%;
  --accent-foreground: 232 47% 15%;

  --destructive: 0 84% 60%;
  --destructive-foreground: 0 0% 100%;

  --app-font-sans: 'Inter', sans-serif;
  --app-font-serif: Georgia, serif;
  --app-font-mono: Menlo, monospace;
  --radius: 0.75rem;
}

.dark {
  /* Matte black rubber base */
  --background: 240 6% 4%;
  --foreground: 0 0% 100%;
  
  --border: 240 5% 16%;
  --input: 240 5% 16%;
  --ring: 47 91% 53%;
  
  /* Lifted charcoal for cards — polished panel on the rubber surface */
  --card: 240 5% 9%;
  --card-foreground: 0 0% 100%;
  --card-border: 240 5% 17%;

  --popover: 240 5% 9%;
  --popover-foreground: 0 0% 100%;
  --popover-border: 240 5% 17%;

  /* Gold accents (#F5C518) */
  --primary: 47 91% 53%;
  --primary-foreground: 240 6% 4%;

  --secondary: 240 5% 14%;
  --secondary-foreground: 0 0% 100%;

  --muted: 240 5% 14%;
  --muted-foreground: 240 6% 76%;

  --accent: 240 5% 14%;
  --accent-foreground: 0 0% 100%;

  --destructive: 0 62.8% 30.6%;
  --destructive-foreground: 0 0% 100%;
}

@layer base {
  * {
    @apply border-border;
  }

  body {
    @apply font-sans antialiased bg-background text-foreground transition-colors duration-500;
  }

  /* Clearly visible keyboard focus on every interactive element,
     including glass-panel buttons where a 1px ring gets lost. */
  a:focus-visible,
  button:focus-visible,
  [tabindex]:focus-visible,
  input:focus-visible,
  select:focus-visible,
  textarea:focus-visible,
  iframe:focus-visible,
  video:focus-visible {
    outline: 3px solid hsl(var(--ring));
    outline-offset: 3px;
    border-radius: 4px;
  }
}

/* Skip link — hidden until focused */
.skip-link {
  position: absolute;
  left: 1rem;
  top: -100px;
  z-index: 100;
  padding: 0.75rem 1.25rem;
  border-radius: 0.75rem;
  background: hsl(var(--primary));
  color: hsl(var(--primary-foreground));
  font-weight: 600;
  transition: top 0.2s ease;
}
.skip-link:focus-visible {
  top: 1rem;
}

/* Glassmorphism utilities */
.glass-panel {
  @apply bg-background/60 backdrop-blur-xl border border-border/50 shadow-xl;
  box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.05);
}
.dark .glass-panel {
  /* Glass over rubber: darker fill, crisp top-edge highlight like a polished pane */
  background-color: rgba(255, 255, 255, 0.03);
  border-color: rgba(255, 255, 255, 0.08);
  box-shadow:
    inset 0 1px 0 0 rgba(255, 255, 255, 0.07),
    0 12px 40px 0 rgba(0, 0, 0, 0.55);
}

.glass-panel-heavy {
  @apply bg-card/70 backdrop-blur-2xl border border-border shadow-2xl;
  box-shadow: 0 12px 48px 0 rgba(0, 0, 0, 0.08);
}
.dark .glass-panel-heavy {
  background-color: rgba(255, 255, 255, 0.04);
  border-color: rgba(255, 255, 255, 0.09);
  box-shadow:
    inset 0 1px 0 0 rgba(255, 255, 255, 0.08),
    0 20px 60px 0 rgba(0, 0, 0, 0.65);
}

.hive-gradient-text {
  background: linear-gradient(135deg, #F5C518, #D4A017, #C9860A);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.dark .hive-gradient-text {
  background: linear-gradient(135deg, #F5C518, #D4A017, #C9860A);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.hive-gradient-bg {
  background: linear-gradient(135deg, #F5C518, #D4A017);
}

/* Smooth native scrolling (anchor jumps handled in JS respect this too) */
html {
  scroll-behavior: smooth;
}
@media (prefers-reduced-motion: reduce) {
  html {
    scroll-behavior: auto;
  }
}
```

## `src/lib/utils.ts`

```ts
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

## `src/main.tsx`

```tsx
import { createRoot } from "react-dom/client";
import "@fontsource/inter/300.css";
import "@fontsource/inter/400.css";
import "@fontsource/inter/500.css";
import "@fontsource/inter/600.css";
import "@fontsource/inter/700.css";
import App from "./App";
import "./index.css";

createRoot(document.getElementById("root")!).render(<App />);
```

## `src/pages/book.tsx`

```tsx
import { useCallback, useEffect, useState } from "react";
import { Link } from "wouter";
import {
  ArrowLeft,
  BadgeCheck,
  CalendarCheck,
  CalendarSearch,
  Loader2,
  Phone,
  RefreshCw,
  Stethoscope,
  Video,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const API_BASE = `${import.meta.env.BASE_URL}api`;

interface HivePractitioner {
  id: string;
  fullName: string;
  role: string;
  workplace: string;
  verified: boolean;
  videoConsultations: boolean;
  audioConsultations: boolean;
  openSlots: number;
}

interface HiveSlot {
  id: string;
  day: string;
  start: string;
  end: string;
  kind: "video" | "audio";
  taken: boolean;
}

interface BookingConfirmation {
  id: string;
  kind: "video" | "audio";
  when: string;
  practitioner: { fullName: string; role: string };
}

async function parseOrThrow<T>(res: Response): Promise<T> {
  const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  if (!res.ok) {
    const message =
      (typeof data.message === "string" && data.message) ||
      (typeof data.error === "string" && data.error) ||
      `Request failed (${res.status})`;
    throw new Error(message);
  }
  return data as T;
}

export default function BookPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [practitioners, setPractitioners] = useState<HivePractitioner[]>([]);
  const [selected, setSelected] = useState<HivePractitioner | null>(null);
  const [slots, setSlots] = useState<HiveSlot[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [slotId, setSlotId] = useState<string | null>(null);
  const [patientName, setPatientName] = useState("");
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);
  const [confirmation, setConfirmation] = useState<BookingConfirmation | null>(null);

  const loadPractitioners = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/hive/practitioners`);
      const data = await parseOrThrow<{ practitioners: HivePractitioner[] }>(res);
      setPractitioners(data.practitioners ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not reach the HIVE booking service.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPractitioners();
  }, [loadPractitioners]);

  const openPractitioner = async (p: HivePractitioner) => {
    setSelected(p);
    setSlotId(null);
    setSlots([]);
    setError(null);
    setSlotsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/hive/practitioners/${p.id}/slots`);
      const data = await parseOrThrow<{ slots: HiveSlot[] }>(res);
      setSlots(data.slots ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load availability.");
    } finally {
      setSlotsLoading(false);
    }
  };

  const confirm = async () => {
    if (!selected || !slotId || !patientName.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/hive/practitioners/${selected.id}/book`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slotId,
          patientName: patientName.trim(),
          ...(reason.trim() ? { reason: reason.trim() } : {}),
        }),
      });
      const data = await parseOrThrow<{ booking: BookingConfirmation }>(res);
      setConfirmation(data.booking);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Booking failed — please try again.");
      // Refresh slots in case the slot was just taken.
      try {
        const res = await fetch(`${API_BASE}/hive/practitioners/${selected.id}/slots`);
        const data = await parseOrThrow<{ slots: HiveSlot[] }>(res);
        setSlots(data.slots ?? []);
        setSlotId(null);
      } catch {
        /* keep original error */
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link href="/" className="text-muted-foreground hover:text-primary transition-colors" aria-label="Back to home">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="font-semibold text-lg leading-tight">Book a HIVE Consultation</h1>
            <p className="text-xs text-muted-foreground">
              Browse practitioners with open video &amp; audio slots — pilot programme
            </p>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        {error && (
          <div className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm" role="alert">
            {error}
          </div>
        )}

        {confirmation ? (
          <div className="rounded-2xl border border-border bg-card p-8 text-center space-y-4">
            <CalendarCheck className="h-12 w-12 text-green-500 mx-auto" />
            <h2 className="text-xl font-semibold">Booking confirmed</h2>
            <p className="text-sm text-muted-foreground">
              Your {confirmation.kind} consultation with {confirmation.practitioner.fullName} (
              {confirmation.practitioner.role}) is booked for <strong>{confirmation.when}</strong>. The
              practitioner can now see your booking in their HIVE diary and will contact you if anything
              needs to change.
            </p>
            <div className="flex justify-center gap-3 pt-2">
              <Button
                variant="outline"
                onClick={() => {
                  setConfirmation(null);
                  setSelected(null);
                  setSlotId(null);
                  setReason("");
                  loadPractitioners();
                }}
              >
                Book another
              </Button>
              <Button asChild>
                <Link href="/">Back to home</Link>
              </Button>
            </div>
          </div>
        ) : !selected ? (
          <>
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold tracking-wide text-muted-foreground uppercase">
                Practitioners accepting HIVE bookings
              </h2>
              <Button variant="ghost" size="sm" onClick={loadPractitioners} className="gap-1.5">
                <RefreshCw className="h-3.5 w-3.5" /> Refresh
              </Button>
            </div>
            {loading ? (
              <div className="py-16 flex justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : practitioners.length === 0 ? (
              <div className="rounded-2xl border border-border bg-card p-10 text-center space-y-3">
                <CalendarSearch className="h-10 w-10 text-muted-foreground mx-auto" />
                <p className="text-sm text-muted-foreground max-w-md mx-auto">
                  No practitioners have published open slots right now. Practitioners enable automated HIVE
                  booking and publish availability from their practitioner portal — please check back soon.
                </p>
              </div>
            ) : (
              <ul className="space-y-3">
                {practitioners.map((p) => (
                  <li key={p.id}>
                    <button
                      onClick={() => openPractitioner(p)}
                      className="w-full text-left rounded-2xl border border-border bg-card p-5 hover:border-primary/60 transition-colors flex items-center gap-4"
                    >
                      <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                        <Stethoscope className="h-6 w-6 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold">{p.fullName}</span>
                          {p.verified && <BadgeCheck className="h-4 w-4 text-green-500" aria-label="Verified" />}
                        </div>
                        <div className="text-sm text-muted-foreground truncate">
                          {p.role}
                          {p.workplace ? ` · ${p.workplace}` : ""}
                        </div>
                        <div className="text-xs text-green-500 font-medium mt-1">
                          {p.openSlots} open slot{p.openSlots === 1 ? "" : "s"}
                          {p.videoConsultations && p.audioConsultations
                            ? " · video & audio"
                            : p.videoConsultations
                              ? " · video"
                              : " · audio"}
                        </div>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </>
        ) : (
          <>
            <button
              onClick={() => setSelected(null)}
              className="text-sm text-muted-foreground hover:text-primary transition-colors flex items-center gap-1.5"
            >
              <ArrowLeft className="h-4 w-4" /> All practitioners
            </button>

            <div className="rounded-2xl border border-border bg-card p-5 flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <Stethoscope className="h-6 w-6 text-primary" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-semibold">{selected.fullName}</span>
                  {selected.verified && <BadgeCheck className="h-4 w-4 text-green-500" />}
                </div>
                <div className="text-sm text-muted-foreground">
                  {selected.role}
                  {selected.workplace ? ` · ${selected.workplace}` : ""}
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold tracking-wide text-muted-foreground uppercase mb-3">
                1 · Pick an open slot
              </h3>
              {slotsLoading ? (
                <div className="py-8 flex justify-center">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : slots.length === 0 ? (
                <p className="text-sm text-muted-foreground">This practitioner has no published slots.</p>
              ) : (
                <div className="grid gap-2 sm:grid-cols-2">
                  {slots.map((s) => (
                    <button
                      key={s.id}
                      disabled={s.taken}
                      onClick={() => setSlotId(s.id)}
                      className={`rounded-xl border px-4 py-3 text-left flex items-center gap-3 transition-colors ${
                        s.taken
                          ? "opacity-40 cursor-not-allowed border-border bg-card"
                          : slotId === s.id
                            ? "border-primary bg-primary/10"
                            : "border-border bg-card hover:border-primary/60"
                      }`}
                    >
                      {s.kind === "audio" ? (
                        <Phone className="h-4 w-4 text-amber-500 shrink-0" />
                      ) : (
                        <Video className="h-4 w-4 text-green-500 shrink-0" />
                      )}
                      <span className="text-sm font-medium flex-1">
                        {s.day} · {s.start}–{s.end}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {s.taken ? "Booked" : s.kind === "audio" ? "Audio" : "Video"}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div>
              <h3 className="text-sm font-semibold tracking-wide text-muted-foreground uppercase mb-3">
                2 · Your name
              </h3>
              <Input
                value={patientName}
                onChange={(e) => setPatientName(e.target.value)}
                placeholder="Full name for the practitioner's diary"
                aria-label="Your full name"
              />
            </div>

            <div>
              <h3 className="text-sm font-semibold tracking-wide text-muted-foreground uppercase mb-3">
                3 · Reason (optional)
              </h3>
              <Input
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g. Knee pain follow-up…"
                aria-label="Reason for consultation"
              />
            </div>

            <Button
              className="w-full gap-2"
              size="lg"
              disabled={!slotId || !patientName.trim() || saving}
              onClick={confirm}
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CalendarCheck className="h-4 w-4" />}
              Confirm booking
            </Button>

            <p className="text-xs text-muted-foreground text-center leading-relaxed">
              Pilot programme: your name and reason are sent to this practitioner's HIVE diary so they can
              prepare for the consultation. For the full experience — reminders, handover packs and the
              virtual waiting room — use the HIVE Companion app.
            </p>
          </>
        )}
      </main>
    </div>
  );
}
```

## `src/pages/home.tsx`

```tsx
import { useEffect, useRef, useState } from "react";
import { Link } from "wouter";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { HiveLogo } from "@/components/HiveLogo";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { CircuitHexBackground } from "@/components/CircuitHexBackground";
import { TrustStrip } from "@/components/TrustStrip";
import { VideoEmbed } from "@/components/VideoEmbed";
import { VideoShowcase } from "@/components/VideoShowcase";
import { ExchangeSection } from "@/components/ExchangeSection";
import { PortalAdvertsSection } from "@/components/PortalAdvertsSection";
import { 
  ArrowRight, ShieldCheck, FileText, Smartphone, 
  Stethoscope, Mail, Activity,
  AlertCircle, Heart, Shield,
  MapPin, Pill, Video, Users,
  Menu, X, Building2, ClipboardList, Sparkles, Clock, Euro
} from "lucide-react";

// Shared, deliberate easing — a soft "settle" curve used across the whole page
const SMOOTH_EASE = [0.22, 1, 0.36, 1] as const;

const fadeInUp = {
  hidden: { opacity: 0, y: 28 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: SMOOTH_EASE } }
} as const;

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.12
    }
  }
};

export default function Home() {
  const [menuOpen, setMenuOpen] = useState(false);
  const prefersReducedMotion = useReducedMotion();

  // Gentle parallax: hero content drifts up slightly slower than the scroll
  const heroRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });
  const heroY = useTransform(scrollYProgress, [0, 1], [0, prefersReducedMotion ? 0 : 90]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.85], [1, prefersReducedMotion ? 1 : 0.25]);

  // Smooth scroll for anchor links
  useEffect(() => {
    const handleAnchorClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const anchor = target.closest('a');
      if (anchor && anchor.hash && anchor.hash.startsWith('#')) {
        e.preventDefault();
        const element = document.getElementById(anchor.hash.slice(1));
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
      }
    };
    document.addEventListener('click', handleAnchorClick);

    // Honour a #hash present on initial load — sections only exist after React mounts,
    // so the browser's native fragment scroll silently fails on this SPA.
    // getElementById (not querySelector) so arbitrary fragments can never throw.
    if (window.location.hash) {
      const element = document.getElementById(window.location.hash.slice(1));
      if (element) {
        requestAnimationFrame(() => element.scrollIntoView());
      }
    }

    return () => document.removeEventListener('click', handleAnchorClick);
  }, []);

  return (
    <div className="flex flex-col min-h-[100dvh] bg-transparent text-foreground overflow-x-hidden font-sans">
      <a href="#main-content" className="skip-link">Skip to main content</a>
      <CircuitHexBackground />
      {/* Navigation */}
      <motion.header 
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.7, ease: SMOOTH_EASE }}
        className="fixed top-0 left-0 right-0 z-50 bg-background/70 backdrop-blur-xl border-b border-border/50 supports-[backdrop-filter]:bg-background/50"
      >
        <div className="container mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <HiveLogo size={32} />
            <span className="font-semibold text-lg tracking-tight text-foreground">HEALTH HIVE</span>
          </div>
          <nav aria-label="Main navigation" className="hidden md:flex items-center gap-8 text-sm font-medium text-muted-foreground">
            <a href="#ecosystem" className="hover:text-primary transition-colors">Ecosystem</a>
            <a href="#companion" className="hover:text-primary transition-colors">HIVE Companion</a>
            <a href="#exchange" className="hover:text-primary transition-colors">Data Exchange</a>
            <a href="#surgical-assistant" className="hover:text-primary transition-colors">Surgical Assistant</a>
            <a href="#enterprise" className="hover:text-primary transition-colors">For Hospitals &amp; GPs</a>
            <a href="#portals" className="hover:text-primary transition-colors">Portals</a>
            <Link href="/book" className="hover:text-primary transition-colors">Book a Consultation</Link>
          </nav>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <Button asChild variant="outline" className="hidden sm:flex border-primary/30 hover:border-primary text-primary hover:bg-primary/10 transition-all duration-300 glass-panel">
              <Link href="/portal/practitioner">
                Clinician Sign In
              </Link>
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="md:hidden rounded-full bg-background/50 backdrop-blur border-border/50 text-foreground"
              aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"}
              aria-expanded={menuOpen}
              aria-controls="mobile-menu"
              onClick={() => setMenuOpen((open) => !open)}
            >
              {menuOpen ? <X aria-hidden="true" className="h-5 w-5" /> : <Menu aria-hidden="true" className="h-5 w-5" />}
            </Button>
          </div>
        </div>
        {menuOpen && (
          <nav
            id="mobile-menu"
            aria-label="Mobile navigation"
            className="md:hidden border-t border-border/50 bg-background/95 backdrop-blur-xl"
          >
            <div className="container mx-auto px-6 py-4 flex flex-col gap-1 text-base font-medium">
              <a href="#ecosystem" onClick={() => setMenuOpen(false)} className="py-3 px-2 rounded-lg text-foreground hover:text-primary hover:bg-muted/50 transition-colors">Ecosystem</a>
              <a href="#companion" onClick={() => setMenuOpen(false)} className="py-3 px-2 rounded-lg text-foreground hover:text-primary hover:bg-muted/50 transition-colors">HIVE Companion</a>
              <a href="#exchange" onClick={() => setMenuOpen(false)} className="py-3 px-2 rounded-lg text-foreground hover:text-primary hover:bg-muted/50 transition-colors">Data Exchange</a>
              <a href="#surgical-assistant" onClick={() => setMenuOpen(false)} className="py-3 px-2 rounded-lg text-foreground hover:text-primary hover:bg-muted/50 transition-colors">Surgical Assistant</a>
              <a href="#enterprise" onClick={() => setMenuOpen(false)} className="py-3 px-2 rounded-lg text-foreground hover:text-primary hover:bg-muted/50 transition-colors">For Hospitals &amp; GPs</a>
              <a href="#portals" onClick={() => setMenuOpen(false)} className="py-3 px-2 rounded-lg text-foreground hover:text-primary hover:bg-muted/50 transition-colors">Portals</a>
              <Link href="/book" onClick={() => setMenuOpen(false)} className="py-3 px-2 rounded-lg text-foreground hover:text-primary hover:bg-muted/50 transition-colors">
                Book a Consultation
              </Link>
              <Link href="/portal/practitioner" onClick={() => setMenuOpen(false)} className="py-3 px-2 rounded-lg text-primary hover:bg-muted/50 transition-colors">
                GP &amp; HIVE HUB Sign In
              </Link>
              <Link href="/portal/supportive" onClick={() => setMenuOpen(false)} className="py-3 px-2 rounded-lg text-primary hover:bg-muted/50 transition-colors">
                Supportive Care Sign In
              </Link>
              <Link href="/portal/responder" onClick={() => setMenuOpen(false)} className="py-3 px-2 rounded-lg text-primary hover:bg-muted/50 transition-colors">
                First Responders Sign In
              </Link>
            </div>
          </nav>
        )}
      </motion.header>
      <main id="main-content" className="flex-grow pt-20">
        
        {/* Section 1: Hero */}
        <section ref={heroRef} className="relative pt-24 pb-32 lg:pt-40 lg:pb-40 flex items-center min-h-[90vh]">
          <motion.div style={{ y: heroY, opacity: heroOpacity }} className="container mx-auto px-6 relative z-10 text-center max-w-5xl">
            <motion.div 
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.7, ease: SMOOTH_EASE }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-panel text-primary text-xs font-bold tracking-[0.2em] uppercase mb-8 shadow-[0_0_15px_rgba(245,197,24,0.1)]"
            >
              <HiveLogo size={16} />
              HEALTH HIVE ECOSYSTEM
            </motion.div>
            
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, delay: 0.1, ease: SMOOTH_EASE }}
              className="text-[clamp(2.5rem,7vw,6.5rem)] font-bold tracking-tight mb-8 leading-[1.05] text-balance text-foreground drop-shadow-sm"
            >
              Gold Standard Privacy. <br />
              <span className="hive-gradient-text drop-shadow-sm">A focused, efficient digital solution.</span>
            </motion.h1>
            
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, delay: 0.22, ease: SMOOTH_EASE }}
              className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto mb-12 leading-relaxed font-light glass-panel px-6 py-4 rounded-3xl"
            >
              An intricate health documentation ecosystem. Long specialist waiting lists &amp; health systems under pressure can benefit from this digital health solution platform. HIVE Health is smart, safe, efficient and a cost effective augmentation available to all parties.
            </motion.p>
            
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, delay: 0.34, ease: SMOOTH_EASE }}
              className="flex flex-col sm:flex-row items-center justify-center gap-5"
            >
              <Button asChild size="lg" className="w-full sm:w-auto bg-primary text-primary-foreground hover:bg-primary/90 h-14 px-8 text-base shadow-[0_0_20px_rgba(245,197,24,0.3)] hover:shadow-[0_0_30px_rgba(245,197,24,0.5)] transition-all duration-300">
                <a href="#companion">Explore HIVE Companion</a>
              </Button>
            </motion.div>
          </motion.div>
        </section>

        <TrustStrip />

        {/* Section 2: Ecosystem Overview */}
        <section id="ecosystem" className="pt-24 pb-10 relative">
          <div className="container mx-auto px-6">
            <motion.div 
              variants={staggerContainer}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              className="grid md:grid-cols-2 gap-16 items-center glass-panel-heavy p-8 md:p-16 rounded-[3rem]"
            >
              <motion.div variants={fadeInUp}>
                <div className="text-primary font-bold tracking-widest uppercase mb-4 text-[14px]">One Unified HIVE HUB</div>
                <h2 className="text-[clamp(1.9rem,3.6vw,3rem)] font-bold mb-6 leading-tight text-balance text-foreground">Clinicians receive streamlined and comprehensive data.</h2>
                <div className="mb-6">
                  <VideoEmbed
                    src="/hub-video/?embed=1"
                    title="HIVE Hub video"
                    audioSrc={`${import.meta.env.BASE_URL}audio/hub-ambient.mp3`}
                    frameClassName="rounded-2xl glass-panel-heavy"
                  />
                </div>
                <p className="text-muted-foreground text-lg mb-6 leading-relaxed">
                  Patients can express their symptoms to the HIVE Companion, which can pass information to the GP and help administrative streamlining of acute and chronic joint, neck and back pain. Far less paperwork for primary healthcare professionals in the network, with automated scheduling for video consultations and clinical appointments.
                </p>
                <p className="text-muted-foreground text-lg mb-6 leading-relaxed">
                  With the patient's permission, hospital specialists and first responders can access critical medical history data and current live digital prescription information when it's required.
                </p>
                <div className="grid grid-cols-2 gap-8 mt-12">
                  <div className="space-y-4">
                    <div className="w-14 h-14 rounded-2xl glass-panel flex items-center justify-center text-primary shadow-inner">
                      <ShieldCheck className="h-7 w-7" />
                    </div>
                    <h3 className="font-semibold text-lg text-foreground">Privacy First</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">EU GDPR compliant with advanced encryption features — no central servers, no tracking.</p>
                  </div>
                  <div className="space-y-4">
                    <div className="w-14 h-14 rounded-2xl glass-panel flex items-center justify-center text-primary shadow-inner">
                      <Stethoscope className="h-7 w-7" />
                    </div>
                    <h3 className="font-semibold text-lg text-foreground">Clinically Safe</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">Built to simplify input of documentation and speed up long paper processes — an efficient, cost effective solution.</p>
                  </div>
                </div>
              </motion.div>
              
              <motion.div variants={fadeInUp} className="relative h-[600px] rounded-[2.5rem] glass-panel overflow-hidden flex items-center justify-center">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent"></div>
                <div className="relative grid grid-cols-1 md:grid-cols-2 gap-6 p-8 w-full max-w-lg">
                  
                  {/* Abstract App Representation 1 */}
                  <div className="glass-panel-heavy p-6 rounded-2xl transform -rotate-3 hover:rotate-0 transition-transform duration-500 hover:border-primary/50 group">
                    <div className="flex items-center gap-3 mb-6">
                      <Smartphone className="h-6 w-6 text-primary" />
                      <span className="text-sm font-semibold tracking-wide text-foreground">HIVE Companion</span>
                    </div>
                    <div className="space-y-3">
                      <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                        <div className="h-full w-3/4 bg-primary/60 group-hover:bg-primary transition-colors"></div>
                      </div>
                      <div className="h-2 w-5/6 bg-muted rounded-full"></div>
                      <div className="h-2 w-4/6 bg-muted rounded-full"></div>
                    </div>
                  </div>
                  
                  {/* Abstract App Representation 2 */}
                  <div className="glass-panel-heavy p-6 rounded-2xl transform rotate-3 hover:rotate-0 transition-transform duration-500 hover:border-primary/50 mt-8 md:mt-16 group">
                    <div className="flex items-center gap-3 mb-6">
                      <Activity className="h-6 w-6 text-primary" />
                      <span className="text-sm font-semibold tracking-wide text-foreground">Surgical Assistant</span>
                    </div>
                    <div className="space-y-3">
                      <div className="h-2 w-full bg-muted rounded-full"></div>
                      <div className="h-2 w-5/6 bg-muted rounded-full overflow-hidden">
                        <div className="h-full w-1/2 bg-primary/60 group-hover:bg-primary transition-colors delay-100"></div>
                      </div>
                      <div className="h-2 w-full bg-muted rounded-full"></div>
                    </div>
                  </div>

                </div>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* Section 3: HIVE Companion Hero */}
        <section id="companion" className="pt-10 pb-24 relative overflow-hidden">
          <div className="container mx-auto px-6">
            <motion.div 
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeInUp}
              className="flex flex-col items-center text-center mb-16 max-w-3xl mx-auto"
            >
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md glass-panel text-foreground text-xs font-bold tracking-widest uppercase mb-6">
                <Smartphone className="h-3 w-3 text-primary" />
                Mobile App
              </div>
              <h2 className="text-[clamp(2.2rem,4.5vw,3.75rem)] font-bold mb-6 text-foreground text-balance">HIVE Companion</h2>
              <p className="text-xl md:text-2xl text-muted-foreground font-light glass-panel px-6 py-3 rounded-2xl inline-block">
                A steady hand on your shoulder. Your health story, already organised.
              </p>
            </motion.div>

            {/* Companion Promo Video */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.9, ease: SMOOTH_EASE }}
              className="relative max-w-5xl mx-auto mb-16"
            >
              <div className="relative aspect-video overflow-hidden rounded-[2rem] glass-panel-heavy border-primary/20 shadow-[0_20px_60px_rgba(0,0,0,0.25)] bg-[#07070f]">
                <video
                  className="h-full w-full object-cover"
                  src={`${import.meta.env.BASE_URL}videos/hive-companion-promo.mp4`}
                  poster={`${import.meta.env.BASE_URL}videos/hive-companion-promo-poster.jpg`}
                  controls
                  preload="metadata"
                  playsInline
                  aria-label="HIVE Companion promo video"
                >
                  Your browser does not support the video tag. You can{" "}
                  <a href={`${import.meta.env.BASE_URL}videos/hive-companion-promo.mp4`}>
                    download the promo video
                  </a>{" "}
                  instead.
                </video>
              </div>
            </motion.div>

            {/* Targeted Marketing Split */}
            <div className="grid lg:grid-cols-2 gap-8 mb-16">
              <motion.div 
                initial={{ opacity: 0, x: -24 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ duration: 0.9, ease: SMOOTH_EASE }}
                className="glass-panel-heavy rounded-[2rem] overflow-hidden flex flex-col group hover:border-primary/30 transition-colors"
              >
                <div className="h-64 sm:h-80 relative overflow-hidden">
                  <img 
                    src={`${import.meta.env.BASE_URL}images/older-adults-phone.webp`} 
                    alt="Confident older adult using a smartphone" 
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-background/90 to-transparent"></div>
                  <div className="absolute bottom-6 left-6 right-6">
                    <h3 className="text-2xl font-bold text-foreground mb-2 flex items-center gap-2">
                      <Heart className="h-6 w-6 text-primary" /> Walk into any appointment ready
                    </h3>
                  </div>
                </div>
                <div className="p-8 pt-2 flex-grow flex flex-col justify-center">
                  <p className="text-lg text-muted-foreground leading-relaxed">
                    Designed with clarity and respect. Your health record and prescriptions are kept safe and available digitally, with standardised questionnaires before a GP visit and an emergency health card so the information is there when it matters most.
                  </p>
                </div>
              </motion.div>

              <motion.div 
                initial={{ opacity: 0, x: 24 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ duration: 0.9, delay: 0.12, ease: SMOOTH_EASE }}
                className="glass-panel-heavy rounded-[2rem] overflow-hidden flex flex-col group hover:border-primary/30 transition-colors"
              >
                <div className="h-64 sm:h-80 relative overflow-hidden">
                  <img 
                    src={`${import.meta.env.BASE_URL}images/care-home.webp`} 
                    alt="Nurse interacting warmly with an older resident in a care facility" 
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-background/90 to-transparent"></div>
                  <div className="absolute bottom-6 left-6 right-6">
                    <h3 className="text-2xl font-bold text-foreground mb-2 flex items-center gap-2">
                      <Users className="h-6 w-6 text-primary" /> Connected care for your family
                    </h3>
                  </div>
                </div>
                <div className="p-8 pt-2 flex-grow flex flex-col justify-center">
                  <p className="text-lg text-muted-foreground leading-relaxed">
                    Our Geriatric Pack provides close monitoring and smart device connectivity, keeping a loved one's day-to-day health records together. It empowers families to stay closely connected without losing independence or privacy.
                  </p>
                </div>
              </motion.div>
            </div>

            {/* Feature Grid */}
            <motion.div 
              variants={staggerContainer}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8"
            >
              {[
                {
                  icon: <FileText className="h-6 w-6 text-primary" />,
                  title: "Hears your chronic pains",
                  desc: "Build an objective record with standardised questionnaires (Oxford Hip & Knee, ODI) for osteoarthritis of the knee, hip and lower back."
                },
                {
                  icon: <Pill className="h-6 w-6 text-primary" />,
                  title: "Records & prescriptions",
                  desc: "Your health record and prescriptions kept safe and available digitally — one comprehensive, up-to-date list on your own device."
                },
                {
                  icon: <Video className="h-6 w-6 text-primary" />,
                  title: "Seamless booking & telehealth",
                  desc: "Seamless booking with partner healthcare providers and pharmacists, plus video calls with your healthcare professional."
                },
                {
                  icon: <AlertCircle className="h-6 w-6 text-primary" />,
                  title: "Emergency health card",
                  desc: "When a paramedic or doctor needs your story, generate an emergency card so the information is there when it matters."
                },
                {
                  icon: <Activity className="h-6 w-6 text-primary" />,
                  title: "Geriatric Pack monitoring",
                  desc: "Close monitoring and smart device connectivity keep a loved one's day-to-day health picture together for the whole family."
                },
                {
                  icon: <ShieldCheck className="h-6 w-6 text-primary" />,
                  title: "GDPR & HSE standards",
                  desc: "GDPR compliant and aligned with HSE safety standards. Your data stays entirely private and secure on your device."
                }
              ].map((feature, idx) => (
                <motion.div key={idx} variants={fadeInUp} className="glass-panel p-8 rounded-3xl hover:border-primary/40 transition-all duration-300 group">
                  <div className="w-12 h-12 rounded-xl bg-background/50 border border-border flex items-center justify-center mb-6 group-hover:scale-110 group-hover:border-primary/50 transition-all duration-300">
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-bold mb-4 text-foreground">{feature.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    {feature.desc}
                  </p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* Section 4: Privacy Focus */}
        <section className="py-20 lg:py-32 relative overflow-hidden">
          <div className="container mx-auto px-6 relative z-10">
            <motion.div 
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeInUp}
              className="max-w-5xl mx-auto glass-panel-heavy rounded-[3rem] p-6 sm:p-12 md:p-20 text-center border-primary/20 relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/10 blur-[100px] pointer-events-none rounded-full" />
              <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-500/10 blur-[100px] pointer-events-none rounded-full" />

              <div className="relative z-10">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl glass-panel text-foreground mb-8 shadow-2xl">
                  <Shield className="h-10 w-10 text-primary" />
                </div>
                <h2 className="text-[clamp(2.2rem,4.5vw,3.75rem)] font-bold mb-8 tracking-tight text-foreground text-balance">Gold Standards in documentation and advanced privacy features</h2>
                <p className="text-xl md:text-2xl font-light mb-12 text-foreground/80 leading-relaxed max-w-3xl mx-auto">
                  ALL personal data stays on your device — nothing is uploaded to a server. No tracking, no ads. You can "Delete all my data" at any time.
                </p>
                
                <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-6">
                  <Button asChild size="lg" className="w-full sm:w-auto h-auto min-h-14 whitespace-normal px-6 sm:px-8 font-semibold">
                    <a href="/api/app/download/android" data-testid="button-download-android">
                      Download for Android (APK)
                    </a>
                  </Button>
                  <Button variant="secondary" size="lg" disabled aria-disabled="true" className="w-full sm:w-auto glass-panel h-auto min-h-14 whitespace-normal px-6 sm:px-8 text-foreground">
                    iPhone &amp; iPad — Soon to Follow
                  </Button>
                </div>

                <p className="text-sm text-muted-foreground mb-16 max-w-xl mx-auto">
                  Android: after downloading, tap the file and allow installation when your phone asks. The iPhone &amp; iPad version is on its way via the App Store.
                </p>

                <div className="text-sm font-medium glass-panel p-6 rounded-2xl text-left inline-block max-w-2xl mx-auto border-primary/20">
                  <span className="text-primary font-bold uppercase tracking-wider text-xs block mb-2">Compliance Notice</span>
                  <span className="text-muted-foreground">HIVE Companion is a health record organiser. It is not a medical device, it does not diagnose or treat, and all personal data stays on your device.</span>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        <ExchangeSection />

        {/* Section 4.5: Video Showcase */}
        <section id="showcase" className="py-20 lg:py-28 relative">
          <div className="container mx-auto px-6">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeInUp}
              className="flex flex-col items-center text-center mb-12 max-w-3xl mx-auto"
            >
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md glass-panel text-foreground text-xs font-bold tracking-widest uppercase mb-6">
                <Video className="h-3 w-3 text-primary" />
                Watch
              </div>
              <h2 className="text-[clamp(2.2rem,4.5vw,3.75rem)] font-bold mb-4 text-foreground text-balance">See the HIVE in action</h2>
              <p className="text-lg md:text-xl text-muted-foreground font-light">
                A short film for patients and families. Select the video to expand and play.
              </p>
            </motion.div>
            <div className="max-w-2xl mx-auto">
              <VideoShowcase
                videos={[
                  {
                    id: "companion-promo",
                    title: "HIVE Companion",
                    tagline: "Your health story, already organised — for patients and families",
                    src: `${import.meta.env.BASE_URL}videos/hive-companion-promo.mp4`,
                    poster: `${import.meta.env.BASE_URL}videos/hive-companion-promo-poster.jpg`,
                    duration: "0:22",
                  },
                ]}
              />
            </div>
          </div>
        </section>

        {/* Section 5: HIVE Surgical Assistant */}
        <section id="surgical-assistant" className="py-24 lg:py-40 relative overflow-hidden">
          <div className="container mx-auto px-6 relative z-10">
            <div className="grid lg:grid-cols-2 gap-16 lg:gap-24 items-center glass-panel-heavy p-8 md:p-16 rounded-[3rem]">
              
              <motion.div 
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeInUp}
                className="order-2 lg:order-1 relative"
              >
                <div className="relative rounded-3xl overflow-hidden glass-panel flex flex-col group transition-transform duration-500 hover:scale-[1.06] hover:z-20 motion-reduce:transform-none">
                   {/* Browser chrome */}
                   <div className="h-12 bg-background/50 border-b border-border flex items-center px-4 gap-2">
                     <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
                     <div className="w-3 h-3 rounded-full bg-yellow-500/80"></div>
                     <div className="w-3 h-3 rounded-full bg-green-500/80"></div>
                     <div className="ml-4 h-6 w-1/2 bg-muted/50 rounded-md"></div>
                   </div>
                   <VideoEmbed
                     src="/surgical-video/?embed=1"
                     title="HIVE Hospital Surgical Assistant video"
                     audioSrc={`${import.meta.env.BASE_URL}audio/surgical-ambient.mp3`}
                     expandable={false}
                   />
                </div>
                
                {/* Decorative elements */}
                <div aria-hidden="true" className="absolute -bottom-6 -right-6 w-32 h-32 glass-panel rounded-2xl flex items-center justify-center -z-10">
                  <Activity className="h-10 w-10 text-muted-foreground/30" />
                </div>
              </motion.div>

              <motion.div 
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeInUp}
                className="order-1 lg:order-2"
              >
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md glass-panel text-foreground text-xs font-bold tracking-widest uppercase mb-6">
                  <Activity className="h-3 w-3 text-primary" />
                  Web App
                </div>
                <h2 className="text-[clamp(2.2rem,4.5vw,3.75rem)] font-bold mb-6 text-foreground leading-tight text-balance">HIVE Hospital Surgical Assistant</h2>
                <p className="text-xl text-muted-foreground mb-10 leading-relaxed font-light">
                  HIVE Hospital digitises the patient file into a member-accessed platform — organising patient flow and flagging safety risks with advanced algorithmic workflows, supported by robust evidence. Advanced AI risk oversight coming soon.
                </p>
                
                <ul className="space-y-6 mb-12">
                  <li className="flex items-start gap-4 p-4 rounded-2xl glass-panel border-transparent hover:border-primary/30 transition-colors">
                    <div className="mt-1 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 text-primary border border-primary/20">
                      <ArrowRight className="h-4 w-4" />
                    </div>
                    <div>
                      <h3 className="text-foreground font-semibold text-lg mb-1">Fast Documentation</h3>
                      <span className="text-muted-foreground">Documentation for GPs, physiotherapists and CNSs can all be efficiently executed on the application — photo recognition turns captured data into organised, structured records in seconds.</span>
                    </div>
                  </li>
                  <li className="flex items-start gap-4 p-4 rounded-2xl glass-panel border-transparent hover:border-primary/30 transition-colors">
                    <div className="mt-1 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 text-primary border border-primary/20">
                      <ArrowRight className="h-4 w-4" />
                    </div>
                    <div>
                      <h3 className="text-foreground font-semibold text-lg mb-1">Built for Clinical Teams</h3>
                      <span className="text-muted-foreground">Organise patient files and collaborate seamlessly with your clinical unit or team.</span>
                    </div>
                  </li>
                  <li className="flex items-start gap-4 p-4 rounded-2xl glass-panel border-transparent hover:border-primary/30 transition-colors">
                    <div className="mt-1 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 text-primary border border-primary/20">
                      <ArrowRight className="h-4 w-4" />
                    </div>
                    <div>
                      <h3 className="text-foreground font-semibold text-lg mb-1">Encrypted by Design</h3>
                      <span className="text-muted-foreground">Encrypted data communication while patient data stays on the device — with user endpoints for server-based AI.</span>
                    </div>
                  </li>
                </ul>

                <div className="p-5 glass-panel rounded-xl mb-10 shadow-inner border-primary/20">
                  <p className="text-sm font-medium text-muted-foreground flex items-center gap-3">
                    <AlertCircle className="h-5 w-5 text-primary flex-shrink-0" />
                    <span><strong className="text-foreground">AI Decision Support</strong> — Verify All Output Clinically.</span>
                  </p>
                </div>

                <Button asChild size="lg" className="w-full sm:w-auto bg-primary text-primary-foreground hover:bg-primary/90 h-auto min-h-14 whitespace-normal px-6 sm:px-8 text-base shadow-[0_0_20px_rgba(245,197,24,0.3)] hover:shadow-[0_0_30px_rgba(245,197,24,0.5)] transition-all duration-300">
                  <Link href="/portal/practitioner">
                    Open HIVE Surgical Assistant <ArrowRight aria-hidden="true" className="ml-2 h-4 w-4 flex-shrink-0" />
                  </Link>
                </Button>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Section 5.5: Enterprise — Hospitals & GP Practices */}
        <section id="enterprise" className="py-24 lg:py-36 relative overflow-hidden">
          <div className="container mx-auto px-6 relative z-10">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeInUp}
              className="flex flex-col items-center text-center mb-14 max-w-3xl mx-auto"
            >
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md glass-panel text-foreground text-xs font-bold tracking-widest uppercase mb-6">
                <Building2 className="h-3 w-3 text-primary" />
                Enterprise
              </div>
              <h2 className="text-[clamp(2.2rem,4.5vw,3.75rem)] font-bold mb-6 text-foreground leading-tight text-balance">
                For hospitals &amp; established GP practices
              </h2>
              <p className="text-lg md:text-xl text-muted-foreground font-light glass-panel px-6 py-3 rounded-2xl">
                Cut the paperwork, not the care. Health HIVE streamlines patient-data
                input and augments documentation with AI — saving your teams time and
                your organisation money on administration.
              </p>
            </motion.div>

            <div className="grid lg:grid-cols-2 gap-10 items-center glass-panel-heavy p-8 md:p-14 rounded-[3rem] max-w-6xl mx-auto">
              <motion.div
                initial={{ opacity: 0, x: -24 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ duration: 0.9, ease: SMOOTH_EASE }}
                className="relative rounded-[2rem] overflow-hidden glass-panel group h-72 sm:h-96 lg:h-[30rem]"
              >
                <img
                  src={`${import.meta.env.BASE_URL}images/gp-consult.webp`}
                  alt="GP consulting with a patient, supported by digital documentation"
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 motion-reduce:transform-none"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/20 to-transparent"></div>
                <div className="absolute bottom-6 left-6 right-6">
                  <p className="text-foreground font-semibold text-lg flex items-center gap-2">
                    <Stethoscope className="h-5 w-5 text-primary" />
                    More time with patients. Less time on paperwork.
                  </p>
                </div>
              </motion.div>

              <motion.div
                variants={staggerContainer}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-80px" }}
                className="space-y-5"
              >
                {[
                  {
                    icon: <ClipboardList className="h-5 w-5" />,
                    title: "Structured intake before the appointment",
                    desc: "Patients arrive with standardised questionnaires and an organised history already completed — easy, streamlined input of patient information instead of forms in the waiting room.",
                  },
                  {
                    icon: <Sparkles className="h-5 w-5" />,
                    title: "AI-augmented documentation",
                    desc: "Referral letters, clinic summaries and consultation notes drafted faster with AI assistance — clinicians review and sign off, the HIVE does the heavy typing.",
                  },
                  {
                    icon: <Clock className="h-5 w-5" />,
                    title: "Less admin per consultation",
                    desc: "Streamlined workflows shorten the administrative tail of every visit, freeing clinical and secretarial time across the practice or department.",
                  },
                  {
                    icon: <Euro className="h-5 w-5" />,
                    title: "Time and money saved on paperwork",
                    desc: "Fewer transcription hours, faster turnaround on letters and discharge summaries, and reduced duplicate data entry — measurable savings on administration.",
                  },
                ].map((item, idx) => (
                  <motion.div
                    key={idx}
                    variants={fadeInUp}
                    className="flex items-start gap-4 p-5 rounded-2xl glass-panel border-transparent hover:border-primary/30 transition-colors"
                  >
                    <div className="mt-0.5 w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0 text-primary border border-primary/20">
                      {item.icon}
                    </div>
                    <div>
                      <h3 className="text-foreground font-semibold text-lg mb-1">{item.title}</h3>
                      <p className="text-muted-foreground text-sm leading-relaxed">{item.desc}</p>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            </div>

            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeInUp}
              className="max-w-3xl mx-auto mt-12 text-center glass-panel-heavy rounded-[2rem] p-8 md:p-12 border-primary/20"
            >
              <h3 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
                Interested in Health HIVE for your organisation?
              </h3>
              <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
                Tell us about your hospital department or GP practice and we'll get
                back to you about a tailored enterprise rollout.
              </p>
              <Button
                asChild
                size="lg"
                className="w-full sm:w-auto bg-primary text-primary-foreground hover:bg-primary/90 h-auto min-h-14 whitespace-normal px-8 text-base shadow-[0_0_20px_rgba(245,197,24,0.3)] hover:shadow-[0_0_30px_rgba(245,197,24,0.5)] transition-all duration-300"
              >
                <a href="mailto:info@ibnceena.ie?subject=Enterprise%20enquiry%20%E2%80%94%20Health%20HIVE">
                  <Mail aria-hidden="true" className="mr-2 h-4 w-4 flex-shrink-0" /> Contact us about enterprise
                </a>
              </Button>
              <p className="text-xs text-muted-foreground mt-6">
                Enquiries only — no pricing commitments. We'll follow up by email.
              </p>
            </motion.div>
          </div>
        </section>

        {/* Section: Professional portal adverts */}
        <PortalAdvertsSection />

        {/* Section 6: Footer */}
        <footer className="py-16 relative overflow-hidden border-t border-border/40 glass-panel-heavy rounded-t-[3rem] mt-24">
          <div className="container mx-auto px-6 relative z-10">
            <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-12 mb-12">
              <div className="col-span-1 md:col-span-2">
                <div className="flex items-center gap-3 mb-6">
                  <HiveLogo size={32} />
                  <span className="font-semibold text-xl tracking-tight text-foreground">HEALTH HIVE</span>
                </div>
                <p className="text-muted-foreground mb-6 max-w-sm">
                  Connecting the healthcare experience for patients and clinicians with precision, privacy, and clinical alignment.
                </p>
                <div className="flex gap-4">
                  <a href="mailto:info@ibnceena.ie" className="text-muted-foreground hover:text-primary transition-colors flex items-center gap-2 text-sm">
                    <Mail className="h-4 w-4" /> info@ibnceena.ie
                  </a>
                </div>
              </div>
              
              <div>
                <h3 className="font-semibold text-foreground mb-4">Ecosystem</h3>
                <ul className="space-y-3 text-sm">
                  <li><a href="#companion" className="text-muted-foreground hover:text-primary transition-colors">HIVE Companion App</a></li>
                  <li><a href="#exchange" className="text-muted-foreground hover:text-primary transition-colors">Encrypted Data Exchange</a></li>
                  <li><a href="#surgical-assistant" className="text-muted-foreground hover:text-primary transition-colors">Surgical Assistant</a></li>
                  <li><a href="#enterprise" className="text-muted-foreground hover:text-primary transition-colors">For Hospitals &amp; GP Practices</a></li>
                  <li><a href={`${import.meta.env.BASE_URL}portal`} className="text-muted-foreground hover:text-primary transition-colors">Emergency Portal</a></li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-foreground mb-4">Professional Portals</h3>
                <ul className="space-y-3 text-sm">
                  <li><Link href="/portal/practitioner" className="text-muted-foreground hover:text-primary transition-colors">GP &amp; HIVE HUB</Link></li>
                  <li><Link href="/portal/supportive" className="text-muted-foreground hover:text-primary transition-colors">Supportive Care Professionals</Link></li>
                  <li><Link href="/portal/responder" className="text-muted-foreground hover:text-primary transition-colors">First Responders</Link></li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-foreground mb-4">Legal</h3>
                <ul className="space-y-3 text-sm">
                  <li><a href="/api/privacy" target="_blank" rel="noreferrer" className="text-muted-foreground hover:text-primary transition-colors">Privacy Policy</a></li>
                </ul>
              </div>
            </div>
            
            <div className="pt-8 border-t border-border/50 flex flex-col md:flex-row justify-between items-center gap-4">
              <p className="text-sm text-muted-foreground">
                © {new Date().getFullYear()} IbnCeena Ltd. All rights reserved.
              </p>
              <div className="text-xs text-muted-foreground flex items-center gap-2">
                <MapPin className="h-3 w-3" /> Dublin, Ireland
              </div>
            </div>
          </div>
        </footer>

      </main>
    </div>
  );
}
```

## `src/pages/not-found.tsx`

```tsx
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md mx-4">
        <CardContent className="pt-6">
          <div className="flex mb-4 gap-2">
            <AlertCircle className="h-8 w-8 text-red-500" />
            <h1 className="text-2xl font-bold text-gray-900">404 Page Not Found</h1>
          </div>

          <p className="mt-4 text-sm text-gray-600">
            Did you forget to add the page to the router?
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
```

## `src/portal/Caretaker.tsx`

```tsx
import { useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { PortalLayout, useProtected } from "./PortalLayout";
import { authHeader } from "./lib/store";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  MapPin,
  HeartPulse,
  Droplet,
  Activity,
  Wind,
  ShieldAlert,
  AlertTriangle,
} from "lucide-react";

interface VitalSnapshot {
  hr?: number;
  spo2?: number;
  glucose?: number;
  ecg?: string;
  ts: string;
}
interface CaretakerData {
  patientLabel: string;
  createdAt?: string;
  lastSeenAt?: string | null;
  location?: { lat: number; lng: number; accuracyM?: number; ts: string } | null;
  vitals?: VitalSnapshot | null;
  demo?: boolean;
}

const DEMO_LINK_CODE = "HCL-DEMO-2026";
const CODE_RE = new RegExp(`HCL-DEMO-2026|HCL-[0-9A-Z]{4}-[0-9A-Z]{4}`, "i");
const STALE_MS = 15 * 60 * 1000;

function relativeTime(ts?: string | null): string {
  if (!ts) return "no data yet";
  const diff = Date.now() - new Date(ts).getTime();
  if (Number.isNaN(diff)) return "unknown";
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "updated just now";
  if (mins === 1) return "updated 1 min ago";
  if (mins < 60) return `updated ${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  return `updated ${hrs}h ago`;
}

function isStale(ts?: string | null): boolean {
  if (!ts) return true;
  return Date.now() - new Date(ts).getTime() > STALE_MS;
}

function VitalCard({
  icon,
  label,
  value,
  unit,
  ts,
}: {
  icon: React.ReactNode;
  label: string;
  value?: number | string;
  unit?: string;
  ts?: string | null;
}) {
  const stale = isStale(ts);
  const hasValue = value !== undefined && value !== null && value !== "";
  return (
    <Card className={stale && hasValue ? "border-amber-500/40" : ""}>
      <CardContent className="p-4">
        <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
          {icon} {label}
        </div>
        <div className="text-2xl font-bold">
          {hasValue ? value : "—"}
          {hasValue && unit && <span className="text-base font-normal text-muted-foreground ml-1">{unit}</span>}
        </div>
        <div className="text-xs mt-1 flex items-center gap-1">
          {hasValue && stale ? (
            <span className="text-amber-400 flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" /> stale · {relativeTime(ts)}
            </span>
          ) : (
            <span className="text-muted-foreground">{relativeTime(ts)}</span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default function Caretaker() {
  const [, navigate] = useLocation();
  const { allowed, isDemoAccess } = useProtected();
  const [input, setInput] = useState(isDemoAccess ? DEMO_LINK_CODE : "");
  const [activeCode, setActiveCode] = useState<string | null>(null);
  const [data, setData] = useState<CaretakerData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchData = async (code: string, initial = false) => {
    if (initial) {
      setLoading(true);
      setError(null);
    }
    try {
      const res = await fetch(`${import.meta.env.BASE_URL}api/caretaker-link/${code}`, {
        headers: { ...authHeader() },
      });
      if (res.status === 401) {
        setError("Your session has expired. Please log in again.");
        setData(null);
        setActiveCode(null);
        navigate("/portal/login");
        return;
      }
      if (res.status === 403) {
        let msg = `Demo access can only open the demo link ${DEMO_LINK_CODE}.`;
        try {
          const body = (await res.json()) as { error?: string; message?: string };
          if (body.message) msg = body.message;
        } catch {
          /* ignore */
        }
        setError(msg);
        setData(null);
        setActiveCode(null);
        return;
      }
      if (res.status === 404) {
        setError("This caretaker link is invalid or was revoked.");
        setData(null);
        setActiveCode(null);
        return;
      }
      if (!res.ok) {
        if (initial) setError("Something went wrong. Please try again.");
        return;
      }
      const json = (await res.json()) as CaretakerData;
      setData(json);
      setActiveCode(code);
    } catch {
      if (initial) setError("Network error. Please try again.");
    } finally {
      if (initial) setLoading(false);
    }
  };

  useEffect(() => {
    if (!activeCode) return;
    pollRef.current = setInterval(() => fetchData(activeCode), 30_000);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeCode]);

  const handleSubmit = () => {
    const match = input.trim().match(CODE_RE);
    if (!match) {
      setError("Enter a valid caretaker link code (HCL-XXXX-XXXX).");
      return;
    }
    fetchData(match[0].toUpperCase(), true);
  };

  if (!allowed) {
    return (
      <PortalLayout>
        <div className="max-w-md mx-auto text-center py-16">
          <ShieldAlert className="h-12 w-12 text-primary mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Sign in required</h1>
          <p className="text-muted-foreground mb-6">
            The caretaker dashboard requires a logged-in account with biometric
            2FA passed this session.
          </p>
          <div className="flex justify-center gap-3">
            <Button onClick={() => navigate("/portal/login")}>Log in</Button>
            <Button variant="outline" onClick={() => navigate("/portal")}>
              Back to portal
            </Button>
          </div>
        </div>
      </PortalLayout>
    );
  }

  const loc = data?.location;
  const delta = 0.005;
  const bbox = loc
    ? `${loc.lng - delta},${loc.lat - delta},${loc.lng + delta},${loc.lat + delta}`
    : "";

  return (
    <PortalLayout>
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center gap-3 mb-2">
          <h1 className="text-3xl font-bold">Caretaker dashboard</h1>
          {isDemoAccess && (
            <Badge className="bg-primary/20 text-primary border border-primary/40">DEMO</Badge>
          )}
        </div>
        <p className="text-muted-foreground mb-6">
          Live location and vitals appear <strong>only while the patient (Red
          Geriatric Pack) has opted in</strong>, and stop the moment they revoke.
        </p>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-primary" /> Caretaker link code
            </CardTitle>
            <CardDescription>Format: HCL-XXXX-XXXX</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="HCL-XXXX-XXXX"
              className="text-lg tracking-wider font-mono uppercase"
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSubmit();
              }}
            />
            {error && (
              <div className="rounded-lg border border-destructive/50 bg-destructive/10 text-destructive px-4 py-3 text-sm font-semibold">
                {error}
              </div>
            )}
            <Button onClick={handleSubmit} disabled={loading} size="lg" className="w-full">
              {loading ? "Connecting…" : "Connect"}
            </Button>
          </CardContent>
        </Card>

        {data && (
          <div className="space-y-5">
            {data.demo && (
              <div className="rounded-lg border-2 border-primary/50 bg-primary/10 text-primary px-4 py-3 text-sm font-bold flex items-center gap-2 uppercase tracking-wide">
                <AlertTriangle className="h-5 w-5 shrink-0" /> Fictional demo data —
                not a real resident
              </div>
            )}
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-xl font-bold">{data.patientLabel}</span>
              <Badge variant="outline">{relativeTime(data.lastSeenAt)}</Badge>
              <span className="text-xs text-muted-foreground">Auto-refreshing every 30s</span>
            </div>

            {/* Location */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-primary" /> Location
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loc ? (
                  <div className="space-y-2">
                    <div className="aspect-video w-full overflow-hidden rounded-lg border border-border">
                      <iframe
                        title="Patient location"
                        className="w-full h-full"
                        src={`https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${loc.lat},${loc.lng}`}
                      />
                    </div>
                    <div className="text-sm text-muted-foreground flex flex-wrap gap-x-4">
                      <span>{loc.lat.toFixed(5)}, {loc.lng.toFixed(5)}</span>
                      {typeof loc.accuracyM === "number" && <span>±{Math.round(loc.accuracyM)}m</span>}
                      <span className={isStale(loc.ts) ? "text-amber-400" : ""}>
                        {relativeTime(loc.ts)}
                      </span>
                    </div>
                  </div>
                ) : (
                  <p className="text-muted-foreground">
                    No location shared yet, or location sharing is off.
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Vitals */}
            <div>
              <h2 className="text-lg font-semibold mb-3">Latest vitals</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <VitalCard icon={<HeartPulse className="h-4 w-4" />} label="Heart rate" value={data.vitals?.hr} unit="bpm" ts={data.vitals?.ts} />
                <VitalCard icon={<Wind className="h-4 w-4" />} label="SpO₂" value={data.vitals?.spo2} unit="%" ts={data.vitals?.ts} />
                <VitalCard icon={<Droplet className="h-4 w-4" />} label="Glucose" value={data.vitals?.glucose} unit="mmol/L" ts={data.vitals?.ts} />
                <VitalCard icon={<Activity className="h-4 w-4" />} label="ECG" value={data.vitals?.ecg} ts={data.vitals?.ts} />
              </div>
              {!data.vitals && (
                <p className="text-muted-foreground text-sm mt-3">
                  No vitals shared yet.
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </PortalLayout>
  );
}
```

## `src/portal/Emergency.tsx`

```tsx
import { useEffect, useState } from "react";
import { useLocation, useSearch } from "wouter";
import { PortalLayout, useProtected } from "./PortalLayout";
import { authHeader } from "./lib/store";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertTriangle,
  Siren,
  Pill,
  FileText,
  StickyNote,
  Clock,
  Eye,
  ShieldAlert,
} from "lucide-react";

interface Allergy {
  drug?: string;
  reaction?: string;
  severity?: string;
}
interface Medication {
  medication?: string;
  dose?: string;
  frequency?: string;
  route?: string;
}
interface Condition {
  name?: string;
  icd10?: string;
  status?: string;
  diagnosedDate?: string;
}
interface EmergencyPayload {
  patientName?: string;
  generatedAt?: string;
  allergies?: Allergy[];
  redFlags?: string[];
  medications?: Medication[];
  conditions?: Condition[];
  notes?: string;
}
interface ClaimResult {
  payload: EmergencyPayload;
  createdAt?: string;
  expiresAt?: string;
  accessCount?: number;
  demo?: boolean;
}

const DEMO_SHARE_CODE = "HES-DEMO-2026";
const CODE_RE = new RegExp(`HES-DEMO-2026|HES-[0-9A-Z]{4}-[0-9A-Z]{4}`, "i");

function useCountdown(expiresAt?: string): string {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  if (!expiresAt) return "";
  const diff = new Date(expiresAt).getTime() - now;
  if (Number.isNaN(diff)) return "";
  if (diff <= 0) return "Expired";
  const mins = Math.floor(diff / 60000);
  const secs = Math.floor((diff % 60000) / 1000);
  const hrs = Math.floor(mins / 60);
  if (hrs > 0) return `${hrs}h ${mins % 60}m remaining`;
  return `${mins}m ${secs}s remaining`;
}

export default function Emergency() {
  const [, navigate] = useLocation();
  const searchStr = useSearch();
  const { allowed, isDemoAccess } = useProtected();
  const prefillCode = new URLSearchParams(searchStr).get("code") ?? "";
  const [input, setInput] = useState(
    prefillCode || (isDemoAccess ? DEMO_SHARE_CODE : ""),
  );
  const [result, setResult] = useState<ClaimResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const countdown = useCountdown(result?.expiresAt);

  const extractCode = (raw: string): string | null => {
    const trimmed = raw.trim();
    const match = trimmed.match(CODE_RE);
    if (match) return match[0].toUpperCase();
    // Try QR payload JSON
    try {
      const parsed = JSON.parse(trimmed);
      if (typeof parsed?.code === "string") {
        const m = parsed.code.match(CODE_RE);
        if (m) return m[0].toUpperCase();
      }
    } catch {
      /* not JSON */
    }
    return null;
  };

  const handleSubmit = async () => {
    setError(null);
    setResult(null);
    const code = extractCode(input);
    if (!code) {
      setError("Enter a valid share code (HES-XXXX-XXXX) or paste a QR payload.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${import.meta.env.BASE_URL}api/emergency-share/claim`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeader() },
        body: JSON.stringify({ code }),
      });
      if (res.status === 401) {
        setError("Your session has expired. Please log in again.");
        navigate("/portal/login");
        return;
      }
      if (res.status === 403) {
        let msg = `Demo access can only open the demo code ${DEMO_SHARE_CODE}.`;
        try {
          const body = (await res.json()) as { error?: string; message?: string };
          if (body.message) msg = body.message;
        } catch {
          /* ignore */
        }
        setError(msg);
        return;
      }
      if (res.status === 404) {
        setError("Invalid or expired code.");
        return;
      }
      if (!res.ok) {
        setError("Something went wrong. Please try again.");
        return;
      }
      const data = (await res.json()) as ClaimResult;
      setResult(data);
    } catch {
      setError("Network error. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!allowed) {
    return (
      <PortalLayout>
        <div className="max-w-md mx-auto text-center py-16">
          <ShieldAlert className="h-12 w-12 text-primary mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Sign in required</h1>
          <p className="text-muted-foreground mb-6">
            The emergency viewer requires a logged-in account with biometric 2FA
            passed this session.
          </p>
          <div className="flex justify-center gap-3">
            <Button onClick={() => navigate("/portal/login")}>Log in</Button>
            <Button variant="outline" onClick={() => navigate("/portal")}>
              Back to portal
            </Button>
          </div>
        </div>
      </PortalLayout>
    );
  }

  const payload = result?.payload;

  return (
    <PortalLayout>
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center gap-3 mb-2">
          <h1 className="text-3xl font-bold">Emergency viewer</h1>
          {isDemoAccess && (
            <Badge className="bg-primary/20 text-primary border border-primary/40">DEMO</Badge>
          )}
        </div>
        <p className="text-muted-foreground mb-6">
          Enter the patient-provided share code, or paste a scanned QR payload.
        </p>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Siren className="h-5 w-5 text-destructive" /> Share code
            </CardTitle>
            <CardDescription>Format: HES-XXXX-XXXX</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="HES-XXXX-XXXX"
              className="text-lg tracking-wider font-mono uppercase"
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSubmit();
              }}
            />
            <details className="text-sm text-muted-foreground">
              <summary className="cursor-pointer">Paste a QR payload instead</summary>
              <Textarea
                className="mt-2 font-mono text-xs"
                rows={3}
                placeholder='{"code":"HES-XXXX-XXXX"}'
                value={input}
                onChange={(e) => setInput(e.target.value)}
              />
            </details>
            {error && (
              <div className="rounded-lg border border-destructive/50 bg-destructive/10 text-destructive px-4 py-3 text-sm font-semibold">
                {error}
              </div>
            )}
            <Button onClick={handleSubmit} disabled={loading} size="lg" className="w-full">
              {loading ? "Retrieving…" : "Retrieve emergency record"}
            </Button>
          </CardContent>
        </Card>

        {payload && (
          <div className="space-y-5">
            {result?.demo && (
              <div className="rounded-lg border-2 border-primary/50 bg-primary/10 text-primary px-4 py-3 text-sm font-bold flex items-center gap-2 uppercase tracking-wide">
                <AlertTriangle className="h-5 w-5 shrink-0" /> Fictional demo data —
                not a real patient
              </div>
            )}
            {/* Meta */}
            <div className="flex flex-wrap items-center gap-3 text-sm">
              {payload.patientName && (
                <span className="font-bold text-lg">{payload.patientName}</span>
              )}
              {result?.expiresAt && (
                <span className="flex items-center gap-1.5 text-amber-400">
                  <Clock className="h-4 w-4" /> {countdown}
                </span>
              )}
              {typeof result?.accessCount === "number" && (
                <span className="flex items-center gap-1.5 text-muted-foreground">
                  <Eye className="h-4 w-4" /> accessed {result.accessCount}{" "}
                  {result.accessCount === 1 ? "time" : "times"}
                </span>
              )}
              {payload.generatedAt && (
                <span className="text-muted-foreground">
                  generated {new Date(payload.generatedAt).toLocaleString()}
                </span>
              )}
            </div>

            {/* 1. ALLERGIES — big red banner */}
            <div className="rounded-2xl border-2 border-red-600 bg-red-950/40 overflow-hidden">
              <div className="bg-red-600 text-white px-5 py-3 flex items-center gap-2 font-extrabold text-lg tracking-wide uppercase">
                <AlertTriangle className="h-6 w-6" /> Allergies
              </div>
              <div className="p-5">
                {payload.allergies && payload.allergies.length > 0 ? (
                  <ul className="space-y-2">
                    {payload.allergies.map((a, i) => (
                      <li key={i} className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                        <span className="text-xl font-bold text-red-300">
                          {a.drug ?? "Unknown allergen"}
                        </span>
                        {a.reaction && <span className="text-red-100">→ {a.reaction}</span>}
                        {a.severity && (
                          <Badge className="bg-red-600 text-white border-transparent uppercase">
                            {a.severity}
                          </Badge>
                        )}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-red-200 font-semibold">
                    No allergies recorded — confirm with patient if possible.
                  </p>
                )}
              </div>
            </div>

            {/* 2. Red flags */}
            {payload.redFlags && payload.redFlags.length > 0 && (
              <Card className="border-amber-500/50 bg-amber-500/5">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-amber-400">
                    <Siren className="h-5 w-5" /> Critical / red-flag conditions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-1.5">
                    {payload.redFlags.map((f, i) => (
                      <li key={i} className="flex items-start gap-2 font-semibold">
                        <span className="text-amber-400">▲</span> {f}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* 3. Medications — ordered numbered list */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Pill className="h-5 w-5 text-primary" /> Current medications
                </CardTitle>
              </CardHeader>
              <CardContent>
                {payload.medications && payload.medications.length > 0 ? (
                  <ol className="space-y-3">
                    {payload.medications.map((m, i) => (
                      <li key={i} className="flex gap-3">
                        <span className="h-7 w-7 shrink-0 rounded-full bg-primary/20 text-primary font-bold flex items-center justify-center text-sm">
                          {i + 1}
                        </span>
                        <div>
                          <div className="font-bold text-lg leading-tight">
                            {m.medication ?? "Unnamed medication"}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {[m.dose, m.frequency, m.route].filter(Boolean).join(" · ") || "—"}
                          </div>
                        </div>
                      </li>
                    ))}
                  </ol>
                ) : (
                  <p className="text-muted-foreground">No current medications recorded.</p>
                )}
              </CardContent>
            </Card>

            {/* 4. Medical history */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" /> Medical history
                </CardTitle>
              </CardHeader>
              <CardContent>
                {payload.conditions && payload.conditions.length > 0 ? (
                  <ul className="space-y-2">
                    {payload.conditions.map((c, i) => (
                      <li key={i} className="flex flex-wrap items-baseline gap-x-3">
                        <span className="font-semibold">{c.name ?? "Condition"}</span>
                        {c.status && (
                          <Badge variant="outline" className="uppercase text-xs">
                            {c.status}
                          </Badge>
                        )}
                        {c.icd10 && (
                          <span className="text-xs text-muted-foreground font-mono">{c.icd10}</span>
                        )}
                        {c.diagnosedDate && (
                          <span className="text-xs text-muted-foreground">
                            dx {c.diagnosedDate}
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-muted-foreground">No conditions recorded.</p>
                )}
              </CardContent>
            </Card>

            {/* 5. Patient notes */}
            {payload.notes && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <StickyNote className="h-5 w-5 text-primary" /> Patient notes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="whitespace-pre-wrap leading-relaxed">{payload.notes}</p>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </PortalLayout>
  );
}
```

## `src/portal/FirstResponder.tsx`

```tsx
import { useLocation } from "wouter";
import { PortalLayout, useProtected } from "./PortalLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MembershipWorkspace } from "./MembershipWorkspace";
import { isFirstResponderRole, isSupportiveRole } from "./lib/store";
import { useState } from "react";
import {
  ArrowRight,
  Crown,
  HeartHandshake,
  ShieldCheck,
  Siren,
  Stethoscope,
  Timer,
} from "lucide-react";

/**
 * First Responders portal — paramedics, ambulance and emergency crews.
 * Their own pathway: rapid emergency handover via patient-approved share
 * codes, plus the shared HIVE booking/consultation membership features.
 * Doctors live in the GP & HIVE HUB; physio/OT/A&E follow-up roles live in
 * the Supportive Care portal.
 */
export default function FirstResponder() {
  const [, navigate] = useLocation();
  const { allowed, account } = useProtected();
  const [isMember, setIsMember] = useState(false);

  const isPractitioner = !!account && account.accountType === "healthcare";
  const superuser = !!account?.superuser;
  const responder = isPractitioner && (superuser || isFirstResponderRole(account?.role));
  const supportive = isPractitioner && !superuser && isSupportiveRole(account?.role);

  if (!allowed) {
    return (
      <PortalLayout>
        <div className="max-w-md mx-auto text-center py-16">
          <Siren className="h-10 w-10 text-primary mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">First Responders</h1>
          <p className="text-muted-foreground mb-6">
            Sign in with your first-responder account for rapid, patient-approved
            emergency handover access, HIVE booking and consultations.
          </p>
          <div className="flex justify-center gap-3">
            <Button onClick={() => navigate("/portal/login")}>Sign in</Button>
            <Button variant="outline" onClick={() => navigate("/portal/signup?type=healthcare")}>
              Sign up
            </Button>
          </div>
        </div>
      </PortalLayout>
    );
  }

  if (!isPractitioner) {
    return (
      <PortalLayout>
        <div className="max-w-md mx-auto text-center py-16">
          <h1 className="text-2xl font-bold mb-2">Practitioner account required</h1>
          <p className="text-muted-foreground mb-6">
            This area is for healthcare practitioner accounts. Your current
            account type does not include practitioner tools.
          </p>
          <Button onClick={() => navigate("/portal")}>Back to portal</Button>
        </div>
      </PortalLayout>
    );
  }

  if (!responder) {
    // Cross-access is blocked: doctors belong in the GP & HIVE HUB and
    // supportive-care roles in the Supportive Care portal.
    return (
      <PortalLayout>
        <div className="max-w-md mx-auto text-center py-16">
          {supportive ? (
            <HeartHandshake className="h-10 w-10 text-primary mx-auto mb-4" />
          ) : (
            <Stethoscope className="h-10 w-10 text-primary mx-auto mb-4" />
          )}
          <h1 className="text-2xl font-bold mb-2">This is the First Responders portal</h1>
          <p className="text-muted-foreground mb-6">
            As a {account?.role ?? "doctor"}, your workspace lives in the{" "}
            {supportive ? "Supportive Care portal" : "GP & HIVE HUB"}.
          </p>
          <Button
            onClick={() => navigate(supportive ? "/portal/supportive" : "/portal/practitioner")}
            className="gap-1.5"
          >
            {supportive ? (
              <>
                <HeartHandshake className="h-4 w-4" /> Go to the Supportive Care portal
              </>
            ) : (
              <>
                <Stethoscope className="h-4 w-4" /> Go to the GP &amp; HIVE HUB
              </>
            )}
          </Button>
        </div>
      </PortalLayout>
    );
  }

  return (
    <PortalLayout>
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Siren className="h-7 w-7 text-primary" /> First Responders Portal
          </h1>
          <div className="flex items-center gap-2">
            {superuser && (
              <Badge className="bg-amber-500/20 text-amber-400 border border-amber-500/40 gap-1">
                <ShieldCheck className="h-3 w-3" /> SUPERUSER
              </Badge>
            )}
            {isMember && (
              <Badge className="bg-primary/20 text-primary border border-primary/40 gap-1">
                <Crown className="h-3 w-3" /> MEMBER
              </Badge>
            )}
            {account?.role && (
              <Badge className="bg-primary/20 text-primary border border-primary/40">
                {account.role}
              </Badge>
            )}
          </div>
        </div>
        <p className="text-muted-foreground mb-8">
          Your dedicated pathway for emergency response: rapid, patient-approved
          handover access at the scene, plus HIVE booking and consultations.
        </p>

        {/* Rapid emergency handover — the core first-responder tool */}
        <Card className="mb-8 border-destructive/40 bg-destructive/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Siren className="h-5 w-5 text-destructive" /> Rapid emergency handover
            </CardTitle>
            <CardDescription>
              Enter the patient-given emergency code (HES-XXXX-XXXX) to view
              critical information at the scene — allergies, red flags and
              current medications. Access is patient-consented, relayed in
              memory only and never centrally stored.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <ul className="text-sm text-muted-foreground space-y-1.5">
              <li className="flex items-center gap-2">
                <Timer className="h-4 w-4 text-primary" /> Time-limited codes —
                access ends when the share expires or is revoked
              </li>
              <li className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-primary" /> Readable over
                the phone; designed for the roadside, not the desk
              </li>
            </ul>
            <Button onClick={() => navigate("/portal/emergency")} className="gap-1.5">
              Open emergency viewer <ArrowRight className="h-4 w-4" />
            </Button>
          </CardContent>
        </Card>

        <MembershipWorkspace onMembershipChange={setIsMember} />
      </div>
    </PortalLayout>
  );
}
```

## `src/portal/Landing.tsx`

```tsx
import { useState } from "react";
import { useLocation } from "wouter";
import { PortalLayout } from "./PortalLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { setSession, startDemoSession, type ApiError } from "./lib/store";
import { Stethoscope, HeartHandshake, Siren, ArrowRight, ShieldCheck } from "lucide-react";

const DEMO_SHARE_CODE = "HES-DEMO-2026";

export default function Landing() {
  const [, navigate] = useLocation();
  const [demoBusy, setDemoBusy] = useState(false);
  const [demoError, setDemoError] = useState<string | null>(null);

  const startDemoEmergency = async () => {
    setDemoError(null);
    setDemoBusy(true);
    try {
      const { sessionToken } = await startDemoSession();
      setSession({ sessionToken, account: null, demo: true });
      navigate(`/portal/emergency?code=${DEMO_SHARE_CODE}`);
    } catch (err) {
      const apiErr = err as ApiError;
      setDemoError(apiErr.message ?? "Could not start demo access. Please try again.");
    } finally {
      setDemoBusy(false);
    }
  };

  return (
    <PortalLayout>
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-destructive/40 bg-destructive/10 text-destructive text-xs font-bold tracking-[0.15em] uppercase mb-6">
            <Siren className="h-4 w-4" />
            For life-saving, last-minute situations
          </div>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-5">
            HIVE <span className="hive-gradient-text">Emergency Portal</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            A secure gateway for healthcare workers and caretakers to reach a
            patient's critical medical information — but only through a
            patient-approved, time-limited emergency share.
          </p>
        </div>

        {/* Emergency access shortcut */}
        <Card className="mb-10 border-destructive/40 bg-destructive/5">
          <CardContent className="flex flex-col sm:flex-row items-center justify-between gap-4 p-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-destructive/15 flex items-center justify-center shrink-0">
                <Siren className="h-6 w-6 text-destructive" />
              </div>
              <div>
                <h2 className="text-lg font-bold">Emergency access</h2>
                <p className="text-sm text-muted-foreground">
                  Have a patient share code (HES-XXXX-XXXX)? Go straight to the
                  viewer.
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Demo access can only open the demo code{" "}
                  <span className="font-mono text-primary">{DEMO_SHARE_CODE}</span>.
                </p>
                {demoError && (
                  <p className="text-xs text-destructive mt-1">{demoError}</p>
                )}
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <Button
                onClick={() => navigate("/portal/login")}
                className="gap-1.5"
              >
                Open emergency viewer <ArrowRight className="h-4 w-4" />
              </Button>
              <Button variant="outline" onClick={startDemoEmergency} disabled={demoBusy}>
                {demoBusy ? "Starting…" : "Try demo access (DEMO)"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Four entrances */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="group hover:border-primary/50 transition-colors">
            <CardHeader>
              <div className="h-14 w-14 rounded-2xl bg-primary/15 flex items-center justify-center mb-3">
                <Stethoscope className="h-7 w-7 text-primary" />
              </div>
              <CardTitle className="text-2xl">GP &amp; HIVE HUB</CardTitle>
              <CardDescription className="text-base">
                Doctors only — GPs, hospital doctors and outpatient clinic
                specialists.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <ul className="text-sm text-muted-foreground space-y-1.5">
                <li className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-primary" /> Patient files
                  &amp; live medications
                </li>
                <li className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-primary" /> HIVE booking
                  &amp; consultations
                </li>
              </ul>
              <div className="flex gap-2 pt-2">
                <Button onClick={() => navigate("/portal/signup?type=healthcare")}>
                  Sign up
                </Button>
                <Button variant="outline" onClick={() => navigate("/portal/login")}>
                  Log in
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="group hover:border-primary/50 transition-colors">
            <CardHeader>
              <div className="h-14 w-14 rounded-2xl bg-primary/15 flex items-center justify-center mb-3">
                <HeartHandshake className="h-7 w-7 text-primary" />
              </div>
              <CardTitle className="text-2xl">Supportive Care</CardTitle>
              <CardDescription className="text-base">
                Physiotherapists, occupational health and A&amp;E follow-up
                professionals.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <ul className="text-sm text-muted-foreground space-y-1.5">
                <li className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-primary" /> Emergency
                  relay tools
                </li>
                <li className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-primary" /> HIVE booking
                  &amp; consultations
                </li>
              </ul>
              <div className="flex gap-2 pt-2">
                <Button onClick={() => navigate("/portal/signup?type=healthcare")}>
                  Sign up
                </Button>
                <Button variant="outline" onClick={() => navigate("/portal/login")}>
                  Log in
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="group hover:border-primary/50 transition-colors">
            <CardHeader>
              <div className="h-14 w-14 rounded-2xl bg-destructive/15 flex items-center justify-center mb-3">
                <Siren className="h-7 w-7 text-destructive" />
              </div>
              <CardTitle className="text-2xl">First Responders</CardTitle>
              <CardDescription className="text-base">
                Paramedics, ambulance and emergency crews needing rapid
                handover at the scene.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <ul className="text-sm text-muted-foreground space-y-1.5">
                <li className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-primary" /> Rapid
                  emergency code access
                </li>
                <li className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-primary" /> Allergies,
                  red flags &amp; live medications
                </li>
              </ul>
              <div className="flex gap-2 pt-2">
                <Button onClick={() => navigate("/portal/signup?type=healthcare")}>
                  Sign up
                </Button>
                <Button variant="outline" onClick={() => navigate("/portal/login")}>
                  Log in
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="group hover:border-primary/50 transition-colors">
            <CardHeader>
              <div className="h-14 w-14 rounded-2xl bg-primary/15 flex items-center justify-center mb-3">
                <HeartHandshake className="h-7 w-7 text-primary" />
              </div>
              <CardTitle className="text-2xl">Caretaker</CardTitle>
              <CardDescription className="text-base">
                Residential and nursing home staff monitoring an opted-in
                resident (Red Geriatric Pack).
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <ul className="text-sm text-muted-foreground space-y-1.5">
                <li className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-primary" /> Live GPS &amp;
                  vitals — only while the patient opts in
                </li>
                <li className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-primary" /> Stops the
                  moment they revoke
                </li>
              </ul>
              <div className="flex gap-2 pt-2">
                <Button onClick={() => navigate("/portal/signup?type=caretaker")}>
                  Sign up
                </Button>
                <Button variant="outline" onClick={() => navigate("/portal/login")}>
                  Log in
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <p className="text-center text-sm text-muted-foreground mt-10">
          <ShieldCheck className="inline h-4 w-4 text-primary mr-1 -mt-0.5" />
          Every portal access runs on the HIVE encrypted exchange — patient-consented,
          relayed, never centrally stored.{" "}
          <a href={`${import.meta.env.BASE_URL}#exchange`} className="text-primary underline underline-offset-4 hover:opacity-80">
            How the exchange works
          </a>
        </p>
      </div>
    </PortalLayout>
  );
}
```

## `src/portal/lib/store.ts`

```ts
export const HEALTHCARE_ROLES = [
  "GP",
  "Hospital doctor",
  "First responder",
  "Physiotherapist",
  "Outpatient clinic specialist doctor",
  "A&E follow-up",
  "Occupational health specialist",
] as const;

export type HealthcareRole = (typeof HEALTHCARE_ROLES)[number];

export type AccountType = "healthcare" | "caretaker";
export type VerificationMode = "demo" | "full";
export type AccountStatus = "demo" | "verification_ongoing" | "verified";

/** Public account shape as returned by the server. */
export interface PublicAccount {
  id: string;
  fullName: string;
  workplace: string;
  email: string;
  accountType: AccountType;
  role?: HealthcareRole | string;
  mode: VerificationMode;
  status: AccountStatus;
  /** Founder superuser — full read/test access across the portal. */
  superuser?: boolean;
}

/** On-device profile / verification images. Never leaves this device. */
export interface LocalProfile {
  accountId?: string;
  email: string;
  /** Whether a WebAuthn passkey was registered at signup on this device. */
  hasPasskey: boolean;
  passkeyId?: string;
  /** Verification images stay on THIS device only (data URLs). */
  verification?: {
    selfie?: string;
    photoIdName?: string;
    photoId?: string;
    certificationName?: string;
    certification?: string;
  };
}

import { startAuthentication, startRegistration } from "@simplewebauthn/browser";

const PROFILES_KEY = "hive_portal_profiles";
const SESSION_KEY = "hive_portal_session";

const API_BASE = `${import.meta.env.BASE_URL}api`;

function safeParse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

// ── Session (sessionStorage, server-issued) ─────────────────────────────────

export interface SessionState {
  sessionToken: string | null;
  account: PublicAccount | null;
  demo: boolean;
}

const EMPTY_SESSION: SessionState = {
  sessionToken: null,
  account: null,
  demo: false,
};

export function getSession(): SessionState {
  return safeParse<SessionState>(sessionStorage.getItem(SESSION_KEY), EMPTY_SESSION);
}

export function setSession(session: SessionState): void {
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
  window.dispatchEvent(new Event("hive-portal-session"));
}

export function clearSession(): void {
  sessionStorage.removeItem(SESSION_KEY);
  window.dispatchEvent(new Event("hive-portal-session"));
}

export function authHeader(): Record<string, string> {
  const { sessionToken } = getSession();
  return sessionToken ? { Authorization: `Bearer ${sessionToken}` } : {};
}

// ── On-device profiles (localStorage, for display / passkey / images) ────────

export function getProfiles(): LocalProfile[] {
  return safeParse<LocalProfile[]>(localStorage.getItem(PROFILES_KEY), []);
}

export function saveProfiles(profiles: LocalProfile[]): void {
  localStorage.setItem(PROFILES_KEY, JSON.stringify(profiles));
}

export function findProfileByEmail(email: string): LocalProfile | undefined {
  const normalized = email.trim().toLowerCase();
  return getProfiles().find((p) => p.email.toLowerCase() === normalized);
}

export function upsertProfile(profile: LocalProfile): void {
  const profiles = getProfiles().filter(
    (p) => p.email.toLowerCase() !== profile.email.toLowerCase(),
  );
  profiles.push(profile);
  saveProfiles(profiles);
}

// ── Server API helpers ───────────────────────────────────────────────────────

export interface ApiError {
  status: number;
  error?: string;
  message?: string;
}

async function parseError(res: Response): Promise<ApiError> {
  let body: { error?: string; message?: string } = {};
  try {
    body = (await res.json()) as { error?: string; message?: string };
  } catch {
    /* ignore */
  }
  return { status: res.status, error: body.error, message: body.message };
}

export interface RegisterInput {
  fullName: string;
  workplace: string;
  email: string;
  password: string;
  accountType: AccountType;
  role?: HealthcareRole;
  mode: VerificationMode;
}

/**
 * POST /portal/register → { account, webauthnToken }.
 * The webauthnToken authorizes server-verified passkey registration.
 */
export async function registerAccount(
  input: RegisterInput,
): Promise<{ account: PublicAccount; webauthnToken: string }> {
  const res = await fetch(`${API_BASE}/portal/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw await parseError(res);
  return (await res.json()) as { account: PublicAccount; webauthnToken: string };
}

/** POST /portal/login → loginToken. Throws ApiError on failure. */
export async function loginPassword(
  email: string,
  password: string,
): Promise<{
  loginToken: string;
  requiresSecondFactor: boolean;
  hasPasskey: boolean;
  /** Superuser first login: one-time token to enrol a passkey before 2FA. */
  needsPasskeySetup?: boolean;
  webauthnToken?: string;
}> {
  const res = await fetch(`${API_BASE}/portal/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) throw await parseError(res);
  return (await res.json()) as {
    loginToken: string;
    requiresSecondFactor: boolean;
    hasPasskey: boolean;
    needsPasskeySetup?: boolean;
    webauthnToken?: string;
  };
}

/**
 * Server-verified biometric second factor: fetches a server challenge,
 * runs the platform authenticator, and submits the assertion for
 * cryptographic verification. Only the server can mint a session.
 */
export async function complete2faWithPasskey(
  loginToken: string,
): Promise<{ sessionToken: string; account: PublicAccount }> {
  const optRes = await fetch(`${API_BASE}/portal/2fa/options`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ loginToken }),
  });
  if (!optRes.ok) throw await parseError(optRes);
  const { options } = (await optRes.json()) as { options: Parameters<typeof startAuthentication>[0]["optionsJSON"] };
  const assertion = await startAuthentication({ optionsJSON: options });
  const res = await fetch(`${API_BASE}/portal/2fa/verify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ loginToken, response: assertion }),
  });
  if (!res.ok) throw await parseError(res);
  return (await res.json()) as { sessionToken: string; account: PublicAccount };
}

/** DEV-ONLY: the server accepts a simulated pass only outside production. */
export async function complete2faDevSimulate(
  loginToken: string,
): Promise<{ sessionToken: string; account: PublicAccount }> {
  const res = await fetch(`${API_BASE}/portal/2fa/verify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ loginToken, devSimulate: true }),
  });
  if (!res.ok) throw await parseError(res);
  return (await res.json()) as { sessionToken: string; account: PublicAccount };
}

/** POST /portal/demo-session → { sessionToken, demo }. Throws ApiError on failure. */
export async function startDemoSession(): Promise<{ sessionToken: string; demo: boolean }> {
  const res = await fetch(`${API_BASE}/portal/demo-session`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  });
  if (!res.ok) throw await parseError(res);
  return (await res.json()) as { sessionToken: string; demo: boolean };
}

/** POST /portal/logout using the current session token. Best-effort. */
export async function logoutServer(): Promise<void> {
  const headers = authHeader();
  if (!headers.Authorization) return;
  try {
    await fetch(`${API_BASE}/portal/logout`, {
      method: "POST",
      headers,
    });
  } catch {
    /* best-effort */
  }
}

export function statusLabel(status: AccountStatus): string {
  switch (status) {
    case "demo":
      return "DEMO";
    case "verification_ongoing":
      return "VERIFICATION ONGOING";
    case "verified":
      return "VERIFIED";
    default:
      return String(status).toUpperCase();
  }
}

export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

export function randomId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

// ── WebAuthn helpers (server-verified via SimpleWebAuthn) ───────────────────

export function isWebAuthnAvailable(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof window.PublicKeyCredential !== "undefined" &&
    !!navigator.credentials
  );
}

/**
 * Register a platform passkey during signup, verified and stored server-side.
 * Returns true when the server verified and stored the credential.
 */
export async function registerPasskeyServer(webauthnToken: string): Promise<boolean> {
  const optRes = await fetch(`${API_BASE}/portal/webauthn/register-options`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ webauthnToken }),
  });
  if (!optRes.ok) throw await parseError(optRes);
  const { options } = (await optRes.json()) as { options: Parameters<typeof startRegistration>[0]["optionsJSON"] };
  const attestation = await startRegistration({ optionsJSON: options });
  const res = await fetch(`${API_BASE}/portal/webauthn/register-verify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ webauthnToken, response: attestation }),
  });
  if (!res.ok) throw await parseError(res);
  return true;
}

// ── Practitioner portal API ──────────────────────────────────────────────────

export const DOCTOR_ROLES: readonly string[] = [
  "GP",
  "Hospital doctor",
  "Outpatient clinic specialist doctor",
];

export function isDoctorRole(role?: string): boolean {
  return !!role && DOCTOR_ROLES.includes(role);
}

/** First responders have their own dedicated portal at /portal/responder. */
export const FIRST_RESPONDER_ROLE = "First responder";

export function isFirstResponderRole(role?: string): boolean {
  return role === FIRST_RESPONDER_ROLE;
}

/**
 * Supportive-care professional roles — healthcare roles that are neither
 * doctors nor first responders (who have their own portal).
 */
export const SUPPORTIVE_ROLES: readonly string[] = HEALTHCARE_ROLES.filter(
  (r) => !DOCTOR_ROLES.includes(r) && r !== FIRST_RESPONDER_ROLE,
);

export function isSupportiveRole(role?: string): boolean {
  return !!role && SUPPORTIVE_ROLES.includes(role);
}

// ── Founder superuser admin API (read/test capacity) ────────────────────────

export interface AdminAccount {
  id: string;
  fullName: string;
  workplace: string;
  email: string;
  accountType: AccountType;
  role: string | null;
  mode: VerificationMode;
  status: AccountStatus;
  hasPasskey: boolean;
  superuser: boolean;
  createdAt: number;
  patients: number;
  membershipActive: boolean;
}

export async function adminListAccounts(): Promise<{ accounts: AdminAccount[] }> {
  const res = await fetch(`${API_BASE}/portal/admin/accounts`, {
    headers: { "Content-Type": "application/json", ...authHeader() },
  });
  if (!res.ok) throw await parseError(res);
  return (await res.json()) as { accounts: AdminAccount[] };
}

export interface AdminStoreView {
  account: AdminAccount;
  store: {
    patients: PracPatientFile[];
    settings: PracSettings;
    bookings: PracBooking[];
    membership: ProMembership;
  } | null;
}

export async function adminGetAccountStore(accountId: string): Promise<AdminStoreView> {
  const res = await fetch(`${API_BASE}/portal/admin/accounts/${accountId}/store`, {
    headers: { "Content-Type": "application/json", ...authHeader() },
  });
  if (!res.ok) throw await parseError(res);
  return (await res.json()) as AdminStoreView;
}

export interface PracPatientSummary {
  id: string;
  fullName: string;
  dob: string;
  mrn: string;
  condition: string;
  demo: boolean;
  lastQuestionnaire: { name: string; score: string; date: string } | null;
}

export interface PracPatientFile {
  id: string;
  fullName: string;
  dob: string;
  mrn: string;
  condition: string;
  demo: boolean;
  history: string[];
  questionnaires: { id: string; name: string; score: string; date: string }[];
  prescriptions: { id: string; name: string; dose: string; frequency: string }[];
  notes: { id: string; ts: number; text: string }[];
  /** Items & documents added to this file (metadata + extracted text only). */
  attachments?: PatientAttachment[];
  /** Consented live medication share matched to this patient — null if none. */
  liveMedications?: LiveMedShare | null;
}

export interface PatientAttachment {
  id: string;
  ts: number;
  kind: "photo" | "document" | "audio" | "text";
  name: string;
  mimeType: string;
  size: number;
  /** Extracted / transcribed / typed text, ready for assimilation. */
  text?: string;
  textSource?: "typed" | "extracted" | "transcribed";
  /** Whether raw file content is available for viewing/download. */
  hasData: boolean;
}

export interface AvailabilitySlot {
  id: string;
  day: string;
  start: string;
  end: string;
  kind: "video" | "audio" | "clinic";
}

export interface PracSettings {
  bookingEnabled: boolean;
  videoConsultations: boolean;
  audioConsultations: boolean;
  slots: AvailabilitySlot[];
}

export interface PracBooking {
  id: string;
  patientName: string;
  kind: "video" | "audio";
  when: string;
  status: "confirmed" | "pending";
  demo: boolean;
  /** Availability slot this booking occupies (patient bookings via HIVE). */
  slotId?: string;
  /** Patient-provided reason for the consultation. */
  reason?: string;
}

async function pracFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}/portal/practitioner${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...authHeader(),
      ...(init?.headers ?? {}),
    },
  });
  if (!res.ok) throw await parseError(res);
  return (await res.json()) as T;
}

export function listPracPatients(): Promise<{ patients: PracPatientSummary[] }> {
  return pracFetch("/patients");
}

export function createPracPatient(input: {
  fullName: string;
  dob?: string;
  condition?: string;
}): Promise<{ patient: PracPatientFile }> {
  return pracFetch("/patients", { method: "POST", body: JSON.stringify(input) });
}

export function getPracPatient(id: string): Promise<{ patient: PracPatientFile }> {
  return pracFetch(`/patients/${encodeURIComponent(id)}`);
}

export function addPracNote(patientId: string, text: string): Promise<{ note: PracPatientFile["notes"][number] }> {
  return pracFetch(`/patients/${encodeURIComponent(patientId)}/notes`, {
    method: "POST",
    body: JSON.stringify({ text }),
  });
}

export function addPracPrescription(
  patientId: string,
  input: { name: string; dose?: string; frequency?: string },
): Promise<{ prescription: PracPatientFile["prescriptions"][number] }> {
  return pracFetch(`/patients/${encodeURIComponent(patientId)}/prescriptions`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function addPracAttachment(
  patientId: string,
  input: {
    kind: PatientAttachment["kind"];
    name: string;
    mimeType?: string;
    dataBase64?: string;
    text?: string;
  },
): Promise<{ attachment: PatientAttachment }> {
  return pracFetch(`/patients/${encodeURIComponent(patientId)}/attachments`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function deletePracAttachment(patientId: string, attachmentId: string): Promise<{ ok: boolean }> {
  return pracFetch(
    `/patients/${encodeURIComponent(patientId)}/attachments/${encodeURIComponent(attachmentId)}`,
    { method: "DELETE" },
  );
}

/** Fetch raw attachment bytes (auth header required) and return an object URL. */
export async function fetchPracAttachmentUrl(patientId: string, attachmentId: string): Promise<string> {
  const res = await fetch(
    `${API_BASE}/portal/practitioner/patients/${encodeURIComponent(patientId)}/attachments/${encodeURIComponent(attachmentId)}/content`,
    { headers: { ...authHeader() } },
  );
  if (!res.ok) throw await parseError(res);
  return URL.createObjectURL(await res.blob());
}

export function getPracSettings(): Promise<{ settings: PracSettings }> {
  return pracFetch("/settings");
}

export function updatePracSettings(
  patch: Partial<Pick<PracSettings, "bookingEnabled" | "videoConsultations" | "audioConsultations">>,
): Promise<{ settings: PracSettings }> {
  return pracFetch("/settings", { method: "PUT", body: JSON.stringify(patch) });
}

export function addPracSlot(input: {
  day: string;
  start: string;
  end: string;
  kind: AvailabilitySlot["kind"];
}): Promise<{ slot: AvailabilitySlot }> {
  return pracFetch("/settings/slots", { method: "POST", body: JSON.stringify(input) });
}

export function deletePracSlot(slotId: string): Promise<{ ok: boolean }> {
  return pracFetch(`/settings/slots/${encodeURIComponent(slotId)}`, { method: "DELETE" });
}

export function listPracBookings(): Promise<{ bookings: PracBooking[] }> {
  return pracFetch("/bookings");
}

// ── HIVE HUB professional membership ─────────────────────────────────────────

export type MembershipBilling = "monthly" | "yearly";

export interface ProMembership {
  active: boolean;
  billing: MembershipBilling | null;
  activatedAt: number | null;
}

export interface ConsultSession {
  id: string;
  bookingId: string;
  kind: "video" | "audio";
  room: string;
  patientName: string;
  provider: string;
  startedAt: number;
  expiresAt: number;
}

export function getMembership(): Promise<{ membership: ProMembership }> {
  return pracFetch("/membership");
}

export function startMembershipCheckout(
  billing: MembershipBilling,
): Promise<{ url: string; sessionId: string }> {
  return pracFetch("/membership/checkout", { method: "POST", body: JSON.stringify({ billing }) });
}

export function confirmMembership(sessionId: string): Promise<{ membership: ProMembership }> {
  return pracFetch("/membership/confirm", { method: "POST", body: JSON.stringify({ sessionId }) });
}

/** DEV-ONLY: the server accepts a simulated activation only outside production. */
export function confirmMembershipDevSimulate(): Promise<{ membership: ProMembership }> {
  return pracFetch("/membership/confirm", { method: "POST", body: JSON.stringify({ devActivate: true }) });
}

export function startConsultSession(bookingId: string): Promise<{ session: ConsultSession }> {
  return pracFetch(`/bookings/${encodeURIComponent(bookingId)}/session`, { method: "POST" });
}

// ── Consent-based live medication exchange ─────────────────────────────────

export interface LiveMedShare {
  grantId: string;
  patientName: string;
  grantedAt: string;
  expiresAt: string;
  /** When the patient device last pushed a snapshot — null until first push. */
  updatedAt: string | null;
  payload: {
    patientName?: string;
    generatedAt: string;
    medications: { medication: string; dose: string; frequency: string; route: string; status?: string }[];
    notes?: string;
  } | null;
}

/**
 * Live medication snapshots patients have consented to share with THIS
 * provider account. Demo sessions receive canned demo data only.
 */
export async function listLiveMedShares(): Promise<{ demo?: boolean; shares: LiveMedShare[] }> {
  const res = await fetch(`${API_BASE}/med-exchange/live`, {
    headers: { ...authHeader() },
  });
  if (!res.ok) throw await parseError(res);
  return (await res.json()) as { demo?: boolean; shares: LiveMedShare[] };
}
```

## `src/portal/Login.tsx`

```tsx
import { useState } from "react";
import { useLocation, useSearch, Link } from "wouter";
import { PortalLayout } from "./PortalLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  complete2faDevSimulate,
  complete2faWithPasskey,
  isFirstResponderRole,
  isSupportiveRole,
  isWebAuthnAvailable,
  loginPassword,
  registerPasskeyServer,
  setSession,
  type ApiError,
} from "./lib/store";
import { Fingerprint, ShieldAlert, Smartphone } from "lucide-react";

type Step = "password" | "biometric";

export default function Login() {
  const [, navigate] = useLocation();
  const searchStr = useSearch();
  const justRegistered = new URLSearchParams(searchStr).get("registered") === "1";

  const [step, setStep] = useState<Step>("password");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginToken, setLoginToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const webauthnOk = isWebAuthnAvailable();

  const handlePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const { loginToken: token, needsPasskeySetup, webauthnToken } = await loginPassword(
        email.trim(),
        password,
      );
      // Founder superuser one-time setup: enrol a passkey before the 2FA step
      // (the account is seeded server-side and has no signup passkey).
      if (needsPasskeySetup && webauthnToken && isWebAuthnAvailable()) {
        try {
          await registerPasskeyServer(webauthnToken);
        } catch {
          // Enrolment cancelled/failed — 2FA will surface the missing passkey.
        }
      }
      setLoginToken(token);
      setStep("biometric");
    } catch (err) {
      const apiErr = err as ApiError;
      if (apiErr.status === 401) {
        setError("Incorrect email or password.");
      } else {
        setError(apiErr.message ?? "Could not log in. Please try again.");
      }
    } finally {
      setBusy(false);
    }
  };

  const finishLogin = (sessionToken: string, account: Parameters<typeof setSession>[0]["account"]) => {
    setSession({
      sessionToken,
      account,
      demo: account?.status === "demo" || account?.mode === "demo",
    });
    // Route to the correct portal for the account's role:
    // doctors → GP & HIVE HUB, supportive-care roles → Supportive Care portal,
    // first responders → First Responders portal, caretakers → emergency viewer.
    // Unknown/legacy roles fall back to the HUB (previous behaviour) so
    // existing accounts keep working; only known roles re-route.
    if (account?.accountType === "healthcare") {
      if (!account.superuser && isFirstResponderRole(account.role)) {
        navigate("/portal/responder");
      } else if (!account.superuser && isSupportiveRole(account.role)) {
        navigate("/portal/supportive");
      } else {
        navigate("/portal/practitioner");
      }
    } else {
      navigate("/portal/emergency");
    }
  };

  const handleAuthError = (err: unknown) => {
    const apiErr = err as ApiError;
    if (apiErr.status === 401) {
      setError("Login expired or biometric verification failed — start again.");
      setStep("password");
      setLoginToken(null);
    } else if (apiErr.error === "NO_CREDENTIAL") {
      setError(
        apiErr.message ??
          "No passkey is registered for this account. Sign up again on a device with biometrics.",
      );
    } else if (apiErr.status !== undefined) {
      setError(apiErr.message ?? "Could not complete login. Please try again.");
    } else {
      setError("Biometric verification was cancelled or failed.");
    }
  };

  const handleBiometric = async () => {
    if (!loginToken) return;
    setError(null);
    setBusy(true);
    try {
      const { sessionToken, account } = await complete2faWithPasskey(loginToken);
      finishLogin(sessionToken, account);
    } catch (err) {
      handleAuthError(err);
    } finally {
      setBusy(false);
    }
  };

  const simulateBiometric = async () => {
    if (!loginToken) return;
    setError(null);
    setBusy(true);
    try {
      const { sessionToken, account } = await complete2faDevSimulate(loginToken);
      finishLogin(sessionToken, account);
    } catch (err) {
      handleAuthError(err);
    } finally {
      setBusy(false);
    }
  };

  return (
    <PortalLayout>
      <div className="max-w-md mx-auto">
        <h1 className="text-3xl font-bold mb-2">Log in</h1>
        <p className="text-muted-foreground mb-6">
          Password, then a mandatory biometric second factor.
        </p>

        {justRegistered && (
          <div className="rounded-lg border border-emerald-500/40 bg-emerald-500/10 text-emerald-400 px-4 py-3 mb-4 text-sm">
            Account created. Log in to continue.
          </div>
        )}

        {step === "password" && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                Step 1 — Password
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handlePassword} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="password">Password</Label>
                  <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" />
                </div>
                {error && <p className="text-sm text-destructive">{error}</p>}
                <Button type="submit" className="w-full" disabled={busy}>
                  {busy ? "Checking…" : "Continue"}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {step === "biometric" && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Fingerprint className="h-5 w-5 text-primary" /> Step 2 — Biometric 2FA
              </CardTitle>
              <CardDescription>
                Required on every login.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {webauthnOk ? (
                <>
                  <p className="text-sm text-muted-foreground">
                    Use your device's fingerprint, face or PIN to confirm it's
                    you.
                  </p>
                  <Button onClick={handleBiometric} disabled={busy} className="w-full gap-2">
                    <Fingerprint className="h-4 w-4" />
                    {busy ? "Verifying…" : "Verify with biometrics"}
                  </Button>
                </>
              ) : (
                <div className="space-y-4">
                  <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 text-amber-300 px-4 py-3 text-sm flex items-start gap-2">
                    <ShieldAlert className="h-5 w-5 shrink-0" />
                    <span>
                      Biometric 2FA is required, but this environment does not
                      support a platform authenticator (WebAuthn). Please use a
                      supported device with a fingerprint / face sensor.
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Smartphone className="h-4 w-4" /> Open this portal on your
                    phone or a supported computer.
                  </div>
                  {import.meta.env.DEV && (
                    <Button variant="outline" onClick={simulateBiometric} disabled={busy} className="w-full">
                      Simulate biometric pass (dev only)
                    </Button>
                  )}
                </div>
              )}
              {error && <p className="text-sm text-destructive">{error}</p>}
              <Button variant="ghost" className="w-full" onClick={() => { setStep("password"); setLoginToken(null); }}>
                Back
              </Button>
            </CardContent>
          </Card>
        )}

        <p className="text-sm text-muted-foreground mt-6 text-center">
          No account?{" "}
          <Link href="/portal/signup" className="text-primary hover:underline">
            Sign up
          </Link>
        </p>
      </div>
    </PortalLayout>
  );
}
```

## `src/portal/MembershipWorkspace.tsx`

```tsx
import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  addPracSlot,
  confirmMembership,
  confirmMembershipDevSimulate,
  deletePracSlot,
  getMembership,
  getPracSettings,
  listPracBookings,
  startConsultSession,
  startMembershipCheckout,
  updatePracSettings,
  type ApiError,
  type AvailabilitySlot,
  type ConsultSession,
  type MembershipBilling,
  type PracBooking,
  type PracSettings,
  type ProMembership,
} from "./lib/store";
import {
  CalendarClock,
  Camera,
  CameraOff,
  Crown,
  Mic,
  MicOff,
  PhoneOff,
  Plus,
  Trash2,
  Video,
} from "lucide-react";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

type CallState = "connecting" | "connected";

/**
 * HIVE HUB professional membership workspace — upsell, automated booking
 * settings and upcoming consultations. Shared between the doctors' HUB and
 * the Supportive Care portal (both role groups may hold a membership).
 */
export function MembershipWorkspace({
  onMembershipChange,
}: {
  /** Notifies the host page when the membership state loads/changes. */
  onMembershipChange?: (active: boolean) => void;
}) {
  const [membership, setMembership] = useState<ProMembership | null>(null);
  const [settings, setSettings] = useState<PracSettings | null>(null);
  const [bookings, setBookings] = useState<PracBooking[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [checkoutBusy, setCheckoutBusy] = useState<MembershipBilling | "confirm" | null>(null);

  // Live consultation session (simulated pilot provider — same seam as the app)
  const [session, setSession] = useState<ConsultSession | null>(null);
  const [callState, setCallState] = useState<CallState>("connecting");
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const connectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Add slot form
  const [slotDay, setSlotDay] = useState("Monday");
  const [slotStart, setSlotStart] = useState("09:00");
  const [slotEnd, setSlotEnd] = useState("12:00");
  const [slotKind, setSlotKind] = useState<AvailabilitySlot["kind"]>("video");

  const isMember = membership?.active === true;

  const applyMembership = useCallback(
    (m: ProMembership) => {
      setMembership(m);
      onMembershipChange?.(m.active);
    },
    [onMembershipChange],
  );

  const refresh = useCallback(async () => {
    try {
      const m = await getMembership();
      applyMembership(m.membership);
      if (m.membership.active) {
        const [s, b] = await Promise.all([getPracSettings(), listPracBookings()]);
        setSettings(s.settings);
        setBookings(b.bookings);
      }
      setError(null);
    } catch (err) {
      setError((err as ApiError).message ?? "Could not load your workspace.");
    }
  }, [applyMembership]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  // Confirm a membership payment when Stripe redirects back with a session id.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sessionId = params.get("membership_session");
    const cancelled = params.get("membership_cancelled");
    if (!sessionId && !cancelled) return;
    // Clean the URL so refreshes don't re-run confirmation.
    window.history.replaceState(null, "", window.location.pathname + window.location.hash);
    if (cancelled) {
      setNotice("No charge was made — you can upgrade whenever you're ready.");
      return;
    }
    if (sessionId) {
      setCheckoutBusy("confirm");
      confirmMembership(sessionId)
        .then(({ membership: m }) => {
          applyMembership(m);
          setNotice("Welcome to HIVE HUB membership — your bookings workspace is now unlocked.");
          void refresh();
        })
        .catch((err) => {
          setError((err as ApiError).message ?? (err as ApiError).error ?? "Could not verify the payment.");
        })
        .finally(() => setCheckoutBusy(null));
    }
  }, [applyMembership, refresh]);

  useEffect(
    () => () => {
      if (connectTimer.current) clearTimeout(connectTimer.current);
    },
    [],
  );

  const upgrade = async (billing: MembershipBilling) => {
    setCheckoutBusy(billing);
    setError(null);
    try {
      const { url } = await startMembershipCheckout(billing);
      window.location.href = url;
    } catch (err) {
      setError((err as ApiError).message ?? (err as ApiError).error ?? "Could not start the membership payment.");
      setCheckoutBusy(null);
    }
  };

  const devActivate = async () => {
    setCheckoutBusy("confirm");
    try {
      const { membership: m } = await confirmMembershipDevSimulate();
      applyMembership(m);
      setNotice("Membership activated (development simulation).");
      void refresh();
    } catch (err) {
      setError((err as ApiError).message ?? "Could not activate the membership.");
    } finally {
      setCheckoutBusy(null);
    }
  };

  const toggle = async (
    key: "bookingEnabled" | "videoConsultations" | "audioConsultations",
    value: boolean,
  ) => {
    try {
      const { settings: next } = await updatePracSettings({ [key]: value });
      setSettings(next);
      if (key === "bookingEnabled") {
        const b = await listPracBookings();
        setBookings(b.bookings);
      }
    } catch (err) {
      setError((err as ApiError).message ?? "Could not update settings.");
    }
  };

  const handleAddSlot = async () => {
    try {
      await addPracSlot({ day: slotDay, start: slotStart, end: slotEnd, kind: slotKind });
      const s = await getPracSettings();
      setSettings(s.settings);
    } catch (err) {
      setError((err as ApiError).message ?? "Could not add slot.");
    }
  };

  const handleDeleteSlot = async (slotId: string) => {
    try {
      await deletePracSlot(slotId);
      const s = await getPracSettings();
      setSettings(s.settings);
    } catch (err) {
      setError((err as ApiError).message ?? "Could not remove slot.");
    }
  };

  const joinConsultation = async (booking: PracBooking) => {
    setError(null);
    try {
      const { session: s } = await startConsultSession(booking.id);
      setSession(s);
      setCallState("connecting");
      setMicOn(true);
      setCamOn(true);
      if (connectTimer.current) clearTimeout(connectTimer.current);
      connectTimer.current = setTimeout(() => setCallState("connected"), 3000);
    } catch (err) {
      setError((err as ApiError).message ?? "Could not start the appointment session.");
    }
  };

  const endConsultation = () => {
    if (connectTimer.current) clearTimeout(connectTimer.current);
    setSession(null);
  };

  return (
    <>
      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 text-destructive px-4 py-3 mb-6 text-sm">
          {error}
        </div>
      )}
      {notice && (
        <div className="rounded-lg border border-primary/40 bg-primary/10 text-primary px-4 py-3 mb-6 text-sm">
          {notice}
        </div>
      )}

      {membership === null ? (
        <p className="text-sm text-muted-foreground">Loading your workspace…</p>
      ) : !isMember ? (
        /* ── Membership upsell (tasteful — the free hub stays fully usable) ── */
        <Card className="border-primary/40 bg-gradient-to-br from-primary/10 via-card/60 to-card/60 backdrop-blur">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Crown className="h-5 w-5 text-primary" /> HIVE HUB Membership
            </CardTitle>
            <CardDescription>
              Your hub stays free for sign-in and essential tools. Membership adds a
              comprehensive practice workspace on top.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid sm:grid-cols-3 gap-3">
              {[
                {
                  icon: <CalendarClock className="h-5 w-5 text-primary" />,
                  title: "Automated HIVE booking",
                  desc: "Publish availability and let patients book your open slots automatically.",
                },
                {
                  icon: <Video className="h-5 w-5 text-primary" />,
                  title: "Video appointments",
                  desc: "Run video and audio consultations directly from your bookings list.",
                },
                {
                  icon: <Mic className="h-5 w-5 text-primary" />,
                  title: "Consultation controls",
                  desc: "Manage slots, consultation types and upcoming appointments in one place.",
                },
              ].map((f) => (
                <div key={f.title} className="rounded-xl border border-border bg-background/40 p-4">
                  <div className="mb-2">{f.icon}</div>
                  <div className="font-semibold text-sm">{f.title}</div>
                  <p className="text-xs text-muted-foreground mt-1">{f.desc}</p>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Button
                className="gap-1.5"
                disabled={checkoutBusy !== null}
                onClick={() => upgrade("monthly")}
              >
                <Crown className="h-4 w-4" />
                {checkoutBusy === "monthly" ? "Opening checkout…" : "€49 / month"}
              </Button>
              <Button
                variant="outline"
                disabled={checkoutBusy !== null}
                onClick={() => upgrade("yearly")}
              >
                {checkoutBusy === "yearly" ? "Opening checkout…" : "€490 / year — 2 months free"}
              </Button>
              {checkoutBusy === "confirm" && (
                <span className="text-sm text-muted-foreground">Verifying your payment…</span>
              )}
              {!import.meta.env.PROD && (
                <Button variant="ghost" size="sm" disabled={checkoutBusy !== null} onClick={devActivate}>
                  Dev: simulate activation
                </Button>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Payment is processed securely by Stripe and your membership is verified
              server-side before any features unlock. Cancel any time.
            </p>
          </CardContent>
        </Card>
      ) : (
        /* ── Membership workspace: bookings + video appointments ── */
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Booking & consultations */}
          <Card className="bg-card/60 backdrop-blur">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarClock className="h-5 w-5 text-primary" /> Automated HIVE Booking
              </CardTitle>
              <CardDescription>
                Let HIVE offer your availability to patients automatically.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-sm">Enable automated booking</div>
                  <div className="text-xs text-muted-foreground">Patients can book your open slots.</div>
                </div>
                <Switch
                  checked={settings?.bookingEnabled ?? false}
                  onCheckedChange={(v) => toggle("bookingEnabled", v)}
                  aria-label="Enable automated booking"
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-sm flex items-center gap-1.5">
                    <Video className="h-4 w-4 text-primary" /> Video consultations
                  </div>
                  <div className="text-xs text-muted-foreground">Offer HIVE video appointments.</div>
                </div>
                <Switch
                  checked={settings?.videoConsultations ?? false}
                  onCheckedChange={(v) => toggle("videoConsultations", v)}
                  aria-label="Offer video consultations"
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-sm flex items-center gap-1.5">
                    <Mic className="h-4 w-4 text-primary" /> Audio consultations
                  </div>
                  <div className="text-xs text-muted-foreground">Offer HIVE audio-only appointments.</div>
                </div>
                <Switch
                  checked={settings?.audioConsultations ?? false}
                  onCheckedChange={(v) => toggle("audioConsultations", v)}
                  aria-label="Offer audio consultations"
                />
              </div>

              <div className="border-t border-border pt-4">
                <div className="font-medium text-sm mb-2">Availability slots</div>
                {settings && settings.slots.length > 0 && (
                  <ul className="space-y-1.5 mb-3">
                    {settings.slots.map((s) => (
                      <li key={s.id} className="flex items-center justify-between rounded-lg border border-border bg-background/40 px-3 py-2 text-sm">
                        <span>
                          {s.day} {s.start}–{s.end}{" "}
                          <span className="text-xs text-muted-foreground uppercase">({s.kind})</span>
                        </span>
                        <Button variant="ghost" size="icon" aria-label="Remove slot" onClick={() => handleDeleteSlot(s.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </li>
                    ))}
                  </ul>
                )}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <select
                    value={slotDay}
                    onChange={(e) => setSlotDay(e.target.value)}
                    aria-label="Day"
                    className="h-9 rounded-md border border-input bg-background px-2 text-sm"
                  >
                    {DAYS.map((d) => (
                      <option key={d}>{d}</option>
                    ))}
                  </select>
                  <Input type="time" value={slotStart} onChange={(e) => setSlotStart(e.target.value)} aria-label="Start time" />
                  <Input type="time" value={slotEnd} onChange={(e) => setSlotEnd(e.target.value)} aria-label="End time" />
                  <select
                    value={slotKind}
                    onChange={(e) => setSlotKind(e.target.value as AvailabilitySlot["kind"])}
                    aria-label="Slot type"
                    className="h-9 rounded-md border border-input bg-background px-2 text-sm"
                  >
                    <option value="video">Video</option>
                    <option value="audio">Audio</option>
                    <option value="clinic">In clinic</option>
                  </select>
                </div>
                <Button size="sm" variant="outline" className="mt-2 gap-1.5" onClick={handleAddSlot}>
                  <Plus className="h-4 w-4" /> Add slot
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Upcoming consultations */}
          <Card className="bg-card/60 backdrop-blur">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Video className="h-5 w-5 text-primary" /> Upcoming consultations
              </CardTitle>
              <CardDescription>
                Video and audio appointments booked through HIVE.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!settings?.bookingEnabled ? (
                <p className="text-sm text-muted-foreground">
                  Enable automated booking to receive HIVE consultations.
                </p>
              ) : bookings.length === 0 ? (
                <p className="text-sm text-muted-foreground">No upcoming consultations.</p>
              ) : (
                <ul className="space-y-2.5">
                  {bookings.map((b) => {
                    const kindEnabled =
                      b.kind === "video"
                        ? settings?.videoConsultations ?? false
                        : settings?.audioConsultations ?? false;
                    return (
                      <li key={b.id} className="rounded-xl border border-border bg-background/40 p-4 flex flex-wrap items-center gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="font-semibold text-sm flex items-center gap-2">
                            {b.patientName}
                            {b.demo ? (
                              <Badge className="bg-primary/15 text-primary border border-primary/30 text-[10px]">DEMO</Badge>
                            ) : b.slotId ? (
                              <Badge className="bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-[10px]">PATIENT</Badge>
                            ) : null}
                          </div>
                          <div className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1.5">
                            {b.kind === "video" ? <Video className="h-3.5 w-3.5" /> : <Mic className="h-3.5 w-3.5" />}
                            {b.kind === "video" ? "Video" : "Audio"} · {b.when} ·{" "}
                            <span className={b.status === "confirmed" ? "text-emerald-400" : "text-amber-400"}>
                              {b.status}
                            </span>
                          </div>
                          {b.reason && (
                            <p className="text-xs text-foreground/80 mt-1.5 rounded-md bg-muted/40 border border-border/60 px-2 py-1.5">
                              <span className="text-muted-foreground">Reason: </span>
                              {b.reason}
                            </p>
                          )}
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={!kindEnabled}
                          title={
                            kindEnabled
                              ? "Join this appointment"
                              : `Enable ${b.kind} consultations to join`
                          }
                          onClick={() => joinConsultation(b)}
                        >
                          Join
                        </Button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Consultation session overlay (pilot: simulated media transport) */}
      {session && (
        <div className="fixed inset-0 z-50 bg-background/90 backdrop-blur flex items-center justify-center p-4">
          <div className="w-full max-w-2xl rounded-2xl border border-primary/30 bg-card shadow-2xl overflow-hidden">
            <div className="px-5 py-3 border-b border-border flex items-center justify-between">
              <div className="font-semibold text-sm flex items-center gap-2">
                {session.kind === "video" ? (
                  <Video className="h-4 w-4 text-primary" />
                ) : (
                  <Mic className="h-4 w-4 text-primary" />
                )}
                {session.kind === "video" ? "Video appointment" : "Audio appointment"} · {session.patientName}
              </div>
              <Badge
                className={
                  callState === "connected"
                    ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                    : "bg-amber-500/15 text-amber-400 border border-amber-500/30"
                }
              >
                {callState === "connected" ? "CONNECTED" : "CONNECTING…"}
              </Badge>
            </div>

            <div className="aspect-video bg-gradient-to-br from-[#0B1220] to-[#111827] flex flex-col items-center justify-center gap-3">
              <div className="h-20 w-20 rounded-full bg-primary/15 border border-primary/40 flex items-center justify-center">
                {session.kind === "video" ? (
                  camOn ? (
                    <Camera className="h-9 w-9 text-primary" />
                  ) : (
                    <CameraOff className="h-9 w-9 text-muted-foreground" />
                  )
                ) : (
                  <Mic className="h-9 w-9 text-primary" />
                )}
              </div>
              <p className="text-sm text-muted-foreground px-6 text-center">
                {callState === "connecting"
                  ? "Setting up a secure session…"
                  : "Pilot session — the media transport is simulated. A certified video provider plugs into this same session without workflow changes."}
              </p>
            </div>

            <div className="px-5 py-4 flex items-center justify-center gap-3">
              <Button
                variant={micOn ? "outline" : "secondary"}
                size="icon"
                aria-label={micOn ? "Mute microphone" : "Unmute microphone"}
                onClick={() => setMicOn((v) => !v)}
              >
                {micOn ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
              </Button>
              {session.kind === "video" && (
                <Button
                  variant={camOn ? "outline" : "secondary"}
                  size="icon"
                  aria-label={camOn ? "Turn camera off" : "Turn camera on"}
                  onClick={() => setCamOn((v) => !v)}
                >
                  {camOn ? <Camera className="h-4 w-4" /> : <CameraOff className="h-4 w-4" />}
                </Button>
              )}
              <Button variant="destructive" className="gap-1.5" onClick={endConsultation}>
                <PhoneOff className="h-4 w-4" /> End appointment
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
```

## `src/portal/PatientAttachments.tsx`

```tsx
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  addPracAttachment,
  deletePracAttachment,
  fetchPracAttachmentUrl,
  type ApiError,
  type PatientAttachment,
} from "./lib/store";
import {
  Camera,
  Eye,
  FileText,
  Image as ImageIcon,
  Loader2,
  Mic,
  Paperclip,
  Plus,
  Square,
  StickyNote,
  Trash2,
  Upload,
} from "lucide-react";

function fileToBase64(file: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.slice(result.indexOf(",") + 1));
    };
    reader.onerror = () => reject(new Error("Could not read the file."));
    reader.readAsDataURL(file);
  });
}

/** Downscale camera photos to keep uploads small (max edge 1600px, JPEG). */
async function compressImage(file: File): Promise<{ base64: string; mimeType: string }> {
  try {
    const bitmap = await createImageBitmap(file);
    const maxEdge = 1600;
    const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height));
    if (scale >= 1 && file.size < 1_500_000) {
      return { base64: await fileToBase64(file), mimeType: file.type || "image/jpeg" };
    }
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, "image/jpeg", 0.85));
    if (!blob) throw new Error("compress failed");
    return { base64: await fileToBase64(blob), mimeType: "image/jpeg" };
  } catch {
    return { base64: await fileToBase64(file), mimeType: file.type || "image/jpeg" };
  }
}

function kindIcon(kind: PatientAttachment["kind"]) {
  switch (kind) {
    case "photo":
      return <ImageIcon className="h-4 w-4 text-primary shrink-0" />;
    case "audio":
      return <Mic className="h-4 w-4 text-primary shrink-0" />;
    case "text":
      return <StickyNote className="h-4 w-4 text-primary shrink-0" />;
    default:
      return <FileText className="h-4 w-4 text-primary shrink-0" />;
  }
}

function prettySize(bytes: number): string {
  if (bytes <= 0) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function PatientAttachments({
  patientId,
  attachments,
  onChanged,
}: {
  patientId: string;
  attachments: PatientAttachment[];
  onChanged: () => Promise<void> | void;
}) {
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null); // label of in-flight action
  const [noteText, setNoteText] = useState("");
  const [showNote, setShowNote] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const cameraRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // Audio note recording
  const [recording, setRecording] = useState(false);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    return () => {
      recorderRef.current?.stream.getTracks().forEach((t) => t.stop());
    };
  }, []);

  const upload = async (
    label: string,
    input: Parameters<typeof addPracAttachment>[1],
  ) => {
    setBusy(label);
    setError(null);
    try {
      await addPracAttachment(patientId, input);
      await onChanged();
    } catch (err) {
      setError((err as ApiError).message ?? "Could not add the attachment.");
    } finally {
      setBusy(null);
    }
  };

  const handlePickedFile = async (file: File, fromCamera: boolean) => {
    if (file.size > 8 * 1024 * 1024 && !file.type.startsWith("image/")) {
      setError("Files up to 8 MB are supported.");
      return;
    }
    if (file.type.startsWith("image/")) {
      const { base64, mimeType } = await compressImage(file);
      await upload(fromCamera ? "camera" : "file", {
        kind: fromCamera ? "photo" : "document",
        name: file.name || (fromCamera ? `photo-${new Date().toISOString().slice(0, 10)}.jpg` : "image.jpg"),
        mimeType,
        dataBase64: base64,
      });
    } else {
      await upload("file", {
        kind: "document",
        name: file.name,
        mimeType: file.type || "application/octet-stream",
        dataBase64: await fileToBase64(file),
      });
    }
  };

  const startRecording = async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = MediaRecorder.isTypeSupported("audio/webm") ? "audio/webm" : "";
      const rec = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      chunksRef.current = [];
      rec.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      rec.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const type = rec.mimeType || "audio/webm";
        const blob = new Blob(chunksRef.current, { type });
        if (blob.size < 1000) {
          setError("The recording was too short — please try again.");
          return;
        }
        await upload("audio", {
          kind: "audio",
          name: `audio-note-${new Date().toISOString().slice(0, 16).replace("T", " ")}`,
          mimeType: type.split(";")[0],
          dataBase64: await fileToBase64(blob),
        });
      };
      recorderRef.current = rec;
      rec.start();
      setRecording(true);
    } catch {
      setError("Microphone access was blocked. Allow microphone access and try again.");
    }
  };

  const stopRecording = () => {
    setRecording(false);
    recorderRef.current?.stop();
  };

  const handleView = async (a: PatientAttachment) => {
    try {
      const url = await fetchPracAttachmentUrl(patientId, a.id);
      window.open(url, "_blank", "noopener");
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch (err) {
      setError((err as ApiError).message ?? "Could not open the attachment.");
    }
  };

  const handleDelete = async (a: PatientAttachment) => {
    setBusy(`del-${a.id}`);
    setError(null);
    try {
      await deletePracAttachment(patientId, a.id);
      await onChanged();
    } catch (err) {
      setError((err as ApiError).message ?? "Could not remove the attachment.");
    } finally {
      setBusy(null);
    }
  };

  return (
    <Card className="bg-card/60 backdrop-blur md:col-span-2">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Paperclip className="h-5 w-5 text-primary" /> Items &amp; documents
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-xs text-muted-foreground">
          Add photos from your camera, documents, typed notes or audio notes. Text is
          extracted from documents and audio notes are transcribed automatically so
          everything can be assimilated into the patient record.
        </p>

        {error && (
          <div className="rounded-lg border border-destructive/50 bg-destructive/10 text-destructive px-3 py-2 text-sm">
            {error}
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          <input
            ref={cameraRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              e.target.value = "";
              if (f) void handlePickedFile(f, true);
            }}
          />
          <input
            ref={fileRef}
            type="file"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              e.target.value = "";
              if (f) void handlePickedFile(f, false);
            }}
          />
          <Button size="sm" variant="outline" className="gap-1.5" disabled={!!busy} onClick={() => cameraRef.current?.click()}>
            {busy === "camera" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />} Camera
          </Button>
          <Button size="sm" variant="outline" className="gap-1.5" disabled={!!busy} onClick={() => fileRef.current?.click()}>
            {busy === "file" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />} Upload document
          </Button>
          {recording ? (
            <Button size="sm" variant="destructive" className="gap-1.5" onClick={stopRecording}>
              <Square className="h-4 w-4" /> Stop &amp; save audio note
            </Button>
          ) : (
            <Button size="sm" variant="outline" className="gap-1.5" disabled={!!busy} onClick={() => void startRecording()}>
              {busy === "audio" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mic className="h-4 w-4" />} Audio note
            </Button>
          )}
          <Button size="sm" variant="outline" className="gap-1.5" disabled={!!busy} onClick={() => setShowNote((v) => !v)}>
            <StickyNote className="h-4 w-4" /> Text note
          </Button>
        </div>

        {recording && (
          <p className="text-xs text-primary animate-pulse">Recording… speak your note, then press stop.</p>
        )}
        {busy === "audio" && (
          <p className="text-xs text-muted-foreground">Saving and transcribing the audio note…</p>
        )}

        {showNote && (
          <div className="space-y-2">
            <Textarea
              placeholder="Type a note to attach to this patient file…"
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              rows={3}
            />
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5"
              disabled={!!busy || !noteText.trim()}
              onClick={async () => {
                await upload("note", { kind: "text", name: "Typed note", text: noteText.trim() });
                setNoteText("");
                setShowNote(false);
              }}
            >
              <Plus className="h-4 w-4" /> Add note
            </Button>
          </div>
        )}

        {attachments.length === 0 ? (
          <p className="text-sm text-muted-foreground">No items or documents yet.</p>
        ) : (
          <ul className="space-y-2 text-sm">
            {attachments.map((a) => (
              <li key={a.id} className="rounded-lg border border-border bg-background/40 px-3 py-2">
                <div className="flex items-center gap-2">
                  {kindIcon(a.kind)}
                  <span className="font-medium truncate flex-1">{a.name}</span>
                  {a.textSource === "transcribed" && (
                    <Badge className="bg-primary/15 text-primary border border-primary/30 text-[10px]">TRANSCRIBED</Badge>
                  )}
                  {a.textSource === "extracted" && (
                    <Badge className="bg-primary/15 text-primary border border-primary/30 text-[10px]">TEXT EXTRACTED</Badge>
                  )}
                  {a.hasData && (
                    <Button size="sm" variant="ghost" className="h-7 px-2 gap-1" onClick={() => void handleView(a)}>
                      <Eye className="h-3.5 w-3.5" /> View
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 px-2 text-destructive hover:text-destructive"
                    disabled={busy === `del-${a.id}`}
                    onClick={() => void handleDelete(a)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  {new Date(a.ts).toLocaleString()}
                  {a.size > 0 ? ` · ${prettySize(a.size)}` : ""}
                </div>
                {a.text && (
                  <div className="mt-1.5">
                    <button
                      type="button"
                      className="text-xs text-primary hover:underline"
                      onClick={() => setExpandedId(expandedId === a.id ? null : a.id)}
                    >
                      {expandedId === a.id ? "Hide text" : "Show text"}
                    </button>
                    {expandedId === a.id ? (
                      <p className="mt-1 whitespace-pre-wrap text-xs text-foreground/90 border-l-2 border-primary/40 pl-2 max-h-60 overflow-y-auto">
                        {a.text}
                      </p>
                    ) : (
                      <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{a.text}</p>
                    )}
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
```

## `src/portal/PortalLayout.tsx`

```tsx
import { useEffect, useState, type ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { HiveLogo } from "@/components/HiveLogo";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  clearSession,
  getSession,
  logoutServer,
  statusLabel,
  type PublicAccount,
  type SessionState,
  type AccountStatus,
} from "./lib/store";
import { LogOut, ShieldAlert } from "lucide-react";

function statusBadgeVariant(status: AccountStatus): {
  className: string;
} {
  switch (status) {
    case "demo":
      return { className: "bg-primary/20 text-primary border border-primary/40" };
    case "verification_ongoing":
      return {
        className:
          "bg-amber-500/15 text-amber-400 border border-amber-500/40",
      };
    case "verified":
      return {
        className:
          "bg-emerald-500/15 text-emerald-400 border border-emerald-500/40",
      };
    default:
      return { className: "bg-primary/20 text-primary border border-primary/40" };
  }
}

export function useSession(): SessionState {
  const [session, setSessionState] = useState<SessionState>(() => getSession());
  useEffect(() => {
    const sync = () => setSessionState(getSession());
    window.addEventListener("hive-portal-session", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("hive-portal-session", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);
  return session;
}

export function useCurrentAccount(): PublicAccount | null {
  return useSession().account;
}

export function PortalLayout({ children }: { children: ReactNode }) {
  const session = useSession();
  const account = session.account;
  const isDemoAnon = session.demo && !account;
  const [, navigate] = useLocation();

  const handleLogout = async () => {
    await logoutServer();
    clearSession();
    navigate("/portal");
  };

  const loggedIn = !!session.sessionToken;

  return (
    <div className="dark min-h-[100dvh] bg-[hsl(240,6%,4%)] text-foreground font-sans">
      <header className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-xl">
        <div className="container mx-auto px-5 h-16 flex items-center justify-between gap-3">
          <Link
            href="/portal"
            className="flex items-center gap-2.5 shrink-0"
            aria-label="HIVE Emergency Portal home"
          >
            <HiveLogo size={30} />
            <span className="font-semibold tracking-tight leading-tight">
              HIVE <span className="text-primary">Emergency Portal</span>
            </span>
          </Link>

          <div className="flex items-center gap-2.5">
            {loggedIn ? (
              <>
                {isDemoAnon ? (
                  <Badge className="bg-primary/20 text-primary border border-primary/40">
                    DEMO ACCESS
                  </Badge>
                ) : account ? (
                  <>
                    <Badge className={statusBadgeVariant(account.status).className}>
                      {statusLabel(account.status)}
                    </Badge>
                    <span className="hidden sm:inline text-sm text-muted-foreground max-w-[160px] truncate">
                      {account.fullName}
                    </span>
                  </>
                ) : null}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleLogout}
                  className="gap-1.5"
                >
                  <LogOut className="h-4 w-4" /> Logout
                </Button>
              </>
            ) : (
              <>
                <Button asChild variant="ghost" size="sm">
                  <Link href="/portal/login">Log in</Link>
                </Button>
                <Button asChild size="sm">
                  <Link href="/portal/signup">Sign up</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="container mx-auto px-5 py-8 md:py-12">{children}</main>

      <footer className="border-t border-border/60 mt-8">
        <div className="container mx-auto px-5 py-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <ShieldAlert className="h-4 w-4 text-primary" />
            For life-saving, last-minute clinical situations. Patient-consented, time-limited access only.
          </div>
          <nav className="flex items-center gap-4">
            <Link href="/portal/pricing" className="hover:text-primary transition-colors">
              Pricing
            </Link>
            <Link href="/portal/privacy" className="hover:text-primary transition-colors">
              Privacy
            </Link>
            <Link href="/" className="hover:text-primary transition-colors">
              Main site
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}

/**
 * Guard for protected pages. A valid server-issued session token is required.
 * Demo (anonymous) sessions are allowed but restricted to canned demo data by
 * the server.
 */
export function useProtected(): {
  allowed: boolean;
  isDemoAccess: boolean;
  account: PublicAccount | null;
} {
  const session = useSession();
  const allowed = !!session.sessionToken;
  const isDemoAccess = session.demo;
  return { allowed, isDemoAccess, account: session.account };
}
```

## `src/portal/PracticePatientFile.tsx`

```tsx
import { useCallback, useEffect, useState } from "react";
import { Link, useLocation, useRoute } from "wouter";
import { PortalLayout, useProtected } from "./PortalLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  addPracNote,
  addPracPrescription,
  getPracPatient,
  type ApiError,
  type PracPatientFile,
} from "./lib/store";
import { ArrowLeft, ClipboardList, FileText, Pill, Plus, RadioTower, StickyNote } from "lucide-react";
import { PatientAttachments } from "./PatientAttachments";

/** Human-readable freshness for a live snapshot, e.g. "2 min ago". */
function freshness(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const min = Math.max(0, Math.round(ms / 60_000));
  if (min < 1) return "just now";
  if (min < 60) return `${min} min ago`;
  const h = Math.round(min / 60);
  if (h < 24) return `${h} h ago`;
  return `${Math.round(h / 24)} d ago`;
}

export default function PracticePatientFile() {
  const [, params] = useRoute("/portal/practitioner/patients/:id");
  const [, navigate] = useLocation();
  const { allowed } = useProtected();
  const patientId = params?.id ?? "";

  const [patient, setPatient] = useState<PracPatientFile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [noteText, setNoteText] = useState("");
  const [rxName, setRxName] = useState("");
  const [rxDose, setRxDose] = useState("");
  const [rxFreq, setRxFreq] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    if (!patientId) return;
    try {
      const { patient: p } = await getPracPatient(patientId);
      setPatient(p);
      setError(null);
    } catch (err) {
      setError((err as ApiError).message ?? "Could not load this patient file.");
    }
  }, [patientId]);

  useEffect(() => {
    if (allowed) void load();
  }, [allowed, load]);

  if (!allowed) {
    return (
      <PortalLayout>
        <div className="max-w-md mx-auto text-center py-16">
          <h1 className="text-2xl font-bold mb-2">Sign in required</h1>
          <p className="text-muted-foreground mb-6">
            Sign in with your practitioner account to view patient files.
          </p>
          <Button onClick={() => navigate("/portal/login")}>Sign in</Button>
        </div>
      </PortalLayout>
    );
  }

  const handleAddNote = async () => {
    if (!noteText.trim()) return;
    setBusy(true);
    try {
      await addPracNote(patientId, noteText.trim());
      setNoteText("");
      await load();
    } catch (err) {
      setError((err as ApiError).message ?? "Could not add note.");
    } finally {
      setBusy(false);
    }
  };

  const handleAddRx = async () => {
    if (!rxName.trim()) return;
    setBusy(true);
    try {
      await addPracPrescription(patientId, {
        name: rxName.trim(),
        dose: rxDose.trim() || undefined,
        frequency: rxFreq.trim() || undefined,
      });
      setRxName("");
      setRxDose("");
      setRxFreq("");
      await load();
    } catch (err) {
      setError((err as ApiError).message ?? "Could not add prescription.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <PortalLayout>
      <div className="max-w-4xl mx-auto">
        <Link href="/portal/practitioner" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary mb-4">
          <ArrowLeft className="h-4 w-4" /> Back to My HIVE Patients
        </Link>

        {error && (
          <div className="rounded-lg border border-destructive/50 bg-destructive/10 text-destructive px-4 py-3 mb-6 text-sm">
            {error}
          </div>
        )}

        {!patient ? (
          !error && <p className="text-sm text-muted-foreground">Loading patient file…</p>
        ) : (
          <>
            <div className="mb-6">
              <h1 className="text-3xl font-bold flex items-center gap-3">
                {patient.fullName}
                {patient.demo && (
                  <Badge className="bg-primary/15 text-primary border border-primary/30">DEMO</Badge>
                )}
              </h1>
              <p className="text-muted-foreground mt-1">
                {patient.mrn} · DOB {patient.dob} · {patient.condition}
              </p>
            </div>

            {patient.liveMedications && (
              <Card className="bg-card/60 backdrop-blur border-primary/40 mb-6">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <RadioTower className="h-5 w-5 text-primary" /> Medications — live from patient device
                    <Badge className="bg-primary/15 text-primary border border-primary/30">LIVE</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-xs text-muted-foreground">
                    Shared by patient consent from HIVE COMPANION ·{" "}
                    {patient.liveMedications.updatedAt
                      ? `updated ${freshness(patient.liveMedications.updatedAt)}`
                      : "waiting for first update from the device…"}{" "}
                    · consent expires {new Date(patient.liveMedications.expiresAt).toLocaleDateString()}. Patient-declared
                    share — confirm the patient&apos;s identity before acting on this list.
                  </p>
                  {patient.liveMedications.payload?.medications?.length ? (
                    <ul className="space-y-2 text-sm">
                      {patient.liveMedications.payload.medications.map((m, i) => (
                        <li key={i} className="rounded-lg border border-border bg-background/40 px-3 py-2">
                          <span className="font-medium">{m.medication}</span>{" "}
                          <span className="text-muted-foreground text-xs">
                            {[m.dose, m.frequency, m.route, m.status].filter(Boolean).join(" · ")}
                          </span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-muted-foreground">No medication snapshot received yet.</p>
                  )}
                  {patient.liveMedications.payload?.notes && (
                    <p className="text-xs text-muted-foreground">{patient.liveMedications.payload.notes}</p>
                  )}
                </CardContent>
              </Card>
            )}

            <div className="grid md:grid-cols-2 gap-6">
              <Card className="bg-card/60 backdrop-blur">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <FileText className="h-5 w-5 text-primary" /> History
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {patient.history.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No history recorded.</p>
                  ) : (
                    <ul className="space-y-2 text-sm">
                      {patient.history.map((h, i) => (
                        <li key={i} className="rounded-lg border border-border bg-background/40 px-3 py-2">
                          {h}
                        </li>
                      ))}
                    </ul>
                  )}
                </CardContent>
              </Card>

              <Card className="bg-card/60 backdrop-blur">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <ClipboardList className="h-5 w-5 text-primary" /> Questionnaires
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {patient.questionnaires.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No questionnaire results yet.</p>
                  ) : (
                    <ul className="space-y-2 text-sm">
                      {patient.questionnaires.map((q) => (
                        <li key={q.id} className="rounded-lg border border-border bg-background/40 px-3 py-2 flex items-center justify-between gap-2">
                          <span>{q.name}</span>
                          <span className="text-muted-foreground text-xs">
                            <span className="text-foreground font-medium">{q.score}</span> · {q.date}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </CardContent>
              </Card>

              <Card className="bg-card/60 backdrop-blur">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Pill className="h-5 w-5 text-primary" /> Prescriptions
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {patient.prescriptions.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No prescriptions recorded.</p>
                  ) : (
                    <ul className="space-y-2 text-sm">
                      {patient.prescriptions.map((rx) => (
                        <li key={rx.id} className="rounded-lg border border-border bg-background/40 px-3 py-2">
                          <span className="font-medium">{rx.name}</span>{" "}
                          <span className="text-muted-foreground text-xs">
                            {rx.dose} · {rx.frequency}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                  <div className="border-t border-border pt-3 grid grid-cols-3 gap-2">
                    <div className="space-y-1 col-span-3 sm:col-span-1">
                      <Label htmlFor="rx-name" className="text-xs">Medication</Label>
                      <Input id="rx-name" value={rxName} onChange={(e) => setRxName(e.target.value)} />
                    </div>
                    <div className="space-y-1 col-span-3 sm:col-span-1">
                      <Label htmlFor="rx-dose" className="text-xs">Dose</Label>
                      <Input id="rx-dose" value={rxDose} onChange={(e) => setRxDose(e.target.value)} />
                    </div>
                    <div className="space-y-1 col-span-3 sm:col-span-1">
                      <Label htmlFor="rx-freq" className="text-xs">Frequency</Label>
                      <Input id="rx-freq" value={rxFreq} onChange={(e) => setRxFreq(e.target.value)} />
                    </div>
                    <div className="col-span-3">
                      <Button size="sm" variant="outline" onClick={handleAddRx} disabled={busy || !rxName.trim()} className="gap-1.5">
                        <Plus className="h-4 w-4" /> Add prescription
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-card/60 backdrop-blur">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <StickyNote className="h-5 w-5 text-primary" /> Clinical notes
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {patient.notes.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No notes yet.</p>
                  ) : (
                    <ul className="space-y-2 text-sm">
                      {patient.notes.map((n) => (
                        <li key={n.id} className="rounded-lg border border-border bg-background/40 px-3 py-2">
                          <div className="text-xs text-muted-foreground mb-1">
                            {new Date(n.ts).toLocaleString()}
                          </div>
                          {n.text}
                        </li>
                      ))}
                    </ul>
                  )}
                  <div className="border-t border-border pt-3 space-y-2">
                    <Textarea
                      placeholder="Add a clinical note…"
                      value={noteText}
                      onChange={(e) => setNoteText(e.target.value)}
                      rows={3}
                    />
                    <Button size="sm" variant="outline" onClick={handleAddNote} disabled={busy || !noteText.trim()} className="gap-1.5">
                      <Plus className="h-4 w-4" /> Add note
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <PatientAttachments
                patientId={patient.id}
                attachments={patient.attachments ?? []}
                onChanged={load}
              />
            </div>
          </>
        )}
      </div>
    </PortalLayout>
  );
}
```

## `src/portal/Practitioner.tsx`

```tsx
import { useCallback, useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { PortalLayout, useProtected } from "./PortalLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { MembershipWorkspace } from "./MembershipWorkspace";
import {
  adminGetAccountStore,
  adminListAccounts,
  type AdminAccount,
  type AdminStoreView,
  createPracPatient,
  isDoctorRole,
  isFirstResponderRole,
  isSupportiveRole,
  listLiveMedShares,
  type LiveMedShare,
  listPracPatients,
  type ApiError,
  type PracPatientSummary,
} from "./lib/store";
import {
  Crown,
  FolderHeart,
  HeartHandshake,
  Pill,
  Plus,
  RadioTower,
  ShieldCheck,
  Stethoscope,
  UserPlus,
} from "lucide-react";

/** Human-readable freshness for a live snapshot, e.g. "2 min ago". */
function freshness(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  if (ms < 60_000) return "just now";
  const mins = Math.round(ms / 60_000);
  if (mins < 60) return `${mins} min ago`;
  const h = Math.floor(mins / 60);
  if (h < 24) return `${h} h ago`;
  return `${Math.floor(h / 24)} d ago`;
}

/**
 * GP & HIVE HUB — the doctors' portal (GPs, hospital doctors, clinic
 * specialists). Supportive-care professionals have their own portal at
 * /portal/supportive and are redirected there.
 */
export default function Practitioner() {
  const [, navigate] = useLocation();
  const { allowed, account } = useProtected();

  const [patients, setPatients] = useState<PracPatientSummary[] | null>(null);
  const [isMember, setIsMember] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Add patient form
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDob, setNewDob] = useState("");
  const [newCondition, setNewCondition] = useState("");
  const [busy, setBusy] = useState(false);

  const isPractitioner = !!account && account.accountType === "healthcare";
  const superuser = !!account?.superuser;
  // Page access: unknown/legacy roles stay in the HUB (previous behaviour)
  // so existing accounts keep working; only known supportive-care and
  // first-responder roles re-route to their own portals.
  const responder = isPractitioner && !superuser && isFirstResponderRole(account?.role);
  const inHub =
    isPractitioner && (superuser || (!isSupportiveRole(account?.role) && !responder));
  // Doctor-only sections (patient files, live medications) mirror the
  // server's DOCTOR_ROLES gate exactly, so the UI never offers tools the
  // API would reject with a 403.
  const doctor = isPractitioner && (superuser || isDoctorRole(account?.role));

  // Live medication shares (consent-based, live from patient devices)
  const [liveShares, setLiveShares] = useState<LiveMedShare[] | null>(null);
  const [liveSharesDemo, setLiveSharesDemo] = useState(false);
  const [liveSharesError, setLiveSharesError] = useState<string | null>(null);
  useEffect(() => {
    if (!allowed || !isPractitioner || !doctor) return;
    let cancelled = false;
    const loadShares = async () => {
      try {
        const r = await listLiveMedShares();
        if (cancelled) return;
        setLiveShares(r.shares);
        setLiveSharesDemo(!!r.demo);
        setLiveSharesError(null);
      } catch (err) {
        if (cancelled) return;
        setLiveShares([]);
        setLiveSharesError((err as ApiError).message ?? null);
      }
    };
    void loadShares();
    const iv = setInterval(loadShares, 60_000);
    return () => {
      cancelled = true;
      clearInterval(iv);
    };
  }, [allowed, isPractitioner, doctor]);

  const [adminAccounts, setAdminAccounts] = useState<AdminAccount[] | null>(null);
  const [adminOpenId, setAdminOpenId] = useState<string | null>(null);
  const [adminStore, setAdminStore] = useState<AdminStoreView | null>(null);
  const [adminStoreBusy, setAdminStoreBusy] = useState(false);
  useEffect(() => {
    if (!allowed || !superuser) return;
    adminListAccounts()
      .then((r) => setAdminAccounts(r.accounts))
      .catch(() => setAdminAccounts([]));
  }, [allowed, superuser]);

  const toggleAdminStore = async (id: string) => {
    if (adminOpenId === id) {
      setAdminOpenId(null);
      setAdminStore(null);
      return;
    }
    setAdminOpenId(id);
    setAdminStore(null);
    setAdminStoreBusy(true);
    try {
      setAdminStore(await adminGetAccountStore(id));
    } catch {
      setAdminStore(null);
    } finally {
      setAdminStoreBusy(false);
    }
  };

  const refreshPatients = useCallback(async () => {
    try {
      const p = await listPracPatients();
      setPatients(p.patients);
      setError(null);
    } catch (err) {
      setError((err as ApiError).message ?? "Could not load your patient files.");
    }
  }, []);

  useEffect(() => {
    if (allowed && doctor) void refreshPatients();
  }, [allowed, doctor, refreshPatients]);

  if (!allowed) {
    return (
      <PortalLayout>
        <div className="max-w-md mx-auto text-center py-16">
          <Stethoscope className="h-10 w-10 text-primary mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">GP &amp; HIVE HUB</h1>
          <p className="text-muted-foreground mb-6">
            Sign in with your doctor account to access patient files, HIVE
            booking and consultations.
          </p>
          <div className="flex justify-center gap-3">
            <Button onClick={() => navigate("/portal/login")}>Sign in</Button>
            <Button variant="outline" onClick={() => navigate("/portal/signup?type=healthcare")}>
              Sign up
            </Button>
          </div>
        </div>
      </PortalLayout>
    );
  }

  if (!isPractitioner) {
    return (
      <PortalLayout>
        <div className="max-w-md mx-auto text-center py-16">
          <h1 className="text-2xl font-bold mb-2">Practitioner account required</h1>
          <p className="text-muted-foreground mb-6">
            This area is for healthcare practitioner accounts. Your current
            account type does not include practitioner tools.
          </p>
          <Button onClick={() => navigate("/portal")}>Back to portal</Button>
        </div>
      </PortalLayout>
    );
  }

  if (!inHub) {
    // Supportive-care professionals and first responders have their own portals.
    return (
      <PortalLayout>
        <div className="max-w-md mx-auto text-center py-16">
          <HeartHandshake className="h-10 w-10 text-primary mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">This is the doctors&apos; HUB</h1>
          <p className="text-muted-foreground mb-6">
            The GP &amp; HIVE HUB is reserved for doctor roles. As a{" "}
            {account?.role ?? "supportive-care professional"}, your workspace —
            emergency relay tools, HIVE booking and consultations — lives in the{" "}
            {responder ? "First Responders" : "Supportive Care"} portal.
          </p>
          <Button
            onClick={() => navigate(responder ? "/portal/responder" : "/portal/supportive")}
            className="gap-1.5"
          >
            <HeartHandshake className="h-4 w-4" />{" "}
            {responder ? "Go to my First Responders portal" : "Go to my Supportive Care portal"}
          </Button>
        </div>
      </PortalLayout>
    );
  }

  return (
    <PortalLayout>
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Stethoscope className="h-7 w-7 text-primary" /> GP &amp; HIVE HUB
          </h1>
          <div className="flex items-center gap-2">
            {superuser && (
              <Badge className="bg-amber-500/20 text-amber-400 border border-amber-500/40 gap-1">
                <ShieldCheck className="h-3 w-3" /> SUPERUSER
              </Badge>
            )}
            {isMember && (
              <Badge className="bg-primary/20 text-primary border border-primary/40 gap-1">
                <Crown className="h-3 w-3" /> MEMBER
              </Badge>
            )}
            {account?.role && (
              <Badge className="bg-primary/20 text-primary border border-primary/40">
                {account.role}
              </Badge>
            )}
          </div>
        </div>
        <p className="text-muted-foreground mb-8">
          The doctors&apos; workspace: patient files, live medications, automated
          HIVE booking and consultations.
        </p>

        {error && (
          <div className="rounded-lg border border-destructive/50 bg-destructive/10 text-destructive px-4 py-3 mb-6 text-sm">
            {error}
          </div>
        )}

        {/* Founder superuser — read/test overview of every registered account */}
        {superuser && (
          <Card className="mb-8 border-amber-500/30 bg-card/60 backdrop-blur">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-amber-400" /> Founder overview
              </CardTitle>
              <CardDescription>
                Read-only view of every registered portal account. Accounts are held
                in server memory for the pilot, so this list resets on a server restart.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {adminAccounts === null ? (
                <p className="text-sm text-muted-foreground">Loading accounts…</p>
              ) : adminAccounts.length === 0 ? (
                <p className="text-sm text-muted-foreground">No registered accounts yet.</p>
              ) : (
                <div className="grid gap-2">
                  {adminAccounts.map((a) => (
                    <div key={a.id} className="rounded-xl border border-border bg-background/40 p-3.5">
                      <button
                        type="button"
                        onClick={() => void toggleAdminStore(a.id)}
                        className="w-full text-left flex flex-wrap items-center gap-x-4 gap-y-1"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="font-semibold text-sm flex items-center gap-2">
                            {a.fullName}
                            {a.superuser && (
                              <Badge className="bg-amber-500/15 text-amber-400 border border-amber-500/30 text-[10px]">FOUNDER</Badge>
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground mt-0.5">
                            {a.email} · {a.accountType === "healthcare" ? a.role ?? "Healthcare" : "Caretaker"} · {a.status}
                          </div>
                        </div>
                        <div className="text-xs text-muted-foreground text-right">
                          <div>{a.patients} patient file{a.patients === 1 ? "" : "s"}</div>
                          <div>{a.membershipActive ? "Member" : "Free hub"}{a.hasPasskey ? " · passkey" : ""}</div>
                        </div>
                      </button>
                      {adminOpenId === a.id && (
                        <div className="mt-3 border-t border-border pt-3 text-xs">
                          {adminStoreBusy ? (
                            <p className="text-muted-foreground">Loading account data…</p>
                          ) : !adminStore || !adminStore.store ? (
                            <p className="text-muted-foreground">No stored data for this account yet.</p>
                          ) : (
                            <div className="grid gap-2">
                              <div className="text-muted-foreground">
                                {adminStore.store.bookings.length} booking{adminStore.store.bookings.length === 1 ? "" : "s"} ·{" "}
                                {adminStore.store.membership.active ? "active membership" : "no membership"}
                              </div>
                              {adminStore.store.patients.length === 0 ? (
                                <p className="text-muted-foreground">No patient files.</p>
                              ) : (
                                adminStore.store.patients.map((p) => (
                                  <div key={p.id} className="rounded-lg border border-border/70 bg-background/60 p-2.5">
                                    <div className="font-medium text-foreground">
                                      {p.fullName}
                                      {p.demo ? " (demo)" : ""}
                                    </div>
                                    <div className="text-muted-foreground mt-0.5">
                                      {p.dob || "DOB —"} · MRN {p.mrn || "—"} · {p.condition || "No condition noted"}
                                    </div>
                                    <div className="text-muted-foreground mt-0.5">
                                      {p.notes.length} note{p.notes.length === 1 ? "" : "s"} · {p.prescriptions.length} prescription{p.prescriptions.length === 1 ? "" : "s"}
                                    </div>
                                  </div>
                                ))
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* My HIVE Patients — doctors only, part of the light hub */}
        {doctor && (
        <Card className="mb-8 border-primary/25 bg-card/60 backdrop-blur">
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FolderHeart className="h-5 w-5 text-primary" /> My HIVE Patients
              </CardTitle>
              <CardDescription>
                Patient files with history, questionnaires, prescriptions and notes.
                Demo records are clearly labelled.
              </CardDescription>
            </div>
            <Button size="sm" onClick={() => setShowAdd((v) => !v)} className="gap-1.5">
              <UserPlus className="h-4 w-4" /> Add patient
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {showAdd && (
              <div className="rounded-xl border border-border bg-background/40 p-4 grid sm:grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="p-name">Full name</Label>
                  <Input id="p-name" value={newName} onChange={(e) => setNewName(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="p-dob">Date of birth</Label>
                  <Input id="p-dob" type="date" value={newDob} onChange={(e) => setNewDob(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="p-cond">Condition</Label>
                  <Input id="p-cond" value={newCondition} onChange={(e) => setNewCondition(e.target.value)} />
                </div>
                <div className="sm:col-span-3">
                  <Button
                    size="sm"
                    onClick={async () => {
                      if (!newName.trim()) return;
                      setBusy(true);
                      try {
                        await createPracPatient({
                          fullName: newName.trim(),
                          dob: newDob.trim() || undefined,
                          condition: newCondition.trim() || undefined,
                        });
                        setNewName("");
                        setNewDob("");
                        setNewCondition("");
                        setShowAdd(false);
                        await refreshPatients();
                      } catch (err) {
                        setError((err as ApiError).message ?? "Could not add patient.");
                      } finally {
                        setBusy(false);
                      }
                    }}
                    disabled={busy || !newName.trim()}
                    className="gap-1.5"
                  >
                    <Plus className="h-4 w-4" /> {busy ? "Adding…" : "Create patient file"}
                  </Button>
                </div>
              </div>
            )}

            {patients === null ? (
              <p className="text-sm text-muted-foreground">Loading patients…</p>
            ) : patients.length === 0 ? (
              <p className="text-sm text-muted-foreground">No patients yet — add your first patient file.</p>
            ) : (
              <div className="grid gap-2.5">
                {patients.map((p) => (
                  <Link
                    key={p.id}
                    href={`/portal/practitioner/patients/${p.id}`}
                    className="rounded-xl border border-border bg-background/40 hover:border-primary/50 transition-colors p-4 flex flex-wrap items-center gap-x-4 gap-y-1"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold flex items-center gap-2">
                        {p.fullName}
                        {p.demo && (
                          <Badge className="bg-primary/15 text-primary border border-primary/30 text-[10px]">DEMO</Badge>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        {p.mrn} · DOB {p.dob} · {p.condition}
                      </div>
                    </div>
                    {p.lastQuestionnaire && (
                      <div className="text-xs text-right text-muted-foreground">
                        <div className="text-foreground font-medium">{p.lastQuestionnaire.name}</div>
                        {p.lastQuestionnaire.score} · {p.lastQuestionnaire.date}
                      </div>
                    )}
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
        )}

        {/* Live medications — consent-based, live from patient devices */}
        {doctor && (
        <Card className="mb-8 border-primary/25 bg-card/60 backdrop-blur">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <RadioTower className="h-5 w-5 text-primary" /> Live medications from patient devices
            </CardTitle>
            <CardDescription>
              Patients who granted you live access to their medication list from HIVE COMPANION.
              Snapshots are encrypted, relayed in memory only, and disappear when the patient
              withdraws consent or it expires. Shares are patient-declared — always confirm the
              patient&apos;s identity with them before acting on a list.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {liveSharesDemo && (
              <div className="rounded-lg border border-primary/30 bg-primary/10 px-3 py-2 text-xs text-primary">
                Demo access — this is fictional demo data. Register and verify to receive real patient shares.
              </div>
            )}
            {liveSharesError && (
              <p className="text-sm text-muted-foreground">{liveSharesError}</p>
            )}
            {liveShares === null ? (
              <p className="text-sm text-muted-foreground">Checking for live shares…</p>
            ) : liveShares.length === 0 ? (
              !liveSharesError && (
                <p className="text-sm text-muted-foreground">
                  No patients are currently sharing their medications with you. Patients grant access
                  in HIVE COMPANION under Emergency &amp; sharing.
                </p>
              )
            ) : (
              <div className="grid gap-3">
                {liveShares.map((s) => (
                  <div key={s.grantId} className="rounded-xl border border-border bg-background/40 p-4">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <span className="font-semibold">{s.patientName}</span>
                      <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 text-[10px]">
                        LIVE FROM PATIENT DEVICE
                      </Badge>
                      <span className="text-xs text-muted-foreground ml-auto">
                        {s.updatedAt ? `Updated ${freshness(s.updatedAt)}` : "Waiting for first update from the device…"}
                      </span>
                    </div>
                    <div className="text-[11px] text-muted-foreground mb-2">
                      Consent given {new Date(s.grantedAt).toLocaleDateString("en-IE")} · expires{" "}
                      {new Date(s.expiresAt).toLocaleDateString("en-IE")} · revocable by the patient at any time
                    </div>
                    {s.payload && s.payload.medications.length > 0 ? (
                      <ul className="grid gap-1.5 text-sm">
                        {s.payload.medications.map((m, i) => (
                          <li key={i} className="rounded-lg border border-border bg-card/50 px-3 py-2 flex items-center gap-2">
                            <Pill className="h-3.5 w-3.5 text-primary shrink-0" />
                            <span className="font-medium">{m.medication}</span>
                            <span className="text-muted-foreground text-xs">
                              {m.dose} · {m.frequency} · {m.route}
                            </span>
                          </li>
                        ))}
                      </ul>
                    ) : s.payload ? (
                      <p className="text-sm text-muted-foreground">No active medications on the patient's device.</p>
                    ) : null}
                    {s.payload?.notes && (
                      <p className="text-[11px] text-muted-foreground mt-2">{s.payload.notes}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
        )}

        <MembershipWorkspace onMembershipChange={setIsMember} />
      </div>
    </PortalLayout>
  );
}
```

## `src/portal/Pricing.tsx`

```tsx
import { useState } from "react";
import { PortalLayout } from "./PortalLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Check, Clock } from "lucide-react";

const plans = [
  {
    name: "Monthly",
    price: "€25",
    period: "/month",
    features: ["Verified professional access", "Emergency viewer", "Caretaker dashboard", "Biometric 2FA"],
    highlight: false,
  },
  {
    name: "Annual",
    price: "€99",
    period: "/year",
    features: ["Everything in Monthly", "Best value — save vs monthly", "Priority verification", "Biometric 2FA"],
    highlight: true,
  },
];

export default function Pricing() {
  const [gateOpen, setGateOpen] = useState(false);

  return (
    <PortalLayout>
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold mb-3">Partner subscription</h1>
          <p className="text-muted-foreground text-lg">
            For verified healthcare partners. Demo mode always stays free.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {plans.map((plan) => (
            <Card key={plan.name} className={plan.highlight ? "border-primary/60 shadow-[0_0_30px_rgba(245,197,24,0.15)]" : ""}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl">{plan.name}</CardTitle>
                  {plan.highlight && (
                    <Badge className="bg-primary/20 text-primary border border-primary/40">Best value</Badge>
                  )}
                </div>
                <div className="flex items-baseline gap-1 pt-2">
                  <span className="text-4xl font-bold">{plan.price}</span>
                  <span className="text-muted-foreground">{plan.period}</span>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-2">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 text-primary shrink-0" /> {f}
                    </li>
                  ))}
                </ul>
                <Button className="w-full" onClick={() => setGateOpen(true)}>
                  Subscribe
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="bg-card/40">
          <CardContent className="p-6 flex items-center gap-4">
            <Badge className="bg-primary/20 text-primary border border-primary/40">Free</Badge>
            <div>
              <div className="font-semibold">Demo mode</div>
              <p className="text-sm text-muted-foreground">
                Explore the full portal with fake data at no cost, badged DEMO.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={gateOpen} onOpenChange={setGateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" /> Payments coming soon
            </DialogTitle>
            <DialogDescription>
              Online payments are not yet available. No payment provider is
              configured for this pilot, so we can't take a subscription right
              now. Please continue in Demo mode, and we'll be in touch when
              partner billing goes live.
            </DialogDescription>
          </DialogHeader>
          <Button onClick={() => setGateOpen(false)} className="w-full">
            Got it
          </Button>
        </DialogContent>
      </Dialog>
    </PortalLayout>
  );
}
```

## `src/portal/Privacy.tsx`

```tsx
import { PortalLayout } from "./PortalLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ShieldCheck, Clock, MapPin, Camera, Lock } from "lucide-react";

const sections = [
  {
    icon: <ShieldCheck className="h-5 w-5 text-primary" />,
    title: "Patient-approved access only",
    body: "A patient's data is only ever visible through an emergency share that the patient themselves approved on their own device. There is no back door and no way to browse patient records.",
  },
  {
    icon: <Lock className="h-5 w-5 text-primary" />,
    title: "Nothing stored centrally without consent",
    body: "We do not keep a central database of patient records. Emergency shares are transient — they live only as a temporary relay and are never written to disk.",
  },
  {
    icon: <Clock className="h-5 w-5 text-primary" />,
    title: "Shares expire automatically",
    body: "Every emergency share is time-limited and expires on its own. Once expired, the code stops working immediately and the data is gone.",
  },
  {
    icon: <MapPin className="h-5 w-5 text-primary" />,
    title: "Caretaker sharing is opt-in and revocable",
    body: "Location and vitals only appear while the patient (Red Geriatric Pack) has actively opted in. The moment they revoke, sharing stops and the link goes dead.",
  },
  {
    icon: <Camera className="h-5 w-5 text-primary" />,
    title: "Verification images stay on your device",
    body: "In this pilot, any selfie, photo ID or certification you capture for verification stays on your own device. These images are never uploaded to any server.",
  },
];

export default function Privacy() {
  return (
    <PortalLayout>
      <div className="max-w-2xl mx-auto">
        <h1 className="text-4xl font-bold mb-3">Privacy</h1>
        <p className="text-muted-foreground text-lg mb-8">
          Plain-language disclosures about how the HIVE Emergency Portal handles
          data.
        </p>
        <div className="space-y-4">
          {sections.map((s) => (
            <Card key={s.title}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  {s.icon} {s.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed">{s.body}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </PortalLayout>
  );
}
```

## `src/portal/Signup.tsx`

```tsx
import { useEffect, useRef, useState } from "react";
import { useLocation, useSearch, Link } from "wouter";
import { PortalLayout } from "./PortalLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  HEALTHCARE_ROLES,
  registerAccount,
  fileToDataUrl,
  isWebAuthnAvailable,
  registerPasskeyServer,
  upsertProfile,
  type AccountType,
  type ApiError,
  type HealthcareRole,
  type VerificationMode,
} from "./lib/store";
import { Camera, Upload, Check, Fingerprint, AlertTriangle } from "lucide-react";

export default function Signup() {
  const [, navigate] = useLocation();
  const searchStr = useSearch();
  const initialType: AccountType =
    new URLSearchParams(searchStr).get("type") === "caretaker"
      ? "caretaker"
      : "healthcare";

  const [accountType, setAccountType] = useState<AccountType>(initialType);
  const [fullName, setFullName] = useState("");
  const [workplace, setWorkplace] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<HealthcareRole | null>(null);
  const [mode, setMode] = useState<VerificationMode | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Verification captures (stay on this device only)
  const [selfie, setSelfie] = useState<string | undefined>();
  const [photoId, setPhotoId] = useState<{ name: string; data: string } | undefined>();
  const [certification, setCertification] = useState<{ name: string; data: string } | undefined>();

  // Webcam
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [cameraOn, setCameraOn] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const selfieFallbackRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => stopCamera();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setCameraOn(false);
  };

  const startCamera = async () => {
    setCameraError(null);
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error("Camera not available");
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" },
        audio: false,
      });
      streamRef.current = stream;
      setCameraOn(true);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => undefined);
      }
    } catch {
      setCameraError(
        "Webcam is unavailable. Please upload a selfie photo instead.",
      );
    }
  };

  const captureSelfie = () => {
    const video = videoRef.current;
    if (!video) return;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth || 480;
    canvas.height = video.videoHeight || 360;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    setSelfie(canvas.toDataURL("image/jpeg", 0.8));
    stopCamera();
  };

  const onSelfieFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setSelfie(await fileToDataUrl(file));
  };

  const onPhotoIdFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setPhotoId({ name: file.name, data: await fileToDataUrl(file) });
  };

  const onCertFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setCertification({ name: file.name, data: await fileToDataUrl(file) });
  };

  const validate = (): string | null => {
    if (!fullName.trim()) return "Please enter your full name.";
    if (!workplace.trim()) return "Please enter your workplace.";
    if (!email.trim() || !email.includes("@")) return "Please enter a valid email.";
    if (password.length < 6) return "Password must be at least 6 characters.";
    if (accountType === "healthcare" && !role)
      return "Please select your clinical role.";
    if (!mode) return "Please choose Demo mode or Full verification.";
    if (mode === "full") {
      if (!selfie) return "A selfie is required for full verification.";
      if (!photoId) return "A photo ID is required for full verification.";
      if (accountType === "healthcare" && !certification)
        return "A professional certification file is required for full verification.";
    }
    return null;
  };

  const handleSubmit = async () => {
    setError(null);
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }
    setSubmitting(true);

    let accountId: string;
    let webauthnToken: string;
    try {
      const { account, webauthnToken: token } = await registerAccount({
        fullName: fullName.trim(),
        workplace: workplace.trim(),
        email: email.trim(),
        password,
        accountType,
        role: accountType === "healthcare" ? role ?? undefined : undefined,
        mode: mode as VerificationMode,
      });
      accountId = account.id;
      webauthnToken = token;
    } catch (err) {
      const apiErr = err as ApiError;
      if (apiErr.status === 409) {
        setError("An account with this email already exists. Please log in.");
      } else if (apiErr.status === 400) {
        setError(apiErr.message ?? apiErr.error ?? "Please check your details and try again.");
      } else {
        setError(apiErr.message ?? "Could not create your account. Please try again.");
      }
      setSubmitting(false);
      return;
    }

    // Register a passkey — the credential public key is verified and stored
    // server-side so the biometric second factor can be enforced at login.
    let hasPasskey = false;
    if (isWebAuthnAvailable()) {
      try {
        hasPasskey = await registerPasskeyServer(webauthnToken);
      } catch {
        hasPasskey = false;
      }
    }

    // Keep verification images + profile on THIS device only.
    upsertProfile({
      accountId,
      email: email.trim(),
      hasPasskey,
      verification:
        mode === "full"
          ? {
              selfie,
              photoId: photoId?.data,
              photoIdName: photoId?.name,
              certification: certification?.data,
              certificationName: certification?.name,
            }
          : undefined,
    });

    setSubmitting(false);
    navigate("/portal/login?registered=1");
  };

  return (
    <PortalLayout>
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">Create your portal account</h1>
        <p className="text-muted-foreground mb-8">
          Pilot: accounts and any verification images are stored only on this
          device. Verification images are never sent to a server.
        </p>

        {/* Account type */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Account type</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-3">
            {(["healthcare", "caretaker"] as AccountType[]).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setAccountType(t)}
                className={`rounded-xl border p-4 text-left transition-colors ${
                  accountType === t
                    ? "border-primary bg-primary/10"
                    : "border-border hover:border-primary/40"
                }`}
              >
                <div className="font-semibold capitalize">
                  {t === "healthcare" ? "Healthcare worker" : "Caretaker"}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  {t === "healthcare"
                    ? "Clinical professional with a role"
                    : "Residential / nursing home staff"}
                </div>
              </button>
            ))}
          </CardContent>
        </Card>

        {/* Details */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Your details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="fullName">Full name</Label>
              <Input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="workplace">Workplace</Label>
              <Input id="workplace" value={workplace} onChange={(e) => setWorkplace(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
          </CardContent>
        </Card>

        {/* Role selection */}
        {accountType === "healthcare" ? (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Your clinical role</CardTitle>
              <CardDescription>Select exactly one.</CardDescription>
            </CardHeader>
            <CardContent className="grid sm:grid-cols-2 gap-2.5">
              {HEALTHCARE_ROLES.map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRole(r)}
                  className={`rounded-lg border px-4 py-3 text-left text-sm transition-colors ${
                    role === r
                      ? "border-primary bg-primary/10 font-semibold"
                      : "border-border hover:border-primary/40"
                  }`}
                >
                  {r}
                </button>
              ))}
            </CardContent>
          </Card>
        ) : (
          <Card className="mb-6">
            <CardContent className="p-6 flex items-center gap-3">
              <Badge className="bg-primary/20 text-primary border border-primary/40">
                Caretaker
              </Badge>
              <span className="text-sm text-muted-foreground">
                Caretaker account — no clinical role required.
              </span>
            </CardContent>
          </Card>
        )}

        {/* Verification mode */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Verification</CardTitle>
            <CardDescription>
              Choose demo mode for instant pilot access, or full verification.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setMode("demo")}
                className={`rounded-xl border p-4 text-left transition-colors ${
                  mode === "demo" ? "border-primary bg-primary/10" : "border-border hover:border-primary/40"
                }`}
              >
                <div className="flex items-center gap-2 font-semibold">
                  Demo mode
                  <Badge className="bg-primary/20 text-primary border border-primary/40">DEMO</Badge>
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  Instantly active with fake data. Badged DEMO everywhere.
                </div>
              </button>
              <button
                type="button"
                onClick={() => setMode("full")}
                className={`rounded-xl border p-4 text-left transition-colors ${
                  mode === "full" ? "border-primary bg-primary/10" : "border-border hover:border-primary/40"
                }`}
              >
                <div className="flex items-center gap-2 font-semibold">
                  Full verification
                  <Badge className="bg-amber-500/15 text-amber-400 border border-amber-500/40">
                    VERIFICATION ONGOING
                  </Badge>
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  Selfie, photo ID &amp; certification. Status stays ongoing until approved.
                </div>
              </button>
            </div>

            {mode === "full" && (
              <div className="space-y-6 pt-2 border-t border-border">
                <p className="text-xs text-muted-foreground flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                  These images stay on your own device in this pilot and are
                  never uploaded to any server.
                </p>

                {/* Selfie */}
                <div>
                  <Label className="mb-2 block">1. Selfie</Label>
                  {selfie ? (
                    <div className="flex items-center gap-3">
                      <img src={selfie} alt="Selfie preview" className="h-24 w-24 rounded-lg object-cover border border-border" />
                      <Button variant="outline" size="sm" onClick={() => setSelfie(undefined)}>
                        Retake
                      </Button>
                    </div>
                  ) : cameraOn ? (
                    <div className="space-y-2">
                      <video ref={videoRef} className="w-full max-w-sm rounded-lg border border-border bg-black" playsInline muted />
                      <div className="flex gap-2">
                        <Button size="sm" onClick={captureSelfie} className="gap-1.5">
                          <Camera className="h-4 w-4" /> Capture
                        </Button>
                        <Button size="sm" variant="outline" onClick={stopCamera}>
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={startCamera} className="gap-1.5">
                          <Camera className="h-4 w-4" /> Use webcam
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => selfieFallbackRef.current?.click()} className="gap-1.5">
                          <Upload className="h-4 w-4" /> Upload photo
                        </Button>
                        <input ref={selfieFallbackRef} type="file" accept="image/*" capture="user" className="hidden" onChange={onSelfieFile} />
                      </div>
                      {cameraError && <p className="text-xs text-amber-400">{cameraError}</p>}
                    </div>
                  )}
                </div>

                {/* Photo ID */}
                <div>
                  <Label className="mb-2 block">2. Photo ID</Label>
                  <div className="flex items-center gap-3">
                    <Button size="sm" variant="outline" asChild className="gap-1.5">
                      <label>
                        <Upload className="h-4 w-4" /> Capture / upload ID
                        <input type="file" accept="image/*" capture="environment" className="hidden" onChange={onPhotoIdFile} />
                      </label>
                    </Button>
                    {photoId && (
                      <span className="text-sm text-emerald-400 flex items-center gap-1">
                        <Check className="h-4 w-4" /> {photoId.name}
                      </span>
                    )}
                  </div>
                </div>

                {/* Certification */}
                {accountType === "healthcare" && (
                  <div>
                    <Label className="mb-2 block">3. Professional certification</Label>
                    <div className="flex items-center gap-3">
                      <Button size="sm" variant="outline" asChild className="gap-1.5">
                        <label>
                          <Upload className="h-4 w-4" /> Upload certification
                          <input type="file" accept="image/*,application/pdf" className="hidden" onChange={onCertFile} />
                        </label>
                      </Button>
                      {certification && (
                        <span className="text-sm text-emerald-400 flex items-center gap-1">
                          <Check className="h-4 w-4" /> {certification.name}
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="rounded-lg border border-border bg-card/40 p-4 mb-6 flex items-start gap-2 text-sm text-muted-foreground">
          <Fingerprint className="h-5 w-5 text-primary shrink-0" />
          {isWebAuthnAvailable()
            ? "We'll register a biometric passkey on this device now. It will be required as a second factor on every login."
            : "Biometric 2FA is required on a supported device. You can still sign up here, but you'll need a supported device / dev override to log in."}
        </div>

        {error && (
          <div className="rounded-lg border border-destructive/50 bg-destructive/10 text-destructive px-4 py-3 mb-4 text-sm">
            {error}
          </div>
        )}

        <div className="flex items-center gap-3">
          <Button onClick={handleSubmit} disabled={submitting} size="lg">
            {submitting ? "Creating account…" : "Create account"}
          </Button>
          <Link href="/portal/login" className="text-sm text-muted-foreground hover:text-primary">
            Already have an account? Log in
          </Link>
        </div>
      </div>
    </PortalLayout>
  );
}
```

## `src/portal/SupportiveCare.tsx`

```tsx
import { useLocation } from "wouter";
import { PortalLayout, useProtected } from "./PortalLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MembershipWorkspace } from "./MembershipWorkspace";
import { isFirstResponderRole, isSupportiveRole } from "./lib/store";
import { useState } from "react";
import {
  ArrowRight,
  Crown,
  HeartHandshake,
  ShieldCheck,
  Siren,
  Stethoscope,
} from "lucide-react";

/**
 * Supportive Care Professionals portal — physiotherapists, occupational
 * health and A&E follow-up. Their own workspace: emergency relay tools plus
 * the shared HIVE booking/consultation membership features. Doctor-only
 * areas live in the GP & HIVE HUB; first responders have their own portal
 * at /portal/responder.
 */
export default function SupportiveCare() {
  const [, navigate] = useLocation();
  const { allowed, account } = useProtected();
  const [isMember, setIsMember] = useState(false);

  const isPractitioner = !!account && account.accountType === "healthcare";
  const superuser = !!account?.superuser;
  const responder = isPractitioner && !superuser && isFirstResponderRole(account?.role);
  // Symmetric with the HUB guard: unknown/legacy roles are treated as
  // doctors (previous behaviour) and belong in the GP & HIVE HUB.
  const doctor = isPractitioner && !responder && !isSupportiveRole(account?.role);

  if (!allowed) {
    return (
      <PortalLayout>
        <div className="max-w-md mx-auto text-center py-16">
          <HeartHandshake className="h-10 w-10 text-primary mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Supportive Care Professionals</h1>
          <p className="text-muted-foreground mb-6">
            Sign in with your supportive-care account — physiotherapy,
            occupational health or A&amp;E follow-up — for emergency relay
            tools, HIVE booking and consultations.
          </p>
          <div className="flex justify-center gap-3">
            <Button onClick={() => navigate("/portal/login")}>Sign in</Button>
            <Button variant="outline" onClick={() => navigate("/portal/signup?type=healthcare")}>
              Sign up
            </Button>
          </div>
        </div>
      </PortalLayout>
    );
  }

  if (!isPractitioner) {
    return (
      <PortalLayout>
        <div className="max-w-md mx-auto text-center py-16">
          <h1 className="text-2xl font-bold mb-2">Practitioner account required</h1>
          <p className="text-muted-foreground mb-6">
            This area is for healthcare practitioner accounts. Your current
            account type does not include practitioner tools.
          </p>
          <Button onClick={() => navigate("/portal")}>Back to portal</Button>
        </div>
      </PortalLayout>
    );
  }

  if (responder) {
    // First responders have their own dedicated portal.
    return (
      <PortalLayout>
        <div className="max-w-md mx-auto text-center py-16">
          <Siren className="h-10 w-10 text-primary mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">This is the Supportive Care portal</h1>
          <p className="text-muted-foreground mb-6">
            As a first responder, your workspace — rapid emergency handover
            access, HIVE booking and consultations — lives in the First
            Responders portal.
          </p>
          <Button onClick={() => navigate("/portal/responder")} className="gap-1.5">
            <Siren className="h-4 w-4" /> Go to the First Responders portal
          </Button>
        </div>
      </PortalLayout>
    );
  }

  if (doctor && !superuser) {
    // Doctors belong in the GP & HIVE HUB (superuser may inspect both portals).
    return (
      <PortalLayout>
        <div className="max-w-md mx-auto text-center py-16">
          <Stethoscope className="h-10 w-10 text-primary mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">This is the Supportive Care portal</h1>
          <p className="text-muted-foreground mb-6">
            As a {account?.role ?? "doctor"}, your workspace — patient files,
            live medications, booking and consultations — lives in the GP &amp;
            HIVE HUB.
          </p>
          <Button onClick={() => navigate("/portal/practitioner")} className="gap-1.5">
            <Stethoscope className="h-4 w-4" /> Go to the GP &amp; HIVE HUB
          </Button>
        </div>
      </PortalLayout>
    );
  }

  return (
    <PortalLayout>
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <HeartHandshake className="h-7 w-7 text-primary" /> Supportive Care Portal
          </h1>
          <div className="flex items-center gap-2">
            {superuser && (
              <Badge className="bg-amber-500/20 text-amber-400 border border-amber-500/40 gap-1">
                <ShieldCheck className="h-3 w-3" /> SUPERUSER
              </Badge>
            )}
            {isMember && (
              <Badge className="bg-primary/20 text-primary border border-primary/40 gap-1">
                <Crown className="h-3 w-3" /> MEMBER
              </Badge>
            )}
            {account?.role && (
              <Badge className="bg-primary/20 text-primary border border-primary/40">
                {account.role}
              </Badge>
            )}
          </div>
        </div>
        <p className="text-muted-foreground mb-8">
          Your workspace for supportive-care roles: patient-approved emergency
          relay access, automated HIVE booking and consultations.
        </p>

        {/* Emergency relay tools — the shared, patient-consented relay */}
        <Card className="mb-8 border-destructive/40 bg-destructive/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Siren className="h-5 w-5 text-destructive" /> Emergency relay access
            </CardTitle>
            <CardDescription>
              Open a patient-approved, time-limited emergency share (HES-XXXX-XXXX
              code) to view critical medical information. Access is
              patient-consented, relayed in memory only and never centrally stored.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <ul className="text-sm text-muted-foreground space-y-1.5">
              <li className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-primary" /> Enter the share code
                the patient gives you
              </li>
              <li className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-primary" /> Access ends when the
                share expires or is revoked
              </li>
            </ul>
            <Button onClick={() => navigate("/portal/emergency")} className="gap-1.5">
              Open emergency viewer <ArrowRight className="h-4 w-4" />
            </Button>
          </CardContent>
        </Card>

        <MembershipWorkspace onMembershipChange={setIsMember} />
      </div>
    </PortalLayout>
  );
}
```

