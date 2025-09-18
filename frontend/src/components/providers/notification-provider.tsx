"use client";

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  ReactNode,
} from "react";
import { io, Socket } from "socket.io-client";
import { getSocketUrl, socketConfig } from "@/lib/socket";
import { useNotificationSound } from "@/hooks/useNotificationSound";
import { toast } from "sonner";

interface NotificationContextType {
  socket: Socket | null;
}

const NotificationContext = createContext<NotificationContextType>({
  socket: null,
});

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error(
      "useNotification must be used within a NotificationProvider"
    );
  }
  return context;
};

interface NotificationProviderProps {
  children: ReactNode;
}

export function NotificationProvider({ children }: NotificationProviderProps) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const { playNotificationSound, preloadSound } = useNotificationSound();

  // Setup audio
  useEffect(() => {
    if (typeof window !== "undefined") {
      audioRef.current = new Audio("/bell.mp3");
      audioRef.current.preload = "auto";
      audioRef.current.volume = 0.6;
      preloadSound("/bell.mp3");
      console.log("🔊 Audio initialized & preloaded");

      // ⚡ Unlock audio on first user interaction
      const unlock = () => {
        if (audioRef.current) {
          audioRef.current
            .play()
            .then(() => {
              audioRef.current?.pause();
              audioRef.current.currentTime = 0;
              console.log("🔓 Audio unlocked");
            })
            .catch(() => {
              // ignore errors
            });
        }
        window.removeEventListener("click", unlock);
        window.removeEventListener("keydown", unlock);
      };

      window.addEventListener("click", unlock, { once: true });
      window.addEventListener("keydown", unlock, { once: true });
    }
  }, [preloadSound]);

  // Setup socket
  useEffect(() => {
    const newSocket = io(getSocketUrl(), socketConfig);

    newSocket.on("connect", () => {
      console.log("🔗 Connected to WebSocket server");
      newSocket.emit("joinManagersRoom", "manager");
    });

    newSocket.on("connect_error", (error) => {
      console.error("❌ WebSocket connection error:", error);
    });

    newSocket.on("newTicket", async (data) => {
      console.log("📨 New ticket received:", data);

      toast.success(`New Ticket from ${data.ticket.guestInfo.name}`, {
        description: `Room ${data.ticket.roomNumber} - ${data.message}`,
        action: {
          label: "View",
          onClick: () => {
            window.location.href = "/dashboard/tickets";
          },
        },
      });

      try {
        if (audioRef.current) {
          audioRef.current.currentTime = 0;
          await audioRef.current.play();
          console.log("🔔 Notification sound played");
        } else {
          await playNotificationSound("/bell.mp3", {
            volume: 0.6,
            playbackRate: 1.0,
          });
        }
      } catch (err) {
        console.warn("Audio play failed, trying fallback:", err);
      }
    });

    newSocket.on("disconnect", () => {
      console.log("❌ Disconnected from WebSocket server");
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
      setSocket(null);
    };
  }, [playNotificationSound]);

  return (
    <NotificationContext.Provider value={{ socket }}>
      {children}
    </NotificationContext.Provider>
  );
}
