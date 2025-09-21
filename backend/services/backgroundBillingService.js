const cron = require("node-cron");
const databaseManager = require("../utils/databaseManager");
const AutomaticBillingService = require("./automaticBillingService");

class BackgroundBillingService {
  constructor() {
    this.isRunning = false;
    this.jobs = [];
  }

  // Start all background jobs
  start() {
    if (this.isRunning) {
      console.log("Background billing service is already running");
      return;
    }

    console.log("🚀 Starting background billing service...");

    // Job 1: Recalculate billing every hour
    const billingJob = cron.schedule(
      "0 * * * *",
      async () => {
        console.log("⏰ Running hourly billing recalculation...");
        await this.recalculateAllGuestBilling();
      },
      {
        scheduled: false,
        timezone: "UTC",
      }
    );

    // Job 2: Check for late checkouts every 15 minutes
    const lateCheckoutJob = cron.schedule(
      "*/15 * * * *",
      async () => {
        console.log("⏰ Checking for late checkouts...");
        await this.checkLateCheckouts();
      },
      {
        scheduled: false,
        timezone: "UTC",
      }
    );

    // Job 3: Daily billing summary at midnight
    const dailyJob = cron.schedule(
      "0 0 * * *",
      async () => {
        console.log("⏰ Running daily billing summary...");
        await this.generateDailyBillingSummary();
      },
      {
        scheduled: false,
        timezone: "UTC",
      }
    );

    this.jobs = [billingJob, lateCheckoutJob, dailyJob];

    // Start all jobs
    this.jobs.forEach((job) => job.start());
    this.isRunning = true;

    console.log("✅ Background billing service started successfully");
    console.log("📋 Scheduled jobs:");
    console.log("   - Hourly billing recalculation");
    console.log("   - 15-minute late checkout checks");
    console.log("   - Daily billing summary");
  }

  // Stop all background jobs
  stop() {
    if (!this.isRunning) {
      console.log("Background billing service is not running");
      return;
    }

    this.jobs.forEach((job) => job.stop());
    this.jobs = [];
    this.isRunning = false;

    console.log("🛑 Background billing service stopped");
  }

  // Recalculate billing for all checked-in guests across all active hotels
  async recalculateAllGuestBilling() {
    try {
      // Initialize main database connection
      await databaseManager.initMainConnection();

      // Get all active hotels from main database
      const mainConnection = databaseManager.getMainConnection();
      const MainHotel = mainConnection.model(
        "MainHotel",
        require("../models/MainHotel").schema
      );

      const activeHotels = await MainHotel.find({
        status: "Active",
      }).select("subdomain name");

      if (activeHotels.length === 0) {
        console.log("📊 No active hotels found for billing recalculation");
        return;
      }

      console.log(
        `📊 Processing billing for ${activeHotels.length} active hotels`
      );

      let totalUpdatedCount = 0;
      let totalErrorCount = 0;
      let hotelProcessedCount = 0;

      // Process each hotel
      for (const hotel of activeHotels) {
        try {
          console.log(
            `🏨 Processing hotel: ${hotel.name} (${hotel.subdomain})`
          );

          // Get tenant connection for this hotel
          const tenantConnection = await databaseManager.getTenantConnection(
            hotel.subdomain
          );
          const tenantModels =
            databaseManager.getTenantModels(tenantConnection);

          const Guest = tenantModels.Guest;
          const Room = tenantModels.Room;
          const Bill = tenantModels.Bill;

          // Find all checked-in guests for this hotel
          const guests = await Guest.find({ status: "checked_in" });

          if (guests.length === 0) {
            console.log(`📊 No checked-in guests found for ${hotel.name}`);
            continue;
          }

          console.log(
            `📊 Recalculating billing for ${guests.length} checked-in guests in ${hotel.name}`
          );

          let hotelUpdatedCount = 0;
          let hotelErrorCount = 0;

          for (const guest of guests) {
            try {
              // Get room information
              const room = await Room.findById(guest.room);
              if (!room) {
                console.log(
                  `❌ Room not found for guest ${guest.name} in ${hotel.name}`
                );
                hotelErrorCount++;
                continue;
              }

              // Find the active bill
              const bill = await Bill.findOne({
                guest: guest._id,
                status: { $in: ["active", "partially_paid", "paid"] },
                isGuestCheckedOut: false,
              });

              if (!bill) {
                console.log(
                  `❌ No active bill found for guest ${guest.name} in ${hotel.name}`
                );
                hotelErrorCount++;
                continue;
              }

              // Recalculate billing using the hotel's subdomain
              await AutomaticBillingService.updateBillWithAutomaticCharges(
                bill,
                guest,
                room,
                hotel.subdomain
              );

              hotelUpdatedCount++;
              console.log(
                `✅ Updated billing for ${guest.name} (Room ${room.number}) in ${hotel.name}`
              );
            } catch (error) {
              console.error(
                `❌ Error updating billing for ${guest.name} in ${hotel.name}:`,
                error.message
              );
              hotelErrorCount++;
            }
          }

          totalUpdatedCount += hotelUpdatedCount;
          totalErrorCount += hotelErrorCount;
          hotelProcessedCount++;

          console.log(
            `📊 Hotel ${hotel.name} completed: ${hotelUpdatedCount} updated, ${hotelErrorCount} errors`
          );
        } catch (error) {
          console.error(
            `❌ Error processing hotel ${hotel.name} (${hotel.subdomain}):`,
            error.message
          );
          totalErrorCount++;
        }
      }

      console.log(
        `📊 Billing recalculation completed for ${hotelProcessedCount} hotels: ${totalUpdatedCount} total updated, ${totalErrorCount} total errors`
      );
    } catch (error) {
      console.error(
        "❌ Error in background billing recalculation:",
        error.message
      );
    }
    // Note: Do not close connections here as they are shared across the application
  }

  // Check for guests who should have late checkout charges applied across all hotels
  async checkLateCheckouts() {
    try {
      // Initialize main database connection
      await databaseManager.initMainConnection();

      // Get all active hotels from main database
      const mainConnection = databaseManager.getMainConnection();
      const MainHotel = mainConnection.model(
        "MainHotel",
        require("../models/MainHotel").schema
      );

      const activeHotels = await MainHotel.find({
        status: "Active",
      }).select("subdomain name");

      if (activeHotels.length === 0) {
        return;
      }

      let totalLateCheckouts = 0;

      // Process each hotel
      for (const hotel of activeHotels) {
        try {
          // Get tenant connection for this hotel
          const tenantConnection = await databaseManager.getTenantConnection(
            hotel.subdomain
          );
          const tenantModels =
            databaseManager.getTenantModels(tenantConnection);

          const Guest = tenantModels.Guest;
          const Room = tenantModels.Room;
          const Bill = tenantModels.Bill;

          // Find guests who are still checked in but past their checkout time
          const now = new Date();
          const guests = await Guest.find({
            status: "checked_in",
            checkOutDate: { $lt: now },
          });

          if (guests.length === 0) {
            continue;
          }

          console.log(
            `🕐 Found ${guests.length} guests past checkout time in ${hotel.name}`
          );
          totalLateCheckouts += guests.length;

          for (const guest of guests) {
            try {
              const room = await Room.findById(guest.room);
              if (!room) continue;

              const bill = await Bill.findOne({
                guest: guest._id,
                status: { $in: ["active", "partially_paid", "paid"] },
                isGuestCheckedOut: false,
              });

              if (!bill) continue;

              // Recalculate billing to apply late checkout charges using hotel's subdomain
              await AutomaticBillingService.updateBillWithAutomaticCharges(
                bill,
                guest,
                room,
                hotel.subdomain
              );

              console.log(
                `🕐 Applied late checkout charges for ${guest.name} in ${hotel.name}`
              );
            } catch (error) {
              console.error(
                `❌ Error checking late checkout for ${guest.name} in ${hotel.name}:`,
                error.message
              );
            }
          }
        } catch (error) {
          console.error(
            `❌ Error processing late checkouts for hotel ${hotel.name}:`,
            error.message
          );
        }
      }

      if (totalLateCheckouts > 0) {
        console.log(
          `🕐 Processed ${totalLateCheckouts} total late checkouts across all hotels`
        );
      }
    } catch (error) {
      console.error("❌ Error in late checkout check:", error.message);
    }
    // Note: Do not close connections here as they are shared across the application
  }

  // Generate daily billing summary for all active hotels
  async generateDailyBillingSummary() {
    try {
      // Initialize main database connection
      await databaseManager.initMainConnection();

      // Get all active hotels from main database
      const mainConnection = databaseManager.getMainConnection();
      const MainHotel = mainConnection.model(
        "MainHotel",
        require("../models/MainHotel").schema
      );

      const activeHotels = await MainHotel.find({
        status: "Active",
      }).select("subdomain name");

      if (activeHotels.length === 0) {
        console.log("📊 No active hotels found for daily summary");
        return;
      }

      console.log("📊 Daily Billing Summary for All Hotels:");

      // Process each hotel
      for (const hotel of activeHotels) {
        try {
          // Get tenant connection for this hotel
          const tenantConnection = await databaseManager.getTenantConnection(
            hotel.subdomain
          );
          const tenantModels =
            databaseManager.getTenantModels(tenantConnection);

          const Bill = tenantModels.Bill;
          const Guest = tenantModels.Guest;

          const today = new Date();
          const startOfDay = new Date(today.setHours(0, 0, 0, 0));
          const endOfDay = new Date(today.setHours(23, 59, 59, 999));

          // Get today's billing stats for this hotel
          const stats = await Bill.aggregate([
            {
              $match: {
                createdAt: { $gte: startOfDay, $lte: endOfDay },
              },
            },
            {
              $group: {
                _id: null,
                totalBills: { $sum: 1 },
                totalRevenue: { $sum: "$totalAmount" },
                totalPaid: { $sum: "$paidAmount" },
                totalOutstanding: { $sum: "$balanceAmount" },
              },
            },
          ]);

          const result = stats[0] || {
            totalBills: 0,
            totalRevenue: 0,
            totalPaid: 0,
            totalOutstanding: 0,
          };

          // Get active guests count for this hotel
          const activeGuests = await Guest.countDocuments({
            status: "checked_in",
          });

          console.log(`📊 ${hotel.name} (${hotel.subdomain}):`);
          console.log(`   Total Bills: ${result.totalBills}`);
          console.log(`   Total Revenue: ₹${result.totalRevenue}`);
          console.log(`   Total Paid: ₹${result.totalPaid}`);
          console.log(`   Outstanding: ₹${result.totalOutstanding}`);
          console.log(`   Active Guests: ${activeGuests}`);
        } catch (error) {
          console.error(
            `❌ Error generating daily summary for ${hotel.name}:`,
            error.message
          );
        }
      }
    } catch (error) {
      console.error(
        "❌ Error generating daily billing summary:",
        error.message
      );
    }
    // Note: Do not close connections here as they are shared across the application
  }

  // Get service status
  getStatus() {
    return {
      isRunning: this.isRunning,
      jobsCount: this.jobs.length,
      jobs: this.jobs.map((job, index) => ({
        id: index,
        running: job.running,
        nextRun: job.nextDate ? job.nextDate().toISOString() : null,
      })),
    };
  }
}

// Create singleton instance
const backgroundBillingService = new BackgroundBillingService();

module.exports = backgroundBillingService;
