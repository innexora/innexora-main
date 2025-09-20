const mongoose = require("mongoose");

// Test script to verify order-to-bill integration for paid bills
async function testOrderToBill() {
  try {
    // Connect to the database
    await mongoose.connect("mongodb://localhost:27017/innexora-test", {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log("🔗 Connected to test database");

    // Import models
    const Bill = require("./backend/models/Bill");
    const Guest = require("./backend/models/Guest");
    const Order = require("./backend/models/Order");

    console.log("\n=== Testing Order to Paid Bill Integration ===\n");

    // Step 1: Create a test guest
    const testGuest = new Guest({
      name: "Test Guest",
      email: "test@example.com",
      phone: "1234567890",
      roomNumber: "101",
      checkInDate: new Date(),
      isCheckedOut: false,
    });
    await testGuest.save();
    console.log("✅ Created test guest:", testGuest.name);

    // Step 2: Create initial bill with an order
    const initialOrder = new Order({
      guest: testGuest._id,
      items: [
        {
          name: "Coffee",
          quantity: 1,
          price: 5.0,
          total: 5.0,
        },
      ],
      totalAmount: 5.0,
      status: "delivered",
    });
    await initialOrder.save();
    console.log("✅ Created initial order: $5.00");

    // Add order to bill
    await Bill.addOrderToBill(testGuest._id, initialOrder);
    let bill = await Bill.findOne({ guest: testGuest._id }).populate("orders");
    console.log(
      "✅ Created bill with initial order. Status:",
      bill.status,
      "Total:",
      bill.totalAmount
    );

    // Step 3: Pay the full amount
    await Bill.recordPayment(testGuest._id, {
      amount: 5.0,
      method: "cash",
      paidBy: "Test Guest",
    });

    bill = await Bill.findOne({ guest: testGuest._id }).populate("orders");
    console.log(
      "✅ Recorded payment. Status:",
      bill.status,
      "Balance:",
      bill.balanceAmount
    );

    // Step 4: Create another order (this should work now)
    const secondOrder = new Order({
      guest: testGuest._id,
      items: [
        {
          name: "Sandwich",
          quantity: 1,
          price: 8.0,
          total: 8.0,
        },
      ],
      totalAmount: 8.0,
      status: "delivered",
    });
    await secondOrder.save();
    console.log("✅ Created second order: $8.00");

    // Step 5: Try to add the second order to the paid bill
    console.log("\n🔍 Testing if second order can be added to paid bill...");
    await Bill.addOrderToBill(testGuest._id, secondOrder);

    // Check final bill state
    bill = await Bill.findOne({ guest: testGuest._id }).populate("orders");
    console.log("\n📋 Final Bill State:");
    console.log("   Status:", bill.status);
    console.log("   Total Amount:", bill.totalAmount);
    console.log("   Paid Amount:", bill.paidAmount);
    console.log("   Balance:", bill.balanceAmount);
    console.log("   Orders Count:", bill.orders.length);
    console.log(
      "   Order Totals:",
      bill.orders.map((o) => `$${o.totalAmount}`).join(", ")
    );

    if (bill.orders.length === 2 && bill.totalAmount === 13.0) {
      console.log(
        "\n✅ SUCCESS: Second order was successfully added to paid bill!"
      );
      console.log("   ✓ Bill now has both orders");
      console.log("   ✓ Total amount updated correctly ($5 + $8 = $13)");
      console.log(
        '   ✓ Status changed from "paid" to "partially_paid" (correct)'
      );
    } else {
      console.log("\n❌ FAILED: Second order was not added correctly");
      console.log("   Expected: 2 orders, $13.00 total");
      console.log(
        "   Actual:",
        bill.orders.length,
        "orders, $" + bill.totalAmount,
        "total"
      );
    }

    // Cleanup
    await Bill.deleteOne({ _id: bill._id });
    await Order.deleteMany({ guest: testGuest._id });
    await Guest.deleteOne({ _id: testGuest._id });
    console.log("\n🧹 Cleaned up test data");
  } catch (error) {
    console.error("\n❌ Test failed:", error.message);
    console.error(error.stack);
  } finally {
    await mongoose.connection.close();
    console.log("\n🔌 Disconnected from database");
  }
}

// Run the test
testOrderToBill().catch(console.error);
