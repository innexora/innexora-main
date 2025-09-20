"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { Pagination } from "@/components/ui/pagination";
import {
  UserCheck,
  UserX,
  Plus,
  Search,
  Calendar,
  Phone,
  Mail,
  MapPin,
  Clock,
  Building2,
  Eye,
  Edit,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Filter,
  CalendarCheck,
  TrendingUp,
  Activity,
} from "lucide-react";
import { apiClient } from "@/lib/api/client";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

interface Guest {
  _id: string;
  name: string;
  email?: string;
  phone: string;
  idType: string;
  idNumber: string;
  checkInDate: string;
  checkOutDate: string;
  actualCheckOutDate?: string;
  roomNumber: string;
  numberOfGuests: number;
  status: "checked_in" | "checked_out" | "cancelled" | "no_show";
  specialRequests?: string;
  notes?: string;
  room: {
    _id: string;
    number: string;
    type: string;
    floor: number;
    price: number;
  };
  stayDuration: number;
}

interface Room {
  _id: string;
  number: string;
  type: string;
  floor: number;
  price: number;
  status: "available" | "occupied" | "maintenance" | "cleaning";
  capacity: number;
}

interface CheckInForm {
  name: string;
  email: string;
  phone: string;
  idType: string;
  idNumber: string;
  checkInDate: string;
  checkOutDate: string;
  numberOfGuests: number;
  roomId: string;
  specialRequests: string;
  address: {
    street: string;
    city: string;
    state: string;
    country: string;
    postalCode: string;
  };
  emergencyContact: {
    name: string;
    phone: string;
    relationship: string;
  };
}

export default function GuestsPage() {
  const [guests, setGuests] = useState<Guest[]>([]);
  const [pagination, setPagination] = useState({
    current: 1,
    pages: 1,
    total: 0,
    limit: 20,
  });
  const [availableRooms, setAvailableRooms] = useState<Room[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isCheckInDialogOpen, setIsCheckInDialogOpen] = useState(false);
  const [selectedGuest, setSelectedGuest] = useState<Guest | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [stats, setStats] = useState({
    totalGuests: 0,
    activeGuests: 0,
    checkedInToday: 0,
    checkingOutToday: 0,
    avgStayDuration: 0,
    checkedOutTotal: 0,
  });

  const [checkInForm, setCheckInForm] = useState<CheckInForm>({
    name: "",
    email: "",
    phone: "",
    idType: "passport",
    idNumber: "",
    checkInDate: new Date().toISOString().split("T")[0],
    checkOutDate: new Date(Date.now() + 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0],
    numberOfGuests: 1,
    roomId: "",
    specialRequests: "",
    address: {
      street: "",
      city: "",
      state: "",
      country: "",
      postalCode: "",
    },
    emergencyContact: {
      name: "",
      phone: "",
      relationship: "",
    },
  });

  useEffect(() => {
    fetchGuests(pagination.current, searchTerm, "checked_in");
    fetchAvailableRooms();
    fetchStats();
  }, [pagination.current, searchTerm]);

  // Fetch guests on component mount and when search term changes

  const fetchGuests = async (
    page = 1,
    search = searchTerm,
    status = "checked_in"
  ) => {
    try {
      setIsLoading(true);

      const params = new URLSearchParams({
        page: page.toString(),
        limit: "20",
        ...(search && { search }),
        ...(status !== "all" && { status }),
      });

      const response = await apiClient.get(`/guests?${params.toString()}`);

      // Handle both response formats for backward compatibility
      const guestsData = response.data.data || [];
      const paginationData = response.data.pagination;

      setGuests(guestsData);

      if (paginationData) {
        setPagination(paginationData);
      } else {
        // Fallback for old API response
        setPagination({
          current: 1,
          pages: 1,
          total: guestsData.length,
          limit: 20,
        });
      }
    } catch (error) {
      console.error("Error fetching guests:", error);
      toast.error("Failed to fetch guests");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAvailableRooms = async () => {
    try {
      const response = await apiClient.get("/rooms");
      setAvailableRooms(
        response.data.data.filter((room: Room) => room.status === "available")
      );
    } catch (error) {
      console.error("Error fetching rooms:", error);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await apiClient.get("/guests/stats");
      setStats(response.data.data);
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  const fetchGuestHistory = async () => {
    try {
      const response = await apiClient.get("/guests/history");
      return response.data.data || [];
    } catch (error) {
      console.error("Error fetching guest history:", error);
      return [];
    }
  };

  const handleCheckIn = async () => {
    try {
      const response = await apiClient.post("/guests/checkin", checkInForm);
      const newGuestData = response.data.data;

      // The backend returns { guest, bill } - we need just the guest
      const newGuest = newGuestData.guest || newGuestData;

      // Add the new guest to the existing list instead of refetching all
      setGuests((prevGuests) => [...prevGuests, newGuest]);

      toast.success("Guest checked in successfully!");
      setIsCheckInDialogOpen(false);
      resetCheckInForm();
      fetchAvailableRooms();
      fetchStats();
    } catch (error: any) {
      console.error("Error checking in guest:", error);
      toast.error(error.response?.data?.message || "Failed to check in guest");
    }
  };

  const handleCheckOut = async (guestId: string) => {
    try {
      await apiClient.put(`/guests/${guestId}/checkout`, {
        checkedOutBy: "Manager", // This should come from user context
      });
      toast.success("Guest checked out successfully!");
      fetchGuests(pagination.current, searchTerm, "checked_in");
      fetchAvailableRooms();
      fetchStats();
    } catch (error: any) {
      // Handle bill payment validation errors with detailed information
      if (error.response?.status === 400 && error.response?.data?.billDetails) {
        const billDetails = error.response.data.billDetails;

        // Show simplified toast with bill information
        toast.error(
          `Cannot checkout: Outstanding balance ₹${billDetails.balanceAmount} (Bill #${billDetails.billNumber})`,
          {
            duration: 6000,
          }
        );
      } else if (error.response?.status === 400) {
        // Handle 400 errors without billDetails
        toast.error(
          error.response?.data?.message ||
            "Cannot checkout guest - payment required"
        );
      } else {
        // Handle other types of errors
        toast.error(
          error.response?.data?.message || "Failed to check out guest"
        );
      }
    }
  };

  const resetCheckInForm = () => {
    setCheckInForm({
      name: "",
      email: "",
      phone: "",
      idType: "passport",
      idNumber: "",
      checkInDate: new Date().toISOString().split("T")[0],
      checkOutDate: new Date(Date.now() + 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0],
      numberOfGuests: 1,
      roomId: "",
      specialRequests: "",
      address: {
        street: "",
        city: "",
        state: "",
        country: "",
        postalCode: "",
      },
      emergencyContact: {
        name: "",
        phone: "",
        relationship: "",
      },
    });
  };

  const clearFilters = () => {
    setSearchTerm("");
  };

  // Handle search and pagination
  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setPagination((prev) => ({ ...prev, current: 1 }));
  };

  const handlePageChange = (page: number) => {
    setPagination((prev) => ({ ...prev, current: page }));
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "checked_in":
        return (
          <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 rounded-sm">
            Checked In
          </Badge>
        );
      case "checked_out":
        return (
          <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 rounded-sm">
            Checked Out
          </Badge>
        );
      case "cancelled":
        return (
          <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 rounded-sm">
            Cancelled
          </Badge>
        );
      case "no_show":
        return (
          <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 rounded-sm">
            No Show
          </Badge>
        );
      default:
        return (
          <Badge className="bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200 rounded-sm">
            {status}
          </Badge>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-white dark:bg-black border border-gray-200 dark:border-gray-800 rounded-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-black dark:text-white">
              Active Guests
            </CardTitle>
            <UserCheck className="h-4 w-4 text-black dark:text-white opacity-70" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-medium text-green-600 dark:text-green-400">
              {stats.activeGuests}
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white dark:bg-black border border-gray-200 dark:border-gray-800 rounded-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-black dark:text-white">
              Checking Out Today
            </CardTitle>
            <UserX className="h-4 w-4 text-black dark:text-white opacity-70" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-medium text-orange-600 dark:text-orange-400">
              {stats.checkingOutToday || 0}
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white dark:bg-black border border-gray-200 dark:border-gray-800 rounded-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-black dark:text-white">
              Checked In Today
            </CardTitle>
            <CalendarCheck className="h-4 w-4 text-black dark:text-white opacity-70" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-medium text-black dark:text-white">
              {stats.checkedInToday}
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white dark:bg-black border border-gray-200 dark:border-gray-800 rounded-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-black dark:text-white">
              Avg. Stay
            </CardTitle>
            <Activity className="h-4 w-4 text-black dark:text-white opacity-70" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-medium text-black dark:text-white">
              {stats.avgStayDuration} days
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
              placeholder="Search guests..."
              value={searchTerm}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-8 bg-white dark:bg-black border-gray-200 dark:border-gray-800 text-black dark:text-white rounded-sm"
            />
          </div>
        </div>

        <Dialog
          open={isCheckInDialogOpen}
          onOpenChange={setIsCheckInDialogOpen}
        >
          <DialogTrigger asChild>
            <Button className="bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200 rounded-sm">
              <Plus className="mr-2 h-4 w-4" />
              Check In Guest
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white dark:bg-black border border-gray-200 dark:border-gray-800 rounded-sm">
            <DialogHeader>
              <DialogTitle className="text-black dark:text-white text-base font-medium">
                Check In New Guest
              </DialogTitle>
              <DialogDescription className="text-black dark:text-white opacity-70 text-sm">
                Fill in the guest details to complete check-in process.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label
                    htmlFor="name"
                    className="text-black dark:text-white text-sm"
                  >
                    Full Name *
                  </Label>
                  <Input
                    id="name"
                    value={checkInForm.name}
                    onChange={(e) =>
                      setCheckInForm({ ...checkInForm, name: e.target.value })
                    }
                    placeholder="Enter full name"
                    className="bg-white dark:bg-black border-gray-200 dark:border-gray-800 text-black dark:text-white rounded-sm"
                  />
                </div>
                <div className="space-y-2">
                  <Label
                    htmlFor="phone"
                    className="text-black dark:text-white text-sm"
                  >
                    Phone Number *
                  </Label>
                  <Input
                    id="phone"
                    value={checkInForm.phone}
                    onChange={(e) =>
                      setCheckInForm({ ...checkInForm, phone: e.target.value })
                    }
                    placeholder="Enter phone number"
                    className="bg-white dark:bg-black border-gray-200 dark:border-gray-800 text-black dark:text-white rounded-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label
                    htmlFor="email"
                    className="text-black dark:text-white text-sm"
                  >
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={checkInForm.email}
                    onChange={(e) =>
                      setCheckInForm({ ...checkInForm, email: e.target.value })
                    }
                    placeholder="Enter email address"
                    className="bg-white dark:bg-black border-gray-200 dark:border-gray-800 text-black dark:text-white rounded-sm"
                  />
                </div>
                <div className="space-y-2">
                  <Label
                    htmlFor="numberOfGuests"
                    className="text-black dark:text-white text-sm"
                  >
                    Number of Guests *
                  </Label>
                  <Input
                    id="numberOfGuests"
                    type="number"
                    min="1"
                    value={checkInForm.numberOfGuests}
                    onChange={(e) =>
                      setCheckInForm({
                        ...checkInForm,
                        numberOfGuests: parseInt(e.target.value),
                      })
                    }
                    className="bg-white dark:bg-black border-gray-200 dark:border-gray-800 text-black dark:text-white rounded-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label
                    htmlFor="idType"
                    className="text-black dark:text-white text-sm"
                  >
                    ID Type *
                  </Label>
                  <Select
                    value={checkInForm.idType}
                    onValueChange={(value) =>
                      setCheckInForm({ ...checkInForm, idType: value })
                    }
                  >
                    <SelectTrigger className="bg-white dark:bg-black border-gray-200 dark:border-gray-800 text-black dark:text-white rounded-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white dark:bg-black border-gray-200 dark:border-gray-800 rounded-sm">
                      <SelectItem value="passport">Passport</SelectItem>
                      <SelectItem value="driving_license">
                        Driving License
                      </SelectItem>
                      <SelectItem value="national_id">National ID</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label
                    htmlFor="idNumber"
                    className="text-black dark:text-white text-sm"
                  >
                    ID Number *
                  </Label>
                  <Input
                    id="idNumber"
                    value={checkInForm.idNumber}
                    onChange={(e) =>
                      setCheckInForm({
                        ...checkInForm,
                        idNumber: e.target.value,
                      })
                    }
                    placeholder="Enter ID number"
                    className="bg-white dark:bg-black border-gray-200 dark:border-gray-800 text-black dark:text-white rounded-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label
                    htmlFor="checkInDate"
                    className="text-black dark:text-white text-sm"
                  >
                    Check-in Date *
                  </Label>
                  <Input
                    id="checkInDate"
                    type="date"
                    value={checkInForm.checkInDate}
                    onChange={(e) =>
                      setCheckInForm({
                        ...checkInForm,
                        checkInDate: e.target.value,
                      })
                    }
                    className="bg-white dark:bg-black border-gray-200 dark:border-gray-800 text-black dark:text-white rounded-sm"
                  />
                </div>
                <div className="space-y-2">
                  <Label
                    htmlFor="checkOutDate"
                    className="text-black dark:text-white text-sm"
                  >
                    Check-out Date *
                  </Label>
                  <Input
                    id="checkOutDate"
                    type="date"
                    value={checkInForm.checkOutDate}
                    onChange={(e) =>
                      setCheckInForm({
                        ...checkInForm,
                        checkOutDate: e.target.value,
                      })
                    }
                    className="bg-white dark:bg-black border-gray-200 dark:border-gray-800 text-black dark:text-white rounded-sm"
                  />
                </div>
                <div className="space-y-2">
                  <Label
                    htmlFor="roomId"
                    className="text-black dark:text-white text-sm"
                  >
                    Room *
                  </Label>
                  <Select
                    value={checkInForm.roomId}
                    onValueChange={(value) =>
                      setCheckInForm({ ...checkInForm, roomId: value })
                    }
                  >
                    <SelectTrigger className="bg-white dark:bg-black border-gray-200 dark:border-gray-800 text-black dark:text-white rounded-sm">
                      <SelectValue placeholder="Select room" />
                    </SelectTrigger>
                    <SelectContent className="bg-white dark:bg-black border-gray-200 dark:border-gray-800 rounded-sm">
                      {availableRooms.map((room) => (
                        <SelectItem key={room._id} value={room._id}>
                          Room {room.number} - {room.type} (₹{room.price}/night)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="specialRequests"
                  className="text-black dark:text-white text-sm"
                >
                  Special Requests
                </Label>
                <Textarea
                  id="specialRequests"
                  value={checkInForm.specialRequests}
                  onChange={(e) =>
                    setCheckInForm({
                      ...checkInForm,
                      specialRequests: e.target.value,
                    })
                  }
                  placeholder="Any special requests or notes..."
                  className="bg-white dark:bg-black border-gray-200 dark:border-gray-800 text-black dark:text-white rounded-sm"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsCheckInDialogOpen(false)}
                className="bg-white dark:bg-black border-gray-200 dark:border-gray-800 text-black dark:text-white hover:bg-gray-50 dark:hover:bg-gray-900 rounded-sm"
              >
                Cancel
              </Button>
              <Button
                onClick={handleCheckIn}
                disabled={isLoading}
                className="bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200 rounded-sm"
              >
                {isLoading ? "Checking In..." : "Check In Guest"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Guests List */}
      <Card className="bg-white dark:bg-black border border-gray-200 dark:border-gray-800 rounded-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base font-medium text-black dark:text-white">
            <UserCheck className="h-5 w-5" />
            Active Guests ({pagination.total} total)
          </CardTitle>
          <CardDescription className="text-sm text-black dark:text-white opacity-70">
            Manage checked-in guests, view details, and process check-outs
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="border-gray-200 dark:border-gray-800">
                <TableHead className="text-black dark:text-white font-medium">
                  Guest Name
                </TableHead>
                <TableHead className="text-black dark:text-white font-medium">
                  Room
                </TableHead>
                <TableHead className="text-black dark:text-white font-medium">
                  Phone
                </TableHead>
                <TableHead className="text-black dark:text-white font-medium">
                  Check-in
                </TableHead>
                <TableHead className="text-black dark:text-white font-medium">
                  Duration
                </TableHead>
                <TableHead className="text-black dark:text-white font-medium">
                  Status
                </TableHead>
                <TableHead className="text-right text-black dark:text-white font-medium">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow className="border-gray-200 dark:border-gray-800">
                  <TableCell
                    colSpan={7}
                    className="text-center py-8 text-black dark:text-white"
                  >
                    Loading guests...
                  </TableCell>
                </TableRow>
              ) : guests.length === 0 ? (
                <TableRow className="border-gray-200 dark:border-gray-800">
                  <TableCell
                    colSpan={7}
                    className="text-center py-8 text-black dark:text-white opacity-70"
                  >
                    No guests found matching your criteria.
                  </TableCell>
                </TableRow>
              ) : (
                guests.map((guest: Guest) => (
                  <TableRow
                    key={guest._id}
                    className="border-gray-200 dark:border-gray-800"
                  >
                    <TableCell className="font-medium text-black dark:text-white">
                      {guest.name}
                    </TableCell>
                    <TableCell className="text-black dark:text-white">
                      {guest.roomNumber}
                    </TableCell>
                    <TableCell className="text-black dark:text-white">
                      {guest.phone}
                    </TableCell>
                    <TableCell className="text-black dark:text-white">
                      {formatDistanceToNow(new Date(guest.checkInDate), {
                        addSuffix: true,
                      })}
                    </TableCell>
                    <TableCell className="text-black dark:text-white">
                      {guest.stayDuration} nights
                    </TableCell>
                    <TableCell>{getStatusBadge(guest.status)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedGuest(guest);
                            setIsViewDialogOpen(true);
                          }}
                          className="h-8 w-8 text-black dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-sm"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {guest.status === "checked_in" && (
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => handleCheckOut(guest._id)}
                            className="bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200 rounded-sm"
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Check Out
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
            itemName="guests"
          />
        </CardContent>
      </Card>

      {/* Guest Details Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-2xl bg-white dark:bg-black border border-gray-200 dark:border-gray-800 rounded-sm">
          <DialogHeader>
            <DialogTitle className="text-black dark:text-white text-base font-medium">
              Guest Details
            </DialogTitle>
          </DialogHeader>
          {selectedGuest && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-black dark:text-white">
                    Name
                  </Label>
                  <p className="text-sm text-black dark:text-white">
                    {selectedGuest.name}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-black dark:text-white">
                    Status
                  </Label>
                  <div className="mt-1">
                    {getStatusBadge(selectedGuest.status)}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-black dark:text-white">
                    Room
                  </Label>
                  <p className="text-sm text-black dark:text-white">
                    Room {selectedGuest.roomNumber} - {selectedGuest.room.type}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-black dark:text-white">
                    Phone
                  </Label>
                  <p className="text-sm text-black dark:text-white">
                    {selectedGuest.phone}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-black dark:text-white">
                    Check-in Date
                  </Label>
                  <p className="text-sm text-black dark:text-white">
                    {new Date(selectedGuest.checkInDate).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-black dark:text-white">
                    Check-out Date
                  </Label>
                  <p className="text-sm text-black dark:text-white">
                    {new Date(selectedGuest.checkOutDate).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-black dark:text-white">
                    ID Type
                  </Label>
                  <p className="text-sm capitalize text-black dark:text-white">
                    {selectedGuest.idType.replace("_", " ")}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-black dark:text-white">
                    ID Number
                  </Label>
                  <p className="text-sm text-black dark:text-white">
                    {selectedGuest.idNumber}
                  </p>
                </div>
              </div>

              {selectedGuest.specialRequests && (
                <div>
                  <Label className="text-sm font-medium text-black dark:text-white">
                    Special Requests
                  </Label>
                  <p className="text-sm text-black dark:text-white">
                    {selectedGuest.specialRequests}
                  </p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
