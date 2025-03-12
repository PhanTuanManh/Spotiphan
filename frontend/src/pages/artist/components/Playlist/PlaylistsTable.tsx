import { Button } from "@/components/ui/button";
import ModalConfirm from "@/components/ui/modalConfirm";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { usePlaylistStore } from "@/stores/usePlaylistStore";
import { RefreshCcw, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import UpdatePlaylistDialog from "./UpdatePlaylistDialog";
import AddSongToPlaylistDialog from "./AddSongToPlaylistDialog";
import RemoveSongFromPlaylistDialog from "./RemoveSongFromPlaylistDialog";

// Custom Hook for Debouncing Search Input
const useDebounce = <T,>(value: T, delay: number): T => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};
const removeDiacritics = (str: string) => {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D");
};

const PlaylistTable = () => {
  const {
    playlists,
    fetchMyPlaylists,
    createPlaylist,
    updatePlaylist,
    deletePlaylist,
    isLoading,
  } = usePlaylistStore();
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  const [editingPlaylist, setEditingPlaylist] = useState<{
    id: string;
    name: string;
    isPublic: boolean;
    category: string[];
  } | null>(null);
  const [selectedPlaylistDelete, setSelectedPlaylistDelete] = useState<
    string | null
  >(null);

  useEffect(() => {
    fetchMyPlaylists();
  }, [fetchMyPlaylists]);

  const handleDeletePlaylist = async () => {
    if (selectedPlaylistDelete) {
      await deletePlaylist(selectedPlaylistDelete); // ✅ Gọi hàm xóa
      setSelectedPlaylistDelete(null); // ✅ Đóng modal sau khi xóa
      fetchMyPlaylists(); // ✅ Refresh danh sách sau khi xóa
    }
  };

  // Filter Playlists
  const filteredPlaylists =
    Array.isArray(playlists) && playlists.length > 0
      ? playlists.filter((playlist) => {
          if (!playlist.name) return false;
          const normalizedSearchTerm = removeDiacritics(
            debouncedSearchTerm.toLowerCase()
          );
          const normalizedName = removeDiacritics(playlist.name.toLowerCase());
          return normalizedName.includes(normalizedSearchTerm);
        })
      : [];

  return (
    <>
      {/* Modal Confirm Delete */}
      {selectedPlaylistDelete && (
        <ModalConfirm
          title="Delete Playlist"
          message="Are you sure you want to delete this playlist? This action cannot be undone."
          onConfirm={handleDeletePlaylist}
          onCancel={() => setSelectedPlaylistDelete(null)}
        />
      )}

      {/* Search & Refresh */}
      <div className="mb-4 flex justify-between items-center">
        <input
          type="text"
          placeholder="Search albums..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full p-2 border border-zinc-800 rounded bg-zinc-900 text-zinc-100"
        />
        <Button
          variant="outline"
          className="ml-4"
          onClick={fetchMyPlaylists}
          disabled={isLoading}>
          <RefreshCcw
            className={`h-5 w-5 ${isLoading ? "animate-spin" : ""}`}
          />
        </Button>
      </div>

      {/* Playlists Table */}
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-zinc-800/50">
            <TableHead className="w-[50px]"></TableHead>
            <TableHead>Title</TableHead>
            <TableHead>Songs</TableHead>
            <TableHead>Categories</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredPlaylists.map((playlist) => (
            <TableRow key={playlist._id}>
              <TableCell>
                <img
                  src={playlist.imageUrl}
                  alt={playlist.name}
                  className="w-10 h-10 rounded object-cover"
                />
              </TableCell>
              <TableCell>
                {editingPlaylist && editingPlaylist.id === playlist._id ? (
                  <input
                    type="text"
                    value={editingPlaylist.name}
                    onChange={(e) =>
                      setEditingPlaylist({
                        ...editingPlaylist,
                        name: e.target.value,
                      })
                    }
                    className="p-1 border border-gray-300 rounded"
                  />
                ) : (
                  playlist.name
                )}
              </TableCell>
              <TableCell>{playlist.songs.length} Songs</TableCell>
              <TableCell>
                {playlist.category &&
                  playlist.category.map((category) => category.name).join(", ")}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex gap-2 justify-end">
                  <AddSongToPlaylistDialog playlistId={playlist._id} />
                  <RemoveSongFromPlaylistDialog playlistId={playlist._id} />
                  <UpdatePlaylistDialog playlistId={playlist._id} />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedPlaylistDelete(playlist._id)} // ✅ Set playlist khi nhấn Delete
                    className="text-red-400 hover:text-red-300 hover:bg-red-400/10">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </>
  );
};

export default PlaylistTable;
