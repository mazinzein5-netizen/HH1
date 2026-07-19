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
  Timer,
} from "lucide-react";

/**
 * First Responders portal — paramedics, ambulance and emergency crews.
 * Their own pathway: rapid emergency handover via patient-approved share
 * codes, plus the shared HIVE booking/consultation membership features.
 * Doctors live in the GP & HIVE HUB; physio/OT/A&E follow-up roles live in
 * the Supportive Care portal.
 */
export default function FirstResponder() {
  const [, navigate] = useLocation();
  const { allowed, account } = useProtected();
  const [isMember, setIsMember] = useState(false);

  const isPractitioner = !!account && account.accountType === "healthcare";
  const superuser = !!account?.superuser;
  const responder = isPractitioner && (superuser || isFirstResponderRole(account?.role));
  const supportive = isPractitioner && !superuser && isSupportiveRole(account?.role);

  if (!allowed) {
    return (
      <PortalLayout>
        <div className="max-w-md mx-auto text-center py-16">
          <Siren className="h-10 w-10 text-primary mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">First Responders</h1>
          <p className="text-muted-foreground mb-6">
            Sign in with your first-responder account for rapid, patient-approved
            emergency handover access, HIVE booking and consultations.
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

  if (!responder) {
    // Cross-access is blocked: doctors belong in the GP & HIVE HUB and
    // supportive-care roles in the Supportive Care portal.
    return (
      <PortalLayout>
        <div className="max-w-md mx-auto text-center py-16">
          {supportive ? (
            <HeartHandshake className="h-10 w-10 text-primary mx-auto mb-4" />
          ) : (
            <Stethoscope className="h-10 w-10 text-primary mx-auto mb-4" />
          )}
          <h1 className="text-2xl font-bold mb-2">This is the First Responders portal</h1>
          <p className="text-muted-foreground mb-6">
            As a {account?.role ?? "doctor"}, your workspace lives in the{" "}
            {supportive ? "Supportive Care portal" : "GP & HIVE HUB"}.
          </p>
          <Button
            onClick={() => navigate(supportive ? "/portal/supportive" : "/portal/practitioner")}
            className="gap-1.5"
          >
            {supportive ? (
              <>
                <HeartHandshake className="h-4 w-4" /> Go to the Supportive Care portal
              </>
            ) : (
              <>
                <Stethoscope className="h-4 w-4" /> Go to the GP &amp; HIVE HUB
              </>
            )}
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
            <Siren className="h-7 w-7 text-primary" /> First Responders Portal
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
          Your dedicated pathway for emergency response: rapid, patient-approved
          handover access at the scene, plus HIVE booking and consultations.
        </p>

        {/* Rapid emergency handover — the core first-responder tool */}
        <Card className="mb-8 border-destructive/40 bg-destructive/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Siren className="h-5 w-5 text-destructive" /> Rapid emergency handover
            </CardTitle>
            <CardDescription>
              Enter the patient-given emergency code (HES-XXXX-XXXX) to view
              critical information at the scene — allergies, red flags and
              current medications. Access is patient-consented, relayed in
              memory only and never centrally stored.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <ul className="text-sm text-muted-foreground space-y-1.5">
              <li className="flex items-center gap-2">
                <Timer className="h-4 w-4 text-primary" /> Time-limited codes —
                access ends when the share expires or is revoked
              </li>
              <li className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-primary" /> Readable over
                the phone; designed for the roadside, not the desk
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
