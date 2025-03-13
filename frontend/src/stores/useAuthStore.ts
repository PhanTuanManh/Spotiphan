import { create } from "zustand";
import { axiosInstance } from "@/lib/axios";

interface AuthState {
  clerk_id: string | null;
  user_id: string | null;
  role: "free" | "premium" | "artist" | "admin" | null;
  isLoading: boolean;
  setUserId: (id: string) => void;
  setClerkId: (id: string) => void;
  checkUserRole: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  clerk_id: null,
  user_id: null,
  role: null,
  isLoading: true,

  // ✅ Hàm để cập nhật ID từ Clerk vào Zustand
  setUserId: (id: string) => set({ user_id: id }),
  setClerkId: (id: string) => set({ clerk_id: id }),
  checkUserRole: async () => {
    set({ isLoading: true });
    try {
      const response = await axiosInstance.get("/auth/me"); // API trả về { user: { id, role } }
      set({
        user_id: response.data.id,
        role: response.data.user.role,
        isLoading: false,
      });
    } catch (error) {
      console.error("❌ Error checking user role:", error);
      set({ user_id: null, role: null, isLoading: false });
    }
  },
}));
