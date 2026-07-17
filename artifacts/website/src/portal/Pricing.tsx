import { useState } from "react";
import { PortalLayout } from "./PortalLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Check, Clock } from "lucide-react";

const plans = [
  {
    name: "Monthly",
    price: "€25",
    period: "/month",
    features: ["Verified professional access", "Emergency viewer", "Caretaker dashboard", "Biometric 2FA"],
    highlight: false,
  },
  {
    name: "Annual",
    price: "€99",
    period: "/year",
    features: ["Everything in Monthly", "Best value — save vs monthly", "Priority verification", "Biometric 2FA"],
    highlight: true,
  },
];

export default function Pricing() {
  const [gateOpen, setGateOpen] = useState(false);

  return (
    <PortalLayout>
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold mb-3">Partner subscription</h1>
          <p className="text-muted-foreground text-lg">
            For verified healthcare partners. Demo mode always stays free.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {plans.map((plan) => (
            <Card key={plan.name} className={plan.highlight ? "border-primary/60 shadow-[0_0_30px_rgba(245,197,24,0.15)]" : ""}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl">{plan.name}</CardTitle>
                  {plan.highlight && (
                    <Badge className="bg-primary/20 text-primary border border-primary/40">Best value</Badge>
                  )}
                </div>
                <div className="flex items-baseline gap-1 pt-2">
                  <span className="text-4xl font-bold">{plan.price}</span>
                  <span className="text-muted-foreground">{plan.period}</span>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-2">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 text-primary shrink-0" /> {f}
                    </li>
                  ))}
                </ul>
                <Button className="w-full" onClick={() => setGateOpen(true)}>
                  Subscribe
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="bg-card/40">
          <CardContent className="p-6 flex items-center gap-4">
            <Badge className="bg-primary/20 text-primary border border-primary/40">Free</Badge>
            <div>
              <div className="font-semibold">Demo mode</div>
              <p className="text-sm text-muted-foreground">
                Explore the full portal with fake data at no cost, badged DEMO.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={gateOpen} onOpenChange={setGateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" /> Payments coming soon
            </DialogTitle>
            <DialogDescription>
              Online payments are not yet available. No payment provider is
              configured for this pilot, so we can't take a subscription right
              now. Please continue in Demo mode, and we'll be in touch when
              partner billing goes live.
            </DialogDescription>
          </DialogHeader>
          <Button onClick={() => setGateOpen(false)} className="w-full">
            Got it
          </Button>
        </DialogContent>
      </Dialog>
    </PortalLayout>
  );
}
