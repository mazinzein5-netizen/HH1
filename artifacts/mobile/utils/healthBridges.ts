import { Platform } from "react-native";
import type { HealthReading, HealthSignal } from "./healthMonitor";

/**
 * Vendor bridge adapters for health platforms.
 *
 * Each adapter represents one place a patient's wearable data can flow from:
 * Apple HealthKit (iOS), Android Health Connect, or a vendor cloud API
 * (Garmin Health API etc.). Adapters expose a uniform contract:
 *
 *   availability()      capability detection (native module present?)
 *   connect()           request platform permissions; rejects with a
 *                       human-readable reason when the platform is not
 *                       reachable in this build (Expo Go / web)
 *   disconnect()        release the platform session
 *   subscribeReadings() start polling the platform for new samples and push
 *                       them into the monitoring engine; returns unsubscribe
 *
 * HealthKit / Health Connect need a custom Expo dev build with native
 * modules, so in Expo Go and on web they report "needs-dev-build" and
 * connect() rejects — the app then runs on simulated device data only.
 */

export type BridgeAvailability =
  | "available"          // native module present, can connect
  | "needs-dev-build"    // right platform, but native module not in this build
  | "wrong-platform"     // e.g. HealthKit on Android
  | "coming-soon";       // vendor cloud API awaiting partner approval

export interface BridgeAdapter {
  id: string;
  name: string;
  /** Short description of where the data comes from */
  description: string;
  icon: string;
  signals: { signal: HealthSignal; label: string }[];
  availability: () => BridgeAvailability;
  /** Request permissions / open the platform session. Rejects with a reason. */
  connect: () => Promise<void>;
  /** Close the platform session. Never rejects. */
  disconnect: () => Promise<void>;
  /**
   * Start polling the platform for fresh samples. New readings are delivered
   * to `onReadings`. Returns an unsubscribe function.
   */
  subscribeReadings: (onReadings: (readings: HealthReading[]) => void) => () => void;
}

/** How often connected bridges poll their platform for new samples. */
export const BRIDGE_POLL_MS = 15000;

function nativeModules(): Record<string, any> | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    return require("react-native").NativeModules ?? null;
  } catch {
    return null;
  }
}

function healthKitModule(): any | null {
  // A custom dev build would bundle a HealthKit module (e.g. react-native-health
  // or @kingstinct/react-native-healthkit). Expo Go / web builds do not.
  const mods = nativeModules();
  return mods?.AppleHealthKit ?? mods?.ReactNativeHealthkit ?? null;
}

function healthConnectModule(): any | null {
  const mods = nativeModules();
  return mods?.HealthConnect ?? null;
}

function unavailableReason(a: BridgeAvailability, name: string): string {
  switch (a) {
    case "needs-dev-build":
      return `${name} requires the pilot app build with native health modules. In this build the app runs on paired smart-device data instead.`;
    case "wrong-platform":
      return `${name} is not available on this device.`;
    case "coming-soon":
      return `${name} is awaiting partner approval and is not live yet.`;
    default:
      return `${name} could not be reached.`;
  }
}

/**
 * Shared polling loop: calls `fetchLatest` every BRIDGE_POLL_MS and forwards
 * whatever samples come back. Errors are swallowed — a failed poll must never
 * crash monitoring; the next tick retries.
 */
function makePollingSubscription(
  fetchLatest: () => Promise<HealthReading[]>,
): (onReadings: (r: HealthReading[]) => void) => () => void {
  return (onReadings) => {
    let stopped = false;
    const tick = async () => {
      try {
        const readings = await fetchLatest();
        if (!stopped && readings.length > 0) onReadings(readings);
      } catch {
        /* transient platform error — retry on next tick */
      }
    };
    tick();
    const interval = setInterval(tick, BRIDGE_POLL_MS);
    return () => {
      stopped = true;
      clearInterval(interval);
    };
  };
}

const healthKitAvailability = (): BridgeAvailability => {
  if (Platform.OS !== "ios") return "wrong-platform";
  return healthKitModule() ? "available" : "needs-dev-build";
};

const healthConnectAvailability = (): BridgeAvailability => {
  if (Platform.OS !== "android") return "wrong-platform";
  return healthConnectModule() ? "available" : "needs-dev-build";
};

const HEALTHKIT_ADAPTER: BridgeAdapter = {
  id: "healthkit",
  name: "Apple Health",
  description: "Apple Watch falls, heart rate, ECG & SpO₂ via HealthKit",
  icon: "apple",
  signals: [
    { signal: "fall", label: "Fall detection" },
    { signal: "hr", label: "Heart rate" },
    { signal: "ecg", label: "ECG" },
    { signal: "spo2", label: "SpO₂" },
    { signal: "glucose", label: "Glucose (synced)" },
  ],
  availability: healthKitAvailability,
  connect: async () => {
    const a = healthKitAvailability();
    if (a !== "available") throw new Error(unavailableReason(a, "Apple Health"));
    const mod = healthKitModule();
    // react-native-health style init with read permissions.
    await new Promise<void>((resolve, reject) => {
      try {
        mod.initHealthKit(
          {
            permissions: {
              read: ["HeartRate", "OxygenSaturation", "BloodGlucose", "Electrocardiogram"],
              write: [],
            },
          },
          (err: unknown) => (err ? reject(new Error(String(err))) : resolve()),
        );
      } catch (e) {
        reject(e instanceof Error ? e : new Error("HealthKit init failed"));
      }
    });
  },
  disconnect: async () => {
    /* HealthKit has no session teardown; polling stops via unsubscribe. */
  },
  subscribeReadings: makePollingSubscription(async () => {
    const mod = healthKitModule();
    if (!mod?.getHeartRateSamples) return [];
    const since = new Date(Date.now() - BRIDGE_POLL_MS).toISOString();
    const samples: { value: number; startDate: string }[] = await new Promise(
      (resolve) => {
        try {
          mod.getHeartRateSamples(
            { startDate: since },
            (err: unknown, results: any[]) => resolve(err ? [] : (results ?? [])),
          );
        } catch {
          resolve([]);
        }
      },
    );
    return samples.map((s) => ({
      signal: "hr" as const,
      value: s.value,
      source: "Apple Health",
      ts: new Date(s.startDate).getTime() || Date.now(),
    }));
  }),
};

const HEALTH_CONNECT_ADAPTER: BridgeAdapter = {
  id: "health-connect",
  name: "Health Connect",
  description: "Samsung, Fitbit, Xiaomi & other wearables synced to Android Health Connect",
  icon: "android",
  signals: [
    { signal: "hr", label: "Heart rate" },
    { signal: "spo2", label: "SpO₂" },
    { signal: "glucose", label: "Glucose" },
    { signal: "fall", label: "Fall events (device-dependent)" },
  ],
  availability: healthConnectAvailability,
  connect: async () => {
    const a = healthConnectAvailability();
    if (a !== "available") throw new Error(unavailableReason(a, "Health Connect"));
    const mod = healthConnectModule();
    if (typeof mod.requestPermission === "function") {
      await mod.requestPermission([
        { accessType: "read", recordType: "HeartRate" },
        { accessType: "read", recordType: "OxygenSaturation" },
        { accessType: "read", recordType: "BloodGlucose" },
      ]);
    }
  },
  disconnect: async () => {
    /* Health Connect permissions persist; polling stops via unsubscribe. */
  },
  subscribeReadings: makePollingSubscription(async () => {
    const mod = healthConnectModule();
    if (!mod?.readRecords) return [];
    const start = new Date(Date.now() - BRIDGE_POLL_MS).toISOString();
    const res = await mod.readRecords("HeartRate", {
      timeRangeFilter: { operator: "after", startTime: start },
    });
    const records: any[] = res?.records ?? [];
    return records.flatMap((rec) =>
      (rec.samples ?? []).map((s: any) => ({
        signal: "hr" as const,
        value: s.beatsPerMinute,
        source: "Health Connect",
        ts: new Date(s.time ?? rec.startTime).getTime() || Date.now(),
      })),
    );
  }),
};

const GARMIN_ADAPTER: BridgeAdapter = {
  id: "garmin-cloud",
  name: "Garmin Health API",
  description: "Garmin cloud sync — awaiting partner approval",
  icon: "cloud-outline",
  signals: [
    { signal: "hr", label: "Heart rate" },
    { signal: "spo2", label: "Pulse Ox" },
    { signal: "fall", label: "Incident detection" },
  ],
  availability: () => "coming-soon",
  connect: async () => {
    throw new Error(unavailableReason("coming-soon", "Garmin Health API"));
  },
  disconnect: async () => {},
  subscribeReadings: () => () => {},
};

export const VENDOR_BRIDGES: BridgeAdapter[] = [
  HEALTHKIT_ADAPTER,
  HEALTH_CONNECT_ADAPTER,
  GARMIN_ADAPTER,
];

export function getBridge(id: string): BridgeAdapter | undefined {
  return VENDOR_BRIDGES.find((b) => b.id === id);
}

export function availabilityLabel(a: BridgeAvailability): string {
  switch (a) {
    case "available":       return "Ready to connect";
    case "needs-dev-build": return "Requires the pilot app build";
    case "wrong-platform":  return "Not available on this device";
    case "coming-soon":     return "Coming soon";
  }
}
