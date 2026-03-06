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
    // Auto-hide after 3.5 seconds
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
            className={`fixed bottom-10 left-1/2 z-9999 px-6 py-3 rounded-full border shadow-2xl text-sm font-semibold flex items-center gap-2
              ${
                toast.type === "warning" || toast.type === "error"
                  ? "bg-red-500/10 border-red-500/50 text-red-400"
                  : "bg-zinc-900 border-zinc-700 text-white"
              }
            `}
          >
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>
    </ToastContext.Provider>
  );
}
