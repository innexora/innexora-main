import { useCallback, useRef } from "react";

interface NotificationSoundOptions {
  volume?: number;
  playbackRate?: number;
  loop?: boolean;
}

export const useNotificationSound = () => {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const playNotificationSound = useCallback(
    async (
      soundPath: string = "/bell.mp3",
      options: NotificationSoundOptions = {}
    ) => {
      const { volume = 0.5, playbackRate = 1.0, loop = false } = options;

      // Check if audio is supported
      if (typeof window === "undefined" || !("Audio" in window)) {
        console.warn("Audio not supported in this environment");
        return false;
      }

      try {
        // Create new audio instance or reuse existing one
        if (
          !audioRef.current ||
          audioRef.current.src !== `${window.location.origin}${soundPath}`
        ) {
          audioRef.current = new Audio(soundPath);
        }

        const audio = audioRef.current;

        // Configure audio properties
        audio.volume = Math.max(0, Math.min(1, volume));
        audio.playbackRate = Math.max(0.25, Math.min(4, playbackRate));
        audio.loop = loop;

        // Reset audio to beginning
        audio.currentTime = 0;

        // Play the sound
        await audio.play();

        console.log("🔔 Notification sound played successfully");
        return true;
      } catch (error) {
        // Gracefully handle errors (user interaction required, audio blocked, etc.)
        console.warn("Could not play notification sound:", error);
        return false;
      }
    },
    []
  );

  const stopNotificationSound = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  }, []);

  const preloadSound = useCallback((soundPath: string = "/bell.mp3") => {
    if (typeof window !== "undefined" && "Audio" in window) {
      try {
        audioRef.current = new Audio(soundPath);
        audioRef.current.preload = "auto";
        console.log("🔊 Notification sound preloaded");
      } catch (error) {
        console.warn("Could not preload notification sound:", error);
      }
    }
  }, []);

  return {
    playNotificationSound,
    stopNotificationSound,
    preloadSound,
  };
};

export default useNotificationSound;
