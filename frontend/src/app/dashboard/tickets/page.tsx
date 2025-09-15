"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TicketCard } from "@/components/kanban/ticket-card";
import { KanbanColumn } from "@/components/kanban/kanban-column";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { rectIntersection } from "@dnd-kit/core";
import {
  Search,
  Plus,
  Send,
  MessageSquare,
  Clock,
  CheckCircle,
  AlertCircle,
  Bot,
  Sparkles,
  Bell,
} from "lucide-react";
import { apiClient } from "@/lib/api/client";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { io, Socket } from "socket.io-client";

interface Message {
  _id: string;
  content: string;
  sender: "guest" | "manager" | "ai_assistant" | "system";
  senderName: string;
  createdAt: string;
  timestamp?: string;
}

interface Ticket {
  _id: string;
  room:
    | string
    | {
        _id: string;
        number: string;
        type?: string;
        floor?: number;
      };
  roomNumber: string;
  guestInfo: {
    name: string;
    email?: string;
    phone?: string;
  };
  status: "raised" | "in_progress" | "completed";
  priority: "low" | "medium" | "high";
  category?:
    | "service_fb"
    | "housekeeping"
    | "maintenance"
    | "porter"
    | "concierge"
    | "reception"
    | "general";
  subject?: string;
  messages: Message[];
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

interface Room {
  _id: string;
  number: string;
  type: string;
  floor: number;
  price: number;
  capacity: number;
  amenities: string[];
  description?: string;
  status: "available" | "occupied" | "maintenance" | "cleaning";
  currentGuest?: string | null;
  manager: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface DashboardStats {
  totalRooms: number;
  raisedTickets: number;
  inProgressTickets: number;
  completedTickets: number;
}

export default function DashboardPage() {
  const [tickets, setTickets] = useState<Record<string, Ticket[]>>({
    raised: [],
    in_progress: [],
    completed: [],
  });
  const [stats, setStats] = useState<DashboardStats>({
    totalRooms: 0,
    raisedTickets: 0,
    inProgressTickets: 0,
    completedTickets: 0,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [aiSuggestion, setAiSuggestion] = useState("");
  const [isLoadingAI, setIsLoadingAI] = useState(false);
  const [newRoom, setNewRoom] = useState<{
    number: string;
    type: string;
    floor: number;
    price: number;
    capacity: number;
    amenities: string[];
    description: string;
    status: "available" | "occupied" | "maintenance" | "cleaning";
  }>({
    number: "",
    type: "",
    floor: 1,
    price: 0,
    capacity: 1,
    amenities: [],
    description: "",
    status: "available",
  });
  const [activeTicket, setActiveTicket] = useState<Ticket | null>(null);
  const [isRoomDialogOpen, setIsRoomDialogOpen] = useState(false);
  const [isTicketDialogOpen, setIsTicketDialogOpen] = useState(false);
  const [socket, setSocket] = useState<Socket | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const collisionDetectionStrategy = rectIntersection;

  useEffect(() => {
    fetchData();

    // Set up WebSocket connection for real-time ticket notifications
    const setupWebSocket = () => {
      const newSocket = io("http://localhost:5050", {
        transports: ["websocket", "polling"],
        timeout: 20000,
        forceNew: true,
      });

      newSocket.on("connect", () => {
        console.log("🔗 Connected to WebSocket server");
        // Join managers room to receive new ticket notifications
        newSocket.emit("joinManagersRoom", "manager");
      });

      newSocket.on("connect_error", (error) => {
        console.error("❌ WebSocket connection error:", error);
      });

      newSocket.on("newTicket", (data) => {
        console.log("📨 New ticket received:", data);

        // Show toast notification
        toast.success(`New Ticket from ${data.ticket.guestInfo.name}`, {
          description: `Room ${data.ticket.roomNumber} - ${data.message}`,
          action: {
            label: "View",
            onClick: () => setSelectedTicket(data.ticket),
          },
        });

        // Play notification sound (optional)
        if (typeof window !== "undefined" && "Audio" in window) {
          try {
            const audio = new Audio("/notification.mp3");
            audio.volume = 0.3;
            audio.play().catch(() => {}); // Ignore errors if sound fails
          } catch (e) {}
        }

        // Refresh tickets to show the new one
        fetchData();
      });

      newSocket.on("disconnect", () => {
        console.log("❌ Disconnected from WebSocket server");
      });

      setSocket(newSocket);

      return () => {
        newSocket.disconnect();
      };
    };

    const cleanup = setupWebSocket();
    return cleanup;
  }, []);

  const fetchData = async () => {
    try {
      const ticketsResponse = await apiClient.get("/tickets");

      if (
        ticketsResponse.data?.success &&
        Array.isArray(ticketsResponse.data.data)
      ) {
        const ticketsData = ticketsResponse.data.data;

        // Check for new tickets and show notifications
        const currentRaisedCount = tickets.raised?.length || 0;
        const newRaisedCount = ticketsData.filter(
          (t: Ticket) => t.status === "raised"
        ).length;

        if (newRaisedCount > currentRaisedCount && currentRaisedCount > 0) {
          const newTickets = ticketsData.filter(
            (t: Ticket) =>
              t.status === "raised" &&
              !tickets.raised?.some((existing) => existing._id === t._id)
          );

          newTickets.forEach((ticket: Ticket) => {
            toast.success(
              `🔔 New service request from ${ticket.guestInfo.name} in Room ${ticket.roomNumber}`,
              {
                duration: 5000,
                action: {
                  label: "View",
                  onClick: () => setSelectedTicket(ticket),
                },
              }
            );
          });
        }

        const groupedTickets = ticketsData.reduce(
          (acc: Record<string, Ticket[]>, ticket: Ticket) => {
            if (!acc[ticket.status]) {
              acc[ticket.status] = [];
            }
            acc[ticket.status].push(ticket);
            return acc;
          },
          { raised: [], in_progress: [], completed: [] }
        );

        setTickets(groupedTickets);
        setStats({
          totalRooms: 0, // Not needed anymore since we removed room filter
          raisedTickets: groupedTickets.raised?.length || 0,
          inProgressTickets: groupedTickets.in_progress?.length || 0,
          completedTickets: groupedTickets.completed?.length || 0,
        });
      }
    } catch (error) {
      console.error("Failed to fetch data:", error);
      toast.error("Failed to load dashboard data");
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusChange = async (ticketId: string, newStatus: string) => {
    try {
      console.log("Updating ticket status:", { ticketId, newStatus });
      await apiClient.put(`/tickets/${ticketId}/status`, { status: newStatus });
      fetchData();
      toast.success("Ticket status updated");
    } catch (error) {
      console.error("Error updating ticket status:", error);
      toast.error("Failed to update ticket status");
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedTicket) return;

    setIsLoading(true);
    try {
      const response = await apiClient.post(
        `/tickets/${selectedTicket._id}/messages`,
        {
          content: newMessage,
          sender: "manager",
        }
      );

      if (response.data.success) {
        // Update the ticket with new message
        const updatedTicket = { ...selectedTicket };
        updatedTicket.messages = [
          ...(updatedTicket.messages || []),
          response.data.data,
        ];
        setSelectedTicket(updatedTicket);

        // Update tickets list
        setTickets((prev) => {
          const newTickets = { ...prev };
          Object.keys(newTickets).forEach((status) => {
            newTickets[status] = newTickets[status].map((t: Ticket) =>
              t._id === selectedTicket._id ? updatedTicket : t
            );
          });
          return newTickets;
        });

        setNewMessage("");
        setAiSuggestion(""); // Clear AI suggestion after sending
        toast.success("Message sent successfully");
      }
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Failed to send message");
    } finally {
      setIsLoading(false);
    }
  };

  const getAISuggestion = async () => {
    if (!selectedTicket) return;

    setIsLoadingAI(true);
    try {
      const response = await apiClient.post("/chat/manager-assist", {
        ticketId: selectedTicket._id,
        conversationHistory: selectedTicket.messages || [],
        requestType: selectedTicket.priority,
      });

      if (response.data.success) {
        setAiSuggestion(response.data.suggestion);
        toast.success("AI suggestion generated");
      }
    } catch (error) {
      console.error("Error getting AI suggestion:", error);
      toast.error("Failed to get AI suggestion");
    } finally {
      setIsLoadingAI(false);
    }
  };

  const useAISuggestion = () => {
    if (aiSuggestion) {
      setNewMessage(aiSuggestion);
      setAiSuggestion("");
    }
  };

  const handleAddRoom = async () => {
    try {
      const roomData = {
        ...newRoom,
        price: Number(newRoom.price) || 0,
        floor: Number(newRoom.floor) || 1,
        capacity: Number(newRoom.capacity) || 2,
        amenities: Array.isArray(newRoom.amenities) ? newRoom.amenities : [],
        status: newRoom.status || "available",
        description: newRoom.description || "",
      };

      const response = await apiClient.post("/rooms", roomData);

      if (response.data.success) {
        setNewRoom({
          number: "",
          type: "",
          floor: 1,
          price: 0,
          capacity: 2,
          amenities: [],
          description: "",
          status: "available",
        });

        setIsRoomDialogOpen(false);
        fetchData();
        toast.success("Room added successfully");
      }
    } catch (error: any) {
      console.error("Failed to add room:", error);
      const errorMessage =
        error.response?.data?.message || "Failed to add room";
      toast.error(
        typeof errorMessage === "string" ? errorMessage : "An error occurred"
      );
    }
  };

  const getFilteredTickets = (status: string) => {
    let filtered = tickets[status] || [];

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (ticket) =>
          ticket.guestInfo?.name?.toLowerCase().includes(query) ||
          ticket.roomNumber?.toString().includes(query) ||
          (ticket.messages?.[0]?.content || "").toLowerCase().includes(query) ||
          (ticket.subject || "").toLowerCase().includes(query) ||
          (ticket.category || "").toLowerCase().includes(query)
      );
    }

    // Apply category filter
    if (filterCategory && filterCategory !== "all") {
      filtered = filtered.filter(
        (ticket) => ticket.category === filterCategory
      );
    }

    return filtered;
  };

  const openTicketDialog = (ticket: Ticket) => {
    setSelectedTicket(ticket);
    setIsTicketDialogOpen(true);
  };

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const ticket = Object.values(tickets)
      .flat()
      .find((t) => t._id === active.id);
    setActiveTicket(ticket || null);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTicket(null);

    if (!over) return;

    const ticketId = active.id as string;
    const newStatus = over.id as string;

    // Find the ticket being moved
    const ticket = Object.values(tickets)
      .flat()
      .find((t) => t._id === ticketId);
    if (!ticket || ticket.status === newStatus) return;

    // Update ticket status
    await handleStatusChange(ticketId, newStatus);
  };

  if (isLoading) {
    return (
      <div className="space-y-6 h-full">
        {/* Header Skeleton */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-96 mt-2" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>

        {/* Stats Cards Skeleton */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="bg-white dark:bg-black border border-gray-200 dark:border-gray-800 rounded-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-4 w-24 bg-gray-200 dark:bg-gray-800 rounded-sm" />
                <Skeleton className="h-4 w-4 bg-gray-200 dark:bg-gray-800 rounded-sm" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16 bg-gray-200 dark:bg-gray-800 rounded-sm" />
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Filters Skeleton */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Skeleton className="h-10 flex-1" />
          <div className="flex gap-2">
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-32" />
          </div>
        </div>

        {/* Kanban Board Skeleton */}
        <div className="flex gap-6 overflow-x-auto pb-4 h-[calc(100vh-400px)]">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="h-full min-w-[300px] bg-white dark:bg-black border border-gray-200 dark:border-gray-800 rounded-sm">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-6 w-32 bg-gray-200 dark:bg-gray-800 rounded-sm" />
                  <Skeleton className="h-5 w-8 bg-gray-200 dark:bg-gray-800 rounded-sm" />
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {[...Array(3)].map((_, j) => (
                  <Card key={j} className="bg-white dark:bg-black border border-gray-200 dark:border-gray-800 rounded-sm">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <Skeleton className="h-4 w-32 bg-gray-200 dark:bg-gray-800 rounded-sm" />
                        <Skeleton className="h-4 w-12 bg-gray-200 dark:bg-gray-800 rounded-sm" />
                      </div>
                      <Skeleton className="h-3 w-full mb-3 bg-gray-200 dark:bg-gray-800 rounded-sm" />
                      <div className="flex items-center justify-between">
                        <Skeleton className="h-3 w-16 bg-gray-200 dark:bg-gray-800 rounded-sm" />
                        <Skeleton className="h-3 w-8 bg-gray-200 dark:bg-gray-800 rounded-sm" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 h-full">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-white dark:bg-black border border-gray-200 dark:border-gray-800 rounded-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-black dark:text-white">Total Tickets</CardTitle>
            <MessageSquare className="h-4 w-4 text-black dark:text-white opacity-70" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-black dark:text-white">
              {stats.raisedTickets +
                stats.inProgressTickets +
                stats.completedTickets}
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white dark:bg-black border border-gray-200 dark:border-gray-800 rounded-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-black dark:text-white">New Requests</CardTitle>
            <Clock className="h-4 w-4 text-black dark:text-white opacity-70" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-black dark:text-white">{stats.raisedTickets}</div>
          </CardContent>
        </Card>
        <Card className="bg-white dark:bg-black border border-gray-200 dark:border-gray-800 rounded-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-black dark:text-white">In Progress</CardTitle>
            <Clock className="h-4 w-4 text-black dark:text-white opacity-70" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-black dark:text-white">{stats.inProgressTickets}</div>
          </CardContent>
        </Card>
        <Card className="bg-white dark:bg-black border border-gray-200 dark:border-gray-800 rounded-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-black dark:text-white">Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-black dark:text-white opacity-70" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-black dark:text-white">{stats.completedTickets}</div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-black dark:text-white opacity-70" />
          <Input
            type="search"
            placeholder="Search tickets by guest name, room, message, or category..."
            className="pl-8 bg-white dark:bg-black border-gray-200 dark:border-gray-800 text-black dark:text-white rounded-sm"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        {(searchQuery || filterCategory !== "all") && (
          <Button
            variant="outline"
            onClick={() => {
              setSearchQuery("");
              setFilterCategory("all");
            }}
            className="bg-white dark:bg-black border-gray-200 dark:border-gray-800 text-black dark:text-white rounded-sm"
          >
            Clear Filters
          </Button>
        )}
      </div>

      {/* Category Tabs */}
      <div className="w-full">
        <Tabs
          value={filterCategory}
          onValueChange={setFilterCategory}
          className="w-full"
        >
          <TabsList className="grid grid-cols-7 w-full lg:w-auto bg-white dark:bg-black border border-gray-200 dark:border-gray-800 rounded-sm">
            <TabsTrigger value="all" className="text-black dark:text-white data-[state=active]:bg-black data-[state=active]:text-white dark:data-[state=active]:bg-white dark:data-[state=active]:text-black rounded-sm">All</TabsTrigger>
            <TabsTrigger value="service_fb" className="text-black dark:text-white data-[state=active]:bg-black data-[state=active]:text-white dark:data-[state=active]:bg-white dark:data-[state=active]:text-black rounded-sm">Food & Beverage</TabsTrigger>
            <TabsTrigger value="housekeeping" className="text-black dark:text-white data-[state=active]:bg-black data-[state=active]:text-white dark:data-[state=active]:bg-white dark:data-[state=active]:text-black rounded-sm">Housekeeping</TabsTrigger>
            <TabsTrigger value="maintenance" className="text-black dark:text-white data-[state=active]:bg-black data-[state=active]:text-white dark:data-[state=active]:bg-white dark:data-[state=active]:text-black rounded-sm">Maintenance</TabsTrigger>
            <TabsTrigger value="porter" className="text-black dark:text-white data-[state=active]:bg-black data-[state=active]:text-white dark:data-[state=active]:bg-white dark:data-[state=active]:text-black rounded-sm">Porter</TabsTrigger>
            <TabsTrigger value="concierge" className="text-black dark:text-white data-[state=active]:bg-black data-[state=active]:text-white dark:data-[state=active]:bg-white dark:data-[state=active]:text-black rounded-sm">Concierge</TabsTrigger>
            <TabsTrigger value="reception" className="text-black dark:text-white data-[state=active]:bg-black data-[state=active]:text-white dark:data-[state=active]:bg-white dark:data-[state=active]:text-black rounded-sm">Reception</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Kanban Board */}
      <DndContext
        sensors={sensors}
        collisionDetection={collisionDetectionStrategy}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-6 overflow-x-auto pb-4 h-[calc(100vh-400px)]">
          {/* New Requests Column */}
          <DroppableColumn id="raised">
            <Card className="h-full bg-white dark:bg-black border border-gray-200 dark:border-gray-800 rounded-sm">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-semibold text-black dark:text-white">
                    New Requests
                  </CardTitle>
                  <Badge variant="outline" className="bg-white dark:bg-black border-gray-200 dark:border-gray-800 text-black dark:text-white rounded-sm">
                    {getFilteredTickets("raised").length}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 h-[calc(100vh-280px)] overflow-y-auto p-2">
                <SortableContext
                  items={getFilteredTickets("raised").map((t) => t._id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-2">
                    {getFilteredTickets("raised").map((ticket) => (
                      <DraggableTicketCard
                        key={ticket._id}
                        ticket={ticket}
                        onClick={() => setSelectedTicket(ticket)}
                      />
                    ))}
                  </div>
                </SortableContext>
              </CardContent>
            </Card>
          </DroppableColumn>

          {/* In Progress Column */}
          <DroppableColumn id="in_progress">
            <Card className="h-full bg-white dark:bg-black border border-gray-200 dark:border-gray-800 rounded-sm">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-semibold text-black dark:text-white">
                    In Progress
                  </CardTitle>
                  <Badge variant="outline" className="bg-white dark:bg-black border-gray-200 dark:border-gray-800 text-black dark:text-white rounded-sm">
                    {getFilteredTickets("in_progress").length}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 h-[calc(100vh-280px)] overflow-y-auto p-2">
                <SortableContext
                  items={getFilteredTickets("in_progress").map((t) => t._id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-2">
                    {getFilteredTickets("in_progress").map((ticket) => (
                      <DraggableTicketCard
                        key={ticket._id}
                        ticket={ticket}
                        onClick={() => setSelectedTicket(ticket)}
                      />
                    ))}
                  </div>
                </SortableContext>
              </CardContent>
            </Card>
          </DroppableColumn>

          {/* Completed Column */}
          <DroppableColumn id="completed">
            <Card className="h-full bg-white dark:bg-black border border-gray-200 dark:border-gray-800 rounded-sm">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-semibold text-black dark:text-white">
                    Completed
                  </CardTitle>
                  <Badge variant="outline" className="bg-white dark:bg-black border-gray-200 dark:border-gray-800 text-black dark:text-white rounded-sm">
                    {getFilteredTickets("completed").length}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 h-[calc(100vh-280px)] overflow-y-auto p-2">
                <SortableContext
                  items={getFilteredTickets("completed").map((t) => t._id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-2">
                    {getFilteredTickets("completed").map((ticket) => (
                      <DraggableTicketCard
                        key={ticket._id}
                        ticket={ticket}
                        onClick={() => setSelectedTicket(ticket)}
                      />
                    ))}
                  </div>
                </SortableContext>
              </CardContent>
            </Card>
          </DroppableColumn>
        </div>

        {/* Drag Overlay */}
        {activeTicket && (
          <DragOverlay>
            <Card className="bg-white dark:bg-black border border-gray-200 dark:border-gray-800 rounded-sm scale-105">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-medium text-sm line-clamp-2 text-black dark:text-white">
                    {activeTicket.guestInfo.name} - Room{" "}
                    {activeTicket.roomNumber}
                  </h3>
                  <Badge
                    variant={
                      activeTicket.priority === "high"
                        ? "destructive"
                        : activeTicket.priority === "medium"
                        ? "default"
                        : "secondary"
                    }
                    className="text-xs bg-white dark:bg-black border-gray-200 dark:border-gray-800 text-black dark:text-white rounded-sm"
                  >
                    {activeTicket.priority}
                  </Badge>
                </div>
                <p className="text-xs text-black dark:text-white opacity-70 mb-3 line-clamp-2">
                  {activeTicket.messages?.[0]?.content || "No message"}
                </p>
                <div className="flex items-center justify-between text-xs text-black dark:text-white opacity-70">
                  <span>
                    {formatDistanceToNow(new Date(activeTicket.createdAt), {
                      addSuffix: true,
                    })}
                  </span>
                  <div className="flex items-center gap-1">
                    <MessageSquare className="h-3 w-3" />
                    <span>{activeTicket.messages?.length || 0}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </DragOverlay>
        )}
      </DndContext>

      {/* Ticket Detail Dialog */}
      <Dialog
        open={!!selectedTicket}
        onOpenChange={() => setSelectedTicket(null)}
      >
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-white dark:bg-black border border-gray-200 dark:border-gray-800 rounded-sm">
          {selectedTicket && (
            <>
              <DialogHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <DialogTitle className="text-xl text-black dark:text-white">
                      Ticket #{selectedTicket._id.slice(-6)}
                    </DialogTitle>
                    <p className="text-sm text-black dark:text-white opacity-70 mt-1">
                      Room {selectedTicket.roomNumber} •{" "}
                      {selectedTicket.guestInfo.name}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Select
                      value={selectedTicket.status}
                      onValueChange={(value) => {
                        handleStatusChange(selectedTicket._id, value);
                        setSelectedTicket(null);
                      }}
                    >
                      <SelectTrigger className="w-40 bg-white dark:bg-black border-gray-200 dark:border-gray-800 text-black dark:text-white rounded-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-white dark:bg-black border-gray-200 dark:border-gray-800 rounded-sm">
                        <SelectItem value="raised" className="text-black dark:text-white">New</SelectItem>
                        <SelectItem value="in_progress" className="text-black dark:text-white">In Progress</SelectItem>
                        <SelectItem value="completed" className="text-black dark:text-white">Completed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </DialogHeader>

              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-gray-100 dark:bg-gray-900 flex items-center justify-center">
                    <MessageSquare className="h-5 w-5 text-black dark:text-white" />
                  </div>
                  <div>
                    <span className="font-medium text-black dark:text-white">
                      {selectedTicket.guestInfo.name}
                    </span>
                    {selectedTicket.guestInfo.email && (
                      <p className="text-sm text-black dark:text-white opacity-70">
                        {selectedTicket.guestInfo.email}
                      </p>
                    )}
                    {selectedTicket.guestInfo.phone && (
                      <p className="text-sm text-black dark:text-white opacity-70">
                        {selectedTicket.guestInfo.phone}
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-4 max-h-96 overflow-y-auto">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-black dark:text-white">Conversation History</h4>
                    <Badge variant="outline" className="text-xs bg-white dark:bg-black border-gray-200 dark:border-gray-800 text-black dark:text-white rounded-sm">
                      {selectedTicket.messages?.length || 0} messages
                    </Badge>
                  </div>

                  <div className="space-y-3">
                    {selectedTicket.messages?.map(
                      (message: Message, index: number) => {
                        const isGuest = message.sender === "guest";
                        const isAI = message.sender === "ai_assistant";
                        const isSystem = message.sender === "system";
                        const isManager = message.sender === "manager";

                        return (
                          <div
                            key={index}
                            className={`flex ${
                              isGuest || isAI ? "justify-start" : "justify-end"
                            } mb-3`}
                          >
                            <div className="flex items-start gap-3 max-w-[85%]">
                              {/* Avatar */}
                              <div
                                className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium ${
                                  isGuest
                                    ? "bg-blue-100 text-blue-700"
                                    : isAI
                                    ? "bg-purple-100 text-purple-700"
                                    : isSystem
                                    ? "bg-gray-100 text-gray-700"
                                    : "bg-green-100 text-green-700"
                                }`}
                              >
                                {isGuest
                                  ? "👤"
                                  : isAI
                                  ? "🤖"
                                  : isSystem
                                  ? "⚙️"
                                  : "👨‍💼"}
                              </div>

                              {/* Message Content */}
                              <div
                                className={`flex-1 p-3 rounded-lg ${
                                  isGuest
                                    ? "bg-blue-50 border border-blue-200"
                                    : isAI
                                    ? "bg-purple-50 border border-purple-200"
                                    : isSystem
                                    ? "bg-gray-50 border border-gray-200"
                                    : "bg-green-50 border border-green-200"
                                }`}
                              >
                                <div className="flex items-center justify-between mb-2">
                                  <span
                                    className={`text-xs font-medium ${
                                      isGuest
                                        ? "text-blue-800"
                                        : isAI
                                        ? "text-purple-800"
                                        : isSystem
                                        ? "text-gray-800"
                                        : "text-green-800"
                                    }`}
                                  >
                                    {message.senderName}
                                  </span>
                                  <span className="text-xs text-muted-foreground">
                                    {formatDistanceToNow(
                                      new Date(
                                        message.createdAt ||
                                          message.timestamp ||
                                          new Date()
                                      ),
                                      { addSuffix: true }
                                    )}
                                  </span>
                                </div>
                                <div
                                  className={`text-sm leading-relaxed ${
                                    isGuest
                                      ? "text-blue-900"
                                      : isAI
                                      ? "text-purple-900"
                                      : isSystem
                                      ? "text-gray-900"
                                      : "text-green-900"
                                  }`}
                                >
                                  {message.content
                                    .split("\n")
                                    .map((line, i) => (
                                      <p
                                        key={i}
                                        className={i > 0 ? "mt-2" : ""}
                                      >
                                        {line.startsWith("**") &&
                                        line.endsWith("**") ? (
                                          <strong>{line.slice(2, -2)}</strong>
                                        ) : line.startsWith("- ") ? (
                                          <span className="block ml-2">
                                            • {line.slice(2)}
                                          </span>
                                        ) : (
                                          line
                                        )}
                                      </p>
                                    ))}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      }
                    )}
                  </div>

                  {selectedTicket.messages?.length === 0 && (
                    <div className="text-center py-8 text-black dark:text-white opacity-70">
                      <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No conversation history available</p>
                    </div>
                  )}
                </div>

              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Droppable Column Component
function DroppableColumn({
  id,
  children,
}: {
  id: string;
  children: React.ReactNode;
}) {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <div
      ref={setNodeRef}
      className={`flex-1 min-w-[300px] transition-all duration-200 ${
        isOver
          ? "bg-muted/30 rounded-lg ring-2 ring-primary/20 scale-[1.02]"
          : ""
      }`}
    >
      {children}
    </div>
  );
}

// Draggable Ticket Card Component
function DraggableTicketCard({
  ticket,
  onClick,
}: {
  ticket: Ticket;
  onClick: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: ticket._id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: isDragging ? "none" : transition,
    opacity: isDragging ? 0.8 : 1,
    zIndex: isDragging ? 1000 : "auto",
  };

  const categoryLabels = {
    service_fb: "Food & Beverage",
    housekeeping: "Housekeeping",
    maintenance: "Maintenance",
    porter: "Porter",
    concierge: "Concierge",
    reception: "Reception",
    general: "General",
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={onClick}
      className={`bg-white dark:bg-black border border-gray-200 dark:border-gray-800 rounded-sm p-4 cursor-grab active:cursor-grabbing transition-all duration-200 space-y-3 ${
        isDragging ? "scale-105" : ""
      }`}
    >
      {/* Category Badge */}
      {ticket.category && (
        <Badge variant="secondary" className="text-xs bg-gray-100 dark:bg-gray-900 text-black dark:text-white border-gray-200 dark:border-gray-800 rounded-sm">
          {categoryLabels[ticket.category as keyof typeof categoryLabels] ||
            ticket.category}
        </Badge>
      )}

      {/* Subject/Message */}
      {ticket.subject && (
        <p className="text-sm font-medium text-black dark:text-white line-clamp-2">
          {ticket.subject}
        </p>
      )}

      <div className="flex items-start justify-between">
        <h3 className="font-medium text-sm line-clamp-2 text-black dark:text-white">
          {ticket.guestInfo.name} - Room {ticket.roomNumber}
        </h3>
        <Badge
          variant={
            ticket.priority === "high"
              ? "destructive"
              : ticket.priority === "medium"
              ? "default"
              : "secondary"
          }
          className="text-xs bg-white dark:bg-black border-gray-200 dark:border-gray-800 text-black dark:text-white rounded-sm"
        >
          {ticket.priority}
        </Badge>
      </div>


      <div className="flex items-center justify-between text-xs text-black dark:text-white opacity-70">
        <span>
          {formatDistanceToNow(new Date(ticket.createdAt), { addSuffix: true })}
        </span>
        <div className="flex items-center gap-1">
          <MessageSquare className="h-3 w-3" />
          <span>{ticket.messages?.length || 0}</span>
        </div>
      </div>
    </div>
  );
}
