// frontend/src/pages/playlist/PlaylistPage.tsx

import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { axiosInstance } from "@/lib/axios";
import { useMusicStore } from "@/stores/useMusicStore";
import { usePlayerStore } from "@/stores/usePlayerStore";
import { Clock, Pause, Play, Plus, Heart } from "lucide-react";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useAuth } from "@clerk/clerk-react";
import { toast } from "react-hot-toast";

export const formatDuration = (seconds: number) => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
};

const PlaylistPage = () => {
  const { playlistId } = useParams();
  const {
    fetchPlaylistById,
    currentPlaylist,
    isLoading,
    toggleLikeSong,
    likedSongs,
  } = useMusicStore();
  const { currentSong, isPlaying, playPlaylist, togglePlay } = usePlayerStore();
  const [artistNames, setArtistNames] = useState<{ [key: string]: string }>({});
  const [playlistCreator, setPlaylistCreator] = useState<{
    fullName: string;
  } | null>(null);
  const { userId } = useAuth();

  useEffect(() => {
    if (playlistId) fetchPlaylistById(playlistId);
  }, [fetchPlaylistById, playlistId]);

  // Fetch artist names based on artist IDs
  useEffect(() => {
    if (currentPlaylist && currentPlaylist.songs.length > 0) {
      const fetchArtistNames = async () => {
        const names: { [key: string]: string } = {};
        for (const song of currentPlaylist.songs) {
          try {
            const artistId = song.artist; // Lấy artistId từ bài hát
            const artistResponse = await axiosInstance.get(
              `/users/${artistId}`
            );
            names[artistId] = artistResponse.data.fullName; // Lấy tên nghệ sĩ
          } catch (error) {
            console.error("Failed to fetch artist name:", error);
            names[song.artist] = "Unknown Artist"; // Fallback nếu không fetch được
          }
        }
        setArtistNames(names);
      };

      fetchArtistNames();
    }
  }, [currentPlaylist]);

  // Fetch playlist creator's fullName
  useEffect(() => {
    if (currentPlaylist?.userId) {
      const fetchPlaylistCreator = async () => {
        try {
          const response = await axiosInstance.get(
            `/users/${currentPlaylist.userId}`
          );
          setPlaylistCreator({ fullName: response.data.fullName });
        } catch (error) {
          console.error("Failed to fetch playlist creator:", error);
          setPlaylistCreator({ fullName: "Unknown User" });
        }
      };

      fetchPlaylistCreator();
    }
  }, [currentPlaylist]);

  console.log("currentPlaylist", currentPlaylist);

  if (isLoading) return null;

  const handlePlayPlaylist = () => {
    if (!currentPlaylist) return;

    const isCurrentPlaylistPlaying = currentPlaylist?.songs.some(
      (song) => song._id === currentSong?._id
    );
    if (isCurrentPlaylistPlaying) togglePlay();
    else {
      // Start playing the playlist from the beginning
      playPlaylist(currentPlaylist?.songs, 0);
    }
  };

  const handlePlaySong = (index: number) => {
    if (!currentPlaylist) return;

    playPlaylist(currentPlaylist?.songs, index);
  };

  return (
    <div className="h-full">
      <ScrollArea className="h-full rounded-md">
        {/* Main Content */}
        <div className="relative min-h-full">
          {/* bg gradient */}
          <div
            className="absolute inset-0 bg-gradient-to-b from-[#5038a0]/80 via-zinc-900/80
					 to-zinc-900 pointer-events-none"
            aria-hidden="true"
          />

          {/* Content */}
          <div className="relative z-10">
            <div className="flex p-6 gap-6 pb-8">
              <img
                src={currentPlaylist?.imageUrl}
                alt={currentPlaylist?.name}
                className="w-[240px] h-[240px] shadow-xl rounded"
              />
              <div className="flex flex-col justify-end">
                <p className="text-sm font-medium">Playlist</p>
                <h1 className="text-7xl font-bold my-4">
                  {currentPlaylist?.name}
                </h1>
                <div className="flex items-center gap-2 text-sm text-zinc-100">
                  <span className="font-medium text-white">
                    {playlistCreator?.fullName || "Loading..."}
                  </span>
                  <span>• {currentPlaylist?.songs.length} songs</span>
                </div>
              </div>
            </div>

            {/* play button */}
            <div className="px-6 pb-4 flex items-center gap-6">
              <Button
                onClick={handlePlayPlaylist}
                size="icon"
                className="w-14 h-14 rounded-full bg-green-500 hover:bg-green-400 
                hover:scale-105 transition-all">
                {isPlaying &&
                currentPlaylist?.songs.some(
                  (song) => song._id === currentSong?._id
                ) ? (
                  <Pause className="h-7 w-7 text-black" />
                ) : (
                  <Play className="h-7 w-7 text-black" />
                )}
              </Button>
            </div>

            {/* Table Section */}
            <div className="bg-black/20 backdrop-blur-sm">
              {/* table header */}
              <div
                className="grid grid-cols-[16px_4fr_2fr_1fr] gap-x-4 px-10 py-4 text-sm 
            text-zinc-400 border-b border-white/5">
                <div>#</div>
                <div>Title</div>
                <div>Released Date</div>
                <div>
                  <Clock className="h-4 w-4" />
                </div>
                <div></div>
              </div>

              {/* songs list */}
              <div className="px-6">
                <div className="space-y-2 py-4">
                  {currentPlaylist?.songs.map((song, index) => {
                    const isCurrentSong = currentSong?._id === song._id;
                    const isLiked = likedSongs.includes(song._id);

                    return (
                      <div
                        key={song._id}
                        onClick={() => handlePlaySong(index)}
                        className={`grid grid-cols-[16px_4fr_2fr_1fr] gap-4 px-4 py-2 text-sm 
                      text-zinc-400 hover:bg-white/5 rounded-md group cursor-pointer
                      `}>
                        <div className="flex items-center justify-center">
                          {isCurrentSong && isPlaying ? (
                            <div className="size-4 text-green-500">♫</div>
                          ) : (
                            <span className="group-hover:hidden">
                              {index + 1}
                            </span>
                          )}
                          {!isCurrentSong && (
                            <Play className="h-4 w-4 hidden group-hover:block" />
                          )}
                        </div>

                        <div className="flex items-center gap-3">
                          <img
                            src={song.imageUrl}
                            alt={song.title}
                            className="size-10"
                          />

                          <div>
                            <div className={`font-medium text-white`}>
                              {song.title}
                            </div>
                            <div>
                              {artistNames[song.artist] || "Loading..."}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center">
                          {song.createdAt.split("T")[0]}
                        </div>
                        <div className="flex items-center gap-6">
                          <div>{formatDuration(song.duration)}</div>
                          <Button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (userId) {
                                toggleLikeSong(song._id, userId);
                              } else {
                                toast.error(
                                  "You must be logged in to like a song"
                                );
                              }
                            }}
                            size="sm"
                            variant="ghost"
                            className="p-2 hover:bg-emerald-500/10">
                            {isLiked ? (
                              <Heart className="h-4 w-4 text-emerald-500 fill-emerald-500" />
                            ) : (
                              <Plus className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
};

export default PlaylistPage;
