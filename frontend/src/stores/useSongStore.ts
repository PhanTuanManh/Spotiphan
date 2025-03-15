// src/stores/useSongStore.ts

import { create } from "zustand";
import { axiosInstance } from "@/lib/axios"; // Đảm bảo axiosInstance đã được cấu hình
import { ISong } from "@/types"; // Đảm bảo kiểu dữ liệu từ types/index.ts
import toast from "react-hot-toast";
import { useAuthStore } from "./useAuthStore";

interface SongStore {
  songs: ISong[];
  page: number;
  isLoading: boolean;
  hasMore: boolean;
  error: string | null;
  currentSong: ISong | null;
  songsByArtist: Record<string, any[]>;

  fetchSongsByArtist: (
    artistId: string | null,
    page?: number,
    searchTerm?: string,
    type?: "album" | "single" | "all"
  ) => Promise<void>;
  fetchLatestSingles: () => Promise<void>;
  createSong: (songData: FormData) => Promise<void>;
  updateSong: (songId: string, songData: FormData) => Promise<void>;
  fetchSongs: () => Promise<void>;
  fetchSongById: (id: string) => Promise<void>;
  likeSong: (songId: string) => Promise<void>;
  fetchAllSingles: () => Promise<void>;
  fetchAllSinglesByArtist: (artistId: string) => Promise<void>;
  approveSingle: (songId: string) => Promise<void>;
  rejectSingle: (songId: string) => Promise<void>;
  dislikeSong: (songId: string) => Promise<void>;
  addSongToPlaylist: (songId: string, playlistId: string) => Promise<void>;
  removeSongFromPlaylist: (songId: string, playlistId: string) => Promise<void>;
  archiveSingle: (songId: string) => Promise<void>;
  unarchiveSingle: (songId: string) => Promise<void>;
  deleteSong: (songId: string) => Promise<void>;
  deleteSongbyArtist: (songId: string) => Promise<void>;
  toggleArchiveSong: (songId: string) => Promise<void>;
}

export const useSongStore = create<SongStore>((set) => ({
  songs: [],
  page: 1,
  isLoading: false,
  hasMore: true,
  error: null,
  currentSong: null,
  songsByArtist: {},

  // Fetch all songs
  fetchSongs: async (page = 1, searchTerm = "") => {
    set({ isLoading: true, error: null });

    try {
      const response = await axiosInstance.get("/songs", {
        params: { page, limit: 10, search: searchTerm }, // ✅ Ensure correct API request
      });

      const newSongs = response.data.data;
      const hasMore = newSongs.length > 0;

      set((state) => ({
        songs: page === 1 ? newSongs : [...state.songs, ...newSongs],
        page,
        hasMore,
      }));
    } catch (error: any) {
      set({ error: error.message });
      toast.error("Failed to fetch songs");
    } finally {
      set({ isLoading: false });
    }
  },

  // Fetch all single songs
  fetchAllSingles: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await axiosInstance.get("/admin/singles");
      const songs = Array.isArray(response.data.singles)
        ? response.data.singles
        : [];
      set({ songs });
    } catch (error: any) {
      console.error("❌ Fetch Songs Error:", error);
      set({ error: error.message, songs: [] });
      toast.error("Failed to fetch songs");
    } finally {
      set({ isLoading: false });
    }
  },

  fetchAllSinglesByArtist: async (artistId: string, page = 1) => {
    set({ isLoading: true, error: null });

    try {
      const response = await axiosInstance.get(`/artists/singles/${artistId}`, {
        params: { page, limit: 10 },
      });

      const singles = Array.isArray(response.data.singles)
        ? response.data.singles
        : [];

      set((state) => ({
        songsByArtist: {
          ...state.songsByArtist,
          [artistId]:
            page === 1
              ? singles // ✅ Nếu là trang đầu tiên, ghi đè danh sách
              : [...(state.songsByArtist[artistId] || []), ...singles], // ✅ Nếu trang sau, nối dữ liệu vào danh sách cũ
        },
        page,
        hasMore: singles.length === 10, // ✅ Kiểm tra nếu còn dữ liệu
      }));

      console.log(
        `🎵 Lấy Single/EP của Artist ${artistId} - Trang ${page}:`,
        singles
      );
    } catch (error: any) {
      console.error("❌ Fetch Singles Error:", error);
      set({ error: error.message, songsByArtist: {} });
      toast.error("Failed to fetch singles");
    } finally {
      set({ isLoading: false });
    }
  },

  // Fetch a single song by ID
  fetchSongById: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await axiosInstance.get(`/songs/${id}`);
      set({ currentSong: response.data });
    } catch (error: any) {
      set({ error: error.message });
      toast.error("Failed to fetch song details");
    } finally {
      set({ isLoading: false });
    }
  },

  // fetchSongByArtist
  fetchSongsByArtist: async (
    artistId: string | null,
    page: number = 1,
    searchTerm: string = "",
    type: "album" | "single" | "all" = "all" // ✅ Thêm type để lọc album hoặc single
  ) => {
    if (!artistId) {
      console.error("❌ Không thể tải bài hát: artistId bị null");
      return;
    }

    set({ isLoading: true, error: null });

    try {
      const response = await axiosInstance.get(`/artists/songs/${artistId}`, {
        params: {
          page,
          limit: 10,
          search: searchTerm,
          type: type !== "all" ? type : undefined, // ✅ Nếu type là "all", không gửi tham số lọc
        },
      });

      const newSongs = response.data.data;
      const hasMore = newSongs.length === 10;

      set((state) => ({
        songsByArtist: {
          ...state.songsByArtist,
          [artistId]:
            page === 1
              ? newSongs
              : [...(state.songsByArtist[artistId] || []), ...newSongs],
        },
        page,
        hasMore,
      }));
    } catch (error: any) {
      console.error("❌ Fetch Songs Error:", error);
      set({ error: error.message });
      toast.error("❌ Lỗi khi tải danh sách bài hát");
    } finally {
      set({ isLoading: false });
    }
  },

  // Create a new song
  createSong: async (songData: FormData) => {
    const { user_id } = useAuthStore.getState();
    set({ isLoading: true, error: null });
    try {
      await axiosInstance.post("/artists/songs", songData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      await useSongStore.getState().fetchSongsByArtist(user_id);
      toast.success("Song created successfully");
    } catch (error: any) {
      set({ error: error.message });
      toast.error("Failed to create song");
    } finally {
      set({ isLoading: false });
    }
  },

  // Approve a song (Admin only)
  approveSingle: async (songId: string) => {
    set({ isLoading: true, error: null });
    try {
      await axiosInstance.put(`/songs/singles/${songId}/approve`);
      set((state) => ({
        songs: state.songs.map((song) =>
          song._id === songId ? { ...song, status: "approved" } : song
        ),
      }));
      toast.success("Song approved successfully");
    } catch (error: any) {
      set({ error: error.message });
      toast.error("Failed to approve song");
    } finally {
      set({ isLoading: false });
    }
  },

  // Reject a song (Admin only)
  rejectSingle: async (songId: string) => {
    set({ isLoading: true, error: null });
    try {
      await axiosInstance.put(`/songs/singles/${songId}/reject`);
      set((state) => ({
        songs: state.songs.map((song) =>
          song._id === songId ? { ...song, status: "rejected" } : song
        ),
      }));
      toast.success("Song rejected successfully");
    } catch (error: any) {
      set({ error: error.message });
      toast.error("Failed to reject song");
    } finally {
      set({ isLoading: false });
    }
  },

  // Archive a song
  archiveSingle: async (songId: string) => {
    set({ isLoading: true, error: null });
    try {
      await axiosInstance.put(`/songs/singles/${songId}/archive`);
      set((state) => ({
        songs: state.songs.map((song) =>
          song._id === songId ? { ...song, status: "archived" } : song
        ),
      }));
      toast.success("Song archived successfully");
    } catch (error: any) {
      set({ error: error.message });
      toast.error("Failed to archive song");
    } finally {
      set({ isLoading: false });
    }
  },

  // Unarchive a song
  unarchiveSingle: async (songId: string) => {
    set({ isLoading: true, error: null });
    try {
      await axiosInstance.put(`/songs/singles/${songId}/unarchive`);
      set((state) => ({
        songs: state.songs.map((song) =>
          song._id === songId ? { ...song, status: "pending" } : song
        ),
      }));
      toast.success("Song unarchived successfully");
    } catch (error: any) {
      set({ error: error.message });
      toast.error("Failed to unarchive song");
    } finally {
      set({ isLoading: false });
    }
  },

  // Delete a song
  deleteSong: async (songId: string) => {
    set({ isLoading: true, error: null });
    try {
      await axiosInstance.delete(`/songs/singles/${songId}`);
      set((state) => ({
        songs: state.songs.filter((song) => song._id !== songId),
      }));
      toast.success("Song deleted successfully");
    } catch (error: any) {
      set({ error: error.message });
      toast.error("Failed to delete song");
    } finally {
      set({ isLoading: false });
    }
  },

  // Like a song
  likeSong: async (songId: string) => {
    set({ isLoading: true, error: null });
    try {
      await axiosInstance.post(`/users/me/like-song`, { songId });
      set((state) => ({
        songs: state.songs.map((song) =>
          song._id === songId ? { ...song, liked: true } : song
        ),
      }));
      toast.success("Song liked successfully");
    } catch (error: any) {
      set({ error: error.message });
      toast.error("Failed to like song");
    } finally {
      set({ isLoading: false });
    }
  },
  // Dislike a song set stage
  dislikeSong: async (songId: string) => {
    set({ isLoading: true, error: null });
    try {
      await axiosInstance.post(`/users/me/dislike-song`, { songId });
      set((state) => ({
        songs: state.songs.map((song) =>
          song._id === songId ? { ...song, liked: false } : song
        ),
      }));
      toast.success("Song disliked successfully");
    } catch (error: any) {
      set({ error: error.message });
      toast.error("Failed to dislike song");
    } finally {
      set({ isLoading: false });
    }
  },

  // Add a song to a playlist
  addSongToPlaylist: async (songId: string, playlistId: string) => {
    set({ isLoading: true, error: null });
    try {
      await axiosInstance.post(`/playlists/${playlistId}/add-song`, {
        songId,
      });
      set((state) => ({
        songs: state.songs.map((song) =>
          song._id === songId ? { ...song, addedToPlaylist: true } : song
        ),
      }));
      toast.success("Song added to playlist successfully");
    } catch (error: any) {
      set({ error: error.message });
      toast.error("Failed to add song to playlist");
    } finally {
      set({ isLoading: false });
    }
  },

  // Remove a song from a playlist
  removeSongFromPlaylist: async (songId: string, playlistId: string) => {
    set({ isLoading: true, error: null });
    try {
      await axiosInstance.delete(`/playlists/${playlistId}/remove-song`, {
        data: { songId },
      });
      set((state) => ({
        songs: state.songs.map((song) =>
          song._id === songId ? { ...song, addedToPlaylist: false } : song
        ),
      }));
      toast.success("Song removed from playlist successfully");
    } catch (error: any) {
      set({ error: error.message });
      toast.error("Failed to remove song from playlist");
    } finally {
      set({ isLoading: false });
    }
  },
  deleteSongbyArtist: async (songId) => {
    set({ isLoading: true, error: null });

    try {
      await axiosInstance.delete(`/artists/songs/${songId}`);
      set((state) => ({
        songsByArtist: Object.fromEntries(
          Object.entries(state.songsByArtist).map(([artistId, songs]) => [
            artistId,
            songs.filter((song) => song._id !== songId),
          ])
        ),
      }));
      toast.success("🎵 Bài hát đã được xóa");
    } catch (error: any) {
      set({ error: error.message });
      toast.error("❌ Không thể xóa bài hát");
    } finally {
      set({ isLoading: false });
    }
  },

  // 🔥 Toggle Lưu trữ / Bỏ lưu trữ bài hát
  toggleArchiveSong: async (songId) => {
    set((state) => ({
      isLoading: true,
      error: null,
      // 🔹 Cập nhật ngay lập tức trước khi gửi request
      songsByArtist: Object.fromEntries(
        Object.entries(state.songsByArtist).map(([artistId, songs]) => [
          artistId,
          songs.map((song) =>
            song._id === songId
              ? {
                  ...song,
                  status: song.status === "archived" ? "pending" : "archived",
                }
              : song
          ),
        ])
      ),
    }));

    try {
      await axiosInstance.patch(`/artists/songs/${songId}/toggle-archive`);
      toast.success("🎵 Trạng thái bài hát đã được cập nhật");
    } catch (error: any) {
      set({ error: error.message });
      toast.error("❌ Không thể thay đổi trạng thái bài hát");
    } finally {
      set({ isLoading: false });
    }
  },

  // 🔥 Cập nhật bài hát
  updateSong: async (songId, songData) => {
    set({ isLoading: true, error: null });

    try {
      const response = await axiosInstance.put(
        `/artists/songs/${songId}`,
        songData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );

      const updatedSong = response.data.song;
      set((state) => ({
        songsByArtist: Object.fromEntries(
          Object.entries(state.songsByArtist).map(([artistId, songs]) => [
            artistId,
            songs.map((song) => (song._id === songId ? updatedSong : song)),
          ])
        ),
      }));

      toast.success("🎵 Bài hát đã được cập nhật");
    } catch (error: any) {
      set({ error: error.message });
      toast.error("❌ Không thể cập nhật bài hát");
    } finally {
      set({ isLoading: false });
    }
  },

  fetchLatestSingles: async () => {
    set({ isLoading: true, error: null });

    try {
      // Gọi API lấy danh sách 6 single mới nhất
      const response = await axiosInstance.get("/songs/singles/lastest");

      // Kiểm tra dữ liệu trả về có đúng dạng array không
      const latestSingles = Array.isArray(response.data) ? response.data : [];

      // Cập nhật store với danh sách mới nhất
      set({ songs: latestSingles, hasMore: latestSingles.length > 0 });
    } catch (error: any) {
      console.error("❌ Fetch Latest Singles Error:", error);
      set({ error: error.message, songs: [] });
      toast.error("Failed to fetch latest singles");
    } finally {
      set({ isLoading: false });
    }
  },
}));
