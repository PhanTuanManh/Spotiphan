


import TabContentLayout from "@/layout/TabContentLayout";
import { Music } from "lucide-react";
import SongsTable from "./SongsTable";

const SongsTabContent = () => {
  return (
    <TabContentLayout
      icon={<Music className="h-5 w-5 text-emerald-500" />}
      title="Singles Library"
      description="Manage your single collection"
    >
      <SongsTable />
    </TabContentLayout>
  );
};

export default SongsTabContent;
