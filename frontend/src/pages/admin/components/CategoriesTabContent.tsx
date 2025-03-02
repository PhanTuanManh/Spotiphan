import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Music } from "lucide-react";
import AddCategoryDialog from "./AddCategoryDialog";
import CategoriesTable from "./CategoriesTable";

const CategoriesTabContent = () => {
	return (
		<Card>
			<CardHeader>
				<div className='flex items-center justify-between'>
					<div>
						<CardTitle className='flex items-center gap-2'>
							<Music className='size-5 text-emerald-500' />
							Categories Library
						</CardTitle>
						<CardDescription>Manage your music tracks</CardDescription>
					</div>
					<AddCategoryDialog />
				</div>
			</CardHeader>
			<CardContent>
				<CategoriesTable />
			</CardContent>
		</Card>
	);
};
export default CategoriesTabContent;
