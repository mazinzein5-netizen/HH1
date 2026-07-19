/**
 * Health monitoring engine (pilot mode).
 *
 * Evaluates a unified stream of health readings — from simulated Smart
 * Devices today, and platform bridges (HealthKit / Health Connect / vendor
 * clouds) when available — against clinically sensible thresholds and
 * trends, with debouncing so one incident produces one alert.
 */

export type HealthSignal = "hr" | "spo2" | "glucose" | "ecg" | "fall";

export interface HealthReading {
  signal: HealthSignal;
  /** Numeric value for hr/spo2/glucose; 1 for fall; 0/1 for ecg (1 = abnormal) */
  value: number;
  /** Human-readable raw value, e.g. "Afib detected" for ecg */
  raw?: string;
  source: string;
  ts: number;
}

export type IncidentSeverity = "critical" | "warning";

export interface Incident {
  id: string;
  ruleId: string;
  signal: HealthSignal;
  severity: IncidentSeverity;
  title: string;
  detail: string;
  source: string;
  ts: number;
  readings: HealthReading[];
  status: "active" | "ok" | "escalated";
  /** AI confirmation, when the assessment endpoint responded in time */
  aiSeverity?: string;
  aiExplanation?: string;
}

interface Rule {
  id: string;
  signal: HealthSignal;
  severity: IncidentSeverity;
  title: string;
  /** Consecutive readings that must match before firing (debounce for spikes) */
  sustained: number;
  test: (r: HealthReading, prev: HealthReading[]) => boolean;
  detail: (r: HealthReading) => string;
}

export const RULES: Rule[] = [
  {
    id: "fall",
    signal: "fall",
    severity: "critical",
    title: "Fall detected",
    sustained: 1,
    test: (r) => r.value >= 1,
    detail: (r) => `A hard fall was detected by ${r.source}.`,
  },
  {
    id: "tachycardia",
    signal: "hr",
    severity: "warning",
    title: "Sustained high heart rate",
    sustained: 2,
    test: (r) => r.value > 130,
    detail: (r) => `Heart rate has stayed above 130 bpm (now ${Math.round(r.value)} bpm) while at rest.`,
  },
  {
    id: "bradycardia",
    signal: "hr",
    severity: "critical",
    title: "Sustained very low heart rate",
    sustained: 2,
    test: (r) => r.value > 0 && r.value < 40,
    detail: (r) => `Heart rate has stayed below 40 bpm (now ${Math.round(r.value)} bpm).`,
  },
  {
    id: "spo2-low",
    signal: "spo2",
    severity: "critical",
    title: "Low blood oxygen",
    sustained: 2,
    test: (r) => r.value > 0 && r.value < 92,
    detail: (r) => `Blood oxygen saturation has dropped to ${Math.round(r.value)}% (below 92%).`,
  },
  {
    id: "glucose-low",
    signal: "glucose",
    severity: "critical",
    title: "Low blood glucose",
    sustained: 1,
    test: (r) => r.value > 0 && r.value < 3.9,
    detail: (r) => `Blood glucose is ${r.value.toFixed(1)} mmol/L — below the 3.9 mmol/L hypoglycaemia threshold.`,
  },
  {
    id: "glucose-high",
    signal: "glucose",
    severity: "warning",
    title: "High blood glucose",
    sustained: 2,
    test: (r) => r.value > 13.9,
    detail: (r) => `Blood glucose is ${r.value.toFixed(1)} mmol/L — above the 13.9 mmol/L hyperglycaemia threshold.`,
  },
  {
    id: "glucose-rapid",
    signal: "glucose",
    severity: "warning",
    title: "Rapid glucose change",
    sustained: 1,
    test: (r, prev) => {
      const last = prev.length > 0 ? prev[prev.length - 1] : undefined;
      if (!last) return false;
      return Math.abs(r.value - last.value) >= 2.5;
    },
    detail: (r) => `Blood glucose changed rapidly to ${r.value.toFixed(1)} mmol/L within minutes.`,
  },
  {
    id: "ecg-abnormal",
    signal: "ecg",
    severity: "warning",
    title: "ECG status change",
    sustained: 1,
    test: (r) => r.value >= 1,
    detail: (r) => `ECG classification changed from Normal to "${r.raw ?? "Abnormal"}".`,
  },
];

/** One alert per rule per cooldown window — a single incident fires once. */
const RULE_COOLDOWN_MS = 5 * 60 * 1000;
/** How many recent readings per signal we keep for trend rules & AI context. */
const HISTORY_LIMIT = 20;

export class MonitoringEngine {
  private history: Map<HealthSignal, HealthReading[]> = new Map();
  private lastFired: Map<string, number> = new Map();
  private matchStreak: Map<string, number> = new Map();

  /** Feed one reading; returns a new Incident if a rule fired (post-debounce). */
  ingest(reading: HealthReading): Incident | null {
    const prev = this.history.get(reading.signal) ?? [];
    let fired: Incident | null = null;

    for (const rule of RULES) {
      if (rule.signal !== reading.signal) continue;

      if (!rule.test(reading, prev)) {
        this.matchStreak.set(rule.id, 0);
        continue;
      }

      const streak = (this.matchStreak.get(rule.id) ?? 0) + 1;
      this.matchStreak.set(rule.id, streak);
      if (streak < rule.sustained) continue;

      const last = this.lastFired.get(rule.id) ?? 0;
      if (reading.ts - last < RULE_COOLDOWN_MS) continue;

      this.lastFired.set(rule.id, reading.ts);
      this.matchStreak.set(rule.id, 0);
      // Critical incidents win if multiple rules fire on the same reading.
      if (!fired || rule.severity === "critical") {
        fired = {
          id: `${rule.id}-${reading.ts}`,
          ruleId: rule.id,
          signal: reading.signal,
          severity: rule.severity,
          title: rule.title,
          detail: rule.detail(reading),
          source: reading.source,
          ts: reading.ts,
          readings: [...prev.slice(-5), reading],
          status: "active",
        };
      }
    }

    const next = [...prev, reading].slice(-HISTORY_LIMIT);
    this.history.set(reading.signal, next);
    return fired;
  }

  /** Recent readings for a signal (for AI context). */
  recent(signal: HealthSignal): HealthReading[] {
    return this.history.get(signal) ?? [];
  }

  reset() {
    this.history.clear();
    this.lastFired.clear();
    this.matchStreak.clear();
  }
}

/** Parse a simulated Smart Device's display reading into unified readings. */
export function readingsFromDevice(d: {
  id: string;
  name: string;
  connected: boolean;
  reading: string;
  readingLabel: string;
}): HealthReading[] {
  if (!d.connected || d.reading === "—") return [];
  const ts = Date.now();
  const out: HealthReading[] = [];

  if (d.readingLabel === "HR bpm") {
    const v = parseFloat(d.reading);
    if (!Number.isNaN(v)) out.push({ signal: "hr", value: v, source: d.name, ts });
  } else if (d.readingLabel === "SpO₂ %") {
    const v = parseFloat(d.reading);
    if (!Number.isNaN(v)) out.push({ signal: "spo2", value: v, source: d.name, ts });
  } else if (d.readingLabel === "mmol/L") {
    const v = parseFloat(d.reading);
    if (!Number.isNaN(v)) out.push({ signal: "glucose", value: v, source: d.name, ts });
  } else if (d.readingLabel === "ECG") {
    out.push({
      signal: "ecg",
      value: d.reading === "Normal" ? 0 : 1,
      raw: d.reading,
      source: d.name,
      ts,
    });
  }
  return out;
}
