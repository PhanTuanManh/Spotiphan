// src/stores/useSongStore.ts

import { create } from "zustand";
import { axiosInstance } from "@/lib/axios";  // Đảm bảo axiosInstance đã được cấu hình
import { ISong } from "@/types";  // Đảm bảo kiểu dữ liệu từ types/index.ts
import toast from "react-hot-toast";

interface SongStore {
  songs: ISong[];
  isLoading: boolean;
  error: string | null;
  currentSong: ISong | null;

  fetchSongs: () => Promise<void>;
  fetchSongById: (id: string) => Promise<void>;
  likeSong: (songId: string) => Promise<void>;
  dislikeSong: (songId: string) => Promise<void>;
  addSongToPlaylist: (songId: string, playlistId: string) => Promise<void>;
  removeSongFromPlaylist: (songId: string, playlistId: string) => Promise<void>;
}

export const useSongStore = create<SongStore>((set) => ({
  songs: [],
  isLoading: false,
  error: null,
  currentSong: null,

  // Fetch all songs
  fetchSongs: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await axiosInstance.get("/songs");
  
      console.log("API Response:", response.data); // Kiểm tra dữ liệu trả về
  
      // Lấy đúng dữ liệu từ API (response.data.data thay vì response.data)
      const songs = Array.isArray(response.data.data) ? response.data.data : [];
      set({ songs });
  
    } catch (error: any) {
      console.error("Fetch Songs Error:", error);
      set({ error: error.message, songs: [] }); // Đảm bảo songs luôn là mảng
      toast.error("Failed to fetch songs");
    } finally {
      set({ isLoading: false });
    }
  },
  
  
  // Fetch a song by ID
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

  // Like a song
  likeSong: async (songId: string) => {
    set({ isLoading: true, error: null });
    try {
      await axiosInstance.post(`/users/me/like-song`, { songId });
      toast.success("Song liked successfully");
    } catch (error: any) {
      set({ error: error.message });
      toast.error("Failed to like song");
    } finally {
      set({ isLoading: false });
    }
  },

  // Dislike a song
  dislikeSong: async (songId: string) => {
    set({ isLoading: true, error: null });
    try {
      await axiosInstance.post(`/users/me/dislike-song`, { songId });
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
      await axiosInstance.post(`/playlists/${playlistId}/add-song`, { songId });
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
      await axiosInstance.delete(`/playlists/${playlistId}/remove-song`, { data: { songId } });
      toast.success("Song removed from playlist successfully");
    } catch (error: any) {
      set({ error: error.message });
      toast.error("Failed to remove song from playlist");
    } finally {
      set({ isLoading: false });
    }
  },
}));

