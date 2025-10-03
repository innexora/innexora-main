const express = require("express");
const router = express.Router();
const foodController = require("../controllers/foodController");
const { protect, authorize } = require("../middleware/authMiddleware");

// All food routes require authentication
router.use(protect);

// Stats route (must be before other routes)
router
  .route("/stats")
  .get(authorize("staff", "manager", "admin"), foodController.getFoodStats);

// Public food categories route
router.get("/categories", foodController.getFoodCategories);

// Food CRUD operations (staff and above)
router
  .route("/")
  .get(authorize("staff", "manager", "admin"), foodController.getFoodItems)
  .post(
    authorize("staff", "manager", "admin"),
    foodController.validateFoodItem,
    foodController.createFoodItem
  );

router
  .route("/search")
  .get(authorize("staff", "manager", "admin"), foodController.searchFoodItems);

router
  .route("/:id")
  .get(authorize("staff", "manager", "admin"), foodController.getFoodItem)
  .put(
    authorize("staff", "manager", "admin"),
    foodController.validateFoodItem,
    foodController.updateFoodItem
  )
  .delete(authorize("manager", "admin"), foodController.deleteFoodItem);

// Toggle availability
router.patch(
  "/:id/availability",
  authorize("staff", "manager", "admin"),
  foodController.toggleFoodAvailability
);

module.exports = router;
