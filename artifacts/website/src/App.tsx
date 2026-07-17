import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import PortalLanding from "@/portal/Landing";
import PortalSignup from "@/portal/Signup";
import PortalLogin from "@/portal/Login";
import PortalEmergency from "@/portal/Emergency";
import PortalCaretaker from "@/portal/Caretaker";
import PortalPricing from "@/portal/Pricing";
import PortalPrivacy from "@/portal/Privacy";
import PortalPractitioner from "@/portal/Practitioner";
import PracticePatientFile from "@/portal/PracticePatientFile";

const queryClient = new QueryClient();

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/portal" component={PortalLanding} />
      <Route path="/portal/signup" component={PortalSignup} />
      <Route path="/portal/login" component={PortalLogin} />
      <Route path="/portal/emergency" component={PortalEmergency} />
      <Route path="/portal/caretaker" component={PortalCaretaker} />
      <Route path="/portal/pricing" component={PortalPricing} />
      <Route path="/portal/privacy" component={PortalPrivacy} />
      <Route path="/portal/practitioner" component={PortalPractitioner} />
      <Route path="/portal/practitioner/patients/:id" component={PracticePatientFile} />
      <Route component={NotFound} />
    </Switch>
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
