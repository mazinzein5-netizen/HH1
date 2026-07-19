import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useEffect, useState } from "react";

export interface Device {
  id: string;
  name: string;
  brand: string;
  icon: string;
  connected: boolean;
  reading: string;
  readingLabel: string;
  category: "rings" | "watches" | "cgm";
  capabilities: string;
}

const INITIAL_DEVICES: Device[] = [
  // ── Smart rings ──────────────────────────────────────────────────────────
  // Oura Gen 4: HRV, skin temperature, SpO₂ — early signals for metabolic
  // disturbance, dehydration, and infection via Oura REST API
  {
    id: "oura4",
    name: "Oura Ring Gen 4",
    brand: "Oura",
    icon: "ring",
    connected: false,
    reading: "—",
    readingLabel: "HRV ms",
    category: "rings",
    capabilities: "HRV · SpO₂ · Skin Temp · Sleep",
  },
  // Samsung Galaxy Ring: continuous HR, SpO₂, skin temp via Samsung Health SDK
  {
    id: "sring",
    name: "Samsung Galaxy Ring",
    brand: "Samsung",
    icon: "ring",
    connected: false,
    reading: "—",
    readingLabel: "HR bpm",
    category: "rings",
    capabilities: "HR · SpO₂ · Skin Temp · Activity",
  },

  // ── Clinical smartwatches ─────────────────────────────────────────────────
  // Apple Watch Series 9: FDA-cleared ECG, SpO₂, wrist skin temp via HealthKit
  {
    id: "aw9",
    name: "Apple Watch Series 9",
    brand: "Apple",
    icon: "watch-variant",
    connected: false,
    reading: "—",
    readingLabel: "ECG",
    category: "watches",
    capabilities: "ECG · SpO₂ · Skin Temp · Fall Detection",
  },
  // Apple Watch Ultra 2: same clinical sensors, rugged form
  {
    id: "awultra2",
    name: "Apple Watch Ultra 2",
    brand: "Apple",
    icon: "watch-variant",
    connected: false,
    reading: "—",
    readingLabel: "ECG",
    category: "watches",
    capabilities: "ECG · SpO₂ · Skin Temp · Fall Detection",
  },
  // Samsung Galaxy Watch 7: ECG + continuous BP via Samsung Health SDK
  {
    id: "sgw7",
    name: "Samsung Galaxy Watch 7",
    brand: "Samsung",
    icon: "watch-variant",
    connected: false,
    reading: "—",
    readingLabel: "BP mmHg",
    category: "watches",
    capabilities: "ECG · Blood Pressure · SpO₂ · BIA",
  },
  // Samsung Galaxy Watch Ultra: ECG + BP, higher-fidelity BIA sensors
  {
    id: "sgwultra",
    name: "Samsung Galaxy Watch Ultra",
    brand: "Samsung",
    icon: "watch-variant",
    connected: false,
    reading: "—",
    readingLabel: "BP mmHg",
    category: "watches",
    capabilities: "ECG · Blood Pressure · SpO₂ · Stress Index",
  },
  // Withings ScanWatch 2: CE-marked ECG, SpO₂, sleep apnea detection
  // — Withings Health API for clinical data export
  {
    id: "scanwatch2",
    name: "Withings ScanWatch 2",
    brand: "Withings",
    icon: "watch-variant",
    connected: false,
    reading: "—",
    readingLabel: "ECG",
    category: "watches",
    capabilities: "ECG · SpO₂ · Afib Detection · Sleep Apnea",
  },
  // Fitbit Sense 2: ECG, EDA (electrodermal activity — stress/metabolic proxy),
  // skin temperature — Fitbit Web API
  {
    id: "sense2",
    name: "Fitbit Sense 2",
    brand: "Fitbit",
    icon: "watch",
    connected: false,
    reading: "—",
    readingLabel: "EDA μS",
    category: "watches",
    capabilities: "ECG · EDA Stress · Skin Temp · SpO₂",
  },
  // Garmin Venu 3: SpO₂, HRV stress score, Pulse Ox, respiration rate
  // — Garmin Health API
  {
    id: "venu3",
    name: "Garmin Venu 3",
    brand: "Garmin",
    icon: "watch",
    connected: false,
    reading: "—",
    readingLabel: "SpO₂ %",
    category: "watches",
    capabilities: "SpO₂ · HRV · Respiration · Stress Score",
  },

  // ── Continuous glucose monitors ───────────────────────────────────────────
  // Abbott FreeStyle Libre 3: 1-min glucose readings via LibreView API
  {
    id: "libre3",
    name: "FreeStyle Libre 3",
    brand: "Abbott",
    icon: "water-percent",
    connected: false,
    reading: "—",
    readingLabel: "mmol/L",
    category: "cgm",
    capabilities: "Continuous Glucose · Hypo/Hyper Alerts",
  },
  // Dexcom G7: 5-min glucose + trend arrows via Dexcom Clarity API
  {
    id: "dexg7",
    name: "Dexcom G7",
    brand: "Dexcom",
    icon: "water-percent",
    connected: false,
    reading: "—",
    readingLabel: "mmol/L",
    category: "cgm",
    capabilities: "Continuous Glucose · Trend Arrows · Share",
  },
  // Medtronic Guardian 4: predictive low/high alerts, SmartGuard integration
  {
    id: "guardian4",
    name: "Guardian 4 CGM",
    brand: "Medtronic",
    icon: "water-percent",
    connected: false,
    reading: "—",
    readingLabel: "mmol/L",
    category: "cgm",
    capabilities: "Continuous Glucose · Predictive Alerts · SmartGuard",
  },
];

const FAKE_READINGS: Record<string, string> = {
  oura4: "48",
  sring: "71",
  aw9: "Normal",
  awultra2: "Normal",
  sgw7: "121/79",
  sgwultra: "118/76",
  scanwatch2: "Normal",
  sense2: "0.8",
  venu3: "98",
  libre3: "5.4",
  dexg7: "6.1",
  guardian4: "5.8",
};

// How often connected devices refresh their readings.
const READING_REFRESH_MS = 3000;

function jitterInt(base: number, spread: number, min: number, max: number): number {
  const delta = Math.round((Math.random() * 2 - 1) * spread);
  return Math.max(min, Math.min(max, base + delta));
}

function jitterFloat(
  base: number,
  spread: number,
  min: number,
  max: number,
  decimals: number,
): string {
  const delta = (Math.random() * 2 - 1) * spread;
  const value = Math.max(min, Math.min(max, base + delta));
  return value.toFixed(decimals);
}

// Plausible per-device variation around the baseline reading. Values jitter
// around the FAKE_READINGS baseline each tick (rather than drifting from the
// previous value) so they stay within clinically believable ranges. Devices
// without an entry here (e.g. ECG "Normal") keep a steady reading.
const READING_VARIATION: Record<string, () => string> = {
  oura4: () => String(jitterInt(48, 4, 38, 62)),
  sring: () => String(jitterInt(71, 4, 58, 84)),
  sgw7: () => `${jitterInt(121, 4, 110, 130)}/${jitterInt(79, 3, 70, 86)}`,
  sgwultra: () => `${jitterInt(118, 4, 108, 128)}/${jitterInt(76, 3, 68, 84)}`,
  sense2: () => jitterFloat(0.8, 0.15, 0.4, 1.4, 1),
  venu3: () => String(jitterInt(98, 1, 95, 100)),
  libre3: () => jitterFloat(5.4, 0.3, 4.4, 7.0, 1),
  dexg7: () => jitterFloat(6.1, 0.3, 4.6, 7.5, 1),
  guardian4: () => jitterFloat(5.8, 0.3, 4.6, 7.2, 1),
};

interface SmartDevicesContextValue {
  devices: Device[];
  connectedCount: number;
  toggleDevice: (id: string) => void;
}

const STORAGE_KEY = "ibnceena_paired_devices";

const SmartDevicesContext = createContext<SmartDevicesContextValue | null>(null);

function applyConnectedIds(ids: string[]): Device[] {
  const connectedSet = new Set(ids);
  return INITIAL_DEVICES.map((d) => {
    const connected = connectedSet.has(d.id);
    return { ...d, connected, reading: connected ? FAKE_READINGS[d.id] : "—" };
  });
}

export function SmartDevicesProvider({ children }: { children: React.ReactNode }) {
  const [devices, setDevices] = useState<Device[]>(INITIAL_DEVICES);

  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (stored) {
          const ids: string[] = JSON.parse(stored);
          setDevices(applyConnectedIds(ids));
        }
      } catch {}
    })();
  }, []);

  const hasConnected = devices.some((d) => d.connected);

  // Periodically refresh readings on connected devices so the vitals feel live.
  // The timer only runs while at least one device is connected and is torn down
  // on unmount or when the last device disconnects, so no timers leak.
  useEffect(() => {
    if (!hasConnected) return;
    const interval = setInterval(() => {
      setDevices((prev) =>
        prev.map((d) => {
          if (!d.connected) return d;
          const vary = READING_VARIATION[d.id];
          return vary ? { ...d, reading: vary() } : d;
        }),
      );
    }, READING_REFRESH_MS);
    return () => clearInterval(interval);
  }, [hasConnected]);

  function persist(next: Device[]) {
    const ids = next.filter((d) => d.connected).map((d) => d.id);
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(ids)).catch(() => {});
  }

  function toggleDevice(id: string) {
    setDevices((prev) => {
      const next = prev.map((d) => {
        if (d.id !== id) return d;
        const connected = !d.connected;
        return { ...d, connected, reading: connected ? FAKE_READINGS[id] : "—" };
      });
      persist(next);
      return next;
    });
  }

  const connectedCount = devices.filter((d) => d.connected).length;

  return (
    <SmartDevicesContext.Provider value={{ devices, connectedCount, toggleDevice }}>
      {children}
    </SmartDevicesContext.Provider>
  );
}

export function useSmartDevices() {
  const ctx = useContext(SmartDevicesContext);
  if (!ctx) throw new Error("useSmartDevices must be used inside SmartDevicesProvider");
  return ctx;
}
