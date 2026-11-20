require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/database');
const Restaurant = require('../models/Restaurant');
const User = require('../models/User');
const Category = require('../models/Category');
const MenuItem = require('../models/MenuItem');
const Table = require('../models/Table');
const { generateQRCode } = require('./generateQR');

const seed = async () => {
  await connectDB();
  console.log('Seeding database for Smart Restaurant & Hotel SaaS...');

  // 1. Create or find Default Restaurant
  let restaurant = await Restaurant.findOne({ email: 'admin@spicegardenrestaurant.com' });
  if (!restaurant) {
    restaurant = await Restaurant.create({
      name: 'Spice Garden Restaurant & Hotel',
      slug: 'spice-garden-restaurant',
      email: 'admin@spicegardenrestaurant.com',
      phone: '+91 98765 43210',
      address: '42, Brigade Road, Ashok Nagar',
      city: 'Bengaluru',
      state: 'Karnataka',
      pincode: '560025',
      gstNumber: '29ABCDE1234F1Z5',
      gstPercentage: 5,
      serviceCharge: 2,
      currency: 'INR',
      currencySymbol: '₹',
      openingTime: '10:00',
      closingTime: '23:30',
      settings: {
        allowCashPayment: true,
        allowOnlinePayment: true,
        requireOrderApproval: true,
        tableSessionTimeout: 180,
      },
    });
    console.log('Created Restaurant:', restaurant.name);
  }

  // 2. Create Admin user
  let admin = await User.findOne({ restaurant: restaurant._id, email: 'admin@spicegardenrestaurant.com' });
  if (!admin) {
    admin = await User.create({
      restaurant: restaurant._id,
      name: 'Rajesh Sharma (Admin)',
      email: 'admin@spicegardenrestaurant.com',
      password: 'Admin@123',
      role: 'admin',
      phone: '+91 98765 43210',
      permissions: {
        manageMenu: true,
        manageTables: true,
        manageOrders: true,
        viewReports: true,
        manageStaff: true,
        managePayments: true,
      },
    });
    console.log('Created Admin user:', admin.email, 'password: Admin@123');
  }

  // 3. Create Waiter user
  let waiter = await User.findOne({ restaurant: restaurant._id, email: 'waiter@spicegardenrestaurant.com' });
  if (!waiter) {
    waiter = await User.create({
      restaurant: restaurant._id,
      name: 'Suresh Kumar (Waiter)',
      email: 'waiter@spicegardenrestaurant.com',
      password: 'Waiter@123',
      role: 'waiter',
      phone: '+91 98765 43211',
      permissions: {
        manageMenu: false,
        manageTables: false,
        manageOrders: true,
        viewReports: false,
        manageStaff: false,
        managePayments: true,
      },
    });
    console.log('Created Waiter user: waiter@spicegardenrestaurant.com / Waiter@123');
  }

  // 4. Create Categories
  const categoryData = [
    { name: 'Starters', description: 'Crispy, flavorful appetizers to kickstart your meal', sortOrder: 1 },
    { name: 'Main Course', description: 'Rich gravies, aromatic curries, and comforting entrees', sortOrder: 2 },
    { name: 'Chinese', description: 'Indo-Chinese classics, wok-tossed noodles and manchurian', sortOrder: 3 },
    { name: 'Punjabi', description: 'Authentic clay oven tandoori breads and rustic rich curries', sortOrder: 4 },
    { name: 'South Indian', description: 'Golden dosas, fluffy idlis, and traditional chutneys', sortOrder: 5 },
    { name: 'Fast Food', description: 'Gourmet burgers, loaded fries, and quick bites', sortOrder: 6 },
    { name: 'Beverages', description: 'Chilled shakes, traditional lassis, and hot brews', sortOrder: 7 },
    { name: 'Desserts', description: 'Decadent sweet endings to conclude your dining experience', sortOrder: 8 },
  ];

  const categories = {};
  for (const cat of categoryData) {
    let c = await Category.findOne({ restaurant: restaurant._id, name: cat.name });
    if (!c) {
      c = await Category.create({ restaurant: restaurant._id, ...cat });
    }
    categories[cat.name] = c._id;
  }
  console.log('Created Categories:', Object.keys(categories).length);

  // 5. Create Menu Items with curated high quality food photography
  const menuItems = [
    // Starters
    {
      name: 'Paneer Tikka Royale',
      description: 'Marinated cottage cheese cubes skewered with bell peppers and roasted in clay tandoor with mint relish.',
      price: 290,
      category: categories['Starters'],
      foodType: 'veg',
      preparationTime: 18,
      isSpecial: true,
      image: 'https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?auto=format&fit=crop&w=600&q=80',
    },
    {
      name: 'Crispy Chicken 65',
      description: 'Fiery and deep-fried tender chicken chunks infused with curry leaves, crushed pepper, and mustard.',
      price: 340,
      category: categories['Starters'],
      foodType: 'non-veg',
      preparationTime: 20,
      isSpecial: true,
      image: 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?auto=format&fit=crop&w=600&q=80',
    },
    {
      name: 'Golden Veg Spring Rolls',
      description: 'Crisp wanton rolls loaded with wok-tossed shredded cabbage, carrots, and sweet chili dip.',
      price: 190,
      category: categories['Starters'],
      foodType: 'veg',
      preparationTime: 15,
      isSpecial: false,
      image: 'https://images.unsplash.com/photo-1548869206-93b036288d7e?auto=format&fit=crop&w=600&q=80',
    },
    {
      name: 'Tawa Fish Fry',
      description: 'Fresh boneless fish fillet coated in coastal Mangalorean red chili masala and griddled with curry leaves.',
      price: 420,
      category: categories['Starters'],
      foodType: 'non-veg',
      preparationTime: 22,
      isSpecial: false,
      image: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&w=600&q=80',
    },

    // Main Course
    {
      name: 'Old Delhi Butter Chicken',
      description: 'Charcoal-grilled chicken simmered in a velvety, buttery tomato gravy scented with fenugreek.',
      price: 395,
      category: categories['Main Course'],
      foodType: 'non-veg',
      preparationTime: 25,
      isSpecial: true,
      image: 'https://images.unsplash.com/photo-1588166524941-3bf61a9c41db?auto=format&fit=crop&w=600&q=80',
    },
    {
      name: 'Dal Makhani Dhabe Wali',
      description: 'Whole black lentils slow-cooked overnight with churned white butter and rich cream.',
      price: 275,
      category: categories['Main Course'],
      foodType: 'veg',
      preparationTime: 20,
      isSpecial: true,
      image: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=600&q=80',
    },
    {
      name: 'Shahi Paneer Lababdar',
      description: 'Succulent malai paneer cooked in a rich onion-cashew-tomato gravy with melted cheese.',
      price: 330,
      category: categories['Main Course'],
      foodType: 'veg',
      preparationTime: 20,
      isSpecial: false,
      image: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?auto=format&fit=crop&w=600&q=80',
    },
    {
      name: 'Kashmiri Mutton Rogan Josh',
      description: 'Slow-braised tender goat meat cooked with ratanjot, Kashmiri dry chilies, and aromatic spices.',
      price: 495,
      category: categories['Main Course'],
      foodType: 'non-veg',
      preparationTime: 35,
      isSpecial: true,
      image: 'https://images.unsplash.com/photo-1574894709920-11b28e7367e3?auto=format&fit=crop&w=600&q=80',
    },

    // Punjabi Breads & Curries
    {
      name: 'Amritsari Butter Naan',
      description: 'Traditional refined flour leavened flatbread freshly baked in tandoor and brushed generously with butter.',
      price: 65,
      category: categories['Punjabi'],
      foodType: 'veg',
      preparationTime: 10,
      isSpecial: false,
      image: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=600&q=80',
    },
    {
      name: 'Garlic Coriander Naan',
      description: 'Tandoori naan crusted with roasted crushed garlic and fresh coriander leaves.',
      price: 75,
      category: categories['Punjabi'],
      foodType: 'veg',
      preparationTime: 10,
      isSpecial: false,
      image: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=600&q=80',
    },
    {
      name: 'Pindi Chhole Masala',
      description: 'Spiced and tangy garbanzo chickpeas simmered in authentic Amritsari dark tea-spice brew.',
      price: 240,
      category: categories['Punjabi'],
      foodType: 'veg',
      preparationTime: 18,
      isSpecial: false,
      image: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?auto=format&fit=crop&w=600&q=80',
    },

    // Chinese
    {
      name: 'Schezwan Fried Rice',
      description: 'Fluffy long-grain rice tossed in spicy homemade Schezwan sauce, scallions, and crisp veggies.',
      price: 240,
      category: categories['Chinese'],
      foodType: 'veg',
      preparationTime: 15,
      isSpecial: false,
      image: 'https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&w=600&q=80',
    },
    {
      name: 'Veg Hakka Noodles',
      description: 'Wok-tossed noodles with bell peppers, shredded cabbage, carrots, soy sauce, and sesame oil.',
      price: 220,
      category: categories['Chinese'],
      foodType: 'veg',
      preparationTime: 15,
      isSpecial: false,
      image: 'https://images.unsplash.com/photo-1555126634-323283e090fa?auto=format&fit=crop&w=600&q=80',
    },
    {
      name: 'Chili Chicken Gravy',
      description: 'Wok-seared crispy chicken bites smothered in garlic, dark soy, and fiery green chili gravy.',
      price: 330,
      category: categories['Chinese'],
      foodType: 'non-veg',
      preparationTime: 20,
      isSpecial: true,
      image: 'https://images.unsplash.com/photo-1569058242253-92a9c755a0ec?auto=format&fit=crop&w=600&q=80',
    },

    // South Indian
    {
      name: 'Ghee Podi Masala Dosa',
      description: 'Paper-thin golden crepe roasted with pure desi ghee, gun powder podi, and spiced potato filling.',
      price: 180,
      category: categories['South Indian'],
      foodType: 'veg',
      preparationTime: 12,
      isSpecial: true,
      image: 'https://images.unsplash.com/photo-1668236543090-82eba5ee5976?auto=format&fit=crop&w=600&q=80',
    },
    {
      name: 'Steamed Idli Sambar Platter',
      description: '3 pillowy soft steamed rice cakes served with authentic drumstick sambar and trio of coconut chutneys.',
      price: 130,
      category: categories['South Indian'],
      foodType: 'veg',
      preparationTime: 10,
      isSpecial: false,
      image: 'https://images.unsplash.com/photo-1630383249896-424e482df921?auto=format&fit=crop&w=600&q=80',
    },
    {
      name: 'Medu Vada Combo',
      description: 'Crispy lentil doughnuts with crunchy exterior and fluffy interior, served piping hot.',
      price: 140,
      category: categories['South Indian'],
      foodType: 'veg',
      preparationTime: 12,
      isSpecial: false,
      image: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=600&q=80',
    },

    // Fast Food
    {
      name: 'Crunchy Veg Supreme Burger',
      description: 'Spiced herb potato patty with cheddar slice, tomato, iceberg lettuce, and chipotle mayo.',
      price: 195,
      category: categories['Fast Food'],
      foodType: 'veg',
      preparationTime: 15,
      isSpecial: false,
      image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=600&q=80',
    },
    {
      name: 'Smoked Crispy Chicken Burger',
      description: 'Buttermilk fried chicken breast fillet with melted cheese, gherkins, and spicy peri-peri sauce.',
      price: 265,
      category: categories['Fast Food'],
      foodType: 'non-veg',
      preparationTime: 18,
      isSpecial: true,
      image: 'https://images.unsplash.com/photo-1565299507177-b0ac66763828?auto=format&fit=crop&w=600&q=80',
    },
    {
      name: 'Peri-Peri Crinkle Fries',
      description: 'Golden fried crispy potato wedges tossed in zesty African peri-peri seasoning and garlic dip.',
      price: 140,
      category: categories['Fast Food'],
      foodType: 'veg',
      preparationTime: 10,
      isSpecial: false,
      image: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?auto=format&fit=crop&w=600&q=80',
    },

    // Beverages
    {
      name: 'Kesar Mango Lassi',
      description: 'Thick, creamy yogurt churned with sweet Alphonso mango pulp and saffron strands.',
      price: 135,
      category: categories['Beverages'],
      foodType: 'veg',
      preparationTime: 5,
      isSpecial: true,
      image: 'https://images.unsplash.com/photo-1553361371-9b22f78e8b1d?auto=format&fit=crop&w=600&q=80',
    },
    {
      name: 'Hazelnut Cold Frappe',
      description: 'Espresso blended with chilled milk, roasted hazelnut syrup, and a scoop of vanilla ice cream.',
      price: 165,
      category: categories['Beverages'],
      foodType: 'veg',
      preparationTime: 5,
      isSpecial: false,
      image: 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?auto=format&fit=crop&w=600&q=80',
    },
    {
      name: 'Mint Mojito Mocktail',
      description: 'Muddled fresh garden mint, lime slices, cane sugar syrup, and fizzy soda over crushed ice.',
      price: 125,
      category: categories['Beverages'],
      foodType: 'veg',
      preparationTime: 5,
      isSpecial: false,
      image: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=600&q=80',
    },

    // Desserts
    {
      name: 'Hot Gulab Jamun with Rabdi',
      description: 'Soft melt-in-mouth milk dumplings served warm with reduced thickened cardamom rabdi.',
      price: 130,
      category: categories['Desserts'],
      foodType: 'veg',
      preparationTime: 5,
      isSpecial: true,
      image: 'https://images.unsplash.com/photo-1601303516534-bf5d02f72c72?auto=format&fit=crop&w=600&q=80',
    },
    {
      name: 'Sizzling Brownie Sundae',
      description: 'Warm fudge brownie served on a cast-iron sizzler plate with vanilla bean gelato and dark chocolate ganache.',
      price: 195,
      category: categories['Desserts'],
      foodType: 'veg',
      preparationTime: 8,
      isSpecial: true,
      image: 'https://images.unsplash.com/photo-1564355808539-22fda35bed7e?auto=format&fit=crop&w=600&q=80',
    },
  ];

  for (const item of menuItems) {
    const exists = await MenuItem.findOne({ restaurant: restaurant._id, name: item.name });
    if (!exists) {
      await MenuItem.create({ restaurant: restaurant._id, ...item });
    }
  }
  console.log('Seeded menu items:', menuItems.length);

  // 6. Create 8 Tables with QR codes
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  for (let i = 1; i <= 8; i++) {
    const tableNum = String(i).padStart(2, '0');
    let table = await Table.findOne({ restaurant: restaurant._id, tableNumber: tableNum });
    if (!table) {
      table = await Table.create({
        restaurant: restaurant._id,
        tableNumber: tableNum,
        displayName: `Table ${tableNum}`,
        capacity: i <= 4 ? 4 : (i <= 6 ? 6 : 8),
        floor: i <= 4 ? 'Ground Floor' : 'First Floor',
        section: i <= 4 ? 'Main Dining' : 'Balcony Garden',
      });
    }
    const qrTargetUrl = `${frontendUrl}/menu?table=${table.qrToken}`;
    const qrDataUrl = await generateQRCode(qrTargetUrl);
    table.qrCodeUrl = qrDataUrl;
    await table.save();
  }
  console.log('Seeded 8 tables with QR codes');

  console.log('\n======================================================');
  console.log('🎉 DATABASE SEEDING COMPLETED SUCCESSFULLY!');
  console.log('Restaurant : Spice Garden Restaurant & Hotel');
  console.log('Admin Email: admin@spicegardenrestaurant.com');
  console.log('Admin Pass : Admin@123');
  console.log('Waiter Email: waiter@spicegardenrestaurant.com');
  console.log('Waiter Pass : Waiter@123');
  console.log('======================================================\n');

  process.exit(0);
};

seed().catch((err) => {
  console.error('Seed Error:', err);
  process.exit(1);
});
