// src/components/FollowButton.tsx
import { useAuthStore } from "@/stores/useAuthStore";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { axiosInstance as axios } from "@/lib/axios";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";

export const FollowButton = ({
  userId,
  initialIsFollowing,
  followersCount,
  onFollowChange,
}: {
  userId: string;
  initialIsFollowing: boolean;
  followersCount: number;
  onFollowChange?: (newState: boolean, newCount: number) => void;
}) => {
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing);
  const [isLoading, setIsLoading] = useState(false);
  const [currentFollowersCount, setFollowersCount] = useState(followersCount);
  const { user } = useAuthStore();

  const handleFollow = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      if (isFollowing) {
        await axios.delete(`/users/${userId}/unfollow`);
        setIsFollowing(false);
        setFollowersCount((prev) => prev - 1);
        onFollowChange?.(false, currentFollowersCount - 1);
        toast.success("Unfollowed successfully");
      } else {
        await axios.post(`/users/${userId}/follow`);
        setIsFollowing(true);
        setFollowersCount((prev) => prev + 1);
        onFollowChange?.(true, currentFollowersCount + 1);
        toast.success("Followed successfully");
      }
    } catch (error) {
      toast.error("Operation failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (user?._id === userId) return null;

  return (
    <div className="flex items-center gap-2">
      <Button
        variant={isFollowing ? "outline" : "default"}
        size="sm"
        onClick={handleFollow}
        disabled={isLoading}>
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : isFollowing ? (
          "Following"
        ) : (
          "Follow"
        )}
      </Button>
      <span className="text-sm text-muted-foreground">
        {currentFollowersCount}{" "}
        {currentFollowersCount === 1 ? "follower" : "followers"}
      </span>
    </div>
  );
};
