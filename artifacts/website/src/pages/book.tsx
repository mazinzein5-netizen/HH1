import { useCallback, useEffect, useState } from "react";
import { Link } from "wouter";
import { PageHead } from "@/components/PageHead";
import {
  ArrowLeft,
  BadgeCheck,
  CalendarCheck,
  CalendarSearch,
  Loader2,
  Phone,
  RefreshCw,
  Stethoscope,
  Video,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const API_BASE = `${import.meta.env.BASE_URL}api`;

interface HivePractitioner {
  id: string;
  fullName: string;
  role: string;
  workplace: string;
  verified: boolean;
  videoConsultations: boolean;
  audioConsultations: boolean;
  openSlots: number;
}

interface HiveSlot {
  id: string;
  day: string;
  start: string;
  end: string;
  kind: "video" | "audio";
  taken: boolean;
}

interface BookingConfirmation {
  id: string;
  kind: "video" | "audio";
  when: string;
  practitioner: { fullName: string; role: string };
}

async function parseOrThrow<T>(res: Response): Promise<T> {
  const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  if (!res.ok) {
    const message =
      (typeof data.message === "string" && data.message) ||
      (typeof data.error === "string" && data.error) ||
      `Request failed (${res.status})`;
    throw new Error(message);
  }
  return data as T;
}

export default function BookPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [practitioners, setPractitioners] = useState<HivePractitioner[]>([]);
  const [selected, setSelected] = useState<HivePractitioner | null>(null);
  const [slots, setSlots] = useState<HiveSlot[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [slotId, setSlotId] = useState<string | null>(null);
  const [patientName, setPatientName] = useState("");
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);
  const [confirmation, setConfirmation] = useState<BookingConfirmation | null>(null);

  const loadPractitioners = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/hive/practitioners`);
      const data = await parseOrThrow<{ practitioners: HivePractitioner[] }>(res);
      setPractitioners(data.practitioners ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not reach the HIVE booking service.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPractitioners();
  }, [loadPractitioners]);

  const openPractitioner = async (p: HivePractitioner) => {
    setSelected(p);
    setSlotId(null);
    setSlots([]);
    setError(null);
    setSlotsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/hive/practitioners/${p.id}/slots`);
      const data = await parseOrThrow<{ slots: HiveSlot[] }>(res);
      setSlots(data.slots ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load availability.");
    } finally {
      setSlotsLoading(false);
    }
  };

  const confirm = async () => {
    if (!selected || !slotId || !patientName.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/hive/practitioners/${selected.id}/book`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slotId,
          patientName: patientName.trim(),
          ...(reason.trim() ? { reason: reason.trim() } : {}),
        }),
      });
      const data = await parseOrThrow<{ booking: BookingConfirmation }>(res);
      setConfirmation(data.booking);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Booking failed — please try again.");
      // Refresh slots in case the slot was just taken.
      try {
        const res = await fetch(`${API_BASE}/hive/practitioners/${selected.id}/slots`);
        const data = await parseOrThrow<{ slots: HiveSlot[] }>(res);
        setSlots(data.slots ?? []);
        setSlotId(null);
      } catch {
        /* keep original error */
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <PageHead
        title="Book a HIVE Consultation"
        description="Browse verified HIVE practitioners with open video and audio consultation slots. Book your connected health appointment online."
        path="/book"
        ogTitle="Book a HIVE Consultation"
        ogDescription="Browse verified HIVE practitioners with open video and audio slots and book your connected health appointment online."
      />
      <header className="border-b border-border">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link href="/" className="text-muted-foreground hover:text-primary transition-colors" aria-label="Back to home">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="font-semibold text-lg leading-tight">Book a HIVE Consultation</h1>
            <p className="text-xs text-muted-foreground">
              Browse practitioners with open video &amp; audio slots — pilot programme
            </p>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        {error && (
          <div className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm" role="alert">
            {error}
          </div>
        )}

        {confirmation ? (
          <div className="rounded-2xl border border-border bg-card p-8 text-center space-y-4">
            <CalendarCheck className="h-12 w-12 text-green-500 mx-auto" />
            <h2 className="text-xl font-semibold">Booking confirmed</h2>
            <p className="text-sm text-muted-foreground">
              Your {confirmation.kind} consultation with {confirmation.practitioner.fullName} (
              {confirmation.practitioner.role}) is booked for <strong>{confirmation.when}</strong>. The
              practitioner can now see your booking in their HIVE diary and will contact you if anything
              needs to change.
            </p>
            <div className="flex justify-center gap-3 pt-2">
              <Button
                variant="outline"
                onClick={() => {
                  setConfirmation(null);
                  setSelected(null);
                  setSlotId(null);
                  setReason("");
                  loadPractitioners();
                }}
              >
                Book another
              </Button>
              <Button asChild>
                <Link href="/">Back to home</Link>
              </Button>
            </div>
          </div>
        ) : !selected ? (
          <>
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold tracking-wide text-muted-foreground uppercase">
                Practitioners accepting HIVE bookings
              </h2>
              <Button variant="ghost" size="sm" onClick={loadPractitioners} className="gap-1.5">
                <RefreshCw className="h-3.5 w-3.5" /> Refresh
              </Button>
            </div>
            {loading ? (
              <div className="py-16 flex justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : practitioners.length === 0 ? (
              <div className="rounded-2xl border border-border bg-card p-10 text-center space-y-3">
                <CalendarSearch className="h-10 w-10 text-muted-foreground mx-auto" />
                <p className="text-sm text-muted-foreground max-w-md mx-auto">
                  No practitioners have published open slots right now. Practitioners enable automated HIVE
                  booking and publish availability from their practitioner portal — please check back soon.
                </p>
              </div>
            ) : (
              <ul className="space-y-3">
                {practitioners.map((p) => (
                  <li key={p.id}>
                    <button
                      onClick={() => openPractitioner(p)}
                      className="w-full text-left rounded-2xl border border-border bg-card p-5 hover:border-primary/60 transition-colors flex items-center gap-4"
                    >
                      <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                        <Stethoscope className="h-6 w-6 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold">{p.fullName}</span>
                          {p.verified && <BadgeCheck className="h-4 w-4 text-green-500" aria-label="Verified" />}
                        </div>
                        <div className="text-sm text-muted-foreground truncate">
                          {p.role}
                          {p.workplace ? ` · ${p.workplace}` : ""}
                        </div>
                        <div className="text-xs text-green-500 font-medium mt-1">
                          {p.openSlots} open slot{p.openSlots === 1 ? "" : "s"}
                          {p.videoConsultations && p.audioConsultations
                            ? " · video & audio"
                            : p.videoConsultations
                              ? " · video"
                              : " · audio"}
                        </div>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </>
        ) : (
          <>
            <button
              onClick={() => setSelected(null)}
              className="text-sm text-muted-foreground hover:text-primary transition-colors flex items-center gap-1.5"
            >
              <ArrowLeft className="h-4 w-4" /> All practitioners
            </button>

            <div className="rounded-2xl border border-border bg-card p-5 flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <Stethoscope className="h-6 w-6 text-primary" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-semibold">{selected.fullName}</span>
                  {selected.verified && <BadgeCheck className="h-4 w-4 text-green-500" />}
                </div>
                <div className="text-sm text-muted-foreground">
                  {selected.role}
                  {selected.workplace ? ` · ${selected.workplace}` : ""}
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold tracking-wide text-muted-foreground uppercase mb-3">
                1 · Pick an open slot
              </h3>
              {slotsLoading ? (
                <div className="py-8 flex justify-center">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : slots.length === 0 ? (
                <p className="text-sm text-muted-foreground">This practitioner has no published slots.</p>
              ) : (
                <div className="grid gap-2 sm:grid-cols-2">
                  {slots.map((s) => (
                    <button
                      key={s.id}
                      disabled={s.taken}
                      onClick={() => setSlotId(s.id)}
                      className={`rounded-xl border px-4 py-3 text-left flex items-center gap-3 transition-colors ${
                        s.taken
                          ? "opacity-40 cursor-not-allowed border-border bg-card"
                          : slotId === s.id
                            ? "border-primary bg-primary/10"
                            : "border-border bg-card hover:border-primary/60"
                      }`}
                    >
                      {s.kind === "audio" ? (
                        <Phone className="h-4 w-4 text-amber-500 shrink-0" />
                      ) : (
                        <Video className="h-4 w-4 text-green-500 shrink-0" />
                      )}
                      <span className="text-sm font-medium flex-1">
                        {s.day} · {s.start}–{s.end}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {s.taken ? "Booked" : s.kind === "audio" ? "Audio" : "Video"}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div>
              <h3 className="text-sm font-semibold tracking-wide text-muted-foreground uppercase mb-3">
                2 · Your name
              </h3>
              <Input
                value={patientName}
                onChange={(e) => setPatientName(e.target.value)}
                placeholder="Full name for the practitioner's diary"
                aria-label="Your full name"
              />
            </div>

            <div>
              <h3 className="text-sm font-semibold tracking-wide text-muted-foreground uppercase mb-3">
                3 · Reason (optional)
              </h3>
              <Input
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g. Knee pain follow-up…"
                aria-label="Reason for consultation"
              />
            </div>

            <Button
              className="w-full gap-2"
              size="lg"
              disabled={!slotId || !patientName.trim() || saving}
              onClick={confirm}
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CalendarCheck className="h-4 w-4" />}
              Confirm booking
            </Button>

            <p className="text-xs text-muted-foreground text-center leading-relaxed">
              Pilot programme: your name and reason are sent to this practitioner's HIVE diary so they can
              prepare for the consultation. For the full experience — reminders, handover packs and the
              virtual waiting room — use the HIVE Companion app.
            </p>
          </>
        )}
      </main>
    </div>
  );
}
