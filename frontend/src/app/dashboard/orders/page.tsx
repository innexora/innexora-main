"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
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
import { Pagination } from "@/components/ui/pagination";
import {
  Plus,
  Search,
  Clock,
  DollarSign,
  User,
  Building2,
  ChefHat,
  CheckCircle,
  XCircle,
  Eye,
  Edit,
  Receipt,
  AlertCircle,
} from "lucide-react";
import { apiClient } from "@/lib/api/client";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

interface OrderItem {
  food: {
    _id: string;
    name: string;
    price: number;
    preparationTime: number;
  };
  foodName?: string;
  quantity: number;
  price: number;
  unitPrice?: number;
  specialInstructions?: string;
}

interface Order {
  _id: string;
  orderNumber: string;
  guest: {
    _id: string;
    name: string;
    phone: string;
  };
  room: {
    _id: string;
    number: string;
  };
  items: OrderItem[];
  totalAmount: number;
  status:
    | "pending"
    | "confirmed"
    | "preparing"
    | "ready"
    | "delivered"
    | "cancelled";
  type: "room_service" | "restaurant" | "takeaway";
  orderDate: string;
  estimatedDeliveryTime?: string;
  actualDeliveryTime?: string;
  specialInstructions?: string;
  paymentStatus: "pending" | "paid" | "failed";
  createdAt: string;
  updatedAt: string;
}

interface FoodItem {
  _id: string;
  name: string;
  price: number;
  category: string;
  isAvailable: boolean;
  preparationTime: number;
}

interface Guest {
  _id: string;
  name: string;
  phone: string;
  roomNumber: string;
}

interface OrderForm {
  guestId: string;
  items: {
    foodId: string;
    quantity: number;
    specialInstructions: string;
  }[];
  type: "room_service" | "restaurant" | "takeaway";
  specialInstructions: string;
}

const statusColors = {
  pending:
    "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  confirmed: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  preparing:
    "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
  ready: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  delivered: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200",
  cancelled: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
};

const statusLabels = {
  pending: "Pending",
  confirmed: "Confirmed",
  preparing: "Preparing",
  ready: "Ready",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [foodItems, setFoodItems] = useState<FoodItem[]>([]);
  const [guests, setGuests] = useState<Guest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pages: 1,
    total: 0,
    limit: 20,
  });
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalRevenue: 0,
    pending: { count: 0, totalAmount: 0 },
    confirmed: { count: 0, totalAmount: 0 },
    preparing: { count: 0, totalAmount: 0 },
    ready: { count: 0, totalAmount: 0 },
    delivered: { count: 0, totalAmount: 0 },
    cancelled: { count: 0, totalAmount: 0 },
    todaysOrders: 0,
    todaysRevenue: 0,
    avgOrderValue: 0,
    completionRate: "0%",
    period: "today",
  });
  const [statsLoading, setStatsLoading] = useState(false);
  const [statsError, setStatsError] = useState<string | null>(null);

  const [orderForm, setOrderForm] = useState<OrderForm>({
    guestId: "",
    items: [{ foodId: "", quantity: 1, specialInstructions: "" }],
    type: "room_service",
    specialInstructions: "",
  });

  useEffect(() => {
    fetchOrders(pagination.current, searchTerm, statusFilter, typeFilter);
  }, [pagination.current, searchTerm, statusFilter, typeFilter]);

  useEffect(() => {
    fetchFoodItems();
    fetchGuests();
    fetchStats();
  }, []);

  const fetchOrders = async (
    page = 1,
    search = searchTerm,
    status = statusFilter,
    type = typeFilter
  ) => {
    try {
      console.log("Fetching orders...");
      setIsLoading(true);

      const params = new URLSearchParams({
        page: page.toString(),
        limit: "20",
        ...(search && { search }),
        ...(status !== "all" && { status }),
        ...(type !== "all" && { orderType: type }),
      });

      const response = await apiClient.get(`/orders?${params.toString()}`);
      console.log("Orders API Response:", response.data);

      // Handle the expected response format: { success: true, data: Order[], count: number, pagination: {...} }
      if (
        response.data &&
        response.data.success &&
        Array.isArray(response.data.data)
      ) {
        const ordersData = response.data.data;
        console.log("Orders data:", ordersData);

        // Transform the data to match our frontend Order interface
        const processedOrders = ordersData.map((order: any) => ({
          ...order,
          id: order._id, // Map _id to id
          _id: order._id, // Keep _id for backward compatibility
          // Ensure all required fields have default values if missing
          orderNumber: order.orderNumber || "",
          guest: order.guest || { _id: "", name: "", phone: "" },
          room: order.room || { _id: "", number: "" },
          items: Array.isArray(order.items) ? order.items : [],
          totalAmount: order.totalAmount || 0,
          status: order.status || "pending",
          type: order.type || "room_service",
          orderDate: order.orderDate || order.createdAt,
          estimatedDeliveryTime: order.estimatedDeliveryTime,
          actualDeliveryTime: order.actualDeliveryTime,
          specialInstructions: order.specialInstructions || "",
          paymentStatus: order.paymentStatus || "pending",
          createdAt: order.createdAt,
          updatedAt: order.updatedAt,
        }));

        console.log("Processed orders:", processedOrders);
        setOrders(processedOrders);

        // Update pagination from server response
        if (response.data.pagination) {
          setPagination(response.data.pagination);
        }
      } else {
        console.error("Unexpected API response format:", response.data);
        setOrders([]);
      }
    } catch (error) {
      console.error("Failed to fetch orders:", error);
      toast.error("Failed to load orders");
      setOrders([]);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchFoodItems = async () => {
    try {
      const response = await apiClient.get("/food");
      setFoodItems(
        response.data.data.filter((item: FoodItem) => item.isAvailable)
      );
    } catch (error) {
      console.error("Error fetching food items:", error);
    }
  };

  const fetchGuests = async () => {
    try {
      const response = await apiClient.get("/guests");
      setGuests(
        response.data.data.filter((guest: any) => guest.status === "checked_in")
      );
    } catch (error) {
      console.error("Error fetching guests:", error);
    }
  };

  const fetchStats = async () => {
    try {
      setStatsLoading(true);
      setStatsError(null);
      const response = await apiClient.get("/orders/stats");

      // Handle the API response structure properly
      const statsData = response.data.data;

      // Ensure all status types are present with default values
      const defaultStatus = { count: 0, totalAmount: 0 };
      setStats({
        totalOrders: statsData.totalOrders || 0,
        totalRevenue: statsData.totalRevenue || 0,
        pending: statsData.pending || defaultStatus,
        confirmed: statsData.confirmed || defaultStatus,
        preparing: statsData.preparing || defaultStatus,
        ready: statsData.ready || defaultStatus,
        delivered: statsData.delivered || defaultStatus,
        cancelled: statsData.cancelled || defaultStatus,
        todaysOrders: statsData.todaysOrders || 0,
        todaysRevenue: statsData.todaysRevenue || 0,
        avgOrderValue: statsData.avgOrderValue || 0,
        completionRate: statsData.completionRate || "0%",
        period: statsData.period || "today",
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
      setStatsError("Failed to load statistics");
      // Set default stats on error
      setStats({
        totalOrders: 0,
        totalRevenue: 0,
        pending: { count: 0, totalAmount: 0 },
        confirmed: { count: 0, totalAmount: 0 },
        preparing: { count: 0, totalAmount: 0 },
        ready: { count: 0, totalAmount: 0 },
        delivered: { count: 0, totalAmount: 0 },
        cancelled: { count: 0, totalAmount: 0 },
        todaysOrders: 0,
        todaysRevenue: 0,
        avgOrderValue: 0,
        completionRate: "0%",
        period: "today",
      });
    } finally {
      setStatsLoading(false);
    }
  };

  const handleCreateOrder = async () => {
    try {
      setIsLoading(true);
      const validItems = orderForm.items.filter(
        (item) => item.foodId && item.quantity > 0
      );
      if (validItems.length === 0) {
        toast.error("Please add at least one item to the order");
        return;
      }

      if (!orderForm.guestId) {
        toast.error("Please select a guest");
        return;
      }

      const response = await apiClient.post("/orders", {
        ...orderForm,
        items: validItems,
      });

      if (response.data.success) {
        toast.success("Order created successfully!");
        setIsCreateDialogOpen(false);
        resetOrderForm();
        fetchOrders(pagination.current, searchTerm, statusFilter, typeFilter);
        fetchStats();
      } else {
        toast.error(response.data.message || "Failed to create order");
      }
    } catch (error: any) {
      console.error("Error creating order:", error);

      // Better error handling
      let errorMessage = "Failed to create order";
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.data?.errors) {
        errorMessage = error.response.data.errors.join(", ");
      } else if (error.message) {
        errorMessage = error.message;
      }

      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateOrderStatus = async (orderId: string, status: string) => {
    try {
      await apiClient.patch(`/orders/${orderId}/status`, { status });
      toast.success("Order status updated successfully!");
      fetchOrders(pagination.current, searchTerm, statusFilter, typeFilter);
      fetchStats();
    } catch (error: any) {
      console.error("Error updating order status:", error);
      toast.error(
        error.response?.data?.message || "Failed to update order status"
      );
    }
  };

  const resetOrderForm = () => {
    setOrderForm({
      guestId: "",
      items: [{ foodId: "", quantity: 1, specialInstructions: "" }],
      type: "room_service",
      specialInstructions: "",
    });
  };

  const addOrderItem = () => {
    setOrderForm({
      ...orderForm,
      items: [
        ...orderForm.items,
        { foodId: "", quantity: 1, specialInstructions: "" },
      ],
    });
  };

  const removeOrderItem = (index: number) => {
    const newItems = orderForm.items.filter((_, i) => i !== index);
    setOrderForm({
      ...orderForm,
      items:
        newItems.length > 0
          ? newItems
          : [{ foodId: "", quantity: 1, specialInstructions: "" }],
    });
  };

  const updateOrderItem = (index: number, field: string, value: any) => {
    const newItems = [...orderForm.items];
    newItems[index] = { ...newItems[index], [field]: value };
    setOrderForm({ ...orderForm, items: newItems });
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

  const getNextStatus = (currentStatus: string) => {
    const statusFlow = {
      pending: "confirmed",
      confirmed: "preparing",
      preparing: "ready",
      ready: "delivered",
    };
    return statusFlow[currentStatus as keyof typeof statusFlow];
  };

  const canAdvanceStatus = (status: string) => {
    return ["pending", "confirmed", "preparing", "ready"].includes(status);
  };

  // Safe date formatting function
  const formatDateSafely = (
    dateString: string | undefined,
    fallbackDate?: string
  ) => {
    try {
      if (dateString) {
        const date = new Date(dateString);
        if (!isNaN(date.getTime())) {
          return formatDistanceToNow(date, { addSuffix: true });
        }
      }
      if (fallbackDate) {
        const fallback = new Date(fallbackDate);
        if (!isNaN(fallback.getTime())) {
          return formatDistanceToNow(fallback, { addSuffix: true });
        }
      }
      return "Recently";
    } catch (error) {
      console.error("Date formatting error:", error);
      return "Recently";
    }
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-white dark:bg-black border border-gray-200 dark:border-gray-800 rounded-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-black dark:text-white">
              Total Orders
            </CardTitle>
            <Receipt className="h-4 w-4 text-black dark:text-white opacity-70" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-medium text-black dark:text-white">
              {stats.totalOrders}
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white dark:bg-black border border-gray-200 dark:border-gray-800 rounded-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-black dark:text-white">
              Pending
            </CardTitle>
            <Clock className="h-4 w-4 text-black dark:text-white opacity-70" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-medium text-black dark:text-white">
              {stats.pending?.count || 0}
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white dark:bg-black border border-gray-200 dark:border-gray-800 rounded-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-black dark:text-white">
              Completion Rate
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-black dark:text-white opacity-70" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-medium text-black dark:text-white">
              {stats.completionRate}
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white dark:bg-black border border-gray-200 dark:border-gray-800 rounded-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-black dark:text-white">
              Avg. Order Value
            </CardTitle>
            <DollarSign className="h-4 w-4 text-black dark:text-white opacity-70" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-medium text-black dark:text-white">
              ₹{stats.avgOrderValue}
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
              placeholder="Search orders..."
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
                value="pending"
                className="text-black dark:text-white hover:bg-gray-100 dark:hover:bg-gray-900"
              >
                Pending
              </SelectItem>
              <SelectItem
                value="confirmed"
                className="text-black dark:text-white hover:bg-gray-100 dark:hover:bg-gray-900"
              >
                Confirmed
              </SelectItem>
              <SelectItem
                value="preparing"
                className="text-black dark:text-white hover:bg-gray-100 dark:hover:bg-gray-900"
              >
                Preparing
              </SelectItem>
              <SelectItem
                value="ready"
                className="text-black dark:text-white hover:bg-gray-100 dark:hover:bg-gray-900"
              >
                Ready
              </SelectItem>
              <SelectItem
                value="delivered"
                className="text-black dark:text-white hover:bg-gray-100 dark:hover:bg-gray-900"
              >
                Delivered
              </SelectItem>
              <SelectItem
                value="cancelled"
                className="text-black dark:text-white hover:bg-gray-100 dark:hover:bg-gray-900"
              >
                Cancelled
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
              <SelectItem
                value="room_service"
                className="text-black dark:text-white hover:bg-gray-100 dark:hover:bg-gray-900"
              >
                Room Service
              </SelectItem>
              <SelectItem
                value="restaurant"
                className="text-black dark:text-white hover:bg-gray-100 dark:hover:bg-gray-900"
              >
                Restaurant
              </SelectItem>
              <SelectItem
                value="takeaway"
                className="text-black dark:text-white hover:bg-gray-100 dark:hover:bg-gray-900"
              >
                Takeaway
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200 rounded-sm">
              <Plus className="mr-2 h-4 w-4" />
              Create Order
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-white dark:bg-black border border-gray-200 dark:border-gray-800 rounded-sm">
            <DialogHeader>
              <DialogTitle className="text-black dark:text-white">
                Create New Order
              </DialogTitle>
              <DialogDescription className="text-black dark:text-white opacity-70">
                Create a new food order for a guest.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="guest" className="text-black dark:text-white">
                    Guest *
                  </Label>
                  <Select
                    value={orderForm.guestId}
                    onValueChange={(value) =>
                      setOrderForm({ ...orderForm, guestId: value })
                    }
                  >
                    <SelectTrigger className="bg-white dark:bg-black border-gray-200 dark:border-gray-800 text-black dark:text-white rounded-sm">
                      <SelectValue placeholder="Select guest" />
                    </SelectTrigger>
                    <SelectContent className="bg-white dark:bg-black border-gray-200 dark:border-gray-800 rounded-sm">
                      {guests.map((guest) => (
                        <SelectItem
                          key={guest._id}
                          value={guest._id}
                          className="text-black dark:text-white hover:bg-gray-100 dark:hover:bg-gray-900"
                        >
                          {guest.name} - Room{" "}
                          {(guest as any).room?.number || "No Room"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="type" className="text-black dark:text-white">
                    Order Type *
                  </Label>
                  <Select
                    value={orderForm.type}
                    onValueChange={(value) =>
                      setOrderForm({
                        ...orderForm,
                        type: value as
                          | "room_service"
                          | "restaurant"
                          | "takeaway",
                      })
                    }
                  >
                    <SelectTrigger className="bg-white dark:bg-black border-gray-200 dark:border-gray-800 text-black dark:text-white rounded-sm">
                      <SelectValue placeholder="Select order type" />
                    </SelectTrigger>
                    <SelectContent className="bg-white dark:bg-black border-gray-200 dark:border-gray-800 rounded-sm">
                      <SelectItem
                        value="room_service"
                        className="text-black dark:text-white hover:bg-gray-100 dark:hover:bg-gray-900"
                      >
                        Room Service
                      </SelectItem>
                      <SelectItem
                        value="restaurant"
                        className="text-black dark:text-white hover:bg-gray-100 dark:hover:bg-gray-900"
                      >
                        Restaurant
                      </SelectItem>
                      <SelectItem
                        value="takeaway"
                        className="text-black dark:text-white hover:bg-gray-100 dark:hover:bg-gray-900"
                      >
                        Takeaway
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-black dark:text-white">
                    Order Items *
                  </Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addOrderItem}
                    className="bg-white dark:bg-black border-gray-200 dark:border-gray-800 text-black dark:text-white hover:bg-gray-100 dark:hover:bg-gray-900 rounded-sm"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add Item
                  </Button>
                </div>

                {orderForm.items.map((item, index) => (
                  <div
                    key={index}
                    className="grid grid-cols-12 gap-2 items-end p-3 border border-gray-200 dark:border-gray-800 rounded-sm bg-gray-50 dark:bg-gray-950"
                  >
                    <div className="col-span-5">
                      <Label className="text-sm text-black dark:text-white">
                        Food Item
                      </Label>
                      <Select
                        value={item.foodId}
                        onValueChange={(value) =>
                          updateOrderItem(index, "foodId", value)
                        }
                      >
                        <SelectTrigger className="bg-white dark:bg-black border-gray-200 dark:border-gray-800 text-black dark:text-white rounded-sm">
                          <SelectValue placeholder="Select food item" />
                        </SelectTrigger>
                        <SelectContent className="bg-white dark:bg-black border-gray-200 dark:border-gray-800 rounded-sm">
                          {foodItems.map((food) => (
                            <SelectItem
                              key={food._id}
                              value={food._id}
                              className="text-black dark:text-white hover:bg-gray-100 dark:hover:bg-gray-900"
                            >
                              {food.name} - ₹{food.price}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="col-span-2">
                      <Label className="text-sm text-black dark:text-white">
                        Quantity
                      </Label>
                      <Input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) =>
                          updateOrderItem(
                            index,
                            "quantity",
                            parseInt(e.target.value) || 1
                          )
                        }
                        className="bg-white dark:bg-black border-gray-200 dark:border-gray-800 text-black dark:text-white rounded-sm"
                      />
                    </div>
                    <div className="col-span-4">
                      <Label className="text-sm text-black dark:text-white">
                        Special Instructions
                      </Label>
                      <Input
                        value={item.specialInstructions}
                        onChange={(e) =>
                          updateOrderItem(
                            index,
                            "specialInstructions",
                            e.target.value
                          )
                        }
                        placeholder="Optional..."
                        className="bg-white dark:bg-black border-gray-200 dark:border-gray-800 text-black dark:text-white rounded-sm"
                      />
                    </div>
                    <div className="col-span-1">
                      {orderForm.items.length > 1 && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeOrderItem(index)}
                          className="bg-white dark:bg-black border-gray-200 dark:border-gray-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950 rounded-sm"
                        >
                          <XCircle className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="specialInstructions"
                  className="text-black dark:text-white"
                >
                  Order Special Instructions
                </Label>
                <Input
                  id="specialInstructions"
                  value={orderForm.specialInstructions}
                  onChange={(e) =>
                    setOrderForm({
                      ...orderForm,
                      specialInstructions: e.target.value,
                    })
                  }
                  placeholder="Any special instructions for the entire order..."
                  className="bg-white dark:bg-black border-gray-200 dark:border-gray-800 text-black dark:text-white rounded-sm"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsCreateDialogOpen(false)}
                className="bg-white dark:bg-black border-gray-200 dark:border-gray-800 text-black dark:text-white hover:bg-gray-100 dark:hover:bg-gray-900 rounded-sm"
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateOrder}
                disabled={isLoading}
                className="bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200 rounded-sm"
              >
                {isLoading ? "Creating..." : "Create Order"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Orders List */}
      <Card className="bg-white dark:bg-black border border-gray-200 dark:border-gray-800 rounded-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base font-medium text-black dark:text-white">
            <Receipt className="h-5 w-5" />
            Orders ({pagination.total})
          </CardTitle>
          <CardDescription className="text-sm text-black dark:text-white opacity-70">
            Manage food orders, update status, and view details
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="border-gray-200 dark:border-gray-800">
                <TableHead className="text-black dark:text-white font-medium">
                  Order #
                </TableHead>
                <TableHead className="text-black dark:text-white font-medium">
                  Guest
                </TableHead>
                <TableHead className="text-black dark:text-white font-medium">
                  Room
                </TableHead>
                <TableHead className="text-black dark:text-white font-medium">
                  Amount
                </TableHead>
                <TableHead className="text-black dark:text-white font-medium">
                  Date
                </TableHead>
                <TableHead className="text-black dark:text-white font-medium">
                  Status
                </TableHead>
                <TableHead className="text-black dark:text-white font-medium">
                  Type
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
                    colSpan={8}
                    className="text-center py-8 text-black dark:text-white"
                  >
                    Loading orders...
                  </TableCell>
                </TableRow>
              ) : orders.length === 0 ? (
                <TableRow className="border-gray-200 dark:border-gray-800">
                  <TableCell
                    colSpan={8}
                    className="text-center py-8 text-black dark:text-white opacity-70"
                  >
                    {orders.length === 0
                      ? "No orders found. Create your first order to get started."
                      : "No orders match your current filters."}
                  </TableCell>
                </TableRow>
              ) : (
                orders.map((order) => (
                  <TableRow
                    key={order._id}
                    className="border-gray-200 dark:border-gray-800"
                  >
                    <TableCell className="font-medium text-black dark:text-white">
                      #{order.orderNumber}
                    </TableCell>
                    <TableCell className="text-black dark:text-white">
                      {order.guest.name}
                    </TableCell>
                    <TableCell className="text-black dark:text-white">
                      {order.room.number}
                    </TableCell>
                    <TableCell className="text-black dark:text-white">
                      ₹{order.totalAmount}
                    </TableCell>
                    <TableCell className="text-black dark:text-white">
                      {formatDateSafely(
                        order.orderDate,
                        order.createdAt || order.updatedAt
                      )}
                    </TableCell>
                    <TableCell>{getStatusBadge(order.status)}</TableCell>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className="capitalize bg-gray-100 dark:bg-gray-900 text-black dark:text-white border-gray-200 dark:border-gray-800 rounded-sm"
                      >
                        {order.type.replace("_", " ")}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedOrder(order);
                            setIsViewDialogOpen(true);
                          }}
                          className="h-8 w-8 text-black dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-sm"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {canAdvanceStatus(order.status) && (
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() =>
                              handleUpdateOrderStatus(
                                order._id,
                                getNextStatus(order.status)!
                              )
                            }
                            className="bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200 rounded-sm"
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            {getNextStatus(order.status) === "confirmed" &&
                              "Confirm"}
                            {getNextStatus(order.status) === "preparing" &&
                              "Start Preparing"}
                            {getNextStatus(order.status) === "ready" &&
                              "Mark Ready"}
                            {getNextStatus(order.status) === "delivered" &&
                              "Mark Delivered"}
                          </Button>
                        )}
                        {order.status !== "delivered" &&
                          order.status !== "cancelled" && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                handleUpdateOrderStatus(order._id, "cancelled")
                              }
                              className="bg-white dark:bg-black border-gray-200 dark:border-gray-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950 rounded-sm"
                            >
                              <XCircle className="h-4 w-4" />
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
            itemName="orders"
          />
        </CardContent>
      </Card>

      {/* Order Details Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-2xl bg-white dark:bg-black border border-gray-200 dark:border-gray-800 rounded-sm">
          <DialogHeader>
            <DialogTitle className="text-black dark:text-white">
              Order Details
            </DialogTitle>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Order Number</Label>
                  <p className="text-sm">#{selectedOrder.orderNumber}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Status</Label>
                  <div className="mt-1">
                    {getStatusBadge(selectedOrder.status)}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Guest</Label>
                  <p className="text-sm">{selectedOrder.guest.name}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Room</Label>
                  <p className="text-sm">Room {selectedOrder.room.number}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Order Type</Label>
                  <p className="text-sm capitalize">
                    {selectedOrder.type.replace("_", " ")}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Total Amount</Label>
                  <p className="text-sm font-semibold">
                    ₹{selectedOrder.totalAmount}
                  </p>
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium">Order Items</Label>
                <div className="mt-2 space-y-2">
                  {selectedOrder.items.map((item, index) => (
                    <div
                      key={index}
                      className="flex justify-between items-center p-2 bg-gray-50 rounded"
                    >
                      <div>
                        <span className="font-medium">
                          {item.quantity}x{" "}
                          {item.food?.name || item.foodName || "Unknown Item"}
                        </span>
                        {item.specialInstructions && (
                          <p className="text-xs text-muted-foreground">
                            Note: {item.specialInstructions}
                          </p>
                        )}
                      </div>
                      <span className="font-medium">
                        ₹{item.price || item.unitPrice || 0}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Order Date</Label>
                  <p className="text-sm">
                    {selectedOrder.orderDate
                      ? new Date(selectedOrder.orderDate).toLocaleString()
                      : new Date(
                          selectedOrder.createdAt || selectedOrder.updatedAt
                        ).toLocaleString()}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Payment Status</Label>
                  <Badge
                    variant={
                      selectedOrder.paymentStatus === "paid"
                        ? "default"
                        : "secondary"
                    }
                  >
                    {selectedOrder.paymentStatus}
                  </Badge>
                </div>
              </div>

              {selectedOrder.specialInstructions && (
                <div>
                  <Label className="text-sm font-medium">
                    Special Instructions
                  </Label>
                  <p className="text-sm">{selectedOrder.specialInstructions}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
