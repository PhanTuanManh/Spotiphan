import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useSongStore } from "@/stores/useSongStore"; // Sử dụng store mới
import { Calendar, Trash2, ThumbsUp, ThumbsDown, PlusCircle } from "lucide-react";
import { useState, useEffect } from "react";
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

const SongsTable = () => {
  const { songs, isLoading, error, fetchSongs, likeSong, dislikeSong, addSongToPlaylist, removeSongFromPlaylist } = useSongStore();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPlaylistId, setSelectedPlaylistId] = useState(""); // ID playlist để thêm bài hát
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  useEffect(() => {
    fetchSongs(); // Gọi API để lấy danh sách bài hát
  }, [fetchSongs]);

  if (isLoading) {
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

  const filteredSongs = Array.isArray(songs) ? songs.filter((song) => {
    const normalizedSearchTerm = removeDiacritics(debouncedSearchTerm.toLowerCase());
    const normalizedTitle = removeDiacritics(song.title.toLowerCase());
    const normalizedArtist = removeDiacritics(
      (typeof song.artist === "object" && song.artist !== null ? song.artist.fullName : "").toLowerCase()
    );
    return (
      normalizedTitle.includes(normalizedSearchTerm) ||
      normalizedArtist.includes(normalizedSearchTerm)
    );
  }) : [];
  

  return (
    <>
      {/* Search */}
      <div className="mb-4 flex gap-2">
        <input
          type="text"
          placeholder="Tìm bài hát..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1 p-2 border border-zinc-800 rounded bg-zinc-900 text-zinc-100"
        />
        <input
          type="text"
          placeholder="Nhập ID Playlist..."
          value={selectedPlaylistId}
          onChange={(e) => setSelectedPlaylistId(e.target.value)}
          className="p-2 border border-zinc-800 rounded bg-zinc-900 text-zinc-100"
        />
      </div>

      {/* Songs Table */}
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-zinc-800/50">
            <TableHead className="w-[50px]"></TableHead>
            <TableHead>Tiêu đề</TableHead>
            <TableHead>Nghệ sĩ</TableHead>
            <TableHead>Lượt thích</TableHead>
            <TableHead>Ngày phát hành</TableHead>
            <TableHead className="text-right">Hành động</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {filteredSongs.map((song) => (
            <TableRow key={song._id} className="hover:bg-zinc-800/50">
              <TableCell>
                <img
                  src={song.imageUrl}
                  alt={song.title}
                  className="size-10 rounded object-cover"
                />
              </TableCell>
              <TableCell className="font-medium">{song.title}</TableCell>
              {typeof song.artist === "object" && song.artist !== null
    ? song.artist.fullName
    : "Unknown Artist"}
              <TableCell>{song.likes.length}</TableCell>
              <TableCell>
                <span className="inline-flex items-center gap-1 text-zinc-400">
                  <Calendar className="h-4 w-4" />
                  {song.createdAt.split("T")[0]}
                </span>
              </TableCell>

              <TableCell className="text-right">
                <div className="flex gap-2 justify-end">
                  {/* Like Song */}
                  <Button
                    variant={"ghost"}
                    size={"sm"}
                    className="text-green-400 hover:text-green-300 hover:bg-green-400/10"
                    onClick={() => likeSong(song._id)}
                  >
                    <ThumbsUp className="size-4" />
                  </Button>

                  {/* Dislike Song */}
                  <Button
                    variant={"ghost"}
                    size={"sm"}
                    className="text-yellow-400 hover:text-yellow-300 hover:bg-yellow-400/10"
                    onClick={() => dislikeSong(song._id)}
                  >
                    <ThumbsDown className="size-4" />
                  </Button>

                  {/* Add to Playlist */}
                  <Button
                    variant={"ghost"}
                    size={"sm"}
                    className="text-blue-400 hover:text-blue-300 hover:bg-blue-400/10"
                    disabled={!selectedPlaylistId}
                    onClick={() => {
                      if (selectedPlaylistId) {
                        addSongToPlaylist(song._id, selectedPlaylistId);
                      } else {
                        toast.error("Vui lòng nhập ID Playlist");
                      }
                    }}
                  >
                    <PlusCircle className="size-4" />
                  </Button>

                  {/* Delete Song */}
                  <Button
                    variant={"ghost"}
                    size={"sm"}
                    className="text-red-400 hover:text-red-300 hover:bg-red-400/10"
                    onClick={() => removeSongFromPlaylist(song._id, selectedPlaylistId)}
                    disabled={!selectedPlaylistId}
                  >
                    <Trash2 className="size-4" />
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

export default SongsTable;
