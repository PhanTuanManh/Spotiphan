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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAlbumStore } from "@/stores/useAlbumStore";
import { useAuthStore } from "@/stores/useAuthStore";
import { useSongStore } from "@/stores/useSongStore";
import { Plus, Upload } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import * as mm from "music-metadata";

const AddSongDialog = () => {
  const { albums, fetchMyAlbums } = useAlbumStore();
  const { user_id } = useAuthStore();
  const { createSong, isLoading } = useSongStore();
  const [songDialogOpen, setSongDialogOpen] = useState(false);
  const [isSingle, setIsSingle] = useState(true);

  const [newSong, setNewSong] = useState({
    title: "",
    album: "",
    duration: "0",
  });

  const [files, setFiles] = useState<{
    audio: File | null;
    image: File | null;
  }>({
    audio: null,
    image: null,
  });

  const audioInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isSingle) {
      fetchMyAlbums();
    }
  }, [isSingle]);

  const handleSubmit = async () => {
    if (!files.audio || !files.image) {
      toast.error("Please upload both audio and image files");
      return;
    }

    const formData = new FormData();
    formData.append("title", newSong.title);
    formData.append("artistId", user_id || "");
    formData.append("isSingle", String(isSingle));
    formData.append("duration", newSong.duration);
    if (!isSingle && newSong.album) {
      formData.append("albumId", newSong.album);
    }
    formData.append("audioFile", files.audio);
    formData.append("imageFile", files.image);

    await createSong(formData);

    setNewSong({ title: "", album: "", duration: "0" });
    setFiles({ audio: null, image: null });
    setSongDialogOpen(false);
  };

  return (
    <Dialog open={songDialogOpen} onOpenChange={setSongDialogOpen}>
      <DialogTrigger asChild>
        <Button className="bg-emerald-500 hover:bg-emerald-600 text-black">
          <Plus className="mr-2 h-4 w-4" /> Add Song
        </Button>
      </DialogTrigger>

      <DialogContent className="bg-zinc-900 border-zinc-700 max-h-[80vh] overflow-auto">
        <DialogHeader>
          <DialogTitle>Add New Song</DialogTitle>
          <DialogDescription>
            Add a new song to your music library
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <input
            type="file"
            accept="audio/*"
            ref={audioInputRef}
            hidden
            onChange={(e) =>
              setFiles((prev) => ({ ...prev, audio: e.target.files![0] }))
            }
          />

          <input
            type="file"
            ref={imageInputRef}
            className="hidden"
            accept="image/*"
            onChange={(e) =>
              setFiles((prev) => ({ ...prev, image: e.target.files![0] }))
            }
          />

          {/* image upload area */}
          <div
            className="flex items-center justify-center p-6 border-2 border-dashed border-zinc-700 rounded-lg cursor-pointer"
            onClick={() => imageInputRef.current?.click()}>
            <div className="text-center">
              {files.image ? (
                <div className="space-y-2">
                  <div className="text-sm text-emerald-500">
                    Image selected:
                  </div>
                  <div className="text-xs text-zinc-400">
                    {files.image.name.slice(0, 20)}
                  </div>
                </div>
              ) : (
                <>
                  <div className="p-3 bg-zinc-800 rounded-full inline-block mb-2">
                    <Upload className="h-6 w-6 text-zinc-400" />
                  </div>
                  <div className="text-sm text-zinc-400 mb-2">
                    Upload artwork
                  </div>
                  <Button variant="outline" size="sm" className="text-xs">
                    Choose File
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* Audio upload */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Audio File</label>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={() => audioInputRef.current?.click()}
                className="w-full">
                {files.audio
                  ? files.audio.name.slice(0, 20)
                  : "Choose Audio File"}
              </Button>
            </div>
            <input
              type="file"
              accept="audio/*"
              ref={audioInputRef}
              hidden
              onChange={async (event) => {
                const file = event.target.files?.[0];
                if (file) {
                  setFiles((prev) => ({ ...prev, audio: file }));

                  try {
                    const metadata = await mm.parseBlob(file);
                    const durationInSeconds = metadata.format.duration
                      ? Math.round(metadata.format.duration)
                      : 0;

                    setNewSong((prev) => ({
                      ...prev,
                      duration: durationInSeconds.toString(),
                    }));
                  } catch (error) {
                    console.error("Error getting duration:", error);
                    toast.error("Failed to get duration from audio file.");
                  }
                }
              }}
            />
          </div>
          {/* other fields */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Title</label>
            <Input
              value={newSong.title}
              onChange={(e) =>
                setNewSong({ ...newSong, title: e.target.value })
              }
              className="bg-zinc-800 border-zinc-700"
            />
          </div>
          {/* Hiển thị thời lượng */}
          <div>
            <label className="text-sm font-medium">Duration (seconds)</label>
            <Input
              type="text"
              value={newSong.duration}
              readOnly
              className="bg-zinc-800 border-zinc-700"
            />
          </div>

          {/* Song Type Toggle */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Song Type</label>
            <Select
              value={String(isSingle)}
              onValueChange={(value) => setIsSingle(value === "true")}>
              <SelectTrigger className="bg-zinc-800 border-zinc-700">
                <SelectValue placeholder="Select Type" />
              </SelectTrigger>
              <SelectContent className="bg-zinc-800 border-zinc-700">
                <SelectItem value="true">Single</SelectItem>
                <SelectItem value="false">Album Track</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Album Selection */}
          {!isSingle && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Select Album</label>
              <Select
                value={newSong.album}
                onValueChange={(value) =>
                  setNewSong({ ...newSong, album: value })
                }>
                <SelectTrigger className="bg-zinc-800 border-zinc-700">
                  <SelectValue placeholder="Select an album" />
                </SelectTrigger>
                <SelectContent className="bg-zinc-800 border-zinc-700">
                  {albums.map((album) => (
                    <SelectItem key={album._id} value={album._id}>
                      {album.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setSongDialogOpen(false)}
            disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? "Uploading..." : "Add Song"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddSongDialog;
