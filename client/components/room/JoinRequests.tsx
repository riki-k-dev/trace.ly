"use client";

import { motion, AnimatePresence } from "framer-motion";
import { JoinRequest } from "@/hooks/useRoomSocket";

interface JoinRequestsProps {
  requests: JoinRequest[];
  onResolve: (userId: string, username: string, approved: boolean) => void;
}

export default function JoinRequests({
  requests,
  onResolve,
}: JoinRequestsProps) {
  if (requests.length === 0) return null;

  return (
    <div className="absolute top-20 right-4 lg:right-6 z-1000 flex flex-col gap-3 w-72 max-w-[calc(100vw-2rem)]">
      <AnimatePresence>
        {requests.map((req) => (
          <motion.div
            key={req.userId}
            initial={{ opacity: 0, x: 50, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
            className="bg-zinc-900/95 backdrop-blur-md border border-dashed border-amber-500/40 p-3.5 shadow-2xl rounded-none pointer-events-auto"
          >
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-amber-500/20 text-amber-500 flex items-center justify-center font-bold shrink-0 mt-0.5 border border-amber-500/30">
                {req.username.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white truncate">
                  {req.username}
                </p>
                <p className="text-[10px] text-zinc-400 uppercase tracking-wider mb-2.5">
                  Wants to join
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => onResolve(req.userId, req.username, true)}
                    className="flex-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 py-1.5 text-xs font-bold transition-colors"
                  >
                    Accept
                  </button>
                  <button
                    onClick={() => onResolve(req.userId, req.username, false)}
                    className="flex-1 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 py-1.5 text-xs font-bold transition-colors"
                  >
                    Decline
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
