import { lazy, Suspense, useEffect, useState } from "react";
import { Link } from "wouter";
import { PageHead } from "@/components/PageHead";
import { motion } from "framer-motion";
import { HiveLogo } from "@/components/HiveLogo";
import { HiveMark } from "@/components/HiveMark";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { TrustStrip } from "@/components/TrustStrip";
import { ExchangeSection } from "@/components/ExchangeSection";
import { PortalAdvertsSection } from "@/components/PortalAdvertsSection";
import { IrishAlignmentSection } from "@/components/IrishAlignmentSection";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ArrowRight, Smartphone, Activity, Stethoscope, FileText, Pill,
  AlertCircle, ShieldCheck, HardDrive, MapPin, Menu, X, LogIn,
  Download, Heart, UserPlus, ChevronDown, Mail,
  Sparkles, ClipboardList, Lock, Euro, Flag,
} from "lucide-react";

const BEE = `${import.meta.env.BASE_URL}images/bee-mascot.webp`;

const EASE: [number, number, number, number] = [0.25, 0.1, 0.25, 1];
const fi = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-40px" },
  transition: { duration: 0.5, ease: EASE },
} as const;

/* ─── Product cards (from V2) ─── */
const PRODUCTS = [
  {
    id: "c",
    badge: "FOR PATIENTS",
    bi: <Smartphone className="h-3 w-3" />,
    title: <>HiveMark Companion</>,
    titleRender: (<><HiveMark /> Companion</>),
    tag: "Walk into any appointment ready.",
    desc: "Your health story, already organised. Records, prescriptions, and an emergency health card — all on your device, all under your control.",
    feat: [
      { i: <FileText className="h-4 w-4" />, t: "Health records & prescriptions in one place" },
      { i: <Pill className="h-4 w-4" />, t: "Standardised questionnaires before every visit" },
      { i: <AlertCircle className="h-4 w-4" />, t: "Emergency health card when it matters most" },
    ],
    cta: { l: "Download for Android", h: "/api/app/download/android" },
    img: `${import.meta.env.BASE_URL}images/brand-companion.webp`,
    alt: "HIVE Companion app",
    glow: "rgba(245,197,24,0.10)",
    rev: false,
  },
  {
    id: "s",
    badge: "FOR CLINICAL TEAMS",
    bi: <Activity className="h-3 w-3" />,
    title: <>HIVE HOSPITAL Surgical Assistant</>,
    titleRender: (<>HIVE HOSPITAL Surgical Assistant</>),
    tag: "Precision documentation. Faster workflows.",
    desc: "Patient files digitised and organised. Photo recognition turns captured data into structured records in seconds.",
    feat: [
      { i: <ClipboardList className="h-4 w-4" />, t: "Fast documentation with photo recognition" },
      { i: <Lock className="h-4 w-4" />, t: "Encrypted by design — data stays on device" },
      { i: <Sparkles className="h-4 w-4" />, t: "AI decision support for clinicians" },
    ],
    cta: { l: "Open Surgical Assistant", h: "/portal/practitioner" },
    img: `${import.meta.env.BASE_URL}images/brand-surgical.webp`,
    alt: "HIVE Surgical Assistant",
    glow: "rgba(110,168,255,0.10)",
    rev: true,
  },
  {
    id: "g",
    badge: "FOR PRACTICES",
    bi: <Stethoscope className="h-3 w-3" />,
    title: <>HIVE GP AutoCoder & Scribe</>,
    titleRender: (<>HIVE GP AutoCoder & Scribe</>),
    tag: "More time with patients. Less time on paperwork.",
    desc: "Patients arrive with standardised questionnaires already completed. AI drafts referral letters and clinic summaries — you review and sign off.",
    feat: [
      { i: <ClipboardList className="h-4 w-4" />, t: "Structured pre-appointment intake" },
      { i: <Sparkles className="h-4 w-4" />, t: "AI-augmented documentation & referral letters" },
      { i: <Euro className="h-4 w-4" />, t: "Measurable savings on administration time" },
    ],
    cta: { l: "Contact About Enterprise", h: "mailto:info@ibnceena.ie?subject=Enterprise%20enquiry%20%E2%80%94%20Health%20HIVE" },
    img: `${import.meta.env.BASE_URL}images/gp-consult.webp`,
    alt: "GP consulting",
    glow: "rgba(52,211,153,0.08)",
    rev: false,
  },
];

function ProductCard({ p }: { p: (typeof PRODUCTS)[0] }) {
  const W = p.cta.h.startsWith("mailto:") ? "a" : Link;
  return (
    <div id={`product-${p.id}`} className="relative flex items-center overflow-hidden py-16 lg:py-24">
      <div
        className="absolute pointer-events-none rounded-full"
        style={{
          width: 500, height: 500,
          left: p.rev ? "60%" : "15%", top: "20%",
          background: `radial-gradient(circle,${p.glow} 0%,transparent 70%)`,
        }}
      />
      <div className="container mx-auto px-6 w-full relative z-10">
        <div className={`grid lg:grid-cols-2 gap-10 lg:gap-16 items-center ${p.rev ? "lg:[direction:rtl]" : ""}`}>
          <div className="space-y-5" style={{ direction: "ltr" }}>
            <motion.div {...fi} className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full glass-panel text-primary text-xs font-bold tracking-[0.2em] uppercase">
                {p.bi} {p.badge}
              </span>
            </motion.div>
            <motion.h2 {...fi} className="text-[clamp(2rem,5vw,3.8rem)] font-bold tracking-tight leading-[1.1] text-foreground">
              {p.titleRender}
            </motion.h2>
            <motion.p {...fi} className="text-xl sm:text-2xl text-primary font-medium">{p.tag}</motion.p>
            <motion.p {...fi} className="text-base sm:text-lg text-muted-foreground leading-relaxed max-w-xl">{p.desc}</motion.p>
            <motion.ul {...fi} className="space-y-3">
              {p.feat.map((f, j) => (
                <li key={j} className="flex items-center gap-3 text-sm text-foreground/90">
                  <span className="flex items-center justify-center w-9 h-9 rounded-lg bg-primary/10 border border-primary/20 text-primary flex-shrink-0">
                    {f.i}
                  </span>
                  {f.t}
                </li>
              ))}
            </motion.ul>
            <motion.div {...fi} className="pt-2">
              <Button asChild size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 h-12 px-7 text-sm shadow-[0_0_20px_rgba(245,197,24,0.25)] hover:shadow-[0_0_32px_rgba(245,197,24,0.45)] transition-all duration-300 group">
                <W href={p.cta.h}>
                  {p.cta.l} <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </W>
              </Button>
            </motion.div>
          </div>
          <motion.div {...fi} className="flex justify-center" style={{ direction: "ltr" }}>
            <div className="relative w-full max-w-sm lg:max-w-md">
              <div className="rounded-3xl overflow-hidden shadow-[0_24px_60px_-12px_rgba(0,0,0,0.4)] border border-white/10">
                <img src={p.img} alt={p.alt} className="w-full aspect-[3/4] object-cover" loading="lazy" draggable={false} />
              </div>
              <div
                className="absolute -bottom-5 left-1/2 -translate-x-1/2 w-[80%] h-8 rounded-full pointer-events-none"
                style={{ background: `radial-gradient(ellipse,${p.glow} 0%,transparent 70%)`, filter: "blur(10px)" }}
              />
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [appVersion, setAppVersion] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/app/latest")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!cancelled && data?.version) setAppVersion(String(data.version));
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    const handleAnchorClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const anchor = target.closest("a");
      if (anchor && anchor.hash && anchor.hash.startsWith("#")) {
        const el = document.getElementById(anchor.hash.slice(1));
        if (el) { e.preventDefault(); el.scrollIntoView({ behavior: "smooth" }); }
      }
    };
    document.addEventListener("click", handleAnchorClick);
    if (window.location.hash) {
      const el = document.getElementById(window.location.hash.slice(1));
      if (el) requestAnimationFrame(() => el.scrollIntoView());
    }
    return () => document.removeEventListener("click", handleAnchorClick);
  }, []);

  return (
    <div className="flex flex-col min-h-[100dvh] bg-transparent text-foreground overflow-x-hidden font-sans">
      <PageHead
        title="Safe Digitisation of Patient Files in Ireland"
        description="Health HIVE is an Irish digital health platform for the safe, auditable digitisation of patient files — GDPR-first records for patients, GPs and hospitals."
        path="/"
        ogTitle="Health HIVE — Safe, Auditable Digital Patient Records for Ireland"
        ogDescription="Safe, auditable digital patient records for Ireland — GDPR-first, built for patients, GPs and hospital teams."
        keywords="digital health Ireland, digital patient records, safe digitisation patient files, audit trail patient records, GDPR healthcare Ireland, Digital for Care 2030, Sláintecare digital, HIQA information standards, GP practice software Ireland, hospital documentation Ireland, primary care digitisation, secondary care digitisation"
        jsonLd={[
          {
            "@context": "https://schema.org",
            "@type": "Organization",
            name: "Health HIVE",
            legalName: "HIVE HEALTH ECOSYSTEM Ltd",
            url: "https://healthhive.ie",
            logo: "https://healthhive.ie/favicon.png",
            email: "info@ibnceena.ie",
            address: { "@type": "PostalAddress", addressLocality: "Dublin", addressCountry: "IE" },
            description: "Irish digital health platform for the safe, auditable digitisation of patient files in primary and secondary care.",
          },
          {
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            name: "HIVE Companion",
            operatingSystem: "Android",
            applicationCategory: "HealthApplication",
            offers: { "@type": "Offer", price: "0", priceCurrency: "EUR" },
            description: "Patient-held digital health record app — organised records, prescriptions, standardised questionnaires and an emergency health card, with all personal data stored on the device.",
            url: "https://healthhive.ie/",
            publisher: { "@type": "Organization", name: "Health HIVE" },
          },
        ]}
      />
      <a href="#main-content" className="skip-link">Skip to main content</a>

      {/* ─── Navigation ─── */}
      <motion.header
        initial={{ y: -80 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.4, ease: EASE }}
        className="fixed top-0 left-0 right-0 z-50 bg-background/70 backdrop-blur-xl border-b border-border/50 supports-[backdrop-filter]:bg-background/50"
      >
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <img
              src={BEE}
              alt="Health HIVE bee mascot"
              className="h-8 w-8 object-contain drop-shadow-[0_0_8px_rgba(245,197,24,0.3)]"
              fetchPriority="high"
              width={32}
              height={32}
            />
            <span className="font-semibold text-base tracking-tight text-foreground">
              HEALTH <HiveMark />
            </span>
          </div>
          <nav aria-label="Main navigation" className="hidden md:flex items-center gap-6 text-sm font-medium text-muted-foreground">
            <a href="#products" className="hover:text-primary transition-colors">Products</a>
            <a href="#exchange" className="hover:text-primary transition-colors">Data Exchange</a>
            <a href="#irish-alignment" className="hover:text-primary transition-colors">Irish Alignment</a>
            <a href="#portals" className="hover:text-primary transition-colors">Portals</a>
            <Link href="/book" className="hover:text-primary transition-colors">Book</Link>
          </nav>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className="hidden sm:flex border-primary/30 hover:border-primary text-primary hover:bg-primary/10 transition-all glass-panel h-9 px-3 text-xs"
                  data-testid="button-signin-menu"
                >
                  <LogIn aria-hidden="true" className="mr-1.5 h-3.5 w-3.5" />
                  Sign In
                  <ChevronDown aria-hidden="true" className="ml-1 h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Quick connect</DropdownMenuLabel>
                <DropdownMenuItem asChild>
                  <Link href="/portal/practitioner" className="cursor-pointer" data-testid="link-quick-practitioner">
                    <Stethoscope aria-hidden="true" className="mr-2 h-4 w-4 text-primary" />
                    HIVE GP AutoCoder &amp; Scribe
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/portal/supportive" className="cursor-pointer" data-testid="link-quick-supportive">
                    <Heart aria-hidden="true" className="mr-2 h-4 w-4 text-primary" />
                    Supportive Care
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/portal/responder" className="cursor-pointer" data-testid="link-quick-responder">
                    <Activity aria-hidden="true" className="mr-2 h-4 w-4 text-primary" />
                    First Responders
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/portal/signup" className="cursor-pointer" data-testid="link-quick-signup">
                    <UserPlus aria-hidden="true" className="mr-2 h-4 w-4 text-primary" />
                    Create an account
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <a href="/api/app/download/android" className="cursor-pointer" data-testid="link-quick-download">
                    <Download aria-hidden="true" className="mr-2 h-4 w-4 text-primary" />
                    Download Companion{appVersion ? ` (v${appVersion})` : ""}
                  </a>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button
              variant="outline"
              size="icon"
              className="md:hidden rounded-full h-9 w-9 bg-background/50"
              aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"}
              aria-expanded={menuOpen}
              aria-controls="mobile-menu"
              onClick={() => setMenuOpen((o) => !o)}
            >
              {menuOpen ? <X aria-hidden="true" className="h-4 w-4" /> : <Menu aria-hidden="true" className="h-4 w-4" />}
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
              {[
                { label: "Products", href: "#products" },
                { label: "Data Exchange", href: "#exchange" },
                { label: "Irish Alignment", href: "#irish-alignment" },
                { label: "Portals", href: "#portals" },
              ].map((item) => (
                <a key={item.href} href={item.href} onClick={() => setMenuOpen(false)} className="py-3 px-2 rounded-lg text-foreground hover:text-primary hover:bg-muted/50 transition-colors">
                  {item.label}
                </a>
              ))}
              <Link href="/book" onClick={() => setMenuOpen(false)} className="py-3 px-2 rounded-lg text-foreground hover:text-primary hover:bg-muted/50 transition-colors">Book a Consultation</Link>
              <Link href="/portal/practitioner" onClick={() => setMenuOpen(false)} className="py-2 px-2 rounded-lg text-primary hover:bg-muted/50 transition-colors">HIVE GP AutoCoder &amp; Scribe</Link>
              <Link href="/portal/supportive" onClick={() => setMenuOpen(false)} className="py-2 px-2 rounded-lg text-primary hover:bg-muted/50 transition-colors">Supportive Care</Link>
              <Link href="/portal/responder" onClick={() => setMenuOpen(false)} className="py-2 px-2 rounded-lg text-primary hover:bg-muted/50 transition-colors">First Responders</Link>
              <Link href="/portal/signup" onClick={() => setMenuOpen(false)} className="py-2 px-2 rounded-lg text-primary hover:bg-muted/50 transition-colors">Create an Account</Link>
              <a href="/api/app/download/android" onClick={() => setMenuOpen(false)} className="py-2 px-2 rounded-lg text-primary hover:bg-muted/50 transition-colors">
                Download Companion{appVersion ? ` (v${appVersion})` : ""}
              </a>
            </div>
          </nav>
        )}
      </motion.header>

      {/* ─── Main content ─── */}
      <main id="main-content" className="flex-grow pt-16">

        {/* ★ HERO (from V2) ★ */}
        <section className="relative flex items-center justify-center overflow-hidden min-h-[calc(100dvh-4rem)]">
          <div className="absolute top-1/4 left-1/3 w-[500px] h-[500px] rounded-full pointer-events-none" style={{ background: "radial-gradient(circle,rgba(245,197,24,0.10) 0%,transparent 70%)" }} />
          <div className="container mx-auto px-6 text-center relative z-10">
            <motion.div {...fi} className="mb-6">
              <img
                src={BEE}
                alt="Health HIVE bee mascot"
                className="w-20 h-20 mx-auto object-contain drop-shadow-[0_0_25px_rgba(245,197,24,0.4)]"
                width={80}
                height={80}
                fetchPriority="high"
              />
            </motion.div>
            <motion.h1 {...fi} className="text-[clamp(2.5rem,7vw,5.5rem)] font-bold tracking-tight leading-[1.05] text-foreground mb-5">
              Healthcare that <span className="hive-gradient-text">works for you</span>
            </motion.h1>
            <motion.p {...fi} className="text-[clamp(1rem,2.5vw,1.35rem)] text-muted-foreground max-w-2xl mx-auto mb-8 leading-relaxed font-light">
              An Irish digital health platform for the safe, auditable digitisation of patient files — GDPR-first, built for patients, GPs and hospitals.
            </motion.p>
            <motion.div {...fi} className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button asChild size="lg" className="h-13 px-9 text-base shadow-[0_0_20px_rgba(245,197,24,0.3)] hover:shadow-[0_0_36px_rgba(245,197,24,0.5)] transition-all group">
                <a href="/api/app/download/android">
                  Download Companion <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </a>
              </Button>
              <Button variant="outline" size="lg" asChild className="h-13 px-9 text-base glass-panel border-primary/30 hover:border-primary hover:bg-primary/10 transition-all">
                <a href="#products">Explore Products</a>
              </Button>
            </motion.div>
          </div>
        </section>

        {/* ★ TRUST STRIP ★ */}
        <TrustStrip />

        {/* ★ PRODUCT CARDS (from V2) ★ */}
        <div id="products" className="relative">
          {PRODUCTS.map((p) => (
            <ProductCard key={p.id} p={p} />
          ))}
        </div>

        {/* ★ ENCRYPTED DATA EXCHANGE (from V1) ★ */}
        <div id="exchange">
          <ExchangeSection />
        </div>

        {/* ★ IRISH ALIGNMENT (from V1) ★ */}
        <div id="irish-alignment">
          <IrishAlignmentSection />
        </div>

        {/* ★ PORTAL ADVERTS (from V1) ★ */}
        <div id="portals">
          <PortalAdvertsSection />
        </div>

        {/* ★ DOWNLOAD / CTA SECTION (merged) ★ */}
        <section className="py-20 lg:py-28 relative overflow-hidden">
          <div className="container mx-auto px-6 relative z-10">
            <motion.div
              {...fi}
              className="max-w-4xl mx-auto glass-panel-heavy rounded-[3rem] p-6 sm:p-12 md:p-16 text-center border-primary/20 relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-primary/10 blur-[100px] pointer-events-none rounded-full" />
              <div className="relative z-10">
                <div className="inline-flex items-center justify-center mb-6">
                  <img
                    src={BEE}
                    alt="Health HIVE bee mascot"
                    className="w-20 sm:w-24 object-contain drop-shadow-[0_0_25px_rgba(245,197,24,0.35)]"
                    loading="lazy"
                    width={96}
                    height={96}
                  />
                </div>
                <h2 className="text-[clamp(1.8rem,4vw,3rem)] font-bold mb-6 tracking-tight text-foreground text-balance">
                  Try the HIVE Companion Application
                </h2>
                <p className="text-lg md:text-xl font-light mb-8 text-foreground/80 leading-relaxed max-w-2xl mx-auto">
                  ALL personal data stays on your device — nothing is uploaded to a server. No tracking, no ads. You can &quot;Delete all my data&quot; at any time.
                </p>
                <h3 className="text-base md:text-lg font-bold text-foreground mb-5" data-testid="text-download-title">
                  Download Health <HiveMark /> Android test flight{appVersion ? ` — v${appVersion}` : ""}
                </h3>
                <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-5">
                  <Button asChild size="lg" className="w-full sm:w-auto h-auto min-h-14 whitespace-normal px-6 sm:px-8 font-semibold shadow-[0_0_20px_rgba(245,197,24,0.25)] hover:shadow-[0_0_36px_rgba(245,197,24,0.45)] transition-all">
                    <a href="/api/app/download/android" data-testid="button-download-android">
                      <Download className="mr-2 h-5 w-5" />
                      Download for Android (APK){appVersion ? ` · v${appVersion}` : ""}
                    </a>
                  </Button>
                  <Button variant="secondary" size="lg" disabled aria-disabled="true" className="w-full sm:w-auto glass-panel h-auto min-h-14 whitespace-normal px-6 sm:px-8 text-foreground">
                    iPhone &amp; iPad — Soon to Follow
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground mb-10 max-w-xl mx-auto">
                  {appVersion ? (
                    <>Saves as <span className="font-mono text-foreground/80" data-testid="text-apk-filename">HealthHIVE-v{appVersion}.apk</span>. </>
                  ) : null}
                  Android: after downloading, tap the file and allow installation when your phone asks.
                </p>
                <div className="text-sm font-medium glass-panel p-5 rounded-2xl text-left inline-block max-w-xl mx-auto border-primary/20">
                  <span className="text-primary font-bold uppercase tracking-wider text-xs block mb-2">Compliance Notice</span>
                  <span className="text-muted-foreground">HIVE Companion is a health record organiser. It is not a medical device, it does not diagnose or treat, and all personal data stays on your device.</span>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

      </main>

      {/* ─── Footer ─── */}
        <footer className="py-16 relative overflow-hidden border-t border-border/40 glass-panel-heavy rounded-t-[3rem] mt-24">
          <div className="container mx-auto px-6 relative z-10">
            <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-12 mb-12">
              <div className="col-span-1 md:col-span-2">
                <div className="flex items-center gap-3 mb-6">
                  <HiveLogo size={32} />
                  <span className="font-semibold text-xl tracking-tight text-foreground">HEALTH <HiveMark /></span>
                </div>
                <p className="text-muted-foreground mb-6 max-w-sm">
                  Health HIVE is an Irish digital health platform for the safe, auditable
                  digitisation of patient files in primary and secondary care — patient-held
                  records, streamlined clinical documentation and GDPR-first data protection.
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
                  <li><a href="#exchange" className="text-muted-foreground hover:text-primary transition-colors">Encrypted Data Exchange</a></li>
                  <li><a href="#portals" className="text-muted-foreground hover:text-primary transition-colors">For Hospitals &amp; GP Practices</a></li>
                  <li><Link href="/portal" className="text-muted-foreground hover:text-primary transition-colors">Emergency Portal</Link></li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-4">Professional Portals</h3>
                <ul className="space-y-3 text-sm">
                  <li><Link href="/portal/practitioner" className="text-muted-foreground hover:text-primary transition-colors">HIVE GP AutoCoder &amp; Scribe</Link></li>
                  <li><Link href="/portal/supportive" className="text-muted-foreground hover:text-primary transition-colors">Supportive Care Professionals</Link></li>
                  <li><Link href="/portal/responder" className="text-muted-foreground hover:text-primary transition-colors">First Responders</Link></li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-4">Legal</h3>
                <ul className="space-y-3 text-sm">
                  <li><a href="/portal/privacy" target="_blank" rel="noreferrer" className="text-muted-foreground hover:text-primary transition-colors">Privacy Policy</a></li>
                </ul>
              </div>
            </div>
            <div className="pt-8 border-t border-border/50 flex flex-col md:flex-row justify-between items-center gap-4">
              <p className="text-sm text-muted-foreground">
                © {new Date().getFullYear()} HIVE HEALTH ECOSYSTEM Ltd. All rights reserved.
              </p>
              <div className="text-xs text-muted-foreground flex items-center gap-2">
                <MapPin className="h-3 w-3" /> Dublin, Ireland
              </div>
            </div>
          </div>
        </footer>
  </div>
  );
}
