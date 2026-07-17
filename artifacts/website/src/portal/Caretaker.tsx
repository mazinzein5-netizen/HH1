import { useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { PortalLayout, useProtected } from "./PortalLayout";
import { authHeader } from "./lib/store";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  MapPin,
  HeartPulse,
  Droplet,
  Activity,
  Wind,
  ShieldAlert,
  AlertTriangle,
} from "lucide-react";

interface VitalSnapshot {
  hr?: number;
  spo2?: number;
  glucose?: number;
  ecg?: string;
  ts: string;
}
interface CaretakerData {
  patientLabel: string;
  createdAt?: string;
  lastSeenAt?: string | null;
  location?: { lat: number; lng: number; accuracyM?: number; ts: string } | null;
  vitals?: VitalSnapshot | null;
  demo?: boolean;
}

const CODE_RE = /HCL-[0-9A-Z]{4}-[0-9A-Z]{4}/i;
const DEMO_LINK_CODE = "HCL-DEMO-2026";
const STALE_MS = 15 * 60 * 1000;

function relativeTime(ts?: string | null): string {
  if (!ts) return "no data yet";
  const diff = Date.now() - new Date(ts).getTime();
  if (Number.isNaN(diff)) return "unknown";
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "updated just now";
  if (mins === 1) return "updated 1 min ago";
  if (mins < 60) return `updated ${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  return `updated ${hrs}h ago`;
}

function isStale(ts?: string | null): boolean {
  if (!ts) return true;
  return Date.now() - new Date(ts).getTime() > STALE_MS;
}

function VitalCard({
  icon,
  label,
  value,
  unit,
  ts,
}: {
  icon: React.ReactNode;
  label: string;
  value?: number | string;
  unit?: string;
  ts?: string | null;
}) {
  const stale = isStale(ts);
  const hasValue = value !== undefined && value !== null && value !== "";
  return (
    <Card className={stale && hasValue ? "border-amber-500/40" : ""}>
      <CardContent className="p-4">
        <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
          {icon} {label}
        </div>
        <div className="text-2xl font-bold">
          {hasValue ? value : "—"}
          {hasValue && unit && <span className="text-base font-normal text-muted-foreground ml-1">{unit}</span>}
        </div>
        <div className="text-xs mt-1 flex items-center gap-1">
          {hasValue && stale ? (
            <span className="text-amber-400 flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" /> stale · {relativeTime(ts)}
            </span>
          ) : (
            <span className="text-muted-foreground">{relativeTime(ts)}</span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default function Caretaker() {
  const [, navigate] = useLocation();
  const { allowed, isDemoAccess } = useProtected();
  const [input, setInput] = useState(isDemoAccess ? DEMO_LINK_CODE : "");
  const [activeCode, setActiveCode] = useState<string | null>(null);
  const [data, setData] = useState<CaretakerData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchData = async (code: string, initial = false) => {
    if (initial) {
      setLoading(true);
      setError(null);
    }
    try {
      const res = await fetch(`${import.meta.env.BASE_URL}api/caretaker-link/${code}`, {
        headers: { ...authHeader() },
      });
      if (res.status === 401) {
        setError("Your session has expired. Please log in again.");
        setData(null);
        setActiveCode(null);
        navigate("/portal/login");
        return;
      }
      if (res.status === 403) {
        let msg = `Demo access can only open the demo link ${DEMO_LINK_CODE}.`;
        try {
          const body = (await res.json()) as { error?: string; message?: string };
          if (body.message) msg = body.message;
        } catch {
          /* ignore */
        }
        setError(msg);
        setData(null);
        setActiveCode(null);
        return;
      }
      if (res.status === 404) {
        setError("This caretaker link is invalid or was revoked.");
        setData(null);
        setActiveCode(null);
        return;
      }
      if (!res.ok) {
        if (initial) setError("Something went wrong. Please try again.");
        return;
      }
      const json = (await res.json()) as CaretakerData;
      setData(json);
      setActiveCode(code);
    } catch {
      if (initial) setError("Network error. Please try again.");
    } finally {
      if (initial) setLoading(false);
    }
  };

  useEffect(() => {
    if (!activeCode) return;
    pollRef.current = setInterval(() => fetchData(activeCode), 30_000);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeCode]);

  const handleSubmit = () => {
    const match = input.trim().match(CODE_RE);
    if (!match) {
      setError("Enter a valid caretaker link code (HCL-XXXX-XXXX).");
      return;
    }
    fetchData(match[0].toUpperCase(), true);
  };

  if (!allowed) {
    return (
      <PortalLayout>
        <div className="max-w-md mx-auto text-center py-16">
          <ShieldAlert className="h-12 w-12 text-primary mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Sign in required</h1>
          <p className="text-muted-foreground mb-6">
            The caretaker dashboard requires a logged-in account with biometric
            2FA passed this session.
          </p>
          <div className="flex justify-center gap-3">
            <Button onClick={() => navigate("/portal/login")}>Log in</Button>
            <Button variant="outline" onClick={() => navigate("/portal")}>
              Back to portal
            </Button>
          </div>
        </div>
      </PortalLayout>
    );
  }

  const loc = data?.location;
  const delta = 0.005;
  const bbox = loc
    ? `${loc.lng - delta},${loc.lat - delta},${loc.lng + delta},${loc.lat + delta}`
    : "";

  return (
    <PortalLayout>
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center gap-3 mb-2">
          <h1 className="text-3xl font-bold">Caretaker dashboard</h1>
          {isDemoAccess && (
            <Badge className="bg-primary/20 text-primary border border-primary/40">DEMO</Badge>
          )}
        </div>
        <p className="text-muted-foreground mb-6">
          Live location and vitals appear <strong>only while the patient (Red
          Geriatric Pack) has opted in</strong>, and stop the moment they revoke.
        </p>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-primary" /> Caretaker link code
            </CardTitle>
            <CardDescription>Format: HCL-XXXX-XXXX</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="HCL-XXXX-XXXX"
              className="text-lg tracking-wider font-mono uppercase"
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSubmit();
              }}
            />
            {error && (
              <div className="rounded-lg border border-destructive/50 bg-destructive/10 text-destructive px-4 py-3 text-sm font-semibold">
                {error}
              </div>
            )}
            <Button onClick={handleSubmit} disabled={loading} size="lg" className="w-full">
              {loading ? "Connecting…" : "Connect"}
            </Button>
          </CardContent>
        </Card>

        {data && (
          <div className="space-y-5">
            {data.demo && (
              <div className="rounded-lg border-2 border-primary/50 bg-primary/10 text-primary px-4 py-3 text-sm font-bold flex items-center gap-2 uppercase tracking-wide">
                <AlertTriangle className="h-5 w-5 shrink-0" /> Fictional demo data —
                not a real resident
              </div>
            )}
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-xl font-bold">{data.patientLabel}</span>
              <Badge variant="outline">{relativeTime(data.lastSeenAt)}</Badge>
              <span className="text-xs text-muted-foreground">Auto-refreshing every 30s</span>
            </div>

            {/* Location */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-primary" /> Location
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loc ? (
                  <div className="space-y-2">
                    <div className="aspect-video w-full overflow-hidden rounded-lg border border-border">
                      <iframe
                        title="Patient location"
                        className="w-full h-full"
                        src={`https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${loc.lat},${loc.lng}`}
                      />
                    </div>
                    <div className="text-sm text-muted-foreground flex flex-wrap gap-x-4">
                      <span>{loc.lat.toFixed(5)}, {loc.lng.toFixed(5)}</span>
                      {typeof loc.accuracyM === "number" && <span>±{Math.round(loc.accuracyM)}m</span>}
                      <span className={isStale(loc.ts) ? "text-amber-400" : ""}>
                        {relativeTime(loc.ts)}
                      </span>
                    </div>
                  </div>
                ) : (
                  <p className="text-muted-foreground">
                    No location shared yet, or location sharing is off.
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Vitals */}
            <div>
              <h2 className="text-lg font-semibold mb-3">Latest vitals</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <VitalCard icon={<HeartPulse className="h-4 w-4" />} label="Heart rate" value={data.vitals?.hr} unit="bpm" ts={data.vitals?.ts} />
                <VitalCard icon={<Wind className="h-4 w-4" />} label="SpO₂" value={data.vitals?.spo2} unit="%" ts={data.vitals?.ts} />
                <VitalCard icon={<Droplet className="h-4 w-4" />} label="Glucose" value={data.vitals?.glucose} unit="mmol/L" ts={data.vitals?.ts} />
                <VitalCard icon={<Activity className="h-4 w-4" />} label="ECG" value={data.vitals?.ecg} ts={data.vitals?.ts} />
              </div>
              {!data.vitals && (
                <p className="text-muted-foreground text-sm mt-3">
                  No vitals shared yet.
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </PortalLayout>
  );
}
