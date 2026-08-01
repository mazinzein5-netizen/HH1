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
import { HiveMark } from "@/components/HiveMark";

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
    title: "HIVE GP AutoCoder & Scribe",
    titleNode: (
      <>
        HIVE GP AutoCoder &amp; Scribe
      </>
    ),
    desc: "The doctors' workspace — AI-powered clinical coding, scribing and documentation for GPs and hospital doctors.",
    points: [
      { icon: FolderHeart, text: "Patient files with questionnaires, notes & attachments" },
      { icon: CalendarClock, text: "Automated HIVE booking & video consultations" },
    ],
    href: "/portal/practitioner",
    cta: "Enter the AutoCoder & Scribe",
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
              <h3 className="text-2xl font-bold text-foreground mb-3">
                {"titleNode" in p ? p.titleNode : p.title}
              </h3>
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
