"use client";

import { motion, AnimatePresence } from "framer-motion";

interface MapThemeToggleProps {
  isDarkMode: boolean;
  onToggle: () => void;
}

export default function MapThemeToggle({
  isDarkMode,
  onToggle,
}: MapThemeToggleProps) {
  return (
    <button
      onClick={onToggle}
      className="absolute top-4 right-4 bg-zinc-900/90 backdrop-blur border border-zinc-700 text-zinc-200 rounded-none shadow-xl hover:bg-zinc-800 transition-colors flex items-center justify-center cursor-pointer overflow-hidden"
      aria-label={isDarkMode ? "Switch to Light Map" : "Switch to Dark Map"}
      title={isDarkMode ? "Switch to Light Map" : "Switch to Dark Map"}
      style={{ zIndex: 1000, width: "40px", height: "40px" }}
    >
      {/* FIX: Removed mode="wait" so icons crossfade smoothly without any blank gap */}
      <AnimatePresence initial={false}>
        <motion.div
          key={isDarkMode ? "dark" : "light"}
          initial={{ rotate: -180, scale: 0.3, opacity: 0 }}
          animate={{ rotate: 0, scale: 1, opacity: 1 }}
          exit={{ rotate: 180, scale: 0.3, opacity: 0 }}
          transition={{
            type: "spring",
            stiffness: 250,
            damping: 15,
            mass: 0.8,
          }}
          className="absolute flex items-center justify-center"
        >
          {isDarkMode ? (
            <svg
              className="w-5 h-5 text-amber-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
              />
            </svg>
          ) : (
            <svg
              className="w-5 h-5 text-emerald-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
              />
            </svg>
          )}
        </motion.div>
      </AnimatePresence>
    </button>
  );
}