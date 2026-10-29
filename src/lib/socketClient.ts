/**
 * socketClient.ts
 * Singleton socket.io-client instance.
 */
import { io, Socket } from "socket.io-client";
import { getSocketUrl } from "./apiConfig";

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    const socketUrl = getSocketUrl();
    socket = io(socketUrl || undefined, {
      path: "/socket.io",
      transports: ["websocket", "polling"],
      withCredentials: true,
    });
  }
  return socket;
}

export function disconnectSocket() {
  socket?.disconnect();
  socket = null;
}
