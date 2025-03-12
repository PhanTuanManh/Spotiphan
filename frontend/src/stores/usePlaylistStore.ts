import { axiosInstance } from "@/lib/axios"; // Đảm bảo axiosInstance đã được cấu hình
import { IPlaylist } from "@/types"; // Đảm bảo kiểu dữ liệu từ types/index.ts
import toast from "react-hot-toast";
import { create } from "zustand";

interface PlaylistStore {
  playlists: IPlaylist[];
  currentPlaylist: IPlaylist | null;
  isLoading: boolean;
  error: string | null;

  fetchHomePlaylists: () => Promise<void>;
  fetchPlaylistById: (id: string) => Promise<void>;
  createPlaylist: (playlistData: IPlaylist) => Promise<void>;
  updatePlaylist: (id: string, playlistData: IPlaylist) => Promise<void>;
  deletePlaylist: (id: string) => Promise<void>;
  addSongToPlaylist: (songId: string, playlistId: string) => Promise<void>;
  removeSongFromPlaylist: (songId: string, playlistId: string) => Promise<void>;
  searchPlaylists: (searchTerm: string) => Promise<void>;
  fetchMyPlaylists: () => Promise<void>;
}

export const usePlaylistStore = create<PlaylistStore>((set) => ({
  playlists: [],
  currentPlaylist: null,
  isLoading: false,
  error: null,

  // Fetch all playlists for the user
  fetchHomePlaylists: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await axiosInstance.get("/playlists/home");
      set({ playlists: response.data.playlists });
    } catch (error: any) {
      set({ error: error.message });
      toast.error("Failed to fetch playlists");
    } finally {
      set({ isLoading: false });
    }
  },

  // Fetch playlist by ID
  fetchPlaylistById: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await axiosInstance.get(`/playlists/${id}`);
      set({ currentPlaylist: response.data.playlist });
    } catch (error: any) {
      set({ error: error.message });
      toast.error("Failed to fetch playlist details");
    } finally {
      set({ isLoading: false });
    }
  },

  // fetch my playlist
  fetchMyPlaylists: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await axiosInstance.get("/playlists/my-playlists");
      set({ playlists: response.data.playlists });
    } catch (error: any) {
      set({ error: error.message });
      toast.error("Failed to fetch playlist details");
    } finally {
      set({ isLoading: false });
    }
  },

  // Create a new playlist (Premium, Artist, Admin)
  createPlaylist: async (playlistData: IPlaylist) => {
    set({ isLoading: true, error: null });
    try {
      await axiosInstance.post("/playlists", playlistData);
      await usePlaylistStore.getState().fetchMyPlaylists();
      toast.success("Playlist created successfully");
    } catch (error: any) {
      set({ error: error.message });
      toast.error("Failed to create playlist");
    } finally {
      set({ isLoading: false });
    }
  },

  // Update an existing playlist
  updatePlaylist: async (id: string, playlistData: IPlaylist) => {
    set({ isLoading: true, error: null });
    try {
      await axiosInstance.put(`/playlists/${id}`, playlistData);
      await usePlaylistStore.getState().fetchMyPlaylists();
      toast.success("Playlist updated successfully");
    } catch (error: any) {
      set({ error: error.message });
      toast.error("Failed to update playlist");
    } finally {
      set({ isLoading: false });
    }
  },

  // Delete a playlist
  deletePlaylist: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      await axiosInstance.delete(`/playlists/${id}`);
      await usePlaylistStore.getState().fetchMyPlaylists();
      toast.success("Playlist deleted successfully");
    } catch (error: any) {
      set({ error: error.message });
      toast.error("Failed to delete playlist");
    } finally {
      set({ isLoading: false });
    }
  },
  // Add song to playlist set stage
  addSongToPlaylist: async (songId: string, playlistId: string) => {
    set({ isLoading: true, error: null });
    try {
      await axiosInstance.post(`/playlists/${playlistId}/add-song`, { songId });
      await usePlaylistStore.getState().fetchMyPlaylists();
      toast.success("Song added to playlist successfully");
    } catch (error: any) {
      set({ error: error.message });
      toast.error("Failed to add song to playlist");
    } finally {
      set({ isLoading: false });
    }
  },

  // Remove song from playlist set stage
  removeSongFromPlaylist: async (songId: string, playlistId: string) => {
    set({ isLoading: true, error: null });
    try {
      await axiosInstance.delete(`/playlists/${playlistId}/remove-song`, {
        data: { songId },
      });
      await usePlaylistStore.getState().fetchMyPlaylists();
      toast.success("Song removed from playlist successfully");
    } catch (error: any) {
      set({ error: error.message });
      toast.error("Failed to remove song from playlist");
    } finally {
      set({ isLoading: false });
    }
  },

  // Search for public playlists
  searchPlaylists: async (searchTerm: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await axiosInstance.get(
        `/playlists/search?query=${searchTerm}`
      );
      set({ playlists: response.data });
    } catch (error: any) {
      set({ error: error.message });
      toast.error("Failed to search playlists");
    } finally {
      set({ isLoading: false });
    }
  },
}));
