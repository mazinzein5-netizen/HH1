import { PortalLayout } from "./PortalLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ShieldCheck, Clock, MapPin, Camera, Lock } from "lucide-react";

const sections = [
  {
    icon: <ShieldCheck className="h-5 w-5 text-primary" />,
    title: "Patient-approved access only",
    body: "A patient's data is only ever visible through an emergency share that the patient themselves approved on their own device. There is no back door and no way to browse patient records.",
  },
  {
    icon: <Lock className="h-5 w-5 text-primary" />,
    title: "Nothing stored centrally without consent",
    body: "We do not keep a central database of patient records. Emergency shares are transient — they live only as a temporary relay and are never written to disk.",
  },
  {
    icon: <Clock className="h-5 w-5 text-primary" />,
    title: "Shares expire automatically",
    body: "Every emergency share is time-limited and expires on its own. Once expired, the code stops working immediately and the data is gone.",
  },
  {
    icon: <MapPin className="h-5 w-5 text-primary" />,
    title: "Caretaker sharing is opt-in and revocable",
    body: "Location and vitals only appear while the patient (Red Geriatric Pack) has actively opted in. The moment they revoke, sharing stops and the link goes dead.",
  },
  {
    icon: <Camera className="h-5 w-5 text-primary" />,
    title: "Verification images stay on your device",
    body: "In this pilot, any selfie, photo ID or certification you capture for verification stays on your own device. These images are never uploaded to any server.",
  },
];

export default function Privacy() {
  return (
    <PortalLayout>
      <div className="max-w-2xl mx-auto">
        <h1 className="text-4xl font-bold mb-3">Privacy</h1>
        <p className="text-muted-foreground text-lg mb-8">
          Plain-language disclosures about how the HIVE Emergency Portal handles
          data.
        </p>
        <div className="space-y-4">
          {sections.map((s) => (
            <Card key={s.title}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  {s.icon} {s.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed">{s.body}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </PortalLayout>
  );
}
