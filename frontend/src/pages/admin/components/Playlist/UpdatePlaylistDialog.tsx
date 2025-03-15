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
import { Edit, Upload } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";

interface UpdatePlaylistProps {
  playlistId: string;
}

const UpdatePlaylistDialog = ({ playlistId }: UpdatePlaylistProps) => {
  const { fetchMyPlaylists } = usePlaylistStore();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { categories, getCategories } = useCategoryStore(); // ✅ Fetch danh mục
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [playlist, setPlaylist] = useState({
    name: "",
    isPublic: false,
    category: [] as string[],
    imageUrl: "",
  });
  const [image, setImage] = useState<File | null>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  // ✅ Fetch playlist data
  useEffect(() => {
    const fetchPlaylist = async () => {
      try {
        const res = await axiosInstance.get(`/playlists/${playlistId}`);
        setPlaylist(res.data);
        setSelectedCategories(res.data.category || []);
      } catch (error: any) {
        toast.error("Failed to fetch playlist data: " + error.message);
      }
    };

    if (dialogOpen && playlistId) {
      fetchPlaylist();
    }
  }, [playlistId, dialogOpen]);

  // ✅ Fetch categories
  useEffect(() => {
    getCategories(); // ✅ Lấy danh sách danh mục khi mở dialog
  }, []);

  useEffect(() => {
    if (dialogOpen) {
      setSelectedCategories([...playlist.category]);
    }
  }, [dialogOpen, playlist.category]);

  // ✅ Handle category selection
  const handleCategorySelect = (categoryIds: string[]) => {
    setSelectedCategories(categoryIds);
    setPlaylist((prev) => ({
      ...prev,
      category: categoryIds, // ✅ Ensures selected categories are stored immediately
    }));
  };

  // ✅ Handle submit
  const handleSubmit = async () => {
    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append("name", playlist.name);
      formData.append("isPublic", JSON.stringify(playlist.isPublic));

      // ✅ Fix: Send `category` as JSON
      formData.append("category", JSON.stringify(selectedCategories));

      if (image) {
        formData.append("imageFile", image);
      }

      await axiosInstance.put(`/playlists/${playlistId}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      toast.success("Playlist updated successfully");
      fetchMyPlaylists();
      setDialogOpen(false);
    } catch (error: any) {
      toast.error("Failed to update playlist: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog
      open={dialogOpen}
      onOpenChange={(isOpen) => {
        setDialogOpen(isOpen);
        if (!isOpen) {
          setPlaylist({
            name: "",
            isPublic: false,
            category: [],
            imageUrl: "",
          });
          setImage(null);
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
          <DialogTitle>Update Playlist</DialogTitle>
          <DialogDescription>Modify playlist details</DialogDescription>
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
                    New Image Selected:
                  </div>
                  <div className="text-xs text-zinc-400">
                    {image.name.slice(0, 20)}
                  </div>
                </div>
              ) : (
                <>
                  <img
                    src={playlist.imageUrl}
                    alt="Playlist Cover"
                    className="h-16 w-16 object-cover rounded-lg mb-2"
                  />
                  <div className="p-3 bg-zinc-800 rounded-full inline-block mb-2">
                    <Upload className="h-6 w-6 text-zinc-400" />
                  </div>
                  <div className="text-sm text-zinc-400 mb-2">
                    Upload new image
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Playlist fields */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Playlist Name</label>
            <Input
              value={playlist.name}
              onChange={(e) =>
                setPlaylist({ ...playlist, name: e.target.value })
              }
              className="bg-zinc-800 border-zinc-700"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Public</label>
            <Select
              value={playlist.isPublic ? "true" : "false"}
              onValueChange={(value) =>
                setPlaylist({ ...playlist, isPublic: value === "true" })
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

          {/* Category selection */}
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
            onClick={() => setDialogOpen(false)}
            disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? "Updating..." : "Update Playlist"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default UpdatePlaylistDialog;
