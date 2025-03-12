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
import { useSongStore } from "@/stores/useSongStore";
import { CirclePlus, Plus, Search } from "lucide-react";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

interface AddSongToPlaylistDialogProps {
  playlistId: string;
}

const AddSongToPlaylistDialog = ({
  playlistId,
}: AddSongToPlaylistDialogProps) => {
  const { fetchSongs, songs = [], isLoading, hasMore, page } = useSongStore();
  const { addSongToPlaylist, fetchMyPlaylists, playlists } = usePlaylistStore();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [existingSongIds, setExistingSongIds] = useState<string[]>([]); // ✅ Store playlist's song IDs

  // ✅ Fetch songs when the dialog opens or searchTerm changes
  useEffect(() => {
    if (dialogOpen) {
      fetchSongs(1, searchTerm);

      // ✅ Fetch the current playlist's songs
      const currentPlaylist = playlists.find((p) => p._id === playlistId);
      if (currentPlaylist) {
        setExistingSongIds(currentPlaylist.songs.map((song) => song._id));
      }
    }
  }, [dialogOpen, searchTerm, playlists, playlistId]);

  // ✅ Handle adding a song to the playlist
  const handleAddSong = async (songId: string) => {
    try {
      await addSongToPlaylist(songId, playlistId);
      toast.success("Song added to playlist successfully");

      // ✅ Update the local state to remove added song
      setExistingSongIds((prev) => [...prev, songId]);

      fetchMyPlaylists(); // ✅ Refresh user's playlists
    } catch (error: any) {
      toast.error("Failed to add song: " + error.message);
    }
  };

  // ✅ Filter out songs already in the playlist
  const filteredSongs = songs.filter(
    (song) => !existingSongIds.includes(song._id)
  );

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="text-zinc-400 hover:text-emerald-300 hover:bg-blue-400/10">
          <CirclePlus className="h-4 w-4" />
        </Button>
      </DialogTrigger>

      <DialogContent className="bg-zinc-900 border-zinc-700 max-h-[80vh] overflow-auto w-full">
        <DialogHeader>
          <DialogTitle>Add Songs to Playlist</DialogTitle>
          <DialogDescription>
            Select songs to add to your playlist.
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
                  className="text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10"
                  onClick={() => handleAddSong(song._id)}>
                  <Plus className="h-5 w-5" />
                </Button>
              </div>
            ))
          ) : (
            <p className="text-center text-zinc-400 mt-2">No songs found.</p>
          )}
        </div>

        {/* 🔄 Load More Button */}
        {hasMore && (
          <Button
            onClick={() => fetchSongs(page + 1, searchTerm)}
            className="w-full mt-2"
            disabled={isLoading}>
            {isLoading ? "Loading..." : "Load More"}
          </Button>
        )}

        <DialogFooter></DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddSongToPlaylistDialog;
