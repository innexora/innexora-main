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
      const checkInDate = new Date(guest.checkInDate);
      const checkOutDate = new Date(guest.checkOutDate);
      const roomPrice = room.price || 0;

      // Calculate base charges (nights × room_rate)
      const nights = this.calculateNights(checkInDate, checkOutDate);
      const baseCharges = roomPrice * nights;

      // Calculate early check-in charges
      const earlyCheckinCharges = this.calculateEarlyCheckinCharges(
        checkInDate,
        standard_checkin_time,
        early_checkin_policy,
        roomPrice
      );

      // Calculate late check-out charges
      const lateCheckoutCharges = this.calculateLateCheckoutCharges(
        checkOutDate,
        standard_checkout_time,
        late_checkout_policy,
        roomPrice
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
   * @param {Date} checkInDate - Check-in date
   * @param {Date} checkOutDate - Check-out date
   * @returns {Number} Number of nights
   */
  static calculateNights(checkInDate, checkOutDate) {
    const timeDiff = checkOutDate.getTime() - checkInDate.getTime();
    const days = timeDiff / (1000 * 60 * 60 * 24);
    // Use ceiling to properly count nights like the frontend
    return Math.max(1, Math.ceil(days));
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
    roomPrice
  ) {
    const checkInHour = checkInDate.getHours();

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
    roomPrice
  ) {
    const checkOutHour = checkOutDate.getHours();

    // If check-out is at or before standard time, no late check-out charges
    if (checkOutHour <= standardCheckoutTime) {
      return 0;
    }

    // If check-out is after 6 PM, always charge full night
    if (checkOutHour > 18) {
      return roomPrice;
    }

    // If check-out is between standard check-out time and 6 PM, apply policy
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
