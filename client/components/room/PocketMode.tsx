"use client";

import { useWakeLock } from "@/hooks/useWakeLock";

interface PocketModeProps {
  onExit: () => void;
}

export default function PocketMode({ onExit }: PocketModeProps) {
  const isLocked = useWakeLock();

  return (
    <div className="absolute inset-0 z-999 bg-black/40 backdrop-blur-md flex flex-col items-center justify-center p-4 text-center">
      <div className="mb-6">
        <svg
          className="w-10 h-10 md:w-12 md:h-12 text-emerald-500 mx-auto mb-3 animate-pulse"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"
          />
        </svg>
        <h2 className="text-xl md:text-2xl font-bold text-zinc-200 mb-2">
          Pocket Mode
        </h2>
        <div className="bg-zinc-900/80 border border-dashed border-zinc-700 p-3 mt-3 max-w-xs mx-auto text-left rounded-none shadow-lg">
          <p className="text-zinc-400 text-xs md:text-sm mb-2">
            <strong className="text-zinc-200">How it works:</strong> Map
            disabled to save battery. Location sharing remains active.
          </p>
          <p className="text-zinc-400 text-xs md:text-sm">
            Status:{" "}
            {isLocked ? (
              <span className="text-emerald-400 font-medium">
                Screen lock engaged. Safe to pocket.
              </span>
            ) : (
              <span className="text-yellow-400 font-medium">
                Broadcasting. Keep browser tab active.
              </span>
            )}
          </p>
        </div>
      </div>
      <button
        onClick={onExit}
        className="px-6 py-3 bg-zinc-800 border border-zinc-600 rounded-none text-white text-sm font-medium hover:bg-zinc-700 transition-colors shadow-xl"
      >
        Return to Map
      </button>
    </div>
  );
}
