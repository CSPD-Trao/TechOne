import { HashRouter, Route, Routes, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Header } from "./components/Header";
import { Snackbars } from "./components/Snackbar";
import { Home } from "./screens/Home";
import { Location } from "./screens/Location";
import { Scan } from "./screens/Scan";
import { List } from "./screens/List";
import { Edit } from "./screens/Edit";

function AnimatedRoutes() {
  const loc = useLocation();
  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={loc.pathname}
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.18, ease: [0.23, 1, 0.32, 1] }}
      >
        <Routes location={loc}>
          <Route path="/" element={<Home />} />
          <Route path="/location" element={<Location />} />
          <Route path="/scan" element={<Scan />} />
          <Route path="/list" element={<List />} />
          <Route path="/edit/:id" element={<Edit />} />
          <Route path="*" element={<Home />} />
        </Routes>
      </motion.div>
    </AnimatePresence>
  );
}

export default function App() {
  return (
    <HashRouter>
      <div className="min-h-[100dvh] flex flex-col">
        <Header />
        <main className="flex-1">
          <AnimatedRoutes />
        </main>
        <footer className="border-t border-[var(--color-hairline)]/70">
          <div className="max-w-[1100px] mx-auto px-6 sm:px-8 py-5 text-xs text-[var(--color-soft)] flex flex-wrap items-center gap-x-3 gap-y-1">
            <span>
              Your scans stay in this browser. Nothing leaves the device until
              you click Download.
            </span>
          </div>
        </footer>
        <Snackbars />
      </div>
    </HashRouter>
  );
}
