import { motion } from "framer-motion";
import { Landmark, FileCheck2, ScrollText, BookOpenCheck, ShieldCheck } from "lucide-react";

const SMOOTH_EASE = [0.22, 1, 0.36, 1] as const;

const fadeInUp = {
  hidden: { opacity: 0, y: 28 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: SMOOTH_EASE } },
} as const;

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const frameworks = [
  {
    icon: <Landmark className="h-5 w-5" />,
    title: "Digital for Care 2024–2030",
    desc: "Ireland's national digital health framework — secure digital health records and a digitally enabled health service. Health HIVE is built in step with this direction of travel.",
  },
  {
    icon: <FileCheck2 className="h-5 w-5" />,
    title: "Sláintecare",
    desc: "Right care, right place, right time. Streamlined digital patient files support the shift of care into primary and community settings.",
  },
  {
    icon: <ScrollText className="h-5 w-5" />,
    title: "HIQA Information Standards",
    desc: "Designed with awareness of HIQA's National Standards for Information Management in Health and Social Care — structured, safe, high-quality health information.",
  },
  {
    icon: <BookOpenCheck className="h-5 w-5" />,
    title: "Health Information Act",
    desc: "Ireland's new legal foundation for digital health records and patient summaries. Health HIVE's patient-held, consent-first record model anticipates this landscape.",
  },
  {
    icon: <ShieldCheck className="h-5 w-5" />,
    title: "GDPR & Data Protection Act 2018",
    desc: "Audit trails, access logging and data minimisation built in — supporting the record-keeping obligations that apply to every GP practice and hospital in Ireland.",
  },
];

export function IrishAlignmentSection() {
  return (
    <section id="irish-alignment" className="py-20 lg:py-28 relative">
      <div className="container mx-auto px-6">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          variants={staggerContainer}
          className="glass-panel-heavy rounded-[2rem] md:rounded-[3rem] p-6 sm:p-10 md:p-14 max-w-6xl mx-auto"
        >
          <motion.div variants={fadeInUp} className="text-center max-w-3xl mx-auto mb-10">
            <div className="text-primary font-bold tracking-widest uppercase mb-4 text-[13px]">
              Republic of Ireland
            </div>
            <h2 className="text-[clamp(1.8rem,3.6vw,2.8rem)] font-bold mb-4 leading-tight text-balance text-foreground">
              Aligned with Ireland's digital health direction
            </h2>
            <p className="text-muted-foreground text-lg font-light leading-relaxed">
              Safe digitisation of the patient file — with auditability at its core — is now
              national policy for primary and secondary care in Ireland. Health HIVE is designed
              to move in step with these frameworks. Alignment reflects our design goals, not an
              endorsement, approval or certification by any public body.
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
            {frameworks.map((item, idx) => (
              <motion.div
                key={idx}
                variants={fadeInUp}
                className="flex items-start gap-4 p-5 rounded-2xl glass-panel border-transparent hover:border-primary/30 transition-colors"
              >
                <div className="mt-0.5 w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0 text-primary border border-primary/20">
                  {item.icon}
                </div>
                <div>
                  <h3 className="text-foreground font-semibold text-base mb-1">{item.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{item.desc}</p>
                </div>
              </motion.div>
            ))}
            <motion.div
              variants={fadeInUp}
              className="flex items-start gap-4 p-5 rounded-2xl glass-panel border-primary/20"
            >
              <div>
                <h3 className="text-foreground font-semibold text-base mb-1">In one line</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Health HIVE is an Irish digital health platform for the safe, auditable
                  digitisation of patient files across primary and secondary care — patient-held
                  records, streamlined clinical documentation and GDPR-first data protection.
                </p>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
