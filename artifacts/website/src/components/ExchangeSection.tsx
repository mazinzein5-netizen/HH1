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
