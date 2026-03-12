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
  const [username, setUsername] = useState("");
  const [pin, setPin] = useState("");
  const [requiresApproval, setRequiresApproval] = useState(false);
  const [expiryHours, setExpiryHours] = useState<number>(1);
  const [isCreating, setIsCreating] = useState<boolean>(false);
  const [tempKey, setTempKey] = useState<string | null>(null);

  const router = useRouter();

  useEffect(() => {
    socket.connect();

    const handleRoomCreated = async ({ roomId }: { roomId: string }) => {
      setIsCreating(false);
      sessionStorage.setItem(`trace_creator_${roomId}`, "true");

      sessionStorage.setItem(
        `trace_user_${roomId}`,
        JSON.stringify({
          username: username.trim(),
          pin: pin.trim(),
        }),
      );

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
  }, [router, tempKey, username, pin]);

  const handleCreateRoom = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!username.trim()) return;
    setIsCreating(true);

    const secretKey = await generateGroupKey();
    setTempKey(secretKey);

    socket.emit("create-room", {
      expiryHours,
      username: username.trim(),
      pin: pin.trim(),
      requiresApproval,
    });
  };

  return (
    <div className="flex flex-col h-full justify-between">
      <form onSubmit={handleCreateRoom} className="w-full flex flex-col gap-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <div className="space-y-1.5 flex flex-col">
            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1">
              Your Name
            </label>
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="E.g., John"
              className="w-full h-10 bg-zinc-900 border border-dashed border-zinc-700 text-white px-3 text-sm rounded-none focus:outline-none focus:border-emerald-500 transition-colors"
            />
          </div>

          <div className="space-y-1.5 flex flex-col">
            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1">
              Session Duration
            </label>
            <div className="h-10 w-full">
              <CustomSelect
                options={DURATION_OPTIONS}
                value={expiryHours}
                onChange={setExpiryHours}
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <div className="space-y-1.5 flex flex-col">
            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1">
              Room PIN (Optional)
            </label>
            <input
              type="text"
              maxLength={4}
              pattern="\d{4}"
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
              placeholder="4-digit PIN"
              className="w-full h-10 bg-zinc-900 border border-dashed border-zinc-700 text-white px-3 text-sm rounded-none focus:outline-none focus:border-emerald-500 transition-colors tracking-[0.2em]"
            />
          </div>

          <div className="space-y-1.5 flex flex-col justify-end">
            <label
              className={`flex items-center justify-between w-full h-10 px-3 border border-dashed cursor-pointer transition-colors rounded-none ${
                requiresApproval
                  ? "bg-emerald-500/10 border-emerald-500/50"
                  : "bg-zinc-900 border-zinc-700 hover:border-zinc-500"
              }`}
            >
              <span
                className={`text-[10px] font-bold uppercase tracking-widest transition-colors ${requiresApproval ? "text-emerald-400" : "text-zinc-400"}`}
              >
                Require My Approval
              </span>
              <div
                className={`w-4 h-4 rounded-sm border flex items-center justify-center transition-colors ${requiresApproval ? "bg-emerald-500 border-emerald-500" : "bg-zinc-950 border-zinc-600"}`}
              >
                {requiresApproval && (
                  <svg
                    className="w-3 h-3 text-zinc-950"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={3}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                )}
              </div>
              <input
                type="checkbox"
                checked={requiresApproval}
                onChange={(e) => setRequiresApproval(e.target.checked)}
                className="hidden"
              />
            </label>
          </div>
        </div>

        <button
          type="submit"
          disabled={isCreating || !username.trim()}
          className="relative w-full h-12 flex items-center justify-center bg-white text-black font-bold text-sm md:text-base rounded-none px-4 mt-2 overflow-hidden transition-all hover:bg-zinc-200 active:scale-[0.98] disabled:opacity-70 disabled:active:scale-100 group shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_25px_rgba(255,255,255,0.2)] border border-dashed border-zinc-300"
        >
          {isCreating ? (
            <>
              <svg
                className="animate-spin -ml-1 mr-2 h-4 w-4 text-black"
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
              Generating Keys...
            </>
          ) : (
            "Create Secure Session"
          )}
        </button>
      </form>

      <div className="mt-5 pt-4 border-t border-dashed border-zinc-700/80">
        <ul className="flex flex-wrap justify-center gap-x-4 gap-y-2">
          <li className="flex items-center gap-1.5 text-[9px] md:text-[10px] text-zinc-400 font-mono uppercase tracking-widest">
            <svg
              className="w-3 h-3 text-emerald-500 shrink-0"
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
            E2E Encrypted
          </li>
          <li className="flex items-center gap-1.5 text-[9px] md:text-[10px] text-zinc-400 font-mono uppercase tracking-widest">
            <svg
              className="w-3 h-3 text-emerald-500 shrink-0"
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
            Auto-destructs
          </li>
          <li className="flex items-center gap-1.5 text-[9px] md:text-[10px] text-zinc-400 font-mono uppercase tracking-widest">
            <svg
              className="w-3 h-3 text-emerald-500 shrink-0"
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
            No Account Needed
          </li>
        </ul>
      </div>
    </div>
  );
}
