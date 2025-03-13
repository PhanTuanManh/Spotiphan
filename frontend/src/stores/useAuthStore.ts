import { create } from "zustand";
import { axiosInstance } from "@/lib/axios";

interface AuthState {
  id: string | null;
  role: "free" | "premium" | "artist" | "admin" | null;
  isLoading: boolean;
  setUserId: (id: string) => void; // ✅ Thêm hàm để cập nhật id
  checkUserRole: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  id: null,
  role: null,
  isLoading: true,

  // ✅ Hàm để cập nhật ID từ Clerk vào Zustand
  setUserId: (id: string) => set({ id }),

  checkUserRole: async () => {
    set({ isLoading: true });
    try {
      const response = await axiosInstance.get("/auth/me"); // API trả về { user: { id, role } }
      set({
        id: response.data.id,
        role: response.data.user.role,
        isLoading: false,
      });
      console.log("🔹 User ID from API:", response.data.id);
      console.log("🔹 User Role:", response.data.user.role);
    } catch (error) {
      console.error("❌ Error checking user role:", error);
      set({ id: null, role: null, isLoading: false });
    }
  },
}));
