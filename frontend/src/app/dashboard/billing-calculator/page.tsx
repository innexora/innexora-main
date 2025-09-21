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
import { Badge } from "@/components/ui/badge";
import {
  Calculator,
  Calendar,
  Clock,
  IndianRupee,
  Info,
  Hotel,
  Users,
  TrendingUp,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { useTenantContext } from "@/components/tenant/tenant-provider";

interface BillingCalculation {
  baseCharges: number;
  earlyCheckinCharges: number;
  lateCheckoutCharges: number;
  totalCharges: number;
  nights: number;
  roomPrice: number;
  policies: {
    standard_checkin_time: number;
    standard_checkout_time: number;
    early_checkin_policy: string;
    late_checkout_policy: string;
  };
  breakdown: {
    baseNights: number;
    baseAmount: number;
    earlyCheckinAmount: number;
    lateCheckoutAmount: number;
    totalAmount: number;
  };
}

export default function BillingCalculatorPage() {
  const { hotel } = useTenantContext();
  const [roomPrice, setRoomPrice] = useState<number>(0);
  const [checkInDate, setCheckInDate] = useState<string>(() => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  });
  const [checkInTime, setCheckInTime] = useState<string>("14:00");
  const [checkOutDate, setCheckOutDate] = useState<string>(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split("T")[0];
  });
  const [checkOutTime, setCheckOutTime] = useState<string>("11:00");
  const [calculation, setCalculation] = useState<BillingCalculation | null>(
    null
  );
  const [isCalculating, setIsCalculating] = useState(false);
  const [isLoadingPolicies, setIsLoadingPolicies] = useState(true);

  // Hotel policies from current tenant
  const [hotelPolicies, setHotelPolicies] = useState({
    standard_checkin_time: 14, // Default fallback
    standard_checkout_time: 11, // Default fallback
    early_checkin_policy: "half_rate", // Default fallback
    late_checkout_policy: "half_rate", // Default fallback
  });

  // Load hotel policies on component mount
  useEffect(() => {
    if (hotel) {
      setHotelPolicies({
        standard_checkin_time: hotel.standard_checkin_time || 14,
        standard_checkout_time: hotel.standard_checkout_time || 11,
        early_checkin_policy: hotel.early_checkin_policy || "half_rate",
        late_checkout_policy: hotel.late_checkout_policy || "half_rate",
      });

      // Set default times based on hotel policies
      setCheckInTime(
        `${String(hotel.standard_checkin_time || 14).padStart(2, "0")}:00`
      );
      setCheckOutTime(
        `${String(hotel.standard_checkout_time || 11).padStart(2, "0")}:00`
      );

      setIsLoadingPolicies(false);
    }
  }, [hotel]);

  const calculateNights = (checkIn: Date, checkOut: Date): number => {
    const timeDiff = checkOut.getTime() - checkIn.getTime();
    const days = timeDiff / (1000 * 60 * 60 * 24);
    return Math.max(1, Math.ceil(days));
  };

  const calculateEarlyCheckinCharges = (
    checkInDate: Date,
    standardCheckinTime: number,
    policy: string,
    roomPrice: number
  ): number => {
    const checkInHour = checkInDate.getHours();

    if (checkInHour >= standardCheckinTime) {
      return 0;
    }

    if (checkInHour < 6) {
      return roomPrice;
    }

    if (checkInHour >= 6 && checkInHour < standardCheckinTime) {
      switch (policy) {
        case "free":
          return 0;
        case "half_rate":
          return roomPrice * 0.5;
        case "full_rate":
          return roomPrice;
        default:
          return 0;
      }
    }

    return 0;
  };

  const calculateLateCheckoutCharges = (
    checkOutDate: Date,
    standardCheckoutTime: number,
    policy: string,
    roomPrice: number
  ): number => {
    const checkOutHour = checkOutDate.getHours();

    if (checkOutHour <= standardCheckoutTime) {
      return 0;
    }

    if (checkOutHour > 18) {
      return roomPrice;
    }

    if (checkOutHour > standardCheckoutTime && checkOutHour <= 18) {
      switch (policy) {
        case "free":
          return 0;
        case "half_rate":
          return roomPrice * 0.5;
        case "full_rate":
          return roomPrice;
        default:
          return 0;
      }
    }

    return 0;
  };

  const handleCalculate = () => {
    if (!roomPrice || !checkInDate || !checkOutDate) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsCalculating(true);

    try {
      // Parse dates and times
      const checkInDateTime = new Date(`${checkInDate}T${checkInTime}:00`);
      const checkOutDateTime = new Date(`${checkOutDate}T${checkOutTime}:00`);

      if (checkOutDateTime <= checkInDateTime) {
        toast.error("Check-out date must be after check-in date");
        setIsCalculating(false);
        return;
      }

      // Calculate base charges
      const nights = calculateNights(checkInDateTime, checkOutDateTime);
      const baseCharges = roomPrice * nights;

      // Calculate early check-in charges
      const earlyCheckinCharges = calculateEarlyCheckinCharges(
        checkInDateTime,
        hotelPolicies.standard_checkin_time,
        hotelPolicies.early_checkin_policy,
        roomPrice
      );

      // Calculate late check-out charges
      const lateCheckoutCharges = calculateLateCheckoutCharges(
        checkOutDateTime,
        hotelPolicies.standard_checkout_time,
        hotelPolicies.late_checkout_policy,
        roomPrice
      );

      // Calculate total
      const totalCharges =
        baseCharges + earlyCheckinCharges + lateCheckoutCharges;

      const result: BillingCalculation = {
        baseCharges,
        earlyCheckinCharges,
        lateCheckoutCharges,
        totalCharges,
        nights,
        roomPrice,
        policies: hotelPolicies,
        breakdown: {
          baseNights: nights,
          baseAmount: baseCharges,
          earlyCheckinAmount: earlyCheckinCharges,
          lateCheckoutAmount: lateCheckoutCharges,
          totalAmount: totalCharges,
        },
      };

      setCalculation(result);
      toast.success("Billing calculated successfully!");
    } catch (error) {
      console.error("Calculation error:", error);
      toast.error("Error calculating billing");
    } finally {
      setIsCalculating(false);
    }
  };

  const resetCalculator = () => {
    setRoomPrice(0);
    setCheckInDate("");
    setCheckInTime("14:00");
    setCheckOutDate("");
    setCheckOutTime("11:00");
    setCalculation(null);
  };

  const getPolicyText = (policy: string): string => {
    switch (policy) {
      case "free":
        return "Free";
      case "half_rate":
        return "Half Rate";
      case "full_rate":
        return "Full Rate";
      default:
        return "Unknown";
    }
  };

  return (
    <div className="flex-1 space-y-4">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="rounded-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-black dark:text-white">
              Standard Check-in
            </CardTitle>
            <Clock className="h-4 w-4 text-black dark:text-white opacity-70" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-medium text-black dark:text-white">
              {hotelPolicies.standard_checkin_time}:00
            </div>
            <p className="text-xs text-black dark:text-white opacity-70">
              {hotelPolicies.standard_checkin_time === 12
                ? "Noon"
                : hotelPolicies.standard_checkin_time > 12
                ? "PM"
                : "AM"}
            </p>
          </CardContent>
        </Card>
        <Card className="rounded-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-black dark:text-white">
              Standard Check-out
            </CardTitle>
            <Clock className="h-4 w-4 text-black dark:text-white opacity-70" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-medium text-black dark:text-white">
              {hotelPolicies.standard_checkout_time}:00
            </div>
            <p className="text-xs text-black dark:text-white opacity-70">
              {hotelPolicies.standard_checkout_time === 12
                ? "Noon"
                : hotelPolicies.standard_checkout_time > 12
                ? "PM"
                : "AM"}
            </p>
          </CardContent>
        </Card>
        <Card className="rounded-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-black dark:text-white">
              Early Check-in Policy
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-black dark:text-white opacity-70" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-medium text-black dark:text-white">
              {getPolicyText(hotelPolicies.early_checkin_policy)}
            </div>
            <p className="text-xs text-black dark:text-white opacity-70">
              Before standard time
            </p>
          </CardContent>
        </Card>
        <Card className="rounded-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-black dark:text-white">
              Late Check-out Policy
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-black dark:text-white opacity-70" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-medium text-black dark:text-white">
              {getPolicyText(hotelPolicies.late_checkout_policy)}
            </div>
            <p className="text-xs text-black dark:text-white opacity-70">
              After standard time
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Calculator Form */}
        <Card className="rounded-sm">
          <CardHeader>
            <CardTitle>Calculate Guest Billing</CardTitle>
            <CardDescription>
              Enter guest details to calculate total billing including early
              check-in and late check-out charges
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="roomPrice">Room Price per Night (₹)</Label>
              <Input
                id="roomPrice"
                type="number"
                placeholder="e.g., 2500"
                value={roomPrice || ""}
                onChange={(e) => setRoomPrice(Number(e.target.value))}
                className="rounded-sm"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="checkInDate">Check-in Date</Label>
                <Input
                  id="checkInDate"
                  type="date"
                  value={checkInDate}
                  onChange={(e) => setCheckInDate(e.target.value)}
                  className="rounded-sm"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="checkInTime">Check-in Time</Label>
                <Input
                  id="checkInTime"
                  type="time"
                  value={checkInTime}
                  onChange={(e) => setCheckInTime(e.target.value)}
                  className="rounded-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="checkOutDate">Check-out Date</Label>
                <Input
                  id="checkOutDate"
                  type="date"
                  value={checkOutDate}
                  onChange={(e) => setCheckOutDate(e.target.value)}
                  className="rounded-sm"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="checkOutTime">Check-out Time</Label>
                <Input
                  id="checkOutTime"
                  type="time"
                  value={checkOutTime}
                  onChange={(e) => setCheckOutTime(e.target.value)}
                  className="rounded-sm"
                />
              </div>
            </div>

            <div className="flex space-x-2">
              <Button
                onClick={handleCalculate}
                disabled={isCalculating}
                className="flex-1 rounded-sm"
              >
                {isCalculating ? "Calculating..." : "Calculate Billing"}
              </Button>
              <Button
                variant="outline"
                onClick={resetCalculator}
                className="rounded-sm"
              >
                Reset
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        <Card className="rounded-sm">
          <CardHeader>
            <CardTitle>Billing Breakdown</CardTitle>
            <CardDescription>
              {calculation
                ? "Detailed billing calculation"
                : "Results will appear here after calculation"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {calculation ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="text-sm text-muted-foreground">
                      Total Nights
                    </div>
                    <div className="text-lg font-semibold">
                      {calculation.nights}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="text-sm text-muted-foreground">
                      Room Rate
                    </div>
                    <div className="text-lg font-semibold">
                      ₹{calculation.roomPrice.toLocaleString()}
                    </div>
                  </div>
                </div>

                <div className="space-y-3 border-t pt-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">
                      Base Room Charges ({calculation.nights} nights)
                    </span>
                    <span className="font-medium">
                      ₹{calculation.baseCharges.toLocaleString()}
                    </span>
                  </div>

                  {calculation.earlyCheckinCharges > 0 && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Early Check-in Charges</span>
                      <span className="font-medium text-orange-600">
                        +₹{calculation.earlyCheckinCharges.toLocaleString()}
                      </span>
                    </div>
                  )}

                  {calculation.lateCheckoutCharges > 0 && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Late Check-out Charges</span>
                      <span className="font-medium text-orange-600">
                        +₹{calculation.lateCheckoutCharges.toLocaleString()}
                      </span>
                    </div>
                  )}
                </div>

                <div className="border-t pt-4">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-semibold">Total Amount</span>
                    <span className="text-2xl font-bold text-green-600">
                      ₹{calculation.totalCharges.toLocaleString()}
                    </span>
                  </div>
                </div>

                {(calculation.earlyCheckinCharges > 0 ||
                  calculation.lateCheckoutCharges > 0) && (
                  <div className="bg-amber-50 dark:bg-amber-950/50 p-3 rounded-sm border border-amber-200 dark:border-amber-800">
                    <div className="flex items-start space-x-2">
                      <Info className="h-4 w-4 text-amber-600 mt-0.5" />
                      <div className="text-sm text-amber-800 dark:text-amber-200">
                        Additional charges applied due to early check-in or late
                        check-out based on hotel policies.
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Calculator className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>
                  Enter guest details and click calculate to see billing
                  breakdown
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
