"use client";

import { useState } from "react";
import Image from "next/image";

interface JoinRoomFormProps {
  requirements: { hasPin: boolean; requiresApproval: boolean } | null;
  onSubmit: (username: string, pin: string) => void;
}

export default function JoinRoomForm({
  requirements,
  onSubmit,
}: JoinRoomFormProps) {
  const [username, setUsername] = useState("");
  const [pin, setPin] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) return;
    onSubmit(username.trim(), pin.trim());
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-zinc-950 px-6 relative">
      <div className="w-full max-w-sm bg-zinc-900/80 backdrop-blur-2xl border border-dashed border-zinc-600/80 p-6 md:p-8 rounded-none shadow-2xl relative z-10">
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 bg-white text-black flex items-center justify-center rounded font-bold text-2xl mb-4 shadow-[0_0_20px_rgba(255,255,255,0.15)] border border-dashed border-zinc-300">
            <Image src="/logo.png" alt="trace.ly" width={48} height={48} />
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">
            Join Session
          </h2>
          {requirements?.requiresApproval && (
            <span className="text-xs text-amber-400 font-medium mt-2 bg-amber-500/10 px-2 py-1 border border-amber-500/20">
              Requires Host Approval
            </span>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest ml-1">
              Your Name
            </label>
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="How others will see you"
              className="w-full bg-zinc-950 border border-dashed border-zinc-700 text-white px-4 py-3 text-sm rounded-none focus:outline-none focus:border-emerald-500 transition-colors"
            />
          </div>

          {requirements?.hasPin && (
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest ml-1">
                Room PIN
              </label>
              <input
                type="text"
                required
                maxLength={4}
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
                placeholder="Enter 4-digit PIN"
                className="w-full bg-zinc-950 border border-dashed border-zinc-700 text-white px-4 py-3 text-sm rounded-none focus:outline-none focus:border-emerald-500 transition-colors tracking-[0.2em] text-center"
              />
            </div>
          )}

          <button
            type="submit"
            disabled={
              !username.trim() || (requirements?.hasPin && pin.length < 4)
            }
            className="w-full flex items-center justify-center bg-white text-black font-bold text-sm md:text-base rounded-none px-4 py-4 transition-all hover:bg-zinc-200 active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100 mt-4 border border-dashed border-zinc-300 shadow-[0_0_15px_rgba(255,255,255,0.1)] cursor-pointer"
          >
            Enter Room
          </button>
        </form>
      </div>

      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg h-96 bg-emerald-500/5 blur-[120px] pointer-events-none" />
    </div>
  );
}
