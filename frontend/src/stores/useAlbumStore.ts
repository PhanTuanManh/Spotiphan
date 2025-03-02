import { create } from "zustand";
import { axiosInstance } from "@/lib/axios";  // Đảm bảo axiosInstance đã được cấu hình
import { IAlbum } from "@/types";  // Đảm bảo kiểu dữ liệu từ types/index.ts
import toast from "react-hot-toast";

interface AlbumStore {
  albums: IAlbum[];
  currentAlbum: IAlbum | null;
  isLoading: boolean;
  error: string | null;

  fetchAlbums: () => Promise<void>;
  fetchAlbumById: (id: string) => Promise<void>;
  createAlbum: (albumData: IAlbum) => Promise<void>;
  updateAlbum: (id: string, albumData: IAlbum) => Promise<void>;
  deleteAlbum: (id: string) => Promise<void>;
}

export const useAlbumStore = create<AlbumStore>((set) => ({
  albums: [],
  currentAlbum: null,
  isLoading: false,
  error: null,

  // Fetch all albums
  fetchAlbums: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await axiosInstance.get("/api/albums");
      set({ albums: response.data });
    } catch (error: any) {
      set({ error: error.message });
      toast.error("Failed to fetch albums");
    } finally {
      set({ isLoading: false });
    }
  },

  // Fetch album by ID
  fetchAlbumById: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await axiosInstance.get(`/api/albums/${id}`);
      set({ currentAlbum: response.data });
    } catch (error: any) {
      set({ error: error.message });
      toast.error("Failed to fetch album details");
    } finally {
      set({ isLoading: false });
    }
  },

  // Create a new album (Artist only)
  createAlbum: async (albumData: IAlbum) => {
    set({ isLoading: true, error: null });
    try {
      const response = await axiosInstance.post("/api/albums", albumData);
      set((state) => ({
        albums: [...state.albums, response.data],
      }));
      toast.success("Album created successfully");
    } catch (error: any) {
      set({ error: error.message });
      toast.error("Failed to create album");
    } finally {
      set({ isLoading: false });
    }
  },

  // Update an existing album (Artist only)
  updateAlbum: async (id: string, albumData: IAlbum) => {
    set({ isLoading: true, error: null });
    try {
      const response = await axiosInstance.put(`/api/albums/${id}`, albumData);
      set((state) => ({
        albums: state.albums.map((album) =>
          album._id === id ? response.data : album
        ),
      }));
      toast.success("Album updated successfully");
    } catch (error: any) {
      set({ error: error.message });
      toast.error("Failed to update album");
    } finally {
      set({ isLoading: false });
    }
  },

  // Delete an album (Admin only)
  deleteAlbum: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      await axiosInstance.delete(`/api/admin/albums/${id}`);
      set((state) => ({
        albums: state.albums.filter((album) => album._id !== id),
      }));
      toast.success("Album deleted successfully");
    } catch (error: any) {
      set({ error: error.message });
      toast.error("Failed to delete album");
    } finally {
      set({ isLoading: false });
    }
  },
}));
