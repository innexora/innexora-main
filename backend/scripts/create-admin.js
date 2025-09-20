#!/usr/bin/env node

require("dotenv").config();
const readline = require("readline");
const AdminUserCreator = require("../utils/adminUserCreator");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, (answer) => {
      resolve(answer);
    });
  });
}

function hiddenQuestion(prompt) {
  return new Promise((resolve) => {
    process.stdout.write(prompt);
    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.setEncoding("utf8");

    let password = "";

    process.stdin.on("data", function (char) {
      char = char + "";

      switch (char) {
        case "\n":
        case "\r":
        case "\u0004":
          process.stdin.setRawMode(false);
          process.stdin.pause();
          process.stdout.write("\n");
          resolve(password);
          break;
        case "\u0003":
          process.exit();
          break;
        default:
          password += char;
          process.stdout.write("*");
          break;
      }
    });
  });
}

async function createAdminFlow() {
  const adminCreator = new AdminUserCreator();

  try {
    console.log("🔧 Connecting to database...");
    await adminCreator.connect();

    while (true) {
      console.log("\n=================================");
      console.log("     HOTEL ADMIN USER CREATOR");
      console.log("=================================");
      console.log("\nSelect an option:");
      console.log("1. List available hotels");
      console.log("2. Create admin user for a hotel");
      console.log("3. Check if hotel has admin");
      console.log("4. Exit");

      const choice = await question("\nEnter your choice (1-4): ");

      switch (choice.trim()) {
        case "1":
          await adminCreator.listHotels();
          break;

        case "2":
          await createAdminUser(adminCreator);
          break;

        case "3":
          await checkAdminStatus(adminCreator);
          break;

        case "4":
          console.log("👋 Goodbye!");
          process.exit(0);

        default:
          console.log("❌ Invalid choice. Please select 1-4.");
      }
    }
  } catch (error) {
    console.error("❌ Fatal error:", error.message);
    process.exit(1);
  } finally {
    await adminCreator.disconnect();
    rl.close();
  }
}

async function createAdminUser(adminCreator) {
  try {
    console.log("\n📝 Create Admin User");
    console.log("===================");

    const hotelSubdomain = await question(
      "Enter hotel subdomain (e.g., 'demo_hotel'): "
    );

    if (!hotelSubdomain.trim()) {
      console.log("❌ Hotel subdomain is required");
      return;
    }

    // Check if admin already exists
    const adminStatus = await adminCreator.checkAdminExists(
      hotelSubdomain.trim()
    );

    if (adminStatus.hasAdmin) {
      console.log(
        `❌ Hotel '${adminStatus.hotel.name}' already has an admin user:`
      );
      console.log(`   Name: ${adminStatus.admin.name}`);
      console.log(`   Email: ${adminStatus.admin.email}`);
      console.log(`   Created: ${adminStatus.admin.createdAt}`);
      return;
    }

    console.log(
      `✅ Hotel '${adminStatus.hotel.name}' found and has no admin user`
    );

    const name = await question("Enter admin full name: ");
    const email = await question("Enter admin email: ");
    const password = await hiddenQuestion(
      "Enter admin password (min 8 characters): "
    );
    const confirmPassword = await hiddenQuestion("Confirm password: ");

    if (password !== confirmPassword) {
      console.log("❌ Passwords do not match");
      return;
    }

    if (!name.trim() || !email.trim() || !password.trim()) {
      console.log("❌ All fields are required");
      return;
    }

    const result = await adminCreator.createAdminUser(hotelSubdomain.trim(), {
      name: name.trim(),
      email: email.trim(),
      password: password.trim(),
    });

    console.log(`\n${result.message}`);
    console.log("\n🎉 Admin user can now login at:");
    console.log(`   URL: ${hotelSubdomain.trim()}.localhost:3000/auth/login`);
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
  }
}

async function checkAdminStatus(adminCreator) {
  try {
    console.log("\n🔍 Check Admin Status");
    console.log("=====================");

    const hotelSubdomain = await question("Enter hotel subdomain to check: ");

    if (!hotelSubdomain.trim()) {
      console.log("❌ Hotel subdomain is required");
      return;
    }

    const adminStatus = await adminCreator.checkAdminExists(
      hotelSubdomain.trim()
    );

    console.log(`\n🏨 Hotel: ${adminStatus.hotel.name}`);
    console.log(`📡 Subdomain: ${adminStatus.hotel.subdomain}`);
    console.log(`🔗 URL: ${adminStatus.hotel.subdomain}.localhost:3000`);

    if (adminStatus.hasAdmin) {
      console.log(`✅ Admin exists:`);
      console.log(`   Name: ${adminStatus.admin.name}`);
      console.log(`   Email: ${adminStatus.admin.email}`);
      console.log(`   Created: ${adminStatus.admin.createdAt}`);
    } else {
      console.log("❌ No admin user found for this hotel");
    }
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
  }
}

// Handle Ctrl+C gracefully
process.on("SIGINT", () => {
  console.log("\n\n👋 Goodbye!");
  process.exit(0);
});

// Start the application
createAdminFlow();
