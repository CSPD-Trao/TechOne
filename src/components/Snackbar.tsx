import { AnimatePresence, motion } from "framer-motion";
import { X } from "@phosphor-icons/react";
import { dismissSnack, useSnacks } from "../lib/snackbar";

export function Snackbars() {
  const snacks = useSnacks();
  return (
    <div
      className="fixed inset-x-0 bottom-0 z-50 flex flex-col items-center gap-2 px-4 pb-4 pointer-events-none sm:items-start sm:pl-6"
      aria-live="polite"
    >
      <AnimatePresence initial={false}>
        {snacks.map((s) => {
          const tone = s.tone ?? "default";
          const toneCls =
            tone === "success"
              ? "border-[var(--color-accent)]/30 bg-[var(--color-accent-soft)]"
              : tone === "danger"
                ? "border-[var(--color-danger)]/30 bg-[#FEF2F2]"
                : "border-[var(--color-hairline)] bg-[var(--color-surface)]";
          return (
            <motion.div
              key={s.id}
              initial={{ opacity: 0, y: 16, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.98 }}
              transition={{ type: "spring", stiffness: 380, damping: 30 }}
              className={`pointer-events-auto w-full sm:max-w-md rounded-2xl border ${toneCls} shadow-[0_12px_32px_-16px_rgba(24,24,27,0.18)]`}
            >
              <div className="flex items-start gap-3 px-4 py-3">
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-[var(--color-ink)]">
                    {s.title}
                  </div>
                  {s.body && (
                    <div className="text-xs text-[var(--color-muted)] mt-0.5 break-words">
                      {s.body}
                    </div>
                  )}
                </div>
                {s.action && (
                  <button
                    onClick={() => {
                      s.action!.onClick();
                      dismissSnack(s.id);
                    }}
                    className="text-sm font-medium text-[var(--color-ink)] hover:underline px-1 py-0.5 rounded transition-transform active:scale-[0.97]"
                  >
                    {s.action.label}
                  </button>
                )}
                <button
                  onClick={() => dismissSnack(s.id)}
                  aria-label="Dismiss"
                  className="-mr-1 -mt-1 p-1 rounded-md text-[var(--color-soft)] hover:text-[var(--color-ink)] hover:bg-[var(--color-hairline)]/50 transition-colors"
                >
                  <X size={14} weight="bold" />
                </button>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
