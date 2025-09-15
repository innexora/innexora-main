const axios = require("axios");
const Ticket = require("../models/Ticket");
const Room = require("../models/Room");
const Guest = require("../models/Guest");

// @desc    Handle AI chat for guests using hotel classifier
// @route   POST /api/chat/ai
// @access  Public
exports.chatWithAI = async (req, res) => {
  try {
    // Debug tenant information
    console.log("🏨 Chat AI - Tenant Info:", {
      isMainDomain: req.isMainDomain,
      subdomain: req.subdomain,
      hotel: req.hotel ? req.hotel.name : null,
      hasTenantModels: !!req.tenantModels,
      tenantModelsKeys: req.tenantModels ? Object.keys(req.tenantModels) : null
    });

    // Use tenant models
    if (!req.tenantModels || !req.tenantModels.Room) {
      console.error("Tenant Room model not available:", req.tenantModels);
      return res.status(500).json({
        success: false,
        error: "Tenant database not properly initialized",
      });
    }
    const Room = req.tenantModels.Room;
    
    const Guest = req.tenantModels
      ? req.tenantModels.Guest
      : require("../models/Guest");

    console.log("🔍 Received request body:", JSON.stringify(req.body, null, 2));
    const {
      message,
      guestInfo,
      guestId,
      roomNumber,
      roomAccessId,
      conversationHistory = [],
    } = req.body;

    if (!message) {
      return res.status(400).json({
        success: false,
        message: "Message is required",
      });
    }

    console.log("📝 Extracted values:", {
      message,
      guestInfo,
      guestId,
      roomNumber,
      roomAccessId,
    });
    
    console.log("🔍 Detailed guestInfo structure:", JSON.stringify(guestInfo, null, 2));

    // Get room information from roomAccessId if available, or use existing logic
    let roomInfo = null;
    if (roomAccessId) {
      console.log(`🔍 Looking up room by access ID: ${roomAccessId}`);
      roomInfo = await Room.findOne({ roomAccessId: roomAccessId });
      if (!roomInfo) {
        return res.status(404).json({
          success: false,
          message: "Invalid room access code",
        });
      }
      console.log(`✅ Found room: ${roomInfo.number} (${roomInfo.type})`);
    }

    // Handle both old format (guestInfo object) and new format (separate fields)
    let guestData;
    if (guestInfo) {
      // Frontend sends guestInfo object - use roomInfo if available
      guestData = {
        guestName: guestInfo.guestName || guestInfo.name,
        roomNumber: roomInfo ? roomInfo.number : (guestInfo.roomNumber || roomNumber),
        email: guestInfo.email || "",
        phone: guestInfo.phone || "",
      };
      
      // If roomNumber is still undefined, log error and return
      if (!guestData.roomNumber) {
        console.error("❌ Missing roomNumber. RoomInfo:", roomInfo, "GuestInfo:", guestInfo);
        return res.status(400).json({
          success: false,
          message: "Room number is required for ticket creation",
        });
      }
    } else if (guestId && roomNumber) {
      // Fetch guest details from database
      const guest = await Guest.findById(guestId);
      if (!guest) {
        return res.status(404).json({
          success: false,
          message: "Guest not found",
        });
      }

      guestData = {
        _id: guestId,
        guestName: guest.name,
        roomNumber: roomNumber,
        email: guest.email,
        phone: guest.phone,
      };
    } else {
      return res.status(400).json({
        success: false,
        message: "Message and guest info are required",
      });
    }

    console.log(
      `💬 Chat request from ${guestData.guestName} in room ${guestData.roomNumber}`
    );
    console.log(`Message: "${message}"`);
    console.log("🔍 Final guestData structure:", JSON.stringify(guestData, null, 2));

    try {
      // Prepare the correct payload for the hotel classifier API
      const classifierPayload = {
        guest_message: message,
        room_number: guestData.roomNumber,
      };

      console.log(
        "🚀 Sending to classifier API:",
        JSON.stringify(classifierPayload, null, 2)
      );

      // Call the hotel classifier API - NO FALLBACK, only use external API
      const classifierResponse = await axios.post(
        "https://hotel-classifier-api.onrender.com/classify",
        classifierPayload,
        {
          headers: {
            "Content-Type": "application/json",
          },
          timeout: 15000, // 15 second timeout
        }
      );

      console.log(
        "✅ Classifier API response:",
        JSON.stringify(classifierResponse.data, null, 2)
      );

      const {
        should_create_ticket,
        categories,
        reply,
        confidence,
        reasoning,
        suggested_priority,
        estimated_completion_time,
      } = classifierResponse.data;

      // Send response to guest with the AI reply
      res.json({
        success: true,
        response: reply,
        shouldCreateTicket: should_create_ticket,
        categories,
        confidence,
        reasoning,
        estimatedCompletionTime: estimated_completion_time,
        timestamp: new Date(),
        conversationId: `${guestData.roomNumber}-${Date.now()}`,
      });

      // Create tickets ONLY if the external API determined they should be created
      if (should_create_ticket && categories && categories.length > 0) {
        console.log(
          `🎫 Creating ${categories.length} tickets for room ${guestData.roomNumber}`
        );
        console.log("🎫 Ticket creation - Tenant models available:", {
          hasTenantModels: !!req.tenantModels,
          tenantModelsKeys: req.tenantModels ? Object.keys(req.tenantModels) : null,
          subdomain: req.subdomain,
          hotel: req.hotel ? req.hotel.name : null
        });

        setTimeout(async () => {
          await createTicketsFromCategories(
            categories,
            guestData,
            message,
            req
          );
        }, 100);
      }
    } catch (apiError) {
      console.error("❌ Hotel classifier API error:", apiError.message);

      // NO FALLBACK - Return error if external API fails
      res.status(503).json({
        success: false,
        message:
          "Chat service is temporarily unavailable. Please try again later or contact the front desk directly.",
        error: "External AI service unavailable",
      });
    }
  } catch (error) {
    console.error("Chat AI error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to process chat message",
    });
  }
};

// Helper function to create tickets from categories
const createTicketsFromCategories = async (
  categories,
  guestInfo,
  originalMessage,
  req
) => {
  try {
    // Use tenant models - must exist for tenant domains
    if (!req.tenantModels || !req.tenantModels.Room) {
      console.error("Tenant Room model not available:", req.tenantModels);
      return;
    }
    const Room = req.tenantModels.Room;
    
    if (!req.tenantModels || !req.tenantModels.Ticket) {
      console.error("Tenant Ticket model not available:", req.tenantModels);
      return;
    }
    const Ticket = req.tenantModels.Ticket;

    const room = await Room.findOne({ number: guestInfo.roomNumber });

    if (!room) {
      console.error(`Room ${guestInfo.roomNumber} not found for ticket creation`);
      return;
    }

    console.log(`Creating ${categories.length} tickets for room ${guestInfo.roomNumber}`);

    for (const category of categories) {
      const ticketData = {
        room: room._id,
        roomNumber: guestInfo.roomNumber,
        guestInfo: {
          name: guestInfo.guestName,
          email: guestInfo.email || "not-provided@example.com",
          phone: guestInfo.phone || "",
        },
        status: "raised",
        priority: category.urgency || "medium",
        category: category.category || "general",
        subject: category.message || "Service Request",
        messages: [
          {
            content: `🏨 Original Guest Message: "${originalMessage}"\n\n📋 Categorized Request: ${category.message}`,
            sender: "system",
            senderName: "Auto-Generated",
          },
        ],
      };

      console.log(`Creating ticket with data:`, JSON.stringify(ticketData, null, 2));
      
      const ticket = await Ticket.create(ticketData);
      
      // Populate room details for response
      await ticket.populate("room", "number type floor");
      
      console.log(`✅ Ticket created successfully:`, ticket._id);

      // Emit real-time notification to managers
      if (req && req.app && req.app.get("io")) {
        const io = req.app.get("io");
        // Emit to managers room specifically
        io.to("managers").emit("newTicket", {
          ticket,
          message: `New ticket raised by ${guestInfo.guestName} in Room ${guestInfo.roomNumber}`,
          timestamp: new Date(),
        });
        
        console.log(`📨 New ticket notification sent to managers for Room ${guestInfo.roomNumber}`);
      }
    }

    console.log(
      `✅ Successfully created ${categories.length} tickets for room ${guestInfo.roomNumber}`
    );
  } catch (error) {
    console.error("❌ Error creating tickets from categories:", error);
    console.error("Error details:", error.message);
    console.error("Stack trace:", error.stack);
  }
};

// @desc    Create ticket from guest chat
// @route   POST /api/tickets/guest
// @access  Public
exports.createGuestTicket = async (req, res) => {
  try {
    const {
      roomNumber,
      guestInfo,
      initialMessage,
      priority = "medium",
      conversationHistory = [],
    } = req.body;

    // Use tenant models - must exist for tenant domains
    if (!req.tenantModels || !req.tenantModels.Room) {
      console.error("Tenant Room model not available:", req.tenantModels);
      return res.status(500).json({
        success: false,
        error: "Tenant database not properly initialized",
      });
    }
    const Room = req.tenantModels.Room;
    
    if (!req.tenantModels || !req.tenantModels.Ticket) {
      console.error("Tenant Ticket model not available:", req.tenantModels);
      return res.status(500).json({
        success: false,
        error: "Tenant database not properly initialized",
      });
    }
    const Ticket = req.tenantModels.Ticket;

    if (!roomNumber || !guestInfo || !initialMessage) {
      return res.status(400).json({
        success: false,
        message: "Room number, guest info, and initial message are required",
      });
    }

    // Find the room to get the manager
    const room = await Room.findOne({ number: roomNumber });
    if (!room) {
      return res.status(404).json({
        success: false,
        message: "Room not found",
      });
    }

    // Create the ticket
    const ticketData = {
      room: room._id,
      roomNumber,
      guestInfo: {
        name: guestInfo.name,
        email: guestInfo.email || "not-provided@example.com",
        phone: guestInfo.phone || "",
      },
      status: "raised",
      priority,
      category: "general",
      subject: `Guest inquiry - ${guestInfo.name}`,
      messages: [
        {
          content: initialMessage,
          sender: "guest",
          senderName: guestInfo.name,
        },
        ...conversationHistory.map((msg, index) => ({
          content: msg.content,
          sender: msg.role === "user" ? "guest" : "staff",
          senderName: msg.role === "user" ? guestInfo.name : "AI Assistant",
        })),
      ],
    };

    const ticket = await Ticket.create(ticketData);
    
    // Populate room details for response
    await ticket.populate("room", "number type floor");

    // Emit real-time notification to managers
    if (req.app && req.app.get("io")) {
      const io = req.app.get("io");
      // Emit to managers room specifically
      io.to("managers").emit("newTicket", {
        ticket,
        message: `New ticket raised by ${guestInfo.name} in Room ${roomNumber}`,
        timestamp: new Date(),
      });
    }

    res.status(201).json({
      success: true,
      data: ticket,
      message: "Ticket created successfully",
    });
  } catch (error) {
    console.error("Create guest ticket error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create ticket",
    });
  }
};

// @desc    Manager AI Assistant - REMOVED
// No AI functionality in backend - only external API
