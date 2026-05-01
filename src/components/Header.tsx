import { Link, useLocation } from "react-router-dom";

export function Header() {
  const loc = useLocation();
  const onHome = loc.pathname === "/" || loc.pathname === "";
  return (
    <header className="border-b border-[var(--color-hairline)]/70">
      <div className="max-w-[1100px] mx-auto px-6 sm:px-8 h-16 flex items-center justify-between">
        <Link
          to="/"
          className="flex items-center gap-2.5 group"
          aria-label="Stocktake home"
        >
          <span
            aria-hidden
            className="grid place-items-center h-8 w-8 rounded-lg bg-[var(--color-ink)] text-[var(--color-bg)]"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <g stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
                <line x1="3" y1="3" x2="3" y2="13" />
                <line x1="5.5" y1="3" x2="5.5" y2="13" />
                <line x1="8" y1="3" x2="8" y2="13" />
                <line x1="10.5" y1="3" x2="10.5" y2="13" />
                <line x1="13" y1="3" x2="13" y2="13" />
              </g>
            </svg>
          </span>
          <span className="font-semibold tracking-tight text-[15px]">
            Stocktake
          </span>
        </Link>
        {!onHome && (
          <Link
            to="/"
            className="text-sm text-[var(--color-muted)] hover:text-[var(--color-ink)] transition-colors"
          >
            Home
          </Link>
        )}
      </div>
    </header>
  );
}
