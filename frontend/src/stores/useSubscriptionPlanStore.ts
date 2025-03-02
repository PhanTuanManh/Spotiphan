import { create } from "zustand";
import { axiosInstance } from "@/lib/axios";
import { ISubscriptionPlan } from "@/types";

interface SubscriptionState {
  plans: ISubscriptionPlan[];
  selectedPlan: ISubscriptionPlan | null;
  loading: boolean;
  error: string | null;
  
  getPlans: () => Promise<void>;
  getPlanById: (planId: string) => Promise<void>;
  createPlan: (data: Omit<ISubscriptionPlan, "_id" | "createdAt" | "updatedAt">) => Promise<void>;
  updatePlan: (planId: string, data: Partial<ISubscriptionPlan>) => Promise<void>;
  deletePlan: (planId: string) => Promise<void>;
  updateUserSubscription: (planId: string) => Promise<void>;
}

export const useSubscriptionStore = create<SubscriptionState>((set) => ({
  plans: [],
  selectedPlan: null,
  loading: false,
  error: null,

  // 📌 Lấy danh sách subscription plans
  getPlans: async () => {
    set({ loading: true, error: null });
    try {
      const response = await axiosInstance.get(`/subscriptions`);
      set({ plans: response.data.subscriptionPlans });
    } catch (error: any) {
      set({ error: error.message || "Lỗi khi lấy danh sách gói đăng ký" });
    } finally {
      set({ loading: false });
    }
  },

  // 📌 Lấy thông tin chi tiết một subscription plan
  getPlanById: async (planId) => {
    set({ loading: true, error: null });
    try {
      const response = await axiosInstance.get(`/subscriptions/${planId}`);
      set({ selectedPlan: response.data.subscriptionPlan });
    } catch (error: any) {
      set({ error: error.message || "Lỗi khi lấy thông tin gói đăng ký" });
    } finally {
      set({ loading: false });
    }
  },

  // 📌 Tạo subscription plan mới (chỉ Admin)
  createPlan: async (data) => {
    set({ loading: true, error: null });
    try {
      await axiosInstance.post(`/subscriptions`, data);
      await useSubscriptionStore.getState().getPlans();
    } catch (error: any) {
      set({ error: error.message || "Lỗi khi tạo gói đăng ký" });
    } finally {
      set({ loading: false });
    }
  },

  // 📌 Cập nhật subscription plan (chỉ Admin)
  updatePlan: async (planId, data) => {
    set({ loading: true, error: null });
    try {
      await axiosInstance.put(`/subscriptions/${planId}`, data);
      await useSubscriptionStore.getState().getPlans();
    } catch (error: any) {
      set({ error: error.message || "Lỗi khi cập nhật gói đăng ký" });
    } finally {
      set({ loading: false });
    }
  },

  // 📌 Xóa subscription plan (chỉ Admin)
  deletePlan: async (planId) => {
    set({ loading: true, error: null });
    try {
      await axiosInstance.delete(`/subscriptions/${planId}`);
      await useSubscriptionStore.getState().getPlans();
    } catch (error: any) {
      set({ error: error.message || "Lỗi khi xóa gói đăng ký" });
    } finally {
      set({ loading: false });
    }
  },

  // 📌 Người dùng cập nhật subscription plan của mình
  updateUserSubscription: async (planId) => {
    set({ loading: true, error: null });
    try {
      await axiosInstance.put(`/me/subscription`, { planId });
      await useSubscriptionStore.getState().getPlans();
    } catch (error: any) {
      set({ error: error.message || "Lỗi khi cập nhật gói đăng ký của người dùng" });
    } finally {
      set({ loading: false });
    }
  },
}));
