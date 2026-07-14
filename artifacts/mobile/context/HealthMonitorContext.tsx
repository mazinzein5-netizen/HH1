import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { PILOT_ACTIVATION_CODE, useAppMode } from "@/context/AppModeContext";
import { useSmartDevices } from "@/context/SmartDevicesContext";
import { getBridge, VENDOR_BRIDGES } from "@/utils/healthBridges";
import {
  type HealthReading,
  type Incident,
  MonitoringEngine,
  readingsFromDevice,
} from "@/utils/healthMonitor";

/**
 * Pilot-only health monitoring provider.
 *
 * Feeds the simulated Smart Devices stream (and platform bridges when a
 * custom dev build makes them available) through the MonitoringEngine.
 * When a rule fires it asks the api-server AI endpoint to confirm severity
 * and produce a plain-English explanation; if that fails, the rule-based
 * alert still fires unchanged.
 *
 * When the pilot flag is off, the engine never runs and no alert UI is
 * reachable.
 */

const HISTORY_KEY = "@hive_health_alerts_v1";
const BRIDGES_KEY = "@hive_health_bridges_v1";
const HISTORY_LIMIT = 30;
/** How often we sample the connected devices' readings. */
const SAMPLE_MS = 3000;

export interface BridgeConnectionState {
  connected: boolean;
  connecting: boolean;
  error: string | null;
}

interface HealthMonitorContextValue {
  /** true when pilot mode is on AND at least one data source is connected */
  monitoringActive: boolean;
  activeIncident: Incident | null;
  alertHistory: Incident[];
  /** Per-bridge connection state, keyed by bridge id. */
  bridgeStates: Record<string, BridgeConnectionState>;
  connectBridge: (id: string) => Promise<void>;
  disconnectBridge: (id: string) => Promise<void>;
  dismissIncident: (status: "ok" | "escalated") => void;
  triggerDemoFall: () => void;
  clearHistory: () => void;
}

const HealthMonitorContext = createContext<HealthMonitorContextValue | null>(null);

export function HealthMonitorProvider({ children }: { children: React.ReactNode }) {
  const { pilotMode } = useAppMode();
  const { devices } = useSmartDevices();
  const engineRef = useRef(new MonitoringEngine());
  const [activeIncident, setActiveIncident] = useState<Incident | null>(null);
  const [alertHistory, setAlertHistory] = useState<Incident[]>([]);
  const activeRef = useRef<Incident | null>(null);
  activeRef.current = activeIncident;

  const [bridgeStates, setBridgeStates] = useState<Record<string, BridgeConnectionState>>(
    () =>
      Object.fromEntries(
        VENDOR_BRIDGES.map((b) => [b.id, { connected: false, connecting: false, error: null }]),
      ),
  );
  /** Active bridge polling unsubscribers, keyed by bridge id. */
  const bridgeSubsRef = useRef<Record<string, () => void>>({});

  // Load persisted alert history + previously connected bridges
  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(HISTORY_KEY);
        if (raw) setAlertHistory(JSON.parse(raw));
      } catch {}
      try {
        const raw = await AsyncStorage.getItem(BRIDGES_KEY);
        if (raw) {
          const ids: string[] = JSON.parse(raw);
          // Re-connect silently; a bridge that is no longer available simply
          // stays disconnected (e.g. app moved from dev build to Expo Go).
          for (const id of ids) connectBridge(id).catch(() => {});
        }
      } catch {}
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function persistBridges(states: Record<string, BridgeConnectionState>) {
    const ids = Object.entries(states)
      .filter(([, s]) => s.connected)
      .map(([id]) => id);
    AsyncStorage.setItem(BRIDGES_KEY, JSON.stringify(ids)).catch(() => {});
  }

  function persistHistory(next: Incident[]) {
    AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(next.slice(0, HISTORY_LIMIT))).catch(() => {});
  }

  /** Ask the api-server AI to confirm severity; rule-based alert survives failure. */
  async function assessWithAI(incident: Incident) {
    const domain = process.env.EXPO_PUBLIC_DOMAIN;
    if (!domain) return;
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 8000);
      const res = await fetch(`https://${domain}/api/ai/health-alert`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          pilotCode: PILOT_ACTIVATION_CODE,
          rule: {
            id: incident.ruleId,
            title: incident.title,
            detail: incident.detail,
            severity: incident.severity,
          },
          readings: incident.readings.map((r) => ({
            signal: r.signal,
            value: r.value,
            raw: r.raw,
            source: r.source,
            ts: r.ts,
          })),
        }),
      });
      clearTimeout(timer);
      if (!res.ok) return;
      const data = (await res.json()) as { severity?: string; explanation?: string };
      if (!data.explanation) return;
      const update = { aiSeverity: data.severity, aiExplanation: data.explanation };
      // Update the live incident if it is still showing, plus its history entry.
      setActiveIncident((cur) =>
        cur && cur.id === incident.id ? { ...cur, ...update } : cur,
      );
      setAlertHistory((prev) => {
        const next = prev.map((h) => (h.id === incident.id ? { ...h, ...update } : h));
        persistHistory(next);
        return next;
      });
    } catch {
      /* AI unavailable — rule-based alert already fired */
    }
  }

  function raiseIncident(incident: Incident) {
    // One full-screen alert at a time; later incidents still land in history.
    setAlertHistory((prev) => {
      const next = [incident, ...prev].slice(0, HISTORY_LIMIT);
      persistHistory(next);
      return next;
    });
    if (!activeRef.current) setActiveIncident(incident);
    assessWithAI(incident);
  }

  const pilotRef = useRef(pilotMode);
  pilotRef.current = pilotMode;

  function ingest(readings: HealthReading[]) {
    if (!pilotRef.current) return;
    for (const r of readings) {
      const incident = engineRef.current.ingest(r);
      if (incident) raiseIncident(incident);
    }
  }

  async function connectBridge(id: string) {
    const bridge = getBridge(id);
    if (!bridge) return;
    setBridgeStates((prev) => ({
      ...prev,
      [id]: { connected: false, connecting: true, error: null },
    }));
    try {
      await bridge.connect();
      // Start streaming platform readings into the monitoring engine.
      bridgeSubsRef.current[id]?.();
      bridgeSubsRef.current[id] = bridge.subscribeReadings((readings) => ingest(readings));
      setBridgeStates((prev) => {
        const next = {
          ...prev,
          [id]: { connected: true, connecting: false, error: null },
        };
        persistBridges(next);
        return next;
      });
    } catch (e) {
      const message = e instanceof Error ? e.message : "Could not connect.";
      setBridgeStates((prev) => ({
        ...prev,
        [id]: { connected: false, connecting: false, error: message },
      }));
      throw e;
    }
  }

  async function disconnectBridge(id: string) {
    const bridge = getBridge(id);
    bridgeSubsRef.current[id]?.();
    delete bridgeSubsRef.current[id];
    try {
      await bridge?.disconnect();
    } catch {}
    setBridgeStates((prev) => {
      const next = {
        ...prev,
        [id]: { connected: false, connecting: false, error: null },
      };
      persistBridges(next);
      return next;
    });
  }

  // Stop all bridge polling on unmount.
  useEffect(() => {
    return () => {
      for (const unsub of Object.values(bridgeSubsRef.current)) unsub();
      bridgeSubsRef.current = {};
    };
  }, []);

  const anyDeviceConnected = devices.some((d) => d.connected);
  const anyBridgeConnected = Object.values(bridgeStates).some((s) => s.connected);
  const monitoringActive = pilotMode && (anyDeviceConnected || anyBridgeConnected);

  // Sample the simulated device stream while monitoring is active.
  const devicesRef = useRef(devices);
  devicesRef.current = devices;
  useEffect(() => {
    if (!monitoringActive) return;
    const interval = setInterval(() => {
      const batch = devicesRef.current.flatMap((d) => readingsFromDevice(d));
      ingest(batch);
    }, SAMPLE_MS);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [monitoringActive]);

  // Reset engine state when pilot mode turns off so nothing lingers.
  useEffect(() => {
    if (!pilotMode) {
      engineRef.current.reset();
      setActiveIncident(null);
    }
  }, [pilotMode]);

  function dismissIncident(status: "ok" | "escalated") {
    setActiveIncident((cur) => {
      if (cur) {
        setAlertHistory((prev) => {
          const next = prev.map((h) => (h.id === cur.id ? { ...h, status } : h));
          persistHistory(next);
          return next;
        });
      }
      return null;
    });
  }

  function triggerDemoFall() {
    if (!pilotMode) return;
    ingest([
      {
        signal: "fall",
        value: 1,
        source: "Demo fall (simulated)",
        ts: Date.now(),
      },
    ]);
  }

  function clearHistory() {
    setAlertHistory([]);
    AsyncStorage.removeItem(HISTORY_KEY).catch(() => {});
  }

  return (
    <HealthMonitorContext.Provider
      value={{
        monitoringActive,
        activeIncident: pilotMode ? activeIncident : null,
        alertHistory,
        bridgeStates,
        connectBridge,
        disconnectBridge,
        dismissIncident,
        triggerDemoFall,
        clearHistory,
      }}
    >
      {children}
    </HealthMonitorContext.Provider>
  );
}

export function useHealthMonitor() {
  const ctx = useContext(HealthMonitorContext);
  if (!ctx) throw new Error("useHealthMonitor must be used inside HealthMonitorProvider");
  return ctx;
}
