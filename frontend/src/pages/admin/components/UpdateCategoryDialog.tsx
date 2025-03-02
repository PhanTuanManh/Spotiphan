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
import { PencilOff, Upload } from "lucide-react";
import { useRef, useState, useEffect } from "react";
import toast from "react-hot-toast";

interface UpdateCategoryProps {
	categoryId: string;
}

const UpdateCategoryDialog = ({ categoryId }: UpdateCategoryProps) => {
	const { getCategories } = useCategoryStore();
	const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
	const [isLoading, setIsLoading] = useState(false);
	const [category, setCategory] = useState({ name: "", description: "", imageUrl: "" });
	const [image, setImage] = useState<File | null>(null);
	const imageInputRef = useRef<HTMLInputElement>(null);

	// Fetch category data when dialog opens
    useEffect(() => {
        const fetchCategory = async () => {
            try {
                const res = await axiosInstance.get(`/admin/categories/${categoryId}`);
                setCategory(res.data.category || res.data);
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            } catch (err) {
                toast.error("Failed to fetch category");
            }
        };

        if (categoryDialogOpen && categoryId) {
            fetchCategory();
        }
    }, [categoryId, categoryDialogOpen]);
    

	const handleSubmit = async () => {
		setIsLoading(true);
		try {
			const formData = new FormData();
			formData.append("name", category.name);
			formData.append("description", category.description);
			if (image) {
				formData.append("imageFile", image);
			}

			await axiosInstance.put(`/admin/categories/${categoryId}`, formData, {
				headers: { "Content-Type": "multipart/form-data" },
			});

			toast.success("Category updated successfully");
			getCategories();
			setCategoryDialogOpen(false);
		} catch (error: any) {
			toast.error("Failed to update category: " + error.message);
		} finally {
			setIsLoading(false);
		}
	};


	return (
		<Dialog
			open={categoryDialogOpen}
			onOpenChange={(isOpen) => {
				setCategoryDialogOpen(isOpen);
				if (!isOpen) {
					setCategory({ name: "", description: "", imageUrl: "" }); // Reset data when closing
				}
			}}
		>
			<DialogTrigger asChild>
				<Button
					variant="ghost"
					size="sm"
					className="text-blue-400 hover:text-blue-300 hover:bg-blue-400/10"
				>
					<PencilOff className="h-4 w-4" />
				</Button>
			</DialogTrigger>

			<DialogContent className="bg-zinc-900 border-zinc-700 max-h-[80vh] overflow-auto">
				<DialogHeader>
					<DialogTitle>Update Category</DialogTitle>
					<DialogDescription>Modify category details</DialogDescription>
				</DialogHeader>

				<div className="space-y-4 py-4">
					<input
						type="file"
						ref={imageInputRef}
						className="hidden"
						accept="image/*"
						onChange={(e) => setImage(e.target.files![0])}
					/>

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
									<div className="text-sm text-zinc-400 mb-2">Upload new category image</div>
									<Button variant="outline" size="sm" className="text-xs">Choose File</Button>
								</>
							)}
						</div>
					</div>

					<div className="space-y-2">
						<label className="text-sm font-medium">Category Name</label>
						<Input
							value={category.name}
							onChange={(e) => setCategory({ ...category, name: e.target.value })}
							className="bg-zinc-800 border-zinc-700"
						/>
					</div>

					<div className="space-y-2">
						<label className="text-sm font-medium">Description</label>
						<Input
							value={category.description}
							onChange={(e) => setCategory({ ...category, description: e.target.value })}
							className="bg-zinc-800 border-zinc-700"
						/>
					</div>
				</div>

				<DialogFooter>
					<Button variant="outline" onClick={() => setCategoryDialogOpen(false)} disabled={isLoading}>
						Cancel
					</Button>
					<Button onClick={handleSubmit} disabled={isLoading}>
						{isLoading ? "Updating..." : "Update Category"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
};

export default UpdateCategoryDialog;
