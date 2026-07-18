import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useLocation } from "wouter";
import { PortalLayout, useProtected } from "./PortalLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  addPracSlot,
  adminGetAccountStore,
  adminListAccounts,
  type AdminAccount,
  type AdminStoreView,
  confirmMembership,
  confirmMembershipDevSimulate,
  createPracPatient,
  deletePracSlot,
  getMembership,
  getPracSettings,
  isDoctorRole,
  listLiveMedShares,
  type LiveMedShare,
  listPracBookings,
  listPracPatients,
  startConsultSession,
  startMembershipCheckout,
  updatePracSettings,
  type ApiError,
  type AvailabilitySlot,
  type ConsultSession,
  type MembershipBilling,
  type PracBooking,
  type PracPatientSummary,
  type PracSettings,
  type ProMembership,
} from "./lib/store";
import {
  CalendarClock,
  Camera,
  CameraOff,
  Crown,
  FolderHeart,
  Mic,
  Pill,
  RadioTower,
  MicOff,
  PhoneOff,
  Plus,
  ShieldCheck,
  Stethoscope,
  Trash2,
  UserPlus,
  Video,
} from "lucide-react";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

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

type CallState = "connecting" | "connected";

export default function Practitioner() {
  const [, navigate] = useLocation();
  const { allowed, account } = useProtected();

  const [patients, setPatients] = useState<PracPatientSummary[] | null>(null);
  const [membership, setMembership] = useState<ProMembership | null>(null);
  const [settings, setSettings] = useState<PracSettings | null>(null);
  const [bookings, setBookings] = useState<PracBooking[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  // Membership checkout
  const [checkoutBusy, setCheckoutBusy] = useState<MembershipBilling | "confirm" | null>(null);

  // Live consultation session (simulated pilot provider — same seam as the app)
  const [session, setSession] = useState<ConsultSession | null>(null);
  const [callState, setCallState] = useState<CallState>("connecting");
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const connectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Add patient form
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDob, setNewDob] = useState("");
  const [newCondition, setNewCondition] = useState("");
  const [busy, setBusy] = useState(false);

  // Add slot form
  const [slotDay, setSlotDay] = useState("Monday");
  const [slotStart, setSlotStart] = useState("09:00");
  const [slotEnd, setSlotEnd] = useState("12:00");
  const [slotKind, setSlotKind] = useState<AvailabilitySlot["kind"]>("video");

  const isPractitioner = !!account && account.accountType === "healthcare";
  const superuser = !!account?.superuser;
  const doctor = isPractitioner && (isDoctorRole(account?.role) || superuser);
  const isMember = membership?.active === true;

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

  const refresh = useCallback(async () => {
    try {
      const m = await getMembership();
      setMembership(m.membership);
      if (doctor) {
        const p = await listPracPatients();
        setPatients(p.patients);
      }
      if (m.membership.active) {
        const [s, b] = await Promise.all([getPracSettings(), listPracBookings()]);
        setSettings(s.settings);
        setBookings(b.bookings);
      }
      setError(null);
    } catch (err) {
      const apiErr = err as ApiError;
      setError(apiErr.message ?? "Could not load your practitioner workspace.");
    }
  }, [doctor]);

  useEffect(() => {
    if (allowed && isPractitioner) void refresh();
  }, [allowed, isPractitioner, refresh]);

  // Confirm a membership payment when Stripe redirects back with a session id.
  useEffect(() => {
    if (!allowed || !isPractitioner) return;
    const params = new URLSearchParams(window.location.search);
    const sessionId = params.get("membership_session");
    const cancelled = params.get("membership_cancelled");
    if (!sessionId && !cancelled) return;
    // Clean the URL so refreshes don't re-run confirmation.
    window.history.replaceState(null, "", window.location.pathname + window.location.hash);
    if (cancelled) {
      setNotice("No charge was made — you can upgrade whenever you're ready.");
      return;
    }
    if (sessionId) {
      setCheckoutBusy("confirm");
      confirmMembership(sessionId)
        .then(({ membership: m }) => {
          setMembership(m);
          setNotice("Welcome to HIVE HUB membership — your bookings workspace is now unlocked.");
          void refresh();
        })
        .catch((err) => {
          setError((err as ApiError).message ?? (err as ApiError).error ?? "Could not verify the payment.");
        })
        .finally(() => setCheckoutBusy(null));
    }
  }, [allowed, isPractitioner, refresh]);

  useEffect(
    () => () => {
      if (connectTimer.current) clearTimeout(connectTimer.current);
    },
    [],
  );

  if (!allowed) {
    return (
      <PortalLayout>
        <div className="max-w-md mx-auto text-center py-16">
          <Stethoscope className="h-10 w-10 text-primary mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Practitioner Portal</h1>
          <p className="text-muted-foreground mb-6">
            Sign in with your practitioner account to access patient files,
            HIVE booking and consultations.
          </p>
          <div className="flex justify-center gap-3">
            <Button onClick={() => navigate("/portal/login")}>Sign in</Button>
            <Button variant="outline" onClick={() => navigate("/portal/signup")}>
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

  const upgrade = async (billing: MembershipBilling) => {
    setCheckoutBusy(billing);
    setError(null);
    try {
      const { url } = await startMembershipCheckout(billing);
      window.location.href = url;
    } catch (err) {
      setError((err as ApiError).message ?? (err as ApiError).error ?? "Could not start the membership payment.");
      setCheckoutBusy(null);
    }
  };

  const devActivate = async () => {
    setCheckoutBusy("confirm");
    try {
      const { membership: m } = await confirmMembershipDevSimulate();
      setMembership(m);
      setNotice("Membership activated (development simulation).");
      void refresh();
    } catch (err) {
      setError((err as ApiError).message ?? "Could not activate the membership.");
    } finally {
      setCheckoutBusy(null);
    }
  };

  const toggle = async (
    key: "bookingEnabled" | "videoConsultations" | "audioConsultations",
    value: boolean,
  ) => {
    try {
      const { settings: next } = await updatePracSettings({ [key]: value });
      setSettings(next);
      if (key === "bookingEnabled") {
        const b = await listPracBookings();
        setBookings(b.bookings);
      }
    } catch (err) {
      setError((err as ApiError).message ?? "Could not update settings.");
    }
  };

  const handleAddPatient = async () => {
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
      const p = await listPracPatients();
      setPatients(p.patients);
    } catch (err) {
      setError((err as ApiError).message ?? "Could not add patient.");
    } finally {
      setBusy(false);
    }
  };

  const handleAddSlot = async () => {
    try {
      await addPracSlot({ day: slotDay, start: slotStart, end: slotEnd, kind: slotKind });
      const s = await getPracSettings();
      setSettings(s.settings);
    } catch (err) {
      setError((err as ApiError).message ?? "Could not add slot.");
    }
  };

  const handleDeleteSlot = async (slotId: string) => {
    try {
      await deletePracSlot(slotId);
      const s = await getPracSettings();
      setSettings(s.settings);
    } catch (err) {
      setError((err as ApiError).message ?? "Could not remove slot.");
    }
  };

  const joinConsultation = async (booking: PracBooking) => {
    setError(null);
    try {
      const { session: s } = await startConsultSession(booking.id);
      setSession(s);
      setCallState("connecting");
      setMicOn(true);
      setCamOn(true);
      if (connectTimer.current) clearTimeout(connectTimer.current);
      connectTimer.current = setTimeout(() => setCallState("connected"), 3000);
    } catch (err) {
      setError((err as ApiError).message ?? "Could not start the appointment session.");
    }
  };

  const endConsultation = () => {
    if (connectTimer.current) clearTimeout(connectTimer.current);
    setSession(null);
  };

  return (
    <PortalLayout>
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Stethoscope className="h-7 w-7 text-primary" /> Practitioner Portal
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
          {doctor
            ? "Your workspace adapts to your role: patient files, automated HIVE booking and consultations."
            : "Your workspace adapts to your role: automated HIVE booking and consultations."}
        </p>

        {error && (
          <div className="rounded-lg border border-destructive/50 bg-destructive/10 text-destructive px-4 py-3 mb-6 text-sm">
            {error}
          </div>
        )}
        {notice && (
          <div className="rounded-lg border border-primary/40 bg-primary/10 text-primary px-4 py-3 mb-6 text-sm">
            {notice}
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
        {doctor && (
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
                    <Button size="sm" onClick={handleAddPatient} disabled={busy || !newName.trim()} className="gap-1.5">
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
        )}

        {/* Live medications — consent-based, live from patient devices */}
        {doctor && (
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
        )}

        {membership === null ? (
          <p className="text-sm text-muted-foreground">Loading your workspace…</p>
        ) : !isMember ? (
          /* ── Membership upsell (tasteful — the free hub stays fully usable) ── */
          <Card className="border-primary/40 bg-gradient-to-br from-primary/10 via-card/60 to-card/60 backdrop-blur">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Crown className="h-5 w-5 text-primary" /> HIVE HUB Membership
              </CardTitle>
              <CardDescription>
                Your hub stays free for sign-in and essential tools. Membership adds a
                comprehensive practice workspace on top.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid sm:grid-cols-3 gap-3">
                {[
                  {
                    icon: <CalendarClock className="h-5 w-5 text-primary" />,
                    title: "Automated HIVE booking",
                    desc: "Publish availability and let patients book your open slots automatically.",
                  },
                  {
                    icon: <Video className="h-5 w-5 text-primary" />,
                    title: "Video appointments",
                    desc: "Run video and audio consultations directly from your bookings list.",
                  },
                  {
                    icon: <Mic className="h-5 w-5 text-primary" />,
                    title: "Consultation controls",
                    desc: "Manage slots, consultation types and upcoming appointments in one place.",
                  },
                ].map((f) => (
                  <div key={f.title} className="rounded-xl border border-border bg-background/40 p-4">
                    <div className="mb-2">{f.icon}</div>
                    <div className="font-semibold text-sm">{f.title}</div>
                    <p className="text-xs text-muted-foreground mt-1">{f.desc}</p>
                  </div>
                ))}
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <Button
                  className="gap-1.5"
                  disabled={checkoutBusy !== null}
                  onClick={() => upgrade("monthly")}
                >
                  <Crown className="h-4 w-4" />
                  {checkoutBusy === "monthly" ? "Opening checkout…" : "€49 / month"}
                </Button>
                <Button
                  variant="outline"
                  disabled={checkoutBusy !== null}
                  onClick={() => upgrade("yearly")}
                >
                  {checkoutBusy === "yearly" ? "Opening checkout…" : "€490 / year — 2 months free"}
                </Button>
                {checkoutBusy === "confirm" && (
                  <span className="text-sm text-muted-foreground">Verifying your payment…</span>
                )}
                {!import.meta.env.PROD && (
                  <Button variant="ghost" size="sm" disabled={checkoutBusy !== null} onClick={devActivate}>
                    Dev: simulate activation
                  </Button>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                Payment is processed securely by Stripe and your membership is verified
                server-side before any features unlock. Cancel any time.
              </p>
            </CardContent>
          </Card>
        ) : (
          /* ── Membership workspace: bookings + video appointments ── */
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Booking & consultations */}
            <Card className="bg-card/60 backdrop-blur">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CalendarClock className="h-5 w-5 text-primary" /> Automated HIVE Booking
                </CardTitle>
                <CardDescription>
                  Let HIVE offer your availability to patients automatically.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-sm">Enable automated booking</div>
                    <div className="text-xs text-muted-foreground">Patients can book your open slots.</div>
                  </div>
                  <Switch
                    checked={settings?.bookingEnabled ?? false}
                    onCheckedChange={(v) => toggle("bookingEnabled", v)}
                    aria-label="Enable automated booking"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-sm flex items-center gap-1.5">
                      <Video className="h-4 w-4 text-primary" /> Video consultations
                    </div>
                    <div className="text-xs text-muted-foreground">Offer HIVE video appointments.</div>
                  </div>
                  <Switch
                    checked={settings?.videoConsultations ?? false}
                    onCheckedChange={(v) => toggle("videoConsultations", v)}
                    aria-label="Offer video consultations"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-sm flex items-center gap-1.5">
                      <Mic className="h-4 w-4 text-primary" /> Audio consultations
                    </div>
                    <div className="text-xs text-muted-foreground">Offer HIVE audio-only appointments.</div>
                  </div>
                  <Switch
                    checked={settings?.audioConsultations ?? false}
                    onCheckedChange={(v) => toggle("audioConsultations", v)}
                    aria-label="Offer audio consultations"
                  />
                </div>

                <div className="border-t border-border pt-4">
                  <div className="font-medium text-sm mb-2">Availability slots</div>
                  {settings && settings.slots.length > 0 && (
                    <ul className="space-y-1.5 mb-3">
                      {settings.slots.map((s) => (
                        <li key={s.id} className="flex items-center justify-between rounded-lg border border-border bg-background/40 px-3 py-2 text-sm">
                          <span>
                            {s.day} {s.start}–{s.end}{" "}
                            <span className="text-xs text-muted-foreground uppercase">({s.kind})</span>
                          </span>
                          <Button variant="ghost" size="icon" aria-label="Remove slot" onClick={() => handleDeleteSlot(s.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </li>
                      ))}
                    </ul>
                  )}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <select
                      value={slotDay}
                      onChange={(e) => setSlotDay(e.target.value)}
                      aria-label="Day"
                      className="h-9 rounded-md border border-input bg-background px-2 text-sm"
                    >
                      {DAYS.map((d) => (
                        <option key={d}>{d}</option>
                      ))}
                    </select>
                    <Input type="time" value={slotStart} onChange={(e) => setSlotStart(e.target.value)} aria-label="Start time" />
                    <Input type="time" value={slotEnd} onChange={(e) => setSlotEnd(e.target.value)} aria-label="End time" />
                    <select
                      value={slotKind}
                      onChange={(e) => setSlotKind(e.target.value as AvailabilitySlot["kind"])}
                      aria-label="Slot type"
                      className="h-9 rounded-md border border-input bg-background px-2 text-sm"
                    >
                      <option value="video">Video</option>
                      <option value="audio">Audio</option>
                      <option value="clinic">In clinic</option>
                    </select>
                  </div>
                  <Button size="sm" variant="outline" className="mt-2 gap-1.5" onClick={handleAddSlot}>
                    <Plus className="h-4 w-4" /> Add slot
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Upcoming consultations */}
            <Card className="bg-card/60 backdrop-blur">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Video className="h-5 w-5 text-primary" /> Upcoming consultations
                </CardTitle>
                <CardDescription>
                  Video and audio appointments booked through HIVE.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {!settings?.bookingEnabled ? (
                  <p className="text-sm text-muted-foreground">
                    Enable automated booking to receive HIVE consultations.
                  </p>
                ) : bookings.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No upcoming consultations.</p>
                ) : (
                  <ul className="space-y-2.5">
                    {bookings.map((b) => {
                      const kindEnabled =
                        b.kind === "video"
                          ? settings?.videoConsultations ?? false
                          : settings?.audioConsultations ?? false;
                      return (
                        <li key={b.id} className="rounded-xl border border-border bg-background/40 p-4 flex flex-wrap items-center gap-3">
                          <div className="min-w-0 flex-1">
                            <div className="font-semibold text-sm flex items-center gap-2">
                              {b.patientName}
                              {b.demo ? (
                                <Badge className="bg-primary/15 text-primary border border-primary/30 text-[10px]">DEMO</Badge>
                              ) : b.slotId ? (
                                <Badge className="bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-[10px]">PATIENT</Badge>
                              ) : null}
                            </div>
                            <div className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1.5">
                              {b.kind === "video" ? <Video className="h-3.5 w-3.5" /> : <Mic className="h-3.5 w-3.5" />}
                              {b.kind === "video" ? "Video" : "Audio"} · {b.when} ·{" "}
                              <span className={b.status === "confirmed" ? "text-emerald-400" : "text-amber-400"}>
                                {b.status}
                              </span>
                            </div>
                            {b.reason && (
                              <p className="text-xs text-foreground/80 mt-1.5 rounded-md bg-muted/40 border border-border/60 px-2 py-1.5">
                                <span className="text-muted-foreground">Reason: </span>
                                {b.reason}
                              </p>
                            )}
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={!kindEnabled}
                            title={
                              kindEnabled
                                ? "Join this appointment"
                                : `Enable ${b.kind} consultations to join`
                            }
                            onClick={() => joinConsultation(b)}
                          >
                            Join
                          </Button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Consultation session overlay (pilot: simulated media transport) */}
      {session && (
        <div className="fixed inset-0 z-50 bg-background/90 backdrop-blur flex items-center justify-center p-4">
          <div className="w-full max-w-2xl rounded-2xl border border-primary/30 bg-card shadow-2xl overflow-hidden">
            <div className="px-5 py-3 border-b border-border flex items-center justify-between">
              <div className="font-semibold text-sm flex items-center gap-2">
                {session.kind === "video" ? (
                  <Video className="h-4 w-4 text-primary" />
                ) : (
                  <Mic className="h-4 w-4 text-primary" />
                )}
                {session.kind === "video" ? "Video appointment" : "Audio appointment"} · {session.patientName}
              </div>
              <Badge
                className={
                  callState === "connected"
                    ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                    : "bg-amber-500/15 text-amber-400 border border-amber-500/30"
                }
              >
                {callState === "connected" ? "CONNECTED" : "CONNECTING…"}
              </Badge>
            </div>

            <div className="aspect-video bg-gradient-to-br from-[#0B1220] to-[#111827] flex flex-col items-center justify-center gap-3">
              <div className="h-20 w-20 rounded-full bg-primary/15 border border-primary/40 flex items-center justify-center">
                {session.kind === "video" ? (
                  camOn ? (
                    <Camera className="h-9 w-9 text-primary" />
                  ) : (
                    <CameraOff className="h-9 w-9 text-muted-foreground" />
                  )
                ) : (
                  <Mic className="h-9 w-9 text-primary" />
                )}
              </div>
              <p className="text-sm text-muted-foreground px-6 text-center">
                {callState === "connecting"
                  ? "Setting up a secure session…"
                  : "Pilot session — the media transport is simulated. A certified video provider plugs into this same session without workflow changes."}
              </p>
            </div>

            <div className="px-5 py-4 flex items-center justify-center gap-3">
              <Button
                variant={micOn ? "outline" : "secondary"}
                size="icon"
                aria-label={micOn ? "Mute microphone" : "Unmute microphone"}
                onClick={() => setMicOn((v) => !v)}
              >
                {micOn ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
              </Button>
              {session.kind === "video" && (
                <Button
                  variant={camOn ? "outline" : "secondary"}
                  size="icon"
                  aria-label={camOn ? "Turn camera off" : "Turn camera on"}
                  onClick={() => setCamOn((v) => !v)}
                >
                  {camOn ? <Camera className="h-4 w-4" /> : <CameraOff className="h-4 w-4" />}
                </Button>
              )}
              <Button variant="destructive" className="gap-1.5" onClick={endConsultation}>
                <PhoneOff className="h-4 w-4" /> End appointment
              </Button>
            </div>
          </div>
        </div>
      )}
    </PortalLayout>
  );
}
