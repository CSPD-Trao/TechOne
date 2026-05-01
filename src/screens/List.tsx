import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  Barcode,
  Buildings,
  DownloadSimple,
  PencilSimple,
  Plus,
  Trash,
} from "@phosphor-icons/react";
import { Button } from "../components/Button";
import { EmptyState } from "../components/EmptyState";
import { ClearAllModal } from "./ClearAllModal";
import { store, useStore } from "../lib/store";
import { exportDevices } from "../lib/excel";
import { exactTime, relativeTime } from "../lib/format";
import { showSnack } from "../lib/snackbar";
import type { Device } from "../lib/types";

type Group = {
  building: string;
  rooms: { room: string; devices: Device[] }[];
};

function groupDevices(devices: Device[]): Group[] {
  const byBuilding = new Map<string, Map<string, Device[]>>();
  for (const d of devices) {
    const b = d.buildingName || "Unspecified";
    const r = d.roomNumber || "Unspecified";
    if (!byBuilding.has(b)) byBuilding.set(b, new Map());
    const inner = byBuilding.get(b)!;
    if (!inner.has(r)) inner.set(r, []);
    inner.get(r)!.push(d);
  }
  return [...byBuilding.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([building, roomMap]) => ({
      building,
      rooms: [...roomMap.entries()]
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([room, devs]) => ({
          room,
          devices: devs.sort((a, b) =>
            b.sightedDate.localeCompare(a.sightedDate),
          ),
        })),
    }));
}

export function List() {
  const devices = useStore((s) => s.devices);
  const nav = useNavigate();
  const [confirmClear, setConfirmClear] = useState(false);

  const groups = useMemo(() => groupDevices(devices), [devices]);

  const onDownload = () => {
    if (devices.length === 0) return;
    try {
      const filename = exportDevices(devices);
      showSnack({
        title: "Saved to Downloads",
        body: filename,
        tone: "success",
      });
    } catch (err) {
      showSnack({
        title: "Export failed",
        body: err instanceof Error ? err.message : "Unknown error",
        tone: "danger",
      });
    }
  };

  const remove = (d: Device) => {
    store.removeDevice(d.id);
    showSnack({
      title: `Removed ${d.assetNumber}`,
      tone: "default",
      durationMs: 5000,
      action: {
        label: "Undo",
        onClick: () => store.restoreDevice(d),
      },
    });
  };

  return (
    <div className="max-w-[1100px] mx-auto px-6 sm:px-8 pt-6 sm:pt-10 pb-32">
      <button
        onClick={() => nav("/")}
        className="inline-flex items-center gap-1.5 text-sm text-[var(--color-muted)] hover:text-[var(--color-ink)] transition-colors mb-6"
      >
        <ArrowLeft size={14} weight="bold" />
        Home
      </button>

      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <div className="text-[11px] uppercase tracking-[0.18em] text-[var(--color-muted)] mb-2">
            All devices
          </div>
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight">
            {devices.length}{" "}
            <span className="text-[var(--color-muted)] font-normal">
              {devices.length === 1 ? "device" : "devices"}
            </span>
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            onClick={() => setConfirmClear(true)}
            disabled={devices.length === 0}
          >
            Clear all
          </Button>
          <Button
            variant="primary"
            onClick={onDownload}
            disabled={devices.length === 0}
            leading={<DownloadSimple size={16} weight="regular" />}
          >
            Download Excel
          </Button>
        </div>
      </div>

      <div className="mt-10">
        {devices.length === 0 ? (
          <EmptyState
            icon={<Barcode size={28} weight="regular" />}
            title="No devices yet"
            body="Set a location, then scan a few barcodes. Your list will build up here."
            action={
              <Button
                variant="primary"
                size="md"
                onClick={() => nav("/location")}
                leading={<Plus size={16} weight="bold" />}
              >
                Add device
              </Button>
            }
          />
        ) : (
          <div className="space-y-12">
            {groups.map((g) => (
              <section key={g.building}>
                <div className="flex items-center gap-2.5 border-t border-[var(--color-hairline)] pt-4 pb-2">
                  <Buildings
                    size={14}
                    weight="regular"
                    className="text-[var(--color-muted)]"
                  />
                  <h2 className="text-sm font-semibold tracking-tight">
                    {g.building}
                  </h2>
                </div>
                {g.rooms.map((r) => (
                  <RoomBlock
                    key={`${g.building}-${r.room}`}
                    room={r.room}
                    devices={r.devices}
                    onEdit={(d) => nav(`/edit/${d.id}`)}
                    onDelete={remove}
                  />
                ))}
              </section>
            ))}
          </div>
        )}
      </div>

      <div className="mt-12">
        <Link
          to="/location"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-[var(--color-muted)] hover:text-[var(--color-ink)] transition-colors"
        >
          <Plus size={14} weight="bold" />
          Add another batch
        </Link>
      </div>

      <ClearAllModal
        open={confirmClear}
        count={devices.length}
        onCancel={() => setConfirmClear(false)}
        onConfirm={() => {
          store.clearAll();
          setConfirmClear(false);
          showSnack({
            title: "All devices cleared",
            tone: "default",
            durationMs: 4000,
          });
        }}
      />
    </div>
  );
}

function RoomBlock({
  room,
  devices,
  onEdit,
  onDelete,
}: {
  room: string;
  devices: Device[];
  onEdit: (d: Device) => void;
  onDelete: (d: Device) => void;
}) {
  return (
    <div className="mt-4">
      <div className="flex items-baseline justify-between mb-2 px-1">
        <div className="text-xs text-[var(--color-muted)] tracking-wide">
          Room <span className="text-[var(--color-ink)]">{room}</span>
        </div>
        <div className="text-[11px] text-[var(--color-soft)] tabular-nums">
          {devices.length} {devices.length === 1 ? "device" : "devices"}
        </div>
      </div>
      <ul className="divide-y divide-[var(--color-hairline)] border border-[var(--color-hairline)] rounded-2xl bg-[var(--color-surface)] overflow-hidden">
        <AnimatePresence initial={false}>
          {devices.map((d) => (
            <motion.li
              key={d.id}
              layout
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
              className="group grid grid-cols-[auto_1fr_auto] items-center gap-4 px-4 py-3 hover:bg-[var(--color-hairline)]/30 transition-colors"
            >
              <span
                aria-hidden
                className="grid place-items-center h-8 w-8 rounded-md bg-[var(--color-bg)] text-[var(--color-muted)]"
              >
                <Barcode size={14} weight="regular" />
              </span>
              <div className="min-w-0">
                <div className="font-mono text-[13px] text-[var(--color-ink)] truncate">
                  {d.assetNumber}
                </div>
                <div
                  className="text-[11px] text-[var(--color-soft)] mt-0.5 truncate"
                  title={exactTime(d.sightedDate)}
                >
                  {relativeTime(d.sightedDate)}
                  {d.personResponsible
                    ? ` · ${d.personResponsible}`
                    : ""}
                  {d.additionalNotes ? ` · ${d.additionalNotes}` : ""}
                </div>
              </div>
              <div className="flex items-center gap-1 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => onEdit(d)}
                  aria-label={`Edit ${d.assetNumber}`}
                  className="p-2 rounded-lg text-[var(--color-muted)] hover:text-[var(--color-ink)] hover:bg-[var(--color-hairline)]/60 transition-colors"
                >
                  <PencilSimple size={14} weight="regular" />
                </button>
                <button
                  onClick={() => onDelete(d)}
                  aria-label={`Delete ${d.assetNumber}`}
                  className="p-2 rounded-lg text-[var(--color-muted)] hover:text-[var(--color-danger)] hover:bg-[var(--color-hairline)]/60 transition-colors"
                >
                  <Trash size={14} weight="regular" />
                </button>
              </div>
            </motion.li>
          ))}
        </AnimatePresence>
      </ul>
    </div>
  );
}
