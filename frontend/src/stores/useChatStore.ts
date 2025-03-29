import { axiosInstance } from "@/lib/axios";
import { IMessage, IUser } from "@/types";
import { create } from "zustand";
import { io, Socket } from "socket.io-client";

interface ChatStore {
  users: IUser[];
  isLoading: boolean;
  error: string | null;
  socket: Socket | null;
  isConnected: boolean;
  onlineUsers: Set<string>;
  userActivities: Map<string, string>;
  messages: IMessage[];
  selectedUser: IUser | null;

  fetchUsers: () => Promise<void>;
  initSocket: (userId: string) => Promise<void>; // Thay đổi thành async
  disconnectSocket: () => void;
  sendMessage: (
    receiverId: string,
    senderId: string,
    content: string
  ) => Promise<void>; // Thêm async
  fetchMessages: (userId: string) => Promise<void>;
  setSelectedUser: (user: IUser | null) => void;
}

const baseURL =
  import.meta.env.MODE === "development" ? "http://localhost:5000" : "/";

export const useChatStore = create<ChatStore>((set, get) => ({
  users: [],
  isLoading: false,
  error: null,
  socket: null,
  isConnected: false,
  onlineUsers: new Set(),
  userActivities: new Map(),
  messages: [],
  selectedUser: null,

  setSelectedUser: (user) => set({ selectedUser: user }),

  fetchUsers: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await axiosInstance.get("/users");
      set({ users: response.data });
    } catch (error: any) {
      set({ error: error.response?.data?.message || "Failed to fetch users" });
    } finally {
      set({ isLoading: false });
    }
  },

  initSocket: async (userId) => {
    const { socket, isConnected } = get();
    if (isConnected && socket) return;

    return new Promise<void>((resolve) => {
      const newSocket = io(baseURL, {
        query: { userId },
        withCredentials: true,
        autoConnect: true,
      });

      newSocket.on("connect", () => {
        console.log("Socket connected");
        set({ isConnected: true, socket: newSocket });
        resolve();
      });

      newSocket.on("users_online", (users: string[]) => {
        set({ onlineUsers: new Set(users) });
      });

      newSocket.on("activities", (activities: [string, string][]) => {
        set({ userActivities: new Map(activities) });
      });

      newSocket.on("receive_message", (message: IMessage) => {
        set((state) => ({
          messages: [...state.messages, message],
        }));
      });

      newSocket.on("message_sent", (message: IMessage) => {
        set((state) => ({
          messages: [...state.messages, message],
        }));
      });

      newSocket.on("disconnect", () => {
        set({ isConnected: false });
      });

      set({ socket: newSocket });
    });
  },

  disconnectSocket: () => {
    const socket = get().socket;
    if (socket) {
      socket.disconnect();
      set({ isConnected: false, socket: null });
    }
  },

  sendMessage: async (receiverId, senderId, content) => {
    const { socket, isConnected } = get();

    if (!isConnected || !socket) {
      // Tự động kết nối nếu chưa kết nối
      await get().initSocket(senderId);
    }

    // Kiểm tra lại sau khi init
    if (get().socket && get().isConnected) {
      get().socket!.emit("send_message", { receiverId, senderId, content });
    } else {
      throw new Error("Cannot connect to socket server");
    }
  },

  fetchMessages: async (userId: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await axiosInstance.get(`/users/messages/${userId}`);
      set({ messages: response.data });
    } catch (error: any) {
      set({
        error: error.response?.data?.message || "Failed to fetch messages",
      });
    } finally {
      set({ isLoading: false });
    }
  },
}));
