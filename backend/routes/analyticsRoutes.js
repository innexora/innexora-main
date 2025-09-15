const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');
const { protect } = require('../middleware/authMiddleware');

// Apply authentication middleware to all analytics routes
router.use(protect);

// Get comprehensive dashboard analytics
router.get('/dashboard', analyticsController.getDashboardAnalytics);

// Get revenue-specific analytics
router.get('/revenue', analyticsController.getRevenueAnalytics);

// Get occupancy-specific analytics
router.get('/occupancy', analyticsController.getOccupancyAnalytics);

module.exports = router;
