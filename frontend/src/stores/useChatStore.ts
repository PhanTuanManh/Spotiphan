// frontend/src/stores/useChatStore.ts

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
  currentPage: number;
  hasMore: boolean;
  isLoadingMore: boolean;

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
  loadMoreMessages: () => Promise<void>;
  resetMessages: () => void;
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
  currentPage: 1,
  hasMore: false,
  isLoadingMore: false,

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

  initSocket: async (clerkId) => {
    const { socket, isConnected } = get();
    if (isConnected && socket) return;

    return new Promise<void>((resolve) => {
      const newSocket = io(baseURL, {
        query: { clerkId }, // Sử dụng clerkId
        withCredentials: true,
        autoConnect: true,
      });

      newSocket.on("connect", () => {
        console.log("Socket connected with clerkId:", clerkId);
        set({ isConnected: true, socket: newSocket });
        newSocket.emit("user_connected", clerkId); // Gửi clerkId
        resolve();
      });

      newSocket.on("users_online", (users: string[]) => {
        console.log("Online users updated:", users);
        set({ onlineUsers: new Set(users) });
      });

      newSocket.on("activities", (activities: [string, string][]) => {
        set({ userActivities: new Map(activities) });
      });

      newSocket.on("user_connected", (userId: string) => {
        console.log("User connected:", userId);
        set((state) => ({
          onlineUsers: new Set([...state.onlineUsers, userId]),
        }));
      });

      newSocket.on("activity_updated", ({ userId, activity }) => {
        console.log("Activity updated received:", userId, activity);
        set((state) => {
          const newActivities = new Map(state.userActivities);
          newActivities.set(userId, activity);
          console.log("Updated activities:", newActivities);
          return { userActivities: newActivities };
        });
      });

      newSocket.on("user_disconnected", (userId: string) => {
        console.log("User disconnected:", userId);
        set((state) => {
          const newOnlineUsers = new Set(state.onlineUsers);
          newOnlineUsers.delete(userId);
          return { onlineUsers: newOnlineUsers };
        });
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
    set({ isLoading: true, error: null, currentPage: 1 });
    try {
      const response = await axiosInstance.get(`/users/messages/${userId}`, {
        params: { page: 1, limit: 20 },
      });
      set({
        messages: response.data.messages,
        hasMore: response.data.hasMore,
      });
    } catch (error: any) {
      set({
        error: error.response?.data?.message || "Failed to fetch messages",
      });
    } finally {
      set({ isLoading: false });
    }
  },

  loadMoreMessages: async () => {
    const { selectedUser, currentPage, hasMore, isLoadingMore } = get();
    if (!selectedUser || !hasMore || isLoadingMore) return;

    set({ isLoadingMore: true });
    try {
      const nextPage = currentPage + 1;
      const response = await axiosInstance.get(
        `/users/messages/${selectedUser.clerkId}`,
        {
          params: { page: nextPage, limit: 20 },
        }
      );

      set((state) => ({
        messages: [...response.data.messages, ...state.messages], // Thêm tin nhắn cũ vào đầu
        currentPage: nextPage,
        hasMore: response.data.hasMore,
      }));
    } catch (error: any) {
      set({
        error: error.response?.data?.message || "Failed to load more messages",
      });
    } finally {
      set({ isLoadingMore: false });
    }
  },

  resetMessages: () => {
    set({ messages: [], currentPage: 1, hasMore: false });
  },

  // Cập nhật hàm setSelectedUser để reset khi chọn user mới
  setSelectedUser: (user) => {
    get().resetMessages();
    set({ selectedUser: user });
  },
}));
