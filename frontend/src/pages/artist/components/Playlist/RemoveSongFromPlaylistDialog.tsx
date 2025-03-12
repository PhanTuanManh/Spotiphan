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
import { usePlaylistStore } from "@/stores/usePlaylistStore";
import { CircleMinus, Search, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

interface RemoveSongFromPlaylistDialogProps {
  playlistId: string;
}

const RemoveSongFromPlaylistDialog = ({
  playlistId,
}: RemoveSongFromPlaylistDialogProps) => {
  const { fetchMyPlaylists, removeSongFromPlaylist, playlists } =
    usePlaylistStore();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [playlistSongs, setPlaylistSongs] = useState<any[]>([]); // ✅ Store songs in the playlist

  // ✅ Fetch songs from the selected playlist
  useEffect(() => {
    if (dialogOpen) {
      const currentPlaylist = playlists.find((p) => p._id === playlistId);
      if (currentPlaylist) {
        setPlaylistSongs(currentPlaylist.songs);
      }
    }
  }, [dialogOpen, playlists, playlistId]);

  // ✅ Handle song removal
  const handleRemoveSong = async (songId: string) => {
    try {
      await removeSongFromPlaylist(songId, playlistId);

      // ✅ Update local state to remove the song
      setPlaylistSongs((prevSongs) =>
        prevSongs.filter((song) => song._id !== songId)
      );

      fetchMyPlaylists(); // ✅ Refresh user playlists
    } catch (error: any) {
      toast.error("Failed to remove song: " + error.message);
    }
  };

  // ✅ Filter songs based on search input
  const filteredSongs = playlistSongs.filter((song) =>
    song.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="text-zinc-400 hover:text-red-300 hover:bg-blue-400/10">
          <CircleMinus className="h-4 w-4" />
        </Button>
      </DialogTrigger>

      <DialogContent className="bg-zinc-900 border-zinc-700 max-h-[80vh] overflow-auto w-full">
        <DialogHeader>
          <DialogTitle>Remove Songs from Playlist</DialogTitle>
          <DialogDescription>
            Select songs to remove from your playlist.
          </DialogDescription>
        </DialogHeader>

        {/* 🔍 Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-5 w-5 text-zinc-400" />
          <Input
            placeholder="Search songs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-zinc-800 border-zinc-700"
          />
        </div>

        {/* 🎵 Song List */}
        <div className="space-y-2 mt-4 max-h-60 overflow-y-auto">
          {filteredSongs.length > 0 ? (
            filteredSongs.map((song) => (
              <div
                key={song._id}
                className="flex items-center justify-between p-2 border border-zinc-700 rounded-lg">
                <div className="flex items-center space-x-3">
                  <img
                    src={song.imageUrl}
                    alt={song.title}
                    className="h-10 w-10 object-cover rounded-md"
                  />
                  <div>
                    <p className="text-sm font-medium">{song.title}</p>
                    <p className="text-xs text-zinc-400">
                      {song.artist?.fullName || "Unknown Artist"}
                    </p>
                  </div>
                </div>
                <Button
                  size="icon"
                  variant="ghost"
                  className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                  onClick={() => handleRemoveSong(song._id)}>
                  <Trash2 className="h-5 w-5" />
                </Button>
              </div>
            ))
          ) : (
            <p className="text-center text-zinc-400 mt-2">No songs found.</p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setDialogOpen(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default RemoveSongFromPlaylistDialog;
