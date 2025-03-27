// src/pages/search/SearchPage.tsx
import { FollowButton } from "@/components/FollowButton";
import Topbar from "@/components/Topbar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { axiosInstance as axios } from "@/lib/axios";
import { useAuthStore } from "@/stores/useAuthStore";
import { IAlbum, IPlaylist, ISong, IUser } from "@/types";
import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";

interface SearchResults {
  songs?: ISong[];
  albums?: IAlbum[];
  playlists?: IPlaylist[];
  users?: IUser[];
}

const SearchPage = () => {
  const location = useLocation();
  const query = new URLSearchParams(location.search).get("q") || "";
  const [searchResults, setSearchResults] = useState<SearchResults>({});
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuthStore();

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
        return null;
      default:
        return <span className="text-sm text-gray-400">Profile</span>;
    }
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
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
            </div>
          ) : (
            <div className="space-y-8">
              {/* Songs Section */}
              {searchResults.songs?.length > 0 && (
                <div>
                  <h2 className="text-xl font-bold mb-4">Songs</h2>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {searchResults.songs.map((song) => (
                      <Card
                        key={song.id}
                        className="bg-zinc-800 border-none hover:bg-zinc-700 transition-colors">
                        <CardHeader className="p-0">
                          <img
                            src={song.imageUrl}
                            alt={song.title}
                            className="w-full aspect-square object-cover rounded-t-md"
                          />
                        </CardHeader>
                        <CardContent className="p-3">
                          <h3 className="font-medium truncate">{song.title}</h3>
                          <p className="text-sm text-gray-400 truncate">
                            {song.artist.fullName}
                          </p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {/* Albums Section */}
              {searchResults.albums?.length > 0 && (
                <div>
                  <h2 className="text-xl font-bold mb-4">Albums</h2>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {searchResults.albums.map((album) => (
                      <Card
                        key={album.id}
                        className="bg-zinc-800 border-none hover:bg-zinc-700 transition-colors">
                        <CardHeader className="p-0">
                          <img
                            src={album.imageUrl}
                            alt={album.title}
                            className="w-full aspect-square object-cover rounded-t-md"
                          />
                        </CardHeader>
                        <CardContent className="p-3">
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
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {searchResults.playlists.map((playlist) => (
                      <Card
                        key={playlist.id}
                        className="bg-zinc-800 border-none hover:bg-zinc-700 transition-colors">
                        <CardHeader className="p-0">
                          <img
                            src={playlist.imageUrl}
                            alt={playlist.name}
                            className="w-full aspect-square object-cover rounded-t-md"
                          />
                        </CardHeader>
                        <CardContent className="p-3">
                          <h3 className="font-medium truncate">
                            {playlist.name}
                          </h3>
                          <p className="text-sm text-gray-400">
                            {playlist.songCount} songs
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
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {searchResults.users.map((user) => (
                      <Card
                        key={user.id}
                        className="bg-zinc-800 border-none hover:bg-zinc-700 transition-colors">
                        <CardContent className="p-4 flex items-center gap-4">
                          <Avatar className="h-16 w-16">
                            <AvatarImage src={user.imageUrl} />
                            <AvatarFallback>
                              {user.name.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            {user.role !== "admin" && (
                              <FollowButton
                                userId={user.id}
                                initialIsFollowing={
                                  user.followers?.includes(user?._id) || false
                                }
                                followersCount={user.followersCount}
                              />
                            )}

                            <h3 className="font-medium truncate">
                              {user.name}
                            </h3>
                            {renderUserRole(user.role)}
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
