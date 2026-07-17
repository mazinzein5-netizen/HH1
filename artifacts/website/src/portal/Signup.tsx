import { useEffect, useRef, useState } from "react";
import { useLocation, useSearch, Link } from "wouter";
import { PortalLayout } from "./PortalLayout";
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
import { Camera, Upload, Check, Fingerprint, AlertTriangle } from "lucide-react";

export default function Signup() {
  const [, navigate] = useLocation();
  const searchStr = useSearch();
  const initialType: AccountType =
    new URLSearchParams(searchStr).get("type") === "caretaker"
      ? "caretaker"
      : "healthcare";

  const [accountType, setAccountType] = useState<AccountType>(initialType);
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
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">Create your portal account</h1>
        <p className="text-muted-foreground mb-8">
          Pilot: accounts and any verification images are stored only on this
          device. Verification images are never sent to a server.
        </p>

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
