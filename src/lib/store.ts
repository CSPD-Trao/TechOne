import { useSyncExternalStore } from "react";
import type { Device, StickyLocation, StoreState } from "./types";

const KEY = "stocktake.v1";

const empty: StoreState = {
  stickyLocation: {
    buildingName: "",
    roomNumber: "",
    personResponsible: "",
    additionalNotes: "",
  },
  devices: [],
};

function read(): StoreState {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return empty;
    const parsed = JSON.parse(raw) as StoreState;
    if (!parsed || !Array.isArray(parsed.devices)) return empty;
    return {
      stickyLocation: { ...empty.stickyLocation, ...parsed.stickyLocation },
      devices: parsed.devices,
    };
  } catch {
    return empty;
  }
}

let state: StoreState = read();
const listeners = new Set<() => void>();

function emit() {
  localStorage.setItem(KEY, JSON.stringify(state));
  listeners.forEach((l) => l());
}

function subscribe(l: () => void) {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
}

function getSnapshot() {
  return state;
}

export function useStore<T>(selector: (s: StoreState) => T): T {
  return useSyncExternalStore(
    subscribe,
    () => selector(getSnapshot()),
    () => selector(empty),
  );
}

function uuid() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export const store = {
  setStickyLocation(loc: StickyLocation) {
    state = { ...state, stickyLocation: loc };
    emit();
  },
  addDevice(assetNumber: string): Device {
    const trimmed = assetNumber.trim();
    const device: Device = {
      id: uuid(),
      assetNumber: trimmed,
      sightedDate: new Date().toISOString(),
      ...state.stickyLocation,
    };
    state = { ...state, devices: [device, ...state.devices] };
    emit();
    return device;
  },
  updateDevice(id: string, patch: Partial<Device>) {
    state = {
      ...state,
      devices: state.devices.map((d) => (d.id === id ? { ...d, ...patch } : d)),
    };
    emit();
  },
  removeDevice(id: string) {
    state = { ...state, devices: state.devices.filter((d) => d.id !== id) };
    emit();
  },
  restoreDevice(device: Device) {
    if (state.devices.some((d) => d.id === device.id)) return;
    state = { ...state, devices: [device, ...state.devices] };
    emit();
  },
  clearAll() {
    state = { ...state, devices: [] };
    emit();
  },
  countAssetNumber(assetNumber: string) {
    return state.devices.filter((d) => d.assetNumber === assetNumber).length;
  },
};
