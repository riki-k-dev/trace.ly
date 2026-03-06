"use client";

import { useWakeLock } from "@/hooks/useWakeLock";

interface PocketModeProps {
  onExit: () => void;
}

export default function PocketMode({ onExit }: PocketModeProps) {
  const isLocked = useWakeLock();

  return (
    <div className="absolute inset-0 z-[999] bg-black flex flex-col items-center justify-center p-6 text-center">
      <div className="mb-8">
        <svg
          className="w-16 h-16 text-emerald-500 mx-auto mb-4 animate-pulse"
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
        <h2 className="text-2xl font-bold text-zinc-200 mb-2">
          Pocket Mode Active
        </h2>
        <div className="bg-zinc-900 border border-dashed border-zinc-700 p-4 mt-4 max-w-sm mx-auto text-left">
          <p className="text-zinc-400 text-sm mb-2">
            <strong className="text-zinc-200">How it works:</strong> This mode
            disables map rendering to save battery while keeping location
            sharing active.
          </p>
          <p className="text-zinc-400 text-sm">
            Status:{" "}
            {isLocked ? (
              <span className="text-emerald-400">
                Screen lock engaged. Safe to pocket.
              </span>
            ) : (
              <span className="text-yellow-400">
                Broadcasting. Keep browser tab active.
              </span>
            )}
          </p>
        </div>
      </div>
      <button
        onClick={onExit}
        className="px-8 py-4 bg-zinc-800 border border-zinc-600 rounded-none text-white font-medium hover:bg-zinc-700 transition-colors"
      >
        Tap to Return to Map
      </button>
    </div>
  );
}
