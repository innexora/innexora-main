const dotenv = require("dotenv");
const databaseManager = require("./databaseManager");

// Load environment variables
dotenv.config();

/**
 * Create admin user for a specific hotel
 * @param {string} hotelSubdomain - The subdomain of the hotel
 * @param {Object} adminData - Admin user data
 * @returns {Promise<Object>} Created admin user or existing user info
 */
const createAdminUser = async (hotelSubdomain, adminData = {}) => {
  try {
    console.log(`🔗 Connecting to databases for hotel: ${hotelSubdomain}...`);

    // Initialize main connection
    await databaseManager.initMainConnection();
    console.log("✅ Main database connected");

    // Get tenant connection
    const tenantConnection =
      await databaseManager.getTenantConnection(hotelSubdomain);
    const tenantModels = databaseManager.getTenantModels(tenantConnection);
    console.log(`✅ Connected to ${hotelSubdomain} tenant database`);

    // Default admin data
    const defaultAdminData = {
      name: `${hotelSubdomain.charAt(0).toUpperCase() + hotelSubdomain.slice(1)} Admin`,
      email: `admin@${hotelSubdomain}.com`,
      password: "admin123",
      role: "admin",
      isActive: true,
    };

    // Merge with provided data
    const finalAdminData = { ...defaultAdminData, ...adminData };

    // Check if admin already exists
    const existingAdmin = await tenantModels.User.findOne({
      email: finalAdminData.email,
    });

    if (existingAdmin) {
      console.log("⚠️  Admin user already exists:");
      console.log(`📧 Email: ${existingAdmin.email}`);
      console.log(`👤 Name: ${existingAdmin.name}`);
      console.log(`🎭 Role: ${existingAdmin.role}`);
      console.log("🔑 You can use the existing password or reset it");
      return { success: true, user: existingAdmin, created: false };
    } else {
      const newAdmin = await tenantModels.User.create(finalAdminData);
      console.log("✅ Admin user created successfully!");
      console.log(`📧 Email: ${newAdmin.email}`);
      console.log(`🔑 Password: ${finalAdminData.password}`);
      console.log(`👤 Name: ${newAdmin.name}`);
      console.log(`🎭 Role: ${newAdmin.role}`);
      console.log(`🏨 Hotel Subdomain: ${hotelSubdomain}`);
      console.log(
        `🌐 Login URL: http://${hotelSubdomain}.localhost:3000/auth/login`
      );
      return { success: true, user: newAdmin, created: true };
    }
  } catch (error) {
    console.error("❌ Error creating admin user:", error.message);
    throw error;
  }
};

/**
 * Seed admin users for multiple hotels
 */
const seedMultipleAdmins = async () => {
  try {
    console.log("🌱 Starting admin user seeding for multiple hotels...");

    // Define hotels and their admin data
    const hotelsConfig = [
      {
        subdomain: "demo",
        adminData: {
          name: "Demo Admin",
          email: "admin@demoluxuryhotel.com",
          password: "admin123",
        },
      },
      {
        subdomain: "paradise",
        adminData: {
          name: "Paradise Admin",
          email: "admin@paradiseresort.com",
          password: "admin123",
        },
      },
      {
        subdomain: "marvel",
        adminData: {
          name: "Marvel Admin",
          email: "admin@marvelbusinesshotel.com",
          password: "admin123",
        },
      },
      {
        subdomain: "marriott",
        adminData: {
          name: "Marriott Admin",
          email: "admin@marriott.com",
          password: "admin123",
        },
      },
    ];

    const results = [];

    for (const config of hotelsConfig) {
      try {
        console.log(`\n🏨 Processing hotel: ${config.subdomain}`);
        const result = await createAdminUser(
          config.subdomain,
          config.adminData
        );
        results.push({ subdomain: config.subdomain, ...result });
      } catch (error) {
        console.error(
          `❌ Failed to create admin for ${config.subdomain}:`,
          error.message
        );
        results.push({
          subdomain: config.subdomain,
          success: false,
          error: error.message,
        });
      }
    }

    // Summary
    console.log("\n📊 Admin User Creation Summary:");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

    results.forEach((result) => {
      if (result.success) {
        const status = result.created ? "✅ CREATED" : "⚠️  EXISTS";
        console.log(`${status} | ${result.subdomain} | ${result.user.email}`);
      } else {
        console.log(`❌ FAILED  | ${result.subdomain} | ${result.error}`);
      }
    });

    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

    return results;
  } catch (error) {
    console.error("❌ Error in multiple admin seeding:", error.message);
    throw error;
  } finally {
    await databaseManager.closeAllConnections();
    console.log("🔌 All database connections closed");
  }
};

// Main function to run when script is executed directly
const main = async () => {
  try {
    // Get command line arguments
    const args = process.argv.slice(2);

    if (args.length === 0) {
      // No arguments, seed multiple admins
      await seedMultipleAdmins();
    } else if (args.length >= 1) {
      // Single hotel seeding
      const hotelSubdomain = args[0];
      const adminEmail = args[1] || `admin@${hotelSubdomain}.com`;
      const adminPassword = args[2] || "admin123";
      const adminName =
        args[3] ||
        `${hotelSubdomain.charAt(0).toUpperCase() + hotelSubdomain.slice(1)} Admin`;

      console.log(`🎯 Creating admin for single hotel: ${hotelSubdomain}`);

      const result = await createAdminUser(hotelSubdomain, {
        email: adminEmail,
        password: adminPassword,
        name: adminName,
      });

      if (result.success) {
        console.log("\n🎉 Admin user setup completed!");
      }

      await databaseManager.closeAllConnections();
      console.log("🔌 Database connections closed");
    }

    process.exit(0);
  } catch (error) {
    console.error("❌ Seeding failed:", error.message);
    await databaseManager.closeAllConnections();
    process.exit(1);
  }
};

// Export functions for use in other scripts
module.exports = {
  createAdminUser,
  seedMultipleAdmins,
};

// Run main function if script is executed directly
if (require.main === module) {
  main();
}
