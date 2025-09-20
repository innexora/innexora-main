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
import { Textarea } from "@/components/ui/textarea";
import { Pagination } from "@/components/ui/pagination";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Plus,
  Search,
  DollarSign,
  User,
  Building2,
  Receipt,
  CreditCard,
  Percent,
  Eye,
  FileText,
  CheckCircle,
  Calculator,
  RefreshCw,
} from "lucide-react";
import { apiClient } from "@/lib/api/client";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

interface BillItem {
  _id: string;
  type:
    | "room_charge"
    | "food_order"
    | "service_charge"
    | "tax"
    | "discount"
    | "other";
  description: string;
  amount: number;
  quantity?: number;
  unitPrice?: number;
  date: string;
  orderId?: string;
  addedBy?: string;
  notes?: string;
}

interface Payment {
  _id: string;
  amount: number;
  method: "cash" | "card" | "upi" | "bank_transfer" | "other";
  reference?: string;
  date: string;
  receivedBy: string;
  notes?: string;
}

interface Bill {
  _id: string;
  billNumber: string;
  guest: {
    _id: string;
    name: string;
    phone: string;
    email?: string;
    status?: string;
  };
  room: {
    _id: string;
    number: string;
    type?: string;
    floor?: number;
  };
  checkInDate: string;
  checkOutDate?: string;
  items: BillItem[];
  payments: Payment[];
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
  paidAmount: number;
  balanceAmount: number;
  status: "active" | "paid" | "partially_paid" | "cancelled" | "finalized";
  finalizedAt?: string;
  finalizedBy?: string;
  isGuestCheckedOut?: boolean;
  createdAt: string;
  updatedAt: string;
}

interface Guest {
  _id: string;
  name: string;
  phone: string;
  roomNumber: string;
}

interface AddItemForm {
  type: "room_charge" | "food_order" | "service_charge" | "tax" | "other";
  description: string;
  amount: number;
  quantity: number;
}

interface AddPaymentForm {
  amount: number;
  method: "cash" | "card" | "upi" | "bank_transfer" | "other";
  reference: string;
  notes: string;
}

const statusColors = {
  active: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  paid: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  partially_paid:
    "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  cancelled: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  finalized: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200",
};

const statusLabels = {
  active: "Active",
  paid: "Paid",
  partially_paid: "Partially Paid",
  cancelled: "Cancelled",
  finalized: "Finalized",
};

const itemTypeLabels = {
  room_charge: "Room Charge",
  food_order: "Food Order",
  service_charge: "Service Charge",
  tax: "Tax",
  other: "Other",
};

const paymentMethodLabels = {
  cash: "Cash",
  card: "Card",
  upi: "UPI",
  bank_transfer: "Bank Transfer",
  other: "Other",
};

export default function BillsPage() {
  const [bills, setBills] = useState<Bill[]>([]);
  const [guests, setGuests] = useState<Guest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedBill, setSelectedBill] = useState<Bill | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isAddItemDialogOpen, setIsAddItemDialogOpen] = useState(false);
  const [isAddPaymentDialogOpen, setIsAddPaymentDialogOpen] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pages: 1,
    total: 0,
    limit: 20,
  });
  const [stats, setStats] = useState({
    totalBills: 0,
    totalRevenue: 0,
    totalPaid: 0,
    totalOutstanding: 0,
    activeBills: 0,
    paidBills: 0,
    partiallyPaidBills: 0,
    finalizedBills: 0,
    todaysBills: 0,
    todaysRevenue: 0,
    avgBillValue: 0,
    collectionRate: "0%",
    period: "today",
  });

  const [addItemForm, setAddItemForm] = useState<AddItemForm>({
    type: "other",
    description: "",
    amount: 0,
    quantity: 1,
  });

  const [addPaymentForm, setAddPaymentForm] = useState<AddPaymentForm>({
    amount: 0,
    method: "cash",
    reference: "",
    notes: "",
  });

  const [discountAmount, setDiscountAmount] = useState(0);
  const [taxAmount, setTaxAmount] = useState(0);

  useEffect(() => {
    fetchBills(pagination.current, searchTerm, statusFilter);
  }, [pagination.current, searchTerm, statusFilter]);

  useEffect(() => {
    fetchGuests();
    fetchStats();
  }, []);

  const fetchBills = async (
    page = 1,
    search = searchTerm,
    status = statusFilter
  ) => {
    try {
      console.log("Fetching bills...");
      setIsLoading(true);

      const params = new URLSearchParams({
        page: page.toString(),
        limit: "20",
        // Remove type filter to get all bills, we'll filter on frontend
        ...(search && { search }),
        ...(status !== "all" && { status }),
      });

      const response = await apiClient.get(`/bills?${params.toString()}`);
      console.log("Bills API Response:", response.data);

      // Handle the expected response format: { success: true, data: Bill[], count: number, pagination: {...} }
      if (
        response.data &&
        response.data.success &&
        Array.isArray(response.data.data)
      ) {
        const billsData = response.data.data;
        console.log("Bills data:", billsData);

        // Transform the data to match our frontend Bill interface
        const processedBills = billsData.map((bill: any) => ({
          ...bill,
          id: bill._id, // Map _id to id
          _id: bill._id, // Keep _id for backward compatibility
          // Ensure all required fields have default values if missing
          billNumber: bill.billNumber || "",
          guest: bill.guest
            ? {
                _id: bill.guest._id || "",
                name: bill.guest.name || "",
                phone: bill.guest.phone || "",
                email: bill.guest.email || "",
                status: bill.guest.status || "",
              }
            : { _id: "", name: "", phone: "", email: "", status: "" },
          room: bill.room || { _id: "", number: "", type: "", floor: 0 },
          checkInDate: bill.checkInDate || bill.createdAt,
          checkOutDate: bill.checkOutDate,
          items: Array.isArray(bill.items) ? bill.items : [],
          payments: Array.isArray(bill.payments) ? bill.payments : [],
          subtotal: bill.subtotal || 0,
          taxAmount: bill.taxAmount || 0,
          discountAmount: bill.discountAmount || 0,
          totalAmount: bill.totalAmount || 0,
          paidAmount: bill.paidAmount || 0,
          balanceAmount: bill.balanceAmount || 0,
          status: bill.status || "active",
          finalizedAt: bill.finalizedAt,
          finalizedBy: bill.finalizedBy,
          isGuestCheckedOut: bill.isGuestCheckedOut || false,
          createdAt: bill.createdAt,
          updatedAt: bill.updatedAt,
        }));

        console.log("Processed bills:", processedBills);

        // Filter out bills of guests who have checked out
        // Use guest status as primary check, fallback to isGuestCheckedOut
        const filteredBills = processedBills.filter((bill: Bill) => {
          const guestCheckedOut =
            bill.guest.status === "checked_out" ||
            bill.isGuestCheckedOut === true;
          return !guestCheckedOut;
        });
        console.log(
          `Filtered ${processedBills.length} bills to ${
            filteredBills.length
          } active bills (excluded ${
            processedBills.length - filteredBills.length
          } checked-out guests)`
        );

        setBills(filteredBills);

        // Update pagination from server response
        if (response.data.pagination) {
          // Adjust pagination for filtered results
          const originalTotal = response.data.pagination.total;
          const filteredTotal = filteredBills.length;
          const adjustedPagination = {
            ...response.data.pagination,
            total: filteredTotal,
            pages: Math.ceil(filteredTotal / response.data.pagination.limit),
            hasNext:
              response.data.pagination.current <
              Math.ceil(filteredTotal / response.data.pagination.limit),
          };
          setPagination(adjustedPagination);
          console.log(
            `Pagination adjusted: ${originalTotal} → ${filteredTotal} bills`
          );
        }
      } else {
        console.error("Unexpected API response format:", response.data);
        setBills([]);
      }
    } catch (error) {
      console.error("Failed to fetch bills:", error);
      toast.error("Failed to load bills");
      setBills([]);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchBillsByType = async (statusFilter: string) => {
    try {
      setIsLoading(true);
      let endpoint = "/bills";
      // Use status filter instead of type
      if (statusFilter !== "all") {
        endpoint += `?status=${statusFilter}`;
      }
      const response = await apiClient.get(endpoint);

      if (
        response.data &&
        response.data.success &&
        Array.isArray(response.data.data)
      ) {
        const billsData = response.data.data;
        console.log("Bills data from fetchBillsByType:", billsData);

        // Transform the data to match our frontend Bill interface
        const processedBills = billsData.map((bill: any) => ({
          ...bill,
          id: bill._id,
          _id: bill._id,
          billNumber: bill.billNumber || "",
          guest: bill.guest
            ? {
                _id: bill.guest._id || "",
                name: bill.guest.name || "",
                phone: bill.guest.phone || "",
                email: bill.guest.email || "",
                status: bill.guest.status || "",
              }
            : { _id: "", name: "", phone: "", email: "", status: "" },
          room: bill.room || { _id: "", number: "", type: "", floor: 0 },
          checkInDate: bill.checkInDate || bill.createdAt,
          checkOutDate: bill.checkOutDate,
          items: Array.isArray(bill.items) ? bill.items : [],
          payments: Array.isArray(bill.payments) ? bill.payments : [],
          subtotal: bill.subtotal || 0,
          taxAmount: bill.taxAmount || 0,
          discountAmount: bill.discountAmount || 0,
          totalAmount: bill.totalAmount || 0,
          paidAmount: bill.paidAmount || 0,
          balanceAmount: bill.balanceAmount || 0,
          status: bill.status || "active",
          finalizedAt: bill.finalizedAt,
          finalizedBy: bill.finalizedBy,
          isGuestCheckedOut: bill.isGuestCheckedOut || false,
          createdAt: bill.createdAt,
          updatedAt: bill.updatedAt,
        }));

        // Debug: Log isGuestCheckedOut and guest status values
        processedBills.forEach((bill: Bill, index: number) => {
          console.log(
            `Bill ${index + 1}: ${bill.guest.name} - isGuestCheckedOut: ${
              bill.isGuestCheckedOut
            }, guest.status: ${bill.guest.status}`
          );
        });

        // Filter out bills of guests who have checked out
        const filteredBills = processedBills.filter((bill: Bill) => {
          const guestCheckedOut =
            bill.guest.status === "checked_out" ||
            bill.isGuestCheckedOut === true;
          return !guestCheckedOut;
        });
        console.log(
          `Filtered ${processedBills.length} bills to ${
            filteredBills.length
          } active bills (excluded ${
            processedBills.length - filteredBills.length
          } checked-out guests)`
        );

        setBills(filteredBills);
      } else {
        setBills([]);
      }
    } catch (error) {
      console.error("Error fetching bills:", error);
      toast.error("Failed to fetch bills");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchGuests = async () => {
    try {
      const response = await apiClient.get("/guests");
      setGuests(response.data.data);
    } catch (error) {
      console.error("Error fetching guests:", error);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await apiClient.get("/bills/stats");
      if (response.data.success) {
        setStats(response.data.data);
      }
    } catch (error) {
      console.error("Failed to fetch bill stats:", error);
    }
  };

  const handleAddItem = async () => {
    if (!selectedBill) return;

    try {
      setIsLoading(true);
      console.log(
        "Adding item to bill:",
        selectedBill.billNumber,
        "Current status:",
        selectedBill.status
      );
      const response = await apiClient.post(
        `/bills/${selectedBill._id}/charges`,
        {
          ...addItemForm,
          addedBy: "Manager", // This should come from user context
        }
      );
      console.log("Add item response:", response.data);
      toast.success("Item added to bill successfully!");
      setIsAddItemDialogOpen(false);
      resetAddItemForm();
      fetchBills(pagination.current, searchTerm, statusFilter);
      fetchStats();

      // Update selected bill with fresh data from server response
      if (response.data && response.data.data) {
        console.log("Updated bill after adding item:", response.data.data);
        setSelectedBill(response.data.data);
      }
    } catch (error: any) {
      console.error("Error adding item to bill:", error);
      toast.error(
        error.response?.data?.message || "Failed to add item to bill"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddPayment = async () => {
    if (!selectedBill) return;

    // Frontend validation: Check if payment amount exceeds balance
    if (addPaymentForm.amount > selectedBill.balanceAmount) {
      toast.error(
        `Payment amount cannot exceed the outstanding balance of ₹${selectedBill.balanceAmount.toFixed(
          2
        )}`
      );
      return;
    }

    try {
      setIsLoading(true);
      const response = await apiClient.post(
        `/bills/${selectedBill._id}/payments`,
        {
          ...addPaymentForm,
          receivedBy: "Manager", // This should come from user context
        }
      );
      toast.success("Payment added successfully!");
      setIsAddPaymentDialogOpen(false);
      resetAddPaymentForm();
      fetchBills(pagination.current, searchTerm, statusFilter);
      fetchStats();

      // Update selected bill with fresh data from server response
      if (response.data && response.data.data) {
        setSelectedBill(response.data.data);
      }
    } catch (error: any) {
      console.error("Error adding payment:", error);
      toast.error(error.response?.data?.message || "Failed to add payment");
    } finally {
      setIsLoading(false);
    }
  };

  const handleApplyDiscount = async () => {
    if (!selectedBill) return;

    try {
      setIsLoading(true);
      await apiClient.post(`/bills/${selectedBill._id}/charges`, {
        type: "discount",
        description: "Manager Discount",
        amount: -Math.abs(discountAmount), // Negative amount for discount
        quantity: 1,
        addedBy: "Manager",
      });
      toast.success("Discount applied successfully!");
      setDiscountAmount(0);
      fetchBills(pagination.current, searchTerm, statusFilter);
      fetchStats();
      // Refresh selected bill
      const updatedBill = bills.find((b) => b._id === selectedBill._id);
      if (updatedBill) setSelectedBill(updatedBill);
    } catch (error: any) {
      console.error("Error applying discount:", error);
      toast.error(error.response?.data?.message || "Failed to apply discount");
    } finally {
      setIsLoading(false);
    }
  };

  const handleApplyTax = async () => {
    if (!selectedBill) return;

    try {
      setIsLoading(true);
      // Calculate tax amount based on current subtotal
      const taxAmountValue = (selectedBill.subtotal * taxAmount) / 100;
      await apiClient.post(`/bills/${selectedBill._id}/charges`, {
        type: "tax",
        description: `Service Tax (${taxAmount}%)`,
        amount: taxAmountValue,
        quantity: 1,
        addedBy: "Manager",
      });
      toast.success("Tax applied successfully!");
      setTaxAmount(0);
      fetchBills(pagination.current, searchTerm, statusFilter);
      fetchStats();
      // Refresh selected bill
      const updatedBill = bills.find((b) => b._id === selectedBill._id);
      if (updatedBill) setSelectedBill(updatedBill);
    } catch (error: any) {
      console.error("Error applying tax:", error);
      toast.error(error.response?.data?.message || "Failed to apply tax");
    } finally {
      setIsLoading(false);
    }
  };

  const handleFinalizeBill = async (billId: string) => {
    try {
      setIsLoading(true);
      await apiClient.put(`/bills/${billId}/finalize`, {
        finalizedBy: "Manager", // This should come from user context
      });
      toast.success("Bill finalized successfully!");
      fetchBills();
      fetchStats();
    } catch (error: any) {
      console.error("Error finalizing bill:", error);
      toast.error(error.response?.data?.message || "Failed to finalize bill");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGuestCheckout = async (guestId: string) => {
    try {
      setIsLoading(true);
      await apiClient.put(`/guests/${guestId}/checkout`);
      toast.success("Guest checked out successfully!");
      fetchBills(pagination.current, searchTerm, statusFilter);
      fetchStats();
    } catch (error: any) {
      console.error("Error checking out guest:", error);
      toast.error(error.response?.data?.message || "Failed to checkout guest");
    } finally {
      setIsLoading(false);
    }
  };

  const viewGuestHistory = () => {
    // Navigate to guest history page
    window.location.href = "/dashboard/guest-history";
  };

  const handleStatusChange = async (billId: string, newStatus: string) => {
    try {
      setIsLoading(true);
      await apiClient.put(`/bills/${billId}`, { status: newStatus });
      toast.success("Bill status updated successfully!");
      fetchBills(pagination.current, searchTerm, statusFilter);
      fetchStats();
    } catch (error: any) {
      console.error("Error updating bill status:", error);
      toast.error(
        error.response?.data?.message || "Failed to update bill status"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const resetAddItemForm = () => {
    setAddItemForm({
      type: "other",
      description: "",
      amount: 0,
      quantity: 1,
    });
  };

  const resetAddPaymentForm = () => {
    setAddPaymentForm({
      amount: 0,
      method: "cash",
      reference: "",
      notes: "",
    });
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

  const handlePageChange = (page: number) => {
    setPagination((prev) => ({ ...prev, current: page }));
  };

  const getStatusBadge = (status: string) => {
    return (
      <Badge
        variant="outline"
        className={statusColors[status as keyof typeof statusColors]}
      >
        {statusLabels[status as keyof typeof statusLabels]}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-white dark:bg-black border border-gray-200 dark:border-gray-800 rounded-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-black dark:text-white">
              Total Bills
            </CardTitle>
            <Receipt className="h-4 w-4 text-black dark:text-white opacity-70" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-medium text-black dark:text-white">
              {stats.totalBills}
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white dark:bg-black border border-gray-200 dark:border-gray-800 rounded-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-black dark:text-white">
              Active Bills
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-black dark:text-white opacity-70" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-medium text-black dark:text-white">
              {stats.activeBills}
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white dark:bg-black border border-gray-200 dark:border-gray-800 rounded-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-black dark:text-white">
              Collection Rate
            </CardTitle>
            <Percent className="h-4 w-4 text-black dark:text-white opacity-70" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-medium text-black dark:text-white">
              {stats.collectionRate}
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white dark:bg-black border border-gray-200 dark:border-gray-800 rounded-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-black dark:text-white">
              Avg. Bill Value
            </CardTitle>
            <DollarSign className="h-4 w-4 text-black dark:text-white opacity-70" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-medium text-black dark:text-white">
              ₹{stats.avgBillValue}
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
              placeholder="Search bills..."
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
                value="active"
                className="text-black dark:text-white hover:bg-gray-100 dark:hover:bg-gray-900"
              >
                Active
              </SelectItem>
              <SelectItem
                value="paid"
                className="text-black dark:text-white hover:bg-gray-100 dark:hover:bg-gray-900"
              >
                Paid
              </SelectItem>
              <SelectItem
                value="partially_paid"
                className="text-black dark:text-white hover:bg-gray-100 dark:hover:bg-gray-900"
              >
                Partially Paid
              </SelectItem>
              <SelectItem
                value="finalized"
                className="text-black dark:text-white hover:bg-gray-100 dark:hover:bg-gray-900"
              >
                Finalized
              </SelectItem>
              <SelectItem
                value="cancelled"
                className="text-black dark:text-white hover:bg-gray-100 dark:hover:bg-gray-900"
              >
                Cancelled
              </SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            onClick={() => {
              fetchBillsByType(statusFilter);
              fetchStats();
            }}
            disabled={isLoading}
            className="bg-white dark:bg-black border-gray-200 dark:border-gray-800 text-black dark:text-white hover:bg-gray-100 dark:hover:bg-gray-900 rounded-sm"
          >
            <RefreshCw
              className={`h-4 w-4 mr-1 ${isLoading ? "animate-spin" : ""}`}
            />
            {isLoading ? "Refreshing..." : "Refresh"}
          </Button>
          {statusFilter === "finalized" && (
            <Button
              variant="outline"
              onClick={viewGuestHistory}
              className="bg-white dark:bg-black border-gray-200 dark:border-gray-800 text-black dark:text-white hover:bg-gray-100 dark:hover:bg-gray-900 rounded-sm"
            >
              <User className="h-4 w-4 mr-1" />
              View Guest History
            </Button>
          )}
        </div>
      </div>

      {/* Current Filter Summary */}
      {statusFilter !== "all" && (
        <Card className="bg-white dark:bg-black border border-gray-200 dark:border-gray-800 rounded-sm">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium text-black dark:text-white">
                  {statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1)}{" "}
                  Bills Summary
                </h3>
                <p className="text-sm text-black dark:text-white opacity-70">
                  {bills.length} bill{bills.length !== 1 ? "s" : ""} found
                </p>
              </div>
              <div className="text-right">
                <div className="text-xl font-medium text-black dark:text-white">
                  ₹
                  {bills
                    .reduce(
                      (sum: number, bill: Bill) => sum + bill.totalAmount,
                      0
                    )
                    .toLocaleString()}
                </div>
                <div className="text-sm text-black dark:text-white opacity-70">
                  Total Amount
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Bills List */}
      <Card className="bg-white dark:bg-black border border-gray-200 dark:border-gray-800 rounded-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base font-medium text-black dark:text-white">
            <Receipt className="h-5 w-5" />
            Bills ({pagination.total})
          </CardTitle>
          <CardDescription className="text-sm text-black dark:text-white opacity-70">
            Manage guest bills, payments, and billing details
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="border-gray-200 dark:border-gray-800">
                <TableHead className="text-black dark:text-white font-medium">
                  Bill Number
                </TableHead>
                <TableHead className="text-black dark:text-white font-medium">
                  Guest
                </TableHead>
                <TableHead className="text-black dark:text-white font-medium">
                  Room
                </TableHead>
                <TableHead className="text-black dark:text-white font-medium">
                  Total Amount
                </TableHead>
                <TableHead className="text-black dark:text-white font-medium">
                  Balance
                </TableHead>
                <TableHead className="text-black dark:text-white font-medium">
                  Status
                </TableHead>
                <TableHead className="text-black dark:text-white font-medium">
                  Items
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
                    Loading bills...
                  </TableCell>
                </TableRow>
              ) : bills.length === 0 ? (
                <TableRow className="border-gray-200 dark:border-gray-800">
                  <TableCell
                    colSpan={8}
                    className="text-center py-8 text-black dark:text-white opacity-70"
                  >
                    {bills.length === 0
                      ? "No bills found. Create your first bill to get started."
                      : "No bills match your current filters."}
                  </TableCell>
                </TableRow>
              ) : (
                bills.map((bill) => (
                  <TableRow
                    key={bill._id}
                    className="border-gray-200 dark:border-gray-800"
                  >
                    <TableCell className="font-medium text-black dark:text-white">
                      #{bill.billNumber}
                    </TableCell>
                    <TableCell className="text-black dark:text-white">
                      <div className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {bill.guest.name}
                      </div>
                    </TableCell>
                    <TableCell className="text-black dark:text-white">
                      <div className="flex items-center gap-1">
                        <Building2 className="h-3 w-3" />
                        {bill.room.number}
                      </div>
                    </TableCell>
                    <TableCell className="text-black dark:text-white">
                      <div className="flex items-center gap-1">
                        <DollarSign className="h-3 w-3" />₹{bill.totalAmount}
                      </div>
                    </TableCell>
                    <TableCell className="text-black dark:text-white">
                      <div className="flex items-center gap-1">
                        <CreditCard className="h-3 w-3" />₹{bill.balanceAmount}
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(bill.status)}</TableCell>
                    <TableCell className="text-black dark:text-white">
                      {bill.items.length} item{bill.items.length > 1 ? "s" : ""}
                      {bill.isGuestCheckedOut && (
                        <div className="flex items-center gap-1 mt-1">
                          <CheckCircle className="h-3 w-3 text-green-600" />
                          <span className="text-xs text-green-600">
                            Checked Out
                          </span>
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setSelectedBill(bill);
                            setIsViewDialogOpen(true);
                          }}
                          title="View Bill Details"
                          className="h-8 w-8 text-black dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-sm"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>

                        {bill.status === "active" &&
                          !bill.isGuestCheckedOut &&
                          bill.balanceAmount <= 0 && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() =>
                                handleGuestCheckout(bill.guest._id)
                              }
                              title="Checkout Guest"
                              className="h-8 w-8 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-950 rounded-sm"
                            >
                              <CheckCircle className="h-4 w-4" />
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
            itemName="bills"
          />
        </CardContent>
      </Card>

      {/* Bill Details Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-white dark:bg-black border border-gray-200 dark:border-gray-800 rounded-sm">
          <DialogHeader>
            <DialogTitle className="text-black dark:text-white">
              Bill Details
            </DialogTitle>
            <DialogDescription className="text-black dark:text-white opacity-70">
              View and manage bill details, add items, payments, and apply
              discounts.
            </DialogDescription>
          </DialogHeader>
          {selectedBill && (
            <div className="space-y-6">
              {/* Bill Header */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label className="text-sm font-medium text-black dark:text-white">
                    Bill Number
                  </Label>
                  <p className="text-sm text-black dark:text-white opacity-70">
                    #{selectedBill.billNumber}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-black dark:text-white">
                    Status
                  </Label>
                  <div className="mt-1">
                    {getStatusBadge(selectedBill.status)}
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-black dark:text-white">
                    Guest
                  </Label>
                  <p className="text-sm text-black dark:text-white opacity-70">
                    {selectedBill.guest.name} - Room {selectedBill.room.number}
                  </p>
                </div>
              </div>

              {/* Additional Bill Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-black dark:text-white">
                    Check-in Date
                  </Label>
                  <p className="text-sm text-black dark:text-white opacity-70">
                    {new Date(selectedBill.checkInDate).toLocaleDateString()}
                  </p>
                </div>
                {selectedBill.checkOutDate && (
                  <div>
                    <Label className="text-sm font-medium text-black dark:text-white">
                      Check-out Date
                    </Label>
                    <p className="text-sm text-black dark:text-white opacity-70">
                      {new Date(selectedBill.checkOutDate).toLocaleDateString()}
                    </p>
                  </div>
                )}
              </div>

              {selectedBill.finalizedAt && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-black dark:text-white">
                      Finalized At
                    </Label>
                    <p className="text-sm text-black dark:text-white opacity-70">
                      {new Date(selectedBill.finalizedAt).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-black dark:text-white">
                      Finalized By
                    </Label>
                    <p className="text-sm text-black dark:text-white opacity-70">
                      {selectedBill.finalizedBy || "System"}
                    </p>
                  </div>
                </div>
              )}

              {/* Bill Items */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <Label className="text-sm font-medium text-black dark:text-white">
                    Bill Items
                  </Label>
                  {selectedBill.status !== "finalized" &&
                    selectedBill.status !== "cancelled" && (
                      <Dialog
                        open={isAddItemDialogOpen}
                        onOpenChange={setIsAddItemDialogOpen}
                      >
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className="bg-white dark:bg-black border-gray-200 dark:border-gray-800 text-black dark:text-white hover:bg-gray-100 dark:hover:bg-gray-900 rounded-sm"
                          >
                            <Plus className="h-4 w-4 mr-1" />
                            Add Item
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="bg-white dark:bg-black border border-gray-200 dark:border-gray-800 rounded-sm">
                          <DialogHeader>
                            <DialogTitle className="text-black dark:text-white">
                              Add Bill Item
                            </DialogTitle>
                          </DialogHeader>
                          <div className="grid gap-4 py-4">
                            <div className="space-y-2">
                              <Label className="text-black dark:text-white">
                                Item Type
                              </Label>
                              <Select
                                value={addItemForm.type}
                                onValueChange={(value: any) =>
                                  setAddItemForm({
                                    ...addItemForm,
                                    type: value,
                                  })
                                }
                              >
                                <SelectTrigger className="bg-white dark:bg-black border-gray-200 dark:border-gray-800 text-black dark:text-white rounded-sm">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-white dark:bg-black border-gray-200 dark:border-gray-800 rounded-sm">
                                  {Object.entries(itemTypeLabels).map(
                                    ([value, label]) => (
                                      <SelectItem
                                        key={value}
                                        value={value}
                                        className="text-black dark:text-white hover:bg-gray-100 dark:hover:bg-gray-900"
                                      >
                                        {label}
                                      </SelectItem>
                                    )
                                  )}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-2">
                              <Label className="text-black dark:text-white">
                                Description
                              </Label>
                              <Input
                                value={addItemForm.description}
                                onChange={(e) =>
                                  setAddItemForm({
                                    ...addItemForm,
                                    description: e.target.value,
                                  })
                                }
                                placeholder="Item description"
                                className="bg-white dark:bg-black border-gray-200 dark:border-gray-800 text-black dark:text-white rounded-sm"
                              />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label className="text-black dark:text-white">
                                  Amount (₹)
                                </Label>
                                <Input
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  value={addItemForm.amount}
                                  onChange={(e) =>
                                    setAddItemForm({
                                      ...addItemForm,
                                      amount: parseFloat(e.target.value) || 0,
                                    })
                                  }
                                  className="bg-white dark:bg-black border-gray-200 dark:border-gray-800 text-black dark:text-white rounded-sm"
                                />
                              </div>
                              <div className="space-y-2">
                                <Label className="text-black dark:text-white">
                                  Quantity
                                </Label>
                                <Input
                                  type="number"
                                  min="1"
                                  value={addItemForm.quantity}
                                  onChange={(e) =>
                                    setAddItemForm({
                                      ...addItemForm,
                                      quantity: parseInt(e.target.value) || 1,
                                    })
                                  }
                                  className="bg-white dark:bg-black border-gray-200 dark:border-gray-800 text-black dark:text-white rounded-sm"
                                />
                              </div>
                            </div>
                          </div>
                          <DialogFooter>
                            <Button
                              variant="outline"
                              onClick={() => setIsAddItemDialogOpen(false)}
                              className="bg-white dark:bg-black border-gray-200 dark:border-gray-800 text-black dark:text-white hover:bg-gray-100 dark:hover:bg-gray-900 rounded-sm"
                            >
                              Cancel
                            </Button>
                            <Button
                              onClick={handleAddItem}
                              className="bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200 rounded-sm"
                            >
                              Add Item
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    )}
                </div>
                <div className="space-y-2">
                  {selectedBill.items.map((item, index) => (
                    <div
                      key={index}
                      className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-sm"
                    >
                      <div>
                        <span className="font-medium text-black dark:text-white">
                          {
                            itemTypeLabels[
                              item.type as keyof typeof itemTypeLabels
                            ]
                          }
                        </span>
                        <p className="text-sm text-black dark:text-white opacity-70">
                          {item.description}
                        </p>
                        {item.quantity && item.quantity > 1 && (
                          <p className="text-xs text-black dark:text-white opacity-70">
                            Qty: {item.quantity}
                          </p>
                        )}
                      </div>
                      <span className="font-medium text-black dark:text-white">
                        ₹{item.amount}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Payments */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <Label className="text-sm font-medium text-black dark:text-white">
                    Payments
                  </Label>
                  {selectedBill.status !== "finalized" &&
                    selectedBill.status !== "cancelled" && (
                      <Dialog
                        open={isAddPaymentDialogOpen}
                        onOpenChange={setIsAddPaymentDialogOpen}
                      >
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className="bg-white dark:bg-black border-gray-200 dark:border-gray-800 text-black dark:text-white hover:bg-gray-100 dark:hover:bg-gray-900 rounded-sm"
                          >
                            <Plus className="h-4 w-4 mr-1" />
                            Add Payment
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="bg-white dark:bg-black border border-gray-200 dark:border-gray-800 rounded-sm">
                          <DialogHeader>
                            <DialogTitle className="text-black dark:text-white">
                              Add Payment
                            </DialogTitle>
                          </DialogHeader>
                          <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label className="text-black dark:text-white">
                                  Amount (₹)
                                </Label>
                                <Input
                                  type="number"
                                  min="0"
                                  max={selectedBill?.balanceAmount || 0}
                                  step="0.01"
                                  value={addPaymentForm.amount}
                                  onChange={(e) => {
                                    const value =
                                      parseFloat(e.target.value) || 0;
                                    const maxAmount =
                                      selectedBill?.balanceAmount || 0;

                                    // Prevent entering more than balance
                                    if (value > maxAmount) {
                                      setAddPaymentForm({
                                        ...addPaymentForm,
                                        amount: maxAmount,
                                      });
                                    } else {
                                      setAddPaymentForm({
                                        ...addPaymentForm,
                                        amount: value,
                                      });
                                    }
                                  }}
                                  className="bg-white dark:bg-black border-gray-200 dark:border-gray-800 text-black dark:text-white rounded-sm"
                                />
                                {selectedBill && (
                                  <p className="text-sm text-gray-600 dark:text-gray-400">
                                    Maximum: ₹
                                    {selectedBill.balanceAmount.toFixed(2)}
                                  </p>
                                )}
                              </div>
                              <div className="space-y-2">
                                <Label className="text-black dark:text-white">
                                  Payment Method
                                </Label>
                                <Select
                                  value={addPaymentForm.method}
                                  onValueChange={(value: any) =>
                                    setAddPaymentForm({
                                      ...addPaymentForm,
                                      method: value,
                                    })
                                  }
                                >
                                  <SelectTrigger className="bg-white dark:bg-black border-gray-200 dark:border-gray-800 text-black dark:text-white rounded-sm">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent className="bg-white dark:bg-black border-gray-200 dark:border-gray-800 rounded-sm">
                                    {Object.entries(paymentMethodLabels).map(
                                      ([value, label]) => (
                                        <SelectItem
                                          key={value}
                                          value={value}
                                          className="text-black dark:text-white hover:bg-gray-100 dark:hover:bg-gray-900"
                                        >
                                          {label}
                                        </SelectItem>
                                      )
                                    )}
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                            <div className="space-y-2">
                              <Label className="text-black dark:text-white">
                                Reference
                              </Label>
                              <Input
                                value={addPaymentForm.reference}
                                onChange={(e) =>
                                  setAddPaymentForm({
                                    ...addPaymentForm,
                                    reference: e.target.value,
                                  })
                                }
                                placeholder="Transaction reference (optional)"
                                className="bg-white dark:bg-black border-gray-200 dark:border-gray-800 text-black dark:text-white rounded-sm"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label className="text-black dark:text-white">
                                Notes
                              </Label>
                              <Textarea
                                value={addPaymentForm.notes}
                                onChange={(e) =>
                                  setAddPaymentForm({
                                    ...addPaymentForm,
                                    notes: e.target.value,
                                  })
                                }
                                placeholder="Payment notes (optional)"
                                className="bg-white dark:bg-black border-gray-200 dark:border-gray-800 text-black dark:text-white rounded-sm"
                              />
                            </div>
                          </div>
                          <DialogFooter>
                            <Button
                              variant="outline"
                              onClick={() => setIsAddPaymentDialogOpen(false)}
                              className="bg-white dark:bg-black border-gray-200 dark:border-gray-800 text-black dark:text-white hover:bg-gray-100 dark:hover:bg-gray-900 rounded-sm"
                            >
                              Cancel
                            </Button>
                            <Button
                              onClick={handleAddPayment}
                              className="bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200 rounded-sm"
                            >
                              Add Payment
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    )}
                </div>
                <div className="space-y-2">
                  {selectedBill.payments.length === 0 ? (
                    <p className="text-sm text-black dark:text-white opacity-70">
                      No payments recorded
                    </p>
                  ) : (
                    selectedBill.payments.map((payment, index) => (
                      <div
                        key={index}
                        className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-sm"
                      >
                        <div>
                          <span className="font-medium text-black dark:text-white">
                            {
                              paymentMethodLabels[
                                payment.method as keyof typeof paymentMethodLabels
                              ]
                            }
                          </span>
                          {payment.reference && (
                            <p className="text-sm text-black dark:text-white opacity-70">
                              Ref: {payment.reference}
                            </p>
                          )}
                          <p className="text-xs text-black dark:text-white opacity-70">
                            {new Date(payment.date).toLocaleString()}
                          </p>
                        </div>
                        <span className="font-medium text-black dark:text-white">
                          ₹{payment.amount}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Discount and Tax Controls */}
              {selectedBill.status !== "finalized" &&
                selectedBill.status !== "cancelled" && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-black dark:text-white">
                        Apply Discount
                      </Label>
                      <div className="flex gap-2">
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={discountAmount}
                          onChange={(e) =>
                            setDiscountAmount(parseFloat(e.target.value) || 0)
                          }
                          placeholder="Discount amount"
                          className="bg-white dark:bg-black border-gray-200 dark:border-gray-800 text-black dark:text-white rounded-sm"
                        />
                        <Button
                          variant="outline"
                          onClick={handleApplyDiscount}
                          className="bg-white dark:bg-black border-gray-200 dark:border-gray-800 text-black dark:text-white hover:bg-gray-100 dark:hover:bg-gray-900 rounded-sm"
                        >
                          <Percent className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-black dark:text-white">
                        Apply Tax
                      </Label>
                      <div className="flex gap-2">
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={taxAmount}
                          onChange={(e) =>
                            setTaxAmount(parseFloat(e.target.value) || 0)
                          }
                          placeholder="Tax percentage"
                          className="bg-white dark:bg-black border-gray-200 dark:border-gray-800 text-black dark:text-white rounded-sm"
                        />
                        <Button
                          variant="outline"
                          onClick={handleApplyTax}
                          className="bg-white dark:bg-black border-gray-200 dark:border-gray-800 text-black dark:text-white hover:bg-gray-100 dark:hover:bg-gray-900 rounded-sm"
                        >
                          <Calculator className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

              {/* Bill Summary */}
              <div className="border-t border-gray-200 dark:border-gray-800 pt-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-black dark:text-white">
                    <span>Subtotal:</span>
                    <span>₹{selectedBill.subtotal}</span>
                  </div>
                  {selectedBill.discountAmount > 0 && (
                    <div className="flex justify-between text-black dark:text-white">
                      <span>Discount:</span>
                      <span>-₹{Math.abs(selectedBill.discountAmount)}</span>
                    </div>
                  )}
                  {selectedBill.taxAmount > 0 && (
                    <div className="flex justify-between text-black dark:text-white">
                      <span>Tax:</span>
                      <span>₹{selectedBill.taxAmount}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-medium text-lg border-t border-gray-200 dark:border-gray-800 pt-2 text-black dark:text-white">
                    <span>Total:</span>
                    <span>₹{selectedBill.totalAmount}</span>
                  </div>
                  <div className="flex justify-between text-black dark:text-white">
                    <span>Paid Amount:</span>
                    <span>₹{selectedBill.paidAmount}</span>
                  </div>
                  <div className="flex justify-between font-medium text-black dark:text-white">
                    <span>Balance:</span>
                    <span>₹{selectedBill.balanceAmount}</span>
                  </div>
                  {selectedBill.isGuestCheckedOut && (
                    <div className="flex justify-between text-sm text-black dark:text-white opacity-70">
                      <span>Guest Status:</span>
                      <span>Checked Out</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
