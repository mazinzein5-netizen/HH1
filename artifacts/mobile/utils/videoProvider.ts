/* ────────────────────────────────────────────────────────────────────────────
 * Provider-agnostic video session seam.
 *
 * The telemedicine session screen only talks to this interface. To plug in a
 * real provider later (Daily, Twilio, etc.), implement VideoSessionProvider
 * and swap the export of `getVideoProvider()` — no UI changes needed.
 * ──────────────────────────────────────────────────────────────────────────── */

export type SessionState = "idle" | "connecting" | "connected" | "ended";

export interface SessionEvents {
  onStateChange: (state: SessionState) => void;
}

export interface VideoSessionProvider {
  /** Human-readable provider name shown nowhere clinical — for debugging. */
  readonly name: string;
  /** True when this provider renders real video (pilot simulation returns false). */
  readonly rendersRealVideo: boolean;
  join(appointmentId: string, events: SessionEvents): void;
  leave(): void;
  setMicEnabled(on: boolean): void;
  setCameraEnabled(on: boolean): void;
}

/** Pilot simulation: connects after a short delay, renders no real media. */
class SimulatedVideoProvider implements VideoSessionProvider {
  readonly name = "simulated";
  readonly rendersRealVideo = false;
  private timer: ReturnType<typeof setTimeout> | null = null;
  private events: SessionEvents | null = null;

  join(_appointmentId: string, events: SessionEvents): void {
    this.events = events;
    events.onStateChange("connecting");
    this.timer = setTimeout(() => {
      this.events?.onStateChange("connected");
    }, 3000);
  }

  leave(): void {
    if (this.timer) clearTimeout(this.timer);
    this.timer = null;
    this.events?.onStateChange("ended");
    this.events = null;
  }

  setMicEnabled(_on: boolean): void {
    /* no-op in simulation */
  }

  setCameraEnabled(_on: boolean): void {
    /* no-op in simulation */
  }
}

export function getVideoProvider(): VideoSessionProvider {
  return new SimulatedVideoProvider();
}
