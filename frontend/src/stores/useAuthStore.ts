import { create } from "zustand";
import { axiosInstance } from "@/lib/axios";

interface AuthState {
  role: "free" | "premium" | "artist" | "admin" | null;
  isLoading: boolean;
  checkUserRole: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  role: null,
  isLoading: false,
  checkUserRole: async () => {
    try {
      const response = await axiosInstance.get("/auth/me"); // API này phải trả về user.role
      set({ role: response.data.user.role });
      console.log("🔹 User Role:", response.data.user.role);
    } catch (error) {
      console.error("❌ Error checking user role:", error);
      set({ role: null });
    } finally {
      set({ isLoading: false });
    }
  },
}));
