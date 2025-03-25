import { useEffect, useState } from "react";
import { useMusicStore } from "@/stores/useMusicStore";
import FeaturedGridSkeleton from "@/components/skeletons/FeaturedGridSkeleton";
import PlayButton from "./PlayButton";
import { axiosInstance } from "@/lib/axios"; // Import axiosInstance để gọi API

const FeaturedSection = () => {
  const { isLoading, featuredSongs } = useMusicStore();
  const [artistNames, setArtistNames] = useState<{ [key: string]: string }>({}); // Lưu tên nghệ sĩ
  const [loadingArtists, setLoadingArtists] = useState<boolean>(false); // Trạng thái loading

  // Hàm lấy tên nghệ sĩ từ danh sách ID
  const fetchArtistNames = async (artistIds: string[]) => {
    setLoadingArtists(true);
    const names: { [key: string]: string } = {};

    try {
      // Gọi API để lấy tên nghệ sĩ từ danh sách ID
      const response = await axiosInstance.post("/users/batch", {
        ids: artistIds,
      });
      response.data.forEach((artist: { _id: string; fullName: string }) => {
        names[artist._id] = artist.fullName;
      });
    } catch (error) {
      console.error("Failed to fetch artist names:", error);
      artistIds.forEach((id) => (names[id] = "Unknown Artist")); // Fallback nếu có lỗi
    } finally {
      setLoadingArtists(false);
    }

    setArtistNames((prev) => ({ ...prev, ...names })); // Cập nhật state với tên nghệ sĩ mới
  };

  // Lấy tên nghệ sĩ khi featuredSongs thay đổi
  useEffect(() => {
    const artistIds = featuredSongs.map((song) => song.artist); // Lấy tất cả ID nghệ sĩ từ featuredSongs
    const uniqueArtistIds = Array.from(new Set(artistIds)); // Loại bỏ các ID trùng lặp

    // Chỉ gọi API nếu có ID mới chưa được lấy tên
    const newArtistIds = uniqueArtistIds.filter((id) => !artistNames[id]);
    if (newArtistIds.length > 0) {
      fetchArtistNames(newArtistIds);
    }
  }, [featuredSongs]);

  if (isLoading || loadingArtists) return <FeaturedGridSkeleton />;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
      {featuredSongs.map((song) => {
        const artistName = artistNames[song.artist] || ""; // Lấy tên nghệ sĩ từ artistNames

        return (
          <div
            key={song._id}
            className="flex items-center bg-zinc-800/50 rounded-md overflow-hidden
           hover:bg-zinc-700/50 transition-colors group cursor-pointer relative">
            <img
              src={song.imageUrl}
              alt={song.title}
              className="w-16 sm:w-20 h-16 sm:h-20 object-cover flex-shrink-0"
            />
            <div className="flex-1 p-4">
              <p className="font-medium truncate">{song.title}</p>
              <p className="text-sm text-zinc-400 truncate">
                {artistName}
              </p>{" "}
              {/* Hiển thị tên nghệ sĩ */}
            </div>
            <PlayButton song={song} />
          </div>
        );
      })}
    </div>
  );
};
export default FeaturedSection;
