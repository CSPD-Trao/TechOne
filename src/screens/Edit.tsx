import { FormEvent, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Check, Trash } from "@phosphor-icons/react";
import { motion } from "framer-motion";
import { Button } from "../components/Button";
import { Field } from "../components/Field";
import { store, useStore } from "../lib/store";
import { showSnack } from "../lib/snackbar";
import { exactTime } from "../lib/format";

export function Edit() {
  const { id = "" } = useParams<{ id: string }>();
  const device = useStore((s) => s.devices.find((d) => d.id === id));
  const nav = useNavigate();

  const [assetNumber, setAsset] = useState("");
  const [buildingName, setBuilding] = useState("");
  const [roomNumber, setRoom] = useState("");
  const [personResponsible, setPerson] = useState("");
  const [additionalNotes, setNotes] = useState("");
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    if (!device) return;
    setAsset(device.assetNumber);
    setBuilding(device.buildingName);
    setRoom(device.roomNumber);
    setPerson(device.personResponsible);
    setNotes(device.additionalNotes);
  }, [device]);

  if (!device) {
    return (
      <div className="max-w-[720px] mx-auto px-6 sm:px-8 pt-12 pb-24">
        <button
          onClick={() => nav("/list")}
          className="inline-flex items-center gap-1.5 text-sm text-[var(--color-muted)] hover:text-[var(--color-ink)] mb-4"
        >
          <ArrowLeft size={14} weight="bold" />
          Back to list
        </button>
        <h1 className="text-2xl font-semibold tracking-tight">
          Device not found
        </h1>
        <p className="mt-2 text-[var(--color-muted)]">
          It may have been deleted from another tab.
        </p>
      </div>
    );
  }

  const valid =
    assetNumber.trim().length > 0 &&
    buildingName.trim().length > 0 &&
    roomNumber.trim().length > 0;

  const onSave = (e: FormEvent) => {
    e.preventDefault();
    setTouched(true);
    if (!valid) return;
    store.updateDevice(device.id, {
      assetNumber: assetNumber.trim(),
      buildingName: buildingName.trim(),
      roomNumber: roomNumber.trim(),
      personResponsible: personResponsible.trim(),
      additionalNotes: additionalNotes.trim(),
    });
    showSnack({ title: "Saved", tone: "success", durationMs: 2500 });
    nav("/list");
  };

  const onDelete = () => {
    const snapshot = device;
    store.removeDevice(device.id);
    showSnack({
      title: `Removed ${snapshot.assetNumber}`,
      tone: "default",
      durationMs: 5000,
      action: {
        label: "Undo",
        onClick: () => store.restoreDevice(snapshot),
      },
    });
    nav("/list");
  };

  return (
    <div className="max-w-[820px] mx-auto px-6 sm:px-8 pt-8 sm:pt-12 pb-32">
      <button
        onClick={() => nav("/list")}
        className="inline-flex items-center gap-1.5 text-sm text-[var(--color-muted)] hover:text-[var(--color-ink)] transition-colors mb-6"
      >
        <ArrowLeft size={14} weight="bold" />
        Back to list
      </button>

      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.24, ease: [0.23, 1, 0.32, 1] }}
      >
        <div className="text-[11px] uppercase tracking-[0.18em] text-[var(--color-muted)] mb-2">
          Edit device
        </div>
        <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight">
          {device.assetNumber}
        </h1>
        <p className="mt-1 text-sm text-[var(--color-muted)]">
          Sighted {exactTime(device.sightedDate)}
        </p>
      </motion.div>

      <form onSubmit={onSave} className="mt-10 grid gap-5">
        <Field
          label="Asset number"
          value={assetNumber}
          onChange={(e) => setAsset(e.target.value)}
          error={touched && !assetNumber.trim() ? "Required" : undefined}
          required
          className="font-mono"
        />
        <div className="grid sm:grid-cols-2 gap-5">
          <Field
            label="Building name"
            value={buildingName}
            onChange={(e) => setBuilding(e.target.value)}
            error={touched && !buildingName.trim() ? "Required" : undefined}
            required
          />
          <Field
            label="Room number / name"
            value={roomNumber}
            onChange={(e) => setRoom(e.target.value)}
            error={touched && !roomNumber.trim() ? "Required" : undefined}
            required
          />
        </div>
        <Field
          label="Person responsible"
          value={personResponsible}
          onChange={(e) => setPerson(e.target.value)}
        />
        <Field
          label="Additional notes"
          value={additionalNotes}
          onChange={(e) => setNotes(e.target.value)}
          multiline
        />

        <div className="flex items-center justify-between gap-3 mt-2">
          <Button
            type="button"
            variant="ghost"
            onClick={onDelete}
            leading={<Trash size={14} weight="regular" />}
          >
            Delete
          </Button>
          <div className="flex items-center gap-2">
            <Button type="button" variant="ghost" onClick={() => nav("/list")}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={!valid}
              leading={<Check size={16} weight="bold" />}
            >
              Save changes
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
