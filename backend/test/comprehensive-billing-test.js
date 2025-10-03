/**
 * Comprehensive Automatic Billing Test
 * Tests all scenarios for the automatic billing calculation system
 */

const AutomaticBillingService = require("../services/automaticBillingService");

// Mock hotel policies (standard hotel setup)
const mockHotelPolicies = {
  subdomain: "test-hotel",
  name: "Test Paradise Hotel",
  standard_checkin_time: 14, // 2 PM
  standard_checkout_time: 11, // 11 AM
  early_checkin_policy: "half_rate",
  late_checkout_policy: "half_rate",
  timezone: "Asia/Kolkata",
  status: "Active",
};

// Mock room
const mockRoom = {
  _id: "room123",
  number: "101",
  type: "deluxe",
  price: 1000, // ₹1000 per night
};

// Helper function to create a date in IST timezone
function createDate(dateStr, timeStr = "14:00") {
  // Create date in IST (Asia/Kolkata) timezone to match hotel timezone
  const isoString = `${dateStr}T${timeStr}:00+05:30`; // IST offset
  return new Date(isoString);
}

// Test scenarios
const testScenarios = [
  {
    name: "Test 1: Standard 2-night stay (checked in, no early/late charges)",
    guest: {
      name: "John Doe",
      status: "checked_in",
      checkInDate: createDate("2025-10-01", "14:00"), // Standard check-in time
      actualCheckInDate: createDate("2025-10-01", "14:00"),
      checkOutDate: createDate("2025-10-03", "11:00"), // Expected checkout (2 nights)
      actualCheckOutDate: null, // Still checked in
    },
    expectedResult: {
      // Since guest is still checked in, it should calculate from actual check-in to NOW
      // For testing, we'll assume current time is Oct 3, 2025 at 10:00 AM (before expected checkout)
      description:
        "Should calculate 2 nights at ₹1000 = ₹2000 (no early/late charges)",
      minNights: 2,
      baseChargeMin: 2000,
    },
  },
  {
    name: "Test 2: Guest stayed beyond expected checkout (still checked in)",
    guest: {
      name: "Jane Smith",
      status: "checked_in",
      checkInDate: createDate("2025-09-28", "14:00"), // Checked in 5 days ago
      actualCheckInDate: createDate("2025-09-28", "14:00"),
      checkOutDate: createDate("2025-09-30", "11:00"), // Expected checkout 3 days ago
      actualCheckOutDate: null, // Still checked in (extended stay!)
    },
    expectedResult: {
      description:
        "Should calculate from Sep 28 to NOW (5+ days), NOT just expected 2 nights",
      minNights: 5, // At least 5 nights
      baseChargeMin: 5000, // At least ₹5000
    },
  },
  {
    name: "Test 3: Early check-in at 8 AM (half-rate policy)",
    guest: {
      name: "Bob Wilson",
      status: "checked_in",
      checkInDate: createDate("2025-10-01", "14:00"),
      actualCheckInDate: createDate("2025-10-01", "08:00"), // Early check-in at 8 AM
      checkOutDate: createDate("2025-10-03", "11:00"),
      actualCheckOutDate: null,
    },
    expectedResult: {
      description: "Should charge ₹500 for early check-in (half of ₹1000)",
      earlyCheckinCharge: 500,
    },
  },
  {
    name: "Test 4: Very early check-in at 3 AM (full night charge)",
    guest: {
      name: "Alice Brown",
      status: "checked_in",
      checkInDate: createDate("2025-10-01", "14:00"),
      actualCheckInDate: createDate("2025-10-01", "03:00"), // Very early at 3 AM
      checkOutDate: createDate("2025-10-03", "11:00"),
      actualCheckOutDate: null,
    },
    expectedResult: {
      description: "Should charge full ₹1000 for check-in before 6 AM",
      earlyCheckinCharge: 1000,
    },
  },
  {
    name: "Test 5: Late checkout at 3 PM (half-rate policy)",
    guest: {
      name: "Charlie Davis",
      status: "checked_out",
      checkInDate: createDate("2025-10-01", "14:00"),
      actualCheckInDate: createDate("2025-10-01", "14:00"),
      checkOutDate: createDate("2025-10-03", "11:00"),
      actualCheckOutDate: createDate("2025-10-03", "15:00"), // Late checkout at 3 PM
    },
    expectedResult: {
      description: "Should charge ₹500 for late checkout (half of ₹1000)",
      lateCheckoutCharge: 500,
    },
  },
  {
    name: "Test 6: Very late checkout at 8 PM (full night charge)",
    guest: {
      name: "Diana Evans",
      status: "checked_out",
      checkInDate: createDate("2025-10-01", "14:00"),
      actualCheckInDate: createDate("2025-10-01", "14:00"),
      checkOutDate: createDate("2025-10-03", "11:00"),
      actualCheckOutDate: createDate("2025-10-03", "20:00"), // Very late at 8 PM
    },
    expectedResult: {
      description: "Should charge full ₹1000 for checkout after 6 PM",
      lateCheckoutCharge: 1000,
    },
  },
  {
    name: "Test 7: Checked-out guest (use actual dates, not current time)",
    guest: {
      name: "Frank Green",
      status: "checked_out",
      checkInDate: createDate("2025-09-28", "14:00"),
      actualCheckInDate: createDate("2025-09-28", "14:00"),
      checkOutDate: createDate("2025-09-30", "11:00"),
      actualCheckOutDate: createDate("2025-09-30", "11:00"), // Actually checked out on time
    },
    expectedResult: {
      description:
        "Should calculate exactly 2 nights (not extend to current time)",
      exactNights: 2,
      baseCharge: 2000,
    },
  },
  {
    name: "Test 8: Early check-in + Late checkout combo",
    guest: {
      name: "Grace Hill",
      status: "checked_out",
      checkInDate: createDate("2025-10-01", "14:00"),
      actualCheckInDate: createDate("2025-10-01", "08:00"), // Early at 8 AM
      checkOutDate: createDate("2025-10-03", "11:00"),
      actualCheckOutDate: createDate("2025-10-03", "16:00"), // Late at 4 PM
    },
    expectedResult: {
      description:
        "Should charge both early check-in (₹500) and late checkout (₹500) plus 3 nights base",
      earlyCheckinCharge: 500,
      lateCheckoutCharge: 500,
      exactNights: 3, // Oct 1 to Oct 3 = 3 nights (with ceiling calculation)
      baseCharge: 3000, // 3 nights × ₹1000
      totalCharge: 4000, // 3000 + 500 + 500
    },
  },
];

// Mock database manager
const mockDatabaseManager = {
  getMainConnection: () => ({
    model: () => ({
      findOne: async ({ subdomain }) => {
        if (subdomain === "test-hotel") {
          return mockHotelPolicies;
        }
        return null;
      },
    }),
  }),
  initMainConnection: async () => {},
};

// Replace the real database manager with mock
const databaseManager = require("../utils/databaseManager");
Object.assign(databaseManager, mockDatabaseManager);

// Color codes for console output
const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  cyan: "\x1b[36m",
};

// Run tests
async function runTests() {
  console.log("\n" + "=".repeat(80));
  console.log(
    colors.cyan +
      colors.bright +
      "COMPREHENSIVE AUTOMATIC BILLING SYSTEM TEST" +
      colors.reset
  );
  console.log("=".repeat(80) + "\n");

  let passedTests = 0;
  let failedTests = 0;
  const results = [];

  for (const scenario of testScenarios) {
    console.log(colors.yellow + "\n📋 " + scenario.name + colors.reset);
    console.log("   " + scenario.expectedResult.description);
    console.log("   Guest: " + scenario.guest.name);
    console.log("   Status: " + scenario.guest.status);

    try {
      // Call the automatic billing service
      const result = await AutomaticBillingService.calculateAutomaticBilling(
        scenario.guest,
        mockRoom,
        "test-hotel"
      );

      console.log("\n   📊 Calculation Results:");
      console.log(
        `   • Check-in: ${result.checkInDate?.toLocaleString() || "N/A"}`
      );
      console.log(
        `   • Check-out: ${result.checkOutDate?.toLocaleString() || "N/A"}`
      );
      console.log(`   • Nights: ${result.nights}`);
      console.log(`   • Base Charge: ₹${result.baseCharges}`);
      console.log(`   • Early Check-in Charge: ₹${result.earlyCheckinCharges}`);
      console.log(`   • Late Checkout Charge: ₹${result.lateCheckoutCharges}`);
      console.log(`   • Total Charge: ₹${result.totalCharges}`);
      console.log(
        `   • Is Ongoing Stay: ${result.isOngoingStay ? "Yes" : "No"}`
      );

      // Validate results
      let passed = true;
      const errors = [];

      if (
        scenario.expectedResult.minNights &&
        result.nights < scenario.expectedResult.minNights
      ) {
        passed = false;
        errors.push(
          `Expected at least ${scenario.expectedResult.minNights} nights, got ${result.nights}`
        );
      }

      if (
        scenario.expectedResult.exactNights &&
        result.nights !== scenario.expectedResult.exactNights
      ) {
        passed = false;
        errors.push(
          `Expected exactly ${scenario.expectedResult.exactNights} nights, got ${result.nights}`
        );
      }

      if (
        scenario.expectedResult.baseChargeMin &&
        result.baseCharges < scenario.expectedResult.baseChargeMin
      ) {
        passed = false;
        errors.push(
          `Expected base charge at least ₹${scenario.expectedResult.baseChargeMin}, got ₹${result.baseCharges}`
        );
      }

      if (
        scenario.expectedResult.baseCharge &&
        result.baseCharges !== scenario.expectedResult.baseCharge
      ) {
        passed = false;
        errors.push(
          `Expected base charge ₹${scenario.expectedResult.baseCharge}, got ₹${result.baseCharges}`
        );
      }

      if (scenario.expectedResult.earlyCheckinCharge !== undefined) {
        if (
          result.earlyCheckinCharges !==
          scenario.expectedResult.earlyCheckinCharge
        ) {
          passed = false;
          errors.push(
            `Expected early check-in charge ₹${scenario.expectedResult.earlyCheckinCharge}, got ₹${result.earlyCheckinCharges}`
          );
        }
      }

      if (scenario.expectedResult.lateCheckoutCharge !== undefined) {
        if (
          result.lateCheckoutCharges !==
          scenario.expectedResult.lateCheckoutCharge
        ) {
          passed = false;
          errors.push(
            `Expected late checkout charge ₹${scenario.expectedResult.lateCheckoutCharge}, got ₹${result.lateCheckoutCharges}`
          );
        }
      }

      if (scenario.expectedResult.totalCharge !== undefined) {
        if (result.totalCharges !== scenario.expectedResult.totalCharge) {
          passed = false;
          errors.push(
            `Expected total charge ₹${scenario.expectedResult.totalCharge}, got ₹${result.totalCharges}`
          );
        }
      }

      if (passed) {
        console.log(colors.green + "\n   ✅ PASSED" + colors.reset);
        passedTests++;
      } else {
        console.log(colors.red + "\n   ❌ FAILED" + colors.reset);
        errors.forEach((error) =>
          console.log(colors.red + "   • " + error + colors.reset)
        );
        failedTests++;
      }

      results.push({
        test: scenario.name,
        passed,
        errors,
        result,
      });
    } catch (error) {
      console.log(
        colors.red + "\n   ❌ ERROR: " + error.message + colors.reset
      );
      failedTests++;
      results.push({
        test: scenario.name,
        passed: false,
        errors: [error.message],
        result: null,
      });
    }
  }

  // Summary
  console.log("\n" + "=".repeat(80));
  console.log(colors.bright + "TEST SUMMARY" + colors.reset);
  console.log("=".repeat(80));
  console.log(
    colors.green +
      `✅ Passed: ${passedTests}/${testScenarios.length}` +
      colors.reset
  );
  console.log(
    colors.red +
      `❌ Failed: ${failedTests}/${testScenarios.length}` +
      colors.reset
  );

  const successRate = ((passedTests / testScenarios.length) * 100).toFixed(1);
  console.log(`\n📊 Success Rate: ${successRate}%`);

  if (passedTests === testScenarios.length) {
    console.log(
      colors.green +
        colors.bright +
        "\n🎉 ALL TESTS PASSED! The automatic billing system is working 100% correctly!" +
        colors.reset
    );
  } else {
    console.log(
      colors.red +
        colors.bright +
        "\n⚠️  Some tests failed. Please review the errors above." +
        colors.reset
    );
  }

  console.log("\n" + "=".repeat(80) + "\n");

  return {
    total: testScenarios.length,
    passed: passedTests,
    failed: failedTests,
    successRate,
    results,
  };
}

// Run the tests
if (require.main === module) {
  runTests()
    .then((summary) => {
      process.exit(summary.failed > 0 ? 1 : 0);
    })
    .catch((error) => {
      console.error(
        colors.red + "Fatal error running tests:",
        error + colors.reset
      );
      process.exit(1);
    });
}

module.exports = { runTests, testScenarios };
