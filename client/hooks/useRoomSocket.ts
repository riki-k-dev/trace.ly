"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import socket from "@/lib/socket";
import { encryptAndSignPayload, decryptAndVerifyPayload } from "@/lib/crypto";

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
  const [error, setError] = useState<string | null>(null);
  const [myLocation, setMyLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [users, setUsers] = useState<Record<string, UserLocation>>({});
  const [expiryTime, setExpiryTime] = useState<number | null>(null);
  const [clientId, setClientId] = useState<string | null>(null);

  const locationBuffer = useRef<Record<string, UserLocation>>({});
  const lastSentLocation = useRef<{ lat: number; lon: number } | null>(null);

  const groupKey = useRef<string | null>(null);

  const peerConnections = useRef<Record<string, RTCPeerConnection>>({});
  const dataChannels = useRef<Record<string, RTCDataChannel>>({});

  useEffect(() => {
    if (!roomId || typeof window === "undefined") return;

    groupKey.current = sessionStorage.getItem(`trace_key_${roomId}`) || null;

    if (window.location.hash) {
      window.history.replaceState(null, "", window.location.pathname);
    }

    const handleConnect = () => {
      socket.emit("join-room", { roomId });
    };

    if (socket.connected) {
      handleConnect();
    }

    socket.on("connect", handleConnect);

    const handleSession = ({ clientId: id }: { clientId: string }) => {
      setClientId(id);
    };

    socket.on("session", handleSession);

    socket.connect();

    const heartbeatInterval = setInterval(() => {
      if (socket.connected) socket.emit("heartbeat");
    }, 5000);

    const createPeerConnection = (targetId: string, isInitiator: boolean) => {
      const pc = new RTCPeerConnection({
        iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
      });

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          socket.emit("webrtc-ice-candidate", {
            target: targetId,
            candidate: event.candidate,
          });
        }
      };

      const handleDataChannel = (channel: RTCDataChannel) => {
        channel.onmessage = async (event) => {
          try {
            const rawPayload = JSON.parse(event.data);

            if (rawPayload.type === "KEY_EXCHANGE") {
              groupKey.current = rawPayload.key;
              sessionStorage.setItem(`trace_key_${roomId}`, rawPayload.key);
              return;
            }

            if (!groupKey.current) return;
            const decrypted = await decryptAndVerifyPayload(
              groupKey.current,
              rawPayload,
            );

            if (decrypted) {
              locationBuffer.current[targetId] = {
                id: targetId,
                ...decrypted,
                timestamp: Date.now(),
                isOffline: false,
              };
            }
          } catch (e) {
            console.error("WebRTC Decryption/Verification error", e);
          }
        };

        channel.onopen = () => {
          if (groupKey.current && isInitiator) {
            channel.send(
              JSON.stringify({ type: "KEY_EXCHANGE", key: groupKey.current }),
            );
          }
        };
        dataChannels.current[targetId] = channel;
      };

      if (isInitiator) {
        const dc = pc.createDataChannel("secure-channel", {
          ordered: true,
        });
        handleDataChannel(dc);
        pc.createOffer().then((offer) => {
          pc.setLocalDescription(offer);
          socket.emit("webrtc-offer", { target: targetId, sdp: offer });
        });
      } else {
        pc.ondatachannel = (event) => handleDataChannel(event.channel);
      }

      peerConnections.current[targetId] = pc;
      return pc;
    };

    socket.on("error", (err) => {
      setError(err.message || "An error occurred.");
    });

    socket.on("room-joined", (data) => {
      if (data?.expiryTime) setExpiryTime(data.expiryTime);
      if (data?.existingUsers) {
        data.existingUsers.forEach((id: string) =>
          createPeerConnection(id, true),
        );
      }
    });

    socket.on("user-joined", ({ userId }) =>
      createPeerConnection(userId, false),
    );

    socket.on("webrtc-offer", async ({ caller, sdp }) => {
      const pc =
        peerConnections.current[caller] || createPeerConnection(caller, false);
      await pc.setRemoteDescription(new RTCSessionDescription(sdp));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      socket.emit("webrtc-answer", { target: caller, sdp: answer });
    });

    socket.on("webrtc-answer", async ({ caller, sdp }) => {
      const pc = peerConnections.current[caller];
      if (pc) await pc.setRemoteDescription(new RTCSessionDescription(sdp));
    });

    socket.on("webrtc-ice-candidate", async ({ caller, candidate }) => {
      const pc = peerConnections.current[caller];
      if (pc) await pc.addIceCandidate(new RTCIceCandidate(candidate));
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
      if (peerConnections.current[userId]) {
        peerConnections.current[userId].close();
        delete peerConnections.current[userId];
        delete dataChannels.current[userId];
      }
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

          if (lastSentLocation.current) {
            const dist = getDistanceInMeters(
              lastSentLocation.current.lat,
              lastSentLocation.current.lon,
              latitude,
              longitude,
            );
            if (dist < 5) return;
          }

          setMyLocation({ latitude, longitude });
          lastSentLocation.current = { lat: latitude, lon: longitude };

          const encryptedPayload = await encryptAndSignPayload(
            groupKey.current,
            {
              latitude,
              longitude,
            },
          );

          if (!encryptedPayload) return;

          let sentViaWebRTC = false;
          Object.values(dataChannels.current).forEach((channel) => {
            if (channel.readyState === "open") {
              channel.send(JSON.stringify(encryptedPayload));
              sentViaWebRTC = true;
            }
          });

          if (!sentViaWebRTC && socket.connected) {
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
      socket.off("session", handleSession);
      socket.removeAllListeners();
      Object.values(peerConnections.current).forEach((pc) => pc.close());
    };
  }, [roomId, router, isPocketMode]);

  return { error, myLocation, users, expiryTime, clientId };
}
