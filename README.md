# Stocktake

A small web app for school asset stocktake driven by a USB barcode scanner. Replaces the manual Excel "Scanning Sheet" workflow.

- Set a building / room / person once.
- Pull the trigger on the scanner — every scan becomes a row in the same browser.
- Click **Download Excel** when you're done. The file matches the columns the TechOne School Accounting team expects.

All data lives in the browser's `localStorage`. Nothing is uploaded anywhere.

## Run locally

```bash
npm install
npm run dev
```

Open the printed URL (default `http://localhost:5173`).

## Use it

1. **Add device** → enter the location once.
2. On the Scan screen, click anywhere in the page so the input is focused, then pull the trigger on the scanner. The "Listening for scanner" indicator pulses green when ready. Each scan appears in the live feed on the right.
3. If a label is damaged, click **Type instead** and key it in by hand.
4. If the scanner does something unexpected, click **Scanner test** (top right of the Scan screen) and pull the trigger once. You'll see exactly which keystrokes the scanner is sending — copy that back if you need help tuning it.
5. **Done** → review the grouped list. Edit, delete (with undo), or **Download Excel**.

The exported file is named `Stocktake_<YYYY-MM-DD>_<HH-mm>.xlsx`, sheet name `Scanning Sheet`, columns:

```
Asset Number | Sighted Date | Building Name | Room Number/Name | Person Responsible | Additional Notes
```

## Deploy to GitHub Pages

This project builds into `docs/` and is served straight from your `main` branch — no extra branch, no GitHub Actions.

```bash
npm run build       # outputs to docs/
git add docs
git commit -m "build"
git push
```

Then in your repo: **Settings → Pages → Source = Deploy from a branch → `main` / `/docs` → Save.**

A few minutes later your site is live at `https://<user>.github.io/<repo>/`.

Re-deploying is the same three commands. `vite.config.ts` uses `base: "./"` so the same build works at any subpath, custom domain, or `file://`.

## Scanner notes

USB-A linear imagers are virtually always HID keyboards: they type the barcode characters then send Enter. The app expects that and also accepts Tab as a terminator. If your scanner is configured differently (LF only, prefix bytes, function keys), the **Scanner test** overlay will show it and `src/lib/scanner.ts` is a one-line fix.

## Project layout

```
src/
  App.tsx                       — HashRouter + animated route transitions
  main.tsx                      — entry
  styles/globals.css            — Tailwind v4 + tokens + reduced-motion
  lib/
    types.ts                    — Device, StickyLocation
    store.ts                    — localStorage-backed store with useSyncExternalStore
    scanner.ts                  — keystroke buffering, Enter/Tab terminators
    excel.ts                    — SheetJS workbook builder + filename
    format.ts                   — relative time, exact time
    snackbar.ts                 — toast queue
  components/
    Header.tsx
    Button.tsx
    Field.tsx                   — label-above-input form field
    Snackbar.tsx                — bottom toast with action + undo
    EmptyState.tsx
    ScannerDebugOverlay.tsx
  screens/
    Home.tsx
    Location.tsx                — sticky location form
    Scan.tsx                    — scanner input + live feed
    List.tsx                    — grouped list, edit/delete, export, clear
    Edit.tsx
    ClearAllModal.tsx
```

## Design notes

- **Palette:** Zinc-50 background, Zinc-900 ink, single emerald accent. No purple gradients, no pure black.
- **Typography:** Geist (display + body) and Geist Mono (asset numbers, debug overlay). No serif.
- **Motion:** scans happen 100s of times per session, so the scan flow is intentionally quiet — a small ring pulse, no full-screen flash. Buttons scale to 0.97 on press. All UI animations stay under 300ms with custom ease-out curves. Honors `prefers-reduced-motion`.
- **Icons:** [Phosphor](https://phosphoricons.com), `regular` weight.
