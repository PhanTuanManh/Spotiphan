import { create } from "zustand";
import {axiosInstance} from "@/lib/axios";
import { IAdvertisement } from "@/types";

interface AdvertisementState {
  advertisements: IAdvertisement[]; // Danh sách quảng cáo active cho người dùng
  allAdvertisements: IAdvertisement[]; // Danh sách tất cả quảng cáo (Admin)
  loading: boolean;
  error: string | null;

  getActiveAdvertisements: () => Promise<void>; // Lấy quảng cáo active
  getAllAdvertisements: (page?: number, limit?: number) => Promise<void>; // Lấy tất cả quảng cáo (Admin)
  createAdvertisement: (data: Omit<IAdvertisement, "_id" | "createdAt" | "updatedAt">) => Promise<void>;
  deleteAdvertisement: (advertisementId: string) => Promise<void>;
}

export const useAdvertisementStore = create<AdvertisementState>((set) => ({
  advertisements: [],
  allAdvertisements: [],
  loading: false,
  error: null,

  // 📌 Lấy danh sách quảng cáo đang hoạt động (cho User Free)
  getActiveAdvertisements: async () => {
    set({ loading: true, error: null });
    try {
      const response = await axiosInstance.get(`/api/advertisements/active`);
      set({ advertisements: response.data.ads });
    } catch (error: any) {
      set({ error: error.message || "Lỗi khi lấy danh sách quảng cáo active" });
    } finally {
      set({ loading: false });
    }
  },

  // 📌 Lấy tất cả quảng cáo (Admin)
  getAllAdvertisements: async (page = 1, limit = 10) => {
    set({ loading: true, error: null });
    try {
      const response = await axiosInstance.get(`/api/admin/advertisements`, { params: { page, limit } });
      set({ allAdvertisements: response.data.ads });
    } catch (error: any) {
      set({ error: error.message || "Lỗi khi lấy danh sách quảng cáo (Admin)" });
    } finally {
      set({ loading: false });
    }
  },

  // 📌 Tạo quảng cáo mới (chỉ Admin)
  createAdvertisement: async (data) => {
    set({ loading: true, error: null });
    try {
      await axiosInstance.post(`/api/admin/advertisements`, data);
      await useAdvertisementStore.getState().getAllAdvertisements(); // Refresh danh sách quảng cáo
    } catch (error: any) {
      set({ error: error.message || "Lỗi khi tạo quảng cáo" });
    } finally {
      set({ loading: false });
    }
  },

  // 📌 Xóa quảng cáo (chỉ Admin)
  deleteAdvertisement: async (advertisementId) => {
    set({ loading: true, error: null });
    try {
      await axiosInstance.delete(`/api/admin/advertisements/${advertisementId}`);
      await useAdvertisementStore.getState().getAllAdvertisements(); // Refresh danh sách quảng cáo
    } catch (error: any) {
      set({ error: error.message || "Lỗi khi xóa quảng cáo" });
    } finally {
      set({ loading: false });
    }
  },
}));
