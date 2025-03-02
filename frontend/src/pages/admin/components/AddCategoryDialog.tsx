import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { axiosInstance } from "@/lib/axios";
import { useCategoryStore } from "@/stores/useCategoryStore";
import { Plus, Upload } from "lucide-react";
import { useRef, useState } from "react";
import toast from "react-hot-toast";

interface NewCategory {
	name: string;
	description: string;
}

const AddCategoryDialog = () => {
	const { getCategories } = useCategoryStore();
	const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
	const [isLoading, setIsLoading] = useState(false);

	const [newCategory, setNewCategory] = useState<NewCategory>({
		name: "",
		description: "",
	});

	const [image, setImage] = useState<File | null>(null);
	const imageInputRef = useRef<HTMLInputElement>(null);

	const handleSubmit = async () => {
		setIsLoading(true);

		try {
			if (!image) {
				return toast.error("Please upload an image file");
			}

			const formData = new FormData();
			formData.append("name", newCategory.name);
			formData.append("description", newCategory.description);
			formData.append("imageFile", image); // ✅ Đúng tên field theo backend

			await axiosInstance.post("/admin/categories", formData, {
				headers: {
					"Content-Type": "multipart/form-data",
				},
			});

			setNewCategory({ name: "", description: "" });
			setImage(null);
			toast.success("Category added successfully");
			getCategories();
		} catch (error: any) {
			toast.error("Failed to add category: " + error.message);
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<Dialog open={categoryDialogOpen} onOpenChange={setCategoryDialogOpen}>
			<DialogTrigger asChild>
				<Button className="bg-emerald-500 hover:bg-emerald-600 text-black">
					<Plus className="mr-2 h-4 w-4" />
					Add Category
				</Button>
			</DialogTrigger>

			<DialogContent className="bg-zinc-900 border-zinc-700 max-h-[80vh] overflow-auto">
				<DialogHeader>
					<DialogTitle>Add New Category</DialogTitle>
					<DialogDescription>Add a new category to your library</DialogDescription>
				</DialogHeader>

				<div className="space-y-4 py-4">
					<input
						type="file"
						ref={imageInputRef}
						className="hidden"
						accept="image/*"
						onChange={(e) => setImage(e.target.files![0])}
					/>

					{/* Image upload area */}
					<div
						className="flex items-center justify-center p-6 border-2 border-dashed border-zinc-700 rounded-lg cursor-pointer"
						onClick={() => imageInputRef.current?.click()}
					>
						<div className="text-center">
							{image ? (
								<div className="space-y-2">
									<div className="text-sm text-emerald-500">Image selected:</div>
									<div className="text-xs text-zinc-400">{image.name.slice(0, 20)}</div>
								</div>
							) : (
								<>
									<div className="p-3 bg-zinc-800 rounded-full inline-block mb-2">
										<Upload className="h-6 w-6 text-zinc-400" />
									</div>
									<div className="text-sm text-zinc-400 mb-2">Upload category image</div>
									<Button variant="outline" size="sm" className="text-xs">
										Choose File
									</Button>
								</>
							)}
						</div>
					</div>

					{/* Category fields */}
					<div className="space-y-2">
						<label className="text-sm font-medium">Category Name</label>
						<Input
							value={newCategory.name}
							onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
							className="bg-zinc-800 border-zinc-700"
						/>
					</div>

					<div className="space-y-2">
						<label className="text-sm font-medium">Description</label>
						<Input
							value={newCategory.description}
							onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })}
							className="bg-zinc-800 border-zinc-700"
						/>
					</div>
				</div>

				<DialogFooter>
					<Button variant="outline" onClick={() => setCategoryDialogOpen(false)} disabled={isLoading}>
						Cancel
					</Button>
					<Button onClick={handleSubmit} disabled={isLoading}>
						{isLoading ? "Uploading..." : "Add Category"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
};
export default AddCategoryDialog;
