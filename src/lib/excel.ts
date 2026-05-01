import * as XLSX from "xlsx";
import type { Device } from "./types";

const HEADERS = [
  "Asset Number",
  "Sighted Date",
  "Building Name",
  "Room Number/Name",
  "Person Responsible",
  "Additional Notes",
];

export function exportFilename(now = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  const y = now.getFullYear();
  const mo = pad(now.getMonth() + 1);
  const d = pad(now.getDate());
  const h = pad(now.getHours());
  const mi = pad(now.getMinutes());
  return `Stocktake_${y}-${mo}-${d}_${h}-${mi}.xlsx`;
}

export function exportDevices(devices: Device[]): string {
  const ordered = [...devices].sort((a, b) => {
    const cmp = a.buildingName.localeCompare(b.buildingName);
    if (cmp !== 0) return cmp;
    const room = a.roomNumber.localeCompare(b.roomNumber);
    if (room !== 0) return room;
    return a.sightedDate.localeCompare(b.sightedDate);
  });

  const rows = ordered.map((d) => [
    d.assetNumber,
    new Date(d.sightedDate).toLocaleString(),
    d.buildingName,
    d.roomNumber,
    d.personResponsible,
    d.additionalNotes,
  ]);

  const ws = XLSX.utils.aoa_to_sheet([HEADERS, ...rows]);
  ws["!cols"] = [
    { wch: 14 },
    { wch: 22 },
    { wch: 18 },
    { wch: 16 },
    { wch: 20 },
    { wch: 28 },
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Scanning Sheet");

  const filename = exportFilename();
  XLSX.writeFile(wb, filename);
  return filename;
}
