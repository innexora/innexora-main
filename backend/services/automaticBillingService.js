const databaseManager = require("../utils/databaseManager");

/**
 * Automatic Billing Service
 * Calculates charges based on hotel policies for early check-in and late check-out
 */
class AutomaticBillingService {
  /**
   * Calculate automatic billing charges for a guest
   * @param {Object} guest - Guest object with checkInDate, checkOutDate, room
   * @param {Object} room - Room object with price
   * @param {String} hotelSubdomain - Hotel subdomain to get policies
   * @returns {Object} Billing calculation result
   */
  static async calculateAutomaticBilling(guest, room, hotelSubdomain) {
    try {
      // Get hotel policies from main database using database manager
      const mainConnection = databaseManager.getMainConnection();
      const MainHotel = mainConnection.model(
        "MainHotel",
        require("../models/MainHotel").schema
      );

      const hotel = await MainHotel.findOne({ subdomain: hotelSubdomain });
      if (!hotel) {
        throw new Error(`Hotel with subdomain ${hotelSubdomain} not found`);
      }

      const {
        standard_checkin_time,
        standard_checkout_time,
        early_checkin_policy,
        late_checkout_policy,
      } = hotel;

      // Parse dates
      // Use actual check-in date if available, otherwise use expected check-in date
      const checkInDate = guest.actualCheckInDate
        ? new Date(guest.actualCheckInDate)
        : new Date(guest.checkInDate);

      // CRITICAL FIX: For guests still checked in, use current date instead of expected checkOutDate
      // This ensures billing increases as time passes for guests who haven't checked out
      let checkOutDate;
      if (guest.status === "checked_in" && !guest.actualCheckOutDate) {
        // Guest is still checked in - use current time for billing calculation
        checkOutDate = new Date();
        console.log(
          `📊 Guest ${guest.name} still checked in - calculating billing until current time`
        );
      } else if (guest.actualCheckOutDate) {
        // Guest has checked out - use actual checkout time
        checkOutDate = new Date(guest.actualCheckOutDate);
      } else {
        // Guest is not checked in or fallback - use expected checkout date
        checkOutDate = new Date(guest.checkOutDate);
      }

      const roomPrice = room.price || 0;

      console.log(`💵 Billing calculation for guest ${guest.name}:`, {
        roomPrice,
        roomObject: { price: room.price, number: room.number, type: room.type },
        checkInDate: checkInDate.toISOString(),
        checkOutDate: checkOutDate.toISOString(),
        hotelPolicies: {
          early_checkin_policy,
          late_checkout_policy,
          standard_checkin_time,
          standard_checkout_time,
        },
      });

      // Calculate base charges (nights × room_rate)
      // Nights are counted up to standard checkout time - late checkout fees cover extra time
      const nights = this.calculateNights(
        checkInDate,
        checkOutDate,
        standard_checkout_time,
        hotel.timezone || "Asia/Kolkata"
      );
      const baseCharges = roomPrice * nights;

      // Calculate early check-in charges using hotel timezone
      const earlyCheckinCharges = this.calculateEarlyCheckinCharges(
        checkInDate,
        standard_checkin_time,
        early_checkin_policy,
        roomPrice,
        hotel.timezone || "Asia/Kolkata" // Use hotel timezone or India as default
      );

      // Calculate late check-out charges using hotel timezone
      const lateCheckoutCharges = this.calculateLateCheckoutCharges(
        checkOutDate,
        standard_checkout_time,
        late_checkout_policy,
        roomPrice,
        hotel.timezone || "Asia/Kolkata" // Use hotel timezone or India as default
      );

      // Calculate total
      const totalCharges =
        baseCharges + earlyCheckinCharges + lateCheckoutCharges;

      return {
        baseCharges,
        earlyCheckinCharges,
        lateCheckoutCharges,
        totalCharges,
        nights,
        roomPrice,
        checkInDate,
        checkOutDate, // This will now be current time for ongoing stays
        isOngoingStay:
          guest.status === "checked_in" && !guest.actualCheckOutDate,
        policies: {
          standard_checkin_time,
          standard_checkout_time,
          early_checkin_policy,
          late_checkout_policy,
        },
        breakdown: {
          baseNights: nights,
          baseAmount: baseCharges,
          earlyCheckinAmount: earlyCheckinCharges,
          lateCheckoutAmount: lateCheckoutCharges,
          totalAmount: totalCharges,
        },
      };
    } catch (error) {
      console.error("Error calculating automatic billing:", error);
      throw error;
    }
  }

  /**
   * Calculate number of nights between check-in and check-out
   * Nights are calculated up to the standard checkout time on the checkout date
   * Any time after standard checkout is charged separately via late checkout fees
   * @param {Date} checkInDate - Check-in date
   * @param {Date} checkOutDate - Check-out date
   * @param {Number} standardCheckoutTime - Standard checkout hour (0-23)
   * @param {String} timezone - Hotel timezone
   * @returns {Number} Number of nights
   */
  static calculateNights(
    checkInDate,
    checkOutDate,
    standardCheckoutTime = 12,
    timezone = "Asia/Kolkata"
  ) {
    // Get calendar dates in the hotel's timezone
    const checkInDateStr = checkInDate.toLocaleString("en-US", {
      timeZone: timezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });

    const checkOutDateStr = checkOutDate.toLocaleString("en-US", {
      timeZone: timezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });

    // Parse the date strings to get calendar days (MM/DD/YYYY format)
    const [checkInMonth, checkInDay, checkInYear] = checkInDateStr.split("/");
    const [checkOutMonth, checkOutDay, checkOutYear] =
      checkOutDateStr.split("/");

    // Create UTC dates at midnight for comparison
    const checkInCalendar = new Date(
      Date.UTC(
        parseInt(checkInYear),
        parseInt(checkInMonth) - 1,
        parseInt(checkInDay),
        0,
        0,
        0,
        0
      )
    );

    const checkOutCalendar = new Date(
      Date.UTC(
        parseInt(checkOutYear),
        parseInt(checkOutMonth) - 1,
        parseInt(checkOutDay),
        0,
        0,
        0,
        0
      )
    );

    // Calculate difference in calendar days
    const timeDiff = checkOutCalendar.getTime() - checkInCalendar.getTime();
    const nights = timeDiff / (1000 * 60 * 60 * 24);

    // Minimum 1 night, even for same-day checkout
    return Math.max(1, Math.round(nights));
  }

  /**
   * Calculate early check-in charges based on hotel policy
   * @param {Date} checkInDate - Actual check-in date
   * @param {Number} standardCheckinTime - Standard check-in time (0-23)
   * @param {String} policy - Early check-in policy (free/half_rate/full_rate)
   * @param {Number} roomPrice - Room price per night
   * @returns {Number} Early check-in charges
   */
  static calculateEarlyCheckinCharges(
    checkInDate,
    standardCheckinTime,
    policy,
    roomPrice,
    timezone = "Asia/Kolkata"
  ) {
    // Get the hour in the hotel's timezone
    const checkInHour = parseInt(
      checkInDate.toLocaleString("en-US", {
        timeZone: timezone,
        hour: "numeric",
        hour12: false,
      })
    );

    // If check-in is at or after standard time, no early check-in charges
    if (checkInHour >= standardCheckinTime) {
      return 0;
    }

    // If check-in is before 6 AM, always charge full night (previous night)
    if (checkInHour < 6) {
      return roomPrice;
    }

    // If check-in is between 6 AM and standard check-in time, apply policy
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
  }

  /**
   * Calculate late check-out charges based on hotel policy
   * @param {Date} checkOutDate - Actual check-out date
   * @param {Number} standardCheckoutTime - Standard check-out time (0-23)
   * @param {String} policy - Late check-out policy (free/half_rate/full_rate)
   * @param {Number} roomPrice - Room price per night
   * @returns {Number} Late check-out charges
   */
  static calculateLateCheckoutCharges(
    checkOutDate,
    standardCheckoutTime,
    policy,
    roomPrice,
    timezone = "Asia/Kolkata"
  ) {
    // Get the hour in the hotel's timezone
    const checkOutHour = parseInt(
      checkOutDate.toLocaleString("en-US", {
        timeZone: timezone,
        hour: "numeric",
        hour12: false,
      })
    );

    console.log(`🕐 Late checkout calculation:`, {
      checkOutDate: checkOutDate.toISOString(),
      checkOutHour,
      standardCheckoutTime,
      policy,
      roomPrice,
      timezone,
    });

    // If check-out is at or before standard time, no late check-out charges
    if (checkOutHour <= standardCheckoutTime) {
      console.log(
        `✅ No late checkout - checked out at ${checkOutHour}, standard is ${standardCheckoutTime}`
      );
      return 0;
    }

    // If check-out is after standard time, apply the hotel's policy
    if (checkOutHour > standardCheckoutTime) {
      let charge = 0;
      switch (policy) {
        case "free":
          charge = 0;
          break;
        case "half_rate":
          charge = roomPrice * 0.5;
          break;
        case "full_rate":
          charge = roomPrice;
          break;
        default:
          charge = 0;
      }
      console.log(
        `💰 Late checkout at ${checkOutHour} (after ${standardCheckoutTime}) - policy: ${policy}, charging: ${charge}`
      );
      return charge;
    }

    return 0;
  }

  /**
   * Generate billing items for automatic charges
   * @param {Object} billingCalculation - Result from calculateAutomaticBilling
   * @param {String} roomNumber - Room number
   * @returns {Array} Array of billing items
   */
  static generateBillingItems(billingCalculation, roomNumber) {
    const items = [];
    const { breakdown, policies } = billingCalculation;

    // Base room charges
    if (breakdown.baseAmount > 0) {
      items.push({
        type: "room_charge",
        description: `Room ${roomNumber} - ${breakdown.baseNights} night(s)`,
        amount: breakdown.baseAmount,
        quantity: breakdown.baseNights,
        unitPrice: breakdown.roomPrice,
        addedBy: "System",
        date: new Date(),
        notes: "Automatic room charge",
      });
    }

    // Early check-in charges
    if (breakdown.earlyCheckinAmount > 0) {
      const policyText = this.getPolicyText(policies.early_checkin_policy);
      items.push({
        type: "service_charge",
        description: `Early Check-in (${policyText})`,
        amount: breakdown.earlyCheckinAmount,
        quantity: 1,
        unitPrice: breakdown.earlyCheckinAmount,
        addedBy: "System",
        date: new Date(),
        notes: `Early check-in before ${policies.standard_checkin_time}:00`,
      });
    }

    // Late check-out charges
    if (breakdown.lateCheckoutAmount > 0) {
      const policyText = this.getPolicyText(policies.late_checkout_policy);
      items.push({
        type: "service_charge",
        description: `Late Check-out (${policyText})`,
        amount: breakdown.lateCheckoutAmount,
        quantity: 1,
        unitPrice: breakdown.lateCheckoutAmount,
        addedBy: "System",
        date: new Date(),
        notes: `Late check-out after ${policies.standard_checkout_time}:00`,
      });
    }

    return items;
  }

  /**
   * Get human-readable policy text
   * @param {String} policy - Policy value
   * @returns {String} Human-readable text
   */
  static getPolicyText(policy) {
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
  }

  /**
   * Update existing bill with automatic charges
   * @param {Object} bill - Existing bill object
   * @param {Object} guest - Guest object
   * @param {Object} room - Room object
   * @param {String} hotelSubdomain - Hotel subdomain
   * @returns {Object} Updated bill
   */
  static async updateBillWithAutomaticCharges(
    bill,
    guest,
    room,
    hotelSubdomain
  ) {
    try {
      // Calculate new automatic charges
      const billingCalculation = await this.calculateAutomaticBilling(
        guest,
        room,
        hotelSubdomain
      );

      // Remove existing automatic charges (room_charge and service_charge items added by System)
      bill.items = bill.items.filter(
        (item) =>
          !(
            item.addedBy === "System" &&
            (item.type === "room_charge" || item.type === "service_charge") &&
            (item.notes === "Automatic room charge" ||
              (item.notes && item.notes.includes("Early check-in")) ||
              (item.notes && item.notes.includes("Late check-out")))
          )
      );

      // Add new automatic charges
      const newItems = this.generateBillingItems(
        billingCalculation,
        room.number
      );
      bill.items.push(...newItems);

      // Update bill totals (this will be handled by the bill's pre-save middleware)
      await bill.save();

      return {
        bill,
        billingCalculation,
        message: "Bill updated with automatic charges",
      };
    } catch (error) {
      console.error("Error updating bill with automatic charges:", error);
      throw error;
    }
  }

  /**
   * Validate billing calculation for testing
   * @param {Object} testCase - Test case object
   * @param {String} hotelSubdomain - Hotel subdomain
   * @returns {Object} Validation result
   */
  static async validateBillingTestCase(testCase, hotelSubdomain) {
    try {
      const result = await this.calculateAutomaticBilling(
        testCase.guest,
        testCase.room,
        hotelSubdomain
      );

      const expected = testCase.expected;
      const actual = result.totalCharges;

      return {
        testCase: testCase.name,
        expected: expected,
        actual: actual,
        passed: Math.abs(actual - expected) < 0.01, // Allow for small floating point differences
        breakdown: result.breakdown,
      };
    } catch (error) {
      return {
        testCase: testCase.name,
        error: error.message,
        passed: false,
      };
    }
  }
}

module.exports = AutomaticBillingService;
