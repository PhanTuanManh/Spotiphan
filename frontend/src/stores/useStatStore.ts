import { create } from "zustand";
import { axiosInstance } from "@/lib/axios";
import { IArtistStats, IStats } from "@/types";

interface StatsStore {
  stats: IStats;
  artistStats: Record<string, IArtistStats>; // Lưu theo artistId
  loading: boolean;
  error: string | null;

  // Lấy thống kê toàn hệ thống
  fetchStats: () => Promise<void>;

  // Lấy thống kê của một Artist
  fetchStatsForArtist: (artistId: string) => Promise<void>;
}

export const useStatsStore = create<StatsStore>((set) => ({
  stats: {
    totalAlbums: 0,
    totalSongs: 0,
    totalUsers: 0,
    totalArtists: 0,
    totalPlaylists: 0,
  },
  artistStats: {},
  loading: false,
  error: null,

  // Lấy thống kê toàn hệ thống
  fetchStats: async () => {
    set({ loading: true, error: null });
    try {
      const response = await axiosInstance.get<IStats>("/stats");
      set({ stats: response.data, loading: false });
    } catch (error: any) {
      set({
        error: error.response?.data?.message || "Lỗi khi lấy thống kê",
        loading: false,
      });
    }
  },

  // Lấy thống kê của một Artist
  fetchStatsForArtist: async (artistId: string) => {
    const normalizedId = artistId.startsWith("user_") ? artistId : artistId;
    const url = `/stats/artist/${normalizedId}`;

    console.log("📡 Fetching:", url); // ✅ Kiểm tra URL

    set((state) => ({
      artistStats: {
        ...state.artistStats,
        [normalizedId]: {
          artistId: normalizedId,
          artistName: "",
          totalSongs: 0,
          totalAlbums: 0,
          totalSingles: 0,
          loading: true,
          error: null,
        },
      },
    }));

    try {
      const response = await axiosInstance.get(url, {
        headers: { Accept: "application/json" }, // Đảm bảo nhận JSON
      });

      console.log("🔹 API Response Data:", response.data); // ✅ Kiểm tra dữ liệu trả về

      if (typeof response.data !== "object") {
        throw new Error(
          "Invalid API response, expected JSON but received something else."
        );
      }

      set((state) => ({
        artistStats: {
          ...state.artistStats,
          [normalizedId]: { ...response.data, loading: false, error: null },
        },
      }));
    } catch (error: any) {
      console.error("❌ Error fetching artist stats:", error.response || error);

      set((state) => ({
        artistStats: {
          ...state.artistStats,
          [normalizedId]: {
            artistId: normalizedId,
            artistName: "",
            totalSongs: 0,
            totalAlbums: 0,
            totalSingles: 0,
            loading: false,
            error: error.response?.data?.message || "Lỗi khi lấy dữ liệu",
          },
        },
      }));
    }
  },
}));
