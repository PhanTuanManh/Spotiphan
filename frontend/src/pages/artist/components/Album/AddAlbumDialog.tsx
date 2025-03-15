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
import { MultiSelect } from "@/components/ui/select";
import { useAlbumStore } from "@/stores/useAlbumStore";
import { useCategoryStore } from "@/stores/useCategoryStore"; // ✅ Thêm store lấy category
import { Plus, Upload } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";

const AddAlbumDialog = () => {
  const { createAlbum, isLoading } = useAlbumStore();
  const { categories, getCategories } = useCategoryStore(); // ✅ Fetch danh mục

  const [albumDialogOpen, setAlbumDialogOpen] = useState(false);

  const [newAlbum, setNewAlbum] = useState({
    title: "",
    releaseYear: new Date().getFullYear().toString(),
    category: [] as string[], // ✅ Chọn nhiều thể loại
  });

  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    getCategories(); // ✅ Lấy danh sách danh mục khi mở dialog
  }, []);

  // ✅ Xử lý chọn danh mục
  const handleCategorySelect = (categoryIds: string[]) => {
    setSelectedCategories(categoryIds);
    setNewAlbum((prev) => ({
      ...prev,
      category: categoryIds,
    }));
  };

  const handleSubmit = async () => {
    if (!newAlbum.title.trim()) {
      toast.error("Title cannot be empty");
      return;
    }
    if (!Array.isArray(selectedCategories) || selectedCategories.length === 0) {
      toast.error("Please select at least one category");
      return;
    }
    if (!imageFile) {
      toast.error("Please upload an album cover image");
      return;
    }

    const formData = new FormData();
    formData.append("title", newAlbum.title);
    formData.append("releaseYear", newAlbum.releaseYear);

    // ✅ Gửi danh sách `category` dưới dạng JSON string
    formData.append("category", JSON.stringify(selectedCategories));

    formData.append("imageFile", imageFile);

    await createAlbum(formData);

    setNewAlbum({
      title: "",
      releaseYear: new Date().getFullYear().toString(),
      category: [],
    });
    setSelectedCategories([]);
    setImageFile(null);
    setAlbumDialogOpen(false);
  };

  return (
    <Dialog open={albumDialogOpen} onOpenChange={setAlbumDialogOpen}>
      <DialogTrigger asChild>
        <Button className="bg-emerald-500 hover:bg-emerald-600 text-black">
          <Plus className="mr-2 h-4 w-4" /> Add Album
        </Button>
      </DialogTrigger>

      <DialogContent className="bg-zinc-900 border-zinc-700 max-h-[80vh] overflow-auto">
        <DialogHeader>
          <DialogTitle>Add New Album</DialogTitle>
          <DialogDescription>
            Create a new album and submit for approval
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Image Upload */}
          <div
            className="flex items-center justify-center p-6 border-2 border-dashed border-zinc-700 rounded-lg cursor-pointer"
            onClick={() => imageInputRef.current?.click()}>
            <div className="text-center">
              {imageFile ? (
                <div className="space-y-2">
                  <div className="text-sm text-emerald-500">
                    Image selected:
                  </div>
                  <div className="text-xs text-zinc-400">
                    {imageFile.name.slice(0, 20)}
                  </div>
                </div>
              ) : (
                <>
                  <div className="p-3 bg-zinc-800 rounded-full inline-block mb-2">
                    <Upload className="h-6 w-6 text-zinc-400" />
                  </div>
                  <div className="text-sm text-zinc-400 mb-2">
                    Upload album cover
                  </div>
                  <Button variant="outline" size="sm" className="text-xs">
                    Choose File
                  </Button>
                </>
              )}
            </div>
          </div>

          <input
            type="file"
            ref={imageInputRef}
            className="hidden"
            accept="image/*"
            onChange={(e) => setImageFile(e.target.files?.[0] || null)}
          />

          {/* Album Title */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Album Title</label>
            <Input
              value={newAlbum.title}
              onChange={(e) =>
                setNewAlbum({ ...newAlbum, title: e.target.value })
              }
              className="bg-zinc-800 border-zinc-700"
            />
          </div>

          {/* Release Year */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Release Year</label>
            <Input
              type="number"
              min="1900"
              max={new Date().getFullYear().toString()}
              value={newAlbum.releaseYear}
              onChange={(e) =>
                setNewAlbum({ ...newAlbum, releaseYear: e.target.value })
              }
              className="bg-zinc-800 border-zinc-700"
            />
          </div>

          {/* Category selection using MultiSelect */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Categories</label>
            <MultiSelect
              selectedValues={selectedCategories}
              onChange={(values) => handleCategorySelect(values)}
              options={categories.map((category) => ({
                value: category._id,
                label: category.name,
              }))}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setAlbumDialogOpen(false)}
            disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? "Creating..." : "Add Album"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddAlbumDialog;
