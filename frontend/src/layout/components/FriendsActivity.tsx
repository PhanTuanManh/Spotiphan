// src/layout/components/FriendsActivity.tsx

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { axiosInstance } from "@/lib/axios";
import { useChatStore } from "@/stores/useChatStore";
import { useUser } from "@clerk/clerk-react";
import { HeadphonesIcon, Music, Users } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

const FriendsActivity = () => {
  const { users, fetchUsers, onlineUsers, userActivities, initSocket } =
    useChatStore();
  const { user } = useUser();
  const [artistNames, setArtistNames] = useState<Record<string, string>>({});

  const fetchArtistNames = useCallback(async (artistIds: string[]) => {
    try {
      const response = await axiosInstance.post("/users/batch", {
        ids: artistIds,
      });
      const names = response.data.reduce(
        (
          acc: Record<string, string>,
          artist: { _id: string; fullName: string }
        ) => {
          acc[artist._id] = artist.fullName;
          return acc;
        },
        {}
      );
      setArtistNames((prev) => ({ ...prev, ...names }));
    } catch (error) {
      console.error("Failed to fetch artist names:", error);
      // Set default names for failed fetches
      artistIds.forEach((id) => {
        setArtistNames((prev) => ({ ...prev, [id]: "Unknown Artist" }));
      });
    }
  }, []);

  useEffect(() => {
    // Lấy tất cả artist IDs từ các activity
    const artistIds = Array.from(userActivities.values())
      .map((activity) => {
        if (activity.startsWith("Playing")) {
          const parts = activity.split(" by ");
          if (parts.length > 1) return parts[1]; // Phần sau "by" là artistId
        }
        return null;
      })
      .filter(Boolean) as string[];

    // Lọc ra những artistId chưa có trong artistNames
    const newArtistIds = artistIds.filter((id) => !artistNames[id]);

    if (newArtistIds.length > 0) {
      fetchArtistNames(newArtistIds);
    }
  }, [userActivities, artistNames, fetchArtistNames]);

  useEffect(() => {
    if (user) {
      fetchUsers();
      initSocket(user.id);
    }
  }, [fetchUsers, user, initSocket]);

  return (
    <div className="h-full bg-zinc-900 rounded-lg flex flex-col">
      <div className="p-4 flex justify-between items-center border-b border-zinc-800">
        <div className="flex items-center gap-2">
          <Users className="size-5 shrink-0" />
          <h2 className="font-semibold">What they're listening to</h2>
        </div>
      </div>

      {!user && <LoginPrompt />}

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          {users.map((user) => {
            const activity = userActivities.get(user.clerkId);
            const isOnline = onlineUsers.has(user.clerkId);
            const isPlaying = activity && activity.startsWith("Playing");
            console.log(`User ${user.fullName} activity:`, activity); // Debug

            return (
              <div
                key={user._id}
                className="cursor-pointer hover:bg-zinc-800/50 p-3 rounded-md transition-colors group">
                <div className="flex items-start gap-3">
                  <div className="relative">
                    <Avatar className="size-10 border border-zinc-800">
                      <AvatarImage src={user.imageUrl} alt={user.fullName} />
                      <AvatarFallback>{user.fullName}</AvatarFallback>
                    </Avatar>
                    <div
                      className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-zinc-900 
                        ${isOnline ? "bg-green-500" : "bg-zinc-500"}`}
                      aria-hidden="true"
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm text-white">
                        {user.fullName}
                      </span>
                      {isPlaying && (
                        <Music className="size-3.5 text-emerald-400 shrink-0" />
                      )}
                    </div>
                    {isPlaying ? (
                      <div className="mt-1">
                        <div className="mt-1 text-sm text-white font-medium truncate">
                          {activity?.replace("Playing ", "").split(" by ")[0] ||
                            "Unknown song"}
                        </div>
                        <div className="text-xs text-zinc-400 truncate">
                          {artistNames[activity.split(" by ")[1]] ||
                            "Unknown artist"}
                        </div>
                      </div>
                    ) : (
                      <div className="mt-1 text-xs text-zinc-400">
                        {isOnline ? "Online" : "Offline"}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
};
export default FriendsActivity;

const LoginPrompt = () => (
  <div className="h-full flex flex-col items-center justify-center p-6 text-center space-y-4">
    <div className="relative">
      <div
        className="absolute -inset-1 bg-gradient-to-r from-emerald-500 to-sky-500 rounded-full blur-lg
       opacity-75 animate-pulse"
        aria-hidden="true"
      />
      <div className="relative bg-zinc-900 rounded-full p-4">
        <HeadphonesIcon className="size-8 text-emerald-400" />
      </div>
    </div>

    <div className="space-y-2 max-w-[250px]">
      <h3 className="text-lg font-semibold text-white">
        See What Friends Are Playing
      </h3>
      <p className="text-sm text-zinc-400">
        Login to discover what music your friends are enjoying right now
      </p>
    </div>
  </div>
);
