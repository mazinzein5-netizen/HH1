import { lazy, Suspense } from "react";
import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";

// Code-split every route so the initial bundle only contains the shell.
const Home = lazy(() => import("@/pages/home"));
const HomeV2 = lazy(() => import("@/pages/home-v2"));
const BookPage = lazy(() => import("@/pages/book"));
const NotFound = lazy(() => import("@/pages/not-found"));
const PortalLanding = lazy(() => import("@/portal/Landing"));
const PortalSignup = lazy(() => import("@/portal/Signup"));
const PortalLogin = lazy(() => import("@/portal/Login"));
const PortalEmergency = lazy(() => import("@/portal/Emergency"));
const PortalCaretaker = lazy(() => import("@/portal/Caretaker"));
const PortalPricing = lazy(() => import("@/portal/Pricing"));
const PortalPrivacy = lazy(() => import("@/portal/Privacy"));
const PortalPractitioner = lazy(() => import("@/portal/Practitioner"));
const PortalSupportiveCare = lazy(() => import("@/portal/SupportiveCare"));
const PortalFirstResponder = lazy(() => import("@/portal/FirstResponder"));
const PracticePatientFile = lazy(() => import("@/portal/PracticePatientFile"));

const queryClient = new QueryClient();

/** Minimal inline fallback while a route chunk loads. */
function RouteLoader() {
  return (
    <div className="flex items-center justify-center min-h-[60dvh]">
      <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
    </div>
  );
}

function Router() {
  return (
    <Suspense fallback={<RouteLoader />}>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/v2" component={HomeV2} />
        <Route path="/book" component={BookPage} />
        <Route path="/portal" component={PortalLanding} />
        <Route path="/portal/signup" component={PortalSignup} />
        <Route path="/portal/login" component={PortalLogin} />
        <Route path="/portal/emergency" component={PortalEmergency} />
        <Route path="/portal/caretaker" component={PortalCaretaker} />
        <Route path="/portal/pricing" component={PortalPricing} />
        <Route path="/portal/privacy" component={PortalPrivacy} />
        <Route path="/portal/practitioner" component={PortalPractitioner} />
        <Route path="/portal/supportive" component={PortalSupportiveCare} />
        <Route path="/portal/responder" component={PortalFirstResponder} />
        <Route path="/portal/practitioner/patients/:id" component={PracticePatientFile} />
        <Route component={NotFound} />
      </Switch>
    </Suspense>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
