"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Building2,
  Ticket,
  Menu,
  X,
  LogOut,
  Bell,
  Search,
  Users,
  Settings,
  Hotel,
  MessageSquare,
  UtensilsCrossed,
  Receipt,
  UserCheck,
  History,
  BarChart3,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ThemeToggle } from "@/components/theme-toggle";
import { useAuthStore } from "@/store/auth-store";
import { useTenantContext } from "@/components/tenant/tenant-provider";
import ProtectedRoute from "@/components/auth/protected-route";
import { logout } from "@/lib/api/auth";
import { toast } from "sonner";
import Image from "next/image";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const pathname = usePathname();
  const { user, setIsAuthenticated, setUser } = useAuthStore();
  const { hotel } = useTenantContext();

  const navItems = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Rooms", href: "/dashboard/rooms", icon: Building2 },
    { name: "Guests", href: "/dashboard/guests", icon: UserCheck },
    { name: "Guest History", href: "/dashboard/guest-history", icon: History },
    { name: "Food Menu", href: "/dashboard/food", icon: UtensilsCrossed },
    { name: "Orders", href: "/dashboard/orders", icon: Receipt },
    { name: "Bills", href: "/dashboard/bills", icon: Receipt },
    { name: "Service Requests", href: "/dashboard/tickets", icon: Ticket },
    { name: "Reports", href: "/dashboard/reports", icon: BarChart3 },
  ];

  const handleLogout = async () => {
    try {
      await logout();
      setIsAuthenticated(false);
      setUser(null);
      toast.success("Logged out successfully");
    } catch (error) {
      console.error("Logout error:", error);
      toast.error("Failed to logout");
    }
  };

  return (
    <ProtectedRoute>
      <div className="flex h-screen bg-stone-50 dark:bg-black">
        {/* Mobile sidebar */}
        <div
          className={`fixed inset-0 z-40 lg:hidden ${
            isSidebarOpen ? "block" : "hidden"
          }`}
          onClick={() => setIsSidebarOpen(false)}
        >
          <div className="fixed inset-0 bg-black/20" />
        </div>

        {/* Sidebar */}
        <div
          className={`fixed inset-y-0 left-0 z-50 w-64 transform ${
            isSidebarOpen ? "translate-x-0" : "-translate-x-full"
          } bg-white dark:bg-black border-r border-gray-200 dark:border-gray-800 transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static lg:inset-0`}
        >
          <div className="flex flex-col h-full">
            <div className="flex items-center justify-between h-14 px-6 border-b border-gray-200 dark:border-gray-800">
              <div className="flex items-center space-x-2">
                {hotel?.logo_url ? (
                  <Image
                    src={hotel.logo_url}
                    alt={`${hotel.name || "Hotel"} logo`}
                    width={32}
                    height={32}
                    className="rounded-sm"
                  />
                ) : (
                  <Building2 className="h-6 w-6 text-black dark:text-white" />
                )}
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden h-8 w-8"
                onClick={() => setIsSidebarOpen(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto py-4">
              <nav className="px-3 space-y-1">
                {navItems.map((item) => {
                  const isActive =
                    pathname === item.href ||
                    (item.href !== "/dashboard" &&
                      pathname.startsWith(item.href));
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={`flex items-center px-3 py-2 text-sm font-medium rounded-sm transition-colors ${
                        isActive
                          ? "bg-black text-white dark:bg-white dark:text-black"
                          : "text-black dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-black dark:hover:text-white"
                      }`}
                      onClick={() => setIsSidebarOpen(false)}
                    >
                      <item.icon className="mr-3 h-4 w-4" />
                      {item.name}
                    </Link>
                  );
                })}
              </nav>
            </div>

            {/* User profile */}
            <div className="p-4 border-t border-gray-200 dark:border-gray-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-gray-100 dark:bg-gray-800 text-black dark:text-white text-xs">
                      {user?.name?.charAt(0)?.toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-black dark:text-white truncate">
                      {user?.name || "User"}
                    </p>
                    <p className="text-xs text-black dark:text-white opacity-70">
                      {(user as any)?.role || "Staff"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-1">
                  <ThemeToggle />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleLogout}
                    className="h-8 w-8 p-0"
                  >
                    <LogOut className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="flex flex-col flex-1 overflow-hidden">
          <header className="bg-white dark:bg-black border-b border-gray-200 dark:border-gray-800 h-14 flex items-center px-6">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden mr-2 h-8 w-8"
              onClick={() => setIsSidebarOpen(true)}
            >
              <Menu className="w-4 h-4" />
            </Button>

            <div className="flex-1 flex items-center justify-between">
              <h1 className="text-base font-medium text-black dark:text-white">
                {navItems.find((item) => item.href === pathname)?.name ||
                  (pathname.startsWith("/dashboard/rooms")
                    ? "Rooms"
                    : pathname.startsWith("/dashboard/guests") &&
                      !pathname.startsWith("/dashboard/guest-history")
                    ? "Guests"
                    : pathname.startsWith("/dashboard/guest-history")
                    ? "Guest History"
                    : pathname.startsWith("/dashboard/food")
                    ? "Food Menu"
                    : pathname.startsWith("/dashboard/orders")
                    ? "Orders"
                    : pathname.startsWith("/dashboard/bills")
                    ? "Bills"
                    : pathname.startsWith("/dashboard/tickets")
                    ? "Service Requests"
                    : pathname.startsWith("/dashboard/reports")
                    ? "Reports"
                    : "Dashboard")}
              </h1>

              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Bell className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </header>

          <main className="flex-1 overflow-y-auto bg-stone-50 dark:bg-black p-6">
            {children}
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}
