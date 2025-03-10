import { Library } from "lucide-react";
import AlbumsTable from "./AlbumsTable";
import TabContentLayout from "@/layout/TabContentLayout";

const AlbumsTabContent = () => {
  return (
    <TabContentLayout
      icon={<Library className="h-5 w-5 text-violet-500" />}
      title="Albums Library"
      description="Manage your album collection"
    >
      <AlbumsTable />
    </TabContentLayout>
  );
};

export default AlbumsTabContent;
