import { usePlayerStore } from "@/stores/usePlayerStore";
import { useEffect, useRef } from "react";

const AudioPlayer = () => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const prevSongRef = useRef<string | null>(null);

  const { currentSong, isPlaying, playNext } = usePlayerStore();

  // Handle play/pause logic
  useEffect(() => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.play().catch((error) => {
        console.error("Failed to play audio:", error);
      });
    } else {
      audioRef.current.pause();
    }
  }, [isPlaying]);

  // Handle song ends
  useEffect(() => {
    const audio = audioRef.current;

    const handleEnded = () => {
      playNext();
    };

    audio?.addEventListener("ended", handleEnded);

    return () => audio?.removeEventListener("ended", handleEnded);
  }, [playNext]);

  // Handle song changes
  useEffect(() => {
    if (!audioRef.current || !currentSong) return;

    const audio = audioRef.current;

    // Check if this is actually a new song
    const isSongChange = prevSongRef.current !== currentSong.audioUrl;
    if (isSongChange) {
      audio.src = currentSong.audioUrl;
      audio.currentTime = 0; // Reset playback position
      prevSongRef.current = currentSong.audioUrl;

      if (isPlaying) {
        audio.play().catch((error) => {
          console.error("Failed to play audio:", error);
        });
      }
    }
  }, [currentSong, isPlaying]);

  return <audio ref={audioRef} />;
};

export default AudioPlayer;
