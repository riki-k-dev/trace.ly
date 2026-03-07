"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import socket from "@/lib/socket";
import { generateGroupKey } from "@/lib/crypto";
import CustomSelect from "../ui/CustomSelect";

const DURATION_OPTIONS = [
  { label: "1 Hour", value: 1 },
  { label: "6 Hours", value: 6 },
  { label: "12 Hours", value: 12 },
  { label: "24 Hours", value: 24 },
];

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
    <div className="flex flex-col h-full justify-between min-h-70">
      <form onSubmit={handleCreateRoom} className="w-full space-y-6">
        <div className="space-y-2">
          <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest ml-1">
            Session Duration
          </label>
          <CustomSelect
            options={DURATION_OPTIONS}
            value={expiryHours}
            onChange={setExpiryHours}
          />
        </div>
        <button
          type="submit"
          disabled={isCreating}
          className="relative w-full flex items-center justify-center bg-white text-black font-bold text-sm md:text-base rounded-none px-4 py-4 overflow-hidden transition-all hover:bg-zinc-200 active:scale-[0.98] disabled:opacity-70 disabled:active:scale-100 group shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_25px_rgba(255,255,255,0.2)] border border-dashed border-zinc-300"
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
              Generating E2E Keys...
            </>
          ) : (
            "Create Secure Session"
          )}
        </button>
      </form>

      <div className="mt-8 pt-5 border-t border-dashed border-zinc-700/80">
        <ul className="space-y-3">
          <li className="flex items-center gap-2.5 text-[10px] md:text-[11px] text-zinc-400 font-mono uppercase tracking-widest">
            <svg
              className="w-3.5 h-3.5 text-emerald-500 shrink-0"
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
            End-to-End Encrypted
          </li>
          <li className="flex items-center gap-2.5 text-[10px] md:text-[11px] text-zinc-400 font-mono uppercase tracking-widest">
            <svg
              className="w-3.5 h-3.5 text-emerald-500 shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            Auto-destructs on expiry
          </li>
          <li className="flex items-center gap-2.5 text-[10px] md:text-[11px] text-zinc-400 font-mono uppercase tracking-widest">
            <svg
              className="w-3.5 h-3.5 text-emerald-500 shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
            No user account required
          </li>
        </ul>
      </div>
    </div>
  );
}
