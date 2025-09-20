const Bill = require("../models/Bill");
const Guest = require("../models/Guest");
const Room = require("../models/Room");
const { body, validationResult } = require("express-validator");
const ErrorResponse = require("../utils/errorResponse");

// @desc    Get all bills with enhanced filtering and pagination
// @route   GET /api/bills
// @access  Private/Manager
exports.getBills = async (req, res, next) => {
  try {
    // Extract pagination and filtering parameters
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const search = req.query.search || "";
    const status = req.query.status || "all";
    const type = req.query.type || "active";

    // Use tenant models - must exist for tenant domains
    if (!req.tenantModels || !req.tenantModels.Bill) {
      console.error("Tenant models not available:", req.tenantModels);
      return res.status(500).json({
        success: false,
        error: "Tenant database not properly initialized",
      });
    }
    const Bill = req.tenantModels.Bill;

    // Build query object
    const query = {};

    // Add search functionality
    if (search) {
      query.$or = [
        { billNumber: { $regex: search, $options: "i" } },
        { "guest.name": { $regex: search, $options: "i" } },
        { "room.number": { $regex: search, $options: "i" } },
      ];
    }

    // Add status filter
    if (status !== "all") {
      query.status = status;
    }

    // Add type filter
    if (type === "active") {
      // Include bills for guests who haven't checked out, regardless of payment status
      query.isGuestCheckedOut = { $ne: true };
      // Don't filter by status for active bills - include active, partially_paid, and paid
    } else if (type === "finalized") {
      query.isGuestCheckedOut = true;
    }
    // For "all" type, no additional filter

    // Calculate skip value for pagination
    const skip = (page - 1) * limit;

    // Execute count and find queries in parallel
    const [total, bills] = await Promise.all([
      Bill.countDocuments(query),
      Bill.find(query)
        .populate("guest", "name phone email status")
        .populate("room", "number type floor status")
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

    console.log(`Found ${bills.length} bills (page ${page} of ${totalPages})`);

    res.status(200).json({
      success: true,
      count: bills.length,
      total: total,
      data: bills,
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
    console.error("Get bills error:", error);
    next(new ErrorResponse("Server error", 500));
  }
};

// @desc    Get billing statistics
// @route   GET /api/bills/stats
// @access  Private/Manager
exports.getBillStats = async (req, res, next) => {
  try {
    // Use tenant models - must exist for tenant domains
    if (!req.tenantModels || !req.tenantModels.Bill) {
      console.error("Tenant models not available:", req.tenantModels);
      return res.status(500).json({
        success: false,
        error: "Tenant database not properly initialized",
      });
    }
    const Bill = req.tenantModels.Bill;

    // Get current date for today's stats
    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const endOfDay = new Date(today.setHours(23, 59, 59, 999));

    // Get stats using aggregation for efficiency
    const stats = await Bill.aggregate([
      {
        $group: {
          _id: null,
          totalBills: { $sum: 1 },
          totalRevenue: { $sum: "$totalAmount" },
          totalPaid: { $sum: "$paidAmount" },
          totalOutstanding: { $sum: "$balanceAmount" },
          activeBills: {
            $sum: { $cond: [{ $eq: ["$status", "active"] }, 1, 0] },
          },
          paidBills: {
            $sum: { $cond: [{ $eq: ["$status", "paid"] }, 1, 0] },
          },
          partiallyPaidBills: {
            $sum: { $cond: [{ $eq: ["$status", "partially_paid"] }, 1, 0] },
          },
          finalizedBills: {
            $sum: { $cond: [{ $eq: ["$status", "finalized"] }, 1, 0] },
          },
          todaysBills: {
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
          avgBillValue: { $avg: "$totalAmount" },
        },
      },
    ]);

    const result = stats[0] || {
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
    };

    // Calculate collection rate
    const collectionRate =
      result.totalRevenue > 0
        ? Math.round((result.totalPaid / result.totalRevenue) * 100)
        : 0;

    res.status(200).json({
      success: true,
      data: {
        totalBills: result.totalBills,
        totalRevenue: Math.round(result.totalRevenue || 0),
        totalPaid: Math.round(result.totalPaid || 0),
        totalOutstanding: Math.round(result.totalOutstanding || 0),
        activeBills: result.activeBills,
        paidBills: result.paidBills,
        partiallyPaidBills: result.partiallyPaidBills,
        finalizedBills: result.finalizedBills,
        todaysBills: result.todaysBills,
        todaysRevenue: Math.round(result.todaysRevenue || 0),
        avgBillValue: Math.round(result.avgBillValue || 0),
        collectionRate: `${collectionRate}%`,
        period: "today",
      },
    });
  } catch (error) {
    console.error("Get bill stats error:", error);
    next(new ErrorResponse("Server error", 500));
  }
};

// @desc    Get bill by guest ID
// @route   GET /api/bills/guest/:guestId
// @access  Private/Manager
exports.getBillByGuest = async (req, res, next) => {
  try {
    // Use tenant models - must exist for tenant domains
    if (!req.tenantModels || !req.tenantModels.Bill) {
      console.error("Tenant models not available:", req.tenantModels);
      return res.status(500).json({
        success: false,
        error: "Tenant database not properly initialized",
      });
    }
    const Bill = req.tenantModels.Bill;
    const bill = await Bill.getBillSummary(req.params.guestId);

    if (!bill) {
      return res.status(404).json({
        success: false,
        message: "No bill found for this guest",
      });
    }

    res.status(200).json({
      success: true,
      data: bill,
    });
  } catch (error) {
    console.error("Get bill by guest error:", error);
    next(new ErrorResponse("Server error", 500));
  }
};

// @desc    Record payment for a bill
// @route   POST /api/bills/:id/payments
// @access  Private/Manager
exports.recordPayment = async (req, res, next) => {
  try {
    const { amount, method, reference, notes, receivedBy } = req.body;

    // Use tenant models - must exist for tenant domains
    if (!req.tenantModels || !req.tenantModels.Bill) {
      console.error("Tenant models not available:", req.tenantModels);
      return res.status(500).json({
        success: false,
        error: "Tenant database not properly initialized",
      });
    }
    const Bill = req.tenantModels.Bill;
    if (!amount || !method || !receivedBy) {
      return res.status(400).json({
        success: false,
        message: "Amount, payment method, and received by are required",
      });
    }

    const bill = await Bill.findById(req.params.id);
    if (!bill) {
      return next(new ErrorResponse("Bill not found", 404));
    }

    // Check if bill is still active (allow payments to paid bills too)
    if (!["active", "partially_paid", "paid"].includes(bill.status)) {
      return res.status(400).json({
        success: false,
        message: "Cannot add payment to finalized or cancelled bill",
      });
    }

    // Check if payment amount exceeds balance
    const newPaidAmount = bill.paidAmount + Number(amount);
    if (newPaidAmount > bill.totalAmount) {
      return res.status(400).json({
        success: false,
        message: `Payment amount exceeds outstanding balance. Maximum allowed payment: ₹${bill.balanceAmount}`,
      });
    }

    // Add payment record
    bill.payments.push({
      amount: Number(amount),
      method,
      reference: reference || "",
      receivedBy,
      notes: notes || "",
      date: new Date(),
    });

    await bill.save();

    // Populate for response
    await bill.populate([
      { path: "guest", select: "name phone email" },
      { path: "room", select: "number type floor" },
    ]);

    res.status(200).json({
      success: true,
      message: "Payment recorded successfully",
      data: bill,
    });
  } catch (error) {
    console.error("Record payment error:", error);
    next(new ErrorResponse("Server error", 500));
  }
};

// @desc    Add manual charge to bill
// @route   POST /api/bills/:id/charges
// @access  Private/Manager
exports.addCharge = async (req, res, next) => {
  try {
    const {
      type,
      description,
      amount,
      quantity = 1,
      notes,
      addedBy,
    } = req.body;

    // Use tenant models - must exist for tenant domains
    if (!req.tenantModels || !req.tenantModels.Bill) {
      console.error("Tenant models not available:", req.tenantModels);
      return res.status(500).json({
        success: false,
        error: "Tenant database not properly initialized",
      });
    }
    const Bill = req.tenantModels.Bill;

    if (!type || !description || !amount || !addedBy) {
      return res.status(400).json({
        success: false,
        message: "Type, description, amount, and added by are required",
      });
    }

    const bill = await Bill.findById(req.params.id);
    if (!bill) {
      return next(new ErrorResponse("Bill not found", 404));
    }

    // Check if bill is still active (allow adding to paid bills too, since they might order more)
    if (!["active", "partially_paid", "paid"].includes(bill.status)) {
      return res.status(400).json({
        success: false,
        message: "Cannot add charges to finalized or cancelled bill",
      });
    }

    // Add charge item
    bill.items.push({
      type,
      description,
      amount: Number(amount),
      quantity: Number(quantity),
      unitPrice: Number(amount),
      addedBy,
      date: new Date(),
      notes: notes || "",
    });

    await bill.save();

    // Populate for response
    await bill.populate([
      { path: "guest", select: "name phone email" },
      { path: "room", select: "number type floor" },
    ]);

    res.status(200).json({
      success: true,
      message: "Charge added successfully",
      data: bill,
    });
  } catch (error) {
    console.error("Add charge error:", error);
    next(new ErrorResponse("Server error", 500));
  }
};

// @desc    Finalize bill
// @route   PUT /api/bills/:id/finalize
// @access  Private/Manager
exports.finalizeBill = async (req, res, next) => {
  try {
    const { finalizedBy, notes } = req.body;

    // Use tenant models - must exist for tenant domains
    if (!req.tenantModels || !req.tenantModels.Bill) {
      console.error("Tenant models not available:", req.tenantModels);
      return res.status(500).json({
        success: false,
        error: "Tenant database not properly initialized",
      });
    }
    const Bill = req.tenantModels.Bill;
    if (!finalizedBy) {
      return res.status(400).json({
        success: false,
        message: "Finalized by is required",
      });
    }

    const bill = await Bill.findById(req.params.id);
    if (!bill) {
      return next(new ErrorResponse("Bill not found", 404));
    }

    if (bill.status === "cancelled") {
      return res.status(400).json({
        success: false,
        message: "Cannot finalize a cancelled bill",
      });
    }

    if (bill.balanceAmount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot finalize bill with outstanding balance of ₹${bill.balanceAmount}`,
      });
    }

    // Update bill status
    bill.status = "finalized";
    bill.finalizedAt = new Date();
    bill.finalizedBy = finalizedBy;
    if (notes) bill.notes = notes;

    await bill.save();

    // Populate for response
    await bill.populate([
      { path: "guest", select: "name phone email" },
      { path: "room", select: "number type floor" },
    ]);

    res.status(200).json({
      success: true,
      message: "Bill finalized successfully",
      data: bill,
    });
  } catch (error) {
    console.error("Finalize bill error:", error);
    next(new ErrorResponse("Server error", 500));
  }
};

// @desc    Get bill summary for dashboard
// @route   GET /api/bills/summary
// @access  Private/Manager
exports.getBillSummary = async (req, res, next) => {
  try {
    // Use tenant models - must exist for tenant domains
    if (!req.tenantModels || !req.tenantModels.Bill) {
      console.error("Tenant models not available:", req.tenantModels);
      return res.status(500).json({
        success: false,
        error: "Tenant database not properly initialized",
      });
    }
    const Bill = req.tenantModels.Bill;
    const [activeBills, finalizedBills, stats] = await Promise.all([
      Bill.getActiveBills(),
      Bill.getFinalizedBills(),
      Bill.getBillingStats(),
    ]);

    res.status(200).json({
      success: true,
      data: {
        activeBills: activeBills.length,
        finalizedBills: finalizedBills.length,
        stats,
      },
    });
  } catch (error) {
    console.error("Get bill summary error:", error);
    next(new ErrorResponse("Server error", 500));
  }
};

// @desc    Check if guest can check out
// @route   GET /api/bills/checkout/:guestId
// @access  Private/Manager
exports.checkGuestCheckout = async (req, res, next) => {
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

    const checkoutInfo = await Guest.canCheckOut(req.params.guestId);

    res.status(200).json({
      success: true,
      data: checkoutInfo,
    });
  } catch (error) {
    console.error("Check guest checkout error:", error);
    next(new ErrorResponse("Server error", 500));
  }
};

// Validation middleware
exports.validatePayment = [
  body("amount")
    .isNumeric()
    .withMessage("Amount must be a number")
    .isFloat({ min: 0.01 })
    .withMessage("Amount must be greater than 0"),

  body("method")
    .isIn(["cash", "card", "upi", "bank_transfer", "other"])
    .withMessage("Invalid payment method"),

  body("receivedBy").trim().notEmpty().withMessage("Received by is required"),

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

exports.validateCharge = [
  body("type")
    .isIn([
      "room_charge",
      "food_order",
      "service_charge",
      "tax",
      "discount",
      "other",
    ])
    .withMessage("Invalid charge type"),

  body("description").trim().notEmpty().withMessage("Description is required"),

  body("amount").isNumeric().withMessage("Amount must be a number"),

  body("addedBy").trim().notEmpty().withMessage("Added by is required"),

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
