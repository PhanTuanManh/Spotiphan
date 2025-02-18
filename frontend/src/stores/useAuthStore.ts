import { axiosInstance } from "@/lib/axios";
import { create } from "zustand";

interface AuthStore {
	isAdmin: boolean;
	isLoading: boolean;
	error: string | null;

	checkAdminStatus: () => Promise<void>;
	reset: () => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
	isAdmin: false,
	isLoading: false,
	error: null,

	checkAdminStatus: async () => {
		set({ isLoading: true, error: null });

		try {
			const response = await axiosInstance.get("/admin/check");

			// Kiểm tra dữ liệu phản hồi
			const isAdmin = response.data?.admin ?? false; // Nếu không có `admin`, mặc định là `false`
			set({ isAdmin });
		} catch (error: any) {
			console.error("Error checking admin status:", error);

			// Xử lý lỗi từ response hoặc lỗi hệ thống
			const errorMessage =
				error.response?.data?.message || "Something went wrong. Please try again.";

			set({ isAdmin: false, error: errorMessage });
		} finally {
			set({ isLoading: false });
		}
	},

	reset: () => {
		set({ isAdmin: false, isLoading: false, error: null });
	},
}));
