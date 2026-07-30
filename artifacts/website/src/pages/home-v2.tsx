import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { Link } from "wouter";
import { motion, useScroll, useTransform, useReducedMotion } from "framer-motion";
import { PageHead } from "@/components/PageHead";
import { HiveMark } from "@/components/HiveMark";
import { HiveLogo } from "@/components/HiveLogo";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ArrowRight, Smartphone, Activity, Stethoscope, FileText, Pill,
  AlertCircle, ShieldCheck, HardDrive, MapPin, Flag, LogIn,
  Download, Heart, UserPlus, ChevronDown, ChevronUp, Menu, X, Mail,
  Sparkles, ClipboardList, Lock, Euro,
} from "lucide-react";

const BEE = `${import.meta.env.BASE_URL}images/bee-mascot.webp`;
const EASE: [number,number,number,number] = [0.25, 0.1, 0.25, 1];
const fi = { initial: { opacity: 0, y: 20 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true, margin: "-40px" }, transition: { duration: 0.4, ease: EASE } };

const P = [
  { id:"c", badge:"FOR PATIENTS", bi:<Smartphone className="h-3 w-3"/>, title:<><HiveMark/> Companion</>, tag:"Walk into any appointment ready.", desc:"Your health story, already organised. Records, prescriptions, and an emergency health card \u2014 all on your device, all under your control.", feat:[{i:<FileText className="h-4 w-4"/>,t:"Health records & prescriptions in one place"},{i:<Pill className="h-4 w-4"/>,t:"Standardised questionnaires before every visit"},{i:<AlertCircle className="h-4 w-4"/>,t:"Emergency health card when it matters most"}], cta:{l:"Download for Android",h:"/api/app/download/android"}, img:`${import.meta.env.BASE_URL}images/brand-companion.webp`, alt:"HIVE Companion app", glow:"rgba(245,197,24,0.10)", rev:false },
  { id:"s", badge:"FOR CLINICAL TEAMS", bi:<Activity className="h-3 w-3"/>, title:<>Hospital Surgical Assistant</>, tag:"Precision documentation. Faster workflows.", desc:"Patient files digitised and organised. Photo recognition turns captured data into structured records in seconds.", feat:[{i:<ClipboardList className="h-4 w-4"/>,t:"Fast documentation with photo recognition"},{i:<Lock className="h-4 w-4"/>,t:"Encrypted by design \u2014 data stays on device"},{i:<Sparkles className="h-4 w-4"/>,t:"AI decision support for clinicians"}], cta:{l:"Open Surgical Assistant",h:"/portal/practitioner"}, img:`${import.meta.env.BASE_URL}images/brand-surgical.webp`, alt:"HIVE Surgical Assistant", glow:"rgba(110,168,255,0.10)", rev:true },
  { id:"g", badge:"FOR PRACTICES", bi:<Stethoscope className="h-3 w-3"/>, title:<>GP & Primary Healthcare Portal</>, tag:"More time with patients. Less time on paperwork.", desc:"Patients arrive with standardised questionnaires already completed. AI drafts referral letters and clinic summaries \u2014 you review and sign off.", feat:[{i:<ClipboardList className="h-4 w-4"/>,t:"Structured pre-appointment intake"},{i:<Sparkles className="h-4 w-4"/>,t:"AI-augmented documentation & referral letters"},{i:<Euro className="h-4 w-4"/>,t:"Measurable savings on administration time"}], cta:{l:"Contact About Enterprise",h:"mailto:info@ibnceena.ie?subject=Enterprise%20enquiry%20%E2%80%94%20Health%20HIVE"}, img:`${import.meta.env.BASE_URL}images/gp-consult.webp`, alt:"GP consulting", glow:"rgba(52,211,153,0.08)", rev:false },
];

const TRUST=[{i:<ShieldCheck className="h-6 w-6"/>,t:"GDPR & DPA 2018",d:"Built for GDPR and the Irish Data Protection Act 2018"},{i:<HardDrive className="h-6 w-6"/>,t:"Audit-Ready Records",d:"Safe digitisation with full auditability"},{i:<MapPin className="h-6 w-6"/>,t:"Irish Company",d:"Headquartered in Dublin, Ireland"},{i:<Flag className="h-6 w-6"/>,t:"National Alignment",d:"Digital for Care 2024\u20132030 & Sl\u00e1intecare"}];

const LABELS=["Welcome","Companion","Surgical","GP Portal","Trust","Get Started"];
const N=LABELS.length;

function ProdCard({p,si}:{p:typeof P[0];si:number}){
  const W=p.cta.h.startsWith("mailto:")?"a":Link;
  return(
    <div id={`s-${si}`} data-s={si} className="section-snap relative flex items-center overflow-hidden">
      <div className="absolute pointer-events-none rounded-full" style={{width:500,height:500,left:p.rev?"60%":"15%",top:"20%",background:`radial-gradient(circle,${p.glow} 0%,transparent 70%)`}}/>
      <div className="container mx-auto px-6 w-full relative z-10">
        <div className={`grid lg:grid-cols-2 gap-10 lg:gap-16 items-center ${p.rev?"lg:[direction:rtl]":""}`}>
          <div className="space-y-5" style={{direction:"ltr"}}>
            <motion.div {...fi} className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full glass-panel text-primary text-xs font-bold tracking-[0.2em] uppercase">{p.bi} {p.badge}</span>
            </motion.div>
            <motion.h2 {...fi} className="text-[clamp(2rem,5vw,3.8rem)] font-bold tracking-tight leading-[1.1] text-foreground">{p.title}</motion.h2>
            <motion.p {...fi} className="text-xl sm:text-2xl text-primary font-medium">{p.tag}</motion.p>
            <motion.p {...fi} className="text-base sm:text-lg text-muted-foreground leading-relaxed max-w-xl">{p.desc}</motion.p>
            <motion.ul {...fi} className="space-y-3">
              {p.feat.map((f,j)=>(
                <li key={j} className="flex items-center gap-3 text-sm text-foreground/90">
                  <span className="flex items-center justify-center w-9 h-9 rounded-lg bg-primary/10 border border-primary/20 text-primary flex-shrink-0">{f.i}</span>
                  {f.t}
                </li>
              ))}
            </motion.ul>
            <motion.div {...fi} className="pt-2">
              <Button asChild size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 h-12 px-7 text-sm shadow-[0_0_20px_rgba(245,197,24,0.25)] hover:shadow-[0_0_32px_rgba(245,197,24,0.45)] transition-all duration-300 group">
                <W href={p.cta.h}>{p.cta.l} <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform"/></W>
              </Button>
            </motion.div>
          </div>
          <motion.div {...fi} className="flex justify-center" style={{direction:"ltr"}}>
            <div className="relative w-full max-w-sm lg:max-w-md">
              <div className="rounded-3xl overflow-hidden shadow-[0_24px_60px_-12px_rgba(0,0,0,0.4)] border border-white/10">
                <img src={p.img} alt={p.alt} className="w-full aspect-[3/4] object-cover" loading="lazy" draggable={false}/>
              </div>
              <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 w-[80%] h-8 rounded-full pointer-events-none" style={{background:`radial-gradient(ellipse,${p.glow} 0%,transparent 70%)`,filter:"blur(10px)"}}/>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

export default function HomeV2(){
  const pref=useReducedMotion();
  const box=useRef<HTMLDivElement>(null);
  const [active,setActive]=useState(0);
  const [menuOpen,setMenuOpen]=useState(false);
  const lastManual=useRef(0);

  useEffect(()=>{
    const el=box.current;if(!el)return;
    const obs=new IntersectionObserver(es=>{for(const e of es)if(e.isIntersecting){const i=Number(e.target.getAttribute("data-s"));if(!isNaN(i))setActive(i);}},
    {root:el,threshold:0.45});
    el.querySelectorAll("[data-s]").forEach(s=>obs.observe(s));
    return()=>obs.disconnect();
  },[]);

  const go=useCallback((i:number)=>{document.getElementById(`s-${i}`)?.scrollIntoView({behavior:pref?"auto":"smooth"});},[pref]);

  useEffect(()=>{
    if(pref)return;
    const id=setInterval(()=>{if(Date.now()-lastManual.current>4000)go((active+1)%N);},5000);
    return()=>clearInterval(id);
  },[active,go,pref]);

  useEffect(()=>{
    const el=box.current;if(!el)return;
    const m=()=>{lastManual.current=Date.now();};
    el.addEventListener("wheel",m,{passive:true});
    el.addEventListener("touchstart",m,{passive:true});
    const k=(e:KeyboardEvent)=>{if(e.key==="ArrowDown"||e.key==="ArrowUp"||e.key===" "){e.preventDefault();const n=Math.max(0,Math.min(N-1,active+(e.key==="ArrowUp"?-1:1)));if(n!==active){go(n);m();}}};
    window.addEventListener("keydown",k);
    return()=>{el.removeEventListener("wheel",m);el.removeEventListener("touchstart",m);window.removeEventListener("keydown",k);};
  },[active,go]);

  const {scrollYProgress}=useScroll({target:box,offset:["start start","end end"]});
  const pw=useTransform(scrollYProgress,[0,1],["0%","100%"]);

  return(
    <div className="flex flex-col min-h-[100dvh] bg-transparent text-foreground overflow-x-hidden font-sans">
      <PageHead title="Safe Digitisation of Patient Files in Ireland" description="Health HIVE is an Irish digital health platform for the safe, auditable digitisation of patient files \u2014 GDPR-first records for patients, GPs and hospitals." path="/v2" ogTitle="Health HIVE \u2014 Safe, Auditable Digital Patient Records for Ireland" ogDescription="Safe, auditable digital patient records for Ireland \u2014 GDPR-first, built for patients, GPs and hospital teams." keywords="digital health Ireland, digital patient records, GDPR healthcare Ireland" jsonLd={[{"@context":"https://schema.org","@type":"Organization","name":"Health HIVE","url":"https://healthhive.ie"}]}/>
      <a href="#main" className="skip-link">Skip to main content</a>
      <motion.div className="fixed top-0 left-0 right-0 h-[2px] bg-primary/80 z-[60] origin-left" style={{width:pw}}/>

      {/* ---- NAV ---- */}
      <motion.header initial={{y:-80}} animate={{y:0}} transition={{duration:0.4}} className="fixed top-0 left-0 right-0 z-50 bg-background/70 backdrop-blur-xl border-b border-border/50">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <img src={BEE} alt="" className="h-8 w-8 object-contain drop-shadow-[0_0_8px_rgba(245,197,24,0.3)]" width={32} height={32} fetchPriority="high"/>
            <span className="font-semibold text-base tracking-tight">HEALTH <HiveMark/></span>
          </div>
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-muted-foreground">
            <Link href="/" className="hover:text-primary transition-colors">Home</Link>
            <Link href="/book" className="hover:text-primary transition-colors">Book</Link>
          </nav>
          <div className="flex items-center gap-3">
            <ThemeToggle/>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="hidden sm:flex border-primary/30 hover:border-primary text-primary hover:bg-primary/10 transition-all glass-panel h-9 px-3 text-xs"><LogIn className="mr-1.5 h-3.5 w-3.5"/>Sign In</Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Quick connect</DropdownMenuLabel>
                <DropdownMenuItem asChild><Link href="/portal/practitioner" className="cursor-pointer"><Stethoscope className="mr-2 h-4 w-4 text-primary"/>GP & HIVE HUB</Link></DropdownMenuItem>
                <DropdownMenuItem asChild><Link href="/portal/supportive" className="cursor-pointer"><Heart className="mr-2 h-4 w-4 text-primary"/>Supportive Care</Link></DropdownMenuItem>
                <DropdownMenuItem asChild><Link href="/portal/responder" className="cursor-pointer"><Activity className="mr-2 h-4 w-4 text-primary"/>First Responders</Link></DropdownMenuItem>
                <DropdownMenuSeparator/>
                <DropdownMenuItem asChild><Link href="/portal/signup" className="cursor-pointer"><UserPlus className="mr-2 h-4 w-4 text-primary"/>Create Account</Link></DropdownMenuItem>
                <DropdownMenuSeparator/>
                <DropdownMenuItem asChild><a href="/api/app/download/android" className="cursor-pointer"><Download className="mr-2 h-4 w-4 text-primary"/>Download Companion</a></DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button variant="outline" size="icon" className="md:hidden rounded-full h-9 w-9" aria-label="Menu" onClick={()=>setMenuOpen(o=>!o)}>{menuOpen?<X className="h-4 w-4"/>:<Menu className="h-4 w-4"/>}</Button>
          </div>
        </div>
        {menuOpen&&(
          <nav className="md:hidden border-t border-border/50 bg-background/95 backdrop-blur-xl">
            <div className="container mx-auto px-6 py-3 flex flex-col gap-1 text-sm font-medium">
              <Link href="/" onClick={()=>setMenuOpen(false)} className="py-2 px-2 rounded-lg hover:text-primary">Home</Link>
              <Link href="/book" onClick={()=>setMenuOpen(false)} className="py-2 px-2 rounded-lg hover:text-primary">Book a Consultation</Link>
              <Link href="/portal/practitioner" onClick={()=>setMenuOpen(false)} className="py-2 px-2 rounded-lg text-primary">GP & HIVE HUB</Link>
              <Link href="/portal/signup" onClick={()=>setMenuOpen(false)} className="py-2 px-2 rounded-lg text-primary">Create Account</Link>
              <a href="/api/app/download/android" onClick={()=>setMenuOpen(false)} className="py-2 px-2 rounded-lg text-primary">Download Companion</a>
            </div>
          </nav>
        )}
      </motion.header>

      {/* ---- SECTIONS ---- */}
      <main id="main" ref={box} className="flex-grow pt-16 overflow-y-auto snap-y snap-mandatory [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" style={{height:"calc(100dvh - 4rem)"}}>

        {/* 0: Hero */}
        <div id="s-0" data-s={0} className="section-snap relative flex items-center justify-center overflow-hidden">
          <div className="absolute top-1/4 left-1/3 w-[500px] h-[500px] rounded-full pointer-events-none" style={{background:"radial-gradient(circle,rgba(245,197,24,0.10) 0%,transparent 70%)"}}/>
          <div className="container mx-auto px-6 text-center relative z-10">
            <motion.div {...fi} className="mb-6">
              <img src={BEE} alt="Health HIVE bee mascot" className="w-20 h-20 mx-auto object-contain drop-shadow-[0_0_25px_rgba(245,197,24,0.4)]" width={80} height={80} fetchPriority="high"/>
            </motion.div>
            <motion.h1 {...fi} className="text-[clamp(2.5rem,7vw,5.5rem)] font-bold tracking-tight leading-[1.05] text-foreground mb-5">
              Healthcare that <span className="hive-gradient-text">works for you</span>
            </motion.h1>
            <motion.p {...fi} className="text-[clamp(1rem,2.5vw,1.35rem)] text-muted-foreground max-w-2xl mx-auto mb-8 leading-relaxed font-light">
              An Irish digital health platform for the safe, auditable digitisation of patient files \u2014 GDPR-first, built for patients, GPs and hospitals.
            </motion.p>
            <motion.div {...fi} className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button asChild size="lg" className="h-13 px-9 text-base shadow-[0_0_20px_rgba(245,197,24,0.3)] hover:shadow-[0_0_36px_rgba(245,197,24,0.5)] transition-all group">
                <a href="/api/app/download/android">Download Companion <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform"/></a>
              </Button>
              <Button variant="outline" size="lg" asChild className="h-13 px-9 text-base glass-panel border-primary/30 hover:border-primary hover:bg-primary/10 transition-all">
                <Link href="/portal">Explore Portals</Link>
              </Button>
            </motion.div>
            <motion.div {...fi} className="mt-14 flex flex-col items-center gap-1.5 text-muted-foreground/40">
              <span className="text-[10px] tracking-[0.3em] uppercase font-medium">Auto-scrolling</span>
              <motion.div animate={pref?{}:{y:[0,6,0]}} transition={{duration:2,repeat:Infinity,ease:"easeInOut"}}><ChevronDown className="h-4 w-4"/></motion.div>
            </motion.div>
          </div>
        </div>

        {/* 1-3: Products */}
        {P.map((p,i)=><ProdCard key={p.id} p={p} si={i+1}/>)}

        {/* 4: Trust */}
        <div id="s-4" data-s={4} className="section-snap relative flex items-center overflow-hidden bg-card/80 backdrop-blur-xl border-y border-border/30">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full pointer-events-none" style={{background:"radial-gradient(circle,rgba(245,197,24,0.06) 0%,transparent 70%)"}}/>
          <div className="container mx-auto px-6 w-full relative z-10">
            <motion.div {...fi} className="text-center mb-10">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full glass-panel text-primary text-xs font-bold tracking-[0.2em] uppercase mb-3">TRUST & COMPLIANCE</span>
              <h2 className="text-[clamp(1.8rem,4vw,3.2rem)] font-bold tracking-tight text-foreground">Built on Irish soil. <span className="hive-gradient-text">Built to Irish standards.</span></h2>
            </motion.div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {TRUST.map((t,i)=>(
                <motion.div key={i} {...fi} className="glass-panel rounded-2xl p-5 text-center border-primary/10 hover:border-primary/30 transition-colors duration-300">
                  <div className="text-primary mb-3 flex justify-center">{t.i}</div>
                  <p className="font-bold text-foreground text-sm uppercase tracking-wider mb-1">{t.t}</p>
                  <p className="text-muted-foreground text-xs leading-relaxed">{t.d}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        {/* 5: CTA */}
        <div id="s-5" data-s={5} className="section-snap relative flex items-center overflow-hidden">
          <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-primary/8 blur-[100px] pointer-events-none rounded-full"/>
          <div className="container mx-auto px-6 relative z-10">
            <div className="max-w-3xl mx-auto glass-panel-heavy rounded-[2.5rem] p-8 sm:p-12 text-center border-primary/20 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-[250px] h-[250px] bg-primary/10 blur-[80px] pointer-events-none rounded-full"/>
              <div className="relative z-10">
                <motion.div {...fi}><img src={BEE} alt="" className="w-16 mx-auto object-contain drop-shadow-[0_0_20px_rgba(245,197,24,0.3)]" loading="lazy" width={64} height={64}/></motion.div>
                <motion.h2 {...fi} className="text-[clamp(1.6rem,3.5vw,2.8rem)] font-bold mb-4 tracking-tight text-foreground">Try the <HiveMark/> Companion</motion.h2>
                <motion.p {...fi} className="text-lg text-foreground/80 leading-relaxed max-w-xl mx-auto mb-8 font-light">ALL personal data stays on your device. No tracking, no ads. Delete everything at any time.</motion.p>
                <motion.div {...fi} className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Button asChild size="lg" className="h-13 px-9 text-base shadow-[0_0_20px_rgba(245,197,24,0.3)] hover:shadow-[0_0_36px_rgba(245,197,24,0.5)] transition-all group">
                    <a href="/api/app/download/android">Download for Android <Download className="ml-2 h-4 w-4"/></a>
                  </Button>
                  <Button variant="secondary" size="lg" disabled className="h-13 px-9 text-base glass-panel">iPhone & iPad \u2014 Coming Soon</Button>
                </motion.div>
                <motion.p {...fi} className="text-xs text-muted-foreground mt-5">HIVE Companion is a health record organiser. It is not a medical device.</motion.p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="py-10 border-t border-border/40 glass-panel-heavy rounded-t-[2rem]">
          <div className="container mx-auto px-6">
            <div className="flex flex-col md:flex-row justify-between items-center gap-3">
              <div className="flex items-center gap-2"><HiveLogo size={20}/><span className="font-semibold text-sm">HEALTH <HiveMark/></span></div>
              <p className="text-xs text-muted-foreground">\u00a9 {new Date().getFullYear()} IbnCeena Ltd.</p>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <a href="mailto:info@ibnceena.ie" className="hover:text-primary transition-colors flex items-center gap-1"><Mail className="h-3 w-3"/>info@ibnceena.ie</a>
                <span className="flex items-center gap-1"><MapPin className="h-3 w-3"/>Dublin</span>
              </div>
            </div>
          </div>
        </footer>
      </main>

      {/* Side dots */}
      <div className="fixed right-5 top-1/2 -translate-y-1/2 z-40 hidden lg:flex flex-col items-end gap-2.5">
        {LABELS.map((l,i)=>(
          <button key={i} onClick={()=>go(i)} className="group flex items-center gap-2.5" aria-label={`Go to ${l}`}>
            <span className={`text-[9px] tracking-[0.12em] uppercase font-medium transition-all duration-300 ${i===active?"text-primary opacity-100 translate-x-0":"text-muted-foreground opacity-0 -translate-x-2 group-hover:translate-x-0 group-hover:opacity-60"}`}>{l}</span>
            <div className={`rounded-full transition-all duration-400 ${i===active?"w-2.5 h-7 bg-primary shadow-[0_0_10px_rgba(245,197,24,0.5)]":"w-2 h-2 bg-foreground/20 group-hover:bg-foreground/40"}`}/>
          </button>
        ))}
      </div>

      {/* Bottom nav */}
      <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-40 flex items-center gap-3">
        <button onClick={()=>active>0&&go(active-1)} disabled={active===0} className="w-9 h-9 rounded-full glass-panel border-border/60 text-foreground/70 hover:text-primary hover:border-primary/40 transition-all disabled:opacity-25 disabled:cursor-not-allowed flex items-center justify-center" aria-label="Previous"><ChevronUp className="h-4 w-4"/></button>
        <span className="text-[11px] text-muted-foreground/50 font-medium tabular-nums min-w-[2.5rem] text-center">{String(active+1).padStart(2,"0")}/{String(N).padStart(2,"0")}</span>
        <button onClick={()=>active<N-1&&go(active+1)} disabled={active===N-1} className="w-9 h-9 rounded-full glass-panel border-border/60 text-foreground/70 hover:text-primary hover:border-primary/40 transition-all disabled:opacity-25 disabled:cursor-not-allowed flex items-center justify-center" aria-label="Next"><ChevronDown className="h-4 w-4"/></button>
      </div>
    </div>
  );
}
