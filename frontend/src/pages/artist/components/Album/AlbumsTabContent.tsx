import TabContentLayout from "@/layout/TabContentLayout";
import { Album } from "lucide-react";
import AlbumsTable from "./AlbumsTable";
import AddAlbumDialog from "./AddAlbumDialog";

const AlbumsTabContent = () => {
  return (
    <TabContentLayout
      icon={<Album className="h-5 w-5 text-violet-500" />}
      title="Albums Library"
      description="Manage your album collection"
      actionComponent={<AddAlbumDialog />}>
      <AlbumsTable />
    </TabContentLayout>
  );
};

export default AlbumsTabContent;
