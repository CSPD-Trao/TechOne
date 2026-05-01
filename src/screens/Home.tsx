import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Barcode,
  DownloadSimple,
  ListBullets,
  MapPin,
} from "@phosphor-icons/react";
import { useStore } from "../lib/store";
import { exportDevices } from "../lib/excel";
import { showSnack } from "../lib/snackbar";
import { Button } from "../components/Button";
import { relativeTime } from "../lib/format";
import { useEffect, useState } from "react";
import type { ReactNode } from "react";

export function Home() {
  const devices = useStore((s) => s.devices);
  const sticky = useStore((s) => s.stickyLocation);
  const nav = useNavigate();
  const hasDevices = devices.length > 0;
  const lastScan = devices[0];
  const stickyComplete = sticky.buildingName && sticky.roomNumber;

  const [, force] = useState(0);
  useEffect(() => {
    if (!lastScan) return;
    const t = setInterval(() => force((n) => n + 1), 30_000);
    return () => clearInterval(t);
  }, [lastScan]);

  const onDownload = () => {
    if (!hasDevices) return;
    try {
      const filename = exportDevices(devices);
      showSnack({
        title: "Saved to Downloads",
        body: filename,
        tone: "success",
        durationMs: 4500,
      });
    } catch (err) {
      showSnack({
        title: "Export failed",
        body: err instanceof Error ? err.message : "Unknown error",
        tone: "danger",
      });
    }
  };

  return (
    <div className="max-w-[1100px] mx-auto px-6 sm:px-8 pt-10 sm:pt-16 pb-24">
      <div className="grid md:grid-cols-[1.1fr_0.9fr] gap-x-12 gap-y-8 items-end">
        <div>
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.32, ease: [0.23, 1, 0.32, 1] }}
          >
            <div className="text-[11px] uppercase tracking-[0.18em] text-[var(--color-muted)] mb-3">
              Asset Stocktake
            </div>
            <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight leading-[1.05] text-[var(--color-ink)]">
              Sweep a room.
              <br />
              <span className="text-[var(--color-muted)]">
                Skip the spreadsheet.
              </span>
            </h1>
            <p className="mt-4 text-[15px] text-[var(--color-muted)] max-w-[44ch] leading-relaxed">
              Set the location once, scan every asset in the room, and export a
              ready-to-send Excel file when you&rsquo;re done.
            </p>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.32, delay: 0.06, ease: [0.23, 1, 0.32, 1] }}
          className="border-t border-[var(--color-hairline)] md:border-none pt-6 md:pt-0"
        >
          <div className="grid grid-cols-2 gap-x-6 gap-y-4">
            <Stat label="Devices" value={String(devices.length)} />
            <Stat
              label="Last scan"
              value={lastScan ? relativeTime(lastScan.sightedDate) : "—"}
            />
            <Stat
              label="Current location"
              value={
                stickyComplete
                  ? `${sticky.buildingName} · ${sticky.roomNumber}`
                  : "Not set"
              }
              span
            />
          </div>
        </motion.div>
      </div>

      <div className="mt-12 grid md:grid-cols-[1.15fr_0.85fr] gap-4">
        <ActionTile
          to="/location"
          accent
          eyebrow="01"
          title="Add device"
          body="Pick a building and room, then scan as many barcodes as you like."
          icon={<Barcode size={28} weight="regular" />}
        />
        <ActionTile
          as="button"
          onClick={onDownload}
          disabled={!hasDevices}
          eyebrow="02"
          title="Download Excel"
          body={
            hasDevices
              ? `Export ${devices.length} device${devices.length === 1 ? "" : "s"} as .xlsx.`
              : "Add at least one device to enable export."
          }
          icon={<DownloadSimple size={28} weight="regular" />}
        />
      </div>

      <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-3">
        <Link
          to="/list"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-[var(--color-muted)] hover:text-[var(--color-ink)] transition-colors"
        >
          <ListBullets size={16} weight="regular" />
          View all devices
        </Link>
        <span aria-hidden className="text-[var(--color-soft)]">
          ·
        </span>
        <button
          onClick={() => nav("/location")}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-[var(--color-muted)] hover:text-[var(--color-ink)] transition-colors"
        >
          <MapPin size={16} weight="regular" />
          {stickyComplete ? "Change location" : "Set a location"}
        </button>
      </div>

      {!hasDevices && stickyComplete && (
        <div className="mt-8">
          <Button
            variant="primary"
            size="md"
            onClick={() => nav("/scan")}
            trailing={<ArrowRight size={16} weight="bold" />}
          >
            Resume scanning at {sticky.buildingName} · {sticky.roomNumber}
          </Button>
        </div>
      )}
    </div>
  );
}

function Stat({
  label,
  value,
  span,
}: {
  label: string;
  value: string;
  span?: boolean;
}) {
  return (
    <div className={span ? "col-span-2" : ""}>
      <div className="text-[11px] uppercase tracking-[0.16em] text-[var(--color-soft)]">
        {label}
      </div>
      <div className="mt-1 text-[15px] font-medium text-[var(--color-ink)] truncate">
        {value}
      </div>
    </div>
  );
}

type TileProps = {
  eyebrow: string;
  title: string;
  body: string;
  icon: ReactNode;
  accent?: boolean;
} & (
  | { to: string; as?: undefined; onClick?: never; disabled?: never }
  | {
      as: "button";
      to?: undefined;
      onClick: () => void;
      disabled?: boolean;
    }
);

function ActionTile(props: TileProps) {
  const isLink = "to" in props && props.to !== undefined;
  const tileClass =
    "group relative flex flex-col justify-between gap-10 rounded-3xl px-6 py-7 sm:px-8 sm:py-8 " +
    "border transition-[transform,border-color,background-color,box-shadow] duration-200 ease-[var(--ease-out)] " +
    "active:scale-[0.985] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ink)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-bg)] " +
    (props.accent
      ? "bg-[var(--color-ink)] text-[var(--color-bg)] border-[var(--color-ink)] " +
        "shadow-[0_18px_40px_-22px_rgba(24,24,27,0.55)] hover:shadow-[0_22px_48px_-22px_rgba(24,24,27,0.7)]"
      : "bg-[var(--color-surface)] text-[var(--color-ink)] border-[var(--color-hairline)] " +
        "hover:border-[var(--color-ink)] disabled:opacity-50 disabled:hover:border-[var(--color-hairline)] disabled:active:scale-100");

  const inner = (
    <>
      <div className="flex items-start justify-between">
        <span
          className={
            "text-[11px] tracking-[0.18em] uppercase " +
            (props.accent
              ? "text-[var(--color-bg)]/55"
              : "text-[var(--color-soft)]")
          }
        >
          {props.eyebrow}
        </span>
        <span
          className={
            "rounded-xl border p-2 transition-transform duration-200 ease-[var(--ease-out)] group-hover:rotate-[-4deg] " +
            (props.accent
              ? "border-[var(--color-bg)]/15 text-[var(--color-bg)]"
              : "border-[var(--color-hairline)] text-[var(--color-ink)]")
          }
        >
          {props.icon}
        </span>
      </div>
      <div>
        <div className="text-[26px] sm:text-[28px] font-semibold tracking-tight leading-tight">
          {props.title}
        </div>
        <div
          className={
            "mt-2 text-sm leading-relaxed max-w-[36ch] " +
            (props.accent
              ? "text-[var(--color-bg)]/70"
              : "text-[var(--color-muted)]")
          }
        >
          {props.body}
        </div>
        <div
          className={
            "mt-5 inline-flex items-center gap-1.5 text-sm font-medium " +
            (props.accent
              ? "text-[var(--color-bg)]"
              : "text-[var(--color-ink)]")
          }
        >
          {isLink || (props as { as?: string }).as === "button" ? (
            <>
              <span>Continue</span>
              <ArrowRight
                size={14}
                weight="bold"
                className="transition-transform duration-200 ease-[var(--ease-out)] group-hover:translate-x-0.5"
              />
            </>
          ) : null}
        </div>
      </div>
    </>
  );

  if (isLink) {
    return (
      <Link to={(props as { to: string }).to} className={tileClass}>
        {inner}
      </Link>
    );
  }
  const { onClick, disabled } = props as {
    onClick: () => void;
    disabled?: boolean;
  };
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${tileClass} text-left`}
    >
      {inner}
    </button>
  );
}
