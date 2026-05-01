import type { ReactNode } from "react";

type Props = {
  icon: ReactNode;
  title: string;
  body?: string;
  action?: ReactNode;
};

export function EmptyState({ icon, title, body, action }: Props) {
  return (
    <div className="w-full flex flex-col items-center text-center py-16 px-6">
      <div className="relative mb-5">
        <div
          aria-hidden
          className="absolute inset-0 -m-3 rounded-full bg-[var(--color-hairline)]/40 blur-md"
        />
        <div className="relative h-16 w-16 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-hairline)] flex items-center justify-center text-[var(--color-muted)]">
          {icon}
        </div>
      </div>
      <h3 className="text-lg font-semibold tracking-tight text-[var(--color-ink)]">
        {title}
      </h3>
      {body && (
        <p className="mt-1.5 text-sm text-[var(--color-muted)] max-w-[42ch]">
          {body}
        </p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
