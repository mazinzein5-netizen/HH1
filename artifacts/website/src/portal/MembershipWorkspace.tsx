import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  addPracSlot,
  confirmMembership,
  confirmMembershipDevSimulate,
  deletePracSlot,
  getMembership,
  getPracSettings,
  listPracBookings,
  startConsultSession,
  startMembershipCheckout,
  updatePracSettings,
  type ApiError,
  type AvailabilitySlot,
  type ConsultSession,
  type MembershipBilling,
  type PracBooking,
  type PracSettings,
  type ProMembership,
} from "./lib/store";
import {
  CalendarClock,
  Camera,
  CameraOff,
  Crown,
  Mic,
  MicOff,
  PhoneOff,
  Plus,
  Trash2,
  Video,
} from "lucide-react";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

type CallState = "connecting" | "connected";

/**
 * HIVE HUB professional membership workspace — upsell, automated booking
 * settings and upcoming consultations. Shared between the doctors' HUB and
 * the Supportive Care portal (both role groups may hold a membership).
 */
export function MembershipWorkspace({
  onMembershipChange,
}: {
  /** Notifies the host page when the membership state loads/changes. */
  onMembershipChange?: (active: boolean) => void;
}) {
  const [membership, setMembership] = useState<ProMembership | null>(null);
  const [settings, setSettings] = useState<PracSettings | null>(null);
  const [bookings, setBookings] = useState<PracBooking[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [checkoutBusy, setCheckoutBusy] = useState<MembershipBilling | "confirm" | null>(null);

  // Live consultation session (simulated pilot provider — same seam as the app)
  const [session, setSession] = useState<ConsultSession | null>(null);
  const [callState, setCallState] = useState<CallState>("connecting");
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const connectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Add slot form
  const [slotDay, setSlotDay] = useState("Monday");
  const [slotStart, setSlotStart] = useState("09:00");
  const [slotEnd, setSlotEnd] = useState("12:00");
  const [slotKind, setSlotKind] = useState<AvailabilitySlot["kind"]>("video");

  const isMember = membership?.active === true;

  const applyMembership = useCallback(
    (m: ProMembership) => {
      setMembership(m);
      onMembershipChange?.(m.active);
    },
    [onMembershipChange],
  );

  const refresh = useCallback(async () => {
    try {
      const m = await getMembership();
      applyMembership(m.membership);
      if (m.membership.active) {
        const [s, b] = await Promise.all([getPracSettings(), listPracBookings()]);
        setSettings(s.settings);
        setBookings(b.bookings);
      }
      setError(null);
    } catch (err) {
      setError((err as ApiError).message ?? "Could not load your workspace.");
    }
  }, [applyMembership]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  // Confirm a membership payment when Stripe redirects back with a session id.
  useEffect(() => {
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
          applyMembership(m);
          setNotice("Welcome to HIVE HUB membership — your bookings workspace is now unlocked.");
          void refresh();
        })
        .catch((err) => {
          setError((err as ApiError).message ?? (err as ApiError).error ?? "Could not verify the payment.");
        })
        .finally(() => setCheckoutBusy(null));
    }
  }, [applyMembership, refresh]);

  useEffect(
    () => () => {
      if (connectTimer.current) clearTimeout(connectTimer.current);
    },
    [],
  );

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
      applyMembership(m);
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
    <>
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
                {checkoutBusy === "monthly" ? "Opening checkout…" : "€55 / month"}
              </Button>
              <Button
                variant="outline"
                disabled={checkoutBusy !== null}
                onClick={() => upgrade("yearly")}
              >
                {checkoutBusy === "yearly" ? "Opening checkout…" : "€495 / year — 25% off"}
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
    </>
  );
}
