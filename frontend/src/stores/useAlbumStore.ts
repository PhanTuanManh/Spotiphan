import { axiosInstance } from "@/lib/axios";
import { IAlbum } from "@/types";
import toast from "react-hot-toast";
import { create } from "zustand";

interface AlbumStore {
  albums: IAlbum[];
  currentAlbum: IAlbum | null;
  isLoading: boolean;
  error: string | null;

  fetchApprovedAlbums: () => Promise<void>;
  fetchAllAlbumsAdmin: () => Promise<void>;
  fetchMyAlbums: () => Promise<void>;
  fetchAlbumById: (id: string) => Promise<void>;
  createAlbum: (albumData: FormData) => Promise<void>;
  updateAlbum: (id: string, albumData: FormData) => Promise<void>;
  deleteAlbum: (id: string) => Promise<void>;
  approveAlbum: (id: string) => Promise<void>;
  rejectAlbum: (id: string) => Promise<void>;
  archiveAlbum: (id: string) => Promise<void>;
  archiveAlbumByArtist: (id: string) => Promise<void>;
  unarchiveAlbum: (id: string) => Promise<void>;
  removeSongFromAlbum: (albumId: string, songId: string) => Promise<void>;
}

export const useAlbumStore = create<AlbumStore>((set) => ({
  albums: [],
  currentAlbum: null,
  isLoading: false,
  error: null,

  // Fetch approved albums (public)
  fetchApprovedAlbums: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await axiosInstance.get("/albums");
      set({ albums: response.data.albums });
    } catch (error: any) {
      set({ error: error.message });
    } finally {
      set({ isLoading: false });
    }
  },

  // Fetch all albums (Admin only)
  fetchAllAlbumsAdmin: async () => {
    set({ isLoading: true, error: null });

    try {
      const response = await axiosInstance.get("/admin/albums");
      set({ albums: response.data.albums });
    } catch (error: any) {
      set({ error: error.message });
    } finally {
      set({ isLoading: false });
    }
  },

  // Fetch artist's own albums
  fetchMyAlbums: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await axiosInstance.get("/artists/my-albums");
      set({ albums: response.data.albums });
    } catch (error: any) {
      set({ error: error.message });
    } finally {
      set({ isLoading: false });
    }
  },

  // Fetch album by ID
  fetchAlbumById: async (id: string) => {
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

  // Create a new album (Artist only)
  createAlbum: async (albumData: FormData) => {
    set({ isLoading: true, error: null });
    try {
      const response = await axiosInstance.post("/artists/albums", albumData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      set((state) => ({
        albums: [...state.albums, response.data.album],
      }));
      toast.success("Album created successfully");
    } catch (error: any) {
      set({ error: error.message });
    } finally {
      set({ isLoading: false });
    }
  },

  // Update an existing album (Artist only)
  updateAlbum: async (id: string, albumData: FormData) => {
    set({ isLoading: true, error: null });

    try {
      console.log("🚀 Gửi request cập nhật album:", id, albumData);

      await axiosInstance.put(`/artists/albums/${id}`, albumData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      await useAlbumStore.getState().fetchMyAlbums();

      toast.success("🎵 Album updated successfully");
    } catch (error: any) {
      console.error(
        "❌ Lỗi khi cập nhật album:",
        error.response?.data || error
      );
      set({ error: error.message });
      toast.error("❌ Failed to update album");
    } finally {
      set({ isLoading: false });
    }
  },

  // Delete an album (Admin only)
  deleteAlbum: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      await axiosInstance.delete(`/albums/${id}`);
      set((state) => ({
        albums: state.albums.filter((album) => album._id !== id),
      }));
    } catch (error: any) {
      set({ error: error.message });
    } finally {
      set({ isLoading: false });
    }
  },

  // Approve an album (Admin only)
  approveAlbum: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      await axiosInstance.put(`/admin/albums/${id}/approve`);
      set((state) => ({
        albums: state.albums.map((album) =>
          album._id === id ? { ...album, status: "approved" } : album
        ),
      }));
    } catch (error: any) {
      set({ error: error.message });
    } finally {
      set({ isLoading: false });
    }
  },

  // Reject an album (Admin only)
  rejectAlbum: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      await axiosInstance.put(`/admin/albums/${id}/reject`);
      set((state) => ({
        albums: state.albums.map((album) =>
          album._id === id ? { ...album, status: "rejected" } : album
        ),
      }));
    } catch (error: any) {
      set({ error: error.message });
    } finally {
      set({ isLoading: false });
    }
  },

  archiveAlbum: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      await axiosInstance.put(`/albums/${id}/archive`);
      set((state) => ({
        albums: state.albums.map((album) =>
          album._id === id ? { ...album, status: "archived" } : album
        ),
      }));
      toast.success("Album archived successfully");
    } catch (error: any) {
      set({ error: error.message });
      toast.error("Failed to archive album");
    } finally {
      set({ isLoading: false });
    }
  },

  archiveAlbumByArtist: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      await axiosInstance.put(`/albums/${id}/archive`);
      await useAlbumStore.getState().fetchMyAlbums();
      toast.success("Album archived successfully");
    } catch (error: any) {
      set({ error: error.message });
      toast.error("Failed to archive album");
    } finally {
      set({ isLoading: false });
    }
  },

  unarchiveAlbum: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      await axiosInstance.put(`/albums/${id}/unarchive`);
      set((state) => ({
        albums: state.albums.map((album) =>
          album._id === id ? { ...album, status: "pending" } : album
        ),
      }));
      toast.success("Album unarchived successfully");
    } catch (error: any) {
      set({ error: error.message });
      toast.error("Failed to unarchive album");
    } finally {
      set({ isLoading: false });
    }
  },

  // Remove a song from an album (Artist only)
  removeSongFromAlbum: async (albumId: string, songId: string) => {
    set({ isLoading: true, error: null });
    try {
      await axiosInstance.put(
        `/artist/albums/${albumId}/remove-song/${songId}`
      );
      set((state) => ({
        albums: state.albums.map((album) =>
          album._id === albumId
            ? { ...album, songs: album.songs.filter((song) => song !== songId) }
            : album
        ),
      }));
    } catch (error: any) {
      set({ error: error.message });
    } finally {
      set({ isLoading: false });
    }
  },
}));
