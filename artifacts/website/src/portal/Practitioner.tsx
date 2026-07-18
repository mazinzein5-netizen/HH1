import { useCallback, useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { PortalLayout, useProtected } from "./PortalLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { MembershipWorkspace } from "./MembershipWorkspace";
import {
  adminGetAccountStore,
  adminListAccounts,
  type AdminAccount,
  type AdminStoreView,
  createPracPatient,
  isSupportiveRole,
  listLiveMedShares,
  type LiveMedShare,
  listPracPatients,
  type ApiError,
  type PracPatientSummary,
} from "./lib/store";
import {
  Crown,
  FolderHeart,
  HeartHandshake,
  Pill,
  Plus,
  RadioTower,
  ShieldCheck,
  Stethoscope,
  UserPlus,
} from "lucide-react";

/** Human-readable freshness for a live snapshot, e.g. "2 min ago". */
function freshness(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  if (ms < 60_000) return "just now";
  const mins = Math.round(ms / 60_000);
  if (mins < 60) return `${mins} min ago`;
  const h = Math.floor(mins / 60);
  if (h < 24) return `${h} h ago`;
  return `${Math.floor(h / 24)} d ago`;
}

/**
 * GP & HIVE HUB — the doctors' portal (GPs, hospital doctors, clinic
 * specialists). Supportive-care professionals have their own portal at
 * /portal/supportive and are redirected there.
 */
export default function Practitioner() {
  const [, navigate] = useLocation();
  const { allowed, account } = useProtected();

  const [patients, setPatients] = useState<PracPatientSummary[] | null>(null);
  const [isMember, setIsMember] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Add patient form
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDob, setNewDob] = useState("");
  const [newCondition, setNewCondition] = useState("");
  const [busy, setBusy] = useState(false);

  const isPractitioner = !!account && account.accountType === "healthcare";
  const superuser = !!account?.superuser;
  // Unknown/legacy roles are treated as doctors (previous behaviour) so
  // existing accounts keep working; server-side gates remain authoritative.
  const doctor = isPractitioner && (superuser || !isSupportiveRole(account?.role));

  // Live medication shares (consent-based, live from patient devices)
  const [liveShares, setLiveShares] = useState<LiveMedShare[] | null>(null);
  const [liveSharesDemo, setLiveSharesDemo] = useState(false);
  const [liveSharesError, setLiveSharesError] = useState<string | null>(null);
  useEffect(() => {
    if (!allowed || !isPractitioner || !doctor) return;
    let cancelled = false;
    const loadShares = async () => {
      try {
        const r = await listLiveMedShares();
        if (cancelled) return;
        setLiveShares(r.shares);
        setLiveSharesDemo(!!r.demo);
        setLiveSharesError(null);
      } catch (err) {
        if (cancelled) return;
        setLiveShares([]);
        setLiveSharesError((err as ApiError).message ?? null);
      }
    };
    void loadShares();
    const iv = setInterval(loadShares, 60_000);
    return () => {
      cancelled = true;
      clearInterval(iv);
    };
  }, [allowed, isPractitioner, doctor]);

  const [adminAccounts, setAdminAccounts] = useState<AdminAccount[] | null>(null);
  const [adminOpenId, setAdminOpenId] = useState<string | null>(null);
  const [adminStore, setAdminStore] = useState<AdminStoreView | null>(null);
  const [adminStoreBusy, setAdminStoreBusy] = useState(false);
  useEffect(() => {
    if (!allowed || !superuser) return;
    adminListAccounts()
      .then((r) => setAdminAccounts(r.accounts))
      .catch(() => setAdminAccounts([]));
  }, [allowed, superuser]);

  const toggleAdminStore = async (id: string) => {
    if (adminOpenId === id) {
      setAdminOpenId(null);
      setAdminStore(null);
      return;
    }
    setAdminOpenId(id);
    setAdminStore(null);
    setAdminStoreBusy(true);
    try {
      setAdminStore(await adminGetAccountStore(id));
    } catch {
      setAdminStore(null);
    } finally {
      setAdminStoreBusy(false);
    }
  };

  const refreshPatients = useCallback(async () => {
    try {
      const p = await listPracPatients();
      setPatients(p.patients);
      setError(null);
    } catch (err) {
      setError((err as ApiError).message ?? "Could not load your patient files.");
    }
  }, []);

  useEffect(() => {
    if (allowed && doctor) void refreshPatients();
  }, [allowed, doctor, refreshPatients]);

  if (!allowed) {
    return (
      <PortalLayout>
        <div className="max-w-md mx-auto text-center py-16">
          <Stethoscope className="h-10 w-10 text-primary mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">GP &amp; HIVE HUB</h1>
          <p className="text-muted-foreground mb-6">
            Sign in with your doctor account to access patient files, HIVE
            booking and consultations.
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

  if (!doctor) {
    // Supportive-care professionals have their own dedicated portal.
    return (
      <PortalLayout>
        <div className="max-w-md mx-auto text-center py-16">
          <HeartHandshake className="h-10 w-10 text-primary mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">This is the doctors&apos; HUB</h1>
          <p className="text-muted-foreground mb-6">
            The GP &amp; HIVE HUB is reserved for doctor roles. As a{" "}
            {account?.role ?? "supportive-care professional"}, your workspace —
            emergency relay tools, HIVE booking and consultations — lives in the
            Supportive Care portal.
          </p>
          <Button onClick={() => navigate("/portal/supportive")} className="gap-1.5">
            <HeartHandshake className="h-4 w-4" /> Go to my Supportive Care portal
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
            <Stethoscope className="h-7 w-7 text-primary" /> GP &amp; HIVE HUB
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
          The doctors&apos; workspace: patient files, live medications, automated
          HIVE booking and consultations.
        </p>

        {error && (
          <div className="rounded-lg border border-destructive/50 bg-destructive/10 text-destructive px-4 py-3 mb-6 text-sm">
            {error}
          </div>
        )}

        {/* Founder superuser — read/test overview of every registered account */}
        {superuser && (
          <Card className="mb-8 border-amber-500/30 bg-card/60 backdrop-blur">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-amber-400" /> Founder overview
              </CardTitle>
              <CardDescription>
                Read-only view of every registered portal account. Accounts are held
                in server memory for the pilot, so this list resets on a server restart.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {adminAccounts === null ? (
                <p className="text-sm text-muted-foreground">Loading accounts…</p>
              ) : adminAccounts.length === 0 ? (
                <p className="text-sm text-muted-foreground">No registered accounts yet.</p>
              ) : (
                <div className="grid gap-2">
                  {adminAccounts.map((a) => (
                    <div key={a.id} className="rounded-xl border border-border bg-background/40 p-3.5">
                      <button
                        type="button"
                        onClick={() => void toggleAdminStore(a.id)}
                        className="w-full text-left flex flex-wrap items-center gap-x-4 gap-y-1"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="font-semibold text-sm flex items-center gap-2">
                            {a.fullName}
                            {a.superuser && (
                              <Badge className="bg-amber-500/15 text-amber-400 border border-amber-500/30 text-[10px]">FOUNDER</Badge>
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground mt-0.5">
                            {a.email} · {a.accountType === "healthcare" ? a.role ?? "Healthcare" : "Caretaker"} · {a.status}
                          </div>
                        </div>
                        <div className="text-xs text-muted-foreground text-right">
                          <div>{a.patients} patient file{a.patients === 1 ? "" : "s"}</div>
                          <div>{a.membershipActive ? "Member" : "Free hub"}{a.hasPasskey ? " · passkey" : ""}</div>
                        </div>
                      </button>
                      {adminOpenId === a.id && (
                        <div className="mt-3 border-t border-border pt-3 text-xs">
                          {adminStoreBusy ? (
                            <p className="text-muted-foreground">Loading account data…</p>
                          ) : !adminStore || !adminStore.store ? (
                            <p className="text-muted-foreground">No stored data for this account yet.</p>
                          ) : (
                            <div className="grid gap-2">
                              <div className="text-muted-foreground">
                                {adminStore.store.bookings.length} booking{adminStore.store.bookings.length === 1 ? "" : "s"} ·{" "}
                                {adminStore.store.membership.active ? "active membership" : "no membership"}
                              </div>
                              {adminStore.store.patients.length === 0 ? (
                                <p className="text-muted-foreground">No patient files.</p>
                              ) : (
                                adminStore.store.patients.map((p) => (
                                  <div key={p.id} className="rounded-lg border border-border/70 bg-background/60 p-2.5">
                                    <div className="font-medium text-foreground">
                                      {p.fullName}
                                      {p.demo ? " (demo)" : ""}
                                    </div>
                                    <div className="text-muted-foreground mt-0.5">
                                      {p.dob || "DOB —"} · MRN {p.mrn || "—"} · {p.condition || "No condition noted"}
                                    </div>
                                    <div className="text-muted-foreground mt-0.5">
                                      {p.notes.length} note{p.notes.length === 1 ? "" : "s"} · {p.prescriptions.length} prescription{p.prescriptions.length === 1 ? "" : "s"}
                                    </div>
                                  </div>
                                ))
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* My HIVE Patients — doctors only, part of the light hub */}
        <Card className="mb-8 border-primary/25 bg-card/60 backdrop-blur">
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FolderHeart className="h-5 w-5 text-primary" /> My HIVE Patients
              </CardTitle>
              <CardDescription>
                Patient files with history, questionnaires, prescriptions and notes.
                Demo records are clearly labelled.
              </CardDescription>
            </div>
            <Button size="sm" onClick={() => setShowAdd((v) => !v)} className="gap-1.5">
              <UserPlus className="h-4 w-4" /> Add patient
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {showAdd && (
              <div className="rounded-xl border border-border bg-background/40 p-4 grid sm:grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="p-name">Full name</Label>
                  <Input id="p-name" value={newName} onChange={(e) => setNewName(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="p-dob">Date of birth</Label>
                  <Input id="p-dob" type="date" value={newDob} onChange={(e) => setNewDob(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="p-cond">Condition</Label>
                  <Input id="p-cond" value={newCondition} onChange={(e) => setNewCondition(e.target.value)} />
                </div>
                <div className="sm:col-span-3">
                  <Button
                    size="sm"
                    onClick={async () => {
                      if (!newName.trim()) return;
                      setBusy(true);
                      try {
                        await createPracPatient({
                          fullName: newName.trim(),
                          dob: newDob.trim() || undefined,
                          condition: newCondition.trim() || undefined,
                        });
                        setNewName("");
                        setNewDob("");
                        setNewCondition("");
                        setShowAdd(false);
                        await refreshPatients();
                      } catch (err) {
                        setError((err as ApiError).message ?? "Could not add patient.");
                      } finally {
                        setBusy(false);
                      }
                    }}
                    disabled={busy || !newName.trim()}
                    className="gap-1.5"
                  >
                    <Plus className="h-4 w-4" /> {busy ? "Adding…" : "Create patient file"}
                  </Button>
                </div>
              </div>
            )}

            {patients === null ? (
              <p className="text-sm text-muted-foreground">Loading patients…</p>
            ) : patients.length === 0 ? (
              <p className="text-sm text-muted-foreground">No patients yet — add your first patient file.</p>
            ) : (
              <div className="grid gap-2.5">
                {patients.map((p) => (
                  <Link
                    key={p.id}
                    href={`/portal/practitioner/patients/${p.id}`}
                    className="rounded-xl border border-border bg-background/40 hover:border-primary/50 transition-colors p-4 flex flex-wrap items-center gap-x-4 gap-y-1"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold flex items-center gap-2">
                        {p.fullName}
                        {p.demo && (
                          <Badge className="bg-primary/15 text-primary border border-primary/30 text-[10px]">DEMO</Badge>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        {p.mrn} · DOB {p.dob} · {p.condition}
                      </div>
                    </div>
                    {p.lastQuestionnaire && (
                      <div className="text-xs text-right text-muted-foreground">
                        <div className="text-foreground font-medium">{p.lastQuestionnaire.name}</div>
                        {p.lastQuestionnaire.score} · {p.lastQuestionnaire.date}
                      </div>
                    )}
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Live medications — consent-based, live from patient devices */}
        <Card className="mb-8 border-primary/25 bg-card/60 backdrop-blur">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <RadioTower className="h-5 w-5 text-primary" /> Live medications from patient devices
            </CardTitle>
            <CardDescription>
              Patients who granted you live access to their medication list from HIVE COMPANION.
              Snapshots are encrypted, relayed in memory only, and disappear when the patient
              withdraws consent or it expires. Shares are patient-declared — always confirm the
              patient&apos;s identity with them before acting on a list.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {liveSharesDemo && (
              <div className="rounded-lg border border-primary/30 bg-primary/10 px-3 py-2 text-xs text-primary">
                Demo access — this is fictional demo data. Register and verify to receive real patient shares.
              </div>
            )}
            {liveSharesError && (
              <p className="text-sm text-muted-foreground">{liveSharesError}</p>
            )}
            {liveShares === null ? (
              <p className="text-sm text-muted-foreground">Checking for live shares…</p>
            ) : liveShares.length === 0 ? (
              !liveSharesError && (
                <p className="text-sm text-muted-foreground">
                  No patients are currently sharing their medications with you. Patients grant access
                  in HIVE COMPANION under Emergency &amp; sharing.
                </p>
              )
            ) : (
              <div className="grid gap-3">
                {liveShares.map((s) => (
                  <div key={s.grantId} className="rounded-xl border border-border bg-background/40 p-4">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <span className="font-semibold">{s.patientName}</span>
                      <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 text-[10px]">
                        LIVE FROM PATIENT DEVICE
                      </Badge>
                      <span className="text-xs text-muted-foreground ml-auto">
                        {s.updatedAt ? `Updated ${freshness(s.updatedAt)}` : "Waiting for first update from the device…"}
                      </span>
                    </div>
                    <div className="text-[11px] text-muted-foreground mb-2">
                      Consent given {new Date(s.grantedAt).toLocaleDateString("en-IE")} · expires{" "}
                      {new Date(s.expiresAt).toLocaleDateString("en-IE")} · revocable by the patient at any time
                    </div>
                    {s.payload && s.payload.medications.length > 0 ? (
                      <ul className="grid gap-1.5 text-sm">
                        {s.payload.medications.map((m, i) => (
                          <li key={i} className="rounded-lg border border-border bg-card/50 px-3 py-2 flex items-center gap-2">
                            <Pill className="h-3.5 w-3.5 text-primary shrink-0" />
                            <span className="font-medium">{m.medication}</span>
                            <span className="text-muted-foreground text-xs">
                              {m.dose} · {m.frequency} · {m.route}
                            </span>
                          </li>
                        ))}
                      </ul>
                    ) : s.payload ? (
                      <p className="text-sm text-muted-foreground">No active medications on the patient's device.</p>
                    ) : null}
                    {s.payload?.notes && (
                      <p className="text-[11px] text-muted-foreground mt-2">{s.payload.notes}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <MembershipWorkspace onMembershipChange={setIsMember} />
      </div>
    </PortalLayout>
  );
}
