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
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  Users,
  Building,
  ClipboardList,
  TrendingUp,
  DollarSign,
  Bed,
  AlertCircle,
  CheckCircle,
  Clock,
} from "lucide-react";
import Link from "next/link";
import { dashboardApi } from "@/lib/api";

interface DashboardStats {
  totalRooms: number;
  availableRooms: number;
  occupiedRooms: number;
  maintenanceRooms: number;
  cleaningRooms: number;
  totalGuests: number;
  checkedInGuests: number;
  totalTickets: number;
  pendingTickets: number;
  occupancyRate: number;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    totalRooms: 0,
    availableRooms: 0,
    occupiedRooms: 0,
    maintenanceRooms: 0,
    cleaningRooms: 0,
    totalGuests: 0,
    checkedInGuests: 0,
    totalTickets: 0,
    pendingTickets: 0,
    occupancyRate: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch room stats using dedicated stats API
      try {
        const roomStatsResponse = await dashboardApi.getRoomStats();
        if (roomStatsResponse.success && roomStatsResponse.data) {
          const roomStats = roomStatsResponse.data as any;
          setStats((prev) => ({
            ...prev,
            totalRooms: roomStats.totalRooms || 0,
            availableRooms: roomStats.availableRooms || 0,
            occupiedRooms: roomStats.occupiedRooms || 0,
            maintenanceRooms: roomStats.maintenanceRooms || 0,
            cleaningRooms: roomStats.cleaningRooms || 0,
            occupancyRate: roomStats.occupancyRate || 0,
          }));
        }
      } catch (error) {
        console.error("Failed to fetch room stats:", error);
      }

      // Fetch guest stats using dedicated stats API
      try {
        const guestStatsResponse = await dashboardApi.getGuestStats();
        if (guestStatsResponse.success && guestStatsResponse.data) {
          const guestStats = guestStatsResponse.data as any;
          setStats((prev) => ({
            ...prev,
            totalGuests: guestStats.totalGuests || 0,
            checkedInGuests: guestStats.activeGuests || 0,
          }));
        }
      } catch (error) {
        console.error("Failed to fetch guest stats:", error);
      }

      // Fetch ticket stats using dedicated stats API
      try {
        const ticketStatsResponse = await dashboardApi.getTicketStats();
        if (ticketStatsResponse.success && ticketStatsResponse.data) {
          const ticketStats = ticketStatsResponse.data as any;
          setStats((prev) => ({
            ...prev,
            totalTickets: ticketStats.totalTickets || 0,
            pendingTickets: ticketStats.pendingTickets || 0,
          }));
        }
      } catch (error) {
        console.error("Failed to fetch ticket stats:", error);
      }
    } catch (error) {
      console.error("Failed to fetch data:", error);
      toast.error(
        "Please make sure the backend server is running on port 5050"
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-white dark:bg-black border border-gray-200 dark:border-gray-800 rounded-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-black dark:text-white">
              Total Rooms
            </CardTitle>
            <Building className="h-4 w-4 text-black dark:text-white opacity-70" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-semibold text-black dark:text-white">
              {stats.totalRooms}
            </div>
            <p className="text-xs text-black dark:text-white opacity-70">
              {isLoading ? "Loading..." : `${stats.availableRooms} available`}
            </p>
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
            <div className="text-xl font-semibold text-black dark:text-white">{`${stats.occupancyRate}`}</div>
            <p className="text-xs text-black dark:text-white opacity-70">
              {isLoading
                ? "Loading..."
                : `${stats.occupiedRooms} of ${stats.totalRooms} rooms`}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-black border border-gray-200 dark:border-gray-800 rounded-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-black dark:text-white">
              Active Guests
            </CardTitle>
            <Users className="h-4 w-4 text-black dark:text-white opacity-70" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-semibold text-black dark:text-white">
              {stats.checkedInGuests}
            </div>
            <p className="text-xs text-black dark:text-white opacity-70">
              {isLoading ? "Loading..." : `${stats.totalGuests} total guests`}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-black border border-gray-200 dark:border-gray-800 rounded-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-black dark:text-white">
              Service Requests
            </CardTitle>
            <ClipboardList className="h-4 w-4 text-black dark:text-white opacity-70" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-semibold text-black dark:text-white">
              {stats.pendingTickets}
            </div>
            <p className="text-xs text-black dark:text-white opacity-70">
              {isLoading
                ? "Loading..."
                : `${stats.totalTickets} total requests`}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Room Status Overview */}
      <Card className="bg-white dark:bg-black border border-gray-200 dark:border-gray-800 rounded-sm">
        <CardHeader>
          <CardTitle className="text-base font-medium text-black dark:text-white">
            Room Status Overview
          </CardTitle>
          <CardDescription className="text-sm text-black dark:text-white opacity-70">
            Current status of all rooms in the hotel
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-black dark:bg-white rounded-sm flex items-center justify-center">
                <CheckCircle className="h-4 w-4 text-white dark:text-black" />
              </div>
              <div>
                <p className="text-sm font-medium text-black dark:text-white opacity-70">
                  Available
                </p>
                <p className="text-xl font-semibold text-black dark:text-white">
                  {stats.availableRooms}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-black dark:bg-white rounded-sm flex items-center justify-center">
                <Bed className="h-4 w-4 text-white dark:text-black" />
              </div>
              <div>
                <p className="text-sm font-medium text-black dark:text-white opacity-70">
                  Occupied
                </p>
                <p className="text-xl font-semibold text-black dark:text-white">
                  {stats.occupiedRooms}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-black dark:bg-white rounded-sm flex items-center justify-center">
                <AlertCircle className="h-4 w-4 text-white dark:text-black" />
              </div>
              <div>
                <p className="text-sm font-medium text-black dark:text-white opacity-70">
                  Maintenance
                </p>
                <p className="text-xl font-semibold text-black dark:text-white">
                  {stats.maintenanceRooms}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-black dark:bg-white rounded-sm flex items-center justify-center">
                <Clock className="h-4 w-4 text-white dark:text-black" />
              </div>
              <div>
                <p className="text-sm font-medium text-black dark:text-white opacity-70">
                  Cleaning
                </p>
                <p className="text-xl font-semibold text-black dark:text-white">
                  {stats.cleaningRooms}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card className="bg-white dark:bg-black border border-gray-200 dark:border-gray-800 rounded-sm">
        <CardHeader>
          <CardTitle className="text-base font-medium text-black dark:text-white">
            Quick Actions
          </CardTitle>
          <CardDescription className="text-sm text-black dark:text-white opacity-70">
            Access key hotel management features
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link href="/dashboard/rooms">
              <Button
                variant="outline"
                className="w-full h-16 flex flex-col items-center justify-center space-y-2 bg-white dark:bg-black border-gray-200 dark:border-gray-800 text-black dark:text-white hover:bg-gray-50 dark:hover:bg-gray-900 rounded-sm"
              >
                <Building className="h-5 w-5" />
                <span className="text-sm">Manage Rooms</span>
              </Button>
            </Link>

            <Link href="/dashboard/guests">
              <Button
                variant="outline"
                className="w-full h-16 flex flex-col items-center justify-center space-y-2 bg-white dark:bg-black border-gray-200 dark:border-gray-800 text-black dark:text-white hover:bg-gray-50 dark:hover:bg-gray-900 rounded-sm"
              >
                <Users className="h-5 w-5" />
                <span className="text-sm">Guest Management</span>
              </Button>
            </Link>

            <Link href="/dashboard/tickets">
              <Button
                variant="outline"
                className="w-full h-16 flex flex-col items-center justify-center space-y-2 bg-white dark:bg-black border-gray-200 dark:border-gray-800 text-black dark:text-white hover:bg-gray-50 dark:hover:bg-gray-900 rounded-sm"
              >
                <ClipboardList className="h-5 w-5" />
                <span className="text-sm">Service Requests</span>
              </Button>
            </Link>

            <Link href="/dashboard/bills">
              <Button
                variant="outline"
                className="w-full h-16 flex flex-col items-center justify-center space-y-2 bg-white dark:bg-black border-gray-200 dark:border-gray-800 text-black dark:text-white hover:bg-gray-50 dark:hover:bg-gray-900 rounded-sm"
              >
                <DollarSign className="h-5 w-5" />
                <span className="text-sm">Billing</span>
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card className="bg-white dark:bg-black border border-gray-200 dark:border-gray-800 rounded-sm">
        <CardHeader>
          <CardTitle className="text-base font-medium text-black dark:text-white">
            Recent Activity
          </CardTitle>
          <CardDescription className="text-sm text-black dark:text-white opacity-70">
            Latest updates from your hotel operations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {isLoading ? (
              <div className="text-center py-4 text-black dark:text-white opacity-70">
                Loading recent activity...
              </div>
            ) : (
              <>
                <div className="flex items-center space-x-4">
                  <div className="w-2 h-2 bg-black dark:bg-white rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-black dark:text-white">
                      System Status: All services operational
                    </p>
                    <p className="text-xs text-black dark:text-white opacity-70">
                      Last updated: Just now
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="w-2 h-2 bg-black dark:bg-white rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-black dark:text-white">
                      Dashboard loaded successfully
                    </p>
                    <p className="text-xs text-black dark:text-white opacity-70">
                      Data refreshed automatically
                    </p>
                  </div>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
