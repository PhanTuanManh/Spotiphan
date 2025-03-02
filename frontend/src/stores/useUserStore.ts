import { create } from "zustand";
import { axiosInstance } from "@/lib/axios";  // Đảm bảo axiosInstance đã được cấu hình
import { IUser, ISubscriptionPlan } from "@/types";  // Thêm các kiểu dữ liệu thích hợp từ types/index.ts
import toast from "react-hot-toast";

interface UserStore {
  user: IUser | null;
  isLoading: boolean;
  error: string | null;
  subscription: ISubscriptionPlan | null;

  fetchUserProfile: () => Promise<void>;
  updateUserProfile: (updatedInfo: Partial<IUser>) => Promise<void>;
  followUser: (userId: string) => Promise<void>;
  unfollowUser: (userId: string) => Promise<void>;
  updateSubscription: (planId: string) => Promise<void>;
  fetchUserPayments: () => Promise<void>;
  fetchMessages: (userId: string) => Promise<void>;
}

export const useUserStore = create<UserStore>((set) => ({
  user: null,
  subscription: null,
  isLoading: false,
  error: null,

  fetchUserProfile: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await axiosInstance.get("/api/users/me");
      set({ user: response.data });
    } catch (error: any) {
      set({ error: error.message });
      toast.error("Failed to fetch user profile");
    } finally {
      set({ isLoading: false });
    }
  },

  updateUserProfile: async (updatedInfo) => {
    set({ isLoading: true, error: null });
    try {
      const response = await axiosInstance.put("/api/users/me", updatedInfo);
      set({ user: { ...updatedInfo, ...response.data } });
      toast.success("Profile updated successfully");
    } catch (error: any) {
      set({ error: error.message });
      toast.error("Failed to update profile");
    } finally {
      set({ isLoading: false });
    }
  },

  followUser: async (userId: string) => {
    set({ isLoading: true, error: null });
    try {
      await axiosInstance.post(`/api/users/${userId}/follow`);
      toast.success("Followed user successfully");
    } catch (error: any) {
      set({ error: error.message });
      toast.error("Failed to follow user");
    } finally {
      set({ isLoading: false });
    }
  },

  unfollowUser: async (userId: string) => {
    set({ isLoading: true, error: null });
    try {
      await axiosInstance.post(`/api/users/${userId}/unfollow`);
      toast.success("Unfollowed user successfully");
    } catch (error: any) {
      set({ error: error.message });
      toast.error("Failed to unfollow user");
    } finally {
      set({ isLoading: false });
    }
  },

  updateSubscription: async (planId: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await axiosInstance.put("/api/users/me/subscription", { planId });
      set({ subscription: response.data });
      toast.success("Subscription updated successfully");
    } catch (error: any) {
      set({ error: error.message });
      toast.error("Failed to update subscription");
    } finally {
      set({ isLoading: false });
    }
  },

  fetchUserPayments: async () => {
    set({ isLoading: true, error: null });
    try {
     // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const response = await axiosInstance.get("/api/users/me/payments");
      // Lưu trữ lịch sử thanh toán nếu cần
    } catch (error: any) {
      set({ error: error.message });
      toast.error("Failed to fetch payments");
    } finally {
      set({ isLoading: false });
    }
  },

  fetchMessages: async (userId: string) => {
    set({ isLoading: true, error: null });
    try {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const response = await axiosInstance.get(`/api/users/${userId}/messages`);
      // Lưu trữ tin nhắn nếu cần
    } catch (error: any) {
      set({ error: error.message });
      toast.error("Failed to fetch messages");
    } finally {
      set({ isLoading: false });
    }
  },
}));
