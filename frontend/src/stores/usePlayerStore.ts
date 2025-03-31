// frontend/src/stores/usePlayerStore.ts

import { create } from "zustand";
import { ISong } from "@/types";
import { useChatStore } from "./useChatStore";
import { useAuthStore } from "./useAuthStore";

interface PlayerStore {
  currentSong: ISong | null;
  isPlaying: boolean;
  queue: ISong[];
  currentIndex: number;

  initializeQueue: (songs: ISong[]) => void;
  playAlbum: (songs: ISong[], startIndex?: number) => void;
  setCurrentSong: (song: ISong | null) => void;
  togglePlay: () => void;
  playNext: () => void;
  playPrevious: () => void;
  playPlaylist: (songs: ISong[], startIndex?: number) => void;
  updateActivity: (activity: string) => void; // Thêm hàm mới
}

export const usePlayerStore = create<PlayerStore>((set, get) => ({
  currentSong: null,
  isPlaying: false,
  queue: [],
  currentIndex: -1,

  updateActivity: (activity) => {
    const socket = useChatStore.getState().socket;
    const authStore = useAuthStore.getState(); // Thêm dòng này
    const clerkId = authStore.clerkId; // Lấy clerkId từ authStore

    console.log("Updating activity:", activity, "for clerkId:", clerkId);
    if (socket && socket.connected && clerkId) {
      socket.emit("update_activity", {
        userId: clerkId, // Sử dụng clerkId thay vì socket.userId
        activity,
      });
    }
  },

  initializeQueue: (songs: ISong[]) => {
    set({
      queue: songs,
      currentSong: get().currentSong || songs[0],
      currentIndex: get().currentIndex === -1 ? 0 : get().currentIndex,
    });
  },

  playPlaylist: (songs: ISong[], startIndex = 0) => {
    if (songs.length === 0) return;

    const song = songs[startIndex];

    get().updateActivity(`Playing ${song.title} by ${song.artist}`);

    set({
      queue: songs,
      currentSong: song,
      currentIndex: startIndex,
      isPlaying: true,
    });
  },

  playAlbum: (songs: ISong[], startIndex = 0) => {
    if (songs.length === 0) return;

    const song = songs[startIndex];
    get().updateActivity(`Playing ${song.title} by ${song.artist}`);

    set({
      queue: songs,
      currentSong: song,
      currentIndex: startIndex,
      isPlaying: true,
    });
  },

  setCurrentSong: (song: ISong | null) => {
    if (!song) return;

    get().updateActivity(`Playing ${song.title} by ${song.artist}`);

    const songIndex = get().queue.findIndex((s) => s._id === song._id);
    set({
      currentSong: song,
      isPlaying: true,
      currentIndex: songIndex !== -1 ? songIndex : get().currentIndex,
    });
  },

  togglePlay: () => {
    const willStartPlaying = !get().isPlaying;
    const currentSong = get().currentSong;

    if (willStartPlaying && currentSong) {
      get().updateActivity(
        `Playing ${currentSong.title} by ${currentSong.artist}`
      );
    } else {
      get().updateActivity("Idle");
    }

    set({
      isPlaying: willStartPlaying,
    });
  },

  playNext: () => {
    const { currentIndex, queue } = get();
    const nextIndex = currentIndex + 1;

    if (nextIndex < queue.length) {
      const nextSong = queue[nextIndex];
      get().updateActivity(`Playing ${nextSong.title} by ${nextSong.artist}`);

      set({
        currentSong: nextSong,
        currentIndex: nextIndex,
        isPlaying: true,
      });
    } else {
      const socket = useChatStore.getState().socket;
      if (socket) {
        socket.emit("update_activity", {
          userId: socket.userId,
          activity: `Idle`,
        });
      }

      set({ isPlaying: false });
    }
  },

  playPrevious: () => {
    const { currentIndex, queue } = get();
    const prevIndex = currentIndex - 1;

    if (prevIndex >= 0) {
      const prevSong = queue[prevIndex];
      get().updateActivity(`Playing ${prevSong.title} by ${prevSong.artist}`);

      set({
        currentSong: prevSong,
        currentIndex: prevIndex,
        isPlaying: true,
      });
    } else {
      const socket = useChatStore.getState().socket;
      if (socket) {
        socket.emit("update_activity", {
          userId: socket.userId,
          activity: `Idle`,
        });
      }

      set({ isPlaying: false });
    }
  },
}));
