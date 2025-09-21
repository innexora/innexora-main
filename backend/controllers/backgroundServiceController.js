const backgroundBillingService = require('../services/backgroundBillingService');

// @desc    Get background service status
// @route   GET /api/background-service/status
// @access  Private/Admin
exports.getBackgroundServiceStatus = async (req, res, next) => {
  try {
    const status = backgroundBillingService.getStatus();
    
    res.status(200).json({
      success: true,
      data: status,
    });
  } catch (error) {
    console.error("Get background service status error:", error);
    next(new ErrorResponse("Server error", 500));
  }
};

// @desc    Start background service
// @route   POST /api/background-service/start
// @access  Private/Admin
exports.startBackgroundService = async (req, res, next) => {
  try {
    backgroundBillingService.start();
    
    res.status(200).json({
      success: true,
      message: "Background service started successfully",
    });
  } catch (error) {
    console.error("Start background service error:", error);
    next(new ErrorResponse("Server error", 500));
  }
};

// @desc    Stop background service
// @route   POST /api/background-service/stop
// @access  Private/Admin
exports.stopBackgroundService = async (req, res, next) => {
  try {
    backgroundBillingService.stop();
    
    res.status(200).json({
      success: true,
      message: "Background service stopped successfully",
    });
  } catch (error) {
    console.error("Stop background service error:", error);
    next(new ErrorResponse("Server error", 500));
  }
};

// @desc    Trigger manual billing recalculation
// @route   POST /api/background-service/recalculate-billing
// @access  Private/Admin
exports.triggerBillingRecalculation = async (req, res, next) => {
  try {
    await backgroundBillingService.recalculateAllGuestBilling();
    
    res.status(200).json({
      success: true,
      message: "Billing recalculation triggered successfully",
    });
  } catch (error) {
    console.error("Trigger billing recalculation error:", error);
    next(new ErrorResponse("Server error", 500));
  }
};
