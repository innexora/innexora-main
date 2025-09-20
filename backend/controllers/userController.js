const crypto = require("crypto");

// Helper function to send response
const sendResponse = (res, statusCode, success, message, data = null) => {
  res.status(statusCode).json({
    success,
    message,
    data,
  });
};

// @desc    Get all users (Admin only)
// @route   GET /api/users
// @access  Private (Admin only)
exports.getAllUsers = async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== "admin") {
      return sendResponse(
        res,
        403,
        false,
        "Access denied. Admin role required."
      );
    }

    const User = req.tenantModels.User;

    // Get all users except current admin
    const users = await User.find({ _id: { $ne: req.user._id } })
      .select("-password")
      .sort({ createdAt: -1 });

    sendResponse(res, 200, true, "Users fetched successfully", users);
  } catch (error) {
    console.error("Get users error:", error);
    sendResponse(res, 500, false, "Server error while fetching users");
  }
};

// @desc    Create a new user (Admin only)
// @route   POST /api/users
// @access  Private (Admin only)
exports.createUser = async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== "admin") {
      return sendResponse(
        res,
        403,
        false,
        "Access denied. Admin role required."
      );
    }

    const { name, email, password, role } = req.body;

    // Validate input
    if (!name || !email || !password || !role) {
      return sendResponse(
        res,
        400,
        false,
        "Please provide name, email, password, and role"
      );
    }

    // Validate role
    if (!["manager", "staff"].includes(role)) {
      return sendResponse(
        res,
        400,
        false,
        "Role must be either 'manager' or 'staff'"
      );
    }

    // Validate password length
    if (password.length < 8) {
      return sendResponse(
        res,
        400,
        false,
        "Password must be at least 8 characters long"
      );
    }

    const User = req.tenantModels.User;

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return sendResponse(
        res,
        400,
        false,
        "User already exists with this email"
      );
    }

    // Prevent creating another admin
    if (role === "admin") {
      return sendResponse(
        res,
        400,
        false,
        "Cannot create admin user. Only one admin per hotel is allowed."
      );
    }

    // Create user
    const newUser = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password,
      role,
      hotelName: req.hotel.name,
      isActive: true,
    });

    // Remove password from response
    const userResponse = newUser.toObject();
    delete userResponse.password;

    sendResponse(res, 201, true, "User created successfully", userResponse);
  } catch (error) {
    console.error("Create user error:", error);
    sendResponse(res, 500, false, "Server error while creating user");
  }
};

// @desc    Get single user (Admin only)
// @route   GET /api/users/:id
// @access  Private (Admin only)
exports.getUser = async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== "admin") {
      return sendResponse(
        res,
        403,
        false,
        "Access denied. Admin role required."
      );
    }

    const User = req.tenantModels.User;
    const user = await User.findById(req.params.id).select("-password");

    if (!user) {
      return sendResponse(res, 404, false, "User not found");
    }

    sendResponse(res, 200, true, "User fetched successfully", user);
  } catch (error) {
    console.error("Get user error:", error);
    sendResponse(res, 500, false, "Server error while fetching user");
  }
};

// @desc    Update user (Admin only)
// @route   PUT /api/users/:id
// @access  Private (Admin only)
exports.updateUser = async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== "admin") {
      return sendResponse(
        res,
        403,
        false,
        "Access denied. Admin role required."
      );
    }

    const { name, email, role, isActive } = req.body;
    const User = req.tenantModels.User;

    // Find user
    const user = await User.findById(req.params.id);
    if (!user) {
      return sendResponse(res, 404, false, "User not found");
    }

    // Prevent modifying admin user
    if (user.role === "admin") {
      return sendResponse(res, 400, false, "Cannot modify admin user");
    }

    // Prevent changing role to admin
    if (role === "admin") {
      return sendResponse(res, 400, false, "Cannot change user role to admin");
    }

    // Validate role if provided
    if (role && !["manager", "staff"].includes(role)) {
      return sendResponse(
        res,
        400,
        false,
        "Role must be either 'manager' or 'staff'"
      );
    }

    // Check email uniqueness if email is being changed
    if (email && email.toLowerCase() !== user.email) {
      const existingUser = await User.findOne({
        email: email.toLowerCase(),
        _id: { $ne: user._id },
      });
      if (existingUser) {
        return sendResponse(res, 400, false, "Email already exists");
      }
    }

    // Update fields
    if (name) user.name = name.trim();
    if (email) user.email = email.toLowerCase().trim();
    if (role) user.role = role;
    if (typeof isActive === "boolean") user.isActive = isActive;

    await user.save();

    // Remove password from response
    const userResponse = user.toObject();
    delete userResponse.password;

    sendResponse(res, 200, true, "User updated successfully", userResponse);
  } catch (error) {
    console.error("Update user error:", error);
    sendResponse(res, 500, false, "Server error while updating user");
  }
};

// @desc    Delete user (Admin only)
// @route   DELETE /api/users/:id
// @access  Private (Admin only)
exports.deleteUser = async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== "admin") {
      return sendResponse(
        res,
        403,
        false,
        "Access denied. Admin role required."
      );
    }

    const User = req.tenantModels.User;
    const user = await User.findById(req.params.id);

    if (!user) {
      return sendResponse(res, 404, false, "User not found");
    }

    // Prevent deleting admin user
    if (user.role === "admin") {
      return sendResponse(res, 400, false, "Cannot delete admin user");
    }

    // Prevent deleting self
    if (user._id.toString() === req.user._id.toString()) {
      return sendResponse(res, 400, false, "Cannot delete your own account");
    }

    await User.findByIdAndDelete(req.params.id);

    sendResponse(res, 200, true, "User deleted successfully");
  } catch (error) {
    console.error("Delete user error:", error);
    sendResponse(res, 500, false, "Server error while deleting user");
  }
};

// @desc    Reset user password (Admin only)
// @route   PUT /api/users/:id/reset-password
// @access  Private (Admin only)
exports.resetUserPassword = async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== "admin") {
      return sendResponse(
        res,
        403,
        false,
        "Access denied. Admin role required."
      );
    }

    const { password } = req.body;

    if (!password) {
      return sendResponse(res, 400, false, "Password is required");
    }

    if (password.length < 8) {
      return sendResponse(
        res,
        400,
        false,
        "Password must be at least 8 characters long"
      );
    }

    const User = req.tenantModels.User;
    const user = await User.findById(req.params.id);

    if (!user) {
      return sendResponse(res, 404, false, "User not found");
    }

    // Prevent modifying admin user
    if (user.role === "admin") {
      return sendResponse(res, 400, false, "Cannot modify admin user password");
    }

    user.password = password; // Will be hashed by pre-save middleware
    await user.save();

    sendResponse(res, 200, true, "Password reset successfully");
  } catch (error) {
    console.error("Reset password error:", error);
    sendResponse(res, 500, false, "Server error while resetting password");
  }
};
