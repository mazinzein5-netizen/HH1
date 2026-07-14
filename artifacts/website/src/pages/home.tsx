import { useEffect } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { HiveLogo } from "@/components/HiveLogo";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { HexagonBackground } from "@/components/HexagonBackground";
import { TrustStrip } from "@/components/TrustStrip";
import { 
  ArrowRight, ShieldCheck, FileText, Smartphone, 
  Stethoscope, Mail, ExternalLink, Activity,
  Lock, BookOpen, AlertCircle, Building2, Heart, Shield,
  MapPin, Pill, Video, Users
} from "lucide-react";

const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
} as const;

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15
    }
  }
};

export default function Home() {
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
      
      <HexagonBackground />

      {/* Navigation */}
      <motion.header 
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5 }}
        className="fixed top-0 left-0 right-0 z-50 bg-background/70 backdrop-blur-xl border-b border-border/50 supports-[backdrop-filter]:bg-background/50"
      >
        <div className="container mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <HiveLogo size={32} />
            <span className="font-semibold text-lg tracking-tight text-foreground">HEALTH HIVE</span>
          </div>
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-muted-foreground">
            <a href="#ecosystem" className="hover:text-primary transition-colors">Ecosystem</a>
            <a href="#companion" className="hover:text-primary transition-colors">HIVE Companion</a>
            <a href="#surgical-assistant" className="hover:text-primary transition-colors">Surgical Assistant</a>
          </nav>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <a href="https://surg-assist-copy-89eb0714.base44.app" target="_blank" rel="noreferrer">
              <Button variant="outline" className="hidden sm:flex border-primary/30 hover:border-primary text-primary hover:bg-primary/10 transition-all duration-300 glass-panel">
                Clinician Sign In
              </Button>
            </a>
          </div>
        </div>
      </motion.header>

      <main className="flex-grow pt-20">
        
        {/* Section 1: Hero */}
        <section className="relative pt-24 pb-32 lg:pt-40 lg:pb-40 flex items-center min-h-[90vh]">
          <div className="container mx-auto px-6 relative z-10 text-center max-w-5xl">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-panel text-primary text-xs font-bold tracking-[0.2em] uppercase mb-8 shadow-[0_0_15px_rgba(245,197,24,0.1)]"
            >
              <HiveLogo size={16} />
              HEALTH HIVE ECOSYSTEM
            </motion.div>
            
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.1 }}
              className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight mb-8 leading-[1.05] text-foreground drop-shadow-sm"
            >
              Patients arrive organised. <br />
              <span className="hive-gradient-text drop-shadow-sm">Clinicians stay supported.</span>
            </motion.h1>
            
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto mb-12 leading-relaxed font-light glass-panel px-6 py-4 rounded-3xl"
            >
              A connected health ecosystem from Ireland. Keep your own health records in your pocket, while on-call hospital doctors access AI decision support when they need it most.
            </motion.p>
            
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.3 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-5"
            >
              <a href="#companion" className="w-full sm:w-auto">
                <Button size="lg" className="w-full sm:w-auto bg-primary text-primary-foreground hover:bg-primary/90 h-14 px-8 text-base shadow-[0_0_20px_rgba(245,197,24,0.3)] hover:shadow-[0_0_30px_rgba(245,197,24,0.5)] transition-all duration-300">
                  Explore HIVE Companion
                </Button>
              </a>
              <a href="#surgical-assistant" className="w-full sm:w-auto">
                <Button size="lg" variant="outline" className="glass-panel w-full sm:w-auto h-14 px-8 text-base border-border hover:bg-card/80 transition-all duration-300">
                  Surgical Assistant <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </a>
            </motion.div>
          </div>
        </section>

        <TrustStrip />

        {/* Section 2: Ecosystem Overview */}
        <section id="ecosystem" className="py-24 relative">
          <div className="container mx-auto px-6">
            <motion.div 
              variants={staggerContainer}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              className="grid md:grid-cols-2 gap-16 items-center glass-panel-heavy p-8 md:p-16 rounded-[3rem]"
            >
              <motion.div variants={fadeInUp}>
                <div className="text-primary font-bold tracking-widest uppercase text-xs mb-4">One Unified Story</div>
                <h2 className="text-3xl md:text-5xl font-bold mb-6 leading-tight text-foreground">A precise, trustworthy health platform.</h2>
                <p className="text-muted-foreground text-lg mb-6 leading-relaxed">
                  We believe in empowering both sides of the care equation. By giving patients the tools to prepare for visits and manage their own records safely, and supporting clinicians with instant access to guidelines, we make healthcare more efficient and less stressful for everyone.
                </p>
                <div className="grid grid-cols-2 gap-8 mt-12">
                  <div className="space-y-4">
                    <div className="w-14 h-14 rounded-2xl glass-panel flex items-center justify-center text-primary shadow-inner">
                      <ShieldCheck className="h-7 w-7" />
                    </div>
                    <h3 className="font-semibold text-lg text-foreground">Privacy First</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">Your data stays on your device. Always. No central servers, no tracking.</p>
                  </div>
                  <div className="space-y-4">
                    <div className="w-14 h-14 rounded-2xl glass-panel flex items-center justify-center text-primary shadow-inner">
                      <Stethoscope className="h-7 w-7" />
                    </div>
                    <h3 className="font-semibold text-lg text-foreground">Clinically Aligned</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">Built to support standard clinical workflows and internationally recognised protocols.</p>
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
        <section id="companion" className="py-24 relative overflow-hidden">
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

            {/* Targeted Marketing Split */}
            <div className="grid lg:grid-cols-2 gap-8 mb-16">
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
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
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
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
                <h2 className="text-4xl md:text-6xl font-bold mb-8 tracking-tight text-foreground">Privacy is our hero feature.</h2>
                <p className="text-xl md:text-2xl font-light mb-12 text-foreground/80 leading-relaxed max-w-3xl mx-auto">
                  ALL personal data stays on your device — nothing is uploaded to a server. No tracking, no ads. You can "Delete all my data" at any time.
                </p>
                
                <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
                  <Button variant="secondary" size="lg" className="w-full sm:w-auto glass-panel hover:bg-card/80 h-auto min-h-14 whitespace-normal px-6 sm:px-8 opacity-70 cursor-not-allowed text-foreground">
                    App Store (Coming Soon)
                  </Button>
                  <Button variant="secondary" size="lg" className="w-full sm:w-auto glass-panel hover:bg-card/80 h-auto min-h-14 whitespace-normal px-6 sm:px-8 opacity-70 cursor-not-allowed text-foreground">
                    Google Play (Coming Soon)
                  </Button>
                </div>

                <div className="text-sm font-medium glass-panel p-6 rounded-2xl text-left inline-block max-w-2xl mx-auto border-primary/20">
                  <span className="text-primary font-bold uppercase tracking-wider text-xs block mb-2">Compliance Notice</span>
                  <span className="text-muted-foreground">HIVE Companion is a health record organiser. It is not a medical device, it does not diagnose or treat, and all personal data stays on your device.</span>
                </div>
              </div>
            </motion.div>
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
                <div className="relative rounded-3xl overflow-hidden glass-panel aspect-[4/3] flex flex-col group">
                   {/* Abstract representation of the web app */}
                   <div className="h-12 bg-background/50 border-b border-border flex items-center px-4 gap-2">
                     <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
                     <div className="w-3 h-3 rounded-full bg-yellow-500/80"></div>
                     <div className="w-3 h-3 rounded-full bg-green-500/80"></div>
                     <div className="ml-4 h-6 w-1/2 bg-muted/50 rounded-md"></div>
                   </div>
                   <div className="flex-1 relative overflow-hidden flex items-center justify-center p-8 bg-gradient-to-br from-card/30 to-background/30">
                     <div className="absolute inset-0 opacity-30 bg-[radial-gradient(circle_at_center,hsl(45_93%_47%/0.25),transparent_70%)] filter blur-xl group-hover:blur-md transition-all duration-700"></div>
                     <div className="relative z-10 text-center p-10 glass-panel-heavy rounded-3xl transform group-hover:scale-105 transition-transform duration-500">
                       <HiveLogo size={72} className="mx-auto mb-6" />
                       <div className="text-2xl font-bold text-foreground mb-2">Surgical Assistant</div>
                       <div className="text-sm text-primary uppercase tracking-widest font-semibold">Clinician Portal</div>
                     </div>
                   </div>
                </div>
                
                {/* Decorative elements */}
                <div className="absolute -bottom-6 -right-6 w-32 h-32 glass-panel rounded-2xl flex items-center justify-center -z-10">
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
                <h2 className="text-4xl md:text-6xl font-bold mb-6 text-foreground leading-tight">HIVE Surgical Assistant</h2>
                <p className="text-xl text-muted-foreground mb-10 leading-relaxed font-light">
                  An AI decision support companion designed specifically for on-call surgical teams and NCHDs.
                </p>
                
                <ul className="space-y-6 mb-12">
                  <li className="flex items-start gap-4 p-4 rounded-2xl glass-panel border-transparent hover:border-primary/30 transition-colors">
                    <div className="mt-1 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 text-primary border border-primary/20">
                      <ArrowRight className="h-4 w-4" />
                    </div>
                    <div>
                      <h4 className="text-foreground font-semibold text-lg mb-1">Instant Support</h4>
                      <span className="text-muted-foreground">Access critical guidance during demanding on-call shifts.</span>
                    </div>
                  </li>
                  <li className="flex items-start gap-4 p-4 rounded-2xl glass-panel border-transparent hover:border-primary/30 transition-colors">
                    <div className="mt-1 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 text-primary border border-primary/20">
                      <ArrowRight className="h-4 w-4" />
                    </div>
                    <div>
                      <h4 className="text-foreground font-semibold text-lg mb-1">Streamlined Workflows</h4>
                      <span className="text-muted-foreground">Tailored for non-consultant hospital doctors to improve efficiency.</span>
                    </div>
                  </li>
                </ul>

                <div className="p-5 glass-panel rounded-xl mb-10 shadow-inner border-primary/20">
                  <p className="text-sm font-medium text-muted-foreground flex items-center gap-3">
                    <AlertCircle className="h-5 w-5 text-primary flex-shrink-0" />
                    <span><strong className="text-foreground">AI Decision Support</strong> — Verify All Output Clinically.</span>
                  </p>
                </div>

                <a href="https://surg-assist-copy-89eb0714.base44.app" target="_blank" rel="noreferrer">
                  <Button size="lg" className="w-full sm:w-auto bg-primary text-primary-foreground hover:bg-primary/90 h-auto min-h-14 whitespace-normal px-6 sm:px-8 text-base shadow-[0_0_20px_rgba(245,197,24,0.3)] hover:shadow-[0_0_30px_rgba(245,197,24,0.5)] transition-all duration-300">
                    Open HIVE Surgical Assistant <ExternalLink className="ml-2 h-4 w-4 flex-shrink-0" />
                  </Button>
                </a>
              </motion.div>
            </div>
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
                <h4 className="font-semibold text-foreground mb-4">Ecosystem</h4>
                <ul className="space-y-3 text-sm">
                  <li><a href="#companion" className="text-muted-foreground hover:text-primary transition-colors">HIVE Companion App</a></li>
                  <li><a href="#surgical-assistant" className="text-muted-foreground hover:text-primary transition-colors">Surgical Assistant</a></li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold text-foreground mb-4">Legal</h4>
                <ul className="space-y-3 text-sm">
                  <li><a href="/api/privacy" target="_blank" rel="noreferrer" className="text-muted-foreground hover:text-primary transition-colors">Privacy Policy</a></li>
                </ul>
              </div>
            </div>
            
            <div className="pt-8 border-t border-border/50 flex flex-col md:flex-row justify-between items-center gap-4">
              <p className="text-sm text-muted-foreground">
                © {new Date().getFullYear()} IbnCeena Ltd. All rights reserved.
              </p>
              <div className="text-xs text-muted-foreground/60 flex items-center gap-2">
                <MapPin className="h-3 w-3" /> Dublin, Ireland
              </div>
            </div>
          </div>
        </footer>

      </main>
    </div>
  );
}
