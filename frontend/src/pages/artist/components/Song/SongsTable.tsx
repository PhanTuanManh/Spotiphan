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
import { ISong, Song } from "@/types";
import { Archive, PackageOpen, RefreshCcw, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import UpdateSongDialog from "./UpdateSongDialog";

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

const SongsTable = () => {
  const { user_id } = useAuthStore();
  const artistId = user_id;
  const {
    songsByArtist,
    isLoading,
    error,
    fetchSongsByArtist,
    deleteSongbyArtist,
    toggleArchiveSong,
    page,
    hasMore,
  } = useSongStore();

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState<"all" | "album" | "single">(
    "all"
  );
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const [selectedSongDelete, setSelectedSongDelete] = useState<string | null>(
    null
  );
  const [selectedSongArchive, setSelectedSongArchive] = useState<string | null>(
    null
  );

  useEffect(() => {
    if (!artistId) return;
    console.log("Fetching with type:", selectedType);
    fetchSongsByArtist(artistId, 1, debouncedSearchTerm, selectedType);
  }, [artistId, fetchSongsByArtist, debouncedSearchTerm, selectedType]);

  const loadMoreSongs = () => {
    if (hasMore) {
      fetchSongsByArtist(artistId, page + 1, searchTerm, selectedType); // ✅ Thêm `selectedType`
    }
  };

  if (
    !artistId ||
    (isLoading &&
      (!songsByArtist[artistId] || songsByArtist[artistId].length === 0))
  ) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-zinc-400">Loading songs...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-red-400">{error}</div>
      </div>
    );
  }

  const filteredSongs =
    songsByArtist[artistId]
      ?.filter((song: ISong) =>
        removeDiacritics(song.title.toLowerCase()).includes(
          removeDiacritics(debouncedSearchTerm.toLowerCase())
        )
      )
      ?.filter((song: ISong) => {
        if (selectedType === "album")
          return song.albumId && song.albumId.length > 0;
        if (selectedType === "single") return song.isSingle === true; // ✅ Sửa điều kiện lọc `isSingle: true`
        return true; // Nếu là "all", không lọc
      }) || [];

  console.log("filteredSongs:", filteredSongs);
  return (
    <>
      {/* Modal Confirm Archive & Delete */}
      {selectedSongDelete && (
        <ModalConfirm
          title="Delete Song"
          message="Are you sure you want to delete this song? This action cannot be undone."
          onConfirm={() => {
            deleteSongbyArtist(selectedSongDelete);
            setSelectedSongDelete(null);
          }}
          onCancel={() => setSelectedSongDelete(null)}
        />
      )}
      {selectedSongArchive && (
        <ModalConfirm
          title="Archive Song"
          message="Are you sure you want to archive this song? This action cannot be undone."
          onConfirm={() => {
            toggleArchiveSong(selectedSongArchive);
            setSelectedSongArchive(null);
          }}
          onCancel={() => setSelectedSongArchive(null)}
        />
      )}

      {/* Search */}
      <div className="mb-4 flex justify-between items-center">
        <input
          type="text"
          placeholder="Search song or singles..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full p-2 border border-zinc-800 rounded bg-zinc-900 text-zinc-100"
        />
        <select
          value={selectedType}
          onChange={(e) =>
            setSelectedType(e.target.value as "all" | "album" | "single")
          }
          className="p-2 border border-zinc-800 rounded bg-zinc-900 text-zinc-100">
          <option value="all">All</option>
          <option value="album">Album</option>
          <option value="single">Singles</option>
        </select>
        <Button
          variant="outline"
          className="ml-4"
          onClick={() =>
            fetchSongsByArtist(artistId, 1, searchTerm, selectedType)
          }
          disabled={isLoading}>
          <RefreshCcw
            className={`h-5 w-5 ${isLoading ? "animate-spin" : ""}`}
          />
        </Button>
      </div>

      {/* Songs Table */}
      <Table>
        <>
          <TableHeader>
            <TableRow className="hover:bg-zinc-800/50">
              <TableHead className="w-[50px]"></TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Linked</TableHead>
              <TableHead>Duration</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {filteredSongs.map((song: ISong) => (
              <TableRow key={song._id} className="hover:bg-zinc-800/50">
                <TableCell>
                  <img
                    src={song.imageUrl}
                    alt={song.title}
                    className="size-10 rounded object-cover"
                  />
                </TableCell>
                <TableCell className="font-medium">{song.title}</TableCell>
                <TableCell>
                  {song.isSingle
                    ? "Single/Eps"
                    : song.albumId?.title || "Unknown Album"}
                </TableCell>
                <TableCell>{song.likes.length}</TableCell>
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
                    {song.status !== "archived" ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleArchiveSong(song._id)}
                        className="text-gray-400 hover:text-gray-300 hover:bg-gray-400/10">
                        <Archive className="h-4 w-4" />
                      </Button>
                    ) : (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleArchiveSong(song._id)}
                        className="text-gray-400 hover:text-gray-300 hover:bg-gray-400/10">
                        <PackageOpen className="h-4 w-4" />
                      </Button>
                    )}
                    <UpdateSongDialog song={song} />
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-400 hover:text-red-300 hover:bg-red-400/10"
                      onClick={() => setSelectedSongDelete(song._id)}>
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </>
      </Table>

      {/* Load More */}
      {hasMore && (
        <div className="flex justify-center mt-4">
          <Button onClick={loadMoreSongs} disabled={isLoading}>
            Load More
          </Button>
        </div>
      )}
    </>
  );
};

export default SongsTable;
