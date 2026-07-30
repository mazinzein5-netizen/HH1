import { useEffect, useState } from "react";
import { useLocation, useSearch } from "wouter";
import { PortalLayout, useProtected } from "./PortalLayout";
import { authHeader } from "./lib/store";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertTriangle,
  Siren,
  Pill,
  FileText,
  StickyNote,
  Clock,
  Eye,
  ShieldAlert,
} from "lucide-react";

interface Allergy {
  drug?: string;
  reaction?: string;
  severity?: string;
}
interface Medication {
  medication?: string;
  dose?: string;
  frequency?: string;
  route?: string;
}
interface Condition {
  name?: string;
  icd10?: string;
  status?: string;
  diagnosedDate?: string;
}
interface EmergencyPayload {
  patientName?: string;
  generatedAt?: string;
  allergies?: Allergy[];
  redFlags?: string[];
  medications?: Medication[];
  conditions?: Condition[];
  notes?: string;
}
interface ClaimResult {
  payload: EmergencyPayload;
  createdAt?: string;
  expiresAt?: string;
  accessCount?: number;
  demo?: boolean;
}

const DEMO_SHARE_CODE = "HES-DEMO-2026";
const CODE_RE = new RegExp(`HES-DEMO-2026|HES-[0-9A-Z]{4}-[0-9A-Z]{4}`, "i");

function useCountdown(expiresAt?: string): string {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  if (!expiresAt) return "";
  const diff = new Date(expiresAt).getTime() - now;
  if (Number.isNaN(diff)) return "";
  if (diff <= 0) return "Expired";
  const mins = Math.floor(diff / 60000);
  const secs = Math.floor((diff % 60000) / 1000);
  const hrs = Math.floor(mins / 60);
  if (hrs > 0) return `${hrs}h ${mins % 60}m remaining`;
  return `${mins}m ${secs}s remaining`;
}

export default function Emergency() {
  const [, navigate] = useLocation();
  const searchStr = useSearch();
  const { allowed, isDemoAccess } = useProtected();
  const prefillCode = new URLSearchParams(searchStr).get("code") ?? "";
  const [input, setInput] = useState(
    prefillCode || (isDemoAccess ? DEMO_SHARE_CODE : ""),
  );
  const [result, setResult] = useState<ClaimResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const countdown = useCountdown(result?.expiresAt);

  const extractCode = (raw: string): string | null => {
    const trimmed = raw.trim();
    const match = trimmed.match(CODE_RE);
    if (match) return match[0].toUpperCase();
    // Try QR payload JSON
    try {
      const parsed = JSON.parse(trimmed);
      if (typeof parsed?.code === "string") {
        const m = parsed.code.match(CODE_RE);
        if (m) return m[0].toUpperCase();
      }
    } catch {
      /* not JSON */
    }
    return null;
  };

  const handleSubmit = async () => {
    setError(null);
    setResult(null);
    const code = extractCode(input);
    if (!code) {
      setError("Enter a valid share code (HES-XXXX-XXXX) or paste a QR payload.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${import.meta.env.BASE_URL}api/emergency-share/claim`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeader() },
        body: JSON.stringify({ code }),
      });
      if (res.status === 401) {
        setError("Your session has expired. Please log in again.");
        navigate("/portal/login");
        return;
      }
      if (res.status === 403) {
        let msg = `Demo access can only open the demo code ${DEMO_SHARE_CODE}.`;
        try {
          const body = (await res.json()) as { error?: string; message?: string };
          if (body.message) msg = body.message;
        } catch {
          /* ignore */
        }
        setError(msg);
        return;
      }
      if (res.status === 404) {
        setError("Invalid or expired code.");
        return;
      }
      if (!res.ok) {
        setError("Something went wrong. Please try again.");
        return;
      }
      const data = (await res.json()) as ClaimResult;
      setResult(data);
    } catch {
      setError("Network error. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!allowed) {
    return (
      <PortalLayout>
        <div className="max-w-md mx-auto text-center py-16">
          <ShieldAlert className="h-12 w-12 text-primary mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Sign in required</h1>
          <p className="text-muted-foreground mb-6">
            The emergency viewer requires a logged-in account with biometric 2FA
            passed this session.
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

  const payload = result?.payload;

  return (
    <PortalLayout>
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center gap-3 mb-2">
          <h1 className="text-3xl font-bold">Emergency viewer</h1>
          {isDemoAccess && (
            <Badge className="bg-primary/20 text-primary border border-primary/40">DEMO</Badge>
          )}
        </div>
        <p className="text-muted-foreground mb-6">
          Enter the patient-provided share code, or paste a scanned QR payload.
        </p>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Siren className="h-5 w-5 text-destructive" /> Share code
            </CardTitle>
            <CardDescription>Format: HES-XXXX-XXXX</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="HES-XXXX-XXXX"
              className="text-lg tracking-wider font-mono uppercase"
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSubmit();
              }}
            />
            <details className="text-sm text-muted-foreground">
              <summary className="cursor-pointer">Paste a QR payload instead</summary>
              <Textarea
                className="mt-2 font-mono text-xs"
                rows={3}
                placeholder='{"code":"HES-XXXX-XXXX"}'
                value={input}
                onChange={(e) => setInput(e.target.value)}
              />
            </details>
            {error && (
              <div className="rounded-lg border border-destructive/50 bg-destructive/10 text-destructive px-4 py-3 text-sm font-semibold">
                {error}
              </div>
            )}
            <Button onClick={handleSubmit} disabled={loading} size="lg" className="w-full">
              {loading ? "Retrieving…" : "Retrieve emergency record"}
            </Button>
          </CardContent>
        </Card>

        {payload && (
          <div className="space-y-5">
            {result?.demo && (
              <div className="rounded-lg border-2 border-primary/50 bg-primary/10 text-primary px-4 py-3 text-sm font-bold flex items-center gap-2 uppercase tracking-wide">
                <AlertTriangle className="h-5 w-5 shrink-0" /> Fictional demo data —
                not a real patient
              </div>
            )}
            {/* Meta */}
            <div className="flex flex-wrap items-center gap-3 text-sm">
              {payload.patientName && (
                <span className="font-bold text-lg">{payload.patientName}</span>
              )}
              {result?.expiresAt && (
                <span className="flex items-center gap-1.5 text-amber-400">
                  <Clock className="h-4 w-4" /> {countdown}
                </span>
              )}
              {typeof result?.accessCount === "number" && (
                <span className="flex items-center gap-1.5 text-muted-foreground">
                  <Eye className="h-4 w-4" /> accessed {result.accessCount}{" "}
                  {result.accessCount === 1 ? "time" : "times"}
                </span>
              )}
              {payload.generatedAt && (
                <span className="text-muted-foreground">
                  generated {new Date(payload.generatedAt).toLocaleString()}
                </span>
              )}
            </div>

            {/* 1. ALLERGIES — big red banner */}
            <div className="rounded-2xl border-2 border-red-600 bg-red-950/40 overflow-hidden">
              <div className="bg-red-600 text-white px-5 py-3 flex items-center gap-2 font-extrabold text-lg tracking-wide uppercase">
                <AlertTriangle className="h-6 w-6" /> Allergies
              </div>
              <div className="p-5">
                {payload.allergies && payload.allergies.length > 0 ? (
                  <ul className="space-y-2">
                    {payload.allergies.map((a, i) => (
                      <li key={i} className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                        <span className="text-xl font-bold text-red-300">
                          {a.drug ?? "Unknown allergen"}
                        </span>
                        {a.reaction && <span className="text-red-100">→ {a.reaction}</span>}
                        {a.severity && (
                          <Badge className="bg-red-600 text-white border-transparent uppercase">
                            {a.severity}
                          </Badge>
                        )}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-red-200 font-semibold">
                    No allergies recorded — confirm with patient if possible.
                  </p>
                )}
              </div>
            </div>

            {/* 2. Red flags */}
            {payload.redFlags && payload.redFlags.length > 0 && (
              <Card className="border-amber-500/50 bg-amber-500/5">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-amber-400">
                    <Siren className="h-5 w-5" /> Critical / red-flag conditions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-1.5">
                    {payload.redFlags.map((f, i) => (
                      <li key={i} className="flex items-start gap-2 font-semibold">
                        <span className="text-amber-400">▲</span> {f}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* 3. Medications — ordered numbered list */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Pill className="h-5 w-5 text-primary" /> Current medications
                </CardTitle>
              </CardHeader>
              <CardContent>
                {payload.medications && payload.medications.length > 0 ? (
                  <ol className="space-y-3">
                    {payload.medications.map((m, i) => (
                      <li key={i} className="flex gap-3">
                        <span className="h-7 w-7 shrink-0 rounded-full bg-primary/20 text-primary font-bold flex items-center justify-center text-sm">
                          {i + 1}
                        </span>
                        <div>
                          <div className="font-bold text-lg leading-tight">
                            {m.medication ?? "Unnamed medication"}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {[m.dose, m.frequency, m.route].filter(Boolean).join(" · ") || "—"}
                          </div>
                        </div>
                      </li>
                    ))}
                  </ol>
                ) : (
                  <p className="text-muted-foreground">No current medications recorded.</p>
                )}
              </CardContent>
            </Card>

            {/* 4. Medical history */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" /> Medical history
                </CardTitle>
              </CardHeader>
              <CardContent>
                {payload.conditions && payload.conditions.length > 0 ? (
                  <ul className="space-y-2">
                    {payload.conditions.map((c, i) => (
                      <li key={i} className="flex flex-wrap items-baseline gap-x-3">
                        <span className="font-semibold">{c.name ?? "Condition"}</span>
                        {c.status && (
                          <Badge variant="outline" className="uppercase text-xs">
                            {c.status}
                          </Badge>
                        )}
                        {c.icd10 && (
                          <span className="text-xs text-muted-foreground font-mono">{c.icd10}</span>
                        )}
                        {c.diagnosedDate && (
                          <span className="text-xs text-muted-foreground">
                            dx {c.diagnosedDate}
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-muted-foreground">No conditions recorded.</p>
                )}
              </CardContent>
            </Card>

            {/* 5. Patient notes */}
            {payload.notes && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <StickyNote className="h-5 w-5 text-primary" /> Patient notes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="whitespace-pre-wrap leading-relaxed">{payload.notes}</p>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </PortalLayout>
  );
}
