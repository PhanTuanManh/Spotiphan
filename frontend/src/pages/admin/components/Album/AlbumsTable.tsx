// src/pages/admin/components/AlbumsTable.tsx

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
import { useAlbumStore } from "@/stores/useAlbumStore";
import { Calendar, Music, Trash2, CheckCircle, XCircle, RefreshCcw, Archive, PackageOpen } from "lucide-react";
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

const AlbumsTable = () => {
  const { albums, fetchAllAlbumsAdmin, approveAlbum, rejectAlbum, unarchiveAlbum, archiveAlbum, deleteAlbum, isLoading } = useAlbumStore();
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const [selectedAlbumDelete, setSelectedAlbumDelete] = useState<string | null>(null);
  const [selectedAlbumArchive, setSelectedAlbumArchive] = useState<string | null>(null);
  
  useEffect(() => {
    fetchAllAlbumsAdmin();
  }, [fetchAllAlbumsAdmin]);

  const handleApprove = async (albumId: string) => {
    try {
      await approveAlbum(albumId);
      toast.success("Album approved successfully");
    } catch {
      toast.error("Failed to approve album");
    }
  };

  const handleReject = async (albumId: string) => {
    try {
      await rejectAlbum(albumId);
      toast.success("Album rejected successfully");
    } catch {
      toast.error("Failed to reject album");
    }
  };

  const handleDelete = async (albumId: string) => {
    try {
      await deleteAlbum(albumId);
      toast.success("Album deleted successfully");
    } catch {
      toast.error("Failed to delete album");
    }
  };
  const handleArchive = async (albumId: string) => {
    try {
      await archiveAlbum(albumId);
      toast.success("Album archived successfully");
    } catch {
      toast.error("Failed to archive album");
    }
  };

  const handleUnarchive = async (albumId: string) => {
    try {
      await unarchiveAlbum(albumId);
      toast.success("Album archived successfully");
    } catch {
      toast.error("Failed to archive album");
    }
  };

  const filteredAlbums = Array.isArray(albums) ? albums.filter((album) => {
    const normalizedSearchTerm = removeDiacritics(debouncedSearchTerm.toLowerCase());
    const normalizedTitle = removeDiacritics(album.title.toLowerCase());
    const normalizedArtist = removeDiacritics(
      (typeof album.artist === "object" && album.artist !== null ? album.artist.fullName : "").toLowerCase()
    );
    return (
      normalizedTitle.includes(normalizedSearchTerm) ||
      normalizedArtist.includes(normalizedSearchTerm)
    );
  }): [];

  return (
    <>
                {/* Modal Confirm Delete */}
      {selectedAlbumDelete && (
        <ModalConfirm
          title="Delete Album"
          message="Are you sure you want to delete this album? This action cannot be undone."
          onConfirm={() => {
            handleDelete(selectedAlbumDelete);
            setSelectedAlbumDelete(null);
          }}
          onCancel={() => setSelectedAlbumDelete(null)}
        />
      )}
      {selectedAlbumArchive && (
        <ModalConfirm
          title="Archive Album"
          message="Are you sure you want to archive this album? This action cannot be undone."
          onConfirm={() => {
            handleArchive(selectedAlbumArchive);
            setSelectedAlbumArchive(null);
          }}
          onCancel={() => setSelectedAlbumArchive(null)}
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
          onClick={fetchAllAlbumsAdmin}
          disabled={isLoading}
        >
          <RefreshCcw className={`h-5 w-5 ${isLoading ? "animate-spin" : ""}`} />
        </Button>
      </div>

      {/* Albums Table */}
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-zinc-800/50">
            <TableHead className="w-[50px]"></TableHead>
            <TableHead>Title</TableHead>
            <TableHead>Artist</TableHead>
            <TableHead>Release Year</TableHead>
            <TableHead>Songs</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredAlbums.map((album) => (
            <TableRow key={album._id} className="hover:bg-zinc-800/50">
              <TableCell>
                <img
                  src={album.imageUrl}
                  alt={album.title}
                  className="w-10 h-10 rounded object-cover"
                />
              </TableCell>
              <TableCell className="font-medium">{album.title}</TableCell>
              <TableCell>
  {typeof album.artist === "object" && album.artist !== null ? album.artist.fullName : "Unknown"}
</TableCell>
              <TableCell>
                <span className="inline-flex items-center gap-1 text-zinc-400">
                  <Calendar className="h-4 w-4" />
                  {album.releaseYear}
                </span>
              </TableCell>
              <TableCell>
                <span className="inline-flex items-center gap-1 text-zinc-400">
                  <Music className="h-4 w-4" />
                  {album.songs.length} songs
                </span>
              </TableCell>
              <TableCell>
                <span
                  className={`px-2 py-1 text-xs rounded-full ${
                    album.status === "pending"
                      ? "bg-yellow-500 text-black"
                      : album.status === "approved"
                      ? "bg-green-500 text-white"
                      : album.status === "rejected"
                      ? "bg-red-500 text-white"
                      : "bg-gray-500 text-white"
                  }`}
                >
                  {album.status}
                </span>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex gap-2 justify-end">
                  {album.status === "pending" && (
                    <>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleApprove(album._id)}
                        className="text-green-400 hover:text-green-300 hover:bg-green-400/10"
                      >
                        <CheckCircle className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleReject(album._id)}
                        className="text-red-400 hover:text-red-300 hover:bg-red-400/10"
                      >
                        <XCircle className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                 
                  {album.status !== "archived" ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedAlbumArchive(album._id)}
                      className="text-gray-400 hover:text-gray-300 hover:bg-gray-400/10"
                    >
                      <Archive className="h-4 w-4" />
                    </Button>
                  ) : (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleUnarchive(album._id)}
                      className="text-gray-400 hover:text-gray-300 hover:bg-gray-400/10"
                    >
                      <PackageOpen className="h-4 w-4" />
                    </Button>
                  )}
        <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedAlbumDelete(album._id)}
                    className="text-red-400 hover:text-red-300 hover:bg-red-400/10"
                  >
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

export default AlbumsTable;
