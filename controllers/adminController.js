const User = require('../models/User');
const FoodListing = require('../models/FoodListing');
const PickupRequest = require('../models/PickupRequest');
const bcrypt = require('bcryptjs'); 

// 1. Create a Donor or NGO directly by Admin
const createUserByAdmin = async (req, res) => {
  try {
    const { name, phone, password, role, status } = req.body;

    const existingUser = await User.findOne({ phone });
    if (existingUser) {
      return res.status(400).json({ message: 'User with this phone number already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      name,
      phone,
      password: hashedPassword,
      role,
      status: status || 'Active'
    });

    await newUser.save();
    res.status(201).json({ message: 'User created successfully', user: { name, phone, role, status } });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 2. Change User Status (Active, Suspend, Reject)
const updateUserStatus = async (req, res) => {
  try {
    const { status } = req.body;
    
    if (!['Active', 'Suspend', 'Reject'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status type' });
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    ).select('-password');

    if (!updatedUser) return res.status(404).json({ message: 'User not found' });

    res.json({ message: `User status changed to ${status}`, user: updatedUser });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 3. Get all users
const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }  
};

// 4. Delete user
const deleteUser = async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: 'User deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 5. Assign driver to a pickup request
const assignDriver = async (req, res) => {
  try {
    const request = await PickupRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ message: 'Request not found' });
    request.driver = req.body.driverId;
    await request.save();
    res.json(request);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 6. Get dashboard stats
const getStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalListings = await FoodListing.countDocuments();
    const totalRequests = await PickupRequest.countDocuments();
    const delivered = await PickupRequest.countDocuments({ status: 'delivered' });
    const available = await FoodListing.countDocuments({ status: 'available' });
    res.json({ totalUsers, totalListings, totalRequests, delivered, available });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// SINGLE EXPORT BLOCK AT THE VERY BOTTOM
module.exports = { 
  getAllUsers, 
  deleteUser, 
  assignDriver, 
  getStats, 
  createUserByAdmin, 
  updateUserStatus 
};