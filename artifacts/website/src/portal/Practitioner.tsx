import { useCallback, useEffect, useState } from "react";
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
  createPracPatient,
  deletePracSlot,
  getPracSettings,
  isDoctorRole,
  listPracBookings,
  listPracPatients,
  updatePracSettings,
  type ApiError,
  type AvailabilitySlot,
  type PracBooking,
  type PracPatientSummary,
  type PracSettings,
} from "./lib/store";
import {
  CalendarClock,
  FolderHeart,
  Mic,
  Plus,
  Stethoscope,
  Trash2,
  UserPlus,
  Video,
} from "lucide-react";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export default function Practitioner() {
  const [, navigate] = useLocation();
  const { allowed, account } = useProtected();

  const [patients, setPatients] = useState<PracPatientSummary[] | null>(null);
  const [settings, setSettings] = useState<PracSettings | null>(null);
  const [bookings, setBookings] = useState<PracBooking[]>([]);
  const [error, setError] = useState<string | null>(null);

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
  const doctor = isPractitioner && isDoctorRole(account?.role);

  const refresh = useCallback(async () => {
    try {
      const [s, b] = await Promise.all([getPracSettings(), listPracBookings()]);
      setSettings(s.settings);
      setBookings(b.bookings);
      if (doctor) {
        const p = await listPracPatients();
        setPatients(p.patients);
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

  return (
    <PortalLayout>
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Stethoscope className="h-7 w-7 text-primary" /> Practitioner Portal
          </h1>
          {account?.role && (
            <Badge className="bg-primary/20 text-primary border border-primary/40">
              {account.role}
            </Badge>
          )}
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

        {/* My HIVE Patients — doctors only */}
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
                  {bookings.map((b) => (
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
                      <Button size="sm" variant="outline" disabled title="Joining opens at appointment time (pilot)">
                        Join
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </PortalLayout>
  );
}
