"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import socket from "@/lib/socket";

interface UserLocation {
  id: string;
  latitude: number;
  longitude: number;
}

export function useRoomSocket(roomId: string) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [myLocation, setMyLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [users, setUsers] = useState<Record<string, UserLocation>>({});
  const [expiryTime, setExpiryTime] = useState<number | null>(null);

  useEffect(() => {
    if (!roomId) return;

    socket.connect();
    socket.emit("join-room", roomId);

    socket.on("error", (err: { message: string }) => setError(err.message));
    socket.on("room-ended", () => router.push("/"));

    socket.on("room-joined", (data?: { expiryTime: number }) => {
      if (data?.expiryTime) setExpiryTime(data.expiryTime);
    });

    socket.on("receive-location", (data: UserLocation) => {
      setUsers((prev) => ({ ...prev, [data.id]: data }));
    });

    socket.on("user-left", ({ userId }: { userId: string }) => {
      setUsers((prev) => {
        const updated = { ...prev };
        delete updated[userId];
        return updated;
      });
    });

    let watchId: number;
    if (navigator.geolocation) {
      watchId = navigator.geolocation.watchPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setMyLocation({ latitude, longitude });
          socket.emit("send-location", { roomId, latitude, longitude });
        },
        (err) => console.error(err),
        { enableHighAccuracy: true },
      );
    }

    return () => {
      if (watchId) navigator.geolocation.clearWatch(watchId);
      socket.off("error");
      socket.off("room-ended");
      socket.off("room-joined");
      socket.off("receive-location");
      socket.off("user-left");
    };
  }, [roomId, router]);

  return { error, myLocation, users, expiryTime };
}
