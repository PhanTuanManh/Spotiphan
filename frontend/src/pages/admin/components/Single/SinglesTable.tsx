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
import { useSongStore } from "@/stores/useSongStore";
import {
  Archive,
  CheckCircle,
  PackageOpen,
  RefreshCcw,
  Trash2,
  XCircle,
} from "lucide-react";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

// Custom Hook for Debouncing
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

const SinglesTable = () => {
  const {
    songs,
    fetchAllSingles,
    approveSingle,
    unarchiveSingle,
    rejectSingle,
    archiveSingle,
    deleteSong,
    isLoading,
  } = useSongStore();
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const [selectedSingleDelete, setSelectedSingleDelete] = useState<
    string | null
  >(null);
  const [selectedSingleArchive, setSelectedSingleArchive] = useState<
    string | null
  >(null);

  useEffect(() => {
    fetchAllSingles();
  }, [fetchAllSingles]);

  const handleApprove = async (songId: string) => {
    try {
      await approveSingle(songId);
    } catch {
      toast.error("Failed to approve single");
    }
  };

  const handleReject = async (songId: string) => {
    try {
      await rejectSingle(songId);
    } catch {
      toast.error("Failed to reject single");
    }
  };

  const handleArchive = async (songId: string) => {
    try {
      await archiveSingle(songId);
    } catch {
      toast.error("Failed to archive single");
    }
  };

  const handleUnarchive = async (songId: string) => {
    try {
      await unarchiveSingle(songId);
    } catch {
      toast.error("Failed to archive single");
    }
  };

  const handleDelete = async (songId: string) => {
    try {
      await deleteSong(songId);
    } catch {
      toast.error("Failed to delete single");
    }
  };

  const filteredSongs = Array.isArray(songs)
    ? songs.filter((song) => {
        const normalizedSearchTerm = removeDiacritics(
          debouncedSearchTerm.toLowerCase()
        );
        const normalizedTitle = removeDiacritics(song.title.toLowerCase());
        const normalizedArtist = removeDiacritics(
          (typeof song.artist === "object" && song.artist !== null
            ? song.artist.fullName
            : ""
          ).toLowerCase()
        );
        return (
          normalizedTitle.includes(normalizedSearchTerm) ||
          normalizedArtist.includes(normalizedSearchTerm)
        );
      })
    : [];

  return (
    <>
      {/* Modal Confirm Archive */}
      {selectedSingleDelete && (
        <ModalConfirm
          title="Delete Album"
          message="Are you sure you want to delete this album? This action cannot be undone."
          onConfirm={() => {
            handleDelete(selectedSingleDelete);
            setSelectedSingleDelete(null);
          }}
          onCancel={() => setSelectedSingleDelete(null)}
        />
      )}
      {selectedSingleArchive && (
        <ModalConfirm
          title="Archive Album"
          message="Are you sure you want to archive this album? This action cannot be undone."
          onConfirm={() => {
            handleArchive(selectedSingleArchive);
            setSelectedSingleArchive(null);
          }}
          onCancel={() => setSelectedSingleArchive(null)}
        />
      )}

      {/* Search & Refresh */}
      <div className="mb-4 flex justify-between items-center">
        <input
          type="text"
          placeholder="Search singles..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full p-2 border border-zinc-800 rounded bg-zinc-900 text-zinc-100"
        />
        <Button
          variant="outline"
          className="ml-4"
          onClick={fetchAllSingles}
          disabled={isLoading}>
          <RefreshCcw
            className={`h-5 w-5 ${isLoading ? "animate-spin" : ""}`}
          />
        </Button>
      </div>

      {/* Singles Table */}
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-zinc-800/50">
            <TableHead className="w-[50px]"></TableHead>
            <TableHead>Title</TableHead>
            <TableHead>Artist</TableHead>
            <TableHead>Duration</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredSongs.map((song) => (
            <TableRow key={song._id} className="hover:bg-zinc-800/50">
              <TableCell>
                <img
                  src={song.imageUrl}
                  alt={song.title}
                  className="w-10 h-10 rounded object-cover"
                />
              </TableCell>
              <TableCell className="font-medium">{song.title}</TableCell>
              <TableCell>{song.artist.fullName}</TableCell>
              <TableCell>{`${Math.floor(song.duration / 60)} min ${
                song.duration % 60
              } s`}</TableCell>
              <TableCell>
                <span
                  className={`px-2 py-1 text-xs rounded-full ${
                    song.status === "pending"
                      ? "bg-yellow-500 text-black"
                      : song.status === "approved"
                      ? "bg-green-500 text-white"
                      : song.status === "rejected"
                      ? "bg-red-500 text-white"
                      : "bg-gray-500 text-white"
                  }`}>
                  {song.status}
                </span>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex gap-2 justify-end">
                  {song.status === "pending" && (
                    <>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleApprove(song._id)}
                        className="text-green-400 hover:text-green-300 hover:bg-green-400/10">
                        <CheckCircle className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleReject(song._id)}
                        className="text-red-400 hover:text-red-300 hover:bg-red-400/10">
                        <XCircle className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                  {song.status !== "archived" ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedSingleArchive(song._id)}
                      className="text-gray-400 hover:text-gray-300 hover:bg-gray-400/10">
                      <Archive className="h-4 w-4" />
                    </Button>
                  ) : (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleUnarchive(song._id)}
                      className="text-gray-400 hover:text-gray-300 hover:bg-gray-400/10">
                      <PackageOpen className="h-4 w-4" />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedSingleDelete(song._id)}
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

export default SinglesTable;
