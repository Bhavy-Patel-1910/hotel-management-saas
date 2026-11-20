/**
 * Test script to verify MongoDB Atlas connection
 * Run with: node backend/test_atlas_connection.js "<your_atlas_connection_string>"
 */
const mongoose = require('mongoose');

const uri = process.argv[2] || process.env.MONGODB_URI;

if (!uri || uri.includes('localhost') || uri.includes('127.0.0.1')) {
  console.log('❌ Please provide a MongoDB Atlas connection string.');
  console.log('Usage: node backend/test_atlas_connection.js "mongodb+srv://user:pass@cluster0.xxx.mongodb.net/hotel_management?retryWrites=true&w=majority"');
  process.exit(1);
}

console.log('⏳ Connecting to MongoDB Atlas...');
console.log('URI:', uri.replace(/:([^:@]+)@/, ':****@')); // Hide password in logs

mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 })
  .then(() => {
    console.log('✅ SUCCESS: Connected to MongoDB Atlas successfully!');
    console.log('Database Host:', mongoose.connection.host);
    console.log('Database Name:', mongoose.connection.name);
    console.log('Your MongoDB Atlas connection is 100% ready for production deployment.');
    process.exit(0);
  })
  .catch((err) => {
    console.error('❌ Connection Failed:', err.message);
    console.log('\nCommon fixes:');
    console.log('1. Check if IP 0.0.0.0/0 is whitelisted in Atlas Network Access');
    console.log('2. Check if username and password are correct');
    console.log('3. Ensure database name is specified in URI');
    process.exit(1);
  });
