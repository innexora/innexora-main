const mongoose = require('mongoose');

// Analytics Controller for comprehensive hotel reporting
const analyticsController = {
  // Get comprehensive analytics dashboard data
  getDashboardAnalytics: async (req, res) => {
    try {
      const { period = 'month', startDate, endDate } = req.query;
      
      // Calculate date range based on period
      let dateFilter = {};
      const now = new Date();
      
      if (startDate && endDate) {
        dateFilter = {
          createdAt: {
            $gte: new Date(startDate),
            $lte: new Date(endDate)
          }
        };
      } else {
        switch (period) {
          case 'day':
            dateFilter = {
              createdAt: {
                $gte: new Date(now.getFullYear(), now.getMonth(), now.getDate()),
                $lte: now
              }
            };
            break;
          case 'week':
            const weekStart = new Date(now);
            weekStart.setDate(now.getDate() - 7);
            dateFilter = {
              createdAt: {
                $gte: weekStart,
                $lte: now
              }
            };
            break;
          case 'month':
            dateFilter = {
              createdAt: {
                $gte: new Date(now.getFullYear(), now.getMonth(), 1),
                $lte: now
              }
            };
            break;
          case 'year':
            dateFilter = {
              createdAt: {
                $gte: new Date(now.getFullYear(), 0, 1),
                $lte: now
              }
            };
            break;
        }
      }

      // Get models from request (tenant-specific)
      const { Guest, Room, Bill, Order, Ticket } = req.tenantModels;

      console.log('📊 Analytics request:', { period, dateFilter, models: Object.keys(req.tenantModels) });

      // Parallel execution of all analytics queries
      const [
        revenueAnalytics,
        occupancyAnalytics,
        guestAnalytics,
        orderAnalytics,
        ticketAnalytics,
        roomAnalytics,
        trendAnalytics
      ] = await Promise.all([
        getRevenueAnalytics(Bill, dateFilter),
        getOccupancyAnalytics(Guest, Room, dateFilter),
        getGuestAnalytics(Guest, dateFilter),
        getOrderAnalytics(Order, dateFilter),
        getTicketAnalytics(Ticket, dateFilter),
        getRoomAnalytics(Room, Guest),
        getTrendAnalytics(Bill, Guest, Order, dateFilter, period)
      ]);

      const responseData = {
        period,
        dateRange: dateFilter,
        revenue: revenueAnalytics,
        occupancy: occupancyAnalytics,
        guests: guestAnalytics,
        orders: orderAnalytics,
        tickets: ticketAnalytics,
        rooms: roomAnalytics,
        trends: trendAnalytics
      };

      console.log('📊 Analytics response:', JSON.stringify(responseData, null, 2));

      res.json({
        success: true,
        data: responseData
      });

    } catch (error) {
      console.error('Analytics dashboard error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch analytics data',
        error: error.message
      });
    }
  },

  // Get revenue-specific analytics
  getRevenueAnalytics: async (req, res) => {
    try {
      const { period = 'month' } = req.query;
      const { Bill } = req.tenantModels;
      
      const dateFilter = getDateFilter(period);
      const revenueData = await getRevenueAnalytics(Bill, dateFilter);
      
      res.json({
        success: true,
        data: revenueData
      });
    } catch (error) {
      console.error('Revenue analytics error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch revenue analytics',
        error: error.message
      });
    }
  },

  // Get occupancy-specific analytics
  getOccupancyAnalytics: async (req, res) => {
    try {
      const { period = 'month' } = req.query;
      const { Guest, Room } = req.tenantModels;
      
      const dateFilter = getDateFilter(period);
      const occupancyData = await getOccupancyAnalytics(Guest, Room, dateFilter);
      
      res.json({
        success: true,
        data: occupancyData
      });
    } catch (error) {
      console.error('Occupancy analytics error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch occupancy analytics',
        error: error.message
      });
    }
  }
};

// Helper function to get date filter
function getDateFilter(period) {
  const now = new Date();
  let dateFilter = {};
  
  switch (period) {
    case 'day':
      dateFilter = {
        createdAt: {
          $gte: new Date(now.getFullYear(), now.getMonth(), now.getDate()),
          $lte: now
        }
      };
      break;
    case 'week':
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - 7);
      dateFilter = {
        createdAt: {
          $gte: weekStart,
          $lte: now
        }
      };
      break;
    case 'month':
      dateFilter = {
        createdAt: {
          $gte: new Date(now.getFullYear(), now.getMonth(), 1),
          $lte: now
        }
      };
      break;
    case 'year':
      dateFilter = {
        createdAt: {
          $gte: new Date(now.getFullYear(), 0, 1),
          $lte: now
        }
      };
      break;
  }
  
  return dateFilter;
}

// Revenue Analytics Helper
async function getRevenueAnalytics(Bill, dateFilter) {
  try {
    // Total revenue and bill statistics
    const revenueStats = await Bill.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$paidAmount' },
          totalBills: { $sum: 1 },
          averageBillAmount: { $avg: '$totalAmount' },
          totalOutstanding: { $sum: '$balanceAmount' },
          totalRoomCharges: {
            $sum: {
              $sum: {
                $map: {
                  input: {
                    $filter: {
                      input: '$items',
                      cond: { $eq: ['$$this.type', 'room_charge'] }
                    }
                  },
                  as: 'item',
                  in: '$$item.amount'
                }
              }
            }
          },
          totalFoodRevenue: {
            $sum: {
              $sum: {
                $map: {
                  input: {
                    $filter: {
                      input: '$items',
                      cond: { $eq: ['$$this.type', 'food_order'] }
                    }
                  },
                  as: 'item',
                  in: '$$item.amount'
                }
              }
            }
          }
        }
      }
    ]);

    // Revenue by payment method
    const paymentMethodStats = await Bill.aggregate([
      { $match: dateFilter },
      { $unwind: '$payments' },
      {
        $group: {
          _id: '$payments.method',
          totalAmount: { $sum: '$payments.amount' },
          count: { $sum: 1 }
        }
      },
      { $sort: { totalAmount: -1 } }
    ]);

    // Daily revenue trend
    const dailyRevenue = await Bill.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            day: { $dayOfMonth: '$createdAt' }
          },
          revenue: { $sum: '$paidAmount' },
          bills: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
    ]);

    const summary = revenueStats[0] || {
      totalRevenue: 0,
      totalBills: 0,
      averageBillAmount: 0,
      totalOutstanding: 0,
      totalRoomCharges: 0,
      totalFoodRevenue: 0
    };

    // Remove _id field from summary
    if (summary._id !== undefined) {
      delete summary._id;
    }

    return {
      summary,
      paymentMethods: paymentMethodStats,
      dailyTrend: dailyRevenue
    };
  } catch (error) {
    console.error('Revenue analytics error:', error);
    throw error;
  }
}

// Occupancy Analytics Helper
async function getOccupancyAnalytics(Guest, Room, dateFilter) {
  try {
    // Total rooms and current occupancy
    const totalRooms = await Room.countDocuments();
    const occupiedRooms = await Room.countDocuments({ status: 'occupied' });
    const availableRooms = await Room.countDocuments({ status: 'available' });
    const maintenanceRooms = await Room.countDocuments({ status: 'maintenance' });
    const cleaningRooms = await Room.countDocuments({ status: 'cleaning' });

    // Guest statistics
    const guestStats = await Guest.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    // Average stay duration
    const avgStayDuration = await Guest.aggregate([
      {
        $match: {
          ...dateFilter,
          status: 'checked_out',
          checkOutDate: { $exists: true }
        }
      },
      {
        $project: {
          stayDuration: {
            $divide: [
              { $subtract: ['$checkOutDate', '$checkInDate'] },
              1000 * 60 * 60 * 24 // Convert to days
            ]
          }
        }
      },
      {
        $group: {
          _id: null,
          averageStay: { $avg: '$stayDuration' },
          totalGuests: { $sum: 1 }
        }
      }
    ]);

    // Occupancy rate by room type
    const occupancyByType = await Room.aggregate([
      {
        $group: {
          _id: '$type',
          total: { $sum: 1 },
          occupied: {
            $sum: {
              $cond: [{ $eq: ['$status', 'occupied'] }, 1, 0]
            }
          }
        }
      },
      {
        $project: {
          _id: 1,
          total: 1,
          occupied: 1,
          occupancyRate: {
            $multiply: [
              { $divide: ['$occupied', '$total'] },
              100
            ]
          }
        }
      }
    ]);

    const occupancyRate = totalRooms > 0 ? (occupiedRooms / totalRooms) * 100 : 0;

    return {
      summary: {
        totalRooms,
        occupiedRooms,
        availableRooms,
        maintenanceRooms,
        cleaningRooms,
        occupancyRate: Math.round(occupancyRate * 100) / 100
      },
      guestStats: guestStats.reduce((acc, stat) => {
        acc[stat._id] = stat.count;
        return acc;
      }, {}),
      averageStay: avgStayDuration[0]?.averageStay || 0,
      occupancyByType
    };
  } catch (error) {
    console.error('Occupancy analytics error:', error);
    throw error;
  }
}

// Guest Analytics Helper
async function getGuestAnalytics(Guest, dateFilter) {
  try {
    const guestStats = await Guest.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: null,
          totalGuests: { $sum: 1 },
          checkedInGuests: {
            $sum: { $cond: [{ $eq: ['$status', 'checked_in'] }, 1, 0] }
          },
          checkedOutGuests: {
            $sum: { $cond: [{ $eq: ['$status', 'checked_out'] }, 1, 0] }
          }
        }
      }
    ]);

    // Guest check-ins by day
    const dailyCheckIns = await Guest.aggregate([
      { $match: { ...dateFilter, status: { $in: ['checked_in', 'checked_out'] } } },
      {
        $group: {
          _id: {
            year: { $year: '$checkInDate' },
            month: { $month: '$checkInDate' },
            day: { $dayOfMonth: '$checkInDate' }
          },
          checkIns: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
    ]);

    const summary = guestStats[0] || {
      totalGuests: 0,
      checkedInGuests: 0,
      checkedOutGuests: 0
    };

    // Remove _id field from summary
    if (summary._id !== undefined) {
      delete summary._id;
    }

    return {
      summary,
      dailyCheckIns
    };
  } catch (error) {
    console.error('Guest analytics error:', error);
    throw error;
  }
}

// Order Analytics Helper
async function getOrderAnalytics(Order, dateFilter) {
  try {
    const orderStats = await Order.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalAmount: { $sum: '$totalAmount' }
        }
      }
    ]);

    // Popular food items
    const popularItems = await Order.aggregate([
      { $match: dateFilter },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.foodName',
          totalOrdered: { $sum: '$items.quantity' },
          totalRevenue: { $sum: '$items.totalPrice' }
        }
      },
      { $sort: { totalOrdered: -1 } },
      { $limit: 10 }
    ]);

    // Order trends by hour
    const hourlyOrders = await Order.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: { $hour: '$createdAt' },
          orders: { $sum: 1 },
          revenue: { $sum: '$totalAmount' }
        }
      },
      { $sort: { '_id': 1 } }
    ]);

    return {
      summary: orderStats.reduce((acc, stat) => {
        acc[stat._id] = { count: stat.count, amount: stat.totalAmount };
        return acc;
      }, {}),
      popularItems,
      hourlyTrends: hourlyOrders
    };
  } catch (error) {
    console.error('Order analytics error:', error);
    throw error;
  }
}

// Ticket Analytics Helper
async function getTicketAnalytics(Ticket, dateFilter) {
  try {
    const ticketStats = await Ticket.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    // Tickets by category
    const ticketsByCategory = await Ticket.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);

    // Tickets by priority
    const ticketsByPriority = await Ticket.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: '$priority',
          count: { $sum: 1 }
        }
      }
    ]);

    return {
      summary: ticketStats.reduce((acc, stat) => {
        acc[stat._id] = stat.count;
        return acc;
      }, {}),
      byCategory: ticketsByCategory,
      byPriority: ticketsByPriority
    };
  } catch (error) {
    console.error('Ticket analytics error:', error);
    throw error;
  }
}

// Room Analytics Helper
async function getRoomAnalytics(Room, Guest) {
  try {
    const roomStats = await Room.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const roomsByType = await Room.aggregate([
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 },
          averagePrice: { $avg: '$price' }
        }
      }
    ]);

    const roomsByFloor = await Room.aggregate([
      {
        $group: {
          _id: '$floor',
          count: { $sum: 1 },
          occupied: {
            $sum: { $cond: [{ $eq: ['$status', 'occupied'] }, 1, 0] }
          }
        }
      },
      { $sort: { '_id': 1 } }
    ]);

    return {
      byStatus: roomStats.reduce((acc, stat) => {
        acc[stat._id] = stat.count;
        return acc;
      }, {}),
      byType: roomsByType,
      byFloor: roomsByFloor
    };
  } catch (error) {
    console.error('Room analytics error:', error);
    throw error;
  }
}

// Trend Analytics Helper
async function getTrendAnalytics(Bill, Guest, Order, dateFilter, period) {
  try {
    let groupBy = {};
    
    switch (period) {
      case 'day':
        groupBy = {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' },
          day: { $dayOfMonth: '$createdAt' },
          hour: { $hour: '$createdAt' }
        };
        break;
      case 'week':
      case 'month':
        groupBy = {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' },
          day: { $dayOfMonth: '$createdAt' }
        };
        break;
      case 'year':
        groupBy = {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' }
        };
        break;
    }

    // Revenue trends
    const revenueTrends = await Bill.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: groupBy,
          revenue: { $sum: '$paidAmount' },
          bills: { $sum: 1 }
        }
      },
      { $sort: { '_id': 1 } }
    ]);

    // Guest trends
    const guestTrends = await Guest.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: groupBy,
          checkIns: { $sum: 1 }
        }
      },
      { $sort: { '_id': 1 } }
    ]);

    // Order trends
    const orderTrends = await Order.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: groupBy,
          orders: { $sum: 1 },
          orderRevenue: { $sum: '$totalAmount' }
        }
      },
      { $sort: { '_id': 1 } }
    ]);

    return {
      revenue: revenueTrends,
      guests: guestTrends,
      orders: orderTrends
    };
  } catch (error) {
    console.error('Trend analytics error:', error);
    throw error;
  }
}

module.exports = analyticsController;
