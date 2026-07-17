import { useState } from "react";
import { useLocation } from "wouter";
import { PortalLayout } from "./PortalLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { setSession, startDemoSession, type ApiError } from "./lib/store";
import { Stethoscope, HeartHandshake, Siren, ArrowRight, ShieldCheck } from "lucide-react";

const DEMO_SHARE_CODE = "HES-DEMO-2026";

export default function Landing() {
  const [, navigate] = useLocation();
  const [demoBusy, setDemoBusy] = useState(false);
  const [demoError, setDemoError] = useState<string | null>(null);

  const startDemoEmergency = async () => {
    setDemoError(null);
    setDemoBusy(true);
    try {
      const { sessionToken } = await startDemoSession();
      setSession({ sessionToken, account: null, demo: true });
      navigate(`/portal/emergency?code=${DEMO_SHARE_CODE}`);
    } catch (err) {
      const apiErr = err as ApiError;
      setDemoError(apiErr.message ?? "Could not start demo access. Please try again.");
    } finally {
      setDemoBusy(false);
    }
  };

  return (
    <PortalLayout>
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-destructive/40 bg-destructive/10 text-destructive text-xs font-bold tracking-[0.15em] uppercase mb-6">
            <Siren className="h-4 w-4" />
            For life-saving, last-minute situations
          </div>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-5">
            HIVE <span className="hive-gradient-text">Emergency Portal</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            A secure gateway for healthcare workers and caretakers to reach a
            patient's critical medical information — but only through a
            patient-approved, time-limited emergency share.
          </p>
        </div>

        {/* Emergency access shortcut */}
        <Card className="mb-10 border-destructive/40 bg-destructive/5">
          <CardContent className="flex flex-col sm:flex-row items-center justify-between gap-4 p-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-destructive/15 flex items-center justify-center shrink-0">
                <Siren className="h-6 w-6 text-destructive" />
              </div>
              <div>
                <h2 className="text-lg font-bold">Emergency access</h2>
                <p className="text-sm text-muted-foreground">
                  Have a patient share code (HES-XXXX-XXXX)? Go straight to the
                  viewer.
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Demo access can only open the demo code{" "}
                  <span className="font-mono text-primary">{DEMO_SHARE_CODE}</span>.
                </p>
                {demoError && (
                  <p className="text-xs text-destructive mt-1">{demoError}</p>
                )}
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <Button
                onClick={() => navigate("/portal/login")}
                className="gap-1.5"
              >
                Open emergency viewer <ArrowRight className="h-4 w-4" />
              </Button>
              <Button variant="outline" onClick={startDemoEmergency} disabled={demoBusy}>
                {demoBusy ? "Starting…" : "Try demo access (DEMO)"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Two entrances */}
        <div className="grid md:grid-cols-2 gap-6">
          <Card className="group hover:border-primary/50 transition-colors">
            <CardHeader>
              <div className="h-14 w-14 rounded-2xl bg-primary/15 flex items-center justify-center mb-3">
                <Stethoscope className="h-7 w-7 text-primary" />
              </div>
              <CardTitle className="text-2xl">Healthcare Worker</CardTitle>
              <CardDescription className="text-base">
                GPs, hospital doctors, first responders, physiotherapists,
                specialists, A&amp;E follow-up and occupational health.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <ul className="text-sm text-muted-foreground space-y-1.5">
                <li className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-primary" /> Verified
                  professional access
                </li>
                <li className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-primary" /> Biometric 2FA
                  on every login
                </li>
              </ul>
              <div className="flex gap-2 pt-2">
                <Button onClick={() => navigate("/portal/signup?type=healthcare")}>
                  Sign up
                </Button>
                <Button variant="outline" onClick={() => navigate("/portal/login")}>
                  Log in
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="group hover:border-primary/50 transition-colors">
            <CardHeader>
              <div className="h-14 w-14 rounded-2xl bg-primary/15 flex items-center justify-center mb-3">
                <HeartHandshake className="h-7 w-7 text-primary" />
              </div>
              <CardTitle className="text-2xl">Caretaker</CardTitle>
              <CardDescription className="text-base">
                Residential and nursing home staff monitoring an opted-in
                resident (Red Geriatric Pack).
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <ul className="text-sm text-muted-foreground space-y-1.5">
                <li className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-primary" /> Live GPS &amp;
                  vitals — only while the patient opts in
                </li>
                <li className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-primary" /> Stops the
                  moment they revoke
                </li>
              </ul>
              <div className="flex gap-2 pt-2">
                <Button onClick={() => navigate("/portal/signup?type=caretaker")}>
                  Sign up
                </Button>
                <Button variant="outline" onClick={() => navigate("/portal/login")}>
                  Log in
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </PortalLayout>
  );
}
