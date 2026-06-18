const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const User = require('./models/User');
const FoodListing = require('./models/FoodListing');

const seed = async () => {
  await mongoose.connect(process.env.MONGO_URI);

  let donor = await User.findOne({ role: 'donor', phone: '03111111111' });
  if (!donor) {
    donor = new User({
      name: 'Sample Donor',
      phone: '03111111111',
      password: 'donor123',
      role: 'donor',
      address: 'Mingora, Swat'
    });
    await donor.save();
    console.log('Created donor account:', donor.phone);
  } else {
    console.log('Found existing donor account:', donor.phone || donor.name);
  }

  let secondDonor = await User.findOne({ role: 'donor', phone: '03322222222' });
  if (!secondDonor) {
    secondDonor = new User({
      name: 'Second Donor',
      phone: '03322222222',
      password: 'donor456',
      role: 'donor',
      address: 'Saidu Sharif, Swat'
    });
    await secondDonor.save();
    console.log('Created second donor account:', secondDonor.phone);
  } else {
    console.log('Found existing second donor account:', secondDonor.phone || secondDonor.name);
  }

  let admin = await User.findOne({ role: 'admin' });
  if (!admin) {
    admin = new User({
      name: 'FoodSave Admin',
      phone: '03349488999',
      password: '112233', 
      role: 'admin',
      address: 'Mingora, Swat'
    });
    await admin.save();
    console.log('Created admin account:', admin.phone);
  } else {
    console.log('Found existing admin account:', admin.phone || admin.name);
  }

  let user = await User.findOne({ phone: '03000000000' });
  if (!user) {
    user = new User({
      name: 'Sample Recipient',
      phone: '03000000000',
      password: 'secret123',
      role: 'user',
      address: 'Mingora, Swat'
    });
    await user.save();
    console.log('Created user account:', user.phone);
  } else {
    console.log('Found existing user account:', user.phone || user.name);
  }

  const samples = [
    {
      foodName: 'Vegetable Curry Pack',
      category: 'cooked',
      quantity: 10,
      unit: 'plates',
      expiryDate: new Date(Date.now() + 24 * 3600000),
      pickupAddress: 'Main Bazaar, Mingora',
      description: 'Fresh cooked vegetable curry, ready to eat.',
      donor: donor._id,
      status: 'available'
    },
    {
      foodName: 'Fruit Snack Boxes',
      category: 'packaged',
      quantity: 20,
      unit: 'boxes',
      expiryDate: new Date(Date.now() + 30 * 3600000),
      pickupAddress: 'Saidu Sharif Market',
      description: 'Sealed fruit snack boxes for quick pickup.',
      donor: donor._id,
      status: 'available'
    },
    {
      foodName: 'Fresh Bread Loaves',
      category: 'bakery',
      quantity: 15,
      unit: 'loaves',
      expiryDate: new Date(Date.now() + 18 * 3600000),
      pickupAddress: 'Khwaza Khela Bakery',
      description: 'Freshly baked whole wheat loaves.',
      donor: donor._id,
      status: 'available'
    },
    {
      foodName: 'Fresh Yogurt Cups',
      category: 'dairy',
      quantity: 12,
      unit: 'cups',
      expiryDate: new Date(Date.now() + 22 * 3600000),
      pickupAddress: 'Gilgit Dairy',
      description: 'Chilled yogurt cups, perfect for quick distribution.',
      donor: donor._id,
      status: 'available'
    },
    {
      foodName: 'Mixed Salad Packs',
      category: 'raw',
      quantity: 18,
      unit: 'packs',
      expiryDate: new Date(Date.now() + 20 * 3600000),
      pickupAddress: 'Saidu Sharif Central',
      description: 'Fresh salad packs with seasonal vegetables.',
      donor: secondDonor._id,
      status: 'available'
    },
    {
      foodName: 'Paneer Portion Boxes',
      category: 'dairy',
      quantity: 8,
      unit: 'boxes',
      expiryDate: new Date(Date.now() + 28 * 3600000),
      pickupAddress: 'Swat Dairy Supplies',
      description: 'Fresh paneer cut into ready-to-use portions.',
      donor: secondDonor._id,
      status: 'available'
    }
  ];

  for (const item of samples) {
    const exists = await FoodListing.findOne({
      foodName: item.foodName,
      donor: item.donor,
      pickupAddress: item.pickupAddress,
      status: 'available'
    });
    if (exists) {
      console.log('Already exists:', item.foodName);
      continue;
    }
    const listing = await FoodListing.create(item);
    console.log('Created listing:', listing.foodName);
  }

  const available = await FoodListing.find({ status: 'available', expiryDate: { $gt: new Date() } }).populate('donor', 'name');
  console.log('Available food listings:', available.map((f) => ({ foodName: f.foodName, donor: f.donor?.name, pickupAddress: f.pickupAddress, expiryDate: f.expiryDate })));

  await mongoose.disconnect();
  console.log('Seed complete. Login as user 03000000000 / secret123');
};

seed().catch((error) => {
  console.error(error);
  process.exit(1);
});
