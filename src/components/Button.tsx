import { forwardRef } from "react";
import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
  leading?: ReactNode;
  trailing?: ReactNode;
};

const base =
  "inline-flex items-center justify-center gap-2 rounded-xl font-medium select-none " +
  "transition-[transform,background-color,border-color,color,box-shadow] duration-150 " +
  "ease-[var(--ease-out)] active:scale-[0.97] " +
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ink)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-bg)] " +
  "disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100";

const sizes: Record<Size, string> = {
  sm: "h-9 px-3 text-sm",
  md: "h-11 px-4 text-[15px]",
  lg: "h-14 px-6 text-base",
};

const variants: Record<Variant, string> = {
  primary:
    "bg-[var(--color-ink)] text-[var(--color-bg)] hover:bg-[#27272A] " +
    "shadow-[0_4px_12px_-6px_rgba(24,24,27,0.4)]",
  secondary:
    "bg-[var(--color-surface)] text-[var(--color-ink)] border border-[var(--color-hairline)] " +
    "hover:border-[var(--color-ink)]",
  ghost:
    "bg-transparent text-[var(--color-muted)] hover:text-[var(--color-ink)] hover:bg-[var(--color-hairline)]/40",
  danger:
    "bg-[var(--color-danger)] text-white hover:bg-[#991B1B] " +
    "shadow-[0_4px_12px_-6px_rgba(185,28,28,0.4)]",
};

export const Button = forwardRef<HTMLButtonElement, Props>(function Button(
  { variant = "secondary", size = "md", leading, trailing, className, children, ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      className={`${base} ${sizes[size]} ${variants[variant]} ${className ?? ""}`}
      {...rest}
    >
      {leading}
      {children}
      {trailing}
    </button>
  );
});
