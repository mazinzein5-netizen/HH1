import { lazy, Suspense, useEffect, useState } from "react";
import { Link } from "wouter";
import { PageHead } from "@/components/PageHead";
import { motion } from "framer-motion";
import { HiveLogo } from "@/components/HiveLogo";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { TrustStrip } from "@/components/TrustStrip";
import { ExchangeSection } from "@/components/ExchangeSection";
import { PortalAdvertsSection } from "@/components/PortalAdvertsSection";
import { IrishAlignmentSection } from "@/components/IrishAlignmentSection";
import { HiveMark } from "@/components/HiveMark";
import { CinematicShowcase } from "@/components/CinematicShowcase";
// Optimised WebP (52 KB vs 888 KB PNG)
const BEE_MASCOT = `${import.meta.env.BASE_URL}images/bee-mascot.webp`;
import {
  Stethoscope, Mail, Activity,
  MapPin, Menu, X, LogIn, Download, Heart, UserPlus, ChevronDown,
} from "lucide-react";

// Lazy-load heavy below-fold sections so they don't block the showcase
const CircuitHexBackground = lazy(() =>
  import("@/components/CircuitHexBackground").then((m) => ({ default: m.CircuitHexBackground })),
);

const SMOOTH_EASE = [0.22, 1, 0.36, 1] as const;

const fadeInUp = {
  hidden: { opacity: 0, y: 28 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: SMOOTH_EASE } },
} as const;

// Lightweight header animation (no heavy scroll/transform hooks)
const headerVariants = {
  hidden: { y: -100 },
  visible: { y: 0, transition: { duration: 0.6, ease: SMOOTH_EASE } },
};

export default function Home() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [appVersion, setAppVersion] = useState<string | null>(null);

  // Live Android release version for the download section
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

  // Smooth scroll for anchor links
  useEffect(() => {
    const handleAnchorClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const anchor = target.closest("a");
      if (anchor && anchor.hash && anchor.hash.startsWith("#")) {
        e.preventDefault();
        const el = document.getElementById(anchor.hash.slice(1));
        if (el) el.scrollIntoView({ behavior: "smooth" });
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
            legalName: "IbnCeena Ltd",
            url: "https://healthhive.app",
            logo: "https://healthhive.app/favicon.png",
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
            url: "https://healthhive.app/",
            publisher: { "@type": "Organization", name: "Health HIVE" },
          },
        ]}
      />
      <a href="#main-content" className="skip-link">Skip to main content</a>

      {/* Background: lazy-loaded so the showcase renders first */}
      <Suspense fallback={null}>
        <CircuitHexBackground />
      </Suspense>

      {/* ─── Navigation ─── */}
      <motion.header
        variants={headerVariants}
        initial="hidden"
        animate="visible"
        className="fixed top-0 left-0 right-0 z-50 bg-background/70 backdrop-blur-xl border-b border-border/50 supports-[backdrop-filter]:bg-background/50"
      >
        <div className="container mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src={BEE_MASCOT}
              alt="Health HIVE bee mascot"
              className="h-10 w-10 object-contain drop-shadow-[0_0_10px_rgba(245,197,24,0.35)]"
              fetchPriority="high"
              width={40}
              height={40}
            />
            <span className="font-semibold text-lg tracking-tight text-foreground">
              HEALTH <HiveMark />
            </span>
          </div>
          <nav aria-label="Main navigation" className="hidden md:flex items-center gap-8 text-sm font-medium text-muted-foreground">
            <a href="#exchange" className="hover:text-primary transition-colors">Data Exchange</a>
            <a href="#irish-alignment" className="hover:text-primary transition-colors">Irish Alignment</a>
            <a href="#portals" className="hover:text-primary transition-colors">Portals</a>
            <Link href="/book" className="hover:text-primary transition-colors">Book a Consultation</Link>
          </nav>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className="hidden sm:flex border-primary/30 hover:border-primary text-primary hover:bg-primary/10 transition-all duration-300 glass-panel"
                  data-testid="button-signin-menu"
                >
                  <LogIn aria-hidden="true" className="mr-2 h-4 w-4" />
                  Sign In / Sign Up
                  <ChevronDown aria-hidden="true" className="ml-2 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-72">
                <DropdownMenuLabel>Quick connect</DropdownMenuLabel>
                <DropdownMenuItem asChild>
                  <Link href="/portal/practitioner" className="cursor-pointer" data-testid="link-quick-practitioner">
                    <Stethoscope aria-hidden="true" className="mr-2 h-4 w-4 text-primary" />
                    GP &amp; HIVE HUB
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/portal/supportive" className="cursor-pointer" data-testid="link-quick-supportive">
                    <Heart aria-hidden="true" className="mr-2 h-4 w-4 text-primary" />
                    Supportive Care Sign In
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/portal/responder" className="cursor-pointer" data-testid="link-quick-responder">
                    <Activity aria-hidden="true" className="mr-2 h-4 w-4 text-primary" />
                    First Responders Sign In
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
                    Download HIVE Companion{appVersion ? ` (v${appVersion})` : ""}
                  </a>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button
              variant="outline"
              size="icon"
              className="md:hidden rounded-full bg-background/50 backdrop-blur border-border/50 text-foreground"
              aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"}
              aria-expanded={menuOpen}
              aria-controls="mobile-menu"
              onClick={() => setMenuOpen((o) => !o)}
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
              <a href="#exchange" onClick={() => setMenuOpen(false)} className="py-3 px-2 rounded-lg text-foreground hover:text-primary hover:bg-muted/50 transition-colors">Data Exchange</a>
              <a href="#irish-alignment" onClick={() => setMenuOpen(false)} className="py-3 px-2 rounded-lg text-foreground hover:text-primary hover:bg-muted/50 transition-colors">Irish Alignment</a>
              <a href="#portals" onClick={() => setMenuOpen(false)} className="py-3 px-2 rounded-lg text-foreground hover:text-primary hover:bg-muted/50 transition-colors">Portals</a>
              <Link href="/book" onClick={() => setMenuOpen(false)} className="py-3 px-2 rounded-lg text-foreground hover:text-primary hover:bg-muted/50 transition-colors">Book a Consultation</Link>
              <Link href="/portal/practitioner" onClick={() => setMenuOpen(false)} className="py-3 px-2 rounded-lg text-primary hover:bg-muted/50 transition-colors">GP &amp; HIVE HUB Sign In</Link>
              <Link href="/portal/supportive" onClick={() => setMenuOpen(false)} className="py-3 px-2 rounded-lg text-primary hover:bg-muted/50 transition-colors">Supportive Care Sign In</Link>
              <Link href="/portal/responder" onClick={() => setMenuOpen(false)} className="py-3 px-2 rounded-lg text-primary hover:bg-muted/50 transition-colors">First Responders Sign In</Link>
              <Link href="/portal/signup" onClick={() => setMenuOpen(false)} className="py-3 px-2 rounded-lg text-primary hover:bg-muted/50 transition-colors">Create an Account</Link>
              <a href="/api/app/download/android" onClick={() => setMenuOpen(false)} className="py-3 px-2 rounded-lg text-primary hover:bg-muted/50 transition-colors">
                Download HIVE Companion{appVersion ? ` (v${appVersion})` : ""}
              </a>
            </div>
          </nav>
        )}
      </motion.header>

      {/* ─── Main content ─── */}
      <main id="main-content" className="flex-grow pt-20">

        {/* ★ CINEMATIC 3D PRODUCT SHOWCASE ★ */}
        <CinematicShowcase />

        <TrustStrip />

        {/* Download / Try section (compact, below the fold) */}
        <section className="py-20 lg:py-28 relative overflow-hidden">
          <div className="container mx-auto px-6 relative z-10">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeInUp}
              className="max-w-4xl mx-auto glass-panel-heavy rounded-[3rem] p-6 sm:p-12 md:p-16 text-center border-primary/20 relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-primary/10 blur-[100px] pointer-events-none rounded-full" />

              <div className="relative z-10">
                <div className="inline-flex items-center justify-center mb-6">
                  <img
                    src={BEE_MASCOT}
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
                  <Button asChild size="lg" className="w-full sm:w-auto h-auto min-h-14 whitespace-normal px-6 sm:px-8 font-semibold">
                    <a href="/api/app/download/android" data-testid="button-download-android">
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

        <ExchangeSection />
        <IrishAlignmentSection />
        <PortalAdvertsSection />

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
                  <li><Link href="/portal/practitioner" className="text-muted-foreground hover:text-primary transition-colors">GP &amp; HIVE HUB</Link></li>
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
