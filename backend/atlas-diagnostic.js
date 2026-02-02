const mongoose = require('mongoose');
require('dotenv').config();

async function testAtlasConnection() {
  console.log('🔧 MongoDB Atlas Connection Diagnostics');
  console.log('==========================================');
  
  const uri = process.env.MONGODB_URI;
  console.log('📍 Connection URI:', uri ? 'Present' : 'Missing');
  
  if (!uri) {
    console.log('❌ MONGODB_URI environment variable is not set');
    return;
  }
  
  // Parse the URI to check its components
  try {
    const url = new URL(uri.replace('mongodb+srv://', 'https://'));
    console.log('👤 Username:', url.username || 'Not found');
    console.log('🔐 Password:', url.password ? 'Present' : 'Not found');
    console.log('🖥️  Host:', url.hostname || 'Not found');
    console.log('💾 Database:', uri.split('/').pop()?.split('?')[0] || 'Not specified');
  } catch (parseError) {
    console.log('❌ Invalid URI format:', parseError.message);
    return;
  }

  console.log('\n🔄 Testing connection with different timeouts...');

  // Test 1: Quick connection (2 seconds)
  try {
    console.log('⏱️  Test 1: Quick connection (2s timeout)');
    const conn1 = await Promise.race([
      mongoose.connect(uri, {
        serverSelectionTimeoutMS: 2000,
        connectTimeoutMS: 2000,
        socketTimeoutMS: 2000
      }),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('2s timeout')), 2000)
      )
    ]);
    console.log('✅ Quick connection successful!');
    await mongoose.disconnect();
    return;
  } catch (error) {
    console.log('❌ Quick connection failed:', error.message);
  }

  // Test 2: Medium connection (10 seconds)
  try {
    console.log('\n⏱️  Test 2: Medium connection (10s timeout)');
    const conn2 = await Promise.race([
      mongoose.connect(uri, {
        serverSelectionTimeoutMS: 10000,
        connectTimeoutMS: 10000,
        socketTimeoutMS: 10000
      }),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('10s timeout')), 10000)
      )
    ]);
    console.log('✅ Medium connection successful!');
    await mongoose.disconnect();
    return;
  } catch (error) {
    console.log('❌ Medium connection failed:', error.message);
  }

  console.log('\n🚨 Atlas Connection Issues Detected');
  console.log('====================================');
  console.log('Possible causes:');
  console.log('1. 🌐 IP Address not whitelisted in Atlas');
  console.log('2. 🔐 Incorrect username/password');
  console.log('3. 📡 Network/VPN blocking connection');
  console.log('4. 🏢 Corporate firewall blocking MongoDB ports');
  console.log('5. 📍 Cluster is in different region');
  
  console.log('\n💡 Solutions:');
  console.log('1. Add your IP to Atlas IP whitelist (0.0.0.0/0 for development)');
  console.log('2. Verify username/password in Atlas dashboard');
  console.log('3. Try from different network');
  console.log('4. Check if port 27017 is blocked');
  
  console.log('\n🎯 Using local MongoDB as fallback for now');
}

// Run the diagnostic
testAtlasConnection()
  .then(() => {
    console.log('\n✅ Diagnostic complete');
    process.exit(0);
  })
  .catch((error) => {
    console.log('\n❌ Diagnostic failed:', error.message);
    process.exit(1);
  });