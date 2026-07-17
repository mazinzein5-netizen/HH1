import React, { createContext, useCallback, useContext, useState } from "react";
import ChatBot from "@/components/ChatBot";

interface OpenOptions {
  /** When true, Sarah focuses on helping the patient describe their pain for health practitioners. */
  painHelper?: boolean;
}

interface HiveBotContextType {
  /** Open Sarah. Optionally seed her with clinical context (e.g. triage results). */
  open: (seedContext?: string, options?: OpenOptions) => void;
  close: () => void;
  visible: boolean;
}

const HiveBotContext = createContext<HiveBotContextType | null>(null);

export function HiveBotProvider({ children }: { children: React.ReactNode }) {
  const [visible, setVisible] = useState(false);
  const [seedContext, setSeedContext] = useState<string | undefined>(undefined);
  const [painHelper, setPainHelper] = useState(false);

  const open = useCallback((seed?: string, options?: OpenOptions) => {
    setSeedContext(seed);
    setPainHelper(options?.painHelper ?? false);
    setVisible(true);
  }, []);

  const close = useCallback(() => setVisible(false), []);

  return (
    <HiveBotContext.Provider value={{ open, close, visible }}>
      {children}
      <ChatBot visible={visible} onClose={close} seedContext={seedContext} painHelper={painHelper} />
    </HiveBotContext.Provider>
  );
}

export function useHiveBot() {
  const ctx = useContext(HiveBotContext);
  if (!ctx) throw new Error("useHiveBot must be used within HiveBotProvider");
  return ctx;
}
