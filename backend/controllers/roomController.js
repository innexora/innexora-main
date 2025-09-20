const Room = require("../models/Room");
const { body, validationResult } = require("express-validator");
const ErrorResponse = require("../utils/errorResponse");

// @desc    Get room statistics
// @route   GET /api/rooms/stats
// @access  Private/Manager
exports.getRoomStats = async (req, res, next) => {
  try {
    if (!req.tenantModels || !req.tenantModels.Room) {
      return res.status(500).json({
        success: false,
        error: "Tenant database not properly initialized",
      });
    }
    const Room = req.tenantModels.Room;

    // Get stats using aggregation for efficiency
    const stats = await Room.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: null,
          totalRooms: { $sum: 1 },
          availableRooms: {
            $sum: { $cond: [{ $eq: ["$status", "available"] }, 1, 0] },
          },
          occupiedRooms: {
            $sum: { $cond: [{ $eq: ["$status", "occupied"] }, 1, 0] },
          },
          maintenanceRooms: {
            $sum: { $cond: [{ $eq: ["$status", "maintenance"] }, 1, 0] },
          },
          avgCapacity: { $avg: "$capacity" },
        },
      },
    ]);

    const result = stats[0] || {
      totalRooms: 0,
      availableRooms: 0,
      occupiedRooms: 0,
      maintenanceRooms: 0,
      avgCapacity: 0,
    };

    // Calculate occupancy rate
    const occupancyRate =
      result.totalRooms > 0
        ? Math.round((result.occupiedRooms / result.totalRooms) * 100)
        : 0;

    res.status(200).json({
      success: true,
      data: {
        totalRooms: result.totalRooms,
        availableRooms: result.availableRooms,
        occupiedRooms: result.occupiedRooms,
        maintenanceRooms: result.maintenanceRooms,
        occupancyRate: `${occupancyRate}%`,
        avgCapacity: Math.round(result.avgCapacity || 0),
      },
    });
  } catch (error) {
    console.error("Get room stats error:", error.message);
    next(new ErrorResponse("Server error", 500));
  }
};

// @desc    Get all rooms for the manager's hotel
// @route   GET /api/rooms
// @access  Private/Manager
exports.getRooms = async (req, res, next) => {
  try {
    console.log("Fetching rooms for user:", req.user);

    // Use tenant Room model - must exist for tenant domains
    if (!req.tenantModels || !req.tenantModels.Room) {
      console.error("Tenant models not available:", req.tenantModels);
      return res.status(500).json({
        success: false,
        error: "Tenant database not properly initialized",
      });
    }
    const Room = req.tenantModels.Room;

    // Extract pagination and filtering parameters
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const search = req.query.search || "";
    const status = req.query.status || "all";
    const type = req.query.type || "all";

    // Build query object
    const query = { isActive: true };

    // Add search functionality
    if (search) {
      query.$or = [
        { number: { $regex: search, $options: "i" } },
        { type: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    // Add status filter
    if (status !== "all") {
      query.status = status;
    }

    // Add type filter
    if (type !== "all") {
      query.type = type;
    }

    try {
      // Add diagnostics for room collection
      const conn = req.tenantDb;
      if (conn && conn.db) {
        const dbName = conn.name || conn.db.databaseName || "unknown";
        const rawCount = await conn.db.collection("rooms").countDocuments();
        console.log(
          `Tenant DB: ${dbName} | rooms collection count: ${rawCount}`
        );
      }
    } catch (diagErr) {
      console.warn("Diagnostics error (room count):", diagErr.message);
    }

    // Add timeout for room queries
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error("Room query timeout")), 5000);
    });

    // Calculate skip value for pagination
    const skip = (page - 1) * limit;

    // Execute count and find queries in parallel
    const [total, rooms] = await Promise.race([
      Promise.all([
        Room.countDocuments(query),
        Room.find(query)
          .select("-__v -createdAt -updatedAt")
          .sort({ number: 1 })
          .skip(skip)
          .limit(limit)
          .lean(),
      ]),
      timeoutPromise,
    ]);

    // Calculate pagination info
    const totalPages = Math.ceil(total / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    console.log(`Found ${rooms.length} rooms (page ${page} of ${totalPages})`);

    res.status(200).json({
      success: true,
      count: rooms.length,
      total: total,
      data: rooms,
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
    console.error("Get rooms error:", error.message);

    if (error.message.includes("timeout")) {
      return res.status(503).json({
        success: false,
        error: "Database temporarily unavailable",
      });
    }

    next(new ErrorResponse("Server error", 500));
  }
};

// @desc    Get single room
// @route   GET /api/rooms/:id
// @access  Private/Manager
exports.getRoom = async (req, res, next) => {
  try {
    // Use tenant models - must exist for tenant domains
    if (!req.tenantModels || !req.tenantModels.Room) {
      console.error("Tenant models not available:", req.tenantModels);
      return res.status(500).json({
        success: false,
        error: "Tenant database not properly initialized",
      });
    }
    const Room = req.tenantModels.Room;

    const room = await Room.findOne({
      _id: req.params.id,
      isActive: true,
    })
      .select("-__v -createdAt -updatedAt")
      .lean();

    if (!room) {
      return next(
        new ErrorResponse(`Room not found with id of ${req.params.id}`, 404)
      );
    }

    res.status(200).json({
      success: true,
      data: room,
    });
  } catch (error) {
    console.error("Get room error:", error);
    next(new ErrorResponse("Server error", 500));
  }
};

// @desc    Create a room
// @route   POST /api/rooms
// @access  Private/Manager
exports.createRoom = async (req, res, next) => {
  try {
    // Use tenant models - must exist for tenant domains
    if (!req.tenantModels || !req.tenantModels.Room) {
      console.error("Tenant models not available:", req.tenantModels);
      return res.status(500).json({
        success: false,
        error: "Tenant database not properly initialized",
      });
    }
    const Room = req.tenantModels.Room;

    // First check if an active room with this number already exists
    const activeRoomExists = await Room.findOne({
      number: req.body.number,
      isActive: true,
    });

    if (activeRoomExists) {
      return res.status(400).json({
        success: false,
        message: `Room with number ${req.body.number} already exists and is active`,
      });
    }

    // Check if an inactive room with this number exists
    const inactiveRoom = await Room.findOne({
      number: req.body.number,
      isActive: false,
    });

    if (inactiveRoom) {
      // Reactivate the existing room with new data
      const updatedRoomData = {
        ...req.body,
        price: Number(req.body.price) || 0,
        isActive: true,
        updatedAt: new Date(),
      };

      // Update the inactive room with new data
      Object.keys(updatedRoomData).forEach((key) => {
        if (updatedRoomData[key] !== undefined) {
          inactiveRoom[key] = updatedRoomData[key];
        }
      });

      const reactivatedRoom = await inactiveRoom.save();

      return res.status(200).json({
        success: true,
        message: `Room ${req.body.number} has been reactivated with updated information`,
        data: reactivatedRoom,
        reactivated: true,
      });
    }

    // If no room exists (active or inactive), create a new one
    const roomData = {
      ...req.body,
      price: Number(req.body.price) || 0,
      isActive: true,
    };

    const room = await Room.create(roomData);

    res.status(201).json({
      success: true,
      message: `Room ${req.body.number} created successfully`,
      data: room,
      reactivated: false,
    });
  } catch (error) {
    console.error("Create room error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// @desc    Update room
// @route   PUT /api/rooms/:id
// @access  Private/Manager
exports.updateRoom = async (req, res, next) => {
  try {
    console.log("Updating room:", req.params.id, "for user:", req.user);

    // Use tenant models - must exist for tenant domains
    if (!req.tenantModels || !req.tenantModels.Room) {
      console.error("Tenant models not available:", req.tenantModels);
      return res.status(500).json({
        success: false,
        error: "Tenant database not properly initialized",
      });
    }
    const Room = req.tenantModels.Room;
    // Temporarily remove manager filter for debugging
    let room = await Room.findOne({
      _id: req.params.id,
      isActive: true,
    });

    if (!room) {
      return next(
        new ErrorResponse(`Room not found with id of ${req.params.id}`, 404)
      );
    }

    // Check for duplicate room number
    if (req.body.number && req.body.number !== room.number) {
      // First check if an active room with this number exists
      const activeRoomExists = await Room.findOne({
        number: req.body.number,
        isActive: true,
        _id: { $ne: req.params.id },
      });

      if (activeRoomExists) {
        return next(
          new ErrorResponse(
            `Room with number ${req.body.number} already exists and is active`,
            400
          )
        );
      }

      // Check if an inactive room with this number exists
      const inactiveRoom = await Room.findOne({
        number: req.body.number,
        isActive: false,
        _id: { $ne: req.params.id },
      });

      if (inactiveRoom) {
        return next(
          new ErrorResponse(
            `Room with number ${req.body.number} exists but is inactive. Cannot change room number to an existing room number. Please use a different number or reactivate the existing room.`,
            400
          )
        );
      }
    }

    // Update room fields
    const fieldsToUpdate = [
      "number",
      "type",
      "floor",
      "status",
      "price",
      "capacity",
      "description",
    ];
    fieldsToUpdate.forEach((field) => {
      if (req.body[field] !== undefined) {
        room[field] = req.body[field];
      }
    });

    await room.save();

    res.status(200).json({
      success: true,
      data: room,
    });
  } catch (error) {
    console.error("Update room error:", error);
    next(new ErrorResponse("Server error", 500));
  }
};

// @desc    Delete room (soft delete)
// @route   DELETE /api/rooms/:id
// @access  Private/Manager
exports.deleteRoom = async (req, res, next) => {
  try {
    // Use tenant models - must exist for tenant domains
    if (!req.tenantModels || !req.tenantModels.Room) {
      console.error("Tenant models not available:", req.tenantModels);
      return res.status(500).json({
        success: false,
        error: "Tenant database not properly initialized",
      });
    }
    const Room = req.tenantModels.Room;
    const room = await Room.findOne({
      _id: req.params.id,
      isActive: true,
    });

    if (!room) {
      return next(
        new ErrorResponse(`Room not found with id of ${req.params.id}`, 404)
      );
    }

    // Check for active tickets using tenant model
    const Ticket = req.tenantModels.Ticket;
    const activeTickets = await Ticket.find({
      room: room._id,
      status: { $in: ["raised", "in_progress"] },
    })
      .select("_id title status priority createdAt")
      .limit(5);

    // Check for active guests in the room
    const Guest = req.tenantModels.Guest;
    const activeGuests = await Guest.find({
      room: room._id,
      status: { $in: ["checked_in", "active"] },
    })
      .select("_id name checkInDate status")
      .limit(3);

    // Check for active guests first - always block deletion if guests are present
    if (activeGuests.length > 0) {
      return res.status(400).json({
        success: false,
        message:
          "Cannot delete room with active guests. Please check out all guests first.",
        activeGuests: activeGuests,
        totalActiveGuests: activeGuests.length,
        room: {
          id: room._id,
          number: room.number,
          type: room.type,
        },
        canForceDelete: false,
      });
    }

    // Check for active tickets - always block deletion if tickets are present
    if (activeTickets.length > 0) {
      return res.status(400).json({
        success: false,
        message:
          "Cannot delete room with active tickets. Please resolve all tickets first.",
        activeTickets: activeTickets,
        totalActiveTickets: activeTickets.length,
        room: {
          id: room._id,
          number: room.number,
          type: room.type,
        },
        canForceDelete: false,
      });
    }

    // Soft delete
    room.isActive = false;
    await room.save();

    res.status(200).json({
      success: true,
      data: {},
    });
  } catch (error) {
    console.error("Delete room error:", error);
    next(new ErrorResponse("Server error", 500));
  }
};

// @desc    Get room by number (public)
// @route   GET /api/rooms/number/:number
// @access  Public
exports.getRoomByNumber = async (req, res, next) => {
  try {
    // Use tenant models - must exist for tenant domains
    if (!req.tenantModels || !req.tenantModels.Room) {
      console.error("Tenant models not available:", req.tenantModels);
      return res.status(500).json({
        success: false,
        error: "Tenant database not properly initialized",
      });
    }
    const Room = req.tenantModels.Room;
    const room = await Room.findOne({
      number: req.params.number,
      isActive: true,
    }).select("-__v -createdAt -updatedAt -isActive");

    if (!room) {
      return next(
        new ErrorResponse(
          `Room with number ${req.params.number} not found or inactive`,
          404
        )
      );
    }

    res.status(200).json({
      success: true,
      data: room,
    });
  } catch (error) {
    console.error("Get room by number error:", error);
    next(new ErrorResponse("Server error", 500));
  }
};

// @desc    Update room status safely
// @route   PUT /api/rooms/:id/status
// @access  Private/Manager
exports.updateRoomStatus = async (req, res, next) => {
  try {
    const { status, reason, updatedBy } = req.body;
    // Use tenant models - must exist for tenant domains
    if (!req.tenantModels || !req.tenantModels.Room) {
      console.error("Tenant models not available:", req.tenantModels);
      return res.status(500).json({
        success: false,
        error: "Tenant database not properly initialized",
      });
    }
    const Room = req.tenantModels.Room;
    if (!status || !updatedBy) {
      return res.status(400).json({
        success: false,
        message: "Status and updated by are required",
      });
    }

    // Use the safe method from the Room model
    const room = await Room.updateRoomStatus(req.params.id, status, reason);

    res.status(200).json({
      success: true,
      message: `Room ${room.number} status updated to ${status}`,
      data: room,
    });
  } catch (error) {
    console.error("Update room status error:", error);

    if (error.message.includes("Cannot change status")) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    next(new ErrorResponse("Server error", 500));
  }
};

// @desc    Get rooms by status
// @route   GET /api/rooms/status/:status
// @access  Private/Manager
exports.getRoomsByStatus = async (req, res, next) => {
  try {
    const { status } = req.params;

    // Use tenant models - must exist for tenant domains
    if (!req.tenantModels || !req.tenantModels.Room) {
      console.error("Tenant models not available:", req.tenantModels);
      return res.status(500).json({
        success: false,
        error: "Tenant database not properly initialized",
      });
    }
    const Room = req.tenantModels.Room;

    const rooms = await Room.getRoomsByStatus(status);

    res.status(200).json({
      success: true,
      count: rooms.length,
      status,
      data: rooms,
    });
  } catch (error) {
    console.error("Get rooms by status error:", error);
    next(new ErrorResponse("Server error", 500));
  }
};

// @desc    Get available rooms
// @route   GET /api/rooms/available
// @access  Private/Manager
exports.getAvailableRooms = async (req, res, next) => {
  try {
    // Use tenant models - must exist for tenant domains
    if (!req.tenantModels || !req.tenantModels.Room) {
      console.error("Tenant models not available:", req.tenantModels);
      return res.status(500).json({
        success: false,
        error: "Tenant database not properly initialized",
      });
    }
    const Room = req.tenantModels.Room;
    const rooms = await Room.getAvailableRooms();

    res.status(200).json({
      success: true,
      count: rooms.length,
      data: rooms,
    });
  } catch (error) {
    console.error("Get available rooms error:", error);
    next(new ErrorResponse("Server error", 500));
  }
};

// @desc    Get occupied rooms
// @route   GET /api/rooms/occupied
// @access  Private/Manager
exports.getOccupiedRooms = async (req, res, next) => {
  try {
    // Use tenant models - must exist for tenant domains
    if (!req.tenantModels || !req.tenantModels.Room) {
      console.error("Tenant models not available:", req.tenantModels);
      return res.status(500).json({
        success: false,
        error: "Tenant database not properly initialized",
      });
    }
    const Room = req.tenantModels.Room;
    const rooms = await Room.getOccupiedRooms();

    res.status(200).json({
      success: true,
      count: rooms.length,
      data: rooms,
    });
  } catch (error) {
    console.error("Get occupied rooms error:", error);
    next(new ErrorResponse("Server error", 500));
  }
};

// @desc    Get room summary for dashboard
// @route   GET /api/rooms/summary
// @access  Private/Manager
exports.getRoomSummary = async (req, res, next) => {
  try {
    // Use tenant models - must exist for tenant domains
    if (!req.tenantModels || !req.tenantModels.Room) {
      console.error("Tenant models not available:", req.tenantModels);
      return res.status(500).json({
        success: false,
        error: "Tenant database not properly initialized",
      });
    }
    const Room = req.tenantModels.Room;
    const [availableRooms, occupiedRooms, cleaningRooms, maintenanceRooms] =
      await Promise.all([
        Room.getAvailableRooms(),
        Room.getOccupiedRooms(),
        Room.getRoomsByStatus("cleaning"),
        Room.getRoomsByStatus("maintenance"),
      ]);

    const summary = {
      total:
        availableRooms.length +
        occupiedRooms.length +
        cleaningRooms.length +
        maintenanceRooms.length,
      available: availableRooms.length,
      occupied: occupiedRooms.length,
      cleaning: cleaningRooms.length,
      maintenance: maintenanceRooms.length,
      occupancyRate: Math.round(
        (occupiedRooms.length /
          (availableRooms.length + occupiedRooms.length)) *
          100 || 0
      ),
    };

    res.status(200).json({
      success: true,
      data: summary,
    });
  } catch (error) {
    console.error("Get room summary error:", error);
    next(new ErrorResponse("Server error", 500));
  }
};

// Validation middleware for room
exports.validateRoomData = [
  body("number")
    .trim()
    .notEmpty()
    .withMessage("Room number is required")
    .isNumeric()
    .withMessage("Room number must be numeric"),

  body("type")
    .trim()
    .notEmpty()
    .withMessage("Room type is required")
    .isIn(["single", "double", "triple", "suite", "deluxe"])
    .withMessage("Invalid room type"),

  body("floor")
    .trim()
    .notEmpty()
    .withMessage("Floor is required")
    .isNumeric()
    .withMessage("Floor must be numeric"),

  body("capacity")
    .isNumeric()
    .withMessage("Capacity must be numeric")
    .custom((value) => value >= 1)
    .withMessage("Capacity must be at least 1"),

  body("price")
    .isNumeric()
    .withMessage("Price must be numeric")
    .custom((value) => value >= 0)
    .withMessage("Price cannot be negative"),

  body("status")
    .optional()
    .isIn(["available", "occupied", "cleaning", "maintenance", "reserved"])
    .withMessage("Invalid room status"),

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
