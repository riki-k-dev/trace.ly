"use client";

import { createContext, useContext, useState, ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";

interface ToastContextType {
  showToast: (msg: string, type?: "success" | "warning" | "error") => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast must be used within ToastProvider");
  return context;
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<{
    id: number;
    msg: string;
    type: string;
  } | null>(null);

  const showToast = (msg: string, type = "success") => {
    const id = Date.now();
    setToast({ id, msg, type });
    setTimeout(() => {
      setToast((current) => (current?.id === id ? null : current));
    }, 3500);
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <AnimatePresence>
        {toast && (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: 50, x: "-50%", scale: 0.9 }}
            animate={{ opacity: 1, y: 0, x: "-50%", scale: 1 }}
            exit={{ opacity: 0, y: 20, x: "-50%", scale: 0.9 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            className={`fixed bottom-28 left-1/2 z-9999 w-[90vw] max-w-sm px-4 py-3 rounded-none border border-dashed shadow-2xl text-xs md:text-sm font-semibold flex flex-wrap items-center justify-center text-center gap-2 backdrop-blur-md
              ${
                toast.type === "warning" || toast.type === "error"
                  ? "bg-red-500/10 border-red-500/50 text-red-400"
                  : "bg-zinc-900/80 border-zinc-600/80 text-white"
              }
            `}
          >
            {toast.type === "error" || toast.type === "warning" ? (
              <svg
                className="w-4 h-4 shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            ) : (
              <svg
                className="w-4 h-4 shrink-0 text-emerald-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            )}
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>
    </ToastContext.Provider>
  );
}
