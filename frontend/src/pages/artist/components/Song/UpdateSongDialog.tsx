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
import { useSongStore } from "@/stores/useSongStore";
import { Edit, Upload } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import * as mm from "music-metadata";

const UpdateSongDialog = ({ song }: { song: any }) => {
  const { albums, fetchMyAlbums } = useAlbumStore();
  const { updateSong, isLoading } = useSongStore();
  const [songDialogOpen, setSongDialogOpen] = useState(false);
  const [isSingle, setIsSingle] = useState(song?.isSingle ?? true);

  const [updatedSong, setUpdatedSong] = useState({
    title: song?.title || "",
    album: song?.albumId?._id || "",
    duration: song?.duration ? song.duration.toString() : "0",
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
    const formData = new FormData();
    formData.append("title", updatedSong.title);
    formData.append("isSingle", String(isSingle));
    formData.append("duration", updatedSong.duration);

    if (!isSingle && updatedSong.album) {
      formData.append("albumId", updatedSong.album);
    }
    if (files.audio) {
      formData.append("audioFile", files.audio);
    }
    if (files.image) {
      formData.append("imageFile", files.image);
    }

    await updateSong(song._id, formData);

    setSongDialogOpen(false);
  };

  return (
    <Dialog open={songDialogOpen} onOpenChange={setSongDialogOpen}>
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
          <DialogTitle>Update Song</DialogTitle>
          <DialogDescription>Modify details for your song</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Image Upload */}
          <div
            className="flex items-center justify-center p-6 border-2 border-dashed border-zinc-700 rounded-lg cursor-pointer"
            onClick={() => imageInputRef.current?.click()}>
            <div className="text-center">
              {files.image || song.imageUrl ? (
                <img
                  src={
                    files.image
                      ? URL.createObjectURL(files.image)
                      : song.imageUrl
                  }
                  alt="Song Artwork"
                  className="h-24 w-24 rounded-lg object-cover"
                />
              ) : (
                <>
                  <div className="p-3 bg-zinc-800 rounded-full inline-block mb-2">
                    <Upload className="h-6 w-6 text-zinc-400" />
                  </div>
                  <div className="text-sm text-zinc-400 mb-2">
                    Upload new artwork (optional)
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
            accept="image/*"
            ref={imageInputRef}
            hidden
            onChange={(e) =>
              setFiles((prev) => ({ ...prev, image: e.target.files![0] }))
            }
          />

          {/* Audio Upload */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Audio File</label>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={() => audioInputRef.current?.click()}
                className="w-full">
                {files.audio
                  ? files.audio.name.slice(0, 20)
                  : song.audioUrl
                  ? song.audioUrl.split("/").pop() // Hiển thị tên file từ URL cũ
                  : "Choose New Audio File (Optional)"}
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

                    setUpdatedSong((prev) => ({
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

            {/* ✅ Thiết kế đẹp hơn cho Audio Player */}
            {song.audioUrl && !files.audio && (
              <div className="mt-2 p-3 border border-zinc-700 bg-zinc-800 rounded-lg flex flex-col items-center">
                <p className="text-sm text-zinc-400 mb-2">
                  Current Audio Preview
                </p>
                <audio controls className="w-full">
                  <source src={song.audioUrl} type="audio/mpeg" />
                  Your browser does not support the audio element.
                </audio>
              </div>
            )}
          </div>

          {/* Title Input */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Title</label>
            <Input
              value={updatedSong.title}
              onChange={(e) =>
                setUpdatedSong({ ...updatedSong, title: e.target.value })
              }
              className="bg-zinc-800 border-zinc-700"
            />
          </div>

          {/* Duration */}
          <div>
            <label className="text-sm font-medium">Duration (seconds)</label>
            <Input
              type="text"
              value={updatedSong.duration}
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
                value={updatedSong.album}
                onValueChange={(value) =>
                  setUpdatedSong({ ...updatedSong, album: value })
                }>
                <SelectTrigger className="bg-zinc-800 border-zinc-700">
                  <SelectValue
                    placeholder={
                      song.albumId ? song.albumId.title : "Select an album"
                    }
                  />
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
          <Button onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? "Updating..." : "Update Song"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default UpdateSongDialog;
