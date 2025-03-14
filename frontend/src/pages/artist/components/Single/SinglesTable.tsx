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
import { useAuthStore } from "@/stores/useAuthStore";
import { useSongStore } from "@/stores/useSongStore";
import { RefreshCcw } from "lucide-react";
import { useEffect, useState } from "react";

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
    .replace(/[̀-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D");
};

const SinglesTable = () => {
  const { user_id } = useAuthStore();
  const artistId = user_id;
  const {
    songsByArtist,
    fetchAllSinglesByArtist,
    approveSingle,
    unarchiveSingle,
    rejectSingle,
    archiveSingle,
    deleteSong,
    isLoading,
    page,
    hasMore,
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
    if (!artistId) return;
    fetchAllSinglesByArtist(artistId);
  }, [fetchAllSinglesByArtist, artistId, debouncedSearchTerm]);

  const loadMoreSingles = () => {
    if (hasMore) {
      fetchAllSinglesByArtist(artistId, page + 1);
    }
  };

  const filteredSongs =
    songsByArtist[artistId]?.filter((song) => {
      const normalizedSearchTerm = removeDiacritics(
        debouncedSearchTerm.toLowerCase()
      );
      const normalizedTitle = removeDiacritics(song.title.toLowerCase());
      return normalizedTitle.includes(normalizedSearchTerm);
    }) || [];

  return (
    <>
      {/* Modal Confirm Archive */}
      {selectedSingleDelete && (
        <ModalConfirm
          title="Delete Single"
          message="Are you sure you want to delete this Single? This action cannot be undone."
          onConfirm={() => {
            deleteSong(selectedSingleDelete);
            setSelectedSingleDelete(null);
          }}
          onCancel={() => setSelectedSingleDelete(null)}
        />
      )}
      {selectedSingleArchive && (
        <ModalConfirm
          title="Archive Single"
          message="Are you sure you want to archive this Single? This action cannot be undone."
          onConfirm={() => {
            archiveSingle(selectedSingleArchive);
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
          onClick={() => fetchAllSinglesByArtist(artistId, 1)}
          disabled={isLoading}>
          <RefreshCcw
            className={`h-5 w-5 ${isLoading ? "animate-spin" : ""}`}
          />
        </Button>
      </div>

      {/* Singles Table */}
      <Table>
        {isLoading ? (
          <div></div>
        ) : (
          <>
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
                  <TableCell>{(song.duration / 60).toFixed(2)} min</TableCell>
                  <TableCell>
                    <span
                      className={`px-2 py-1 text-xs rounded-full ${
                        song.status === "pending"
                          ? "bg-yellow-500 text-black"
                          : song.status === "approved"
                          ? "bg-green-500 text-white"
                          : "bg-gray-500 text-white"
                      }`}>
                      {song.status}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    {/* Actions such as Edit, Delete can be added here */}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </>
        )}
      </Table>

      {hasMore && (
        <div className="flex justify-center mt-4">
          <Button onClick={loadMoreSingles} disabled={isLoading}>
            Load More
          </Button>
        </div>
      )}
    </>
  );
};

export default SinglesTable;
