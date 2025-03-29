// frontend/src/stores/useMusicStore.ts

import { axiosInstance } from "@/lib/axios";
import {
  IPlaylist,
  IAlbum,
  IQueue,
  ISong,
  IStats,
  IUserListeningHistory,
} from "@/types";
import toast from "react-hot-toast";
import { create } from "zustand";
import { useChatStore } from "./useChatStore";

interface MusicStore {
  playlists: IPlaylist[];
  songs: ISong[];
  albums: IAlbum[];
  isLoading: boolean;
  currentPlaylist: IPlaylist | null;
  error: string | null;
  currentAlbum: IAlbum | null;
  featuredSongs: ISong[];
  madeForYouSongs: ISong[];
  trendingSongs: ISong[];
  stats: IStats;
  userQueue: IQueue[]; // Added for managing queue
  userListeningHistory: IUserListeningHistory[]; // Added for user listening history
  likedSongs: string[]; // Thêm trạng thái để lưu danh sách các bài hát đã thích

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
  toggleLikeSong: (songId: string, userId: string) => void; // Không cần async nữa
  fetchPlaylists: () => Promise<void>; // Thêm hàm lấy danh sách playlist
  fetchSongById: (id: string) => Promise<void>; // Thêm hàm lấy chi tiết playlist
  fetchPlaylistById: (id: string) => Promise<void>; // Thêm hàm lấy chi tiết playlist
}

export const useMusicStore = create<MusicStore>((set, get) => ({
  songs: [],
  albums: [],
  playlists: [],
  isLoading: false,
  error: null,
  currentAlbum: null,
  currentPlaylist: null,
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
  likedSongs: [],

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

  // Hàm lấy danh sách playlist
  fetchPlaylists: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await axiosInstance.get("/playlists/my-playlists");
      console.log("API Response:", response.data); // Debug: Kiểm tra dữ liệu trả về
      set({ playlists: response.data.playlists });
    } catch (error: any) {
      set({ error: error.message });
    } finally {
      set({ isLoading: false });
    }
  },

  // Hàm lấy chi tiết playlist
  fetchPlaylistById: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await axiosInstance.get(`/playlists/${id}`);
      console.log("API Response:", response.data); // Debug: Kiểm tra dữ liệu trả về
      set({ currentPlaylist: response.data }); // Cập nhật currentPlaylist
    } catch (error: any) {
      console.error("Error fetching playlist:", error); // Debug: Kiểm tra lỗi
      set({ error: error.message });
    } finally {
      set({ isLoading: false });
    }
  },

  toggleLikeSong: (songId, userId) => {
    const socket = useChatStore.getState().socket; // Lấy socket từ useChatStore

    if (socket) {
      // Gửi sự kiện toggle_like qua WebSocket
      socket.emit("toggle_like", { songId, userId });

      // Optimistic UI: Cập nhật trạng thái ngay lập tức
      set((state) => {
        const isLiked = state.likedSongs.includes(songId);
        const likedSongs = isLiked
          ? state.likedSongs.filter((id) => id !== songId) // Bỏ like
          : [...state.likedSongs, songId]; // Thêm like

        return { likedSongs };
      });

      toast.success(
        get().likedSongs.includes(songId)
          ? "Song liked successfully"
          : "Song unliked successfully"
      );
    } else {
      toast.error("WebSocket connection error");
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
      const response = await axiosInstance.get("/songs/featured");
      set({ featuredSongs: response.data });
    } catch (error: any) {
      set({ error: error.response.data.message });
    } finally {
      set({ isLoading: false });
    }
  },

  fetchLatestSingles: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await axiosInstance.get<ISong[]>(
        "/songs/singles/lastest"
      );
      set({ songs: response.data });
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

  fetchSongById: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const response = await axiosInstance.get(`/songs/${id}`);
      set({ currentSong: response.data });
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
