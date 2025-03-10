

import TabContentLayout from "@/layout/TabContentLayout";
import { ChartBarIcon } from "lucide-react";
import CategoriesTable from "./CategoriesTable";
import AddCategoryDialog from "./AddCategoryDialog";

const CategoriesTabContent = () => {
  return (
    <TabContentLayout
      icon={<ChartBarIcon className="h-5 w-5 text-emerald-500" />}
      title="Categories Library"
      description="Manage your category collection"
	  actionComponent={<AddCategoryDialog />}
    >
      <CategoriesTable />
    </TabContentLayout>
  );
};

export default CategoriesTabContent;
