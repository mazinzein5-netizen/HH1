import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  addPracAttachment,
  deletePracAttachment,
  fetchPracAttachmentUrl,
  type ApiError,
  type PatientAttachment,
} from "./lib/store";
import {
  Camera,
  Eye,
  FileText,
  Image as ImageIcon,
  Loader2,
  Mic,
  Paperclip,
  Plus,
  Square,
  StickyNote,
  Trash2,
  Upload,
} from "lucide-react";

function fileToBase64(file: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.slice(result.indexOf(",") + 1));
    };
    reader.onerror = () => reject(new Error("Could not read the file."));
    reader.readAsDataURL(file);
  });
}

/** Downscale camera photos to keep uploads small (max edge 1600px, JPEG). */
async function compressImage(file: File): Promise<{ base64: string; mimeType: string }> {
  try {
    const bitmap = await createImageBitmap(file);
    const maxEdge = 1600;
    const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height));
    if (scale >= 1 && file.size < 1_500_000) {
      return { base64: await fileToBase64(file), mimeType: file.type || "image/jpeg" };
    }
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, "image/jpeg", 0.85));
    if (!blob) throw new Error("compress failed");
    return { base64: await fileToBase64(blob), mimeType: "image/jpeg" };
  } catch {
    return { base64: await fileToBase64(file), mimeType: file.type || "image/jpeg" };
  }
}

function kindIcon(kind: PatientAttachment["kind"]) {
  switch (kind) {
    case "photo":
      return <ImageIcon className="h-4 w-4 text-primary shrink-0" />;
    case "audio":
      return <Mic className="h-4 w-4 text-primary shrink-0" />;
    case "text":
      return <StickyNote className="h-4 w-4 text-primary shrink-0" />;
    default:
      return <FileText className="h-4 w-4 text-primary shrink-0" />;
  }
}

function prettySize(bytes: number): string {
  if (bytes <= 0) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function PatientAttachments({
  patientId,
  attachments,
  onChanged,
}: {
  patientId: string;
  attachments: PatientAttachment[];
  onChanged: () => Promise<void> | void;
}) {
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null); // label of in-flight action
  const [noteText, setNoteText] = useState("");
  const [showNote, setShowNote] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const cameraRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // Audio note recording
  const [recording, setRecording] = useState(false);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    return () => {
      recorderRef.current?.stream.getTracks().forEach((t) => t.stop());
    };
  }, []);

  const upload = async (
    label: string,
    input: Parameters<typeof addPracAttachment>[1],
  ) => {
    setBusy(label);
    setError(null);
    try {
      await addPracAttachment(patientId, input);
      await onChanged();
    } catch (err) {
      setError((err as ApiError).message ?? "Could not add the attachment.");
    } finally {
      setBusy(null);
    }
  };

  const handlePickedFile = async (file: File, fromCamera: boolean) => {
    if (file.size > 8 * 1024 * 1024 && !file.type.startsWith("image/")) {
      setError("Files up to 8 MB are supported.");
      return;
    }
    if (file.type.startsWith("image/")) {
      const { base64, mimeType } = await compressImage(file);
      await upload(fromCamera ? "camera" : "file", {
        kind: fromCamera ? "photo" : "document",
        name: file.name || (fromCamera ? `photo-${new Date().toISOString().slice(0, 10)}.jpg` : "image.jpg"),
        mimeType,
        dataBase64: base64,
      });
    } else {
      await upload("file", {
        kind: "document",
        name: file.name,
        mimeType: file.type || "application/octet-stream",
        dataBase64: await fileToBase64(file),
      });
    }
  };

  const startRecording = async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = MediaRecorder.isTypeSupported("audio/webm") ? "audio/webm" : "";
      const rec = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      chunksRef.current = [];
      rec.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      rec.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const type = rec.mimeType || "audio/webm";
        const blob = new Blob(chunksRef.current, { type });
        if (blob.size < 1000) {
          setError("The recording was too short — please try again.");
          return;
        }
        await upload("audio", {
          kind: "audio",
          name: `audio-note-${new Date().toISOString().slice(0, 16).replace("T", " ")}`,
          mimeType: type.split(";")[0],
          dataBase64: await fileToBase64(blob),
        });
      };
      recorderRef.current = rec;
      rec.start();
      setRecording(true);
    } catch {
      setError("Microphone access was blocked. Allow microphone access and try again.");
    }
  };

  const stopRecording = () => {
    setRecording(false);
    recorderRef.current?.stop();
  };

  const handleView = async (a: PatientAttachment) => {
    try {
      const url = await fetchPracAttachmentUrl(patientId, a.id);
      window.open(url, "_blank", "noopener");
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch (err) {
      setError((err as ApiError).message ?? "Could not open the attachment.");
    }
  };

  const handleDelete = async (a: PatientAttachment) => {
    setBusy(`del-${a.id}`);
    setError(null);
    try {
      await deletePracAttachment(patientId, a.id);
      await onChanged();
    } catch (err) {
      setError((err as ApiError).message ?? "Could not remove the attachment.");
    } finally {
      setBusy(null);
    }
  };

  return (
    <Card className="bg-card/60 backdrop-blur md:col-span-2">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Paperclip className="h-5 w-5 text-primary" /> Items &amp; documents
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-xs text-muted-foreground">
          Add photos from your camera, documents, typed notes or audio notes. Text is
          extracted from documents and audio notes are transcribed automatically so
          everything can be assimilated into the patient record.
        </p>

        {error && (
          <div className="rounded-lg border border-destructive/50 bg-destructive/10 text-destructive px-3 py-2 text-sm">
            {error}
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          <input
            ref={cameraRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              e.target.value = "";
              if (f) void handlePickedFile(f, true);
            }}
          />
          <input
            ref={fileRef}
            type="file"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              e.target.value = "";
              if (f) void handlePickedFile(f, false);
            }}
          />
          <Button size="sm" variant="outline" className="gap-1.5" disabled={!!busy} onClick={() => cameraRef.current?.click()}>
            {busy === "camera" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />} Camera
          </Button>
          <Button size="sm" variant="outline" className="gap-1.5" disabled={!!busy} onClick={() => fileRef.current?.click()}>
            {busy === "file" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />} Upload document
          </Button>
          {recording ? (
            <Button size="sm" variant="destructive" className="gap-1.5" onClick={stopRecording}>
              <Square className="h-4 w-4" /> Stop &amp; save audio note
            </Button>
          ) : (
            <Button size="sm" variant="outline" className="gap-1.5" disabled={!!busy} onClick={() => void startRecording()}>
              {busy === "audio" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mic className="h-4 w-4" />} Audio note
            </Button>
          )}
          <Button size="sm" variant="outline" className="gap-1.5" disabled={!!busy} onClick={() => setShowNote((v) => !v)}>
            <StickyNote className="h-4 w-4" /> Text note
          </Button>
        </div>

        {recording && (
          <p className="text-xs text-primary animate-pulse">Recording… speak your note, then press stop.</p>
        )}
        {busy === "audio" && (
          <p className="text-xs text-muted-foreground">Saving and transcribing the audio note…</p>
        )}

        {showNote && (
          <div className="space-y-2">
            <Textarea
              placeholder="Type a note to attach to this patient file…"
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              rows={3}
            />
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5"
              disabled={!!busy || !noteText.trim()}
              onClick={async () => {
                await upload("note", { kind: "text", name: "Typed note", text: noteText.trim() });
                setNoteText("");
                setShowNote(false);
              }}
            >
              <Plus className="h-4 w-4" /> Add note
            </Button>
          </div>
        )}

        {attachments.length === 0 ? (
          <p className="text-sm text-muted-foreground">No items or documents yet.</p>
        ) : (
          <ul className="space-y-2 text-sm">
            {attachments.map((a) => (
              <li key={a.id} className="rounded-lg border border-border bg-background/40 px-3 py-2">
                <div className="flex items-center gap-2">
                  {kindIcon(a.kind)}
                  <span className="font-medium truncate flex-1">{a.name}</span>
                  {a.textSource === "transcribed" && (
                    <Badge className="bg-primary/15 text-primary border border-primary/30 text-[10px]">TRANSCRIBED</Badge>
                  )}
                  {a.textSource === "extracted" && (
                    <Badge className="bg-primary/15 text-primary border border-primary/30 text-[10px]">TEXT EXTRACTED</Badge>
                  )}
                  {a.hasData && (
                    <Button size="sm" variant="ghost" className="h-7 px-2 gap-1" onClick={() => void handleView(a)}>
                      <Eye className="h-3.5 w-3.5" /> View
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 px-2 text-destructive hover:text-destructive"
                    disabled={busy === `del-${a.id}`}
                    onClick={() => void handleDelete(a)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  {new Date(a.ts).toLocaleString()}
                  {a.size > 0 ? ` · ${prettySize(a.size)}` : ""}
                </div>
                {a.text && (
                  <div className="mt-1.5">
                    <button
                      type="button"
                      className="text-xs text-primary hover:underline"
                      onClick={() => setExpandedId(expandedId === a.id ? null : a.id)}
                    >
                      {expandedId === a.id ? "Hide text" : "Show text"}
                    </button>
                    {expandedId === a.id ? (
                      <p className="mt-1 whitespace-pre-wrap text-xs text-foreground/90 border-l-2 border-primary/40 pl-2 max-h-60 overflow-y-auto">
                        {a.text}
                      </p>
                    ) : (
                      <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{a.text}</p>
                    )}
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
