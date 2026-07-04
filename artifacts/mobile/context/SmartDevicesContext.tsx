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
