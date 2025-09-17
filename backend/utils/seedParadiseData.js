const mongoose = require('mongoose');
const dotenv = require('dotenv');
const databaseManager = require('../utils/databaseManager');

// Load environment variables
dotenv.config();

const seedParadiseData = async () => {
  try {
    console.log('🌱 Starting Paradise Resort & Spa tenant database seeding...');
    
    // Initialize main database connection
    await databaseManager.initMainConnection();
    console.log('✅ Database manager initialized');
    
    // Get tenant connection for paradise
    const tenantConnection = await databaseManager.getTenantConnection('paradise');
    const tenantModels = databaseManager.getTenantModels(tenantConnection);
    
    console.log('✅ Connected to paradise tenant database');
    
    // Clear existing data
    await Promise.all([
      tenantModels.Room.deleteMany({}),
      tenantModels.Guest.deleteMany({}),
      tenantModels.Booking.deleteMany({}),
      tenantModels.Ticket.deleteMany({}),
      tenantModels.Food.deleteMany({}),
      tenantModels.Order.deleteMany({}),
      tenantModels.Bill.deleteMany({}),
      tenantModels.User.deleteMany({})
    ]);
    console.log('🗑️  Cleared existing tenant data');
    
    // Create Paradise Resort rooms
    const rooms = [
      // Ocean View Suites (Floor 10-12)
      {
        number: "1001",
        type: "Ocean View Suite",
        floor: 10,
        capacity: 2,
        maxGuests: 4,
        price: 650,
        amenities: ["Ocean View", "King Bed", "Private Balcony", "Mini Bar", "Jacuzzi", "WiFi"],
        status: "available",
        isActive: true,
        description: "Luxurious suite with panoramic ocean views and private balcony"
      },
      {
        number: "1002",
        type: "Ocean View Suite",
        floor: 10,
        capacity: 2,
        maxGuests: 4,
        price: 650,
        amenities: ["Ocean View", "King Bed", "Private Balcony", "Mini Bar", "Jacuzzi", "WiFi"],
        status: "occupied",
        isActive: true,
        description: "Luxurious suite with panoramic ocean views and private balcony"
      },
      {
        number: "1101",
        type: "Presidential Suite",
        floor: 11,
        capacity: 4,
        maxGuests: 6,
        price: 1200,
        amenities: ["Ocean View", "2 Bedrooms", "Living Room", "Kitchen", "2 Bathrooms", "Private Terrace", "Butler Service", "WiFi"],
        status: "available",
        isActive: true,
        description: "The ultimate luxury experience with butler service and private terrace"
      },
      {
        number: "1201",
        type: "Penthouse",
        floor: 12,
        capacity: 6,
        maxGuests: 8,
        price: 2000,
        amenities: ["360° Ocean View", "3 Bedrooms", "Full Kitchen", "Private Pool", "Hot Tub", "Rooftop Deck", "WiFi"],
        status: "maintenance",
        isActive: true,
        description: "Exclusive penthouse with private pool and rooftop deck"
      },
      // Deluxe Rooms (Floor 5-9)
      {
        number: "501",
        type: "Deluxe Room",
        floor: 5,
        capacity: 2,
        maxGuests: 3,
        price: 350,
        amenities: ["Garden View", "Queen Bed", "Balcony", "Mini Fridge", "WiFi"],
        status: "available",
        isActive: true,
        description: "Comfortable room with garden views and modern amenities"
      },
      {
        number: "502",
        type: "Deluxe Room",
        floor: 5,
        capacity: 2,
        maxGuests: 3,
        price: 350,
        amenities: ["Garden View", "Queen Bed", "Balcony", "Mini Fridge", "WiFi"],
        status: "occupied",
        isActive: true,
        description: "Comfortable room with garden views and modern amenities"
      },
      {
        number: "601",
        type: "Family Suite",
        floor: 6,
        capacity: 4,
        maxGuests: 6,
        price: 500,
        amenities: ["2 Bedrooms", "Kitchenette", "Living Area", "2 Bathrooms", "Pool View", "WiFi"],
        status: "available",
        isActive: true,
        description: "Perfect for families with separate bedrooms and living area"
      },
      {
        number: "701",
        type: "Spa Suite",
        floor: 7,
        capacity: 2,
        maxGuests: 4,
        price: 800,
        amenities: ["Spa Access", "In-room Massage Table", "Steam Shower", "Ocean View", "Aromatherapy", "WiFi"],
        status: "available",
        isActive: true,
        description: "Wellness-focused suite with exclusive spa amenities"
      }
    ];
    
    const createdRooms = await tenantModels.Room.insertMany(rooms);
    console.log(`🏨 Created ${createdRooms.length} rooms`);
    
    // Create sample guests
    const guests = [
      {
        name: "Emily Johnson",
        email: "emily.johnson@email.com",
        phone: "+15551234567",
        idType: "passport",
        idNumber: "US123456789",
        room: createdRooms.find(r => r.number === "1002")._id,
        roomNumber: "1002",
        checkInDate: new Date('2025-09-15'),
        checkOutDate: new Date('2025-09-20'),
        numberOfGuests: 2,
        status: "checked_in",
        specialRequests: "Late checkout if possible, celebrating anniversary",
        address: {
          line1: "123 Main Street",
          city: "Boston",
          state: "MA",
          country: "USA",
          postalCode: "02101"
        },
        emergencyContact: {
          name: "Michael Johnson",
          phone: "+15551234568",
          relationship: "Spouse"
        }
      },
      {
        name: "Carlos Rodriguez",
        email: "carlos.rodriguez@business.com",
        phone: "+15559876543",
        idType: "driver_license",
        idNumber: "FL987654321",
        room: createdRooms.find(r => r.number === "502")._id,
        roomNumber: "502",
        checkInDate: new Date('2025-09-16'),
        checkOutDate: new Date('2025-09-18'),
        numberOfGuests: 1,
        status: "checked_in",
        specialRequests: "Business center access needed",
        address: {
          line1: "456 Business Blvd",
          city: "Orlando",
          state: "FL",
          country: "USA",
          postalCode: "32801"
        },
        emergencyContact: {
          name: "Maria Rodriguez",
          phone: "+15559876544",
          relationship: "Sister"
        }
      }
    ];
    
    const createdGuests = await tenantModels.Guest.insertMany(guests);
    console.log(`👥 Created ${createdGuests.length} guests`);
    
    // Update room statuses for occupied rooms
    await tenantModels.Room.findByIdAndUpdate(
      createdRooms.find(r => r.number === "1002")._id,
      { 
        status: "occupied", 
        currentGuest: createdGuests.find(g => g.roomNumber === "1002")._id 
      }
    );
    await tenantModels.Room.findByIdAndUpdate(
      createdRooms.find(r => r.number === "502")._id,
      { 
        status: "occupied", 
        currentGuest: createdGuests.find(g => g.roomNumber === "502")._id 
      }
    );
    
    // Create Paradise Resort food menu
    const foodItems = [
      // Breakfast
      {
        name: "Paradise Breakfast Platter",
        category: "Breakfast",
        price: 28,
        description: "Fresh tropical fruits, organic eggs, artisanal pastries, and premium coffee",
        preparationTime: 15,
        isAvailable: true,
        isVegetarian: true,
        dietaryInfo: ["Vegetarian", "Organic"],
        spiceLevel: "mild",
        ingredients: ["tropical fruits", "organic eggs", "croissants", "jam", "coffee"],
        allergens: ["eggs", "dairy", "gluten"]
      },
      {
        name: "Açaí Power Bowl",
        category: "Breakfast",
        price: 22,
        description: "Organic açaí bowl with granola, fresh berries, and coconut",
        preparationTime: 10,
        isAvailable: true,
        isVegetarian: true,
        isVegan: true,
        dietaryInfo: ["Vegan", "Organic", "Gluten-Free"],
        spiceLevel: "mild",
        ingredients: ["açaí", "granola", "berries", "coconut", "honey"],
        allergens: ["nuts"]
      },
      // Lunch
      {
        name: "Grilled Mahi-Mahi",
        category: "Main Course",
        price: 42,
        description: "Fresh local mahi-mahi grilled to perfection with coconut rice and grilled vegetables",
        preparationTime: 25,
        isAvailable: true,
        isVegetarian: false,
        dietaryInfo: ["Fresh Local Fish", "Gluten-Free"],
        spiceLevel: "medium",
        ingredients: ["mahi-mahi", "coconut rice", "seasonal vegetables", "herbs"],
        allergens: ["fish"]
      },
      {
        name: "Tropical Chicken Salad",
        category: "Salads",
        price: 32,
        description: "Grilled chicken breast with mixed greens, mango, avocado, and passion fruit dressing",
        preparationTime: 15,
        isAvailable: true,
        isVegetarian: false,
        dietaryInfo: ["Protein Rich", "Fresh"],
        spiceLevel: "mild",
        ingredients: ["chicken breast", "mixed greens", "mango", "avocado", "passion fruit"],
        allergens: []
      },
      // Dinner
      {
        name: "Lobster Thermidor",
        category: "Main Course",
        price: 85,
        description: "Classic lobster thermidor with cognac cream sauce and herb crust",
        preparationTime: 35,
        isAvailable: true,
        isVegetarian: false,
        dietaryInfo: ["Premium Seafood"],
        spiceLevel: "mild",
        ingredients: ["lobster", "cognac", "cream", "herbs", "cheese"],
        allergens: ["shellfish", "dairy"]
      },
      {
        name: "Vegetarian Paradise Curry",
        category: "Main Course",
        price: 35,
        description: "Aromatic coconut curry with seasonal vegetables and jasmine rice",
        preparationTime: 20,
        isAvailable: true,
        isVegetarian: true,
        isVegan: true,
        dietaryInfo: ["Vegan", "Spicy"],
        spiceLevel: "hot",
        ingredients: ["coconut milk", "vegetables", "curry spices", "jasmine rice"],
        allergens: []
      },
      // Beverages
      {
        name: "Paradise Sunset Cocktail",
        category: "Beverages",
        price: 18,
        description: "Signature tropical cocktail with rum, passion fruit, and coconut",
        preparationTime: 5,
        isAvailable: true,
        isVegetarian: true,
        dietaryInfo: ["Alcoholic", "Tropical"],
        spiceLevel: "mild",
        ingredients: ["rum", "passion fruit", "coconut cream", "pineapple"],
        allergens: []
      },
      {
        name: "Fresh Coconut Water",
        category: "Beverages",
        price: 12,
        description: "Fresh coconut water straight from the coconut",
        preparationTime: 3,
        isAvailable: true,
        isVegetarian: true,
        isVegan: true,
        dietaryInfo: ["Natural", "Hydrating"],
        spiceLevel: "mild",
        ingredients: ["fresh coconut"],
        allergens: []
      },
      // Desserts
      {
        name: "Tropical Cheesecake",
        category: "Desserts",
        price: 16,
        description: "Creamy cheesecake with mango coulis and toasted coconut",
        preparationTime: 8,
        isAvailable: true,
        isVegetarian: true,
        dietaryInfo: ["Rich", "Tropical"],
        spiceLevel: "mild",
        ingredients: ["cream cheese", "mango", "coconut", "graham crackers"],
        allergens: ["dairy", "eggs", "gluten"]
      }
    ];
    
    const createdFoodItems = await tenantModels.Food.insertMany(foodItems);
    console.log(`🍽️  Created ${createdFoodItems.length} food items`);
    
    // Create sample tickets
    const tickets = [
      {
        title: "Pool Towel Request",
        description: "Need additional pool towels for room 1002",
        guest: createdGuests.find(g => g.roomNumber === "1002")._id,
        guestName: "Emily Johnson",
        room: createdRooms.find(r => r.number === "1002")._id,
        roomNumber: "1002",
        priority: "low",
        category: "amenities",
        status: "open",
        contactMethod: "room_phone",
        preferredResponseTime: "within_1_hour"
      },
      {
        title: "Business Center Access",
        description: "Need access to business center and printing services",
        guest: createdGuests.find(g => g.roomNumber === "502")._id,
        guestName: "Carlos Rodriguez",
        room: createdRooms.find(r => r.number === "502")._id,
        roomNumber: "502",
        priority: "medium",
        category: "business_services",
        status: "in_progress",
        contactMethod: "email",
        preferredResponseTime: "within_30_min",
        assignedTo: "Front Desk"
      }
    ];
    
    const createdTickets = await tenantModels.Ticket.insertMany(tickets);
    console.log(`🎫 Created ${createdTickets.length} service tickets`);
    
    console.log('\n✅ Paradise Resort & Spa tenant database seeded successfully!');
    console.log('\n📊 Summary:');
    console.log(`   🏨 Rooms: ${createdRooms.length} (including luxury suites and penthouse)`);
    console.log(`   👥 Guests: ${createdGuests.length} (currently checked in)`);
    console.log(`   🍽️  Food Items: ${createdFoodItems.length} (tropical cuisine)`);
    console.log(`   🎫 Service Tickets: ${createdTickets.length}`);
    console.log('\n🌴 Paradise Resort & Spa is ready for luxury hospitality!');
    
  } catch (error) {
    console.error('❌ Paradise seeding error:', error);
    process.exit(1);
  } finally {
    await databaseManager.closeAllConnections();
    console.log('🔌 Disconnected from databases');
    process.exit(0);
  }
};

seedParadiseData();