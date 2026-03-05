"use client";

import { useState, useEffect } from "react";

export function useRoomTimer(expiryTime: number | null) {
  const [timeLeft, setTimeLeft] = useState<string>("--h --m --s");

  useEffect(() => {
    if (!expiryTime) return;

    const interval = setInterval(() => {
      const now = Date.now();
      const diff = expiryTime - now;

      if (diff <= 0) {
        setTimeLeft("00h 00m 00s");
        clearInterval(interval);
      } else {
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
  }, [expiryTime]);

  return timeLeft;
}
