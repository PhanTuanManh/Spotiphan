import { create } from "zustand";
import { axiosInstance } from "@/lib/axios";
import { IAdvertisement } from "@/types";

interface AdvertisementState {
  advertisements: IAdvertisement[]; // Danh sách quảng cáo active cho người dùng
  allAdvertisements: IAdvertisement[]; // Danh sách tất cả quảng cáo (Admin)
  loading: boolean;
  error: string | null;

  getActiveAdvertisements: () => Promise<void>; // Lấy quảng cáo active
  getAllAdvertisements: (page?: number, limit?: number) => Promise<void>; // Lấy tất cả quảng cáo (Admin)
  createAdvertisement: (
    data: Omit<IAdvertisement, "_id" | "createdAt" | "updatedAt">
  ) => Promise<void>;
  updateAdvertisement: (
    id: string,
    data: Partial<IAdvertisement>
  ) => Promise<void>; // Cập nhật quảng cáo
  toggleAdvertisementActive: (id: string) => Promise<void>; // Bật/tắt quảng cáo
  deleteAdvertisement: (advertisementId: string) => Promise<void>; // Xóa quảng cáo
}

export const useAdvertisementStore = create<AdvertisementState>((set) => ({
  advertisements: [],
  allAdvertisements: [],
  loading: false,
  error: null,

  // 🔹 Lấy danh sách quảng cáo đang hoạt động
  getActiveAdvertisements: async () => {
    set({ loading: true, error: null });
    try {
      const response = await axiosInstance.get(`/advertisements/active`);
      set({ advertisements: response.data.ads });
    } catch (error: any) {
      set({ error: error.message || "Lỗi khi lấy danh sách quảng cáo active" });
    } finally {
      set({ loading: false });
    }
  },

  // 🔹 Lấy tất cả quảng cáo (Admin)
  getAllAdvertisements: async (page = 1, limit = 10) => {
    set({ loading: true, error: null });
    try {
      const response = await axiosInstance.get(`/admin/advertisements`, {
        params: { page, limit },
      });
      set({ allAdvertisements: response.data.ads });
    } catch (error: any) {
      set({
        error: error.message || "Lỗi khi lấy danh sách quảng cáo (Admin)",
      });
    } finally {
      set({ loading: false });
    }
  },

  // 🔹 Tạo quảng cáo mới (chỉ Admin)
  createAdvertisement: async (data) => {
    set({ loading: true, error: null });
    try {
      await axiosInstance.post(`/admin/advertisements`, data);
      await useAdvertisementStore.getState().getAllAdvertisements(); // Refresh danh sách quảng cáo
    } catch (error: any) {
      set({ error: error.message || "Lỗi khi tạo quảng cáo" });
    } finally {
      set({ loading: false });
    }
  },

  // 🔹 Cập nhật thông tin quảng cáo (Admin)
  updateAdvertisement: async (id, data) => {
    set({ loading: true, error: null });
    try {
      await axiosInstance.put(`/admin/advertisements/${id}`, data);
      await useAdvertisementStore.getState().getAllAdvertisements(); // Refresh danh sách quảng cáo
    } catch (error: any) {
      set({ error: error.message || "Lỗi khi cập nhật quảng cáo" });
    } finally {
      set({ loading: false });
    }
  },

  // 🔹 Bật / Tắt trạng thái quảng cáo (Admin)
  toggleAdvertisementActive: async (id) => {
    set({ loading: true, error: null });
    try {
      await axiosInstance.put(`/admin/advertisements/${id}/toggle-active`);
      await useAdvertisementStore.getState().getAllAdvertisements(); // Refresh danh sách quảng cáo
    } catch (error: any) {
      set({ error: error.message || "Lỗi khi thay đổi trạng thái quảng cáo" });
    } finally {
      set({ loading: false });
    }
  },

  // 🔹 Xóa quảng cáo (chỉ Admin)
  deleteAdvertisement: async (advertisementId) => {
    set({ loading: true, error: null });
    try {
      await axiosInstance.delete(`/admin/advertisements/${advertisementId}`);
      await useAdvertisementStore.getState().getAllAdvertisements(); // Refresh danh sách quảng cáo
    } catch (error: any) {
      set({ error: error.message || "Lỗi khi xóa quảng cáo" });
    } finally {
      set({ loading: false });
    }
  },
}));
