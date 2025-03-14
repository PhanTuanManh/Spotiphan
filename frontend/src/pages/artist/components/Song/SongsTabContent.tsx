import TabContentLayout from "@/layout/TabContentLayout";
import { Music } from "lucide-react";
import AddSongDialog from "./AddSongDialog";
import SongsTable from "./SongsTable";

const SongsTabContent = () => {
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
