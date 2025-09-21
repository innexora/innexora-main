const express = require("express");
const router = express.Router();
const guestController = require("../controllers/guestController");
const { protect, authorize } = require("../middleware/authMiddleware");

// Public routes (for guest access)
router
  .route("/room-access/:roomAccessId")
  .get(guestController.getGuestByRoomAccessId);

// Protected routes (require authentication)
router.use(protect);

// Stats route (must be before other routes)
router
  .route("/stats")
  .get(authorize("staff", "manager", "admin"), guestController.getGuestStats);

// Guest management routes
router
  .route("/")
  .get(authorize("staff", "manager", "admin"), guestController.getGuests)
  .post(
    authorize("manager", "admin"),
    guestController.validateGuestData,
    guestController.createGuest
  );

router
  .route("/active")
  .get(authorize("staff", "manager", "admin"), guestController.getActiveGuests);

router
  .route("/history")
  .get(authorize("staff", "manager", "admin"), guestController.getGuestHistory);

router
  .route("/:id")
  .get(authorize("staff", "manager", "admin"), guestController.getGuest)
  .put(
    authorize("manager", "admin"),
    guestController.validateGuestData,
    guestController.updateGuest
  )
  .delete(authorize("admin"), guestController.deleteGuest);

// Check-in and check-out routes
router
  .route("/checkin")
  .post(authorize("manager", "admin"), guestController.checkInGuest);

router
  .route("/:id/checkin")
  .put(authorize("manager", "admin"), guestController.checkInGuest);

router
  .route("/:id/checkout")
  .put(authorize("manager", "admin"), guestController.checkoutGuest);

router
  .route("/:id/checkout-status")
  .get(
    authorize("staff", "manager", "admin"),
    guestController.getGuestCheckoutStatus
  );

router
  .route("/:id/recalculate-billing")
  .post(authorize("manager", "admin"), guestController.recalculateGuestBilling);

module.exports = router;
