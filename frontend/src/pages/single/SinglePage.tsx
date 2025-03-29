// frontend/src/pages/single/SinglePage.tsx
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { axiosInstance } from "@/lib/axios";
import { useMusicStore } from "@/stores/useMusicStore";
import { usePlayerStore } from "@/stores/usePlayerStore";
import { Clock, Pause, Play, Plus, Heart } from "lucide-react";
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@clerk/clerk-react";
import { toast } from "react-hot-toast";

export const formatDuration = (seconds: number) => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
};

const SinglePage = () => {
  const { songId } = useParams();
  const navigate = useNavigate();
  const {
    fetchSongById,
    currentSong: song,
    isLoading,
    toggleLikeSong,
    likedSongs,
  } = useMusicStore();
  const { currentSong, isPlaying, setCurrentSong, togglePlay } =
    usePlayerStore();
  const [artistName, setArtistName] = useState<string>("");
  const { userId } = useAuth();

  useEffect(() => {
    if (songId) fetchSongById(songId);
  }, [fetchSongById, songId]);

  // Fetch artist name
  useEffect(() => {
    if (song) {
      const fetchArtistName = async () => {
        try {
          const artistId =
            typeof song.artist === "object" ? song.artist._id : song.artist;
          const response = await axiosInstance.get(`/users/${artistId}`);
          setArtistName(response.data.fullName);
        } catch (error) {
          console.error("Failed to fetch artist name:", error);
          setArtistName("Unknown Artist");
        }
      };

      fetchArtistName();
    }
  }, [song]);

  if (isLoading || !song) return null;

  const handlePlaySong = () => {
    if (currentSong?._id === song._id) {
      togglePlay();
    } else {
      setCurrentSong(song);
    }
  };

  const isLiked = likedSongs.includes(song._id);

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
                src={song.imageUrl}
                alt={song.title}
                className="w-[240px] h-[240px] shadow-xl rounded"
              />
              <div className="flex flex-col justify-end">
                <p className="text-sm font-medium">Single</p>
                <h1 className="text-7xl font-bold my-4">{song.title}</h1>
                <div className="flex items-center gap-2 text-sm text-zinc-100">
                  <span className="font-medium text-white">
                    {artistName || "Loading..."}
                  </span>
                  <span>• {formatDuration(song.duration)}</span>
                </div>
              </div>
            </div>

            {/* play button */}
            <div className="px-6 pb-4 flex items-center gap-6">
              <Button
                onClick={handlePlaySong}
                size="icon"
                className="w-14 h-14 rounded-full bg-green-500 hover:bg-green-400 
                hover:scale-105 transition-all">
                {isPlaying && currentSong?._id === song._id ? (
                  <Pause className="h-7 w-7 text-black" />
                ) : (
                  <Play className="h-7 w-7 text-black" />
                )}
              </Button>
              <Button
                onClick={() => {
                  if (userId) {
                    toggleLikeSong(song._id, userId);
                  } else {
                    toast.error("You must be logged in to like a song");
                  }
                }}
                size="sm"
                variant="ghost"
                className="p-2 hover:bg-emerald-500/10">
                {isLiked ? (
                  <Heart className="h-6 w-6 text-emerald-500 fill-emerald-500" />
                ) : (
                  <Plus className="h-6 w-6" />
                )}
              </Button>
            </div>

            {/* Song details */}
            <div className="bg-black/20 backdrop-blur-sm">
              <div
                className="grid grid-cols-[16px_4fr_2fr_1fr] gap-x-4 px-10 py-4 text-sm 
              text-zinc-400 border-b border-white/5">
                <div>#</div>
                <div>Title</div>
                <div>Released Date</div>
                <div>
                  <Clock className="h-4 w-4" />
                </div>
              </div>

              <div className="px-6">
                <div className="space-y-2 py-4">
                  <div
                    onClick={handlePlaySong}
                    className={`grid grid-cols-[16px_4fr_2fr_1fr] gap-4 px-4 py-2 text-sm 
                    text-zinc-400 hover:bg-white/5 rounded-md group cursor-pointer`}>
                    <div className="flex items-center justify-center">
                      {isPlaying && currentSong?._id === song._id ? (
                        <div className="size-4 text-green-500">♫</div>
                      ) : (
                        <span className="group-hover:hidden">1</span>
                      )}
                      {!(isPlaying && currentSong?._id === song._id) && (
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
                        <div className="font-medium text-white">
                          {song.title}
                        </div>
                        <div>{artistName || "Loading..."}</div>
                      </div>
                    </div>
                    <div className="flex items-center">
                      {song.createdAt.split("T")[0]}
                    </div>
                    <div className="flex items-center">
                      {formatDuration(song.duration)}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
};

export default SinglePage;
