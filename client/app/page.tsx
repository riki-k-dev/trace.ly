"use client";

import { useState } from "react";
import CreateRoomForm from "@/components/form/CreateRoomForm";
import QRScanner from "@/components/home/QRScanner";
import AnimatedGridBackground from "@/components/ui/AnimatedGridBackground";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";

export default function Home() {
  const [activeTab, setActiveTab] = useState<"create" | "join">("create");

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center bg-zinc-950 text-white overflow-hidden selection:bg-white selection:text-black">
      <AnimatedGridBackground />

      <div className="relative z-10 w-full max-w-md px-6 flex flex-col items-center">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-10"
        >
          <div className="w-14 h-14 bg-white text-black flex items-center justify-center rounded font-bold text-3xl mx-auto mb-5 shadow-[0_0_30px_rgba(255,255,255,0.15)] border border-dashed border-zinc-300">
            <Image src="/logo.png" alt="trace.ly" width={56} height={56} />
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight mb-2">
            trace<span className="text-zinc-500 font-normal">.ly</span>
          </h1>
          <p className="text-sm text-zinc-400 font-medium max-w-xs mx-auto">
            End-to-end encrypted real-time location sharing via temporary links.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="w-full bg-zinc-950/80 backdrop-blur-2xl border border-dashed border-zinc-600/80 rounded-none p-2.5 shadow-2xl relative"
        >
          <div className="flex bg-zinc-900/50 p-1.5 rounded-none mb-2 border border-dashed border-zinc-700/80">
            <button
              onClick={() => setActiveTab("create")}
              className={`flex-1 py-2.5 text-sm font-semibold rounded-none transition-all relative ${
                activeTab === "create"
                  ? "text-white"
                  : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              {activeTab === "create" && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute inset-0 bg-zinc-800 border border-zinc-600 rounded-none"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              <span className="relative z-10">Create Session</span>
            </button>
            <button
              onClick={() => setActiveTab("join")}
              className={`flex-1 py-2.5 text-sm font-semibold rounded-none transition-all relative ${
                activeTab === "join"
                  ? "text-white"
                  : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              {activeTab === "join" && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute inset-0 bg-zinc-800 border border-zinc-600 rounded-none"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              <span className="relative z-10 flex items-center justify-center gap-1.5">
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
                Scan to Join
              </span>
            </button>
          </div>

          <div className="p-4 md:p-5 relative min-h-85 flex flex-col justify-center">
            <AnimatePresence mode="wait">
              {activeTab === "create" ? (
                <motion.div
                  key="create"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  transition={{ duration: 0.2 }}
                  className="w-full"
                >
                  <CreateRoomForm />
                </motion.div>
              ) : (
                <motion.div
                  key="join"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.2 }}
                  className="w-full"
                >
                  <QRScanner />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-8 text-center text-[11px] text-zinc-500 font-mono tracking-widest uppercase"
        >
          <p>Client-side AES-GCM Encryption • No persistent data</p>
        </motion.div>
      </div>
    </div>
  );
}
