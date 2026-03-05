"use client";

import { useRoomTimer } from "@/hooks/useRoomTimer";

interface RoomTimerProps {
  expiryTime: number | null;
}

export default function RoomTimer({ expiryTime }: RoomTimerProps) {
  const timeLeft = useRoomTimer(expiryTime);

  return (
    <div className="bg-zinc-900 border border-dashed border-zinc-600/80 p-3.5 lg:p-5 rounded-none flex flex-col gap-2.5 lg:gap-3 shrink-0">
      <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
        <svg
          className="w-3.5 h-3.5"
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
      <div className="bg-zinc-950 border border-dashed border-zinc-800 p-2.5 lg:p-3 flex justify-center items-center">
        <span
          className={`text-xl font-mono tracking-wider ${timeLeft === "00h 00m 00s" ? "text-red-500" : "text-zinc-200"}`}
        >
          {timeLeft}
        </span>
      </div>
    </div>
  );
}
