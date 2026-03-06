"use client";

import { useRoomTimer } from "@/hooks/useRoomTimer";

interface RoomTimerProps {
  expiryTime: number | null;
  roomId: string;
}

export default function RoomTimer({ expiryTime, roomId }: RoomTimerProps) {
  const { timeLeft, isWarning } = useRoomTimer(expiryTime, roomId);

  return (
    <div className="bg-zinc-900 border border-dashed border-zinc-600/80 p-3.5 lg:p-5 rounded-none flex flex-col gap-2.5 lg:gap-3 shrink-0">
      <h2
        className={`text-xs font-semibold uppercase tracking-widest flex items-center gap-2 ${isWarning ? "text-red-400" : "text-zinc-500"}`}
      >
        <svg
          className={`w-3.5 h-3.5 ${isWarning ? "animate-pulse" : ""}`}
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
        Session Expires In
      </h2>
      <div
        className={`border p-2.5 lg:p-3 flex justify-center items-center transition-colors duration-500 ${
          isWarning
            ? "bg-red-950/20 border-red-500/50"
            : "bg-zinc-950 border-dashed border-zinc-800"
        }`}
      >
        <span
          className={`text-xl font-mono tracking-wider transition-all duration-700 ${
            isWarning
              ? "text-red-500 animate-[pulse_1s_ease-in-out_infinite] drop-shadow-[0_0_8px_rgba(239,68,68,0.8)]"
              : "text-zinc-200"
          }`}
        >
          {timeLeft}
        </span>
      </div>
    </div>
  );
}
