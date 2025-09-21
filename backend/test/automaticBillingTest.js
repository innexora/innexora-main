// Mock the database connection before requiring the service
const mongoose = require("mongoose");

// Mock MainHotel model before requiring the service
const mockMainHotel = {
  findOne: async (query) => {
    const subdomain = query.subdomain;
    const hotel = mockHotels[subdomain];
    if (!hotel) {
      throw new Error(`Hotel with subdomain ${subdomain} not found`);
    }
    return hotel;
  },
};

// Mock hotels data
const mockHotels = {
  demo: {
    subdomain: "demo",
    standard_checkin_time: 14,
    standard_checkout_time: 12,
    early_checkin_policy: "half_rate",
    late_checkout_policy: "half_rate",
  },
  "demo-free-early": {
    subdomain: "demo-free-early",
    standard_checkin_time: 14,
    standard_checkout_time: 12,
    early_checkin_policy: "free",
    late_checkout_policy: "half_rate",
  },
  "demo-free-late": {
    subdomain: "demo-free-late",
    standard_checkin_time: 14,
    standard_checkout_time: 12,
    early_checkin_policy: "half_rate",
    late_checkout_policy: "free",
  },
  "demo-full-early": {
    subdomain: "demo-full-early",
    standard_checkin_time: 14,
    standard_checkout_time: 12,
    early_checkin_policy: "full_rate",
    late_checkout_policy: "half_rate",
  },
};

// Mock the MainHotel module
const Module = require('module');
const originalRequire = Module.prototype.require;
Module.prototype.require = function(id) {
  if (id === '../models/MainHotel') {
    return { default: mockMainHotel, ...mockMainHotel };
  }
  return originalRequire.apply(this, arguments);
};

const AutomaticBillingService = require("../services/automaticBillingService");

// Test cases based on the requirements
const testCases = [
  {
    name: "Case 1: Normal Stay",
    guest: {
      checkInDate: new Date("2024-09-20T14:00:00Z"), // 2 PM
      checkOutDate: new Date("2024-09-21T11:00:00Z"), // 11 AM
    },
    room: { price: 5000 },
    hotelSubdomain: "demo",
    expected: 5000,
  },
  {
    name: "Case 2: Early Check-in (10 AM) - Half Rate",
    guest: {
      checkInDate: new Date("2024-09-20T10:00:00Z"), // 10 AM
      checkOutDate: new Date("2024-09-21T11:00:00Z"), // 11 AM
    },
    room: { price: 5000 },
    hotelSubdomain: "demo",
    expected: 7500, // 5000 (base) + 2500 (early check-in half rate)
  },
  {
    name: "Case 3: Very Early Check-in (5 AM) - Full Rate",
    guest: {
      checkInDate: new Date("2024-09-20T05:00:00Z"), // 5 AM
      checkOutDate: new Date("2024-09-21T11:00:00Z"), // 11 AM
    },
    room: { price: 5000 },
    hotelSubdomain: "demo",
    expected: 10000, // 5000 (base) + 5000 (early check-in full rate)
  },
  {
    name: "Case 4: Late Check-out (4 PM) - Half Rate",
    guest: {
      checkInDate: new Date("2024-09-20T14:00:00Z"), // 2 PM
      checkOutDate: new Date("2024-09-21T16:00:00Z"), // 4 PM
    },
    room: { price: 5000 },
    hotelSubdomain: "demo",
    expected: 7500, // 5000 (base) + 2500 (late check-out half rate)
  },
  {
    name: "Case 5: Late Check-out (9 PM) - Full Rate",
    guest: {
      checkInDate: new Date("2024-09-20T14:00:00Z"), // 2 PM
      checkOutDate: new Date("2024-09-21T21:00:00Z"), // 9 PM
    },
    room: { price: 5000 },
    hotelSubdomain: "demo",
    expected: 10000, // 5000 (base) + 5000 (late check-out full rate)
  },
  {
    name: "Case 6: Multiple Nights + Late Checkout",
    guest: {
      checkInDate: new Date("2024-09-20T14:00:00Z"), // 2 PM
      checkOutDate: new Date("2024-09-22T18:00:00Z"), // 6 PM
    },
    room: { price: 5000 },
    hotelSubdomain: "demo",
    expected: 12500, // 10000 (2 nights) + 2500 (late check-out half rate)
  },
  {
    name: "Case 7: Multiple Nights + Very Early Check-in",
    guest: {
      checkInDate: new Date("2024-09-20T05:00:00Z"), // 5 AM
      checkOutDate: new Date("2024-09-22T11:00:00Z"), // 11 AM
    },
    room: { price: 5000 },
    hotelSubdomain: "demo",
    expected: 15000, // 10000 (2 nights) + 5000 (early check-in full rate)
  },
  {
    name: "Case 8: Free Early Check-in Policy",
    guest: {
      checkInDate: new Date("2024-09-20T10:00:00Z"), // 10 AM
      checkOutDate: new Date("2024-09-21T11:00:00Z"), // 11 AM
    },
    room: { price: 5000 },
    hotelSubdomain: "demo-free-early",
    expected: 5000, // 5000 (base) + 0 (free early check-in)
  },
  {
    name: "Case 9: Free Late Check-out Policy",
    guest: {
      checkInDate: new Date("2024-09-20T14:00:00Z"), // 2 PM
      checkOutDate: new Date("2024-09-21T16:00:00Z"), // 4 PM
    },
    room: { price: 5000 },
    hotelSubdomain: "demo-free-late",
    expected: 5000, // 5000 (base) + 0 (free late check-out)
  },
  {
    name: "Case 10: Full Rate Early Check-in Policy",
    guest: {
      checkInDate: new Date("2024-09-20T10:00:00Z"), // 10 AM
      checkOutDate: new Date("2024-09-21T11:00:00Z"), // 11 AM
    },
    room: { price: 5000 },
    hotelSubdomain: "demo-full-early",
    expected: 10000, // 5000 (base) + 5000 (full rate early check-in)
  },
];


async function runBillingTests() {
  console.log("🧪 Running Automatic Billing Tests\n");
  console.log("=".repeat(60));

  let passedTests = 0;
  let totalTests = testCases.length;

  for (const testCase of testCases) {
    try {
      const result = await AutomaticBillingService.validateBillingTestCase(
        testCase,
        testCase.hotelSubdomain
      );

      const status = result.passed ? "✅ PASS" : "❌ FAIL";
      console.log(`${status} ${result.testCase}`);
      console.log(`   Expected: ₹${result.expected}`);
      console.log(`   Actual: ₹${result.actual}`);
      
      if (result.breakdown) {
        console.log(`   Breakdown:`);
        console.log(`     Base Nights: ${result.breakdown.baseNights}`);
        console.log(`     Base Amount: ₹${result.breakdown.baseAmount}`);
        console.log(`     Early Check-in: ₹${result.breakdown.earlyCheckinAmount}`);
        console.log(`     Late Check-out: ₹${result.breakdown.lateCheckoutAmount}`);
        console.log(`     Total: ₹${result.breakdown.totalAmount}`);
      }
      
      if (result.error) {
        console.log(`   Error: ${result.error}`);
      }
      
      console.log();

      if (result.passed) {
        passedTests++;
      }
    } catch (error) {
      console.log(`❌ FAIL ${testCase.name}`);
      console.log(`   Error: ${error.message}`);
      console.log();
    }
  }

  console.log("=".repeat(60));
  console.log(`📊 Test Results: ${passedTests}/${totalTests} tests passed`);
  
  if (passedTests === totalTests) {
    console.log("🎉 All tests passed! Automatic billing is working correctly.");
  } else {
    console.log("⚠️  Some tests failed. Please check the implementation.");
  }

  return { passedTests, totalTests };
}

// Run tests if this file is executed directly
if (require.main === module) {
  runBillingTests()
    .then((results) => {
      process.exit(results.passedTests === results.totalTests ? 0 : 1);
    })
    .catch((error) => {
      console.error("Test execution failed:", error);
      process.exit(1);
    });
}

module.exports = { runBillingTests, testCases };
