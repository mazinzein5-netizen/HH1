import { useEffect } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { HiveLogo } from "@/components/HiveLogo";
import { Button } from "@/components/ui/button";
import { 
  ArrowRight, ShieldCheck, FileText, Smartphone, 
  Stethoscope, Mail, ExternalLink, Activity,
  Lock, BookOpen, AlertCircle, Building2
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
        const element = document.querySelector(anchor.hash);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
      }
    };
    document.addEventListener('click', handleAnchorClick);
    return () => document.removeEventListener('click', handleAnchorClick);
  }, []);

  return (
    <div className="flex flex-col min-h-[100dvh] bg-background text-foreground overflow-hidden font-sans">
      
      {/* Navigation */}
      <motion.header 
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5 }}
        className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/50 supports-[backdrop-filter]:bg-background/60"
      >
        <div className="container mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <HiveLogo size={32} />
            <span className="font-semibold text-lg tracking-tight text-white">HEALTH HIVE</span>
          </div>
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-muted-foreground">
            <a href="#ecosystem" className="hover:text-primary transition-colors">Ecosystem</a>
            <a href="#intake" className="hover:text-primary transition-colors">Patient Portal</a>
            <a href="#surgical-assistant" className="hover:text-primary transition-colors">Surgical Assistant</a>
          </nav>
          <div className="flex items-center gap-4">
            <a href="https://surg-assist-copy-89eb0714.base44.app" target="_blank" rel="noreferrer">
              <Button variant="outline" className="hidden sm:flex border-primary/30 hover:border-primary text-primary hover:bg-primary/10 transition-all duration-300">
                Clinician Sign In
              </Button>
            </a>
          </div>
        </div>
      </motion.header>

      <main className="flex-grow">
        
        {/* Section 1: Hero */}
        <section className="relative pt-40 pb-32 lg:pt-56 lg:pb-40 overflow-hidden flex items-center min-h-[90vh]">
          {/* Background Effects */}
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;utf8,<svg%20xmlns=%22http://www.w3.org/2000/svg%22%20width=%22160%22%20height=%22160%22><filter%20id=%22n%22><feTurbulence%20type=%22fractalNoise%22%20baseFrequency=%220.9%22%20numOctaves=%222%22%20stitchTiles=%22stitch%22/></filter><rect%20width=%22100%25%22%20height=%22100%25%22%20filter=%22url(%23n)%22%20opacity=%220.5%22/></svg>')] opacity-10 mix-blend-overlay pointer-events-none" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/15 rounded-full blur-[120px] pointer-events-none" />
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-900/20 rounded-full blur-[100px] pointer-events-none" />
          
          <div className="container mx-auto px-6 relative z-10 text-center max-w-5xl">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold tracking-[0.2em] uppercase mb-8 shadow-[0_0_15px_rgba(245,197,24,0.1)]"
            >
              <HiveLogo size={16} />
              HEALTH HIVE ECOSYSTEM
            </motion.div>
            
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.1 }}
              className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight mb-8 leading-[1.05]"
            >
              Patients arrive organised. <br />
              <span className="hive-gradient-text">Clinicians stay supported.</span>
            </motion.h1>
            
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto mb-12 leading-relaxed font-light"
            >
              A connected health ecosystem from Ireland. Keep your own health records in your pocket, while on-call hospital doctors access AI decision support when they need it most.
            </motion.p>
            
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.3 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-5"
            >
              <a href="#intake" className="w-full sm:w-auto">
                <Button size="lg" className="w-full sm:w-auto bg-primary text-primary-foreground hover:bg-primary/90 h-14 px-8 text-base shadow-[0_0_20px_rgba(245,197,24,0.3)] hover:shadow-[0_0_30px_rgba(245,197,24,0.5)] transition-all duration-300">
                  Explore Patient Portal
                </Button>
              </a>
              <a href="#surgical-assistant" className="w-full sm:w-auto">
                <Button size="lg" variant="outline" className="w-full sm:w-auto h-14 px-8 text-base border-border hover:bg-card/50 backdrop-blur-sm transition-all duration-300">
                  Surgical Assistant <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </a>
            </motion.div>
          </div>
        </section>

        {/* Section 2: Ecosystem Overview */}
        <section id="ecosystem" className="py-24 bg-card/30 border-y border-border relative">
          <div className="container mx-auto px-6">
            <motion.div 
              variants={staggerContainer}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              className="grid md:grid-cols-2 gap-16 items-center"
            >
              <motion.div variants={fadeInUp}>
                <div className="text-primary font-bold tracking-widest uppercase text-xs mb-4">One Unified Story</div>
                <h2 className="text-3xl md:text-5xl font-bold mb-6 leading-tight text-white">A precise, trustworthy health platform.</h2>
                <p className="text-muted-foreground text-lg mb-6 leading-relaxed">
                  We believe in empowering both sides of the care equation. By giving patients the tools to prepare for visits and manage their own records safely, and supporting clinicians with instant access to guidelines, we make healthcare more efficient and less stressful for everyone.
                </p>
                <div className="grid grid-cols-2 gap-8 mt-12">
                  <div className="space-y-4">
                    <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20 shadow-inner">
                      <ShieldCheck className="h-7 w-7" />
                    </div>
                    <h3 className="font-semibold text-lg text-white">Privacy First</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">Your data stays on your device. Always. No central servers, no tracking.</p>
                  </div>
                  <div className="space-y-4">
                    <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20 shadow-inner">
                      <Stethoscope className="h-7 w-7" />
                    </div>
                    <h3 className="font-semibold text-lg text-white">Clinically Aligned</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">Built to support standard clinical workflows and internationally recognised protocols.</p>
                  </div>
                </div>
              </motion.div>
              
              <motion.div variants={fadeInUp} className="relative h-[600px] rounded-3xl bg-background border border-border/50 overflow-hidden flex items-center justify-center shadow-2xl">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary/5 via-background to-background"></div>
                <div className="relative grid grid-cols-1 md:grid-cols-2 gap-6 p-8 w-full max-w-lg">
                  
                  {/* Abstract App Representation 1 */}
                  <div className="bg-card p-6 rounded-2xl border border-border/50 shadow-2xl transform -rotate-3 hover:rotate-0 transition-transform duration-500 hover:border-primary/30 group">
                    <div className="flex items-center gap-3 mb-6">
                      <Smartphone className="h-6 w-6 text-primary" />
                      <span className="text-sm font-semibold tracking-wide text-white/80">HIVE Intake</span>
                    </div>
                    <div className="space-y-3">
                      <div className="h-2 w-full bg-muted/50 rounded-full overflow-hidden">
                        <div className="h-full w-3/4 bg-primary/50 group-hover:bg-primary transition-colors"></div>
                      </div>
                      <div className="h-2 w-5/6 bg-muted/50 rounded-full"></div>
                      <div className="h-2 w-4/6 bg-muted/50 rounded-full"></div>
                    </div>
                  </div>
                  
                  {/* Abstract App Representation 2 */}
                  <div className="bg-card p-6 rounded-2xl border border-border/50 shadow-2xl transform rotate-3 hover:rotate-0 transition-transform duration-500 hover:border-primary/30 mt-8 md:mt-16 group">
                    <div className="flex items-center gap-3 mb-6">
                      <Activity className="h-6 w-6 text-primary" />
                      <span className="text-sm font-semibold tracking-wide text-white/80">Surgical Assistant</span>
                    </div>
                    <div className="space-y-3">
                      <div className="h-2 w-full bg-muted/50 rounded-full"></div>
                      <div className="h-2 w-5/6 bg-muted/50 rounded-full overflow-hidden">
                        <div className="h-full w-1/2 bg-primary/50 group-hover:bg-primary transition-colors delay-100"></div>
                      </div>
                      <div className="h-2 w-full bg-muted/50 rounded-full"></div>
                    </div>
                  </div>

                </div>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* Section 3: HIVE Intake Hero */}
        <section id="intake" className="py-24 lg:py-32 relative overflow-hidden bg-background">
          <div className="container mx-auto px-6">
            <motion.div 
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeInUp}
              className="flex flex-col items-center text-center mb-20 max-w-3xl mx-auto"
            >
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-card border border-border text-white text-xs font-bold tracking-widest uppercase mb-6 shadow-sm">
                <Smartphone className="h-3 w-3 text-primary" />
                Mobile App
              </div>
              <h2 className="text-4xl md:text-6xl font-bold mb-6 text-white">HIVE Intake</h2>
              <p className="text-xl md:text-2xl text-muted-foreground font-light">
                Your personal health record organiser, right in your pocket.
              </p>
            </motion.div>

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
                  icon: <Building2 className="h-6 w-6 text-primary" />,
                  title: "GP Visit Preparation",
                  desc: "Complete internationally recognised standardised questionnaires (ODI, mJOA, Oxford Hip & Knee) to prepare for your consultations effectively."
                },
                {
                  icon: <AlertCircle className="h-6 w-6 text-primary" />,
                  title: "Emergency Health Card",
                  desc: "Generate an emergency card with a QR code and PIN for first responders. Keep your private medication, conditions, and allergies list secure."
                },
                {
                  icon: <BookOpen className="h-6 w-6 text-primary" />,
                  title: "Guideline Viewer & Interpreter",
                  desc: "Access plain-English lookups of public HSE and NICE health guidelines. Share documents and prescriptions directly to your pharmacy, and book live medical interpreters."
                }
              ].map((feature, idx) => (
                <motion.div key={idx} variants={fadeInUp} className="bg-card/40 backdrop-blur-sm p-8 rounded-3xl border border-border hover:border-primary/40 hover:bg-card/60 transition-all duration-300 group">
                  <div className="w-12 h-12 rounded-xl bg-background border border-border flex items-center justify-center mb-6 group-hover:scale-110 group-hover:border-primary/50 transition-all duration-300">
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-bold mb-4 text-white">{feature.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    {feature.desc}
                  </p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* Section 4: Privacy Focus */}
        <section className="py-20 lg:py-32 bg-primary text-primary-foreground relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;utf8,<svg%20xmlns=%22http://www.w3.org/2000/svg%22%20width=%22160%22%20height=%22160%22><filter%20id=%22n%22><feTurbulence%20type=%22fractalNoise%22%20baseFrequency=%220.9%22%20numOctaves=%222%22%20stitchTiles=%22stitch%22/></filter><rect%20width=%22100%25%22%20height=%22100%25%22%20filter=%22url(%23n)%22%20opacity=%220.5%22/></svg>')] opacity-10 mix-blend-overlay pointer-events-none" />
          <div className="absolute right-0 top-0 w-1/2 h-full bg-black/10 blur-3xl transform skew-x-12 pointer-events-none" />
          
          <div className="container mx-auto px-6 relative z-10">
            <motion.div 
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeInUp}
              className="max-w-4xl mx-auto text-center"
            >
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-black/20 text-white mb-8 shadow-2xl backdrop-blur-md border border-white/10">
                <Lock className="h-10 w-10" />
              </div>
              <h2 className="text-4xl md:text-6xl font-bold mb-8 tracking-tight">Privacy is our hero feature.</h2>
              <p className="text-xl md:text-2xl font-light mb-12 text-primary-foreground/90 leading-relaxed">
                ALL personal data stays on your device — nothing is uploaded to a server. No tracking, no ads. You can "Delete all my data" at any time.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
                <Button variant="secondary" size="lg" className="w-full sm:w-auto bg-black text-white hover:bg-black/80 border-0 h-14 px-8 opacity-70 cursor-not-allowed">
                  App Store (Coming Soon)
                </Button>
                <Button variant="secondary" size="lg" className="w-full sm:w-auto bg-black text-white hover:bg-black/80 border-0 h-14 px-8 opacity-70 cursor-not-allowed">
                  Google Play (Coming Soon)
                </Button>
              </div>

              <div className="text-sm font-medium bg-black/20 p-6 rounded-2xl border border-white/10 backdrop-blur-md text-left inline-block">
                <span className="text-white font-bold uppercase tracking-wider text-xs block mb-2">Compliance Notice</span>
                <span className="text-primary-foreground/80">HIVE Intake is a health record organiser. It is not a medical device, it does not diagnose or treat, and all personal data stays on your device.</span>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Section 5: HIVE Surgical Assistant */}
        <section id="surgical-assistant" className="py-24 lg:py-40 bg-background relative overflow-hidden">
          <div className="absolute top-1/2 left-0 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />

          <div className="container mx-auto px-6 relative z-10">
            <div className="grid lg:grid-cols-2 gap-16 lg:gap-24 items-center">
              
              <motion.div 
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeInUp}
                className="order-2 lg:order-1 relative"
              >
                <div className="relative rounded-3xl overflow-hidden border border-border/50 shadow-2xl aspect-[4/3] bg-card flex flex-col group">
                   {/* Abstract representation of the web app */}
                   <div className="h-12 bg-background border-b border-border flex items-center px-4 gap-2">
                     <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
                     <div className="w-3 h-3 rounded-full bg-yellow-500/80"></div>
                     <div className="w-3 h-3 rounded-full bg-green-500/80"></div>
                     <div className="ml-4 h-6 w-1/2 bg-muted/30 rounded-md"></div>
                   </div>
                   <div className="flex-1 relative overflow-hidden flex items-center justify-center p-8 bg-gradient-to-br from-card to-background">
                     <div className="absolute inset-0 opacity-30 bg-[radial-gradient(circle_at_center,hsl(45_93%_47%/0.25),transparent_70%)] filter blur-xl group-hover:blur-md transition-all duration-700"></div>
                     <div className="relative z-10 text-center p-10 bg-background/80 backdrop-blur-xl rounded-3xl border border-border/50 shadow-2xl transform group-hover:scale-105 transition-transform duration-500">
                       <HiveLogo size={72} className="mx-auto mb-6" />
                       <div className="text-2xl font-bold text-white mb-2">Surgical Assistant</div>
                       <div className="text-sm text-primary uppercase tracking-widest font-semibold">Clinician Portal</div>
                     </div>
                   </div>
                </div>
                
                {/* Decorative elements */}
                <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-card border border-border rounded-2xl shadow-xl flex items-center justify-center -z-10">
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
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-card border border-border text-white text-xs font-bold tracking-widest uppercase mb-6 shadow-sm">
                  <Activity className="h-3 w-3 text-primary" />
                  Web App
                </div>
                <h2 className="text-4xl md:text-6xl font-bold mb-6 text-white leading-tight">HIVE Surgical Assistant</h2>
                <p className="text-xl text-muted-foreground mb-10 leading-relaxed font-light">
                  An AI decision support companion designed specifically for on-call surgical teams and NCHDs.
                </p>
                
                <ul className="space-y-6 mb-12">
                  <li className="flex items-start gap-4 p-4 rounded-2xl bg-card/30 border border-transparent hover:border-border transition-colors">
                    <div className="mt-1 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 text-primary border border-primary/20">
                      <ArrowRight className="h-4 w-4" />
                    </div>
                    <div>
                      <h4 className="text-white font-semibold text-lg mb-1">Instant Support</h4>
                      <span className="text-muted-foreground">Access critical guidance during demanding on-call shifts.</span>
                    </div>
                  </li>
                  <li className="flex items-start gap-4 p-4 rounded-2xl bg-card/30 border border-transparent hover:border-border transition-colors">
                    <div className="mt-1 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 text-primary border border-primary/20">
                      <ArrowRight className="h-4 w-4" />
                    </div>
                    <div>
                      <h4 className="text-white font-semibold text-lg mb-1">Streamlined Workflows</h4>
                      <span className="text-muted-foreground">Tailored for non-consultant hospital doctors to improve efficiency.</span>
                    </div>
                  </li>
                </ul>

                <div className="p-5 bg-card border border-border/50 rounded-xl mb-10 shadow-inner">
                  <p className="text-sm font-medium text-muted-foreground flex items-center gap-3">
                    <AlertCircle className="h-5 w-5 text-primary" />
                    <span><strong className="text-white">AI Decision Support</strong> — Verify All Output Clinically.</span>
                  </p>
                </div>

                <a href="https://surg-assist-copy-89eb0714.base44.app" target="_blank" rel="noreferrer">
                  <Button size="lg" className="w-full sm:w-auto bg-white text-black hover:bg-white/90 h-14 px-8 text-base shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_30px_rgba(255,255,255,0.2)] transition-all duration-300">
                    Open HIVE Surgical Assistant <ExternalLink className="ml-2 h-4 w-4 text-black/60" />
                  </Button>
                </a>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Section 6: CTA */}
        <section className="py-32 relative overflow-hidden bg-card border-t border-border">
          <div className="absolute inset-0 bg-primary/5"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-4xl aspect-square bg-primary/10 rounded-full blur-[150px] pointer-events-none"></div>
          
          <div className="container mx-auto px-6 relative z-10 text-center">
            <motion.div 
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeInUp}
            >
              <div className="w-24 h-24 mx-auto bg-background border border-border rounded-3xl flex items-center justify-center mb-8 shadow-2xl rotate-3">
                <HiveLogo size={48} className="-rotate-3" />
              </div>
              <h2 className="text-4xl md:text-6xl font-bold mb-6 text-white tracking-tight">Join the ecosystem.</h2>
              <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto mb-12 font-light">
                Whether you are a patient looking to organise your records or a clinic interested in our solutions, we'd love to hear from you.
              </p>
              <a href="mailto:info@ibnceena.ie">
                <Button size="lg" className="h-16 px-10 text-lg bg-primary text-primary-foreground hover:bg-primary/90 shadow-[0_0_20px_rgba(245,197,24,0.3)] transition-all duration-300">
                  <Mail className="mr-2 h-5 w-5" /> Contact info@ibnceena.ie
                </Button>
              </a>
            </motion.div>
          </div>
        </section>

      </main>

      {/* Footer */}
      <footer className="bg-background pt-20 pb-10 border-t border-border relative z-10">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-12 gap-12 mb-16">
            <div className="md:col-span-5">
              <div className="flex items-center gap-3 mb-6">
                <HiveLogo size={28} />
                <span className="font-bold tracking-widest uppercase text-sm text-white">HEALTH HIVE</span>
              </div>
              <p className="text-muted-foreground text-sm leading-relaxed max-w-sm">
                A connected health platform from Ireland. Empowering patients with their own data; supporting clinicians with advanced tools.
              </p>
            </div>
            
            <div className="md:col-span-3 md:col-start-7">
              <h4 className="font-bold text-white mb-6 uppercase tracking-wider text-xs">Products</h4>
              <ul className="space-y-4 text-sm text-muted-foreground">
                <li><a href="#intake" className="hover:text-primary transition-colors flex items-center gap-2"><ArrowRight className="h-3 w-3" /> HIVE Intake</a></li>
                <li><a href="#surgical-assistant" className="hover:text-primary transition-colors flex items-center gap-2"><ArrowRight className="h-3 w-3" /> Surgical Assistant</a></li>
              </ul>
            </div>
            
            <div className="md:col-span-3">
              <h4 className="font-bold text-white mb-6 uppercase tracking-wider text-xs">Legal & Contact</h4>
              <ul className="space-y-4 text-sm text-muted-foreground">
                <li><a href="/api/privacy" className="hover:text-primary transition-colors flex items-center gap-2"><ArrowRight className="h-3 w-3" /> Privacy Policy</a></li>
                <li><a href="mailto:info@ibnceena.ie" className="hover:text-primary transition-colors flex items-center gap-2"><ArrowRight className="h-3 w-3" /> Contact Us</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-border/50 pt-8 flex flex-col lg:flex-row items-center justify-between gap-6 text-xs text-muted-foreground">
            <p className="font-medium">&copy; {new Date().getFullYear()} IbnCeena Ltd. All rights reserved.</p>
            <p className="text-center lg:text-right max-w-3xl leading-relaxed opacity-70">
              HIVE Intake is not a medical device, it does not diagnose or treat, and all personal data stays on your device. AI Decision Support — Verify All Output Clinically.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
