"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from "recharts";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  Building2,
  ShoppingCart,
  Ticket,
  Calendar,
  Download,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import { apiClient } from "@/lib/api";

interface AnalyticsData {
  period: string;
  dateRange: any;
  revenue: {
    summary: {
      totalRevenue: number;
      totalBills: number;
      averageBillAmount: number;
      totalOutstanding: number;
      totalRoomCharges: number;
      totalFoodRevenue: number;
    };
    paymentMethods: Array<{
      _id: string;
      totalAmount: number;
      count: number;
    }>;
    dailyTrend: Array<{
      _id: { year: number; month: number; day: number };
      revenue: number;
      bills: number;
    }>;
  };
  occupancy: {
    summary: {
      totalRooms: number;
      occupiedRooms: number;
      availableRooms: number;
      maintenanceRooms: number;
      cleaningRooms: number;
      occupancyRate: number;
    };
    guestStats: Record<string, number>;
    averageStay: number;
    occupancyByType: Array<{
      _id: string;
      total: number;
      occupied: number;
      occupancyRate: number;
    }>;
  };
  guests: {
    summary: {
      totalGuests: number;
      checkedInGuests: number;
      checkedOutGuests: number;
    };
    dailyCheckIns: Array<{
      _id: { year: number; month: number; day: number };
      checkIns: number;
    }>;
  };
  orders: {
    summary: Record<string, { count: number; amount: number }>;
    popularItems: Array<{
      _id: string;
      totalOrdered: number;
      totalRevenue: number;
    }>;
    hourlyTrends: Array<{
      _id: number;
      orders: number;
      revenue: number;
    }>;
  };
  tickets: {
    summary: Record<string, number>;
    byCategory: Array<{
      _id: string;
      count: number;
    }>;
    byPriority: Array<{
      _id: string;
      count: number;
    }>;
  };
  rooms: {
    byStatus: Record<string, number>;
    byType: Array<{
      _id: string;
      count: number;
      averagePrice: number;
    }>;
    byFloor: Array<{
      _id: number;
      count: number;
      occupied: number;
    }>;
  };
  trends: {
    revenue: Array<any>;
    guests: Array<any>;
    orders: Array<any>;
  };
}

// Minimal luxury theme colors - black and white only
const CHART_COLORS = {
  primary: "#000000",
  secondary: "#666666",
  accent: "#333333",
  muted: "#999999",
  destructive: "#000000",
  success: "#000000",
  warning: "#666666",
  info: "#333333",
  purple: "#444444",
  pink: "#555555",
  orange: "#777777",
  teal: "#888888",
};

const PIE_COLORS = [
  "#000000",
  "#333333",
  "#666666",
  "#999999",
  "#444444",
  "#555555",
  "#777777",
  "#888888",
];

export default function ReportsPage() {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("month");
  const [refreshing, setRefreshing] = useState(false);

  const fetchAnalytics = async () => {
    try {
      setRefreshing(true);
      console.log("🔍 Fetching analytics for period:", period);

      const response = await apiClient.get(
        `/analytics/dashboard?period=${period}`
      );
      console.log("📊 Analytics response:", response);
      console.log("📊 Response data:", response.data);

      // Check if response has success field (wrapped) or is direct data
      const responseData = response.data as any;

      if (responseData.success !== undefined) {
        // Wrapped response format
        if (responseData.success && responseData.data) {
          console.log(
            "✅ Analytics data received (wrapped):",
            responseData.data
          );
          setAnalyticsData(responseData.data);
          toast.success("Analytics data loaded successfully");
        } else {
          console.error(
            "❌ Analytics API error:",
            responseData.message || responseData.error
          );
          toast.error(responseData.message || "Failed to fetch analytics data");
        }
      } else if (responseData.period && responseData.revenue) {
        // Direct analytics data format
        console.log("✅ Analytics data received (direct):", responseData);
        setAnalyticsData(responseData as AnalyticsData);
        toast.success("Analytics data loaded successfully");
      } else {
        console.error("❌ Unexpected response format:", responseData);
        toast.error("Unexpected response format");
      }
    } catch (error: any) {
      console.error("Analytics fetch error:", error);
      console.error("Error response:", error?.response);
      const errorMessage =
        error?.response?.data?.message ||
        error?.message ||
        "Failed to load analytics data";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [period]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(amount);
  };

  const formatDate = (dateObj: {
    year: number;
    month: number;
    day: number;
  }) => {
    return `${dateObj.day}/${dateObj.month}/${dateObj.year}`;
  };

  const exportReport = () => {
    toast.info("Export functionality coming soon!");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex items-center space-x-2">
          <RefreshCw className="h-6 w-6 animate-spin text-black dark:text-white" />
          <span className="text-black dark:text-white">
            Loading analytics...
          </span>
        </div>
      </div>
    );
  }

  if (!analyticsData) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <p className="text-black dark:text-white opacity-70">
            No analytics data available
          </p>
          <Button
            onClick={fetchAnalytics}
            className="mt-4 bg-black dark:bg-white text-white dark:text-black rounded-sm"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </div>
      </div>
    );
  }

  const { revenue, occupancy, guests, orders, tickets, rooms, trends } =
    analyticsData;

  // Prepare chart data
  const revenueChartData = revenue.dailyTrend.map((item) => ({
    date: formatDate(item._id),
    revenue: item.revenue,
    bills: item.bills,
  }));

  const guestChartData = guests.dailyCheckIns.map((item) => ({
    date: formatDate(item._id),
    checkIns: item.checkIns,
  }));

  const paymentMethodData = revenue.paymentMethods.map((method) => ({
    name: method._id.replace("_", " ").toUpperCase(),
    value: method.totalAmount,
    count: method.count,
  }));

  const roomStatusData = Object.entries(rooms.byStatus).map(
    ([status, count]) => ({
      name: status.replace("_", " ").toUpperCase(),
      value: count,
    })
  );

  const occupancyByTypeData = occupancy.occupancyByType.map((type) => ({
    type: type._id,
    total: type.total,
    occupied: type.occupied,
    occupancyRate: type.occupancyRate,
  }));

  const popularItemsData = orders.popularItems.slice(0, 10).map((item) => ({
    name: item._id,
    orders: item.totalOrdered,
    revenue: item.totalRevenue,
  }));

  const hourlyOrderData = orders.hourlyTrends.map((hour) => ({
    hour: `${hour._id}:00`,
    orders: hour.orders,
    revenue: hour.revenue,
  }));

  // Additional chart data
  const ticketStatusData = tickets.byCategory.map((category) => ({
    name: category._id.replace("_", " ").toUpperCase(),
    value: category.count,
  }));

  const guestTrendData = guests.dailyCheckIns.map((item) => ({
    date: formatDate(item._id),
    checkIns: item.checkIns,
    checkOuts: 0, // Add checkouts data when available
  }));

  const orderTrendData = orders.hourlyTrends.map((item: any) => ({
    date: `${item._id}:00`,
    revenue: item.revenue,
    orders: item.orders,
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-2">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-32 bg-white dark:bg-black border-gray-200 dark:border-gray-800 text-black dark:text-white rounded-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-white dark:bg-black border-gray-200 dark:border-gray-800 rounded-sm">
              <SelectItem value="day" className="text-black dark:text-white">
                Today
              </SelectItem>
              <SelectItem value="week" className="text-black dark:text-white">
                This Week
              </SelectItem>
              <SelectItem value="month" className="text-black dark:text-white">
                This Month
              </SelectItem>
              <SelectItem value="year" className="text-black dark:text-white">
                This Year
              </SelectItem>
            </SelectContent>
          </Select>
          <Button
            onClick={fetchAnalytics}
            disabled={refreshing}
            variant="outline"
            className="bg-white dark:bg-black border-gray-200 dark:border-gray-800 text-black dark:text-white rounded-sm"
          >
            <RefreshCw
              className={`h-4 w-4 mr-2 text-black dark:text-white ${
                refreshing ? "animate-spin" : ""
              }`}
            />
            Refresh
          </Button>
          <Button
            onClick={exportReport}
            variant="outline"
            className="bg-white dark:bg-black border-gray-200 dark:border-gray-800 text-black dark:text-white rounded-sm"
          >
            <Download className="h-4 w-4 mr-2 text-black dark:text-white" />
            Export
          </Button>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-white dark:bg-black border border-gray-200 dark:border-gray-800 rounded-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-black dark:text-white">
              Total Revenue
            </CardTitle>
            <DollarSign className="h-4 w-4 text-black dark:text-white opacity-70" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-black dark:text-white">
              {formatCurrency(revenue.summary.totalRevenue)}
            </div>
            <p className="text-xs text-black dark:text-white opacity-70">
              {revenue.summary.totalBills} bills processed
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-black border border-gray-200 dark:border-gray-800 rounded-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-black dark:text-white">
              Occupancy Rate
            </CardTitle>
            <Building2 className="h-4 w-4 text-black dark:text-white opacity-70" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-black dark:text-white">
              {occupancy.summary.occupancyRate.toFixed(1)}%
            </div>
            <p className="text-xs text-black dark:text-white opacity-70">
              {occupancy.summary.occupiedRooms} of{" "}
              {occupancy.summary.totalRooms} rooms
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-black border border-gray-200 dark:border-gray-800 rounded-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-black dark:text-white">
              Total Guests
            </CardTitle>
            <Users className="h-4 w-4 text-black dark:text-white opacity-70" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-black dark:text-white">
              {guests.summary.totalGuests}
            </div>
            <p className="text-xs text-black dark:text-white opacity-70">
              {guests.summary.checkedInGuests} currently checked in
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-black border border-gray-200 dark:border-gray-800 rounded-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-black dark:text-white">
              Food Orders
            </CardTitle>
            <ShoppingCart className="h-4 w-4 text-black dark:text-white opacity-70" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-black dark:text-white">
              {Object.values(orders.summary).reduce(
                (sum, order) => sum + order.count,
                0
              )}
            </div>
            <p className="text-xs text-black dark:text-white opacity-70">
              {formatCurrency(
                Object.values(orders.summary).reduce(
                  (sum, order) => sum + order.amount,
                  0
                )
              )}{" "}
              revenue
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Revenue Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-white dark:bg-black border border-gray-200 dark:border-gray-800 rounded-sm">
          <CardHeader>
            <CardTitle className="text-black dark:text-white">
              Revenue Trend
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart
                data={revenueChartData}
                margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
              >
                <defs>
                  <linearGradient
                    id="revenueGradient"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop
                      offset="5%"
                      stopColor={CHART_COLORS.primary}
                      stopOpacity={0.3}
                    />
                    <stop
                      offset="95%"
                      stopColor={CHART_COLORS.primary}
                      stopOpacity={0.05}
                    />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="hsl(var(--border))"
                  strokeOpacity={0.3}
                />
                <XAxis
                  dataKey="date"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                />
                <Tooltip
                  formatter={(value) => [
                    formatCurrency(Number(value)),
                    "Revenue",
                  ]}
                  labelStyle={{ color: "hsl(var(--foreground))" }}
                  contentStyle={{
                    backgroundColor: "hsl(var(--background))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                    boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke={CHART_COLORS.primary}
                  fill="url(#revenueGradient)"
                  strokeWidth={3}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-black border border-gray-200 dark:border-gray-800 rounded-sm">
          <CardHeader>
            <CardTitle className="text-black dark:text-white">
              Payment Methods
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={paymentMethodData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }: any) =>
                    `${name} ${(percent * 100).toFixed(0)}%`
                  }
                  outerRadius={90}
                  innerRadius={40}
                  fill="#8884d8"
                  dataKey="value"
                  stroke="hsl(var(--background))"
                  strokeWidth={2}
                >
                  {paymentMethodData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={PIE_COLORS[index % PIE_COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value) => [
                    formatCurrency(Number(value)),
                    "Amount",
                  ]}
                  contentStyle={{
                    backgroundColor: "hsl(var(--background))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                    boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Occupancy Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-white dark:bg-black border border-gray-200 dark:border-gray-800 rounded-sm">
          <CardHeader>
            <CardTitle className="text-black dark:text-white">
              Service Tickets Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={ticketStatusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }: any) =>
                    `${name} ${(percent * 100).toFixed(0)}%`
                  }
                  outerRadius={90}
                  innerRadius={40}
                  fill="#8884d8"
                  dataKey="value"
                  stroke="hsl(var(--background))"
                  strokeWidth={2}
                >
                  {ticketStatusData.map((entry: any, index: number) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={PIE_COLORS[index % PIE_COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value) => [`${value} tickets`, "Count"]}
                  contentStyle={{
                    backgroundColor: "hsl(var(--background))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                    boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-black border border-gray-200 dark:border-gray-800 rounded-sm">
          <CardHeader>
            <CardTitle className="text-black dark:text-white">
              Occupancy by Room Type
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={occupancyByTypeData}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="hsl(var(--border))"
                  strokeOpacity={0.3}
                />
                <XAxis
                  dataKey="type"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--background))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                    boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                  }}
                />
                <Legend />
                <Bar
                  dataKey="total"
                  fill={CHART_COLORS.muted}
                  name="Total Rooms"
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  dataKey="occupied"
                  fill={CHART_COLORS.primary}
                  name="Occupied"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Guest Analytics */}
      <Card className="bg-white dark:bg-black border border-gray-200 dark:border-gray-800 rounded-sm">
        <CardHeader>
          <CardTitle className="text-black dark:text-white">
            Guest Check-ins Trend
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart
              data={guestTrendData}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="hsl(var(--border))"
                strokeOpacity={0.3}
              />
              <XAxis
                dataKey="date"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--background))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                  boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="checkIns"
                stroke={CHART_COLORS.primary}
                strokeWidth={3}
                dot={{ r: 4, strokeWidth: 2 }}
                activeDot={{ r: 6, strokeWidth: 2 }}
                name="Check-ins"
              />
              <Line
                type="monotone"
                dataKey="checkOuts"
                stroke={CHART_COLORS.destructive}
                strokeWidth={3}
                dot={{ r: 4, strokeWidth: 2 }}
                activeDot={{ r: 6, strokeWidth: 2 }}
                name="Check-outs"
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Food Orders & Service Tickets */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-white dark:bg-black border border-gray-200 dark:border-gray-800 rounded-sm">
          <CardHeader>
            <CardTitle className="text-black dark:text-white">
              Food Orders Trend
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart
                data={orderTrendData}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <defs>
                  <linearGradient
                    id="revenueGradient"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop
                      offset="5%"
                      stopColor={CHART_COLORS.primary}
                      stopOpacity={0.8}
                    />
                    <stop
                      offset="95%"
                      stopColor={CHART_COLORS.primary}
                      stopOpacity={0.1}
                    />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="hsl(var(--border))"
                  strokeOpacity={0.3}
                />
                <XAxis
                  dataKey="date"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                />
                <Tooltip
                  formatter={(value) => [
                    formatCurrency(Number(value)),
                    "Revenue",
                  ]}
                  contentStyle={{
                    backgroundColor: "hsl(var(--background))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                    boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke={CHART_COLORS.primary}
                  strokeWidth={2}
                  fill="url(#revenueGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-black border border-gray-200 dark:border-gray-800 rounded-sm">
          <CardHeader>
            <CardTitle className="text-black dark:text-white">
              Hourly Order Trends
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={hourlyOrderData}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="hsl(var(--border))"
                  strokeOpacity={0.3}
                />
                <XAxis
                  dataKey="hour"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--background))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                    boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                  }}
                />
                <Legend />
                <Bar
                  dataKey="orders"
                  fill={CHART_COLORS.primary}
                  name="Orders"
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  dataKey="revenue"
                  fill={CHART_COLORS.secondary}
                  name="Revenue (₹)"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Service Tickets Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="bg-white dark:bg-black border border-gray-200 dark:border-gray-800 rounded-sm">
          <CardHeader>
            <CardTitle className="text-black dark:text-white">
              Ticket Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {Object.entries(tickets.summary).map(([status, count]) => (
                <div key={status} className="flex justify-between items-center">
                  <span className="capitalize text-black dark:text-white">
                    {status.replace("_", " ")}
                  </span>
                  <Badge
                    variant="outline"
                    className="bg-white dark:bg-black border-gray-200 dark:border-gray-800 text-black dark:text-white rounded-sm"
                  >
                    {count}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-black border border-gray-200 dark:border-gray-800 rounded-sm">
          <CardHeader>
            <CardTitle className="text-black dark:text-white">
              Tickets by Category
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {tickets.byCategory.map((category) => (
                <div
                  key={category._id}
                  className="flex justify-between items-center"
                >
                  <span className="capitalize text-black dark:text-white">
                    {category._id.replace("_", " ")}
                  </span>
                  <Badge
                    variant="outline"
                    className="bg-white dark:bg-black border-gray-200 dark:border-gray-800 text-black dark:text-white rounded-sm"
                  >
                    {category.count}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-black border border-gray-200 dark:border-gray-800 rounded-sm">
          <CardHeader>
            <CardTitle className="text-black dark:text-white">
              Tickets by Priority
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {tickets.byPriority.map((priority) => (
                <div
                  key={priority._id}
                  className="flex justify-between items-center"
                >
                  <span className="capitalize text-black dark:text-white">
                    {priority._id}
                  </span>
                  <Badge className="bg-white dark:bg-black border-gray-200 dark:border-gray-800 text-black dark:text-white rounded-sm">
                    {priority.count}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-white dark:bg-black border border-gray-200 dark:border-gray-800 rounded-sm">
          <CardHeader>
            <CardTitle className="text-sm text-black dark:text-white">
              Average Bill Amount
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-black dark:text-white">
              {formatCurrency(revenue.summary.averageBillAmount)}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-black border border-gray-200 dark:border-gray-800 rounded-sm">
          <CardHeader>
            <CardTitle className="text-sm text-black dark:text-white">
              Outstanding Amount
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-black dark:text-white">
              {formatCurrency(revenue.summary.totalOutstanding)}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-black border border-gray-200 dark:border-gray-800 rounded-sm">
          <CardHeader>
            <CardTitle className="text-sm text-black dark:text-white">
              Average Stay Duration
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-black dark:text-white">
              {occupancy.averageStay.toFixed(1)} days
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-black border border-gray-200 dark:border-gray-800 rounded-sm">
          <CardHeader>
            <CardTitle className="text-sm text-black dark:text-white">
              Food vs Room Revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-black dark:text-white opacity-70">
                  Room:
                </span>
                <span className="font-medium text-black dark:text-white">
                  {formatCurrency(revenue.summary.totalRoomCharges)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-black dark:text-white opacity-70">
                  Food:
                </span>
                <span className="font-medium text-black dark:text-white">
                  {formatCurrency(revenue.summary.totalFoodRevenue)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
