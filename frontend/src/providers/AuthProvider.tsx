// frontend/src/providers/AuthProvider.tsx

import { setupAxiosInterceptors } from "@/lib/axios";
import { useAuthStore } from "@/stores/useAuthStore";
import { useSocketStore } from "@/stores/useSocketStore";
import { useAuth } from "@clerk/clerk-react";
import { Loader } from "lucide-react";
import { useEffect } from "react";

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const { getToken, userId, isLoaded } = useAuth();
  const { loadUser, clearUser } = useAuthStore();
  const { initSocket, disconnectSocket } = useSocketStore();

  useEffect(() => {
    if (!isLoaded) return;

    const initializeAuth = async () => {
      try {
        // Thiết lập axios interceptors
        setupAxiosInterceptors(getToken);

        if (userId) {
          // Đồng bộ user với backend
          await loadUser(userId);
          // Khởi tạo socket connection
          initSocket(userId, getToken);
        } else {
          clearUser();
          disconnectSocket();
        }
      } catch (error) {
        console.error("Auth initialization error:", error);
        clearUser();
      }
    };

    initializeAuth();

    return () => {
      disconnectSocket();
    };
  }, [
    getToken,
    userId,
    isLoaded,
    loadUser,
    clearUser,
    initSocket,
    disconnectSocket,
  ]);

  if (!isLoaded) {
    return (
      <div className="h-screen w-full flex items-center justify-center">
        <Loader className="size-8 text-[#FF6337] animate-spin" />
      </div>
    );
  }

  return <>{children}</>;
};

export default AuthProvider;
