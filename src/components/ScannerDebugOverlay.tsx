import { AnimatePresence, motion } from "framer-motion";
import { X } from "@phosphor-icons/react";

export type DebugKey = { key: string; code: string; gapMs: number; t: number };

type Props = {
  open: boolean;
  keys: DebugKey[];
  onClose: () => void;
  onClear: () => void;
};

function pretty(k: DebugKey) {
  if (k.key === " ") return "Space";
  if (k.key.length === 1) return k.key;
  return k.key;
}

export function ScannerDebugOverlay({ open, keys, onClose, onClear }: Props) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-40 flex items-end sm:items-center sm:justify-center bg-[var(--color-ink)]/30 backdrop-blur-[2px]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          onClick={onClose}
        >
          <motion.div
            role="dialog"
            aria-label="Scanner debug"
            className="w-full sm:max-w-lg bg-[var(--color-surface)] border border-[var(--color-hairline)] rounded-t-3xl sm:rounded-3xl p-5 shadow-[0_24px_48px_-20px_rgba(24,24,27,0.25)]"
            initial={{ y: 32, opacity: 0, scale: 0.98 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 16, opacity: 0, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 320, damping: 30 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4 mb-3">
              <div>
                <div className="text-base font-semibold tracking-tight">
                  Scanner debug
                </div>
                <div className="text-xs text-[var(--color-muted)] mt-1 max-w-[42ch]">
                  Scan one barcode and watch the keystrokes. A normal HID
                  scanner sends digits, then <span className="font-mono">Enter</span>.
                </div>
              </div>
              <button
                onClick={onClose}
                aria-label="Close"
                className="p-1.5 rounded-lg text-[var(--color-soft)] hover:text-[var(--color-ink)] hover:bg-[var(--color-hairline)]/50 transition-colors"
              >
                <X size={16} weight="bold" />
              </button>
            </div>
            <div className="rounded-xl border border-[var(--color-hairline)] bg-[var(--color-bg)] font-mono text-[12px] text-[var(--color-ink)] max-h-56 overflow-auto">
              {keys.length === 0 ? (
                <div className="px-3 py-6 text-center text-[var(--color-soft)]">
                  Waiting for keystrokes&hellip;
                </div>
              ) : (
                <ul className="divide-y divide-[var(--color-hairline)]">
                  {keys.map((k, i) => (
                    <li
                      key={i}
                      className="grid grid-cols-[1fr_auto_auto] gap-3 px-3 py-1.5"
                    >
                      <span className="truncate">{pretty(k)}</span>
                      <span className="text-[var(--color-soft)]">{k.code}</span>
                      <span className="text-[var(--color-soft)] tabular-nums">
                        {k.gapMs}ms
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div className="flex items-center justify-between mt-3">
              <div className="text-[11px] text-[var(--color-soft)]">
                {keys.length} key{keys.length === 1 ? "" : "s"}
              </div>
              <button
                onClick={onClear}
                className="text-xs font-medium text-[var(--color-muted)] hover:text-[var(--color-ink)] underline-offset-2 hover:underline"
              >
                Clear
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
