const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const { protect } = require("../middleware/authMiddleware");
const { requireTenant } = require("../middleware/tenantMiddleware");

// Middleware: All routes require authentication and tenant context
router.use(requireTenant);
router.use(protect);

// @route   GET /api/users
// @desc    Get all users (Admin only)
// @access  Private (Admin only)
router.get("/", userController.getAllUsers);

// @route   POST /api/users
// @desc    Create a new user (Admin only)
// @access  Private (Admin only)
router.post("/", userController.createUser);

// @route   GET /api/users/:id
// @desc    Get single user (Admin only)
// @access  Private (Admin only)
router.get("/:id", userController.getUser);

// @route   PUT /api/users/:id
// @desc    Update user (Admin only)
// @access  Private (Admin only)
router.put("/:id", userController.updateUser);

// @route   DELETE /api/users/:id
// @desc    Delete user (Admin only)
// @access  Private (Admin only)
router.delete("/:id", userController.deleteUser);

// @route   PUT /api/users/:id/reset-password
// @desc    Reset user password (Admin only)
// @access  Private (Admin only)
router.put("/:id/reset-password", userController.resetUserPassword);

module.exports = router;
