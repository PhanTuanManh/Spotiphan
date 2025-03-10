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
  fetchAllSingles: () => Promise<void>;
  approveSingle: (songId: string) => Promise<void>;
  rejectSingle: (songId: string) => Promise<void>;
  dislikeSong: (songId: string) => Promise<void>;
  addSongToPlaylist: (songId: string, playlistId: string) => Promise<void>;
  removeSongFromPlaylist: (songId: string, playlistId: string) => Promise<void>;
  archiveSingle: (songId: string) => Promise<void>;
  unarchiveSingle: (songId: string) => Promise<void>;
  deleteSong: (songId: string) => Promise<void>;
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
  
  
 // Fetch all single songs
 fetchAllSingles: async () => {
  set({ isLoading: true, error: null });
  try {
    const response = await axiosInstance.get("/songs/singles");
    const songs = Array.isArray(response.data.singles) ? response.data.singles : [];
    set({ songs });
  } catch (error: any) {
    console.error("❌ Fetch Songs Error:", error);
    set({ error: error.message, songs: [] });
    toast.error("Failed to fetch songs");
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
      await axiosInstance.post(`/api/playlists/${playlistId}/add-song`, { songId });
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
      await axiosInstance.delete(`/playlists/${playlistId}/remove-song`, { data: { songId } });
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
}));

