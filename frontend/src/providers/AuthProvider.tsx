import { axiosInstance } from "@/lib/axios";
import { useAuthStore } from "@/stores/useAuthStore";
import { useChatStore } from "@/stores/useChatStore";
import { useAuth } from "@clerk/clerk-react";
import { Loader } from "lucide-react";
import { useEffect, useState, useCallback } from "react";

const updateApiToken = (token: string | null) => {
  if (token) {
    axiosInstance.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    console.log("🔹 Updated API Token:", token);
  } else {
    delete axiosInstance.defaults.headers.common["Authorization"];
  }
};

const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const { getToken, userId } = useAuth();
  const [loading, setLoading] = useState(true);
  const { checkUserRole, setUserId, setClerkId } = useAuthStore();
  const { initSocket, disconnectSocket } = useChatStore();

  const initAuth = useCallback(async () => {
    try {
      const token = await getToken();

      if (!token) {
        console.warn("⚠️ No token received from Clerk");
        updateApiToken(null);
        return;
      }

      updateApiToken(token);

      if (userId) {
        setClerkId(userId);
        await checkUserRole();
        initSocket(userId);
      }
    } catch (error: any) {
      console.error("❌ Error in AuthProvider:", error);
      updateApiToken(null);
    } finally {
      setLoading(false);
    }
  }, [getToken, userId, checkUserRole, initSocket, setUserId, setClerkId]);

  useEffect(() => {
    initAuth();

    return () => {
      disconnectSocket();
    };
  }, [initAuth, disconnectSocket]);

  if (loading)
    return (
      <div className="h-screen w-full flex items-center justify-center">
        <Loader className="size-8 text-[#FF6337] animate-spin" />
      </div>
    );

  return <>{children}</>;
};

export default AuthProvider;
