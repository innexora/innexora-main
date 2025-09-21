const mongoose = require("mongoose");

class DatabaseManager {
  constructor() {
    this.connections = new Map();
    this.mainConnection = null;
    this.isInitialized = false;
  }

  // Initialize main database connection
  async initMainConnection() {
    if (this.mainConnection && this.mainConnection.readyState === 1) {
      return this.mainConnection;
    }

    try {
      // Close existing connection if any
      if (this.mainConnection) {
        await this.mainConnection.close();
      }

      this.mainConnection = mongoose.createConnection(process.env.MONGODB_URI, {
        serverSelectionTimeoutMS: 30000,
        socketTimeoutMS: 60000,
        connectTimeoutMS: 30000,
        maxPoolSize: 20,
        minPoolSize: 5,
        bufferCommands: true,
        retryWrites: true,
        retryReads: true,
        maxIdleTimeMS: 30000,
        heartbeatFrequencyMS: 10000,
      });

      // Add connection event handlers
      this.addConnectionHandlers(this.mainConnection, "main");

      // Wait for connection
      await new Promise((resolve, reject) => {
        const timeout = setTimeout(
          () => reject(new Error("Main DB connection timeout")),
          30000
        );

        if (this.mainConnection.readyState === 1) {
          clearTimeout(timeout);
          resolve();
        } else {
          this.mainConnection.once("connected", () => {
            clearTimeout(timeout);
            resolve();
          });
          this.mainConnection.once("error", (err) => {
            clearTimeout(timeout);
            reject(err);
          });
        }
      });

      this.isInitialized = true;
      console.log("✅ Main database connected");
      return this.mainConnection;
    } catch (error) {
      console.error("❌ Main database connection error:", error);
      this.mainConnection = null;
      throw error;
    }
  }

  // Get main database connection
  getMainConnection() {
    if (!this.mainConnection || this.mainConnection.readyState !== 1) {
      console.warn(
        "⚠️ Main database connection not ready, attempting to reconnect..."
      );
      // Don't throw error immediately, try to reconnect
      this.initMainConnection().catch((err) => {
        console.error("❌ Failed to reconnect main database:", err.message);
      });
      throw new Error("Main database connection not ready");
    }
    return this.mainConnection;
  }

  // Get or create tenant database connection
  // Uses MONGODB_TENANT_URI for all tenant databases with hotel-specific database names
  // Each hotel gets its own database within the shared tenant cluster: hotel_{subdomain}
  async getTenantConnection(hotelSubdomain) {
    const connectionKey = `tenant_${hotelSubdomain}`;

    // Check existing connection
    if (this.connections.has(connectionKey)) {
      const conn = this.connections.get(connectionKey);
      if (conn.readyState === 1) {
        return conn;
      }
      // Remove bad connection
      this.connections.delete(connectionKey);
    }

    try {
      // Use MONGODB_TENANT_URI for all tenant databases with hotel-specific database name
      const tenantUri = process.env.MONGODB_TENANT_URI;

      if (!tenantUri) {
        throw new Error("MONGODB_TENANT_URI environment variable is not set");
      }

      const connectionOptions = {
        maxPoolSize: 20,
        minPoolSize: 5,
        serverSelectionTimeoutMS: 30000,
        socketTimeoutMS: 60000,
        connectTimeoutMS: 30000,
        bufferCommands: true, // Enable buffering for tenant connections
        retryWrites: true,
        retryReads: true,
        maxIdleTimeMS: 30000,
        heartbeatFrequencyMS: 10000,
        dbName: `hotel_${hotelSubdomain}`, // Each hotel gets its own database in the tenant cluster
      };

      const connection = mongoose.createConnection(
        tenantUri,
        connectionOptions
      );

      // Add connection event handlers
      this.addConnectionHandlers(connection, "tenant", hotelSubdomain);

      // Wait for connection
      await new Promise((resolve, reject) => {
        const timeout = setTimeout(
          () => reject(new Error("Tenant DB connection timeout")),
          30000
        );

        if (connection.readyState === 1) {
          clearTimeout(timeout);
          resolve();
        } else {
          connection.once("connected", () => {
            clearTimeout(timeout);
            resolve();
          });
          connection.once("error", (err) => {
            clearTimeout(timeout);
            reject(err);
          });
        }
      });

      this.connections.set(connectionKey, connection);
      console.log(
        `✅ Tenant database connected for ${hotelSubdomain} using shared tenant cluster`
      );
      return connection;
    } catch (error) {
      console.error(`❌ Tenant database error for ${hotelSubdomain}:`, error);
      this.connections.delete(connectionKey);
      throw error;
    }
  }

  // Close tenant connection
  async closeTenantConnection(hotelSubdomain) {
    const connectionKey = `tenant_${hotelSubdomain}`;
    const connection = this.connections.get(connectionKey);

    if (connection) {
      await connection.close();
      this.connections.delete(connectionKey);
      console.log(`✅ Tenant database connection closed for ${hotelSubdomain}`);
    }
  }

  // Close all connections
  async closeAllConnections() {
    try {
      // Close tenant connections
      const closePromises = [];
      for (const [key, connection] of this.connections) {
        closePromises.push(connection.close());
      }
      await Promise.all(closePromises);
      this.connections.clear();

      // Close main connection
      if (this.mainConnection) {
        await this.mainConnection.close();
        this.mainConnection = null;
      }

      console.log("✅ All database connections closed");
    } catch (error) {
      console.error("❌ Error closing database connections:", error);
    }
  }

  // Get tenant models for a specific hotel
  getTenantModels(connection) {
    // Define model schemas - try to get from model files, fallback to created schemas
    const modelDefinitions = [
      { name: "User", model: require("../models/User") },
      { name: "Room", model: require("../models/Room") },
      { name: "Ticket", model: require("../models/Ticket") },
      { name: "Food", model: require("../models/Food") },
      { name: "Guest", model: require("../models/Guest") },
      { name: "Order", model: require("../models/Order") },
      { name: "Bill", model: require("../models/Bill") },
      { name: "Booking", model: require("../models/Booking") },
      { name: "QRCode", model: require("../models/QRCode") },
    ];

    const models = {};
    for (const { name, model } of modelDefinitions) {
      try {
        if (model && model.schema) {
          // If model exports a schema directly
          models[name] = connection.model(name, model.schema);
        } else if (model && typeof model === "function" && model.schema) {
          // If model is a mongoose model constructor
          models[name] = connection.model(name, model.schema);
        } else {
          // Try fallback schema creators
          const fallbackSchema = this[`create${name}Schema`]
            ? this[`create${name}Schema`]()
            : null;
          if (fallbackSchema) {
            models[name] = connection.model(name, fallbackSchema);
          } else {
            console.warn(`⚠️ No schema available for model: ${name}`);
          }
        }
        console.log(`✅ Created tenant model: ${name}`);
      } catch (error) {
        console.error(`❌ Error creating tenant model ${name}:`, error.message);
        // Try fallback
        try {
          const fallbackSchema = this[`create${name}Schema`]
            ? this[`create${name}Schema`]()
            : null;
          if (fallbackSchema) {
            models[name] = connection.model(name, fallbackSchema);
            console.log(`✅ Created tenant model ${name} with fallback schema`);
          }
        } catch (fallbackError) {
          console.error(
            `❌ Fallback schema creation failed for ${name}:`,
            fallbackError.message
          );
        }
      }
    }

    console.log(`✅ Created ${Object.keys(models).length} tenant models`);
    return models;
  }

  // Fallback schema creators (in case model files don't exist)
  createUserSchema() {
    const mongoose = require("mongoose");
    return new mongoose.Schema(
      {
        name: { type: String, required: true },
        email: { type: String, required: true, unique: true },
        password: { type: String, required: true, select: false },
        hotelName: { type: String, required: true },
        role: {
          type: String,
          enum: ["admin", "manager", "staff"],
          default: "manager",
        },
        isActive: { type: Boolean, default: true },
      },
      { timestamps: true }
    );
  }

  createRoomSchema() {
    const mongoose = require("mongoose");
    return new mongoose.Schema(
      {
        number: { type: String, required: true },
        type: { type: String, required: true },
        status: {
          type: String,
          enum: ["available", "occupied", "maintenance"],
          default: "available",
        },
        price: { type: Number, required: true },
      },
      { timestamps: true }
    );
  }

  createTicketSchema() {
    const mongoose = require("mongoose");
    return new mongoose.Schema(
      {
        title: { type: String, required: true },
        description: { type: String },
        status: {
          type: String,
          enum: ["open", "in-progress", "closed"],
          default: "open",
        },
        priority: {
          type: String,
          enum: ["low", "medium", "high"],
          default: "medium",
        },
      },
      { timestamps: true }
    );
  }

  createFoodSchema() {
    const mongoose = require("mongoose");
    return new mongoose.Schema(
      {
        name: { type: String, required: true },
        price: { type: Number, required: true },
        category: { type: String, required: true },
        available: { type: Boolean, default: true },
      },
      { timestamps: true }
    );
  }

  createGuestSchema() {
    const mongoose = require("mongoose");
    return new mongoose.Schema(
      {
        name: { type: String, required: true },
        email: { type: String },
        phone: { type: String },
        roomNumber: { type: String },
      },
      { timestamps: true }
    );
  }

  createOrderSchema() {
    const mongoose = require("mongoose");
    return new mongoose.Schema(
      {
        items: [{ name: String, quantity: Number, price: Number }],
        totalAmount: { type: Number, required: true },
        status: {
          type: String,
          enum: ["pending", "confirmed", "delivered"],
          default: "pending",
        },
      },
      { timestamps: true }
    );
  }

  createBillSchema() {
    const mongoose = require("mongoose");
    return new mongoose.Schema(
      {
        guestId: { type: mongoose.Schema.Types.ObjectId, ref: "Guest" },
        amount: { type: Number, required: true },
        status: { type: String, enum: ["pending", "paid"], default: "pending" },
      },
      { timestamps: true }
    );
  }

  createBookingSchema() {
    const mongoose = require("mongoose");
    return new mongoose.Schema(
      {
        guestId: { type: mongoose.Schema.Types.ObjectId, ref: "Guest" },
        roomId: { type: mongoose.Schema.Types.ObjectId, ref: "Room" },
        checkIn: { type: Date, required: true },
        checkOut: { type: Date, required: true },
      },
      { timestamps: true }
    );
  }

  createQRCodeSchema() {
    const mongoose = require("mongoose");
    return new mongoose.Schema(
      {
        roomId: { type: mongoose.Schema.Types.ObjectId, ref: "Room" },
        code: { type: String, required: true, unique: true },
        isActive: { type: Boolean, default: true },
      },
      { timestamps: true }
    );
  }

  // Check connection health
  isConnectionHealthy(connection) {
    return connection && connection.readyState === 1;
  }

  // Retry database operation with exponential backoff
  async retryOperation(operation, maxRetries = 3, baseDelay = 1000) {
    let lastError;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;
        console.warn(
          `Database operation failed (attempt ${attempt}/${maxRetries}):`,
          error.message
        );

        // Don't retry on validation errors or certain MongoDB errors
        if (
          error.name === "ValidationError" ||
          error.code === 11000 || // Duplicate key error
          error.code === 121 || // Document validation error
          error.message.includes("E11000")
        ) {
          // Duplicate key error
          throw error;
        }

        if (attempt < maxRetries) {
          const delay = baseDelay * Math.pow(2, attempt - 1); // Exponential backoff
          console.log(`Retrying in ${delay}ms...`);
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }

    throw lastError;
  }

  // Get connection stats
  getConnectionStats() {
    return {
      mainConnection: this.mainConnection
        ? this.mainConnection.readyState
        : "not connected",
      tenantConnections: this.connections.size,
      tenantConnectionDetails: Array.from(this.connections.entries()).map(
        ([key, conn]) => ({
          key,
          readyState: conn.readyState,
          name: conn.name,
        })
      ),
    };
  }

  // Gracefully handle disconnections and attempt reconnect
  async ensureConnection(type = "main", subdomain = null) {
    try {
      if (type === "main") {
        if (!this.isConnectionHealthy(this.mainConnection)) {
          console.log("🔄 Reconnecting main database...");
          await this.initMainConnection();
        }
        return this.mainConnection;
      } else if (type === "tenant" && subdomain) {
        const connectionKey = `tenant_${subdomain}`;
        const existing = this.connections.get(connectionKey);
        if (!this.isConnectionHealthy(existing)) {
          console.log(`🔄 Reconnecting tenant database for ${subdomain}...`);
          await this.getTenantConnection(subdomain);
        }
        return this.connections.get(connectionKey);
      }
    } catch (error) {
      console.error(`❌ Failed to ensure ${type} connection:`, error.message);
      throw error;
    }
  }

  // Add connection event handlers for better monitoring
  addConnectionHandlers(connection, type, subdomain = null) {
    const identifier = subdomain ? `${type}_${subdomain}` : type;

    connection.on("connected", () => {
      console.log(`✅ ${identifier} database connected`);
    });

    connection.on("error", (err) => {
      console.error(`❌ ${identifier} database error:`, err.message);
    });

    connection.on("disconnected", () => {
      console.warn(`⚠️ ${identifier} database disconnected`);
      // Don't automatically reconnect here to avoid connection storms
    });

    connection.on("reconnected", () => {
      console.log(`🔄 ${identifier} database reconnected`);
    });
  }
}

// Create singleton instance
const databaseManager = new DatabaseManager();

module.exports = databaseManager;
