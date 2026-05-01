export type ScannerOptions = {
  onScan: (raw: string) => void;
  onKeystroke?: (info: { key: string; code: string; gapMs: number }) => void;
  pauseMs?: number;
  minLength?: number;
};

export function attachScannerInput(
  input: HTMLInputElement,
  opts: ScannerOptions,
): () => void {
  const pauseMs = opts.pauseMs ?? 250;
  const minLength = opts.minLength ?? 3;
  let buffer = "";
  let lastKeyAt = 0;

  const onKey = (e: KeyboardEvent) => {
    const now = performance.now();
    const gap = lastKeyAt === 0 ? 0 : now - lastKeyAt;
    if (gap > pauseMs) buffer = "";
    lastKeyAt = now;

    opts.onKeystroke?.({ key: e.key, code: e.code, gapMs: Math.round(gap) });

    if (e.key === "Enter") {
      const value = buffer;
      buffer = "";
      e.preventDefault();
      if (value.length >= minLength) opts.onScan(value);
      return;
    }
    if (e.key === "Tab") {
      const value = buffer;
      buffer = "";
      e.preventDefault();
      if (value.length >= minLength) opts.onScan(value);
      return;
    }
    if (e.key.length === 1) {
      buffer += e.key;
    }
  };

  const refocus = () => {
    requestAnimationFrame(() => input.focus());
  };

  input.addEventListener("keydown", onKey);
  input.addEventListener("blur", refocus);

  return () => {
    input.removeEventListener("keydown", onKey);
    input.removeEventListener("blur", refocus);
  };
}
