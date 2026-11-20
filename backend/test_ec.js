const mongoose = require('mongoose');

async function run() {
  await mongoose.connect('mongodb://127.0.0.1:27017/hotel_management');
  await mongoose.connection.collection('tables').deleteMany({ tableNumber: '99' });
  console.log('Cleaned up table 99');
  process.exit(0);
}

run().catch(console.error);
