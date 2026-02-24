import { useEffect, useState } from "react";

export type JBSocialDebugLogItem = {
  id: string;
  timestamp: number;
  message: string;
};

type Listener = (items: JBSocialDebugLogItem[]) => void;

const MAX_LOG_ITEMS = 80;
let logItems: JBSocialDebugLogItem[] = [];
const listeners = new Set<Listener>();

const emit = () => {
  const snapshot = [...logItems];
  listeners.forEach((listener) => listener(snapshot));
};

const safeSerialize = (payload: unknown): string => {
  if (payload instanceof Error) {
    return payload.stack || payload.message;
  }
  if (typeof payload === "string") {
    return payload;
  }
  try {
    return JSON.stringify(payload);
  } catch {
    return String(payload);
  }
};

export const appendSocialDebugLog = (message: string, payload?: unknown) => {
  const suffix = typeof payload === "undefined" ? "" : ` ${safeSerialize(payload)}`;
  const item: JBSocialDebugLogItem = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    timestamp: Date.now(),
    message: `${message}${suffix}`,
  };
  logItems = [...logItems, item].slice(-MAX_LOG_ITEMS);
  emit();
};

export const clearSocialDebugLogs = () => {
  if (!logItems.length) return;
  logItems = [];
  emit();
};

export const subscribeSocialDebugLogs = (listener: Listener) => {
  listeners.add(listener);
  listener([...logItems]);
  return () => {
    listeners.delete(listener);
  };
};

export const useJBSocialDebugLogs = () => {
  const [items, setItems] = useState<JBSocialDebugLogItem[]>(() => [...logItems]);

  useEffect(() => subscribeSocialDebugLogs(setItems), []);

  return {
    items,
    clear: clearSocialDebugLogs,
  };
};

