"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import dynamic from "next/dynamic";
import RoomHeader from "@/components/room/RoomHeader";
import RoomSidebar from "@/components/room/RoomSidebar";
import PocketMode from "@/components/room/PocketMode";
import { useRoomSocket } from "@/hooks/useRoomSocket";

const Map = dynamic(() => import("@/components/map/Map"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center bg-zinc-900/50 text-zinc-500 animate-pulse rounded-none border border-dashed border-zinc-800/50">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-4 border-zinc-700 border-t-white rounded-none animate-spin" />
        <p className="text-sm font-medium tracking-wide">
          Connecting to satellites...
        </p>
      </div>
    </div>
  ),
});

export default function RoomPage() {
  const params = useParams();
  const roomId = params.id as string;
  const [pocketMode, setPocketMode] = useState(false);

  const { error, myLocation, users, expiryTime } = useRoomSocket(roomId);

  const activeParticipants = Object.keys(users).length + (myLocation ? 1 : 0);

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen text-red-400 bg-zinc-950 font-medium">
        <div className="bg-red-500/10 px-6 py-4 rounded-none border border-dashed border-red-500/20 flex items-center gap-3">
          <svg
            className="w-6 h-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          {error}
        </div>
      </div>
    );
  }

  return (
    <>
      {pocketMode && <PocketMode onExit={() => setPocketMode(false)} />}

      <div
        className={`flex flex-col h-[100dvh] bg-zinc-950 relative overflow-hidden lg:p-4 lg:gap-4 ${pocketMode ? "hidden" : ""}`}
      >
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-lg h-32 bg-white/[0.02] blur-[100px] pointer-events-none rounded-none" />

        <RoomHeader roomId={roomId} />

        <main className="flex flex-1 overflow-hidden relative z-10 mt-3 lg:mt-0 lg:flex-row lg:gap-4">
          <div className="absolute inset-0 lg:relative lg:flex-1 bg-zinc-900/50 border-none lg:border lg:border-dashed border-zinc-800/80 rounded-none overflow-hidden z-0 lg:z-10 shadow-inner">
            <Map users={users} myLocation={myLocation} />

            <button
              onClick={() => setPocketMode(true)}
              className="absolute top-4 right-4 z-[400] bg-zinc-900/90 backdrop-blur border border-zinc-700 text-zinc-200 px-4 py-2 text-sm font-medium shadow-xl hover:bg-zinc-800 transition-colors flex items-center gap-2"
            >
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
                  d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"
                />
              </svg>
              Pocket Mode
            </button>

            <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_40px_rgba(9,9,11,0.5)] z-[399]"></div>
          </div>

          <RoomSidebar
            roomId={roomId}
            expiryTime={expiryTime}
            activeParticipants={activeParticipants}
          />
        </main>
      </div>
    </>
  );
}
