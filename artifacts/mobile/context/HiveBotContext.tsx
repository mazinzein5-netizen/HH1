import React, { createContext, useCallback, useContext, useState } from "react";
import ChatBot from "@/components/ChatBot";
import SarahBubble from "@/components/SarahBubble";

/** Context for offering a consent-gated, AI-drafted GP letter after a questionnaire. */
export interface GpLetterContext {
  pathwayName: string;
  resultLabel: string;
  score: string;
  referral: string;
  answers: { question: string; answer: string }[];
}

interface OpenOptions {
  /** When true, Sarah focuses on helping the patient describe their pain for health practitioners. */
  painHelper?: boolean;
  /** When set (pilot mode), Sarah offers to draft a GP letter from these questionnaire results. */
  gpLetter?: GpLetterContext;
}

interface HiveBotContextType {
  /** Open Sarah. Optionally seed her with clinical context (e.g. triage results). */
  open: (seedContext?: string, options?: OpenOptions) => void;
  close: () => void;
  visible: boolean;
  /** Open the compact voice bubble — user can keep using the app while chatting. */
  openBubble: () => void;
  closeBubble: () => void;
  bubbleVisible: boolean;
}

const HiveBotContext = createContext<HiveBotContextType | null>(null);

export function HiveBotProvider({ children }: { children: React.ReactNode }) {
  const [visible, setVisible] = useState(false);
  const [seedContext, setSeedContext] = useState<string | undefined>(undefined);
  const [painHelper, setPainHelper] = useState(false);
  const [gpLetter, setGpLetter] = useState<GpLetterContext | undefined>(undefined);

  const [bubbleVisible, setBubbleVisible] = useState(false);

  const open = useCallback((seed?: string, options?: OpenOptions) => {
    setSeedContext(seed);
    setPainHelper(options?.painHelper ?? false);
    setGpLetter(options?.gpLetter);
    setBubbleVisible(false);
    setVisible(true);
  }, []);

  const close = useCallback(() => setVisible(false), []);
  const openBubble = useCallback(() => {
    setVisible(false);
    setBubbleVisible(true);
  }, []);
  const closeBubble = useCallback(() => setBubbleVisible(false), []);

  return (
    <HiveBotContext.Provider value={{ open, close, visible, openBubble, closeBubble, bubbleVisible }}>
      {children}
      <ChatBot
        visible={visible}
        onClose={close}
        seedContext={seedContext}
        painHelper={painHelper}
        gpLetter={gpLetter}
      />
      <SarahBubble
        visible={bubbleVisible}
        onClose={closeBubble}
        onExpand={() => {
          setBubbleVisible(false);
          setSeedContext(undefined);
          setPainHelper(false);
          setGpLetter(undefined);
          setVisible(true);
        }}
      />
    </HiveBotContext.Provider>
  );
}

export function useHiveBot() {
  const ctx = useContext(HiveBotContext);
  if (!ctx) throw new Error("useHiveBot must be used within HiveBotProvider");
  return ctx;
}
