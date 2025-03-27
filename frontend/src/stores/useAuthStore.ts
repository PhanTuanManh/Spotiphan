// frontend/src/stores/useAuthStore.ts

import { create } from "zustand";
import { axiosInstance as axios } from "@/lib/axios";
import { IUser, UserRole } from "@/types";

interface AuthState {
  clerkId: string | null;
  userId: string | null;
  user: IUser | null;
  role: UserRole | null;
  isLoading: boolean;
  error: string | null;
  loadUser: (clerkId: string) => Promise<void>;
  clearUser: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  clerkId: null,
  userId: null,
  user: null,
  role: null,
  isLoading: false,
  error: null,

  loadUser: async (clerkId) => {
    set({ isLoading: true, error: null });

    try {
      const { data } = await axios.get("/auth/me");

      set({
        clerkId,
        userId: data.id,
        user: data.user,
        role: data.user.role,
        isLoading: false,
      });
    } catch (error: any) {
      set({
        error: error.response?.data?.message || "Failed to load user",
        isLoading: false,
      });
      throw error;
    }
  },

  clearUser: () =>
    set({
      clerkId: null,
      userId: null,
      user: null,
      role: null,
      error: null,
    }),
}));
