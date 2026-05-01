import { useEffect, useMemo, useRef, useState } from "react";
import type { FormEvent, RefObject } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  Barcode,
  Buildings,
  Keyboard,
  Question,
  Trash,
} from "@phosphor-icons/react";
import { Button } from "../components/Button";
import {
  ScannerDebugOverlay,
  type DebugKey,
} from "../components/ScannerDebugOverlay";
import { attachScannerInput } from "../lib/scanner";
import { showSnack } from "../lib/snackbar";
import { store, useStore } from "../lib/store";
import { relativeTime } from "../lib/format";
import type { Device } from "../lib/types";

const MAX_DEBUG_KEYS = 64;

export function Scan() {
  const sticky = useStore((s) => s.stickyLocation);
  const devices = useStore((s) => s.devices);
  const nav = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const manualRef = useRef<HTMLInputElement>(null);

  const [manual, setManual] = useState(false);
  const [manualValue, setManualValue] = useState("");
  const [tickKey, setTickKey] = useState(0);
  const [debugOpen, setDebugOpen] = useState(false);
  const [debugKeys, setDebugKeys] = useState<DebugKey[]>([]);
  const [sessionIds, setSessionIds] = useState<string[]>([]);

  useEffect(() => {
    if (!sticky.buildingName || !sticky.roomNumber) {
      nav("/location", { replace: true });
    }
  }, [sticky.buildingName, sticky.roomNumber, nav]);

  useEffect(() => {
    if (manual) return;
    const el = inputRef.current;
    if (!el) return;
    el.focus();
    return attachScannerInput(el, {
      onScan: (raw) => handleScan(raw),
      onKeystroke: (info) => {
        if (!debugOpen && info.key !== "Enter") return;
        setDebugKeys((prev) => {
          const next = [
            ...prev,
            { ...info, t: performance.now() },
          ].slice(-MAX_DEBUG_KEYS);
          return next;
        });
      },
    });
  }, [manual, debugOpen]);

  const handleScan = (raw: string) => {
    const value = raw.trim();
    if (!value) return;
    const duplicateCount = store.countAssetNumber(value);
    const device = store.addDevice(value);
    setSessionIds((s) => [device.id, ...s].slice(0, 60));
    setTickKey((k) => k + 1);
    if (duplicateCount > 0) {
      showSnack({
        title: `Already scanned: ${value}`,
        body:
          duplicateCount === 1
            ? "This asset was scanned once already today."
            : `Scanned ${duplicateCount} times already today.`,
        tone: "default",
        durationMs: 3500,
      });
    }
  };

  const onManualSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (manualValue.trim().length === 0) return;
    handleScan(manualValue);
    setManualValue("");
    requestAnimationFrame(() => manualRef.current?.focus());
  };

  const sessionDevices = useMemo(() => {
    const map = new Map(devices.map((d) => [d.id, d]));
    return sessionIds
      .map((id) => map.get(id))
      .filter((d): d is Device => Boolean(d));
  }, [devices, sessionIds]);

  const undo = (id: string) => {
    const dev = devices.find((d) => d.id === id);
    if (!dev) return;
    store.removeDevice(id);
    setSessionIds((s) => s.filter((x) => x !== id));
    showSnack({
      title: `Removed ${dev.assetNumber}`,
      tone: "default",
      durationMs: 4000,
      action: {
        label: "Undo",
        onClick: () => {
          store.restoreDevice(dev);
          setSessionIds((s) => [dev.id, ...s]);
        },
      },
    });
  };

  return (
    <div className="max-w-[1100px] mx-auto px-6 sm:px-8 pt-6 sm:pt-10 pb-32">
      <div className="flex items-center justify-between gap-4 mb-6">
        <button
          onClick={() => nav("/")}
          className="inline-flex items-center gap-1.5 text-sm text-[var(--color-muted)] hover:text-[var(--color-ink)] transition-colors"
        >
          <ArrowLeft size={14} weight="bold" />
          Home
        </button>
        <button
          onClick={() => setDebugOpen(true)}
          aria-label="Scanner debug"
          className="inline-flex items-center gap-1.5 text-xs text-[var(--color-soft)] hover:text-[var(--color-ink)] transition-colors"
        >
          <Question size={14} weight="bold" />
          Scanner test
        </button>
      </div>

      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="inline-flex items-center gap-2 rounded-full border border-[var(--color-hairline)] bg-[var(--color-surface)] pl-3 pr-1 py-1">
          <Buildings
            size={14}
            weight="regular"
            className="text-[var(--color-muted)]"
          />
          <span className="text-sm font-medium">
            {sticky.buildingName}{" "}
            <span className="text-[var(--color-soft)]">·</span>{" "}
            {sticky.roomNumber}
          </span>
          <Link
            to="/location"
            className="ml-1 text-xs text-[var(--color-muted)] hover:text-[var(--color-ink)] rounded-full px-2 py-1 transition-colors hover:bg-[var(--color-hairline)]/50"
          >
            Change
          </Link>
        </div>
        <Button
          variant="primary"
          onClick={() => nav("/list")}
          trailing={<ArrowRight size={14} weight="bold" />}
        >
          Done
        </Button>
      </div>

      <div className="mt-8 grid lg:grid-cols-[0.95fr_1.05fr] gap-8 items-start">
        <ScanCard
          tickKey={tickKey}
          inputRef={inputRef}
          manual={manual}
          manualRef={manualRef}
          manualValue={manualValue}
          setManualValue={setManualValue}
          onToggleManual={() => setManual((m) => !m)}
          onManualSubmit={onManualSubmit}
        />

        <div>
          <div className="flex items-baseline justify-between mb-3">
            <h2 className="text-[11px] uppercase tracking-[0.18em] text-[var(--color-muted)]">
              This session
            </h2>
            <span className="text-xs text-[var(--color-soft)] tabular-nums">
              {sessionDevices.length} scanned
            </span>
          </div>
          {sessionDevices.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[var(--color-hairline)] py-10 px-6 text-center">
              <p className="text-sm text-[var(--color-muted)]">
                Scans will appear here as you go.
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-[var(--color-hairline)] border border-[var(--color-hairline)] rounded-2xl bg-[var(--color-surface)] overflow-hidden">
              <AnimatePresence initial={false}>
                {sessionDevices.map((d) => (
                  <motion.li
                    key={d.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{
                      duration: 0.22,
                      ease: [0.23, 1, 0.32, 1],
                    }}
                    className="flex items-center gap-3 px-4 py-3"
                  >
                    <span className="grid place-items-center h-9 w-9 rounded-lg bg-[var(--color-accent-soft)] text-[var(--color-accent)]">
                      <Barcode size={16} weight="regular" />
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="font-mono text-[13px] text-[var(--color-ink)] truncate">
                        {d.assetNumber}
                      </div>
                      <div className="text-[11px] text-[var(--color-soft)] mt-0.5">
                        {relativeTime(d.sightedDate)}
                      </div>
                    </div>
                    <button
                      onClick={() => undo(d.id)}
                      aria-label={`Undo ${d.assetNumber}`}
                      className="p-1.5 rounded-lg text-[var(--color-soft)] hover:text-[var(--color-danger)] hover:bg-[var(--color-hairline)]/50 transition-colors"
                    >
                      <Trash size={14} weight="regular" />
                    </button>
                  </motion.li>
                ))}
              </AnimatePresence>
            </ul>
          )}
        </div>
      </div>

      <ScannerDebugOverlay
        open={debugOpen}
        keys={debugKeys}
        onClose={() => setDebugOpen(false)}
        onClear={() => setDebugKeys([])}
      />
    </div>
  );
}

type ScanCardProps = {
  tickKey: number;
  inputRef: RefObject<HTMLInputElement>;
  manual: boolean;
  manualRef: RefObject<HTMLInputElement>;
  manualValue: string;
  setManualValue: (v: string) => void;
  onToggleManual: () => void;
  onManualSubmit: (e: FormEvent) => void;
};

function ScanCard({
  tickKey,
  inputRef,
  manual,
  manualRef,
  manualValue,
  setManualValue,
  onToggleManual,
  onManualSubmit,
}: ScanCardProps) {
  return (
    <div className="relative">
      <div className="relative rounded-3xl border border-[var(--color-hairline)] bg-[var(--color-surface)] overflow-hidden">
        <div
          aria-hidden
          className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[var(--color-ink)]/20 to-transparent"
        />
        <div className="px-7 py-10 sm:px-10 sm:py-14 flex flex-col items-center text-center">
          <Reticle tickKey={tickKey} />
          <div className="mt-7">
            <div className="text-base sm:text-lg font-semibold tracking-tight">
              {manual ? "Type an asset number" : "Ready to scan"}
            </div>
            <div className="mt-1 text-sm text-[var(--color-muted)]">
              {manual ? (
                <>Press Enter or tap submit.</>
              ) : (
                <>Point the scanner at a barcode and pull the trigger.</>
              )}
            </div>
          </div>

          {!manual ? (
            <input
              ref={inputRef}
              autoFocus
              aria-label="Scanner input"
              className="absolute opacity-0 pointer-events-none"
              tabIndex={-1}
            />
          ) : (
            <form
              onSubmit={onManualSubmit}
              className="mt-6 w-full max-w-sm flex items-center gap-2"
            >
              <input
                ref={manualRef}
                value={manualValue}
                onChange={(e) => setManualValue(e.target.value)}
                placeholder="201000250"
                inputMode="numeric"
                autoFocus
                className="flex-1 h-11 rounded-xl border border-[var(--color-hairline)] bg-[var(--color-bg)] px-3.5 font-mono text-[14px] text-[var(--color-ink)] placeholder:text-[var(--color-soft)] focus:outline-none focus:border-[var(--color-ink)] focus:shadow-[0_0_0_3px_rgba(24,24,27,0.06)] transition-[border-color,box-shadow] duration-150"
              />
              <Button type="submit" variant="primary" size="md">
                Add
              </Button>
            </form>
          )}
        </div>
        <div className="border-t border-[var(--color-hairline)] flex items-center justify-between px-5 py-3">
          <div className="text-[11px] text-[var(--color-soft)] tracking-wide flex items-center gap-1.5">
            <span
              className={
                "h-1.5 w-1.5 rounded-full " +
                (manual
                  ? "bg-[var(--color-soft)]"
                  : "bg-[var(--color-accent)] animate-pulse")
              }
            />
            {manual ? "Manual entry" : "Listening for scanner"}
          </div>
          <button
            onClick={onToggleManual}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-[var(--color-muted)] hover:text-[var(--color-ink)] transition-colors px-2 py-1 rounded-md"
          >
            {manual ? (
              <>
                <Barcode size={14} weight="regular" />
                Use scanner
              </>
            ) : (
              <>
                <Keyboard size={14} weight="regular" />
                Type instead
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

function Reticle({ tickKey }: { tickKey: number }) {
  return (
    <div className="relative h-32 w-32">
      <motion.div
        aria-hidden
        animate={{ scale: [1, 1.06, 1], opacity: [0.55, 0.95, 0.55] }}
        transition={{
          duration: 2.4,
          repeat: Infinity,
          ease: [0.45, 0, 0.55, 1],
        }}
        className="absolute inset-0 rounded-full border border-[var(--color-hairline)]"
      />
      <div className="absolute inset-2 rounded-full border border-[var(--color-hairline)]/70" />
      <div className="absolute inset-0 grid place-items-center text-[var(--color-ink)]">
        <Barcode size={36} weight="regular" />
      </div>
      <AnimatePresence>
        {tickKey > 0 && (
          <motion.div
            key={tickKey}
            aria-hidden
            initial={{ opacity: 0.55, scale: 1 }}
            animate={{ opacity: 0, scale: 1.4 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.55, ease: [0.23, 1, 0.32, 1] }}
            className="absolute inset-0 rounded-full border border-[var(--color-accent)]"
          />
        )}
      </AnimatePresence>
      <span className="sr-only" aria-live="polite">
        {tickKey > 0 ? "Scan registered" : ""}
      </span>
    </div>
  );
}
