import { useEffect, useRef, useState } from "react";
import { Link } from "wouter";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { HiveLogo } from "@/components/HiveLogo";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { RubberBackground } from "@/components/RubberBackground";
import { TrustStrip } from "@/components/TrustStrip";
import { VideoEmbed } from "@/components/VideoEmbed";
import { VideoShowcase } from "@/components/VideoShowcase";
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
      <RubberBackground />
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
            <a href="#surgical-assistant" className="hover:text-primary transition-colors">Surgical Assistant</a>
            <a href="#enterprise" className="hover:text-primary transition-colors">For Hospitals &amp; GPs</a>
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
              <a href="#surgical-assistant" onClick={() => setMenuOpen(false)} className="py-3 px-2 rounded-lg text-foreground hover:text-primary hover:bg-muted/50 transition-colors">Surgical Assistant</a>
              <a href="#enterprise" onClick={() => setMenuOpen(false)} className="py-3 px-2 rounded-lg text-foreground hover:text-primary hover:bg-muted/50 transition-colors">For Hospitals &amp; GPs</a>
              <Link href="/book" onClick={() => setMenuOpen(false)} className="py-3 px-2 rounded-lg text-foreground hover:text-primary hover:bg-muted/50 transition-colors">
                Book a Consultation
              </Link>
              <Link href="/portal/practitioner" onClick={() => setMenuOpen(false)} className="py-3 px-2 rounded-lg text-primary hover:bg-muted/50 transition-colors">
                Clinician Sign In
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
              className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight mb-8 leading-[1.05] text-foreground drop-shadow-sm"
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
                <h2 className="text-3xl md:text-5xl font-bold mb-6 leading-tight text-foreground">Clinicians receive streamlined and comprehensive data.</h2>
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
              <h2 className="text-4xl md:text-6xl font-bold mb-6 text-foreground">HIVE Companion</h2>
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
                <h2 className="text-4xl md:text-6xl font-bold mb-8 tracking-tight text-foreground">Gold Standards in documentation and advanced privacy features</h2>
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
              <h2 className="text-4xl md:text-6xl font-bold mb-4 text-foreground">See the HIVE in action</h2>
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
                <h2 className="text-4xl md:text-6xl font-bold mb-6 text-foreground leading-tight">HIVE Hospital Surgical Assistant</h2>
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
              <h2 className="text-4xl md:text-6xl font-bold mb-6 text-foreground leading-tight">
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

        {/* Section 6: Footer */}
        <footer className="py-16 relative overflow-hidden border-t border-border/40 glass-panel-heavy rounded-t-[3rem] mt-24">
          <div className="container mx-auto px-6 relative z-10">
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
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
                  <li><a href="#surgical-assistant" className="text-muted-foreground hover:text-primary transition-colors">Surgical Assistant</a></li>
                  <li><a href="#enterprise" className="text-muted-foreground hover:text-primary transition-colors">For Hospitals &amp; GP Practices</a></li>
                  <li><a href={`${import.meta.env.BASE_URL}portal`} className="text-muted-foreground hover:text-primary transition-colors">Emergency Portal</a></li>
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
