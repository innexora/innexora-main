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
  DialogDescription,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Pagination } from "@/components/ui/pagination";
import {
  Search,
  Filter,
  Calendar,
  User,
  Building2,
  Receipt,
  UtensilsCrossed,
  MessageSquare,
  DollarSign,
  Clock,
  Eye,
  ChevronLeft,
  ChevronRight,
  History,
  TrendingUp,
  Users,
  Star,
  Phone,
  Mail,
  MapPin,
  CreditCard,
} from "lucide-react";
import { apiClient } from "@/lib/api/client";
import { toast } from "sonner";
import { formatDistanceToNow, format } from "date-fns";

interface GuestHistory {
  _id: string;
  name: string;
  email?: string;
  phone: string;
  roomNumber: string;
  checkInDate: string;
  checkOutDate: string;
  actualCheckOutDate?: string;
  status: string;
  room: {
    number: string;
    type: string;
    floor: number;
    price: number;
  };
  orders: any[];
  bills: any[];
  tickets: any[];
  totalSpent: number;
  totalOrders: number;
  totalTickets: number;
  stayDuration: number;
}

interface GuestProfile {
  guest: any;
  orders: any[];
  bills: any[];
  tickets: any[];
  stats: {
    totalStays: number;
    totalSpent: number;
    totalOrders: number;
    totalTickets: number;
    averageStayDuration: number;
    favoriteRoomType: string;
    totalItemsOrdered: number;
    lastVisit: string;
    firstVisit: string;
  };
}

interface Pagination {
  current: number;
  pages: number;
  total: number;
  limit: number;
}

const statusColors = {
  checked_in:
    "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  checked_out: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  cancelled: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  no_show:
    "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  archived:
    "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
};

const statusLabels = {
  checked_in: "Checked In",
  checked_out: "Checked Out",
  cancelled: "Cancelled",
  no_show: "No Show",
  archived: "Archived",
};

export default function GuestHistoryPage() {
  const [guests, setGuests] = useState<GuestHistory[]>([]);
  const [selectedGuest, setSelectedGuest] = useState<GuestProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProfileLoading, setIsProfileLoading] = useState(false);
  const [isProfileDialogOpen, setIsProfileDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [sortBy, setSortBy] = useState("checkInDate");
  const [sortOrder, setSortOrder] = useState("desc");
  const [pagination, setPagination] = useState<Pagination>({
    current: 1,
    pages: 1,
    total: 0,
    limit: 20,
  });
  const [stats, setStats] = useState({
    totalGuests: 0,
    activeGuests: 0,
    checkedOutGuests: 0,
    totalRevenue: 0,
    totalOrders: 0,
    totalTickets: 0,
    repeatGuests: 0,
    recentActivity: [],
  });

  useEffect(() => {
    fetchGuestHistory();
    fetchStats();
  }, [
    pagination.current,
    searchTerm,
    statusFilter,
    dateFrom,
    dateTo,
    sortBy,
    sortOrder,
  ]);

  const fetchGuestHistory = async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams({
        page: pagination.current.toString(),
        limit: pagination.limit.toString(),
        sortBy,
        sortOrder,
      });

      if (searchTerm) params.append("search", searchTerm);
      if (statusFilter !== "all") params.append("status", statusFilter);
      if (dateFrom) params.append("dateFrom", dateFrom);
      if (dateTo) params.append("dateTo", dateTo);

      const response = await apiClient.get(`/guests/history?${params}`);
      setGuests(response.data.data.guests);
      setPagination(response.data.data.pagination);
    } catch (error) {
      console.error("Error fetching guest history:", error);
      toast.error("Failed to fetch guest history");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await apiClient.get("/guests/history/stats");
      setStats(response.data.data);
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  const fetchGuestProfile = async (guestId: string) => {
    try {
      setIsProfileLoading(true);
      const response = await apiClient.get(`/guests/history/${guestId}`);
      setSelectedGuest(response.data.data);
    } catch (error) {
      console.error("Error fetching guest profile:", error);
      toast.error("Failed to fetch guest profile");
    } finally {
      setIsProfileLoading(false);
    }
  };

  const handlePageChange = (newPage: number) => {
    setPagination((prev) => ({ ...prev, current: newPage }));
  };

  const handleSearch = () => {
    setPagination((prev) => ({ ...prev, current: 1 }));
    fetchGuestHistory();
  };

  const clearFilters = () => {
    setSearchTerm("");
    setStatusFilter("all");
    setDateFrom("");
    setDateTo("");
    setSortBy("checkInDate");
    setSortOrder("desc");
    setPagination((prev) => ({ ...prev, current: 1 }));
  };

  const getStatusBadge = (status: string) => {
    return (
      <Badge
        className={`${
          statusColors[status as keyof typeof statusColors]
        } rounded-sm`}
      >
        {statusLabels[status as keyof typeof statusLabels]}
      </Badge>
    );
  };

  const openGuestProfile = async (guest: GuestHistory) => {
    setIsProfileDialogOpen(true);
    await fetchGuestProfile(guest._id);
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-white dark:bg-black border border-gray-200 dark:border-gray-800 rounded-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-black dark:text-white">
              Total Guests
            </CardTitle>
            <Users className="h-4 w-4 text-black dark:text-white opacity-70" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-black dark:text-white">
              {stats.totalGuests}
            </div>
            <p className="text-xs text-black dark:text-white opacity-70">
              {stats.activeGuests} currently active
            </p>
          </CardContent>
        </Card>
        <Card className="bg-white dark:bg-black border border-gray-200 dark:border-gray-800 rounded-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-black dark:text-white">
              Total Revenue
            </CardTitle>
            <DollarSign className="h-4 w-4 text-black dark:text-white opacity-70" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-black dark:text-white">
              ₹{stats.totalRevenue}
            </div>
            <p className="text-xs text-black dark:text-white opacity-70">
              From all guest stays
            </p>
          </CardContent>
        </Card>
        <Card className="bg-white dark:bg-black border border-gray-200 dark:border-gray-800 rounded-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-black dark:text-white">
              Repeat Guests
            </CardTitle>
            <Star className="h-4 w-4 text-black dark:text-white opacity-70" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-black dark:text-white">
              {stats.repeatGuests}
            </div>
            <p className="text-xs text-black dark:text-white opacity-70">
              Multiple visits
            </p>
          </CardContent>
        </Card>
        <Card className="bg-white dark:bg-black border border-gray-200 dark:border-gray-800 rounded-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-black dark:text-white">
              Total Orders
            </CardTitle>
            <UtensilsCrossed className="h-4 w-4 text-black dark:text-white opacity-70" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-black dark:text-white">
              {stats.totalOrders}
            </div>
            <p className="text-xs text-black dark:text-white opacity-70">
              Food orders placed
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card className="bg-white dark:bg-black border border-gray-200 dark:border-gray-800 rounded-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base font-medium text-black dark:text-white">
            <Filter className="h-5 w-5" />
            Search & Filter Guests
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label className="text-black dark:text-white text-sm">
                Search
              </Label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-black dark:text-white opacity-70" />
                <Input
                  placeholder="Name, phone, email, room..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 bg-white dark:bg-black border-gray-200 dark:border-gray-800 text-black dark:text-white rounded-sm"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-black dark:text-white text-sm">
                Status
              </Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="bg-white dark:bg-black border-gray-200 dark:border-gray-800 text-black dark:text-white rounded-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-black border-gray-200 dark:border-gray-800 rounded-sm">
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="checked_in">Checked In</SelectItem>
                  <SelectItem value="checked_out">Checked Out</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                  <SelectItem value="no_show">No Show</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-black dark:text-white text-sm">
                From Date
              </Label>
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="bg-white dark:bg-black border-gray-200 dark:border-gray-800 text-black dark:text-white rounded-sm"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-black dark:text-white text-sm">
                To Date
              </Label>
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="bg-white dark:bg-black border-gray-200 dark:border-gray-800 text-black dark:text-white rounded-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label className="text-black dark:text-white text-sm">
                Sort By
              </Label>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="bg-white dark:bg-black border-gray-200 dark:border-gray-800 text-black dark:text-white rounded-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-black border-gray-200 dark:border-gray-800 rounded-sm">
                  <SelectItem value="checkInDate">Check-in Date</SelectItem>
                  <SelectItem value="name">Name</SelectItem>
                  <SelectItem value="totalSpent">Total Spent</SelectItem>
                  <SelectItem value="stayDuration">Stay Duration</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-black dark:text-white text-sm">
                Order
              </Label>
              <Select value={sortOrder} onValueChange={setSortOrder}>
                <SelectTrigger className="bg-white dark:bg-black border-gray-200 dark:border-gray-800 text-black dark:text-white rounded-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-black border-gray-200 dark:border-gray-800 rounded-sm">
                  <SelectItem value="desc">Descending</SelectItem>
                  <SelectItem value="asc">Ascending</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end gap-2">
              <Button
                onClick={handleSearch}
                className="flex-1 bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200 rounded-sm"
              >
                <Search className="h-4 w-4 mr-2" />
                Search
              </Button>
              <Button
                variant="outline"
                onClick={clearFilters}
                className="bg-white dark:bg-black border-gray-200 dark:border-gray-800 text-black dark:text-white hover:bg-gray-50 dark:hover:bg-gray-900 rounded-sm"
              >
                Clear
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Guest History List */}
      <Card className="bg-white dark:bg-black border border-gray-200 dark:border-gray-800 rounded-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base font-medium text-black dark:text-white">
            <History className="h-5 w-5" />
            Guest History ({pagination.total} guests)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {isLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black dark:border-white mx-auto"></div>
                <p className="mt-2 text-black dark:text-white opacity-70">
                  Loading guest history...
                </p>
              </div>
            ) : guests.length === 0 ? (
              <div className="text-center py-8 text-black dark:text-white opacity-70">
                No guests found matching your criteria.
              </div>
            ) : (
              <>
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
                        Check-in Date
                      </TableHead>
                      <TableHead className="text-black dark:text-white font-medium">
                        Check-out Date
                      </TableHead>
                      <TableHead className="text-black dark:text-white font-medium">
                        Duration
                      </TableHead>
                      <TableHead className="text-black dark:text-white font-medium">
                        Total Spent
                      </TableHead>
                      <TableHead className="text-right text-black dark:text-white font-medium">
                        Actions
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {guests.map((guest) => (
                      <TableRow
                        key={guest._id}
                        className="border-gray-200 dark:border-gray-800"
                      >
                        <TableCell className="font-medium text-black dark:text-white">
                          <div className="flex items-center gap-2">
                            {guest.name}
                            {guest.totalSpent > 10000 && (
                              <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 rounded-sm">
                                <Star className="h-3 w-3 mr-1" />
                                VIP
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-black dark:text-white">
                          {guest.roomNumber}
                          <div className="text-xs text-black dark:text-white opacity-70">
                            {guest.room.type}
                          </div>
                        </TableCell>
                        <TableCell className="text-black dark:text-white">
                          {format(new Date(guest.checkInDate), "MMM dd, yyyy")}
                        </TableCell>
                        <TableCell className="text-black dark:text-white">
                          {guest.actualCheckOutDate
                            ? format(
                                new Date(guest.actualCheckOutDate),
                                "MMM dd, yyyy"
                              )
                            : format(
                                new Date(guest.checkOutDate),
                                "MMM dd, yyyy"
                              )}
                        </TableCell>
                        <TableCell className="text-black dark:text-white">
                          {guest.stayDuration} nights
                        </TableCell>
                        <TableCell className="text-black dark:text-white">
                          ₹{guest.totalSpent}
                          <div className="text-xs text-black dark:text-white opacity-70">
                            {guest.totalOrders} orders, {guest.totalTickets}{" "}
                            tickets
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openGuestProfile(guest)}
                            className="h-8 w-8 text-black dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-sm"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
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
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Guest Profile Dialog */}
      <Dialog open={isProfileDialogOpen} onOpenChange={setIsProfileDialogOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto bg-white dark:bg-black border border-gray-200 dark:border-gray-800 rounded-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-medium text-black dark:text-white">
              <User className="h-5 w-5" />
              Guest Profile
            </DialogTitle>
            <DialogDescription className="text-black dark:text-white opacity-70 text-sm">
              Complete guest history and activity overview
            </DialogDescription>
          </DialogHeader>

          {isProfileLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black dark:border-white mx-auto"></div>
              <p className="mt-2 text-black dark:text-white opacity-70">
                Loading guest profile...
              </p>
            </div>
          ) : (
            selectedGuest && (
              <Tabs defaultValue="overview" className="space-y-4">
                <TabsList className="grid w-full grid-cols-4 bg-white dark:bg-black border border-gray-200 dark:border-gray-800 rounded-sm">
                  <TabsTrigger
                    value="overview"
                    className="text-black dark:text-white data-[state=active]:bg-black data-[state=active]:dark:bg-white data-[state=active]:text-white data-[state=active]:dark:text-black rounded-sm"
                  >
                    Overview
                  </TabsTrigger>
                  <TabsTrigger
                    value="orders"
                    className="text-black dark:text-white data-[state=active]:bg-black data-[state=active]:dark:bg-white data-[state=active]:text-white data-[state=active]:dark:text-black rounded-sm"
                  >
                    Orders
                  </TabsTrigger>
                  <TabsTrigger
                    value="bills"
                    className="text-black dark:text-white data-[state=active]:bg-black data-[state=active]:dark:bg-white data-[state=active]:text-white data-[state=active]:dark:text-black rounded-sm"
                  >
                    Bills
                  </TabsTrigger>
                  <TabsTrigger
                    value="tickets"
                    className="text-black dark:text-white data-[state=active]:bg-black data-[state=active]:dark:bg-white data-[state=active]:text-white data-[state=active]:dark:text-black rounded-sm"
                  >
                    Tickets
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-4">
                  {/* Guest Info */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card className="bg-white dark:bg-black border border-gray-200 dark:border-gray-800 rounded-sm">
                      <CardHeader>
                        <CardTitle className="text-base font-medium text-black dark:text-white">
                          Guest Information
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-black dark:text-white opacity-70" />
                          <span className="font-medium text-black dark:text-white">
                            {selectedGuest.guest.name}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-black dark:text-white opacity-70" />
                          <span className="text-black dark:text-white">
                            {selectedGuest.guest.phone}
                          </span>
                        </div>
                        {selectedGuest.guest.email && (
                          <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4 text-black dark:text-white opacity-70" />
                            <span className="text-black dark:text-white">
                              {selectedGuest.guest.email}
                            </span>
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-black dark:text-white opacity-70" />
                          <span className="text-black dark:text-white">
                            Room {selectedGuest.guest.roomNumber}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-black dark:text-white">
                            Status:
                          </span>
                          {getStatusBadge(selectedGuest.guest.status)}
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="bg-white dark:bg-black border border-gray-200 dark:border-gray-800 rounded-sm">
                      <CardHeader>
                        <CardTitle className="text-base font-medium text-black dark:text-white">
                          Guest Statistics
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-black dark:text-white">
                            Total Stays:
                          </span>
                          <span className="font-medium text-black dark:text-white">
                            {selectedGuest.stats.totalStays}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-black dark:text-white">
                            Total Spent:
                          </span>
                          <span className="font-medium text-black dark:text-white">
                            ₹{selectedGuest.stats.totalSpent}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-black dark:text-white">
                            Total Orders:
                          </span>
                          <span className="font-medium text-black dark:text-white">
                            {selectedGuest.stats.totalOrders}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-black dark:text-white">
                            Total Tickets:
                          </span>
                          <span className="font-medium text-black dark:text-white">
                            {selectedGuest.stats.totalTickets}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-black dark:text-white">
                            Avg Stay Duration:
                          </span>
                          <span className="font-medium text-black dark:text-white">
                            {Math.round(
                              selectedGuest.stats.averageStayDuration
                            )}{" "}
                            nights
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-black dark:text-white">
                            Favorite Room Type:
                          </span>
                          <span className="font-medium text-black dark:text-white">
                            {selectedGuest.stats.favoriteRoomType || "N/A"}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                <TabsContent value="orders" className="space-y-4">
                  <div className="border border-gray-200 dark:border-gray-800 rounded-sm bg-white dark:bg-black">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-gray-200 dark:border-gray-800">
                          <TableHead className="text-black dark:text-white font-medium">
                            Order #
                          </TableHead>
                          <TableHead className="text-black dark:text-white font-medium">
                            Date
                          </TableHead>
                          <TableHead className="text-black dark:text-white font-medium">
                            Items
                          </TableHead>
                          <TableHead className="text-black dark:text-white font-medium">
                            Amount
                          </TableHead>
                          <TableHead className="text-black dark:text-white font-medium">
                            Status
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedGuest.orders.map((order) => (
                          <TableRow
                            key={order._id}
                            className="border-gray-200 dark:border-gray-800"
                          >
                            <TableCell className="text-black dark:text-white">
                              <div className="flex items-center gap-2">
                                <UtensilsCrossed className="h-4 w-4" />#
                                {order.orderNumber}
                              </div>
                            </TableCell>
                            <TableCell className="text-black dark:text-white">
                              {format(
                                new Date(order.orderDate),
                                "MMM dd, yyyy"
                              )}
                              <div className="text-xs text-black dark:text-white opacity-70">
                                {format(new Date(order.orderDate), "HH:mm")}
                              </div>
                            </TableCell>
                            <TableCell className="text-black dark:text-white">
                              <div className="text-sm">
                                {order.items
                                  .map(
                                    (item: any) =>
                                      `${item.quantity}x ${item.food.name}`
                                  )
                                  .join(", ")}
                              </div>
                            </TableCell>
                            <TableCell className="text-black dark:text-white font-medium">
                              ₹{order.totalAmount}
                            </TableCell>
                            <TableCell>
                              <Badge className="bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200 rounded-sm">
                                {order.status}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </TabsContent>

                <TabsContent value="bills" className="space-y-4">
                  <div className="border border-gray-200 dark:border-gray-800 rounded-sm bg-white dark:bg-black">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-gray-200 dark:border-gray-800">
                          <TableHead className="text-black dark:text-white font-medium">
                            Bill #
                          </TableHead>
                          <TableHead className="text-black dark:text-white font-medium">
                            Date
                          </TableHead>
                          <TableHead className="text-black dark:text-white font-medium">
                            Items
                          </TableHead>
                          <TableHead className="text-black dark:text-white font-medium">
                            Total
                          </TableHead>
                          <TableHead className="text-black dark:text-white font-medium">
                            Balance
                          </TableHead>
                          <TableHead className="text-black dark:text-white font-medium">
                            Status
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedGuest.bills.map((bill) => (
                          <TableRow
                            key={bill._id}
                            className="border-gray-200 dark:border-gray-800"
                          >
                            <TableCell className="text-black dark:text-white">
                              <div className="flex items-center gap-2">
                                <Receipt className="h-4 w-4" />#
                                {bill.billNumber}
                              </div>
                            </TableCell>
                            <TableCell className="text-black dark:text-white">
                              {format(new Date(bill.createdAt), "MMM dd, yyyy")}
                            </TableCell>
                            <TableCell className="text-black dark:text-white">
                              {bill.items.length} items
                            </TableCell>
                            <TableCell className="text-black dark:text-white font-medium">
                              ₹{bill.total}
                            </TableCell>
                            <TableCell className="text-black dark:text-white">
                              ₹{bill.balance}
                            </TableCell>
                            <TableCell>
                              <Badge className="bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200 rounded-sm">
                                {bill.status}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </TabsContent>

                <TabsContent value="tickets" className="space-y-4">
                  <div className="border border-gray-200 dark:border-gray-800 rounded-sm bg-white dark:bg-black">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-gray-200 dark:border-gray-800">
                          <TableHead className="text-black dark:text-white font-medium">
                            Subject
                          </TableHead>
                          <TableHead className="text-black dark:text-white font-medium">
                            Room
                          </TableHead>
                          <TableHead className="text-black dark:text-white font-medium">
                            Created
                          </TableHead>
                          <TableHead className="text-black dark:text-white font-medium">
                            Priority
                          </TableHead>
                          <TableHead className="text-black dark:text-white font-medium">
                            Status
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedGuest.tickets.map((ticket) => (
                          <TableRow
                            key={ticket._id}
                            className="border-gray-200 dark:border-gray-800"
                          >
                            <TableCell className="text-black dark:text-white">
                              <div className="flex items-center gap-2">
                                <MessageSquare className="h-4 w-4" />
                                {ticket.subject}
                              </div>
                              {ticket.description && (
                                <div className="text-xs text-black dark:text-white opacity-70 mt-1">
                                  {ticket.description}
                                </div>
                              )}
                            </TableCell>
                            <TableCell className="text-black dark:text-white">
                              {ticket.roomNumber}
                            </TableCell>
                            <TableCell className="text-black dark:text-white">
                              {format(
                                new Date(ticket.createdAt),
                                "MMM dd, yyyy"
                              )}
                              <div className="text-xs text-black dark:text-white opacity-70">
                                {format(new Date(ticket.createdAt), "HH:mm")}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge className="bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200 rounded-sm">
                                {ticket.priority}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge className="bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200 rounded-sm">
                                {ticket.status}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </TabsContent>
              </Tabs>
            )
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
