const Guest = require("../models/Guest");
const Room = require("../models/Room");
const Bill = require("../models/Bill");
const { body, validationResult } = require("express-validator");
const ErrorResponse = require("../utils/errorResponse");
const AutomaticBillingService = require("../services/automaticBillingService");

// @desc    Get guest statistics
// @route   GET /api/guests/stats
// @access  Private/Manager
exports.getGuestStats = async (req, res, next) => {
  try {
    if (!req.tenantModels || !req.tenantModels.Guest) {
      return res.status(500).json({
        success: false,
        error: "Tenant database not properly initialized",
      });
    }

    const Guest = req.tenantModels.Guest;

    // Get current date for today's check-ins
    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const endOfDay = new Date(today.setHours(23, 59, 59, 999));

    // Get stats using aggregation for efficiency
    const stats = await Guest.aggregate([
      {
        $group: {
          _id: null,
          totalGuests: { $sum: 1 },
          checkedInGuests: {
            $sum: { $cond: [{ $eq: ["$status", "checked_in"] }, 1, 0] },
          },
          checkedOutGuests: {
            $sum: { $cond: [{ $eq: ["$status", "checked_out"] }, 1, 0] },
          },
          checkedInToday: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ["$status", "checked_in"] },
                    { $gte: ["$checkInDate", startOfDay] },
                    { $lte: ["$checkInDate", endOfDay] },
                  ],
                },
                1,
                0,
              ],
            },
          },
          checkingOutToday: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ["$status", "checked_in"] },
                    { $gte: ["$checkOutDate", startOfDay] },
                    { $lte: ["$checkOutDate", endOfDay] },
                  ],
                },
                1,
                0,
              ],
            },
          },
          avgStayDuration: { $avg: "$stayDuration" },
        },
      },
    ]);

    const result = stats[0] || {
      totalGuests: 0,
      checkedInGuests: 0,
      checkedOutGuests: 0,
      checkedInToday: 0,
      checkingOutToday: 0,
      avgStayDuration: 0,
    };

    res.status(200).json({
      success: true,
      data: {
        totalGuests: result.totalGuests,
        activeGuests: result.checkedInGuests,
        checkedInToday: result.checkedInToday,
        checkingOutToday: result.checkingOutToday,
        avgStayDuration: Math.round(result.avgStayDuration || 0),
        checkedOutTotal: result.checkedOutGuests,
      },
    });
  } catch (error) {
    console.error("Get guest stats error:", error);
    next(new ErrorResponse("Server error", 500));
  }
};

// @desc    Get guest by room access ID (Public route for guest chat)
// @route   GET /api/guests/room-access/:roomAccessId
// @access  Public
exports.getGuestByRoomAccessId = async (req, res, next) => {
  try {
    const { roomAccessId } = req.params;

    // Use tenant models - must exist for tenant domains
    if (!req.tenantModels || !req.tenantModels.Room) {
      console.error("Tenant models not available:", req.tenantModels);
      return res.status(500).json({
        success: false,
        error: "Tenant database not properly initialized",
      });
    }
    const Room = req.tenantModels.Room;
    // Use tenant models - must exist for tenant domains
    if (!req.tenantModels || !req.tenantModels.Guest) {
      console.error("Tenant models not available:", req.tenantModels);
      return res.status(500).json({
        success: false,
        error: "Tenant database not properly initialized",
      });
    }
    const Guest = req.tenantModels.Guest;

    console.log(`Fetching guest info for room access ID: ${roomAccessId}`);

    // Find the room by access ID
    const room = await Room.findOne({
      roomAccessId: roomAccessId,
      isActive: true,
    });
    if (!room) {
      return res.status(404).json({
        success: false,
        message: "Invalid room access code or room inactive",
      });
    }

    // Find active guest in this room
    const guest = await Guest.findOne({
      roomNumber: room.number,
      status: "checked_in",
    });

    // Manually populate room data to avoid timeout issues
    if (guest) {
      guest.room = {
        _id: room._id,
        number: room.number,
        type: room.type,
        floor: room.floor,
        price: room.price,
      };
    }

    if (!guest) {
      return res.status(200).json({
        success: true,
        message: "This room currently has no guest checked in",
        data: null,
        roomInfo: {
          type: room.type,
          floor: room.floor,
        },
      });
    }

    console.log(`Found guest: ${guest.name} in room ${room.number}`);

    res.status(200).json({
      success: true,
      data: guest,
    });
  } catch (error) {
    console.error("Error fetching guest by room access ID:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// @desc    Get guest by room number (Public route for guest chat)
// @route   GET /api/guests/room/:roomNumber
// @access  Public
exports.getGuestByRoom = async (req, res, next) => {
  try {
    const { roomNumber } = req.params;

    console.log(`Fetching guest info for room: ${roomNumber}`);

    // Use tenant models - must exist for tenant domains
    if (!req.tenantModels || !req.tenantModels.Room) {
      console.error("Tenant models not available:", req.tenantModels);
      return res.status(500).json({
        success: false,
        error: "Tenant database not properly initialized",
      });
    }
    const Room = req.tenantModels.Room;
    // Use tenant models - must exist for tenant domains
    if (!req.tenantModels || !req.tenantModels.Guest) {
      console.error("Tenant models not available:", req.tenantModels);
      return res.status(500).json({
        success: false,
        error: "Tenant database not properly initialized",
      });
    }
    const Guest = req.tenantModels.Guest;

    // Find the room first
    const room = await Room.findOne({ number: roomNumber, isActive: true });
    if (!room) {
      return res.status(404).json({
        success: false,
        message: "Room not found or inactive",
      });
    }

    // Find active guest in this room
    const guest = await Guest.findOne({
      roomNumber: roomNumber,
      status: "checked_in",
    });

    // Manually populate room data to avoid timeout issues
    if (guest) {
      guest.room = {
        _id: room._id,
        number: room.number,
        type: room.type,
        floor: room.floor,
        price: room.price,
      };
    }

    if (!guest) {
      return res.status(404).json({
        success: false,
        message: "No active guest found in this room",
      });
    }

    console.log(`Found guest: ${guest.name} in room ${roomNumber}`);

    res.status(200).json({
      success: true,
      data: guest,
    });
  } catch (error) {
    console.error("Error fetching guest by room:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch guest information",
    });
  }
};

// @desc    Get all guests for a hotel
// @route   GET /api/guests
// @access  Private/Manager
exports.getGuests = async (req, res, next) => {
  try {
    if (!req.tenantModels || !req.tenantModels.Guest) {
      return res.status(500).json({
        success: false,
        error: "Tenant database not properly initialized",
      });
    }

    const Guest = req.tenantModels.Guest;

    // Extract pagination and filtering parameters
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const search = req.query.search || "";
    const status = req.query.status || "all";

    // Build query object
    const query = {};

    // Add search functionality
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { phone: { $regex: search, $options: "i" } },
        { idNumber: { $regex: search, $options: "i" } },
      ];
    }

    // Add status filter
    if (status !== "all") {
      query.status = status;
    }

    // Calculate skip value for pagination
    const skip = (page - 1) * limit;

    // Execute count and find queries in parallel
    const [total, guests] = await Promise.all([
      Guest.countDocuments(query),
      Guest.find(query)
        .select("-__v")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
    ]);

    // Calculate pagination info
    const totalPages = Math.ceil(total / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    console.log(
      `Found ${guests.length} guests (page ${page} of ${totalPages})`
    );

    res.status(200).json({
      success: true,
      count: guests.length,
      total: total,
      data: guests,
      pagination: {
        current: page,
        pages: totalPages,
        total: total,
        limit: limit,
        hasNext: hasNextPage,
        hasPrev: hasPrevPage,
      },
    });
  } catch (error) {
    console.error("Get guests error:", error);
    next(new ErrorResponse("Server error", 500));
  }
};

// @desc    Get single guest
// @route   GET /api/guests/:id
// @access  Private/Manager
exports.getGuest = async (req, res, next) => {
  try {
    console.log(
      `Fetching guest ${req.params.id} for manager: ${req.user.email}`
    );

    // Use tenant models - must exist for tenant domains
    if (!req.tenantModels || !req.tenantModels.Guest) {
      console.error("Tenant models not available:", req.tenantModels);
      return res.status(500).json({
        success: false,
        error: "Tenant database not properly initialized",
      });
    }
    const Guest = req.tenantModels.Guest;

    const guest = await Guest.findOne({
      _id: req.params.id,
      isActive: true,
    })
      .populate("room", "number type floor price amenities")
      .populate("currentBill");

    if (!guest) {
      return next(new ErrorResponse("Guest not found", 404));
    }

    res.status(200).json({
      success: true,
      data: guest,
    });
  } catch (error) {
    console.error("Get guest error:", error);
    next(new ErrorResponse("Server error", 500));
  }
};

// @desc    Check-in guest
// @route   POST /api/guests/checkin
// @access  Private/Manager
exports.checkInGuest = async (req, res, next) => {
  try {
    const { roomId, ...guestData } = req.body;

    // Use tenant models - must exist for tenant domains
    if (!req.tenantModels || !req.tenantModels.Room) {
      console.error("Tenant models not available:", req.tenantModels);
      return res.status(500).json({
        success: false,
        error: "Tenant database not properly initialized",
      });
    }
    const Room = req.tenantModels.Room;
    // Use tenant models - must exist for tenant domains
    if (!req.tenantModels || !req.tenantModels.Guest) {
      console.error("Tenant models not available:", req.tenantModels);
      return res.status(500).json({
        success: false,
        error: "Tenant database not properly initialized",
      });
    }
    const Guest = req.tenantModels.Guest;
    // Use tenant models - must exist for tenant domains
    if (!req.tenantModels || !req.tenantModels.Bill) {
      console.error("Tenant models not available:", req.tenantModels);
      return res.status(500).json({
        success: false,
        error: "Tenant database not properly initialized",
      });
    }
    const Bill = req.tenantModels.Bill;

    // Verify room exists and is available
    const room = await Room.findOne({
      _id: roomId,
      status: "available",
      isActive: true,
    });

    if (!room) {
      console.log(`Room ${roomId} not found or not available`);
      return next(new ErrorResponse("Room not available or not found", 404));
    }

    // Add room details to guest data
    guestData.room = roomId;
    guestData.roomNumber = room.number;
    guestData.status = "checked_in";

    // Set actual check-in time to current time for real-world accuracy
    guestData.actualCheckInDate = new Date();

    // If checkInDate is not provided or is in the past, set it to current time as well
    if (
      !guestData.checkInDate ||
      new Date(guestData.checkInDate) < new Date()
    ) {
      guestData.checkInDate = new Date();
    }

    // If check-out date is not provided or is in the past, set it to next day
    if (
      !guestData.checkOutDate ||
      new Date(guestData.checkOutDate) <= new Date()
    ) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      guestData.checkOutDate = tomorrow;
    }

    console.log("Creating guest with data:", {
      ...guestData,
      room: roomId,
      roomNumber: room.number,
      actualCheckInTime: guestData.checkInDate,
    });

    // Create guest
    const guest = await Guest.create(guestData);

    // Update room status and assign guest
    room.status = "occupied";
    room.currentGuest = guest._id;
    await room.save();

    // Generate a unique bill number
    const billNumber = `BIL-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    // Calculate automatic billing charges based on hotel policies
    let billingCalculation;
    let billItems = [];

    try {
      billingCalculation =
        await AutomaticBillingService.calculateAutomaticBilling(
          guest,
          room,
          req.subdomain
        );

      // Generate billing items from the calculation
      billItems = AutomaticBillingService.generateBillingItems(
        billingCalculation,
        room.number
      );

      console.log(`✅ Automatic billing calculated for guest ${guest.name}:`, {
        totalCharges: billingCalculation.totalCharges,
        baseCharges: billingCalculation.baseCharges,
        earlyCheckinCharges: billingCalculation.earlyCheckinCharges,
        lateCheckoutCharges: billingCalculation.lateCheckoutCharges,
        policies: billingCalculation.policies,
      });
    } catch (billingError) {
      console.error("Error calculating automatic billing:", billingError);
      // Fallback to basic room charges if automatic billing fails
      const checkInDate = new Date(guest.checkInDate);
      const checkOutDate = new Date(guest.checkOutDate);
      const numberOfNights = Math.ceil(
        (checkOutDate - checkInDate) / (1000 * 60 * 60 * 24)
      );
      const roomChargePerNight = room.price || 0;
      const totalRoomCharge = numberOfNights * roomChargePerNight;

      billItems = [
        {
          type: "room_charge",
          description: `Room ${room.number} - ${numberOfNights} night(s)`,
          amount: totalRoomCharge,
          quantity: numberOfNights,
          unitPrice: roomChargePerNight,
          addedBy: "System",
          date: new Date(),
          notes: "Basic room charge (automatic billing failed)",
        },
      ];

      billingCalculation = {
        totalCharges: totalRoomCharge,
        baseCharges: totalRoomCharge,
        earlyCheckinCharges: 0,
        lateCheckoutCharges: 0,
      };
    }

    // Create initial bill for the guest with automatic charges
    const billData = {
      guest: guest._id,
      room: room._id,
      roomNumber: room.number,
      guestName: guest.name,
      checkInDate: guest.checkInDate,
      checkOutDate: guest.checkOutDate,
      status: "active",
      items: billItems,
      payments: [],
      totalAmount: billingCalculation.totalCharges,
      taxAmount: 0,
      discountAmount: 0,
      netAmount: billingCalculation.totalCharges,
      balance: billingCalculation.totalCharges,
      billNumber: billNumber,
      isActive: true,
    };

    console.log("Creating bill with automatic billing data:", billData);
    const bill = await Bill.create(billData);

    // Manually attach room data to avoid any populate timeout issues
    // We already have all the room data from the room query above
    guest.room = {
      _id: room._id,
      number: room.number,
      type: room.type,
      floor: room.floor,
      price: room.price,
      amenities: room.amenities || [],
    };

    res.status(201).json({
      success: true,
      data: {
        guest,
        bill,
      },
    });
  } catch (error) {
    console.error("Check-in guest error:", error);
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((val) => val.message);
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors: messages,
      });
    }
    res.status(500).json({
      success: false,
      message: "Server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// @desc    Check out guest
// @route   PUT /api/guests/:id/checkout
// @access  Private/Manager
exports.checkoutGuest = async (req, res, next) => {
  try {
    const { checkoutNotes, checkedOutBy } = req.body;

    // Use tenant models - must exist for tenant domains
    if (!req.tenantModels || !req.tenantModels.Room) {
      console.error("Tenant models not available:", req.tenantModels);
      return res.status(500).json({
        success: false,
        error: "Tenant database not properly initialized",
      });
    }
    const Room = req.tenantModels.Room;
    // Use tenant models - must exist for tenant domains
    if (!req.tenantModels || !req.tenantModels.Guest) {
      console.error("Tenant models not available:", req.tenantModels);
      return res.status(500).json({
        success: false,
        error: "Tenant database not properly initialized",
      });
    }
    const Guest = req.tenantModels.Guest;
    // Use tenant models - must exist for tenant domains
    if (!req.tenantModels || !req.tenantModels.Bill) {
      console.error("Tenant models not available:", req.tenantModels);
      return res.status(500).json({
        success: false,
        error: "Tenant database not properly initialized",
      });
    }
    const Bill = req.tenantModels.Bill;

    if (!checkedOutBy) {
      return res.status(400).json({
        success: false,
        message: "Checked out by is required",
      });
    }

    const guest = await Guest.findById(req.params.id);
    if (!guest) {
      return next(new ErrorResponse("Guest not found", 404));
    }

    if (guest.status !== "checked_in") {
      return res.status(400).json({
        success: false,
        message: "Guest is not currently checked in",
      });
    }

    // Check if guest can check out (no unpaid bills) - using tenant models to avoid timeout
    try {
      // Find active bill for the guest using tenant models
      const bill = await Bill.findOne({
        guest: guest._id,
        status: { $in: ["active", "partially_paid"] },
        isGuestCheckedOut: false,
      });

      if (bill && bill.balanceAmount > 0) {
        // Guest has unpaid bills, cannot check out
        return res.status(400).json({
          success: false,
          message: `Guest has unpaid bill amount of ₹${bill.balanceAmount}. Please collect payment before checkout.`,
          billDetails: {
            billNumber: bill.billNumber,
            totalAmount: bill.totalAmount,
            paidAmount: bill.paidAmount,
            balanceAmount: bill.balanceAmount,
          },
        });
      }

      console.log(
        `✅ Bill validation passed for guest ${guest.name} - ${bill ? `Bill ${bill.billNumber} is fully paid` : "No active bill found"}`
      );
    } catch (billError) {
      console.error("Error checking bill status:", billError);
      return res.status(500).json({
        success: false,
        message: "Error validating bill status. Please try again.",
      });
    }

    // Update guest status to checked_out
    guest.status = "checked_out";
    guest.actualCheckOutDate = new Date();
    guest.checkedOutBy = checkedOutBy;
    if (checkoutNotes) guest.notes = checkoutNotes;

    // Save guest changes (this will trigger the post-save hook)
    await guest.save();

    // Mark bill as guest checked out (this will move it to guest history)
    await Bill.markGuestCheckedOut(guest._id);

    // Update room status to cleaning immediately
    await Room.findByIdAndUpdate(guest.room, {
      status: "cleaning",
      currentGuest: null,
      lastCleanedAt: new Date(),
    });

    // Schedule room to become available after 2 hours
    setTimeout(
      async () => {
        try {
          await Room.findByIdAndUpdate(guest.room, {
            status: "available",
            currentGuest: null,
          });
          console.log(
            `✅ Room ${guest.roomNumber} is now available after cleaning`
          );
        } catch (error) {
          console.error(
            `❌ Error updating room ${guest.roomNumber} to available:`,
            error
          );
        }
      },
      2 * 60 * 60 * 1000
    ); // 2 hours

    // Manually populate room data to avoid populate errors
    if (guest && guest.room) {
      try {
        const room = await Room.findById(guest.room)
          .select("number type floor")
          .lean();
        if (room) {
          guest.room = room;
        }
      } catch (roomError) {
        console.warn(
          "Failed to populate room data for checkout:",
          roomError.message
        );
      }
    }

    res.status(200).json({
      success: true,
      message: "Guest checked out successfully",
      data: guest,
    });
  } catch (error) {
    console.error("Checkout guest error:", error);
    next(new ErrorResponse("Server error", 500));
  }
};

// @desc    Update guest
// @route   PUT /api/guests/:id
// @access  Private/Manager
exports.updateGuest = async (req, res, next) => {
  try {
    console.log(`Updating guest ${req.params.id}:`, req.body);

    // Use tenant models - must exist for tenant domains
    if (!req.tenantModels || !req.tenantModels.Room) {
      console.error("Tenant models not available:", req.tenantModels);
      return res.status(500).json({
        success: false,
        error: "Tenant database not properly initialized",
      });
    }
    const Room = req.tenantModels.Room;
    // Use tenant models - must exist for tenant domains
    if (!req.tenantModels || !req.tenantModels.Guest) {
      console.error("Tenant models not available:", req.tenantModels);
      return res.status(500).json({
        success: false,
        error: "Tenant database not properly initialized",
      });
    }
    const Guest = req.tenantModels.Guest;

    let guest = await Guest.findById(req.params.id);
    if (!guest) {
      return next(
        new ErrorResponse(`Guest not found with id of ${req.params.id}`, 404)
      );
    }

    // If updating room, check availability and if room is active
    if (req.body.room && req.body.room !== guest.room.toString()) {
      const newRoom = await Room.findOne({
        _id: req.body.room,
        isActive: true,
      });

      if (!newRoom) {
        return next(
          new ErrorResponse("New room not found or is no longer available", 404)
        );
      }

      if (newRoom.status !== "available") {
        return next(new ErrorResponse("New room is not available", 400));
      }

      // Check if new room is occupied by another guest
      const existingGuest = await Guest.findOne({
        room: req.body.room,
        status: "checked_in",
        _id: { $ne: req.params.id },
      });

      if (existingGuest) {
        return next(
          new ErrorResponse(
            "New room is already occupied by another guest",
            400
          )
        );
      }
    }

    // Update guest
    guest = await Guest.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    // Manually populate room data to avoid timeout issues
    if (guest && guest.room) {
      try {
        const room = await Room.findById(guest.room)
          .select("number type floor price")
          .lean();
        if (room) {
          guest.room = room;
        }
      } catch (roomError) {
        console.warn("Failed to populate room data:", roomError.message);
        // Keep the room ID if population fails
      }
    }

    // If check-in or check-out dates were updated, recalculate billing
    if (req.body.checkInDate || req.body.checkOutDate) {
      try {
        const Bill = req.tenantModels.Bill;
        const bill = await Bill.findOne({
          guest: guest._id,
          status: { $in: ["active", "partially_paid", "paid"] },
          isGuestCheckedOut: false,
        });

        if (bill) {
          console.log(
            `Updating bill for guest ${guest.name} due to date changes`
          );
          await AutomaticBillingService.updateBillWithAutomaticCharges(
            bill,
            guest,
            room,
            req.subdomain
          );
          console.log(`✅ Bill updated for guest ${guest.name}`);
        }
      } catch (billingError) {
        console.error(
          "Error updating bill after guest date change:",
          billingError
        );
        // Don't fail the guest update if billing update fails
      }
    }

    res.status(200).json({
      success: true,
      data: guest,
    });
  } catch (error) {
    console.error("Update guest error:", error);
    next(new ErrorResponse("Server error", 500));
  }
};

// @desc    Delete guest
// @route   DELETE /api/guests/:id
// @access  Private/Admin
exports.deleteGuest = async (req, res, next) => {
  try {
    // Use tenant models - must exist for tenant domains
    if (!req.tenantModels || !req.tenantModels.Guest) {
      console.error("Tenant models not available:", req.tenantModels);
      return res.status(500).json({
        success: false,
        error: "Tenant database not properly initialized",
      });
    }
    const Guest = req.tenantModels.Guest;
    const guest = await Guest.findById(req.params.id);

    if (!guest) {
      return next(
        new ErrorResponse(`Guest not found with id of ${req.params.id}`, 404)
      );
    }

    // Check if guest is currently checked in
    if (guest.status === "checked_in") {
      return next(
        new ErrorResponse(
          "Cannot delete a guest who is currently checked in",
          400
        )
      );
    }

    await Guest.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      data: {},
    });
  } catch (error) {
    console.error("Delete guest error:", error);
    next(new ErrorResponse("Server error", 500));
  }
};

// @desc    Get guest by room number (for chat system - simplified)
// @route   GET /api/guests/room/:roomNumber
// @access  Public
exports.getGuestByRoom = async (req, res, next) => {
  try {
    // Use tenant models - must exist for tenant domains
    if (!req.tenantModels || !req.tenantModels.Guest) {
      console.error("Tenant models not available:", req.tenantModels);
      return res.status(500).json({
        success: false,
        error: "Tenant database not properly initialized",
      });
    }
    const Guest = req.tenantModels.Guest;

    const guest = await Guest.findOne({
      roomNumber: req.params.roomNumber,
      status: "checked_in",
    }).populate("room", "number type floor");

    if (!guest) {
      return res.status(200).json({
        success: true,
        data: null,
        message: "No active guest found for this room",
      });
    }

    // Return simplified guest info for chat
    const guestInfo = {
      _id: guest._id,
      name: guest.name,
      roomNumber: guest.roomNumber,
      room: guest.room,
      checkInDate: guest.checkInDate,
      checkOutDate: guest.checkOutDate,
      status: guest.status,
    };

    res.status(200).json({
      success: true,
      data: guestInfo,
    });
  } catch (error) {
    console.error("Get guest by room error:", error);
    next(new ErrorResponse("Server error", 500));
  }
};

// @desc    Get active guests
// @route   GET /api/guests/active
// @access  Private/Manager
exports.getActiveGuests = async (req, res, next) => {
  try {
    // Use tenant models - must exist for tenant domains
    if (!req.tenantModels || !req.tenantModels.Guest) {
      console.error("Tenant models not available:", req.tenantModels);
      return res.status(500).json({
        success: false,
        error: "Tenant database not properly initialized",
      });
    }
    const Guest = req.tenantModels.Guest;
    const Room = req.tenantModels.Room;
    const { search } = req.query;

    // Build query for checked-in guests
    let query = { status: "checked_in" };

    // If search term is provided, we need to handle room number search specially
    if (search) {
      // First try to find rooms that match the search term
      const matchingRooms = await Room.find({
        number: { $regex: search, $options: "i" },
      }).select("_id");

      const roomIds = matchingRooms.map((room) => room._id);

      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { phone: { $regex: search, $options: "i" } },
        { room: { $in: roomIds } }, // Search by room IDs that match the number
      ];
    }

    // Find active guests with optional search
    const guests = await Guest.find(query)
      .populate("room", "number type floor status price")
      .sort({ checkInDate: -1 });

    res.status(200).json({
      success: true,
      count: guests.length,
      data: guests,
    });
  } catch (error) {
    console.error("Get active guests error:", error);
    next(new ErrorResponse("Server error", 500));
  }
};

// @desc    Get guest history
// @route   GET /api/guests/history
// @access  Private/Manager
exports.getGuestHistory = async (req, res, next) => {
  try {
    const { status, roomNumber, guestName, startDate, endDate } = req.query;

    // Use tenant models - must exist for tenant domains
    if (!req.tenantModels || !req.tenantModels.Guest) {
      console.error("Tenant models not available:", req.tenantModels);
      return res.status(500).json({
        success: false,
        error: "Tenant database not properly initialized",
      });
    }
    const Guest = req.tenantModels.Guest;

    let query = { status: { $in: ["checked_out", "cancelled", "no_show"] } };

    if (roomNumber) query.roomNumber = roomNumber;
    if (guestName) query.name = { $regex: guestName, $options: "i" };
    if (startDate || endDate) {
      query.checkOutDate = {};
      if (startDate) query.checkOutDate.$gte = new Date(startDate);
      if (endDate) query.checkOutDate.$lte = new Date(endDate);
    }

    const guests = await Guest.find(query)
      .populate("room", "number type floor")
      .populate("hotel", "name")
      .sort({ checkOutDate: -1 });

    res.status(200).json({
      success: true,
      count: guests.length,
      data: guests,
    });
  } catch (error) {
    console.error("Get guest history error:", error);
    next(new ErrorResponse("Server error", 500));
  }
};

// @desc    Get guest checkout status
// @route   GET /api/guests/:id/checkout-status
// @access  Private/Manager
exports.getGuestCheckoutStatus = async (req, res, next) => {
  try {
    // Use tenant models - must exist for tenant domains
    if (!req.tenantModels || !req.tenantModels.Guest) {
      console.error("Tenant models not available:", req.tenantModels);
      return res.status(500).json({
        success: false,
        error: "Tenant database not properly initialized",
      });
    }
    const Guest = req.tenantModels.Guest;
    const checkoutInfo = await Guest.canCheckOut(req.params.id);

    res.status(200).json({
      success: true,
      data: checkoutInfo,
    });
  } catch (error) {
    console.error("Get guest checkout status error:", error);
    next(new ErrorResponse("Server error", 500));
  }
};

// @desc    Recalculate billing for a guest
// @route   POST /api/guests/:id/recalculate-billing
// @access  Private/Manager
exports.recalculateGuestBilling = async (req, res, next) => {
  try {
    // Use tenant models - must exist for tenant domains
    if (!req.tenantModels || !req.tenantModels.Guest) {
      console.error("Tenant models not available:", req.tenantModels);
      return res.status(500).json({
        success: false,
        error: "Tenant database not properly initialized",
      });
    }
    const Guest = req.tenantModels.Guest;
    const Room = req.tenantModels.Room;
    const Bill = req.tenantModels.Bill;

    const guest = await Guest.findById(req.params.id);
    if (!guest) {
      return next(new ErrorResponse("Guest not found", 404));
    }

    if (guest.status !== "checked_in") {
      return res.status(400).json({
        success: false,
        message: "Guest must be checked in to recalculate billing",
      });
    }

    // Get room information
    const room = await Room.findById(guest.room);
    if (!room) {
      return next(new ErrorResponse("Room not found", 404));
    }

    // Find active bill
    const bill = await Bill.findOne({
      guest: guest._id,
      status: { $in: ["active", "partially_paid", "paid"] },
      isGuestCheckedOut: false,
    });

    if (!bill) {
      return res.status(404).json({
        success: false,
        message: "No active bill found for this guest",
      });
    }

    // Update bill with automatic charges
    const result = await AutomaticBillingService.updateBillWithAutomaticCharges(
      bill,
      guest,
      room,
      req.subdomain
    );

    res.status(200).json({
      success: true,
      message: "Billing recalculated successfully",
      data: {
        guest: guest,
        bill: result.bill,
        billingCalculation: result.billingCalculation,
      },
    });
  } catch (error) {
    console.error("Recalculate guest billing error:", error);
    next(new ErrorResponse("Server error", 500));
  }
};

// @desc    Create a new guest
// @route   POST /api/guests
// @access  Private/Manager
exports.createGuest = async (req, res, next) => {
  try {
    console.log("Creating new guest:", req.body);

    // Use tenant models - must exist for tenant domains
    if (!req.tenantModels || !req.tenantModels.Room) {
      console.error("Tenant models not available:", req.tenantModels);
      return res.status(500).json({
        success: false,
        error: "Tenant database not properly initialized",
      });
    }
    const Room = req.tenantModels.Room;
    // Use tenant models - must exist for tenant domains
    if (!req.tenantModels || !req.tenantModels.Guest) {
      console.error("Tenant models not available:", req.tenantModels);
      return res.status(500).json({
        success: false,
        error: "Tenant database not properly initialized",
      });
    }
    const Guest = req.tenantModels.Guest;

    // Check if room is available and active
    const room = await Room.findOne({
      _id: req.body.room,
      isActive: true,
    });

    if (!room) {
      return next(
        new ErrorResponse("Room not found or is no longer available", 404)
      );
    }

    if (room.status !== "available") {
      return next(new ErrorResponse("Room is not available for check-in", 400));
    }

    // Check if room is already assigned to another guest
    const existingGuest = await Guest.findOne({
      room: req.body.room,
      status: "checked_in",
    });

    if (existingGuest) {
      return next(
        new ErrorResponse("Room is already occupied by another guest", 400)
      );
    }

    // Create guest data
    const guestData = {
      ...req.body,
      status: "checked_in",
      // Set actual check-in time to current time for real-world accuracy
      checkInDate: new Date(),
      checkOutDate: new Date(req.body.checkOutDate),
    };

    const guest = await Guest.create(guestData);

    // Manually populate room information to avoid timeout issues
    if (guest && guest.room) {
      try {
        const roomData = await Room.findById(guest.room)
          .select("number type floor price")
          .lean();
        if (roomData) {
          guest.room = roomData;
        }
      } catch (roomError) {
        console.warn(
          "Failed to populate room data for new guest:",
          roomError.message
        );
        // Use basic room data from the request
        guest.room = {
          _id: guest.room,
          number: room.number,
          type: room.type,
          floor: room.floor,
          price: room.price,
        };
      }
    }

    console.log("Guest created successfully:", guest._id);

    res.status(201).json({
      success: true,
      data: guest,
    });
  } catch (error) {
    console.error("Create guest error:", error);
    next(new ErrorResponse("Server error", 500));
  }
};

// @desc    Extend guest stay (update checkout date)
// @route   PUT /api/guests/:id/extend-stay
// @access  Private/Manager
exports.extendGuestStay = async (req, res, next) => {
  try {
    const { newCheckOutDate, extendedBy } = req.body;

    if (!newCheckOutDate) {
      return res.status(400).json({
        success: false,
        message: "New checkout date is required",
      });
    }

    if (!extendedBy) {
      return res.status(400).json({
        success: false,
        message: "Extended by field is required",
      });
    }

    // Use tenant models
    if (!req.tenantModels || !req.tenantModels.Guest) {
      return res.status(500).json({
        success: false,
        error: "Tenant database not properly initialized",
      });
    }
    const Guest = req.tenantModels.Guest;
    const Room = req.tenantModels.Room;
    const Bill = req.tenantModels.Bill;

    const guest = await Guest.findById(req.params.id);
    if (!guest) {
      return next(new ErrorResponse("Guest not found", 404));
    }

    if (guest.status !== "checked_in") {
      return res.status(400).json({
        success: false,
        message: "Guest must be checked in to extend stay",
      });
    }

    const newCheckOut = new Date(newCheckOutDate);
    const currentCheckOut = new Date(guest.checkOutDate);

    // Validate new checkout date is after current checkout date
    if (newCheckOut <= currentCheckOut) {
      return res.status(400).json({
        success: false,
        message: "New checkout date must be after current checkout date",
      });
    }

    // Update guest checkout date
    const oldCheckOutDate = guest.checkOutDate;
    guest.checkOutDate = newCheckOut;

    // Add note about extension
    const extensionNote = `Stay extended from ${oldCheckOutDate.toDateString()} to ${newCheckOut.toDateString()} by ${extendedBy}`;
    guest.notes = guest.notes
      ? `${guest.notes}\n${extensionNote}`
      : extensionNote;

    await guest.save();

    // Get room information for billing recalculation
    const room = await Room.findById(guest.room);
    if (!room) {
      return next(new ErrorResponse("Room not found", 404));
    }

    // Find and update the bill
    const bill = await Bill.findOne({
      guest: guest._id,
      status: { $in: ["active", "partially_paid", "paid"] },
      isGuestCheckedOut: false,
    });

    if (bill) {
      // Update bill checkout date
      bill.checkOutDate = newCheckOut;

      // Recalculate billing with new dates
      const result =
        await AutomaticBillingService.updateBillWithAutomaticCharges(
          bill,
          guest,
          room,
          req.subdomain
        );

      console.log(
        `✅ Guest ${guest.name} stay extended to ${newCheckOut.toDateString()}`
      );
      console.log(
        `✅ Bill ${bill.billNumber} updated - New total: ₹${result.bill.totalAmount}`
      );

      res.status(200).json({
        success: true,
        message: "Guest stay extended successfully",
        data: {
          guest,
          bill: result.bill,
          billingCalculation: result.billingCalculation,
        },
      });
    } else {
      res.status(200).json({
        success: true,
        message: "Guest stay extended successfully (no active bill found)",
        data: { guest },
      });
    }
  } catch (error) {
    console.error("Extend guest stay error:", error);
    next(new ErrorResponse("Server error", 500));
  }
};

// Validation middleware for guest
exports.validateGuestData = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Guest name is required")
    .isLength({ min: 2, max: 100 })
    .withMessage("Name must be between 2 and 100 characters"),

  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Invalid email format")
    .normalizeEmail(),

  body("phone")
    .trim()
    .notEmpty()
    .withMessage("Phone number is required")
    .matches(/^[\+]?[1-9][\d]{0,15}$/)
    .withMessage("Invalid phone number format"),

  body("room")
    .notEmpty()
    .withMessage("Room assignment is required")
    .isMongoId()
    .withMessage("Invalid room ID"),

  body("checkInDate")
    .notEmpty()
    .withMessage("Check-in date is required")
    .isISO8601()
    .withMessage("Invalid check-in date format"),

  body("checkOutDate")
    .notEmpty()
    .withMessage("Check-out date is required")
    .isISO8601()
    .withMessage("Invalid check-out date format")
    .custom((value, { req }) => {
      const checkIn = new Date(req.body.checkInDate);
      const checkOut = new Date(value);
      if (checkOut <= checkIn) {
        throw new Error("Check-out date must be after check-in date");
      }
      return true;
    }),

  body("adults")
    .optional()
    .isInt({ min: 1, max: 10 })
    .withMessage("Number of adults must be between 1 and 10"),

  body("children")
    .optional()
    .isInt({ min: 0, max: 10 })
    .withMessage("Number of children must be between 0 and 10"),

  body("specialRequests")
    .optional()
    .isLength({ max: 500 })
    .withMessage("Special requests must be less than 500 characters"),

  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors: errors.array().map((err) => err.msg),
      });
    }
    next();
  },
];

// Validation middleware for guest check-in
exports.validateGuestCheckIn = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Guest name is required")
    .isLength({ max: 100 })
    .withMessage("Guest name must be less than 100 characters"),

  body("phone").trim().notEmpty().withMessage("Phone number is required"),

  body("idType")
    .notEmpty()
    .withMessage("ID type is required")
    .isIn(["passport", "driving_license", "national_id", "other"])
    .withMessage("Invalid ID type"),

  body("idNumber").trim().notEmpty().withMessage("ID number is required"),

  body("checkInDate")
    .isISO8601()
    .withMessage("Valid check-in date is required"),

  body("checkOutDate")
    .isISO8601()
    .withMessage("Valid check-out date is required"),

  body("numberOfGuests")
    .isInt({ min: 1 })
    .withMessage("Number of guests must be at least 1"),

  body("roomId")
    .notEmpty()
    .withMessage("Room selection is required")
    .isMongoId()
    .withMessage("Invalid room ID"),

  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array(),
      });
    }
    next();
  },
];
