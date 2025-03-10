import TabContentLayout from "@/layout/TabContentLayout";
import { ListVideo } from "lucide-react";
import PlaylistTable from "./PlaylistsTable";
import AddPlaylistDialog from "./AddPlaylistDialog";

const PlaylistsTabContent = () => {
  return (
    <TabContentLayout
      icon={<ListVideo className="size-5 text-rose-500" />}
      title="Playlists Library"
      description="Manage your music tracks"
      actionComponent={<AddPlaylistDialog />}
    >
      <PlaylistTable />
    </TabContentLayout>
  );
};

export default PlaylistsTabContent;
