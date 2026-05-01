import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight } from "@phosphor-icons/react";
import { motion } from "framer-motion";
import { Field } from "../components/Field";
import { Button } from "../components/Button";
import { store, useStore } from "../lib/store";

export function Location() {
  const sticky = useStore((s) => s.stickyLocation);
  const nav = useNavigate();

  const [buildingName, setBuilding] = useState(sticky.buildingName);
  const [roomNumber, setRoom] = useState(sticky.roomNumber);
  const [personResponsible, setPerson] = useState(sticky.personResponsible);
  const [additionalNotes, setNotes] = useState(sticky.additionalNotes);
  const [touched, setTouched] = useState(false);

  const valid = buildingName.trim().length > 0 && roomNumber.trim().length > 0;

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    setTouched(true);
    if (!valid) return;
    store.setStickyLocation({
      buildingName: buildingName.trim(),
      roomNumber: roomNumber.trim(),
      personResponsible: personResponsible.trim(),
      additionalNotes: additionalNotes.trim(),
    });
    nav("/scan");
  };

  return (
    <div className="max-w-[720px] mx-auto px-6 sm:px-8 pt-8 sm:pt-12 pb-24">
      <button
        onClick={() => nav(-1)}
        className="inline-flex items-center gap-1.5 text-sm text-[var(--color-muted)] hover:text-[var(--color-ink)] transition-colors mb-6"
      >
        <ArrowLeft size={14} weight="bold" />
        Back
      </button>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.28, ease: [0.23, 1, 0.32, 1] }}
      >
        <div className="text-[11px] uppercase tracking-[0.18em] text-[var(--color-muted)] mb-3">
          Step 01 · Location
        </div>
        <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight leading-tight">
          Where are you scanning?
        </h1>
        <p className="mt-2 text-[15px] text-[var(--color-muted)] max-w-[52ch]">
          Every device you scan next will inherit these details. You can change
          location at any time.
        </p>
      </motion.div>

      <form onSubmit={onSubmit} className="mt-10 grid gap-5">
        <div className="grid sm:grid-cols-2 gap-5">
          <Field
            label="Building name"
            placeholder="e.g. Block D"
            value={buildingName}
            onChange={(e) => setBuilding(e.target.value)}
            error={touched && !buildingName.trim() ? "Required" : undefined}
            autoFocus
            required
          />
          <Field
            label="Room number / name"
            placeholder="e.g. 5 or Print room"
            value={roomNumber}
            onChange={(e) => setRoom(e.target.value)}
            error={touched && !roomNumber.trim() ? "Required" : undefined}
            required
          />
        </div>
        <Field
          label="Person responsible"
          placeholder="e.g. Person A"
          value={personResponsible}
          onChange={(e) => setPerson(e.target.value)}
          hint="Optional — fill in if known."
        />
        <Field
          label="Additional notes"
          placeholder="Anything that won't fit elsewhere"
          value={additionalNotes}
          onChange={(e) => setNotes(e.target.value)}
          multiline
        />

        <div className="flex items-center justify-end gap-3 mt-2">
          <Button type="button" variant="ghost" onClick={() => nav("/")}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="lg"
            disabled={!valid}
            trailing={<ArrowRight size={16} weight="bold" />}
          >
            Start scanning
          </Button>
        </div>
      </form>
    </div>
  );
}
