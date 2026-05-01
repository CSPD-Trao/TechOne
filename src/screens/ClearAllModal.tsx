import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Warning } from "@phosphor-icons/react";
import { Button } from "../components/Button";

type Props = {
  open: boolean;
  count: number;
  onCancel: () => void;
  onConfirm: () => void;
};

export function ClearAllModal({ open, count, onCancel, onConfirm }: Props) {
  const [text, setText] = useState("");

  useEffect(() => {
    if (!open) setText("");
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onCancel]);

  const valid = text.trim().toUpperCase() === "CLEAR";

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-end sm:items-center sm:justify-center bg-[var(--color-ink)]/40 backdrop-blur-[2px]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          onClick={onCancel}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="clear-title"
            initial={{ y: 32, opacity: 0, scale: 0.97 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 16, opacity: 0, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 320, damping: 30 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full sm:max-w-md bg-[var(--color-surface)] border border-[var(--color-hairline)] rounded-t-3xl sm:rounded-3xl p-6 shadow-[0_24px_48px_-20px_rgba(24,24,27,0.25)]"
          >
            <div className="flex items-start gap-3">
              <span className="grid place-items-center h-10 w-10 rounded-xl bg-[#FEF2F2] text-[var(--color-danger)] shrink-0">
                <Warning size={20} weight="regular" />
              </span>
              <div>
                <h2
                  id="clear-title"
                  className="text-base font-semibold tracking-tight"
                >
                  Clear all devices?
                </h2>
                <p className="text-sm text-[var(--color-muted)] mt-1">
                  This permanently removes the {count} scanned device
                  {count === 1 ? "" : "s"} from this browser. Make sure you have
                  exported the Excel file first.
                </p>
              </div>
            </div>
            <label className="mt-5 block text-xs text-[var(--color-muted)]">
              Type <span className="font-mono text-[var(--color-ink)]">CLEAR</span> to confirm
              <input
                value={text}
                onChange={(e) => setText(e.target.value)}
                autoFocus
                className="mt-1.5 w-full rounded-xl border border-[var(--color-hairline)] bg-[var(--color-bg)] px-3.5 py-2.5 font-mono text-[14px] text-[var(--color-ink)] focus:outline-none focus:border-[var(--color-ink)] focus:shadow-[0_0_0_3px_rgba(24,24,27,0.06)] transition-[border-color,box-shadow] duration-150"
              />
            </label>
            <div className="mt-5 flex items-center justify-end gap-2">
              <Button variant="ghost" onClick={onCancel}>
                Cancel
              </Button>
              <Button
                variant="danger"
                onClick={onConfirm}
                disabled={!valid}
              >
                Clear all
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
