import { useState } from "react";
import { useLocation, useSearch, Link } from "wouter";
import { PortalLayout } from "./PortalLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  complete2faDevSimulate,
  complete2faWithPasskey,
  isWebAuthnAvailable,
  loginPassword,
  setSession,
  type ApiError,
} from "./lib/store";
import { Fingerprint, ShieldAlert, Smartphone } from "lucide-react";

type Step = "password" | "biometric";

export default function Login() {
  const [, navigate] = useLocation();
  const searchStr = useSearch();
  const justRegistered = new URLSearchParams(searchStr).get("registered") === "1";

  const [step, setStep] = useState<Step>("password");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginToken, setLoginToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const webauthnOk = isWebAuthnAvailable();

  const handlePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const { loginToken: token } = await loginPassword(email.trim(), password);
      setLoginToken(token);
      setStep("biometric");
    } catch (err) {
      const apiErr = err as ApiError;
      if (apiErr.status === 401) {
        setError("Incorrect email or password.");
      } else {
        setError(apiErr.message ?? "Could not log in. Please try again.");
      }
    } finally {
      setBusy(false);
    }
  };

  const finishLogin = (sessionToken: string, account: Parameters<typeof setSession>[0]["account"]) => {
    setSession({
      sessionToken,
      account,
      demo: account?.status === "demo" || account?.mode === "demo",
    });
    navigate("/portal/emergency");
  };

  const handleAuthError = (err: unknown) => {
    const apiErr = err as ApiError;
    if (apiErr.status === 401) {
      setError("Login expired or biometric verification failed — start again.");
      setStep("password");
      setLoginToken(null);
    } else if (apiErr.error === "NO_CREDENTIAL") {
      setError(
        apiErr.message ??
          "No passkey is registered for this account. Sign up again on a device with biometrics.",
      );
    } else if (apiErr.status !== undefined) {
      setError(apiErr.message ?? "Could not complete login. Please try again.");
    } else {
      setError("Biometric verification was cancelled or failed.");
    }
  };

  const handleBiometric = async () => {
    if (!loginToken) return;
    setError(null);
    setBusy(true);
    try {
      const { sessionToken, account } = await complete2faWithPasskey(loginToken);
      finishLogin(sessionToken, account);
    } catch (err) {
      handleAuthError(err);
    } finally {
      setBusy(false);
    }
  };

  const simulateBiometric = async () => {
    if (!loginToken) return;
    setError(null);
    setBusy(true);
    try {
      const { sessionToken, account } = await complete2faDevSimulate(loginToken);
      finishLogin(sessionToken, account);
    } catch (err) {
      handleAuthError(err);
    } finally {
      setBusy(false);
    }
  };

  return (
    <PortalLayout>
      <div className="max-w-md mx-auto">
        <h1 className="text-3xl font-bold mb-2">Log in</h1>
        <p className="text-muted-foreground mb-6">
          Password, then a mandatory biometric second factor.
        </p>

        {justRegistered && (
          <div className="rounded-lg border border-emerald-500/40 bg-emerald-500/10 text-emerald-400 px-4 py-3 mb-4 text-sm">
            Account created. Log in to continue.
          </div>
        )}

        {step === "password" && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                Step 1 — Password
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handlePassword} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="password">Password</Label>
                  <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" />
                </div>
                {error && <p className="text-sm text-destructive">{error}</p>}
                <Button type="submit" className="w-full" disabled={busy}>
                  {busy ? "Checking…" : "Continue"}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {step === "biometric" && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Fingerprint className="h-5 w-5 text-primary" /> Step 2 — Biometric 2FA
              </CardTitle>
              <CardDescription>
                Required on every login.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {webauthnOk ? (
                <>
                  <p className="text-sm text-muted-foreground">
                    Use your device's fingerprint, face or PIN to confirm it's
                    you.
                  </p>
                  <Button onClick={handleBiometric} disabled={busy} className="w-full gap-2">
                    <Fingerprint className="h-4 w-4" />
                    {busy ? "Verifying…" : "Verify with biometrics"}
                  </Button>
                </>
              ) : (
                <div className="space-y-4">
                  <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 text-amber-300 px-4 py-3 text-sm flex items-start gap-2">
                    <ShieldAlert className="h-5 w-5 shrink-0" />
                    <span>
                      Biometric 2FA is required, but this environment does not
                      support a platform authenticator (WebAuthn). Please use a
                      supported device with a fingerprint / face sensor.
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Smartphone className="h-4 w-4" /> Open this portal on your
                    phone or a supported computer.
                  </div>
                  {import.meta.env.DEV && (
                    <Button variant="outline" onClick={simulateBiometric} disabled={busy} className="w-full">
                      Simulate biometric pass (dev only)
                    </Button>
                  )}
                </div>
              )}
              {error && <p className="text-sm text-destructive">{error}</p>}
              <Button variant="ghost" className="w-full" onClick={() => { setStep("password"); setLoginToken(null); }}>
                Back
              </Button>
            </CardContent>
          </Card>
        )}

        <p className="text-sm text-muted-foreground mt-6 text-center">
          No account?{" "}
          <Link href="/portal/signup" className="text-primary hover:underline">
            Sign up
          </Link>
        </p>
      </div>
    </PortalLayout>
  );
}
