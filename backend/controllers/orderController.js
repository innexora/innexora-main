const Order = require("../models/Order");
const Food = require("../models/Food");
const Guest = require("../models/Guest");
const Room = require("../models/Room");
const Bill = require("../models/Bill");
const { body, validationResult } = require("express-validator");
const ErrorResponse = require("../utils/errorResponse");

// @desc    Get all orders for the manager
// @route   GET /api/orders
// @access  Private/Manager
exports.getOrders = async (req, res, next) => {
  try {
    // Use tenant models - must exist for tenant domains
    if (!req.tenantModels || !req.tenantModels.Order) {
      console.error("Tenant models not available:", req.tenantModels);
      return res.status(500).json({
        success: false,
        error: "Tenant database not properly initialized",
      });
    }
    const Order = req.tenantModels.Order;

    // Extract pagination and filtering parameters
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const search = req.query.search || "";
    const status = req.query.status || "all";
    const orderType = req.query.orderType || "all";
    const { roomNumber, date } = req.query;

    // Build query object
    const query = {};

    // Add search functionality
    if (search) {
      query.$or = [
        { orderNumber: { $regex: search, $options: "i" } },
        { "guest.name": { $regex: search, $options: "i" } },
        { "room.number": { $regex: search, $options: "i" } },
      ];
    }

    // Add status filter
    if (status !== "all") {
      query.status = status;
    }

    // Add order type filter
    if (orderType !== "all") {
      query.type = orderType;
    }

    // Add room number filter
    if (roomNumber) {
      query.roomNumber = roomNumber;
    }

    // Date filter
    if (date) {
      const startDate = new Date(date);
      const endDate = new Date(date);
      endDate.setDate(endDate.getDate() + 1);
      query.createdAt = { $gte: startDate, $lt: endDate };
    }

    // Calculate skip value for pagination
    const skip = (page - 1) * limit;

    // Execute count and find queries in parallel
    const [total, orders] = await Promise.all([
      Order.countDocuments(query),
      Order.find(query)
        .populate("guest", "name phone")
        .populate("room", "number type floor")
        .populate("items.food", "name category")
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
      `Found ${orders.length} orders (page ${page} of ${totalPages})`
    );

    res.status(200).json({
      success: true,
      count: orders.length,
      total: total,
      data: orders,
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
    console.error("Get orders error:", error);
    next(new ErrorResponse("Server error", 500));
  }
};

// @desc    Get single order
// @route   GET /api/orders/:id
// @access  Private/Manager
exports.getOrder = async (req, res, next) => {
  try {
    const order = await Order.findOne({
      _id: req.params.id,
    })
      .populate("guest", "name phone email")
      .populate("room", "number type floor")
      .populate("items.food", "name category preparationTime");

    if (!order) {
      return next(new ErrorResponse("Order not found", 404));
    }

    res.status(200).json({
      success: true,
      data: order,
    });
  } catch (error) {
    console.error("Get order error:", error);
    next(new ErrorResponse("Server error", 500));
  }
};

// @desc    Create order (from guest chat or manager)
// @route   POST /api/orders
// @access  Public/Private
exports.createOrder = async (req, res, next) => {
  try {
    console.log("Creating order with data:", req.body);
    console.log("User role:", req.user?.role);
    const {
      guestId,
      items,
      specialInstructions,
      type = "room_service",
    } = req.body;

    // Use tenant models
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
    if (!req.tenantModels || !req.tenantModels.Food) {
      console.error("Tenant models not available:", req.tenantModels);
      return res.status(500).json({
        success: false,
        error: "Tenant database not properly initialized",
      });
    }
    const Food = req.tenantModels.Food;
    // Use tenant models - must exist for tenant domains
    if (!req.tenantModels || !req.tenantModels.Order) {
      console.error("Tenant models not available:", req.tenantModels);
      return res.status(500).json({
        success: false,
        error: "Tenant database not properly initialized",
      });
    }
    const Order = req.tenantModels.Order;
    // Use tenant models - must exist for tenant domains
    if (!req.tenantModels || !req.tenantModels.Bill) {
      console.error("Tenant models not available:", req.tenantModels);
      return res.status(500).json({
        success: false,
        error: "Tenant database not properly initialized",
      });
    }
    const Bill = req.tenantModels.Bill;

    // Find guest by ID
    const guest = await Guest.findOne({
      _id: guestId,
      status: "checked_in",
    }).populate("room");

    if (!guest) {
      return next(new ErrorResponse("No active guest found", 404));
    }

    // Validate and process order items
    const processedItems = [];
    let totalAmount = 0;
    let maxPreparationTime = 0;

    for (const item of items) {
      const food = await Food.findOne({
        _id: item.foodId,
        isAvailable: true,
      });

      if (!food) {
        return next(
          new ErrorResponse(`Food item ${item.foodId} not available`, 400)
        );
      }

      const itemTotal = food.price * item.quantity;
      totalAmount += itemTotal;
      maxPreparationTime = Math.max(maxPreparationTime, food.preparationTime);

      processedItems.push({
        food: food._id,
        foodName: food.name,
        quantity: item.quantity,
        unitPrice: food.price,
        totalPrice: itemTotal,
        specialInstructions: item.specialInstructions || "",
      });
    }

    // Create order with explicit orderNumber (will be overridden by pre-save hook)
    const orderData = {
      guest: guest._id,
      guestName: guest.name,
      room: guest.room._id,
      roomNumber: guest.roomNumber,
      items: processedItems,
      totalAmount,
      type,
      specialInstructions,
      estimatedPreparationTime: maxPreparationTime,
      orderNumber: `TEMP-${Date.now()}`, // Temporary, will be replaced by pre-save hook
    };

    const order = await Order.create(orderData);

    // Add order to guest's bill
    try {
      await Bill.addOrderToBill(guest._id, order);
      console.log(
        `✅ Order ${order.orderNumber} added to bill for guest ${guest.name}`
      );
    } catch (billError) {
      console.error("Warning: Could not add order to bill:", billError);
      // Don't fail the order creation if bill update fails
    }

    // Populate order for response
    await order.populate([
      { path: "guest", select: "name phone" },
      { path: "room", select: "number type floor" },
      { path: "items.food", select: "name category" },
    ]);

    // Emit real-time notification to managers
    if (req.app && req.app.get("io")) {
      const io = req.app.get("io");
      io.to("managers").emit("newOrder", {
        order,
        notification: {
          title: "New Food Order",
          message: `${guest.name} from Room ${guest.roomNumber} placed an order`,
          timestamp: new Date().toISOString(),
        },
      });
    }

    res.status(201).json({
      success: true,
      data: order,
    });
  } catch (error) {
    console.error("Create order error:", error);
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

// @desc    Update order status
// @route   PUT /api/orders/:id/status
// @access  Private/Manager
exports.updateOrderStatus = async (req, res, next) => {
  try {
    // Use tenant models
    // Use tenant models - must exist for tenant domains
    if (!req.tenantModels || !req.tenantModels.Order) {
      console.error("Tenant models not available:", req.tenantModels);
      return res.status(500).json({
        success: false,
        error: "Tenant database not properly initialized",
      });
    }
    const Order = req.tenantModels.Order;

    const { status, preparedBy, deliveredBy } = req.body;

    if (
      ![
        "pending",
        "confirmed",
        "preparing",
        "ready",
        "delivered",
        "cancelled",
      ].includes(status)
    ) {
      return next(new ErrorResponse("Invalid status", 400));
    }

    let order = await Order.findOne({
      _id: req.params.id,
    });

    if (!order) {
      return next(new ErrorResponse("Order not found", 404));
    }

    // Update status and related fields
    order.status = status;

    if (status === "delivered") {
      order.deliveredAt = new Date();
      if (deliveredBy) order.deliveredBy = deliveredBy;
    }

    if (status === "cancelled") {
      order.cancelledAt = new Date();
      if (req.body.cancellationReason) {
        order.cancellationReason = req.body.cancellationReason;
      }
    }

    if (preparedBy) order.preparedBy = preparedBy;

    await order.save();

    // Populate for response
    await order.populate([
      { path: "guest", select: "name phone" },
      { path: "room", select: "number type floor" },
    ]);

    // Emit real-time update
    if (req.app && req.app.get("io")) {
      const io = req.app.get("io");
      io.to(`order_${order._id}`).emit("orderStatusUpdate", order);
    }

    res.status(200).json({
      success: true,
      data: order,
    });
  } catch (error) {
    console.error("Update order status error:", error);
    next(new ErrorResponse("Server error", 500));
  }
};

// @desc    Get order statistics
// @route   GET /api/orders/stats
// @access  Private/Manager
exports.getOrderStats = async (req, res, next) => {
  try {
    // Use tenant models - must exist for tenant domains
    if (!req.tenantModels || !req.tenantModels.Order) {
      console.error("Tenant models not available:", req.tenantModels);
      return res.status(500).json({
        success: false,
        error: "Tenant database not properly initialized",
      });
    }
    const Order = req.tenantModels.Order;

    // Get current date for today's stats
    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const endOfDay = new Date(today.setHours(23, 59, 59, 999));

    // Get stats using aggregation for efficiency
    const stats = await Order.aggregate([
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          totalRevenue: { $sum: "$totalAmount" },
          pendingOrders: {
            $sum: { $cond: [{ $eq: ["$status", "pending"] }, 1, 0] },
          },
          confirmedOrders: {
            $sum: { $cond: [{ $eq: ["$status", "confirmed"] }, 1, 0] },
          },
          preparingOrders: {
            $sum: { $cond: [{ $eq: ["$status", "preparing"] }, 1, 0] },
          },
          readyOrders: {
            $sum: { $cond: [{ $eq: ["$status", "ready"] }, 1, 0] },
          },
          deliveredOrders: {
            $sum: { $cond: [{ $eq: ["$status", "delivered"] }, 1, 0] },
          },
          cancelledOrders: {
            $sum: { $cond: [{ $eq: ["$status", "cancelled"] }, 1, 0] },
          },
          todaysOrders: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $gte: ["$createdAt", startOfDay] },
                    { $lte: ["$createdAt", endOfDay] },
                  ],
                },
                1,
                0,
              ],
            },
          },
          todaysRevenue: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $gte: ["$createdAt", startOfDay] },
                    { $lte: ["$createdAt", endOfDay] },
                  ],
                },
                "$totalAmount",
                0,
              ],
            },
          },
          avgOrderValue: { $avg: "$totalAmount" },
        },
      },
    ]);

    const result = stats[0] || {
      totalOrders: 0,
      totalRevenue: 0,
      pendingOrders: 0,
      confirmedOrders: 0,
      preparingOrders: 0,
      readyOrders: 0,
      deliveredOrders: 0,
      cancelledOrders: 0,
      todaysOrders: 0,
      todaysRevenue: 0,
      avgOrderValue: 0,
    };

    // Calculate completion rate
    const completionRate = result.totalOrders > 0 
      ? Math.round((result.deliveredOrders / result.totalOrders) * 100)
      : 0;

    res.status(200).json({
      success: true,
      data: {
        totalOrders: result.totalOrders,
        totalRevenue: Math.round(result.totalRevenue || 0),
        pending: { count: result.pendingOrders, totalAmount: 0 },
        confirmed: { count: result.confirmedOrders, totalAmount: 0 },
        preparing: { count: result.preparingOrders, totalAmount: 0 },
        ready: { count: result.readyOrders, totalAmount: 0 },
        delivered: { count: result.deliveredOrders, totalAmount: 0 },
        cancelled: { count: result.cancelledOrders, totalAmount: 0 },
        todaysOrders: result.todaysOrders,
        todaysRevenue: Math.round(result.todaysRevenue || 0),
        avgOrderValue: Math.round(result.avgOrderValue || 0),
        completionRate: `${completionRate}%`,
        period: 'today'
      },
    });
  } catch (error) {
    console.error("Get order stats error:", error);
    next(new ErrorResponse("Server error", 500));
  }
};

// @desc    Get available food items for ordering (public for guest chat)
// @route   GET /api/orders/menu
// @access  Public
exports.getMenuItems = async (req, res, next) => {
  try {
    // Use tenant models
    // Use tenant models - must exist for tenant domains
    if (!req.tenantModels || !req.tenantModels.Food) {
      console.error("Tenant models not available:", req.tenantModels);
      return res.status(500).json({
        success: false,
        error: "Tenant database not properly initialized",
      });
    }
    const Food = req.tenantModels.Food;

    const { category } = req.query;

    const query = { isAvailable: true };
    if (category) query.category = category;

    const menuItems = await Food.find(query)
      .select(
        "name description category price preparationTime isVegetarian isVegan spiceLevel allergens imageUrl"
      )
      .sort({ category: 1, name: 1 });

    // Group by category
    const groupedMenu = menuItems.reduce((acc, item) => {
      if (!acc[item.category]) {
        acc[item.category] = [];
      }
      acc[item.category].push(item);
      return acc;
    }, {});

    res.status(200).json({
      success: true,
      data: groupedMenu,
    });
  } catch (error) {
    console.error("Get menu items error:", error);
    next(new ErrorResponse("Server error", 500));
  }
};

// Validation middleware for creating orders
exports.validateCreateOrder = [
  body("guestId").notEmpty().withMessage("Guest ID is required"),

  body("items")
    .isArray({ min: 1 })
    .withMessage("At least one item is required"),

  body("items.*.foodId")
    .notEmpty()
    .withMessage("Food ID is required")
    .isMongoId()
    .withMessage("Invalid food ID"),

  body("items.*.quantity")
    .isInt({ min: 1 })
    .withMessage("Quantity must be at least 1"),

  body("orderType")
    .optional()
    .isIn(["room_service", "restaurant", "takeaway"])
    .withMessage("Invalid order type"),

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
