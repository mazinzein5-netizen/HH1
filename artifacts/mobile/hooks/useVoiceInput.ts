/**
 * useVoiceInput — cross-platform voice input for Sarah.
 *
 * Web:    browser SpeechRecognition (live interim transcripts, no audio upload).
 * Native: expo-audio microphone recording → api-server /ai/transcribe
 *         (audio is sent transiently for transcription only — never stored).
 *
 * Native recordings auto-stop after a stretch of silence once speech has been
 * heard (elderly-friendly: no second tap needed), with a hard cap as backup.
 */
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  AudioModule,
  RecordingPresets,
  setAudioModeAsync,
  useAudioRecorder,
} from "expo-audio";
import * as FileSystem from "expo-file-system/legacy";
import { useCallback, useEffect, useRef, useState } from "react";
import { Alert, Platform } from "react-native";

const DISCLOSURE_KEY = "@hive_voice_disclosure_v1";

/**
 * One-time voice setup, called from the consent screen at first launch:
 * requests the native microphone permission and marks the voice disclosure
 * as shown (the disclosure text is part of the consent screen itself).
 * Safe to call multiple times — the OS only ever prompts once.
 */
export async function ensureVoiceSetup(): Promise<void> {
  try {
    await AsyncStorage.setItem(DISCLOSURE_KEY, "true");
  } catch {}
  if (Platform.OS === "web") return;
  try {
    await AudioModule.requestRecordingPermissionsAsync();
  } catch {}
}

// Silence auto-stop tuning (native only)
const METER_POLL_MS = 350;
const SPEECH_THRESHOLD_DB = -35; // louder than this counts as speech
const SILENCE_THRESHOLD_DB = -45; // quieter than this counts as silence
const SILENCE_STOP_MS = 2800; // stop after this much silence once speech heard
const MAX_RECORDING_MS = 60_000; // hard cap

export interface UseVoiceInputOptions {
  /** Live partial transcript (web only — native transcribes after stop). */
  onInterim?: (text: string) => void;
  /** Final transcript. Empty string means nothing was heard. */
  onFinal: (text: string) => void;
  onError?: (message: string) => void;
  lang?: string;
}

export interface VoiceInput {
  /** Whether any voice input path is available on this platform/browser. */
  supported: boolean;
  /** Microphone is actively capturing. */
  listening: boolean;
  /** Native only: audio is being turned into text after stop. */
  transcribing: boolean;
  start: () => Promise<void>;
  /** Stop capturing; the final transcript is delivered via onFinal. */
  stop: () => Promise<void>;
  /** Stop capturing and discard everything (no onFinal call). */
  cancel: () => void;
}

function getWebRecognitionCtor(): any | null {
  if (Platform.OS !== "web" || typeof window === "undefined") return null;
  const Win = window as any;
  return Win.SpeechRecognition ?? Win.webkitSpeechRecognition ?? null;
}

export function useVoiceInput(options: UseVoiceInputOptions): VoiceInput {
  const [listening, setListening] = useState(false);
  const [transcribing, setTranscribing] = useState(false);

  const optionsRef = useRef(options);
  optionsRef.current = options;

  const recognitionRef = useRef<any>(null);
  const cancelledRef = useRef(false);
  const mountedRef = useRef(true);
  const meterTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const recordingActiveRef = useRef(false);
  const startingRef = useRef(false);

  // isMeteringEnabled is required for the silence auto-stop — the preset
  // alone leaves metering off and getStatus().metering stays undefined.
  const recorder = useAudioRecorder({
    ...RecordingPresets.HIGH_QUALITY,
    isMeteringEnabled: true,
  });
  const recorderRef = useRef(recorder);
  recorderRef.current = recorder;

  const supported = Platform.OS !== "web" || getWebRecognitionCtor() !== null;

  const clearMeterTimer = useCallback(() => {
    if (meterTimerRef.current) {
      clearInterval(meterTimerRef.current);
      meterTimerRef.current = null;
    }
  }, []);

  // ── Native: finish recording and transcribe ─────────────────────────────
  const finishNativeRecording = useCallback(async (discard: boolean) => {
    if (!recordingActiveRef.current) return;
    recordingActiveRef.current = false;
    clearMeterTimer();
    if (mountedRef.current) setListening(false);

    let uri: string | null = null;
    try {
      await recorderRef.current.stop();
      uri = recorderRef.current.uri;
    } catch {}
    try {
      await setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true });
    } catch {}

    if (discard || cancelledRef.current) {
      if (uri) FileSystem.deleteAsync(uri, { idempotent: true }).catch(() => {});
      return;
    }

    if (!uri) {
      optionsRef.current.onError?.("I couldn't record that — please try again.");
      return;
    }

    if (mountedRef.current) setTranscribing(true);
    try {
      const base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      const domain = process.env.EXPO_PUBLIC_DOMAIN;
      const res = await fetch(`https://${domain}/api/ai/transcribe`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ audio: base64, mimeType: "audio/m4a" }),
      });
      if (!res.ok) throw new Error(`transcribe failed: ${res.status}`);
      const data = (await res.json()) as { text?: string };
      if (!cancelledRef.current) {
        optionsRef.current.onFinal((data.text ?? "").trim());
      }
    } catch {
      if (!cancelledRef.current) {
        optionsRef.current.onError?.(
          "I couldn't quite catch that — please check your internet and try again, or use the keyboard."
        );
      }
    } finally {
      if (mountedRef.current) setTranscribing(false);
      FileSystem.deleteAsync(uri, { idempotent: true }).catch(() => {});
    }
  }, [clearMeterTimer]);

  // ── Native: start recording with silence auto-stop ──────────────────────
  const startNative = useCallback(async () => {
    // startingRef closes the double-start window while the permission and
    // disclosure prompts (both async) are open.
    if (recordingActiveRef.current || startingRef.current) return;
    startingRef.current = true;
    try {
      await startNativeInner();
    } finally {
      startingRef.current = false;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startNativeInner = useCallback(async () => {
    const perm = await AudioModule.requestRecordingPermissionsAsync();
    if (!perm.granted) {
      optionsRef.current.onError?.(
        "Microphone access is needed for voice input. You can allow it in your phone's Settings, or use the keyboard instead."
      );
      return;
    }

    // One-time plain-language disclosure fallback (Zero-Server rule: be
    // explicit whenever anything leaves the device). Normally already shown
    // and accepted on the consent screen at first launch (ensureVoiceSetup),
    // so this only appears for users who consented before that existed.
    try {
      const seen = await AsyncStorage.getItem(DISCLOSURE_KEY);
      if (!seen) {
        const proceed = await new Promise<boolean>((resolve) => {
          Alert.alert(
            "Talking to Sarah",
            "When you use your voice, the short recording is sent to a secure transcription service to turn it into text, then discarded straight away. Nothing is stored.",
            [
              { text: "Not now", style: "cancel", onPress: () => resolve(false) },
              { text: "That's fine", onPress: () => resolve(true) },
            ]
          );
        });
        if (!proceed) return;
        await AsyncStorage.setItem(DISCLOSURE_KEY, "true");
      }
    } catch {}

    try {
      cancelledRef.current = false;
      await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
      await recorderRef.current.prepareToRecordAsync();
      recorderRef.current.record();
      recordingActiveRef.current = true;
      if (mountedRef.current) setListening(true);
    } catch {
      recordingActiveRef.current = false;
      optionsRef.current.onError?.("I couldn't start the microphone — please try again.");
      return;
    }

    // Silence auto-stop + hard cap
    const startedAt = Date.now();
    let heardSpeech = false;
    let silenceSince: number | null = null;
    clearMeterTimer();
    meterTimerRef.current = setInterval(() => {
      if (!recordingActiveRef.current) {
        clearMeterTimer();
        return;
      }
      const elapsed = Date.now() - startedAt;
      if (elapsed >= MAX_RECORDING_MS) {
        finishNativeRecording(false);
        return;
      }
      let level: number | undefined;
      try {
        level = recorderRef.current.getStatus().metering;
      } catch {}
      if (typeof level !== "number" || !isFinite(level)) return; // metering unavailable → manual stop only
      if (level > SPEECH_THRESHOLD_DB) {
        heardSpeech = true;
        silenceSince = null;
      } else if (heardSpeech && level < SILENCE_THRESHOLD_DB) {
        if (silenceSince === null) silenceSince = Date.now();
        else if (Date.now() - silenceSince >= SILENCE_STOP_MS) {
          finishNativeRecording(false);
        }
      } else {
        silenceSince = null;
      }
    }, METER_POLL_MS);
  }, [clearMeterTimer, finishNativeRecording]);

  // ── Web: SpeechRecognition ───────────────────────────────────────────────
  const startWeb = useCallback(async () => {
    if (recognitionRef.current) return;
    const SR = getWebRecognitionCtor();
    if (!SR) {
      optionsRef.current.onError?.(
        "This browser doesn't support voice input. Please type instead."
      );
      return;
    }

    const rec = new SR();
    rec.continuous = false;
    rec.interimResults = true;
    rec.lang = optionsRef.current.lang ?? "en-IE";

    let finalText = "";
    rec.onresult = (event: any) => {
      if (recognitionRef.current !== rec) return; // stale session
      const transcript = (Array.from(event.results) as any[])
        .map((r: any) => r[0].transcript as string)
        .join("");
      finalText = transcript;
      optionsRef.current.onInterim?.(transcript);
    };
    rec.onend = () => {
      if (recognitionRef.current !== rec) return; // stale session
      recognitionRef.current = null;
      if (mountedRef.current) setListening(false);
      if (!cancelledRef.current) optionsRef.current.onFinal(finalText.trim());
    };
    rec.onerror = (event: any) => {
      if (recognitionRef.current !== rec) return; // stale session
      recognitionRef.current = null;
      if (mountedRef.current) setListening(false);
      if (cancelledRef.current) return;
      const code = event?.error;
      if (code === "no-speech" || code === "aborted") {
        optionsRef.current.onFinal("");
      } else {
        optionsRef.current.onError?.(
          code === "not-allowed" || code === "service-not-allowed"
            ? "Microphone access was blocked. Please allow the microphone in your browser, or type instead."
            : "Voice input hit a problem — please try again or type instead."
        );
      }
    };

    cancelledRef.current = false;
    recognitionRef.current = rec;
    rec.start();
    setListening(true);
  }, []);

  const start = useCallback(async () => {
    if (Platform.OS === "web") await startWeb();
    else await startNative();
  }, [startWeb, startNative]);

  const stop = useCallback(async () => {
    if (Platform.OS === "web") {
      try { recognitionRef.current?.stop(); } catch {}
    } else {
      await finishNativeRecording(false);
    }
  }, [finishNativeRecording]);

  const cancel = useCallback(() => {
    cancelledRef.current = true;
    if (Platform.OS === "web") {
      try { recognitionRef.current?.stop(); } catch {}
      recognitionRef.current = null;
      if (mountedRef.current) setListening(false);
    } else {
      finishNativeRecording(true);
    }
  }, [finishNativeRecording]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      cancelledRef.current = true;
      try { recognitionRef.current?.stop(); } catch {}
      recognitionRef.current = null;
      clearMeterTimer();
      if (recordingActiveRef.current) {
        recordingActiveRef.current = false;
        try { recorderRef.current.stop(); } catch {}
        setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true }).catch(() => {});
      }
    };
  }, [clearMeterTimer]);

  return { supported, listening, transcribing, start, stop, cancel };
}
