const mongoose = require("mongoose");
const MainHotel = require("../models/MainHotel");
require("dotenv").config();

// Fresh hotel data for Paradise and Marvel
const freshHotels = [
  {
    name: "Paradise Resort & Spa",
    subdomain: "paradise",
    website: "https://www.paradiseresort.com",
    description: "A luxurious tropical paradise with world-class amenities and breathtaking ocean views. Experience the ultimate in relaxation and sophistication.",
    logo_url: "https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=200&h=200&fit=crop&crop=center",
    cover_image_url: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1200&h=600&fit=crop",
    phone: "+15557272343",
    email: "info@paradiseresort.com",
    address_line1: "100 Tropical Paradise Drive",
    address_line2: "Oceanfront District",
    city: "Miami Beach",
    state: "Florida",
    country: "United States",
    postal_code: "33139",
    latitude: 25.7617,
    longitude: -80.1918,
    timezone: "America/New_York",
    currency: "USD",
    check_in_time: "15:00",
    check_out_time: "12:00",
    stars_rating: 5,
    amenities: [
      "Infinity Pool",
      "Private Beach",
      "Full-Service Spa",
      "Fine Dining Restaurant",
      "Rooftop Bar",
      "Fitness Center",
      "WiFi",
      "Concierge Service",
      "Valet Parking",
      "Room Service",
      "Business Center",
      "Water Sports"
    ],
    policy: new Map([
      ["cancellation", "Free cancellation up to 48 hours before check-in"],
      ["pets", "Pet-friendly with $50 per night fee"],
      ["smoking", "Non-smoking property - designated outdoor areas only"],
      ["children", "Children welcome - cribs available upon request"],
      ["payment", "All major credit cards accepted"],
      ["wifi", "Complimentary high-speed WiFi throughout property"]
    ]),
    status: "Active",
  },
  {
    name: "Marvel Business Hotel",
    subdomain: "marvel",
    website: "https://www.marvelbusinesshotel.com",
    description: "A modern business hotel designed for the discerning traveler. Located in the heart of the financial district with cutting-edge technology and premium services.",
    logo_url: "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=200&h=200&fit=crop&crop=center",
    cover_image_url: "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=1200&h=600&fit=crop",
    phone: "+15556278351",
    email: "reservations@marvelbusinesshotel.com",
    address_line1: "500 Corporate Plaza",
    address_line2: "Financial District",
    city: "New York",
    state: "New York",
    country: "United States",
    postal_code: "10004",
    latitude: 40.7074,
    longitude: -74.0113,
    timezone: "America/New_York",
    currency: "USD",
    check_in_time: "14:00",
    check_out_time: "11:00",
    stars_rating: 4,
    amenities: [
      "Business Center",
      "Executive Lounge",
      "High-Speed WiFi",
      "Conference Rooms",
      "Fitness Center",
      "Restaurant",
      "Bar & Lounge",
      "Room Service",
      "Laundry Service",
      "Airport Shuttle",
      "Concierge",
      "Parking Garage"
    ],
    policy: new Map([
      ["cancellation", "Free cancellation up to 24 hours before check-in"],
      ["pets", "Service animals only"],
      ["smoking", "Completely smoke-free hotel"],
      ["children", "Children welcome - connecting rooms available"],
      ["payment", "Corporate accounts and all major credit cards accepted"],
      ["wifi", "Premium WiFi included for all guests"]
    ]),
    status: "Active",
  },
  {
    name: "Demo Luxury Hotel & Resort",
    subdomain: "demo",
    website: "https://www.demoluxuryhotel.com",
    description: "A showcase hotel demonstrating the full potential of modern hospitality management. Perfect for presentations and demonstrations with complete features and elegant design.",
    logo_url: "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=200&h=200&fit=crop&crop=center",
    cover_image_url: "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=1200&h=600&fit=crop",
    phone: "+15554336677",
    email: "demo@demoluxuryhotel.com",
    address_line1: "888 Demo Boulevard",
    address_line2: "Luxury District",
    city: "Las Vegas",
    state: "Nevada",
    country: "United States",
    postal_code: "89101",
    latitude: 36.1699,
    longitude: -115.1398,
    timezone: "America/Los_Angeles",
    currency: "USD",
    check_in_time: "15:00",
    check_out_time: "11:00",
    stars_rating: 5,
    amenities: [
      "Casino",
      "Multiple Restaurants", 
      "Luxury Spa",
      "Pool Complex",
      "Entertainment Venues",
      "Conference Centers",
      "Valet Service",
      "High-Speed WiFi",
      "Room Service",
      "Fitness Center",
      "Shopping Mall",
      "Golf Course"
    ],
    policy: new Map([
      ["cancellation", "Free cancellation up to 72 hours before check-in"],
      ["pets", "Pet-friendly suites available with advance booking"],
      ["smoking", "Designated smoking areas and rooms available"],
      ["children", "Family-friendly with kids club and activities"],
      ["payment", "All major credit cards, digital payments, and crypto accepted"],
      ["wifi", "Premium WiFi and business center access included"]
    ]),
    status: "Active",
  },
];

const seedFreshHotels = async () => {
  try {
    console.log("🌱 Starting fresh hotel database seeding...");
    console.log("🏨 Creating Paradise Resort & Spa and Marvel Business Hotel");

    // Connect to main database
    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 60000,
    });
    console.log("✅ Connected to main database");

    // Clear existing hotels
    await MainHotel.deleteMany({});
    console.log("🗑️  Cleared existing hotels from main database");

    // Create fresh hotels
    const createdHotels = [];
    for (const hotelData of freshHotels) {
      const hotel = await MainHotel.create(hotelData);
      createdHotels.push(hotel);
      console.log(`✅ Created hotel: ${hotel.name} (${hotel.subdomain})`);
    }

    console.log("\n🎉 Fresh hotel seeding completed successfully!");
    console.log("\n🏨 Available Hotels:");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    
    createdHotels.forEach(hotel => {
      console.log(`\n📍 ${hotel.name}`);
      console.log(`   🌐 Subdomain: ${hotel.subdomain}`);
      console.log(`   🏢 Location: ${hotel.city}, ${hotel.state}`);
      console.log(`   ⭐ Rating: ${hotel.stars_rating} stars`);
      console.log(`   🌍 Production: https://${hotel.subdomain}.innexora.app`);
      console.log(`   🖥️  Local: http://${hotel.subdomain}.localhost:3000`);
    });

    console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("🔗 Ready for tenant data seeding!");

  } catch (error) {
    console.error("❌ Fresh hotel seeding error:", error);
    process.exit(1);
  } finally {
    // Disconnect from database
    await mongoose.disconnect();
    console.log("🔌 Disconnected from database");
    process.exit(0);
  }
};

seedFreshHotels();