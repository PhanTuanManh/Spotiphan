// src/layout/MainLayout.tsx

import { useEffect, useState } from "react";
import { axiosInstance } from "@/lib/axios";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useAuthStore } from "@/stores/useAuthStore";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import AudioPlayer from "./components/AudioPlayer";
import LeftSidebar from "./components/LeftSidebar";
import { Outlet } from "react-router-dom";
import FriendsActivity from "./components/FriendsActivity";
import { PlaybackControls } from "./components/PlaybackControls";

const MainLayout = () => {
  const [isMobile, setIsMobile] = useState(false);
  const [ads, setAds] = useState([]); // Lưu danh sách quảng cáo
  const [showAd, setShowAd] = useState(false); // Hiển thị dialog quảng cáo
  const [currentAdIndex, setCurrentAdIndex] = useState(0); // Index của quảng cáo hiện tại
  const { role, userId } = useAuthStore(); // Lấy role và userId từ store

  // Lấy danh sách quảng cáo đang hoạt động (chỉ khi đã đăng nhập và là free user)
  const fetchActiveAds = async () => {
    if (userId && role === "free") {
      try {
        const response = await axiosInstance.get("/advertisements");
        setAds(response.data.ads);
      } catch (error) {
        console.error("Failed to fetch ads:", error);
      }
    }
  };

  // Timer để hiển thị quảng cáo mỗi 15 phút (chỉ cho người dùng free)
  useEffect(() => {
    if (userId && role === "free" && ads.length > 0) {
      const timer = setInterval(() => {
        setShowAd(true);
        setCurrentAdIndex((prevIndex) => (prevIndex + 1) % ads.length); // Xoay vòng quảng cáo
      }, 5 * 60 * 1000); // 15 phút (đã sửa thành milliseconds)

      return () => clearInterval(timer);
    }
  }, [ads, role, userId]); // Thêm userId vào dependency array

  // Lấy quảng cáo khi component được mount hoặc khi role/userId thay đổi
  useEffect(() => {
    fetchActiveAds();
  }, [role, userId]);

  return (
    <div className="h-screen bg-black text-white flex flex-col">
      <ResizablePanelGroup
        direction="horizontal"
        className="flex-1 flex h-full overflow-hidden p-2">
        <AudioPlayer />
        {/* left sidebar */}
        <ResizablePanel
          defaultSize={20}
          minSize={isMobile ? 0 : 10}
          maxSize={30}>
          <LeftSidebar />
        </ResizablePanel>

        <ResizableHandle className="w-2 bg-black rounded-lg transition-colors" />

        {/* Main content */}
        <ResizablePanel defaultSize={isMobile ? 80 : 60}>
          <Outlet />
        </ResizablePanel>

        {!isMobile && (
          <>
            <ResizableHandle className="w-2 bg-black rounded-lg transition-colors" />

            {/* right sidebar */}
            <ResizablePanel
              defaultSize={20}
              minSize={0}
              maxSize={25}
              collapsedSize={0}>
              <FriendsActivity />
            </ResizablePanel>
          </>
        )}
      </ResizablePanelGroup>

      <PlaybackControls />

      {/* Dialog quảng cáo (chỉ hiển thị cho người dùng free đã đăng nhập) */}
      {userId && role === "free" && ads.length > 0 && (
        <Dialog open={showAd} onOpenChange={setShowAd}>
          <DialogContent className="bg-zinc-900 border-zinc-700">
            <DialogHeader>
              <DialogTitle>{ads[currentAdIndex]?.title}</DialogTitle>
              <DialogDescription>
                {ads[currentAdIndex]?.description}
              </DialogDescription>
            </DialogHeader>
            <img
              src={ads[currentAdIndex]?.mediaUrl}
              alt="Advertisement"
              className="w-full h-48 object-cover rounded-lg"
            />
            <a
              href={ads[currentAdIndex]?.redirectUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-blue-500 hover:underline">
              Xem thêm
            </a>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default MainLayout;
