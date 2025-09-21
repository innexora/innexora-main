const express = require("express");
const router = express.Router();
const backgroundServiceController = require("../controllers/backgroundServiceController");
const { protect, authorize } = require("../middleware/authMiddleware");

// All routes require authentication and admin access
router.use(protect);
router.use(authorize("admin"));

// Background service management routes
router
  .route("/status")
  .get(backgroundServiceController.getBackgroundServiceStatus);

router
  .route("/start")
  .post(backgroundServiceController.startBackgroundService);

router
  .route("/stop")
  .post(backgroundServiceController.stopBackgroundService);

router
  .route("/recalculate-billing")
  .post(backgroundServiceController.triggerBillingRecalculation);

module.exports = router;
