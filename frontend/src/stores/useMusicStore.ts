// src/stores/useMusicStore.ts

import { axiosInstance } from "@/lib/axios";
import { IAlbum, IQueue, ISong, IStats, IUserListeningHistory } from "@/types";
import toast from "react-hot-toast";
import { create } from "zustand";

interface MusicStore {
  songs: ISong[];
  albums: IAlbum[];
  isLoading: boolean;
  error: string | null;
  currentAlbum: IAlbum | null;
  featuredSongs: ISong[];
  madeForYouSongs: ISong[];
  trendingSongs: ISong[];
  stats: IStats;
  userQueue: IQueue[]; // Added for managing queue
  userListeningHistory: IUserListeningHistory[]; // Added for user listening history

  fetchAlbums: () => Promise<void>;
  fetchAlbumById: (id: string) => Promise<void>;
  fetchFeaturedSongs: () => Promise<void>;
  fetchMadeForYouSongs: () => Promise<void>;
  fetchTrendingSongs: () => Promise<void>;
  fetchStats: () => Promise<void>;
  fetchLatestSingles: () => Promise<void>;
  fetchSongs: () => Promise<void>;
  fetchUserQueue: (userId: string) => Promise<void>; // Added for queue fetching
  fetchUserListeningHistory: (userId: string) => Promise<void>; // Added for history
  deleteSong: (id: string) => Promise<void>;
}

export const useMusicStore = create<MusicStore>((set) => ({
  songs: [],
  albums: [],
  isLoading: false,
  error: null,
  currentAlbum: null,
  featuredSongs: [],
  madeForYouSongs: [],
  trendingSongs: [],
  stats: {
    totalSongs: 0,
    totalAlbums: 0,
    totalUsers: 0,
    totalArtists: 0,
    totalPlaylists: 0,
  },
  userQueue: [],
  userListeningHistory: [],

  deleteSong: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await axiosInstance.delete(`/admin/songs/${id}`);
      set((state) => ({
        songs: state.songs.filter((song) => song._id !== id),
      }));
      toast.success("Song deleted successfully");
    } catch (error: any) {
      toast.error("Error deleting song");
      set({ error: error.message });
    } finally {
      set({ isLoading: false });
    }
  },

  fetchSongs: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await axiosInstance.get("/songs");
      set({ songs: response.data });
    } catch (error: any) {
      set({ error: error.message });
    } finally {
      set({ isLoading: false });
    }
  },

  fetchStats: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await axiosInstance.get("/stats");
      set({ stats: response.data });
    } catch (error: any) {
      set({ error: error.message });
    } finally {
      set({ isLoading: false });
    }
  },

  fetchAlbums: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await axiosInstance.get("/albums");
      const albumsData = response.data.albums;

      if (!Array.isArray(albumsData)) {
        console.error("API returned non-array albums:", albumsData);
        set({ albums: [] }); // ✅ Đảm bảo albums luôn là mảng
      } else {
        set({ albums: albumsData });
      }
    } catch (error: any) {
      set({ error: error.message, albums: [] }); // ✅ Tránh lỗi nếu API thất bại
    } finally {
      set({ isLoading: false });
    }
  },

  fetchAlbumById: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const response = await axiosInstance.get(`/albums/${id}`);
      set({ currentAlbum: response.data });
    } catch (error: any) {
      set({ error: error.message });
    } finally {
      set({ isLoading: false });
    }
  },

  fetchFeaturedSongs: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await axiosInstance.get("/songs/singles/lastest");
      const latestSingles = Array.isArray(response.data) ? response.data : [];
      set({ featuredSongs: latestSingles });
    } catch (error: any) {
      set({ error: error.message });
    } finally {
      set({ isLoading: false });
    }
  },

  fetchLatestSingles: async () => {
    set({ isLoading: true, error: null });
    try {
      // Gọi API lấy danh sách 6 single mới nhất
      const response = await axiosInstance.get("/songs/singles/lastest");
      const latestSingles = Array.isArray(response.data) ? response.data : [];
      set({ songs: latestSingles });
    } catch (error: any) {
      console.error("❌ Fetch Latest Singles Error:", error);
      set({ error: error.message, songs: [] });
      toast.error("Failed to fetch latest singles");
    } finally {
      set({ isLoading: false });
    }
  },

  fetchMadeForYouSongs: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await axiosInstance.get("/songs/made-for-you");
      set({ madeForYouSongs: response.data });
    } catch (error: any) {
      set({ error: error.message });
    } finally {
      set({ isLoading: false });
    }
  },

  fetchTrendingSongs: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await axiosInstance.get("/songs/trending");
      set({ trendingSongs: response.data });
    } catch (error: any) {
      set({ error: error.message });
    } finally {
      set({ isLoading: false });
    }
  },

  fetchUserQueue: async (userId) => {
    set({ isLoading: true, error: null });
    try {
      const response = await axiosInstance.get(`/queue/${userId}`);
      set({ userQueue: response.data.songs });
    } catch (error: any) {
      set({ error: error.message });
    } finally {
      set({ isLoading: false });
    }
  },

  fetchUserListeningHistory: async (userId) => {
    set({ isLoading: true, error: null });
    try {
      const response = await axiosInstance.get(`/history?userId=${userId}`);
      set({ userListeningHistory: response.data });
    } catch (error: any) {
      set({ error: error.message });
    } finally {
      set({ isLoading: false });
    }
  },
}));
