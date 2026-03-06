"use client";
import { useEffect, useState, useRef } from "react";

type NavigatorWithWakeLock = Navigator & {
  wakeLock: {
    request(type: "screen"): Promise<WakeLockSentinel>;
  };
};

export function useWakeLock() {
  const [isLocked, setIsLocked] = useState(false);
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);

  useEffect(() => {
    const requestWakeLock = async () => {
      try {
        if ("wakeLock" in navigator) {
          const nav = navigator as NavigatorWithWakeLock;
          wakeLockRef.current = await nav.wakeLock.request("screen");
          setIsLocked(true);

          wakeLockRef.current.addEventListener("release", () => {
            setIsLocked(false);
          });
        }
      } catch (err) {
        console.warn("Wake Lock failed:", err);
      }
    };

    requestWakeLock();

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible" && !isLocked)
        requestWakeLock();
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      if (wakeLockRef.current) wakeLockRef.current.release();
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [isLocked]);

  return isLocked;
}
