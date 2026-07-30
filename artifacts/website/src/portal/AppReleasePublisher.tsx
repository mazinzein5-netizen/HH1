import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Smartphone, UploadCloud, CheckCircle2 } from "lucide-react";
import {
  getLatestAppRelease,
  publishAppRelease,
  type AppRelease,
  type ApiError,
} from "./lib/store";

/**
 * Founder-only publisher for a new Android build. Shows the currently live
 * release and a small form that PUTs /api/app/release. Server-side
 * validation (semver format, version-code regression, unreachable APK link)
 * is surfaced as-is so a bad EAS URL never goes live silently.
 */
export function AppReleasePublisher() {
  const [current, setCurrent] = useState<AppRelease | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [version, setVersion] = useState("");
  const [versionCode, setVersionCode] = useState("");
  const [apkUrl, setApkUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [published, setPublished] = useState<AppRelease | null>(null);

  useEffect(() => {
    getLatestAppRelease()
      .then((r) => {
        setCurrent(r);
        setLoadError(null);
      })
      .catch((err) =>
        setLoadError((err as ApiError).message ?? "Could not load the current release."),
      );
  }, []);

  const submit = async () => {
    setError(null);
    setPublished(null);
    const code = Number(versionCode.trim());
    if (!version.trim() || !versionCode.trim() || !apkUrl.trim()) {
      setError("Fill in the version, version code and APK link first.");
      return;
    }
    if (!Number.isInteger(code) || code <= 0) {
      setError("Version code must be a positive whole number (e.g. 3).");
      return;
    }
    setBusy(true);
    try {
      const next = await publishAppRelease({
        version: version.trim(),
        versionCode: code,
        apkUrl: apkUrl.trim(),
      });
      setCurrent(next);
      setPublished(next);
      setVersion("");
      setVersionCode("");
      setApkUrl("");
    } catch (err) {
      setError(
        (err as ApiError).message ?? "Could not publish the release. Please try again.",
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card className="mb-8 border-amber-500/30 bg-card/60 backdrop-blur">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Smartphone className="h-5 w-5 text-amber-400" /> Publish app version
        </CardTitle>
        <CardDescription>
          Point the website download button and the in-app update banner at a
          new EAS build. The link is checked before it goes live.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-xl border border-border bg-background/40 p-3.5 text-sm">
          {current ? (
            <>
              <div className="font-semibold">
                Live now: v{current.version}{" "}
                <span className="text-muted-foreground font-normal">
                  (version code {current.versionCode})
                </span>
              </div>
              <a
                href={current.apkUrl}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-primary underline underline-offset-2 break-all"
              >
                {current.apkUrl}
              </a>
            </>
          ) : (
            <p className="text-muted-foreground text-sm">
              {loadError ?? "Loading current release…"}
            </p>
          )}
        </div>

        <div className="grid sm:grid-cols-3 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="rel-version">New version</Label>
            <Input
              id="rel-version"
              placeholder="e.g. 1.0.2"
              value={version}
              onChange={(e) => setVersion(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="rel-code">Version code</Label>
            <Input
              id="rel-code"
              inputMode="numeric"
              placeholder={current ? `current is ${current.versionCode}` : "e.g. 3"}
              value={versionCode}
              onChange={(e) => setVersionCode(e.target.value)}
            />
          </div>
          <div className="space-y-1.5 sm:col-span-3">
            <Label htmlFor="rel-apk">APK link (expo.dev)</Label>
            <Input
              id="rel-apk"
              placeholder="https://expo.dev/artifacts/eas/….apk"
              value={apkUrl}
              onChange={(e) => setApkUrl(e.target.value)}
            />
          </div>
        </div>

        {error && (
          <div className="rounded-lg border border-destructive/50 bg-destructive/10 text-destructive px-3.5 py-2.5 text-sm">
            {error}
          </div>
        )}
        {published && (
          <div className="rounded-lg border border-emerald-500/40 bg-emerald-500/10 text-emerald-400 px-3.5 py-2.5 text-sm flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            v{published.version} is live — the download page and update banner
            now serve the new build.
          </div>
        )}

        <Button onClick={() => void submit()} disabled={busy} className="gap-1.5">
          <UploadCloud className="h-4 w-4" />
          {busy ? "Checking link & publishing…" : "Publish release"}
        </Button>
      </CardContent>
    </Card>
  );
}
