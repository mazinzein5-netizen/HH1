import { useEffect, useRef, useState } from "react";
import { useLocation, useSearch, Link } from "wouter";
import { PortalLayout } from "./PortalLayout";
import { PageHead } from "@/components/PageHead";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  HEALTHCARE_ROLES,
  registerAccount,
  fileToDataUrl,
  isWebAuthnAvailable,
  registerPasskeyServer,
  upsertProfile,
  type AccountType,
  type ApiError,
  type HealthcareRole,
  type VerificationMode,
} from "./lib/store";
import { Camera, Upload, Check, Fingerprint, AlertTriangle, ShieldCheck } from "lucide-react";

type LinkedProvider = "apple" | "google";

const PROVIDER_LABEL: Record<LinkedProvider, string> = {
  apple: "Apple",
  google: "Google",
};

function AppleIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M16.365 1.43c0 1.14-.418 2.2-1.253 3.036-.87.87-1.966 1.375-3.02 1.288a3.06 3.06 0 0 1-.023-.379c0-1.096.475-2.27 1.322-3.117.422-.435.96-.797 1.612-1.086C15.653.883 16.244.755 16.34.75c.017.226.025.453.025.68zm4.166 16.25c-.522 1.206-.773 1.744-1.445 2.81-.938 1.487-2.262 3.34-3.902 3.354-1.458.014-1.833-.955-3.812-.944-1.98.011-2.393.962-3.851.948-1.64-.015-2.894-1.688-3.833-3.175-2.625-4.157-2.9-9.035-1.28-11.63 1.15-1.844 2.966-2.923 4.673-2.923 1.738 0 2.83.953 4.267.953 1.394 0 2.243-.955 4.253-.955 1.52 0 3.13.828 4.276 2.258-3.757 2.06-3.147 7.424.654 9.304z" />
    </svg>
  );
}

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path fill="#4285F4" d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47a5.57 5.57 0 0 1-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z" />
      <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09A11.99 11.99 0 0 0 12 24z" />
      <path fill="#FBBC05" d="M5.27 14.29A7.19 7.19 0 0 1 4.9 12c0-.8.14-1.57.37-2.29V6.62H1.29a11.99 11.99 0 0 0 0 10.76l3.98-3.09z" />
      <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.69 1.29 6.62l3.98 3.09C6.22 6.86 8.87 4.75 12 4.75z" />
    </svg>
  );
}

export default function Signup() {
  const [, navigate] = useLocation();
  const searchStr = useSearch();
  const initialType: AccountType =
    new URLSearchParams(searchStr).get("type") === "caretaker"
      ? "caretaker"
      : "healthcare";

  const [accountType, setAccountType] = useState<AccountType>(initialType);
  const [linkedProvider, setLinkedProvider] = useState<LinkedProvider | null>(null);
  const [fullName, setFullName] = useState("");
  const [workplace, setWorkplace] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<HealthcareRole | null>(null);
  const [mode, setMode] = useState<VerificationMode | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Verification captures (stay on this device only)
  const [selfie, setSelfie] = useState<string | undefined>();
  const [photoId, setPhotoId] = useState<{ name: string; data: string } | undefined>();
  const [certification, setCertification] = useState<{ name: string; data: string } | undefined>();

  // Webcam
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [cameraOn, setCameraOn] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const selfieFallbackRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => stopCamera();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setCameraOn(false);
  };

  const startCamera = async () => {
    setCameraError(null);
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error("Camera not available");
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" },
        audio: false,
      });
      streamRef.current = stream;
      setCameraOn(true);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => undefined);
      }
    } catch {
      setCameraError(
        "Webcam is unavailable. Please upload a selfie photo instead.",
      );
    }
  };

  const captureSelfie = () => {
    const video = videoRef.current;
    if (!video) return;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth || 480;
    canvas.height = video.videoHeight || 360;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    setSelfie(canvas.toDataURL("image/jpeg", 0.8));
    stopCamera();
  };

  const onSelfieFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setSelfie(await fileToDataUrl(file));
  };

  const onPhotoIdFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setPhotoId({ name: file.name, data: await fileToDataUrl(file) });
  };

  const onCertFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setCertification({ name: file.name, data: await fileToDataUrl(file) });
  };

  const validate = (): string | null => {
    if (!fullName.trim()) return "Please enter your full name.";
    if (!workplace.trim()) return "Please enter your workplace.";
    if (!email.trim() || !email.includes("@")) return "Please enter a valid email.";
    if (password.length < 6) return "Password must be at least 6 characters.";
    if (accountType === "healthcare" && !role)
      return "Please select your clinical role.";
    if (!mode) return "Please choose Demo mode or Full verification.";
    if (mode === "full") {
      if (!selfie) return "A selfie is required for full verification.";
      if (!photoId) return "A photo ID is required for full verification.";
      if (accountType === "healthcare" && !certification)
        return "A professional certification file is required for full verification.";
    }
    return null;
  };

  const handleSubmit = async () => {
    setError(null);
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }
    setSubmitting(true);

    let accountId: string;
    let webauthnToken: string;
    try {
      const { account, webauthnToken: token } = await registerAccount({
        fullName: fullName.trim(),
        workplace: workplace.trim(),
        email: email.trim(),
        password,
        accountType,
        role: accountType === "healthcare" ? role ?? undefined : undefined,
        mode: mode as VerificationMode,
      });
      accountId = account.id;
      webauthnToken = token;
    } catch (err) {
      const apiErr = err as ApiError;
      if (apiErr.status === 409) {
        setError("An account with this email already exists. Please log in.");
      } else if (apiErr.status === 400) {
        setError(apiErr.message ?? apiErr.error ?? "Please check your details and try again.");
      } else {
        setError(apiErr.message ?? "Could not create your account. Please try again.");
      }
      setSubmitting(false);
      return;
    }

    // Register a passkey — the credential public key is verified and stored
    // server-side so the biometric second factor can be enforced at login.
    let hasPasskey = false;
    if (isWebAuthnAvailable()) {
      try {
        hasPasskey = await registerPasskeyServer(webauthnToken);
      } catch {
        hasPasskey = false;
      }
    }

    // Keep verification images + profile on THIS device only.
    upsertProfile({
      accountId,
      email: email.trim(),
      hasPasskey,
      linkedProvider: linkedProvider ?? undefined,
      verification:
        mode === "full"
          ? {
              selfie,
              photoId: photoId?.data,
              photoIdName: photoId?.name,
              certification: certification?.data,
              certificationName: certification?.name,
            }
          : undefined,
    });

    setSubmitting(false);
    navigate("/portal/login?registered=1");
  };

  return (
    <PortalLayout>
      <PageHead
        title="Create Your HIVE Portal Account"
        description="Sign up for a HIVE Portal account as a healthcare professional or caretaker. Join Ireland's connected health network with verified, biometric-secured access."
        path="/portal/signup"
        ogTitle="Create Your HIVE Portal Account"
        ogDescription="Sign up as a verified healthcare professional or caretaker. Biometric-secured access to Ireland's connected health network."
      />
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">Create your portal account</h1>
        <p className="text-muted-foreground mb-8">
          Pilot: accounts and any verification images are stored only on this
          device. Verification images are never sent to a server.
        </p>

        {/* Quick sign-up with Apple / Google (privacy-preserving) */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Quick sign-up</CardTitle>
            <CardDescription>
              Link your account to Apple or Google as a sign-in label.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setLinkedProvider(linkedProvider === "apple" ? null : "apple")}
                aria-pressed={linkedProvider === "apple"}
                data-testid="button-signup-apple"
                className={`rounded-xl border p-4 flex items-center justify-center gap-2.5 font-semibold transition-colors ${
                  linkedProvider === "apple"
                    ? "border-primary bg-primary/10"
                    : "border-border hover:border-primary/40"
                }`}
              >
                <AppleIcon className="h-5 w-5" />
                Sign up with Apple
                {linkedProvider === "apple" && <Check className="h-4 w-4 text-primary" />}
              </button>
              <button
                type="button"
                onClick={() => setLinkedProvider(linkedProvider === "google" ? null : "google")}
                aria-pressed={linkedProvider === "google"}
                data-testid="button-signup-google"
                className={`rounded-xl border p-4 flex items-center justify-center gap-2.5 font-semibold transition-colors ${
                  linkedProvider === "google"
                    ? "border-primary bg-primary/10"
                    : "border-border hover:border-primary/40"
                }`}
              >
                <GoogleIcon className="h-5 w-5" />
                Sign up with Google
                {linkedProvider === "google" && <Check className="h-4 w-4 text-primary" />}
              </button>
            </div>
            <p className="text-xs text-muted-foreground flex items-start gap-2">
              <ShieldCheck className="h-4 w-4 text-primary shrink-0 mt-0.5" />
              Privacy first: no data is ever sent to Apple or Google. Your choice is
              stored only on this device as a label for your account.
              {linkedProvider &&
                ` Confirm your details below — your account will be created here and linked to ${PROVIDER_LABEL[linkedProvider]}.`}
            </p>
          </CardContent>
        </Card>

        {/* Account type */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Account type</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-3">
            {(["healthcare", "caretaker"] as AccountType[]).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setAccountType(t)}
                className={`rounded-xl border p-4 text-left transition-colors ${
                  accountType === t
                    ? "border-primary bg-primary/10"
                    : "border-border hover:border-primary/40"
                }`}
              >
                <div className="font-semibold capitalize">
                  {t === "healthcare" ? "Healthcare worker" : "Caretaker"}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  {t === "healthcare"
                    ? "Clinical professional with a role"
                    : "Residential / nursing home staff"}
                </div>
              </button>
            ))}
          </CardContent>
        </Card>

        {/* Details */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Your details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="fullName">Full name</Label>
              <Input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="workplace">Workplace</Label>
              <Input id="workplace" value={workplace} onChange={(e) => setWorkplace(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
          </CardContent>
        </Card>

        {/* Role selection */}
        {accountType === "healthcare" ? (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Your clinical role</CardTitle>
              <CardDescription>Select exactly one.</CardDescription>
            </CardHeader>
            <CardContent className="grid sm:grid-cols-2 gap-2.5">
              {HEALTHCARE_ROLES.map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRole(r)}
                  className={`rounded-lg border px-4 py-3 text-left text-sm transition-colors ${
                    role === r
                      ? "border-primary bg-primary/10 font-semibold"
                      : "border-border hover:border-primary/40"
                  }`}
                >
                  {r}
                </button>
              ))}
            </CardContent>
          </Card>
        ) : (
          <Card className="mb-6">
            <CardContent className="p-6 flex items-center gap-3">
              <Badge className="bg-primary/20 text-primary border border-primary/40">
                Caretaker
              </Badge>
              <span className="text-sm text-muted-foreground">
                Caretaker account — no clinical role required.
              </span>
            </CardContent>
          </Card>
        )}

        {/* Verification mode */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Verification</CardTitle>
            <CardDescription>
              Choose demo mode for instant pilot access, or full verification.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setMode("demo")}
                className={`rounded-xl border p-4 text-left transition-colors ${
                  mode === "demo" ? "border-primary bg-primary/10" : "border-border hover:border-primary/40"
                }`}
              >
                <div className="flex items-center gap-2 font-semibold">
                  Demo mode
                  <Badge className="bg-primary/20 text-primary border border-primary/40">DEMO</Badge>
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  Instantly active with fake data. Badged DEMO everywhere.
                </div>
              </button>
              <button
                type="button"
                onClick={() => setMode("full")}
                className={`rounded-xl border p-4 text-left transition-colors ${
                  mode === "full" ? "border-primary bg-primary/10" : "border-border hover:border-primary/40"
                }`}
              >
                <div className="flex items-center gap-2 font-semibold">
                  Full verification
                  <Badge className="bg-amber-500/15 text-amber-400 border border-amber-500/40">
                    VERIFICATION ONGOING
                  </Badge>
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  Selfie, photo ID &amp; certification. Status stays ongoing until approved.
                </div>
              </button>
            </div>

            {mode === "full" && (
              <div className="space-y-6 pt-2 border-t border-border">
                <p className="text-xs text-muted-foreground flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                  These images stay on your own device in this pilot and are
                  never uploaded to any server.
                </p>

                {/* Selfie */}
                <div>
                  <Label className="mb-2 block">1. Selfie</Label>
                  {selfie ? (
                    <div className="flex items-center gap-3">
                      <img src={selfie} alt="Selfie preview" className="h-24 w-24 rounded-lg object-cover border border-border" />
                      <Button variant="outline" size="sm" onClick={() => setSelfie(undefined)}>
                        Retake
                      </Button>
                    </div>
                  ) : cameraOn ? (
                    <div className="space-y-2">
                      <video ref={videoRef} className="w-full max-w-sm rounded-lg border border-border bg-black" playsInline muted />
                      <div className="flex gap-2">
                        <Button size="sm" onClick={captureSelfie} className="gap-1.5">
                          <Camera className="h-4 w-4" /> Capture
                        </Button>
                        <Button size="sm" variant="outline" onClick={stopCamera}>
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={startCamera} className="gap-1.5">
                          <Camera className="h-4 w-4" /> Use webcam
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => selfieFallbackRef.current?.click()} className="gap-1.5">
                          <Upload className="h-4 w-4" /> Upload photo
                        </Button>
                        <input ref={selfieFallbackRef} type="file" accept="image/*" capture="user" className="hidden" onChange={onSelfieFile} />
                      </div>
                      {cameraError && <p className="text-xs text-amber-400">{cameraError}</p>}
                    </div>
                  )}
                </div>

                {/* Photo ID */}
                <div>
                  <Label className="mb-2 block">2. Photo ID</Label>
                  <div className="flex items-center gap-3">
                    <Button size="sm" variant="outline" asChild className="gap-1.5">
                      <label>
                        <Upload className="h-4 w-4" /> Capture / upload ID
                        <input type="file" accept="image/*" capture="environment" className="hidden" onChange={onPhotoIdFile} />
                      </label>
                    </Button>
                    {photoId && (
                      <span className="text-sm text-emerald-400 flex items-center gap-1">
                        <Check className="h-4 w-4" /> {photoId.name}
                      </span>
                    )}
                  </div>
                </div>

                {/* Certification */}
                {accountType === "healthcare" && (
                  <div>
                    <Label className="mb-2 block">3. Professional certification</Label>
                    <div className="flex items-center gap-3">
                      <Button size="sm" variant="outline" asChild className="gap-1.5">
                        <label>
                          <Upload className="h-4 w-4" /> Upload certification
                          <input type="file" accept="image/*,application/pdf" className="hidden" onChange={onCertFile} />
                        </label>
                      </Button>
                      {certification && (
                        <span className="text-sm text-emerald-400 flex items-center gap-1">
                          <Check className="h-4 w-4" /> {certification.name}
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="rounded-lg border border-border bg-card/40 p-4 mb-6 flex items-start gap-2 text-sm text-muted-foreground">
          <Fingerprint className="h-5 w-5 text-primary shrink-0" />
          {isWebAuthnAvailable()
            ? "We'll register a biometric passkey on this device now. It will be required as a second factor on every login."
            : "Biometric 2FA is required on a supported device. You can still sign up here, but you'll need a supported device / dev override to log in."}
        </div>

        {error && (
          <div className="rounded-lg border border-destructive/50 bg-destructive/10 text-destructive px-4 py-3 mb-4 text-sm">
            {error}
          </div>
        )}

        <div className="flex items-center gap-3">
          <Button onClick={handleSubmit} disabled={submitting} size="lg">
            {submitting ? "Creating account…" : "Create account"}
          </Button>
          <Link href="/portal/login" className="text-sm text-muted-foreground hover:text-primary">
            Already have an account? Log in
          </Link>
        </div>
      </div>
    </PortalLayout>
  );
}
