const mongoose = require('mongoose');
const databaseManager = require('./utils/databaseManager');
require('dotenv').config();

const testNewArchitecture = async () => {
  try {
    console.log('🧪 Testing new multi-tenant architecture...');
    
    // Test environment variables
    console.log('\n📋 Environment Variables Check:');
    console.log(`✅ MONGODB_URI: ${process.env.MONGODB_URI ? 'Set' : 'Missing'}`);
    console.log(`✅ MONGODB_TENANT_URI: ${process.env.MONGODB_TENANT_URI ? 'Set' : 'Missing'}`);
    
    if (!process.env.MONGODB_URI || !process.env.MONGODB_TENANT_URI) {
      console.error('❌ Required environment variables are missing');
      process.exit(1);
    }
    
    // Test main database connection
    console.log('\n🔌 Testing main database connection...');
    await databaseManager.initMainConnection();
    console.log('✅ Main database connected successfully');
    
    // Test tenant database connection (without database_url parameter)
    console.log('\n🏨 Testing tenant database connection...');
    const testSubdomain = 'test-hotel';
    const tenantConnection = await databaseManager.getTenantConnection(testSubdomain);
    console.log(`✅ Tenant database connected for ${testSubdomain}`);
    console.log(`📊 Database name: ${tenantConnection.name}`);
    
    // Test tenant models creation
    console.log('\n🧩 Testing tenant models creation...');
    const tenantModels = databaseManager.getTenantModels(tenantConnection);
    console.log(`✅ Created ${Object.keys(tenantModels).length} tenant models`);
    console.log(`📝 Available models: ${Object.keys(tenantModels).join(', ')}`);
    
    // Test connection stats
    console.log('\n📈 Connection Statistics:');
    const stats = databaseManager.getConnectionStats();
    console.log(JSON.stringify(stats, null, 2));
    
    // Cleanup
    await databaseManager.closeAllConnections();
    console.log('\n✅ Test completed successfully!');
    console.log('\n🎉 New architecture is working correctly:');
    console.log('   - Main database for hotel registry');
    console.log('   - Shared tenant cluster for all hotel databases');
    console.log('   - Each hotel gets database: hotel_{subdomain}');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
};

testNewArchitecture();