import { io } from "socket.io-client";

const SOCKET_URL =
  process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:5000";

const storedClientId =
  typeof window !== "undefined"
    ? localStorage.getItem("trace_client_id")
    : undefined;

const socket = io(SOCKET_URL, {
  autoConnect: false,
  transports: ["websocket"],
  reconnection: true,
  reconnectionAttempts: Infinity,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  auth: { clientId: storedClientId },
});

socket.on("session", ({ clientId }) => {
  localStorage.setItem("trace_client_id", clientId);
  socket.auth = { clientId };
});

export default socket;
