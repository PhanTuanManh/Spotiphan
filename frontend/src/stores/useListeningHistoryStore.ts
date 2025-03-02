import { axiosInstance } from "@/lib/axios";
import { IUserListeningHistory } from "@/types";
import { create } from "zustand";

interface ListeningHistoryState {
  history: IUserListeningHistory[];
  loading: boolean;
  error: string | null;
  totalPages: number;
  currentPage: number;
  
  getHistory: (page?: number, limit?: number) => Promise<void>;
  trackSongListening: (songId: string, playedDuration: number) => Promise<void>;
}

export const useListeningHistoryStore = create<ListeningHistoryState>((set) => ({
  history: [],
  loading: false,
  error: null,
  totalPages: 0,
  currentPage: 1,

  // 📌 Lấy danh sách lịch sử nghe nhạc (hỗ trợ phân trang)
  getHistory: async (page = 1, limit = 20) => {
    set({ loading: true, error: null });
    try {
      const response = await axiosInstance.get(`/history`, { params: { page, limit } });
      set({
        history: response.data.history,
        totalPages: response.data.totalPages,
        currentPage: page,
      });
    } catch (error: any) {
      set({ error: error.message || "Lỗi khi lấy lịch sử nghe nhạc" });
    } finally {
      set({ loading: false });
    }
  },

  // 📌 Ghi lại lịch sử nghe nhạc (khi người dùng nghe đủ lâu)
  trackSongListening: async (songId, playedDuration) => {
    try {
      await axiosInstance.post(`/history/track`, {
        songId,
        playedDuration,
      });
    } catch (error: any) {
      console.error("Lỗi khi lưu lịch sử nghe nhạc:", error.message);
    }
  },
}));
