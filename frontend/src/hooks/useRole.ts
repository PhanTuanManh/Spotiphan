import { useAuthStore } from "@/stores/useAuthStore";
import { UserRole } from "@/types";

export const useAuth = () => {
  const { user, role, isLoading } = useAuthStore();

  return {
    user,
    role,
    isLoading,
    isAuthenticated: !!user,
    isAdmin: role === "admin",
    isPremium: ["premium", "artist", "admin"].includes(role || ""),
    isArtist: role === "artist",
    hasRole: (requiredRole: UserRole) => role === requiredRole,
  };
};
