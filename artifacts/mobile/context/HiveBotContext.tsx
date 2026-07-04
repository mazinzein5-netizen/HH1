import React, { createContext, useCallback, useContext, useState } from "react";
import ChatBot from "@/components/ChatBot";

interface HiveBotContextType {
  /** Open the HIVE Bot. Optionally seed it with clinical context (e.g. triage results). */
  open: (seedContext?: string) => void;
  close: () => void;
  visible: boolean;
}

const HiveBotContext = createContext<HiveBotContextType | null>(null);

export function HiveBotProvider({ children }: { children: React.ReactNode }) {
  const [visible, setVisible] = useState(false);
  const [seedContext, setSeedContext] = useState<string | undefined>(undefined);

  const open = useCallback((seed?: string) => {
    setSeedContext(seed);
    setVisible(true);
  }, []);

  const close = useCallback(() => setVisible(false), []);

  return (
    <HiveBotContext.Provider value={{ open, close, visible }}>
      {children}
      <ChatBot visible={visible} onClose={close} seedContext={seedContext} />
    </HiveBotContext.Provider>
  );
}

export function useHiveBot() {
  const ctx = useContext(HiveBotContext);
  if (!ctx) throw new Error("useHiveBot must be used within HiveBotProvider");
  return ctx;
}
