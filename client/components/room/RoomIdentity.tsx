"use client";

interface RoomIdentityProps {
  roomId: string;
  activeParticipants: number;
}

export default function RoomIdentity({
  roomId,
  activeParticipants,
}: RoomIdentityProps) {
  return (
    <div className="bg-zinc-900 border border-dashed border-zinc-600/80 p-3.5 lg:p-5 rounded-none flex flex-col gap-2.5 lg:gap-3 shrink-0">
      <div className="flex items-center justify-between">
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
              d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
            />
          </svg>
          Room Identity
        </h2>
        <div className="flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/20 px-2 py-1">
          <span className="relative flex h-1.5 w-1.5">
            <span className="animate-ping absolute inline-flex h-full w-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex h-1.5 w-1.5 bg-emerald-500"></span>
          </span>
          <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider">
            {activeParticipants} Active
          </span>
        </div>
      </div>
      <div className="bg-zinc-950 border border-zinc-800 p-2.5 lg:p-3 font-mono text-zinc-300 text-sm tracking-widest text-center select-all">
        {roomId}
      </div>
    </div>
  );
}
