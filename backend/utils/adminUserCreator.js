const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const databaseManager = require("./databaseManager");

/**
 * Creates an admin user for a specific hotel
 * Only allows one admin per hotel
 */
class AdminUserCreator {
  constructor() {
    this.mainConnection = null;
    this.tenantConnection = null;
  }

  async connect() {
    try {
      this.mainConnection = databaseManager.getMainConnection();
      console.log("✅ Connected to main database");
    } catch (error) {
      console.error("❌ Failed to connect to main database:", error);
      throw error;
    }
  }

  async createAdminUser(hotelSubdomain, adminData) {
    const { name, email, password } = adminData;

    if (!name || !email || !password) {
      throw new Error("Name, email, and password are required");
    }

    if (password.length < 8) {
      throw new Error("Password must be at least 8 characters long");
    }

    try {
      // Get hotel information from main database
      const MainHotelModel = this.mainConnection.model(
        "MainHotel",
        require("../models/MainHotel").schema
      );

      const hotel = await MainHotelModel.findOne({
        subdomain: hotelSubdomain.toLowerCase(),
        status: "Active",
      });

      if (!hotel) {
        throw new Error(
          `Hotel with subdomain '${hotelSubdomain}' not found or inactive`
        );
      }

      console.log(`🏨 Found hotel: ${hotel.name}`);

      // Connect to tenant database
      this.tenantConnection = await databaseManager.getTenantConnection(
        hotel.databaseName
      );

      const UserModel = this.tenantConnection.model(
        "User",
        require("../models/User").schema
      );

      // Check if admin already exists
      const existingAdmin = await UserModel.findOne({ role: "admin" });
      if (existingAdmin) {
        throw new Error(
          `Admin user already exists for hotel '${hotel.name}' (${existingAdmin.email})`
        );
      }

      // Check if email already exists
      const existingUser = await UserModel.findOne({
        email: email.toLowerCase(),
      });
      if (existingUser) {
        throw new Error(
          `User with email '${email}' already exists in hotel '${hotel.name}'`
        );
      }

      // Hash password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      // Create admin user
      const adminUser = new UserModel({
        name: name.trim(),
        email: email.toLowerCase().trim(),
        password: hashedPassword,
        role: "admin",
        hotelName: hotel.name,
        isActive: true,
      });

      await adminUser.save();

      console.log(
        `✅ Admin user created successfully for hotel '${hotel.name}'`
      );
      console.log(`   Name: ${adminUser.name}`);
      console.log(`   Email: ${adminUser.email}`);
      console.log(`   Role: ${adminUser.role}`);

      return {
        success: true,
        message: `Admin user created successfully for hotel '${hotel.name}'`,
        user: {
          id: adminUser._id,
          name: adminUser.name,
          email: adminUser.email,
          role: adminUser.role,
          hotelName: adminUser.hotelName,
        },
      };
    } catch (error) {
      console.error("❌ Error creating admin user:", error.message);
      throw error;
    }
  }

  async listHotels() {
    try {
      const MainHotelModel = this.mainConnection.model(
        "MainHotel",
        require("../models/MainHotel").schema
      );

      const hotels = await MainHotelModel.find({ status: "Active" })
        .select("name subdomain description")
        .sort({ name: 1 });

      console.log("\n🏨 Available Hotels:");
      console.log("==================");
      hotels.forEach((hotel, index) => {
        console.log(`${index + 1}. ${hotel.name}`);
        console.log(`   Subdomain: ${hotel.subdomain}`);
        console.log(`   URL: ${hotel.subdomain}.localhost:3000`);
        if (hotel.description) {
          console.log(`   Description: ${hotel.description}`);
        }
        console.log("");
      });

      return hotels;
    } catch (error) {
      console.error("❌ Error listing hotels:", error.message);
      throw error;
    }
  }

  async checkAdminExists(hotelSubdomain) {
    try {
      const MainHotelModel = this.mainConnection.model(
        "MainHotel",
        require("../models/MainHotel").schema
      );

      const hotel = await MainHotelModel.findOne({
        subdomain: hotelSubdomain.toLowerCase(),
        status: "Active",
      });

      if (!hotel) {
        throw new Error(`Hotel with subdomain '${hotelSubdomain}' not found`);
      }

      this.tenantConnection = await databaseManager.getTenantConnection(
        hotel.databaseName
      );
      const UserModel = this.tenantConnection.model(
        "User",
        require("../models/User").schema
      );

      const existingAdmin = await UserModel.findOne({ role: "admin" });

      return {
        hasAdmin: !!existingAdmin,
        admin: existingAdmin
          ? {
              name: existingAdmin.name,
              email: existingAdmin.email,
              createdAt: existingAdmin.createdAt,
            }
          : null,
        hotel: {
          name: hotel.name,
          subdomain: hotel.subdomain,
        },
      };
    } catch (error) {
      console.error("❌ Error checking admin:", error.message);
      throw error;
    }
  }

  async disconnect() {
    try {
      if (this.tenantConnection) {
        await this.tenantConnection.close();
      }
      // Main connection is managed by databaseManager, don't close it
      console.log("✅ Disconnected from databases");
    } catch (error) {
      console.error("❌ Error disconnecting:", error.message);
    }
  }
}

module.exports = AdminUserCreator;
