import { create } from "zustand";
import { axiosInstance } from "@/lib/axios";
import { ISong } from "@/types";


interface QueueState {
  queue: ISong[];
  currentIndex: number;
  isShuffled: boolean;
  loopMode: "none" | "loop_playlist" | "loop_song";
  loading: boolean;
  error: string | null;
  
  getQueue: (userId: string) => Promise<void>;
  cloneQueue: (sourceId: string, sourceType: "album" | "playlist" | "single") => Promise<void>;
  addSongToQueue: (songId: string) => Promise<void>;
  nextSong: () => Promise<void>;
  prevSong: () => Promise<void>;
  toggleLoopMode: () => Promise<void>;
  toggleShuffle: () => Promise<void>;
}

export const useQueueStore = create<QueueState>((set) => ({
  queue: [],
  currentIndex: 0,
  isShuffled: false,
  loopMode: "none",
  loading: false,
  error: null,

  // 📌 Lấy danh sách queue của người dùng
  getQueue: async (userId) => {
    set({ loading: true, error: null });
    try {
      const response = await axiosInstance.get(`/queue/${userId}`);
      set({ queue: response.data.songs, currentIndex: response.data.currentIndex });
    } catch (error: any) {
      set({ error: error.message || "Lỗi khi lấy queue" });
    } finally {
      set({ loading: false });
    }
  },

  // 📌 Clone queue từ một nguồn (album, playlist, single)
  cloneQueue: async (sourceId, sourceType) => {
    set({ loading: true, error: null });
    try {
      const response = await axiosInstance.post(`/queue/clone`, {
        userId: localStorage.getItem("userId"),
        type: sourceType,
        id: sourceId,
      });
      set({ queue: response.data.queue.songs, currentIndex: 0 });
    } catch (error: any) {
      set({ error: error.message || "Lỗi khi clone queue" });
    } finally {
      set({ loading: false });
    }
  },

  // 📌 Thêm bài hát vào queue
  addSongToQueue: async (songId) => {
    set({ loading: true, error: null });
    try {
      const response = await axiosInstance.post(`/queue/${songId}/add`, {
        userId: localStorage.getItem("userId"),
      });
      set({ queue: response.data.queue.songs });
    } catch (error: any) {
      set({ error: error.message || "Lỗi khi thêm bài hát vào queue" });
    } finally {
      set({ loading: false });
    }
  },

  // 📌 Chuyển sang bài hát tiếp theo
  nextSong: async () => {
    set({ loading: true, error: null });
    try {
      const response = await axiosInstance.post(`/queue/next`, {
        userId: localStorage.getItem("userId"),
      });
      set({ queue: response.data.queue.songs, currentIndex: response.data.queue.currentIndex });
    } catch (error: any) {
      set({ error: error.message || "Lỗi khi chuyển bài" });
    } finally {
      set({ loading: false });
    }
  },

  // 📌 Quay lại bài hát trước đó
  prevSong: async () => {
    set({ loading: true, error: null });
    try {
      const response = await axiosInstance.post(`/queue/prev`, {
        userId: localStorage.getItem("userId"),
      });
      set({ queue: response.data.queue.songs, currentIndex: response.data.queue.currentIndex });
    } catch (error: any) {
      set({ error: error.message || "Lỗi khi quay lại bài hát trước" });
    } finally {
      set({ loading: false });
    }
  },

  // 📌 Bật/tắt chế độ lặp (loop)
  toggleLoopMode: async () => {
    set({ loading: true, error: null });
    try {
      const response = await axiosInstance.post(`/queue/toggle-loop`, {
        userId: localStorage.getItem("userId"),
      });
      set({ loopMode: response.data.queue.loopMode });
    } catch (error: any) {
      set({ error: error.message || "Lỗi khi chuyển đổi chế độ lặp" });
    } finally {
      set({ loading: false });
    }
  },

  // 📌 Bật/tắt chế độ xáo trộn (shuffle)
  toggleShuffle: async () => {
    set({ loading: true, error: null });
    try {
      const response = await axiosInstance.post(`/queue/toggle-shuffle`, {
        userId: localStorage.getItem("userId"),
      });
      set({ queue: response.data.queue.songs, isShuffled: response.data.queue.isShuffled });
    } catch (error: any) {
      set({ error: error.message || "Lỗi khi chuyển đổi chế độ shuffle" });
    } finally {
      set({ loading: false });
    }
  },
}));
