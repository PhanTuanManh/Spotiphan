import { useRef, useState, useEffect } from "react";
import PlaylistSkeleton from "@/components/skeletons/PlaylistSkeleton";
import { Button, buttonVariants } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { useMusicStore } from "@/stores/useMusicStore";
import { SignedIn, useUser } from "@clerk/clerk-react";
import { HomeIcon, Library, MessageCircle, Plus, Upload } from "lucide-react";
import { Link } from "react-router-dom";
import { axiosInstance } from "@/lib/axios";
import { toast } from "react-hot-toast";
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
import { useAuthStore } from "@/stores/useAuthStore";

const LeftSidebar = () => {
  const { albums, fetchAlbums, isLoading, playlists, fetchPlaylists } =
    useMusicStore();
  const { user } = useUser(); // Lấy thông tin người dùng từ Clerk
  const [isCreatingPlaylist, setIsCreatingPlaylist] = useState(false); // Trạng thái tạo playlist
  const [playlistName, setPlaylistName] = useState(""); // Tên playlist
  const [playlistImage, setPlaylistImage] = useState<File | null>(null); // Ảnh playlist
  const imageInputRef = useRef<HTMLInputElement>(null); // Ref cho input file
  const [artistNames, setArtistNames] = useState<{ [key: string]: string }>({}); // Lưu tên nghệ sĩ
  const [userNames, setUserNames] = useState<{ [key: string]: string }>({}); // Lưu tên người dùng
  // Kiểm tra xem người dùng có phải là premium không
  const { role } = useAuthStore();
  const isPremium = role === "premium";

  // Fetch artist names
  const fetchArtistNames = async (artistIds: string[]) => {
    try {
      // Gọi API để lấy tên nghệ sĩ từ danh sách ID
      const response = await axiosInstance.post("/users/batch", {
        ids: artistIds,
      });

      // Tạo một object để lưu tên nghệ sĩ
      const names: { [key: string]: string } = {};
      response.data.forEach((artist: { _id: string; fullName: string }) => {
        names[artist._id] = artist.fullName;
      });

      // Cập nhật state với tên nghệ sĩ mới
      setArtistNames((prev) => ({ ...prev, ...names }));
    } catch (error) {
      console.error("Failed to fetch artist names:", error);
      // Fallback nếu có lỗi
      artistIds.forEach((id) => (artistNames[id] = "Unknown Artist"));
    }
  };

  const fetchUserNames = async (userIds: string[]) => {
    try {
      // Gọi API để lấy tên người dùng từ danh sách ID
      const response = await axiosInstance.post("/users/batch", {
        ids: userIds,
      });

      // Tạo một object để lưu tên người dùng
      const names: { [key: string]: string } = {};
      response.data.forEach((user: { _id: string; fullName: string }) => {
        names[user._id] = user.fullName;
      });

      // Cập nhật state với tên người dùng mới
      setUserNames((prev) => ({ ...prev, ...names }));
    } catch (error) {
      console.error("Failed to fetch user names:", error);
      // Fallback nếu có lỗi
      userIds.forEach((id) => (userNames[id] = "Unknown User"));
    }
  };
  // Fetch albums và artist names khi component được mount
  useEffect(() => {
    fetchAlbums();
    fetchPlaylists();
  }, [fetchAlbums, fetchPlaylists]);

  // Khi albums thay đổi, lấy danh sách artistIds và fetch tên nghệ sĩ
  useEffect(() => {
    if (albums.length > 0) {
      const artistIds = albums.map((album) => album.artist); // Lấy danh sách artistId từ albums
      fetchArtistNames(artistIds);
    }
  }, [albums]);

  useEffect(() => {
    if (playlists.length > 0) {
      const userIds = playlists.map((playlist) => playlist.userId); // Lấy danh sách userId từ playlists
      fetchUserNames(userIds);
    }
  }, [playlists]);
  // Hàm xử lý tạo playlist
  const handleCreatePlaylist = async () => {
    if (!playlistName) {
      toast.error("Please enter a playlist name");
      return;
    }

    const formData = new FormData();
    formData.append("name", playlistName);
    if (playlistImage) {
      formData.append("imageFile", playlistImage);
    }

    try {
      const response = await axiosInstance.post("/playlists", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      if (response.data) {
        toast.success("Playlist created successfully");
        setIsCreatingPlaylist(false);
        setPlaylistName("");
        setPlaylistImage(null);
        fetchPlaylists(); // Cập nhật lại danh sách playlist
      }
    } catch (error) {
      console.error("Error creating playlist:", error);
      toast.error("Failed to create playlist");
    }
  };

  return (
    <div className="h-full flex flex-col gap-2">
      {/* Navigation menu */}
      <div className="rounded-lg bg-zinc-900 p-4">
        <div className="space-y-2">
          <Link
            to={"/"}
            className={cn(
              buttonVariants({
                variant: "ghost",
                className: "w-full justify-start text-white hover:bg-zinc-800",
              })
            )}>
            <HomeIcon className="mr-2 size-5" />
            <span className="hidden md:inline">Home</span>
          </Link>

          <SignedIn>
            <Link
              to={"/chat"}
              className={cn(
                buttonVariants({
                  variant: "ghost",
                  className:
                    "w-full justify-start text-white hover:bg-zinc-800",
                })
              )}>
              <MessageCircle className="mr-2 size-5" />
              <span className="hidden md:inline">Messages</span>
            </Link>
          </SignedIn>
        </div>
      </div>

      {/* Library section */}
      <div className="flex-1 rounded-lg bg-zinc-900 p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center text-white px-2">
            <Library className="size-5 mr-2" />
            <span className="hidden md:inline">Library</span>
            {isPremium && ( // Chỉ hiển thị nút tạo playlist cho người dùng premium
              <Dialog
                open={isCreatingPlaylist}
                onOpenChange={setIsCreatingPlaylist}>
                <DialogTrigger asChild>
                  <button className="ml-2 text-zinc-400 hover:text-zinc-100">
                    <Plus className="size-5" />
                    <span className="sr-only">Create playlist</span>
                  </button>
                </DialogTrigger>

                <DialogContent className="bg-zinc-900 border-zinc-700">
                  <DialogHeader>
                    <DialogTitle>Create Playlist</DialogTitle>
                    <DialogDescription>
                      Add a new playlist to your library
                    </DialogDescription>
                  </DialogHeader>

                  <div className="space-y-4 py-4">
                    {/* Image upload area */}
                    <input
                      type="file"
                      ref={imageInputRef}
                      className="hidden"
                      accept="image/*"
                      onChange={(e) => {
                        if (e.target.files) {
                          setPlaylistImage(e.target.files[0]);
                        }
                      }}
                    />
                    <div
                      className="flex items-center justify-center p-6 border-2 border-dashed border-zinc-700 rounded-lg cursor-pointer"
                      onClick={() => imageInputRef.current?.click()}>
                      <div className="text-center">
                        {playlistImage ? (
                          <div className="space-y-2">
                            <div className="text-sm text-emerald-500">
                              Image selected:
                            </div>
                            <div className="text-xs text-zinc-400">
                              {playlistImage.name.slice(0, 20)}
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
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-xs">
                              Choose File
                            </Button>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Playlist name input */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium">
                        Playlist Name
                      </label>
                      <Input
                        value={playlistName}
                        onChange={(e) => setPlaylistName(e.target.value)}
                        className="bg-zinc-800 border-zinc-700"
                      />
                    </div>
                  </div>

                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => setIsCreatingPlaylist(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleCreatePlaylist}>Create</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>

        <ScrollArea className="h-[calc(100vh-300px)]">
          <div className="space-y-4">
            {/* Hiển thị danh sách playlist */}
            <div>
              <h3 className="text-sm font-semibold text-zinc-400 mb-2">
                Playlists
              </h3>
              {isLoading ? (
                <PlaylistSkeleton />
              ) : Array.isArray(playlists) && playlists.length > 0 ? (
                playlists.map((playlist) => (
                  <Link
                    to={`/playlists/${playlist._id}`}
                    key={playlist._id}
                    className="p-2 hover:bg-zinc-800 rounded-md flex items-center gap-3 group cursor-pointer">
                    <img
                      src={playlist.imageUrl}
                      alt="Playlist img"
                      className="size-12 rounded-md flex-shrink-0 object-cover"
                    />

                    <div className="flex-1 min-w-0 hidden md:block">
                      <p className="font-medium truncate">{playlist.name}</p>
                      <p className="text-sm text-zinc-400 truncate">
                        Playlist •{" "}
                        {userNames[playlists[0]?.userId] || "Unknown User"}
                      </p>
                    </div>
                  </Link>
                ))
              ) : (
                <p className="text-zinc-400 text-sm">No playlists found</p>
              )}
            </div>

            {/* Hiển thị danh sách album */}
            <div>
              <h3 className="text-sm font-semibold text-zinc-400 mb-2">
                Albums
              </h3>
              {isLoading ? (
                <PlaylistSkeleton />
              ) : Array.isArray(albums) && albums.length > 0 ? (
                albums.map((album) => (
                  <Link
                    to={`/albums/${album._id}`}
                    key={album._id}
                    className="p-2 hover:bg-zinc-800 rounded-md flex items-center gap-3 group cursor-pointer">
                    <img
                      src={album.imageUrl}
                      alt="Album img"
                      className="size-12 rounded-md flex-shrink-0 object-cover"
                    />

                    <div className="flex-1 min-w-0 hidden md:block">
                      <p className="font-medium truncate">{album.title}</p>
                      <p className="text-xs text-zinc-400 truncate">
                        Album • {album.artist.fullName}
                      </p>
                    </div>
                  </Link>
                ))
              ) : (
                <p className="text-zinc-400 text-sm">No albums found</p>
              )}
            </div>
          </div>
        </ScrollArea>
      </div>
    </div>
  );
};

export default LeftSidebar;
