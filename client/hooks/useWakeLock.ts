"use client";
import { useEffect, useState, useRef } from "react";

export function useWakeLock() {
  const [isLocked, setIsLocked] = useState(false);
  const wakeLockRef = useRef<any>(null);

  useEffect(() => {
    const requestWakeLock = async () => {
      try {
        if ("wakeLock" in navigator) {
          wakeLockRef.current = await (navigator as any).wakeLock.request(
            "screen",
          );
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
