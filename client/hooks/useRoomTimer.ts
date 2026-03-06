"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/ToastProvider";
import socket from "@/lib/socket";

export function useRoomTimer(expiryTime: number | null, roomId: string) {
  const [timeLeft, setTimeLeft] = useState<string>("--h --m --s");
  const [isWarning, setIsWarning] = useState(false);
  const router = useRouter();
  const { showToast } = useToast();

  const hasWarned = useRef(false);
  const hasEnded = useRef(false);

  useEffect(() => {
    if (!expiryTime) return;

    const interval = setInterval(() => {
      const now = Date.now();
      const diff = expiryTime - now;

      if (diff <= 0) {
        setTimeLeft("00h 00m 00s");
        clearInterval(interval);

        if (!hasEnded.current) {
          hasEnded.current = true;
          socket.emit("end-room", roomId);
          router.push("/");
          showToast("Your session has ended", "error");
        }
      } else {
        if (diff <= 10 * 60 * 1000) {
          setIsWarning(true);
          if (!hasWarned.current) {
            showToast("Only 10 minutes left in this session!", "warning");
            hasWarned.current = true;
          }
        }

        const hours = String(Math.floor(diff / (1000 * 60 * 60))).padStart(
          2,
          "0",
        );
        const mins = String(
          Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
        ).padStart(2, "0");
        const secs = String(Math.floor((diff % (1000 * 60)) / 1000)).padStart(
          2,
          "0",
        );
        setTimeLeft(`${hours}h ${mins}m ${secs}s`);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [expiryTime, router, showToast, roomId]);

  return { timeLeft, isWarning };
}
