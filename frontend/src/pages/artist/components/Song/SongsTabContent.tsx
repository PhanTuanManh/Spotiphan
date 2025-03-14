import TabContentLayout from "@/layout/TabContentLayout";
import { Music } from "lucide-react";
import SongsTable from "./SongsTable";
import { useSongStore } from "@/stores/useSongStore";
import { useEffect } from "react";
import { useAuthStore } from "@/stores/useAuthStore";
import AddSongDialog from "./AddSongDialog";

const SongsTabContent = ({ fetchSongs }: { fetchSongs?: boolean }) => {
  const { user_id } = useAuthStore();
  const { fetchSongsByArtist, songs } = useSongStore();

  useEffect(() => {
    if (fetchSongs && user_id && songs.length === 0) {
      // ✅ Chỉ fetch nếu chưa có dữ liệu
      fetchSongsByArtist(user_id);
    }
  }, [fetchSongs, user_id, fetchSongsByArtist, songs]);
  return (
    <TabContentLayout
      icon={<Music className="h-5 w-5 text-emerald-500" />}
      title="Songs Library"
      description="Manage your songs collection"
      actionComponent={<AddSongDialog />}>
      <SongsTable />
    </TabContentLayout>
  );
};

export default SongsTabContent;
