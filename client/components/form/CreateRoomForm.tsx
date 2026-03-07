"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import socket from "../../lib/socket";
import { generateGroupKey } from "@/lib/crypto";

export default function CreateRoomForm() {
  const [expiryHours, setExpiryHours] = useState<number>(1);
  const [isCreating, setIsCreating] = useState<boolean>(false);
  const [tempKey, setTempKey] = useState<string | null>(null);

  const router = useRouter();

  useEffect(() => {
    socket.connect();

    const handleRoomCreated = async ({ roomId }: { roomId: string }) => {
      setIsCreating(false);

      sessionStorage.setItem(`trace_creator_${roomId}`, "true");

      if (tempKey) {
        sessionStorage.setItem(`trace_key_${roomId}`, tempKey);
        router.push(`/room/${roomId}#${tempKey}`);
      } else {
        router.push(`/room/${roomId}`);
      }
    };

    socket.on("room-created", handleRoomCreated);

    return () => {
      socket.off("room-created", handleRoomCreated);
    };
  }, [router, tempKey]);

  const handleCreateRoom = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsCreating(true);

    const secretKey = await generateGroupKey();
    setTempKey(secretKey);

    socket.emit("create-room", { expiryHours });
  };

  return (
    <form onSubmit={handleCreateRoom} className="w-full space-y-5">
      <div className="space-y-1.5">
        <label
          htmlFor="expiry"
          className="text-xs font-semibold text-zinc-500 uppercase tracking-widest ml-1"
        >
          Session Duration
        </label>
        <div className="relative">
          <select
            id="expiry"
            value={expiryHours}
            onChange={(e) => setExpiryHours(Number(e.target.value))}
            className="w-full bg-zinc-900/50 border border-white/10 text-zinc-200 rounded-xl px-4 py-3.5 outline-none focus:border-white/30 focus:bg-zinc-900 transition-all appearance-none cursor-pointer"
          >
            <option value={1}>1 Hour</option>
            <option value={6}>6 Hours</option>
            <option value={12}>12 Hours</option>
            <option value={24}>24 Hours</option>
          </select>
        </div>
      </div>
      <button
        type="submit"
        disabled={isCreating}
        className="w-full flex items-center justify-center bg-white text-black font-semibold rounded-xl px-4 py-3.5 mt-2 hover:bg-zinc-200 active:scale-[0.98] transition-all disabled:opacity-50"
      >
        {isCreating ? (
          <>
            <svg
              className="animate-spin -ml-1 mr-2 h-5 w-5 text-black"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            Initializing E2E Environment...
          </>
        ) : (
          "Create Secure Room"
        )}
      </button>
    </form>
  );
}
