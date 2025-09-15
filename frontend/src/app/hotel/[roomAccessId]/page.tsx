"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  Send,
  Loader2,
  ArrowLeft,
  MessageSquare,
  Bot,
  User,
  Hotel,
  Building2,
  UserCheck,
} from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { apiClient } from "@/lib/api/client";
import {
  guestApiClient,
  createTenantGuestClient,
} from "@/lib/api/guest-client";
import { useTenantContext } from "@/components/tenant/tenant-provider";

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

interface GuestInfo {
  _id: string;
  name: string;
  email?: string;
  phone?: string;
  room: {
    number: string;
    type: string;
  };
}

interface RoomInfo {
  type: string;
  floor: number;
}

export default function GuestChatPage() {
  const { roomAccessId } = useParams();
  const router = useRouter();
  const { subdomain } = useTenantContext();
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [guestInfo, setGuestInfo] = useState<GuestInfo | null>(null);
  const [roomInfo, setRoomInfo] = useState<RoomInfo | null>(null);
  const [isLoadingGuest, setIsLoadingGuest] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [noGuestMessage, setNoGuestMessage] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Fetch guest information by room access ID
  useEffect(() => {
    const fetchGuestInfo = async () => {
      try {
        setIsLoadingGuest(true);

        // Use tenant-specific client if subdomain is available
        const client = subdomain
          ? createTenantGuestClient(subdomain)
          : guestApiClient;

        const response = await client.get(
          `/guests/room-access/${roomAccessId}`
        );

        if (response.data.success) {
          if (response.data.data) {
            setGuestInfo(response.data.data);
            setError(null);
            setNoGuestMessage(null);
          } else {
            // No guest in room
            setGuestInfo(null);
            setRoomInfo(response.data.roomInfo);
            setNoGuestMessage(response.data.message);
          }
        }
      } catch (error: any) {
        console.error("Error fetching guest info:", error);
        if (error.response?.status === 404) {
          setError("Invalid room access code. Please scan the QR code again.");
        } else {
          setError("Unable to connect. Please try again later.");
        }
      } finally {
        setIsLoadingGuest(false);
      }
    };

    if (roomAccessId) {
      fetchGuestInfo();
    }
  }, [roomAccessId, subdomain]);

  const handleSendMessage = async () => {
    if (!message.trim() || isLoading || !guestInfo) return;

    const userMessage: Message = {
      role: "user",
      content: message,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setMessage("");
    setIsLoading(true);

    try {
      // Use tenant-specific client if subdomain is available
      const client = subdomain
        ? createTenantGuestClient(subdomain)
        : guestApiClient;

      const response = await client.post("/chat/chat", {
        message: message,
        roomAccessId: roomAccessId,
        guestInfo: {
          guestName: guestInfo.name,
          email: guestInfo.email,
          phone: guestInfo.phone,
        },
      });

      if (response.data.success) {
        const aiMessage: Message = {
          role: "assistant",
          content: response.data.response,
          timestamp: new Date().toISOString(),
        };

        setMessages((prev) => [...prev, aiMessage]);

        // Show ticket creation notification if tickets were created
        if (
          response.data.shouldCreateTicket &&
          response.data.categories &&
          response.data.categories.length > 0
        ) {
          const ticketCategories = response.data.categories.map(
            (t: any) => t.category
          );
          toast.success(
            `Service request created! Our team will assist you shortly.`,
            {
              description: `Categories: ${ticketCategories.join(", ")}`,
              duration: 5000,
            }
          );
        }
      }
    } catch (error: any) {
      console.error("Error sending message:", error);
      toast.error("Failed to send message. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (isLoadingGuest) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-white dark:bg-black border border-gray-200 dark:border-gray-800 rounded-sm">
          <CardContent className="flex flex-col items-center justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-black dark:text-white mb-4" />
            <p className="text-lg font-medium text-black dark:text-white">
              Connecting to room...
            </p>
            <p className="text-sm text-black dark:text-white opacity-70 mt-2">
              Please wait a moment
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-white dark:bg-black border border-gray-200 dark:border-gray-800 rounded-sm">
          <CardContent className="flex flex-col items-center justify-center p-8">
            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-900 rounded-sm flex items-center justify-center mb-4">
              <Hotel className="h-8 w-8 text-black dark:text-white" />
            </div>
            <p className="text-lg font-medium text-black dark:text-white mb-2">
              Access Error
            </p>
            <p className="text-sm text-black dark:text-white opacity-70 text-center mb-4">
              {error}
            </p>
            <Button
              onClick={() => router.push("/")}
              variant="outline"
              className="w-full bg-white dark:bg-black border-gray-200 dark:border-gray-800 text-black dark:text-white hover:bg-gray-50 dark:hover:bg-gray-900 rounded-sm"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (noGuestMessage) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-white dark:bg-black border border-gray-200 dark:border-gray-800 rounded-sm">
          <CardContent className="flex flex-col items-center justify-center p-8">
            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-900 rounded-sm flex items-center justify-center mb-4">
              <Building2 className="h-8 w-8 text-black dark:text-white" />
            </div>
            <p className="text-lg font-medium text-black dark:text-white mb-2">
              Room Available
            </p>
            <p className="text-sm text-black dark:text-white opacity-70 text-center mb-2">
              {noGuestMessage}
            </p>
            {roomInfo && (
              <p className="text-xs text-black dark:text-white opacity-50 text-center mb-4">
                {roomInfo.type} • Floor {roomInfo.floor}
              </p>
            )}
            <div className="w-full space-y-2">
              <Button
                onClick={() => router.push("/dashboard")}
                className="w-full bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200 rounded-sm"
              >
                Staff Login
              </Button>
              <Button
                onClick={() => router.push("/")}
                variant="outline"
                className="w-full bg-white dark:bg-black border-gray-200 dark:border-gray-800 text-black dark:text-white hover:bg-gray-50 dark:hover:bg-gray-900 rounded-sm"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Go Back
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <div className="bg-white dark:bg-black border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push("/")}
                className="shrink-0 text-black dark:text-white hover:bg-gray-100 dark:hover:bg-gray-900 rounded-sm"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gray-100 dark:bg-gray-900 rounded-sm flex items-center justify-center">
                  <UserCheck className="h-4 w-4 text-black dark:text-white" />
                </div>
                <div>
                  <h1 className="text-lg font-semibold text-black dark:text-white">
                    {guestInfo?.name}
                  </h1>
                  <p className="text-sm text-black dark:text-white opacity-70">
                    Room {guestInfo?.room.number} • {guestInfo?.room.type}
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <div className="text-right">
                <p className="text-sm font-medium text-black dark:text-white">
                  Hotel Services
                </p>
                <p className="text-xs text-black dark:text-white opacity-70">
                  Guest Concierge
                </p>
              </div>
              <div className="w-8 h-8 bg-black dark:bg-white rounded-sm flex items-center justify-center">
                <Hotel className="h-4 w-4 text-white dark:text-black" />
              </div>
              <ThemeToggle />
            </div>
          </div>
        </div>
      </div>

      {/* Chat Container */}
      <div className="max-w-4xl mx-auto p-4  flex flex-col">
        <Card className="flex-1 flex flex-col bg-white dark:bg-black border border-gray-200 dark:border-gray-800 rounded-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl font-semibold flex items-center text-black dark:text-white">
              <MessageSquare className="h-5 w-5 mr-2 text-black dark:text-white" />
              Digital Concierge
            </CardTitle>
            <p className="text-sm text-black dark:text-white opacity-70">
              Ask our AI for help with room service, amenities, or general
              inquiries.
            </p>
          </CardHeader>

          <CardContent className="flex-1 flex flex-col px-2">
            {/* Messages Area */}
            <div className="h-[400px] overflow-y-auto space-y-4 mb-4 p-4">
              {messages.length === 0 ? (
                <div className="text-center py-8">
                  <Bot className="h-12 w-12 text-black dark:text-white opacity-50 mx-auto mb-3" />
                  <p className="text-black dark:text-white opacity-70 mb-2">
                    Welcome! How can I assist you today?
                  </p>
                  <p className="text-sm text-black dark:text-white opacity-50">
                    Ask about room service, amenities, or any hotel services
                  </p>
                </div>
              ) : (
                messages.map((msg, index) => (
                  <div
                    key={index}
                    className={`flex ${
                      msg.role === "user" ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div
                      className={`max-w-[80%] rounded-sm px-4 py-2 ${
                        msg.role === "user"
                          ? "bg-black dark:bg-white text-white dark:text-black"
                          : "bg-white dark:bg-black border border-gray-200 dark:border-gray-800"
                      }`}
                    >
                      <div className="flex items-start space-x-2">
                        {msg.role === "assistant" && (
                          <Bot className="h-4 w-4 text-black dark:text-white opacity-70 mt-1 shrink-0" />
                        )}
                        <div className="flex-1">
                          <p
                            className={`text-sm ${
                              msg.role === "user"
                                ? "text-white dark:text-black"
                                : "text-black dark:text-white"
                            }`}
                          >
                            {msg.content}
                          </p>
                          <p
                            className={`text-xs mt-1 ${
                              msg.role === "user"
                                ? "text-white dark:text-black opacity-70"
                                : "text-black dark:text-white opacity-50"
                            }`}
                          >
                            {formatDistanceToNow(new Date(msg.timestamp), {
                              addSuffix: true,
                            })}
                          </p>
                        </div>
                        {msg.role === "user" && (
                          <User className="h-4 w-4 text-white dark:text-black opacity-70 mt-1 shrink-0" />
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="flex space-x-2 px-2">
              <Input
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your message..."
                disabled={isLoading}
                className="flex-1 bg-white dark:bg-black border-gray-200 dark:border-gray-800 text-black dark:text-white rounded-sm"
              />
              <Button
                onClick={handleSendMessage}
                disabled={isLoading || !message.trim()}
                size="sm"
                className="shrink-0 bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200 rounded-sm"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
