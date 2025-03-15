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
import { useCategoryStore } from "@/stores/useCategoryStore";
import { Edit, Upload } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";

interface UpdateAlbumDialogProps {
  albumId: string;
}

const UpdateAlbumDialog = ({ albumId }: UpdateAlbumDialogProps) => {
  const { updateAlbum, albums } = useAlbumStore();
  const { categories, getCategories } = useCategoryStore();
  const [isLoading, setIsLoading] = useState(false);
  const [albumDialogOpen, setAlbumDialogOpen] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const [album, setAlbum] = useState({
    title: "",
    releaseYear: new Date().getFullYear().toString(),
    category: [] as string[],
    imageUrl: "",
  });

  // ✅ Fetch album khi mở dialog
  useEffect(() => {
    if (albumDialogOpen) {
      const foundAlbum = albums.find((a) => a._id === albumId);
      if (foundAlbum) {
        setAlbum({
          title: foundAlbum.title || "",
          releaseYear: foundAlbum.releaseYear
            ? foundAlbum.releaseYear.toString()
            : new Date().getFullYear().toString(),
          category: foundAlbum.category
            ? foundAlbum.category.map((cat: any) => cat._id)
            : [],
          imageUrl: foundAlbum.imageUrl || "",
        });
        setSelectedCategories(
          foundAlbum.category
            ? foundAlbum.category.map((cat: any) => cat._id)
            : []
        );
      }
    }
  }, [albumId, albumDialogOpen, albums]);

  // ✅ Fetch categories khi mở dialog
  useEffect(() => {
    getCategories();
  }, []);

  const handleCategorySelect = (categoryIds: string[]) => {
    setSelectedCategories(categoryIds);
    setAlbum((prev) => ({ ...prev, category: categoryIds }));
  };

  const handleSubmit = async () => {
    setIsLoading(true); // ✅ Đúng, sử dụng `setIsLoading` thay vì `isLoading(true)`

    try {
      if (!album.title.trim()) {
        toast.error("Album title cannot be empty.");
        return;
      }
      if (!selectedCategories.length) {
        toast.error("Please select at least one category.");
        return;
      }

      const formData = new FormData();
      formData.append("title", album.title);
      formData.append("releaseYear", album.releaseYear);
      formData.append("category", JSON.stringify(selectedCategories)); // ✅ Đúng format để gửi qua API

      if (imageFile) {
        formData.append("imageFile", imageFile);
      }

      await updateAlbum(albumId, formData);
      setAlbumDialogOpen(false);
    } catch (error) {
      console.error("❌ Failed to update album:", error);
      toast.error("❌ Failed to update album");
    } finally {
      setIsLoading(false); // ✅ Đúng cách tắt trạng thái loading
    }
  };

  return (
    <Dialog
      open={albumDialogOpen}
      onOpenChange={(isOpen) => {
        setAlbumDialogOpen(isOpen);
        if (!isOpen) {
          setImageFile(null);
          setAlbum((prev) => ({ ...prev, imageUrl: prev.imageUrl }));
        }
      }}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="text-blue-400 hover:text-blue-300 hover:bg-blue-400/10">
          <Edit className="h-4 w-4" />
        </Button>
      </DialogTrigger>

      <DialogContent className="bg-zinc-900 border-zinc-700 max-h-[80vh] overflow-auto">
        <DialogHeader>
          <DialogTitle>Update Album</DialogTitle>
          <DialogDescription>Edit album details</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <input
            type="file"
            ref={imageInputRef}
            className="hidden"
            accept="image/*"
            onChange={(e) => setImageFile(e.target.files?.[0] || null)}
          />

          {/* Image Upload */}
          <div
            className="flex items-center justify-center p-6 border-2 border-dashed border-zinc-700 rounded-lg cursor-pointer"
            onClick={() => imageInputRef.current?.click()}>
            <div className="text-center">
              {imageFile ? (
                <div className="space-y-2">
                  <div className="text-sm text-emerald-500">
                    New Image Selected:
                  </div>
                  <div className="text-xs text-zinc-400">
                    {imageFile.name.slice(0, 20)}
                  </div>
                </div>
              ) : (
                <>
                  {album.imageUrl && (
                    <img
                      src={album.imageUrl}
                      alt="Album Cover"
                      className="h-16 w-16 object-cover rounded-lg mb-2"
                    />
                  )}
                  <div className="p-3 bg-zinc-800 rounded-full inline-block mb-2">
                    <Upload className="h-6 w-6 text-zinc-400" />
                  </div>
                  <div className="text-sm text-zinc-400 mb-2">
                    Upload new image (optional)
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Album Title */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Album Title</label>
            <Input
              value={album.title}
              onChange={(e) => setAlbum({ ...album, title: e.target.value })}
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
              value={album.releaseYear}
              onChange={(e) =>
                setAlbum({ ...album, releaseYear: e.target.value })
              }
              className="bg-zinc-800 border-zinc-700"
            />
          </div>

          {/* Category Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Categories</label>
            <MultiSelect
              options={categories.map((cat) => ({
                value: cat._id,
                label: cat.name,
              }))}
              selectedValues={selectedCategories}
              onChange={handleCategorySelect}
              placeholder="Select categories"
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
            {isLoading ? "Updating..." : "Update Album"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default UpdateAlbumDialog;
