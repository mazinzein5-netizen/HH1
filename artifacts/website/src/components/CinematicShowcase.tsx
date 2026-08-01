import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence, useReducedMotion, PanInfo } from "framer-motion";
import { Link } from "wouter";
import {
  ArrowRight, Smartphone, Activity, Stethoscope,
  FileText, Pill, AlertCircle, ShieldCheck,
  ChevronLeft, ChevronRight, Sparkles, Clock, Euro,
  ClipboardList, Lock, ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { HiveMark } from "@/components/HiveMark";

// Optimised WebP images (see public/images/)
const BRAND_COMPANION = `${import.meta.env.BASE_URL}images/brand-companion.webp`;
const BRAND_SURGICAL = `${import.meta.env.BASE_URL}images/brand-surgical.webp`;

/* ------------------------------------------------------------------ */
/*  Product scene data                                                  */
/* ------------------------------------------------------------------ */

interface Feature {
  icon: React.ReactNode;
  text: string;
}

interface ProductScene {
  id: string;
  badge: string;
  badgeIcon: React.ReactNode;
  title: React.ReactNode;
  tagline: string;
  description: string;
  features: Feature[];
  cta: { label: string; href: string };
  image: string;
  imageAlt: string;
  glowColor: string;
  glowX: string;
  glowY: string;
}

const SCENES: ProductScene[] = [
  {
    id: "companion",
    badge: "FOR PATIENTS",
    badgeIcon: <Smartphone className="h-3 w-3" />,
    title: (
      <>
        HIVE <HiveMark /> Companion
      </>
    ),
    tagline: "Walk into any appointment ready.",
    description:
      "Your health story, already organised. Records, prescriptions, and an emergency health card \u2014 all on your device, all under your control.",
    features: [
      { icon: <FileText className="h-5 w-5" />, text: "Health records & prescriptions in one place" },
      { icon: <Pill className="h-5 w-5" />, text: "Standardised questionnaires before every visit" },
      { icon: <AlertCircle className="h-5 w-5" />, text: "Emergency health card when it matters most" },
    ],
    cta: { label: "Download for Android", href: "/api/app/download/android" },
    image: BRAND_COMPANION,
    imageAlt: "HIVE Companion app",
    glowColor: "rgba(245,197,24,0.08)",
    glowX: "20%",
    glowY: "30%",
  },
  {
    id: "surgical",
    badge: "FOR CLINICAL TEAMS",
    badgeIcon: <Activity className="h-3 w-3" />,
    title: <>HIVE HOSPITAL Surgical Assistant</>,
    tagline: "Precision documentation. Faster workflows.",
    description:
      "Patient files digitised and organised. Photo recognition turns captured data into structured records in seconds. Advanced AI risk oversight coming soon.",
    features: [
      { icon: <ClipboardList className="h-5 w-5" />, text: "Fast documentation with photo recognition" },
      { icon: <Lock className="h-5 w-5" />, text: "Encrypted by design \u2014 data stays on device" },
      { icon: <Sparkles className="h-5 w-5" />, text: "AI decision support for clinicians" },
    ],
    cta: { label: "Open Surgical Assistant", href: "/portal/practitioner" },
    image: BRAND_SURGICAL,
    imageAlt: "HIVE HOSPITAL Surgical Assistant",
    glowColor: "rgba(110,168,255,0.08)",
    glowX: "80%",
    glowY: "25%",
  },
  {
    id: "gp-portal",
    badge: "FOR PRACTICES",
    badgeIcon: <Stethoscope className="h-3 w-3" />,
    title: <>HIVE GP AutoCoder &amp; Scribe</>,
    tagline: "AI-powered coding and scribing — finish documentation in seconds.",
    description:
      "Patients arrive with standardised questionnaires already completed. AI drafts referral letters and clinic summaries \u2014 you review and sign off.",
    features: [
      { icon: <ClipboardList className="h-5 w-5" />, text: "Structured pre-appointment intake" },
      { icon: <Sparkles className="h-5 w-5" />, text: "AI-drafted documentation, referral letters & treatment codes" },
      { icon: <Euro className="h-5 w-5" />, text: "Measurable savings on administration time" },
    ],
    cta: {
      label: "Open AutoCoder & Scribe",
      href: "mailto:info@ibnceena.ie?subject=Enterprise%20enquiry%20%E2%80%94%20Health%20HIVE",
    },
    image: `${import.meta.env.BASE_URL}images/gp-consult.webp`,
    imageAlt: "GP consulting with a patient",
    glowColor: "rgba(52,211,153,0.07)",
    glowX: "75%",
    glowY: "60%",
  },
];

/* ------------------------------------------------------------------ */
/*  Animation variants                                                 */
/* ------------------------------------------------------------------ */


const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? "65%" : "-65%",
    rotateY: direction > 0 ? 20 : -20,
    scale: 0.82,
    opacity: 0,
    filter: "none",
  }),
  center: {
    x: 0,
    rotateY: 0,
    scale: 1,
    opacity: 1,
    filter: "none",
    zIndex: 1,
  },
  exit: (direction: number) => ({
    x: direction > 0 ? "-65%" : "65%",
    rotateY: direction > 0 ? -20 : 20,
    scale: 0.82,
    opacity: 0,
    filter: "none",
    zIndex: 0,
  }),
};

type BezierTuple = [number, number, number, number];
const EASE: BezierTuple = [0.22, 1, 0.36, 1];

const SLIDE_TRANSITION: Record<string, Record<string, unknown>> = {
  x: { type: "spring", stiffness: 180, damping: 26 },
  rotateY: { duration: 0.95, ease: EASE },
  scale: { duration: 0.95, ease: EASE },
  opacity: { duration: 0.55, ease: "easeOut" },
  };

/** Reduced-motion: simple crossfade */
const reducedSlideVariants = {
  enter: () => ({ opacity: 0 }),
  center: { opacity: 1, zIndex: 1 },
  exit: () => ({ opacity: 0, zIndex: 0 }),
};

const REDUCED_TRANSITION = { duration: 0.25 };

/** Staggered content reveal within each slide */
const contentContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08, delayChildren: 0.4 } },
};

const contentItem = {
  hidden: { opacity: 0, y: 28, filter: "none" },
  visible: {
    opacity: 1,
    y: 0,
    filter: "none",
    transition: { duration: 0.55, ease: EASE },
  },
};

const reducedContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.02 } },
};

const reducedItem = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.15 } },
};

/* ------------------------------------------------------------------ */
/*  Light-streak transition overlay                                      */
/* ------------------------------------------------------------------ */

function LightStreak({ show }: { show: boolean }) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          key="streak"
          className="absolute inset-0 z-30 pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 0.4, 0] }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.75, times: [0, 0.35, 1], ease: "easeInOut" }}
          style={{
            background:
              "linear-gradient(105deg, transparent 28%, rgba(245,197,24,0.1) 44%, rgba(245,197,24,0.22) 50%, rgba(245,197,24,0.1) 56%, transparent 72%)",
          }}
        />
      )}
    </AnimatePresence>
  );
}

/* ------------------------------------------------------------------ */
/*  3D tilt product image                                              */
/* ------------------------------------------------------------------ */

function TiltImage({ src, alt, className }: { src: string; alt: string; className?: string }) {
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const prefersReduced = useReducedMotion();

  const rafRef = useRef<number | null>(null);
  const onMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (prefersReduced) return;
      const el = e.currentTarget;
      if (rafRef.current) return; // throttle: skip if frame pending
      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = null;
        const rect = el.getBoundingClientRect();
        const nx = (e.clientX - rect.left) / rect.width - 0.5;
        const ny = (e.clientY - rect.top) / rect.height - 0.5;
        setTilt({ x: ny * -10, y: nx * 10 });
      });
    },
    [prefersReduced],
  );
  const onLeave = useCallback(() => setTilt({ x: 0, y: 0 }), []);

  return (
    <motion.div
      className={`relative ${className ?? ""}`}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      animate={{ rotateX: tilt.x, rotateY: tilt.y }}
      transition={{ type: "spring", stiffness: 180, damping: 22 }}
      style={{ perspective: 900, transformStyle: "preserve-3d" }}
    >
      <div
        className="rounded-3xl overflow-hidden shadow-[0_30px_80px_-12px_rgba(0,0,0,0.5)] border border-white/10"
        style={{ transform: "translateZ(40px)" }}
      >
        <img
          src={src}
          alt={alt}
          loading="eager"
          className="w-full h-full object-cover"
          draggable={false}
        />
      </div>
      {/* Reflection / floor shadow */}
      <div
        className="absolute -bottom-6 left-1/2 -translate-x-1/2 w-[90%] h-10 rounded-full"
        style={{
          background: "radial-gradient(ellipse, rgba(245,197,24,0.12) 0%, transparent 70%)",
          filter: "blur(12px)",
          transform: "translateZ(-20px)",
        }}
      />
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/*  Scene content (what fills one product slide)                        */
/* ------------------------------------------------------------------ */

function SceneContent({
  scene,
  variants,
  itemV,
}: {
  scene: ProductScene;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  variants: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  itemV: any;
}) {
  const CtaWrapper = scene.cta.href.startsWith("mailto:") ? "a" : Link;
  const ctaHrefProps =
    scene.cta.href.startsWith("mailto:")
      ? { href: scene.cta.href }
      : { href: scene.cta.href };

  return (
    <motion.div
      className="relative z-10 h-full flex items-center"
      variants={variants}
      initial="hidden"
      animate="visible"
    >
      <div className="container mx-auto px-6 w-full">
        <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
          {/* Text column */}
          <div className="order-2 lg:order-1 space-y-6">
            <motion.div variants={itemV} className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full glass-panel text-primary text-xs font-bold tracking-[0.2em] uppercase">
                {scene.badgeIcon} {scene.badge}
              </span>
            </motion.div>

            <motion.h2
              variants={itemV}
              className="text-[clamp(2rem,5vw,3.6rem)] font-bold tracking-tight leading-[1.1] text-foreground"
            >
              {scene.title}
            </motion.h2>

            <motion.p
              variants={itemV}
              className="text-xl sm:text-2xl text-primary font-medium"
            >
              {scene.tagline}
            </motion.p>

            <motion.p
              variants={itemV}
              className="text-base sm:text-lg text-muted-foreground leading-relaxed max-w-xl"
            >
              {scene.description}
            </motion.p>

            <motion.ul variants={itemV} className="space-y-3">
              {scene.features.map((f, i) => (
                <li key={i} className="flex items-center gap-3 text-sm text-foreground/90">
                  <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 text-primary flex-shrink-0">
                    {f.icon}
                  </span>
                  {f.text}
                </li>
              ))}
            </motion.ul>

            <motion.div variants={itemV} className="pt-2">
              <Button
                asChild
                size="lg"
                className="bg-primary text-primary-foreground hover:bg-primary/90 h-13 px-8 text-base shadow-[0_0_24px_rgba(245,197,24,0.3)] hover:shadow-[0_0_36px_rgba(245,197,24,0.5)] transition-all duration-300 group"
              >
                <CtaWrapper {...ctaHrefProps}>
                  {scene.cta.label}
                  <ArrowRight aria-hidden="true" className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </CtaWrapper>
              </Button>
            </motion.div>
          </div>

          {/* Image column — 3D tilt card */}
          <motion.div
            variants={itemV}
            className="order-1 lg:order-2 flex justify-center"
          >
            <TiltImage
              src={scene.image}
              alt={scene.imageAlt}
              className="w-full max-w-sm lg:max-w-md aspect-[3/4]"
            />
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main cinematic showcase                                             */
/* ------------------------------------------------------------------ */

const AUTO_INTERVAL = 0; // Auto-advance removed — users navigate manually
  const [[page, direction], setPage] = useState([0, 0]);
  const [transitioning, setTransitioning] = useState(false);
  const [paused, setPaused] = useState(false);
  const autoRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const sectionRef = useRef<HTMLElement>(null);

  const idx = ((page % SCENES.length) + SCENES.length) % SCENES.length;
  const scene = SCENES[idx];

  const paginate = useCallback(
    (dir: number) => {
      setTransitioning(true);
      setPage(([p]) => [p + dir, dir]);
      // Clear transition state after animation completes
      setTimeout(() => setTransitioning(false), 1000);
    },
    [],
  );

  /* Auto-advance removed for accessibility — users navigate manually */

  /* Keyboard navigation */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") paginate(1);
      if (e.key === "ArrowLeft") paginate(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [paginate]);

  /* Swipe / drag end */
  const onDragEnd = useCallback(
    (_e: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
      if (Math.abs(info.offset.x) > SWIPE_THRESHOLD) {
        paginate(info.offset.x > 0 ? -1 : 1);
      }
    },
    [paginate],
  );

  const goTo = useCallback(
    (target: number) => {
      const diff = target - idx;
      if (diff === 0) return;
      paginate(diff > 0 ? 1 : -1);
    },
    [idx, paginate],
  );

  const v = prefersReduced ? reducedSlideVariants : slideVariants;
  const t = prefersReduced ? REDUCED_TRANSITION : SLIDE_TRANSITION;
  const cv = prefersReduced ? reducedContainer : contentContainer;
  const ci = prefersReduced ? reducedItem : contentItem;

  return (
    <section
      ref={sectionRef}
      className="relative w-full overflow-hidden"
      style={{ height: "100dvh", perspective: "1400px" }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      role="region"
      aria-roledescription="carousel"
      aria-label="Health HIVE product showcase"
    >
      {/* Per-scene ambient glow */}
      <AnimatePresence mode="wait">
        <motion.div
          key={scene.id + "-glow"}
          className="absolute pointer-events-none rounded-full"
          style={{
            width: "700px",
            height: "700px",
            left: scene.glowX,
            top: scene.glowY,
            background: `radial-gradient(circle, ${scene.glowColor} 0%, transparent 70%)`,
          }}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          transition={{ duration: 0.8, ease: EASE }}
        />
      </AnimatePresence>

      {/* Secondary glow (bottom-right) */}
      <div
        className="absolute pointer-events-none rounded-full"
        style={{
          width: "500px",
          height: "500px",
          right: "-5%",
          bottom: "-5%",
          background: "radial-gradient(circle, rgba(245,197,24,0.05) 0%, transparent 70%)",
        }}
      />

      {/* Slides */}
      <AnimatePresence initial={false} custom={direction} mode="popLayout">
        <motion.div
          key={page}
          custom={direction}
          variants={v}
          initial="enter"
          animate="center"
          exit="exit"
          transition={t}
          className="absolute inset-0 pt-20"
          style={{ transformStyle: "preserve-3d", willChange: "transform, opacity" }}
          drag={prefersReduced ? false : "x"}
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.05}
          onDragEnd={onDragEnd}
          role="group"
          aria-roledescription="slide"
          aria-label={`${idx + 1} of ${SCENES.length}: ${scene.id}`}
        >
          <SceneContent scene={scene} variants={cv} itemV={ci} />
        </motion.div>
      </AnimatePresence>

      {/* Light streak during transition */}
      <LightStreak show={transitioning} />

      {/* ---- Navigation controls ---- */}

      {/* Arrows */}
      {!prefersReduced && (
        <>
          <button
            type="button"
            onClick={() => paginate(-1)}
            aria-label="Previous product"
            className="absolute left-4 top-1/2 -translate-y-1/2 z-20 flex h-12 w-12 items-center justify-center rounded-full glass-panel border-border/60 text-foreground/70 hover:text-primary hover:border-primary/40 transition-all duration-300 hidden sm:flex"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <button
            type="button"
            onClick={() => paginate(1)}
            aria-label="Next product"
            className="absolute right-4 top-1/2 -translate-y-1/2 z-20 flex h-12 w-12 items-center justify-center rounded-full glass-panel border-border/60 text-foreground/70 hover:text-primary hover:border-primary/40 transition-all duration-300 hidden sm:flex"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
        </>
      )}

      {/* Progress dots + counter */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex items-center gap-6">
        <div className="flex items-center gap-2.5" role="tablist" aria-label="Product slides">
          {SCENES.map((s, i) => {
            const active = i === idx;
            return (
              <button
                key={s.id}
                type="button"
                role="tab"
                aria-selected={active}
                aria-label={`Go to ${s.id}`}
                onClick={() => goTo(i)}
                className={`rounded-full transition-all duration-500 ${
                  active
                    ? "w-10 h-3 bg-primary shadow-[0_0_12px_rgba(245,197,24,0.5)]"
                    : "w-3 h-3 bg-foreground/20 hover:bg-foreground/40"
                }`}
              />
            );
          })}
        </div>
        <span className="text-xs text-muted-foreground/60 font-medium tabular-nums hidden sm:inline">
          {String(idx + 1).padStart(2, "0")} / {String(SCENES.length).padStart(2, "0")}
        </span>
      </div>

      {/* Scroll-to-continue hint */}
      <motion.div
        className="absolute bottom-8 right-8 z-20 hidden lg:flex flex-col items-center gap-1.5 text-muted-foreground/40"
        animate={prefersReduced ? {} : { y: [0, 6, 0] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
      >
        <span className="text-[10px] tracking-widest uppercase font-medium">Scroll</span>
        <ChevronDown className="h-4 w-4" />
      </motion.div>
    </section>
  );
}
