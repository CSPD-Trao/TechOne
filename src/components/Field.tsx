import { forwardRef, useId } from "react";
import type { InputHTMLAttributes, Ref, TextareaHTMLAttributes } from "react";

type CommonProps = {
  label: string;
  hint?: string;
  error?: string;
  required?: boolean;
};

type InputProps = CommonProps &
  Omit<InputHTMLAttributes<HTMLInputElement>, "size"> & {
    multiline?: false;
  };

type TextareaProps = CommonProps &
  TextareaHTMLAttributes<HTMLTextAreaElement> & {
    multiline: true;
  };

type Props = InputProps | TextareaProps;

const fieldBase =
  "w-full rounded-xl bg-[var(--color-surface)] border border-[var(--color-hairline)] " +
  "px-3.5 py-2.5 text-[15px] text-[var(--color-ink)] placeholder:text-[var(--color-soft)] " +
  "transition-[border-color,box-shadow] duration-150 ease-[var(--ease-out)] " +
  "focus:outline-none focus:border-[var(--color-ink)] focus:shadow-[0_0_0_3px_rgba(24,24,27,0.06)]";

export const Field = forwardRef<HTMLInputElement | HTMLTextAreaElement, Props>(
  function Field(props, ref) {
    const id = useId();
    const { label, hint, error, required, className, multiline, ...rest } =
      props as Props & { multiline?: boolean };
    const errorId = error ? `${id}-err` : undefined;
    const hintId = hint ? `${id}-hint` : undefined;

    return (
      <label htmlFor={id} className="flex flex-col gap-1.5 group">
        <span className="text-sm font-medium text-[var(--color-muted)] flex items-center gap-1">
          {label}
          {required && (
            <span className="text-[var(--color-accent)] text-xs">*</span>
          )}
        </span>
        {multiline ? (
          <textarea
            id={id}
            ref={ref as Ref<HTMLTextAreaElement>}
            aria-invalid={Boolean(error)}
            aria-describedby={errorId ?? hintId}
            className={`${fieldBase} min-h-[80px] resize-y ${error ? "border-[var(--color-danger)]" : ""} ${className ?? ""}`}
            {...(rest as TextareaHTMLAttributes<HTMLTextAreaElement>)}
          />
        ) : (
          <input
            id={id}
            ref={ref as Ref<HTMLInputElement>}
            aria-invalid={Boolean(error)}
            aria-describedby={errorId ?? hintId}
            className={`${fieldBase} ${error ? "border-[var(--color-danger)]" : ""} ${className ?? ""}`}
            {...(rest as InputHTMLAttributes<HTMLInputElement>)}
          />
        )}
        {error ? (
          <span id={errorId} className="text-xs text-[var(--color-danger)]">
            {error}
          </span>
        ) : hint ? (
          <span id={hintId} className="text-xs text-[var(--color-soft)]">
            {hint}
          </span>
        ) : null}
      </label>
    );
  },
);
