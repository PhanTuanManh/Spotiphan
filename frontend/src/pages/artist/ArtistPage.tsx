import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuthStore } from "@/stores/useAuthStore";
import { useStatsStore } from "@/stores/useStatStore";
import { Album, Music } from "lucide-react";
import { useEffect } from "react";
import AlbumsTabContent from "./components/Album/AlbumsTabContent";
import DashboardStats from "./components/DashboardStats";
import Header from "./components/Header";
import SongsTabContent from "./components/Song/SongsTabContent";

const AdminPage = () => {
  const { clerkId, role, isLoading } = useAuthStore();

  const { fetchStatsForArtist } = useStatsStore();

  useEffect(() => {
    if (clerkId) {
      fetchStatsForArtist(clerkId);
    }
  }, [fetchStatsForArtist, clerkId]);

  if (role !== "artist" && !isLoading) return <div>Unauthorized</div>;

  return (
    <div
      className="min-h-screen bg-gradient-to-b from-zinc-900 via-zinc-900
   to-black text-zinc-100 p-8">
      <Header />

      {clerkId && <DashboardStats artistId={clerkId} />}

      <Tabs defaultValue="songs" className="space-y-6">
        <TabsList className="p-1 bg-zinc-800/50">
          <TabsTrigger
            value="songs"
            className="data-[state=active]:bg-zinc-700">
            <Music className="mr-2 size-4" />
            Songs
          </TabsTrigger>
          <TabsTrigger
            value="albums"
            className="data-[state=active]:bg-zinc-700">
            <Album className="mr-2 size-4" />
            Albums
          </TabsTrigger>
        </TabsList>

        <TabsContent value="songs">
          <SongsTabContent />
        </TabsContent>
        <TabsContent value="albums">
          <AlbumsTabContent />
        </TabsContent>
      </Tabs>
    </div>
  );
};
export default AdminPage;
