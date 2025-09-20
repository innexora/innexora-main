"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Pagination } from "@/components/ui/pagination";
import {
  Hotel,
  Plus,
  Pencil,
  Trash2,
  Search,
  Filter,
  QrCode,
  Building,
  Users,
  TrendingUp,
  Bed,
} from "lucide-react";
import { toast } from "sonner";
import { apiClient } from "@/lib/api/client";
import { useAuthStore } from "@/store/auth-store";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { QRCodeDisplay } from "@/components/ui/qr-code-display";

interface Room {
  id: string;
  _id: string;
  number: string;
  roomAccessId: string;
  type: string;
  floor: number;
  price: number;
  capacity: number;
  status: "available" | "occupied" | "maintenance" | "cleaning";
  description?: string;
}

export default function RoomsPage() {
  const { user } = useAuthStore();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isQRDialogOpen, setIsQRDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [roomToDelete, setRoomToDelete] = useState<Room | null>(null);
  const [selectedRoomForQR, setSelectedRoomForQR] = useState<Room | null>(null);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [pagination, setPagination] = useState({
    current: 1,
    pages: 1,
    total: 0,
    limit: 20,
  });
  const [stats, setStats] = useState({
    totalRooms: 0,
    availableRooms: 0,
    occupiedRooms: 0,
    occupancyRate: "0%",
    avgCapacity: 0,
  });
  const [formData, setFormData] = useState({
    number: "",
    type: "single",
    floor: 1,
    price: 0,
    capacity: 2,
    status: "available" as Room["status"],
    description: "",
  });

  const fetchRooms = async (
    page = 1,
    search = searchTerm,
    status = statusFilter,
    type = typeFilter
  ) => {
    try {
      console.log("Fetching rooms...");
      setIsLoading(true);

      const params = new URLSearchParams({
        page: page.toString(),
        limit: "20",
        ...(search && { search }),
        ...(status !== "all" && { status }),
        ...(type !== "all" && { type }),
      });

      const response = await apiClient.get(`/rooms?${params.toString()}`);
      console.log("Rooms API Response:", response.data);

      // Handle the expected response format: { success: true, data: Room[], count: number, pagination: {...} }
      if (
        response.data &&
        response.data.success &&
        Array.isArray(response.data.data)
      ) {
        const roomsData = response.data.data;
        console.log("Rooms data:", roomsData);

        // Transform the data to match our frontend Room interface
        const processedRooms = roomsData.map((room: any) => ({
          ...room,
          id: room._id, // Map _id to id
          _id: room._id, // Keep _id for backward compatibility
          // Ensure all required fields have default values if missing
          number: room.number || "",
          roomAccessId: room.roomAccessId || "",
          type: room.type || "single",
          floor: room.floor || 1,
          price: room.price || 0,
          capacity: room.capacity || 2,
          amenities: Array.isArray(room.amenities) ? room.amenities : [],
          status: room.status || "available",
          description: room.description || "",
        }));

        console.log("Processed rooms:", processedRooms);
        setRooms(processedRooms);

        // Update pagination from server response
        if (response.data.pagination) {
          setPagination(response.data.pagination);
        }
      } else {
        console.error("Unexpected API response format:", response.data);
        setRooms([]);
      }
    } catch (error) {
      console.error("Failed to fetch rooms:", error);
      toast.error("Failed to load rooms");
      setRooms([]);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await apiClient.get("/rooms/stats");
      if (response.data.success) {
        setStats(response.data.data);
      }
    } catch (error) {
      console.error("Failed to fetch room stats:", error);
    }
  };

  useEffect(() => {
    fetchRooms(pagination.current, searchTerm, statusFilter, typeFilter);
  }, [pagination.current, searchTerm, statusFilter, typeFilter]);

  useEffect(() => {
    fetchStats();
  }, []);

  const handleDelete = async (id: string) => {
    if (!canDelete) {
      toast.error("You don't have permission to delete rooms");
      return;
    }

    // Find the room to show in confirmation dialog
    const room = rooms.find((r) => r.id === id);
    if (room) {
      setRoomToDelete(room);
      setIsDeleteDialogOpen(true);
    }
  };

  const confirmDelete = async () => {
    if (!roomToDelete) return;

    try {
      await apiClient.delete(`/rooms/${roomToDelete.id}`);
      setRooms(rooms.filter((room) => room.id !== roomToDelete.id));
      toast.success("Room deleted successfully");
      setIsDeleteDialogOpen(false);
      setRoomToDelete(null);
    } catch (error: any) {
      // Handle business logic errors gracefully without any error propagation
      if (error.response?.status === 400) {
        const errorData = error.response?.data;

        if (errorData?.activeGuests && errorData.totalActiveGuests > 0) {
          toast.error(
            `Cannot delete room ${errorData.room.number}. ${errorData.totalActiveGuests} guest(s) are currently checked in. Please check out all guests first.`,
            { duration: 6000 }
          );
        } else if (
          errorData?.activeTickets &&
          errorData.totalActiveTickets > 0
        ) {
          toast.error(
            `Cannot delete room ${errorData.room.number}. There are ${errorData.totalActiveTickets} active ticket(s). Please resolve all tickets first.`,
            { duration: 6000 }
          );
        } else {
          // Unexpected 400 error
          console.error("Unexpected room deletion error:", error);
          toast.error(error.message || "Failed to delete room");
        }
      } else {
        // Non-400 errors are unexpected
        console.error("Failed to delete room:", error);
        toast.error(error.message || "Failed to delete room");
      }

      // Always clean up dialog state, regardless of error type
      setIsDeleteDialogOpen(false);
      setRoomToDelete(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!canEdit && !canCreate) {
      toast.error("You don't have permission to modify rooms");
      return;
    }

    if (editingRoom && !canEdit) {
      toast.error("You don't have permission to edit rooms");
      return;
    }

    if (!editingRoom && !canCreate) {
      toast.error("You don't have permission to create rooms");
      return;
    }

    try {
      // Prepare the room data with proper types
      const roomData = {
        ...formData,
        price: Number(formData.price) || 0,
        floor: Number(formData.floor) || 1,
        capacity: Number(formData.capacity) || 2,
      };

      if (editingRoom) {
        await apiClient.put(`/rooms/${editingRoom._id}`, roomData);
        toast.success("Room updated successfully");
      } else {
        // For new rooms, the backend will add the manager ID from the auth token
        const response = await apiClient.post("/rooms", roomData);

        // Check if room was reactivated or newly created
        if (response.data && response.data.reactivated) {
          toast.success(
            `Room ${formData.number} was reactivated with updated information`
          );
        } else {
          toast.success("Room created successfully");
        }
      }

      setIsDialogOpen(false);
      setEditingRoom(null);
      setFormData({
        number: "",
        type: "",
        floor: 1,
        price: 0,
        capacity: 2,
        status: "available",
        description: "",
      });
      fetchRooms();
    } catch (error) {
      console.error("Failed to save room:", error);
      toast.error("Failed to save room");
    }
  };

  const openEditDialog = (room: Room) => {
    if (!canEdit) {
      toast.error("You don't have permission to edit rooms");
      return;
    }

    setEditingRoom(room);
    setFormData({
      number: room.number,
      type: room.type,
      floor: room.floor,
      price: room.price || 0,
      capacity: room.capacity || 2,
      status: room.status,
      description: room.description || "",
    });
    setIsDialogOpen(true);
  };

  const openCreateDialog = () => {
    if (!canCreate) {
      toast.error("You don't have permission to create rooms");
      return;
    }

    setEditingRoom(null);
    setFormData({
      number: "",
      type: "single",
      floor: 1,
      price: 0,
      capacity: 2,
      status: "available",
      description: "",
    });
    setIsDialogOpen(true);
  };

  const openQRDialog = (room: Room) => {
    setSelectedRoomForQR(room);
    setIsQRDialogOpen(true);
  };

  const getStatusColor = (status: Room["status"]) => {
    switch (status) {
      case "available":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "occupied":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "maintenance":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      case "cleaning":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    }
  };

  // Update pagination and search handlers to reset to page 1
  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setPagination((prev) => ({ ...prev, current: 1 }));
  };

  const handleStatusFilterChange = (value: string) => {
    setStatusFilter(value);
    setPagination((prev) => ({ ...prev, current: 1 }));
  };

  const handleTypeFilterChange = (value: string) => {
    setTypeFilter(value);
    setPagination((prev) => ({ ...prev, current: 1 }));
  };

  const handlePageChange = (page: number) => {
    setPagination((prev) => ({ ...prev, current: page }));
  };

  const uniqueTypes = Array.from(
    new Set(rooms.map((room) => room.type))
  ).sort();

  const clearFilters = () => {
    setSearchTerm("");
    setStatusFilter("all");
    setTypeFilter("all");
    setPagination((prev) => ({ ...prev, current: 1 }));
  };

  // Permission checks
  const isAdmin = user?.role === "admin";
  const isManager = user?.role === "manager";
  const isStaff = user?.role === "staff";
  const canEdit = isAdmin || isManager;
  const canDelete = isAdmin;
  const canCreate = isAdmin || isManager;

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-white dark:bg-black border border-gray-200 dark:border-gray-800 rounded-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-black dark:text-white">
              Total Rooms
            </CardTitle>
            <Building className="h-4 w-4 text-black dark:text-white opacity-70" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-medium text-black dark:text-white">
              {stats.totalRooms}
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white dark:bg-black border border-gray-200 dark:border-gray-800 rounded-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-black dark:text-white">
              Available
            </CardTitle>
            <Bed className="h-4 w-4 text-black dark:text-white opacity-70" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-medium text-green-600 dark:text-green-400">
              {stats.availableRooms}
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white dark:bg-black border border-gray-200 dark:border-gray-800 rounded-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-black dark:text-white">
              Occupancy Rate
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-black dark:text-white opacity-70" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-medium text-black dark:text-white">
              {stats.occupancyRate}
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white dark:bg-black border border-gray-200 dark:border-gray-800 rounded-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-black dark:text-white">
              Avg. Capacity
            </CardTitle>
            <Users className="h-4 w-4 text-black dark:text-white opacity-70" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-medium text-black dark:text-white">
              {stats.avgCapacity}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Actions and Filters */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-4 flex-1">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-black dark:text-white opacity-70" />
            <Input
              placeholder="Search rooms..."
              value={searchTerm}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-8 bg-white dark:bg-black border-gray-200 dark:border-gray-800 text-black dark:text-white rounded-sm"
            />
          </div>
          <Select value={statusFilter} onValueChange={handleStatusFilterChange}>
            <SelectTrigger className="w-[180px] bg-white dark:bg-black border-gray-200 dark:border-gray-800 text-black dark:text-white rounded-sm">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent className="bg-white dark:bg-black border-gray-200 dark:border-gray-800 rounded-sm">
              <SelectItem
                value="all"
                className="text-black dark:text-white hover:bg-gray-100 dark:hover:bg-gray-900"
              >
                All Status
              </SelectItem>
              <SelectItem
                value="available"
                className="text-black dark:text-white hover:bg-gray-100 dark:hover:bg-gray-900"
              >
                Available
              </SelectItem>
              <SelectItem
                value="occupied"
                className="text-black dark:text-white hover:bg-gray-100 dark:hover:bg-gray-900"
              >
                Occupied
              </SelectItem>
              <SelectItem
                value="maintenance"
                className="text-black dark:text-white hover:bg-gray-100 dark:hover:bg-gray-900"
              >
                Maintenance
              </SelectItem>
              <SelectItem
                value="cleaning"
                className="text-black dark:text-white hover:bg-gray-100 dark:hover:bg-gray-900"
              >
                Cleaning
              </SelectItem>
            </SelectContent>
          </Select>
          <Select value={typeFilter} onValueChange={handleTypeFilterChange}>
            <SelectTrigger className="w-[180px] bg-white dark:bg-black border-gray-200 dark:border-gray-800 text-black dark:text-white rounded-sm">
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent className="bg-white dark:bg-black border-gray-200 dark:border-gray-800 rounded-sm">
              <SelectItem
                value="all"
                className="text-black dark:text-white hover:bg-gray-100 dark:hover:bg-gray-900"
              >
                All Types
              </SelectItem>
              {uniqueTypes.map((type) => (
                <SelectItem
                  key={type}
                  value={type}
                  className="text-black dark:text-white hover:bg-gray-100 dark:hover:bg-gray-900"
                >
                  {type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {canCreate && (
          <Button
            onClick={openCreateDialog}
            className="bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200 rounded-sm"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Room
          </Button>
        )}
      </div>

      <Card className="bg-white dark:bg-black border border-gray-200 dark:border-gray-800 rounded-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base font-medium text-black dark:text-white">
            <Hotel className="h-5 w-5" />
            Rooms ({pagination.total})
          </CardTitle>
          <CardDescription className="text-sm text-black dark:text-white opacity-70">
            Manage all hotel rooms, their types, and current status
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="border-gray-200 dark:border-gray-800">
                <TableHead className="text-black dark:text-white font-medium">
                  Room Number
                </TableHead>
                <TableHead className="text-black dark:text-white font-medium">
                  Type
                </TableHead>
                <TableHead className="text-black dark:text-white font-medium">
                  Floor
                </TableHead>
                <TableHead className="text-black dark:text-white font-medium">
                  Price
                </TableHead>
                <TableHead className="text-black dark:text-white font-medium">
                  Capacity
                </TableHead>
                <TableHead className="text-black dark:text-white font-medium">
                  Status
                </TableHead>
                <TableHead className="text-black dark:text-white font-medium">
                  Description
                </TableHead>
                <TableHead className="text-right text-black dark:text-white font-medium">
                  {isStaff ? "QR Code" : "Actions"}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow className="border-gray-200 dark:border-gray-800">
                  <TableCell
                    colSpan={8}
                    className="text-center py-8 text-black dark:text-white"
                  >
                    Loading rooms...
                  </TableCell>
                </TableRow>
              ) : rooms.length === 0 ? (
                <TableRow className="border-gray-200 dark:border-gray-800">
                  <TableCell
                    colSpan={8}
                    className="text-center py-8 text-black dark:text-white opacity-70"
                  >
                    {rooms.length === 0
                      ? "No rooms found. Add your first room to get started."
                      : "No rooms match your current filters."}
                  </TableCell>
                </TableRow>
              ) : (
                rooms.map((room: Room) => (
                  <TableRow
                    key={room._id}
                    className="border-gray-200 dark:border-gray-800"
                  >
                    <TableCell className="font-medium text-black dark:text-white">
                      {room.number}
                    </TableCell>
                    <TableCell className="text-black dark:text-white">
                      {room.type}
                    </TableCell>
                    <TableCell className="text-black dark:text-white">
                      {room.floor}
                    </TableCell>
                    <TableCell className="text-black dark:text-white">
                      ${room.price?.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-black dark:text-white">
                      {room.capacity}
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={`${getStatusColor(
                          room.status
                        )} rounded-sm text-xs`}
                      >
                        {room.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-xs truncate text-black dark:text-white">
                      {room.description || "-"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openQRDialog(room)}
                          title="View QR Code"
                          className="h-8 w-8 text-black dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-sm"
                        >
                          <QrCode className="h-4 w-4" />
                        </Button>
                        {canEdit && room.status !== "occupied" && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEditDialog(room)}
                            title="Edit Room"
                            className="h-8 w-8 text-black dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-sm"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                        )}
                        {canDelete && room.status !== "occupied" && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(room._id)}
                            title="Delete Room"
                            className="h-8 w-8 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950 rounded-sm"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {/* Pagination */}
          <Pagination
            currentPage={pagination.current}
            totalPages={pagination.pages}
            totalItems={pagination.total}
            itemsPerPage={pagination.limit}
            onPageChange={handlePageChange}
            itemName="rooms"
          />
        </CardContent>
      </Card>

      {/* Add/Edit Room Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingRoom ? "Edit Room" : "Add New Room"}
            </DialogTitle>
            <DialogDescription>
              {editingRoom
                ? "Update room information"
                : "Add a new room to the hotel"}
              {editingRoom && isManager && (
                <div className="mt-2 text-sm text-yellow-600 dark:text-yellow-400">
                  Note: Room number cannot be changed by managers.
                </div>
              )}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="number">Room Number</Label>
                <Input
                  id="number"
                  value={formData.number}
                  onChange={(e) =>
                    setFormData({ ...formData, number: e.target.value })
                  }
                  disabled={!!editingRoom && isManager}
                  required
                />
              </div>
              <div>
                <Label htmlFor="type">Room Type</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) =>
                    setFormData({ ...formData, type: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="single">Single</SelectItem>
                    <SelectItem value="double">Double</SelectItem>
                    <SelectItem value="triple">Triple</SelectItem>
                    <SelectItem value="suite">Suite</SelectItem>
                    <SelectItem value="deluxe">Deluxe</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="floor">Floor</Label>
                <Input
                  id="floor"
                  type="number"
                  value={formData.floor}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      floor: parseInt(e.target.value) || 1,
                    })
                  }
                  min="1"
                />
              </div>
              <div>
                <Label htmlFor="price">Price per night ($)</Label>
                <Input
                  id="price"
                  type="number"
                  value={formData.price}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      price: parseFloat(e.target.value) || 0,
                    })
                  }
                  min="0"
                  step="0.01"
                  placeholder="e.g., 99.99"
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="capacity">Capacity</Label>
                <Input
                  id="capacity"
                  type="number"
                  value={formData.capacity}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      capacity: parseInt(e.target.value) || 1,
                    })
                  }
                  min="1"
                  max="10"
                  required
                />
              </div>
              <div>
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value: Room["status"]) =>
                    setFormData({ ...formData, status: value })
                  }
                  disabled={editingRoom?.status === "occupied"}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="available">Available</SelectItem>
                    {/* Occupied status removed - should only be set automatically by guest check-in */}
                    <SelectItem value="maintenance">Maintenance</SelectItem>
                    <SelectItem value="cleaning">Cleaning</SelectItem>
                  </SelectContent>
                </Select>
                {editingRoom?.status === "occupied" && (
                  <p className="text-xs text-gray-500 mt-1">
                    Cannot change status while room is occupied by a guest
                  </p>
                )}
              </div>
            </div>
            <div>
              <Label htmlFor="description">Description (Optional)</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Room description or notes"
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit">
                {editingRoom ? "Update Room" : "Add Room"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* QR Code Dialog */}
      <Dialog open={isQRDialogOpen} onOpenChange={setIsQRDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <QrCode className="h-5 w-5" />
              Room QR Code
            </DialogTitle>
            <DialogDescription>
              {selectedRoomForQR &&
                `QR code for Room ${selectedRoomForQR.number} - ${selectedRoomForQR.type}`}
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-center">
            {selectedRoomForQR && (
              <QRCodeDisplay
                roomAccessId={selectedRoomForQR.roomAccessId}
                roomNumber={selectedRoomForQR.number}
                roomType={selectedRoomForQR.type}
                onClose={() => setIsQRDialogOpen(false)}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="bg-white dark:bg-black border border-gray-200 dark:border-gray-800 rounded-sm">
          <DialogHeader>
            <DialogTitle className="text-black dark:text-white">
              Confirm Room Deletion
            </DialogTitle>
            <DialogDescription className="text-black dark:text-white opacity-70">
              {roomToDelete && (
                <>
                  Are you sure you want to delete Room {roomToDelete.number}?
                  This action cannot be undone.
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
              className="bg-white dark:bg-black border-gray-200 dark:border-gray-800 text-black dark:text-white hover:bg-gray-50 dark:hover:bg-gray-900 rounded-sm"
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700 text-white rounded-sm"
            >
              Delete Room
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
