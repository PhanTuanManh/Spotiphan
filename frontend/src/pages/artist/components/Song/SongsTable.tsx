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
import { Calendar, Trash2, Edit, Archive, PackageOpen } from "lucide-react";
import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { useAuthStore } from "@/stores/useAuthStore";
import { ISong } from "@/types";

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
    deleteSong,
    updateSong,
    archiveSingle,
    unarchiveSingle,
    page,
    hasMore,
  } = useSongStore();

  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const [selectedSongDelete, setSelectedSongDelete] = useState<string | null>(
    null
  );
  const [selectedSongArchive, setSelectedSongArchive] = useState<string | null>(
    null
  );

  useEffect(() => {
    if (
      artistId &&
      (!songsByArtist[artistId] || songsByArtist[artistId].length === 0)
    ) {
      fetchSongsByArtist(artistId, 1, searchTerm); // ✅ Fetch lần đầu tiên
    }
  }, [artistId, fetchSongsByArtist, searchTerm]);

  const loadMoreSongs = () => {
    if (hasMore) {
      fetchSongsByArtist(artistId, page + 1, searchTerm); // ✅ Load thêm dữ liệu khi có
    }
  };

  if (
    isLoading &&
    (!songsByArtist[artistId] || songsByArtist[artistId].length === 0)
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
    songsByArtist[artistId]?.filter((song: ISong) =>
      removeDiacritics(song.title.toLowerCase()).includes(
        removeDiacritics(debouncedSearchTerm.toLowerCase())
      )
    ) || [];

  return (
    <>
      {/* Modal Confirm Archive & Delete */}
      {selectedSongDelete && (
        <ModalConfirm
          title="Delete Song"
          message="Are you sure you want to delete this song? This action cannot be undone."
          onConfirm={() => {
            deleteSong(selectedSongDelete);
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
            archiveSingle(selectedSongArchive);
            setSelectedSongArchive(null);
          }}
          onCancel={() => setSelectedSongArchive(null)}
        />
      )}

      {/* Search */}
      <div className="mb-4 flex gap-2">
        <input
          type="text"
          placeholder="Tìm bài hát..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1 p-2 border border-zinc-800 rounded bg-zinc-900 text-zinc-100"
        />
      </div>

      {/* Songs Table */}
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-zinc-800/50">
            <TableHead className="w-[50px]">Ảnh</TableHead>
            <TableHead>Tiêu đề</TableHead>
            <TableHead>Loại</TableHead>
            <TableHead>Lượt thích</TableHead>
            <TableHead>Ngày phát hành</TableHead>
            <TableHead className="text-right">Hành động</TableHead>
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
                  ? "Single"
                  : song.albumId?.title || "Unknown Album"}
              </TableCell>
              <TableCell>{song.likes.length}</TableCell>
              <TableCell>
                <span className="inline-flex items-center gap-1 text-zinc-400">
                  <Calendar className="h-4 w-4" />
                  {song.createdAt.split("T")[0]}
                </span>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex gap-2 justify-end">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-yellow-400 hover:text-yellow-300 hover:bg-yellow-400/10"
                    onClick={() => updateSong(song._id)}>
                    <Edit className="size-4" />
                  </Button>
                  {song.status !== "archived" ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-blue-400 hover:text-blue-300 hover:bg-blue-400/10"
                      onClick={() => setSelectedSongArchive(song._id)}>
                      <Archive className="size-4" />
                    </Button>
                  ) : (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-gray-400 hover:text-gray-300 hover:bg-gray-400/10"
                      onClick={() => unarchiveSingle(song._id)}>
                      <PackageOpen className="size-4" />
                    </Button>
                  )}
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
