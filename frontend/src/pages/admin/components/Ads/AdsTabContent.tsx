import TabContentLayout from "@/layout/TabContentLayout";
import { ChartBarIcon } from "lucide-react";
import AdsTable from "./AdsTable";
import AddAdsDialog from "./AddAdsDialog";

const AdsTabContent = () => {
  return (
    <TabContentLayout
      icon={<ChartBarIcon className="h-5 w-5 text-yellow-500" />}
      title="Advertisements Library"
      description="Manage your Advertisements collection"
      actionComponent={<AddAdsDialog />}>
      <AdsTable />
    </TabContentLayout>
  );
};

export default AdsTabContent;
