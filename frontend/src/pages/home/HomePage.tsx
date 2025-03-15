import Topbar from "@/components/Topbar";
import { useMusicStore } from "@/stores/useMusicStore";
import { useEffect } from "react";
import FeaturedSection from "./components/FeaturedSection";
import { ScrollArea } from "@/components/ui/scroll-area";

const HomePage = () => {
  const { fetchFeaturedSongs, isLoading, featuredSongs } = useMusicStore();

  // Chỉ gọi fetchFeaturedSongs khi component mount
  useEffect(() => {
    fetchFeaturedSongs();
  }, [fetchFeaturedSongs]);

  return (
    <main className="rounded-md overflow-hidden h-full bg-gradient-to-b from-zinc-800 to-zinc-900">
      <Topbar />
      <ScrollArea className="h-[calc(100vh-180px)]">
        <div className="p-4 sm:p-6">
          <h1 className="text-2xl sm:text-3xl font-bold mb-6">
            Good afternoon
          </h1>
          {/* Hiển thị FeaturedSection với featuredSongs */}
          <FeaturedSection />

          {/* Bỏ qua các SectionGrid khác vì chỉ test fetchFeaturedSongs */}
        </div>
      </ScrollArea>
    </main>
  );
};

export default HomePage;
