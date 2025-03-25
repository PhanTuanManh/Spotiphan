import { useRef, useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { SignedIn, useUser } from "@clerk/clerk-react";
import { SignIn } from "@clerk/clerk-react";
import { HomeIcon, Library, MessageCircle, Plus, Upload } from "lucide-react";
import { toast } from "react-hot-toast";
import ReactDOM from "react-dom";

// Components
import PlaylistSkeleton from "@/components/skeletons/PlaylistSkeleton";
import { Button, buttonVariants } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
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

// Utilities
import { cn } from "@/lib/utils";
import { axiosInstance } from "@/lib/axios";

// Stores
import { useMusicStore } from "@/stores/useMusicStore";
import { useAuthStore } from "@/stores/useAuthStore";

const CreatePlaylistCard = ({
  title,
  subtitle,
  buttonText,
  onClick,
}: {
  title: string;
  subtitle: string;
  buttonText: string;
  onClick: () => void;
}) => (
  <div className="bg-zinc-800 py-4 px-[24px] rounded-lg">
    <h3 className="text-white font-medium mb-1">{title}</h3>
    <p className="text-white text-sm mb-5">{subtitle}</p>
    <button
      onClick={onClick}
      className="bg-white mb-1 text-black px-4 py-[6px] rounded-full text-sm font-medium hover:bg-gray-200 transition">
      {buttonText}
    </button>
  </div>
);

const SignInModal = ({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) => {
  if (!isOpen) return null;

  return ReactDOM.createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={onClose}>
      <div
        className="relative bg-card p-6 rounded-lg shadow-lg w-[95%] max-w-md z-10"
        onClick={(e) => e.stopPropagation()}>
        <SignIn
          routing="modal"
          afterSignInUrl="/"
          appearance={{
            elements: {
              rootBox: "w-full",
              card: "shadow-none border-0 w-full",
              headerTitle: "text-xl font-bold",
              headerSubtitle: "text-sm text-gray-600",
              socialButtonsBlockButton: "border border-gray-300",
              formFieldInput: "border border-gray-300 rounded-md",
              footerActionText: "text-sm text-gray-600",
            },
          }}
        />
      </div>
    </div>,
    document.body
  );
};

const LeftSidebar = () => {
  const navigate = useNavigate();
  const { isSignedIn } = useUser();
  const { role } = useAuthStore();
  const { albums, fetchAlbums, isLoading, playlists, fetchPlaylists } =
    useMusicStore();

  // State
  const [isCreatingPlaylist, setIsCreatingPlaylist] = useState(false);
  const [playlistName, setPlaylistName] = useState("");
  const [playlistImage, setPlaylistImage] = useState<File | null>(null);
  const [artistNames, setArtistNames] = useState<Record<string, string>>({});
  const [userNames, setUserNames] = useState<Record<string, string>>({});
  const [showSignInModal, setShowSignInModal] = useState(false);

  // Refs
  const imageInputRef = useRef<HTMLInputElement>(null);

  // Derived state
  const isPremium = role === "premium";
  const isFreeUser = role === "free";
  const isLoggedIn = isSignedIn;

  // Handlers
  const handleCreatePlaylistClick = useCallback(() => {
    if (!isLoggedIn) {
      setShowSignInModal(true); // Show sign in modal immediately
    } else if (isFreeUser) {
      navigate("/subscriptionPlan");
    } else {
      setIsCreatingPlaylist(true);
    }
  }, [isLoggedIn, isFreeUser, navigate]);

  const closeSignInModal = useCallback(() => {
    setShowSignInModal(false);
  }, []);

  const fetchArtistNames = useCallback(async (artistIds: string[]) => {
    try {
      const response = await axiosInstance.post("/users/batch", {
        ids: artistIds,
      });
      const names = response.data.reduce(
        (
          acc: Record<string, string>,
          artist: { _id: string; fullName: string }
        ) => {
          acc[artist._id] = artist.fullName;
          return acc;
        },
        {}
      );

      setArtistNames((prev) => ({ ...prev, ...names }));
    } catch (error) {
      console.error("Failed to fetch artist names:", error);
      artistIds.forEach((id) => (artistNames[id] = "Unknown Artist"));
    }
  }, []);

  const fetchUserNames = useCallback(async (userIds: string[]) => {
    try {
      const response = await axiosInstance.post("/users/batch", {
        ids: userIds,
      });
      const names = response.data.reduce(
        (
          acc: Record<string, string>,
          user: { _id: string; fullName: string }
        ) => {
          acc[user._id] = user.fullName;
          return acc;
        },
        {}
      );

      setUserNames((prev) => ({ ...prev, ...names }));
    } catch (error) {
      console.error("Failed to fetch user names:", error);
      userIds.forEach((id) => (userNames[id] = "Unknown User"));
    }
  }, []);

  const handleCreatePlaylist = async () => {
    if (!playlistName) {
      toast.error("Please enter a playlist name");
      return;
    }

    const formData = new FormData();
    formData.append("name", playlistName);
    if (playlistImage) formData.append("imageFile", playlistImage);

    try {
      const response = await axiosInstance.post("/playlists", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (response.data) {
        toast.success("Playlist created successfully");
        setIsCreatingPlaylist(false);
        setPlaylistName("");
        setPlaylistImage(null);
        fetchPlaylists();
      }
    } catch (error) {
      console.error("Error creating playlist:", error);
      toast.error("Failed to create playlist");
    }
  };

  // Effects
  useEffect(() => {
    if (isLoggedIn) {
      fetchAlbums();
      fetchPlaylists();
    }
  }, [isLoggedIn, fetchAlbums, fetchPlaylists]);

  useEffect(() => {
    if (albums.length > 0) {
      const artistIds = albums.map((album) => album.artist);
      fetchArtistNames(artistIds);
    }
  }, [albums, fetchArtistNames]);

  useEffect(() => {
    if (playlists.length > 0) {
      const userIds = playlists.map((playlist) => playlist.userId);
      fetchUserNames(userIds);
    }
  }, [playlists, fetchUserNames]);

  // Render functions
  const renderPlaylists = () => {
    if (isLoading) return <PlaylistSkeleton />;

    if (Array.isArray(playlists) && playlists.length > 0) {
      return playlists.map((playlist) => (
        <Link
          to={`/playlists/${playlist._id}`}
          key={playlist._id}
          className="p-2 hover:bg-zinc-800 rounded-md flex items-center gap-3 group cursor-pointer">
          <img
            src={playlist.imageUrl}
            alt="Playlist"
            className="size-12 rounded-md flex-shrink-0 object-cover"
          />
          <div className="flex-1 min-w-0 hidden md:block">
            <p className="font-medium truncate">{playlist.name}</p>
            <p className="text-sm text-zinc-400 truncate">
              Playlist • {userNames[playlist.userId] || "Unknown User"}
            </p>
          </div>
        </Link>
      ));
    }

    if (!isLoggedIn) {
      return (
        <CreatePlaylistCard
          title="Create Your Playlist"
          subtitle="It's easy! We'll help you"
          buttonText="Create Playlist"
          onClick={handleCreatePlaylistClick}
        />
      );
    }

    if (isFreeUser) {
      return (
        <CreatePlaylistCard
          title="Create Your Playlist"
          subtitle="It's easy! We'll help you"
          buttonText="Create Playlist"
          onClick={handleCreatePlaylistClick}
        />
      );
    }

    return <p className="text-zinc-400 text-sm">No playlists found</p>;
  };

  const renderAlbums = () => {
    if (isLoading) return <PlaylistSkeleton />;

    if (Array.isArray(albums) && albums.length > 0) {
      return albums.map((album) => (
        <Link
          to={`/albums/${album._id}`}
          key={album._id}
          className="p-2 hover:bg-zinc-800 rounded-md flex items-center gap-3 group cursor-pointer">
          <img
            src={album.imageUrl}
            alt="Album"
            className="size-12 rounded-md flex-shrink-0 object-cover"
          />
          <div className="flex-1 min-w-0 hidden md:block">
            <p className="font-medium truncate">{album.title}</p>
            <p className="text-xs text-zinc-400 truncate">
              Album • {album.artist.fullName}
            </p>
          </div>
        </Link>
      ));
    }

    return <p className="text-zinc-400 text-sm">No albums found</p>;
  };

  return (
    <div className="h-full flex flex-col gap-2">
      {/* Sign In Modal */}
      <SignInModal isOpen={showSignInModal} onClose={closeSignInModal} />

      {/* Navigation menu */}
      <div className="rounded-lg bg-zinc-900 p-4">
        <div className="space-y-2">
          <Link
            to="/"
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
              to="/chat"
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
            {isPremium && (
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
                    <input
                      type="file"
                      ref={imageInputRef}
                      className="hidden"
                      accept="image/*"
                      onChange={(e) =>
                        e.target.files && setPlaylistImage(e.target.files[0])
                      }
                    />
                    <div
                      className="flex items-center justify-center p-6 border-2 border-dashed border-zinc-700 rounded-lg cursor-pointer"
                      onClick={() => imageInputRef.current?.click()}>
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
                        <div className="text-center">
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
                        </div>
                      )}
                    </div>
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
            <div>
              <h3 className="text-sm font-semibold text-zinc-400 mb-2">
                Playlists
              </h3>
              {renderPlaylists()}
            </div>

            <div>
              <h3 className="text-sm font-semibold text-zinc-400 mb-2">
                Albums
              </h3>
              {renderAlbums()}
            </div>
          </div>
        </ScrollArea>
      </div>
    </div>
  );
};

export default LeftSidebar;
