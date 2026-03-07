"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import socket from "@/lib/socket";
import { encryptAndSignPayload, decryptAndVerifyPayload } from "@/lib/crypto";
import { useToast } from "@/components/ui/ToastProvider";

export interface UserLocation {
  id: string;
  latitude: number;
  longitude: number;
  timestamp?: number;
  isOffline?: boolean;
}

function getDistanceInMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
) {
  const R = 6371e3;
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export function useRoomSocket(roomId: string, isPocketMode: boolean = false) {
  const router = useRouter();
  const { showToast } = useToast();
  const [error, setError] = useState<string | null>(null);
  const [myLocation, setMyLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [users, setUsers] = useState<Record<string, UserLocation>>({});
  const [expiryTime, setExpiryTime] = useState<number | null>(null);

  const [isCreator, setIsCreator] = useState<boolean>(false);

  const locationBuffer = useRef<Record<string, UserLocation>>({});
  const lastSentLocation = useRef<{
    lat: number;
    lon: number;
    time: number;
  } | null>(null);
  const groupKey = useRef<string | null>(null);

  useEffect(() => {
    if (!roomId || typeof window === "undefined") return;
    const hashKey = window.location.hash.replace("#", "");
    const storedKey = sessionStorage.getItem(`trace_key_${roomId}`);

    if (hashKey) {
      groupKey.current = hashKey;
      sessionStorage.setItem(`trace_key_${roomId}`, hashKey);
      window.history.replaceState(null, "", window.location.pathname);
    } else if (storedKey) {
      groupKey.current = storedKey;
    } else {
      setTimeout(() => {
        setError(
          "Secure connection key missing. Please ask for a valid invite link.",
        );
      }, 0);
      return;
    }

    const handleConnect = () => {
      socket.emit("join-room", { roomId });
    };

    if (socket.connected) {
      handleConnect();
    }

    socket.on("connect", handleConnect);

    socket.connect();

    const heartbeatInterval = setInterval(() => {
      if (socket.connected) socket.emit("heartbeat");
    }, 5000);

    socket.on("error", (err) => {
      setError(err.message || "An error occurred.");
    });

    socket.on("room-joined", (data) => {
      if (data?.expiryTime) setExpiryTime(data.expiryTime);

      if (data?.isCreator) setIsCreator(true);

      showToast("Secure session connected successfully!");
    });

    socket.on("user-joined", () => {
      showToast("A new user joined the room");
    });

    socket.on("presence-sync", (presenceDict: Record<string, boolean>) => {
      setUsers((prev) => {
        const updated = { ...prev };
        Object.keys(presenceDict).forEach((id) => {
          if (updated[id]) {
            updated[id].isOffline = !presenceDict[id];
          }
        });
        return updated;
      });
    });

    socket.on("receive-location", async ({ id, payload, timestamp }) => {
      if (!groupKey.current) return;
      try {
        const decrypted = await decryptAndVerifyPayload(
          groupKey.current,
          payload,
        );
        if (decrypted) {
          locationBuffer.current[id] = {
            id,
            ...decrypted,
            timestamp: timestamp || Date.now(),
            isOffline: false,
          };
        }
      } catch (err) {
        console.error("Socket Payload Decryption/Verification error", err);
      }
    });

    socket.on("peer-disconnected", ({ userId }) => {
      setUsers((prev) => {
        const updated = { ...prev };
        delete updated[userId];
        return updated;
      });
    });

    socket.on("user-left", ({ userId }) => {
      setUsers((prev) => {
        const updated = { ...prev };
        delete updated[userId];
        return updated;
      });
    });

    socket.on("room-ended", () => {
      showToast("Session was ended by the creator", "error");
      router.push("/");
    });

    const renderLoop = setInterval(() => {
      setUsers((prev) => {
        const updated = { ...prev, ...locationBuffer.current };
        locationBuffer.current = {};
        return updated;
      });
    }, 1000);

    let watchId: number;
    if (navigator.geolocation) {
      watchId = navigator.geolocation.watchPosition(
        async (position) => {
          if (!groupKey.current) return;

          const { latitude, longitude } = position.coords;
          const now = Date.now();

          if (lastSentLocation.current) {
            const timeDiff = now - lastSentLocation.current.time;
            const dist = getDistanceInMeters(
              lastSentLocation.current.lat,
              lastSentLocation.current.lon,
              latitude,
              longitude,
            );

            if (dist < 5 && timeDiff < 2000) return;
          }

          setMyLocation({ latitude, longitude });
          lastSentLocation.current = {
            lat: latitude,
            lon: longitude,
            time: now,
          };

          const encryptedPayload = await encryptAndSignPayload(
            groupKey.current,
            {
              latitude,
              longitude,
            },
          );

          if (!encryptedPayload) return;

          if (socket.connected) {
            socket.emit("send-location", { roomId, payload: encryptedPayload });
          }
        },
        (err) => console.error("Geolocation Error:", err),
        {
          enableHighAccuracy: !isPocketMode,
          maximumAge: isPocketMode ? 10000 : 0,
        },
      );
    }

    return () => {
      clearInterval(renderLoop);
      clearInterval(heartbeatInterval);
      if (watchId) navigator.geolocation.clearWatch(watchId);
      socket.off("connect", handleConnect);
      socket.removeAllListeners();
    };
  }, [roomId, router, isPocketMode, showToast]);

  return { error, myLocation, users, expiryTime, isCreator };
}
