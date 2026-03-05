"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import socket from "../../lib/socket";

export default function CreateRoomForm() {
  const [expiryHours, setExpiryHours] = useState<number>(1);
  const [isCreating, setIsCreating] = useState<boolean>(false);
  const router = useRouter();

  useEffect(() => {
    socket.connect();

    socket.on("room-created", ({ roomId }: { roomId: string }) => {
      setIsCreating(false);
      router.push(`/room/${roomId}`);
    });

    return () => {
      socket.off("room-created");
    };
  }, [router]);

  const handleCreateRoom = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsCreating(true);

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
        className="w-full bg-white text-black font-semibold rounded-xl px-4 py-3.5 mt-2 hover:bg-zinc-200 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isCreating ? "Initializing..." : "Create Room"}
      </button>
    </form>
  );
}
