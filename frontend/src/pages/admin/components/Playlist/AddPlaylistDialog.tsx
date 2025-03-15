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
import {
  MultiSelect,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { axiosInstance } from "@/lib/axios";
import { useCategoryStore } from "@/stores/useCategoryStore";
import { usePlaylistStore } from "@/stores/usePlaylistStore";
import { Plus, Upload } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";

interface NewPlaylist {
  name: string;
  isPublic: boolean;
  category: string[];
}

const AddPlaylistDialog = () => {
  const { fetchMyPlaylists } = usePlaylistStore();
  const [playlistDialogOpen, setPlaylistDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { categories, getCategories } = useCategoryStore(); // ✅ Fetch danh mục

  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

  const [newPlaylist, setNewPlaylist] = useState<NewPlaylist>({
    name: "",
    isPublic: false,
    category: [],
  });

  const [image, setImage] = useState<File | null>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  // ✅ Fetch categories from API
  useEffect(() => {
    getCategories(); // ✅ Lấy danh sách danh mục khi mở dialog
  }, []);

  // ✅ Handle category selection - Updates `selectedCategories` and `newPlaylist.category`
  const handleCategorySelect = (categoryIds: string[]) => {
    setSelectedCategories(categoryIds);
    setNewPlaylist((prev) => ({
      ...prev,
      category: categoryIds, // ✅ Ensures selected categories are stored immediately
    }));
  };

  // ✅ Handle form submission
  const handleSubmit = async () => {
    setIsLoading(true);
    try {
      if (!image) {
        toast.error("Please upload an image file");
        return;
      }

      const formData = new FormData();
      formData.append("name", newPlaylist.name);
      formData.append("isPublic", JSON.stringify(newPlaylist.isPublic));

      // ✅ Send `category` as a JSON string
      formData.append("category", JSON.stringify(selectedCategories));

      formData.append("imageFile", image);

      await axiosInstance.post("/playlists", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setNewPlaylist({ name: "", isPublic: false, category: [] });
      setSelectedCategories([]);
      setImage(null);
      fetchMyPlaylists();
    } catch (error: any) {
      console.error("❌ Failed to add playlist:", error);
      toast.error("Failed to add playlist: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={playlistDialogOpen} onOpenChange={setPlaylistDialogOpen}>
      <DialogTrigger asChild>
        <Button className="bg-emerald-500 hover:bg-emerald-600 text-black">
          <Plus className="mr-2 h-4 w-4" />
          Add Playlist
        </Button>
      </DialogTrigger>

      <DialogContent className="bg-zinc-900 border-zinc-700 max-h-[80vh] overflow-auto">
        <DialogHeader>
          <DialogTitle>Add New Playlist</DialogTitle>
          <DialogDescription>
            Add a new playlist to your library
          </DialogDescription>
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
            onClick={() => imageInputRef.current?.click()}>
            <div className="text-center">
              {image ? (
                <div className="space-y-2">
                  <div className="text-sm text-emerald-500">
                    Image selected:
                  </div>
                  <div className="text-xs text-zinc-400">
                    {image.name.slice(0, 20)}
                  </div>
                </div>
              ) : (
                <>
                  <div className="p-3 bg-zinc-800 rounded-full inline-block mb-2">
                    <Upload className="h-6 w-6 text-zinc-400" />
                  </div>
                  <div className="text-sm text-zinc-400 mb-2">
                    Upload playlist image
                  </div>
                  <Button variant="outline" size="sm" className="text-xs">
                    Choose File
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* Playlist fields */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Playlist Name</label>
            <Input
              value={newPlaylist.name}
              onChange={(e) =>
                setNewPlaylist({ ...newPlaylist, name: e.target.value })
              }
              className="bg-zinc-800 border-zinc-700"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Public</label>
            <Select
              value={newPlaylist.isPublic ? "true" : "false"}
              onValueChange={(value) =>
                setNewPlaylist({ ...newPlaylist, isPublic: value === "true" })
              }>
              <SelectTrigger className="bg-zinc-800 border-zinc-700">
                <SelectValue placeholder="Select privacy" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="true">Public</SelectItem>
                <SelectItem value="false">Private</SelectItem>
              </SelectContent>
            </Select>
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
            onClick={() => setPlaylistDialogOpen(false)}
            disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? "Uploading..." : "Add Playlist"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddPlaylistDialog;
