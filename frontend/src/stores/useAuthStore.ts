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

  setUserId: (id: string) => set({ user_id: id }),
  setClerkId: (id: string) => set({ clerk_id: id }),

  checkUserRole: async () => {
    set({ isLoading: true });

    try {
      const response = await axiosInstance.get("/auth/me");

      console.log("🔍 API response:", response.data); // Kiểm tra dữ liệu trả về

      const { id, user } = response.data; // ✅ Lấy id từ response.data
      const role = user?.role || "free"; // ✅ Lấy role từ user, mặc định là "free"

      if (!id) {
        console.error("❌ Error: ID không tồn tại trong API response!");
        set({ user_id: null, role: null, isLoading: false });
        return;
      }

      set({ user_id: id, role, isLoading: false });

      console.log("✅ User ID updated from API:", id);
    } catch (error) {
      console.error("❌ Error fetching user role:", error);
      set({ user_id: null, role: null, isLoading: false });
    }
  },
}));
