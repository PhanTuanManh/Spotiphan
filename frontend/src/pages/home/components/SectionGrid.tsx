import { useEffect, useState } from "react";
import { ISong } from "@/types";
import SectionGridSkeleton from "./SectionGridSkeleton";
import { Button } from "@/components/ui/button";
import PlayButton from "./PlayButton";
import { axiosInstance } from "@/lib/axios"; // Import axiosInstance để gọi API

type SectionGridProps = {
  title: string;
  songs: ISong[];
  isLoading: boolean;
};

const SectionGrid = ({ songs, title, isLoading }: SectionGridProps) => {
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

  // Lấy tên nghệ sĩ khi songs thay đổi
  useEffect(() => {
    const artistIds = songs.map((song) => song.artist); // Lấy tất cả ID nghệ sĩ từ songs
    const uniqueArtistIds = Array.from(new Set(artistIds)); // Loại bỏ các ID trùng lặp

    // Chỉ gọi API nếu có ID mới chưa được lấy tên
    const newArtistIds = uniqueArtistIds.filter((id) => !artistNames[id]);
    if (newArtistIds.length > 0) {
      fetchArtistNames(newArtistIds);
    }
  }, [songs]);

  if (isLoading || loadingArtists) return <SectionGridSkeleton />;

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl sm:text-2xl font-bold">{title}</h2>
        <Button
          variant="link"
          className="text-sm text-zinc-400 hover:text-white">
          Show all
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {songs.map((song) => {
          const artistName = artistNames[song.artist] || "Loading..."; // Lấy tên nghệ sĩ từ artistNames

          return (
            <div
              key={song._id}
              className="bg-zinc-800/40 p-4 rounded-md hover:bg-zinc-700/40 transition-all group cursor-pointer">
              <div className="relative mb-4">
                <div className="aspect-square rounded-md shadow-lg overflow-hidden">
                  <img
                    src={song.imageUrl}
                    alt={song.title}
                    className="w-full h-full object-cover transition-transform duration-300 
                    group-hover:scale-105"
                  />
                </div>
                <PlayButton song={song} />
              </div>
              <h3 className="font-medium mb-2 truncate">{song.title}</h3>
              <p className="text-sm text-zinc-400 truncate">
                {artistName} {/* Hiển thị tên nghệ sĩ */}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SectionGrid;
