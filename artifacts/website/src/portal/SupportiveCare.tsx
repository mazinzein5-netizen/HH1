import { useLocation } from "wouter";
import { PortalLayout, useProtected } from "./PortalLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MembershipWorkspace } from "./MembershipWorkspace";
import { isFirstResponderRole, isSupportiveRole } from "./lib/store";
import { useState } from "react";
import {
  ArrowRight,
  Crown,
  HeartHandshake,
  ShieldCheck,
  Siren,
  Stethoscope,
} from "lucide-react";

/**
 * Supportive Care Professionals portal — physiotherapists, occupational
 * health and A&E follow-up. Their own workspace: emergency relay tools plus
 * the shared HIVE booking/consultation membership features. Doctor-only
 * areas live in the GP & HIVE HUB; first responders have their own portal
 * at /portal/responder.
 */
export default function SupportiveCare() {
  const [, navigate] = useLocation();
  const { allowed, account } = useProtected();
  const [isMember, setIsMember] = useState(false);

  const isPractitioner = !!account && account.accountType === "healthcare";
  const superuser = !!account?.superuser;
  const responder = isPractitioner && !superuser && isFirstResponderRole(account?.role);
  // Symmetric with the HUB guard: unknown/legacy roles are treated as
  // doctors (previous behaviour) and belong in the GP & HIVE HUB.
  const doctor = isPractitioner && !responder && !isSupportiveRole(account?.role);

  if (!allowed) {
    return (
      <PortalLayout>
        <div className="max-w-md mx-auto text-center py-16">
          <HeartHandshake className="h-10 w-10 text-primary mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Supportive Care Professionals</h1>
          <p className="text-muted-foreground mb-6">
            Sign in with your supportive-care account — physiotherapy,
            occupational health or A&amp;E follow-up — for emergency relay
            tools, HIVE booking and consultations.
          </p>
          <div className="flex justify-center gap-3">
            <Button onClick={() => navigate("/portal/login")}>Sign in</Button>
            <Button variant="outline" onClick={() => navigate("/portal/signup?type=healthcare")}>
              Sign up
            </Button>
          </div>
        </div>
      </PortalLayout>
    );
  }

  if (!isPractitioner) {
    return (
      <PortalLayout>
        <div className="max-w-md mx-auto text-center py-16">
          <h1 className="text-2xl font-bold mb-2">Practitioner account required</h1>
          <p className="text-muted-foreground mb-6">
            This area is for healthcare practitioner accounts. Your current
            account type does not include practitioner tools.
          </p>
          <Button onClick={() => navigate("/portal")}>Back to portal</Button>
        </div>
      </PortalLayout>
    );
  }

  if (responder) {
    // First responders have their own dedicated portal.
    return (
      <PortalLayout>
        <div className="max-w-md mx-auto text-center py-16">
          <Siren className="h-10 w-10 text-primary mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">This is the Supportive Care portal</h1>
          <p className="text-muted-foreground mb-6">
            As a first responder, your workspace — rapid emergency handover
            access, HIVE booking and consultations — lives in the First
            Responders portal.
          </p>
          <Button onClick={() => navigate("/portal/responder")} className="gap-1.5">
            <Siren className="h-4 w-4" /> Go to the First Responders portal
          </Button>
        </div>
      </PortalLayout>
    );
  }

  if (doctor && !superuser) {
    // Doctors belong in the GP & HIVE HUB (superuser may inspect both portals).
    return (
      <PortalLayout>
        <div className="max-w-md mx-auto text-center py-16">
          <Stethoscope className="h-10 w-10 text-primary mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">This is the Supportive Care portal</h1>
          <p className="text-muted-foreground mb-6">
            As a {account?.role ?? "doctor"}, your workspace — patient files,
            live medications, booking and consultations — lives in the GP &amp;
            HIVE HUB.
          </p>
          <Button onClick={() => navigate("/portal/practitioner")} className="gap-1.5">
            <Stethoscope className="h-4 w-4" /> Go to the GP &amp; HIVE HUB
          </Button>
        </div>
      </PortalLayout>
    );
  }

  return (
    <PortalLayout>
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <HeartHandshake className="h-7 w-7 text-primary" /> Supportive Care Portal
          </h1>
          <div className="flex items-center gap-2">
            {superuser && (
              <Badge className="bg-amber-500/20 text-amber-400 border border-amber-500/40 gap-1">
                <ShieldCheck className="h-3 w-3" /> SUPERUSER
              </Badge>
            )}
            {isMember && (
              <Badge className="bg-primary/20 text-primary border border-primary/40 gap-1">
                <Crown className="h-3 w-3" /> MEMBER
              </Badge>
            )}
            {account?.role && (
              <Badge className="bg-primary/20 text-primary border border-primary/40">
                {account.role}
              </Badge>
            )}
          </div>
        </div>
        <p className="text-muted-foreground mb-8">
          Your workspace for supportive-care roles: patient-approved emergency
          relay access, automated HIVE booking and consultations.
        </p>

        {/* Emergency relay tools — the shared, patient-consented relay */}
        <Card className="mb-8 border-destructive/40 bg-destructive/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Siren className="h-5 w-5 text-destructive" /> Emergency relay access
            </CardTitle>
            <CardDescription>
              Open a patient-approved, time-limited emergency share (HES-XXXX-XXXX
              code) to view critical medical information. Access is
              patient-consented, relayed in memory only and never centrally stored.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <ul className="text-sm text-muted-foreground space-y-1.5">
              <li className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-primary" /> Enter the share code
                the patient gives you
              </li>
              <li className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-primary" /> Access ends when the
                share expires or is revoked
              </li>
            </ul>
            <Button onClick={() => navigate("/portal/emergency")} className="gap-1.5">
              Open emergency viewer <ArrowRight className="h-4 w-4" />
            </Button>
          </CardContent>
        </Card>

        <MembershipWorkspace onMembershipChange={setIsMember} />
      </div>
    </PortalLayout>
  );
}
