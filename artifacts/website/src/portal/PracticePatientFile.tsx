import { useCallback, useEffect, useState } from "react";
import { Link, useLocation, useRoute } from "wouter";
import { PortalLayout, useProtected } from "./PortalLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  addPracNote,
  addPracPrescription,
  getPracPatient,
  type ApiError,
  type PracPatientFile,
} from "./lib/store";
import { ArrowLeft, ClipboardList, FileText, Pill, Plus, StickyNote } from "lucide-react";

export default function PracticePatientFile() {
  const [, params] = useRoute("/portal/practitioner/patients/:id");
  const [, navigate] = useLocation();
  const { allowed } = useProtected();
  const patientId = params?.id ?? "";

  const [patient, setPatient] = useState<PracPatientFile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [noteText, setNoteText] = useState("");
  const [rxName, setRxName] = useState("");
  const [rxDose, setRxDose] = useState("");
  const [rxFreq, setRxFreq] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    if (!patientId) return;
    try {
      const { patient: p } = await getPracPatient(patientId);
      setPatient(p);
      setError(null);
    } catch (err) {
      setError((err as ApiError).message ?? "Could not load this patient file.");
    }
  }, [patientId]);

  useEffect(() => {
    if (allowed) void load();
  }, [allowed, load]);

  if (!allowed) {
    return (
      <PortalLayout>
        <div className="max-w-md mx-auto text-center py-16">
          <h1 className="text-2xl font-bold mb-2">Sign in required</h1>
          <p className="text-muted-foreground mb-6">
            Sign in with your practitioner account to view patient files.
          </p>
          <Button onClick={() => navigate("/portal/login")}>Sign in</Button>
        </div>
      </PortalLayout>
    );
  }

  const handleAddNote = async () => {
    if (!noteText.trim()) return;
    setBusy(true);
    try {
      await addPracNote(patientId, noteText.trim());
      setNoteText("");
      await load();
    } catch (err) {
      setError((err as ApiError).message ?? "Could not add note.");
    } finally {
      setBusy(false);
    }
  };

  const handleAddRx = async () => {
    if (!rxName.trim()) return;
    setBusy(true);
    try {
      await addPracPrescription(patientId, {
        name: rxName.trim(),
        dose: rxDose.trim() || undefined,
        frequency: rxFreq.trim() || undefined,
      });
      setRxName("");
      setRxDose("");
      setRxFreq("");
      await load();
    } catch (err) {
      setError((err as ApiError).message ?? "Could not add prescription.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <PortalLayout>
      <div className="max-w-4xl mx-auto">
        <Link href="/portal/practitioner" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary mb-4">
          <ArrowLeft className="h-4 w-4" /> Back to My HIVE Patients
        </Link>

        {error && (
          <div className="rounded-lg border border-destructive/50 bg-destructive/10 text-destructive px-4 py-3 mb-6 text-sm">
            {error}
          </div>
        )}

        {!patient ? (
          !error && <p className="text-sm text-muted-foreground">Loading patient file…</p>
        ) : (
          <>
            <div className="mb-6">
              <h1 className="text-3xl font-bold flex items-center gap-3">
                {patient.fullName}
                {patient.demo && (
                  <Badge className="bg-primary/15 text-primary border border-primary/30">DEMO</Badge>
                )}
              </h1>
              <p className="text-muted-foreground mt-1">
                {patient.mrn} · DOB {patient.dob} · {patient.condition}
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <Card className="bg-card/60 backdrop-blur">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <FileText className="h-5 w-5 text-primary" /> History
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {patient.history.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No history recorded.</p>
                  ) : (
                    <ul className="space-y-2 text-sm">
                      {patient.history.map((h, i) => (
                        <li key={i} className="rounded-lg border border-border bg-background/40 px-3 py-2">
                          {h}
                        </li>
                      ))}
                    </ul>
                  )}
                </CardContent>
              </Card>

              <Card className="bg-card/60 backdrop-blur">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <ClipboardList className="h-5 w-5 text-primary" /> Questionnaires
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {patient.questionnaires.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No questionnaire results yet.</p>
                  ) : (
                    <ul className="space-y-2 text-sm">
                      {patient.questionnaires.map((q) => (
                        <li key={q.id} className="rounded-lg border border-border bg-background/40 px-3 py-2 flex items-center justify-between gap-2">
                          <span>{q.name}</span>
                          <span className="text-muted-foreground text-xs">
                            <span className="text-foreground font-medium">{q.score}</span> · {q.date}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </CardContent>
              </Card>

              <Card className="bg-card/60 backdrop-blur">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Pill className="h-5 w-5 text-primary" /> Prescriptions
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {patient.prescriptions.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No prescriptions recorded.</p>
                  ) : (
                    <ul className="space-y-2 text-sm">
                      {patient.prescriptions.map((rx) => (
                        <li key={rx.id} className="rounded-lg border border-border bg-background/40 px-3 py-2">
                          <span className="font-medium">{rx.name}</span>{" "}
                          <span className="text-muted-foreground text-xs">
                            {rx.dose} · {rx.frequency}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                  <div className="border-t border-border pt-3 grid grid-cols-3 gap-2">
                    <div className="space-y-1 col-span-3 sm:col-span-1">
                      <Label htmlFor="rx-name" className="text-xs">Medication</Label>
                      <Input id="rx-name" value={rxName} onChange={(e) => setRxName(e.target.value)} />
                    </div>
                    <div className="space-y-1 col-span-3 sm:col-span-1">
                      <Label htmlFor="rx-dose" className="text-xs">Dose</Label>
                      <Input id="rx-dose" value={rxDose} onChange={(e) => setRxDose(e.target.value)} />
                    </div>
                    <div className="space-y-1 col-span-3 sm:col-span-1">
                      <Label htmlFor="rx-freq" className="text-xs">Frequency</Label>
                      <Input id="rx-freq" value={rxFreq} onChange={(e) => setRxFreq(e.target.value)} />
                    </div>
                    <div className="col-span-3">
                      <Button size="sm" variant="outline" onClick={handleAddRx} disabled={busy || !rxName.trim()} className="gap-1.5">
                        <Plus className="h-4 w-4" /> Add prescription
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-card/60 backdrop-blur">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <StickyNote className="h-5 w-5 text-primary" /> Clinical notes
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {patient.notes.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No notes yet.</p>
                  ) : (
                    <ul className="space-y-2 text-sm">
                      {patient.notes.map((n) => (
                        <li key={n.id} className="rounded-lg border border-border bg-background/40 px-3 py-2">
                          <div className="text-xs text-muted-foreground mb-1">
                            {new Date(n.ts).toLocaleString()}
                          </div>
                          {n.text}
                        </li>
                      ))}
                    </ul>
                  )}
                  <div className="border-t border-border pt-3 space-y-2">
                    <Textarea
                      placeholder="Add a clinical note…"
                      value={noteText}
                      onChange={(e) => setNoteText(e.target.value)}
                      rows={3}
                    />
                    <Button size="sm" variant="outline" onClick={handleAddNote} disabled={busy || !noteText.trim()} className="gap-1.5">
                      <Plus className="h-4 w-4" /> Add note
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </div>
    </PortalLayout>
  );
}
