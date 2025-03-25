import { create } from "zustand";
import { io, Socket } from "socket.io-client";

interface SocketState {
  socket: Socket | null;
  initSocket: (userId: string, getToken: () => Promise<string | null>) => void;
  disconnectSocket: () => void;
}

export const useSocketStore = create<SocketState>((set) => ({
  socket: null,

  initSocket: (userId, getToken) => {
    const socket = io(import.meta.env.VITE_API_URL || "http://localhost:5000", {
      auth: async (cb) => {
        const token = await getToken();
        cb({ token, userId });
      },
      autoConnect: true,
      withCredentials: true,
    });

    socket.on("connect_error", async (err) => {
      if (err.message === "Authentication error") {
        const newToken = await getToken();
        if (newToken) {
          socket.auth = { token: newToken, userId };
          socket.connect();
        }
      }
    });

    set({ socket });
  },

  disconnectSocket: () => {
    set((state) => {
      state.socket?.disconnect();
      return { socket: null };
    });
  },
}));
