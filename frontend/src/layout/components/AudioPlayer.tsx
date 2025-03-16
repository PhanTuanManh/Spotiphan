import { usePlayerStore } from "@/stores/usePlayerStore";
import { useEffect, useRef } from "react";

const AudioPlayer = () => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const prevSongRef = useRef<string | null>(null);

  const { currentSong, isPlaying, playNext } = usePlayerStore();

  // Lấy base URL từ window.location.origin
  const baseUrl = window.location.origin;

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

    // Resolve đường dẫn tương đối thành đường dẫn tuyệt đối
    const fullAudioUrl = `${baseUrl}${currentSong.audioUrl}`;

    // Check if this is actually a new song
    const isSongChange = prevSongRef.current !== fullAudioUrl;
    if (isSongChange) {
      // Ensure audioUrl is a valid URL
      if (!currentSong.audioUrl) {
        console.error("Invalid audioUrl:", currentSong.audioUrl);
        return;
      }

      // Set the new audio source
      audio.src = fullAudioUrl;
      audio.currentTime = 0; // Reset playback position
      prevSongRef.current = fullAudioUrl;

      // Wait for the audio to load before playing
      const handleCanPlay = () => {
        if (isPlaying) {
          audio.play().catch((error) => {
            console.error("Failed to play audio:", error);
          });
        }
        audio.removeEventListener("canplay", handleCanPlay); // Clean up the event listener
      };

      audio.addEventListener("canplay", handleCanPlay);

      // Clean up the event listener if the component unmounts or the song changes again
      return () => {
        audio.removeEventListener("canplay", handleCanPlay);
      };
    }
  }, [currentSong, isPlaying, baseUrl]);

  return <audio ref={audioRef} />;
};

export default AudioPlayer;
