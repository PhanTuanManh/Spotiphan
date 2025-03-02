import { create } from "zustand";
import { axiosInstance } from "@/lib/axios";
import { ICategory } from "@/types";

interface CategoryState {
  categories: ICategory[];
  selectedCategory: ICategory | null;
  loading: boolean;
  error: string | null;
  
  getCategories: () => Promise<void>;
  getCategoryById: (categoryId: string) => Promise<void>;
  createCategory: (data: Omit<ICategory, "_id" | "createdAt" | "updatedAt">) => Promise<void>;
  updateCategory: (categoryId: string, data: Partial<ICategory>) => Promise<void>;
  deleteCategory: (categoryId: string) => Promise<void>;
}

export const useCategoryStore = create<CategoryState>((set) => ({
  categories: [],
  selectedCategory: null,
  loading: false,
  error: null,

  // 📌 Lấy danh sách category
  getCategories: async () => {
    set({ loading: true, error: null });
    try {
      const response = await axiosInstance.get(`/categories/`);
      set({ categories: response.data.categories });
    } catch (error: any) {
      set({ error: error.message || "Lỗi khi lấy danh mục" });
    } finally {
      set({ loading: false });
    }
  },

  // 📌 Lấy thông tin chi tiết một category
  getCategoryById: async (categoryId) => {
    set({ loading: true, error: null });
    try {
      const response = await axiosInstance.get(`/categories/${categoryId}`);
      set({ selectedCategory: response.data.category });
    } catch (error: any) {
      set({ error: error.message || "Lỗi khi lấy thông tin danh mục" });
    } finally {
      set({ loading: false });
    }
  },

  // 📌 Tạo category mới
  createCategory: async (data) => {
    set({ loading: true, error: null });
    try {
      await axiosInstance.post(`/categories/`, data);
      await useCategoryStore.getState().getCategories();
    } catch (error: any) {
      set({ error: error.message || "Lỗi khi tạo danh mục" });
    } finally {
      set({ loading: false });
    }
  },

  // 📌 Cập nhật category
  updateCategory: async (categoryId, data) => {
    set({ loading: true, error: null });
    try {
      await axiosInstance.put(`/categories/${categoryId}`, data);
      await useCategoryStore.getState().getCategories();
    } catch (error: any) {
      set({ error: error.message || "Lỗi khi cập nhật danh mục" });
    } finally {
      set({ loading: false });
    }
  },

  // 📌 Xóa category
  deleteCategory: async (categoryId) => {
    set({ loading: true, error: null });
    try {
      await axiosInstance.delete(`/categories/${categoryId}`);
      await useCategoryStore.getState().getCategories();
    } catch (error: any) {
      set({ error: error.message || "Lỗi khi xóa danh mục" });
    } finally {
      set({ loading: false });
    }
  },
}));
