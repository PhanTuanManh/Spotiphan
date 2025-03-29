// frontend/src/components/FollowButton.tsx
import { useAuthStore } from "@/stores/useAuthStore";
import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { axiosInstance as axios } from "@/lib/axios";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";

export const FollowButton = ({
  userId,
  initialIsFollowing,
  followersCount: initialFollowersCount,
}: {
  userId: string;
  initialIsFollowing: boolean;
  followersCount: number;
}) => {
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing);
  const [isLoading, setIsLoading] = useState(false);
  const [followersCount, setFollowersCount] = useState(initialFollowersCount);
  const { user } = useAuthStore();

  const handleFollow = async () => {
    if (!user) {
      toast.error("Please log in to follow users");
      return;
    }

    setIsLoading(true);
    try {
      if (isFollowing) {
        // Unfollow
        await axios.delete(`/users/${userId}/follow`);
        setIsFollowing(false);
        setFollowersCount((prev) => prev - 1);
        toast.success("Unfollowed successfully");
      } else {
        // Follow
        await axios.post(`/users/${userId}/follow`);
        setIsFollowing(true);
        setFollowersCount((prev) => prev + 1);
        toast.success("Followed successfully");
      }
    } catch (error: any) {
      toast.error(
        error.response?.data?.message || "Operation failed. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (!user || user._id === userId) return null;

  return (
    <div className="flex items-center gap-2">
      <Button
        className="rounded-full bg-transparent text-white border border-white hover:bg-transparent hover:scale-105"
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
        {followersCount} {followersCount === 1 ? "follower" : "followers"}
      </span>
    </div>
  );
};
