const mongoose = require("mongoose");
const databaseManager = require("../utils/databaseManager");
const AutomaticBillingService = require("../services/automaticBillingService");

// Load environment variables
require('dotenv').config();

// Connect to the main database using database manager
async function connectToDatabase() {
  try {
    await databaseManager.initMainConnection();
    console.log("✅ Connected to main database");
  } catch (error) {
    console.error("❌ Database connection failed:", error.message);
    process.exit(1);
  }
}

// Test cases with real data
const testCases = [
  {
    name: "Case 1: Normal Stay (2 PM check-in, 11 AM check-out)",
    guest: {
      checkInDate: new Date("2024-09-20T14:00:00Z"), // 2 PM
      checkOutDate: new Date("2024-09-21T11:00:00Z"), // 11 AM
    },
    room: { price: 5000 },
    hotelSubdomain: "demo",
    expected: 5000,
  },
  {
    name: "Case 2: Early Check-in (10 AM) - Should apply half rate",
    guest: {
      checkInDate: new Date("2024-09-20T10:00:00Z"), // 10 AM
      checkOutDate: new Date("2024-09-21T11:00:00Z"), // 11 AM
    },
    room: { price: 5000 },
    hotelSubdomain: "demo",
    expected: 7500, // 5000 (base) + 2500 (early check-in half rate)
  },
  {
    name: "Case 3: Very Early Check-in (5 AM) - Should apply full rate",
    guest: {
      checkInDate: new Date("2024-09-20T05:00:00Z"), // 5 AM
      checkOutDate: new Date("2024-09-21T11:00:00Z"), // 11 AM
    },
    room: { price: 5000 },
    hotelSubdomain: "demo",
    expected: 10000, // 5000 (base) + 5000 (early check-in full rate)
  },
  {
    name: "Case 4: Late Check-out (4 PM) - Should apply half rate",
    guest: {
      checkInDate: new Date("2024-09-20T14:00:00Z"), // 2 PM
      checkOutDate: new Date("2024-09-21T16:00:00Z"), // 4 PM
    },
    room: { price: 5000 },
    hotelSubdomain: "demo",
    expected: 7500, // 5000 (base) + 2500 (late check-out half rate)
  },
  {
    name: "Case 5: Late Check-out (9 PM) - Should apply full rate",
    guest: {
      checkInDate: new Date("2024-09-20T14:00:00Z"), // 2 PM
      checkOutDate: new Date("2024-09-21T21:00:00Z"), // 9 PM
    },
    room: { price: 5000 },
    hotelSubdomain: "demo",
    expected: 10000, // 5000 (base) + 5000 (late check-out full rate)
  },
];

async function runRealBillingTests() {
  console.log("🧪 Running Real Database Billing Tests\n");
  console.log("=".repeat(60));

  await connectToDatabase();

  let passedTests = 0;
  let totalTests = testCases.length;

  for (const testCase of testCases) {
    try {
      console.log(`\n🔍 Testing: ${testCase.name}`);
      
      // Calculate billing using the service
      const result = await AutomaticBillingService.calculateAutomaticBilling(
        testCase.guest,
        testCase.room,
        testCase.hotelSubdomain
      );

      console.log(`   Hotel Policies:`);
      console.log(`     Standard Check-in: ${result.policies.standard_checkin_time}:00`);
      console.log(`     Standard Check-out: ${result.policies.standard_checkout_time}:00`);
      console.log(`     Early Check-in Policy: ${result.policies.early_checkin_policy}`);
      console.log(`     Late Check-out Policy: ${result.policies.late_checkout_policy}`);
      
      console.log(`   Billing Breakdown:`);
      console.log(`     Base Nights: ${result.breakdown.baseNights}`);
      console.log(`     Base Amount: ₹${result.breakdown.baseAmount}`);
      console.log(`     Early Check-in: ₹${result.breakdown.earlyCheckinAmount}`);
      console.log(`     Late Check-out: ₹${result.breakdown.lateCheckoutAmount}`);
      console.log(`     Total Amount: ₹${result.breakdown.totalAmount}`);
      
      const actual = result.totalCharges;
      const expected = testCase.expected;
      const passed = Math.abs(actual - expected) < 0.01;
      
      const status = passed ? "✅ PASS" : "❌ FAIL";
      console.log(`   ${status} - Expected: ₹${expected}, Actual: ₹${actual}`);
      
      if (passed) {
        passedTests++;
      }
      
    } catch (error) {
      console.log(`   ❌ FAIL - Error: ${error.message}`);
    }
  }

  console.log("\n" + "=".repeat(60));
  console.log(`📊 Test Results: ${passedTests}/${totalTests} tests passed`);
  
  if (passedTests === totalTests) {
    console.log("🎉 All tests passed! Automatic billing is working correctly.");
  } else {
    console.log("⚠️  Some tests failed. Please check the implementation.");
  }

  await databaseManager.closeAllConnections();
  console.log("✅ Disconnected from database");

  return { passedTests, totalTests };
}

// Run tests if this file is executed directly
if (require.main === module) {
  runRealBillingTests()
    .then((results) => {
      process.exit(results.passedTests === results.totalTests ? 0 : 1);
    })
    .catch((error) => {
      console.error("Test execution failed:", error);
      process.exit(1);
    });
}

module.exports = { runRealBillingTests, testCases };
