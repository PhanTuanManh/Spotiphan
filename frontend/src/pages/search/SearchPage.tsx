// frontend/src/pages/search/SearchPage.tsx
import { FollowButton } from "@/components/FollowButton";
import Topbar from "@/components/Topbar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { axiosInstance as axios } from "@/lib/axios";
import { useAuthStore } from "@/stores/useAuthStore";
import { useMusicStore } from "@/stores/useMusicStore";
import { usePlayerStore } from "@/stores/usePlayerStore";
import { IAlbum, IPlaylist, ISong, IUser } from "@/types";
import { useAuth } from "@clerk/clerk-react";
import { Heart, Loader, Pause, Play } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { useLocation, useNavigate } from "react-router-dom";

export const formatDuration = (seconds: number) => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
};

interface SearchResults {
  songs?: ISong[];
  albums?: IAlbum[];
  playlists?: IPlaylist[];
  users?: IUser[];
}

const SearchPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const query = new URLSearchParams(location.search).get("q") || "";
  const [searchResults, setSearchResults] = useState<SearchResults>({});
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuthStore();
  const { userId } = useAuth();
  const { likedSongs, toggleLikeSong } = useMusicStore();
  const {
    currentSong,
    isPlaying,
    playSong,
    playAlbum,
    playPlaylist,
    togglePlay,
  } = usePlayerStore();

  useEffect(() => {
    if (query) {
      const fetchSearchResults = async () => {
        setIsLoading(true);
        try {
          const { data } = await axios.get(
            `/search?q=${encodeURIComponent(query)}`
          );
          setSearchResults(data.results);
        } catch (error) {
          console.error("Search error:", error);
        } finally {
          setIsLoading(false);
        }
      };
      fetchSearchResults();
    }
  }, [query]);

  const renderUserRole = (role: string) => {
    switch (role) {
      case "artist":
        return <span className="text-sm text-green-500">Artist</span>;
      case "admin":
        return <span className="text-sm text-primary">By Spotiphan</span>;
      default:
        return <span className="text-sm text-gray-400">Profile</span>;
    }
  };

  const handlePlaySong = (song: ISong) => {
    playSong(song);
  };

  const handlePlayAlbum = (album: IAlbum) => {
    playAlbum(album.songs, 0);
  };

  const handlePlayPlaylist = (playlist: IPlaylist) => {
    playPlaylist(playlist.songs, 0);
  };

  const handleSongClick = (songId: string) => {
    navigate(`/single/${songId}`);
  };

  const handleAlbumClick = (albumId: string) => {
    navigate(`/albums/${albumId}`);
  };

  const handlePlaylistClick = (playlistId: string) => {
    navigate(`/playlists/${playlistId}`);
  };

  const isCurrentSongPlaying = (songId: string) => {
    return currentSong?._id === songId && isPlaying;
  };

  return (
    <main className="rounded-md overflow-hidden h-full bg-gradient-to-b from-zinc-800 to-zinc-900">
      <Topbar />
      <ScrollArea className="h-[calc(100vh-180px)]">
        <div className="p-4 sm:p-6">
          <h1 className="text-2xl sm:text-3xl font-bold mb-6">
            Search results for "{query}"
          </h1>

          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <Loader className="size-6 text-[#FF6337] animate-spin" />
            </div>
          ) : (
            <div className="space-y-8">
              {/* Songs Section */}
              {searchResults.songs?.length > 0 && (
                <div>
                  <h2 className="text-xl font-bold mb-4">Songs</h2>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                    {searchResults.songs.map((song) => {
                      const isLiked = likedSongs.includes(song.id);
                      const isCurrentPlaying = isCurrentSongPlaying(song.id);

                      return (
                        <Card
                          key={song.id}
                          onClick={() => handleSongClick(song.id)}
                          className="bg-transparent p-3 border-none hover:bg-zinc-800 transition-colors group relative cursor-pointer">
                          <CardHeader className="p-0">
                            <img
                              src={song.imageUrl}
                              alt={song.title}
                              className="w-full aspect-square object-cover rounded-t-md"
                            />
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handlePlaySong(song);
                              }}
                              className="absolute top-3 right-4 size-10 bg-green-500 rounded-full 
                              flex items-center justify-center opacity-0 group-hover:opacity-100 
                              transition-opacity shadow-lg hover:scale-105">
                              {isCurrentPlaying ? (
                                <Pause className="size-4 fill-black" />
                              ) : (
                                <Play className="size-4 fill-black" />
                              )}
                            </button>
                          </CardHeader>
                          <CardContent className="p-0 pt-3">
                            <h3 className="font-medium truncate">
                              {song.title}
                            </h3>
                            <p className="text-sm text-gray-400 truncate">
                              {song.artist.fullName}
                            </p>
                            <div className="flex justify-between items-center mt-2">
                              <span className="text-xs text-gray-400">
                                {formatDuration(song.duration)}
                              </span>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (userId) {
                                    toggleLikeSong(song.id, userId);
                                  } else {
                                    toast.error(
                                      "You must be logged in to like a song"
                                    );
                                  }
                                }}
                                className="text-gray-400 hover:text-emerald-500">
                                <Heart
                                  className={`size-4 ${
                                    isLiked
                                      ? "fill-emerald-500 text-emerald-500"
                                      : "fill-transparent"
                                  }`}
                                />
                              </button>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Albums Section */}
              {searchResults.albums?.length > 0 && (
                <div>
                  <h2 className="text-xl font-bold mb-4">Albums</h2>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                    {searchResults.albums.map((album) => (
                      <Card
                        key={album.id}
                        onClick={() => handleAlbumClick(album.id)}
                        className="bg-transparent p-3 border-none hover:bg-zinc-800 transition-colors group relative cursor-pointer">
                        <CardHeader className="p-0">
                          <img
                            src={album.imageUrl}
                            alt={album.title}
                            className="w-full aspect-square object-cover rounded-t-md"
                          />
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handlePlayAlbum(album);
                            }}
                            className="absolute top-3 right-4 size-10 bg-green-500 rounded-full 
                            flex items-center justify-center opacity-0 group-hover:opacity-100 
                            transition-opacity shadow-lg hover:scale-105">
                            <Play className="size-4 fill-black" />
                          </button>
                        </CardHeader>
                        <CardContent className="p-0 pt-3">
                          <h3 className="font-medium truncate">
                            {album.title}
                          </h3>
                          <p className="text-sm text-gray-400 truncate">
                            {album.artist.fullName}
                          </p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {/* Playlists Section */}
              {searchResults.playlists?.length > 0 && (
                <div>
                  <h2 className="text-xl font-bold mb-4">Playlists</h2>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                    {searchResults.playlists.map((playlist) => (
                      <Card
                        key={playlist.id}
                        onClick={() => handlePlaylistClick(playlist.id)}
                        className="bg-transparent p-3 border-none hover:bg-zinc-800 transition-colors group relative cursor-pointer">
                        <CardHeader className="p-0">
                          <img
                            src={playlist.imageUrl}
                            alt={playlist.name}
                            className="w-full aspect-square object-cover rounded-t-md"
                          />
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handlePlayPlaylist(playlist);
                            }}
                            className="absolute top-3 right-4 size-10 bg-green-500 rounded-full 
                            flex items-center justify-center opacity-0 group-hover:opacity-100 
                            transition-opacity shadow-lg hover:scale-105">
                            <Play className="size-4 fill-black" />
                          </button>
                        </CardHeader>
                        <CardContent className="p-0 pt-3">
                          <h3 className="font-medium truncate">
                            {playlist.name}
                          </h3>
                          <p className="text-sm text-gray-400">
                            {playlist.userId?.fullName || "Unknown creator"}
                          </p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {/* Users Section */}
              {searchResults.users?.length > 0 && (
                <div>
                  <h2 className="text-xl font-bold mb-4">People</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                    {searchResults.users.map((user) => (
                      <Card
                        key={user.id}
                        className="bg-zinc-800 border-none hover:bg-zinc-700 transition-colors h-full">
                        <CardContent className="p-4 flex flex-col gap-4 h-full">
                          <Avatar className="w-full h-auto flex-shrink-0">
                            <AvatarImage src={user.imageUrl} />
                            <AvatarFallback>
                              {user.name.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="h-full">
                            <div>
                              <h3 className="font-medium truncate">
                                {user.name}
                              </h3>
                              {renderUserRole(user.role)}
                            </div>
                            {user.role !== "admin" && (
                              <div className="mt-2">
                                <FollowButton
                                  userId={user._id}
                                  initialIsFollowing={user.followers?.some(
                                    (follower) =>
                                      follower._id === currentUser?._id
                                  )}
                                  followersCount={user.followers?.length || 0}
                                />
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {Object.keys(searchResults).length === 0 && !isLoading && (
                <div className="text-center py-12">
                  <p className="text-gray-400">
                    No results found for "{query}"
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </ScrollArea>
    </main>
  );
};

export default SearchPage;
