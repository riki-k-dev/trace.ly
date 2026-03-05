"use client";

import socket from "@/lib/socket";

interface RoomHeaderProps {
  roomId: string;
}

export default function RoomHeader({ roomId }: RoomHeaderProps) {
  return (
    <div className="flex-none p-3 pb-0 lg:p-0 relative z-20">
      <header className="flex items-center justify-between px-4 py-3 bg-zinc-900/80 backdrop-blur-xl border border-dashed border-zinc-600/80 rounded-none shadow-lg">
        <div className="flex items-center gap-3.5">
          <div className="w-9 h-9 bg-white text-black flex items-center justify-center rounded-none font-bold text-lg shadow-[0_0_15px_rgba(255,255,255,0.2)]">
            t
          </div>
          <h1 className="text-xl font-bold tracking-tight text-white hidden sm:block">
            trace<span className="text-zinc-500 font-normal">.ly</span>
          </h1>
        </div>

        <button
          onClick={() => socket.emit("end-room", roomId)}
          className="group flex items-center gap-2 px-3.5 py-2 text-sm font-medium text-red-400 bg-red-500/10 border border-dashed border-red-500/20 rounded-none hover:bg-red-500 hover:text-white transition-all duration-300"
        >
          <span className="hidden sm:inline">End Session</span>
          <svg
            className="w-4 h-4 group-hover:translate-x-0.5 transition-transform"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
            />
          </svg>
        </button>
      </header>
    </div>
  );
}
