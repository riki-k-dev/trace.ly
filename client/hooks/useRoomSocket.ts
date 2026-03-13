"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import socket from "@/lib/socket";
import { encryptAndSignPayload, decryptAndVerifyPayload } from "@/lib/crypto";
import { useToast } from "@/components/ui/ToastProvider";

export interface UserLocation {
  id: string;
  username?: string;
  latitude: number;
  longitude: number;
  path?: [number, number][];
  timestamp?: number;
  isOffline?: boolean;
}

export type JoinState =
  | "checking"
  | "need_info"
  | "requesting"
  | "pending_approval"
  | "joined"
  | "rejected"
  | "error";

export interface JoinRequest {
  userId: string;
  username: string;
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

  const [joinState, setJoinState] = useState<JoinState>("checking");
  const [roomRequirements, setRoomRequirements] = useState<{
    hasPin: boolean;
    requiresApproval: boolean;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [myLocation, setMyLocation] = useState<{
    latitude: number;
    longitude: number;
    path: [number, number][];
  } | null>(null);
  const [users, setUsers] = useState<Record<string, UserLocation>>({});
  const [expiryTime, setExpiryTime] = useState<number | null>(null);
  const [pendingRequests, setPendingRequests] = useState<JoinRequest[]>([]);

  const [isCreator, setIsCreator] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      return sessionStorage.getItem(`trace_creator_${roomId}`) === "true";
    }
    return false;
  });

  const locationBuffer = useRef<Record<string, UserLocation>>({});
  const lastSentLocation = useRef<{
    lat: number;
    lon: number;
    time: number;
  } | null>(null);
  const groupKey = useRef<string | null>(null);
  const workerRef = useRef<Worker | null>(null);

  const myPathRef = useRef<[number, number][]>([]);

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
        setJoinState("error");
      }, 0);
      return;
    }

    if (!socket.connected) socket.connect();

    const handleConnect = () => {
      if (joinState === "checking" || joinState === "error") {
        socket.emit("check-room", roomId);
      }
    };

    if (socket.connected && joinState === "checking") {
      socket.emit("check-room", roomId);
    }
    socket.on("connect", handleConnect);

    socket.on("room-not-found", () => {
      setError("This room does not exist or has expired.");
      setJoinState("error");
    });

    socket.on("room-info", (info) => {
      setRoomRequirements(info);
      const isCreatorSession =
        sessionStorage.getItem(`trace_creator_${roomId}`) === "true";
      const savedUserStr = sessionStorage.getItem(`trace_user_${roomId}`);

      if (isCreatorSession) {
        let creatorName = "Creator";
        if (savedUserStr) {
          try {
            creatorName = JSON.parse(savedUserStr).username;
          } catch {}
        }
        socket.emit("request-join", { roomId, username: creatorName, pin: "" });
        setJoinState("requesting");
      } else if (savedUserStr) {
        try {
          const { username, pin } = JSON.parse(savedUserStr);
          socket.emit("request-join", { roomId, username, pin });
          setJoinState("requesting");
        } catch {
          setJoinState("need_info");
        }
      } else {
        setJoinState("need_info");
      }
    });

    socket.on("join-error", (err) => {
      sessionStorage.removeItem(`trace_user_${roomId}`);
      setError(err.message || "Could not join room.");
      setJoinState("error");
      showToast(err.message || "Failed to join", "error");
    });

    socket.on("join-pending", () => {
      setJoinState("pending_approval");
    });

    socket.on("join-rejected", () => {
      sessionStorage.removeItem(`trace_user_${roomId}`);
      setJoinState("rejected");
    });

    socket.on("room-joined", (data) => {
      setJoinState("joined");
      if (data?.expiryTime) setExpiryTime(data.expiryTime);
      if (data?.isCreator) {
        setIsCreator(true);
        sessionStorage.setItem(`trace_creator_${roomId}`, "true");
      }

      const initialUsers: Record<string, UserLocation> = {};
      if (data?.existingUsers) {
        data.existingUsers.forEach((u: { id: string; username: string }) => {
          initialUsers[u.id] = {
            id: u.id,
            latitude: 0,
            longitude: 0,
            path: [],
            username: u.username,
            isOffline: true,
          };
        });
      }
      setUsers(initialUsers);
      showToast("Secure session connected successfully!");

      if (!workerRef.current) {
        workerRef.current = new Worker(
          new URL("/ping-worker.js", window.location.origin),
        );
        workerRef.current.postMessage("start");
        workerRef.current.onmessage = () => {
          if (socket.connected) socket.emit("heartbeat");
        };
      }
    });

    socket.on("join-request", (request: JoinRequest) => {
      setPendingRequests((prev) => {
        if (prev.some((r) => r.userId === request.userId)) return prev;
        return [...prev, request];
      });
      showToast(`${request.username} is asking to join.`, "warning");
    });

    socket.on("user-joined", ({ userId, username }) => {
      showToast(`${username} joined the room`);
      setUsers((prev) => ({
        ...prev,
        [userId]: {
          id: userId,
          username,
          latitude: 0,
          longitude: 0,
          path: [],
          isOffline: false,
        },
      }));
    });

    socket.on("presence-sync", (presenceDict: Record<string, boolean>) => {
      setUsers((prev) => {
        const updated = { ...prev };
        Object.keys(presenceDict).forEach((id) => {
          if (updated[id]) updated[id].isOffline = !presenceDict[id];
        });
        return updated;
      });
    });

    socket.on("receive-location", async ({ id, payload, timestamp }) => {
      if (!groupKey.current || joinState !== "joined") return;
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
        if (updated[userId]) updated[userId].isOffline = true;
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

    const renderLoop = setInterval(() => {
      if (joinState === "joined") {
        setUsers((prev) => {
          const updated = { ...prev };
          Object.keys(locationBuffer.current).forEach((id) => {
            const incoming = locationBuffer.current[id];
            updated[id] = {
              ...updated[id],
              ...incoming,
              path: incoming.path || updated[id]?.path || [],
            };
          });
          locationBuffer.current = {};
          return updated;
        });
      }
    }, 1000);

    let watchId: number;

    const pushLocation = async (latitude: number, longitude: number) => {
      if (!groupKey.current || !socket.connected) return;

      const now = Date.now();
      if (lastSentLocation.current) {
        const timeDiff = now - lastSentLocation.current.time;
        const dist = getDistanceInMeters(
          lastSentLocation.current.lat,
          lastSentLocation.current.lon,
          latitude,
          longitude,
        );
        if (dist < 5 && timeDiff < 5000) return;
      }

      const lastPathPoint = myPathRef.current[myPathRef.current.length - 1];
      if (
        !lastPathPoint ||
        getDistanceInMeters(
          lastPathPoint[0],
          lastPathPoint[1],
          latitude,
          longitude,
        ) > 5
      ) {
        myPathRef.current = [
          ...myPathRef.current,
          [latitude, longitude] as [number, number],
        ].slice(-50);
      }

      setMyLocation({ latitude, longitude, path: myPathRef.current });
      lastSentLocation.current = { lat: latitude, lon: longitude, time: now };

      const encryptedPayload = await encryptAndSignPayload(groupKey.current, {
        latitude,
        longitude,
        path: myPathRef.current,
      });

      if (encryptedPayload) {
        socket.emit("send-location", { roomId, payload: encryptedPayload });
      }
    };

    if (navigator.geolocation && joinState === "joined") {
      watchId = navigator.geolocation.watchPosition(
        (position) =>
          pushLocation(position.coords.latitude, position.coords.longitude),
        (err) => console.error("Geolocation Error:", err),
        {
          enableHighAccuracy: !isPocketMode,
          maximumAge: isPocketMode ? 10000 : 0,
        },
      );
    }

    const handleVisibilityChange = () => {
      if (
        document.visibilityState === "visible" &&
        joinState === "joined" &&
        navigator.geolocation
      ) {
        navigator.geolocation.getCurrentPosition(
          (position) =>
            pushLocation(position.coords.latitude, position.coords.longitude),
          (err) => console.error("Recovery Geo Error:", err),
          { enableHighAccuracy: true, maximumAge: 0 },
        );
        if (socket.connected) socket.emit("heartbeat");
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      clearInterval(renderLoop);
      if (watchId) navigator.geolocation.clearWatch(watchId);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      socket.off("connect", handleConnect);
      socket.removeAllListeners();
      if (workerRef.current) {
        workerRef.current.postMessage("stop");
        workerRef.current.terminate();
        workerRef.current = null;
      }
    };
  }, [roomId, router, isPocketMode, showToast, joinState]);

  const requestJoin = (username: string, pin: string) => {
    setJoinState("requesting");
    sessionStorage.setItem(
      `trace_user_${roomId}`,
      JSON.stringify({ username, pin }),
    );
    socket.emit("request-join", { roomId, username, pin });
  };

  const resolveJoinRequest = (
    userId: string,
    username: string,
    approved: boolean,
  ) => {
    socket.emit("resolve-join", { roomId, userId, username, approved });
    setPendingRequests((prev) => prev.filter((req) => req.userId !== userId));
  };

  return {
    joinState,
    roomRequirements,
    error,
    myLocation,
    users,
    expiryTime,
    isCreator,
    requestJoin,
    pendingRequests,
    resolveJoinRequest,
  };
}
