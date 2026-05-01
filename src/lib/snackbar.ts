import { useSyncExternalStore } from "react";

export type Snack = {
  id: string;
  title: string;
  body?: string;
  tone?: "default" | "success" | "danger";
  action?: { label: string; onClick: () => void };
  durationMs?: number;
};

let snacks: Snack[] = [];
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

function uuid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export function showSnack(s: Omit<Snack, "id">): string {
  const id = uuid();
  const snack: Snack = { id, durationMs: 5000, tone: "default", ...s };
  snacks = [...snacks, snack];
  emit();
  if (snack.durationMs && snack.durationMs > 0) {
    setTimeout(() => dismissSnack(id), snack.durationMs);
  }
  return id;
}

export function dismissSnack(id: string) {
  const before = snacks.length;
  snacks = snacks.filter((s) => s.id !== id);
  if (snacks.length !== before) emit();
}

export function useSnacks(): Snack[] {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => {
        listeners.delete(l);
      };
    },
    () => snacks,
    () => [],
  );
}
